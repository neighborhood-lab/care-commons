/**
 * @folkcare/family-engagement - Type Definitions
 *
 * Family Engagement Platform - Transparency & Communication
 *
 * Types for family portal access, notifications, messaging, and
 * transparency features that enable family members to stay informed
 * about their loved one's care.
 */

import type { Entity, UUID, Timestamp } from '@folkcare/core';

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

// ============================================================================
// Satisfaction Survey Types
// ============================================================================

/**
 * Type of survey
 */
export type SurveyType =
  | 'SATISFACTION' // General satisfaction survey
  | 'NPS' // Net Promoter Score survey
  | 'CARE_QUALITY' // Care quality feedback
  | 'CAREGIVER_FEEDBACK' // Feedback about specific caregivers
  | 'CUSTOM'; // Custom survey

/**
 * Survey template status
 */
export type SurveyStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

/**
 * Survey trigger type
 */
export type SurveyTriggerType =
  | 'MANUAL' // Manually sent
  | 'SCHEDULED' // Sent on a schedule
  | 'AFTER_VISIT' // Sent after a visit
  | 'AFTER_MILESTONE' // Sent after care plan milestone
  | 'AFTER_CARE_PLAN_UPDATE'; // Sent after care plan updates

/**
 * Survey schedule frequency
 */
export type SurveyFrequency = 'WEEKLY' | 'MONTHLY' | 'QUARTERLY';

/**
 * Question type in a survey
 */
export type SurveyQuestionType =
  | 'RATING' // 1-5 star rating
  | 'MULTIPLE_CHOICE' // Select one or more options
  | 'TEXT' // Free text response
  | 'NPS' // Net Promoter Score (0-10)
  | 'YES_NO' // Yes/No question
  | 'SCALE'; // Numeric scale

/**
 * Survey invitation status
 */
export type SurveyInvitationStatus =
  | 'PENDING' // Not yet sent
  | 'SENT' // Sent to family member
  | 'OPENED' // Family member opened the survey
  | 'STARTED' // Started answering
  | 'COMPLETED' // Completed
  | 'EXPIRED' // Survey expired
  | 'DECLINED'; // Family member declined

/**
 * Survey response status
 */
export type SurveyResponseStatus = 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';

/**
 * Survey template definition
 */
export interface SurveyTemplate extends Entity {
  name: string;
  description?: string;
  surveyType: SurveyType;
  status: SurveyStatus;

  // Configuration
  estimatedMinutes: number;
  allowAnonymous: boolean;
  isRequired: boolean;
  minDaysBetweenSurveys: number;

  // Scheduling
  triggerType: SurveyTriggerType;
  triggerDaysAfterEvent?: number;
  scheduleFrequency?: SurveyFrequency;
  scheduleDayOfWeek?: number;
  scheduleDayOfMonth?: number;

  // Display
  welcomeMessage?: string;
  thankYouMessage?: string;
  logoUrl?: string;

  organizationId: UUID;
}

/**
 * Question within a survey template
 */
export interface SurveyQuestion extends Entity {
  surveyTemplateId: UUID;
  orderIndex: number;
  questionType: SurveyQuestionType;
  questionText: string;
  helpText?: string;

  // Configuration
  isRequired: boolean;
  options?: string[]; // For MULTIPLE_CHOICE
  minValue?: number; // For RATING, SCALE, NPS
  maxValue?: number;
  minLabel?: string;
  maxLabel?: string;

  // Conditional logic
  conditionalOnQuestionId?: UUID;
  conditionalOperator?: 'EQUALS' | 'NOT_EQUALS' | 'GREATER_THAN' | 'LESS_THAN';
  conditionalValue?: string;

  // Categorization
  category?: string;
}

/**
 * Survey invitation sent to family member
 */
export interface SurveyInvitation extends Entity {
  surveyTemplateId: UUID;
  familyMemberId: UUID;
  clientId: UUID;

  status: SurveyInvitationStatus;
  invitationCode: string;

