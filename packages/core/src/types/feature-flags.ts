/**
 * @care-commons/core - Feature Flags Types
 *
 * Per-organization feature control types
 */

import { UUID, Entity } from './base';

/**
 * Billing tier for feature flags
 */
export type BillingTier = 'FREE' | 'BASIC' | 'PREMIUM' | 'ENTERPRISE' | 'CUSTOM';

/**
 * Feature flag entity
 */
export interface FeatureFlag extends Entity {
  organizationId: UUID;

  // Feature identification
  featureKey: string; // e.g., 'advanced_scheduling', 'mobile_app'
  featureName: string;
  description: string | null;

  // Feature status
  isEnabled: boolean;
  enabledAt: Date | null;
  enabledBy: UUID | null;

  // Feature configuration
  configuration: Record<string, unknown> | null;
  limits: Record<string, number> | null;

  // Rollout control
  rolloutPercentage: number; // 0-100
  rolloutUserIds: UUID[];
  rolloutBranchIds: UUID[];

  // Billing integration
  billingTier: BillingTier | null;
  monthlyCost: number | null;
  requiresUpgrade: boolean;

  // Dependencies
  dependsOn: string[]; // Required feature keys
  conflictsWith: string[]; // Incompatible features
}

/**
 * Create feature flag request
 */
export interface CreateFeatureFlagRequest {
  featureKey: string;
  featureName: string;
  description?: string;
  isEnabled?: boolean;
  configuration?: Record<string, unknown>;
  limits?: Record<string, number>;
  rolloutPercentage?: number;
  rolloutUserIds?: UUID[];
  rolloutBranchIds?: UUID[];
  billingTier?: BillingTier;
  monthlyCost?: number;
  requiresUpgrade?: boolean;
  dependsOn?: string[];
  conflictsWith?: string[];
}

/**
 * Update feature flag request
 */
export interface UpdateFeatureFlagRequest {
  featureName?: string;
  description?: string;
  isEnabled?: boolean;
  configuration?: Record<string, unknown>;
  limits?: Record<string, number>;
  rolloutPercentage?: number;
  rolloutUserIds?: UUID[];
  rolloutBranchIds?: UUID[];
  billingTier?: BillingTier;
  monthlyCost?: number;
  requiresUpgrade?: boolean;
  dependsOn?: string[];
  conflictsWith?: string[];
}

/**
 * Feature flag evaluation result
 */
export interface FeatureFlagEvaluation {
  featureKey: string;
  isEnabled: boolean;
  reason: string; // Why this feature is enabled/disabled
  configuration?: Record<string, unknown>;
  limits?: Record<string, number>;
}

/**
 * Feature availability check
 */
export interface FeatureAvailability {
  available: boolean;
  reason?: string;
  requiresUpgrade?: boolean;
  billingTier?: BillingTier;
  monthlyCost?: number;
}

/**
 * Well-known feature keys
 */
export enum FeatureKey {
  // Core features
  ADVANCED_SCHEDULING = 'advanced_scheduling',
  MOBILE_APP = 'mobile_app',
  FAMILY_PORTAL = 'family_portal',

  // EVV features
  EVV_TELEPHONY = 'evv_telephony',
  EVV_GPS = 'evv_gps',
  EVV_BIOMETRIC = 'evv_biometric',

  // Care management
  CARE_PLANS = 'care_plans',
  MEDICATION_MANAGEMENT = 'medication_management',
  INCIDENT_REPORTING = 'incident_reporting',

  // Financial
  ADVANCED_BILLING = 'advanced_billing',
  PAYROLL_INTEGRATION = 'payroll_integration',
  INVOICING = 'invoicing',

  // Analytics
  ADVANCED_REPORTS = 'advanced_reports',
  CUSTOM_DASHBOARDS = 'custom_dashboards',
  DATA_EXPORT = 'data_export',

  // Integration
  API_ACCESS = 'api_access',
  WEBHOOKS = 'webhooks',
  SSO = 'sso',

  // White-labeling
  CUSTOM_BRANDING = 'custom_branding',
  CUSTOM_DOMAIN = 'custom_domain',
  CUSTOM_EMAIL_TEMPLATES = 'custom_email_templates',

  // Advanced
  MULTI_BRANCH = 'multi_branch',
  OFFLINE_MODE = 'offline_mode',
  AI_SCHEDULING = 'ai_scheduling',
}
