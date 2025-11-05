import { z } from 'zod';

// ============================================================================
// Family Member Validation
// ============================================================================

const notificationPreferencesSchema = z.object({
  visitStart: z.boolean(),
  visitEnd: z.boolean(),
  visitSummary: z.boolean(),
  missedVisit: z.boolean(),
  scheduleChange: z.boolean(),
  emergencyAlert: z.boolean(),
  medicationReminder: z.boolean(),
  appointmentReminder: z.boolean(),
  carePlanUpdate: z.boolean(),
}).partial();

const familyPermissionsSchema = z.object({
  viewVisitHistory: z.boolean(),
  viewCarePlan: z.boolean(),
  viewMedications: z.boolean(),
  viewMedicalNotes: z.boolean(),
  viewCaregiverInfo: z.boolean(),
  requestVisitChanges: z.boolean(),
  provideFeedback: z.boolean(),
  viewBilling: z.boolean(),
}).partial();

export const createFamilyMemberSchema = z.object({
  organizationId: z.string().uuid('Invalid organization ID'),
  clientId: z.string().uuid('Invalid client ID'),
  firstName: z.string().min(1, 'First name required').max(100, 'First name too long'),
  lastName: z.string().min(1, 'Last name required').max(100, 'Last name too long'),
  relationship: z.enum([
    'SPOUSE',
    'PARTNER',
    'DAUGHTER',
    'SON',
    'MOTHER',
    'FATHER',
    'SISTER',
    'BROTHER',
    'GUARDIAN',
    'POWER_OF_ATTORNEY',
    'FRIEND',
    'OTHER',
  ]),
  phone: z.string().regex(/^\+?[\d\s\-()]+$/, 'Invalid phone number').max(20).optional(),
  email: z.string().email('Invalid email address').max(255).optional(),
  preferredContactMethod: z.enum(['SMS', 'EMAIL', 'PHONE', 'PORTAL']).default('SMS'),
  portalAccessEnabled: z.boolean().optional().default(false),
  portalUsername: z.string().min(3, 'Username must be at least 3 characters').max(100).optional(),
  portalPassword: z.string().min(8, 'Password must be at least 8 characters').optional(),
  notificationPreferences: notificationPreferencesSchema.optional(),
  permissions: familyPermissionsSchema.optional(),
  isPrimaryContact: z.boolean().optional().default(false),
  isEmergencyContact: z.boolean().optional().default(false),
}).refine(
  (data) => {
    // If portal access is enabled, username and password must be provided
    if (data.portalAccessEnabled) {
      return !!(data.portalUsername && data.portalPassword);
    }
    return true;
  },
  {
    message: 'Portal username and password required when portal access is enabled',
    path: ['portalUsername'],
  }
).refine(
  (data) => {
    // At least one contact method must be provided
    return !!(data.phone || data.email);
  },
  {
    message: 'At least one contact method (phone or email) is required',
    path: ['phone'],
  }
);

export const updateFamilyMemberSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  relationship: z.enum([
    'SPOUSE',
    'PARTNER',
    'DAUGHTER',
    'SON',
    'MOTHER',
    'FATHER',
    'SISTER',
    'BROTHER',
    'GUARDIAN',
    'POWER_OF_ATTORNEY',
    'FRIEND',
    'OTHER',
  ]).optional(),
  phone: z.string().regex(/^\+?[\d\s\-()]+$/).max(20).optional(),
  email: z.string().email().max(255).optional(),
  preferredContactMethod: z.enum(['SMS', 'EMAIL', 'PHONE', 'PORTAL']).optional(),
  portalAccessEnabled: z.boolean().optional(),
  notificationPreferences: notificationPreferencesSchema.optional(),
  permissions: familyPermissionsSchema.optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
  isPrimaryContact: z.boolean().optional(),
  isEmergencyContact: z.boolean().optional(),
}).partial();

// ============================================================================
// Notification Validation
// ============================================================================

export const createNotificationSchema = z.object({
  organizationId: z.string().uuid(),
  familyMemberId: z.string().uuid(),
  clientId: z.string().uuid(),
  notificationType: z.enum([
    'VISIT_START',
    'VISIT_END',
    'VISIT_SUMMARY',
    'MISSED_VISIT',
    'SCHEDULE_CHANGE',
    'EMERGENCY_ALERT',
    'MEDICATION_REMINDER',
    'APPOINTMENT_REMINDER',
    'CARE_PLAN_UPDATE',
    'FEEDBACK_REQUEST',
  ]),
  channel: z.enum(['SMS', 'EMAIL', 'PORTAL', 'PUSH']),
  subject: z.string().max(200).optional(),
  message: z.string().min(1, 'Message is required'),
  metadata: z.record(z.any()).optional(),
});

// ============================================================================
// Message Validation
// ============================================================================

const attachmentSchema = z.object({
  id: z.string(),
  type: z.enum(['IMAGE', 'VOICE', 'DOCUMENT']),
  url: z.string().url(),
  filename: z.string(),
  size: z.number().positive(),
  mimeType: z.string(),
});

