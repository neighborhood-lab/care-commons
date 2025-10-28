/**
 * Validation schemas for Care Plans & Tasks
 * 
 * Uses Zod for runtime type validation
 */

import { z } from 'zod';

// Base schemas
const UUIDSchema = z.string().uuid();
const DateSchema = z.coerce.date();
const TimeSchema = z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/);

// Enums
const CarePlanTypeSchema = z.enum([
  'PERSONAL_CARE',
  'COMPANION',
  'SKILLED_NURSING',
  'THERAPY',
  'HOSPICE',
  'RESPITE',
  'LIVE_IN',
  'CUSTOM',
]);

const CarePlanStatusSchema = z.enum([
  'DRAFT',
  'PENDING_APPROVAL',
  'ACTIVE',
  'ON_HOLD',
  'EXPIRED',
  'DISCONTINUED',
  'COMPLETED',
]);

const PrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);

const GoalCategorySchema = z.enum([
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

const GoalStatusSchema = z.enum([
  'NOT_STARTED',
  'IN_PROGRESS',
  'ON_TRACK',
  'AT_RISK',
  'ACHIEVED',
  'PARTIALLY_ACHIEVED',
  'NOT_ACHIEVED',
  'DISCONTINUED',
]);

const InterventionCategorySchema = z.enum([
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

const TaskCategorySchema = z.enum([
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

const TaskStatusSchema = z.enum([
  'SCHEDULED',
  'IN_PROGRESS',
  'COMPLETED',
  'SKIPPED',
  'MISSED',
  'CANCELLED',
  'ISSUE_REPORTED',
]);

const FrequencyPatternSchema = z.enum([
  'DAILY',
  'WEEKLY',
  'BI_WEEKLY',
  'MONTHLY',
  'AS_NEEDED',
  'CUSTOM',
]);

const DayOfWeekSchema = z.enum([
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
]);

const TimeOfDaySchema = z.enum([
  'EARLY_MORNING',
  'MORNING',
  'AFTERNOON',
  'EVENING',
  'NIGHT',
  'OVERNIGHT',
  'ANY',
]);

const PerformerTypeSchema = z.enum([
  'CAREGIVER',
  'CNA',
  'HHA',
  'RN',
  'LPN',
  'THERAPIST',
  'FAMILY',
  'CLIENT',
]);

const VerificationTypeSchema = z.enum([
  'NONE',
  'CHECKBOX',
  'SIGNATURE',
  'PHOTO',
  'GPS',
  'BARCODE_SCAN',
  'VITAL_SIGNS',
  'CUSTOM',
]);

// Complex schemas
const MilestoneSchema = z.object({
  id: UUIDSchema,
  name: z.string().min(1).max(255),
  targetDate: DateSchema,
  completedDate: DateSchema.optional(),
  status: z.enum(['PENDING', 'COMPLETED', 'MISSED']),
  notes: z.string().max(1000).optional(),
});

const FrequencySchema = z.object({
  pattern: FrequencyPatternSchema,
  interval: z.number().int().positive().optional(),
  unit: z.enum(['MINUTES', 'HOURS', 'DAYS', 'WEEKS', 'MONTHS']).optional(),
  timesPerDay: z.number().int().positive().optional(),
  timesPerWeek: z.number().int().positive().optional(),
  specificTimes: z.array(TimeSchema).optional(),
  specificDays: z.array(DayOfWeekSchema).optional(),
});

const ServiceFrequencySchema = z.object({
  pattern: FrequencyPatternSchema,
  timesPerWeek: z.number().int().positive().optional(),
  timesPerMonth: z.number().int().positive().optional(),
  specificDays: z.array(DayOfWeekSchema).optional(),
  customSchedule: z.string().max(500).optional(),
});

const CarePlanGoalSchema = z.object({
  id: UUIDSchema,
  name: z.string().min(1).max(255),
  description: z.string().min(1).max(2000),
  category: GoalCategorySchema,
  targetDate: DateSchema.optional(),
  status: GoalStatusSchema,
  priority: PrioritySchema,
  measurementType: z.enum(['QUANTITATIVE', 'QUALITATIVE', 'BINARY']).optional(),
  targetValue: z.number().optional(),
  currentValue: z.number().optional(),
  unit: z.string().max(50).optional(),
  milestones: z.array(MilestoneSchema).optional(),
  progressPercentage: z.number().min(0).max(100).optional(),
  lastAssessedDate: DateSchema.optional(),
  interventionIds: z.array(UUIDSchema).optional(),
  taskIds: z.array(UUIDSchema).optional(),
  achievedDate: DateSchema.optional(),
  outcome: z.string().max(1000).optional(),
  notes: z.string().max(2000).optional(),
});

const InterventionSchema = z.object({
  id: UUIDSchema,
  name: z.string().min(1).max(255),
  description: z.string().min(1).max(2000),
  category: InterventionCategorySchema,
  goalIds: z.array(UUIDSchema),
  frequency: FrequencySchema,
  duration: z.number().int().positive().optional(),
  instructions: z.string().min(1).max(5000),
  precautions: z.array(z.string().max(500)).optional(),
  performedBy: z.array(PerformerTypeSchema),
  requiresSupervision: z.boolean().optional(),
  supervisorRole: z.string().max(100).optional(),
  requiredEquipment: z.array(z.string().max(200)).optional(),
  requiredSupplies: z.array(z.string().max(200)).optional(),
  requiresDocumentation: z.boolean(),
  documentationTemplate: z.string().max(500).optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'DISCONTINUED']),
  startDate: DateSchema,
  endDate: DateSchema.optional(),
  expectedOutcome: z.string().max(1000).optional(),
  contraindications: z.array(z.string().max(500)).optional(),
  notes: z.string().max(2000).optional(),
});

const TaskStepSchema = z.object({
  stepNumber: z.number().int().positive(),
  description: z.string().min(1).max(1000),
  isRequired: z.boolean(),
  estimatedDuration: z.number().int().positive().optional(),
  safetyNotes: z.string().max(500).optional(),
});

const QualityCheckSchema = z.object({
  id: UUIDSchema,
  question: z.string().min(1).max(500),
  checkType: z.enum(['YES_NO', 'SCALE', 'TEXT', 'CHECKLIST']),
  required: z.boolean(),
  options: z.array(z.string().max(200)).optional(),
});

const CustomFieldSchema = z.object({
  id: UUIDSchema,
  name: z.string().min(1).max(100),
  fieldType: z.enum([
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
  required: z.boolean(),
  options: z.array(z.string()).optional(),
  validation: z.object({
    pattern: z.string().optional(),
    minLength: z.number().int().positive().optional(),
    maxLength: z.number().int().positive().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    customValidator: z.string().optional(),
  }).optional(),
  defaultValue: z.unknown().optional(),
  helpText: z.string().max(500).optional(),
});

const TaskTemplateSchema = z.object({
  id: UUIDSchema,
  name: z.string().min(1).max(255),
  description: z.string().min(1).max(2000),
  category: TaskCategorySchema,
  interventionIds: z.array(UUIDSchema).optional(),
  frequency: FrequencySchema,
  estimatedDuration: z.number().int().positive().optional(),
  timeOfDay: z.array(TimeOfDaySchema).optional(),
  instructions: z.string().min(1).max(5000),
  steps: z.array(TaskStepSchema).optional(),
  requiresSignature: z.boolean(),
  requiresNote: z.boolean(),
  requiresPhoto: z.boolean().optional(),
  requiresVitals: z.boolean().optional(),
  requiredFields: z.array(CustomFieldSchema).optional(),
  isOptional: z.boolean(),
  allowSkip: z.boolean(),
  skipReasons: z.array(z.string().max(200)).optional(),
  verificationType: VerificationTypeSchema.optional(),
  qualityChecks: z.array(QualityCheckSchema).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']),
  notes: z.string().max(2000).optional(),
  tags: z.array(z.string().max(50)).optional(),
});

const SignatureSchema = z.object({
  signatureData: z.string().min(1),
  signedBy: UUIDSchema,
  signedByName: z.string().min(1).max(200),
  signatureType: z.enum(['ELECTRONIC', 'STYLUS', 'TOUCHSCREEN']),
  ipAddress: z.string().optional(),
  deviceInfo: z.string().max(500).optional(),
});

const GeoLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().positive().optional(),
});

const VitalSignsSchema = z.object({
  bloodPressureSystolic: z.number().int().min(50).max(250).optional(),
  bloodPressureDiastolic: z.number().int().min(30).max(150).optional(),
  heartRate: z.number().int().min(30).max(200).optional(),
  temperature: z.number().min(90).max(110).optional(),
  temperatureUnit: z.enum(['F', 'C']).optional(),
  oxygenSaturation: z.number().int().min(0).max(100).optional(),
  respiratoryRate: z.number().int().min(5).max(60).optional(),
  bloodGlucose: z.number().int().min(20).max(600).optional(),
  weight: z.number().positive().optional(),
  weightUnit: z.enum(['LBS', 'KG']).optional(),
  pain: z.number().int().min(0).max(10).optional(),
  notes: z.string().max(1000).optional(),
});

const VerificationDataSchema = z.object({
  verificationType: VerificationTypeSchema,
  gpsLocation: GeoLocationSchema.optional(),
  photoUrls: z.array(z.string().url()).optional(),
  barcodeData: z.string().optional(),
  vitalSigns: VitalSignsSchema.optional(),
  customData: z.record(z.unknown()).optional(),
});

const QualityCheckResponseSchema = z.object({
  checkId: UUIDSchema,
  question: z.string().min(1).max(500),
  response: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]),
  notes: z.string().max(1000).optional(),
});

// Input validation schemas
export const CreateCarePlanInputSchema = z.object({
  clientId: UUIDSchema,
  organizationId: UUIDSchema,
  branchId: UUIDSchema.optional(),
  name: z.string().min(1).max(255),
  planType: CarePlanTypeSchema,
  effectiveDate: DateSchema,
  expirationDate: DateSchema.optional(),
  goals: z.array(CarePlanGoalSchema.omit({ id: true })),
  interventions: z.array(InterventionSchema.omit({ id: true })),
  taskTemplates: z.array(TaskTemplateSchema.omit({ id: true })).optional(),
  serviceFrequency: ServiceFrequencySchema.optional(),
  coordinatorId: UUIDSchema.optional(),
  notes: z.string().max(5000).optional(),
}).refine(
  (data) => !data.expirationDate || data.expirationDate > data.effectiveDate,
  {
    message: 'Expiration date must be after effective date',
    path: ['expirationDate'],
  }
);

export const UpdateCarePlanInputSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  status: CarePlanStatusSchema.optional(),
  priority: PrioritySchema.optional(),
  expirationDate: DateSchema.optional(),
  reviewDate: DateSchema.optional(),
  goals: z.array(CarePlanGoalSchema).optional(),
  interventions: z.array(InterventionSchema).optional(),
  taskTemplates: z.array(TaskTemplateSchema).optional(),
  serviceFrequency: ServiceFrequencySchema.optional(),
  notes: z.string().max(5000).optional(),
});

