/**
 * Settings API Service
 *
 * Handles API calls for user settings, preferences, and account management.
 */

import type { ApiClient } from '../../../core/services/api-client';
import type {
  AccountSettings,
  UpdateAccountSettingsInput,
  UserPreferences,
  UpdatePreferencesInput,
  ChangePasswordInput,
} from '../types';

/**
 * Settings API service interface
 */
export interface SettingsApiService {
  /**
   * Get user account settings
   */
  getAccountSettings(): Promise<AccountSettings>;

  /**
   * Update user account settings
   */
  updateAccountSettings(
    input: UpdateAccountSettingsInput
  ): Promise<AccountSettings>;

  /**
   * Get user preferences
   */
  getPreferences(): Promise<UserPreferences>;

  /**
   * Update user preferences
   */
  updatePreferences(input: UpdatePreferencesInput): Promise<UserPreferences>;

  /**
   * Change user password
   */
  changePassword(input: ChangePasswordInput): Promise<void>;
}

/**
 * Create settings API service
 */
export const createSettingsApiService = (
  apiClient: ApiClient
): SettingsApiService => ({
  async getAccountSettings() {
    const response = await apiClient.get<AccountSettings>(
      '/api/users/settings'
    );
    return response.data;
  },

  async updateAccountSettings(input: UpdateAccountSettingsInput) {
    const response = await apiClient.patch<AccountSettings>(
      '/api/users/settings',
      input
    );
    return response.data;
  },

  async getPreferences() {
    const response = await apiClient.get<UserPreferences>(
      '/api/users/preferences'
    );
    return response.data;
  },

  async updatePreferences(input: UpdatePreferencesInput) {
    const response = await apiClient.patch<UserPreferences>(
      '/api/users/preferences',
      input
    );
    return response.data;
  },

  async changePassword(input: ChangePasswordInput) {
    await apiClient.post('/api/users/password', input);
  },
});
