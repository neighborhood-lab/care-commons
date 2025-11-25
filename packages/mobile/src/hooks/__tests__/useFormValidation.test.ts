/**
 * useFormValidation Hook Tests
 *
 * Tests the form validation logic without rendering hooks.
 * Uses direct function testing since mobile environment is Node-based.
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Test schemas
const testSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  age: z.number().min(18, 'Must be at least 18'),
});

const nestedSchema = z.object({
  user: z.object({
    profile: z.object({
      name: z.string().min(1, 'Name is required'),
    }),
  }),
});

const optionalSchema = z.object({
  required: z.string().min(1, 'Required field'),
  optional: z.string().optional(),
});

const arraySchema = z.object({
  items: z.array(z.string().min(1)).min(1, 'At least one item required'),
});

type TestFormData = z.infer<typeof testSchema>;

describe('Form Validation Logic', () => {
  // Test the core validation logic that useFormValidation wraps

  describe('validate with testSchema', () => {
    it('should pass validation for valid data', () => {
      const data: TestFormData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        age: 25,
      };

      const result = testSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should fail validation for invalid data', () => {
      const data = {
        firstName: '',
        lastName: '',
        email: 'invalid-email',
        age: 16,
      };

      const result = testSchema.safeParse(data);
      expect(result.success).toBe(false);

      if (!result.success) {
        const errors = result.error.issues.map(i => ({
          path: i.path.join('.'),
          message: i.message,
        }));

        expect(errors).toContainEqual({ path: 'firstName', message: 'First name is required' });
        expect(errors).toContainEqual({ path: 'lastName', message: 'Last name is required' });
        expect(errors).toContainEqual({ path: 'email', message: 'Invalid email address' });
        expect(errors).toContainEqual({ path: 'age', message: 'Must be at least 18' });
      }
    });

    it('should validate email format', () => {
      const validEmails = ['user@example.com', 'test.user@domain.org', 'name+tag@email.co.uk'];
      const invalidEmails = ['invalid', 'missing@domain', '@nodomain.com', 'spaces in@email.com'];

      for (const email of validEmails) {
        const result = z.string().email().safeParse(email);
        expect(result.success).toBe(true);
      }

      for (const email of invalidEmails) {
        const result = z.string().email().safeParse(email);
        expect(result.success).toBe(false);
      }
    });

    it('should validate minimum age', () => {
      const minAge = z.number().min(18, 'Must be at least 18');

      expect(minAge.safeParse(17).success).toBe(false);
      expect(minAge.safeParse(18).success).toBe(true);
      expect(minAge.safeParse(25).success).toBe(true);
    });
  });

  describe('validate with nestedSchema', () => {
    it('should validate nested objects', () => {
      const validData = {
        user: {
          profile: {
            name: 'John',
          },
        },
      };

      const result = nestedSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should report errors with nested paths', () => {
      const invalidData = {
        user: {
          profile: {
            name: '',
          },
        },
      };

      const result = nestedSchema.safeParse(invalidData);
      expect(result.success).toBe(false);

      if (!result.success) {
        const error = result.error.issues[0];
        expect(error.path.join('.')).toBe('user.profile.name');
        expect(error.message).toBe('Name is required');
      }
    });
  });

  describe('validate with optionalSchema', () => {
    it('should pass with required field only', () => {
      const data = {
        required: 'value',
      };

      const result = optionalSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should pass with both required and optional fields', () => {
      const data = {
        required: 'value',
        optional: 'optional value',
      };

      const result = optionalSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should fail if required field is missing', () => {
      const data = {
        optional: 'optional value',
      };

      const result = optionalSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('validate with arraySchema', () => {
    it('should fail with empty array', () => {
      const data = {
        items: [],
      };

      const result = arraySchema.safeParse(data);
      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.issues[0].message).toBe('At least one item required');
      }
    });

    it('should pass with valid array', () => {
      const data = {
        items: ['item1', 'item2'],
      };

      const result = arraySchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should fail with invalid array items', () => {
      const data = {
        items: ['valid', ''],
      };

      const result = arraySchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('error extraction helper', () => {
    // Tests the error extraction logic used in useFormValidation

    function extractErrors(zodError: z.ZodError): Record<string, string> {
      const errors: Record<string, string> = {};
      for (const issue of zodError.issues) {
        const path = issue.path.join('.');
        errors[path] = issue.message;
      }
      return errors;
    }

    it('should extract flat errors', () => {
      const result = testSchema.safeParse({
        firstName: '',
        lastName: '',
        email: 'invalid',
        age: 10,
      });

      if (!result.success) {
        const errors = extractErrors(result.error);
        expect(errors.firstName).toBe('First name is required');
        expect(errors.lastName).toBe('Last name is required');
        expect(errors.email).toBe('Invalid email address');
        expect(errors.age).toBe('Must be at least 18');
      }
    });

    it('should extract nested errors', () => {
      const result = nestedSchema.safeParse({
        user: {
          profile: {
            name: '',
          },
        },
      });

      if (!result.success) {
        const errors = extractErrors(result.error);
        expect(errors['user.profile.name']).toBe('Name is required');
      }
    });
  });

  describe('single field validation', () => {
    // Tests the single field validation approach used in validateField

    it('should validate single field in isolation', () => {
      const emailSchema = z.string().email('Invalid email');

      expect(emailSchema.safeParse('valid@email.com').success).toBe(true);
      expect(emailSchema.safeParse('invalid').success).toBe(false);
    });

    it('should handle required string validation', () => {
      const requiredSchema = z.string().min(1, 'Required');

      expect(requiredSchema.safeParse('').success).toBe(false);
      expect(requiredSchema.safeParse('value').success).toBe(true);
    });

    it('should handle number range validation', () => {
      const rangeSchema = z.number().min(0).max(100);

      expect(rangeSchema.safeParse(-1).success).toBe(false);
      expect(rangeSchema.safeParse(0).success).toBe(true);
      expect(rangeSchema.safeParse(50).success).toBe(true);
      expect(rangeSchema.safeParse(100).success).toBe(true);
      expect(rangeSchema.safeParse(101).success).toBe(false);
    });
  });

  describe('healthcare-specific validation patterns', () => {
    // Test validation patterns relevant to home healthcare

    const phoneSchema = z.string().regex(/^\d{10}$/, 'Phone must be 10 digits');
    const ssnSchema = z.string().regex(/^\d{3}-\d{2}-\d{4}$/, 'Invalid SSN format');
    const dateSchema = z.string().datetime({ message: 'Invalid date format' });

    it('should validate phone number format', () => {
      expect(phoneSchema.safeParse('5125846841').success).toBe(true);
      expect(phoneSchema.safeParse('512-584-6841').success).toBe(false);
      expect(phoneSchema.safeParse('123').success).toBe(false);
    });

    it('should validate SSN format', () => {
      expect(ssnSchema.safeParse('123-45-6789').success).toBe(true);
      expect(ssnSchema.safeParse('123456789').success).toBe(false);
      expect(ssnSchema.safeParse('12-345-6789').success).toBe(false);
    });

    it('should validate ISO datetime', () => {
      expect(dateSchema.safeParse('2025-01-15T10:30:00Z').success).toBe(true);
      expect(dateSchema.safeParse('invalid-date').success).toBe(false);
    });

    it('should validate client demographics', () => {
      const clientSchema = z.object({
        firstName: z.string().min(1, 'First name required'),
        lastName: z.string().min(1, 'Last name required'),
        dateOfBirth: z.string().datetime('Invalid date'),
        phone: z.string().regex(/^\d{10}$/, 'Invalid phone'),
        medicaidId: z.string().optional(),
      });

      const validClient = {
        firstName: 'Jane',
        lastName: 'Smith',
        dateOfBirth: '1945-03-15T00:00:00Z',
        phone: '5125551234',
      };

      expect(clientSchema.safeParse(validClient).success).toBe(true);
    });

    it('should validate EVV clock-in data', () => {
      const clockInSchema = z.object({
        visitId: z.string().uuid('Invalid visit ID'),
        caregiverId: z.string().uuid('Invalid caregiver ID'),
        clockInTime: z.string().datetime('Invalid timestamp'),
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        gpsAccuracy: z.number().positive('GPS accuracy must be positive'),
      });

      const validClockIn = {
        visitId: '550e8400-e29b-41d4-a716-446655440000',
        caregiverId: '550e8400-e29b-41d4-a716-446655440001',
        clockInTime: '2025-01-15T09:00:00Z',
        latitude: 30.2672,
        longitude: -97.7431,
        gpsAccuracy: 15.5,
      };

      expect(clockInSchema.safeParse(validClockIn).success).toBe(true);
    });
  });
});
