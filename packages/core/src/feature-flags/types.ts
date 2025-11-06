/**
 * Feature Flag System Types
 *
 * Comprehensive type definitions for the feature flag system using OpenFeature.
 * Supports boolean flags, string variants, number values, and complex targeting rules.
 */

/**
 * Supported flag types
 */
export type FlagType = 'boolean' | 'string' | 'number' | 'json';

/**
 * Flag targeting rule operators
 */
export type TargetingOperator =
  | 'equals'
  | 'not_equals'
  | 'in'
  | 'not_in'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'greater_than'
  | 'less_than'
  | 'matches_regex'
  | 'semver_greater_than'
  | 'semver_less_than';

/**
 * Targeting rule condition
 */
export interface TargetingCondition {
  /** Context attribute to evaluate (e.g., 'userId', 'organizationId', 'role') */
  attribute: string;
  /** Comparison operator */
  operator: TargetingOperator;
  /** Value(s) to compare against */
  value: string | number | boolean | string[] | number[];
}

/**
 * Targeting rule with multiple conditions (AND logic)
 */
export interface TargetingRule {
  /** Unique rule identifier */
  id: string;
  /** Human-readable description */
  description?: string;
  /** All conditions must match (AND logic) */
  conditions: TargetingCondition[];
  /** Value to return if all conditions match */
  value: boolean | string | number | Record<string, unknown>;
  /** Percentage rollout (0-100) - if specified, only this % of matching users get this value */
  rolloutPercentage?: number;
}

/**
 * Gradual rollout configuration
 */
export interface RolloutConfig {
  /** Enable gradual rollout */
  enabled: boolean;
  /** Percentage of users to enable (0-100) */
  percentage: number;
  /** Attribute to use for consistent hashing (default: 'userId') */
  attribute?: string;
}

/**
 * Feature flag definition
 */
export interface FeatureFlag {
  /** Unique flag key (e.g., 'google-oauth-enabled') */
  key: string;
  /** Human-readable name */
  name: string;
  /** Detailed description */
  description: string;
  /** Flag type */
  type: FlagType;
  /** Default value when no rules match */
  defaultValue: boolean | string | number | Record<string, unknown>;
  /** Whether the flag is enabled (master switch) */
  enabled: boolean;
  /** Targeting rules (evaluated in order) */
  targetingRules?: TargetingRule[];
  /** Gradual rollout configuration */
  rollout?: RolloutConfig;
  /** Tags for organization (e.g., ['auth', 'security']) */
  tags?: string[];
  /** Creation timestamp */
  createdAt: string;
  /** Last modified timestamp */
  updatedAt: string;
  /** Owner/team responsible */
  owner?: string;
  /** Related JIRA/GitHub issue */
  issueLink?: string;
  /** Whether this flag is temporary (should be removed after rollout) */
  temporary?: boolean;
  /** Planned removal date for temporary flags */
  removalDate?: string;
}

/**
 * Feature flag configuration file structure
 */
export interface FeatureFlagConfig {
  /** Configuration version for schema evolution */
  version: string;
  /** Environment (development, staging, production) */
  environment: string;
  /** All feature flags */
  flags: FeatureFlag[];
  /** Last updated timestamp */
  lastUpdated: string;
}

/**
 * Flag evaluation result
 */
export interface FlagEvaluationResult<T = boolean | string | number | Record<string, unknown>> {
  /** Evaluated value */
  value: T;
  /** Flag key */
  flagKey: string;
  /** Reason for the value (default, targeting_match, rollout, etc.) */
  reason: string;
  /** Variant identifier (for A/B testing) */
  variant?: string;
  /** Whether evaluation was successful */
  success: boolean;
  /** Error message if evaluation failed */
  error?: string;
}

/**
 * Flag evaluation context (user, org, request metadata)
 */
