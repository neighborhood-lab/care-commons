/**
 * Account Settings Hook
 *
 * React Query hooks for managing user account settings.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSettingsProvider } from './useSettingsProvider';
import type { UpdateAccountSettingsInput } from '../types';

/**
 * Query key for account settings
 */
export const accountSettingsKeys = {
  all: ['account-settings'] as const,
  detail: () => [...accountSettingsKeys.all, 'detail'] as const,
};

/**
 * Hook to fetch account settings
 */
export const useAccountSettings = () => {
  const { getAccountSettings } = useSettingsProvider();

  return useQuery({
    queryKey: accountSettingsKeys.detail(),
    queryFn: getAccountSettings,
  });
};

/**
 * Hook to update account settings
 */
export const useUpdateAccountSettings = () => {
  const queryClient = useQueryClient();
  const { updateAccountSettings } = useSettingsProvider();

  return useMutation({
    mutationFn: (input: UpdateAccountSettingsInput) =>
      updateAccountSettings(input),
    onSuccess: (data) => {
      // Update the cache
      queryClient.setQueryData(accountSettingsKeys.detail(), data);
      // Also invalidate to ensure fresh data
      queryClient.invalidateQueries({ queryKey: accountSettingsKeys.all });
    },
  });
};
