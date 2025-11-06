/**
 * Feature Flag Provider for React
 *
 * Provides feature flag evaluation context for React components.
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { OpenFeature, type EvaluationContext } from '@openfeature/web-sdk';
import { OpenFeatureProvider } from '@openfeature/react-sdk';
import type { FeatureFlagKey } from '@care-commons/core/feature-flags';

/**
 * Web-compatible in-memory provider
 */
class WebFeatureFlagProvider {
  metadata = { name: 'WebFeatureFlagProvider' };
  runsOn = 'client' as const;

  private flags: Map<string, any> = new Map();

  constructor(flags: Record<string, any>) {
    Object.entries(flags).forEach(([key, value]) => {
      this.flags.set(key, value);
    });
  }

  async resolveBooleanEvaluation(flagKey: string, defaultValue: boolean, _context: EvaluationContext) {
    const flag = this.flags.get(flagKey);
    if (flag && typeof flag.value === 'boolean') {
      return {
        value: flag.enabled ? flag.value : defaultValue,
        reason: flag.enabled ? 'STATIC' : 'DISABLED',
      };
    }
    return { value: defaultValue, reason: 'DEFAULT' };
  }

  async resolveStringEvaluation(flagKey: string, defaultValue: string, _context: EvaluationContext) {
    const flag = this.flags.get(flagKey);
    if (flag && typeof flag.value === 'string') {
      return {
        value: flag.enabled ? flag.value : defaultValue,
        reason: flag.enabled ? 'STATIC' : 'DISABLED',
      };
    }
    return { value: defaultValue, reason: 'DEFAULT' };
  }

  async resolveNumberEvaluation(flagKey: string, defaultValue: number, _context: EvaluationContext) {
    const flag = this.flags.get(flagKey);
    if (flag && typeof flag.value === 'number') {
      return {
        value: flag.enabled ? flag.value : defaultValue,
        reason: flag.enabled ? 'STATIC' : 'DISABLED',
      };
    }
    return { value: defaultValue, reason: 'DEFAULT' };
  }

  async resolveObjectEvaluation(flagKey: string, defaultValue: any, _context: EvaluationContext) {
    const flag = this.flags.get(flagKey);
    if (flag && typeof flag.value === 'object') {
      return {
        value: flag.enabled ? flag.value : defaultValue,
        reason: flag.enabled ? 'STATIC' : 'DISABLED',
      };
    }
    return { value: defaultValue, reason: 'DEFAULT' };
  }

  updateFlags(flags: Record<string, any>) {
    this.flags.clear();
    Object.entries(flags).forEach(([key, value]) => {
      this.flags.set(key, value);
    });
  }
}

/**
 * Feature flag context for additional utilities
 */