  // Scheduling
  scheduledSendAt?: Timestamp;
  sentAt?: Timestamp;
  expiresAt: Timestamp;

  // Trigger context
  triggerType: SurveyTriggerType;
  triggerEntityId?: UUID;
  triggerEntityType?: string;

  // Response tracking
  openedAt?: Timestamp;
  startedAt?: Timestamp;
  completedAt?: Timestamp;
  declinedAt?: Timestamp;
  declineReason?: string;

  // Reminders
  reminderCount: number;
  lastReminderAt?: Timestamp;

  organizationId: UUID;
}

/**
 * Family member response to a survey
 */
export interface SurveyResponse extends Entity {
  surveyInvitationId: UUID;
  surveyTemplateId: UUID;
  familyMemberId?: UUID; // Null if anonymous
  clientId: UUID;

  isAnonymous: boolean;
  status: SurveyResponseStatus;
  completionPercentage: number;

  // Timing
  startedAt: Timestamp;
  completedAt?: Timestamp;
  timeSpentSeconds?: number;

  // Calculated scores
  overallSatisfactionScore?: number;
  npsScore?: number;
  categoryScores?: Record<string, number>;

  // Device info
  deviceType?: 'DESKTOP' | 'MOBILE' | 'TABLET';
  browser?: string;

  organizationId: UUID;
}

/**
 * Individual answer to a survey question
 */
export interface SurveyResponseAnswer {
  id: UUID;
  surveyResponseId: UUID;
  surveyQuestionId: UUID;

  ratingValue?: number;
  textValue?: string;
  selectedOptions?: number[];

  timeSpentSeconds?: number;
  answeredAt: Timestamp;
  wasSkipped: boolean;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Aggregated survey analytics
 */
export interface SurveyAnalytics {
  id: UUID;
  surveyTemplateId: UUID;
  periodDate: string;
  periodType: 'DAILY' | 'WEEKLY' | 'MONTHLY';

  // Response metrics
  invitationsSent: number;
  invitationsOpened: number;
  responsesStarted: number;
  responsesCompleted: number;
  responsesAbandoned: number;
  completionRate?: number;

  // Score metrics
  avgSatisfactionScore?: number;
  avgNpsScore?: number;
  avgCategoryScores?: Record<string, number>;

  // Timing
  avgTimeSpentSeconds?: number;

