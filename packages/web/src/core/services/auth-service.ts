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
      return apiClient.post<AuthResponse>('/api/auth/login', credentials);
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
