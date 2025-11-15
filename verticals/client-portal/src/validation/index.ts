/**
 * @care-commons/client-portal - Validation Schemas
 *
 * Zod validation schemas for client portal inputs
 */

import { z } from 'zod';

// ============================================================================
// Portal Access Validation
// ============================================================================

/**
 * Accessibility preferences schema
 */
export const accessibilityPreferencesSchema = z.object({
  fontSize: z.enum(['SMALL', 'MEDIUM', 'LARGE', 'X_LARGE']).default('MEDIUM'),
  theme: z.enum(['LIGHT', 'DARK', 'HIGH_CONTRAST']).default('LIGHT'),
  animationsEnabled: z.boolean().default(true),
  reducedMotion: z.boolean().default(false),
  screenReaderMode: z.boolean().default(false),
  keyboardNavigationOnly: z.boolean().default(false),
  voiceControlEnabled: z.boolean().default(false),
  highContrast: z.boolean().default(false),
  largeClickTargets: z.boolean().default(false),
  underlineLinks: z.boolean().default(false),
  captionsEnabled: z.boolean().default(false),
  audioDescriptions: z.boolean().default(false),
  language: z.string().length(2).default('en'),
  textToSpeechEnabled: z.boolean().default(false),
});

/**
 * Notification preferences schema
 */
export const notificationPreferencesSchema = z.object({
  emailEnabled: z.boolean().default(true),
  smsEnabled: z.boolean().default(false),
  pushEnabled: z.boolean().default(true),
  visitReminders: z.boolean().default(true),
  visitCompletedUpdates: z.boolean().default(true),
  caregiverChanges: z.boolean().default(true),
  scheduleChangeStatus: z.boolean().default(true),
  carePlanUpdates: z.boolean().default(true),
  appointmentReminders: z.boolean().default(true),
  quietHoursStart: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).nullable().optional(),
  quietHoursEnd: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).nullable().optional(),
  timezone: z.string().default('America/New_York'),
  digestFrequency: z.enum(['IMMEDIATE', 'DAILY', 'WEEKLY', 'NONE']).default('IMMEDIATE'),
});

/**
 * Invite client to portal input schema
 */
export const inviteClientToPortalSchema = z.object({
  clientId: z.string().uuid(),
  accessibilityPreferences: accessibilityPreferencesSchema.partial().optional(),
  notificationPreferences: notificationPreferencesSchema.partial().optional(),
  expiresInDays: z.number().int().min(1).max(30).default(7),
});

export type InviteClientToPortalInput = z.infer<typeof inviteClientToPortalSchema>;

/**
 * Activate portal access input schema
 */
export const activatePortalAccessSchema = z.object({
  invitationCode: z.string().min(32).max(128),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128)
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain uppercase, lowercase, number, and special character'
    ),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions',
  }),
});

export type ActivatePortalAccessInput = z.infer<typeof activatePortalAccessSchema>;

/**
 * Update accessibility preferences input schema
 */
export const updateAccessibilityPreferencesSchema = accessibilityPreferencesSchema.partial();

export type UpdateAccessibilityPreferencesInput = z.infer<typeof updateAccessibilityPreferencesSchema>;

/**
 * Update notification preferences input schema
 */
export const updateNotificationPreferencesSchema = notificationPreferencesSchema.partial();

export type UpdateNotificationPreferencesInput = z.infer<typeof updateNotificationPreferencesSchema>;

// ============================================================================
// Visit Rating Validation
// ============================================================================

/**
 * Create visit rating input schema
 */
export const createVisitRatingSchema = z.object({
  visitId: z.string().uuid(),
  overallRating: z.number().int().min(1).max(5),
  professionalismRating: z.number().int().min(1).max(5).optional(),
  punctualityRating: z.number().int().min(1).max(5).optional(),
  qualityOfCareRating: z.number().int().min(1).max(5).optional(),
  communicationRating: z.number().int().min(1).max(5).optional(),
  positiveFeedback: z.string().max(1000).optional(),
  improvementFeedback: z.string().max(1000).optional(),
  additionalComments: z.string().max(2000).optional(),
  wouldRequestAgain: z.boolean().optional(),
  isAnonymous: z.boolean().default(false),
});

export type CreateVisitRatingInput = z.infer<typeof createVisitRatingSchema>;

/**
 * Update visit rating input schema
 */
export const updateVisitRatingSchema = createVisitRatingSchema.partial().omit({ visitId: true });

export type UpdateVisitRatingInput = z.infer<typeof updateVisitRatingSchema>;

/**
 * Visit rating filters schema
 */
export const visitRatingFiltersSchema = z.object({
  clientId: z.string().uuid().optional(),
  caregiverId: z.string().uuid().optional(),
  minRating: z.number().int().min(1).max(5).optional(),
  maxRating: z.number().int().min(1).max(5).optional(),
  flaggedOnly: z.boolean().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export type VisitRatingFilters = z.infer<typeof visitRatingFiltersSchema>;

// ============================================================================
// Schedule Change Request Validation
// ============================================================================

/**
 * Create schedule change request input schema
 */
export const createScheduleChangeRequestSchema = z.object({
  requestType: z.enum(['RESCHEDULE', 'CANCEL', 'ADD', 'RECURRING']),
  visitId: z.string().uuid().optional(),
  requestedStartTime: z.coerce.date().optional(),
  requestedEndTime: z.coerce.date().optional(),
  requestedReason: z.string().min(10).max(500),
  priority: z.number().int().min(1).max(5).default(1),
}).superRefine((data, ctx) => {
  // RESCHEDULE and CANCEL require visitId
  if ((data.requestType === 'RESCHEDULE' || data.requestType === 'CANCEL') && !data.visitId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'visitId is required for RESCHEDULE and CANCEL requests',
      path: ['visitId'],
    });
  }

  // RESCHEDULE and ADD require requested times
  if (data.requestType === 'RESCHEDULE' || data.requestType === 'ADD') {
    if (!data.requestedStartTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'requestedStartTime is required for RESCHEDULE and ADD requests',
        path: ['requestedStartTime'],
      });
    }
    if (!data.requestedEndTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'requestedEndTime is required for RESCHEDULE and ADD requests',
        path: ['requestedEndTime'],
      });
    }
  }

  // Validate that end time is after start time
  if (data.requestedStartTime && data.requestedEndTime) {
    if (data.requestedEndTime <= data.requestedStartTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'requestedEndTime must be after requestedStartTime',
        path: ['requestedEndTime'],
      });
    }
  }
});

