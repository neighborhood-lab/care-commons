/**
 * @care-commons/family-engagement - Type Definitions
 *
 * Family Engagement Platform - Transparency & Communication
 *
 * Types for family portal access, notifications, messaging, and
 * transparency features that enable family members to stay informed
 * about their loved one's care.
 */

import type { Entity, UUID, Timestamp } from '@care-commons/core';

// ============================================================================
// Family Member & Portal Access Types
// ============================================================================

/**
 * Relationship type between family member and client
 */
export type FamilyRelationship =
  | 'SPOUSE'
  | 'PARENT'
  | 'CHILD'
  | 'SIBLING'
  | 'GRANDPARENT'
  | 'GRANDCHILD'
  | 'GUARDIAN'
  | 'POWER_OF_ATTORNEY'
  | 'HEALTHCARE_PROXY'
  | 'OTHER';

/**
 * Portal access level determining what information family can view
 */
export type PortalAccessLevel =
  | 'VIEW_BASIC' // View basic profile, visit schedules
  | 'VIEW_DETAILED' // View care plans, progress, notes
  | 'VIEW_MEDICAL' // View medical info, medications, vitals
  | 'VIEW_FINANCIAL' // View billing and payment information
  | 'FULL_ACCESS'; // Complete access to all information

/**
 * Status of portal invitation
 */
export type InvitationStatus =
  | 'PENDING' // Invitation sent, awaiting acceptance
  | 'ACCEPTED' // User accepted and portal active
  | 'DECLINED' // User declined invitation
  | 'EXPIRED' // Invitation expired before acceptance
  | 'REVOKED'; // Access revoked by admin/coordinator

/**
 * Family member with portal access
 */
export interface FamilyMember extends Entity {
  // Client relationship
  clientId: UUID;
  relationship: FamilyRelationship;
  relationshipNote?: string;
  isPrimaryContact: boolean;

  // Personal information
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  preferredContactMethod: 'EMAIL' | 'PHONE' | 'SMS' | 'PORTAL';

  // Portal access
  portalAccessLevel: PortalAccessLevel;
  accessGrantedBy: UUID; // Coordinator or admin who granted access
  accessGrantedAt: Timestamp;
  accessExpiresAt?: Timestamp | null; // Optional expiration date

  // Status
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  invitationStatus: InvitationStatus;
  invitationSentAt?: Timestamp;
  invitationAcceptedAt?: Timestamp | null;

  // Preferences
  receiveNotifications: boolean;
  notificationPreferences: NotificationPreferences;

  // Security
  lastLoginAt?: Timestamp | null;
  passwordResetRequired: boolean;

  // Organization context
  organizationId: UUID;
  branchId: UUID;
}

/**
 * Notification preferences for family member
 */
export interface NotificationPreferences {
  // Channels
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;

  // Notification types
  visitReminders: boolean;
  visitCompletedUpdates: boolean;
  careplanUpdates: boolean;
  incidentAlerts: boolean;
  appointmentReminders: boolean;
  messageNotifications: boolean;

  // Frequency
  digestFrequency: 'IMMEDIATE' | 'DAILY' | 'WEEKLY' | 'NONE';
  quietHoursStart?: string; // HH:mm format
  quietHoursEnd?: string;
}

/**
 * Portal invitation record
 */
export interface PortalInvitation extends Entity {
  familyMemberId: UUID;
  clientId: UUID;
  invitationCode: string; // Unique secure code for registration
  status: InvitationStatus;
  sentAt: Timestamp;
  expiresAt: Timestamp;
  acceptedAt?: Timestamp | null;
  declinedAt?: Timestamp | null;
  revokedAt?: Timestamp | null;
  revokedBy?: UUID | null;
  revokedReason?: string;
}

// ============================================================================
// Notification & Alert Types
// ============================================================================

/**
 * Notification category
 */
export type NotificationCategory =
  | 'VISIT' // Visit-related updates
  | 'CARE_PLAN' // Care plan changes
  | 'INCIDENT' // Incidents or concerns
  | 'APPOINTMENT' // Medical appointments
  | 'MESSAGE' // Direct messages
  | 'REMINDER' // General reminders
  | 'SYSTEM'; // System notifications

/**
 * Notification priority
 */
export type NotificationPriority =
  | 'LOW'
  | 'NORMAL'
  | 'HIGH'
  | 'URGENT';

/**
 * Notification delivery status
 */
export type NotificationDeliveryStatus =
  | 'PENDING' // Queued for delivery
  | 'SENT' // Successfully sent
  | 'DELIVERED' // Confirmed delivered
  | 'READ' // User has read notification
  | 'FAILED' // Delivery failed
  | 'DISMISSED'; // User dismissed without reading

/**
 * Notification sent to family member
 */
export interface Notification extends Entity {
  familyMemberId: UUID;
  clientId: UUID;

  // Content
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  message: string;
  actionUrl?: string; // Deep link to relevant portal page
  actionLabel?: string; // Button label (e.g., "View Details")