  organizationId: UUID;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================================================
// Survey Service Input/Output Types
// ============================================================================

/**
 * Input for creating a survey template
 */
export interface CreateSurveyTemplateInput {
  name: string;
  description?: string;
  surveyType: SurveyType;
  estimatedMinutes?: number;
  allowAnonymous?: boolean;
  isRequired?: boolean;
  minDaysBetweenSurveys?: number;
  triggerType: SurveyTriggerType;
  triggerDaysAfterEvent?: number;
  scheduleFrequency?: SurveyFrequency;
  scheduleDayOfWeek?: number;
  scheduleDayOfMonth?: number;
  welcomeMessage?: string;
  thankYouMessage?: string;
  logoUrl?: string;
}

/**
 * Input for updating a survey template
 */
export interface UpdateSurveyTemplateInput {
  name?: string;
  description?: string;
  status?: SurveyStatus;
  estimatedMinutes?: number;
  allowAnonymous?: boolean;
  isRequired?: boolean;
  minDaysBetweenSurveys?: number;
  triggerType?: SurveyTriggerType;
  triggerDaysAfterEvent?: number;
  scheduleFrequency?: SurveyFrequency;
  scheduleDayOfWeek?: number;
  scheduleDayOfMonth?: number;
  welcomeMessage?: string;
  thankYouMessage?: string;
  logoUrl?: string;
}

/**
 * Input for creating a survey question
 */
export interface CreateSurveyQuestionInput {
  surveyTemplateId: UUID;
  orderIndex: number;
  questionType: SurveyQuestionType;
  questionText: string;
  helpText?: string;
  isRequired?: boolean;
  options?: string[];
  minValue?: number;
  maxValue?: number;
  minLabel?: string;
  maxLabel?: string;
  conditionalOnQuestionId?: UUID;
  conditionalOperator?: 'EQUALS' | 'NOT_EQUALS' | 'GREATER_THAN' | 'LESS_THAN';
  conditionalValue?: string;
  category?: string;
}

/**
 * Input for sending a survey invitation
 */
export interface SendSurveyInvitationInput {
  surveyTemplateId: UUID;
  familyMemberId: UUID;
  clientId: UUID;
  scheduledSendAt?: Timestamp;
  expiresAt?: Timestamp;
  triggerEntityId?: UUID;
  triggerEntityType?: string;
}

/**
 * Input for submitting a survey answer
 */
export interface SubmitSurveyAnswerInput {
  surveyResponseId: UUID;
  surveyQuestionId: UUID;
  ratingValue?: number;
  textValue?: string;
  selectedOptions?: number[];
  wasSkipped?: boolean;
  timeSpentSeconds?: number;
}

/**
 * Summary of survey results for reporting
 */
export interface SurveySummary {
  templateId: UUID;
  templateName: string;
  surveyType: SurveyType;
  totalResponses: number;
  completedResponses: number;
  avgCompletionTime: number;
  avgSatisfactionScore?: number;
  npsScore?: number;
  responseRate: number;
  recentTrend: 'UP' | 'DOWN' | 'STABLE';
}

// ============================================================================
// Billing Transparency Types
// ============================================================================

/**
 * Payer type for billing
 */
export type BillingPayerType =
  | 'MEDICAID'
  | 'MEDICARE'
  | 'PRIVATE_INSURANCE'
  | 'PRIVATE_PAY'
  | 'VETERANS_BENEFITS'
  | 'OTHER';

/**
 * Family-visible invoice status
 */
export type FamilyInvoiceStatus =
  | 'PENDING' // Invoice created, awaiting approval
  | 'SENT' // Invoice sent to payer
  | 'PROCESSING' // Being processed by payer
  | 'PARTIALLY_PAID' // Some payment received
  | 'PAID' // Fully paid
  | 'PAST_DUE' // Payment overdue
  | 'DISPUTED'; // Under dispute

/**
 * Payment method
 */
export type PaymentMethodType =
  | 'CHECK'
  | 'CREDIT_CARD'
  | 'DEBIT_CARD'
  | 'ACH'
  | 'CASH'
  | 'INSURANCE'
  | 'OTHER';

/**
 * Unit type for services
 */
export type ServiceUnitType =
  | 'HOUR'
  | 'VISIT'
  | 'DAY'
  | 'WEEK'
  | 'MONTH'
  | 'TASK'
  | 'MILE'
  | 'UNIT';

/**
 * Family-friendly invoice line item
 */
export interface FamilyInvoiceLineItem {
  id: UUID;
  serviceDate: string; // YYYY-MM-DD
  serviceDescription: string;
  caregiverName: string;
  unitType: ServiceUnitType;
  units: number;
  unitRate: number;
  subtotal: number;
  adjustments: number;
  total: number;
  notes?: string;
}

/**
 * Family-visible invoice summary
 * Clear, understandable billing with line-item detail
 */
export interface FamilyInvoiceSummary {
  id: UUID;
  invoiceNumber: string;
  invoiceDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD

  // Payer information
  payerType: BillingPayerType;
  payerName: string;

  // Line items for transparency
  lineItems: FamilyInvoiceLineItem[];

  // Totals breakdown (no surprise charges)
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  adjustmentAmount: number;
  adjustmentDescription?: string;
  totalAmount: number;

  // Payment status
  paidAmount: number;
  balanceDue: number;
  status: FamilyInvoiceStatus;

  // Service period covered
  servicePeriodStart: string; // YYYY-MM-DD
  servicePeriodEnd: string; // YYYY-MM-DD

