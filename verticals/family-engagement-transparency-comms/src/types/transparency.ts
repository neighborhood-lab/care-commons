/**
 * Transparency Settings domain model
 *
 * Configuration for what information is visible to families
 * and how families can interact with the system.
 */

import { Entity, UUID } from '@care-commons/core';

/**
 * Transparency settings entity
 * Can be organization-level (default) or client-specific (override)
 */
export interface TransparencySettings extends Entity {
  id: UUID;
  organizationId: UUID;
  clientId?: UUID; // Null = org-level defaults, populated = client-specific overrides

  // General settings
  enableFamilyPortal: boolean;
  allowFamilyRegistration: boolean;
  requireStaffApproval: boolean;

  // Default visibility settings
  defaultShowCarePlan: boolean;
  defaultShowVisitSchedule: boolean;
  defaultShowVisitNotes: boolean;
  defaultShowProgressUpdates: boolean;
  defaultShowMedications: boolean;
  defaultShowVitalSigns: boolean;
  defaultShowInvoices: boolean;

  // Communication settings
  enableMessaging: boolean;
  enableFamilyToStaffMessages: boolean;
  enableStaffToFamilyMessages: boolean;
  requireMessageModeration: boolean;
  messageResponseSlaHours: number;

  // Notification settings
  autoNotifyVisitStart: boolean;
  autoNotifyVisitEnd: boolean;
  autoNotifyVisitMissed: boolean;
  autoNotifyScheduleChanges: boolean;
  autoNotifyIncidents: boolean;

  // Progress update frequency
  progressUpdateFrequency: ProgressUpdateFrequency;
  progressUpdateDayOfWeek?: number; // 0-6 for weekly
  progressUpdateTime?: string; // HH:mm format

  // Privacy and retention
  messageRetentionDays: number;
  accessLogRetentionDays: number;
  redactStaffNames: boolean;
  redactCaregiverDetails: boolean;

  // Custom messaging
  welcomeMessage?: string;
  privacyNotice?: string;
  customSettings?: Record<string, unknown>;

  // Audit fields
  createdAt: Date;
  createdBy: UUID;
  updatedAt: Date;
  updatedBy: UUID;
}

/**
 * Progress update frequency options
 */
export type ProgressUpdateFrequency =
  | 'DAILY'
  | 'WEEKLY'
  | 'BIWEEKLY'
  | 'MONTHLY'
  | 'NEVER';

/**
 * Input for creating transparency settings
 */
export interface CreateTransparencySettingsInput {
  organizationId: UUID;
  clientId?: UUID;

  // General settings
  enableFamilyPortal?: boolean;
  allowFamilyRegistration?: boolean;
  requireStaffApproval?: boolean;

  // Visibility settings
  defaultShowCarePlan?: boolean;
  defaultShowVisitSchedule?: boolean;
  defaultShowVisitNotes?: boolean;
  defaultShowProgressUpdates?: boolean;
  defaultShowMedications?: boolean;
  defaultShowVitalSigns?: boolean;
  defaultShowInvoices?: boolean;

  // Communication settings
  enableMessaging?: boolean;
  enableFamilyToStaffMessages?: boolean;
  enableStaffToFamilyMessages?: boolean;
  requireMessageModeration?: boolean;
  messageResponseSlaHours?: number;

  // Notification settings
  autoNotifyVisitStart?: boolean;
  autoNotifyVisitEnd?: boolean;
  autoNotifyVisitMissed?: boolean;
  autoNotifyScheduleChanges?: boolean;
  autoNotifyIncidents?: boolean;

  // Progress updates
  progressUpdateFrequency?: ProgressUpdateFrequency;
  progressUpdateDayOfWeek?: number;
  progressUpdateTime?: string;

  // Privacy
  messageRetentionDays?: number;
  accessLogRetentionDays?: number;
  redactStaffNames?: boolean;
  redactCaregiverDetails?: boolean;

  // Custom content
  welcomeMessage?: string;
  privacyNotice?: string;
  customSettings?: Record<string, unknown>;
}

/**
 * Input for updating transparency settings
 */
