/**
 * Demo Mode Hook
 *
 * Provides easy access to demo mode state throughout the application.
 * Demo mode means READ-ONLY access - users cannot modify data.
 *
 * This protects the shared demo database from being corrupted by
 * public users who have free access to the demo accounts.
 */

import { useMemo } from 'react';
import { useAuth } from './auth.js';
import { isDemoMode } from '../utils/auth-storage.js';

export interface DemoModeState {
  /** Whether the current user is in demo mode (read-only) */
  isDemo: boolean;
  /** The user's email (for display purposes) */
  email: string | undefined;
  /** Whether write operations are allowed */
  canWrite: boolean;
  /** Message to show when user tries to perform a write operation */
  readOnlyMessage: string;
}

/**
 * Hook to check if the current user is in demo mode
 *
 * @example
 * ```tsx
 * const { isDemo, canWrite, readOnlyMessage } = useDemoMode();
 *
 * if (!canWrite) {
 *   return <p>{readOnlyMessage}</p>;
 * }
 * ```
 */
export function useDemoMode(): DemoModeState {
  const { user } = useAuth();

  return useMemo(() => {
    const isDemo = isDemoMode(user?.email);

    return {
      isDemo,
      email: user?.email,
      canWrite: !isDemo,
      readOnlyMessage: isDemo
        ? 'This is a read-only demo. Create your own account to make changes.'
        : '',
    };
  }, [user?.email]);
}

/**
 * Check if a specific email is a demo account
 * Useful for server-side validation
 */
export function isDemoEmail(email: string): boolean {
  return isDemoMode(email);
}
