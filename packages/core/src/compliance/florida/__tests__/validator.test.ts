/**
 * Florida Compliance Validator Tests
 *
 * Tests Florida-specific compliance validation covering:
 * - Level 2 Background Screening (5-year cycle)
 * - Professional Licensure
 * - HIV/AIDS Training (mandatory)
 * - RN Supervision Assignment
 * - Plan of Care Review
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { FloridaComplianceValidator, FloridaCredentials, FloridaClientData } from '../validator';
import type {
  CaregiverCredentials,
  VisitDetails,
  ClientDetails,
} from '../../types/index';

describe('FloridaComplianceValidator', () => {
  let validator: FloridaComplianceValidator;

  beforeEach(() => {
    validator = new FloridaComplianceValidator();
  });

  describe('Level 2 Background Screening', () => {
    it('should BLOCK if no Level 2 screening on file', async () => {
      const caregiver: CaregiverCredentials = {
        licenses: [],
        registryChecks: [],
        stateSpecificData: {
          florida: {} as FloridaCredentials, // Missing Level 2 screening
        },
      };

      const visit: VisitDetails = {
        id: 'visit-1',
        clientId: 'client-1',
        serviceType: 'PERSONAL_CARE',
        scheduledStart: new Date(),
        scheduledEnd: new Date(),
        state: 'FL',
      };

      const client: ClientDetails = {
        id: 'client-1',
        state: 'FL',
      };

      const result = await validator.canAssignToVisit(caregiver, visit, client);

      expect(result.canProceed).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'FL_LEVEL2_SCREENING_MISSING',
          severity: 'BLOCKING',
        })
      );
    });

    it('should BLOCK if Level 2 screening is DISQUALIFIED', async () => {
      const caregiver: CaregiverCredentials = {
        licenses: [],
        registryChecks: [],
        stateSpecificData: {
          florida: {
            level2ScreeningDate: new Date(),
            level2ScreeningExpiration: new Date(Date.now() + 365 * 5 * 24 * 60 * 60 * 1000),
            level2ScreeningStatus: 'DISQUALIFIED',
            level2ScreeningId: 'AHCA-123456',
          } as FloridaCredentials,
        },
      };

      const visit: VisitDetails = {
        id: 'visit-1',
        clientId: 'client-1',
        serviceType: 'PERSONAL_CARE',
        scheduledStart: new Date(),
        scheduledEnd: new Date(),
        state: 'FL',
      };

      const client: ClientDetails = {
        id: 'client-1',
        state: 'FL',
      };

      const result = await validator.canAssignToVisit(caregiver, visit, client);

      expect(result.canProceed).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'FL_LEVEL2_DISQUALIFIED',
          severity: 'BLOCKING',
        })
      );
    });

    it('should BLOCK if Level 2 screening is PENDING', async () => {
      const caregiver: CaregiverCredentials = {
        licenses: [],
        registryChecks: [],
        stateSpecificData: {
          florida: {
            level2ScreeningDate: new Date(),
            level2ScreeningExpiration: new Date(Date.now() + 365 * 5 * 24 * 60 * 60 * 1000),
            level2ScreeningStatus: 'PENDING',
            level2ScreeningId: 'AHCA-123456',
          } as FloridaCredentials,
        },
      };

      const visit: VisitDetails = {
        id: 'visit-1',
        clientId: 'client-1',
        serviceType: 'PERSONAL_CARE',
        scheduledStart: new Date(),
        scheduledEnd: new Date(),
        state: 'FL',
      };

      const client: ClientDetails = {
        id: 'client-1',
        state: 'FL',
      };

      const result = await validator.canAssignToVisit(caregiver, visit, client);

      expect(result.canProceed).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'FL_LEVEL2_PENDING',
          severity: 'BLOCKING',
        })
      );
    });

    it('should BLOCK if Level 2 screening is expired', async () => {
      const caregiver: CaregiverCredentials = {
        licenses: [],
        registryChecks: [],
        stateSpecificData: {
          florida: {
            level2ScreeningDate: new Date('2018-01-01'),
            level2ScreeningExpiration: new Date('2023-01-01'), // Expired
            level2ScreeningStatus: 'CLEARED',
            level2ScreeningId: 'AHCA-123456',
          } as FloridaCredentials,
        },
      };

      const visit: VisitDetails = {
        id: 'visit-1',
        clientId: 'client-1',
        serviceType: 'PERSONAL_CARE',
        scheduledStart: new Date(),
        scheduledEnd: new Date(),
        state: 'FL',
      };

      const client: ClientDetails = {
        id: 'client-1',
        state: 'FL',
      };

      const result = await validator.canAssignToVisit(caregiver, visit, client);

      expect(result.canProceed).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'FL_LEVEL2_EXPIRED',
          severity: 'BLOCKING',
        })
      );
    });

    it('should WARN if Level 2 screening expires soon', async () => {
      const today = new Date();
      const screeningDate = new Date(today);
      screeningDate.setDate(screeningDate.getDate() - (365 * 5 - 50)); // 5 years ago minus 50 days

      const expirationDate = new Date(screeningDate);
      expirationDate.setDate(expirationDate.getDate() + (365 * 5)); // Expires in ~50 days

      const licenseExpiration = new Date(today);
      licenseExpiration.setDate(licenseExpiration.getDate() + 200); // License expires in 200 days (not soon)

      const caregiver: CaregiverCredentials = {
        backgroundScreening: {
          type: 'LEVEL_2',
          checkDate: screeningDate,
          expirationDate,
          status: 'CLEAR',
        },
        licenses: [
          {
            type: 'CNA',
            state: 'FL',
            number: 'CNA123456',
            issueDate: new Date('2020-01-01'),
            expirationDate: licenseExpiration,
            status: 'ACTIVE',
          },
        ],
        registryChecks: [],
        stateSpecificData: {
          florida: {
            level2ScreeningDate: screeningDate,
            level2ScreeningExpiration: expirationDate,
            level2ScreeningStatus: 'CLEARED',
            level2ScreeningId: 'AHCA-123456',
            hivAidsTrainingCompleted: true,
          } as FloridaCredentials,
        },
      };

      const visit: VisitDetails = {
        id: 'visit-1',
        clientId: 'client-1',
        serviceType: 'PERSONAL_CARE',
        scheduledStart: new Date(),
        scheduledEnd: new Date(),
        state: 'FL',
      };

      const client: ClientDetails = {
        id: 'client-1',
        state: 'FL',
      };

      const result = await validator.canAssignToVisit(caregiver, visit, client);

      expect(result.canProceed).toBe(true); // Not blocking
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'FL_LEVEL2_EXPIRING',
          severity: 'WARNING',
        })
      );
    });
  });

  describe('Professional Licensure', () => {
    it('should BLOCK if no active Florida license on file', async () => {
      const caregiver: CaregiverCredentials = {
        licenses: [], // No licenses
        registryChecks: [],
        stateSpecificData: {
          florida: {
            level2ScreeningDate: new Date(),
            level2ScreeningExpiration: new Date(Date.now() + 365 * 5 * 24 * 60 * 60 * 1000),
            level2ScreeningStatus: 'CLEARED',
            level2ScreeningId: 'AHCA-123456',
          } as FloridaCredentials,
        },
      };

      const visit: VisitDetails = {
        id: 'visit-1',
        clientId: 'client-1',
        serviceType: 'PERSONAL_CARE',
        scheduledStart: new Date(),
        scheduledEnd: new Date(),
        state: 'FL',
      };

      const client: ClientDetails = {
        id: 'client-1',
        state: 'FL',
      };

      const result = await validator.canAssignToVisit(caregiver, visit, client);

      expect(result.canProceed).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'FL_LICENSE_MISSING',
          severity: 'BLOCKING',
        })
      );
    });

    it('should BLOCK if Florida license is INACTIVE', async () => {
      const caregiver: CaregiverCredentials = {
        licenses: [
          {
            type: 'CNA',
            state: 'FL',
            number: 'CNA123456',
            issueDate: new Date('2020-01-01'),
            expirationDate: new Date('2026-01-01'),
            status: 'INACTIVE',
          },
        ],
        registryChecks: [],
        stateSpecificData: {
          florida: {
            level2ScreeningDate: new Date(),
            level2ScreeningExpiration: new Date(Date.now() + 365 * 5 * 24 * 60 * 60 * 1000),
            level2ScreeningStatus: 'CLEARED',
            level2ScreeningId: 'AHCA-123456',
          } as FloridaCredentials,
        },
      };

      const visit: VisitDetails = {
        id: 'visit-1',
        clientId: 'client-1',
        serviceType: 'PERSONAL_CARE',
        scheduledStart: new Date(),
        scheduledEnd: new Date(),
        state: 'FL',
      };

      const client: ClientDetails = {
        id: 'client-1',
        state: 'FL',
      };

      const result = await validator.canAssignToVisit(caregiver, visit, client);

      expect(result.canProceed).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'FL_LICENSE_INACTIVE',
          severity: 'BLOCKING',
        })
      );
    });

    it('should BLOCK if Florida license is expired', async () => {
      const caregiver: CaregiverCredentials = {
        licenses: [
          {
            type: 'CNA',
            state: 'FL',
            number: 'CNA123456',
            issueDate: new Date('2020-01-01'),
            expirationDate: new Date('2023-01-01'), // Expired
            status: 'ACTIVE',
          },
        ],
        registryChecks: [],
        stateSpecificData: {
          florida: {
            level2ScreeningDate: new Date(),
            level2ScreeningExpiration: new Date(Date.now() + 365 * 5 * 24 * 60 * 60 * 1000),
            level2ScreeningStatus: 'CLEARED',
            level2ScreeningId: 'AHCA-123456',
          } as FloridaCredentials,
        },
      };

      const visit: VisitDetails = {
        id: 'visit-1',
        clientId: 'client-1',
        serviceType: 'PERSONAL_CARE',
        scheduledStart: new Date(),
        scheduledEnd: new Date(),
        state: 'FL',
      };

      const client: ClientDetails = {
        id: 'client-1',
        state: 'FL',
      };

      const result = await validator.canAssignToVisit(caregiver, visit, client);

      expect(result.canProceed).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'FL_LICENSE_EXPIRED',
          severity: 'BLOCKING',
        })
      );
    });
  });

  describe('HIV/AIDS Training', () => {
    it('should BLOCK if HIV/AIDS training not completed', async () => {
      const caregiver: CaregiverCredentials = {
        licenses: [
          {
            type: 'CNA',
            state: 'FL',
            number: 'CNA123456',
            issueDate: new Date('2020-01-01'),
            expirationDate: new Date('2026-01-01'),
            status: 'ACTIVE',
          },
        ],
        registryChecks: [],
        stateSpecificData: {
          florida: {
            level2ScreeningDate: new Date(),
            level2ScreeningExpiration: new Date(Date.now() + 365 * 5 * 24 * 60 * 60 * 1000),
            level2ScreeningStatus: 'CLEARED',
            level2ScreeningId: 'AHCA-123456',
            hivAidsTrainingCompleted: false, // Not completed
          } as FloridaCredentials,
        },
      };

      const visit: VisitDetails = {
        id: 'visit-1',
        clientId: 'client-1',
        serviceType: 'PERSONAL_CARE',
        scheduledStart: new Date(),
        scheduledEnd: new Date(),
        state: 'FL',
      };

      const client: ClientDetails = {
        id: 'client-1',
        state: 'FL',
      };

      const result = await validator.canAssignToVisit(caregiver, visit, client);

      expect(result.canProceed).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'FL_HIV_AIDS_TRAINING_MISSING',
          severity: 'BLOCKING',
        })
      );
    });
  });

  describe('Plan of Care Review', () => {
    it('should BLOCK if POC review is overdue', async () => {
      const caregiver: CaregiverCredentials = {
        licenses: [
          {
            type: 'CNA',
            state: 'FL',
            number: 'CNA123456',
            issueDate: new Date('2020-01-01'),
            expirationDate: new Date('2026-01-01'),
            status: 'ACTIVE',
          },
        ],
        registryChecks: [],
        stateSpecificData: {
          florida: {
            level2ScreeningDate: new Date(),
            level2ScreeningExpiration: new Date(Date.now() + 365 * 5 * 24 * 60 * 60 * 1000),
            level2ScreeningStatus: 'CLEARED',
            level2ScreeningId: 'AHCA-123456',
            hivAidsTrainingCompleted: true,
          } as FloridaCredentials,
        },
      };

      const visit: VisitDetails = {
        id: 'visit-1',
        clientId: 'client-1',
        serviceType: 'PERSONAL_CARE',
        scheduledStart: new Date(),
        scheduledEnd: new Date(),
        state: 'FL',
      };

      const pocReviewDue = new Date();
      pocReviewDue.setDate(pocReviewDue.getDate() - 30); // 30 days overdue

      const client: ClientDetails = {
        id: 'client-1',
        state: 'FL',
        stateSpecificData: {
          florida: {
            pocNextReviewDue: pocReviewDue,
            pocReviewFrequency: 60,
          } as FloridaClientData,
        },
      };

      const result = await validator.canAssignToVisit(caregiver, visit, client);

      expect(result.canProceed).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'FL_POC_REVIEW_OVERDUE',
          severity: 'BLOCKING',
        })
      );
    });

    it('should BLOCK if RN supervision is overdue (>60 days)', async () => {
      const caregiver: CaregiverCredentials = {
        licenses: [
          {
            type: 'CNA',
            state: 'FL',
            number: 'CNA123456',
            issueDate: new Date('2020-01-01'),
            expirationDate: new Date('2026-01-01'),
            status: 'ACTIVE',
          },
        ],
        registryChecks: [],
        stateSpecificData: {
          florida: {
            level2ScreeningDate: new Date(),
            level2ScreeningExpiration: new Date(Date.now() + 365 * 5 * 24 * 60 * 60 * 1000),
            level2ScreeningStatus: 'CLEARED',
            level2ScreeningId: 'AHCA-123456',
            hivAidsTrainingCompleted: true,
          } as FloridaCredentials,
        },
      };

      const visit: VisitDetails = {
        id: 'visit-1',
        clientId: 'client-1',
        serviceType: 'PERSONAL_CARE',
        scheduledStart: new Date(),
        scheduledEnd: new Date(),
        state: 'FL',
      };

      const lastRNVisit = new Date();
      lastRNVisit.setDate(lastRNVisit.getDate() - 70); // 70 days ago

      const client: ClientDetails = {
        id: 'client-1',
        state: 'FL',
        stateSpecificData: {
          florida: {
            lastRNSupervisoryVisit: lastRNVisit,
          } as FloridaClientData,
        },
      };

      const result = await validator.canAssignToVisit(caregiver, visit, client);

      expect(result.canProceed).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'FL_RN_SUPERVISION_OVERDUE',
          severity: 'BLOCKING',
        })
      );
    });
  });

  describe('Regulation Citations', () => {
    it('should return correct background regulation citation', () => {
      expect(validator['getBackgroundRegulation']()).toContain('Florida Statutes');
    });

    it('should return correct licensure regulation citation', () => {
      expect(validator['getLicensureRegulation']()).toContain('59A-8.0095');
    });
  });
});