export interface UpdateTransparencySettingsInput {
  // All fields optional for updates
  enableFamilyPortal?: boolean;
  allowFamilyRegistration?: boolean;
  requireStaffApproval?: boolean;
  defaultShowCarePlan?: boolean;
  defaultShowVisitSchedule?: boolean;
  defaultShowVisitNotes?: boolean;
  defaultShowProgressUpdates?: boolean;
  defaultShowMedications?: boolean;
  defaultShowVitalSigns?: boolean;
  defaultShowInvoices?: boolean;
  enableMessaging?: boolean;
  enableFamilyToStaffMessages?: boolean;
  enableStaffToFamilyMessages?: boolean;
  requireMessageModeration?: boolean;
  messageResponseSlaHours?: number;
  autoNotifyVisitStart?: boolean;
  autoNotifyVisitEnd?: boolean;
  autoNotifyVisitMissed?: boolean;
  autoNotifyScheduleChanges?: boolean;
  autoNotifyIncidents?: boolean;
  progressUpdateFrequency?: ProgressUpdateFrequency;
  progressUpdateDayOfWeek?: number;
  progressUpdateTime?: string;
  messageRetentionDays?: number;
  accessLogRetentionDays?: number;
  redactStaffNames?: boolean;
  redactCaregiverDetails?: boolean;
  welcomeMessage?: string;
  privacyNotice?: string;
  customSettings?: Record<string, unknown>;
}

/**
 * Progress update entity
 */
export interface ProgressUpdate extends Entity {
  id: UUID;
  organizationId: UUID;
  clientId: UUID;

  // Update details
  updateType: UpdateType;
  title: string;
  summary: string;
  content?: ProgressUpdateContent;

  // Period covered
  periodStart: Date;
  periodEnd: Date;

  // Generation
  generationMethod: GenerationMethod;
  generatedBy?: UUID;
  generatedAt: Date;

  // Publishing
  status: ProgressUpdateStatus;
  publishedAt?: Date;
  publishedBy?: UUID;
  isVisibleToFamilies: boolean;

  // Delivery tracking
  recipients?: UUID[]; // Family member IDs
  recipientsCount: number;
  deliveredCount: number;
  readCount: number;
  firstReadAt?: Date;

  // Related resources
  relatedCarePlanId?: UUID;
  relatedVisitIds?: UUID[];
  relatedGoalIds?: UUID[];

  // Attachments and highlights
  attachments?: Attachment[];
  highlights?: Highlight[];

  // Audit fields
  createdAt: Date;
  updatedAt: Date;
  archivedAt?: Date;
}

/**
 * Update types
 */
export type UpdateType =
  | 'DAILY' // Daily summary
  | 'WEEKLY' // Weekly report
  | 'MONTHLY' // Monthly report
  | 'MILESTONE' // Milestone achievement
  | 'INCIDENT' // Incident update
  | 'AD_HOC'; // One-time update

/**
 * Generation methods
 */
export type GenerationMethod =
  | 'AUTOMATED' // System-generated
  | 'MANUAL' // Staff-written
  | 'HYBRID'; // System-generated + staff-edited

/**
 * Progress update status
 */
export type ProgressUpdateStatus =
  | 'DRAFT' // Being edited
  | 'PENDING_REVIEW' // Awaiting approval
  | 'PUBLISHED' // Published to families
  | 'ARCHIVED'; // Archived

/**
 * Progress update content structure
 */
export interface ProgressUpdateContent {
  visitsCompleted?: number;
  visitsCancelled?: number;
  totalHours?: number;
  goalsProgress?: GoalProgress[];
  tasksCompleted?: number;
  totalTasks?: number;
  medicationChanges?: string[];
  keyObservations?: string[];
  caregiverNotes?: string[];
  concerns?: string[];
  achievements?: string[];
}

/**
 * Goal progress summary
 */
export interface GoalProgress {
  goalId: UUID;
  goalDescription: string;
  targetDate?: Date;
  progressPercentage: number;
  status: 'ON_TRACK' | 'AT_RISK' | 'DELAYED' | 'COMPLETED';
  recentActivity?: string;
}

/**
 * Attachment structure
 */
export interface Attachment {
  fileName: string;
  fileType: string;
  url: string;
  size?: number;
}

/**
 * Highlight structure
 */
export interface Highlight {
  type: 'ACHIEVEMENT' | 'CONCERN' | 'MILESTONE' | 'CHANGE';
  title: string;
  description: string;
  importance: 'LOW' | 'MEDIUM' | 'HIGH';
}

