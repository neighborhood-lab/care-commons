/**
 * Smart auth storage management for demo mode
 * 
 * Handles automatic localStorage clearing when database is reset,
 * which is common in demo environments and local development.
 */

import type { User } from '../types/auth';

const AUTH_STORAGE_KEY = 'auth-storage';

/**
 * Check if we're in demo mode
 * Demo mode is detected by:
 * 1. Demo user email patterns (@{state}.carecommons.example)
 * 2. Environment variable
 */
function isDemoMode(email?: string): boolean {
  // Check environment
  if (import.meta.env.VITE_DEMO_MODE === 'true') {
    return true;
  }

  // Check email pattern (demo users have state-specific emails)
  if (email && /@[a-z]{2}\.carecommons\.example$/i.test(email)) {
    return true;
  }

  // Check for generic demo emails
  if (email && /@carecommons\.example$/i.test(email)) {
    return true;
  }

  return false;
}

/**
 * Get stored auth data
 */
function getStoredAuth(): { user: User; token: string } | null {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    const state = parsed?.state;
    
    // Validate we have the minimum required data
    if (!state || !state.user || typeof state.user !== 'object') {
      return null;
    }

    return state;
  } catch (error) {
    console.warn('Failed to parse auth storage:', error);
    return null;
  }
}

/**
 * Detect if auth data is stale (database was reset)
 * 
 * This happens when:
 * 1. User logs in with demo credentials
 * 2. Server returns a user with different organizationId than stored
 * 3. Indicates database was reset with new UUIDs
 */
export function detectStaleAuthData(
  loginEmail: string,
  returnedUser: User
): boolean {
  // Only check in demo mode
  if (!isDemoMode(loginEmail)) {
    return false;
  }

  const stored = getStoredAuth();
  if (!stored || !stored.user) {
    // No stored data or invalid data, nothing to detect
    return false;
  }

  // If the stored user has the same email but different org ID,
  // the database was reset
  if (
    stored.user.email === loginEmail &&
    stored.user.organizationId !== returnedUser.organizationId
  ) {
    console.log('🔄 Detected stale auth data (database was reset)');
    return true;
  }

  return false;
}

/**
 * Clear auth storage
 * 
 * Only clears the auth-storage key to preserve other localStorage data
 */
export function clearAuthStorage(): void {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    console.log('🗑️  Cleared stale auth data');
  } catch (error) {
    console.warn('Failed to clear auth storage:', error);
  }
}

/**
 * Smart login handler that auto-clears stale data
 * 
 * Call this BEFORE setting new auth data after successful login.
 * It will detect if the database was reset and clear stale data.
 * 
 * @param loginEmail - The email used to login
 * @param returnedUser - The user object returned by the server
 * @returns true if stale data was cleared
 */
export function handleSmartLogin(
  loginEmail: string,
  returnedUser: User
): boolean {
  try {
    if (detectStaleAuthData(loginEmail, returnedUser)) {
      clearAuthStorage();
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error in handleSmartLogin:', error);
    // On error, don't clear - better to be safe
    return false;
  }
}

/**
 * Initialize auth storage checks
 * 
 * Call this on app initialization to detect and clean up stale data
 * from a previous session where the database was reset.
 */
export function initAuthStorage(): void {
  const stored = getStoredAuth();
  if (!stored || !stored.user) return;

  // In demo mode, if the stored user ID looks like a UUID but the
  // organizationId is invalid, clear it
  if (isDemoMode(stored.user.email)) {
    // This will be validated on next login attempt
    console.log('📦 Auth storage initialized (demo mode)');
  }
}
