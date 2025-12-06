/**
 * Client validation logic
 */

import { z } from 'zod';
import { CreateClientInput, UpdateClientInput } from '../types/client';

const phoneSchema = z.object({
  number: z.string().regex(/^\+?[\d\s\-()]+$/, 'Invalid phone number'),
  type: z.enum(['MOBILE', 'HOME', 'WORK']),
  canReceiveSMS: z.boolean(),
});

const addressSchema = z.object({
  type: z.enum(['HOME', 'BILLING', 'TEMPORARY']),
  line1: z.string().min(1, 'Address line 1 required'),
  line2: z.string().optional(),
  city: z.string().min(1, 'City required'),
  state: z.string().length(2, 'State must be 2-letter code'),
  postalCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid postal code'),
  county: z.string().optional(),
  country: z.string().default('US'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  validFrom: z.date().optional(),
  validTo: z.date().optional(),
});

const emergencyContactSchema = z.object({
  name: z.string().min(1, 'Name required'),
  relationship: z.string().min(1, 'Relationship required'),
  phone: phoneSchema,
  alternatePhone: phoneSchema.optional(),
  email: z.string().email().optional(),
  isPrimary: z.boolean(),
  canMakeHealthcareDecisions: z.boolean(),
  notes: z.string().optional(),
});

const createClientSchema = z.object({
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  firstName: z.string().min(1, 'First name required').max(100),
  middleName: z.string().max(100).optional(),
  lastName: z.string().min(1, 'Last name required').max(100),
  preferredName: z.string().max(100).optional(),
  dateOfBirth: z.date().refine(
    (date) => {
      const age = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24 * 365);
      return age >= 0 && age <= 150;
    },
    { message: 'Invalid date of birth' }
  ),
  gender: z.enum(['MALE', 'FEMALE', 'NON_BINARY', 'OTHER', 'PREFER_NOT_TO_SAY']).optional(),
  primaryPhone: phoneSchema.optional(),
  email: z.string().email().optional(),
  primaryAddress: addressSchema,
  emergencyContacts: z.array(emergencyContactSchema).optional(),
  referralSource: z.string().max(200).optional(),
  intakeDate: z.date().optional(),
  status: z
    .enum([
      'INQUIRY',
      'PENDING_INTAKE',
      'ACTIVE',
      'INACTIVE',
      'ON_HOLD',
      'DISCHARGED',
      'DECEASED',
    ])
    .optional(),
});

const updateClientSchema = z
  .object({
    firstName: z.string().min(1).max(100).optional(),
    middleName: z.string().max(100).optional(),
    lastName: z.string().min(1).max(100).optional(),
    preferredName: z.string().max(100).optional(),
    dateOfBirth: z.date().optional(),
    gender: z.enum(['MALE', 'FEMALE', 'NON_BINARY', 'OTHER', 'PREFER_NOT_TO_SAY']).optional(),
    primaryPhone: phoneSchema.optional(),
    alternatePhone: phoneSchema.optional(),
    email: z.string().email().optional(),
    primaryAddress: addressSchema.optional(),
    emergencyContacts: z.array(emergencyContactSchema).optional(),
    status: z
      .enum([
        'INQUIRY',
        'PENDING_INTAKE',
        'ACTIVE',
        'INACTIVE',
        'ON_HOLD',
        'DISCHARGED',
        'DECEASED',
      ])
      .optional(),
    notes: z.string().optional(),
  })
  .partial();

export class ClientValidator {
  validateCreate(input: CreateClientInput): ValidationResult {
    try {
      createClientSchema.parse(input);
      return { success: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          errors: error.issues.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        };
      }
      return {
        success: false,
        errors: [{ path: 'unknown', message: 'Validation failed' }],
      };
    }
  }

  validateUpdate(input: UpdateClientInput): ValidationResult {
    try {
      updateClientSchema.parse(input);
      return { success: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          errors: error.issues.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        };
      }
      return {
        success: false,
        errors: [{ path: 'unknown', message: 'Validation failed' }],
      };
    }
  }

  /**
   * Validate SSN format
   */
  validateSSN(ssn: string): boolean {
    return /^\d{3}-?\d{2}-?\d{4}$/.test(ssn);
  }

  /**
   * Validate email using a ReDoS-safe pattern.
   * Uses atomic groups via possessive quantifiers simulation with length limits.
   */
  validateEmail(email: string): boolean {
    // Length check first to prevent ReDoS on long strings
    if (email.length > 254) return false;
    // Simple, safe email validation without nested quantifiers
    // Split and check parts to avoid backtracking
    const parts = email.split('@');
    if (parts.length !== 2) return false;
    const [local, domain] = parts;
    if (!local || !domain || local.length > 64 || domain.length > 253) return false;
    // Check domain has at least one dot
    if (!domain.includes('.')) return false;
    // Check no leading/trailing dots or spaces
    if (/^\s|\s$|^\.|\.$/.test(local) || /^\s|\s$|^\.|\.$/.test(domain)) return false;
    return true;
  }

  /**
   * Validate age requirement (18+ for most programs)
   */
  validateMinimumAge(dateOfBirth: Date, minimumAge: number = 18): boolean {
    const age = this.calculateAge(dateOfBirth);
    return age >= minimumAge;
  }

  /**
   * Calculate age from date of birth
   */
  calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    let age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())
    ) {
      age--;
    }

    return age;
  }
}

interface ValidationResult {
  success: boolean;
  errors?: Array<{ path: string; message: string }>;
}
