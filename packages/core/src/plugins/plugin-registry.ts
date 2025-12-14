/**
 * Plugin Registry
 *
 * Manages registration, lifecycle, and coordination of plugins.
 */

import type { Express, Router } from 'express';
import type { Knex } from 'knex';
import { EventEmitter } from 'node:events';
import express from 'express';
import { logger } from '../utils/logger.js';
import type {
  Plugin,
  PluginMetadata,
  PluginState,
  PluginCategory,
  PluginConfig,
  PluginContext,
  PluginHealthStatus,
  PluginRegistrationResult,
  PluginRegistry,
  PluginServiceRegistry,
  PluginEventEmitter,
  PluginLogger,
  PluginDatabaseContext,
  PluginMiddlewareOptions,
  PluginPriority,
} from './types.js';

/**
 * Priority order for sorting
 */
const PRIORITY_ORDER: Record<PluginPriority, number> = {
  critical: 0,
  high: 1,
  normal: 2,
  low: 3,
};

/**
 * Internal plugin entry
 */
interface PluginEntry {
  plugin: Plugin;
  config: PluginConfig;
  state: PluginState;
  error?: Error;
  initializedAt?: Date;
  startedAt?: Date;
}

/**
 * Default plugin registry implementation
 */
export class DefaultPluginRegistry implements PluginRegistry {
  private plugins: Map<string, PluginEntry> = new Map();
  private services: Map<string, unknown> = new Map();
  private eventEmitter: EventEmitter = new EventEmitter();
  private context: Omit<PluginContext, 'config' | 'logger'> | null = null;

  /**
   * Register a plugin
   */
  register(plugin: Plugin, config?: Partial<PluginConfig>): PluginRegistrationResult {
    const pluginId = plugin.metadata.id;

    // Check if already registered
    if (this.plugins.has(pluginId)) {
      return {
        success: false,
        pluginId,
        state: 'error',
        error: new Error(`Plugin ${pluginId} is already registered`),
      };
    }

    // Validate metadata
    const validationError = this.validatePluginMetadata(plugin.metadata);
    if (validationError !== null) {
      return {
        success: false,
        pluginId,
        state: 'error',
        error: validationError,
      };
    }

    // Merge config with defaults
    const mergedConfig: PluginConfig = {
      enabled: config?.enabled ?? true,
      settings: config?.settings ?? {},
    };

    // Register the plugin
    this.plugins.set(pluginId, {
      plugin,
      config: mergedConfig,
      state: 'registered',
    });

    logger.info({ version: plugin.metadata.version, category: plugin.metadata.category }, `Plugin registered: ${pluginId}`);

    // Emit event
    this.eventEmitter.emit('plugin:registered', {
      pluginId,
      timestamp: new Date(),
      data: plugin.metadata,
    });

    return {
      success: true,
      pluginId,
      state: 'registered',
    };
  }

  /**
   * Unregister a plugin
   */
  unregister(pluginId: string): boolean {
    const entry = this.plugins.get(pluginId);
    if (entry === undefined) {
      return false;
    }

    // Stop the plugin if running
    if (entry.state === 'active' && entry.plugin.stop !== undefined) {
      entry.plugin.stop().catch((err: unknown) => {
        logger.error({ err, pluginId }, `Error stopping plugin during unregister`);
      });
    }

    this.plugins.delete(pluginId);
    logger.info({ pluginId }, 'Plugin unregistered');

    return true;
  }

  /**
   * Get a plugin by ID
   */
  get(pluginId: string): Plugin | undefined {
    return this.plugins.get(pluginId)?.plugin;
  }

  /**
   * Check if a plugin is registered
   */
  has(pluginId: string): boolean {
    return this.plugins.has(pluginId);
  }

  /**
   * Get plugin state
   */
  getState(pluginId: string): PluginState | undefined {
    return this.plugins.get(pluginId)?.state;
  }

  /**
   * List all registered plugins
   */
  list(): PluginMetadata[] {
    return Array.from(this.plugins.values()).map((entry) => entry.plugin.metadata);
  }

  /**
   * List plugins by category
   */
  listByCategory(category: PluginCategory): PluginMetadata[] {
    return Array.from(this.plugins.values())
      .filter((entry) => entry.plugin.metadata.category === category)
      .map((entry) => entry.plugin.metadata);
  }