export const CreateTaskInstanceInputSchema = z.object({
  carePlanId: UUIDSchema,
  templateId: UUIDSchema.optional(),
  visitId: UUIDSchema.optional(),
  clientId: UUIDSchema,
  assignedCaregiverId: UUIDSchema.optional(),
  name: z.string().min(1).max(255),
  description: z.string().min(1).max(2000),
  category: TaskCategorySchema,
  instructions: z.string().min(1).max(5000),
  scheduledDate: DateSchema,
  scheduledTime: TimeSchema.optional(),
  requiredSignature: z.boolean(),
  requiredNote: z.boolean(),
});

export const CompleteTaskInputSchema = z.object({
  completionNote: z.string().max(2000).optional(),
  signature: SignatureSchema.optional(),
  verificationData: VerificationDataSchema.optional(),
  qualityCheckResponses: z.array(QualityCheckResponseSchema).optional(),
  customFieldValues: z.record(z.unknown()).optional(),
});

export const CreateProgressNoteInputSchema = z.object({
  carePlanId: UUIDSchema,
  clientId: UUIDSchema,
  visitId: UUIDSchema.optional(),
  noteType: z.enum([
    'VISIT_NOTE',
    'WEEKLY_SUMMARY',
    'MONTHLY_SUMMARY',
    'CARE_PLAN_REVIEW',
    'INCIDENT',
    'CHANGE_IN_CONDITION',
    'COMMUNICATION',
    'OTHER',
  ]),
  content: z.string().min(1).max(10000),
  goalProgress: z.array(z.object({
    goalId: UUIDSchema,
    goalName: z.string().max(255),
    status: GoalStatusSchema,
    progressDescription: z.string().max(2000),
    progressPercentage: z.number().min(0).max(100).optional(),
    barriers: z.array(z.string().max(500)).optional(),
    nextSteps: z.array(z.string().max(500)).optional(),
  })).optional(),
  observations: z.array(z.object({
    category: z.enum([
      'PHYSICAL',
      'COGNITIVE',
      'EMOTIONAL',
      'BEHAVIORAL',
      'SOCIAL',
      'ENVIRONMENTAL',
      'SAFETY',
    ]),
    observation: z.string().max(1000),
    severity: z.enum(['NORMAL', 'ATTENTION', 'URGENT']).optional(),
  })).optional(),
  concerns: z.array(z.string().max(500)).optional(),
  recommendations: z.array(z.string().max(500)).optional(),
  signature: SignatureSchema.omit({ signedAt: true }).optional(),
});

