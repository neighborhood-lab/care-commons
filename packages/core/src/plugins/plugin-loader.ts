/**
 * Plugin Loader
 *
 * Discovers and loads plugins from various sources:
 * - Local directories
 * - npm packages
 * - Plugin configurations
 */

import { pathToFileURL } from 'node:url';
import { logger } from '../utils/logger.js';
import {
  getPluginRegistry,
  createPluginDatabaseContext,
} from './plugin-registry.js';
import type {
  Plugin,
  PluginLoaderConfig,
  PluginContext,
} from './types.js';
import type { Express } from 'express';
import type { Knex } from 'knex';

// Folk Care version for compatibility
const FOLK_CARE_VERSION = '0.1.0';

/**
 * Load plugins from package list
 */
async function loadFromPackages(
  config: PluginLoaderConfig
): Promise<void> {
  const registry = getPluginRegistry();
  const packages = config.packages;

  if (packages === undefined || packages.length === 0) {
    return;
  }

  for (const packageName of packages) {
    try {
      const plugin = await loadPluginFromPackage(packageName);
      if (plugin !== null) {
        const pluginConfig = config.configs?.[plugin.metadata.id];
        registry.register(plugin, pluginConfig);
      }
    } catch (err) {
      logger.error({ err: err instanceof Error ? err : undefined, packageName }, 'Failed to load plugin package');
    }
  }
}

/**
 * Load plugins from directory
 */
async function loadFromDirectory(
  config: PluginLoaderConfig
): Promise<void> {
  const registry = getPluginRegistry();
  const pluginDir = config.pluginDir;

  if (pluginDir === undefined || pluginDir === '') {
    return;
  }

  try {
    const plugins = await loadPluginsFromDirectory(pluginDir);
    for (const plugin of plugins) {
      const pluginConfig = config.configs?.[plugin.metadata.id];
      registry.register(plugin, pluginConfig);
    }
  } catch (err) {
    logger.error({ err: err instanceof Error ? err : undefined, pluginDir }, 'Failed to load plugins from directory');
  }
}

/**
 * Auto-discover plugins from node_modules
 */
async function autoDiscoverPlugins(
  config: PluginLoaderConfig
): Promise<void> {
  const registry = getPluginRegistry();

  if (config.autoDiscover !== true) {
    return;
  }

  try {
    const pattern = config.discoveryPattern ?? '@folkcare/plugin-*';
    const plugins = await discoverPlugins(pattern);
    for (const plugin of plugins) {
      if (!registry.has(plugin.metadata.id)) {
        const pluginConfig = config.configs?.[plugin.metadata.id];
        registry.register(plugin, pluginConfig);
      }
    }
  } catch (err) {
    logger.error({ err: err instanceof Error ? err : undefined }, 'Failed to auto-discover plugins');
  }
}

/**
 * Load plugins from configuration
 */
export async function loadPlugins(config: PluginLoaderConfig): Promise<void> {
  await loadFromPackages(config);
  await loadFromDirectory(config);
  await autoDiscoverPlugins(config);
}

/**
 * Load a plugin from an npm package
 */
async function loadPluginFromPackage(packageName: string): Promise<Plugin | null> {
  try {
    const module = await import(packageName);
    const plugin = module.default ?? module.plugin ?? module;

    if (!isValidPlugin(plugin)) {
      logger.warn({ packageName }, 'Package does not export a valid plugin');
      return null;
    }

    return plugin;
  } catch (err) {
    logger.error({ err: err instanceof Error ? err : undefined, packageName }, 'Failed to load plugin from package');
    return null;
  }
}

/**
 * Process a single plugin directory entry
 */
async function processPluginEntry(
  fs: typeof import('node:fs/promises'),
  path: typeof import('node:path'),
  dir: string,
  entryName: string
): Promise<Plugin | null> {
  const pluginDir = path.join(dir, entryName);
  const packageJsonPath = path.join(pluginDir, 'package.json');

  try {
    const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8');
    const packageJson = JSON.parse(packageJsonContent) as Record<string, unknown>;

    // Check if this is a Folk Care plugin
    const folkcare = packageJson['folkcare'] as Record<string, unknown> | undefined;
    if (folkcare?.['plugin'] !== true) {
      return null;
    }

    const mainFile = (packageJson['main'] as string | undefined) ?? 'index.js';
    const mainPath = path.join(pluginDir, mainFile);

    const module = await import(pathToFileURL(mainPath).href);
    const plugin = module.default ?? module.plugin ?? module;

    if (isValidPlugin(plugin)) {
      return plugin;
    }
    return null;
  } catch {
    // Skip directories that aren't valid plugins
    return null;
  }
}

