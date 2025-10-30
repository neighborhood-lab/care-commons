"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CarePlanValidator = exports.TaskInstanceSearchFiltersSchema = exports.CarePlanSearchFiltersSchema = exports.CreateProgressNoteInputSchema = exports.CompleteTaskInputSchema = exports.CreateTaskInstanceInputSchema = exports.UpdateCarePlanInputSchema = exports.CreateCarePlanInputSchema = void 0;
const zod_1 = require("zod");
const UUIDSchema = zod_1.z.string().uuid();
const DateSchema = zod_1.z.coerce.date();
const TimeSchema = zod_1.z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/);
const CarePlanTypeSchema = zod_1.z.enum([
    'PERSONAL_CARE',
    'COMPANION',
    'SKILLED_NURSING',
    'THERAPY',
    'HOSPICE',
    'RESPITE',
    'LIVE_IN',
    'CUSTOM',
]);
const CarePlanStatusSchema = zod_1.z.enum([
    'DRAFT',
    'PENDING_APPROVAL',
    'ACTIVE',
    'ON_HOLD',
    'EXPIRED',
    'DISCONTINUED',
    'COMPLETED',
]);
const PrioritySchema = zod_1.z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);
const GoalCategorySchema = zod_1.z.enum([
    'MOBILITY',
    'ADL',
    'IADL',
    'NUTRITION',
    'MEDICATION_MANAGEMENT',
    'SAFETY',
    'SOCIAL_ENGAGEMENT',
    'COGNITIVE',
    'EMOTIONAL_WELLBEING',
    'PAIN_MANAGEMENT',
    'WOUND_CARE',
    'CHRONIC_DISEASE_MANAGEMENT',
    'OTHER',
]);
const GoalStatusSchema = zod_1.z.enum([
    'NOT_STARTED',
    'IN_PROGRESS',
    'ON_TRACK',
    'AT_RISK',
    'ACHIEVED',
    'PARTIALLY_ACHIEVED',
    'NOT_ACHIEVED',
    'DISCONTINUED',
]);
const InterventionCategorySchema = zod_1.z.enum([
    'ASSISTANCE_WITH_ADL',
    'ASSISTANCE_WITH_IADL',
    'MEDICATION_ADMINISTRATION',
    'MEDICATION_REMINDER',
    'VITAL_SIGNS_MONITORING',
    'WOUND_CARE',
    'RANGE_OF_MOTION',
    'AMBULATION_ASSISTANCE',
    'TRANSFER_ASSISTANCE',
    'FALL_PREVENTION',
    'NUTRITION_MEAL_PREP',
    'FEEDING_ASSISTANCE',
    'HYDRATION_MONITORING',
    'INCONTINENCE_CARE',
    'SKIN_CARE',
    'COGNITIVE_STIMULATION',
    'COMPANIONSHIP',
    'SAFETY_MONITORING',
    'TRANSPORTATION',
    'RESPITE_CARE',
    'OTHER',
]);
const TaskCategorySchema = zod_1.z.enum([
    'PERSONAL_HYGIENE',
    'BATHING',
    'DRESSING',
    'GROOMING',
    'TOILETING',
    'MOBILITY',
    'TRANSFERRING',
    'AMBULATION',
    'MEDICATION',
    'MEAL_PREPARATION',
    'FEEDING',
    'HOUSEKEEPING',
    'LAUNDRY',
    'SHOPPING',
    'TRANSPORTATION',
    'COMPANIONSHIP',
    'MONITORING',
    'DOCUMENTATION',
    'OTHER',
]);
const TaskStatusSchema = zod_1.z.enum([
    'SCHEDULED',
    'IN_PROGRESS',
    'COMPLETED',
    'SKIPPED',
    'MISSED',
    'CANCELLED',
    'ISSUE_REPORTED',
]);
const FrequencyPatternSchema = zod_1.z.enum([
    'DAILY',
    'WEEKLY',
    'BI_WEEKLY',
    'MONTHLY',
    'AS_NEEDED',
    'CUSTOM',
]);
const DayOfWeekSchema = zod_1.z.enum([
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
    'SATURDAY',
    'SUNDAY',
]);
const TimeOfDaySchema = zod_1.z.enum([
    'EARLY_MORNING',
    'MORNING',
    'AFTERNOON',
    'EVENING',
    'NIGHT',
    'OVERNIGHT',
    'ANY',
]);
const PerformerTypeSchema = zod_1.z.enum([
    'CAREGIVER',
    'CNA',
    'HHA',
    'RN',
    'LPN',
    'THERAPIST',
    'FAMILY',
    'CLIENT',
]);
const VerificationTypeSchema = zod_1.z.enum([
    'NONE',
    'CHECKBOX',
    'SIGNATURE',
    'PHOTO',
    'GPS',
    'BARCODE_SCAN',
    'VITAL_SIGNS',
    'CUSTOM',
]);
const MilestoneSchema = zod_1.z.object({
    id: UUIDSchema,
    name: zod_1.z.string().min(1).max(255),
    targetDate: DateSchema,
    completedDate: DateSchema.optional(),
    status: zod_1.z.enum(['PENDING', 'COMPLETED', 'MISSED']),
    notes: zod_1.z.string().max(1000).optional(),
});
const FrequencySchema = zod_1.z.object({
    pattern: FrequencyPatternSchema,
    interval: zod_1.z.number().int().positive().optional(),
    unit: zod_1.z.enum(['MINUTES', 'HOURS', 'DAYS', 'WEEKS', 'MONTHS']).optional(),
    timesPerDay: zod_1.z.number().int().positive().optional(),
    timesPerWeek: zod_1.z.number().int().positive().optional(),
    specificTimes: zod_1.z.array(TimeSchema).optional(),
    specificDays: zod_1.z.array(DayOfWeekSchema).optional(),
});
const ServiceFrequencySchema = zod_1.z.object({
    pattern: FrequencyPatternSchema,
    timesPerWeek: zod_1.z.number().int().positive().optional(),
    timesPerMonth: zod_1.z.number().int().positive().optional(),
    specificDays: zod_1.z.array(DayOfWeekSchema).optional(),
    customSchedule: zod_1.z.string().max(500).optional(),
});
const CarePlanGoalSchema = zod_1.z.object({
    id: UUIDSchema,
    name: zod_1.z.string().min(1).max(255),
    description: zod_1.z.string().min(1).max(2000),
    category: GoalCategorySchema,
    targetDate: DateSchema.optional(),
    status: GoalStatusSchema,
    priority: PrioritySchema,
    measurementType: zod_1.z.enum(['QUANTITATIVE', 'QUALITATIVE', 'BINARY']).optional(),
    targetValue: zod_1.z.number().optional(),
    currentValue: zod_1.z.number().optional(),
    unit: zod_1.z.string().max(50).optional(),
    milestones: zod_1.z.array(MilestoneSchema).optional(),
    progressPercentage: zod_1.z.number().min(0).max(100).optional(),
    lastAssessedDate: DateSchema.optional(),
    interventionIds: zod_1.z.array(UUIDSchema).optional(),
    taskIds: zod_1.z.array(UUIDSchema).optional(),
    achievedDate: DateSchema.optional(),
    outcome: zod_1.z.string().max(1000).optional(),
    notes: zod_1.z.string().max(2000).optional(),
});
const InterventionSchema = zod_1.z.object({
    id: UUIDSchema,
    name: zod_1.z.string().min(1).max(255),
    description: zod_1.z.string().min(1).max(2000),
    category: InterventionCategorySchema,
    goalIds: zod_1.z.array(UUIDSchema),
    frequency: FrequencySchema,
    duration: zod_1.z.number().int().positive().optional(),
    instructions: zod_1.z.string().min(1).max(5000),
    precautions: zod_1.z.array(zod_1.z.string().max(500)).optional(),
    performedBy: zod_1.z.array(PerformerTypeSchema),
    requiresSupervision: zod_1.z.boolean().optional(),
    supervisorRole: zod_1.z.string().max(100).optional(),
    requiredEquipment: zod_1.z.array(zod_1.z.string().max(200)).optional(),
    requiredSupplies: zod_1.z.array(zod_1.z.string().max(200)).optional(),
    requiresDocumentation: zod_1.z.boolean(),
    documentationTemplate: zod_1.z.string().max(500).optional(),
    status: zod_1.z.enum(['ACTIVE', 'SUSPENDED', 'DISCONTINUED']),
    startDate: DateSchema,
    endDate: DateSchema.optional(),
    expectedOutcome: zod_1.z.string().max(1000).optional(),
    contraindications: zod_1.z.array(zod_1.z.string().max(500)).optional(),
    notes: zod_1.z.string().max(2000).optional(),
});
const TaskStepSchema = zod_1.z.object({
    stepNumber: zod_1.z.number().int().positive(),
    description: zod_1.z.string().min(1).max(1000),
    isRequired: zod_1.z.boolean(),
    estimatedDuration: zod_1.z.number().int().positive().optional(),
    safetyNotes: zod_1.z.string().max(500).optional(),
});
const QualityCheckSchema = zod_1.z.object({
    id: UUIDSchema,
    question: zod_1.z.string().min(1).max(500),
    checkType: zod_1.z.enum(['YES_NO', 'SCALE', 'TEXT', 'CHECKLIST']),
    required: zod_1.z.boolean(),
    options: zod_1.z.array(zod_1.z.string().max(200)).optional(),
});
const CustomFieldSchema = zod_1.z.object({
    id: UUIDSchema,
    name: zod_1.z.string().min(1).max(100),
    fieldType: zod_1.z.enum([
        'TEXT',
        'NUMBER',
        'DATE',
        'TIME',
        'BOOLEAN',
        'SELECT',
        'MULTI_SELECT',
        'TEXTAREA',
        'RADIO',
        'CHECKBOX',
    ]),
    required: zod_1.z.boolean(),
    options: zod_1.z.array(zod_1.z.string()).optional(),
    validation: zod_1.z.object({
        pattern: zod_1.z.string().optional(),
        minLength: zod_1.z.number().int().positive().optional(),
        maxLength: zod_1.z.number().int().positive().optional(),
        min: zod_1.z.number().optional(),
        max: zod_1.z.number().optional(),
        customValidator: zod_1.z.string().optional(),
    }).optional(),
    defaultValue: zod_1.z.unknown().optional(),
    helpText: zod_1.z.string().max(500).optional(),
});
const TaskTemplateSchema = zod_1.z.object({
    id: UUIDSchema,
    name: zod_1.z.string().min(1).max(255),
    description: zod_1.z.string().min(1).max(2000),
    category: TaskCategorySchema,
    interventionIds: zod_1.z.array(UUIDSchema).optional(),
    frequency: FrequencySchema,
    estimatedDuration: zod_1.z.number().int().positive().optional(),
    timeOfDay: zod_1.z.array(TimeOfDaySchema).optional(),
    instructions: zod_1.z.string().min(1).max(5000),
    steps: zod_1.z.array(TaskStepSchema).optional(),
    requiresSignature: zod_1.z.boolean(),
    requiresNote: zod_1.z.boolean(),
    requiresPhoto: zod_1.z.boolean().optional(),
    requiresVitals: zod_1.z.boolean().optional(),
    requiredFields: zod_1.z.array(CustomFieldSchema).optional(),
    isOptional: zod_1.z.boolean(),
    allowSkip: zod_1.z.boolean(),
    skipReasons: zod_1.z.array(zod_1.z.string().max(200)).optional(),
    verificationType: VerificationTypeSchema.optional(),
    qualityChecks: zod_1.z.array(QualityCheckSchema).optional(),
    status: zod_1.z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']),
    notes: zod_1.z.string().max(2000).optional(),
    tags: zod_1.z.array(zod_1.z.string().max(50)).optional(),
});
const SignatureSchema = zod_1.z.object({
    signatureData: zod_1.z.string().min(1),
    signedBy: UUIDSchema,
    signedByName: zod_1.z.string().min(1).max(200),
    signatureType: zod_1.z.enum(['ELECTRONIC', 'STYLUS', 'TOUCHSCREEN']),
    ipAddress: zod_1.z.string().optional(),
    deviceInfo: zod_1.z.string().max(500).optional(),
});
const SignatureWithoutTimestampSchema = SignatureSchema.pick({
    signatureData: true,
    signedBy: true,
    signedByName: true,
    signatureType: true,
    ipAddress: true,
    deviceInfo: true,
});
const GeoLocationSchema = zod_1.z.object({
    latitude: zod_1.z.number().min(-90).max(90),
    longitude: zod_1.z.number().min(-180).max(180),
    accuracy: zod_1.z.number().positive().optional(),
});
const VitalSignsSchema = zod_1.z.object({
    bloodPressureSystolic: zod_1.z.number().int().min(50).max(250).optional(),
    bloodPressureDiastolic: zod_1.z.number().int().min(30).max(150).optional(),
    heartRate: zod_1.z.number().int().min(30).max(200).optional(),
    temperature: zod_1.z.number().min(90).max(110).optional(),
    temperatureUnit: zod_1.z.enum(['F', 'C']).optional(),
    oxygenSaturation: zod_1.z.number().int().min(0).max(100).optional(),
    respiratoryRate: zod_1.z.number().int().min(5).max(60).optional(),
    bloodGlucose: zod_1.z.number().int().min(20).max(600).optional(),
    weight: zod_1.z.number().positive().optional(),
    weightUnit: zod_1.z.enum(['LBS', 'KG']).optional(),
    pain: zod_1.z.number().int().min(0).max(10).optional(),
    notes: zod_1.z.string().max(1000).optional(),
});
const VerificationDataSchema = zod_1.z.object({
    verificationType: VerificationTypeSchema,
    gpsLocation: GeoLocationSchema.optional(),
    photoUrls: zod_1.z.array(zod_1.z.string().url()).optional(),
    barcodeData: zod_1.z.string().optional(),
    vitalSigns: VitalSignsSchema.optional(),
    customData: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional(),
});
const QualityCheckResponseSchema = zod_1.z.object({
    checkId: UUIDSchema,
    question: zod_1.z.string().min(1).max(500),
    response: zod_1.z.union([zod_1.z.string(), zod_1.z.number(), zod_1.z.boolean(), zod_1.z.array(zod_1.z.string())]),
    notes: zod_1.z.string().max(1000).optional(),
});
exports.CreateCarePlanInputSchema = zod_1.z.object({
    clientId: UUIDSchema,
    organizationId: UUIDSchema,
    branchId: UUIDSchema.optional(),
    name: zod_1.z.string().min(1).max(255),
    planType: CarePlanTypeSchema,
    effectiveDate: DateSchema,
    expirationDate: DateSchema.optional(),
    goals: zod_1.z.array(CarePlanGoalSchema.omit({ id: true })),
    interventions: zod_1.z.array(InterventionSchema.omit({ id: true })),
    taskTemplates: zod_1.z.array(TaskTemplateSchema.omit({ id: true })).optional(),
    serviceFrequency: ServiceFrequencySchema.optional(),
    coordinatorId: UUIDSchema.optional(),
    notes: zod_1.z.string().max(5000).optional(),
}).refine((data) => !data.expirationDate || data.expirationDate > data.effectiveDate, {
    message: 'Expiration date must be after effective date',
    path: ['expirationDate'],
});
exports.UpdateCarePlanInputSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(255).optional(),
    status: CarePlanStatusSchema.optional(),
    priority: PrioritySchema.optional(),
    expirationDate: DateSchema.optional(),
    reviewDate: DateSchema.optional(),
    goals: zod_1.z.array(CarePlanGoalSchema).optional(),
    interventions: zod_1.z.array(InterventionSchema).optional(),
    taskTemplates: zod_1.z.array(TaskTemplateSchema).optional(),
    serviceFrequency: ServiceFrequencySchema.optional(),
    notes: zod_1.z.string().max(5000).optional(),
});
exports.CreateTaskInstanceInputSchema = zod_1.z.object({
    carePlanId: UUIDSchema,
    templateId: UUIDSchema.optional(),
    visitId: UUIDSchema.optional(),
    clientId: UUIDSchema,
    assignedCaregiverId: UUIDSchema.optional(),
    name: zod_1.z.string().min(1).max(255),
    description: zod_1.z.string().min(1).max(2000),
    category: TaskCategorySchema,
    instructions: zod_1.z.string().min(1).max(5000),
    scheduledDate: DateSchema,
    scheduledTime: TimeSchema.optional(),
    requiredSignature: zod_1.z.boolean(),
    requiredNote: zod_1.z.boolean(),
});
exports.CompleteTaskInputSchema = zod_1.z.object({
    completionNote: zod_1.z.string().max(2000).optional(),
    signature: SignatureSchema.optional(),
    verificationData: VerificationDataSchema.optional(),
    qualityCheckResponses: zod_1.z.array(QualityCheckResponseSchema).optional(),
    customFieldValues: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional(),
});
exports.CreateProgressNoteInputSchema = zod_1.z.object({
    carePlanId: UUIDSchema,
    clientId: UUIDSchema,
    visitId: UUIDSchema.optional(),
    noteType: zod_1.z.enum([
        'VISIT_NOTE',
        'WEEKLY_SUMMARY',
        'MONTHLY_SUMMARY',
        'CARE_PLAN_REVIEW',
        'INCIDENT',
        'CHANGE_IN_CONDITION',
        'COMMUNICATION',
        'OTHER',
    ]),
    content: zod_1.z.string().min(1).max(10000),
    goalProgress: zod_1.z.array(zod_1.z.object({
        goalId: UUIDSchema,
        goalName: zod_1.z.string().max(255),
        status: GoalStatusSchema,
        progressDescription: zod_1.z.string().max(2000),
        progressPercentage: zod_1.z.number().min(0).max(100).optional(),
        barriers: zod_1.z.array(zod_1.z.string().max(500)).optional(),
        nextSteps: zod_1.z.array(zod_1.z.string().max(500)).optional(),
    })).optional(),
    observations: zod_1.z.array(zod_1.z.object({
        category: zod_1.z.enum([
            'PHYSICAL',
            'COGNITIVE',
            'EMOTIONAL',
            'BEHAVIORAL',
            'SOCIAL',
            'ENVIRONMENTAL',
            'SAFETY',
        ]),
        observation: zod_1.z.string().max(1000),
        severity: zod_1.z.enum(['NORMAL', 'ATTENTION', 'URGENT']).optional(),
        timestamp: DateSchema,
    })).optional(),
    concerns: zod_1.z.array(zod_1.z.string().max(500)).optional(),
    recommendations: zod_1.z.array(zod_1.z.string().max(500)).optional(),
    signature: SignatureWithoutTimestampSchema.optional(),
});
exports.CarePlanSearchFiltersSchema = zod_1.z.object({
    query: zod_1.z.string().max(200).optional(),
    clientId: UUIDSchema.optional(),
    organizationId: UUIDSchema.optional(),
    branchId: UUIDSchema.optional(),
    status: zod_1.z.array(CarePlanStatusSchema).optional(),
    planType: zod_1.z.array(CarePlanTypeSchema).optional(),
    coordinatorId: UUIDSchema.optional(),
    expiringWithinDays: zod_1.z.number().int().positive().optional(),
    needsReview: zod_1.z.boolean().optional(),
    complianceStatus: zod_1.z.array(zod_1.z.enum([
        'COMPLIANT',
        'PENDING_REVIEW',
        'EXPIRED',
        'NON_COMPLIANT',
    ])).optional(),
});
exports.TaskInstanceSearchFiltersSchema = zod_1.z.object({
    carePlanId: UUIDSchema.optional(),
    clientId: UUIDSchema.optional(),
    assignedCaregiverId: UUIDSchema.optional(),
    visitId: UUIDSchema.optional(),
    status: zod_1.z.array(TaskStatusSchema).optional(),
    category: zod_1.z.array(TaskCategorySchema).optional(),
    scheduledDateFrom: DateSchema.optional(),
    scheduledDateTo: DateSchema.optional(),
    overdue: zod_1.z.boolean().optional(),
    requiresSignature: zod_1.z.boolean().optional(),
});
class CarePlanValidator {
    static validateCreateCarePlan(input) {
        return exports.CreateCarePlanInputSchema.parse(input);
    }
    static validateUpdateCarePlan(input) {
        return exports.UpdateCarePlanInputSchema.parse(input);
    }
    static validateCreateTaskInstance(input) {
        return exports.CreateTaskInstanceInputSchema.parse(input);
    }
    static validateCompleteTask(input) {
        return exports.CompleteTaskInputSchema.parse(input);
    }
    static validateCreateProgressNote(input) {
        return exports.CreateProgressNoteInputSchema.parse(input);
    }
    static validateCarePlanSearchFilters(input) {
        return exports.CarePlanSearchFiltersSchema.parse(input);
    }
    static validateTaskInstanceSearchFilters(input) {
        return exports.TaskInstanceSearchFiltersSchema.parse(input);
    }
    static validateTaskCompletion(task, completion) {
        const errors = [];
        if (task.requiredSignature && !completion.signature) {
            errors.push('Signature is required for this task');
        }
        if (task.requiredNote && (!completion.completionNote || completion.completionNote.trim() === '')) {
            errors.push('Completion note is required for this task');
        }
        return {
            valid: errors.length === 0,
            errors,
        };
    }
    static validateVitalSigns(vitals) {
        const parsed = VitalSignsSchema.parse(vitals);
        const warnings = [];
        if (parsed.bloodPressureSystolic && parsed.bloodPressureSystolic > 180) {
            warnings.push('Systolic blood pressure is critically high');
        }
        if (parsed.bloodPressureDiastolic && parsed.bloodPressureDiastolic > 120) {
            warnings.push('Diastolic blood pressure is critically high');
        }
        if (parsed.oxygenSaturation && parsed.oxygenSaturation < 90) {
            warnings.push('Oxygen saturation is critically low');
        }
        if (parsed.temperature) {
            const tempF = parsed.temperatureUnit === 'C' ? (parsed.temperature * 9 / 5) + 32 : parsed.temperature;
            if (tempF > 103) {
                warnings.push('Temperature is critically high');
            }
            else if (tempF < 95) {
                warnings.push('Temperature is critically low');
            }
        }
        return {
            valid: true,
            warnings,
        };
    }
    static validateCarePlanActivation(plan) {
        const errors = [];
        if (plan.goals.length === 0) {
            errors.push('Care plan must have at least one goal');
        }
        if (plan.interventions.length === 0) {
            errors.push('Care plan must have at least one intervention');
        }
        if (!plan.coordinatorId) {
            errors.push('Care plan must have an assigned coordinator');
        }
        const now = new Date();
        if (plan.effectiveDate > now) {
            errors.push('Care plan effective date cannot be in the future');
        }
        if (plan.expirationDate && plan.expirationDate <= now) {
            errors.push('Care plan expiration date must be in the future');
        }
        return {
            valid: errors.length === 0,
            errors,
        };
    }
}
exports.CarePlanValidator = CarePlanValidator;
exports.default = CarePlanValidator;
//# sourceMappingURL=care-plan-validator.js.map