export const CarePlanSearchFiltersSchema = z.object({
  query: z.string().max(200).optional(),
  clientId: UUIDSchema.optional(),
  organizationId: UUIDSchema.optional(),
  branchId: UUIDSchema.optional(),
  status: z.array(CarePlanStatusSchema).optional(),
  planType: z.array(CarePlanTypeSchema).optional(),
  coordinatorId: UUIDSchema.optional(),
  expiringWithinDays: z.number().int().positive().optional(),
  needsReview: z.boolean().optional(),
  complianceStatus: z.array(z.enum([
    'COMPLIANT',
    'PENDING_REVIEW',
    'EXPIRED',
    'NON_COMPLIANT',
  ])).optional(),
});

export const TaskInstanceSearchFiltersSchema = z.object({
  carePlanId: UUIDSchema.optional(),
  clientId: UUIDSchema.optional(),
  assignedCaregiverId: UUIDSchema.optional(),
  visitId: UUIDSchema.optional(),
  status: z.array(TaskStatusSchema).optional(),
  category: z.array(TaskCategorySchema).optional(),
  scheduledDateFrom: DateSchema.optional(),
  scheduledDateTo: DateSchema.optional(),
  overdue: z.boolean().optional(),
  requiresSignature: z.boolean().optional(),
});

