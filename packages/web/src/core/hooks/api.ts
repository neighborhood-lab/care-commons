import { useMemo } from 'react';
import { createApiClient } from '../services/api-client';
import { createAuthService } from '../services/auth-service';
import { useAuth } from './auth';

export const useApiClient = () => {
  const { token } = useAuth();

  return useMemo(() => {
    return createApiClient(import.meta.env.VITE_API_BASE_URL || '', () => token);
  }, [token]);
};

export const useAuthService = () => {
  const apiClient = useApiClient();

  return useMemo(() => {
    return createAuthService(apiClient);
  }, [apiClient]);
};
