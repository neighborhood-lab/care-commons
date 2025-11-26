/**
 * Demo Data Hook
 *
 * Manages demo data state for organizations.
 * Provides loading, clearing, and status checking functionality.
 */

import { useState, useCallback, useEffect } from 'react';
import { create } from 'zustand';
import { useApiClient } from './api.js';
import { useAuth } from './auth.js';

export interface DemoDataStats {
  clients: number;
  caregivers: number;
  visits: number;
  carePlans?: number;
  familyMembers?: number;
}

interface DemoDataState {
  hasDemoData: boolean | null;
  stats: DemoDataStats | null;
  isLoading: boolean;
  isSeeding: boolean;
  isClearing: boolean;
  error: string | null;
  lastChecked: number | null;
  setHasDemoData: (has: boolean, stats: DemoDataStats | null) => void;
  setLoading: (loading: boolean) => void;
  setSeeding: (seeding: boolean) => void;
  setClearing: (clearing: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const useDemoDataStore = create<DemoDataState>((set) => ({
  hasDemoData: null,
  stats: null,
  isLoading: false,
  isSeeding: false,
  isClearing: false,
  error: null,
  lastChecked: null,
  setHasDemoData: (has, stats) =>
    set({ hasDemoData: has, stats, lastChecked: Date.now() }),
  setLoading: (loading) => set({ isLoading: loading }),
  setSeeding: (seeding) => set({ isSeeding: seeding }),
  setClearing: (clearing) => set({ isClearing: clearing }),
  setError: (error) => set({ error }),
  reset: () =>
    set({
      hasDemoData: null,
      stats: null,
      isLoading: false,
      isSeeding: false,
      isClearing: false,
      error: null,
      lastChecked: null,
    }),
}));

interface DemoDataStatusResponse {
  success: boolean;
  data: {
    hasDemoData: boolean;
    stats: DemoDataStats | null;
  };
}

interface DemoDataSeedResponse {
  success: boolean;
  data: {
    stats: DemoDataStats;
    message: string;
  };
}

interface DemoDataClearResponse {
  success: boolean;
  message: string;
}

export function useDemoData() {
  const apiClient = useApiClient();
  const { user } = useAuth();
  const store = useDemoDataStore();
  const [initialized, setInitialized] = useState(false);

  const organizationId = user?.organizationId;

  /**
   * Check the current demo data status for the organization
   */
  const checkStatus = useCallback(async () => {
    if (!organizationId) {
      return;
    }

    store.setLoading(true);
    store.setError(null);

    try {
      const response = await apiClient.get<DemoDataStatusResponse>(
        `/api/organizations/${organizationId}/demo-data/status`
      );

      if (response.success) {
        store.setHasDemoData(response.data.hasDemoData, response.data.stats);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to check demo data status';
      store.setError(message);
      console.error('Demo data status check failed:', error);
    } finally {
      store.setLoading(false);
    }
  }, [apiClient, organizationId, store]);

  /**
   * Seed demo data for the organization
   */
  const seedDemoData = useCallback(async () => {
    if (!organizationId) {
      store.setError('No organization selected');
      return false;
    }

    store.setSeeding(true);
    store.setError(null);

    try {
      const response = await apiClient.post<DemoDataSeedResponse>(
        `/api/organizations/${organizationId}/demo-data`
      );

      if (response.success) {
        store.setHasDemoData(true, response.data.stats);
        return true;
      }
      return false;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to seed demo data';
      store.setError(message);
      console.error('Demo data seeding failed:', error);
      return false;
    } finally {
      store.setSeeding(false);
    }
  }, [apiClient, organizationId, store]);

  /**
   * Clear demo data from the organization
   */
  const clearDemoData = useCallback(async () => {
    if (!organizationId) {
      store.setError('No organization selected');
      return false;
    }

    store.setClearing(true);
    store.setError(null);

    try {
      const response = await apiClient.delete<DemoDataClearResponse>(
        `/api/organizations/${organizationId}/demo-data`
      );

      if (response.success) {
        store.setHasDemoData(false, null);
        return true;
      }
      return false;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to clear demo data';
      store.setError(message);
      console.error('Demo data clearing failed:', error);
      return false;
    } finally {
      store.setClearing(false);
    }
  }, [apiClient, organizationId, store]);

  // Auto-check status on mount if we have an organization
  useEffect(() => {
    if (organizationId && !initialized && store.hasDemoData === null) {
      setInitialized(true);
      void checkStatus();
    }
  }, [organizationId, initialized, store.hasDemoData, checkStatus]);

  // Reset when organization changes
  useEffect(() => {
    return () => {
      store.reset();
    };
  }, [organizationId]);

  return {
    // State
    hasDemoData: store.hasDemoData,
    stats: store.stats,
    isLoading: store.isLoading,
    isSeeding: store.isSeeding,
    isClearing: store.isClearing,
    error: store.error,

    // Actions
    checkStatus,
    seedDemoData,
    clearDemoData,

    // Computed
    isOrganizationEmpty:
      store.hasDemoData === false &&
      store.stats === null &&
      !store.isLoading,
  };
}
