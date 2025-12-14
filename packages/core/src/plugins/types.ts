/**
 * Plugin Architecture Types
 *
 * Defines the interfaces and types for the Folk Care plugin system.
 * Plugins can extend functionality through middleware, routes, services,
 * and providers without modifying core application code.
 */

import type { Express, Router, RequestHandler } from 'express';
import type { Knex } from 'knex';

/**
 * Plugin lifecycle state
 */
export type PluginState =
  | 'registered'   // Plugin has been registered but not initialized
  | 'initializing' // Plugin is currently initializing
  | 'active'       // Plugin is fully initialized and running
  | 'error'        // Plugin encountered an error
  | 'disabled';    // Plugin is disabled

/**
 * Plugin priority for ordering
 * Lower numbers execute first
 */
export type PluginPriority = 'critical' | 'high' | 'normal' | 'low';

/**
 * Plugin category for organization
 */
export type PluginCategory =
  | 'analytics'       // Analytics and reporting extensions
  | 'authentication'  // Authentication providers
  | 'billing'         // Billing and payment extensions
  | 'communication'   // Notification and messaging
  | 'compliance'      // Regulatory compliance extensions
  | 'integration'     // Third-party integrations
  | 'scheduling'      // Scheduling enhancements
  | 'workflow'        // Custom workflows
  | 'utility'         // General utilities
  | 'other';          // Uncategorized

/**
 * Plugin capability flags
 */
export interface PluginCapabilities {
  /** Plugin registers Express middleware */
  middleware?: boolean;
  /** Plugin registers API routes */
  routes?: boolean;
  /** Plugin provides services */
  services?: boolean;
  /** Plugin implements provider interfaces */
  providers?: boolean;
  /** Plugin adds database migrations */
  migrations?: boolean;
  /** Plugin subscribes to system events */
  events?: boolean;
  /** Plugin provides CLI commands */
  commands?: boolean;
}

/**
 * Plugin metadata
 */
export interface PluginMetadata {
  /** Unique plugin identifier (npm package name or custom) */
  id: string;
  /** Human-readable plugin name */
  name: string;
  /** Plugin version (semver) */
  version: string;
  /** Plugin description */
  description: string;
  /** Plugin author */
  author?: string;
  /** Plugin license */
  license?: string;
  /** Plugin homepage/documentation URL */
  homepage?: string;
  /** Plugin repository URL */
  repository?: string;
  /** Plugin category */
  category: PluginCategory;
  /** Plugin capabilities */
  capabilities: PluginCapabilities;
  /** Required Folk Care version (semver range) */
  folkCareVersion?: string;
  /** Plugin dependencies (other plugin IDs) */
  dependencies?: string[];
  /** Tags for discoverability */
  tags?: string[];
}

/**
 * Plugin configuration schema
 */
export interface PluginConfigSchema {
  /** Configuration properties */
  properties: Record<
    string,
    {
      type: 'string' | 'number' | 'boolean' | 'object' | 'array';
      description?: string;
      default?: unknown;
      required?: boolean;
      enum?: unknown[];
    }
  >;
}

/**
 * Plugin configuration
 */
export interface PluginConfig {
  /** Enable/disable the plugin */
  enabled: boolean;
  /** Plugin-specific configuration */
  settings: Record<string, unknown>;
}

/**
 * Database context for plugins
 */
export interface PluginDatabaseContext {
  /** Knex database instance */
  db: Knex;
  /** Run a migration */
  runMigration: (migration: PluginMigration) => Promise<void>;
  /** Check if a migration has been applied */
  hasMigration: (migrationId: string) => Promise<boolean>;
}

/**
 * Plugin migration
 */
export interface PluginMigration {
  /** Unique migration identifier */
  id: string;
  /** Migration name */
  name: string;
  /** Apply the migration */
  up: (db: Knex) => Promise<void>;
  /** Revert the migration */
  down: (db: Knex) => Promise<void>;
}

/**
 * Service registry for plugins
 */
export interface PluginServiceRegistry {
  /** Register a service */
  register: <T>(name: string, service: T) => void;
  /** Get a service */
  get: <T>(name: string) => T | undefined;
  /** Check if a service exists */
  has: (name: string) => boolean;
  /** List all registered services */
  list: () => string[];
}

/**
 * Event emitter for plugins
 */
export interface PluginEventEmitter {
  /** Emit an event */
  emit: (event: string, data?: unknown) => void;
  /** Subscribe to an event */
  on: (event: string, handler: (data?: unknown) => void | Promise<void>) => void;
  /** Unsubscribe from an event */
  off: (event: string, handler: (data?: unknown) => void | Promise<void>) => void;
  /** Subscribe to an event once */
  once: (event: string, handler: (data?: unknown) => void | Promise<void>) => void;
}

/**
 * Logger for plugins
 */
export interface PluginLogger {
  debug: (message: string, data?: Record<string, unknown>) => void;
  info: (message: string, data?: Record<string, unknown>) => void;
  warn: (message: string, data?: Record<string, unknown>) => void;
  error: (message: string, error?: Error, data?: Record<string, unknown>) => void;
}

/**
 * Context provided to plugins during initialization
 */
export interface PluginContext {
  /** Express application instance */
  app: Express;
  /** Database context */
  database: PluginDatabaseContext;
  /** Service registry */
  services: PluginServiceRegistry;
  /** Event emitter */
  events: PluginEventEmitter;
  /** Plugin-specific logger */
  logger: PluginLogger;
  /** Plugin configuration */
  config: PluginConfig;
  /** Environment (development, test, production) */
  environment: 'development' | 'test' | 'production';
  /** Folk Care version */
  folkCareVersion: string;
}

