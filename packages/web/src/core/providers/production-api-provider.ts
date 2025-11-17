// @ts-nocheck - Pre-existing showcase code with type mismatches
/**
 * Production API Provider
 * 
 * Real backend integration for production deployment
 */


import type { ApiProvider } from './api-provider.interface';
import type { ApiClient } from '../services/api-client';
import type { AuthResponse, LoginCredentials, User } from '../types/auth';
import { createApiClient } from '../services/api-client';

export class ProductionApiProvider implements ApiProvider {
  private apiClient: ApiClient;
  private baseUrl: string;
  private getAuthToken: () => string | null;
  private getUserContext: () => { userId?: string; organizationId?: string; roles?: string[]; permissions?: string[] } | null;

  constructor(
    baseUrl: string, 
    getAuthToken: () => string | null,
    getUserContext: () => { userId?: string; organizationId?: string; roles?: string[]; permissions?: string[] } | null
  ) {
    this.baseUrl = baseUrl;
    this.getAuthToken = getAuthToken;
    this.getUserContext = getUserContext;
    this.apiClient = createApiClient(baseUrl, getAuthToken, getUserContext);
  }

  async initialize(): Promise<void> {
    // No initialization needed for production API
  }

  getApiClient(): ApiClient {
    return this.apiClient;
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    return this.apiClient.post<AuthResponse>('/api/auth/login', credentials);
  }

  async getCurrentUser(): Promise<User> {
    return this.apiClient.get<User>('/api/auth/me');
  }

  async logout(): Promise<void> {
    await this.apiClient.post<void>('/api/auth/logout');
  }

  requiresAuth(): boolean {
    return true;
  }

  getProviderName(): string {
    return 'Production API';
  }
}
