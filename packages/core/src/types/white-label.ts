/**
 * @care-commons/core - White-Labeling Types
 *
 * Types for multi-agency white-labeling support:
 * - Organization branding
 * - Email templates
 * - Subscriptions and billing
 * - Usage metrics
 */

import type { Entity, SoftDeletable, UUID, Timestamp } from './base';

/**
 * Organization branding configuration for white-labeling
 */
export interface OrganizationBranding extends Entity, SoftDeletable {
  organizationId: UUID;

  // Brand identity
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string; // Hex color (e.g., "#3b82f6")
  secondaryColor: string;
  accentColor: string;
  brandName: string | null;
  tagline: string | null;

  // Custom domain
  customDomain: string | null;
  domainVerified: boolean;
  domainVerifiedAt: Timestamp | null;

  // Email branding
  emailFromName: string | null;
  emailFromAddress: string | null;
  emailReplyTo: string | null;
  emailHeaderColor: string;
  emailFooterText: string | null;

  // Legal
  termsOfServiceUrl: string | null;
  privacyPolicyUrl: string | null;
  customTermsContent: string | null; // Rich text/HTML

  // Feature flags
  featureFlags: Record<string, boolean>;

  // Theme customization
  themeOverrides: ThemeOverrides;

  // Additional settings
  settings: Record<string, unknown>;
}

/**
 * Theme overrides for CSS customization
 */
export interface ThemeOverrides {
  fontFamily?: string;
  fontSize?: string;
  borderRadius?: string;
  shadows?: Record<string, string>;
  spacing?: Record<string, string>;
  breakpoints?: Record<string, string>;
  [key: string]: unknown;
}

/**
 * Email template with organization-specific customization
 */
export interface EmailTemplate extends Entity, SoftDeletable {
  organizationId: UUID | null; // null = system default template

  // Template identification
  templateKey: EmailTemplateKey;
  name: string;
  description: string | null;

  // Template content
  subject: string;
  htmlBody: string; // HTML with placeholders {{firstName}}
  textBody: string | null; // Plain text fallback

  // Metadata
  availableVariables: string[]; // List of {{var}} available
  isActive: boolean;
  isSystemTemplate: boolean; // Can't be deleted
}

/**
 * Predefined email template keys
 */
export type EmailTemplateKey =
  | 'WELCOME_EMAIL'
  | 'INVITATION_EMAIL'
  | 'PASSWORD_RESET'
  | 'PASSWORD_CHANGED'
  | 'VISIT_REMINDER'
  | 'VISIT_SCHEDULED'
  | 'VISIT_CANCELLED'
  | 'VISIT_COMPLETED'
  | 'TIMESHEET_REMINDER'
  | 'INVOICE_GENERATED'
  | 'PAYMENT_RECEIVED'
  | 'CARE_PLAN_UPDATED'
  | 'INCIDENT_REPORTED'
  | 'MESSAGE_RECEIVED'
  | 'FAMILY_NOTIFICATION'
  | 'ACCOUNT_LOCKED'
  | 'SECURITY_ALERT'
  | 'SYSTEM_ANNOUNCEMENT';

/**
 * Organization subscription and billing
 */
export interface OrganizationSubscription extends Entity {
  organizationId: UUID;

  // Subscription details
  planTier: SubscriptionPlanTier;
  billingCycle: BillingCycle;
  monthlyPrice: number;
  currency: string; // ISO currency code (e.g., "USD")

  // Plan limits
  maxUsers: number | null;
  maxClients: number | null;
  maxCaregivers: number | null;
  whiteLabelingEnabled: boolean;
  customDomainEnabled: boolean;
  apiAccessEnabled: boolean;

  // Subscription lifecycle
  status: SubscriptionStatus;
  trialEndsAt: Timestamp | null;
  currentPeriodStart: Timestamp;
  currentPeriodEnd: Timestamp | null;
  cancelledAt: Timestamp | null;
  cancellationReason: string | null;

  // Payment integration
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
}