export type CreateScheduleChangeRequestInput = z.infer<typeof createScheduleChangeRequestSchema>;

/**
 * Review schedule change request input schema
 */
export const reviewScheduleChangeRequestSchema = z.object({
  status: z.enum(['APPROVED', 'DENIED']),
  reviewNotes: z.string().max(1000).optional(),
  denialReason: z.string().max(500).optional(),
  newVisitId: z.string().uuid().optional(),
}).superRefine((data, ctx) => {
  // DENIED requires denialReason
  if (data.status === 'DENIED' && !data.denialReason) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'denialReason is required when status is DENIED',
      path: ['denialReason'],
    });
  }
});

export type ReviewScheduleChangeRequestInput = z.infer<typeof reviewScheduleChangeRequestSchema>;

/**
 * Schedule change request filters schema
 */
export const scheduleChangeRequestFiltersSchema = z.object({
  clientId: z.string().uuid().optional(),
  status: z.array(z.enum(['PENDING', 'APPROVED', 'DENIED', 'CANCELLED'])).optional(),
  requestType: z.array(z.enum(['RESCHEDULE', 'CANCEL', 'ADD', 'RECURRING'])).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export type ScheduleChangeRequestFilters = z.infer<typeof scheduleChangeRequestFiltersSchema>;

// ============================================================================
// Video Call Session Validation
// ============================================================================

/**
 * Schedule video call input schema
 */
export const scheduleVideoCallSchema = z.object({
  coordinatorId: z.string().uuid(),
  callType: z.enum(['SCHEDULED', 'ON_DEMAND', 'SUPPORT']),
  scheduledStart: z.coerce.date(),
  scheduledEnd: z.coerce.date(),
  callPurpose: z.string().max(500).optional(),
  captionsEnabled: z.boolean().default(false),
  signLanguageInterpreter: z.boolean().default(false),
  languagePreference: z.string().length(2).optional(),
}).superRefine((data, ctx) => {
  // Validate that end time is after start time
  if (data.scheduledEnd <= data.scheduledStart) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'scheduledEnd must be after scheduledStart',
      path: ['scheduledEnd'],
    });
  }

  // Validate that scheduled time is in the future (for SCHEDULED calls)
  if (data.callType === 'SCHEDULED' && data.scheduledStart < new Date()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'scheduledStart must be in the future for SCHEDULED calls',
      path: ['scheduledStart'],
    });
  }

  // Validate that duration is reasonable (max 2 hours)
  const durationMs = data.scheduledEnd.getTime() - data.scheduledStart.getTime();
  const durationHours = durationMs / (1000 * 60 * 60);
  if (durationHours > 2) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Video call duration cannot exceed 2 hours',
      path: ['scheduledEnd'],
    });
  }
});

export type ScheduleVideoCallInput = z.infer<typeof scheduleVideoCallSchema>;

/**
 * Rate video call input schema
 */
export const rateVideoCallSchema = z.object({
  clientRating: z.number().int().min(1).max(5),
  clientFeedback: z.string().max(1000).optional(),
  qualityMetrics: z.object({
    audioQuality: z.number().int().min(1).max(5).optional(),
    videoQuality: z.number().int().min(1).max(5).optional(),
    connectionStable: z.boolean().optional(),
    latencyMs: z.number().int().min(0).optional(),
    packetsLost: z.number().int().min(0).optional(),
    technicalIssues: z.array(z.string()).optional(),
  }).optional(),
});

export type RateVideoCallInput = z.infer<typeof rateVideoCallSchema>;

/**
 * Video call session filters schema
 */
export const videoCallSessionFiltersSchema = z.object({
  clientId: z.string().uuid().optional(),
  coordinatorId: z.string().uuid().optional(),
  status: z.array(z.enum(['SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'FAILED'])).optional(),
  callType: z.array(z.enum(['SCHEDULED', 'ON_DEMAND', 'SUPPORT'])).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export type VideoCallSessionFilters = z.infer<typeof videoCallSessionFiltersSchema>;

// ============================================================================
// Common Validation Schemas
// ============================================================================

/**
 * Pagination schema
 */
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type PaginationParams = z.infer<typeof paginationSchema>;

/**
 * UUID parameter schema (for path params)
 */
export const uuidSchema = z.string().uuid({
  message: 'Invalid UUID format',
});

/**
 * Date range schema
 */
export const dateRangeSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
}).superRefine((data, ctx) => {
  if (data.endDate < data.startDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'endDate must be after startDate',
      path: ['endDate'],
    });
  }
});

export type DateRangeParams = z.infer<typeof dateRangeSchema>;