  // Metadata
  relatedEntityType?: 'VISIT' | 'CARE_PLAN' | 'INCIDENT' | 'MESSAGE' | 'APPOINTMENT';
  relatedEntityId?: UUID;

  // Delivery
  deliveryStatus: NotificationDeliveryStatus;
  sentAt?: Timestamp;
  deliveredAt?: Timestamp | null;
  readAt?: Timestamp | null;
  dismissedAt?: Timestamp | null;

  // Channels used
  emailSent: boolean;
  smsSent: boolean;
  pushSent: boolean;

  // Expiration
  expiresAt?: Timestamp | null;

  organizationId: UUID;
}

// ============================================================================
// Activity Feed Types
// ============================================================================

/**
 * Activity type for feed
 */
export type ActivityType =
  | 'VISIT_SCHEDULED' // New visit scheduled
  | 'VISIT_STARTED' // Caregiver started visit
  | 'VISIT_COMPLETED' // Visit completed
  | 'VISIT_CANCELLED' // Visit cancelled
  | 'CARE_PLAN_UPDATED' // Care plan modified
  | 'GOAL_ACHIEVED' // Care goal achieved
  | 'TASK_COMPLETED' // Care task completed
  | 'NOTE_ADDED' // Progress note added
  | 'INCIDENT_REPORTED' // Incident reported
  | 'MESSAGE_RECEIVED' // New message
  | 'DOCUMENT_UPLOADED'; // Document added

/**
 * Activity feed item showing care updates
 */
export interface ActivityFeedItem extends Entity {
  familyMemberId: UUID;
  clientId: UUID;

  // Activity details
  activityType: ActivityType;
  title: string;
  description: string;
  summary?: string; // Optional brief summary

  // Related entities
  relatedEntityType: 'VISIT' | 'CARE_PLAN' | 'GOAL' | 'TASK' | 'NOTE' | 'INCIDENT' | 'MESSAGE' | 'DOCUMENT';
  relatedEntityId: UUID;

  // Metadata
  performedBy?: UUID; // Caregiver or coordinator who performed action
  performedByName?: string;
  occurredAt: Timestamp; // When the actual event occurred

  // Display
  iconType?: string; // Icon identifier for UI
  viewedByFamily: boolean;
  viewedAt?: Timestamp | null;

  organizationId: UUID;
  branchId: UUID;
}

// ============================================================================
// Messaging & Communication Types
// ============================================================================

/**
 * Message thread between family and care team
 */
export interface MessageThread extends Entity {
  familyMemberId: UUID;
  clientId: UUID;

  // Thread details
  subject: string;
  status: 'OPEN' | 'CLOSED' | 'ARCHIVED';
  priority: 'LOW' | 'NORMAL' | 'HIGH';

  // Participants
  participants: UUID[]; // User IDs of all participants
  assignedToUserId?: UUID; // Care coordinator assigned to thread

  // Metadata
  lastMessageAt: Timestamp;
  messageCount: number;
  unreadCountFamily: number;
  unreadCountStaff: number;

  organizationId: UUID;
  branchId: UUID;
}

/**
 * Individual message in a thread
 */
export interface Message extends Entity {
  threadId: UUID;
  familyMemberId: UUID;
  clientId: UUID;

  // Sender
  sentBy: UUID;
  senderType: 'FAMILY' | 'STAFF';
  senderName: string;

  // Content
  messageText: string;
  attachmentUrls?: string[];

  // Status
  status: 'SENT' | 'DELIVERED' | 'READ';
  readAt?: Timestamp | null;
  readBy?: UUID[];

  // Flags
  isInternal: boolean; // Internal staff note not visible to family
  flaggedForReview: boolean;
  flaggedReason?: string;

  organizationId: UUID;
}

// ============================================================================
// Transparency & Care Update Types
// ============================================================================

/**
 * Visit summary shared with family
 */
export interface VisitSummary extends Entity {
  visitId: UUID;
  clientId: UUID;
  familyMemberIds: UUID[]; // Family members who can view this

  // Visit details
  scheduledStartTime: Timestamp;
  scheduledEndTime: Timestamp;
  actualStartTime?: Timestamp;
  actualEndTime?: Timestamp;

  // Care provided
  caregiverName: string;
  caregiverPhotoUrl?: string;
  tasksCompleted: VisitTaskSummary[];
  visitNotes?: string; // Family-friendly summary

  // Status
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  cancellationReason?: string;

  // Visibility
  visibleToFamily: boolean;
  publishedAt?: Timestamp | null;
  viewedByFamily: boolean;
  viewedAt?: Timestamp | null;

  organizationId: UUID;
  branchId: UUID;
}

/**
 * Summary of task completed during visit
 */
export interface VisitTaskSummary {
  taskId: UUID;
  taskName: string;
  category: string;
  status: 'COMPLETED' | 'SKIPPED' | 'INCOMPLETE';
  completedAt?: Timestamp;
  skipReason?: string;
  notes?: string; // Family-appropriate notes
}

/**
 * Care plan progress report for family
 */
