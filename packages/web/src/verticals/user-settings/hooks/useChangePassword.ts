/**
 * Change Password Hook
 *
 * React Query hook for changing user password.
 */

import { useMutation } from '@tanstack/react-query';
import { useSettingsProvider } from './useSettingsProvider';
import type { ChangePasswordInput } from '../types';

/**
 * Hook to change user password
 */
export const useChangePassword = () => {
  const { changePassword } = useSettingsProvider();

  return useMutation({
    mutationFn: (input: ChangePasswordInput) => changePassword(input),
  });
};
