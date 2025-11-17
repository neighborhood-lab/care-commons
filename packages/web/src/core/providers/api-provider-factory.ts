/**
 * API Provider Factory
 *
 * Creates the appropriate API provider based on configuration.
 */

import type { ApiProvider, ApiProviderConfig } from './api-provider.interface';
import { ProductionApiProvider } from './production-api-provider';
import { ShowcaseApiProvider } from './showcase-api-provider';
import { useAuthStore } from '../hooks/auth';

export function createApiProvider(config: ApiProviderConfig): ApiProvider {
  if (config.type === 'showcase') {
    return new ShowcaseApiProvider({
      autoLogin: config.showcaseOptions?.autoLogin ?? true,
      defaultRole: config.showcaseOptions?.defaultRole ?? 'coordinator',
      persistData: config.showcaseOptions?.persistData ?? true,
    });
  }

  // Production provider
  const baseUrl = config.baseUrl || import.meta.env.VITE_API_BASE_URL || '';
  const getAuthToken = () => {
    const state = useAuthStore.getState();
    return state.token;
  };

  const getUserContext = () => {
    const state = useAuthStore.getState();
    if (!state.user) return null;
    return {
      userId: state.user.id,
      organizationId: state.user.organizationId,
      roles: state.user.roles,
      permissions: state.user.permissions,
    };
  };

  return new ProductionApiProvider(baseUrl, getAuthToken, getUserContext);
}

/**
 * Get API provider config from environment
 */
export function getApiProviderConfigFromEnv(): ApiProviderConfig {
  const isShowcase = import.meta.env.VITE_SHOWCASE_MODE === 'true';

  if (isShowcase) {
    return {
      type: 'showcase',
      showcaseOptions: {
        autoLogin: true,
        defaultRole: 'coordinator',
        persistData: true,
      },
    };
  }

  return {
    type: 'production',
    baseUrl: import.meta.env.VITE_API_BASE_URL || '',
  };
}
