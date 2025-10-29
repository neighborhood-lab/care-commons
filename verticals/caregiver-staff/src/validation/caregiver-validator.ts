/**
 * Caregiver validation using Zod schemas
 */

import { z } from 'zod';
import {
  CreateCaregiverInput,
  UpdateCaregiverInput,
  EmploymentType,
  CaregiverRole,
  CaregiverStatus,
} from '../types/caregiver';

// Base schemas
const PhoneSchema = z.object({
  number: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),
  type: z.enum(['MOBILE', 'HOME', 'WORK']),
  canReceiveSMS: z.boolean(),
  isPrimary: z.boolean().optional(),
});

const AddressSchema = z.object({
  type: z.enum(['HOME', 'MAILING']),
  line1: z.string().min(1, 'Address line 1 is required'),
  line2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().length(2, 'State must be 2 characters'),
  postalCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid postal code'),
  county: z.string().optional(),
  country: z.string().default('US'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

const EmergencyContactSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Name is required'),
  relationship: z.string().min(1, 'Relationship is required'),
  phone: PhoneSchema,
  alternatePhone: PhoneSchema.optional(),
  email: z.string().email().optional(),
  address: AddressSchema.optional(),
  isPrimary: z.boolean(),
  notes: z.string().optional(),
});

const PayRateSchema = z.object({
  id: z.string().uuid(),
  rateType: z.enum([
    'BASE',
    'OVERTIME',
    'WEEKEND',
    'HOLIDAY',
    'LIVE_IN',
    'SPECIALIZED_CARE',
  ]),
  amount: z.number().positive('Amount must be positive'),
  unit: z.enum(['HOURLY', 'VISIT', 'DAILY', 'SALARY']),
  effectiveDate: z.date(),
  endDate: z.date().optional(),
  serviceType: z.string().optional(),
  payLevel: z.number().int().positive().optional(),
  overtimeMultiplier: z.number().positive().optional(),
  weekendMultiplier: z.number().positive().optional(),
  holidayMultiplier: z.number().positive().optional(),
  liveInRate: z.number().positive().optional(),
  notes: z.string().optional(),
});

// Create caregiver schema
const CreateCaregiverSchema = z.object({
  organizationId: z.string().uuid('Invalid organization ID'),
  branchIds: z
    .array(z.string().uuid())
    .min(1, 'At least one branch is required'),
  primaryBranchId: z.string().uuid('Invalid primary branch ID'),
  employeeNumber: z.string().optional(),
  firstName: z.string().min(1, 'First name is required'),
  middleName: z.string().optional(),
  lastName: z.string().min(1, 'Last name is required'),
  preferredName: z.string().optional(),
  dateOfBirth: z.date().refine(
    (date) => {
      const age = new Date().getFullYear() - date.getFullYear();
      return age >= 16 && age <= 100;
    },
    { message: 'Age must be between 16 and 100' }
  ),
  primaryPhone: PhoneSchema,
  email: z.string().email('Invalid email address'),
  primaryAddress: AddressSchema,
  emergencyContacts: z
    .array(EmergencyContactSchema)
    .min(1, 'At least one emergency contact is required'),
  employmentType: z.enum([
    'FULL_TIME',
    'PART_TIME',
    'PER_DIEM',
    'CONTRACT',
    'TEMPORARY',
    'SEASONAL',
  ] as const),
  hireDate: z.date(),
  role: z.enum([
    'CAREGIVER',
    'SENIOR_CAREGIVER',
    'CERTIFIED_NURSING_ASSISTANT',
    'HOME_HEALTH_AIDE',
    'PERSONAL_CARE_AIDE',
    'COMPANION',
    'NURSE_RN',
    'NURSE_LPN',
    'THERAPIST',
    'COORDINATOR',
    'SUPERVISOR',
    'SCHEDULER',
    'ADMINISTRATIVE',
  ] as const),
  payRate: PayRateSchema,
  status: z
    .enum([
      'APPLICATION',
      'INTERVIEWING',
      'PENDING_ONBOARDING',
      'ONBOARDING',
      'ACTIVE',
      'INACTIVE',
      'ON_LEAVE',
      'SUSPENDED',
      'TERMINATED',
      'RETIRED',
    ] as const)
    .optional(),
});

// Update caregiver schema
const UpdateCaregiverSchema = z.object({
  firstName: z.string().min(1, 'First name is required').optional(),
  middleName: z.string().optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  preferredName: z.string().optional(),
  primaryPhone: PhoneSchema.optional(),
  alternatePhone: PhoneSchema.optional(),
  email: z.string().email('Invalid email address').optional(),
  primaryAddress: AddressSchema.optional(),
  branchIds: z.array(z.string().uuid()).optional(),
  emergencyContacts: z.array(EmergencyContactSchema).optional(),
  role: z
    .enum([
      'CAREGIVER',
      'SENIOR_CAREGIVER',
      'CERTIFIED_NURSING_ASSISTANT',
      'HOME_HEALTH_AIDE',
      'PERSONAL_CARE_AIDE',
      'COMPANION',
      'NURSE_RN',
      'NURSE_LPN',
      'THERAPIST',
      'COORDINATOR',
      'SUPERVISOR',
      'SCHEDULER',
      'ADMINISTRATIVE',
    ] as const)
    .optional(),
  supervisorId: z.string().uuid().optional(),
  credentials: z.array(z.any()).optional(), // Simplified for now
  training: z.array(z.any()).optional(),
  skills: z.array(z.any()).optional(),
  availability: z.any().optional(), // Simplified for now
  workPreferences: z.any().optional(),
  payRate: PayRateSchema.optional(),
  status: z
    .enum([
      'APPLICATION',
      'INTERVIEWING',
      'PENDING_ONBOARDING',
      'ONBOARDING',
      'ACTIVE',
      'INACTIVE',
      'ON_LEAVE',
      'SUSPENDED',
      'TERMINATED',
      'RETIRED',
    ] as const)
    .optional(),
  notes: z.string().optional(),
});

export class CaregiverValidator {
  /**
   * Validate create caregiver input
   */
  validateCreate(input: CreateCaregiverInput): ValidationResult {
    try {
      CreateCaregiverSchema.parse(input);
      return { success: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          errors: error.issues.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        };
      }
      return {
        success: false,
        errors: [{ field: 'unknown', message: 'Validation failed' }],
      };
    }
  }

  /**
   * Validate update caregiver input
   */
  validateUpdate(input: UpdateCaregiverInput): ValidationResult {
    try {
      UpdateCaregiverSchema.parse(input);
      return { success: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          errors: error.issues.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        };
      }
      return {
        success: false,
        errors: [{ field: 'unknown', message: 'Validation failed' }],
      };
    }
  }

  /**
   * Validate email format
   */
  validateEmail(email: string): boolean {
    return z.string().email().safeParse(email).success;
  }

  /**
   * Validate phone format
   */
  validatePhone(phone: string): boolean {
    return /^\+?[1-9]\d{1,14}$/.test(phone);
  }

  /**
   * Validate date of birth (age requirements)
   */
  validateDateOfBirth(dateOfBirth: Date): { valid: boolean; message?: string } {
    const age = new Date().getFullYear() - dateOfBirth.getFullYear();
    
    if (age < 16) {
      return { valid: false, message: 'Caregiver must be at least 16 years old' };
    }
    
    if (age > 100) {
      return { valid: false, message: 'Invalid date of birth' };
    }
    
    return { valid: true };
  }

  /**
   * Validate hire date
   */
  validateHireDate(hireDate: Date): { valid: boolean; message?: string } {
    const now = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(now.getFullYear() - 1);
    
    if (hireDate > now) {
      // Allow future hire dates up to 90 days
      const ninetyDaysFromNow = new Date();
      ninetyDaysFromNow.setDate(now.getDate() + 90);
      
      if (hireDate > ninetyDaysFromNow) {
        return { valid: false, message: 'Hire date cannot be more than 90 days in the future' };
      }
    }
    
    return { valid: true };
  }
}

interface ValidationResult {
  success: boolean;
  errors?: Array<{ field: string; message: string }>;
}
