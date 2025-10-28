/**
 * Validation schemas for Scheduling & Visit Management
 * 
 * Uses Zod for runtime validation and type safety
 */

import { z } from 'zod';

// Base validators
const uuidSchema = z.string().uuid();
const dateSchema = z.coerce.date();
const timeSchema = z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Must be in HH:MM format');

// Enums
const patternTypeSchema = z.enum([
  'RECURRING',
  'ONE_TIME',
  'AS_NEEDED',
  'RESPITE',
]);

const patternStatusSchema = z.enum([
  'DRAFT',
  'ACTIVE',
  'SUSPENDED',
  'COMPLETED',
  'CANCELLED',
]);

const frequencySchema = z.enum([
  'DAILY',
  'WEEKLY',
  'BIWEEKLY',
  'MONTHLY',
  'CUSTOM',
]);

const dayOfWeekSchema = z.enum([
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
]);

const visitTypeSchema = z.enum([
  'REGULAR',
  'INITIAL',
  'DISCHARGE',
  'RESPITE',
  'EMERGENCY',
  'MAKEUP',
  'SUPERVISION',
  'ASSESSMENT',
]);

const visitStatusSchema = z.enum([
  'DRAFT',
  'SCHEDULED',
  'UNASSIGNED',
  'ASSIGNED',
  'CONFIRMED',
  'EN_ROUTE',
  'ARRIVED',
  'IN_PROGRESS',
  'PAUSED',
  'COMPLETED',
  'INCOMPLETE',
  'CANCELLED',
  'NO_SHOW_CLIENT',
  'NO_SHOW_CAREGIVER',
  'REJECTED',
]);

const assignmentMethodSchema = z.enum([
  'MANUAL',
  'AUTO_MATCH',
  'SELF_ASSIGN',
  'PREFERRED',
  'OVERFLOW',
]);

// Complex object validators
export const recurrenceRuleSchema = z.object({
  frequency: frequencySchema,
  interval: z.number().int().min(1).max(365),
  daysOfWeek: z.array(dayOfWeekSchema).optional(),
  datesOfMonth: z.array(z.number().int().min(1).max(31)).optional(),
  startTime: timeSchema,
  endTime: timeSchema.optional(),
  timezone: z.string(),
});

export const visitAddressSchema = z.object({
  line1: z.string().min(1).max(200),
  line2: z.string().max(200).optional(),
  city: z.string().min(1).max(100),
  state: z.string().min(2).max(2),
  postalCode: z.string().min(5).max(10),
  country: z.string().default('US'),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  accessInstructions: z.string().max(1000).optional(),
});