  // Client info
  clientId: UUID;
  clientName: string;

  organizationId: UUID;
}

/**
 * Payment record visible to family
 */
export interface FamilyPaymentRecord {
  id: UUID;
  paymentDate: string; // YYYY-MM-DD
  amount: number;
  paymentMethod: PaymentMethodType;
  payerName: string;
  invoiceNumber?: string;
  invoiceId?: UUID;
  confirmationNumber?: string;
  status: 'RECEIVED' | 'APPLIED' | 'PENDING' | 'RETURNED';
  notes?: string;
}

/**
 * Billing statement for family (monthly summary)
 */
export interface FamilyBillingStatement {
  statementId: UUID;
  statementDate: string; // YYYY-MM-DD
  statementPeriodStart: string; // YYYY-MM-DD
  statementPeriodEnd: string; // YYYY-MM-DD

  // Client info
  clientId: UUID;
  clientName: string;

  // Opening balance
  previousBalance: number;

  // Activity during period
  newCharges: number;
  paymentsReceived: number;
  adjustments: number;
  adjustmentDescription?: string;

  // Closing balance
  currentBalance: number;

  // Breakdown by service type
  chargesByService: FamilyServiceChargeBreakdown[];

  // Invoice references
  invoicesIncluded: FamilyInvoiceSummary[];

  // Payment history
  paymentsIncluded: FamilyPaymentRecord[];

  // Aging information
  aging: FamilyBalanceAging;

  organizationId: UUID;
}

/**
 * Charge breakdown by service type
 */
export interface FamilyServiceChargeBreakdown {
  serviceType: string;
  serviceDescription: string;
  totalHours?: number;
  totalUnits: number;
  unitType: ServiceUnitType;
  averageRate: number;
  totalAmount: number;
}

/**
 * Balance aging for family view
 */
export interface FamilyBalanceAging {
  current: number; // 0-30 days
  days31to60: number;
  days61to90: number;
  over90Days: number;
  totalPastDue: number;
}

/**
 * Authorization status visible to family
 */
export interface FamilyAuthorizationStatus {
  id: UUID;
  authorizationNumber: string;
  payerName: string;
  serviceType: string;
  serviceDescription: string;

  // Authorization period
  effectiveFrom: string; // YYYY-MM-DD
  effectiveTo: string; // YYYY-MM-DD

  // Units tracking
  authorizedUnits: number;
  usedUnits: number;
  remainingUnits: number;
  unitType: ServiceUnitType;

  // Status
  status: 'ACTIVE' | 'EXPIRING_SOON' | 'DEPLETED' | 'EXPIRED';
  percentUsed: number;
  daysRemaining: number;

  // Alerts
  alerts: FamilyAuthorizationAlert[];
}

/**
 * Alert for authorization
 */
export interface FamilyAuthorizationAlert {
  alertType: 'UNITS_LOW' | 'EXPIRING_SOON' | 'EXPIRED' | 'RENEWAL_NEEDED';
  message: string;
  severity: 'INFO' | 'WARNING' | 'URGENT';
}

/**
 * Billing dashboard for family
 */
export interface FamilyBillingDashboard {
  clientId: UUID;
  clientName: string;

  // Current balance summary
  currentBalance: number;
  pastDueBalance: number;
  nextPaymentDueDate?: string;
  nextPaymentAmount?: number;

  // Recent activity
  recentInvoices: FamilyInvoiceSummary[];
  recentPayments: FamilyPaymentRecord[];

  // Authorization status
  authorizations: FamilyAuthorizationStatus[];
  authorizationAlerts: FamilyAuthorizationAlert[];

  // Year-to-date summary
  ytdTotalCharges: number;
  ytdTotalPayments: number;
  ytdInsurancePaid: number;
  ytdClientResponsibility: number;

  // Payment options
  acceptedPaymentMethods: PaymentMethodType[];
  paymentPortalUrl?: string;
  paymentInstructions?: string;

