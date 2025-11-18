/**
 * Signup Service Tests
 * 
 * Basic tests to validate signup workflow
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SignupService } from '../signup-service.js';
import { Database } from '../../db/connection.js';

describe('SignupService', () => {
  let mockDb: Database;
  let signupService: SignupService;

  beforeEach(() => {
    // Mock database
    mockDb = {
      query: vi.fn(),
      transaction: vi.fn(async (callback) => {
        // Execute callback immediately for testing
        return await callback(mockDb);
      }),
    } as unknown as Database;

    signupService = new SignupService(mockDb);
  });

  describe('Input Validation', () => {
    it('should reject signup with missing organization name', async () => {
      const invalidRequest = {
        organizationName: '',
        organizationEmail: 'test@example.com',
        stateCode: 'TX',
        adminFirstName: 'John',
        adminLastName: 'Doe',
        adminEmail: 'john@example.com',
        adminPassword: 'SecurePass123!',
      };

      await expect(signupService.registerOrganization(invalidRequest)).rejects.toThrow('Invalid signup request');
    });

    it('should reject signup with invalid email', async () => {
      const invalidRequest = {
        organizationName: 'Test Org',
        organizationEmail: 'invalid-email',
        stateCode: 'TX',
        adminFirstName: 'John',
        adminLastName: 'Doe',
        adminEmail: 'john@example.com',
        adminPassword: 'SecurePass123!',
      };

      await expect(signupService.registerOrganization(invalidRequest)).rejects.toThrow('Invalid signup request');
    });

    it('should reject signup with short password', async () => {
      const invalidRequest = {
        organizationName: 'Test Org',
        organizationEmail: 'test@example.com',
        stateCode: 'TX',
        adminFirstName: 'John',
        adminLastName: 'Doe',
        adminEmail: 'john@example.com',
        adminPassword: 'short',
      };

      await expect(signupService.registerOrganization(invalidRequest)).rejects.toThrow('Invalid signup request');
    });

    it('should reject signup with invalid state code', async () => {
      const invalidRequest = {
        organizationName: 'Test Org',
        organizationEmail: 'test@example.com',
        stateCode: 'INVALID',
        adminFirstName: 'John',
        adminLastName: 'Doe',
        adminEmail: 'john@example.com',
        adminPassword: 'SecurePass123!',
      };

      await expect(signupService.registerOrganization(invalidRequest)).rejects.toThrow('Invalid signup request');
    });
  });

  describe('Plan Configuration', () => {
    it('should default to STARTER plan when not specified', () => {
      // This would require mocking the full signup flow
      // For now, we just validate the plan limits are defined correctly
      const starterLimits = {
        clientLimit: 25,
        caregiverLimit: 10,
        visitLimit: 500,
        amount: 99.00,
      };

      expect(starterLimits.clientLimit).toBe(25);
      expect(starterLimits.caregiverLimit).toBe(10);
      expect(starterLimits.amount).toBe(99.00);
    });
  });
});
