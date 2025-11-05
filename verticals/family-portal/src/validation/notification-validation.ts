import { z } from 'zod';

// Notification Type
export const notificationTypeSchema = z.enum([
  'CARE_UPDATE',
  'VISIT_REMINDER',
  'VISIT_COMPLETED',
  'VISIT_CANCELLED',
  'CARE_PLAN_UPDATE',
  'MEDICATION_CHANGE',
  'DOCUMENT_ADDED',
  'MESSAGE_RECEIVED',
  'EMERGENCY_ALERT',
  'SYSTEM_ANNOUNCEMENT',
]);

// Notification Category
export const notificationCategorySchema = z.enum([
  'CARE',
  'SCHEDULE',
  'HEALTH',
  'COMMUNICATION',
  'EMERGENCY',
  'SYSTEM',
]);

// Notification Priority
export const notificationPrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);

// Notification Channel
export const notificationChannelSchema = z.enum(['IN_APP', 'EMAIL', 'SMS', 'PUSH']);

// Notification Status
export const notificationStatusSchema = z.enum([
  'PENDING',
  'SENT',
  'READ',
  'DISMISSED',
  'FAILED',
]);

// Related Entity
export const relatedEntitySchema = z.object({
  type: z.enum(['visit', 'care_plan', 'medication', 'document', 'message']),
  id: z.string().uuid(),
});

// Create Notification
export const createNotificationSchema = z.object({
  familyMemberId: z.string().uuid(),
  clientId: z.string().uuid(),
  type: notificationTypeSchema,
  category: notificationCategorySchema,
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  priority: notificationPrioritySchema.default('MEDIUM'),
  actionRequired: z.boolean().default(false),
  actionUrl: z.string().url().optional(),
  actionLabel: z.string().max(50).optional(),
  channels: z.array(notificationChannelSchema).default(['IN_APP']),
  relatedEntity: relatedEntitySchema.optional(),
  expiresInDays: z.number().int().min(1).max(90).optional(),
});

export type CreateNotificationSchema = z.infer<typeof createNotificationSchema>;

// Update Notification Status
export const updateNotificationStatusSchema = z.object({
  status: notificationStatusSchema,
});

export type UpdateNotificationStatusSchema = z.infer<typeof updateNotificationStatusSchema>;

// Mark As Read
export const markAsReadSchema = z.object({
  notificationIds: z.array(z.string().uuid()).min(1),
});

export type MarkAsReadSchema = z.infer<typeof markAsReadSchema>;

// Query Notifications
export const queryNotificationsSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  category: notificationCategorySchema.optional(),
  priority: notificationPrioritySchema.optional(),
  status: notificationStatusSchema.optional(),
  unreadOnly: z.coerce.boolean().optional(),
  urgentOnly: z.coerce.boolean().optional(),
});

export type QueryNotificationsSchema = z.infer<typeof queryNotificationsSchema>;

// Notification Preferences
export const notificationPreferencesSchema = z.object({
  careUpdates: z.object({
    enabled: z.boolean(),
    channels: z.array(notificationChannelSchema),
    priority: notificationPrioritySchema,
  }),
  visitReminders: z.object({
    enabled: z.boolean(),
    channels: z.array(notificationChannelSchema),
    reminderHoursBefore: z.number().int().min(1).max(72),
  }),
  emergencyAlerts: z.object({
    enabled: z.boolean(),
    channels: z.array(notificationChannelSchema),
  }),
  chatMessages: z.object({
    enabled: z.boolean(),
    channels: z.array(notificationChannelSchema),
  }),
  systemAnnouncements: z.object({
    enabled: z.boolean(),
    channels: z.array(notificationChannelSchema),
  }),
  quietHours: z
    .object({
      enabled: z.boolean(),
      startTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/), // HH:mm format
      endTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
      timezone: z.string(),
    })
    .optional(),
});

export type NotificationPreferencesSchema = z.infer<typeof notificationPreferencesSchema>;
