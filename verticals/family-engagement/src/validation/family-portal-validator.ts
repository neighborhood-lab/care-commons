/**
 * Family Engagement Platform Validation Schemas
 *
 * Zod schemas for validating family portal requests and data.
 */

import { z } from 'zod';

// Phone number schema
export const phoneNumberSchema = z.object({
  number: z.string().min(10).max(20),
  type: z.enum(['MOBILE', 'HOME', 'WORK']),
  isPrimary: z.boolean(),
});

// Family permissions schema
export const familyPermissionsSchema = z.object({
  canViewCareNotes: z.boolean().optional(),
  canViewSchedule: z.boolean().optional(),
  canViewMedications: z.boolean().optional(),
  canViewBilling: z.boolean().optional(),
  canMessageCaregivers: z.boolean().optional(),
  canRequestScheduleChanges: z.boolean().optional(),
  customPermissions: z.record(z.string(), z.boolean()).optional(),
});

// Notification preferences schema
export const notificationPreferencesSchema = z.object({
  emailEnabled: z.boolean(),
  smsEnabled: z.boolean(),
  pushEnabled: z.boolean(),
  emailFrequency: z.enum(['IMMEDIATE', 'DAILY_DIGEST', 'WEEKLY_DIGEST']).optional(),
  quietHoursStart: z.string().regex(/^\d{2}:\d{2}$/).optional(), // HH:MM format
  quietHoursEnd: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  notificationTypes: z.record(z.string(), z.boolean()).optional(),
});

// Family relationship enum
export const familyRelationshipSchema = z.enum([
  'PARENT',
  'SPOUSE',
  'PARTNER',
  'ADULT_CHILD',
  'SIBLING',
  'GUARDIAN',
  'POWER_OF_ATTORNEY',
  'HEALTHCARE_PROXY',
  'OTHER',
]);

// Family user status enum
export const familyUserStatusSchema = z.enum(['INVITED', 'ACTIVE', 'SUSPENDED', 'INACTIVE']);

// Conversation type enum
export const conversationTypeSchema = z.enum(['DIRECT', 'GROUP', 'CARE_TEAM', 'AI_CHAT']);

// Message content type enum
export const messageContentTypeSchema = z.enum(['TEXT', 'IMAGE', 'FILE', 'SYSTEM_NOTIFICATION']);

// Activity type enum
export const activityTypeSchema = z.enum([
  'VISIT_COMPLETED',
  'VISIT_STARTED',
  'VISIT_MISSED',
  'CARE_PLAN_UPDATED',
  'MEDICATION_ADMINISTERED',
  'INCIDENT_REPORTED',
  'NOTE_ADDED',
  'SCHEDULE_CHANGED',
  'ASSESSMENT_COMPLETED',
  'GOAL_ACHIEVED',
]);

// Actor type enum
export const actorTypeSchema = z.enum(['CAREGIVER', 'COORDINATOR', 'SYSTEM']);

// Sensitivity level enum
export const sensitivityLevelSchema = z.enum(['NORMAL', 'SENSITIVE', 'CONFIDENTIAL']);

// Create Family Portal User Request
export const createFamilyPortalUserSchema = z.object({
  clientId: z.string().uuid(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().max(255),
  phone: phoneNumberSchema.optional(),
  relationship: familyRelationshipSchema,
  isPrimaryContact: z.boolean().optional().default(false),
  isEmergencyContact: z.boolean().optional().default(false),
  hasLegalAuthority: z.boolean().optional().default(false),
  permissions: familyPermissionsSchema.optional(),
});

// Update Family Portal User Request
export const updateFamilyPortalUserSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  email: z.string().email().max(255).optional(),
  phone: phoneNumberSchema.optional(),
  relationship: familyRelationshipSchema.optional(),
  isPrimaryContact: z.boolean().optional(),
  isEmergencyContact: z.boolean().optional(),
  hasLegalAuthority: z.boolean().optional(),
  permissions: familyPermissionsSchema.optional(),
  notificationPreferences: notificationPreferencesSchema.optional(),
  status: familyUserStatusSchema.optional(),
});

