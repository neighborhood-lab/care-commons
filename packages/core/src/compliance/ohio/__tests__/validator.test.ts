/**
 * Ohio Compliance Validator Tests
 *
 * Tests Ohio-specific compliance validation covering:
 * - FBI+BCI Background Checks (5-year cycle)
 * - STNA Registry (2-year certification)
 * - HHA Training & Competency
 * - RN Supervision (14-day new, 60-day established)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { OhioComplianceValidator, OhioCredentials, OhioClientData } from '../validator.js';
import type {
  CaregiverCredentials,
  VisitDetails,
  ClientDetails,
} from '../../types/index.js';

describe('OhioComplianceValidator', () => {
  let validator: OhioComplianceValidator;

  beforeEach(() => {
    validator = new OhioComplianceValidator();
  });

  describe('FBI+BCI Background Check Validation', () => {
    it('should BLOCK assignment when no background check on file', async () => {
      const caregiver: CaregiverCredentials = {
        licenses: [],
        registryChecks: [],
        stateSpecificData: {
          ohio: {} as OhioCredentials,
        },
      };

      const visit: VisitDetails = {
        id: 'visit-1',
        clientId: 'client-1',
        serviceType: 'PERSONAL_CARE',
        scheduledStart: new Date(),
        scheduledEnd: new Date(),
        state: 'OH',
      };

      const client: ClientDetails = {
        id: 'client-1',
        state: 'OH',
      };

      const result = await validator.canAssignToVisit(caregiver, visit, client);

      expect(result.canProceed).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'OH_FBI_BCI_MISSING',
          severity: 'BLOCKING',
        })
      );
    });

    it('should BLOCK if background check is expired (>5 years)', async () => {
      const checkDate = new Date('2018-01-01'); // >5 years ago
      const expirationDate = new Date('2023-01-01'); // Expired

      const caregiver: CaregiverCredentials = {
        licenses: [],
        registryChecks: [],
        stateSpecificData: {
          ohio: {
            backgroundCheck: {
              type: 'FBI_BCI',
              checkDate,
              expirationDate,
              bciTrackingNumber: 'BCI-12345678',
              documentation: 'clearance.pdf',
              status: 'CLEAR',
            },
          } as OhioCredentials,
        },
      };

      const visit: VisitDetails = {
        id: 'visit-1',
        clientId: 'client-1',
        serviceType: 'PERSONAL_CARE',
        scheduledStart: new Date(),
        scheduledEnd: new Date(),
        state: 'OH',
      };

      const client: ClientDetails = {
        id: 'client-1',
        state: 'OH',
      };

      const result = await validator.canAssignToVisit(caregiver, visit, client);

      expect(result.canProceed).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'OH_BACKGROUND_EXPIRED',
          severity: 'BLOCKING',
        })
      );
    });

    it('should WARN if background check expires within 60 days', async () => {
      const checkDate = new Date();
      checkDate.setFullYear(checkDate.getFullYear() - 4);
      checkDate.setMonth(checkDate.getMonth() - 10); // ~4 years 10 months ago

      const expirationDate = new Date(checkDate);
      expirationDate.setFullYear(expirationDate.getFullYear() + 5); // Expires in ~2 months

      const caregiver: CaregiverCredentials = {
        licenses: [],
        registryChecks: [],
        stateSpecificData: {
          ohio: {
            backgroundCheck: {
              type: 'FBI_BCI',
              checkDate,
              expirationDate,
              bciTrackingNumber: 'BCI-12345678',
              documentation: 'clearance.pdf',
              status: 'CLEAR',
            },
          } as OhioCredentials,
        },
      };

      const visit: VisitDetails = {
        id: 'visit-1',
        clientId: 'client-1',
        serviceType: 'PERSONAL_CARE',
        scheduledStart: new Date(),
        scheduledEnd: new Date(),
        state: 'OH',
      };

      const client: ClientDetails = {
        id: 'client-1',
        state: 'OH',
      };

      const result = await validator.canAssignToVisit(caregiver, visit, client);

      expect(result.canProceed).toBe(true); // Not blocking
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'OH_BACKGROUND_EXPIRING',
          severity: 'WARNING',
        })
      );
    });

    it('should BLOCK if background check status is PENDING', async () => {
      const checkDate = new Date();
      const expirationDate = new Date();
      expirationDate.setFullYear(expirationDate.getFullYear() + 5);

      const caregiver: CaregiverCredentials = {
        licenses: [],
        registryChecks: [],
        stateSpecificData: {
          ohio: {
            backgroundCheck: {
              type: 'FBI_BCI',
              checkDate,
              expirationDate,
              bciTrackingNumber: 'BCI-12345678',
              documentation: 'clearance.pdf',
              status: 'PENDING',
            },
          } as OhioCredentials,
        },
      };

      const visit: VisitDetails = {
        id: 'visit-1',
        clientId: 'client-1',
        serviceType: 'PERSONAL_CARE',
        scheduledStart: new Date(),
        scheduledEnd: new Date(),
        state: 'OH',
      };

      const client: ClientDetails = {
        id: 'client-1',
        state: 'OH',
      };

      const result = await validator.canAssignToVisit(caregiver, visit, client);

      expect(result.canProceed).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'OH_BACKGROUND_PENDING',
          severity: 'BLOCKING',
        })
      );
    });

    it('should BLOCK if background check has ISSUES', async () => {
      const checkDate = new Date();
      const expirationDate = new Date();
      expirationDate.setFullYear(expirationDate.getFullYear() + 5);

      const caregiver: CaregiverCredentials = {
        licenses: [],
        registryChecks: [],
        stateSpecificData: {
          ohio: {
            backgroundCheck: {
              type: 'FBI_BCI',
              checkDate,
              expirationDate,
              bciTrackingNumber: 'BCI-12345678',
              documentation: 'clearance.pdf',
              status: 'ISSUES',
            },
          } as OhioCredentials,
        },
      };

      const visit: VisitDetails = {
        id: 'visit-1',
        clientId: 'client-1',
        serviceType: 'PERSONAL_CARE',
        scheduledStart: new Date(),
        scheduledEnd: new Date(),
        state: 'OH',
      };

      const client: ClientDetails = {
        id: 'client-1',
        state: 'OH',
      };

      const result = await validator.canAssignToVisit(caregiver, visit, client);

      expect(result.canProceed).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'OH_BACKGROUND_ISSUES',
          severity: 'BLOCKING',
        })
      );
    });
  });

  describe('STNA Registry Validation', () => {
    it('should BLOCK CNA assignment when no STNA number on file', async () => {
      const checkDate = new Date();
      const expirationDate = new Date();
      expirationDate.setFullYear(expirationDate.getFullYear() + 5);

      const caregiver: CaregiverCredentials = {
        licenses: [
          {
            type: 'CNA',
            state: 'OH',
            number: 'CNA123456',
            issueDate: new Date('2020-01-01'),
            expirationDate: new Date('2026-01-01'),
            status: 'ACTIVE',
          },
        ],
        registryChecks: [],
        stateSpecificData: {
          ohio: {
            backgroundCheck: {
              type: 'FBI_BCI',
              checkDate,
              expirationDate,
              bciTrackingNumber: 'BCI-12345678',
              documentation: 'clearance.pdf',
              status: 'CLEAR',
            },
            // Missing STNA number
          } as OhioCredentials,
        },
      };

      const visit: VisitDetails = {
        id: 'visit-1',
        clientId: 'client-1',
        serviceType: 'PERSONAL_CARE',
        scheduledStart: new Date(),
        scheduledEnd: new Date(),
        state: 'OH',
      };

      const client: ClientDetails = {
        id: 'client-1',
        state: 'OH',
      };

      const result = await validator.canAssignToVisit(caregiver, visit, client);

      expect(result.canProceed).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'OH_STNA_NUMBER_MISSING',
          severity: 'BLOCKING',
        })
      );
    });

    it('should BLOCK if STNA status is INACTIVE', async () => {
      const checkDate = new Date();
      const expirationDate = new Date();
      expirationDate.setFullYear(expirationDate.getFullYear() + 5);

      const caregiver: CaregiverCredentials = {
        licenses: [
          {
            type: 'CNA',
            state: 'OH',
            number: 'CNA123456',
            issueDate: new Date('2020-01-01'),
            expirationDate: new Date('2026-01-01'),
            status: 'ACTIVE',
          },
        ],
        registryChecks: [],
        stateSpecificData: {
          ohio: {
            backgroundCheck: {
              type: 'FBI_BCI',
              checkDate,
              expirationDate,
              bciTrackingNumber: 'BCI-12345678',
              documentation: 'clearance.pdf',
              status: 'CLEAR',
            },
            stnaNumber: 'STNA-123456',
            stnaStatus: 'INACTIVE',
          } as OhioCredentials,
        },
      };

      const visit: VisitDetails = {
        id: 'visit-1',
        clientId: 'client-1',
        serviceType: 'PERSONAL_CARE',
        scheduledStart: new Date(),
        scheduledEnd: new Date(),
        state: 'OH',
      };

      const client: ClientDetails = {
        id: 'client-1',
        state: 'OH',
      };

      const result = await validator.canAssignToVisit(caregiver, visit, client);

      expect(result.canProceed).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'OH_STNA_INACTIVE',
          severity: 'BLOCKING',
        })
      );
    });

    it('should BLOCK if STNA certification is expired', async () => {
      const checkDate = new Date();
      const expirationDate = new Date();
      expirationDate.setFullYear(expirationDate.getFullYear() + 5);

      const caregiver: CaregiverCredentials = {
        licenses: [
          {
            type: 'CNA',
            state: 'OH',
            number: 'CNA123456',
            issueDate: new Date('2020-01-01'),
            expirationDate: new Date('2026-01-01'),
            status: 'ACTIVE',
          },
        ],
        registryChecks: [],
        stateSpecificData: {
          ohio: {
            backgroundCheck: {
              type: 'FBI_BCI',
              checkDate,
              expirationDate,
              bciTrackingNumber: 'BCI-12345678',
              documentation: 'clearance.pdf',
              status: 'CLEAR',
            },
            stnaNumber: 'STNA-123456',
            stnaStatus: 'ACTIVE',
            stnaCertificationExpiration: new Date('2023-01-01'), // Expired
          } as OhioCredentials,
        },
      };

      const visit: VisitDetails = {
        id: 'visit-1',
        clientId: 'client-1',
        serviceType: 'PERSONAL_CARE',
        scheduledStart: new Date(),
        scheduledEnd: new Date(),
        state: 'OH',
      };

      const client: ClientDetails = {
        id: 'client-1',
        state: 'OH',
      };

      const result = await validator.canAssignToVisit(caregiver, visit, client);

      expect(result.canProceed).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'OH_STNA_CERT_EXPIRED',
          severity: 'BLOCKING',
        })
      );
    });
  });

  describe('HHA Training Validation', () => {
    it('should BLOCK HHA assignment when training not completed', async () => {
      const checkDate = new Date();
      const expirationDate = new Date();
      expirationDate.setFullYear(expirationDate.getFullYear() + 5);

      const caregiver: CaregiverCredentials = {
        licenses: [
          {
            type: 'HHA',
            state: 'OH',
            number: 'HHA123456',
            issueDate: new Date('2020-01-01'),
            expirationDate: new Date('2026-01-01'),
            status: 'ACTIVE',
          },
        ],
        registryChecks: [],
        stateSpecificData: {
          ohio: {
            backgroundCheck: {
              type: 'FBI_BCI',
              checkDate,
              expirationDate,
              bciTrackingNumber: 'BCI-12345678',
              documentation: 'clearance.pdf',
              status: 'CLEAR',
            },
            // Missing hhaTrainingCompletion
          } as OhioCredentials,
        },
      };

      const visit: VisitDetails = {
        id: 'visit-1',
        clientId: 'client-1',
        serviceType: 'PERSONAL_CARE',
        scheduledStart: new Date(),
        scheduledEnd: new Date(),
        state: 'OH',
      };

      const client: ClientDetails = {
        id: 'client-1',
        state: 'OH',
      };

      const result = await validator.canAssignToVisit(caregiver, visit, client);

      expect(result.canProceed).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'OH_HHA_TRAINING_MISSING',
          severity: 'BLOCKING',
        })
      );
    });

    it('should BLOCK if HHA competency check is overdue', async () => {
      const checkDate = new Date();
      const expirationDate = new Date();
      expirationDate.setFullYear(expirationDate.getFullYear() + 5);

      const lastCompetencyCheck = new Date();
      lastCompetencyCheck.setFullYear(lastCompetencyCheck.getFullYear() - 2); // 2 years ago

      const caregiver: CaregiverCredentials = {
        licenses: [
          {
            type: 'HHA',
            state: 'OH',
            number: 'HHA123456',
            issueDate: new Date('2020-01-01'),
            expirationDate: new Date('2026-01-01'),
            status: 'ACTIVE',
          },
        ],
        registryChecks: [],
        stateSpecificData: {
          ohio: {
            backgroundCheck: {
              type: 'FBI_BCI',
              checkDate,
              expirationDate,
              bciTrackingNumber: 'BCI-12345678',
              documentation: 'clearance.pdf',
              status: 'CLEAR',
            },
            hhaTrainingCompletion: new Date('2020-01-01'),
            hhaCompetencyStatus: 'PASSED',
            lastCompetencyCheck,
          } as OhioCredentials,
        },
      };

      const visit: VisitDetails = {
        id: 'visit-1',
        clientId: 'client-1',
        serviceType: 'PERSONAL_CARE',
        scheduledStart: new Date(),
        scheduledEnd: new Date(),
        state: 'OH',
      };

      const client: ClientDetails = {
        id: 'client-1',
        state: 'OH',
      };

      const result = await validator.canAssignToVisit(caregiver, visit, client);

      expect(result.canProceed).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'OH_HHA_COMPETENCY_OVERDUE',
          severity: 'BLOCKING',
        })
      );
    });
  });

  describe('RN Supervision Validation', () => {
    it('should BLOCK if new client RN supervision is overdue (>14 days)', async () => {
      const checkDate = new Date();
      const expirationDate = new Date();
      expirationDate.setFullYear(expirationDate.getFullYear() + 5);

      const caregiver: CaregiverCredentials = {
        licenses: [],
        registryChecks: [],
        stateSpecificData: {
          ohio: {
            backgroundCheck: {
              type: 'FBI_BCI',
              checkDate,
              expirationDate,
              bciTrackingNumber: 'BCI-12345678',
              documentation: 'clearance.pdf',
              status: 'CLEAR',
            },
          } as OhioCredentials,
        },
      };

      const visit: VisitDetails = {
        id: 'visit-1',
        clientId: 'client-1',
        serviceType: 'PERSONAL_CARE',
        scheduledStart: new Date(),
        scheduledEnd: new Date(),
        state: 'OH',
      };

      const lastRNVisit = new Date();
      lastRNVisit.setDate(lastRNVisit.getDate() - 20); // 20 days ago

      const client: ClientDetails = {
        id: 'client-1',
        state: 'OH',
        stateSpecificData: {
          ohio: {
            isNewClient: true,
            lastRNSupervisionVisit: lastRNVisit,
          } as OhioClientData,
        },
      };

      const result = await validator.canAssignToVisit(caregiver, visit, client);

      expect(result.canProceed).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'OH_RN_SUPERVISION_14DAY_OVERDUE',
          severity: 'BLOCKING',
        })
      );
    });

    it('should BLOCK if established client RN supervision is overdue (>60 days)', async () => {
      const checkDate = new Date();
      const expirationDate = new Date();
      expirationDate.setFullYear(expirationDate.getFullYear() + 5);

      const caregiver: CaregiverCredentials = {
        licenses: [],
        registryChecks: [],
        stateSpecificData: {
          ohio: {
            backgroundCheck: {
              type: 'FBI_BCI',
              checkDate,
              expirationDate,
              bciTrackingNumber: 'BCI-12345678',
              documentation: 'clearance.pdf',
              status: 'CLEAR',
            },
          } as OhioCredentials,
        },
      };

      const visit: VisitDetails = {
        id: 'visit-1',
        clientId: 'client-1',
        serviceType: 'PERSONAL_CARE',
        scheduledStart: new Date(),
        scheduledEnd: new Date(),
        state: 'OH',
      };

      const lastRNVisit = new Date();
      lastRNVisit.setDate(lastRNVisit.getDate() - 70); // 70 days ago

      const client: ClientDetails = {
        id: 'client-1',
        state: 'OH',
        stateSpecificData: {
          ohio: {
            isNewClient: false,
            lastRNSupervisionVisit: lastRNVisit,
          } as OhioClientData,
        },
      };

      const result = await validator.canAssignToVisit(caregiver, visit, client);

      expect(result.canProceed).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'OH_RN_SUPERVISION_60DAY_OVERDUE',
          severity: 'BLOCKING',
        })
      );
    });
  });

  describe('Regulation Citations', () => {
    it('should return correct background regulation citation', () => {
      expect(validator['getBackgroundRegulation']()).toContain('Ohio Revised Code');
    });

    it('should return correct licensure regulation citation', () => {
      expect(validator['getLicensureRegulation']()).toContain('Ohio');
    });

    it('should return correct STNA registry regulation citation', () => {
      expect(validator['getRegistryRegulation']('NURSE_AIDE')).toContain('§3721.30');
    });
  });
});