interface FeatureFlagContextValue {
  flags: Record<string, any>;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

const FeatureFlagContext = createContext<FeatureFlagContextValue | undefined>(undefined);

/**
 * Feature flag provider props
 */
interface FeatureFlagProviderProps {
  children: React.ReactNode;
  /** API endpoint to fetch flags from */
  apiEndpoint?: string;
  /** Initial flags (optional) */
  initialFlags?: Record<string, any>;
  /** Evaluation context (user, org, etc.) */
  evaluationContext?: EvaluationContext;
}

/**
 * Feature flag provider component
 */
export function FeatureFlagProvider({
  children,
  apiEndpoint = '/api/feature-flags',
  initialFlags = {},
  evaluationContext = {},
}: FeatureFlagProviderProps) {
  const [flags, setFlags] = useState<Record<string, any>>(initialFlags);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [provider, setProvider] = useState<WebFeatureFlagProvider | null>(null);

  /**
   * Fetch flags from API
   */
  const fetchFlags = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(apiEndpoint);
      if (!response.ok) {
        throw new Error(`Failed to fetch feature flags: ${response.statusText}`);
      }

      const data = await response.json();
      setFlags(data);

      // Update provider if it exists
      if (provider) {
        provider.updateFlags(data);
      }
    } catch (err) {
      console.error('Error fetching feature flags:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [apiEndpoint, provider]);

  /**
   * Initialize OpenFeature
   */
  useEffect(() => {
    const initProvider = new WebFeatureFlagProvider(flags);
    setProvider(initProvider);
    OpenFeature.setProvider(initProvider);

    // Set evaluation context
    if (evaluationContext && Object.keys(evaluationContext).length > 0) {
      OpenFeature.setContext(evaluationContext);
    }

    // Fetch flags on mount
    if (!initialFlags || Object.keys(initialFlags).length === 0) {
      fetchFlags();
    } else {
      setLoading(false);
    }
  }, []); // Only run once on mount

  /**
   * Update context when it changes
   */
  useEffect(() => {
    if (evaluationContext && Object.keys(evaluationContext).length > 0) {
      OpenFeature.setContext(evaluationContext);
    }
  }, [evaluationContext]);

  const contextValue: FeatureFlagContextValue = {
    flags,
    loading,
    error,
    refetch: fetchFlags,
  };

  return (
    <FeatureFlagContext.Provider value={contextValue}>
      <OpenFeatureProvider>
        {children}
      </OpenFeatureProvider>
    </FeatureFlagContext.Provider>
  );
}

/**
 * Hook to access feature flag context
 */
export function useFeatureFlagContext() {
  const context = useContext(FeatureFlagContext);
  if (!context) {
    throw new Error('useFeatureFlagContext must be used within FeatureFlagProvider');
  }
  return context;
}

/**
 * Hook to check if a flag is enabled
 *
 * Usage:
 * ```tsx
 * const isEnabled = useFeatureFlag('new-feature');
 * if (isEnabled) {
 *   return <NewFeature />;
 * }
 * ```
 */
export function useFeatureFlag(key: FeatureFlagKey | string, defaultValue = false): boolean {
  const { flags } = useFeatureFlagContext();
  const flag = flags[key];

  if (!flag) {
    return defaultValue;
  }

  if (typeof flag === 'boolean') {
    return flag;
  }

  if (typeof flag === 'object' && 'value' in flag) {
    return flag.enabled ? flag.value : defaultValue;
  }

  return defaultValue;
}

/**
 * Hook to get string flag value
 */
export function useStringFlag(key: FeatureFlagKey | string, defaultValue = ''): string {
  const { flags } = useFeatureFlagContext();
  const flag = flags[key];

  if (!flag) {
    return defaultValue;
  }

  if (typeof flag === 'string') {
    return flag;
  }

  if (typeof flag === 'object' && 'value' in flag && typeof flag.value === 'string') {
    return flag.enabled ? flag.value : defaultValue;
  }

  return defaultValue;
}

/**
 * Hook to get number flag value
 */
export function useNumberFlag(key: FeatureFlagKey | string, defaultValue = 0): number {
  const { flags } = useFeatureFlagContext();
  const flag = flags[key];

  if (!flag) {
    return defaultValue;
  }

  if (typeof flag === 'number') {
    return flag;
  }

  if (typeof flag === 'object' && 'value' in flag && typeof flag.value === 'number') {
    return flag.enabled ? flag.value : defaultValue;
  }

  return defaultValue;
}

/**
 * Hook to get object flag value
 */
export function useObjectFlag<T extends Record<string, unknown>>(
  key: FeatureFlagKey | string,
  defaultValue: T
): T {
  const { flags } = useFeatureFlagContext();
  const flag = flags[key];

  if (!flag) {
    return defaultValue;
  }

  if (typeof flag === 'object' && !('value' in flag)) {
    return flag as T;
  }

  if (typeof flag === 'object' && 'value' in flag && typeof flag.value === 'object') {
    return (flag.enabled ? flag.value : defaultValue) as T;
  }

  return defaultValue;
}

/**
 * Component to conditionally render based on flag
 *
 * Usage:
 * ```tsx
 * <FeatureFlag flag="new-feature" fallback={<OldFeature />}>
 *   <NewFeature />
 * </FeatureFlag>
 * ```
 */
interface FeatureFlagProps {
  flag: FeatureFlagKey | string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function FeatureFlag({ flag, children, fallback = null }: FeatureFlagProps) {
  const isEnabled = useFeatureFlag(flag);
  return <>{isEnabled ? children : fallback}</>;
}

/**
 * Component to render when flag is disabled
 */
export function FeatureFlagOff({ flag, children }: Omit<FeatureFlagProps, 'fallback'>) {
  const isEnabled = useFeatureFlag(flag);
  return <>{!isEnabled ? children : null}</>;
}
