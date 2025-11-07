import { z } from 'zod';

/**
 * Care Plan Form Schema
 */
export const carePlanSchema = z.object({
  clientId: z.string().uuid({ message: 'Valid client required' }),
  organizationId: z.string().uuid({ message: 'Valid organization required' }),
  branchId: z.string().uuid().optional(),
  name: z.string().min(3, 'Plan name must be at least 3 characters'),
  planType: z.enum([
    'PERSONAL_CARE',
    'COMPANION',
    'SKILLED_NURSING',
    'THERAPY',
    'HOSPICE',
    'RESPITE',
    'LIVE_IN',
    'CUSTOM',
  ]),
  effectiveDate: z.string().datetime({ message: 'Valid effective date required' }),
  expirationDate: z.string().datetime().optional(),
  reviewDate: z.string().datetime().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  assessmentSummary: z.string().optional(),
  notes: z.string().optional(),
  estimatedHoursPerWeek: z.number().min(0).optional(),
  coordinatorId: z.string().uuid().optional(),
});

export type CarePlanFormData = z.infer<typeof carePlanSchema>;

/**
 * Care Plan Goal Schema
 */
export const carePlanGoalSchema = z.object({
  name: z.string().min(3, 'Goal name must be at least 3 characters'),
  description: z.string().min(10, 'Goal description must be at least 10 characters'),
  category: z.enum([
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
  ]),
  targetDate: z.string().datetime().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  measurementType: z.enum(['QUANTITATIVE', 'QUALITATIVE', 'BINARY']).optional(),
  targetValue: z.number().optional(),
  unit: z.string().optional(),
});

export type CarePlanGoalFormData = z.infer<typeof carePlanGoalSchema>;

/**
 * Intervention Schema
 */
export const interventionSchema = z.object({
  name: z.string().min(3, 'Intervention name must be at least 3 characters'),
  description: z.string().min(10, 'Intervention description must be at least 10 characters'),
  category: z.enum([
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
  ]),
  instructions: z.string().min(10, 'Instructions must be at least 10 characters'),
  frequency: z.object({
    pattern: z.enum(['DAILY', 'WEEKLY', 'BI_WEEKLY', 'MONTHLY', 'AS_NEEDED', 'CUSTOM']),
    timesPerDay: z.number().min(1).optional(),
    timesPerWeek: z.number().min(1).optional(),
    specificDays: z.array(z.enum([
      'MONDAY',
      'TUESDAY',
      'WEDNESDAY',
      'THURSDAY',
      'FRIDAY',
      'SATURDAY',
      'SUNDAY',
    ])).optional(),
  }),
  duration: z.number().min(1).optional(),
  requiresSupervision: z.boolean().default(false),
  precautions: z.array(z.string()).optional(),
});

export type InterventionFormData = z.infer<typeof interventionSchema>;

/**
 * Task Template Schema
 */
export const taskTemplateSchema = z.object({
  name: z.string().min(3, 'Task name must be at least 3 characters'),
  description: z.string().min(5, 'Task description must be at least 5 characters'),
  category: z.enum([
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
  ]),
  frequency: z.object({
    pattern: z.enum(['DAILY', 'WEEKLY', 'BI_WEEKLY', 'MONTHLY', 'AS_NEEDED', 'CUSTOM']),
    timesPerDay: z.number().min(1).optional(),
    timesPerWeek: z.number().min(1).optional(),
  }),
  estimatedDuration: z.number().min(1).max(480, 'Duration must be less than 480 minutes').optional(),
  instructions: z.string().min(10, 'Instructions must be at least 10 characters'),
  requiresSignature: z.boolean().default(false),
  requiresNote: z.boolean().default(false),
  requiresPhoto: z.boolean().default(false),
  isOptional: z.boolean().default(false),
  allowSkip: z.boolean().default(false),
});

export type TaskTemplateFormData = z.infer<typeof taskTemplateSchema>;

/**
 * Task Instance Schema
 */
export const taskInstanceSchema = z.object({
  carePlanId: z.string().uuid({ message: 'Valid care plan required' }),
  clientId: z.string().uuid({ message: 'Valid client required' }),
  name: z.string().min(3, 'Task name must be at least 3 characters'),
  description: z.string().min(5, 'Task description must be at least 5 characters'),
  category: z.enum([
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
  ]),
  instructions: z.string().min(10, 'Instructions must be at least 10 characters'),
  scheduledDate: z.string().datetime({ message: 'Valid scheduled date required' }),
  scheduledTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format').optional(),
  estimatedDuration: z.number().min(1).max(480).optional(),
  assignedCaregiverId: z.string().uuid().optional(),
  visitId: z.string().uuid().optional(),
  requiredSignature: z.boolean().default(false),
  requiredNote: z.boolean().default(false),
});

export type TaskInstanceFormData = z.infer<typeof taskInstanceSchema>;

/**
 * Task Completion Schema
 */
export const taskCompletionSchema = z.object({
  completionNote: z.string().min(10, 'Please add completion notes (at least 10 characters)'),
  signature: z.object({
    signatureData: z.string().min(1, 'Signature required'),
    signedByName: z.string().min(1, 'Signer name required'),
  }).optional(),
  customFieldValues: z.record(z.string(), z.unknown()).optional(),
});

export type TaskCompletionFormData = z.infer<typeof taskCompletionSchema>;

/**
 * Progress Note Schema
 */
export const progressNoteSchema = z.object({
  carePlanId: z.string().uuid({ message: 'Valid care plan required' }),
  clientId: z.string().uuid({ message: 'Valid client required' }),
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
  content: z.string().min(20, 'Note content must be at least 20 characters'),
  goalProgress: z.array(z.object({
    goalId: z.string().uuid(),
    goalName: z.string(),
    progressDescription: z.string().min(10),
    barriers: z.array(z.string()).optional(),
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
    observation: z.string().min(5),
    severity: z.enum(['NORMAL', 'ATTENTION', 'URGENT']).optional(),
  })).optional(),
  concerns: z.array(z.string()).optional(),
  recommendations: z.array(z.string()).optional(),
});

export type ProgressNoteFormData = z.infer<typeof progressNoteSchema>;

/**
 * Bulk Task Creation Schema
 */
export const bulkTaskCreationSchema = z.object({
  carePlanId: z.string().uuid({ message: 'Valid care plan required' }),
  visitId: z.string().uuid().optional(),
  scheduledDate: z.string().datetime({ message: 'Valid scheduled date required' }),
  assignedCaregiverId: z.string().uuid().optional(),
  templateIds: z.array(z.string().uuid()).min(1, 'Select at least one template'),
});

export type BulkTaskCreationFormData = z.infer<typeof bulkTaskCreationSchema>;
