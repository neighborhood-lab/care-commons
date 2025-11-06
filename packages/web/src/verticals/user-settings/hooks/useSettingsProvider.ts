/**
 * Settings Provider Hook
 *
 * Provides access to the settings API service.
 */

import { useMemo } from 'react';
import { useApiClient } from '@/core/hooks';
import { createSettingsApiService } from '../services';

/**
 * Hook to get the settings API service
 */
export const useSettingsProvider = () => {
  const apiClient = useApiClient();
  return useMemo(() => createSettingsApiService(apiClient), [apiClient]);
};
