import { defineStore } from 'pinia';
import { ref } from 'vue';
import { validateConfig } from '../utils/configValidator';
import parseJSON from 'json-parse-even-better-errors';
import {
  createConnection,
  createLongLivedTokenAuth,
  subscribeEntities,
  ERR_CANNOT_CONNECT,
  ERR_INVALID_AUTH,
} from 'home-assistant-js-websocket';

export const useHaStore = defineStore('haStore', () => {
  const sensors = ref([]);
  const devices = ref([]);
  const areas = ref([]);
  const isLoading = ref(true);
  const isInitialized = ref(false);
  // Store credentials separately - don't initialize from env vars
  const haUrl = ref('');
  const accessToken = ref('');
  // Track whether credentials came from config file (true) or manual entry (false)
  const credentialsFromConfig = ref(false);
  // Local testing mode - load data from file instead of API
  const isLocalMode = ref(import.meta.env.VITE_LOCAL_MODE === 'true');
  // Enable save button for exporting data (separate from local mode)
  // Developer mode enables the save button and any other dev features
  const developerMode = ref(import.meta.env.VITE_DEVELOPER_MODE === 'true');

  // Dashboard configuration
  const dashboardConfig = ref(null);
  const configValidationError = ref(null);
  const configErrorCount = ref(0);
  const needsCredentials = ref(false);

  if (import.meta.env.DEV) {
    console.log('Environment check:', {
      VITE_LOCAL_MODE: import.meta.env.VITE_LOCAL_MODE,
      isLocalMode: isLocalMode.value,
      VITE_DEVELOPER_MODE: import.meta.env.VITE_DEVELOPER_MODE,
    });
  }

  if (isLocalMode.value) {
    console.log('Running in local mode - data will be loaded from file');
  }

  // Library connection and state
  let connection = null;
  let unsubscribeEntitiesFn = null;
  const isConnected = ref(false);
  const lastError = ref(null);

  const setError = (error) => {
    lastError.value = error;
    console.error('HA Store Error:', error);
  };

  const clearError = () => {
    lastError.value = null;
  };

  /**
   * Fetch with timeout support
   * @param {string} url - URL to fetch
   * @param {object} options - Fetch options
   * @param {number} timeout - Timeout in milliseconds (default 30000)
   * @returns {Promise<Response>}
   */
  const fetchWithTimeout = async (url, options = {}, timeout = 30000) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeout}ms`);
      }
      throw error;
    }
  };

  const fetchStates = async () => {
    if (isLocalMode.value) return;
    if (!connection) {
      console.warn('fetchStates: Connection not established');
      return;
    }
    try {
      console.log('Subscribing to entity states via library');
      // subscribeEntities will set up real-time updates
      // We wrap it in a promise to wait for the first update
      return new Promise((resolve, reject) => {
        try {
          let firstUpdate = true;
          unsubscribeEntitiesFn = subscribeEntities(connection, (entities) => {
            // Convert library entity format to our format
            const statesList = Object.values(entities).map(entity => ({
              entity_id: entity.entity_id,
              state: entity.state,
              attributes: entity.attributes || {},
            }));
            
            // Update array in-place to preserve Vue reactivity
            // Create a map for quick lookup
            const newMap = new Map(statesList.map(s => [s.entity_id, s]));
            const oldMap = new Map(sensors.value.map(s => [s.entity_id, s]));
            
            // Remove entities that no longer exist (but preserve virtual area entities which start with 'area.')
            let i = sensors.value.length;
            while (i--) {
              const entityId = sensors.value[i].entity_id;
              const isVirtualAreaEntity = entityId.startsWith('area.');
              if (!newMap.has(entityId) && !isVirtualAreaEntity) {
                sensors.value.splice(i, 1);
              }
            }
            
            // Update or add entities
            for (const newEntity of statesList) {
              const oldEntity = oldMap.get(newEntity.entity_id);
              if (oldEntity) {
                // Update existing entity in-place, preserving custom properties like 'entities' array
                oldEntity.state = newEntity.state;
                oldEntity.attributes = newEntity.attributes;
                // Preserve any custom properties that aren't part of standard state (e.g., virtual area entity.entities)
                // Don't overwrite them with undefined
              } else {
                // Add new entity
                sensors.value.push(newEntity);
              }
            }
            
            console.log(`Updated ${statesList.length} entity states`);
            
            // Resolve on first update so caller knows data is available
            if (firstUpdate) {
              firstUpdate = false;
              resolve();
            }
          });
          
          // Set a timeout in case subscription never fires
          setTimeout(() => {
            if (firstUpdate) {
              console.warn('subscribeEntities did not receive initial data within 5 seconds');
              resolve();
            }
          }, 5000);
        } catch (error) {
          reject(error);
        }
      });
    } catch (error) {
      console.error('Error subscribing to states:', error);
      throw error;
    }
  };

  const fetchDevices = async () => {
    // Devices are now fetched via WebSocket library in fetchDevicesAfterAuth
    // This method is kept for API compatibility but does nothing
    if (isLocalMode.value) return;
    console.log('fetchDevices: Devices will be fetched from WebSocket connection');
  };

  // Local mode functions
  const loadLocalData = async () => {
    try {
      const baseUrl = import.meta.env.BASE_URL || '/';
      const dataUrl = baseUrl + 'data/local-data.json';
      const response = await fetch(dataUrl);
      if (!response.ok) {
        throw new Error('Local data file not found');
      }
      const data = await response.json();
      sensors.value = data.sensors || [];
      devices.value = data.devices || [];
      areas.value = data.areas || [];
      console.log(
        `Loaded ${sensors.value.length} sensors, ${devices.value.length} devices, and ${areas.value.length} areas from local file`
      );
    } catch (error) {
      console.error('Error loading local data:', error);
      throw error;
    }
  };

  const saveLocalData = async () => {
    try {
      const data = {
        sensors: sensors.value,
        devices: devices.value,
        areas: areas.value,
        timestamp: new Date().toISOString(),
        version: '1.0',
      };

      // In browser environment, we'll use a download approach
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'local-data.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log('Local data saved to download');
    } catch (error) {
      console.error('Error saving local data:', error);
    }
  };

  /**
   * Wrap library errors to maintain consistent error messaging
   */
  const wrapLibraryError = (error) => {
    if (error.code === ERR_INVALID_AUTH) {
      return 'Authentication failed: Invalid access token. Check your VITE_HA_TOKEN.';
    }
    if (error.code === ERR_CANNOT_CONNECT) {
      return `Failed to connect to Home Assistant. Check URL and network connectivity.`;
    }
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      return `CORS error: Home Assistant server at ${haUrl.value} does not allow cross-origin requests. Ensure CORS is configured properly in Home Assistant.`;
    }
    return error.message || 'Connection error with Home Assistant';
  };

  /**
   * Fetch entity registry via websocket to get device_id mappings
   */
  const fetchEntityRegistry = async () => {
    if (isLocalMode.value || !connection) {
      return;
    }

    try {
      console.log('Fetching entity registry via websocket');
      const result = await connection.sendMessagePromise({
        type: 'config/entity_registry/list',
      });

      let entityRegistry = [];
      if (Array.isArray(result)) {
        entityRegistry = result;
      } else if (result && result.result && Array.isArray(result.result)) {
        entityRegistry = result.result;
      }

      console.log(`Fetched ${entityRegistry.length} entities from entity registry`);
      
      // Create a map from entity_id to device_id
      const entityToDeviceMap = new Map();
      for (const entity of entityRegistry) {
        if (entity.entity_id && entity.device_id) {
          entityToDeviceMap.set(entity.entity_id, entity.device_id);
        }
      }
      
      // Now update sensors with device_id from the registry
      for (const sensor of sensors.value) {
        if (!sensor.attributes) {
          sensor.attributes = {};
        }
        if (!sensor.attributes.device_id && entityToDeviceMap.has(sensor.entity_id)) {
          sensor.attributes.device_id = entityToDeviceMap.get(sensor.entity_id);
        }
      }
    } catch (error) {
      console.error('Error fetching entity registry via websocket:', error);
    }
  };

  /**
   * Fetch area registry via library connection
   */
  const fetchAreaRegistry = async () => {
    if (isLocalMode.value || !connection) {
      return;
    }

    try {
      console.log('Fetching area registry via websocket');
      // Use the library's sendMessagePromise to send raw commands
      const result = await connection.sendMessagePromise({
        type: 'config/area_registry/list',
      });

      let areasArray = [];
      if (Array.isArray(result)) {
        areasArray = result;
      } else if (result && result.result && Array.isArray(result.result)) {
        areasArray = result.result;
      }

      console.log(`Fetched ${areasArray.length} areas from websocket:`, areasArray);

      if (areasArray.length > 0) {
        // Ensure each area has an entities array
        areas.value = areasArray.map((area) => ({
          ...area,
          entities: area.entities || [],
        }));
        console.log(`Updated areas list with ${areas.value.length} areas`);

        // Create virtual area entities
        for (const area of areasArray) {
          const areaEntity = {
            entity_id: `area.${area.area_id}`,
            state: area.name,
            attributes: {
              id: area.area_id,
              friendly_name: area.name,
              icon: area.icon,
              picture: area.picture,
              aliases: area.aliases,
            },
            entities: area.entities || [],
          };
          // Add to sensors so it shows up in entity list
          if (!sensors.value.find((s) => s.entity_id === areaEntity.entity_id)) {
            sensors.value.push(areaEntity);
            console.log(`Added virtual area entity: ${areaEntity.entity_id}`);
          }
        }
      } else {
        console.warn('No areas found in result');
      }
    } catch (error) {
      console.error('Error fetching area registry via websocket:', error);
    }
  };

  /**
   * Fetch device registry via library collection (after authentication)
   */
  const fetchDevicesAfterAuth = async () => {
    if (isLocalMode.value || !connection) {
      return;
    }

    try {
      console.log('Fetching device registry via websocket');
      const result = await connection.sendMessagePromise({
        type: 'config/device_registry/list',
      });

      let deviceList = [];
      if (Array.isArray(result)) {
        deviceList = result;
      } else if (result && result.result && Array.isArray(result.result)) {
        deviceList = result.result;
      }

      console.log(`Fetched ${deviceList.length} devices from websocket`);

      if (deviceList.length > 0) {
        // Transform device registry format
        const devicesArray = deviceList.map((device) => ({
          id: device.id,
          name: device.name || 'Unknown',
          model: device.model || null,
          manufacturer: device.manufacturer || null,
          sw_version: device.sw_version || null,
          hw_version: device.hw_version || null,
          area_id: device.area_id || null,
          entities: [],
        }));

        devices.value = devicesArray;
        console.log(`Updated devices list with ${devicesArray.length} devices`);
      } else {
        console.log('No devices fetched from websocket');
      }
    } catch (error) {
      console.error('Error fetching device registry via websocket:', error);
    }
  };

  /**
   * Map entities to devices based on device_id attribute
   */
  const mapEntitiesToDevices = () => {
    if (!sensors.value || sensors.value.length === 0) {
      return;
    }

    if (!devices.value || devices.value.length === 0) {
      return;
    }

    // First, map entities to devices
    const devicesMap = new Map(devices.value.map((d) => [d.id, d]));

    for (const sensor of sensors.value) {
      const deviceId = sensor.attributes?.device_id;
      if (!deviceId) {
        continue;
      }
      
      if (devicesMap.has(deviceId)) {
        const device = devicesMap.get(deviceId);
        if (!device.entities.includes(sensor.entity_id)) {
          device.entities.push(sensor.entity_id);
        }
      }
    }

    // Then, map entities to areas via devices
    const areasMap = new Map(areas.value.map((a) => [a.area_id, a]));
    
    let areasWithEntities = 0;
    for (const device of devices.value) {
      if (device.area_id && areasMap.has(device.area_id)) {
        const area = areasMap.get(device.area_id);
        if (!area.entities) {
          area.entities = [];
        }
        const beforeCount = area.entities.length;
        for (const entityId of device.entities) {
          if (!area.entities.includes(entityId)) {
            area.entities.push(entityId);
          }
        }
        const afterCount = area.entities.length;
        
        // Also update the virtual area entity in sensors
        const virtualAreaEntity = sensors.value.find((s) => s.entity_id === `area.${device.area_id}`);
        if (virtualAreaEntity) {
          virtualAreaEntity.entities = area.entities;
        }
        
        if (beforeCount === 0 && afterCount > 0) {
          areasWithEntities++;
        }
      }
    }

    if (import.meta.env.DEV) {
      console.log(`Mapped entities to ${areasWithEntities} areas`);
    }
  };

  /**
   * Connect to Home Assistant using the websocket library
   */
  const connectWebSocket = async () => {
    if (isLocalMode.value) return;

    if (!haUrl.value || !accessToken.value) {
      setError('Missing credentials for connection');
      return;
    }

    try {
      console.log('Connecting to Home Assistant via websocket library:', haUrl.value);
      
      // Ensure URL doesn't end with /
      let cleanUrl = haUrl.value;
      if (cleanUrl.endsWith('/')) {
        cleanUrl = cleanUrl.slice(0, -1);
      }

      // Create authentication with long-lived token using helper
      console.log('Creating auth with long-lived token...');
      const auth = createLongLivedTokenAuth(cleanUrl, accessToken.value);

      // Create connection with library
      console.log('Establishing WebSocket connection...');
      connection = await createConnection({ 
        auth,
        setupRetry: 5, // Retry up to 5 times on connection failure
      });

      isConnected.value = true;
      clearError();
      console.log('Connected to Home Assistant successfully');

      // Subscribe to entity state changes
      await fetchStates();

      // Fetch registries after successful connection
      console.log('Fetching devices and areas from websocket');
      await fetchDevicesAfterAuth();
      await fetchAreaRegistry();
      await fetchEntityRegistry();
      mapEntitiesToDevices();

      // Set up event listeners for connection changes
      connection.addEventListener('ready', () => {
        console.log('WebSocket ready');
        isConnected.value = true;
        clearError();
      });

      connection.addEventListener('disconnected', () => {
        console.log('WebSocket disconnected');
        isConnected.value = false;
      });

    } catch (error) {
      console.error('Error connecting to Home Assistant:', error);
      const wrappedError = wrapLibraryError(error);
      setError(wrappedError);
      isConnected.value = false;
      throw error;
    }
  };

  /**
   * Load dashboard configuration from JSON file
   * @returns {Object} Validation result with errors array
   */
  const loadDashboardConfig = async () => {
    try {
      const baseUrl = import.meta.env.BASE_URL || '/';
      const configUrl = baseUrl + 'data/dashboard-config.json';
      console.log('Loading dashboard config from:', configUrl);

      const response = await fetch(configUrl);
      if (!response.ok) {
        throw new Error(`Failed to load config: ${response.status} ${response.statusText}`);
      }

      const rawText = await response.text();
      let config;

      try {
        // Use better JSON parser to get helpful error messages
        config = parseJSON(rawText);
        
        // Remove internal Symbol properties added by the parser
        if (config && typeof config === 'object') {
          for (const sym of Object.getOwnPropertySymbols(config)) {
            delete config[sym];
          }
        }
      } catch (jsonError) {
        // parseJSON provides detailed error info
        let errorMsg = 'Invalid JSON in dashboard configuration';
        if (jsonError.message) {
          errorMsg = `JSON parse error: ${jsonError.message}`;
        }
        if (jsonError.position !== undefined) {
          errorMsg = `JSON parsing error at position ${jsonError.position}: ${jsonError.message}`;
          // Try to show context around the error
          const lines = rawText.split('\n');
          let charCount = 0;
          for (let i = 0; i < lines.length; i++) {
            const lineLength = lines[i].length + 1; // +1 for newline
            if (charCount + lineLength > jsonError.position) {
              const lineNum = i + 1;
              const colNum = jsonError.position - charCount;
              errorMsg = `JSON syntax error at line ${lineNum}, column ${colNum}: ${jsonError.message}`;
              break;
            }
            charCount += lineLength;
          }
        }
        console.error('[CONFIG] JSON parse error details:', {
          message: errorMsg,
          rawTextType: typeof rawText,
          rawTextLength: rawText?.length,
          rawTextSample: typeof rawText === 'string' ? rawText.substring(0, 100) : rawText,
        });
        throw new Error(errorMsg);
      }
      
      // Validate configuration
      const validationResult = validateConfig(config);

      if (!validationResult.valid) {
        configValidationError.value = validationResult.errors;
        configErrorCount.value = validationResult.errorCount;
      } else {
        configValidationError.value = [];
        configErrorCount.value = 0;
      }

      dashboardConfig.value = config;
      
      // Extract configuration values if present
      if (config.app?.developerMode !== undefined) {
        developerMode.value = config.app.developerMode;
        console.log('Developer mode set to:', developerMode.value);
      }
      if (config.app?.localMode !== undefined) {
        isLocalMode.value = config.app.localMode;
        console.log('Local mode set to:', isLocalMode.value);
      }
      console.log('Config loaded successfully. Views:', config.views?.length || 0);

      return validationResult;
    } catch (error) {
      console.error('Error loading dashboard config:', error);
      const errorMsg = error.message || 'Failed to load dashboard configuration';
      configValidationError.value = [{ message: errorMsg, line: -1 }];
      configErrorCount.value = 1;
      return {
        valid: false,
        errors: [{ message: errorMsg, line: -1 }],
        errorCount: 1,
      };
    }
  };

  /**
   * Load credentials from environment, config, localStorage, or request from user
   * @returns {boolean} True if credentials are loaded
   */
  const loadCredentials = async () => {
    // Priority: config file > localStorage
    // Note: Environment variables are NOT used for credentials per specification
    
    // Check config file first
    if (dashboardConfig.value?.haConfig) {
      console.log('Checking haConfig:', {
        haUrl: dashboardConfig.value.haConfig.haUrl ? 'present' : 'missing',
        accessToken: dashboardConfig.value.haConfig.accessToken ? 'present' : 'missing',
      });
      if (dashboardConfig.value.haConfig.haUrl && dashboardConfig.value.haConfig.accessToken) {
        haUrl.value = dashboardConfig.value.haConfig.haUrl;
        accessToken.value = dashboardConfig.value.haConfig.accessToken;
        credentialsFromConfig.value = true;
        console.log('✓ Using credentials from config file');
        return true;
      }
    }

    // Check localStorage
    const savedUrl = localStorage.getItem('ha_url');
    const savedToken = localStorage.getItem('ha_token');
    if (savedUrl && savedToken) {
      haUrl.value = savedUrl;
      accessToken.value = savedToken;
      credentialsFromConfig.value = false;
      console.log('✓ Using credentials from localStorage');
      return true;
    }

    // No credentials available
    console.log('✗ No credentials found - user input required');
    return false;
  };

  /**
   * Save credentials to localStorage
   */
  const saveCredentials = (url, token) => {
    localStorage.setItem('ha_url', url);
    localStorage.setItem('ha_token', token);
    haUrl.value = url;
    accessToken.value = token;
    credentialsFromConfig.value = false;
    needsCredentials.value = false;
    console.log('Credentials saved to localStorage');
  };

  /**
   * Reload dashboard configuration (in-memory, no page refresh)
   * @returns {Object} Validation result with errors array
   */
  const reloadConfig = async () => {
    try {
      console.log('Reloading dashboard configuration...');
      
      // Preserve current credentials
      const currentUrl = haUrl.value;
      const currentToken = accessToken.value;

      const validationResult = await loadDashboardConfig();

      // Restore credentials if they were cleared during reload
      if (currentUrl) haUrl.value = currentUrl;
      if (currentToken) accessToken.value = currentToken;

      // If local mode is enabled, also reload local data
      if (isLocalMode.value) {
        console.log('Reloading local data...');
        await loadLocalData();
      }

      return validationResult;
    } catch (error) {
      console.error('Error reloading config:', error);
      return {
        valid: false,
        errors: [error.message || 'Failed to reload configuration'],
        errorCount: 1,
      };
    }
  };

  const init = async () => {
    console.log('=== Starting initialization ===');
    console.log('Initial developerMode:', developerMode.value);
    console.log('Initial localMode:', isLocalMode.value);
    isLoading.value = true;
    needsCredentials.value = false;
    
    try {
      // Step 1: Load dashboard configuration
      console.log('Step 1: Loading dashboard configuration...');
      await loadDashboardConfig();
      console.log('Step 1: Config loaded successfully');

      // Check if there was a JSON syntax error - if so, don't prompt for credentials
      // Only skip if the error is specifically a JSON parse error, not other validation errors
      if (configValidationError.value?.length > 0 && 
          configValidationError.value.some(err => err.message?.includes('JSON'))) {
        console.log('Step 1: JSON syntax error found - not prompting for credentials');
        isLoading.value = false;
        // Exit without setting needsCredentials so we don't show the dialog
        return;
      }

      // Step 2: Check for credentials
      console.log('Step 2: Checking for credentials...');
      const hasCredentials = await loadCredentials();
      console.log('Step 2: hasCredentials =', hasCredentials, 'isLocalMode =', isLocalMode.value);
      
      if (!hasCredentials && !isLocalMode.value) {
        console.log('Step 2: No credentials found - prompting user');
        needsCredentials.value = true;
        isLoading.value = false;
        // Don't continue - wait for user to provide credentials
        return;
      }
      
      console.log('Step 2: Credentials found or in local mode');

      // Step 3: Load data based on mode
      if (isLocalMode.value) {
        console.log('Step 3: Local mode - loading local data...');
        await loadLocalData();
        isInitialized.value = true;
        isLoading.value = false;
        console.log('=== Initialization complete (local mode) ===');
      } else {
        console.log('Step 3: Connecting to Home Assistant via websocket...');
        await connectWebSocket();
        console.log('Step 3: Websocket connection established and data loaded...');
        isInitialized.value = true;
        isLoading.value = false;
        console.log('=== Initialization complete (HA connected) ===');
      }
    } catch (error) {
      console.error('=== Initialization error ===', error);
      isLoading.value = false;
      isInitialized.value = false;
      
      if (error.message.includes('CORS error')) {
        lastError.value = error.message;
      } else if (error.message.includes('Authentication failed')) {
        lastError.value = error.message;
      } else if (error.message.includes('Access forbidden')) {
        lastError.value = error.message;
      } else if (error.message.includes('not found')) {
        lastError.value = error.message;
      } else {
        lastError.value = 'Failed to connect to Home Assistant. Check console for details.';
      }
    }
  };

  const callService = async (domain, service, data) => {
    if (isLocalMode.value) {
      console.warn('Service calls are disabled in local mode');
      return;
    }
    if (!haUrl.value || !accessToken.value) return;
    try {
      const response = await fetch(`${haUrl.value}/api/services/${domain}/${service}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken.value}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        let errorMessage = `Service call failed: ${response.status} ${response.statusText}`;
        if (response.status === 401) {
          errorMessage = 'Authentication failed: Invalid access token. Please check VITE_HA_TOKEN.';
        } else if (response.status === 403) {
          errorMessage = 'Access forbidden: Check CORS settings or permissions in Home Assistant.';
        } else if (response.status === 404) {
          errorMessage = 'Service not found: Verify domain and service are correct.';
        }
        throw new Error(errorMessage);
      }
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.error('CORS or network error calling service:', error);
        throw new Error(
          `CORS error: Home Assistant server at ${haUrl.value} does not allow cross-origin requests. Ensure CORS is configured properly in Home Assistant.`
        );
      }
      console.error('Error calling service:', error);
      throw error;
    }
  };

  const retryConnection = async () => {
    lastError.value = null;
    isConnected.value = false;
    // Clean up any existing subscriptions
    if (unsubscribeEntitiesFn) {
      unsubscribeEntitiesFn();
      unsubscribeEntitiesFn = null;
    }
    // Try to re-initialize the store (refresh states and reconnect)
    await init();
  };

  // Deduplication cache for history requests
  // Key: entityId, Value: { promise, timestamp }
  const historyRequestCache = new Map();
  const HISTORY_CACHE_TTL = 5000; // 5 seconds

  // Fetch numeric history points for a given entity and time range (hours)
  async function fetchHistory(entityId, hours = 24, maxPoints = 200) {
    if (isLocalMode.value) {
      return [];
    }
    if (!haUrl.value || !accessToken.value) {
      return [];
    }

    // Cache key should include hours to differentiate between different time ranges
    const cacheKey = `${entityId}:${hours}`;
    
    // Check if we have a pending request for this entity with this time range
    const cached = historyRequestCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < HISTORY_CACHE_TTL) {
      return cached.promise;
    }

    // Create promise for this request
    const promise = (async () => {
      try {
        const now = Date.now();
        const startTime = now - hours * 3600 * 1000;
        const start = new Date(startTime).toISOString();
        const end = new Date(now).toISOString();
        const base = haUrl.value ? haUrl.value.replace(/\/$/, '') : '';
        const urlPath = `/api/history/period/${start}?end_time=${end}&filter_entity_id=${encodeURIComponent(entityId)}&minimal_response=true`;
        const url = base ? `${base}${urlPath}` : urlPath;

        const res = await fetchWithTimeout(
          url,
          {
            headers: {
              Authorization: `Bearer ${accessToken.value}`,
              'Content-Type': 'application/json',
            },
          },
          30000
        );

        if (!res.ok) {
          const txt = await res.text();
          let errorMessage = `History request failed: ${res.status} - ${txt.slice(0, 200)}`;
          if (res.status === 401) {
            errorMessage =
              'Authentication failed: Invalid access token. Please check VITE_HA_TOKEN.';
          } else if (res.status === 403) {
            errorMessage =
              'Access forbidden: Check CORS settings or permissions in Home Assistant.';
          } else if (res.status === 404) {
            errorMessage =
              'History endpoint not found: Verify Home Assistant version supports this API.';
          }
          console.error('History request error:', errorMessage);
          throw new Error(errorMessage);
        }

        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('application/json')) {
          const txt = await res.text();
          throw new Error(
            'History endpoint did not return JSON. Response snippet: ' + txt.slice(0, 300)
          );
        }

        const body = await res.json();
        
        if (!body || !Array.isArray(body)) {
          console.warn('Response is not an array! Got type:', typeof body);
          return [];
        }
        
        const arr = body[0] || [];
        const extracted = arr
          .map((s) => {
            const t = new Date(s.last_changed).getTime();
            const v = Number(s.state);
            return { t, v };
          })
          .filter((p) => !Number.isNaN(p.v));
        if (extracted.length > maxPoints) {
          const step = extracted.length / maxPoints;
          const sampled = [];
          for (let i = 0; i < maxPoints; i++) sampled.push(extracted[Math.floor(i * step)]);
          return sampled;
        }

        return extracted;
      } catch (e) {
        if (e instanceof TypeError && e.message.includes('Failed to fetch')) {
          console.error('CORS or network error fetching history:', e);
          throw new Error(
            `CORS error: Home Assistant server at ${haUrl.value} does not allow cross-origin requests. Ensure CORS is configured properly in Home Assistant.`
          );
        }
        console.error('fetchHistory error', e);
        throw e;
      }
    })();

    // Cache the promise
    historyRequestCache.set(cacheKey, { promise, timestamp: Date.now() });

    // Clear cache entry after TTL
    setTimeout(() => {
      historyRequestCache.delete(cacheKey);
    }, HISTORY_CACHE_TTL);

    return promise;
  }

  /**
   * Fetch energy consumption history for a given entity and number of days
   * Returns aggregated data points for bar chart visualization
   * @param {string} entityId - Entity ID (e.g., 'sensor.power_hemma')
   * @param {number} days - Number of days to fetch (1, 3, 7, 14)
   * @returns {Promise<Array>} Array of { bucket, value, timestamp } for chart display
   */
  async function fetchEnergyHistory(entityId, days = 1) {
    if (isLocalMode.value) {
      return [];
    }
    if (!haUrl.value || !accessToken.value) {
      return [];
    }

    const cacheKey = `energy:${entityId}:${days}`;
    const cached = historyRequestCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < HISTORY_CACHE_TTL) {
      return cached.promise;
    }

    const promise = (async () => {
      try {
        const now = new Date();
        const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        const startIso = startDate.toISOString();
        const endIso = now.toISOString();
        const base = haUrl.value ? haUrl.value.replace(/\/$/, '') : '';
        const urlPath = `/api/history/period/${startIso}?end_time=${encodeURIComponent(endIso)}&filter_entity_id=${encodeURIComponent(entityId)}&minimal_response=true`;
        const url = base ? `${base}${urlPath}` : urlPath;

        const res = await fetchWithTimeout(
          url,
          {
            headers: {
              Authorization: `Bearer ${accessToken.value}`,
              'Content-Type': 'application/json',
            },
          },
          30000
        );

        if (!res.ok) {
          await res.text();
          let errorMessage = `Energy history request failed: ${res.status}`;
          if (res.status === 401) {
            errorMessage = 'Authentication failed: Invalid access token.';
          } else if (res.status === 403) {
            errorMessage = 'Access forbidden: Check permissions.';
          } else if (res.status === 404) {
            errorMessage = 'History endpoint not found.';
          }
          console.error('Energy history error:', errorMessage);
          throw new Error(errorMessage);
        }

        const body = await res.json();
        if (!body || !Array.isArray(body) || !body[0]) {
          return [];
        }

        const entries = body[0];
        
        // Determine bucket size based on days
        let bucketMinutes;
        if (days <= 1) bucketMinutes = 60; // Hourly for 1 day
        else if (days <= 3) bucketMinutes = 1440; // Daily for 3 days
        else if (days <= 7) bucketMinutes = 1440; // Daily for 7 days
        else bucketMinutes = 1440; // Daily for 14+ days

        // Create all expected buckets for the time range (to ensure full data representation)
        const bucketMs = bucketMinutes * 60 * 1000;
        const buckets = new Map();
        
        // Initialize all buckets for the requested period
        const now_ms = now.getTime();
        let start_ms = startDate.getTime();
        let end_ms = now_ms;
        
        // For daily buckets, align to midnight to avoid spanning extra days
        let bucketTime;
        if (bucketMinutes === 1440) {
          // Daily buckets: create exactly 'days' buckets starting from 'days' ago at midnight
          // Align NOW to midnight (end of today) and count backward
          const now_midnight = new Date(now);
          now_midnight.setUTCHours(0, 0, 0, 0);
          now_midnight.setUTCDate(now_midnight.getUTCDate() + 1); // Start of tomorrow (end of today)
          
          bucketTime = now_midnight.getTime() - (days * bucketMs); // Go back 'days' from end of today
          start_ms = bucketTime; // Update start_ms to match actual bucket start
          end_ms = now_midnight.getTime(); // Update end_ms to end of today (start of tomorrow)
          
          for (let i = 0; i < days; i++) {
            buckets.set(bucketTime, { values: [], timestamp: bucketTime });
            bucketTime += bucketMs;
          }
        } else {
          // Hourly buckets: create exactly 'days * 24' buckets
          bucketTime = Math.floor(start_ms / bucketMs) * bucketMs;
          const endBucketTime = bucketTime + (days * 24 * bucketMs);
          
          for (; bucketTime < endBucketTime; bucketTime += bucketMs) {
            buckets.set(bucketTime, { values: [], timestamp: bucketTime });
          }
        }

        // Aggregate data into buckets, filtering to only requested time range
        entries.forEach((entry) => {
          const timestamp = new Date(entry.last_changed).getTime();
          
          // Only include entries within the requested time range
          if (timestamp < start_ms || timestamp >= end_ms) {
            return;
          }
          
          const bucketTime = Math.floor(timestamp / bucketMs) * bucketMs;
          const value = Number(entry.state);

          if (!Number.isNaN(value)) {
            if (!buckets.has(bucketTime)) {
              buckets.set(bucketTime, { values: [], timestamp: bucketTime });
            }
            buckets.get(bucketTime).values.push(value);
          }
        });

        // Calculate average for each bucket
        const aggregated = Array.from(buckets.values())
          .map((bucket) => {
            let avg;
            if (bucket.values.length > 0) {
              avg = bucket.values.reduce((a, b) => a + b, 0) / bucket.values.length;
            } else {
              // For empty buckets, try to use the last known value
              // This creates a more continuous-looking chart
              avg = 0;
            }
            return {
              timestamp: bucket.timestamp,
              value: Math.round(avg * 100) / 100, // Round to 2 decimals
              label: formatBucketLabel(bucket.timestamp, days),
            };
          })
          .sort((a, b) => a.timestamp - b.timestamp);

        return aggregated;
      } catch (e) {
        console.error('fetchEnergyHistory error:', e);
        throw e;
      }
    })();

    historyRequestCache.set(cacheKey, { promise, timestamp: Date.now() });
    setTimeout(() => {
      historyRequestCache.delete(cacheKey);
    }, HISTORY_CACHE_TTL);

    return promise;
  }

  /**
   * Format label for energy history bucket based on time period
   * @param {number} timestamp - Bucket timestamp in ms
   * @param {number} days - Number of days (determines label format)
   * @returns {string} Formatted label (HH:00 for hourly, Day abbr for daily, etc)
   */
  function formatBucketLabel(timestamp, days) {
    const date = new Date(timestamp);
    if (days <= 1) {
      // Hourly format: "00", "03", "06", etc
      return String(date.getHours()).padStart(2, '0');
    } else {
      // Daily format: "Mon", "Tue", etc
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    }
  }

  return {
    sensors,
    devices,
    areas,
    isLoading,
    isInitialized,
    isLocalMode,
    developerMode,
    haUrl,
    accessToken,
    credentialsFromConfig,
    dashboardConfig,
    configValidationError,
    configErrorCount,
    needsCredentials,
    loadDashboardConfig,
    loadCredentials,
    saveCredentials,
    reloadConfig,
    fetchStates,
    fetchDevices,
    fetchDevicesAfterAuth,
    fetchAreaRegistry,
    fetchEntityRegistry,
    mapEntitiesToDevices,
    loadLocalData,
    saveLocalData,
    connectWebSocket,
    init,
    callService,
    fetchHistory,
    fetchEnergyHistory,
    isConnected,
    lastError,
    retryConnection,
    // Helper functions to filter sensors
    getBatterySensors: () =>
      sensors.value.filter(
        (s) =>
          s.entity_id.startsWith('sensor.') &&
          s.attributes?.device_class === 'battery' &&
          s.state !== 'unavailable' &&
          s.state !== 'unknown'
      ),
    getWifiSensors: () =>
      sensors.value.filter(
        (s) =>
          s.entity_id.startsWith('sensor.') &&
          s.attributes?.icon?.startsWith('mdi:wifi') &&
          s.state !== 'unavailable' &&
          s.state !== 'unknown'
      ),
    // Specific getters for common entity types
    getAll: () => sensors.value,
    getSuns: () => sensors.value.filter((s) => s.entity_id.startsWith('sun.')),
    getFans: () => sensors.value.filter((s) => s.entity_id.startsWith('fan.')),
    getSelects: () => sensors.value.filter((s) => s.entity_id.startsWith('select.')),
    getButtons: () => sensors.value.filter((s) => s.entity_id.startsWith('button.')),
    getSensors: () => sensors.value.filter((s) => s.entity_id.startsWith('sensor.')),
    getLights: () => sensors.value.filter((s) => s.entity_id.startsWith('light.')),
    getSwitches: () => sensors.value.filter((s) => s.entity_id.startsWith('switch.')),
    getAlarmPanels: () =>
      sensors.value.filter((s) => s.entity_id.startsWith('alarm_control_panel.')),
    getDeviceTrackers: () => sensors.value.filter((s) => s.entity_id.startsWith('device_tracker.')),
    getMediaPlayers: () => sensors.value.filter((s) => s.entity_id.startsWith('media_player.')),
    getBinarySensors: () => sensors.value.filter((s) => s.entity_id.startsWith('binary_sensor.')),
    // Energy/power consumption sensors
    getEnergyConsumptionSensors: () =>
      sensors.value.filter(
        (s) =>
          s.entity_id.startsWith('sensor.') &&
          s.attributes?.device_class === 'energy' &&
          s.attributes?.state_class === 'total' &&
          s.state !== 'unavailable' &&
          s.state !== 'unknown'
      ),
    getPowerConsumptionSensors: () =>
      sensors.value.filter(
        (s) =>
          s.entity_id.startsWith('sensor.') &&
          s.attributes?.device_class === 'power' &&
          s.state !== 'unavailable' &&
          s.state !== 'unknown'
      ),
    // Get all entities for a specific device
    getEntitiesForDevice: (deviceId) => {
      const device = devices.value.find((d) => d.id === deviceId);
      if (!device || !device.entities) return [];
      return sensors.value.filter((s) => device.entities.includes(s.entity_id));
    },
  };
});
