/**
 * User Settings Types
 *
 * Type definitions for user settings, preferences, and account management.
 */

/**
 * User account settings
 */
export interface AccountSettings {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
}

/**
 * Input for updating account settings
 */
export interface UpdateAccountSettingsInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
}

/**
 * User UI preferences
 */
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  timeFormat: '12h' | '24h';
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
}

/**
 * Input for updating user preferences
 */
export interface UpdatePreferencesInput {
  theme?: 'light' | 'dark' | 'system';
  language?: string;
  timezone?: string;
  dateFormat?: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  timeFormat?: '12h' | '24h';
  notifications?: {
    email?: boolean;
    push?: boolean;
    sms?: boolean;
  };
}

/**
 * Password change input
 */
export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Settings section types
 */
export type SettingsSection = 'account' | 'preferences' | 'security';
