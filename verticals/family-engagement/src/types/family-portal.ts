/**
 * Family Engagement Platform Types
 *
 * Type definitions for family portal users, conversations, messages,
 * activity feeds, and AI chatbot sessions.
 */

export interface FamilyPortalUser {
  id: string;
  organizationId: string;
  clientId: string;

  // Identity
  firstName: string;
  lastName: string;
  email: string;
  phone?: PhoneNumber;

  // Relationship to client
  relationship: FamilyRelationship;
  isPrimaryContact: boolean;
  isEmergencyContact: boolean;
  hasLegalAuthority: boolean;

  // Account and access
  passwordHash?: string;
  status: FamilyUserStatus;
  lastLoginAt?: Date;
  invitationSentAt?: Date;
  invitationAcceptedAt?: Date;
  invitationToken?: string;

  // Permissions and preferences
  permissions: FamilyPermissions;
  notificationPreferences: NotificationPreferences;
  canViewCareNotes: boolean;
  canViewSchedule: boolean;
  canViewMedications: boolean;
  canViewBilling: boolean;
  canMessageCaregivers: boolean;
  canRequestScheduleChanges: boolean;

  // Audit
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string;
  deletedAt?: Date;
}

export interface Conversation {
  id: string;
  organizationId: string;
  clientId: string;

  // Conversation metadata
  type: ConversationType;
  subject?: string;
  status: ConversationStatus;

  // Participants
  familyMemberIds: string[];
  caregiverIds: string[];
  coordinatorIds: string[];

  // AI chatbot metadata
  isAiConversation: boolean;
  aiConversationContext?: string;

  // Tracking
  lastMessageAt?: Date;
  messageCount: number;
  unreadCount: number;

  // Audit
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  organizationId: string;

  // Sender information
  senderType: MessageSenderType;
  senderId?: string;
  senderName: string;

  // Message content
  content: string;
  contentType: MessageContentType;
  metadata?: MessageMetadata;

  // AI-specific fields
  isAiGenerated: boolean;
  aiPrompt?: string;
  aiContext?: Record<string, unknown>;
  aiTokenCount?: number;

  // Status tracking
  isRead: boolean;
  readAt?: Date;
  readBy: string[];

  // Reply/threading
  replyToMessageId?: string;

  // Moderation
  isFlagged: boolean;
  flagReason?: string;
  isHidden: boolean;

  // Audit
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface CareActivityFeedItem {
  id: string;
  organizationId: string;
  clientId: string;

  // Activity information
  activityType: ActivityType;
  title: string;
  description?: string;
  details?: Record<string, unknown>;

  // Related entities
  relatedVisitId?: string;
  relatedCaregiverId?: string;
  relatedCarePlanId?: string;

  // Actor
  actorId?: string;
  actorType: ActorType;
  actorName: string;

  // Visibility
  visibleToFamily: boolean;
  sensitivityLevel: SensitivityLevel;
  occurredAt: Date;

  // Engagement tracking
  isRead: boolean;
  readByFamilyMembers: string[];
  firstReadAt?: Date;

  // Audit
  createdAt: Date;
  createdBy: string;
  deletedAt?: Date;
}

export interface ChatbotSession {
  id: string;
  organizationId: string;
  conversationId: string;
  familyMemberId: string;
  clientId: string;

  // Session metadata
  sessionType?: string;
  startedAt: Date;
  endedAt?: Date;
  durationSeconds?: number;

  // AI model information
  aiModel: string;
  totalMessages: number;
  totalTokens: number;
  estimatedCost: number;

  // Context and quality
  initialContext?: Record<string, unknown>;
  topicsDiscussed?: string[];
  wasHelpful?: boolean;
  helpfulnessRating?: number;
  userFeedback?: string;

  // Handoff tracking
  requiredHumanHandoff: boolean;
  handoffReason?: string;
  handedOffTo?: string;
  handoffAt?: Date;

  // Audit
  createdAt: Date;
  updatedAt: Date;
}

export interface FamilyNotification {
  id: string;
  organizationId: string;
  familyMemberId: string;
  clientId: string;

  // Notification details
  notificationType: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;

  // Related entity
  relatedId?: string;
  relatedType?: string;

  // Delivery channels
  sendEmail: boolean;
  sendSms: boolean;
  sendPush: boolean;
  inAppOnly: boolean;

  // Status tracking
  status: NotificationStatus;
  scheduledFor?: Date;
  sentAt?: Date;
  readAt?: Date;
  failedAt?: Date;
  failureReason?: string;
  retryCount: number;

  // Priority
  priority: NotificationPriority;