  /**
   * Initialize all registered plugins
   */
  async initializeAll(context: Omit<PluginContext, 'config' | 'logger'>): Promise<void> {
    this.context = context;

    // Get enabled plugins sorted by dependencies and priority
    const sortedPlugins = this.sortPluginsByDependencies();

    for (const entry of sortedPlugins) {
      if (entry.config.enabled !== true) {
        entry.state = 'disabled';
        continue;
      }

      await this.initializePlugin(entry);
    }
  }

  /**
   * Start all initialized plugins
   */
  async startAll(): Promise<void> {
    const startPromises: Promise<void>[] = [];

    for (const entry of this.plugins.values()) {
      if (entry.state === 'active' && entry.plugin.start !== undefined) {
        const promise = this.startPlugin(entry);
        startPromises.push(promise);
      }
    }

    await Promise.all(startPromises);
  }

  /**
   * Start a single plugin
   */
  private async startPlugin(entry: PluginEntry): Promise<void> {
    try {
      await entry.plugin.start?.();
      entry.startedAt = new Date();
      this.eventEmitter.emit('plugin:started', {
        pluginId: entry.plugin.metadata.id,
        timestamp: new Date(),
      });
    } catch (err) {
      logger.error({ err, pluginId: entry.plugin.metadata.id }, 'Error starting plugin');
      entry.state = 'error';
      entry.error = err instanceof Error ? err : new Error(String(err));
    }
  }

  /**
   * Stop all running plugins
   */
  async stopAll(): Promise<void> {
    const stopPromises: Promise<void>[] = [];

    for (const entry of this.plugins.values()) {
      if (entry.state === 'active' && entry.plugin.stop !== undefined) {
        const promise = this.stopPlugin(entry);
        stopPromises.push(promise);
      }
    }

    await Promise.all(stopPromises);
  }

  /**
   * Stop a single plugin
   */
  private async stopPlugin(entry: PluginEntry): Promise<void> {
    try {
      await entry.plugin.stop?.();
      this.eventEmitter.emit('plugin:stopped', {
        pluginId: entry.plugin.metadata.id,
        timestamp: new Date(),
      });
    } catch (err) {
      logger.error({ err, pluginId: entry.plugin.metadata.id }, 'Error stopping plugin');
    }
  }

  /**
   * Get health status of all plugins
   */
  async healthCheck(): Promise<Map<string, PluginHealthStatus>> {
    const results = new Map<string, PluginHealthStatus>();

    for (const [pluginId, entry] of this.plugins) {
      if (entry.state !== 'active') {
        results.set(pluginId, {
          healthy: false,
          message: `Plugin is ${entry.state}`,
        });
        continue;
      }

      if (entry.plugin.healthCheck !== undefined) {
        try {
          const status = await entry.plugin.healthCheck();
          results.set(pluginId, status);
        } catch (err) {
          results.set(pluginId, {
            healthy: false,
            message: `Health check failed: ${err instanceof Error ? err.message : String(err)}`,
          });
        }
      } else {
        results.set(pluginId, { healthy: true });
      }
    }

    return results;
  }

  /**
   * Get the service registry
   */
  getServiceRegistry(): PluginServiceRegistry {
    return {
      register: <T>(name: string, service: T) => {
        this.services.set(name, service);
      },
      get: <T>(name: string) => this.services.get(name) as T | undefined,
      has: (name: string) => this.services.has(name),
      list: () => Array.from(this.services.keys()),
    };
  }

  /**
   * Get the event emitter
   */
  getEventEmitter(): PluginEventEmitter {
    return {
      emit: (event: string, data?: unknown) => {
        this.eventEmitter.emit(event, data);
      },
      on: (event: string, handler: (data?: unknown) => void) => {
        this.eventEmitter.on(event, handler);
      },
      off: (event: string, handler: (data?: unknown) => void) => {
        this.eventEmitter.off(event, handler);
      },
      once: (event: string, handler: (data?: unknown) => void) => {
        this.eventEmitter.once(event, handler);
      },
    };
  }