/**
 * Validation helper functions
 */
export class CarePlanValidator {
  static validateCreateCarePlan(input: unknown) {
    return CreateCarePlanInputSchema.parse(input);
  }

  static validateUpdateCarePlan(input: unknown) {
    return UpdateCarePlanInputSchema.parse(input);
  }

  static validateCreateTaskInstance(input: unknown) {
    return CreateTaskInstanceInputSchema.parse(input);
  }

  static validateCompleteTask(input: unknown) {
    return CompleteTaskInputSchema.parse(input);
  }

  static validateCreateProgressNote(input: unknown) {
    return CreateProgressNoteInputSchema.parse(input);
  }

  static validateCarePlanSearchFilters(input: unknown) {
    return CarePlanSearchFiltersSchema.parse(input);
  }

  static validateTaskInstanceSearchFilters(input: unknown) {
    return TaskInstanceSearchFiltersSchema.parse(input);
  }

  /**
   * Validate that task completion meets requirements
   */
  static validateTaskCompletion(
    task: { requiredSignature: boolean; requiredNote: boolean },
    completion: { signature?: unknown; completionNote?: string }
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

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

  /**
   * Validate vital signs values are within reasonable ranges
   */
  static validateVitalSigns(vitals: unknown): { valid: boolean; warnings: string[] } {
    const parsed = VitalSignsSchema.parse(vitals);
    const warnings: string[] = [];

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
      } else if (tempF < 95) {
        warnings.push('Temperature is critically low');
      }
    }

    return {
      valid: true, // Always valid, just warnings
      warnings,
    };
  }

  /**
   * Validate care plan is ready for activation
   */
  static validateCarePlanActivation(plan: {
    goals: unknown[];
    interventions: unknown[];
    effectiveDate: Date;
    expirationDate?: Date;
    coordinatorId?: string;
  }): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

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

export default CarePlanValidator;
