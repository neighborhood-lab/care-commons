/**
 * Intake Validator
 *
 * Validation logic for intake data
 */

import { z } from 'zod';

export const IntakeStatusSchema = z.enum([
  'SCHEDULED',
  'IN_PROGRESS',
  'PENDING_DOCS',
  'PENDING_ASSESSMENT',
  'PENDING_AUTH',
  'PENDING_AGREEMENT',
  'PENDING_ASSIGNMENT',
  'READY_TO_START',
  'COMPLETED',
  'CANCELLED',
  'ON_HOLD',
]);

export const IntakeStageSchema = z.enum([
  'INITIAL_CONTACT',
  'DOCUMENT_COLLECTION',
  'ASSESSMENT',
  'ELIGIBILITY_VERIFICATION',
  'SERVICE_PLANNING',
  'AGREEMENT_SIGNING',
  'CAREGIVER_ASSIGNMENT',
  'ORIENTATION',
  'SERVICE_INITIATION',
  'COMPLETED',
]);

export const CreateIntakeSchema = z.object({
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  referralId: z.string().uuid().optional(),
  intakeCoordinatorId: z.string().uuid(),
  prospectiveClientName: z.string().min(1),
  prospectiveClientDob: z.date().optional(),
  requestedServices: z.array(z.string()).min(1),
  scheduledDate: z.date().optional(),
});

export const UpdateIntakeSchema = z.object({
  status: IntakeStatusSchema.optional(),
  currentStage: IntakeStageSchema.optional(),
  assessorId: z.string().uuid().optional(),
  assessmentCompleted: z.boolean().optional(),
  documentsReceived: z.array(z.any()).optional(),
  serviceAgreementSigned: z.boolean().optional(),
  primaryCaregiverId: z.string().uuid().optional(),
  intakeNotes: z.string().optional(),
});

export class IntakeValidator {
  static validateCreate(data: unknown) {
    return CreateIntakeSchema.parse(data);
  }

  static validateUpdate(data: unknown) {
    return UpdateIntakeSchema.parse(data);
  }

  static validateStageProgression(
    currentStage: string,
    nextStage: string
  ): { valid: boolean; reason?: string } {
    // Define the order of stages
    const stageOrder = [
      'INITIAL_CONTACT',
      'DOCUMENT_COLLECTION',
      'ASSESSMENT',
      'ELIGIBILITY_VERIFICATION',
      'SERVICE_PLANNING',
      'AGREEMENT_SIGNING',
      'CAREGIVER_ASSIGNMENT',
      'ORIENTATION',
      'SERVICE_INITIATION',
      'COMPLETED',
    ];

    const currentIndex = stageOrder.indexOf(currentStage);
    const nextIndex = stageOrder.indexOf(nextStage);

    if (currentIndex === -1 || nextIndex === -1) {
      return { valid: false, reason: 'Invalid stage' };
    }

    // Allow progression to next stage or any previous stage (for corrections)
    if (nextIndex === currentIndex + 1 || nextIndex < currentIndex) {
      return { valid: true };
    }

    return {
      valid: false,
      reason: `Cannot skip from ${currentStage} to ${nextStage}`,
    };
  }

  static validateReadyForCompletion(intake: any): { ready: boolean; missing?: string[] } {
    const missing: string[] = [];

    if (!intake.allDocumentsCollected) {
      missing.push('All required documents');
    }

    if (!intake.assessmentCompleted) {
      missing.push('Assessment completion');
    }

    if (intake.authorizationRequired && !intake.authorizationVerified) {
      missing.push('Authorization verification');
    }

    if (!intake.serviceAgreementSigned) {
      missing.push('Service agreement signature');
    }

    if (!intake.caregiverAssigned) {
      missing.push('Caregiver assignment');
    }

    if (!intake.clientOrientationCompleted) {
      missing.push('Client orientation');
    }

    return {
      ready: missing.length === 0,
      missing: missing.length > 0 ? missing : undefined,
    };
  }
}
