/**
 * Feature Flag Service
 *
 * High-level service for feature flag evaluation and management.
 * Wraps OpenFeature SDK with convenient methods and caching.
 */

import { OpenFeature, Client as OpenFeatureClient } from '@openfeature/server-sdk';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { JsonFileFeatureFlagProvider } from './provider.js';
import type {
  FeatureFlagConfig,
  FeatureFlag,
  FlagEvaluationContext,
  FlagEvaluationResult,
  UpdateFeatureFlagPayload,
  FeatureFlagKey,
} from './types.js';

/**
 * Feature flag service singleton
 */
export class FeatureFlagService {
  private static instance: FeatureFlagService;
  private client: OpenFeatureClient;
  private provider: JsonFileFeatureFlagProvider;
  private config: FeatureFlagConfig;
  private configPath: string;

  private constructor(configPath: string) {
    this.configPath = configPath;
    this.config = this.loadConfig(configPath);
    this.provider = new JsonFileFeatureFlagProvider(this.config);
    OpenFeature.setProvider(this.provider);
    this.client = OpenFeature.getClient();
  }

  /**
   * Initialize the feature flag service
   */
  static async initialize(configPath?: string): Promise<FeatureFlagService> {
    if (!FeatureFlagService.instance) {
      const path = configPath || join(process.cwd(), 'config', 'feature-flags.json');
      FeatureFlagService.instance = new FeatureFlagService(path);
      await FeatureFlagService.instance.provider.initialize();
    }
    return FeatureFlagService.instance;
  }

  /**
   * Get singleton instance
   */
  static getInstance(): FeatureFlagService {
    if (!FeatureFlagService.instance) {
      throw new Error('FeatureFlagService not initialized. Call initialize() first.');
    }
    return FeatureFlagService.instance;
  }