export const locationVerificationSchema = z.object({
  method: z.enum(['GPS', 'PHONE', 'FACIAL', 'BIOMETRIC', 'MANUAL']),
  timestamp: z.date(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  accuracy: z.number().positive().optional(),
  distanceFromAddress: z.number().nonnegative().optional(),
  isWithinGeofence: z.boolean(),
  deviceId: z.string().optional(),
});

export const signatureDataSchema = z.object({
  capturedAt: z.date(),
  capturedBy: uuidSchema,
  signatureImageUrl: z.string().url().optional(),
  signatureDataUrl: z.string().optional(),
  deviceId: z.string().optional(),
  ipAddress: z.string().ip().optional(),
});

// Input validators
export const createServicePatternInputSchema = z.object({
  organizationId: uuidSchema,
  branchId: uuidSchema,
  clientId: uuidSchema,
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  patternType: patternTypeSchema,
  serviceTypeId: uuidSchema,
  serviceTypeName: z.string().min(1).max(200),
  recurrence: recurrenceRuleSchema,
  duration: z.number().int().min(15).max(1440), // 15 min to 24 hours
  flexibilityWindow: z.number().int().min(0).max(120).optional(),
  requiredSkills: z.array(z.string()).optional(),
  requiredCertifications: z.array(z.string()).optional(),
  preferredCaregivers: z.array(uuidSchema).optional(),
  blockedCaregivers: z.array(uuidSchema).optional(),
  genderPreference: z.enum(['MALE', 'FEMALE', 'NO_PREFERENCE']).optional(),
  languagePreference: z.string().optional(),
  preferredTimeOfDay: z.enum([
    'EARLY_MORNING',
    'MORNING',
    'AFTERNOON',
    'EVENING',
    'NIGHT',
    'ANY',
  ]).optional(),
  mustStartBy: timeSchema.optional(),
  mustEndBy: timeSchema.optional(),
  authorizedHoursPerWeek: z.number().positive().max(168).optional(),
  authorizedVisitsPerWeek: z.number().int().positive().max(100).optional(),
  authorizationStartDate: dateSchema.optional(),
  authorizationEndDate: dateSchema.optional(),
  fundingSourceId: uuidSchema.optional(),
  travelTimeBefore: z.number().int().min(0).max(120).optional(),
  travelTimeAfter: z.number().int().min(0).max(120).optional(),
  allowBackToBack: z.boolean().default(false),
  effectiveFrom: dateSchema,
  effectiveTo: dateSchema.optional(),
  clientInstructions: z.string().max(2000).optional(),
  caregiverInstructions: z.string().max(2000).optional(),
  notes: z.string().max(2000).optional(),
}).refine(
  (data) => !data.effectiveTo || data.effectiveFrom <= data.effectiveTo,
  {
    message: 'effectiveTo must be after effectiveFrom',
    path: ['effectiveTo'],
  }
).refine(
  (data) => !data.authorizationEndDate || !data.authorizationStartDate || 
             data.authorizationStartDate <= data.authorizationEndDate,
  {
    message: 'authorizationEndDate must be after authorizationStartDate',
    path: ['authorizationEndDate'],
  }
);

export const updateServicePatternInputSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  recurrence: recurrenceRuleSchema.optional(),
  duration: z.number().int().min(15).max(1440).optional(),
  requiredSkills: z.array(z.string()).optional(),
  requiredCertifications: z.array(z.string()).optional(),
  preferredCaregivers: z.array(uuidSchema).optional(),
  status: patternStatusSchema.optional(),
  effectiveTo: dateSchema.optional(),
  clientInstructions: z.string().max(2000).optional(),
  caregiverInstructions: z.string().max(2000).optional(),
  notes: z.string().max(2000).optional(),
});

export const createVisitInputSchema = z.object({
  organizationId: uuidSchema,
  branchId: uuidSchema,
  clientId: uuidSchema,
  patternId: uuidSchema.optional(),
  visitType: visitTypeSchema,
  serviceTypeId: uuidSchema,
  serviceTypeName: z.string().min(1).max(200),
  scheduledDate: dateSchema,
  scheduledStartTime: timeSchema,
  scheduledEndTime: timeSchema,
  address: visitAddressSchema,
  taskIds: z.array(uuidSchema).optional(),
  requiredSkills: z.array(z.string()).optional(),
  requiredCertifications: z.array(z.string()).optional(),
  isUrgent: z.boolean().default(false),
  isPriority: z.boolean().default(false),
  requiresSupervision: z.boolean().default(false),
  riskFlags: z.array(z.string()).optional(),
  clientInstructions: z.string().max(2000).optional(),
  caregiverInstructions: z.string().max(2000).optional(),
  internalNotes: z.string().max(2000).optional(),
}).refine(
  (data) => {
    const start = data.scheduledStartTime.split(':').map(Number);
    const end = data.scheduledEndTime.split(':').map(Number);
    const startMinutes = start[0] * 60 + start[1];
    const endMinutes = end[0] * 60 + end[1];
    return startMinutes < endMinutes;
  },
  {
    message: 'scheduledEndTime must be after scheduledStartTime',
    path: ['scheduledEndTime'],
  }
);