/**
 * Subscription plan tiers
 */
export type SubscriptionPlanTier =
  | 'FREE'
  | 'BASIC'
  | 'PROFESSIONAL'
  | 'ENTERPRISE'
  | 'CUSTOM';

/**
 * Billing cycle options
 */
export type BillingCycle = 'MONTHLY' | 'ANNUAL';

/**
 * Subscription status
 */
export type SubscriptionStatus =
  | 'ACTIVE'
  | 'TRIAL'
  | 'SUSPENDED'
  | 'CANCELLED'
  | 'EXPIRED';

/**
 * Daily usage metrics per organization
 */
export interface OrganizationUsageMetrics {
  id: UUID;
  organizationId: UUID;
  metricDate: Date; // Daily metrics

  // User metrics
  activeUsers: number;
  totalUsers: number;
  newUsers: number;

  // Client/Caregiver metrics
  activeClients: number;
  activeCaregivers: number;
  totalClients: number;
  totalCaregivers: number;

  // Activity metrics
  visitsScheduled: number;
  visitsCompleted: number;
  evvRecordsCreated: number;
  invoicesGenerated: number;
  totalBillableHours: number;
  totalRevenue: number;

  // API usage
  apiCalls: number;
  storageMb: number;

  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Request/response types for branding API
 */
export interface UpdateBrandingRequest {
  logoUrl?: string | null;
  faviconUrl?: string | null;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  brandName?: string | null;
  tagline?: string | null;
  customDomain?: string | null;
  emailFromName?: string | null;
  emailFromAddress?: string | null;
  emailReplyTo?: string | null;
  emailHeaderColor?: string;
  emailFooterText?: string | null;
  termsOfServiceUrl?: string | null;
  privacyPolicyUrl?: string | null;
  customTermsContent?: string | null;
  featureFlags?: Record<string, boolean>;
  themeOverrides?: ThemeOverrides;
  settings?: Record<string, unknown>;
}

/**
 * Request type for creating/updating email templates
 */
export interface CreateEmailTemplateRequest {
  templateKey: EmailTemplateKey;
  name: string;
  description?: string | null;
  subject: string;
  htmlBody: string;
  textBody?: string | null;
  availableVariables?: string[];
  isActive?: boolean;
}

export interface UpdateEmailTemplateRequest extends Partial<CreateEmailTemplateRequest> {}

/**
 * Request type for updating subscription
 */
export interface UpdateSubscriptionRequest {
  planTier?: SubscriptionPlanTier;
  billingCycle?: BillingCycle;
  maxUsers?: number | null;
  maxClients?: number | null;
  maxCaregivers?: number | null;
  whiteLabelingEnabled?: boolean;
  customDomainEnabled?: boolean;
  apiAccessEnabled?: boolean;
}

/**
 * Super admin dashboard statistics
 */
export interface SuperAdminDashboardStats {
  totalOrganizations: number;
  activeOrganizations: number;
  trialOrganizations: number;
  totalUsers: number;
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  averageRevenuePerOrganization: number;
  organizationsByPlan: Record<SubscriptionPlanTier, number>;
  recentSignups: Array<{
    organizationId: UUID;
    organizationName: string;
    signupDate: Timestamp;
    planTier: SubscriptionPlanTier;
  }>;
  topOrganizationsByUsage: Array<{
    organizationId: UUID;
    organizationName: string;
    totalUsers: number;
    totalClients: number;
    totalRevenue: number;
  }>;
}

/**
 * Organization details for super admin view
 */
export interface OrganizationDetail {
  id: UUID;
  name: string;
  legalName: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  stateCode: string | null;
  createdAt: Timestamp;

  // Subscription info
  subscription: OrganizationSubscription | null;

  // Branding info
  branding: OrganizationBranding | null;

  // Usage summary
  currentUsage: {
    totalUsers: number;
    totalClients: number;
    totalCaregivers: number;
    activeBranches: number;
  };

  // Recent activity
  recentMetrics: OrganizationUsageMetrics[];
}
