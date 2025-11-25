/**
 * Onboarding Types
 * 
 * Types for tracking organization onboarding progress and go-live checklist.
 * Onboarding ensures agencies complete critical setup before serving clients.
 */

import { UUID } from './base.js';

/**
 * Individual checklist item status
 */
export type ChecklistItemStatus = 'not_started' | 'in_progress' | 'completed' | 'skipped';

/**
 * Onboarding step identifiers
 * These map to the onboarding wizard steps
 */
export type OnboardingStepId = 
  | 'email_verified'
  | 'services_configured'
  | 'payors_added'
  | 'evv_configured'
  | 'first_caregiver'
  | 'first_client'
  | 'test_visit'
  | 'team_invited';

/**
 * Individual onboarding step progress
 */
export interface OnboardingStep {
  id: OnboardingStepId;
  status: ChecklistItemStatus;
  completedAt?: Date;
  completedBy?: UUID;
  skippedAt?: Date;
  skippedBy?: UUID;
  metadata?: Record<string, unknown>;
}

/**
 * Go-live checklist categories
 * These are regulatory/operational requirements beyond onboarding wizard
 */
export type GoLiveCategory = 
  | 'organization_setup'
  | 'compliance'
  | 'billing'
  | 'staff_setup'
  | 'client_setup'
  | 'operations';

/**
 * Individual go-live checklist item
 */
export interface GoLiveChecklistItem {
  id: string;
  category: GoLiveCategory;
  title: string;
  description: string;
  required: boolean;
  status: ChecklistItemStatus;
  completedAt?: Date;
  completedBy?: UUID;
  // For items that can be verified automatically
  autoVerifiable: boolean;
  // Link to related feature/page
  actionUrl?: string;
  // State-specific requirements
  stateSpecific?: boolean;
  applicableStates?: string[];
}

/**
 * Complete onboarding progress for an organization
 */
export interface OnboardingProgress {
  organizationId: UUID;
  
  // Wizard step progress
  steps: OnboardingStep[];
  currentStep: OnboardingStepId;
  wizardCompletedAt?: Date;
  
  // Go-live checklist
  goLiveChecklist: GoLiveChecklistItem[];
  goLiveReadyAt?: Date;
  goLiveApprovedAt?: Date;
  goLiveApprovedBy?: UUID;
  
  // Overall progress
  overallProgress: number; // 0-100 percentage
  requiredItemsComplete: number;
  requiredItemsTotal: number;
  optionalItemsComplete: number;
  optionalItemsTotal: number;
  
  // Timestamps
  startedAt: Date;
  updatedAt: Date;
}

/**
 * Request to update step status
 */
export interface UpdateStepRequest {
  stepId: OnboardingStepId;
  status: ChecklistItemStatus;
  metadata?: Record<string, unknown>;
}

/**
 * Request to update go-live checklist item
 */
export interface UpdateChecklistItemRequest {
  itemId: string;
  status: ChecklistItemStatus;
}

/**
 * Default go-live checklist template
 * This defines all items an organization should complete before going live
 */
