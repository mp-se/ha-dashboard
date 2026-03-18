/**
 * Home Assistant Dashboard Type Definitions
 * Provides TypeScript interfaces for commonly used data structures
 * to improve type safety and developer experience.
 */

/**
 * Home Assistant Context object
 * Describes the context of an action (user, automation, etc.)
 */
export interface HaContext {
  id: string;
  parent_id: string | null;
  user_id: string | null;
}

/**
 * Home Assistant Entity State
 * Represents the current state and attributes of an entity
 */
export interface Entity {
  entity_id: string;
  state: string | number;
  attributes: Record<string, unknown>;
  last_changed?: string;
  last_updated?: string;
  context?: HaContext;
}

/**
 * State Changed Event
 * Fired when an entity's state changes
 */
export interface StateChangedEvent {
  entity_id: string;
  new_state: Entity;
  old_state: Entity | null;
}

/**
 * Service Call Data
 * Generic type for service call parameters
 */
export type ServiceCallData = Record<string, unknown>;

/**
 * Service Call Result
 * Response from a service call
 */
export interface ServiceResult {
  success: boolean;
  error?: string;
}

/**
 * Dashboard Configuration - HA Connection Settings
 */
export interface HaConfigSettings {
  haUrl: string;
  accessToken: string;
}

/**
 * Dashboard Configuration - App Settings
 */
export interface AppSettings {
  developerMode?: boolean;
  localMode?: boolean;
}

/**
 * Entity Configuration in Dashboard
 */
export interface EntityConfig {
  entity: string | string[] | EntityConfigObject;
  type?: string;
  attributes?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Entity Configuration as Object
 */
export interface EntityConfigObject {
  [key: string]: unknown;
}

/**
 * Dashboard View Configuration
 */
export interface ViewConfig {
  name: string;
  title: string;
  entities: EntityConfig[];
  [key: string]: unknown;
}

/**
 * Complete Dashboard Configuration
 */
export interface DashboardConfig {
  app?: AppSettings;
  views?: ViewConfig[];
  haConfig?: HaConfigSettings;
  [key: string]: unknown;
}

/**
 * Logger interface for structured logging
 */
export interface Logger {
  log(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  error(...args: unknown[]): void;
  debug(...args: unknown[]): void;
}

/**
 * Entity Attribute Formatter
 */
export interface AttributeFormatter {
  format(value: unknown): string;
  parse(value: string): unknown;
}

/**
 * Light State
 */
export interface LightState extends Entity {
  attributes: {
    brightness?: number;
    color_temp?: number;
    hs_color?: [number, number];
    rgb_color?: [number, number, number];
    xy_color?: [number, number];
    effect?: string;
    supported_color_modes?: string[];
    supported_features?: number;
    [key: string]: unknown;
  };
}

/**
 * Switch State
 */
export interface SwitchState extends Entity {
  attributes: {
    [key: string]: unknown;
  };
}

/**
 * Climate (Thermostat) State
 */
export interface ClimateState extends Entity {
  attributes: {
    current_temperature?: number;
    target_temperature?: number;
    temperature?: number;
    hvac_action?: string;
    hvac_modes?: string[];
    preset_mode?: string;
    preset_modes?: string[];
    fan_mode?: string;
    fan_modes?: string[];
    [key: string]: unknown;
  };
}

/**
 * Media Player State
 */
export interface MediaPlayerState extends Entity {
  attributes: {
    media_title?: string;
    media_artist?: string;
    media_album_name?: string;
    app_name?: string;
    volume_level?: number;
    is_volume_muted?: boolean;
    supported_features?: number;
    source?: string;
    source_list?: string[];
    [key: string]: unknown;
  };
}

/**
 * Weather State
 */
export interface WeatherState extends Entity {
  attributes: {
    temperature?: number;
    humidity?: number;
    pressure?: number;
    wind_speed?: number;
    wind_bearing?: number;
    forecast?: WeatherForecast[];
    [key: string]: unknown;
  };
}

/**
 * Weather Forecast Entry
 */
export interface WeatherForecast {
  datetime: string;
  temperature?: number;
  templow?: number;
  humidity?: number;
  precipitation?: number;
  wind_speed?: number;
  condition: string;
}

/**
 * Sensor State
 */
export interface SensorState extends Entity {
  attributes: {
    unit_of_measurement?: string;
    device_class?: string;
    icon?: string;
    [key: string]: unknown;
  };
}

/**
 * Binary Sensor State
 */
export interface BinarySensorState extends Entity {
  attributes: {
    device_class?: string;
    icon?: string;
    [key: string]: unknown;
  };
}

/**
 * Fetch request options
 */
export interface FetchOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  signal?: AbortSignal;
}