  // Audit
  createdAt: Date;
  updatedAt: Date;
}

// Supporting types
export interface PhoneNumber {
  number: string;
  type: 'MOBILE' | 'HOME' | 'WORK';
  isPrimary: boolean;
}

export interface FamilyPermissions {
  canViewCareNotes?: boolean;
  canViewSchedule?: boolean;
  canViewMedications?: boolean;
  canViewBilling?: boolean;
  canMessageCaregivers?: boolean;
  canRequestScheduleChanges?: boolean;
  customPermissions?: Record<string, boolean>;
}

export interface NotificationPreferences {
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  emailFrequency?: 'IMMEDIATE' | 'DAILY_DIGEST' | 'WEEKLY_DIGEST';
  quietHoursStart?: string; // HH:MM format
  quietHoursEnd?: string;
  notificationTypes?: Record<NotificationType, boolean>;
}

export interface MessageMetadata {
  attachments?: MessageAttachment[];
  formatting?: Record<string, unknown>;
  aiMetadata?: {
    model: string;
    tokenCount: number;
    confidence?: number;
  };
}

export interface MessageAttachment {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  url: string;
}

// Enums
export type FamilyRelationship =
  | 'PARENT'
  | 'SPOUSE'
  | 'PARTNER'
  | 'ADULT_CHILD'
  | 'SIBLING'
  | 'GUARDIAN'
  | 'POWER_OF_ATTORNEY'
  | 'HEALTHCARE_PROXY'
  | 'OTHER';

export type FamilyUserStatus = 'INVITED' | 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';

export type ConversationType = 'DIRECT' | 'GROUP' | 'CARE_TEAM' | 'AI_CHAT';

export type ConversationStatus = 'ACTIVE' | 'ARCHIVED' | 'CLOSED';

export type MessageSenderType = 'FAMILY_MEMBER' | 'CAREGIVER' | 'COORDINATOR' | 'AI_BOT' | 'SYSTEM';

export type MessageContentType = 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM_NOTIFICATION';

export type ActivityType =
  | 'VISIT_COMPLETED'
  | 'VISIT_STARTED'
  | 'VISIT_MISSED'
  | 'CARE_PLAN_UPDATED'
  | 'MEDICATION_ADMINISTERED'
  | 'INCIDENT_REPORTED'
  | 'NOTE_ADDED'
  | 'SCHEDULE_CHANGED'
  | 'ASSESSMENT_COMPLETED'
  | 'GOAL_ACHIEVED';

export type ActorType = 'CAREGIVER' | 'COORDINATOR' | 'SYSTEM';

export type SensitivityLevel = 'NORMAL' | 'SENSITIVE' | 'CONFIDENTIAL';

export type NotificationType =
  | 'NEW_MESSAGE'
  | 'VISIT_COMPLETED'
  | 'VISIT_MISSED'
  | 'CARE_UPDATE'
  | 'SCHEDULE_CHANGE'
  | 'INCIDENT_ALERT'
  | 'MEDICATION_REMINDER';

export type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED' | 'READ';

export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

// DTOs for API requests/responses
export interface CreateFamilyPortalUserRequest {
  clientId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: PhoneNumber;
  relationship: FamilyRelationship;
  isPrimaryContact?: boolean;
  isEmergencyContact?: boolean;
  hasLegalAuthority?: boolean;
  permissions?: Partial<FamilyPermissions>;
}

export interface UpdateFamilyPortalUserRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: PhoneNumber;
  relationship?: FamilyRelationship;
  isPrimaryContact?: boolean;
  isEmergencyContact?: boolean;
  hasLegalAuthority?: boolean;
  permissions?: Partial<FamilyPermissions>;
  notificationPreferences?: NotificationPreferences;
  status?: FamilyUserStatus;
}

export interface CreateConversationRequest {
  clientId: string;
  type: ConversationType;
  subject?: string;
  familyMemberIds?: string[];
  caregiverIds?: string[];
  coordinatorIds?: string[];
  isAiConversation?: boolean;
}

export interface SendMessageRequest {
  conversationId: string;
  content: string;
  contentType?: MessageContentType;
  metadata?: MessageMetadata;
  replyToMessageId?: string;
}

export interface CreateActivityFeedItemRequest {
  clientId: string;
  activityType: ActivityType;
  title: string;
  description?: string;
  details?: Record<string, unknown>;
  relatedVisitId?: string;
  relatedCaregiverId?: string;
  relatedCarePlanId?: string;
  actorId?: string;
  actorType: ActorType;
  actorName: string;
  visibleToFamily?: boolean;
  sensitivityLevel?: SensitivityLevel;
  occurredAt: Date;
}

export interface ChatRequest {
  conversationId?: string; // If continuing existing conversation
  message: string;
  context?: {
    clientId: string;
    familyMemberId: string;
    includeRecentActivity?: boolean;
    includeSchedule?: boolean;
    includeCarePlan?: boolean;
  };
}

export interface ChatResponse {
  message: string;
  conversationId: string;
  messageId: string;
  requiresHumanHandoff?: boolean;
  suggestedActions?: SuggestedAction[];
  metadata?: {
    model: string;
    tokenCount: number;
    processingTime: number;
  };
}

export interface SuggestedAction {
  type: 'VIEW_SCHEDULE' | 'VIEW_CARE_PLAN' | 'CONTACT_COORDINATOR' | 'VIEW_MEDICATIONS';
  label: string;
  url?: string;
  data?: Record<string, unknown>;
}
