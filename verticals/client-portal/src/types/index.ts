/**
 * @care-commons/client-portal - Type Definitions
 *
 * Client Portal - Self-Service Portal for Clients
 *
 * Types for client portal access, visit ratings, schedule change requests,
 * video calls, and care plan viewing. Enables clients who can self-manage
 * to interact with their care services independently.
 */

import type { Entity, UUID, Timestamp } from '@care-commons/core';

// ============================================================================
// Client Portal Access Types
// ============================================================================

/**
 * Client portal access status
 */
export type PortalAccessStatus =
  | 'PENDING_ACTIVATION' // Invitation sent, awaiting first login
  | 'ACTIVE'             // Portal access enabled and active
  | 'SUSPENDED'          // Temporarily disabled
  | 'REVOKED';           // Permanently disabled

/**
 * Client portal access record
 * Links clients to authentication system with portal-specific settings
 */
export interface ClientPortalAccess extends Entity {
  clientId: UUID;
  organizationId: UUID;
  branchId: UUID;

  // Access control
  status: PortalAccessStatus;
  portalEnabled: boolean;
  lastLoginAt: Timestamp | null;
  lastLoginIp: string | null;
  loginCount: number;

  // Invitation
  invitationCode: string | null;
  invitationSentAt: Timestamp | null;
  invitationExpiresAt: Timestamp | null;
  activatedAt: Timestamp | null;

  // Preferences
  accessibilityPreferences: AccessibilityPreferences;
  notificationPreferences: PortalNotificationPreferences;

  // Security
  passwordResetRequired: boolean;
  passwordChangedAt: Timestamp | null;
  failedLoginAttempts: number;
  lockedUntil: Timestamp | null;

  // Soft delete
  deletedAt: Timestamp | null;
  deletedBy: UUID | null;
  version: number;
}

/**
 * Accessibility preferences for WCAG 2.1 AA compliance
 */
export interface AccessibilityPreferences {
  // Font and display
  fontSize: 'SMALL' | 'MEDIUM' | 'LARGE' | 'X_LARGE';
  theme: 'LIGHT' | 'DARK' | 'HIGH_CONTRAST';
  animationsEnabled: boolean;
  reducedMotion: boolean;

  // Assistive technology
  screenReaderMode: boolean;
  keyboardNavigationOnly: boolean;
  voiceControlEnabled: boolean;

  // Visual
  highContrast: boolean;
  largeClickTargets: boolean;
  underlineLinks: boolean;

  // Audio
  captionsEnabled: boolean;
  audioDescriptions: boolean;

  // Language
  language: string; // ISO 639-1 code
  textToSpeechEnabled: boolean;
}

/**
 * Notification preferences for portal notifications
 */
export interface PortalNotificationPreferences {
  // Channels
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;

  // Notification types
  visitReminders: boolean;
  visitCompletedUpdates: boolean;
  caregiverChanges: boolean;
  scheduleChangeStatus: boolean;
  carePlanUpdates: boolean;
  appointmentReminders: boolean;

  // Timing
  quietHoursStart: string | null; // HH:mm format
  quietHoursEnd: string | null;
  timezone: string; // IANA timezone
  digestFrequency: 'IMMEDIATE' | 'DAILY' | 'WEEKLY' | 'NONE';
}

// ============================================================================
// Visit Rating Types
// ============================================================================

/**
 * Client rating for a completed visit
 */
export interface ClientVisitRating extends Entity {
  clientId: UUID;
  visitId: UUID;
  caregiverId: UUID;
  organizationId: UUID;

  // Overall rating (1-5 stars, required)
  overallRating: number;

  // Specific dimensions (1-5 stars, optional)
  professionalismRating: number | null;
  punctualityRating: number | null;
  qualityOfCareRating: number | null;
  communicationRating: number | null;

  // Written feedback
  positiveFeedback: string | null;
  improvementFeedback: string | null;
  additionalComments: string | null;

  // Preferences
  wouldRequestAgain: boolean | null;

  // Flags
  flaggedForReview: boolean;
  flagReason: string | null;

  // Metadata
  ratedAt: Timestamp;
  isAnonymous: boolean;
  visibleToCaregiver: boolean;

  // Coordinator response
  coordinatorResponse: string | null;
  coordinatorRespondedAt: Timestamp | null;
  coordinatorId: UUID | null;

  // Soft delete
  deletedAt: Timestamp | null;
  deletedBy: UUID | null;
}

/**
 * Input for creating a visit rating
 */
