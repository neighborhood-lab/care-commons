import { useMemo } from 'react';
import { createApiClient } from '../services/api-client';
import { createAuthService } from '../services/auth-service';
import { useAuth } from './auth';
import { useApiProvider } from '../providers';

/* eslint-disable react-hooks/rules-of-hooks */
export const useApiClient = () => {
  // Try to use the provider-based API client first
  try {
    const provider = useApiProvider();
    return provider.getApiClient();
  } catch (_error) {
    // Fallback to legacy implementation for backward compatibility
    const { token } = useAuth();
    return useMemo(() => {
      return createApiClient(
        import.meta.env.VITE_API_BASE_URL || '',
        () => token
      );
    }, [token]);
  }
};
/* eslint-enable react-hooks/rules-of-hooks */

export const useAuthService = () => {
  const apiClient = useApiClient();

  return useMemo(() => {
    return createAuthService(apiClient);
  }, [apiClient]);
};
