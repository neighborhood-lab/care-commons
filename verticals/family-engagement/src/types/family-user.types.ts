/**
 * Family User Types
 *
 * Type definitions for family portal user accounts
 */

export type FamilyUserStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';

export type AuthProvider = 'LOCAL' | 'GOOGLE' | 'APPLE' | 'MICROSOFT';

export interface NotificationPreferences {
  email_enabled?: boolean;
  sms_enabled?: boolean;
  push_enabled?: boolean;
  notification_types?: {
    visits?: boolean;
    care_plans?: boolean;
    health_updates?: boolean;
    billing?: boolean;
    messages?: boolean;
    system_announcements?: boolean;
  };
}

export interface UIPreferences {
  theme?: 'light' | 'dark' | 'auto';
  language?: string;
  compact_view?: boolean;
  show_photos?: boolean;
}

export interface SecurityQuestion {
  question: string;
  answer_hash: string;
}

export interface FamilyUser {
  id: string;
  family_member_id: string;
  organization_id: string;

  // Authentication
  email: string;
  password_hash?: string;
  auth_provider: AuthProvider;
  external_auth_id?: string;

  // Account status
  status: FamilyUserStatus;
  email_verified: boolean;
  email_verified_at?: Date;
  verification_token?: string;
  verification_token_expires?: Date;

  // Security
  password_reset_token?: string;
  password_reset_expires?: Date;
  last_login_at?: Date;
  last_login_ip?: string;
  failed_login_attempts: number;
  account_locked_until?: Date;
  security_questions?: SecurityQuestion[];

  // Preferences
  notification_preferences?: NotificationPreferences;
  ui_preferences?: UIPreferences;
  timezone: string;

  // Terms & privacy
  terms_accepted: boolean;
  terms_accepted_at?: Date;
  terms_version?: string;
  privacy_policy_accepted: boolean;
  privacy_policy_accepted_at?: Date;

  // Standard fields
  created_at: Date;
  created_by: string;
  updated_at: Date;
  updated_by: string;
  version: number;
}

export interface CreateFamilyUserInput {
  family_member_id: string;
  organization_id: string;
  email: string;
  password_hash?: string;
  auth_provider?: AuthProvider;
  external_auth_id?: string;
  notification_preferences?: NotificationPreferences;
  ui_preferences?: UIPreferences;
  timezone?: string;
  created_by: string;
}

export interface UpdateFamilyUserInput {
  email?: string;
  password_hash?: string;
  status?: FamilyUserStatus;
  email_verified?: boolean;
  notification_preferences?: NotificationPreferences;
  ui_preferences?: UIPreferences;
  timezone?: string;
  terms_accepted?: boolean;
  terms_version?: string;
  privacy_policy_accepted?: boolean;
  updated_by: string;
}

export interface FamilyUserAuthenticationInput {
  email: string;
  password: string;
}

export interface FamilyUserRegistrationInput {
  family_member_id: string;
  email: string;
  password: string;
  terms_accepted: boolean;
  privacy_policy_accepted: boolean;
  timezone?: string;
}
