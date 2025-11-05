/**
 * Family Engagement validation schemas
 */

import { z } from 'zod';

// ============================================================================
// FAMILY MEMBER VALIDATION
// ============================================================================

export const CreateFamilyMemberSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().max(255),
  phoneNumber: z.string().max(50).optional(),
  preferredLanguage: z.string().max(10).optional(),
  timezone: z.string().max(50).optional(),
});

export const UpdateFamilyMemberSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phoneNumber: z.string().max(50).optional(),
  preferredLanguage: z.string().max(10).optional(),
  timezone: z.string().max(50).optional(),
  notificationPreferences: z.any().optional(),
});

// ============================================================================
// FAMILY CLIENT ACCESS VALIDATION
// ============================================================================

export const GrantAccessSchema = z.object({
  familyMemberId: z.string().uuid(),
  clientId: z.string().uuid(),
  relationshipType: z.enum([
    'PARENT',
    'CHILD',
    'SPOUSE',
    'SIBLING',
    'GRANDPARENT',
    'GRANDCHILD',
    'GUARDIAN',
    'POWER_OF_ATTORNEY',
    'HEALTHCARE_PROXY',
    'AUTHORIZED_REPRESENTATIVE',
    'OTHER',
  ]),
  isPrimaryContact: z.boolean().default(false),
  permissions: z.object({
    viewCarePlan: z.boolean().default(true),
    viewCarePlanGoals: z.boolean().default(true),
    viewCarePlanTasks: z.boolean().default(false),
    viewScheduledVisits: z.boolean().default(true),
    viewVisitHistory: z.boolean().default(true),
    viewVisitNotes: z.boolean().default(false),
    viewCaregiverInfo: z.boolean().default(true),
    viewMedicalInfo: z.boolean().default(false),
    viewMedications: z.boolean().default(false),
    viewVitalSigns: z.boolean().default(false),
    viewProgressNotes: z.boolean().default(false),
    sendMessages: z.boolean().default(true),
    receiveMessages: z.boolean().default(true),
    requestVisitChanges: z.boolean().default(false),
    viewDocuments: z.boolean().default(false),
    downloadDocuments: z.boolean().default(false),
    uploadDocuments: z.boolean().default(false),
    viewBillingInfo: z.boolean().default(false),
    viewInvoices: z.boolean().default(false),
  }),
  legalAuthority: z.enum([
    'HEALTHCARE_POA',
    'DURABLE_POA',
    'GUARDIANSHIP',
    'CONSERVATORSHIP',
    'HIPAA_AUTHORIZATION',
    'CLIENT_CONSENT',
  ]).optional(),
});

// ============================================================================
// INVITATION VALIDATION
// ============================================================================

export const CreateInvitationSchema = z.object({
  clientId: z.string().uuid(),
  email: z.string().email().max(255),
  relationshipType: z.enum([
    'PARENT',
    'CHILD',
    'SPOUSE',
    'SIBLING',
    'GRANDPARENT',
    'GRANDCHILD',
    'GUARDIAN',
    'POWER_OF_ATTORNEY',
    'HEALTHCARE_PROXY',
    'AUTHORIZED_REPRESENTATIVE',
    'OTHER',
  ]),
  permissions: z.any(),
  expiresInDays: z.number().min(1).max(30).default(7),
});

// ============================================================================
// CONVERSATION VALIDATION
// ============================================================================

export const CreateConversationSchema = z.object({
  clientId: z.string().uuid(),
  subject: z.string().max(255).optional(),
  conversationType: z.enum(['DIRECT', 'GROUP', 'CARE_TEAM', 'FAMILY_UPDATES', 'SUPPORT']).default('DIRECT'),
  participantIds: z.array(z.object({
    userId: z.string().uuid(),
    userType: z.enum(['FAMILY_MEMBER', 'CARE_COORDINATOR', 'CAREGIVER', 'NURSE', 'ADMIN']),
  })).min(2),
});

export const SendMessageSchema = z.object({
  conversationId: z.string().uuid(),
  content: z.string().min(1).max(10000),
  replyToMessageId: z.string().uuid().optional(),
  attachments: z.array(z.any()).optional(),
});

// ============================================================================
// NOTIFICATION VALIDATION
// ============================================================================

export const CreateNotificationSchema = z.object({
  familyMemberId: z.string().uuid(),
  clientId: z.string().uuid(),
  type: z.string(),
  category: z.enum(['CARE_UPDATES', 'MESSAGES', 'SYSTEM', 'ALERTS', 'REMINDERS', 'BILLING']),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
  title: z.string().min(1).max(255),
  body: z.string().min(1),
  actionUrl: z.string().url().optional(),
  actionText: z.string().max(100).optional(),
  deliveryChannels: z.array(z.enum(['IN_APP', 'EMAIL', 'SMS', 'PUSH'])).min(1),
  scheduledFor: z.date().optional(),
});

// ============================================================================
// CHAT VALIDATION
// ============================================================================

export const SendChatMessageSchema = z.object({
  sessionId: z.string().uuid().optional(), // Optional for new sessions
  message: z.string().min(1).max(5000),
});

export const ChatFeedbackSchema = z.object({
  sessionId: z.string().uuid(),
  messageId: z.string().uuid().optional(),
  rating: z.number().min(1).max(5),
  feedbackType: z.enum(['HELPFUL', 'NOT_HELPFUL', 'INCORRECT', 'INAPPROPRIATE', 'SUGGESTION']),
  comment: z.string().max(1000).optional(),
  issues: z.array(z.enum([
    'WRONG_ANSWER',
    'INCOMPLETE_ANSWER',
    'CONFUSING',
    'TOO_SLOW',
    'NOT_UNDERSTANDING',
    'PRIVACY_CONCERN',
    'OTHER',
  ])).optional(),
});

export const ChatEscalationSchema = z.object({
  sessionId: z.string().uuid(),
  reason: z.enum([
    'USER_REQUESTED',
    'COMPLEX_QUESTION',
    'REQUIRES_AUTHORIZATION',
    'SAFETY_CONCERN',
    'COMPLAINT',
    'TECHNICAL_ISSUE',
    'LOW_CONFIDENCE',
    'REPEATED_FAILURES',
  ]),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
  description: z.string().min(1).max(2000),
});

// ============================================================================
// VALIDATOR CLASS
// ============================================================================

export class FamilyEngagementValidator {
  validateCreateFamilyMember(data: unknown) {
    return CreateFamilyMemberSchema.safeParse(data);
  }

  validateUpdateFamilyMember(data: unknown) {
    return UpdateFamilyMemberSchema.safeParse(data);
  }

  validateGrantAccess(data: unknown) {
    return GrantAccessSchema.safeParse(data);
  }

  validateCreateInvitation(data: unknown) {
    return CreateInvitationSchema.safeParse(data);
  }

  validateCreateConversation(data: unknown) {
    return CreateConversationSchema.safeParse(data);
  }

  validateSendMessage(data: unknown) {
    return SendMessageSchema.safeParse(data);
  }

  validateCreateNotification(data: unknown) {
    return CreateNotificationSchema.safeParse(data);
  }

  validateSendChatMessage(data: unknown) {
    return SendChatMessageSchema.safeParse(data);
  }

  validateChatFeedback(data: unknown) {
    return ChatFeedbackSchema.safeParse(data);
  }

  validateChatEscalation(data: unknown) {
    return ChatEscalationSchema.safeParse(data);
  }
}