/**
 * Input for creating progress update
 */
export interface CreateProgressUpdateInput {
  organizationId: UUID;
  clientId: UUID;
  updateType: UpdateType;
  title: string;
  summary: string;
  content?: ProgressUpdateContent;
  periodStart: Date;
  periodEnd: Date;
  generationMethod: GenerationMethod;
  relatedCarePlanId?: UUID;
  relatedVisitIds?: UUID[];
  relatedGoalIds?: UUID[];
  attachments?: Attachment[];
  highlights?: Highlight[];
}

/**
 * Input for updating progress update
 */
export interface UpdateProgressUpdateInput {
  title?: string;
  summary?: string;
  content?: ProgressUpdateContent;
  status?: ProgressUpdateStatus;
  highlights?: Highlight[];
  attachments?: Attachment[];
}

/**
 * Input for publishing progress update
 */
export interface PublishProgressUpdateInput {
  progressUpdateId: UUID;
  notifyFamilies?: boolean;
  notificationMethods?: ('EMAIL' | 'SMS' | 'PUSH')[];
  customMessage?: string;
}

/**
 * Family access log entry
 */
export interface FamilyAccessLog extends Entity {
  id: UUID;
  organizationId: UUID;
  familyMemberId: UUID;
  clientId?: UUID;

  // Access details
  actionType: AccessActionType;
  resourceType: ResourceType;
  resourceId?: UUID;
  actionDetails?: Record<string, unknown>;

  // Access metadata
  accessedAt: Date;
  ipAddress?: string;
  userAgent?: string;
  deviceType?: DeviceType;
  sessionId?: string;

  // Result
  result: AccessResult;
  errorMessage?: string;
}

/**
 * Access action types
 */
export type AccessActionType =
  | 'VIEW'
  | 'DOWNLOAD'
  | 'SEND_MESSAGE'
  | 'REQUEST'
  | 'UPDATE'
  | 'UPLOAD'
  | 'SIGN'
  | 'LOGIN'
  | 'LOGOUT';

/**
 * Resource types
 */
export type ResourceType =
  | 'CARE_PLAN'
  | 'VISIT_NOTE'
  | 'VISIT_SCHEDULE'
  | 'PROGRESS_UPDATE'
  | 'MESSAGE'
  | 'DOCUMENT'
  | 'MEDICATION'
  | 'VITAL_SIGNS'
  | 'INVOICE'
  | 'PROFILE'
  | 'SETTINGS';

/**
 * Device types
 */
export type DeviceType =
  | 'WEB'
  | 'MOBILE_IOS'
  | 'MOBILE_ANDROID'
  | 'TABLET'
  | 'OTHER';

/**
 * Access results
 */
export type AccessResult = 'SUCCESS' | 'DENIED' | 'ERROR';

/**
 * Communication template entity
 */
export interface CommunicationTemplate extends Entity {
  id: UUID;
  organizationId: UUID;

  // Template details
  templateName: string;
  templateCode: string;
  description?: string;
  category: TemplateCategory;

  // Content
  subjectTemplate?: string;
  bodyTemplate: string;
  contentFormat: 'PLAIN' | 'MARKDOWN' | 'HTML';

  // Variables
  availableVariables?: string[];
  defaultValues?: Record<string, string>;
  requiresCustomization: boolean;

  // Usage
  deliveryMethod: DeliveryMethod;
  triggerEvent?: string;
  isSystemTemplate: boolean;
  isActive: boolean;

  // Localization
  language: string;
  baseTemplateId?: UUID;

  // Tracking
  usageCount: number;
  lastUsedAt?: Date;

  // Audit fields
  createdAt: Date;
  createdBy: UUID;
  updatedAt: Date;
  updatedBy: UUID;
  deletedAt?: Date;
}

/**
 * Template categories
 */
export type TemplateCategory =
  | 'WELCOME'
  | 'VISIT_REMINDER'
  | 'SCHEDULE_CHANGE'
  | 'INCIDENT'
  | 'PROGRESS_UPDATE'
  | 'APPOINTMENT'
  | 'BILLING'
  | 'FEEDBACK_REQUEST'
  | 'GENERAL';

/**
 * Delivery methods
 */
export type DeliveryMethod = 'EMAIL' | 'SMS' | 'IN_APP' | 'PUSH' | 'ALL';
