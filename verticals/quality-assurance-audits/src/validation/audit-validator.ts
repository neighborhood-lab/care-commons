/**
 * Audit Validation - Zod schemas for runtime validation
 *
 * Validates:
 * - Audit creation and updates
 * - Finding creation
 * - Corrective action creation
 * - Business rules (dates, scores, etc.)
 */

import { z } from 'zod';

/**
 * Audit Type enum schema
 */
export const auditTypeSchema = z.enum([
  'COMPLIANCE',
  'QUALITY',
  'SAFETY',
  'DOCUMENTATION',
  'FINANCIAL',
  'MEDICATION',
  'INFECTION_CONTROL',
  'TRAINING',
  'INTERNAL',
  'EXTERNAL',
]);

/**
 * Audit Status enum schema
 */
export const auditStatusSchema = z.enum([
  'DRAFT',
  'SCHEDULED',
  'IN_PROGRESS',
  'FINDINGS_REVIEW',
  'CORRECTIVE_ACTIONS',
  'COMPLETED',
  'APPROVED',
  'ARCHIVED',
]);

/**
 * Audit Scope enum schema
 */
export const auditScopeSchema = z.enum([
  'ORGANIZATION',
  'BRANCH',
  'DEPARTMENT',
  'CAREGIVER',
  'CLIENT',
  'PROCESS',
]);

/**
 * Audit Priority enum schema
 */
export const auditPrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);

/**
 * Finding Severity enum schema
 */
export const findingSeveritySchema = z.enum(['CRITICAL', 'MAJOR', 'MINOR', 'OBSERVATION']);

/**
 * Finding Status enum schema
 */
export const findingStatusSchema = z.enum([
  'OPEN',
  'IN_PROGRESS',
  'RESOLVED',
  'VERIFIED',
  'CLOSED',
  'DEFERRED',
]);

/**
 * Finding Category enum schema
 */
export const findingCategorySchema = z.enum([
  'DOCUMENTATION',
  'TRAINING',
  'POLICY_PROCEDURE',
  'SAFETY',
  'QUALITY_OF_CARE',
  'INFECTION_CONTROL',
  'MEDICATION',
  'EQUIPMENT',
  'STAFFING',
  'COMMUNICATION',
  'FINANCIAL',
  'REGULATORY',
  'OTHER',
]);

/**
 * Corrective Action Type enum schema
 */
export const correctiveActionTypeSchema = z.enum([
  'IMMEDIATE',
  'SHORT_TERM',
  'LONG_TERM',
  'PREVENTIVE',
]);

/**
 * Corrective Action Status enum schema
 */
export const correctiveActionStatusSchema = z.enum([
  'PLANNED',
  'IN_PROGRESS',
  'IMPLEMENTED',
  'VERIFIED',
  'CLOSED',
  'INEFFECTIVE',
  'CANCELLED',
]);

/**
 * Overall Rating enum schema
 */
export const overallRatingSchema = z.enum([
  'EXCELLENT',
  'GOOD',
  'SATISFACTORY',
  'NEEDS_IMPROVEMENT',
  'UNSATISFACTORY',
]);

/**
 * Affected Entity enum schema
 */
export const affectedEntitySchema = z.enum([
  'CAREGIVER',
  'CLIENT',
  'PROCESS',
  'DOCUMENTATION',
  'EQUIPMENT',
]);

/**
 * Create Audit Input Schema
 */
export const createAuditSchema = z
  .object({
    title: z.string().min(1).max(200),
    description: z.string().min(1).max(2000),
    auditType: auditTypeSchema,
    priority: auditPrioritySchema,
    scope: auditScopeSchema,
    scopeEntityId: z.string().uuid().optional(),
    scopeEntityName: z.string().max(200).optional(),
    scheduledStartDate: z.string().datetime(),
    scheduledEndDate: z.string().datetime(),
    leadAuditorId: z.string().uuid(),
    auditorIds: z.array(z.string().uuid()).optional(),
    standardsReference: z.string().max(500).optional(),
    auditCriteria: z.array(z.string()).optional(),
    templateId: z.string().uuid().optional(),
  })
  .refine(
    (data) => {
      // Validate scheduledEndDate is after scheduledStartDate
      return new Date(data.scheduledEndDate) > new Date(data.scheduledStartDate);
    },
    {
      message: 'Scheduled end date must be after scheduled start date',
      path: ['scheduledEndDate'],
    }
  );