export const assignVisitInputSchema = z.object({
  visitId: uuidSchema,
  caregiverId: uuidSchema,
  assignmentMethod: assignmentMethodSchema,
  notes: z.string().max(1000).optional(),
});

export const updateVisitStatusInputSchema = z.object({
  visitId: uuidSchema,
  newStatus: visitStatusSchema,
  notes: z.string().max(1000).optional(),
  reason: z.string().max(500).optional(),
  locationVerification: locationVerificationSchema.optional(),
});

export const completeVisitInputSchema = z.object({
  visitId: uuidSchema,
  actualEndTime: z.date(),
  completionNotes: z.string().max(2000).optional(),
  tasksCompleted: z.number().int().min(0),
  tasksTotal: z.number().int().min(0),
  signatureData: signatureDataSchema.optional(),
  locationVerification: locationVerificationSchema,
}).refine(
  (data) => data.tasksCompleted <= data.tasksTotal,
  {
    message: 'tasksCompleted cannot exceed tasksTotal',
    path: ['tasksCompleted'],
  }
);

export const scheduleGenerationOptionsSchema = z.object({
  patternId: uuidSchema,
  startDate: dateSchema,
  endDate: dateSchema,
  autoAssign: z.boolean().default(false),
  respectHourlyLimits: z.boolean().default(true),
  skipHolidays: z.boolean().default(false),
  holidayCalendarId: uuidSchema.optional(),
}).refine(
  (data) => data.startDate < data.endDate,
  {
    message: 'endDate must be after startDate',
    path: ['endDate'],
  }
).refine(
  (data) => {
    const daysDiff = (data.endDate.getTime() - data.startDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff <= 365;
  },
  {
    message: 'Schedule generation period cannot exceed 365 days',
    path: ['endDate'],
  }
);

export const visitSearchFiltersSchema = z.object({
  query: z.string().max(200).optional(),
  organizationId: uuidSchema.optional(),
  branchId: uuidSchema.optional(),
  branchIds: z.array(uuidSchema).optional(),
  clientId: uuidSchema.optional(),
  clientIds: z.array(uuidSchema).optional(),
  caregiverId: uuidSchema.optional(),
  caregiverIds: z.array(uuidSchema).optional(),
  patternId: uuidSchema.optional(),
  status: z.array(visitStatusSchema).optional(),
  visitType: z.array(visitTypeSchema).optional(),
  dateFrom: dateSchema.optional(),
  dateTo: dateSchema.optional(),
  isUnassigned: z.boolean().optional(),
  isUrgent: z.boolean().optional(),
  requiresSupervision: z.boolean().optional(),
  hasExceptions: z.boolean().optional(),
});

export const caregiverAvailabilityQuerySchema = z.object({
  caregiverId: uuidSchema,
  date: dateSchema,
  startTime: timeSchema.optional(),
  endTime: timeSchema.optional(),
  duration: z.number().int().min(15).max(1440).optional(),
  includeTravel: z.boolean().default(true),
});

/**
 * Validation helper functions
 */

export class ScheduleValidator {
  static validateServicePattern(input: unknown) {
    return createServicePatternInputSchema.parse(input);
  }

  static validateUpdatePattern(input: unknown) {
    return updateServicePatternInputSchema.parse(input);
  }

  static validateVisit(input: unknown) {
    return createVisitInputSchema.parse(input);
  }

  static validateAssignment(input: unknown) {
    return assignVisitInputSchema.parse(input);
  }

  static validateStatusUpdate(input: unknown) {
    return updateVisitStatusInputSchema.parse(input);
  }

  static validateCompletion(input: unknown) {
    return completeVisitInputSchema.parse(input);
  }

  static validateGenerationOptions(input: unknown) {
    return scheduleGenerationOptionsSchema.parse(input);
  }

  static validateSearchFilters(input: unknown) {
    return visitSearchFiltersSchema.parse(input);
  }

  static validateAvailabilityQuery(input: unknown) {
    return caregiverAvailabilityQuerySchema.parse(input);
  }
}