/**
 * Route registration options
 */
export interface PluginRouteOptions {
  /** Base path for routes (e.g., '/api/my-plugin') */
  basePath: string;
  /** Rate limiter to apply (optional) */
  rateLimiter?: RequestHandler;
  /** Whether routes require authentication (default: true) */
  requireAuth?: boolean;
}

/**
 * Middleware registration options
 */
export interface PluginMiddlewareOptions {
  /** Middleware priority */
  priority?: PluginPriority;
  /** Path pattern to apply middleware to (default: all routes) */
  path?: string;
  /** Apply before or after core middleware */
  phase?: 'before-auth' | 'after-auth' | 'before-routes' | 'after-routes';
}

/**
 * Plugin interface
 *
 * All plugins must implement this interface.
 */
export interface Plugin {
  /** Plugin metadata */
  readonly metadata: PluginMetadata;

  /** Plugin configuration schema (optional) */
  readonly configSchema?: PluginConfigSchema;

  /**
   * Initialize the plugin
   * Called once when the plugin is loaded
   */
  initialize(context: PluginContext): Promise<void>;

  /**
   * Register middleware (optional)
   * Called after initialize if capabilities.middleware is true
   */
  registerMiddleware?(
    app: Express,
    options: PluginMiddlewareOptions
  ): RequestHandler | RequestHandler[];

  /**
   * Register routes (optional)
   * Called after initialize if capabilities.routes is true
   */
  registerRoutes?(router: Router, context: PluginContext): void;

  /**
   * Get route options (optional)
   * Returns configuration for route registration
   */
  getRouteOptions?(): PluginRouteOptions;

  /**
   * Get migrations (optional)
   * Returns database migrations to run
   */
  getMigrations?(): PluginMigration[];

  /**
   * Start the plugin (optional)
   * Called after all plugins are initialized
   */
  start?(): Promise<void>;

  /**
   * Stop the plugin (optional)
   * Called during graceful shutdown
   */
  stop?(): Promise<void>;

  /**
   * Health check (optional)
   * Returns plugin health status
   */
  healthCheck?(): Promise<PluginHealthStatus>;
}

/**
 * Plugin health status
 */
export interface PluginHealthStatus {
  healthy: boolean;
  message?: string;
  details?: Record<string, unknown>;
}

/**
 * Plugin registration result
 */
export interface PluginRegistrationResult {
  success: boolean;
  pluginId: string;
  state: PluginState;
  error?: Error;
}

/**
 * Plugin registry interface
 */
export interface PluginRegistry {
  /** Register a plugin */
  register(plugin: Plugin, config?: Partial<PluginConfig>): PluginRegistrationResult;

  /** Unregister a plugin */
  unregister(pluginId: string): boolean;

  /** Get a plugin by ID */
  get(pluginId: string): Plugin | undefined;

  /** Check if a plugin is registered */
  has(pluginId: string): boolean;

  /** Get plugin state */
  getState(pluginId: string): PluginState | undefined;

  /** List all registered plugins */
  list(): PluginMetadata[];

  /** List plugins by category */
  listByCategory(category: PluginCategory): PluginMetadata[];

  /** Initialize all registered plugins */
  initializeAll(context: Omit<PluginContext, 'config' | 'logger'>): Promise<void>;

  /** Start all initialized plugins */
  startAll(): Promise<void>;

  /** Stop all running plugins */
  stopAll(): Promise<void>;

  /** Get health status of all plugins */
  healthCheck(): Promise<Map<string, PluginHealthStatus>>;
}

/**
 * Plugin loader configuration
 */
export interface PluginLoaderConfig {
  /** Directory to scan for plugins */
  pluginDir?: string;
  /** Plugin package names to load */
  packages?: string[];
  /** Plugin configurations by ID */
  configs?: Record<string, Partial<PluginConfig>>;
  /** Auto-discover plugins in node_modules */
  autoDiscover?: boolean;
  /** Plugin name pattern for auto-discovery */
  discoveryPattern?: string;
}

/**
 * Built-in system events that plugins can subscribe to
 */
export type SystemEvent =
  | 'app:starting'      // Application is starting
  | 'app:started'       // Application has started
  | 'app:stopping'      // Application is stopping
  | 'app:stopped'       // Application has stopped
  | 'db:connected'      // Database connected
  | 'db:disconnected'   // Database disconnected
  | 'user:created'      // User was created
  | 'user:updated'      // User was updated
  | 'user:deleted'      // User was deleted
  | 'client:created'    // Client was created
  | 'client:updated'    // Client was updated
  | 'visit:started'     // Visit started
  | 'visit:completed'   // Visit completed
  | 'invoice:created'   // Invoice was created
  | 'invoice:paid'      // Invoice was paid
  | 'plugin:registered' // Plugin was registered
  | 'plugin:started'    // Plugin was started
  | 'plugin:stopped'    // Plugin was stopped
  | 'plugin:error';     // Plugin encountered an error

/**
 * Event data for plugin events
 */
export interface PluginEventData {
  pluginId: string;
  timestamp: Date;
  data?: unknown;
}

/**
 * Create a plugin with type checking
 */
export function definePlugin(plugin: Plugin): Plugin {
  return plugin;
}
