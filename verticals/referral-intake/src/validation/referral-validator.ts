/**
 * Referral Validator
 *
 * Validation logic for referral data
 */

import { z } from 'zod';

export const ReferralSourceSchema = z.enum([
  'HOSPITAL_DISCHARGE',
  'PHYSICIAN',
  'CASE_MANAGER',
  'MANAGED_CARE_ORG',
  'MEDICAID_WAIVER',
  'MEDICARE_ADVANTAGE',
  'FAMILY_MEMBER',
  'SELF_REFERRAL',
  'COMMUNITY_PARTNER',
  'EXISTING_CLIENT',
  'WEBSITE',
  'SOCIAL_MEDIA',
  'OTHER',
]);

export const ReferralStatusSchema = z.enum([
  'NEW',
  'ASSIGNED',
  'IN_SCREENING',
  'AWAITING_INFO',
  'IN_ASSESSMENT',
  'AWAITING_AUTH',
  'READY_FOR_INTAKE',
  'IN_INTAKE',
  'COMPLETED',
  'DECLINED',
  'INELIGIBLE',
  'NO_CAPACITY',
  'CLOSED',
]);

export const CreateReferralSchema = z.object({
  organizationId: z.string().uuid(),
  branchId: z.string().uuid().optional(),
  referralSource: ReferralSourceSchema,
  prospectiveClientName: z.string().min(1),
  prospectiveClientDob: z.date().optional(),
  prospectiveClientPhone: z.string().optional(),
  prospectiveClientEmail: z.string().email().optional(),
  referralType: z.string(),
  serviceType: z.array(z.string()).min(1),
  urgencyLevel: z.enum(['EMERGENCY', 'URGENT', 'PRIORITY', 'ROUTINE', 'SCHEDULED']),
  referralNotes: z.string().optional(),
});

export const UpdateReferralSchema = z.object({
  status: ReferralStatusSchema.optional(),
  assignedTo: z.string().uuid().optional(),
  eligibilityStatus: z.string().optional(),
  authorizationReceived: z.boolean().optional(),
  referralNotes: z.string().optional(),
  internalNotes: z.string().optional(),
});

export class ReferralValidator {
  static validateCreate(data: unknown) {
    return CreateReferralSchema.parse(data);
  }

  static validateUpdate(data: unknown) {
    return UpdateReferralSchema.parse(data);
  }

  static validateStatusTransition(
    currentStatus: string,
    newStatus: string
  ): { valid: boolean; reason?: string } {
    // Define valid status transitions
    const validTransitions: Record<string, string[]> = {
      NEW: ['ASSIGNED', 'IN_SCREENING', 'CLOSED'],
      ASSIGNED: ['IN_SCREENING', 'AWAITING_INFO', 'CLOSED'],
      IN_SCREENING: ['AWAITING_INFO', 'IN_ASSESSMENT', 'AWAITING_AUTH', 'INELIGIBLE', 'CLOSED'],
      AWAITING_INFO: ['IN_SCREENING', 'IN_ASSESSMENT', 'CLOSED'],
      IN_ASSESSMENT: ['AWAITING_AUTH', 'READY_FOR_INTAKE', 'INELIGIBLE', 'NO_CAPACITY', 'CLOSED'],
      AWAITING_AUTH: ['READY_FOR_INTAKE', 'IN_ASSESSMENT', 'CLOSED'],
      READY_FOR_INTAKE: ['IN_INTAKE', 'CLOSED'],
      IN_INTAKE: ['COMPLETED', 'CLOSED'],
      COMPLETED: [],
      DECLINED: [],
      INELIGIBLE: [],
      NO_CAPACITY: [],
      CLOSED: [],
    };

    const allowed = validTransitions[currentStatus] || [];
    if (allowed.includes(newStatus)) {
      return { valid: true };
    }

    return {
      valid: false,
      reason: `Cannot transition from ${currentStatus} to ${newStatus}`,
    };
  }
}
