/**
 * Referral Utilities
 *
 * Helper functions for referral management
 */

import type { Referral, ReferralStatus } from '../types/referral.js';

/**
 * Generate a unique referral number
 */
export function generateReferralNumber(organizationId: string): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  const orgPrefix = organizationId.slice(0, 4).toUpperCase();
  return `REF-${orgPrefix}-${timestamp}-${random}`;
}

/**
 * Calculate days since referral received
 */
export function daysSinceReferral(referral: Referral): number {
  const now = new Date();
  const received = new Date(referral.receivedDate);
  const diffTime = Math.abs(now.getTime() - received.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Check if referral is overdue for follow-up
 */
export function isOverdueForFollowUp(referral: Referral): boolean {
  if (!referral.nextContactDate) return false;
  return new Date(referral.nextContactDate) < new Date();
}

/**
 * Get priority score for referral (higher = more urgent)
 */
export function calculatePriorityScore(referral: Referral): number {
  let score = 0;

  // Urgency level scoring
  switch (referral.urgencyLevel) {
    case 'EMERGENCY':
      score += 100;
      break;
    case 'URGENT':
      score += 75;
      break;
    case 'PRIORITY':
      score += 50;
      break;
    case 'ROUTINE':
      score += 25;
      break;
    case 'SCHEDULED':
      score += 10;
      break;
  }

  // Age of referral (older = higher priority)
  const days = daysSinceReferral(referral);
  score += Math.min(days * 2, 50); // Cap at 50 points

  // Overdue follow-up
  if (isOverdueForFollowUp(referral)) {
    score += 30;
  }

  return score;
}

/**
 * Determine if referral is ready for intake
 */
export function isReadyForIntake(referral: Referral): boolean {
  return (
    referral.initialScreeningCompleted &&
    referral.eligibilityDetermined &&
    referral.eligibilityStatus === 'ELIGIBLE' &&
    (!referral.authorizationRequired || referral.authorizationReceived)
  );
}

/**
 * Get human-readable status description
 */
export function getStatusDescription(status: ReferralStatus): string {
  const descriptions: Record<ReferralStatus, string> = {
    NEW: 'New referral received',
    ASSIGNED: 'Assigned to staff member',
    IN_SCREENING: 'Initial screening in progress',
    AWAITING_INFO: 'Waiting for additional information',
    IN_ASSESSMENT: 'Full assessment in progress',
    AWAITING_AUTH: 'Waiting for authorization',
    READY_FOR_INTAKE: 'Ready to convert to intake',
    IN_INTAKE: 'Intake process started',
    COMPLETED: 'Successfully converted to client',
    DECLINED: 'Client declined services',
    INELIGIBLE: 'Not eligible for services',
    NO_CAPACITY: 'Unable to service due to capacity',
    CLOSED: 'Closed',
  };

  return descriptions[status] || status;
}
