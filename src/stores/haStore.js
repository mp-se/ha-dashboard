import { defineStore } from 'pinia';
import { ref } from 'vue';
import { validateConfig } from '../utils/configValidator';

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

  let ws = null;
  let reconnectDelay = 1000;
  const maxReconnectDelay = 30000;
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 5; // Show error after 5 failed attempts
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
    if (!haUrl.value || !accessToken.value) {
      console.warn('fetchStates: Missing haUrl or accessToken', {
        haUrl: haUrl.value,
        hasToken: !!accessToken.value,
      });
      return;
    }
    try {
      console.log('Fetching states from:', `${haUrl.value}/api/states`);
      const response = await fetchWithTimeout(
        `${haUrl.value}/api/states`,
        {
          headers: {
            Authorization: `Bearer ${accessToken.value}`,
            'Content-Type': 'application/json',
          },
        },
        30000
      );
      if (!response.ok) {
        let errorMessage = `Failed to fetch states: ${response.status} ${response.statusText}`;
        if (response.status === 401) {
          errorMessage = 'Authentication failed: Invalid access token. Please check TOKEN.';
        } else if (response.status === 403) {
          errorMessage = 'Access forbidden: Check CORS settings or permissions in Home Assistant.';
        } else if (response.status === 404) {
          errorMessage = 'Home Assistant API not found: Verify URL is correct.';
        }
        throw new Error(errorMessage);
      }
      const states = await response.json();
      console.log(`Fetched ${states.length} states`);
      console.log('Sample sensor attributes:', states.slice(0, 3).map(s => ({ entity_id: s.entity_id, device_id: s.attributes?.device_id, attrs: Object.keys(s.attributes || {}) })));
      sensors.value = states;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.error('CORS or network error fetching states:', error);
        throw new Error(
          `CORS error: Home Assistant server at ${haUrl.value} does not allow cross-origin requests. Ensure CORS is configured properly in Home Assistant.`
        );
      }
      console.error('Error fetching states:', error);
      throw error;
    }
  };

  const fetchDevices = async () => {
    if (isLocalMode.value) return;
    if (!haUrl.value || !accessToken.value) return;
    try {
      const response = await fetchWithTimeout(
        `${haUrl.value}/api/template`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken.value}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            template:
              "{% set devices = states | map(attribute='entity_id') | map('device_id') | unique | reject('eq',None) | list %}{%- set ns = namespace(devices = []) %}{%- for device in devices %}{%- set entities = device_entities(device) | list %}{%- if entities %}{%- set ns.devices = ns.devices +  [ {'id': device, 'name': device_attr(device, 'name'), 'model': device_attr(device, 'model'), 'manufacturer': device_attr(device, 'manufacturer'), 'sw_version': device_attr(device, 'sw_version'), 'hw_version': device_attr(device, 'hw_version'), 'entities': entities} ] %}{%- endif %}{%- endfor %}{{ ns.devices | tojson }}",
          }),
        },
        30000
      );
      if (!response.ok) {
        let errorMessage = `Failed to fetch devices: ${response.status} ${response.statusText}`;
        if (response.status === 401) {
          errorMessage = 'Authentication failed: Invalid access token. Please check VITE_HA_TOKEN.';
        } else if (response.status === 403) {
          errorMessage = 'Access forbidden: Check CORS settings or permissions in Home Assistant.';
        } else if (response.status === 404) {
          errorMessage = 'Home Assistant API not found: Verify VITE_HA_URL is correct.';
        }
        throw new Error(errorMessage);
      }
      const templateResult = await response.text();
      const parsed = JSON.parse(templateResult);
      devices.value = parsed;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.error('CORS or network error fetching devices:', error);
        throw new Error(
          `CORS error: Home Assistant server at ${haUrl.value} does not allow cross-origin requests. Ensure CORS is configured properly in Home Assistant.`
        );
      }
      console.error('Error fetching devices via template:', error);
      throw error;
    }
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

  // Batching mechanism for WebSocket state updates
  // Collect updates in a batch and apply them every 100ms to reduce re-renders
  const pendingUpdates = new Map(); // entity_id -> new_state
  let batchTimeout = null;
  const BATCH_WINDOW = 100; // milliseconds

  const processBatch = () => {
    if (pendingUpdates.size === 0) return;

    // Apply all pending updates in a single operation
    for (const [entityId, entity] of pendingUpdates) {
      const index = sensors.value.findIndex((s) => s.entity_id === entityId);
      if (index !== -1) {
        sensors.value.splice(index, 1, entity);
      } else {
        sensors.value.push(entity);
      }
    }

    pendingUpdates.clear();
    batchTimeout = null;
  };

  const queueUpdate = (entity) => {
    pendingUpdates.set(entity.entity_id, entity);

    // Schedule batch processing if not already scheduled
    if (!batchTimeout) {
      batchTimeout = setTimeout(processBatch, BATCH_WINDOW);
    }
  };

  // Map to track pending websocket commands
  let wsPendingCommands = new Map();
  let wsCommandId = 1;

  /**
   * Send a command via websocket and wait for result
   */
  const sendWebSocketCommand = async (command, timeout = 10000) => {
    return new Promise((resolve, reject) => {
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      const commandId = wsCommandId++;
      const timeoutId = setTimeout(() => {
        wsPendingCommands.delete(commandId);
        reject(new Error(`WebSocket command timeout after ${timeout}ms`));
      }, timeout);

      wsPendingCommands.set(commandId, { resolve, reject, timeoutId });

      ws.send(
        JSON.stringify({
          id: commandId,
          ...command,
        })
      );
    });
  };

  /**
   * Fetch entity registry via websocket to get device_id mappings
   */
  const fetchEntityRegistry = async () => {
    if (isLocalMode.value || !ws || ws.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      console.log('Fetching entity registry via websocket');
      const result = await sendWebSocketCommand({
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
   * Fetch entities with device_id mapping via entity registry
   */
  const fetchEntitiesWithDeviceId = async () => {
    if (isLocalMode.value || !ws || ws.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      console.log('Fetching entity registry to enrich sensors with device_id');
      await fetchEntityRegistry();
    } catch (error) {
      console.error('Error fetching entities with device_id:', error);
    }
  };

  /**
   * Fetch area registry via websocket
   */
  const fetchAreaRegistry = async () => {
    if (isLocalMode.value || !ws || ws.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      console.log('Fetching area registry via websocket');
      const result = await sendWebSocketCommand({
        type: 'config/area_registry/list',
      });

      let areasArray = [];
      if (Array.isArray(result)) {
        areasArray = result;
      } else if (result && result.result && Array.isArray(result.result)) {
        areasArray = result.result;
      } else if (result && Array.isArray(result)) {
        areasArray = result;
      } else {
        console.warn('Unexpected result format for areas:', result);
      }

      if (areasArray.length > 0) {
        // Ensure each area has an entities array
        areas.value = areasArray.map((area) => ({
          ...area,
          entities: area.entities || [],
        }));
        console.log(`Fetched ${areas.value.length} areas from websocket`);

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
   * Fetch device registry via websocket (after authentication)
   */
  const fetchDevicesAfterAuth = async () => {
    if (isLocalMode.value || !ws || ws.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      console.log('Fetching device registry via websocket');
      const result = await sendWebSocketCommand(
        {
          type: 'config/device_registry/list',
        },
        10000
      );

      let deviceList = [];
      if (Array.isArray(result)) {
        deviceList = result;
      } else if (result && result.result && Array.isArray(result.result)) {
        deviceList = result.result;
      } else if (result && result.success && Array.isArray(result)) {
        deviceList = result;
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
    console.log('=== mapEntitiesToDevices called ===');
    console.log('Current sensors count:', sensors.value.length);
    console.log('Current devices count:', devices.value.length);
    console.log('Current areas count:', areas.value.length);
    
    if (!sensors.value || sensors.value.length === 0) {
      console.warn('No sensors loaded yet - cannot map entities');
      return;
    }

    if (!devices.value || devices.value.length === 0) {
      console.log('No devices to map entities to');
      return;
    }

    // First, map entities to devices
    console.log('=== Mapping entities to devices ===');
    const devicesMap = new Map(devices.value.map((d) => [d.id, d]));
    let mappedCount = 0;
    let unmappedCount = 0;
    let noDeviceIdCount = 0;

    console.log('Devices map size:', devicesMap.size);
    console.log('Sample devices in map:', Array.from(devicesMap.entries()).slice(0, 3).map(([id, d]) => ({ id, name: d.name, area_id: d.area_id })));

    for (const sensor of sensors.value) {
      const deviceId = sensor.attributes?.device_id;
      if (!deviceId) {
        noDeviceIdCount++;
        continue;
      }
      
      if (devicesMap.has(deviceId)) {
        const device = devicesMap.get(deviceId);
        if (!device.entities.includes(sensor.entity_id)) {
          device.entities.push(sensor.entity_id);
          mappedCount++;
        }
      } else {
        unmappedCount++;
      }
    }

    console.log(`Mapped ${mappedCount} entities to devices. Unmapped: ${unmappedCount}, No device_id: ${noDeviceIdCount}`);
    console.log('Sample devices after mapping:', devices.value.filter(d => d.entities.length > 0).slice(0, 3).map(d => ({ id: d.id, name: d.name, area_id: d.area_id, entities: d.entities.length })));

    // Then, map entities to areas via devices
    console.log('=== Mapping entities to areas via devices ===');
    const areasMap = new Map(areas.value.map((a) => [a.area_id, a]));
    console.log('Areas map size:', areasMap.size);
    console.log('Devices with area_id:', devices.value.filter(d => d.area_id).map(d => ({ id: d.id, name: d.name, area_id: d.area_id, entities: d.entities.length })));
    
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
        
        if (afterCount > beforeCount) {
          console.log(`Added ${afterCount - beforeCount} entities to area ${device.area_id}`);
        }
        if (beforeCount === 0 && afterCount > 0) {
          areasWithEntities++;
        }
      }
    }

    console.log(`Mapped entities to ${areasWithEntities} areas`);
    console.log('All areas:', areas.value.map(a => ({ id: a.area_id, name: a.name, entities: a.entities?.length || 0 })));
    console.log('=== mapEntitiesToDevices complete ===');
  };

  const connectWebSocket = () => {
    if (isLocalMode.value) return;

    // Close existing connection if any
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.close();
    }

    // Convert http(s) => ws(s) and ensure slashes are correct
    const wsProtocol = haUrl.value?.startsWith('https') ? 'wss' : 'ws';
    const cleaned = haUrl.value.replace(/^https?:\/\//, '');
    // Don't include token in URL - use auth message instead
    const wsUrl = `${wsProtocol}://${cleaned}/api/websocket`;
    console.log('Connecting to WebSocket:', wsUrl);

    ws = new WebSocket(wsUrl);
    let authenticated = false;

    ws.onopen = () => {
      console.log('WebSocket connected, waiting for auth');
      reconnectDelay = 1000;
      reconnectAttempts = 0;
      isConnected.value = true;
      clearError();
      authenticated = false;
    };

    ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WebSocket message:', data.type);

        if (data.type === 'auth_required') {
          console.log('Auth required, sending token');
          ws.send(
            JSON.stringify({
              type: 'auth',
              access_token: accessToken.value,
            })
          );
        } else if (data.type === 'auth_ok') {
          console.log('Authentication successful, subscribing to events');
          authenticated = true;
          // Don't use hardcoded ID - let sendWebSocketCommand handle it
          // Or just send without ID since subscription doesn't need response tracking
          ws.send(
            JSON.stringify({
              type: 'subscribe_events',
              event_type: 'state_changed',
            })
          );
          // Fetch devices and areas after authentication
          console.log('Fetching devices and areas from websocket');
          await fetchDevicesAfterAuth();
          await fetchAreaRegistry();
          // Fetch entity registry to enrich sensors with device_id
          await fetchEntityRegistry();
          // Map entities to devices after all data is fetched
          mapEntitiesToDevices();
        } else if (data.type === 'auth_invalid') {
          console.error('Authentication failed - token is invalid');
          setError('Authentication failed: Invalid access token. Check your VITE_HA_TOKEN.');
          ws.close();
        } else if (data.type === 'result') {
          // Handle command responses
          if (data.id && wsPendingCommands.has(data.id)) {
            const { resolve, timeoutId } = wsPendingCommands.get(data.id);
            clearTimeout(timeoutId);
            wsPendingCommands.delete(data.id);
            // Always resolve with data.result, even if it's null or undefined
            resolve(data.result);
          } else if (authenticated) {
            console.log('Subscription confirmed');
          }
        } else if (
          data.type === 'event' &&
          data.event?.event_type === 'state_changed' &&
          authenticated
        ) {
          const entity = data.event.data.new_state;
          // Queue the update instead of applying immediately
          queueUpdate(entity);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };

    ws.onclose = (event) => {
      console.log('WebSocket closed:', event.code, event.reason);
      isConnected.value = false;
      authenticated = false;

      // Process any pending updates before closing
      if (batchTimeout) {
        clearTimeout(batchTimeout);
        processBatch();
      }

      // Only reconnect if it wasn't a clean close (code 1000) and not due to auth failure
      if (event.code !== 1000 && !lastError.value) {
        reconnectAttempts++;

        if (reconnectAttempts >= maxReconnectAttempts) {
          setError(
            `Failed to connect after ${maxReconnectAttempts} attempts. Check Home Assistant URL and network connectivity.`
          );
          return;
        }

        console.log('WebSocket closed, reconnecting...', {
          delay: reconnectDelay,
          attempts: reconnectAttempts,
        });

        setTimeout(() => {
          connectWebSocket();
          reconnectDelay = Math.min(maxReconnectDelay, reconnectDelay * 2);
        }, reconnectDelay);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('Connection error with Home Assistant. Check URL, certificate, and network.');
    };
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

      const config = await response.json();
      
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
        console.log('Step 3: Connecting to Home Assistant API...');
        await fetchStates();
        console.log('Step 3: States loaded, connecting WebSocket...');
        console.log('Step 3: Devices will be loaded from websocket after auth...');
        connectWebSocket();
        // Fetch entities from websocket after connection established
        console.log('Step 3: Waiting for websocket to provide entity device mapping...');
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
        lastError.value = 'Failed to read data from Home Assistant. Check console for details.';
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
    // Get all entities for a specific device
    getEntitiesForDevice: (deviceId) => {
      const device = devices.value.find((d) => d.id === deviceId);
      if (!device || !device.entities) return [];
      return sensors.value.filter((s) => device.entities.includes(s.entity_id));
    },
  };
});
