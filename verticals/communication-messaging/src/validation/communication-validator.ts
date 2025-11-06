/**
 * Communication validation schemas using Zod
 */

import { z } from 'zod';

/**
 * Channel type enum
 */
export const ChannelTypeSchema = z.enum([
  'SMS',
  'EMAIL',
  'PUSH',
  'IN_APP',
  'VOICE',
  'VIDEO',
]);

/**
 * Message type enum
 */
export const MessageTypeSchema = z.enum([
  'DIRECT',
  'GROUP',
  'BROADCAST',
  'AUTOMATED',
  'SCHEDULED',
]);

/**
 * Message priority enum
 */
export const MessagePrioritySchema = z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']);

/**
 * Notification category enum
 */
export const NotificationCategorySchema = z.enum([
  'VISIT',
  'SCHEDULE',
  'CARE_PLAN',
  'TASK',
  'MESSAGE',
  'INCIDENT',
  'REMINDER',
  'APPROVAL',
  'SYSTEM',
  'MARKETING',
]);

/**
 * Participant type enum
 */
export const ParticipantTypeSchema = z.enum([
  'CAREGIVER',
  'CLIENT',
  'FAMILY',
  'COORDINATOR',
  'ADMIN',
  'SYSTEM',
]);

/**
 * Create thread input validation
 */
export const CreateThreadInputSchema = z.object({
  organizationId: z.string().uuid(),
  branchId: z.string().uuid().optional(),
  threadType: MessageTypeSchema,
  subject: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  participantIds: z.array(z.string().uuid()).min(1),
  relatedEntityType: z.enum(['CLIENT', 'VISIT', 'CARE_PLAN', 'INCIDENT']).optional(),
  relatedEntityId: z.string().uuid().optional(),
  category: z.string().max(50).optional(),
  tags: z.array(z.string().max(50)).optional(),
});

/**
 * Send message input validation
 */
export const SendMessageInputSchema = z.object({
  threadId: z.string().uuid(),
  senderId: z.string().uuid(),
  content: z.string().min(1).max(10000),
  contentFormat: z.enum(['PLAIN_TEXT', 'MARKDOWN', 'HTML']).optional(),
  priority: MessagePrioritySchema.optional(),
  attachments: z.array(z.object({
    attachmentId: z.string().uuid(),
    fileName: z.string(),
    fileType: z.string(),
    fileSize: z.number().positive(),
    fileUrl: z.string().url(),
    thumbnailUrl: z.string().url().optional(),
    uploadedAt: z.date(),
    uploadedBy: z.string().uuid(),
  })).optional(),
  replyToMessageId: z.string().uuid().optional(),
  channels: z.array(ChannelTypeSchema).optional(),
  scheduledSendAt: z.date().optional(),
  isInternal: z.boolean().optional(),
  mentionedUserIds: z.array(z.string().uuid()).optional(),
});

/**
 * Send notification input validation
 */
export const SendNotificationInputSchema = z.object({
  organizationId: z.string().uuid(),
  recipientId: z.string().uuid(),
  recipientType: ParticipantTypeSchema,
  category: NotificationCategorySchema,
  priority: MessagePrioritySchema,
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  richContent: z.string().max(10000).optional(),
  actionUrl: z.string().url().optional(),
  actionLabel: z.string().max(50).optional(),
  channels: z.array(ChannelTypeSchema).min(1),
  relatedEntityType: z.string().max(50).optional(),
  relatedEntityId: z.string().uuid().optional(),
  scheduledSendAt: z.date().optional(),
  expiresAt: z.date().optional(),
});

/**
 * Update preferences input validation
 */
export const UpdatePreferencesInputSchema = z.object({
  userId: z.string().uuid(),
  preferredChannel: ChannelTypeSchema.optional(),
  enabledChannels: z.array(ChannelTypeSchema).optional(),
  emailAddress: z.string().email().optional(),
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(), // E.164 format
  categoryPreferences: z.array(z.object({
    category: NotificationCategorySchema,
    enabled: z.boolean(),
    channels: z.array(ChannelTypeSchema),
    priority: z.enum(['LOW', 'NORMAL', 'HIGH']),
    frequency: z.enum(['IMMEDIATE', 'BATCHED', 'DIGEST']),
  })).optional(),
  quietHoursEnabled: z.boolean().optional(),
  quietHoursStart: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(), // HH:mm format
  quietHoursEnd: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  quietHoursTimezone: z.string().optional(),
  doNotDisturbEnabled: z.boolean().optional(),
  doNotDisturbUntil: z.date().optional(),
  marketingOptIn: z.boolean().optional(),
  smsOptIn: z.boolean().optional(),
  emailOptIn: z.boolean().optional(),
  pushOptIn: z.boolean().optional(),
});

/**
 * Create template input validation
 */
export const CreateTemplateInputSchema = z.object({
  organizationId: z.string().uuid(),
  templateName: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  category: NotificationCategorySchema,
  subject: z.string().max(200).optional(),
  content: z.string().min(1).max(10000),
  contentFormat: z.enum(['PLAIN_TEXT', 'MARKDOWN', 'HTML']).optional(),
  variables: z.array(z.object({
    name: z.string().min(1).max(50),
    description: z.string().max(200),
    dataType: z.enum(['STRING', 'NUMBER', 'DATE', 'BOOLEAN', 'URL']),
    isRequired: z.boolean(),
    defaultValue: z.string().optional(),
    exampleValue: z.string().optional(),
  })),
  channelVersions: z.record(z.string(), z.object({
    channelType: ChannelTypeSchema,
    subject: z.string().max(200).optional(),
    content: z.string().min(1).max(10000),
    contentFormat: z.enum(['PLAIN_TEXT', 'MARKDOWN', 'HTML']),
    characterLimit: z.number().positive().optional(),
  })).optional(),
  tags: z.array(z.string().max(50)).optional(),
  language: z.string().length(2).optional(), // ISO 639-1 code
});

/**
 * Validator class with reusable validation methods
 */
export class CommunicationValidator {
  validateCreateThread(input: unknown) {
    const result = CreateThreadInputSchema.safeParse(input);
    return {
      success: result.success,
      data: result.success ? result.data : undefined,
      errors: result.success ? undefined : result.error.format(),
    };
  }

  validateSendMessage(input: unknown) {
    const result = SendMessageInputSchema.safeParse(input);
    return {
      success: result.success,
      data: result.success ? result.data : undefined,
      errors: result.success ? undefined : result.error.format(),
    };
  }

  validateSendNotification(input: unknown) {
    const result = SendNotificationInputSchema.safeParse(input);
    return {
      success: result.success,
      data: result.success ? result.data : undefined,
      errors: result.success ? undefined : result.error.format(),
    };
  }

  validateUpdatePreferences(input: unknown) {
    const result = UpdatePreferencesInputSchema.safeParse(input);
    return {
      success: result.success,
      data: result.success ? result.data : undefined,
      errors: result.success ? undefined : result.error.format(),
    };
  }

  validateCreateTemplate(input: unknown) {
    const result = CreateTemplateInputSchema.safeParse(input);
    return {
      success: result.success,
      data: result.success ? result.data : undefined,
      errors: result.success ? undefined : result.error.format(),
    };
  }
}
