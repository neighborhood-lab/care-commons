/**
 * Custom In-Memory Feature Flag Provider
 *
 * Implements OpenFeature Provider interface with JSON configuration backend.
 * Supports advanced targeting, gradual rollouts, and dynamic reloading.
 */

import {
  EvaluationContext,
  JsonValue,
  Provider,
  ResolutionDetails,
  StandardResolutionReasons,
  ProviderMetadata,
  ProviderStatus,
  OpenFeatureEventEmitter,
} from '@openfeature/server-sdk';
import { createHash } from 'crypto';
import type {
  FeatureFlagConfig,
  FeatureFlag,
  TargetingRule,
  TargetingCondition,
  FlagEvaluationContext,
} from './types.js';

/**
 * Custom in-memory provider for feature flags
 */
export class JsonFileFeatureFlagProvider implements Provider {
  metadata: ProviderMetadata = {
    name: 'JsonFileFeatureFlagProvider',
  };

  runsOn = 'server' as const;
  status: ProviderStatus = ProviderStatus.NOT_READY;
  events = new OpenFeatureEventEmitter();

  private config: FeatureFlagConfig;
  private flagMap: Map<string, FeatureFlag> = new Map();

  constructor(config: FeatureFlagConfig) {
    this.config = config;
    this.buildFlagMap();
    this.status = ProviderStatus.READY;
  }

  /**
   * Initialize provider
   */
  async initialize(): Promise<void> {
    this.status = ProviderStatus.READY;
    // Note: Events will be emitted by OpenFeature SDK
  }

  /**
   * Build flag lookup map
   */
  private buildFlagMap(): void {
    this.flagMap.clear();
    for (const flag of this.config.flags) {
      this.flagMap.set(flag.key, flag);
    }
  }

  /**
   * Reload configuration (for runtime updates)
   */
  reloadConfig(config: FeatureFlagConfig): void {
    this.config = config;
    this.buildFlagMap();
    // Note: Configuration changes will be picked up on next evaluation
  }

  /**
   * Evaluate boolean flag
   */
  async resolveBooleanEvaluation(
    flagKey: string,
    defaultValue: boolean,
    context: EvaluationContext
  ): Promise<ResolutionDetails<boolean>> {
    const flag = this.flagMap.get(flagKey);

    if (!flag) {
      return {
        value: defaultValue,
        reason: StandardResolutionReasons.DEFAULT,
        variant: 'default',
        errorMessage: `Flag '${flagKey}' not found`,
      };
    }

    if (!flag.enabled) {
      return {
        value: defaultValue,
        reason: StandardResolutionReasons.DISABLED,
        variant: 'disabled',
      };
    }

    if (flag.type !== 'boolean') {
      return {
        value: defaultValue,
        reason: StandardResolutionReasons.ERROR,
        variant: 'type-mismatch',
        errorMessage: `Flag '${flagKey}' is type '${flag.type}', expected 'boolean'`,
      };
    }

    const evaluation = this.evaluateFlag<boolean>(flag, context as FlagEvaluationContext);
    return evaluation;
  }

  /**
   * Evaluate string flag
   */
  async resolveStringEvaluation(
    flagKey: string,
    defaultValue: string,
    context: EvaluationContext
  ): Promise<ResolutionDetails<string>> {
    const flag = this.flagMap.get(flagKey);

    if (!flag) {
      return {
        value: defaultValue,
        reason: StandardResolutionReasons.DEFAULT,
        variant: 'default',
        errorMessage: `Flag '${flagKey}' not found`,
      };
    }

    if (!flag.enabled) {
      return {
        value: defaultValue,
        reason: StandardResolutionReasons.DISABLED,
        variant: 'disabled',
      };
    }

    if (flag.type !== 'string') {
      return {
        value: defaultValue,
        reason: StandardResolutionReasons.ERROR,
        variant: 'type-mismatch',
        errorMessage: `Flag '${flagKey}' is type '${flag.type}', expected 'string'`,
      };
    }

    const evaluation = this.evaluateFlag<string>(flag, context as FlagEvaluationContext);
    return evaluation;
  }

  /**
   * Evaluate number flag
   */
  async resolveNumberEvaluation(
    flagKey: string,
    defaultValue: number,
    context: EvaluationContext
  ): Promise<ResolutionDetails<number>> {
    const flag = this.flagMap.get(flagKey);

    if (!flag) {
      return {
        value: defaultValue,
        reason: StandardResolutionReasons.DEFAULT,
        variant: 'default',
        errorMessage: `Flag '${flagKey}' not found`,
      };
    }

    if (!flag.enabled) {
      return {
        value: defaultValue,
        reason: StandardResolutionReasons.DISABLED,
        variant: 'disabled',
      };
    }

    if (flag.type !== 'number') {
      return {
        value: defaultValue,
        reason: StandardResolutionReasons.ERROR,
        variant: 'type-mismatch',
        errorMessage: `Flag '${flagKey}' is type '${flag.type}', expected 'number'`,
      };
    }

    const evaluation = this.evaluateFlag<number>(flag, context as FlagEvaluationContext);
    return evaluation;
  }