  /**
   * Load configuration from JSON file
   */
  private loadConfig(path: string): FeatureFlagConfig {
    try {
      if (!existsSync(path)) {
        // Return default empty config if file doesn't exist
        return {
          version: '1.0.0',
          environment: process.env.NODE_ENV || 'development',
          flags: [],
          lastUpdated: new Date().toISOString(),
        };
      }

      const content = readFileSync(path, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.error(`Failed to load feature flag config from ${path}:`, error);
      throw error;
    }
  }

  /**
   * Save configuration to JSON file
   */
  private saveConfig(): void {
    try {
      this.config.lastUpdated = new Date().toISOString();
      writeFileSync(this.configPath, JSON.stringify(this.config, null, 2), 'utf-8');
      this.provider.reloadConfig(this.config);
    } catch (error) {
      console.error(`Failed to save feature flag config to ${this.configPath}:`, error);
      throw error;
    }
  }

  /**
   * Reload configuration from disk
   */
  reloadConfig(): void {
    this.config = this.loadConfig(this.configPath);
    this.provider.reloadConfig(this.config);
  }

  /**
   * Get all flags
   */
  getAllFlags(): FeatureFlag[] {
    return this.config.flags;
  }

  /**
   * Get flag by key
   */
  getFlag(key: string): FeatureFlag | undefined {
    return this.config.flags.find((f) => f.key === key);
  }

  /**
   * Update flag
   */
  updateFlag(key: string, updates: UpdateFeatureFlagPayload): FeatureFlag {
    const flagIndex = this.config.flags.findIndex((f) => f.key === key);

    if (flagIndex === -1) {
      throw new Error(`Flag '${key}' not found`);
    }

    const existingFlag = this.config.flags[flagIndex];
    if (!existingFlag) {
      throw new Error(`Flag '${key}' not found`);
    }

    const updatedFlag: FeatureFlag = {
      key: existingFlag.key,
      name: existingFlag.name,
      description: existingFlag.description,
      type: existingFlag.type,
      defaultValue: existingFlag.defaultValue,
      enabled: existingFlag.enabled,
      createdAt: existingFlag.createdAt,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.config.flags[flagIndex] = updatedFlag;
    this.saveConfig();

    return updatedFlag;
  }

  /**
   * Create new flag
   */
  createFlag(flag: Omit<FeatureFlag, 'createdAt' | 'updatedAt'>): FeatureFlag {
    // Check if flag already exists
    if (this.config.flags.some((f) => f.key === flag.key)) {
      throw new Error(`Flag '${flag.key}' already exists`);
    }

    const newFlag: FeatureFlag = {
      ...flag,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.config.flags.push(newFlag);
    this.saveConfig();

    return newFlag;
  }

  /**
   * Delete flag
   */
  deleteFlag(key: string): void {
    const index = this.config.flags.findIndex((f) => f.key === key);

    if (index === -1) {
      throw new Error(`Flag '${key}' not found`);
    }

    this.config.flags.splice(index, 1);
    this.saveConfig();
  }

  /**
   * Evaluate boolean flag
   */
  async isFlagEnabled(
    key: FeatureFlagKey | string,
    context: FlagEvaluationContext = {},
    defaultValue = false
  ): Promise<boolean> {
    try {
      const result = await this.client.getBooleanValue(key, defaultValue, context as any);
      return result;
    } catch (error) {
      console.error(`Error evaluating flag '${key}':`, error);
      return defaultValue;
    }
  }

  /**
   * Evaluate boolean flag with details
   */
  async evaluateBooleanFlag(
    key: FeatureFlagKey | string,
    context: FlagEvaluationContext = {},
    defaultValue = false
  ): Promise<FlagEvaluationResult<boolean>> {
    try {
      const details = await this.client.getBooleanDetails(key, defaultValue, context as any);

      return {
        value: details.value,
        flagKey: details.flagKey,
        reason: details.reason || 'UNKNOWN',
        variant: details.variant,
        success: true,
      };
    } catch (error) {
      return {
        value: defaultValue,
        flagKey: key,
        reason: 'ERROR',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Evaluate string flag
   */
  async getStringFlag(
    key: FeatureFlagKey | string,
    context: FlagEvaluationContext = {},
    defaultValue = ''
  ): Promise<string> {
    try {
      const result = await this.client.getStringValue(key, defaultValue, context as any);
      return result;
    } catch (error) {
      console.error(`Error evaluating flag '${key}':`, error);
      return defaultValue;
    }
  }

  /**
   * Evaluate string flag with details
   */
  async evaluateStringFlag(
    key: FeatureFlagKey | string,
    context: FlagEvaluationContext = {},
    defaultValue = ''
  ): Promise<FlagEvaluationResult<string>> {
    try {
      const details = await this.client.getStringDetails(key, defaultValue, context as any);

      return {
        value: details.value,
        flagKey: details.flagKey,
        reason: details.reason || 'UNKNOWN',
        variant: details.variant,
        success: true,
      };
    } catch (error) {
      return {
        value: defaultValue,
        flagKey: key,
        reason: 'ERROR',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Evaluate number flag
   */
  async getNumberFlag(
    key: FeatureFlagKey | string,
    context: FlagEvaluationContext = {},
    defaultValue = 0
  ): Promise<number> {
    try {
      const result = await this.client.getNumberValue(key, defaultValue, context as any);
      return result;
    } catch (error) {
      console.error(`Error evaluating flag '${key}':`, error);
      return defaultValue;
    }
  }

  /**
   * Evaluate JSON/object flag
   */
  async getObjectFlag<T extends Record<string, unknown>>(
    key: FeatureFlagKey | string,
    context: FlagEvaluationContext = {},
    defaultValue: T
  ): Promise<T> {
    try {
      const result = await this.client.getObjectValue(key, defaultValue as any, context as any);
      return result as T;
    } catch (error) {
      console.error(`Error evaluating flag '${key}':`, error);
      return defaultValue;
    }
  }

  /**
   * Batch evaluate multiple flags
   */
  async evaluateFlags(
    keys: (FeatureFlagKey | string)[],
    context: FlagEvaluationContext = {}
  ): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};

    await Promise.all(
      keys.map(async (key) => {
        results[key] = await this.isFlagEnabled(key, context);
      })
    );

    return results;
  }

  /**
   * Get all flags with their current values for a context
   */
  async getAllFlagValues(context: FlagEvaluationContext = {}): Promise<Record<string, unknown>> {
    const results: Record<string, unknown> = {};

    for (const flag of this.config.flags) {
      switch (flag.type) {
        case 'boolean':
          results[flag.key] = await this.isFlagEnabled(flag.key, context, flag.defaultValue as boolean);
          break;
        case 'string':
          results[flag.key] = await this.getStringFlag(flag.key, context, flag.defaultValue as string);
          break;
        case 'number':
          results[flag.key] = await this.getNumberFlag(flag.key, context, flag.defaultValue as number);
          break;
        case 'json':
          results[flag.key] = await this.getObjectFlag(
            flag.key,
            context,
            flag.defaultValue as Record<string, unknown>
          );
          break;
      }
    }

    return results;
  }

  /**
   * Check if service is ready
   */
  isReady(): boolean {
    return this.provider.status === 'READY';
  }

  /**
   * Get configuration metadata
   */
  getMetadata() {
    return {
      version: this.config.version,
      environment: this.config.environment,
      lastUpdated: this.config.lastUpdated,
      flagCount: this.config.flags.length,
    };
  }
}

/**
 * Convenience export for common use cases
 */
export const createFeatureFlagService = FeatureFlagService.initialize;
export const getFeatureFlagService = () => FeatureFlagService.getInstance();