  /**
   * Register plugin routes
   */
  registerPluginRoutes(app: Express, _db: Knex): void {
    if (this.context === null) {
      throw new Error('Context not initialized');
    }

    for (const entry of this.plugins.values()) {
      const hasRouteCapability = entry.plugin.metadata.capabilities.routes === true;
      if (
        entry.state !== 'active' ||
        entry.plugin.registerRoutes === undefined ||
        !hasRouteCapability
      ) {
        continue;
      }

      const router: Router = express.Router();
      const pluginContext = this.createPluginContext(entry);

      entry.plugin.registerRoutes(router, pluginContext);

      const routeOptions = entry.plugin.getRouteOptions?.() ?? {
        basePath: `/api/plugins/${entry.plugin.metadata.id}`,
      };

      app.use(routeOptions.basePath, router);

      logger.info({ pluginId: entry.plugin.metadata.id, basePath: routeOptions.basePath }, 'Plugin routes registered');
    }
  }

  /**
   * Register plugin middleware
   */
  registerPluginMiddleware(
    app: Express,
    phase: PluginMiddlewareOptions['phase']
  ): void {
    const middlewarePlugins = Array.from(this.plugins.values())
      .filter(
        (entry) =>
          entry.state === 'active' &&
          entry.plugin.registerMiddleware !== undefined &&
          entry.plugin.metadata.capabilities.middleware === true
      )
      .sort((a, b) => {
        const priorityA = PRIORITY_ORDER[a.plugin.metadata.capabilities.middleware === true ? 'normal' : 'low'];
        const priorityB = PRIORITY_ORDER[b.plugin.metadata.capabilities.middleware === true ? 'normal' : 'low'];
        return priorityA - priorityB;
      });

    for (const entry of middlewarePlugins) {
      const options: PluginMiddlewareOptions = {
        priority: 'normal',
        phase,
      };

      // We've already filtered to ensure registerMiddleware exists
      const middleware = entry.plugin.registerMiddleware!(app, options);

      if (Array.isArray(middleware)) {
        for (const m of middleware) {
          app.use(m);
        }
      } else {
        app.use(middleware);
      }

      logger.info({ pluginId: entry.plugin.metadata.id, phase }, 'Plugin middleware registered');
    }
  }

  /**
   * Initialize a single plugin
   */
  private async initializePlugin(entry: PluginEntry): Promise<void> {
    const pluginId = entry.plugin.metadata.id;
    entry.state = 'initializing';

    try {
      // Check dependencies
      const missingDeps = this.checkDependencies(entry.plugin);
      if (missingDeps.length > 0) {
        throw new Error(`Missing dependencies: ${missingDeps.join(', ')}`);
      }

      // Create plugin context
      const pluginContext = this.createPluginContext(entry);

      // Run migrations if any
      const hasMigrations = entry.plugin.metadata.capabilities.migrations === true;
      if (entry.plugin.getMigrations !== undefined && hasMigrations) {
        await this.runPluginMigrations(entry.plugin, pluginContext.database);
      }

      // Initialize the plugin
      await entry.plugin.initialize(pluginContext);

      entry.state = 'active';
      entry.initializedAt = new Date();

      logger.info({ pluginId }, 'Plugin initialized');
    } catch (err) {
      entry.state = 'error';
      entry.error = err instanceof Error ? err : new Error(String(err));

      logger.error({ err: entry.error, pluginId }, 'Failed to initialize plugin');

      this.eventEmitter.emit('plugin:error', {
        pluginId,
        timestamp: new Date(),
        data: { error: entry.error.message },
      });
    }
  }

  /**
   * Create plugin context
   */
  private createPluginContext(entry: PluginEntry): PluginContext {
    if (this.context === null) {
      throw new Error('Registry context not initialized');
    }

    return {
      ...this.context,
      config: entry.config,
      logger: this.createPluginLogger(entry.plugin.metadata.id),
    };
  }

  /**
   * Create a logger for a plugin
   */
  private createPluginLogger(pluginId: string): PluginLogger {
    return {
      debug: (message: string, data?: Record<string, unknown>) => {
        logger.debug({ pluginId, ...data }, message);
      },
      info: (message: string, data?: Record<string, unknown>) => {
        logger.info({ pluginId, ...data }, message);
      },
      warn: (message: string, data?: Record<string, unknown>) => {
        logger.warn({ pluginId, ...data }, message);
      },
      error: (message: string, error?: Error, data?: Record<string, unknown>) => {
        logger.error({ pluginId, err: error, ...data }, message);
      },
    };
  }