  /**
   * Evaluate JSON object flag
   */
  async resolveObjectEvaluation<T extends JsonValue>(
    flagKey: string,
    defaultValue: T,
    context: EvaluationContext
  ): Promise<ResolutionDetails<T>> {
    const flag = this.flagMap.get(flagKey);

    if (!flag) {
      return {
        value: defaultValue,
        reason: StandardResolutionReasons.DEFAULT,
        variant: 'default',
        errorMessage: `Flag '${flagKey}' not found`,
      };
    }

    if (!flag.enabled) {
      return {
        value: defaultValue,
        reason: StandardResolutionReasons.DISABLED,
        variant: 'disabled',
      };
    }

    if (flag.type !== 'json') {
      return {
        value: defaultValue,
        reason: StandardResolutionReasons.ERROR,
        variant: 'type-mismatch',
        errorMessage: `Flag '${flagKey}' is type '${flag.type}', expected 'json'`,
      };
    }

    const evaluation = this.evaluateFlag<T>(flag, context as FlagEvaluationContext);
    return evaluation;
  }

  /**
   * Core flag evaluation logic with targeting and rollout support
   */
  private evaluateFlag<T>(flag: FeatureFlag, context: FlagEvaluationContext): ResolutionDetails<T> {
    // Check targeting rules first (in order)
    if (flag.targetingRules && flag.targetingRules.length > 0) {
      for (const rule of flag.targetingRules) {
        if (this.evaluateTargetingRule(rule, context)) {
          // Apply rollout percentage if specified
          if (rule.rolloutPercentage !== undefined) {
            const rolloutAttribute = context.userId || context.targetingKey || 'anonymous';
            if (this.isInRollout(flag.key, rolloutAttribute, rule.rolloutPercentage)) {
              return {
                value: rule.value as T,
                reason: StandardResolutionReasons.TARGETING_MATCH,
                variant: rule.id,
              };
            }
            // Continue to next rule if not in rollout
            continue;
          }

          return {
            value: rule.value as T,
            reason: StandardResolutionReasons.TARGETING_MATCH,
            variant: rule.id,
          };
        }
      }
    }

    // Check gradual rollout
    if (flag.rollout?.enabled) {
      const rolloutAttribute = context[flag.rollout.attribute || 'userId'] as string ||
                               context.userId ||
                               context.targetingKey ||
                               'anonymous';

      if (this.isInRollout(flag.key, rolloutAttribute, flag.rollout.percentage)) {
        return {
          value: flag.defaultValue as T,
          reason: 'GRADUAL_ROLLOUT',
          variant: 'rollout',
        };
      }

      // Not in rollout percentage, return opposite of default (assuming boolean toggle)
      if (flag.type === 'boolean') {
        return {
          value: (!flag.defaultValue) as T,
          reason: 'GRADUAL_ROLLOUT_EXCLUDED',
          variant: 'rollout-excluded',
        };
      }
    }

    // Return default value
    return {
      value: flag.defaultValue as T,
      reason: StandardResolutionReasons.DEFAULT,
      variant: 'default',
    };
  }

  /**
   * Evaluate a targeting rule
   */
  private evaluateTargetingRule(rule: TargetingRule, context: FlagEvaluationContext): boolean {
    // All conditions must match (AND logic)
    return rule.conditions.every((condition) => this.evaluateCondition(condition, context));
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(condition: TargetingCondition, context: FlagEvaluationContext): boolean {
    const contextValue = context[condition.attribute];
    const targetValue = condition.value;

    switch (condition.operator) {
      case 'equals':
        return contextValue === targetValue;

      case 'not_equals':
        return contextValue !== targetValue;

      case 'in':
        return Array.isArray(targetValue) && targetValue.includes(contextValue as never);

      case 'not_in':
        return Array.isArray(targetValue) && !targetValue.includes(contextValue as never);

      case 'contains':
        if (typeof contextValue === 'string' && typeof targetValue === 'string') {
          return contextValue.includes(targetValue);
        }
        if (Array.isArray(contextValue)) {
          return contextValue.includes(targetValue as never);
        }
        return false;

      case 'not_contains':
        if (typeof contextValue === 'string' && typeof targetValue === 'string') {
          return !contextValue.includes(targetValue);
        }
        if (Array.isArray(contextValue)) {
          return !contextValue.includes(targetValue as never);
        }
        return true;

      case 'starts_with':
        return typeof contextValue === 'string' &&
               typeof targetValue === 'string' &&
               contextValue.startsWith(targetValue);

      case 'ends_with':
        return typeof contextValue === 'string' &&
               typeof targetValue === 'string' &&
               contextValue.endsWith(targetValue);

      case 'greater_than':
        return typeof contextValue === 'number' &&
               typeof targetValue === 'number' &&
               contextValue > targetValue;

      case 'less_than':
        return typeof contextValue === 'number' &&
               typeof targetValue === 'number' &&
               contextValue < targetValue;

      case 'matches_regex':
        if (typeof contextValue === 'string' && typeof targetValue === 'string') {
          try {
            const regex = new RegExp(targetValue);
            return regex.test(contextValue);
          } catch {
            return false;
          }
        }
        return false;

      case 'semver_greater_than':
      case 'semver_less_than':
        // TODO: Implement semver comparison if needed
        return false;

      default:
        return false;
    }
  }

  /**
   * Consistent rollout using hash-based bucketing
   */
  private isInRollout(flagKey: string, identifier: string, percentage: number): boolean {
    if (percentage === 0) return false;
    if (percentage >= 100) return true;

    // Create consistent hash
    const hash = createHash('sha256')
      .update(`${flagKey}:${identifier}`)
      .digest('hex');

    // Convert first 8 chars of hash to number between 0-100
    const bucket = parseInt(hash.slice(0, 8), 16) % 100;

    return bucket < percentage;
  }
}
