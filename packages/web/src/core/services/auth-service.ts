import type { ApiClient } from './api-client';
import type { AuthResponse, LoginCredentials, User } from '../types/auth';

export interface AuthService {
  login(credentials: LoginCredentials): Promise<AuthResponse>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<User>;
  refreshToken(): Promise<AuthResponse>;
}

export const createAuthService = (apiClient: ApiClient): AuthService => {
  return {
    async login(credentials: LoginCredentials): Promise<AuthResponse> {
      const response = await apiClient.post<{ success: boolean; data: { user: User; tokens: { accessToken: string; refreshToken: string } } }>('/api/auth/login', credentials);
      // Transform backend response to frontend format
      return {
        user: response.data.user,
        token: response.data.tokens.accessToken,
      };
    },

    async logout(): Promise<void> {
      return apiClient.post<void>('/api/auth/logout');
    },

    async getCurrentUser(): Promise<User> {
      return apiClient.get<User>('/api/auth/me');
    },

    async refreshToken(): Promise<AuthResponse> {
      return apiClient.post<AuthResponse>('/api/auth/refresh');
    },
  };
};