/**
 * Update Audit Input Schema
 */
export const updateAuditSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().min(1).max(2000).optional(),
    status: auditStatusSchema.optional(),
    priority: auditPrioritySchema.optional(),
    scheduledStartDate: z.string().datetime().optional(),
    scheduledEndDate: z.string().datetime().optional(),
    actualStartDate: z.string().datetime().optional(),
    actualEndDate: z.string().datetime().optional(),
    executiveSummary: z.string().max(5000).optional(),
    recommendations: z.string().max(5000).optional(),
    complianceScore: z.number().min(0).max(100).optional(),
    overallRating: overallRatingSchema.optional(),
  })
  .refine(
    (data) => {
      // If both dates provided, validate scheduledEndDate is after scheduledStartDate
      if (data.scheduledStartDate && data.scheduledEndDate) {
        return new Date(data.scheduledEndDate) > new Date(data.scheduledStartDate);
      }
      return true;
    },
    {
      message: 'Scheduled end date must be after scheduled start date',
      path: ['scheduledEndDate'],
    }
  )
  .refine(
    (data) => {
      // If both dates provided, validate actualEndDate is after actualStartDate
      if (data.actualStartDate && data.actualEndDate) {
        return new Date(data.actualEndDate) > new Date(data.actualStartDate);
      }
      return true;
    },
    {
      message: 'Actual end date must be after actual start date',
      path: ['actualEndDate'],
    }
  );

/**
 * Create Audit Finding Input Schema
 */
export const createAuditFindingSchema = z.object({
  auditId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  category: findingCategorySchema,
  severity: findingSeveritySchema,
  standardReference: z.string().max(500).optional(),
  regulatoryRequirement: z.string().max(1000).optional(),
  evidenceDescription: z.string().max(2000).optional(),
  evidenceUrls: z.array(z.string().url()).optional(),
  locationDescription: z.string().max(500).optional(),
  affectedEntity: affectedEntitySchema.optional(),
  affectedEntityId: z.string().uuid().optional(),
  affectedEntityName: z.string().max(200).optional(),
  potentialImpact: z.string().max(1000).optional(),
  requiredCorrectiveAction: z.string().min(1).max(2000),
  recommendedTimeframe: z.string().max(200).optional(),
  targetResolutionDate: z.string().datetime().optional(),
});

/**
 * Create Corrective Action Input Schema
 */
export const createCorrectiveActionSchema = z
  .object({
    findingId: z.string().uuid(),
    auditId: z.string().uuid(),
    title: z.string().min(1).max(200),
    description: z.string().min(1).max(2000),
    actionType: correctiveActionTypeSchema,
    rootCause: z.string().max(1000).optional(),
    contributingFactors: z.array(z.string()).optional(),
    specificActions: z.array(z.string()).min(1),
    responsiblePersonId: z.string().uuid(),
    targetCompletionDate: z.string().datetime(),
    resourcesRequired: z.string().max(1000).optional(),
    estimatedCost: z.number().min(0).optional(),
    monitoringPlan: z.string().max(2000).optional(),
    successCriteria: z.array(z.string()).optional(),
    verificationMethod: z.string().max(500).optional(),
  })
  .refine(
    (data) => {
      // Validate targetCompletionDate is not in the past
      return new Date(data.targetCompletionDate) >= new Date();
    },
    {
      message: 'Target completion date cannot be in the past',
      path: ['targetCompletionDate'],
    }
  );

/**
 * Update Corrective Action Progress Input Schema
 */
export const updateCorrectiveActionProgressSchema = z.object({
  progressNote: z.string().min(1).max(2000),
  completionPercentage: z.number().min(0).max(100),
  issuesEncountered: z.string().max(1000).optional(),
  nextSteps: z.string().max(1000).optional(),
});

/**
 * Export type inferences
 */
export type CreateAuditInput = z.infer<typeof createAuditSchema>;
export type UpdateAuditInput = z.infer<typeof updateAuditSchema>;
export type CreateAuditFindingInput = z.infer<typeof createAuditFindingSchema>;
export type CreateCorrectiveActionInput = z.infer<typeof createCorrectiveActionSchema>;
export type UpdateCorrectiveActionProgressInput = z.infer<
  typeof updateCorrectiveActionProgressSchema
>;