export interface CreateVisitRatingInput {
  visitId: UUID;
  overallRating: number;
  professionalismRating?: number;
  punctualityRating?: number;
  qualityOfCareRating?: number;
  communicationRating?: number;
  positiveFeedback?: string;
  improvementFeedback?: string;
  additionalComments?: string;
  wouldRequestAgain?: boolean;
  isAnonymous?: boolean;
}

/**
 * Visit rating with visit and caregiver details
 */
export interface VisitRatingWithDetails extends ClientVisitRating {
  visit: {
    id: UUID;
    scheduledStart: Timestamp;
    scheduledEnd: Timestamp;
    actualStart: Timestamp | null;
    actualEnd: Timestamp | null;
    status: string;
  };
  caregiver: {
    id: UUID;
    firstName: string;
    lastName: string;
    photoUrl: string | null;
  };
}

// ============================================================================
// Schedule Change Request Types
// ============================================================================

/**
 * Type of schedule change request
 */
export type ScheduleChangeRequestType =
  | 'RESCHEDULE'  // Change date/time of existing visit
  | 'CANCEL'      // Cancel a scheduled visit
  | 'ADD'         // Request a new visit
  | 'RECURRING';  // Change recurring visit pattern

/**
 * Status of schedule change request
 */
export type ScheduleChangeRequestStatus =
  | 'PENDING'    // Awaiting coordinator review
  | 'APPROVED'   // Approved and scheduled
  | 'DENIED'     // Request denied
  | 'CANCELLED'; // Client cancelled the request

/**
 * Client-initiated schedule change request
 */
export interface ScheduleChangeRequest extends Entity {
  clientId: UUID;
  visitId: UUID | null; // Null for ADD requests
  organizationId: UUID;
  branchId: UUID;

  // Request details
  requestType: ScheduleChangeRequestType;
  priority: number; // 1-5 (1 = low, 5 = urgent)

  // Current visit details (for RESCHEDULE/CANCEL)
  currentStartTime: Timestamp | null;
  currentEndTime: Timestamp | null;

  // Requested changes
  requestedStartTime: Timestamp | null;
  requestedEndTime: Timestamp | null;
  requestedReason: string;

  // Status
  status: ScheduleChangeRequestStatus;

  // Coordinator response
  reviewedBy: UUID | null;
  reviewedAt: Timestamp | null;
  reviewNotes: string | null;
  denialReason: string | null;

  // Resulting action
  newVisitId: UUID | null;
  changeApplied: boolean;
  appliedAt: Timestamp | null;

  // Notification tracking
  clientNotified: boolean;
  clientNotifiedAt: Timestamp | null;

  // Soft delete
  deletedAt: Timestamp | null;
  deletedBy: UUID | null;
}

/**
 * Input for creating a schedule change request
 */
export interface CreateScheduleChangeRequestInput {
  requestType: ScheduleChangeRequestType;
  visitId?: UUID; // Required for RESCHEDULE/CANCEL
  requestedStartTime?: Timestamp;
  requestedEndTime?: Timestamp;
  requestedReason: string;
  priority?: number; // Defaults to 1
}

/**
 * Input for coordinator review of schedule change request
 */
export interface ReviewScheduleChangeRequestInput {
  status: 'APPROVED' | 'DENIED';
  reviewNotes?: string;
  denialReason?: string;
  newVisitId?: UUID; // For approved requests
}

/**
 * Schedule change request with related data
 */
export interface ScheduleChangeRequestWithDetails extends ScheduleChangeRequest {
  visit: {
    id: UUID;
    scheduledStart: Timestamp;
    scheduledEnd: Timestamp;
    status: string;
    caregiverName: string | null;
  } | null;
  reviewer: {
    id: UUID;
    name: string;
  } | null;
}

// ============================================================================
// Video Call Session Types
// ============================================================================

/**
 * Type of video call
 */
export type VideoCallType =
  | 'SCHEDULED'   // Pre-scheduled call
  | 'ON_DEMAND'   // Immediate call request
  | 'SUPPORT';    // Technical support call

/**
 * Status of video call session
 */
export type VideoCallStatus =
  | 'SCHEDULED'   // Scheduled but not started
  | 'ACTIVE'      // Call in progress
  | 'COMPLETED'   // Successfully completed
  | 'CANCELLED'   // Cancelled before starting
  | 'NO_SHOW'     // Scheduled but not joined
  | 'FAILED';     // Technical failure

/**
 * Video call platform
 */