  organizationId: UUID;
  lastUpdated: Timestamp;
}

/**
 * Input for querying family billing
 */
export interface FamilyBillingQueryInput {
  clientId: UUID;
  familyMemberId: UUID;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  status?: FamilyInvoiceStatus[];
  limit?: number;
  offset?: number;
}

/**
 * Billing notification preferences for family
 */
export interface FamilyBillingNotificationPreferences {
  invoiceReadyNotifications: boolean;
  paymentReceivedNotifications: boolean;
  paymentDueReminders: boolean;
  paymentPastDueAlerts: boolean;
  authorizationExpiringAlerts: boolean;
  statementReadyNotifications: boolean;
  reminderDaysBeforeDue: number;
}

// ============================================================================
// Invoice History & Download Types
// ============================================================================

/**
 * Document format for downloads
 */
export type DocumentFormat = 'PDF' | 'CSV' | 'EXCEL';

/**
 * Download status
 */
export type DownloadStatus = 'PENDING' | 'GENERATING' | 'READY' | 'EXPIRED' | 'FAILED';

/**
 * Invoice history entry with download info
 */
export interface FamilyInvoiceHistoryEntry extends FamilyInvoiceSummary {
  /** Whether PDF is available for download */
  pdfAvailable: boolean;
  /** Download URL if available */
  downloadUrl?: string;
  /** Download expiry time */
  downloadExpiresAt?: Timestamp;
  /** Date when invoice was first viewed by family */
  viewedAt?: Timestamp;
  /** Date when PDF was downloaded */
  downloadedAt?: Timestamp;
}

/**
 * Paginated invoice history response
 */
export interface FamilyInvoiceHistoryResponse {
  invoices: FamilyInvoiceHistoryEntry[];
  pagination: {
    totalCount: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  /** Year-to-date summary */
  summary: {
    totalInvoices: number;
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
    overdueAmount: number;
  };
}

/**
 * Invoice download request
 */
export interface InvoiceDownloadRequest {
  invoiceId: UUID;
  familyMemberId: UUID;
  clientId: UUID;
  format: DocumentFormat;
}

/**
 * Invoice download response
 */
export interface InvoiceDownloadResponse {
  invoiceId: UUID;
  downloadUrl: string;
  expiresAt: Timestamp;
  format: DocumentFormat;
  fileName: string;
  fileSizeBytes: number;
  status: DownloadStatus;
}

/**
 * Bulk invoice download request
 */
export interface BulkInvoiceDownloadRequest {
  invoiceIds: UUID[];
  familyMemberId: UUID;
  clientId: UUID;
  format: DocumentFormat;
  /** Combine into single file or zip archive */
  combineIntoSingle?: boolean;
}

/**
 * Bulk download response
 */
export interface BulkInvoiceDownloadResponse {
  downloadUrl: string;
  expiresAt: Timestamp;
  format: DocumentFormat;
  fileName: string;
  fileSizeBytes: number;
  status: DownloadStatus;
  invoiceCount: number;
}

/**
 * Statement download request
 */
export interface StatementDownloadRequest {
  familyMemberId: UUID;
  clientId: UUID;
  periodStart: string; // YYYY-MM-DD
  periodEnd: string; // YYYY-MM-DD
  format: DocumentFormat;
}

/**
 * Statement download response
 */
export interface StatementDownloadResponse {
  downloadUrl: string;
  expiresAt: Timestamp;
  format: DocumentFormat;
  fileName: string;
  fileSizeBytes: number;
  status: DownloadStatus;
  periodStart: string;
  periodEnd: string;
}

/**
 * Invoice PDF content data
 */
export interface InvoicePDFData {
  invoice: FamilyInvoiceSummary;
  organizationInfo: {
    name: string;
    address: string;
    phone: string;
    email: string;
    taxId?: string;
    logo?: string;
  };
  clientInfo: {
    name: string;
    address?: string;
  };
  paymentInstructions?: string;
  footerText?: string;
}
