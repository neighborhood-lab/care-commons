/**
 * Family Member Validator
 *
 * Validates family member input data using Zod schemas
 */

import { z } from 'zod';
import {
  CreateFamilyMemberInput,
  UpdateFamilyMemberInput,
} from '../types/family-member.js';

const phoneInfoSchema = z.object({
  number: z.string().min(10).max(20),
  type: z.enum(['MOBILE', 'HOME', 'WORK', 'OTHER']),
  extension: z.string().optional(),
  preferredTime: z
    .enum(['MORNING', 'AFTERNOON', 'EVENING', 'ANYTIME'])
    .optional(),
  canText: z.boolean().optional(),
});

const addressSchema = z.object({
  street1: z.string().min(1).max(255),
  street2: z.string().max(255).optional(),
  city: z.string().min(1).max(100),
  state: z.string().length(2),
  zipCode: z.string().min(5).max(10),
  country: z.string().max(50).optional(),
  county: z.string().max(100).optional(),
});

const createFamilyMemberSchema = z.object({
  organizationId: z.string().uuid(),
  firstName: z.string().min(1).max(100),
  middleName: z.string().max(100).optional(),
  lastName: z.string().min(1).max(100),
  preferredName: z.string().max(100).optional(),
  suffix: z.string().max(20).optional(),
  email: z.string().email().max(255),
  primaryPhone: phoneInfoSchema.optional(),
  alternatePhone: phoneInfoSchema.optional(),
  preferredContactMethod: z
    .enum(['EMAIL', 'SMS', 'PHONE', 'APP'])
    .optional(),
  address: addressSchema.optional(),
  requiresTwoFactor: z.boolean().optional(),
});

const updateFamilyMemberSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  middleName: z.string().max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  preferredName: z.string().max(100).optional(),
  suffix: z.string().max(20).optional(),
  email: z.string().email().max(255).optional(),
  primaryPhone: phoneInfoSchema.optional(),
  alternatePhone: phoneInfoSchema.optional(),
  preferredContactMethod: z
    .enum(['EMAIL', 'SMS', 'PHONE', 'APP'])
    .optional(),
  address: addressSchema.optional(),
  requiresTwoFactor: z.boolean().optional(),
  accountActive: z.boolean().optional(),
  accountStatus: z
    .enum(['PENDING_ACTIVATION', 'ACTIVE', 'SUSPENDED', 'DEACTIVATED'])
    .optional(),
});

export class FamilyMemberValidator {
  validateCreate(input: CreateFamilyMemberInput) {
    try {
      createFamilyMemberSchema.parse(input);
      return { success: true, errors: [] };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          errors: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        };
      }
      throw error;
    }
  }

  validateUpdate(input: UpdateFamilyMemberInput) {
    try {
      updateFamilyMemberSchema.parse(input);
      return { success: true, errors: [] };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          errors: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        };
      }
      throw error;
    }
  }

  validateEmail(email: string): boolean {
    return z.string().email().safeParse(email).success;
  }

  validatePhone(phone: string): boolean {
    const phoneRegex = /^\+?1?\d{10,14}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  }
}