export const createMessageSchema = z.object({
  organizationId: z.string().uuid(),
  clientId: z.string().uuid(),
  senderType: z.enum(['FAMILY', 'COORDINATOR', 'CAREGIVER', 'SYSTEM']),
  senderId: z.string().uuid(),
  messageText: z.string().min(1, 'Message text is required').max(5000),
  messageType: z.enum(['TEXT', 'IMAGE', 'VOICE', 'SYSTEM']).optional().default('TEXT'),
  attachments: z.array(attachmentSchema).optional(),
  threadId: z.string().uuid().optional(),
  parentMessageId: z.string().uuid().optional(),
  requiresResponse: z.boolean().optional().default(false),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional().default('NORMAL'),
});

// ============================================================================
// Feedback Validation
// ============================================================================

export const createFeedbackSchema = z.object({
  organizationId: z.string().uuid(),
  familyMemberId: z.string().uuid(),
  clientId: z.string().uuid(),
  feedbackType: z.enum(['VISIT_RATING', 'CAREGIVER_RATING', 'OVERALL_SATISFACTION']),
  visitId: z.string().uuid().optional(),
  caregiverId: z.string().uuid().optional(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
}).refine(
  (data) => {
    // If feedback type is VISIT_RATING, visitId must be provided
    if (data.feedbackType === 'VISIT_RATING') {
      return !!data.visitId;
    }
    return true;
  },
  {
    message: 'Visit ID is required for visit ratings',
    path: ['visitId'],
  }
).refine(
  (data) => {
    // If feedback type is CAREGIVER_RATING, caregiverId must be provided
    if (data.feedbackType === 'CAREGIVER_RATING') {
      return !!data.caregiverId;
    }
    return true;
  },
  {
    message: 'Caregiver ID is required for caregiver ratings',
    path: ['caregiverId'],
  }
);

// ============================================================================
// Search Filter Validation
// ============================================================================

export const familyMemberSearchSchema = z.object({
  clientId: z.string().uuid().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
  portalAccessEnabled: z.boolean().optional(),
  isPrimaryContact: z.boolean().optional(),
  isEmergencyContact: z.boolean().optional(),
  searchTerm: z.string().optional(),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
});

export const notificationSearchSchema = z.object({
  familyMemberId: z.string().uuid().optional(),
  clientId: z.string().uuid().optional(),
  notificationType: z.enum([
    'VISIT_START',
    'VISIT_END',
    'VISIT_SUMMARY',
    'MISSED_VISIT',
    'SCHEDULE_CHANGE',
    'EMERGENCY_ALERT',
    'MEDICATION_REMINDER',
    'APPOINTMENT_REMINDER',
    'CARE_PLAN_UPDATE',
    'FEEDBACK_REQUEST',
  ]).optional(),
  channel: z.enum(['SMS', 'EMAIL', 'PORTAL', 'PUSH']).optional(),
  status: z.enum(['PENDING', 'SENT', 'DELIVERED', 'FAILED', 'READ']).optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
});

export const messageSearchSchema = z.object({
  clientId: z.string().uuid().optional(),
  threadId: z.string().uuid().optional(),
  senderType: z.enum(['FAMILY', 'COORDINATOR', 'CAREGIVER', 'SYSTEM']).optional(),
  isRead: z.boolean().optional(),
  requiresResponse: z.boolean().optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
});

export const feedbackSearchSchema = z.object({
  clientId: z.string().uuid().optional(),
  familyMemberId: z.string().uuid().optional(),
  caregiverId: z.string().uuid().optional(),
  feedbackType: z.enum(['VISIT_RATING', 'CAREGIVER_RATING', 'OVERALL_SATISFACTION']).optional(),
  ratingMin: z.number().int().min(1).max(5).optional(),
  ratingMax: z.number().int().min(1).max(5).optional(),
  sentiment: z.enum(['POSITIVE', 'NEUTRAL', 'NEGATIVE']).optional(),
  requiresFollowUp: z.boolean().optional(),
  followUpCompleted: z.boolean().optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
});

// ============================================================================
// Portal Authentication Validation
// ============================================================================

export const portalLoginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export const changePortalPasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

// ============================================================================
// Type inference for validators
// ============================================================================

export type CreateFamilyMemberInput = z.infer<typeof createFamilyMemberSchema>;
export type UpdateFamilyMemberInput = z.infer<typeof updateFamilyMemberSchema>;
export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
export type CreateMessageInput = z.infer<typeof createMessageSchema>;
export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>;
export type FamilyMemberSearchInput = z.infer<typeof familyMemberSearchSchema>;
export type NotificationSearchInput = z.infer<typeof notificationSearchSchema>;
export type MessageSearchInput = z.infer<typeof messageSearchSchema>;
export type FeedbackSearchInput = z.infer<typeof feedbackSearchSchema>;
export type PortalLoginInput = z.infer<typeof portalLoginSchema>;
export type ChangePortalPasswordInput = z.infer<typeof changePortalPasswordSchema>;
