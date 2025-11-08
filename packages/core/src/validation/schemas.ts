/**
 * Shared Validation Schemas
 *
 * Centralized validation schemas using Zod for consistent validation
 * across web, mobile, and backend applications.
 */

import { z } from 'zod';

/**
 * Common field validators with user-friendly error messages
 */
export const validators = {
  // eslint-disable-next-line sonarjs/deprecation
  email: z.string().email({ message: 'Please enter a valid email address' }),

  phone: z.string().regex(
    /^\(?(\d{3})\)?[ .-]?(\d{3})[ .-]?(\d{4})$/,
    { message: 'Please enter a valid phone number (e.g., 555-123-4567)' }
  ),

  zipCode: z.string().regex(
    /^\d{5}(-\d{4})?$/,
    { message: 'Please enter a valid ZIP code (e.g., 78701 or 78701-1234)' }
  ),

  ssn: z.string().regex(
    /^\d{3}-\d{2}-\d{4}$/,
    { message: 'Please enter a valid SSN (e.g., 123-45-6789)' }
  ),

  // eslint-disable-next-line sonarjs/deprecation
  uuid: z.string().uuid({ message: 'Invalid ID format' }),

  // eslint-disable-next-line sonarjs/deprecation
  date: z.string().datetime({ message: 'Please enter a valid date' }),

  requiredString: (fieldName: string, minLength = 1) =>
    z.string().min(minLength, `${fieldName} is required`),

  optionalString: z.string().optional(),

  positiveNumber: (fieldName: string) =>
    z.number().positive(`${fieldName} must be a positive number`),

  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/\d/, 'Password must contain at least one number'),

  confirmPassword: (passwordField: string) =>
    z.string().refine((val) => val === passwordField, {
      message: 'Passwords do not match'
    })
};

/**
 * Client schema for client registration and updates
 */
export const clientSchema = z.object({
  first_name: validators.requiredString('First name', 2),
  last_name: validators.requiredString('Last name', 2),
  email: validators.email.optional(),
  phone: validators.phone,
  date_of_birth: validators.date,
  ssn: validators.ssn.optional(),
  address: z.object({
    street: validators.requiredString('Street address'),
    city: validators.requiredString('City'),
    state: z.enum(['TX', 'FL', 'OH', 'PA', 'GA', 'NC', 'AZ']),
    zip: validators.zipCode
  }),
  emergency_contact: z.object({
    name: validators.requiredString('Emergency contact name'),
    phone: validators.phone,
    relationship: validators.requiredString('Relationship')
  }),
  notes: validators.optionalString
});

/**
 * Caregiver schema for caregiver registration and updates
 */
export const caregiverSchema = z.object({
  first_name: validators.requiredString('First name', 2),
  last_name: validators.requiredString('Last name', 2),
  email: validators.email,
  phone: validators.phone,
  date_of_birth: validators.date,
  ssn: validators.ssn,
  certifications: z.array(z.string()).min(1, 'At least one certification required'),
  hourly_rate: validators.positiveNumber('Hourly rate'),
  address: z.object({
    street: validators.requiredString('Street address'),
    city: validators.requiredString('City'),
    state: z.enum(['TX', 'FL', 'OH', 'PA', 'GA', 'NC', 'AZ']),
    zip: validators.zipCode
  })
});

/**
 * Visit schema for scheduling visits
 */
export const visitSchema = z.object({
  client_id: validators.uuid,
  caregiver_id: validators.uuid,
  scheduled_start: validators.date,
  scheduled_end: validators.date,
  service_type: z.enum(['personal_care', 'companionship', 'skilled_nursing', 'respite']),
  notes: validators.optionalString
}).refine(
  (data) => new Date(data.scheduled_end) > new Date(data.scheduled_start),
  {
    message: 'End time must be after start time',
    path: ['scheduled_end']
  }
);

/**
 * Care plan schema for creating and updating care plans
 */
export const carePlanSchema = z.object({
  client_id: validators.uuid,
  name: validators.requiredString('Plan name', 3),
  start_date: validators.date,
  end_date: validators.date.optional(),
  goals: validators.requiredString('Care goals', 10),
  status: z.enum(['draft', 'active', 'completed', 'cancelled'])
});

/**
 * Login schema for authentication
 */
export const loginSchema = z.object({
  email: validators.email,
  password: z.string().min(1, 'Password is required')
});

/**
 * Registration schema for new user signup
 */
export const registerSchema = z.object({
  email: validators.email,
  password: validators.password,
  confirm_password: z.string(),
  first_name: validators.requiredString('First name'),
  last_name: validators.requiredString('Last name'),
  phone: validators.phone
}).refine((data) => data.password === data.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password']
});

/**
 * Type exports for TypeScript
 */
export type ClientFormData = z.infer<typeof clientSchema>;
export type CaregiverFormData = z.infer<typeof caregiverSchema>;
export type VisitFormData = z.infer<typeof visitSchema>;
export type CarePlanFormData = z.infer<typeof carePlanSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;

/**
 * Boolean validation helpers (for non-Zod contexts)
 * These provide simple true/false validation for common patterns
 */
export const validationHelpers = {
  /**
   * Validate email format
   * Uses a simple, safe regex that avoids backtracking vulnerabilities
   */
  isEmail: (email: string): boolean => {
    // Simple email validation without vulnerable backtracking patterns
    const emailRegex = /^[\w%+.-]+@[\d.A-Za-z-]+\.[A-Za-z]{2,}$/;
    return emailRegex.test(email);
  },

  /**
   * Validate US phone number format
   */
  isPhone: (phone: string): boolean => {
    const phoneRegex = /^\(?(\d{3})\)?[ .-]?(\d{3})[ .-]?(\d{4})$/;
    return phoneRegex.test(phone);
  },

  /**
   * Validate US ZIP code format
   */
  isZipCode: (zip: string): boolean => {
    const zipRegex = /^\d{5}(-\d{4})?$/;
    return zipRegex.test(zip);
  },

  /**
   * Validate SSN format (with or without dashes)
   */
  isSSN: (ssn: string): boolean => {
    const ssnRegex = /^\d{3}-?\d{2}-?\d{4}$/;
    return ssnRegex.test(ssn);
  },

  /**
   * Check if value is empty (null, undefined, empty string/array/object)
   */
  isEmpty: (value: unknown): boolean => {
    if (value == null) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
  },

  /**
   * Validate date is a valid Date object or parseable string
   */
  isValidDate: (date: string | Date): boolean => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d instanceof Date && !isNaN(d.getTime());
  },

  /**
   * Check minimum length
   */
  minLength: (value: string, min: number): boolean => {
    return value.length >= min;
  },

  /**
   * Check maximum length
   */
  maxLength: (value: string, max: number): boolean => {
    return value.length <= max;
  },
};