/**
 * Load plugins from a directory
 */
async function loadPluginsFromDirectory(dir: string): Promise<Plugin[]> {
  const plugins: Plugin[] = [];

  try {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');

    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }

      const plugin = await processPluginEntry(fs, path, dir, entry.name);
      if (plugin !== null) {
        plugins.push(plugin);
      }
    }
  } catch (err) {
    logger.error({ err: err instanceof Error ? err : undefined, dir }, 'Failed to read plugin directory');
  }

  return plugins;
}

/**
 * Discover plugins from node_modules
 */
async function discoverPlugins(pattern: string): Promise<Plugin[]> {
  const plugins: Plugin[] = [];

  // This is a simplified implementation
  // In production, you might use glob or walk node_modules
  logger.debug({ pattern }, 'Plugin auto-discovery');

  return plugins;
}

/**
 * Check if an object is a valid plugin
 */
function isValidPlugin(obj: unknown): obj is Plugin {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return false;
  }

  const plugin = obj as Partial<Plugin>;
  const metadata = plugin.metadata;

  if (metadata === undefined || typeof metadata !== 'object') {
    return false;
  }

  return (
    typeof metadata.id === 'string' &&
    typeof metadata.name === 'string' &&
    typeof metadata.version === 'string' &&
    typeof plugin.initialize === 'function'
  );
}

/**
 * Initialize the plugin system
 */
export async function initializePluginSystem(
  app: Express,
  db: Knex,
  config?: PluginLoaderConfig
): Promise<void> {
  const registry = getPluginRegistry();

  // Load plugins from config
  if (config !== undefined) {
    await loadPlugins(config);
  }

  // Create context
  const nodeEnv = process.env['NODE_ENV'];
  const environment: 'development' | 'test' | 'production' =
    nodeEnv === 'production' || nodeEnv === 'test' ? nodeEnv : 'development';

  const context: Omit<PluginContext, 'config' | 'logger'> = {
    app,
    database: createPluginDatabaseContext(db),
    services: registry.getServiceRegistry(),
    events: registry.getEventEmitter(),
    environment,
    folkCareVersion: FOLK_CARE_VERSION,
  };

  // Emit app starting event
  registry.getEventEmitter().emit('app:starting', { timestamp: new Date() });

  // Initialize all plugins
  await registry.initializeAll(context);

  // Register middleware (before-routes phase)
  registry.registerPluginMiddleware(app, 'before-routes');

  // Register routes
  registry.registerPluginRoutes(app, db);

  // Register middleware (after-routes phase)
  registry.registerPluginMiddleware(app, 'after-routes');

  // Start all plugins
  await registry.startAll();

  // Emit app started event
  registry.getEventEmitter().emit('app:started', { timestamp: new Date() });

  logger.info({ pluginCount: registry.list().length, plugins: registry.list().map((p) => p.id) }, 'Plugin system initialized');
}

/**
 * Shutdown the plugin system
 */
export async function shutdownPluginSystem(): Promise<void> {
  const registry = getPluginRegistry();

  // Emit app stopping event
  registry.getEventEmitter().emit('app:stopping', { timestamp: new Date() });

  // Stop all plugins
  await registry.stopAll();

  // Emit app stopped event
  registry.getEventEmitter().emit('app:stopped', { timestamp: new Date() });

  logger.info('Plugin system shutdown complete');
}

/**
 * Get plugin system health
 */
export async function getPluginSystemHealth(): Promise<{
  healthy: boolean;
  plugins: Record<string, { healthy: boolean; message?: string }>;
}> {
  const registry = getPluginRegistry();
  const healthResults = await registry.healthCheck();

  const plugins: Record<string, { healthy: boolean; message?: string }> = {};
  let overallHealthy = true;

  for (const [pluginId, status] of healthResults) {
    plugins[pluginId] = {
      healthy: status.healthy,
      message: status.message,
    };
    if (!status.healthy) {
      overallHealthy = false;
    }
  }

  return {
    healthy: overallHealthy,
    plugins,
  };
}