export interface CarePlanProgressReport extends Entity {
  carePlanId: UUID;
  clientId: UUID;
  familyMemberIds: UUID[];

  // Report period
  reportPeriodStart: Timestamp;
  reportPeriodEnd: Timestamp;
  reportType: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'AD_HOC';

  // Progress summary
  goalsTotal: number;
  goalsAchieved: number;
  goalsInProgress: number;
  goalsAtRisk: number;

  // Goal details
  goalProgress: GoalProgressSummary[];

  // Narrative summary
  overallSummary: string;
  concernsNoted?: string;
  recommendationsForFamily?: string;

  // Metadata
  preparedBy: UUID;
  preparedByName: string;
  publishedAt?: Timestamp | null;

  organizationId: UUID;
  branchId: UUID;
}

/**
 * Summary of goal progress
 */
export interface GoalProgressSummary {
  goalId: UUID;
  goalName: string;
  category: string;
  targetDate: Timestamp;
  currentStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'ON_TRACK' | 'AT_RISK' | 'ACHIEVED';
  progressPercentage: number;
  recentUpdates: string;
}

// ============================================================================
// Consent & Authorization Types
// ============================================================================

/**
 * Consent record for information sharing
 */
export interface FamilyConsent extends Entity {
  familyMemberId: UUID;
  clientId: UUID;

  // Consent details
  consentType: 'PORTAL_ACCESS' | 'INFORMATION_SHARING' | 'HIPAA_AUTHORIZATION' | 'PHOTO_SHARING';
  consentGiven: boolean;
  consentDate: Timestamp;
  expiresAt?: Timestamp | null;

  // Legal
  signedByClientId?: UUID; // If client gave consent
  signedByGuardianId?: UUID; // If guardian gave consent
  documentUrl?: string; // Signed consent form

  // Revocation
  revokedAt?: Timestamp | null;
  revokedBy?: UUID;
  revokedReason?: string;

  organizationId: UUID;
}

// ============================================================================
// Service Layer Input/Output Types
// ============================================================================

/**
 * Input for inviting family member to portal
 */
export interface InviteFamilyMemberInput {
  clientId: UUID;
  relationship: FamilyRelationship;
  relationshipNote?: string;
  isPrimaryContact: boolean;

  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;

  portalAccessLevel: PortalAccessLevel;
  accessExpiresAt?: Timestamp | null;

  // Optional preferences
  notificationPreferences?: Partial<NotificationPreferences>;
}

/**
 * Input for sending notification
 */
export interface SendNotificationInput {
  familyMemberId: UUID;
  clientId: UUID;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  relatedEntityType?: 'VISIT' | 'CARE_PLAN' | 'INCIDENT' | 'MESSAGE' | 'APPOINTMENT';
  relatedEntityId?: UUID;
}

/**
 * Input for creating message thread
 */
export interface CreateMessageThreadInput {
  familyMemberId: UUID;
  clientId: UUID;
  subject: string;
  initialMessage: string;
  priority?: 'LOW' | 'NORMAL' | 'HIGH';
  assignedToUserId?: UUID;
}

/**
 * Input for sending message in thread
 */
export interface SendMessageInput {
  threadId: UUID;
  messageText: string;
  attachmentUrls?: string[];
  isInternal?: boolean;
}

/**
 * Input for publishing visit summary
 */
export interface PublishVisitSummaryInput {
  visitId: UUID;
  clientId: UUID;
  familyMemberIds: UUID[];
  visitNotes?: string;
  tasksToInclude: UUID[];
  visibleToFamily: boolean;
}

/**
 * Input for generating care plan progress report
 */
export interface GenerateProgressReportInput {
  carePlanId: UUID;
  clientId: UUID;
  familyMemberIds: UUID[];
  reportPeriodStart: Timestamp;
  reportPeriodEnd: Timestamp;
  reportType: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'AD_HOC';
  overallSummary: string;
  concernsNoted?: string;
  recommendationsForFamily?: string;
}

// ============================================================================
// Query Result Types
// ============================================================================

/**
 * Care team member for family dashboard
 */
export interface CareTeamMember {
  id: UUID;
  name: string;
  role: string;
  photoUrl?: string;
  isPrimary: boolean;
}

/**
 * Family dashboard data
 */
export interface FamilyDashboard {
  client: {
    id: UUID;
    name: string;
    photoUrl?: string;
  };
  upcomingVisits: VisitSummary[];
  recentActivity: ActivityFeedItem[];
  unreadNotifications: number;
  unreadMessages: number;
  careTeam: CareTeamMember[];
  activeCarePlan?: {
    id: UUID;
    name: string;
    goalsTotal: number;
    goalsAchieved: number;
  };
}

/**
 * Family member profile with statistics
 */
export interface FamilyMemberProfile extends FamilyMember {
  statistics: {
    totalNotifications: number;
    unreadNotifications: number;
    totalMessages: number;
    unreadMessages: number;
    lastActivityDate?: Timestamp;
  };
}
