/**
 * Plugin System
 *
 * Provides a flexible plugin architecture for extending Folk Care functionality.
 *
 * @example
 * ```typescript
 * import { definePlugin, getPluginRegistry } from '@folkcare/core';
 *
 * // Define a plugin
 * const myPlugin = definePlugin({
 *   metadata: {
 *     id: 'my-custom-plugin',
 *     name: 'My Custom Plugin',
 *     version: '1.0.0',
 *     description: 'Adds custom functionality',
 *     category: 'utility',
 *     capabilities: {
 *       routes: true,
 *     },
 *   },
 *   async initialize(context) {
 *     context.logger.info('Plugin initialized');
 *   },
 *   registerRoutes(router, context) {
 *     router.get('/status', (req, res) => {
 *       res.json({ status: 'ok' });
 *     });
 *   },
 *   getRouteOptions() {
 *     return {
 *       basePath: '/api/my-plugin',
 *     };
 *   },
 * });
 *
 * // Register the plugin
 * const registry = getPluginRegistry();
 * registry.register(myPlugin);
 * ```
 */

// Types
export type {
  Plugin,
  PluginMetadata,
  PluginConfig,
  PluginConfigSchema,
  PluginContext,
  PluginState,
  PluginPriority,
  PluginCategory,
  PluginCapabilities,
  PluginHealthStatus,
  PluginRegistrationResult,
  PluginRegistry,
  PluginLoaderConfig,
  PluginRouteOptions,
  PluginMiddlewareOptions,
  PluginMigration,
  PluginDatabaseContext,
  PluginServiceRegistry,
  PluginEventEmitter,
  PluginLogger,
  SystemEvent,
  PluginEventData,
} from './types.js';

// Utility functions
export { definePlugin } from './types.js';

// Registry
export {
  DefaultPluginRegistry,
  getPluginRegistry,
  resetPluginRegistry,
  createPluginDatabaseContext,
} from './plugin-registry.js';

// Loader
export {
  loadPlugins,
  initializePluginSystem,
  shutdownPluginSystem,
  getPluginSystemHealth,
} from './plugin-loader.js';