// Create Conversation Request
export const createConversationSchema = z.object({
  clientId: z.string().uuid(),
  type: conversationTypeSchema,
  subject: z.string().max(255).optional(),
  familyMemberIds: z.array(z.string().uuid()).optional().default([]),
  caregiverIds: z.array(z.string().uuid()).optional().default([]),
  coordinatorIds: z.array(z.string().uuid()).optional().default([]),
  isAiConversation: z.boolean().optional().default(false),
});

// Message metadata schema
export const messageMetadataSchema = z.object({
  attachments: z.array(z.object({
    id: z.string(),
    fileName: z.string(),
    fileType: z.string(),
    fileSize: z.number(),
    url: z.string().url(),
  })).optional(),
  formatting: z.record(z.string(), z.unknown()).optional(),
  aiMetadata: z.object({
    model: z.string(),
    tokenCount: z.number(),
    confidence: z.number().optional(),
  }).optional(),
});

// Send Message Request
export const sendMessageSchema = z.object({
  conversationId: z.string().uuid(),
  content: z.string().min(1).max(10000),
  contentType: messageContentTypeSchema.optional().default('TEXT'),
  metadata: messageMetadataSchema.optional(),
  replyToMessageId: z.string().uuid().optional(),
});

// Create Activity Feed Item Request
export const createActivityFeedItemSchema = z.object({
  clientId: z.string().uuid(),
  activityType: activityTypeSchema,
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  details: z.record(z.string(), z.unknown()).optional(),
  relatedVisitId: z.string().uuid().optional(),
  relatedCaregiverId: z.string().uuid().optional(),
  relatedCarePlanId: z.string().uuid().optional(),
  actorId: z.string().uuid().optional(),
  actorType: actorTypeSchema,
  actorName: z.string().min(1).max(200),
  visibleToFamily: z.boolean().optional().default(true),
  sensitivityLevel: sensitivityLevelSchema.optional().default('NORMAL'),
  occurredAt: z.coerce.date(),
});

// Chat Request
export const chatRequestSchema = z.object({
  conversationId: z.string().uuid().optional(),
  message: z.string().min(1).max(5000),
  context: z.object({
    clientId: z.string().uuid(),
    familyMemberId: z.string().uuid(),
    includeRecentActivity: z.boolean().optional().default(true),
    includeSchedule: z.boolean().optional().default(true),
    includeCarePlan: z.boolean().optional().default(false),
  }),
});

// Search/filter schemas
export const familyPortalUserSearchSchema = z.object({
  clientId: z.string().uuid().optional(),
  email: z.string().email().optional(),
  status: familyUserStatusSchema.optional(),
  relationship: familyRelationshipSchema.optional(),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
});

export const conversationSearchSchema = z.object({
  clientId: z.string().uuid().optional(),
  type: conversationTypeSchema.optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED', 'CLOSED']).optional(),
  familyMemberId: z.string().uuid().optional(),
  isAiConversation: z.boolean().optional(),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
});

export const messageSearchSchema = z.object({
  conversationId: z.string().uuid(),
  beforeMessageId: z.string().uuid().optional(), // For pagination
  limit: z.coerce.number().min(1).max(100).optional().default(50),
});

export const activityFeedSearchSchema = z.object({
  clientId: z.string().uuid(),
  activityType: activityTypeSchema.optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  visibleToFamily: z.boolean().optional().default(true),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
});

// Type exports for TypeScript
export type CreateFamilyPortalUserRequest = z.infer<typeof createFamilyPortalUserSchema>;
export type UpdateFamilyPortalUserRequest = z.infer<typeof updateFamilyPortalUserSchema>;
export type CreateConversationRequest = z.infer<typeof createConversationSchema>;
export type SendMessageRequest = z.infer<typeof sendMessageSchema>;
export type CreateActivityFeedItemRequest = z.infer<typeof createActivityFeedItemSchema>;
export type ChatRequest = z.infer<typeof chatRequestSchema>;
export type FamilyPortalUserSearchParams = z.infer<typeof familyPortalUserSearchSchema>;
export type ConversationSearchParams = z.infer<typeof conversationSearchSchema>;
export type MessageSearchParams = z.infer<typeof messageSearchSchema>;
export type ActivityFeedSearchParams = z.infer<typeof activityFeedSearchSchema>;
