/**
 * Tests for ClientValidator
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ClientValidator } from '../../validation/client-validator';
import { CreateClientInput, UpdateClientInput } from '../../types/client';

describe('ClientValidator', () => {
  let validator: ClientValidator;

  beforeEach(() => {
    validator = new ClientValidator();
  });

  describe('validateCreate', () => {
    it('should validate valid create input successfully', () => {
      const validInput: CreateClientInput = {
        organizationId: '123e4567-e89b-12d3-a456-426614174000',
        branchId: '123e4567-e89b-12d3-a456-426614174001',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1980-01-01'),
        primaryAddress: {
          type: 'HOME',
          line1: '123 Main St',
          city: 'Anytown',
          state: 'ST',
          postalCode: '12345',
          country: 'US',
        },
      };

      const result = validator.validateCreate(validInput);

      expect(result.success).toBe(true);
    });

    it('should return errors for invalid create input', () => {
      const invalidInput: CreateClientInput = {
        organizationId: 'invalid-uuid',
        branchId: '00000000-0000-0000-0000-000000000002',
        firstName: '', // Empty first name
        lastName: 'Doe',
        dateOfBirth: new Date('2050-01-01'), // Future date
        primaryAddress: {
          type: 'INVALID_ADDRESS_TYPE', // Invalid type
          line1: '123 Main St',
          city: 'Anytown',
          state: 'ST',
          postalCode: '12345',
          country: 'US',
        } as any,
      };

      const result = validator.validateCreate(invalidInput);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          path: 'organizationId',
          message: expect.stringContaining('UUID'),
        })
      );
      expect(result.errors).toContainEqual(
        expect.objectContaining({ path: 'firstName', message: expect.stringContaining('required') })
      );
      expect(result.errors).toContainEqual(
        expect.objectContaining({ path: 'dateOfBirth', message: expect.stringContaining('date') })
      );
    });

    it('should validate email format', () => {
      const inputWithInvalidEmail: CreateClientInput = {
        organizationId: '00000000-0000-0000-0000-000000000001',
        branchId: '00000000-0000-0000-0000-000000000002',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1980-01-01'),
        primaryAddress: {
          type: 'HOME',
          line1: '123 Main St',
          city: 'Anytown',
          state: 'ST',
          postalCode: '12345',
          country: 'US',
        },
        email: 'invalid-email',
      };

      const result = validator.validateCreate(inputWithInvalidEmail);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors).toContainEqual(
        expect.objectContaining({ path: 'email', message: expect.stringContaining('email') })
      );
    });

    it('should validate state format', () => {
      const inputWithInvalidState: CreateClientInput = {
        organizationId: '00000000-0000-0000-0000-000000000001',
        branchId: '00000000-0000-0000-0000-000000000002',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1980-01-01'),
        primaryAddress: {
          type: 'HOME',
          line1: '123 Main St',
          city: 'Anytown',
          state: 'INVALID_STATE_CODE', // Should be 2-letter code
          postalCode: '12345',
          country: 'US',
        },
      };

      const result = validator.validateCreate(inputWithInvalidState);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          path: 'primaryAddress.state',
          message: expect.stringContaining('2-letter'),
        })
      );
    });

    it('should validate postal code format', () => {
      const inputWithInvalidPostalCode: CreateClientInput = {
        organizationId: '00000000-0000-0000-0000-000000000001',
        branchId: '00000000-0000-0000-0000-000000000002',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1980-01-01'),
        primaryAddress: {
          type: 'HOME',
          line1: '123 Main St',
          city: 'Anytown',
          state: 'ST',
          postalCode: 'INVALID', // Not in the format \d{5} or \d{5}-\d{4}
          country: 'US',
        },
      };

      const result = validator.validateCreate(inputWithInvalidPostalCode);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          path: 'primaryAddress.postalCode',
          message: 'Invalid postal code',
        })
      );
    });

    it('should validate phone number format', () => {
      const inputWithInvalidPhone: CreateClientInput = {
        organizationId: '00000000-0000-0000-0000-000000000001',
        branchId: '00000000-0000-0000-0000-000000000002',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1980-01-01'),
        primaryAddress: {
          type: 'HOME',
          line1: '123 Main St',
          city: 'Anytown',
          state: 'ST',
          postalCode: '12345',
          country: 'US',
        },
        primaryPhone: {
          number: 'invalid-phone-number',
          type: 'MOBILE',
          canReceiveSMS: true,
        },
      };

      const result = validator.validateCreate(inputWithInvalidPhone);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors).toContainEqual(
        expect.objectContaining({ path: 'primaryPhone.number', message: 'Invalid phone number' })
      );
    });
  });

  describe('validateUpdate', () => {
    it('should validate valid update input successfully', () => {
      const validInput: UpdateClientInput = {
        firstName: 'Jane',
        email: 'jane.doe@example.com',
      };

      const result = validator.validateUpdate(validInput);

      expect(result.success).toBe(true);
    });

    it('should allow partial updates without required fields', () => {
      const validInput: UpdateClientInput = {
        email: 'jane.doe@example.com',
      };

      const result = validator.validateUpdate(validInput);

      expect(result.success).toBe(true);
    });

    it('should return errors for invalid update input', () => {
      const invalidInput: UpdateClientInput = {
        firstName: 'x'.repeat(200), // Too long
        email: 'invalid-email',
        dateOfBirth: new Date('2050-01-01'), // Future date
      };

      const result = validator.validateUpdate(invalidInput);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors).toContainEqual(
        expect.objectContaining({ path: 'firstName', message: expect.stringContaining('100') })
      );
      expect(result.errors).toContainEqual(
        expect.objectContaining({ path: 'email', message: expect.stringContaining('email') })
      );
    });
  });

  describe('validateSSN', () => {
    it('should return true for valid SSN format', () => {
      expect(validator.validateSSN('123-45-6789')).toBe(true);
      expect(validator.validateSSN('123456789')).toBe(true);
    });

    it('should return false for invalid SSN format', () => {
      expect(validator.validateSSN('invalid-ssn')).toBe(false);
      expect(validator.validateSSN('12-345-6789')).toBe(false);
      expect(validator.validateSSN('12-345-6789')).toBe(false);
    });
  });

  describe('validateEmail', () => {
    it('should return true for valid email format', () => {
      expect(validator.validateEmail('test@example.com')).toBe(true);
      expect(validator.validateEmail('user.name@domain.co.uk')).toBe(true);
    });

    it('should return false for invalid email format', () => {
      expect(validator.validateEmail('invalid-email')).toBe(false);
      expect(validator.validateEmail('@example.com')).toBe(false);
      expect(validator.validateEmail('test@')).toBe(false);
    });
  });

  describe('validateMinimumAge', () => {
    it('should return true when age is at or above minimum', () => {
      const dateOfBirth = new Date();
      dateOfBirth.setFullYear(dateOfBirth.getFullYear() - 25); // 25 years old

      expect(validator.validateMinimumAge(dateOfBirth, 18)).toBe(true);
    });

    it('should return false when age is below minimum', () => {
      const dateOfBirth = new Date();
      dateOfBirth.setFullYear(dateOfBirth.getFullYear() - 10); // 10 years old

      expect(validator.validateMinimumAge(dateOfBirth, 18)).toBe(false);
    });

    it('should work with default minimum age (18)', () => {
      const dateOfBirth = new Date();
      dateOfBirth.setFullYear(dateOfBirth.getFullYear() - 20); // 20 years old

      expect(validator.validateMinimumAge(dateOfBirth)).toBe(true);
    });
  });

  describe('calculateAge', () => {
    it('should calculate age correctly', () => {
      const dateOfBirth = new Date();
      dateOfBirth.setFullYear(dateOfBirth.getFullYear() - 25); // 25 years old

      const age = validator.calculateAge(dateOfBirth);
      expect(age).toBe(25);
    });

    it('should handle different months correctly', () => {
      const today = new Date('2024-03-15');
      const dateOfBirth = new Date('2000-05-15'); // Born in May 2000

      // Since today is March 2024, the person hasn't had their birthday yet in 2024
      // So they should be 23 years old (2024 - 2000 - 1 = 23)
      vi.useFakeTimers();
      vi.setSystemTime(today);

      const age = validator.calculateAge(dateOfBirth);
      expect(age).toBe(23);

      vi.useRealTimers();
    });

    it('should handle birthday edge case', () => {
      const today = new Date('2024-05-15');
      const dateOfBirth = new Date('2000-05-15'); // Same day and month as birth date

      // Since the person has their birthday today, they should be 24 years old (2024 - 2000 = 24)
      vi.useFakeTimers();
      vi.setSystemTime(today);

      const age = validator.calculateAge(dateOfBirth);
      expect(age).toBe(24);

      vi.useRealTimers();
    });
  });
});
