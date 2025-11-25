import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuthStore, useAuth } from '../auth';
import type { User } from '../../types/auth';

describe('Auth Hooks', () => {
  // Reset store before each test
  beforeEach(() => {
    const store = useAuthStore.getState();
    store.clearAuth();
    // Clear localStorage
    localStorage.removeItem('auth-storage');
  });

  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    roles: ['ADMIN'],
    permissions: ['read:users', 'write:users'],
    organizationId: 'org-123',
  };

  const mockToken = 'mock-jwt-token-12345';

  describe('useAuthStore', () => {
    it('should have initial state with no authentication', () => {
      const { result } = renderHook(() => useAuthStore());

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should set authentication state with setAuth', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setAuth(mockUser, mockToken);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.token).toBe(mockToken);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should clear authentication state with clearAuth', () => {
      const { result } = renderHook(() => useAuthStore());

      // First set auth
      act(() => {
        result.current.setAuth(mockUser, mockToken);
      });

      expect(result.current.isAuthenticated).toBe(true);

      // Then clear it
      act(() => {
        result.current.clearAuth();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should persist state to localStorage', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setAuth(mockUser, mockToken);
      });

      // Check localStorage
      const stored = localStorage.getItem('auth-storage');
      expect(stored).not.toBeNull();

      const parsed = JSON.parse(stored!);
      expect(parsed.state.user).toEqual(mockUser);
      expect(parsed.state.token).toBe(mockToken);
      expect(parsed.state.isAuthenticated).toBe(true);
    });

    it('should share state across multiple hook instances', () => {
      const { result: result1 } = renderHook(() => useAuthStore());
      const { result: result2 } = renderHook(() => useAuthStore());

      act(() => {
        result1.current.setAuth(mockUser, mockToken);
      });

      // Both hooks should see the same state
      expect(result1.current.user).toEqual(mockUser);
      expect(result2.current.user).toEqual(mockUser);
      expect(result2.current.isAuthenticated).toBe(true);
    });
  });

  describe('useAuth', () => {
    it('should expose user, token, and isAuthenticated', () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current).toHaveProperty('user');
      expect(result.current).toHaveProperty('token');
      expect(result.current).toHaveProperty('isAuthenticated');
    });

    it('should expose login function that sets auth', () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current.isAuthenticated).toBe(false);

      act(() => {
        result.current.login(mockUser, mockToken);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.token).toBe(mockToken);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should expose logout function that clears auth', () => {
      const { result } = renderHook(() => useAuth());

      // Login first
      act(() => {
        result.current.login(mockUser, mockToken);
      });

      expect(result.current.isAuthenticated).toBe(true);

      // Then logout
      act(() => {
        result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should update when auth state changes in store', () => {
      const { result: authHook } = renderHook(() => useAuth());
      const { result: storeHook } = renderHook(() => useAuthStore());

      // Update via store directly
      act(() => {
        storeHook.current.setAuth(mockUser, mockToken);
      });

      // useAuth should reflect the change
      expect(authHook.current.user).toEqual(mockUser);
      expect(authHook.current.isAuthenticated).toBe(true);
    });

    it('should handle user with different roles', () => {
      const caregiverUser: User = {
        ...mockUser,
        id: 'caregiver-1',
        roles: ['CAREGIVER'],
        permissions: ['read:own-visits', 'write:visit-notes'],
      };

      const { result } = renderHook(() => useAuth());

      act(() => {
        result.current.login(caregiverUser, mockToken);
      });

      expect(result.current.user?.roles).toContain('CAREGIVER');
      expect(result.current.user?.permissions).toContain('read:own-visits');
    });

    it('should handle user with multiple roles', () => {
      const multiRoleUser: User = {
        ...mockUser,
        roles: ['ADMIN', 'COORDINATOR', 'SCHEDULER'],
        permissions: ['read:all', 'write:all', 'manage:users'],
      };

      const { result } = renderHook(() => useAuth());

      act(() => {
        result.current.login(multiRoleUser, mockToken);
      });

      expect(result.current.user?.roles).toHaveLength(3);
      expect(result.current.user?.roles).toContain('ADMIN');
      expect(result.current.user?.roles).toContain('COORDINATOR');
    });
  });
});
