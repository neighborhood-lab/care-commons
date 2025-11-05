import type { Entity } from '@care-commons/core';

// ============================================================================
// Family Member Types
// ============================================================================

export interface FamilyMember extends Entity {
  organizationId: string;
  clientId: string;

  // Identity
  firstName: string;
  lastName: string;
  relationship: FamilyRelationship;

  // Contact
  phone?: string;
  email?: string;
  preferredContactMethod: ContactMethod;

  // Portal access
  portalAccessEnabled: boolean;
  portalUsername?: string;
  portalPasswordHash?: string;
  portalLastLogin?: Date;

  // Preferences
  notificationPreferences: NotificationPreferences;
  permissions: FamilyPermissions;

  // Status
  status: FamilyMemberStatus;
  isPrimaryContact: boolean;
  isEmergencyContact: boolean;
}

export type FamilyRelationship =
  | 'SPOUSE'
  | 'PARTNER'
  | 'DAUGHTER'
  | 'SON'
  | 'MOTHER'
  | 'FATHER'
  | 'SISTER'
  | 'BROTHER'
  | 'GUARDIAN'
  | 'POWER_OF_ATTORNEY'
  | 'FRIEND'
  | 'OTHER';

export type ContactMethod = 'SMS' | 'EMAIL' | 'PHONE' | 'PORTAL';

export type FamilyMemberStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface NotificationPreferences {
  visitStart: boolean;
  visitEnd: boolean;
  visitSummary: boolean;
  missedVisit: boolean;
  scheduleChange: boolean;
  emergencyAlert: boolean;
  medicationReminder: boolean;
  appointmentReminder: boolean;
  carePlanUpdate: boolean;
}

export interface FamilyPermissions {
  viewVisitHistory: boolean;
  viewCarePlan: boolean;
  viewMedications: boolean;
  viewMedicalNotes: boolean;
  viewCaregiverInfo: boolean;
  requestVisitChanges: boolean;
  provideFeedback: boolean;
  viewBilling: boolean;
}

// ============================================================================
// Notification Types
// ============================================================================

export interface FamilyNotification extends Entity {
  organizationId: string;
  familyMemberId: string;
  clientId: string;

  notificationType: NotificationType;
  channel: NotificationChannel;

  subject?: string;
  message: string;
  metadata?: Record<string, any>;

  status: NotificationStatus;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  failedReason?: string;

  externalId?: string; // Twilio SID, SendGrid ID, etc.
}

export type NotificationType =
  | 'VISIT_START'
  | 'VISIT_END'
  | 'VISIT_SUMMARY'
  | 'MISSED_VISIT'
  | 'SCHEDULE_CHANGE'
  | 'EMERGENCY_ALERT'
  | 'MEDICATION_REMINDER'
  | 'APPOINTMENT_REMINDER'
  | 'CARE_PLAN_UPDATE'
  | 'FEEDBACK_REQUEST';

export type NotificationChannel = 'SMS' | 'EMAIL' | 'PORTAL' | 'PUSH';

export type NotificationStatus = 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED' | 'READ';

// ============================================================================
// Message Types
// ============================================================================

export interface FamilyMessage extends Entity {
  organizationId: string;
  clientId: string;

  senderType: MessageSenderType;
  senderId: string; // family_member_id or user_id

  messageText: string;
  messageType: MessageType;
  attachments?: Attachment[];

  threadId?: string;
  parentMessageId?: string;

  isRead: boolean;
  readAt?: Date;
  requiresResponse: boolean;
  priority: MessagePriority;
}

export type MessageSenderType = 'FAMILY' | 'COORDINATOR' | 'CAREGIVER' | 'SYSTEM';

export type MessageType = 'TEXT' | 'IMAGE' | 'VOICE' | 'SYSTEM';

