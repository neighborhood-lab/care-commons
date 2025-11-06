/**
 * HR & Onboarding Validation Schemas
 *
 * Zod schemas for validating onboarding inputs
 */

import { z } from 'zod';
import {
  OnboardingStage,
  DocumentType,
  DocumentStatus,
  BackgroundCheckType,
  BackgroundCheckStatus,
  TrainingType,
  TrainingStatus
} from '../types/onboarding.js';

// ==================== Enums ====================

const onboardingStageSchema = z.nativeEnum(OnboardingStage);
const documentTypeSchema = z.nativeEnum(DocumentType);
const documentStatusSchema = z.nativeEnum(DocumentStatus);
const backgroundCheckTypeSchema = z.nativeEnum(BackgroundCheckType);
const backgroundCheckStatusSchema = z.nativeEnum(BackgroundCheckStatus);
const trainingTypeSchema = z.nativeEnum(TrainingType);
const trainingStatusSchema = z.nativeEnum(TrainingStatus);

// ==================== Base Schemas ====================

const uuidSchema = z.string().uuid();
const dateSchema = z.coerce.date();
const urlSchema = z.string().url();

// ==================== Create Schemas ====================

export const createOnboardingRecordSchema = z.object({
  employeeId: uuidSchema,
  caregiverId: uuidSchema.optional(),
  position: z.string().min(1).max(200),
  department: z.string().max(200).optional(),
  startDate: dateSchema,
  targetCompletionDate: dateSchema.optional(),
  hiringManager: uuidSchema.optional(),
  hrContact: uuidSchema.optional(),
  buddy: uuidSchema.optional(),
  templateId: uuidSchema.optional(),
  notes: z.string().max(5000).optional(),
  metadata: z.record(z.unknown()).optional()
}).refine(
  (data) => {
    if (data.targetCompletionDate) {
      return data.targetCompletionDate >= data.startDate;
    }
    return true;
  },
  {
    message: 'Target completion date must be after start date',
    path: ['targetCompletionDate']
  }
);

export const updateOnboardingRecordSchema = z.object({
  stage: onboardingStageSchema.optional(),
  targetCompletionDate: dateSchema.optional(),
  actualCompletionDate: dateSchema.optional(),
  hiringManager: uuidSchema.optional(),
  hrContact: uuidSchema.optional(),
  buddy: uuidSchema.optional(),
  notes: z.string().max(5000).optional(),
  metadata: z.record(z.unknown()).optional()
});

export const createDocumentSchema = z.object({
  onboardingId: uuidSchema,
  employeeId: uuidSchema,
  documentType: documentTypeSchema,
  fileName: z.string().min(1).max(500),
  fileUrl: urlSchema,
  mimeType: z.string().min(1).max(200),
  fileSize: z.number().int().positive().max(100 * 1024 * 1024), // Max 100MB
  expiresAt: dateSchema.optional(),
  notes: z.string().max(2000).optional(),
  metadata: z.record(z.unknown()).optional()
});

export const updateDocumentStatusSchema = z.object({
  status: documentStatusSchema,
  verifiedBy: uuidSchema.optional(),
  rejectionReason: z.string().max(1000).optional()
}).refine(
  (data) => {
    if (data.status === 'verified' && !data.verifiedBy) {
      return false;
    }
    if (data.status === 'rejected' && !data.rejectionReason) {
      return false;
    }
    return true;
  },
  {
    message: 'Verified status requires verifiedBy, rejected status requires rejectionReason'
  }
);

export const createBackgroundCheckSchema = z.object({
  onboardingId: uuidSchema,
  employeeId: uuidSchema,
  checkType: backgroundCheckTypeSchema,
  provider: z.string().max(200).optional(),
  referenceNumber: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
  metadata: z.record(z.unknown()).optional()
});

export const updateBackgroundCheckStatusSchema = z.object({
  status: backgroundCheckStatusSchema,
  result: z.enum(['clear', 'flagged', 'failed']).optional(),
  findings: z.string().max(5000).optional()
}).refine(
  (data) => {
    if ((data.status === 'completed' || data.status === 'cleared') && !data.result) {
      return false;
    }
    return true;
  },
  {
    message: 'Completed or cleared status requires result'
  }
);

export const createTrainingSchema = z.object({
  onboardingId: uuidSchema,
  employeeId: uuidSchema,
  trainingType: trainingTypeSchema,
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  provider: z.string().max(200).optional(),
  required: z.boolean(),
  scheduledAt: dateSchema.optional(),
  durationMinutes: z.number().int().positive().max(10080).optional(), // Max 1 week
  passingScore: z.number().min(0).max(100).optional(),
  location: z.string().max(500).optional(),
  instructorId: uuidSchema.optional(),
  notes: z.string().max(2000).optional(),
  metadata: z.record(z.unknown()).optional()
});

