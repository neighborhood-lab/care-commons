/**
 * Texas Compliance Validator Tests
 *
 * Tests Texas-specific compliance validation covering:
 * - Employee Misconduct Registry (permanent disqualification)
 * - Nurse Aide Registry
 * - HHSC Orientation (mandatory)
 * - EVV Enrollment
 * - STAR+PLUS Emergency Plan
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TexasComplianceValidator, TexasCredentials, TexasClientData } from '../validator';
import type {
  CaregiverCredentials,
  VisitDetails,
  ClientDetails,
} from '../../types/index';

describe('TexasComplianceValidator', () => {
  let validator: TexasComplianceValidator;

  beforeEach(() => {
    validator = new TexasComplianceValidator();
  });

  describe('Employee Misconduct Registry (EMR)', () => {
    it('should BLOCK if no EMR check on file', async () => {
      const caregiver: CaregiverCredentials = {
        backgroundScreening: {
          type: 'LEVEL_2',
          checkDate: new Date(),
          status: 'CLEAR',
          expirationDate: new Date(Date.now() + 365 * 2 * 24 * 60 * 60 * 1000),
        },
        licenses: [],
        registryChecks: [],
        stateSpecificData: {
          texas: {} as TexasCredentials, // Missing EMR check
        },
      };

      const visit: VisitDetails = {
        id: 'visit-1',
        clientId: 'client-1',
        serviceType: 'PERSONAL_CARE',
        scheduledStart: new Date(),
        scheduledEnd: new Date(),
        state: 'TX',
      };

      const client: ClientDetails = {
        id: 'client-1',
        state: 'TX',
      };

      const result = await validator.canAssignToVisit(caregiver, visit, client);

      expect(result.canProceed).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'TX_EMR_CHECK_MISSING',
          severity: 'BLOCKING',
        })
      );
    });

    it('should PERMANENTLY BLOCK if listed on EMR', async () => {
      const caregiver: CaregiverCredentials = {
        backgroundScreening: {
          type: 'LEVEL_2',
          checkDate: new Date(),
          status: 'CLEAR',
          expirationDate: new Date(Date.now() + 365 * 2 * 24 * 60 * 60 * 1000),
        },
        licenses: [],
        registryChecks: [],
        stateSpecificData: {
          texas: {
            emrCheckDate: new Date(),
            emrStatus: 'LISTED', // PERMANENT disqualification
            emrListingDetails: 'Client abuse substantiated 2020-05-15',
          } as TexasCredentials,
        },
      };

      const visit: VisitDetails = {
        id: 'visit-1',
        clientId: 'client-1',
        serviceType: 'PERSONAL_CARE',
        scheduledStart: new Date(),
        scheduledEnd: new Date(),
        state: 'TX',
      };

      const client: ClientDetails = {
        id: 'client-1',
        state: 'TX',
      };

      const result = await validator.canAssignToVisit(caregiver, visit, client);

      expect(result.canProceed).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'TX_EMR_LISTED',
          severity: 'BLOCKING',
          message: expect.stringContaining('PERMANENT DISQUALIFICATION'),
        })
      );
    });

    it('should ALLOW if EMR check is CLEAR', async () => {
      const caregiver: CaregiverCredentials = {
        backgroundScreening: {
          type: 'LEVEL_2',
          checkDate: new Date(),
          status: 'CLEAR',
          expirationDate: new Date(Date.now() + 365 * 2 * 24 * 60 * 60 * 1000),
        },
        licenses: [],
        registryChecks: [],
        stateSpecificData: {
          texas: {
            emrCheckDate: new Date(),
            emrStatus: 'CLEAR', // Good standing
            hhscOrientationCompleted: true,
          } as TexasCredentials,
        },
      };

      const visit: VisitDetails = {
        id: 'visit-1',
        clientId: 'client-1',
        serviceType: 'PERSONAL_CARE',
        scheduledStart: new Date(),
        scheduledEnd: new Date(),
        state: 'TX',
      };

      const client: ClientDetails = {
        id: 'client-1',
        state: 'TX',
      };

      const result = await validator.canAssignToVisit(caregiver, visit, client);

      // May have other issues, but not EMR-related
      const emrIssues = result.issues.filter(i => i.type.startsWith('TX_EMR'));
      expect(emrIssues).toHaveLength(0);
    });

    it('should BLOCK if EMR check is stale (>1 year)', async () => {
      const emrCheckDate = new Date();
      emrCheckDate.setFullYear(emrCheckDate.getFullYear() - 2); // 2 years ago

      const caregiver: CaregiverCredentials = {
        backgroundScreening: {
          type: 'LEVEL_2',
          checkDate: new Date(),
          status: 'CLEAR',
          expirationDate: new Date(Date.now() + 365 * 2 * 24 * 60 * 60 * 1000),
        },
        licenses: [],
        registryChecks: [],
        stateSpecificData: {
          texas: {
            emrCheckDate,
            emrStatus: 'CLEAR',
          } as TexasCredentials,
        },
      };

      const visit: VisitDetails = {
        id: 'visit-1',
        clientId: 'client-1',
        serviceType: 'PERSONAL_CARE',
        scheduledStart: new Date(),
        scheduledEnd: new Date(),
        state: 'TX',
      };

      const client: ClientDetails = {
        id: 'client-1',
        state: 'TX',
      };

      const result = await validator.canAssignToVisit(caregiver, visit, client);

      expect(result.canProceed).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'TX_EMR_CHECK_EXPIRED',
          severity: 'BLOCKING',
        })
      );
    });
  });

  describe('Nurse Aide Registry (NAR)', () => {
    it('should BLOCK CNA if no NAR number', async () => {
      const caregiver: CaregiverCredentials = {
        backgroundScreening: {
          type: 'LEVEL_2',
          checkDate: new Date(),
          status: 'CLEAR',
          expirationDate: new Date(Date.now() + 365 * 2 * 24 * 60 * 60 * 1000),
        },
        licenses: [
          {
            type: 'CNA',
            state: 'TX',
            number: 'CNA123456',
            issueDate: new Date('2020-01-01'),
            expirationDate: new Date('2026-01-01'),
            status: 'ACTIVE',
          },
        ],
        registryChecks: [],
        stateSpecificData: {
          texas: {
            emrCheckDate: new Date(),
            emrStatus: 'CLEAR',
            hhscOrientationCompleted: true,
            // Missing narNumber
          } as TexasCredentials,
        },
      };

      const visit: VisitDetails = {
        id: 'visit-1',
        clientId: 'client-1',
        serviceType: 'PERSONAL_CARE',
        scheduledStart: new Date(),
        scheduledEnd: new Date(),
        state: 'TX',
      };

      const client: ClientDetails = {
        id: 'client-1',
        state: 'TX',
      };

      const result = await validator.canAssignToVisit(caregiver, visit, client);

      expect(result.canProceed).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'TX_NAR_NUMBER_MISSING',
          severity: 'BLOCKING',
        })
      );
    });

    it('should BLOCK if NAR status is not ACTIVE', async () => {
      const caregiver: CaregiverCredentials = {
        backgroundScreening: {
          type: 'LEVEL_2',
          checkDate: new Date(),
          status: 'CLEAR',
          expirationDate: new Date(Date.now() + 365 * 2 * 24 * 60 * 60 * 1000),
        },
        licenses: [
          {
            type: 'CNA',
            state: 'TX',
            number: 'CNA123456',
            issueDate: new Date('2020-01-01'),
            expirationDate: new Date('2026-01-01'),
            status: 'ACTIVE',
          },
        ],
        registryChecks: [],
        stateSpecificData: {
          texas: {
            emrCheckDate: new Date(),
            emrStatus: 'CLEAR',
            hhscOrientationCompleted: true,
            narNumber: 'NAR-123456',
            narStatus: 'EXPIRED',
          } as TexasCredentials,
        },
      };

      const visit: VisitDetails = {
        id: 'visit-1',
        clientId: 'client-1',
        serviceType: 'PERSONAL_CARE',
        scheduledStart: new Date(),
        scheduledEnd: new Date(),
        state: 'TX',
      };

      const client: ClientDetails = {
        id: 'client-1',
        state: 'TX',
      };

      const result = await validator.canAssignToVisit(caregiver, visit, client);

      expect(result.canProceed).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'TX_NAR_INACTIVE',
          severity: 'BLOCKING',
        })
      );
    });
  });

  describe('HHSC Orientation', () => {
    it('should BLOCK if HHSC orientation not completed', async () => {
      const caregiver: CaregiverCredentials = {
        backgroundScreening: {
          type: 'LEVEL_2',
          checkDate: new Date(),
          status: 'CLEAR',
          expirationDate: new Date(Date.now() + 365 * 2 * 24 * 60 * 60 * 1000),
        },
        licenses: [],
        registryChecks: [],
        stateSpecificData: {
          texas: {
            emrCheckDate: new Date(),
            emrStatus: 'CLEAR',
            hhscOrientationCompleted: false,
          } as TexasCredentials,
        },
      };

      const visit: VisitDetails = {
        id: 'visit-1',
        clientId: 'client-1',
        serviceType: 'PERSONAL_CARE',
        scheduledStart: new Date(),
        scheduledEnd: new Date(),
        state: 'TX',
      };

      const client: ClientDetails = {
        id: 'client-1',
        state: 'TX',
      };

      const result = await validator.canAssignToVisit(caregiver, visit, client);

      expect(result.canProceed).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'TX_HHSC_ORIENTATION_MISSING',
          severity: 'BLOCKING',
        })
      );
    });
  });

  describe('STAR+PLUS Emergency Plan', () => {
    it('should BLOCK if STAR+PLUS client has no emergency plan', async () => {
      const caregiver: CaregiverCredentials = {
        backgroundScreening: {
          type: 'LEVEL_2',
          checkDate: new Date(),
          status: 'CLEAR',
          expirationDate: new Date(Date.now() + 365 * 2 * 24 * 60 * 60 * 1000),
        },
        licenses: [],
        registryChecks: [],
        stateSpecificData: {
          texas: {
            emrCheckDate: new Date(),
            emrStatus: 'CLEAR',
            hhscOrientationCompleted: true,
          } as TexasCredentials,
        },
      };

      const visit: VisitDetails = {
        id: 'visit-1',
        clientId: 'client-1',
        serviceType: 'PERSONAL_CARE',
        scheduledStart: new Date(),
        scheduledEnd: new Date(),
        state: 'TX',
      };

      const client: ClientDetails = {
        id: 'client-1',
        state: 'TX',
        stateSpecificData: {
          texas: {
            medicaidProgram: 'STAR_PLUS',
            emergencyPlanOnFile: false, // Missing required plan
          } as TexasClientData,
        },
      };

      const result = await validator.canAssignToVisit(caregiver, visit, client);

      expect(result.canProceed).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'TX_EMERGENCY_PLAN_MISSING',
          severity: 'BLOCKING',
        })
      );
    });

    it('should WARN if emergency plan is outdated', async () => {
      const planDate = new Date();
      planDate.setFullYear(planDate.getFullYear() - 2); // 2 years ago

      const caregiver: CaregiverCredentials = {
        backgroundScreening: {
          type: 'LEVEL_2',
          checkDate: new Date(),
          status: 'CLEAR',
          expirationDate: new Date(Date.now() + 365 * 2 * 24 * 60 * 60 * 1000),
        },
        licenses: [],
        registryChecks: [],
        stateSpecificData: {
          texas: {
            emrCheckDate: new Date(),
            emrStatus: 'CLEAR',
            hhscOrientationCompleted: true,
          } as TexasCredentials,
        },
      };

      const visit: VisitDetails = {
        id: 'visit-1',
        clientId: 'client-1',
        serviceType: 'PERSONAL_CARE',
        scheduledStart: new Date(),
        scheduledEnd: new Date(),
        state: 'TX',
      };

      const client: ClientDetails = {
        id: 'client-1',
        state: 'TX',
        stateSpecificData: {
          texas: {
            medicaidProgram: 'STAR_PLUS',
            emergencyPlanOnFile: true,
            emergencyPlanLastUpdated: planDate,
          } as TexasClientData,
        },
      };

      const result = await validator.canAssignToVisit(caregiver, visit, client);

      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'TX_EMERGENCY_PLAN_OUTDATED',
          severity: 'WARNING',
        })
      );
    });
  });

  describe('EVV Enrollment', () => {
    it('should BLOCK if caregiver not enrolled in EVV for EVV-required service', async () => {
      const caregiver: CaregiverCredentials = {
        backgroundScreening: {
          type: 'LEVEL_2',
          checkDate: new Date(),
          status: 'CLEAR',
          expirationDate: new Date(Date.now() + 365 * 2 * 24 * 60 * 60 * 1000),
        },
        licenses: [],
        registryChecks: [],
        stateSpecificData: {
          texas: {
            emrCheckDate: new Date(),
            emrStatus: 'CLEAR',
            hhscOrientationCompleted: true,
            evvEnrollmentStatus: 'INACTIVE',
          } as TexasCredentials,
        },
      };

      const visit: VisitDetails = {
        id: 'visit-1',
        clientId: 'client-1',
        serviceType: 'PERSONAL_CARE',
        scheduledStart: new Date(),
        scheduledEnd: new Date(),
        state: 'TX',
      };

      const client: ClientDetails = {
        id: 'client-1',
        state: 'TX',
        stateSpecificData: {
          texas: {
            authorizedServices: [
              {
                serviceCode: 'PC',
                authorizedUnits: 100,
                usedUnits: 20,
                authorizationNumber: 'AUTH-123',
                effectiveDate: new Date('2024-01-01'),
                expirationDate: new Date('2025-12-31'),
                requiresEVV: true,
              },
            ],
          } as TexasClientData,
        },
      };

      const result = await validator.canAssignToVisit(caregiver, visit, client);

      expect(result.canProceed).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'TX_EVV_NOT_ENROLLED',
          severity: 'BLOCKING',
        })
      );
    });
  });
});