export type MessagePriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export interface Attachment {
  id: string;
  type: 'IMAGE' | 'VOICE' | 'DOCUMENT';
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

// ============================================================================
// AI Conversation Types
// ============================================================================

export interface AIConversation extends Entity {
  organizationId: string;
  familyMemberId: string;
  clientId: string;

  sessionId: string;
  userMessage: string;
  aiResponse: string;

  contextData?: Record<string, any>;

  detectedIntent?: string;
  confidenceScore?: number;

  escalatedToHuman: boolean;
  escalationReason?: string;
}

// ============================================================================
// Feedback Types
// ============================================================================

export interface FamilyFeedback extends Entity {
  organizationId: string;
  familyMemberId: string;
  clientId: string;

  feedbackType: FeedbackType;
  visitId?: string;
  caregiverId?: string;

  rating: 1 | 2 | 3 | 4 | 5;
  comment?: string;
  sentiment?: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';

  requiresFollowUp: boolean;
  followUpCompleted: boolean;
  followUpNotes?: string;
}

export type FeedbackType = 'VISIT_RATING' | 'CAREGIVER_RATING' | 'OVERALL_SATISFACTION';

// ============================================================================
// Search and Filter Types
// ============================================================================

export interface FamilyMemberSearchFilter {
  clientId?: string;
  status?: FamilyMemberStatus;
  portalAccessEnabled?: boolean;
  isPrimaryContact?: boolean;
  isEmergencyContact?: boolean;
  searchTerm?: string; // Search by name, phone, or email
}

export interface NotificationSearchFilter {
  familyMemberId?: string;
  clientId?: string;
  notificationType?: NotificationType;
  channel?: NotificationChannel;
  status?: NotificationStatus;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface MessageSearchFilter {
  clientId?: string;
  threadId?: string;
  senderType?: MessageSenderType;
  isRead?: boolean;
  requiresResponse?: boolean;
  priority?: MessagePriority;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface FeedbackSearchFilter {
  clientId?: string;
  familyMemberId?: string;
  caregiverId?: string;
  feedbackType?: FeedbackType;
  ratingMin?: number;
  ratingMax?: number;
  sentiment?: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  requiresFollowUp?: boolean;
  followUpCompleted?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
}

// ============================================================================
// Input Types for Create/Update Operations
// ============================================================================

export interface CreateFamilyMemberInput {
  organizationId: string;
  clientId: string;
  firstName: string;
  lastName: string;
  relationship: FamilyRelationship;
  phone?: string;
  email?: string;
  preferredContactMethod: ContactMethod;
  portalAccessEnabled?: boolean;
  portalUsername?: string;
  portalPassword?: string; // Plain text, will be hashed
  notificationPreferences?: Partial<NotificationPreferences>;
  permissions?: Partial<FamilyPermissions>;
  isPrimaryContact?: boolean;
  isEmergencyContact?: boolean;
}

export interface UpdateFamilyMemberInput {
  firstName?: string;
  lastName?: string;
  relationship?: FamilyRelationship;
  phone?: string;
  email?: string;
  preferredContactMethod?: ContactMethod;
  portalAccessEnabled?: boolean;
  notificationPreferences?: Partial<NotificationPreferences>;
  permissions?: Partial<FamilyPermissions>;
  status?: FamilyMemberStatus;
  isPrimaryContact?: boolean;
  isEmergencyContact?: boolean;
}

export interface CreateNotificationInput {
  organizationId: string;
  familyMemberId: string;
  clientId: string;
  notificationType: NotificationType;
  channel: NotificationChannel;
  subject?: string;
  message: string;
  metadata?: Record<string, any>;
}

export interface CreateMessageInput {
  organizationId: string;
  clientId: string;
  senderType: MessageSenderType;
  senderId: string;
  messageText: string;
  messageType?: MessageType;
  attachments?: Attachment[];
  threadId?: string;
  parentMessageId?: string;
  requiresResponse?: boolean;
  priority?: MessagePriority;
}

export interface CreateFeedbackInput {
  organizationId: string;
  familyMemberId: string;
  clientId: string;
  feedbackType: FeedbackType;
  visitId?: string;
  caregiverId?: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment?: string;
}

// ============================================================================
// Visit Context Types (for notifications and AI chatbot)
// ============================================================================

export interface VisitContext {
  visitId: string;
  clientId: string;
  clientName: string;
  caregiverId: string;
  caregiverName: string;
  scheduledStartTime: Date;
  scheduledEndTime: Date;
  actualStartTime?: Date;
  actualEndTime?: Date;
  status: string;
  serviceType?: string;
  tasksCompleted?: string[];
  notes?: string;
  duration?: number; // in minutes
}

export interface CarePlanContext {
  carePlanId: string;
  clientId: string;
  goals: string[];
  interventions: string[];
  restrictions?: string[];
  medications?: Array<{
    name: string;
    dosage: string;
    frequency: string;
  }>;
}

export interface ClientContext {
  clientId: string;
  name: string;
  age: number;
  conditions: string[];
  riskFlags?: string[];
  specialInstructions?: string;
}

// ============================================================================
// AI Chatbot Types
// ============================================================================

export interface ChatbotContext {
  client: ClientContext;
  recentVisits: VisitContext[];
  todayVisits: VisitContext[];
  carePlan?: CarePlanContext;
}

export interface IntentClassification {
  type: string;
  confidence: number;
  entities?: Record<string, any>;
}

export const INTENT_TYPES = {
  ASK_TODAY_VISIT: 'ASK_TODAY_VISIT',
  ASK_VISIT_STATUS: 'ASK_VISIT_STATUS',
  REQUEST_SCHEDULE_CHANGE: 'REQUEST_SCHEDULE_CHANGE',
  ASK_MEDICATION: 'ASK_MEDICATION',
  ASK_CARE_PLAN: 'ASK_CARE_PLAN',
  EMERGENCY: 'EMERGENCY',
  PROVIDE_FEEDBACK: 'PROVIDE_FEEDBACK',
  GENERAL_QUESTION: 'GENERAL_QUESTION',
} as const;

// ============================================================================
// Event Types (for event-driven notifications)
// ============================================================================

export interface VisitClockInEvent {
  visitId: string;
  clientId: string;
  clientName: string;
  caregiverId: string;
  caregiverName: string;
  scheduledStartTime: Date;
  actualStartTime: Date;
  organizationId: string;
}

export interface VisitClockOutEvent {
  visitId: string;
  clientId: string;
  clientName: string;
  caregiverId: string;
  caregiverName: string;
  scheduledEndTime: Date;
  actualEndTime: Date;
  duration: number; // in minutes
  tasksCompleted: string[];
  notes?: string;
  organizationId: string;
}

export interface ScheduleChangeEvent {
  visitId: string;
  clientId: string;
  clientName: string;
  oldStartTime: Date;
  newStartTime: Date;
  reason?: string;
  organizationId: string;
}

export interface MissedVisitEvent {
  visitId: string;
  clientId: string;
  clientName: string;
  scheduledStartTime: Date;
  caregiverName: string;
  organizationId: string;
}