export type VideoCallPlatform =
  | 'ZOOM'
  | 'TWILIO'
  | 'JITSI'
  | 'WEBRTC'
  | 'TEAMS'
  | 'OTHER';

/**
 * Video call session record
 */
export interface VideoCallSession extends Entity {
  clientId: UUID;
  coordinatorId: UUID;
  organizationId: UUID;
  branchId: UUID;

  // Session details
  callType: VideoCallType;
  status: VideoCallStatus;

  // Scheduling
  scheduledStart: Timestamp | null;
  scheduledEnd: Timestamp | null;

  // Actual timing
  actualStart: Timestamp | null;
  actualEnd: Timestamp | null;
  durationMinutes: number | null;

  // Platform integration
  platform: VideoCallPlatform | null;
  externalSessionId: string | null;
  clientJoinUrl: string | null;
  coordinatorJoinUrl: string | null;
  platformMetadata: Record<string, unknown> | null;

  // Purpose and notes
  callPurpose: string | null;
  coordinatorNotes: string | null;
  clientNotes: string | null;

  // Quality and feedback
  clientRating: number | null; // 1-5
  clientFeedback: string | null;
  qualityMetrics: VideoCallQualityMetrics | null;

  // Accessibility
  captionsEnabled: boolean;
  signLanguageInterpreter: boolean;
  languagePreference: string | null;

  // Soft delete
  deletedAt: Timestamp | null;
  deletedBy: UUID | null;
}

/**
 * Video call quality metrics
 */
export interface VideoCallQualityMetrics {
  audioQuality: number; // 1-5
  videoQuality: number; // 1-5
  connectionStable: boolean;
  latencyMs: number | null;
  packetsLost: number | null;
  technicalIssues: string[];
}

/**
 * Input for scheduling a video call
 */
export interface ScheduleVideoCallInput {
  coordinatorId: UUID;
  callType: VideoCallType;
  scheduledStart: Timestamp;
  scheduledEnd: Timestamp;
  callPurpose?: string;
  captionsEnabled?: boolean;
  signLanguageInterpreter?: boolean;
  languagePreference?: string;
}

/**
 * Input for rating a completed video call
 */
export interface RateVideoCallInput {
  clientRating: number;
  clientFeedback?: string;
  qualityMetrics?: Partial<VideoCallQualityMetrics>;
}

// ============================================================================
// Care Plan Access Log Types
// ============================================================================

/**
 * Type of care plan access
 */
export type CarePlanAccessType =
  | 'VIEW'     // Viewed in portal
  | 'DOWNLOAD' // Downloaded PDF/document
  | 'PRINT';   // Printed

/**
 * Device type for access tracking
 */
export type DeviceType =
  | 'DESKTOP'
  | 'MOBILE'
  | 'TABLET'
  | 'OTHER';

/**
 * Care plan access log entry
 */
export interface CarePlanAccessLog {
  id: UUID;
  clientId: UUID;
  carePlanId: UUID;
  organizationId: UUID;

  // Access details
  accessedAt: Timestamp;
  accessType: CarePlanAccessType;
  clientIp: string | null;
  userAgent: string | null;
  deviceType: DeviceType | null;

  // Session context
  portalSessionId: UUID | null;
  timeSpentSeconds: number | null;
  fullyRead: boolean;

  // Accessibility features used
  accessibilityFeatures: Record<string, boolean> | null;
}

/**
 * Care plan access log with care plan details
 */
export interface CarePlanAccessLogWithDetails extends CarePlanAccessLog {
  carePlan: {
    id: UUID;
    name: string;
    version: number;
    createdAt: Timestamp;
    updatedAt: Timestamp;
  };
}

// ============================================================================
// Portal Session Types
// ============================================================================

/**
 * Portal session status
 */
export type PortalSessionStatus =
  | 'ACTIVE'      // Session active
  | 'EXPIRED'     // Session expired
  | 'TERMINATED'  // Terminated by system
  | 'LOGGED_OUT'; // User logged out

/**
 * Client portal session
 */
export interface ClientPortalSession {
  id: UUID;
  clientPortalAccessId: UUID;
  clientId: UUID;

  // Session details
  sessionToken: string;
  startedAt: Timestamp;
  expiresAt: Timestamp;
  lastActivityAt: Timestamp;
  endedAt: Timestamp | null;

  // Device/location
  ipAddress: string;
  userAgent: string | null;
  deviceType: DeviceType | null;
  deviceInfo: Record<string, unknown> | null;

