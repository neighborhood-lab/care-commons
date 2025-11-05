/**
 * API Provider Interface
 *
 * This interface defines the contract that all API providers must implement.
 * It allows the application to switch between different backends:
 * - Production: Real API calls to backend server
 * - Showcase: In-browser mocked API for GitHub Pages demo
 */

import type { ApiClient } from '../services/api-client';
import type { AuthResponse, LoginCredentials, User } from '../types/auth';

export interface ApiProvider {
  /**
   * Get the API client instance
   */
  getApiClient(): ApiClient;

  /**
   * Initialize the provider (load data, set up storage, etc.)
   */
  initialize(): Promise<void>;

  /**
   * Authenticate user
   */
  login(credentials: LoginCredentials): Promise<AuthResponse>;

  /**
   * Get current authenticated user
   */
  getCurrentUser(): Promise<User>;

  /**
   * Logout current user
   */
  logout(): Promise<void>;

  /**
   * Check if this provider requires authentication
   */
  requiresAuth(): boolean;

  /**
   * Get provider name for debugging/display
   */
  getProviderName(): string;
}

export type ApiProviderType = 'production' | 'showcase';

export interface ApiProviderConfig {
  type: ApiProviderType;
  baseUrl?: string;
  showcaseOptions?: {
    autoLogin?: boolean;
    defaultRole?: 'admin' | 'coordinator' | 'caregiver' | 'patient' | 'family';
    persistData?: boolean;
  };
}
