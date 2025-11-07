/**
 * Common validation schemas using Zod
 * Reusable validation patterns across the application
 */

import { z } from 'zod';

// ========================================
// Common Field Schemas
// ========================================

/**
 * Email validation - lowercase, valid email format
 */
// eslint-disable-next-line sonarjs/deprecation -- Using current Zod API
export const emailSchema = z.string().email().toLowerCase();

/**
 * Phone number validation - 10 digits
 */
export const phoneSchema = z.string().regex(/^\d{10}$/, 'Phone must be 10 digits');

/**
 * ZIP code validation - 5 digits or 5+4 format
 */
export const zipCodeSchema = z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format');

/**
 * SSN validation - XXX-XX-XXXX format
 */
export const ssnSchema = z.string().regex(/^\d{3}-\d{2}-\d{4}$/, 'SSN must be in XXX-XX-XXXX format');

/**
 * UUID validation
 */
// eslint-disable-next-line sonarjs/deprecation -- Using current Zod API
export const uuidSchema = z.string().uuid();

/**
 * US State code - 2 letter state abbreviation
 */
export const stateCodeSchema = z.string().length(2).toUpperCase();

/**
 * EIN (Employer Identification Number) - XX-XXXXXXX format
 */
export const einSchema = z.string().regex(/^\d{2}-\d{7}$/, 'EIN must be in XX-XXXXXXX format');

/**
 * Medicaid ID - varies by state, alphanumeric
 */
export const medicaidIdSchema = z.string().min(1).max(50);

/**
 * Medicare ID - alphanumeric
 */
export const medicareIdSchema = z.string().min(1).max(50);

// ========================================
// Common Object Schemas
// ========================================

/**
 * Physical address schema
 */
export const addressSchema = z.object({
  street: z.string().min(1).max(200),
  street2: z.string().max(200).optional(),
  city: z.string().min(1).max(100),
  state: stateCodeSchema,
  zipCode: zipCodeSchema,
  country: z.string().default('US'),
});

/**
 * Person name schema
 */
export const nameSchema = z.object({
  firstName: z.string().min(1).max(100),
  middleName: z.string().max(100).optional(),
  lastName: z.string().min(1).max(100),
  suffix: z.enum(['Jr', 'Sr', 'II', 'III', 'IV', 'V']).optional(),
});

/**
 * Pagination parameters schema
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * Date range schema with validation
 */
export const dateRangeSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
}).refine(data => data.endDate >= data.startDate, {
  message: 'End date must be on or after start date',
  path: ['endDate'],
});

/**
 * Emergency contact schema
 */
export const emergencyContactSchema = z.object({
  name: z.string().min(1).max(200),
  relationship: z.string().min(1).max(100),
  phoneNumber: phoneSchema,
  alternatePhone: phoneSchema.optional(),
  isPrimary: z.boolean().default(false),
});

/**
 * Contact information schema
 */
export const contactInfoSchema = z.object({
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  alternatePhone: phoneSchema.optional(),
  address: addressSchema.optional(),
});

/**
 * Money/currency amount schema (in cents)
 */
export const moneySchema = z.number().int().nonnegative();

/**
 * Percentage schema (0-100)
 */
export const percentageSchema = z.number().min(0).max(100);

/**
 * Time of day schema (HH:MM format, 24-hour)
 */
export const timeSchema = z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Time must be in HH:MM format');

/**
 * Duration in minutes schema
 */
export const durationMinutesSchema = z.number().int().positive();

// ========================================
// Common Enums
// ========================================

/**
 * Common status values
 */
export const statusSchema = z.enum(['ACTIVE', 'INACTIVE', 'PENDING', 'SUSPENDED', 'ARCHIVED']);

/**
 * Common gender values
 */
export const genderSchema = z.enum(['MALE', 'FEMALE', 'NON_BINARY', 'PREFER_NOT_TO_SAY', 'OTHER']);

/**
 * Common language codes (ISO 639-1)
 */
export const languageCodeSchema = z.enum(['en', 'es', 'fr', 'zh', 'vi', 'ar', 'ko', 'ru', 'pt', 'other']);

/**
 * Common US states (commonly used in home care)
 */
export const usStateSchema = z.enum([
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
  'DC', 'PR', 'VI', 'GU',
]);

// ========================================
// Helper Functions
// ========================================

/**
 * Create a partial schema from any object schema
 * Makes all fields optional while preserving validation rules
 */
export function createPartialSchema<T extends z.ZodTypeAny>(schema: T): z.ZodOptional<T> {
  return schema.optional();
}

/**
 * Create array schema with min/max validation
 */
export function createArraySchema<T extends z.ZodTypeAny>(
  itemSchema: T,
  min?: number,
  max?: number
): z.ZodArray<T> {
  let schema = z.array(itemSchema);
  if (min !== undefined) schema = schema.min(min);
  if (max !== undefined) schema = schema.max(max);
  return schema;
}