  // Status
  status: PortalSessionStatus;
}

// ============================================================================
// Dashboard and Summary Types
// ============================================================================

/**
 * Client portal dashboard data
 */
export interface ClientPortalDashboard {
  client: {
    id: UUID;
    firstName: string;
    lastName: string;
    preferredName: string | null;
  };

  // Upcoming visits
  upcomingVisits: UpcomingVisitSummary[];

  // Recent visits (for rating)
  recentCompletedVisits: CompletedVisitSummary[];

  // Active schedule change requests
  pendingScheduleRequests: ScheduleChangeRequest[];

  // Upcoming video calls
  upcomingVideoCalls: VideoCallSession[];

  // Care plan summary
  activCarePlan: {
    id: UUID;
    name: string;
    lastUpdated: Timestamp;
    hasUnreadUpdates: boolean;
  } | null;

  // Notifications
  unreadNotifications: number;

  // Care team
  primaryCoordinator: {
    id: UUID;
    name: string;
    photoUrl: string | null;
    phone: string | null;
    email: string | null;
  } | null;
}

/**
 * Upcoming visit summary for client dashboard
 */
export interface UpcomingVisitSummary {
  id: UUID;
  scheduledStart: Timestamp;
  scheduledEnd: Timestamp;
  status: string;
  caregiver: {
    id: UUID;
    firstName: string;
    lastName: string;
    photoUrl: string | null;
  } | null;
  canRequestChange: boolean;
  canCancel: boolean;
}

/**
 * Completed visit summary for rating
 */
export interface CompletedVisitSummary {
  id: UUID;
  actualStart: Timestamp;
  actualEnd: Timestamp;
  caregiver: {
    id: UUID;
    firstName: string;
    lastName: string;
    photoUrl: string | null;
  };
  hasRating: boolean;
  ratingId: UUID | null;
}

// ============================================================================
// Service Layer Input/Output Types
// ============================================================================

/**
 * Input for inviting client to portal
 */
export interface InviteClientToPortalInput {
  clientId: UUID;
  accessibilityPreferences?: Partial<AccessibilityPreferences>;
  notificationPreferences?: Partial<PortalNotificationPreferences>;
  expiresInDays?: number; // Defaults to 7
}

/**
 * Input for activating portal access
 */
export interface ActivatePortalAccessInput {
  invitationCode: string;
  password: string;
  acceptTerms: boolean;
}

/**
 * Input for updating accessibility preferences
 */
export interface UpdateAccessibilityPreferencesInput {
  fontSize?: 'SMALL' | 'MEDIUM' | 'LARGE' | 'X_LARGE';
  theme?: 'LIGHT' | 'DARK' | 'HIGH_CONTRAST';
  animationsEnabled?: boolean;
  reducedMotion?: boolean;
  screenReaderMode?: boolean;
  keyboardNavigationOnly?: boolean;
  voiceControlEnabled?: boolean;
  highContrast?: boolean;
  captionsEnabled?: boolean;
  textToSpeechEnabled?: boolean;
}

/**
 * Input for updating notification preferences
 */
export interface UpdateNotificationPreferencesInput {
  emailEnabled?: boolean;
  smsEnabled?: boolean;
  pushEnabled?: boolean;
  visitReminders?: boolean;
  visitCompletedUpdates?: boolean;
  caregiverChanges?: boolean;
  scheduleChangeStatus?: boolean;
  carePlanUpdates?: boolean;
  appointmentReminders?: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  timezone?: string;
  digestFrequency?: 'IMMEDIATE' | 'DAILY' | 'WEEKLY' | 'NONE';
}

/**
 * Search filters for visit ratings
 */
export interface VisitRatingFilters {
  clientId?: UUID;
  caregiverId?: UUID;
  minRating?: number;
  maxRating?: number;
  flaggedOnly?: boolean;
  startDate?: Timestamp;
  endDate?: Timestamp;
}

/**
 * Search filters for schedule change requests
 */
export interface ScheduleChangeRequestFilters {
  clientId?: UUID;
  status?: ScheduleChangeRequestStatus[];
  requestType?: ScheduleChangeRequestType[];
  startDate?: Timestamp;
  endDate?: Timestamp;
}

/**
 * Search filters for video call sessions
 */
export interface VideoCallSessionFilters {
  clientId?: UUID;
  coordinatorId?: UUID;
  status?: VideoCallStatus[];
  callType?: VideoCallType[];
  startDate?: Timestamp;
  endDate?: Timestamp;
}
