/**
 * User Preferences Hook
 *
 * React Query hooks for managing user preferences.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSettingsProvider } from './useSettingsProvider';
import type { UpdatePreferencesInput } from '../types';

/**
 * Query key for user preferences
 */
export const preferencesKeys = {
  all: ['preferences'] as const,
  detail: () => [...preferencesKeys.all, 'detail'] as const,
};

/**
 * Hook to fetch user preferences
 */
export const usePreferences = () => {
  const { getPreferences } = useSettingsProvider();

  return useQuery({
    queryKey: preferencesKeys.detail(),
    queryFn: getPreferences,
  });
};

/**
 * Hook to update user preferences
 */
export const useUpdatePreferences = () => {
  const queryClient = useQueryClient();
  const { updatePreferences } = useSettingsProvider();

  return useMutation({
    mutationFn: (input: UpdatePreferencesInput) => updatePreferences(input),
    onSuccess: (data) => {
      // Update the cache
      queryClient.setQueryData(preferencesKeys.detail(), data);
      // Also invalidate to ensure fresh data
      queryClient.invalidateQueries({ queryKey: preferencesKeys.all });
    },
  });
};