export const DEFAULT_GO_LIVE_CHECKLIST: Omit<GoLiveChecklistItem, 'status' | 'completedAt' | 'completedBy'>[] = [
  // Organization Setup
  {
    id: 'org_profile_complete',
    category: 'organization_setup',
    title: 'Complete Organization Profile',
    description: 'Fill in legal name, tax ID, license number, and addresses',
    required: true,
    autoVerifiable: true,
    actionUrl: '/settings/organization',
  },
  {
    id: 'branding_configured',
    category: 'organization_setup',
    title: 'Configure Branding',
    description: 'Upload logo and set brand colors',
    required: false,
    autoVerifiable: true,
    actionUrl: '/settings/branding',
  },
  {
    id: 'admin_email_verified',
    category: 'organization_setup',
    title: 'Verify Admin Email',
    description: 'Confirm your email address to secure your account',
    required: true,
    autoVerifiable: true,
  },
  
  // Compliance
  {
    id: 'state_license_uploaded',
    category: 'compliance',
    title: 'Upload State License',
    description: 'Upload your home health agency license for your operating state',
    required: true,
    autoVerifiable: false,
    actionUrl: '/settings/compliance',
  },
  {
    id: 'hipaa_baa_signed',
    category: 'compliance',
    title: 'Sign HIPAA BAA',
    description: 'Review and sign the Business Associate Agreement',
    required: true,
    autoVerifiable: true,
    actionUrl: '/settings/legal',
  },
  {
    id: 'evv_aggregator_configured',
    category: 'compliance',
    title: 'Configure EVV Aggregator',
    description: 'Set up connection to your state EVV aggregator (e.g., HHAeXchange)',
    required: true,
    autoVerifiable: true,
    stateSpecific: true,
    actionUrl: '/settings/evv',
  },
  
  // Billing
  {
    id: 'payment_method_added',
    category: 'billing',
    title: 'Add Payment Method',
    description: 'Add a credit card or bank account for subscription billing',
    required: true,
    autoVerifiable: true,
    actionUrl: '/settings/billing',
  },
  {
    id: 'payor_configured',
    category: 'billing',
    title: 'Configure at Least One Payor',
    description: 'Set up Medicaid, Medicare, or private insurance payor',
    required: true,
    autoVerifiable: true,
    actionUrl: '/settings/payors',
  },
  {
    id: 'service_rates_configured',
    category: 'billing',
    title: 'Configure Service Rates',
    description: 'Set billing rates for your service types',
    required: true,
    autoVerifiable: true,
    actionUrl: '/settings/services',
  },
  
  // Staff Setup
  {
    id: 'first_caregiver_added',
    category: 'staff_setup',
    title: 'Add First Caregiver',
    description: 'Create your first caregiver profile with credentials',
    required: true,
    autoVerifiable: true,
    actionUrl: '/caregivers/new',
  },
  {
    id: 'caregiver_credentials_verified',
    category: 'staff_setup',
    title: 'Verify Caregiver Credentials',
    description: 'Complete background check and credential verification',
    required: true,
    autoVerifiable: false,
    stateSpecific: true,
  },
  {
    id: 'coordinator_invited',
    category: 'staff_setup',
    title: 'Invite Care Coordinator',
    description: 'Invite a care coordinator to help manage scheduling',
    required: false,
    autoVerifiable: true,
    actionUrl: '/settings/team',
  },
  
  // Client Setup
  {
    id: 'first_client_added',
    category: 'client_setup',
    title: 'Add First Client',
    description: 'Create your first client profile with demographics',
    required: true,
    autoVerifiable: true,
    actionUrl: '/clients/new',
  },
  {
    id: 'client_authorization_added',
    category: 'client_setup',
    title: 'Add Service Authorization',
    description: 'Create service authorization for your client',
    required: true,
    autoVerifiable: true,
    actionUrl: '/clients',
  },
  {
    id: 'care_plan_created',
    category: 'client_setup',
    title: 'Create Care Plan',
    description: 'Create a care plan with tasks for your client',
    required: true,
    autoVerifiable: true,
    actionUrl: '/care-plans/new',
  },
  
  // Operations
  {
    id: 'first_visit_scheduled',
    category: 'operations',
    title: 'Schedule First Visit',
    description: 'Schedule a visit between your caregiver and client',
    required: true,
    autoVerifiable: true,
    actionUrl: '/scheduling',
  },
  {
    id: 'test_clock_in_out',
    category: 'operations',
    title: 'Complete Test Clock In/Out',
    description: 'Have your caregiver complete a test visit with EVV',
    required: true,
    autoVerifiable: true,
  },
  {
    id: 'mobile_app_tested',
    category: 'operations',
    title: 'Test Mobile App',
    description: 'Install and test the caregiver mobile app',
    required: false,
    autoVerifiable: false,
  },
];

/**
 * Category labels for display
 */
export const GO_LIVE_CATEGORY_LABELS: Record<GoLiveCategory, string> = {
  organization_setup: 'Organization Setup',
  compliance: 'Compliance & Regulatory',
  billing: 'Billing & Payments',
  staff_setup: 'Staff Setup',
  client_setup: 'Client Setup',
  operations: 'Operations',
};

/**
 * Category descriptions
 */
export const GO_LIVE_CATEGORY_DESCRIPTIONS: Record<GoLiveCategory, string> = {
  organization_setup: 'Complete your agency profile and branding',
  compliance: 'Meet regulatory requirements for your state',
  billing: 'Set up payment methods and configure payors',
  staff_setup: 'Add and verify your care staff',
  client_setup: 'Onboard your first clients',
  operations: 'Test your operational workflows',
};
