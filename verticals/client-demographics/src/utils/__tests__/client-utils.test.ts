/**
 * Tests for client utility functions
 */

import {
  calculateAge,
  calculateDetailedAge,
  getFullName,
  getDisplayName,
  getPrimaryEmergencyContact,
  getActiveRiskFlags,
  getCriticalRiskFlags,
  hasCriticalRisks,
  getActivePrograms,
  getTotalAuthorizedHours,
  formatPhoneNumber,
  getStatusDisplay,
  isEligibleForServices,
  hasAllergies,
  hasLifeThreateningAllergies,
  isNewClient,
  validateClientData,
  compareClients,
} from '../client-utils';
import { Client } from '../../types/client';
import { describe, it, expect } from 'vitest';

describe('Client Utilities', () => {
  const mockClient: Client = {
    id: '123',
    organizationId: 'org-1',
    branchId: 'branch-1',
    clientNumber: 'CL-001',
    firstName: 'Jane',
    middleName: 'Marie',
    lastName: 'Doe',
    preferredName: 'Janie',
    dateOfBirth: new Date('1950-05-15'),
    gender: 'FEMALE',
    primaryPhone: {
      number: '5551234567',
      type: 'MOBILE',
      canReceiveSMS: true,
    },
    email: 'jane.doe@example.com',
    primaryAddress: {
      type: 'HOME',
      line1: '123 Main St',
      line2: 'Apt 4B',
      city: 'Springfield',
      state: 'IL',
      postalCode: '62701',
      country: 'US',
    },
    emergencyContacts: [
      {
        id: 'ec-1',
        name: 'John Doe',
        relationship: 'Son',
        phone: { number: '5559876543', type: 'MOBILE', canReceiveSMS: true },
        isPrimary: true,
        canMakeHealthcareDecisions: true,
      },
      {
        id: 'ec-2',
        name: 'Mary Smith',
        relationship: 'Daughter',
        phone: { number: '5551112222', type: 'HOME', canReceiveSMS: false },
        isPrimary: false,
        canMakeHealthcareDecisions: false,
      },
    ],
    authorizedContacts: [],
    programs: [
      {
        id: 'prog-1',
        programId: 'program-1',
        programName: 'Personal Care',
        enrollmentDate: new Date('2024-01-01'),
        status: 'ACTIVE',
        authorizedHoursPerWeek: 20,
      },
      {
        id: 'prog-2',
        programId: 'program-2',
        programName: 'Respite Care',
        enrollmentDate: new Date('2024-01-01'),
        status: 'ACTIVE',
        authorizedHoursPerWeek: 10,
      },
      {
        id: 'prog-3',
        programId: 'program-3',
        programName: 'Old Program',
        enrollmentDate: new Date('2023-01-01'),
        endDate: new Date('2023-12-31'),
        status: 'COMPLETED',
        authorizedHoursPerWeek: 15,
      },
    ],
    serviceEligibility: {
      medicaidEligible: true,
      medicaidNumber: 'MCD123',
      medicareEligible: true,
      medicareNumber: 'MCR456',
      veteransBenefits: false,
      longTermCareInsurance: false,
      privatePayOnly: false,
    },
    riskFlags: [
      {
        id: 'risk-1',
        type: 'FALL_RISK',
        severity: 'HIGH',
        description: 'Recent fall history',
        identifiedDate: new Date('2024-01-15'),
        requiresAcknowledgment: true,
      },
      {
        id: 'risk-2',
        type: 'MEDICATION_COMPLIANCE',
        severity: 'MEDIUM',
        description: 'Sometimes forgets medications',
        identifiedDate: new Date('2024-01-20'),
        requiresAcknowledgment: false,
      },
      {
        id: 'risk-3',
        type: 'WANDERING',
        severity: 'CRITICAL',
        description: 'Wandering risk',
        identifiedDate: new Date('2024-01-10'),
        resolvedDate: new Date('2024-02-01'),
        requiresAcknowledgment: true,
      },
    ],
    allergies: [
      {
        id: 'allergy-1',
        allergen: 'Penicillin',
        type: 'MEDICATION',
        reaction: 'Severe rash',
        severity: 'LIFE_THREATENING',
      },
      {
        id: 'allergy-2',
        allergen: 'Peanuts',
        type: 'FOOD',
        reaction: 'Hives',
        severity: 'MODERATE',
      },
    ],
    status: 'ACTIVE',
    intakeDate: new Date('2024-01-01'),
    createdAt: new Date(),
    createdBy: 'user-1',
    updatedAt: new Date(),
    updatedBy: 'user-1',
    version: 1,
    deletedAt: null,
    deletedBy: null,
  };

  describe('calculateAge', () => {
    it('should calculate age correctly', () => {
      // Use a date that's exactly 25 years ago from today
      const today = new Date();
      const birthDate = new Date(today);
      birthDate.setFullYear(today.getFullYear() - 25);

      const age = calculateAge(birthDate);
      expect(age).toBe(25);
    });

    it('should handle string dates', () => {
      // Use a date that's exactly 30 years and 1 day ago to avoid day-of-month edge cases
      const today = new Date();
      const birthDate = new Date(today);
      birthDate.setFullYear(today.getFullYear() - 30);
      birthDate.setDate(today.getDate() - 1); // Go back one more day to ensure we've passed the birthday

      const dateString = birthDate.toISOString().split('T')[0];
      if (!dateString) throw new Error('Invalid date string');
      const age = calculateAge(dateString);
      expect(age).toBe(30);
    });
  });

  describe('calculateDetailedAge', () => {
    it('should return years and months', () => {
      // Use a specific birth date that's safe from day-of-month edge cases
      // Birth date: January 1, 2000
      // As of any date in 2025, this person will be 25 years old
      // The months will vary based on the current month
      const age = calculateDetailedAge('2000-01-01');

      expect(age).toHaveProperty('years');
      expect(age).toHaveProperty('months');

      // Should be 25 years old as of 2025
      expect(age.years).toBe(25);

      // Months should be between 0-11 depending on current month
      expect(age.months).toBeGreaterThanOrEqual(0);
      expect(age.months).toBeLessThan(12);
    });
  });

  describe('getFullName', () => {
    it('should return full name without middle name by default', () => {
      expect(getFullName(mockClient)).toBe('Jane Doe "Janie"');
    });

    it('should include middle name when requested', () => {
      expect(getFullName(mockClient, true)).toBe('Jane Marie Doe "Janie"');
    });

    it('should not show preferred name if same as first name', () => {
      const client = { ...mockClient, preferredName: 'Jane' };
      expect(getFullName(client)).toBe('Jane Doe');
    });
  });

  describe('getDisplayName', () => {
    it('should return preferred name if available', () => {
      expect(getDisplayName(mockClient)).toBe('Janie');
    });

    it('should return first name if no preferred name', () => {
      const client = { ...mockClient, preferredName: undefined };
      expect(getDisplayName(client)).toBe('Jane');
    });
  });

  describe('getPrimaryEmergencyContact', () => {
    it('should return the primary contact', () => {
      const contact = getPrimaryEmergencyContact(mockClient);
      expect(contact).toBeDefined();
      expect(contact?.name).toBe('John Doe');
      expect(contact?.isPrimary).toBe(true);
    });
  });

  describe('getActiveRiskFlags', () => {
    it('should return only unresolved risk flags', () => {
      const active = getActiveRiskFlags(mockClient);
      expect(active).toHaveLength(2);
      expect(active.every((flag) => !flag.resolvedDate)).toBe(true);
    });
  });

  describe('getCriticalRiskFlags', () => {
    it('should return only critical unresolved risk flags', () => {
      const critical = getCriticalRiskFlags(mockClient);
      expect(critical).toHaveLength(0); // The critical one is resolved
    });

    it('should identify active critical flags', () => {
      const client = {
        ...mockClient,
        riskFlags: [
          {
            id: 'risk-4',
            type: 'SAFETY_CONCERN' as const,
            severity: 'CRITICAL' as const,
            description: 'Active critical risk',
            identifiedDate: new Date(),
            requiresAcknowledgment: true,
          },
        ],
      };
      const critical = getCriticalRiskFlags(client);
      expect(critical).toHaveLength(1);
    });
  });

  describe('hasCriticalRisks', () => {
    it('should return false when no critical active risks', () => {
      expect(hasCriticalRisks(mockClient)).toBe(false);
    });
  });

  describe('getActivePrograms', () => {
    it('should return only active programs', () => {
      const active = getActivePrograms(mockClient);
      expect(active).toHaveLength(2);
      expect(active.every((p) => p.status === 'ACTIVE')).toBe(true);
    });
  });

  describe('getTotalAuthorizedHours', () => {
    it('should sum authorized hours from active programs', () => {
      const total = getTotalAuthorizedHours(mockClient);
      expect(total).toBe(30); // 20 + 10
    });
  });

  describe('formatPhoneNumber', () => {
    it('should format 10-digit number correctly', () => {
      expect(formatPhoneNumber('5551234567')).toBe('(555) 123-4567');
    });

    it('should format 11-digit number with country code', () => {
      expect(formatPhoneNumber('15551234567')).toBe('+1 (555) 123-4567');
    });

    it('should handle already formatted numbers', () => {
      expect(formatPhoneNumber('(555) 123-4567')).toBe('(555) 123-4567');
    });

    it('should return as-is for invalid formats', () => {
      expect(formatPhoneNumber('123')).toBe('123');
    });
  });

  describe('getStatusDisplay', () => {
    it('should return display info for each status', () => {
      expect(getStatusDisplay('ACTIVE')).toEqual({
        label: 'Active',
        color: 'green',
        icon: '✅',
      });

      expect(getStatusDisplay('PENDING_INTAKE')).toEqual({
        label: 'Pending Intake',
        color: 'yellow',
        icon: '⏳',
      });
    });
  });

  describe('isEligibleForServices', () => {
    it('should return true if any eligibility criteria met', () => {
      expect(isEligibleForServices(mockClient)).toBe(true);
    });

    it('should return false if no eligibility criteria met', () => {
      const client = {
        ...mockClient,
        serviceEligibility: {
          medicaidEligible: false,
          medicareEligible: false,
          veteransBenefits: false,
          longTermCareInsurance: false,
          privatePayOnly: false,
        },
      };
      expect(isEligibleForServices(client)).toBe(false);
    });
  });

  describe('hasAllergies', () => {
    it('should return true if client has allergies', () => {
      expect(hasAllergies(mockClient)).toBe(true);
    });

    it('should return false if no allergies', () => {
      const client = { ...mockClient, allergies: [] };
      expect(hasAllergies(client)).toBe(false);
    });
  });

  describe('hasLifeThreateningAllergies', () => {
    it('should return true if any life-threatening allergy exists', () => {
      expect(hasLifeThreateningAllergies(mockClient)).toBe(true);
    });

    it('should return false if no life-threatening allergies', () => {
      const client = {
        ...mockClient,
        allergies: [
          {
            id: 'allergy-1',
            allergen: 'Dust',
            type: 'ENVIRONMENTAL' as const,
            reaction: 'Sneezing',
            severity: 'MILD' as const,
          },
        ],
      };
      expect(hasLifeThreateningAllergies(client)).toBe(false);
    });
  });

  describe('isNewClient', () => {
    it('should return true for recent intake', () => {
      const client = { ...mockClient, intakeDate: new Date() };
      expect(isNewClient(client, 30)).toBe(true);
    });

    it('should return false for old intake', () => {
      const client = { ...mockClient, intakeDate: new Date('2020-01-01') };
      expect(isNewClient(client, 30)).toBe(false);
    });
  });

  describe('validateClientData', () => {
    it('should pass validation for valid data', () => {
      const result = validateClientData({
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1950-01-01'),
        email: 'john@example.com',
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail for empty first name', () => {
      const result = validateClientData({
        firstName: '   ',
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('First name cannot be empty');
    });

    it('should fail for invalid email', () => {
      const result = validateClientData({
        email: 'invalid-email',
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid email format');
    });

    it('should fail for invalid date of birth', () => {
      const result = validateClientData({
        dateOfBirth: new Date('2050-01-01'), // Future date
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid date of birth');
    });
  });

  describe('compareClients', () => {
    const client1 = { ...mockClient, lastName: 'Adams', firstName: 'Alice' };
    const client2 = { ...mockClient, lastName: 'Baker', firstName: 'Bob' };

    it('should sort by name correctly', () => {
      expect(compareClients(client1, client2, 'name')).toBeLessThan(0);
      expect(compareClients(client2, client1, 'name')).toBeGreaterThan(0);
    });

    it('should sort by client number', () => {
      const c1 = { ...client1, clientNumber: 'CL-001' };
      const c2 = { ...client2, clientNumber: 'CL-002' };
      expect(compareClients(c1, c2, 'clientNumber')).toBeLessThan(0);
    });
  });
});
