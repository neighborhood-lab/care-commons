/**
 * Authentication Service
 * 
 * Handles user authentication with:
 * - Secure token storage
 * - Biometric authentication
 * - Session management
 * - Auto-refresh tokens
 */

import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { getApiClient, type ApiClient } from './api-client.js';
import type { UUID } from '../shared/index.js';

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user_data';
const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';

export interface User {
  id: UUID;
  email: string;
  name: string;
  role: string;
  organizationId: UUID;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export class AuthService {
  private apiClient: ApiClient;
  private currentUser: User | null = null;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  /**
   * Login with email and password
   */
  async login(credentials: LoginCredentials): Promise<User> {
    const response = await this.apiClient.post<LoginResponse>(
      '/auth/login',
      credentials,
      { requireAuth: false }
    );

    const { accessToken, refreshToken, user } = response.data;

    // Store tokens securely
    await this.storeTokens(accessToken, refreshToken);

    // Store user data
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));

    // Set tokens in API client
    this.apiClient.setAuth(accessToken, refreshToken);
    this.currentUser = user;

    return user;
  }

  /**
   * Logout
   */
  async logout(): Promise<void> {
    // Clear tokens from API client
    this.apiClient.clearAuth();

    // Clear secure storage
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);

    this.currentUser = null;
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    return token !== null;
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<User | null> {
    if (this.currentUser) {
      return this.currentUser;
    }

    const userData = await SecureStore.getItemAsync(USER_KEY);
    if (userData) {
      this.currentUser = JSON.parse(userData);
      return this.currentUser;
    }

    return null;
  }

  /**
   * Restore session from stored tokens
   */
  async restoreSession(): Promise<User | null> {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    const userData = await SecureStore.getItemAsync(USER_KEY);

    if (!token || !userData) {
      return null;
    }

    // Set tokens in API client
    this.apiClient.setAuth(token, refreshToken || undefined);

    this.currentUser = JSON.parse(userData);
    return this.currentUser;
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(): Promise<boolean> {
    const success = await this.apiClient.refreshAuth();
    
    if (success && this.apiClient.isAuthenticated()) {
      // Update stored tokens (would need to expose from ApiClient)
      // For now, the ApiClient handles this internally
      return true;
    }

    return false;
  }

  /**
   * Store tokens securely
   */
  private async storeTokens(accessToken: string, refreshToken: string): Promise<void> {
    await SecureStore.setItemAsync(TOKEN_KEY, accessToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
  }

  /**
   * Store user data for offline access
   */
  async storeUserData(user: User): Promise<void> {
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    this.currentUser = user;
  }

  /**
   * Get stored user data (works offline)
   */
  async getUserData(): Promise<User | null> {
    const userData = await SecureStore.getItemAsync(USER_KEY);
    return userData ? JSON.parse(userData) : null;
  }

  /**
   * Check if biometric authentication is available
   */
  async isBiometricAvailable(): Promise<boolean> {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return compatible && enrolled;
  }

  /**
   * Check if biometric is enabled for app
   */
  async isBiometricEnabled(): Promise<boolean> {
    const enabled = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
    return enabled === 'true';
  }

  /**
   * Enable biometric authentication
   */
  async enableBiometric(): Promise<boolean> {
    const available = await this.isBiometricAvailable();
    if (!available) {
      return false;
    }

    await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'true');
    return true;
  }

  /**
   * Disable biometric authentication
   */
  async disableBiometric(): Promise<void> {
    await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'false');
  }

  /**
   * Authenticate with biometric
   */
  async authenticateWithBiometric(): Promise<boolean> {
    const enabled = await this.isBiometricEnabled();
    if (!enabled) {
      return false;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate to access Care Commons',
      fallbackLabel: 'Use password',
      disableDeviceFallback: false,
    });

    return result.success;
  }

  /**
   * Get supported biometric types
   */
  async getSupportedBiometricTypes(): Promise<string[]> {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    return types.map((type: number) => {
      switch (type) {
        case LocalAuthentication.AuthenticationType.FINGERPRINT:
          return 'fingerprint';
        case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
          return 'face';
        case LocalAuthentication.AuthenticationType.IRIS:
          return 'iris';
        default:
          return 'unknown';
      }
    });
  }
}

/**
 * Create auth service instance
 */
export function createAuthService(): AuthService {
  const apiClient = getApiClient();
  return new AuthService(apiClient);
}