export interface FlagEvaluationContext {
  /** User ID */
  userId?: string;
  /** Organization ID */
  organizationId?: string;
  /** Branch ID */
  branchId?: string;
  /** User role(s) */
  role?: string | string[];
  /** User email */
  email?: string;
  /** State code (for state-specific features) */
  stateCode?: string;
  /** Application version */
  appVersion?: string;
  /** Platform (web, mobile, api) */
  platform?: string;
  /** Device type (for mobile) */
  deviceType?: string;
  /** Targeting key for rollouts */
  targetingKey?: string;
  /** IP address */
  ipAddress?: string;
  /** User agent */
  userAgent?: string;
  /** Timestamp */
  timestamp?: string;
  /** Custom attributes */
  [key: string]: string | number | boolean | string[] | number[] | undefined;
}

/**
 * Flag categories for organization
 */
export enum FlagCategory {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  COMPLIANCE = 'compliance',
  FEATURES = 'features',
  UI_UX = 'ui-ux',
  PERFORMANCE = 'performance',
  INTEGRATIONS = 'integrations',
  MOBILE = 'mobile',
  ANALYTICS = 'analytics',
  EXPERIMENTAL = 'experimental',
  DEPRECATION = 'deprecation',
}

/**
 * Well-known flag keys (for type safety)
 */
export enum FeatureFlagKey {
  // Authentication & Authorization
  GOOGLE_OAUTH_ENABLED = 'google-oauth-enabled',
  PASSWORD_AUTH_ENABLED = 'password-auth-enabled',
  BIOMETRIC_AUTH_ENABLED = 'biometric-auth-enabled',
  MFA_ENABLED = 'mfa-enabled',

  // Compliance & EVV
  EVV_ENABLED = 'evv-enabled',
  EVV_TEXAS_ENABLED = 'evv-texas-enabled',
  EVV_FLORIDA_ENABLED = 'evv-florida-enabled',
  EVV_OHIO_ENABLED = 'evv-ohio-enabled',
  EVV_GEOFENCING_ENABLED = 'evv-geofencing-enabled',
  EVV_OFFLINE_MODE = 'evv-offline-mode',

  // Major Features
  SCHEDULING_VISITS_ENABLED = 'scheduling-visits-enabled',
  SHIFT_MATCHING_ENABLED = 'shift-matching-enabled',
  CARE_PLANS_ENABLED = 'care-plans-enabled',
  BILLING_INVOICING_ENABLED = 'billing-invoicing-enabled',
  PAYROLL_PROCESSING_ENABLED = 'payroll-processing-enabled',
  ANALYTICS_DASHBOARD_ENABLED = 'analytics-dashboard-enabled',
  FAMILY_ENGAGEMENT_ENABLED = 'family-engagement-enabled',

  // Mobile Features
  MOBILE_OFFLINE_SYNC = 'mobile-offline-sync',
  MOBILE_GPS_TRACKING = 'mobile-gps-tracking',
  MOBILE_CAMERA_ENABLED = 'mobile-camera-enabled',
  MOBILE_BACKGROUND_LOCATION = 'mobile-background-location',

  // UI/UX
  NEW_DASHBOARD_LAYOUT = 'new-dashboard-layout',
  DARK_MODE_ENABLED = 'dark-mode-enabled',
  ADVANCED_FILTERS = 'advanced-filters',

  // Performance
  QUERY_CACHING_ENABLED = 'query-caching-enabled',
  LAZY_LOADING_ENABLED = 'lazy-loading-enabled',

  // Integrations
  DEMO_MODE_ENABLED = 'demo-mode-enabled',
  EXTERNAL_API_INTEGRATIONS = 'external-api-integrations',

  // Experimental
  AI_SCHEDULING_ASSISTANT = 'ai-scheduling-assistant',
  PREDICTIVE_MATCHING = 'predictive-matching',
}

/**
 * Feature flag update payload
 */
export interface UpdateFeatureFlagPayload {
  enabled?: boolean;
  defaultValue?: boolean | string | number | Record<string, unknown>;
  targetingRules?: TargetingRule[];
  rollout?: RolloutConfig;
  tags?: string[];
  owner?: string;
  issueLink?: string;
  temporary?: boolean;
  removalDate?: string;
}

/**
 * Feature flag audit event
 */
export interface FlagAuditEvent {
  id: string;
  flagKey: string;
  action: 'created' | 'updated' | 'deleted' | 'evaluated';
  userId?: string;
  timestamp: string;
  changes?: Record<string, unknown>;
  context?: FlagEvaluationContext;
}