export const updateTrainingStatusSchema = z.object({
  status: trainingStatusSchema,
  score: z.number().min(0).max(100).optional(),
  certificateUrl: urlSchema.optional()
}).refine(
  (data) => {
    if (data.status === 'passed' && data.score !== undefined && data.score < 70) {
      return false;
    }
    return true;
  },
  {
    message: 'Passed status typically requires score >= 70'
  }
);

export const createTaskSchema = z.object({
  onboardingId: uuidSchema,
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  category: z.enum(['document', 'training', 'background', 'equipment', 'access', 'orientation', 'other']),
  assignedTo: uuidSchema.optional(),
  dueDate: dateSchema.optional(),
  order: z.number().int().nonnegative(),
  required: z.boolean(),
  dependsOn: z.array(uuidSchema).optional(),
  notes: z.string().max(2000).optional(),
  metadata: z.record(z.unknown()).optional()
});

export const updateTaskStatusSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'completed', 'skipped']),
  completedBy: uuidSchema.optional()
}).refine(
  (data) => {
    if (data.status === 'completed' && !data.completedBy) {
      return false;
    }
    return true;
  },
  {
    message: 'Completed status requires completedBy'
  }
);

// ==================== Query Schemas ====================

export const listOnboardingRecordsSchema = z.object({
  stage: onboardingStageSchema.optional(),
  position: z.string().optional(),
  department: z.string().optional(),
  hiringManager: uuidSchema.optional(),
  isOnTrack: z.boolean().optional(),
  hasBlockers: z.boolean().optional()
});

// ==================== Helper Types ====================

export type CreateOnboardingRecordInput = z.infer<typeof createOnboardingRecordSchema>;
export type UpdateOnboardingRecordInput = z.infer<typeof updateOnboardingRecordSchema>;
export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentStatusInput = z.infer<typeof updateDocumentStatusSchema>;
export type CreateBackgroundCheckInput = z.infer<typeof createBackgroundCheckSchema>;
export type UpdateBackgroundCheckStatusInput = z.infer<typeof updateBackgroundCheckStatusSchema>;
export type CreateTrainingInput = z.infer<typeof createTrainingSchema>;
export type UpdateTrainingStatusInput = z.infer<typeof updateTrainingStatusSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskStatusInput = z.infer<typeof updateTaskStatusSchema>;
export type ListOnboardingRecordsQuery = z.infer<typeof listOnboardingRecordsSchema>;

/**
 * Onboarding Validator class
 */
export class OnboardingValidator {
  /**
   * Validate create onboarding record input
   */
  static validateCreateOnboardingRecord(data: unknown): CreateOnboardingRecordInput {
    return createOnboardingRecordSchema.parse(data);
  }

  /**
   * Validate update onboarding record input
   */
  static validateUpdateOnboardingRecord(data: unknown): UpdateOnboardingRecordInput {
    return updateOnboardingRecordSchema.parse(data);
  }

  /**
   * Validate create document input
   */
  static validateCreateDocument(data: unknown): CreateDocumentInput {
    return createDocumentSchema.parse(data);
  }

  /**
   * Validate update document status input
   */
  static validateUpdateDocumentStatus(data: unknown): UpdateDocumentStatusInput {
    return updateDocumentStatusSchema.parse(data);
  }

  /**
   * Validate create background check input
   */
  static validateCreateBackgroundCheck(data: unknown): CreateBackgroundCheckInput {
    return createBackgroundCheckSchema.parse(data);
  }

  /**
   * Validate update background check status input
   */
  static validateUpdateBackgroundCheckStatus(data: unknown): UpdateBackgroundCheckStatusInput {
    return updateBackgroundCheckStatusSchema.parse(data);
  }

  /**
   * Validate create training input
   */
  static validateCreateTraining(data: unknown): CreateTrainingInput {
    return createTrainingSchema.parse(data);
  }

  /**
   * Validate update training status input
   */
  static validateUpdateTrainingStatus(data: unknown): UpdateTrainingStatusInput {
    return updateTrainingStatusSchema.parse(data);
  }

  /**
   * Validate create task input
   */
  static validateCreateTask(data: unknown): CreateTaskInput {
    return createTaskSchema.parse(data);
  }

  /**
   * Validate update task status input
   */
  static validateUpdateTaskStatus(data: unknown): UpdateTaskStatusInput {
    return updateTaskStatusSchema.parse(data);
  }

  /**
   * Validate list onboarding records query
   */
  static validateListOnboardingRecords(data: unknown): ListOnboardingRecordsQuery {
    return listOnboardingRecordsSchema.parse(data);
  }
}
