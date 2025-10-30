/**
 * Tests for caregiver utility functions
 */

import {
  calculateAge,
  calculateDetailedAge,
  calculateYearsOfService,
  getFullName,
  getDisplayName,
  formatPhoneNumber,
  getPrimaryEmergencyContact,
  hasActiveCredentials,
  getExpiringCredentials,
  getExpiredCredentials,
  hasCriticalComplianceIssues,
  getCompletedTraining,
  calculateTotalTrainingHours,
  isAvailableOnDay,
  getStatusDisplay,
  getComplianceStatusDisplay,
  canBeAssignedToVisits,
  getAssignmentBlockers,
  formatYearsOfService,
  isNewHire,
  hasSkill,
  compareCaregivers,
  filterByLanguages,
} from '../caregiver-utils';
import { Caregiver } from '../../types/caregiver';
import { addDays, subDays } from 'date-fns';
import { describe, it, expect } from 'vitest';

describe('Caregiver Utilities', () => {
  describe('calculateAge', () => {
    it('should calculate age correctly', () => {
      const today = new Date();
      const birthDate = new Date(today);
      birthDate.setFullYear(today.getFullYear() - 30);
      
      const age = calculateAge(birthDate);
      expect(age).toBe(30);
    });

    it('should handle string dates', () => {
      const today = new Date();
      const birthDate = new Date(today);
      birthDate.setFullYear(today.getFullYear() - 40);
      
      const age = calculateAge(birthDate.toISOString());
      expect(age).toBe(40);
    });
  });

  describe('calculateDetailedAge', () => {
    it('should return years and months', () => {
      const today = new Date();
      const birthDate = new Date(today);
      birthDate.setFullYear(today.getFullYear() - 25);
      birthDate.setMonth(today.getMonth() - 6);
      
      const age = calculateDetailedAge(birthDate);
      expect(age.years).toBe(25);
      expect(age.months).toBe(6);
    });
  });

  describe('calculateYearsOfService', () => {
    it('should calculate years of service', () => {
      const today = new Date();
      const hireDate = new Date(today);
      hireDate.setFullYear(today.getFullYear() - 5);
      
      const years = calculateYearsOfService(hireDate);
      expect(years).toBe(5);
    });
  });

  describe('getFullName', () => {
    const caregiver = {
      firstName: 'Sarah',
      middleName: 'Marie',
      lastName: 'Johnson',
      preferredName: 'Sally',
    };

    it('should return full name without middle name by default', () => {
      const name = getFullName(caregiver);
      expect(name).toBe('Sarah Johnson');
    });

    it('should include middle name when requested', () => {
      const name = getFullName(caregiver, { includeMiddle: true });
      expect(name).toBe('Sarah Marie Johnson');
    });

    it('should show preferred name when requested', () => {
      const name = getFullName(caregiver, { showPreferred: true });
      expect(name).toBe('Sarah Johnson "Sally"');
    });

    it('should not show preferred name if same as first name', () => {
      const cg = { ...caregiver, preferredName: 'Sarah' };
      const name = getFullName(cg, { showPreferred: true });
      expect(name).toBe('Sarah Johnson');
    });
  });

  describe('getDisplayName', () => {
    it('should return preferred name if available', () => {
      const caregiver = { firstName: 'Sarah', preferredName: 'Sally' };
      expect(getDisplayName(caregiver)).toBe('Sally');
    });

    it('should return first name if no preferred name', () => {
      const caregiver = { firstName: 'Sarah', preferredName: undefined };
      expect(getDisplayName(caregiver)).toBe('Sarah');
    });
  });

  describe('formatPhoneNumber', () => {
    it('should format 10-digit number correctly', () => {
      const formatted = formatPhoneNumber('5551234567');
      expect(formatted).toBe('(555) 123-4567');
    });

    it('should format 11-digit number with country code', () => {
      const formatted = formatPhoneNumber('15551234567');
      expect(formatted).toBe('+1 (555) 123-4567');
    });

    it('should handle already formatted numbers', () => {
      const formatted = formatPhoneNumber('(555) 123-4567');
      expect(formatted).toBe('(555) 123-4567');
    });

    it('should handle phone objects', () => {
      const phone = { number: '5551234567', type: 'MOBILE' as const, canReceiveSMS: true };
      const formatted = formatPhoneNumber(phone);
      expect(formatted).toBe('(555) 123-4567');
    });
  });

  describe('getPrimaryEmergencyContact', () => {
    it('should return the primary contact', () => {
      const caregiver = {
        emergencyContacts: [
          {
            id: '1',
            name: 'Contact 1',
            relationship: 'Spouse',
            phone: { number: '555-1111', type: 'MOBILE' as const, canReceiveSMS: true },
            isPrimary: false,
          },
          {
            id: '2',
            name: 'Contact 2',
            relationship: 'Parent',
            phone: { number: '555-2222', type: 'MOBILE' as const, canReceiveSMS: true },
            isPrimary: true,
          },
        ],
      };
      
      const primary = getPrimaryEmergencyContact(caregiver);
      expect(primary?.name).toBe('Contact 2');
      expect(primary?.isPrimary).toBe(true);
    });

    it('should return first contact if none marked primary', () => {
      const caregiver = {
        emergencyContacts: [
          {
            id: '1',
            name: 'Contact 1',
            relationship: 'Spouse',
            phone: { number: '555-1111', type: 'MOBILE' as const, canReceiveSMS: true },
            isPrimary: false,
          },
        ],
      };
      
      const primary = getPrimaryEmergencyContact(caregiver);
      expect(primary?.name).toBe('Contact 1');
    });
  });

  describe('hasActiveCredentials', () => {
    const futureDate = addDays(new Date(), 365); // One year in the future
    
    const caregiver = {
      credentials: [
        {
          id: '1',
          type: 'CNA' as const,
          name: 'CNA License',
          issueDate: new Date('2020-01-01'),
          expirationDate: futureDate,
          status: 'ACTIVE' as const,
        },
        {
          id: '2',
          type: 'CPR' as const,
          name: 'CPR Cert',
          issueDate: new Date('2023-01-01'),
          expirationDate: futureDate,
          status: 'ACTIVE' as const,
        },
      ],
    };

    it('should return true if has active credentials', () => {
      expect(hasActiveCredentials(caregiver)).toBe(true);
    });

    it('should check for specific credential types', () => {
      expect(hasActiveCredentials(caregiver, ['CNA'])).toBe(true);
      expect(hasActiveCredentials(caregiver, ['CNA', 'CPR'])).toBe(true);
      expect(hasActiveCredentials(caregiver, ['RN'])).toBe(false);
    });
  });

  describe('getExpiringCredentials', () => {
    it('should return credentials expiring within specified days', () => {
      const expiringDate = addDays(new Date(), 20);
      const caregiver = {
        credentials: [
          {
            id: '1',
            type: 'CNA' as const,
            name: 'CNA License',
            issueDate: new Date('2020-01-01'),
            expirationDate: expiringDate,
            status: 'ACTIVE' as const,
          },
          {
            id: '2',
            type: 'CPR' as const,
            name: 'CPR Cert',
            issueDate: new Date('2023-01-01'),
            expirationDate: addDays(new Date(), 60),
            status: 'ACTIVE' as const,
          },
        ],
      };

      const expiring = getExpiringCredentials(caregiver, 30);
      expect(expiring).toHaveLength(1);
      expect(expiring[0].type).toBe('CNA');
    });
  });

  describe('getExpiredCredentials', () => {
    it('should return expired credentials', () => {
      const caregiver = {
        credentials: [
          {
            id: '1',
            type: 'CNA' as const,
            name: 'CNA License',
            issueDate: new Date('2020-01-01'),
            expirationDate: subDays(new Date(), 10),
            status: 'ACTIVE' as const,
          },
          {
            id: '2',
            type: 'CPR' as const,
            name: 'CPR Cert',
            issueDate: new Date('2023-01-01'),
            expirationDate: addDays(new Date(), 60),
            status: 'ACTIVE' as const,
          },
        ],
      };

      const expired = getExpiredCredentials(caregiver);
      expect(expired).toHaveLength(1);
      expect(expired[0].type).toBe('CNA');
    });
  });

  describe('hasCriticalComplianceIssues', () => {
    it('should return true for critical statuses', () => {
      expect(hasCriticalComplianceIssues({ complianceStatus: 'EXPIRED' })).toBe(true);
      expect(hasCriticalComplianceIssues({ complianceStatus: 'NON_COMPLIANT' })).toBe(true);
    });

    it('should return false for non-critical statuses', () => {
      expect(hasCriticalComplianceIssues({ complianceStatus: 'COMPLIANT' })).toBe(false);
      expect(hasCriticalComplianceIssues({ complianceStatus: 'EXPIRING_SOON' })).toBe(false);
    });
  });

  describe('getCompletedTraining', () => {
    const caregiver = {
      training: [
        {
          id: '1',
          name: 'Orientation',
          category: 'ORIENTATION' as const,
          completionDate: new Date('2024-01-01'),
          status: 'COMPLETED' as const,
          hours: 8,
        },
        {
          id: '2',
          name: 'CPR Training',
          category: 'SAFETY' as const,
          completionDate: new Date('2024-02-01'),
          status: 'COMPLETED' as const,
          hours: 4,
        },
        {
          id: '3',
          name: 'Advanced Care',
          category: 'CLINICAL_SKILLS' as const,
          completionDate: new Date('2024-03-01'),
          status: 'IN_PROGRESS' as const,
          hours: 12,
        },
      ],
    };

    it('should return only completed training', () => {
      const completed = getCompletedTraining(caregiver);
      expect(completed).toHaveLength(2);
    });

    it('should filter by category', () => {
      const safety = getCompletedTraining(caregiver, 'SAFETY');
      expect(safety).toHaveLength(1);
      expect(safety[0].name).toBe('CPR Training');
    });
  });

  describe('calculateTotalTrainingHours', () => {
    it('should sum completed training hours', () => {
      const caregiver = {
        training: [
          {
            id: '1',
            name: 'Training 1',
            category: 'ORIENTATION' as const,
            completionDate: new Date(),
            status: 'COMPLETED' as const,
            hours: 8,
          },
          {
            id: '2',
            name: 'Training 2',
            category: 'SAFETY' as const,
            completionDate: new Date(),
            status: 'COMPLETED' as const,
            hours: 4,
          },
          {
            id: '3',
            name: 'Training 3',
            category: 'CLINICAL_SKILLS' as const,
            completionDate: new Date(),
            status: 'IN_PROGRESS' as const,
            hours: 12,
          },
        ],
      };

      const total = calculateTotalTrainingHours(caregiver);
      expect(total).toBe(12); // Only completed trainings
    });
  });

  describe('isAvailableOnDay', () => {
    it('should return true if available on the day', () => {
      const caregiver = {
        availability: {
          schedule: {
            monday: { available: true },
            tuesday: { available: false },
            wednesday: { available: true },
            thursday: { available: true },
            friday: { available: true },
            saturday: { available: false },
            sunday: { available: false },
          },
          lastUpdated: new Date(),
        },
      };

      expect(isAvailableOnDay(caregiver, 'monday')).toBe(true);
      expect(isAvailableOnDay(caregiver, 'tuesday')).toBe(false);
    });
  });

  describe('getStatusDisplay', () => {
    it('should return display info for each status', () => {
      const active = getStatusDisplay('ACTIVE');
      expect(active.label).toBe('Active');
      expect(active.color).toBe('green');
      
      const onboarding = getStatusDisplay('ONBOARDING');
      expect(onboarding.label).toBe('Onboarding');
      expect(onboarding.color).toBe('blue');
    });
  });

  describe('getComplianceStatusDisplay', () => {
    it('should return display info with icons', () => {
      const compliant = getComplianceStatusDisplay('COMPLIANT');
      expect(compliant.label).toBe('Compliant');
      expect(compliant.color).toBe('green');
      expect(compliant.icon).toBe('✓');
      
      const expired = getComplianceStatusDisplay('EXPIRED');
      expect(expired.label).toBe('Expired');
      expect(expired.color).toBe('red');
      expect(expired.icon).toBe('✕');
    });
  });

  describe('canBeAssignedToVisits', () => {
    it('should return true if eligible for assignments', () => {
      const caregiver = {
        status: 'ACTIVE' as const,
        employmentStatus: 'ACTIVE' as const,
        complianceStatus: 'COMPLIANT' as const,
      };
      
      expect(canBeAssignedToVisits(caregiver)).toBe(true);
    });

    it('should return false if any requirement not met', () => {
      expect(canBeAssignedToVisits({
        status: 'INACTIVE' as const,
        employmentStatus: 'ACTIVE' as const,
        complianceStatus: 'COMPLIANT' as const,
      })).toBe(false);
      
      expect(canBeAssignedToVisits({
        status: 'ACTIVE' as const,
        employmentStatus: 'TERMINATED' as const,
        complianceStatus: 'COMPLIANT' as const,
      })).toBe(false);
    });
  });

  describe('getAssignmentBlockers', () => {
    it('should list all blockers', () => {
      const expiredDate = subDays(new Date(), 10);
      const caregiver = {
        status: 'ON_LEAVE' as const,
        employmentStatus: 'ACTIVE' as const,
        complianceStatus: 'EXPIRED' as const,
        credentials: [
          {
            id: '1',
            type: 'CNA' as const,
            name: 'CNA License',
            issueDate: new Date('2020-01-01'),
            expirationDate: expiredDate,
            status: 'ACTIVE' as const,
          },
        ],
      };

      const blockers = getAssignmentBlockers(caregiver);
      expect(blockers.length).toBeGreaterThan(0);
      expect(blockers).toContain('Status is ON_LEAVE');
      expect(blockers).toContain('Compliance status is EXPIRED');
    });
  });

  describe('formatYearsOfService', () => {
    it('should format years correctly', () => {
      const threeYearsAgo = new Date();
      threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
      
      const formatted = formatYearsOfService(threeYearsAgo);
      expect(formatted).toBe('3 years');
    });

    it('should show months for less than 1 year', () => {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      const formatted = formatYearsOfService(sixMonthsAgo);
      expect(formatted).toBe('6 months');
    });

    it('should show "New hire" for very recent hires', () => {
      const yesterday = subDays(new Date(), 1);
      const formatted = formatYearsOfService(yesterday);
      expect(formatted).toBe('New hire');
    });
  });

  describe('isNewHire', () => {
    it('should return true for recent hires', () => {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      
      expect(isNewHire(oneMonthAgo)).toBe(true);
    });

    it('should return false for older hires', () => {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      
      expect(isNewHire(oneYearAgo)).toBe(false);
    });
  });

  describe('hasSkill', () => {
    const caregiver = {
      skills: [
        {
          id: '1',
          name: 'Personal Care',
          category: 'Clinical',
          proficiencyLevel: 'EXPERT' as const,
        },
        {
          id: '2',
          name: 'Meal Prep',
          category: 'Daily Living',
          proficiencyLevel: 'INTERMEDIATE' as const,
        },
      ],
    };

    it('should return true if has skill', () => {
      expect(hasSkill(caregiver, 'Personal Care')).toBe(true);
    });

    it('should return false if does not have skill', () => {
      expect(hasSkill(caregiver, 'Wound Care')).toBe(false);
    });

    it('should check proficiency level', () => {
      expect(hasSkill(caregiver, 'Personal Care', 'ADVANCED')).toBe(true);
      expect(hasSkill(caregiver, 'Meal Prep', 'EXPERT')).toBe(false);
    });
  });

  describe('compareCaregivers', () => {
    const cg1: Partial<Caregiver> = {
      id: '1',
      firstName: 'Alice',
      lastName: 'Anderson',
      employeeNumber: '1001',
      hireDate: new Date('2020-01-01'),
      reliabilityScore: 0.95,
    } as Caregiver;

    const cg2: Partial<Caregiver> = {
      id: '2',
      firstName: 'Bob',
      lastName: 'Smith',
      employeeNumber: '1002',
      hireDate: new Date('2021-01-01'),
      reliabilityScore: 0.88,
    } as Caregiver;

    it('should sort by name', () => {
      // Anderson comes before Smith
      expect(compareCaregivers(cg1 as Caregiver, cg2 as Caregiver, 'name')).toBeLessThan(0);
      expect(compareCaregivers(cg2 as Caregiver, cg1 as Caregiver, 'name')).toBeGreaterThan(0);
    });

    it('should sort by hire date', () => {
      // 2020 comes before 2021
      expect(compareCaregivers(cg1 as Caregiver, cg2 as Caregiver, 'hireDate')).toBeLessThan(0);
    });

    it('should sort by reliability score', () => {
      // Higher reliability (0.95) comes before lower (0.88) - descending order
      expect(compareCaregivers(cg1 as Caregiver, cg2 as Caregiver, 'reliability')).toBeLessThan(0);
    });
  });

  describe('filterByLanguages', () => {
    const caregivers: Partial<Caregiver>[] = [
      {
        id: '1',
        firstName: 'Alice',
        lastName: 'Smith',
        languages: ['English', 'Spanish'],
      } as Caregiver,
      {
        id: '2',
        firstName: 'Bob',
        lastName: 'Johnson',
        languages: ['English'],
      } as Caregiver,
      {
        id: '3',
        firstName: 'Carlos',
        lastName: 'Garcia',
        languages: ['English', 'Spanish', 'French'],
      } as Caregiver,
    ];

    it('should filter by required languages', () => {
      const spanishSpeakers = filterByLanguages(caregivers as Caregiver[], ['Spanish']);
      expect(spanishSpeakers).toHaveLength(2);
    });

    it('should require all languages', () => {
      const multiLingual = filterByLanguages(caregivers as Caregiver[], ['Spanish', 'French']);
      expect(multiLingual).toHaveLength(1);
      expect(multiLingual[0].firstName).toBe('Carlos');
    });
  });
});