  /**
   * Run plugin migrations
   */
  private async runPluginMigrations(
    plugin: Plugin,
    dbContext: PluginDatabaseContext
  ): Promise<void> {
    const migrations = plugin.getMigrations?.() ?? [];

    for (const migration of migrations) {
      const hasRun = await dbContext.hasMigration(migration.id);
      if (!hasRun) {
        await dbContext.runMigration(migration);
        logger.info({ migrationId: migration.id, pluginId: plugin.metadata.id }, 'Plugin migration applied');
      }
    }
  }

  /**
   * Check plugin dependencies
   */
  private checkDependencies(plugin: Plugin): string[] {
    const missing: string[] = [];
    const dependencies = plugin.metadata.dependencies ?? [];

    for (const dep of dependencies) {
      const depEntry = this.plugins.get(dep);
      if (depEntry === undefined || depEntry.state === 'disabled' || depEntry.state === 'error') {
        missing.push(dep);
      }
    }

    return missing;
  }

  /**
   * Sort plugins by dependencies (topological sort)
   */
  private sortPluginsByDependencies(): PluginEntry[] {
    const entries = Array.from(this.plugins.values());
    const sorted: PluginEntry[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (entry: PluginEntry): void => {
      const id = entry.plugin.metadata.id;

      if (visited.has(id)) return;
      if (visiting.has(id)) {
        throw new Error(`Circular dependency detected: ${id}`);
      }

      visiting.add(id);

      const dependencies = entry.plugin.metadata.dependencies ?? [];
      for (const depId of dependencies) {
        const depEntry = this.plugins.get(depId);
        if (depEntry !== undefined) {
          visit(depEntry);
        }
      }

      visiting.delete(id);
      visited.add(id);
      sorted.push(entry);
    };

    for (const entry of entries) {
      visit(entry);
    }

    return sorted;
  }

  /**
   * Validate plugin metadata
   */
  private validatePluginMetadata(metadata: PluginMetadata): Error | null {
    if (metadata.id === '' || typeof metadata.id !== 'string') {
      return new Error('Plugin must have a valid id');
    }

    if (metadata.name === '' || typeof metadata.name !== 'string') {
      return new Error('Plugin must have a valid name');
    }

    if (metadata.version === '' || typeof metadata.version !== 'string') {
      return new Error('Plugin must have a valid version');
    }

    // Category is required - the type system enforces this is always present
    // so no runtime check is needed

    return null;
  }
}

/**
 * Create database context for plugins
 */
export function createPluginDatabaseContext(db: Knex): PluginDatabaseContext {
  return {
    db,
    runMigration: async (migration) => {
      await db.transaction(async (trx) => {
        await migration.up(trx);
        await trx('plugin_migrations').insert({
          id: `${Date.now()}-${migration.id}`,
          plugin_id: migration.id.split(':')[0],
          migration_id: migration.id,
          applied_at: new Date(),
        });
      });
    },
    hasMigration: async (migrationId) => {
      // Check if migrations table exists
      const hasTable = await db.schema.hasTable('plugin_migrations');
      if (!hasTable) {
        // Create the table if it doesn't exist
        await db.schema.createTable('plugin_migrations', (table) => {
          table.string('id').primary();
          table.string('plugin_id').notNullable();
          table.string('migration_id').notNullable().unique();
          table.timestamp('applied_at').notNullable();
        });
        return false;
      }

      const result = await db('plugin_migrations')
        .where({ migration_id: migrationId })
        .first();
      return result !== undefined;
    },
  };
}

// Singleton instance
let registryInstance: DefaultPluginRegistry | null = null;

/**
 * Get the plugin registry singleton
 */
export function getPluginRegistry(): DefaultPluginRegistry {
  registryInstance ??= new DefaultPluginRegistry();
  return registryInstance;
}

/**
 * Reset the plugin registry (for testing)
 */
export function resetPluginRegistry(): void {
  registryInstance = null;
}
