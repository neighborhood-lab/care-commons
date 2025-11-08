/**
 * useAuth Hook
 *
 * Provides authentication state and methods:
 * - Auto-login with stored tokens
 * - Login/logout functionality
 * - Token refresh
 * - User state management
 */

import { useState, useEffect } from 'react';
import { createAuthService, type User, type LoginCredentials } from '../services/auth.js';

interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<User>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<boolean>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const authService = createAuthService();

  useEffect(() => {
    // Check if user is already logged in
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuth = async () => {
    try {
      // Try to restore session from stored tokens
      const restoredUser = await authService.restoreSession();

      if (restoredUser) {
        setUser(restoredUser);
      } else {
        // No valid session found
        setUser(null);
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      // Try to refresh the token
      const refreshed = await refreshAuth();
      if (!refreshed) {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshAuth = async (): Promise<boolean> => {
    try {
      const success = await authService.refreshToken();

      if (success) {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
        return true;
      }

      // Refresh failed
      await logout();
      return false;
    } catch (error) {
      console.error('Error refreshing auth:', error);
      await logout();
      return false;
    }
  };

  const login = async (credentials: LoginCredentials): Promise<User> => {
    try {
      const loggedInUser = await authService.login(credentials);
      setUser(loggedInUser);
      return loggedInUser;
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
      setUser(null);
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  };

  return {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshAuth,
  };
}
