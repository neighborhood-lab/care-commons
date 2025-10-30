"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduleValidator = exports.caregiverAvailabilityQuerySchema = exports.visitSearchFiltersSchema = exports.scheduleGenerationOptionsSchema = exports.completeVisitInputSchema = exports.updateVisitStatusInputSchema = exports.assignVisitInputSchema = exports.createVisitInputSchema = exports.updateServicePatternInputSchema = exports.createServicePatternInputSchema = exports.signatureDataSchema = exports.locationVerificationSchema = exports.visitAddressSchema = exports.recurrenceRuleSchema = void 0;
const zod_1 = require("zod");
const uuidSchema = zod_1.z.string().uuid();
const dateSchema = zod_1.z.coerce.date();
const timeSchema = zod_1.z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Must be in HH:MM format');
const patternTypeSchema = zod_1.z.enum([
    'RECURRING',
    'ONE_TIME',
    'AS_NEEDED',
    'RESPITE',
]);
const patternStatusSchema = zod_1.z.enum([
    'DRAFT',
    'ACTIVE',
    'SUSPENDED',
    'COMPLETED',
    'CANCELLED',
]);
const frequencySchema = zod_1.z.enum([
    'DAILY',
    'WEEKLY',
    'BIWEEKLY',
    'MONTHLY',
    'CUSTOM',
]);
const dayOfWeekSchema = zod_1.z.enum([
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
    'SATURDAY',
    'SUNDAY',
]);
const visitTypeSchema = zod_1.z.enum([
    'REGULAR',
    'INITIAL',
    'DISCHARGE',
    'RESPITE',
    'EMERGENCY',
    'MAKEUP',
    'SUPERVISION',
    'ASSESSMENT',
]);
const visitStatusSchema = zod_1.z.enum([
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
const assignmentMethodSchema = zod_1.z.enum([
    'MANUAL',
    'AUTO_MATCH',
    'SELF_ASSIGN',
    'PREFERRED',
    'OVERFLOW',
]);
exports.recurrenceRuleSchema = zod_1.z.object({
    frequency: frequencySchema,
    interval: zod_1.z.number().int().min(1).max(365),
    daysOfWeek: zod_1.z.array(dayOfWeekSchema).optional(),
    datesOfMonth: zod_1.z.array(zod_1.z.number().int().min(1).max(31)).optional(),
    startTime: timeSchema,
    endTime: timeSchema.optional(),
    timezone: zod_1.z.string(),
});
exports.visitAddressSchema = zod_1.z.object({
    line1: zod_1.z.string().min(1).max(200),
    line2: zod_1.z.string().max(200).optional(),
    city: zod_1.z.string().min(1).max(100),
    state: zod_1.z.string().min(2).max(2),
    postalCode: zod_1.z.string().min(5).max(10),
    country: zod_1.z.string().default('US'),
    latitude: zod_1.z.number().min(-90).max(90).optional(),
    longitude: zod_1.z.number().min(-180).max(180).optional(),
    accessInstructions: zod_1.z.string().max(1000).optional(),
});
exports.locationVerificationSchema = zod_1.z.object({
    method: zod_1.z.enum(['GPS', 'PHONE', 'FACIAL', 'BIOMETRIC', 'MANUAL']),
    timestamp: zod_1.z.date(),
    latitude: zod_1.z.number().min(-90).max(90).optional(),
    longitude: zod_1.z.number().min(-180).max(180).optional(),
    accuracy: zod_1.z.number().positive().optional(),
    distanceFromAddress: zod_1.z.number().nonnegative().optional(),
    isWithinGeofence: zod_1.z.boolean(),
    deviceId: zod_1.z.string().optional(),
});
exports.signatureDataSchema = zod_1.z.object({
    capturedAt: zod_1.z.date(),
    capturedBy: uuidSchema,
    signatureImageUrl: zod_1.z.string().url().optional(),
    signatureDataUrl: zod_1.z.string().optional(),
    deviceId: zod_1.z.string().optional(),
    ipAddress: zod_1.z.string().regex(/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/, 'Invalid IP address').optional(),
});
exports.createServicePatternInputSchema = zod_1.z.object({
    organizationId: uuidSchema,
    branchId: uuidSchema,
    clientId: uuidSchema,
    name: zod_1.z.string().min(1).max(200),
    description: zod_1.z.string().max(1000).optional(),
    patternType: patternTypeSchema,
    serviceTypeId: uuidSchema,
    serviceTypeName: zod_1.z.string().min(1).max(200),
    recurrence: exports.recurrenceRuleSchema,
    duration: zod_1.z.number().int().min(15).max(1440),
    flexibilityWindow: zod_1.z.number().int().min(0).max(120).optional(),
    requiredSkills: zod_1.z.array(zod_1.z.string()).optional(),
    requiredCertifications: zod_1.z.array(zod_1.z.string()).optional(),
    preferredCaregivers: zod_1.z.array(uuidSchema).optional(),
    blockedCaregivers: zod_1.z.array(uuidSchema).optional(),
    genderPreference: zod_1.z.enum(['MALE', 'FEMALE', 'NO_PREFERENCE']).optional(),
    languagePreference: zod_1.z.string().optional(),
    preferredTimeOfDay: zod_1.z.enum([
        'EARLY_MORNING',
        'MORNING',
        'AFTERNOON',
        'EVENING',
        'NIGHT',
        'ANY',
    ]).optional(),
    mustStartBy: timeSchema.optional(),
    mustEndBy: timeSchema.optional(),
    authorizedHoursPerWeek: zod_1.z.number().positive().max(168).optional(),
    authorizedVisitsPerWeek: zod_1.z.number().int().positive().max(100).optional(),
    authorizationStartDate: dateSchema.optional(),
    authorizationEndDate: dateSchema.optional(),
    fundingSourceId: uuidSchema.optional(),
    travelTimeBefore: zod_1.z.number().int().min(0).max(120).optional(),
    travelTimeAfter: zod_1.z.number().int().min(0).max(120).optional(),
    allowBackToBack: zod_1.z.boolean().default(false),
    effectiveFrom: dateSchema,
    effectiveTo: dateSchema.optional(),
    clientInstructions: zod_1.z.string().max(2000).optional(),
    caregiverInstructions: zod_1.z.string().max(2000).optional(),
    notes: zod_1.z.string().max(2000).optional(),
}).refine((data) => !data.effectiveTo || data.effectiveFrom <= data.effectiveTo, {
    message: 'effectiveTo must be after effectiveFrom',
    path: ['effectiveTo'],
}).refine((data) => !data.authorizationEndDate || !data.authorizationStartDate ||
    data.authorizationStartDate <= data.authorizationEndDate, {
    message: 'authorizationEndDate must be after authorizationStartDate',
    path: ['authorizationEndDate'],
});
exports.updateServicePatternInputSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(200).optional(),
    description: zod_1.z.string().max(1000).optional(),
    recurrence: exports.recurrenceRuleSchema.optional(),
    duration: zod_1.z.number().int().min(15).max(1440).optional(),
    requiredSkills: zod_1.z.array(zod_1.z.string()).optional(),
    requiredCertifications: zod_1.z.array(zod_1.z.string()).optional(),
    preferredCaregivers: zod_1.z.array(uuidSchema).optional(),
    status: patternStatusSchema.optional(),
    effectiveTo: dateSchema.optional(),
    clientInstructions: zod_1.z.string().max(2000).optional(),
    caregiverInstructions: zod_1.z.string().max(2000).optional(),
    notes: zod_1.z.string().max(2000).optional(),
});
exports.createVisitInputSchema = zod_1.z.object({
    organizationId: uuidSchema,
    branchId: uuidSchema,
    clientId: uuidSchema,
    patternId: uuidSchema.optional(),
    visitType: visitTypeSchema,
    serviceTypeId: uuidSchema,
    serviceTypeName: zod_1.z.string().min(1).max(200),
    scheduledDate: dateSchema,
    scheduledStartTime: timeSchema,
    scheduledEndTime: timeSchema,
    address: exports.visitAddressSchema,
    taskIds: zod_1.z.array(uuidSchema).optional(),
    requiredSkills: zod_1.z.array(zod_1.z.string()).optional(),
    requiredCertifications: zod_1.z.array(zod_1.z.string()).optional(),
    isUrgent: zod_1.z.boolean().default(false),
    isPriority: zod_1.z.boolean().default(false),
    requiresSupervision: zod_1.z.boolean().default(false),
    riskFlags: zod_1.z.array(zod_1.z.string()).optional(),
    clientInstructions: zod_1.z.string().max(2000).optional(),
    caregiverInstructions: zod_1.z.string().max(2000).optional(),
    internalNotes: zod_1.z.string().max(2000).optional(),
}).refine((data) => {
    const start = data.scheduledStartTime.split(':').map(Number);
    const end = data.scheduledEndTime.split(':').map(Number);
    const startMinutes = start[0] * 60 + start[1];
    const endMinutes = end[0] * 60 + end[1];
    return startMinutes < endMinutes;
}, {
    message: 'scheduledEndTime must be after scheduledStartTime',
    path: ['scheduledEndTime'],
});
exports.assignVisitInputSchema = zod_1.z.object({
    visitId: uuidSchema,
    caregiverId: uuidSchema,
    assignmentMethod: assignmentMethodSchema,
    notes: zod_1.z.string().max(1000).optional(),
});
exports.updateVisitStatusInputSchema = zod_1.z.object({
    visitId: uuidSchema,
    newStatus: visitStatusSchema,
    notes: zod_1.z.string().max(1000).optional(),
    reason: zod_1.z.string().max(500).optional(),
    locationVerification: exports.locationVerificationSchema.optional(),
});
exports.completeVisitInputSchema = zod_1.z.object({
    visitId: uuidSchema,
    actualEndTime: zod_1.z.date(),
    completionNotes: zod_1.z.string().max(2000).optional(),
    tasksCompleted: zod_1.z.number().int().min(0),
    tasksTotal: zod_1.z.number().int().min(0),
    signatureData: exports.signatureDataSchema.optional(),
    locationVerification: exports.locationVerificationSchema,
}).refine((data) => data.tasksCompleted <= data.tasksTotal, {
    message: 'tasksCompleted cannot exceed tasksTotal',
    path: ['tasksCompleted'],
});
exports.scheduleGenerationOptionsSchema = zod_1.z.object({
    patternId: uuidSchema,
    startDate: dateSchema,
    endDate: dateSchema,
    autoAssign: zod_1.z.boolean().default(false),
    respectHourlyLimits: zod_1.z.boolean().default(true),
    skipHolidays: zod_1.z.boolean().default(false),
    holidayCalendarId: uuidSchema.optional(),
}).refine((data) => data.startDate < data.endDate, {
    message: 'endDate must be after startDate',
    path: ['endDate'],
}).refine((data) => {
    const daysDiff = (data.endDate.getTime() - data.startDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff <= 365;
}, {
    message: 'Schedule generation period cannot exceed 365 days',
    path: ['endDate'],
});
exports.visitSearchFiltersSchema = zod_1.z.object({
    query: zod_1.z.string().max(200).optional(),
    organizationId: uuidSchema.optional(),
    branchId: uuidSchema.optional(),
    branchIds: zod_1.z.array(uuidSchema).optional(),
    clientId: uuidSchema.optional(),
    clientIds: zod_1.z.array(uuidSchema).optional(),
    caregiverId: uuidSchema.optional(),
    caregiverIds: zod_1.z.array(uuidSchema).optional(),
    patternId: uuidSchema.optional(),
    status: zod_1.z.array(visitStatusSchema).optional(),
    visitType: zod_1.z.array(visitTypeSchema).optional(),
    dateFrom: dateSchema.optional(),
    dateTo: dateSchema.optional(),
    isUnassigned: zod_1.z.boolean().optional(),
    isUrgent: zod_1.z.boolean().optional(),
    requiresSupervision: zod_1.z.boolean().optional(),
    hasExceptions: zod_1.z.boolean().optional(),
});
exports.caregiverAvailabilityQuerySchema = zod_1.z.object({
    caregiverId: uuidSchema,
    date: dateSchema,
    startTime: timeSchema.optional(),
    endTime: timeSchema.optional(),
    duration: zod_1.z.number().int().min(15).max(1440).optional(),
    includeTravel: zod_1.z.boolean().default(true),
});
class ScheduleValidator {
    static validateServicePattern(input) {
        return exports.createServicePatternInputSchema.parse(input);
    }
    static validateUpdatePattern(input) {
        return exports.updateServicePatternInputSchema.parse(input);
    }
    static validateVisit(input) {
        return exports.createVisitInputSchema.parse(input);
    }
    static validateAssignment(input) {
        return exports.assignVisitInputSchema.parse(input);
    }
    static validateStatusUpdate(input) {
        return exports.updateVisitStatusInputSchema.parse(input);
    }
    static validateCompletion(input) {
        return exports.completeVisitInputSchema.parse(input);
    }
    static validateGenerationOptions(input) {
        return exports.scheduleGenerationOptionsSchema.parse(input);
    }
    static validateSearchFilters(input) {
        return exports.visitSearchFiltersSchema.parse(input);
    }
    static validateAvailabilityQuery(input) {
        return exports.caregiverAvailabilityQuerySchema.parse(input);
    }
}
exports.ScheduleValidator = ScheduleValidator;
//# sourceMappingURL=schedule-validator.js.map