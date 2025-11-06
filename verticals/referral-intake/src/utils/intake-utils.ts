/**
 * Intake Utilities
 *
 * Helper functions for intake management
 */

import type { Intake, IntakeStage } from '../types/intake.js';

/**
 * Generate a unique intake number
 */
export function generateIntakeNumber(organizationId: string): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  const orgPrefix = organizationId.slice(0, 4).toUpperCase();
  return `INT-${orgPrefix}-${timestamp}-${random}`;
}

/**
 * Calculate days since intake started
 */
export function daysSinceIntakeStarted(intake: Intake): number {
  const now = new Date();
  const started = new Date(intake.intakeDate);
  const diffTime = Math.abs(now.getTime() - started.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calculate intake completion percentage
 */
export function calculateCompletionPercentage(intake: Intake): number {
  const stages: IntakeStage[] = [
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

  const currentIndex = stages.indexOf(intake.currentStage);
  if (currentIndex === -1) return 0;

  return Math.round((currentIndex / (stages.length - 1)) * 100);
}

/**
 * Get next required action for intake
 */
export function getNextRequiredAction(intake: Intake): string {
  if (!intake.allDocumentsCollected) {
    return 'Collect required documents';
  }

  if (!intake.assessmentScheduled) {
    return 'Schedule assessment';
  }

  if (intake.assessmentScheduled && !intake.assessmentCompleted) {
    return 'Complete assessment';
  }

  if (intake.authorizationVerified === false) {
    return 'Verify authorization';
  }

  if (intake.insuranceVerified === false) {
    return 'Verify insurance';
  }

  if (!intake.serviceAgreementSigned) {
    return 'Sign service agreement';
  }

  if (!intake.caregiverAssigned) {
    return 'Assign caregiver';
  }

  if (!intake.clientOrientationCompleted) {
    return 'Complete client orientation';
  }

  if (!intake.homeAssessmentCompleted) {
    return 'Complete home assessment';
  }

  return 'Finalize intake and start service';
}

/**
 * Get stage display name
 */
export function getStageDisplayName(stage: IntakeStage): string {
  const displayNames: Record<IntakeStage, string> = {
    INITIAL_CONTACT: 'Initial Contact',
    DOCUMENT_COLLECTION: 'Document Collection',
    ASSESSMENT: 'Assessment',
    ELIGIBILITY_VERIFICATION: 'Eligibility Verification',
    SERVICE_PLANNING: 'Service Planning',
    AGREEMENT_SIGNING: 'Agreement Signing',
    CAREGIVER_ASSIGNMENT: 'Caregiver Assignment',
    ORIENTATION: 'Orientation',
    SERVICE_INITIATION: 'Service Initiation',
    COMPLETED: 'Completed',
  };

  return displayNames[stage] || stage;
}

/**
 * Estimate completion date based on current progress
 */
export function estimateCompletionDate(intake: Intake): Date {
  const avgDaysPerStage = 2; // Average days to complete each stage
  const completionPercentage = calculateCompletionPercentage(intake);
  const remainingPercentage = 100 - completionPercentage;
  const estimatedDaysRemaining = (remainingPercentage / 100) * (10 * avgDaysPerStage);

  const estimate = new Date();
  estimate.setDate(estimate.getDate() + Math.ceil(estimatedDaysRemaining));

  return estimate;
}

/**
 * Check if intake is at risk of delay
 */
export function isAtRiskOfDelay(intake: Intake): boolean {
  const daysSinceStart = daysSinceIntakeStarted(intake);
  const completionPercentage = calculateCompletionPercentage(intake);

  // If intake has been open for more than 14 days and less than 70% complete
  if (daysSinceStart > 14 && completionPercentage < 70) {
    return true;
  }

  // If intake has been open for more than 21 days and not completed
  if (daysSinceStart > 21 && completionPercentage < 100) {
    return true;
  }

  return false;
}
