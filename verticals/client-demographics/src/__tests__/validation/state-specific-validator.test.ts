/**
 * Tests for StateSpecificClientValidator
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { StateSpecificClientValidator } from '../../validation/state-specific-validator';
import { StateSpecificClientData, TexasClientData, FloridaClientData } from '../../types/client';

describe('StateSpecificClientValidator', () => {
  let validator: StateSpecificClientValidator;

  beforeEach(() => {
    validator = new StateSpecificClientValidator();
  });

  describe('validateStateSpecific', () => {
    it('should validate valid Texas data successfully', () => {
      const validTexasData: StateSpecificClientData = {
        state: 'TX',
        texas: {
          emergencyPlanOnFile: true,
          authorizedServices: [],
        } as TexasClientData,
      };

      const result = validator.validateStateSpecific(validTexasData);

      expect(result.success).toBe(true);
    });

    it('should validate valid Florida data successfully', () => {
      const validFloridaData: StateSpecificClientData = {
        state: 'FL',
        florida: {
          backgroundScreeningStatus: 'COMPLIANT',
          authorizedServices: [],
        } as FloridaClientData,
      };

      const result = validator.validateStateSpecific(validFloridaData);

      expect(result.success).toBe(true);
    });

    it('should return error for missing state-specific data', () => {
      const invalidData: StateSpecificClientData = {
        state: 'TX',
        // Missing texas property for TX state
      };

      const result = validator.validateStateSpecific(invalidData);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          path: '',
          message: 'State-specific data must be provided for the selected state',
        })
      );
    });

    it('should return error for invalid state', () => {
      const invalidData: StateSpecificClientData = {
        state: 'NY' as any, // Invalid state
        texas: {
          emergencyPlanOnFile: true,
          authorizedServices: [],
        } as TexasClientData,
      };

      const result = validator.validateStateSpecific(invalidData);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });

  describe('validateTexasClient', () => {
    it('should validate valid Texas client data', () => {
      const validData: TexasClientData = {
        emergencyPlanOnFile: true,
        authorizedServices: [],
      };

      const result = validator.validateTexasClient(validData);

      expect(result.success).toBe(true);
    });

    it.skip('should validate Texas service authorization', () => {
      const validData: TexasClientData = {
        emergencyPlanOnFile: true,
        authorizedServices: [
          {
            id: '123e4567-e89b-12d3-a456-426614174001',
            serviceCode: 'TEST001',
            serviceName: 'Test Service',
            authorizedUnits: 40,
            usedUnits: 10,
            unitType: 'HOURS',
            authorizationNumber: 'AUTH-001',
            effectiveDate: new Date('2024-01-01'),
            expirationDate: new Date('2024-12-31'),
            status: 'ACTIVE',
            requiresEVV: false,
          },
        ],
      };

      const result = validator.validateTexasClient(validData);

      expect(result.success).toBe(true);
    });

    it('should return error for service with used units exceeding authorized units', () => {
      const invalidData: TexasClientData = {
        emergencyPlanOnFile: true,
        authorizedServices: [
          {
            id: '123e4567-e89b-12d3-a456-426614174001',
            serviceCode: 'TEST001',
            serviceName: 'Test Service',
            authorizedUnits: 10,
            usedUnits: 20, // More used than authorized
            unitType: 'HOURS',
            authorizationNumber: 'AUTH-001',
            effectiveDate: new Date('2024-01-01'),
            expirationDate: new Date('2024-12-31'),
            status: 'ACTIVE',
            requiresEVV: false,
          },
        ],
      };

      const result = validator.validateTexasClient(invalidData);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors).toContainEqual(
        expect.objectContaining({ message: 'Used units cannot exceed authorized units' })
      );
    });

    it('should return error for service with expiration before effective date', () => {
      const invalidData: TexasClientData = {
        emergencyPlanOnFile: true,
        authorizedServices: [
          {
            id: '123e4567-e89b-12d3-a456-426614174001',
            serviceCode: 'TEST001',
            serviceName: 'Test Service',
            authorizedUnits: 10,
            usedUnits: 5,
            unitType: 'HOURS',
            authorizationNumber: 'AUTH-001',
            effectiveDate: new Date('2024-12-31'),
            expirationDate: new Date('2024-01-01'), // Before effective date
            status: 'ACTIVE',
            requiresEVV: false,
          },
        ],
      };

      const result = validator.validateTexasClient(invalidData);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors).toContainEqual(
        expect.objectContaining({ message: 'Expiration date must be after effective date' })
      );
    });

    it('should detect business rule violations', () => {
      const invalidData: TexasClientData = {
        medicaidProgram: 'STAR_PLUS',
        emergencyPlanOnFile: false, // Required for STAR+PLUS
        authorizedServices: [],
      };

      const result = validator.validateTexasClient(invalidData);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors).toContainEqual(
        expect.objectContaining({ message: 'Emergency plan required for STAR+PLUS program' })
      );
    });

    it('should check for expired authorizations', () => {
      const invalidData: TexasClientData = {
        emergencyPlanOnFile: true,
        authorizedServices: [
          {
            id: '123e4567-e89b-12d3-a456-426614174001',
            serviceCode: 'TEST001',
            serviceName: 'Test Service',
            authorizedUnits: 40,
            usedUnits: 10,
            unitType: 'HOURS',
            authorizationNumber: 'AUTH-001',
            effectiveDate: new Date('2020-01-01'), // Past date
            expirationDate: new Date('2021-01-01'), // Past date
            status: 'ACTIVE', // But still marked as active
            requiresEVV: false,
          },
        ],
      };

      const result = validator.validateTexasClient(invalidData);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          message: 'One or more authorizations have expired and need renewal',
        })
      );
    });
  });

  describe('validateFloridaClient', () => {
    it('should validate valid Florida client data', () => {
      const validData: FloridaClientData = {
        backgroundScreeningStatus: 'COMPLIANT',
        authorizedServices: [],
      };

      const result = validator.validateFloridaClient(validData);

      expect(result.success).toBe(true);
    });

    it('should validate Florida service authorization', () => {
      const validData: FloridaClientData = {
        backgroundScreeningStatus: 'COMPLIANT',
        authorizedServices: [
          {
            id: '123e4567-e89b-12d3-a456-426614174001',
            serviceCode: 'TEST001',
            serviceName: 'Test Service',
            authorizedUnits: 40,
            usedUnits: 10,
            unitType: 'HOURS',
            authorizationNumber: 'AUTH-001',
            effectiveDate: new Date('2024-01-01'),
            expirationDate: new Date('2024-12-31'),
            status: 'ACTIVE',
            requiresEVV: false,
            requiresRNSupervision: false,
          },
        ],
      };

      const result = validator.validateFloridaClient(validData);

      expect(result.success).toBe(true);
    });

    it('should return error for service with used units exceeding authorized units', () => {
      const invalidData: FloridaClientData = {
        backgroundScreeningStatus: 'COMPLIANT',
        authorizedServices: [
          {
            id: '123e4567-e89b-12d3-a456-426614174001',
            serviceCode: 'TEST001',
            serviceName: 'Test Service',
            authorizedUnits: 10,
            usedUnits: 20, // More used than authorized
            unitType: 'HOURS',
            authorizationNumber: 'AUTH-001',
            effectiveDate: new Date('2024-01-01'),
            expirationDate: new Date('2024-12-31'),
            status: 'ACTIVE',
            requiresEVV: false,
            requiresRNSupervision: false,
          },
        ],
      };

      const result = validator.validateFloridaClient(invalidData);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors).toContainEqual(
        expect.objectContaining({ message: 'Used units cannot exceed authorized units' })
      );
    });

    it('should detect business rule violations', () => {
      const invalidData: FloridaClientData = {
        backgroundScreeningStatus: 'COMPLIANT',
        authorizedServices: [
          {
            id: '123e4567-e89b-12d3-a456-426614174001',
            serviceCode: 'TEST001',
            serviceName: 'Test Service',
            authorizedUnits: 40,
            usedUnits: 10,
            unitType: 'HOURS',
            authorizationNumber: 'AUTH-001',
            effectiveDate: new Date('2024-01-01'),
            expirationDate: new Date('2024-12-31'),
            status: 'ACTIVE',
            requiresEVV: false,
            requiresRNSupervision: true, // Requires RN supervision
          },
        ],
        // Missing RN supervisor ID
      };

      const result = validator.validateFloridaClient(invalidData);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          message: 'RN supervisor required for services requiring supervision (59A-8.0095)',
        })
      );
    });

    it('should detect overdue supervisory visit', () => {
      const invalidData: FloridaClientData = {
        backgroundScreeningStatus: 'COMPLIANT',
        authorizedServices: [],
        rnSupervisorId: 'rn-123',
        nextSupervisoryVisitDue: new Date('2020-01-01'), // In the past
      };

      const result = validator.validateFloridaClient(invalidData);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors).toContainEqual(
        expect.objectContaining({ message: 'Supervisory visit is overdue' })
      );
    });

    it('should detect overdue plan of care review', () => {
      const invalidData: FloridaClientData = {
        backgroundScreeningStatus: 'COMPLIANT',
        authorizedServices: [],
        planOfCareReviewDate: new Date('2023-01-01'),
        nextReviewDue: new Date('2023-06-01'), // In the past
      };

      const result = validator.validateFloridaClient(invalidData);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          message: 'Plan of care review is overdue (Florida Statute 400.487)',
        })
      );
    });
  });

  describe('validateEVVEligibility', () => {
    it('should return eligible for non-EVV service in Texas', () => {
      const stateData: StateSpecificClientData = {
        state: 'TX',
        texas: {
          emergencyPlanOnFile: true,
          authorizedServices: [
            {
              id: '123e4567-e89b-12d3-a456-426614174001',
              serviceCode: 'NON_EVV_SERVICE',
              serviceName: 'Non-EVV Service',
              authorizedUnits: 40,
              usedUnits: 10,
              unitType: 'HOURS',
              authorizationNumber: 'AUTH-001',
              effectiveDate: new Date('2024-01-01'),
              expirationDate: new Date('2024-12-31'),
              status: 'ACTIVE',
              requiresEVV: false, // Does not require EVV
            },
          ],
        } as TexasClientData,
      };

      const result = validator.validateEVVEligibility(stateData, 'NON_EVV_SERVICE');

      expect(result.eligible).toBe(true);
      expect(result.reasons).toContain('EVV not required for this service');
    });

    it('should return eligible for non-EVV service in Florida', () => {
      const stateData: StateSpecificClientData = {
        state: 'FL',
        florida: {
          backgroundScreeningStatus: 'COMPLIANT',
          authorizedServices: [
            {
              id: '123e4567-e89b-12d3-a456-426614174001',
              serviceCode: 'NON_EVV_SERVICE',
              serviceName: 'Non-EVV Service',
              authorizedUnits: 40,
              usedUnits: 10,
              unitType: 'HOURS',
              authorizationNumber: 'AUTH-001',
              effectiveDate: new Date('2024-01-01'),
              expirationDate: new Date('2024-12-31'),
              status: 'ACTIVE',
              requiresEVV: false, // Does not require EVV
              requiresRNSupervision: false,
            },
          ],
        } as FloridaClientData,
      };

      const result = validator.validateEVVEligibility(stateData, 'NON_EVV_SERVICE');

      expect(result.eligible).toBe(true);
      expect(result.reasons).toContain('EVV not required for this service');
    });

    it('should return not eligible if service not found', () => {
      const stateData: StateSpecificClientData = {
        state: 'TX',
        texas: {
          emergencyPlanOnFile: true,
          authorizedServices: [
            {
              id: '123e4567-e89b-12d3-a456-426614174001',
              serviceCode: 'EXISTING_SERVICE',
              serviceName: 'Existing Service',
              authorizedUnits: 40,
              usedUnits: 10,
              unitType: 'HOURS',
              authorizationNumber: 'AUTH-001',
              effectiveDate: new Date('2024-01-01'),
              expirationDate: new Date('2024-12-31'),
              status: 'ACTIVE',
              requiresEVV: true,
            },
          ],
        } as TexasClientData,
      };

      const result = validator.validateEVVEligibility(stateData, 'NON_EXISTENT_SERVICE');

      expect(result.eligible).toBe(false);
      expect(result.reasons).toContain('Service not found in authorized services');
    });

    it.skip('should return eligible with reasons for Texas when all requirements met', () => {
      const stateData: StateSpecificClientData = {
        state: 'TX',
        texas: {
          evvEntityId: 'evv-entity-123',
          evvRequirements: {
            evvMandatory: true,
            approvedClockMethods: ['MOBILE'],
            aggregatorSubmissionRequired: true,
            tmhpIntegration: true,
          },
          emergencyPlanOnFile: true,
          authorizedServices: [
            {
              id: '123e4567-e89b-12d3-a456-426614174001',
              serviceCode: 'EVV_SERVICE',
              serviceName: 'EVV Service',
              authorizedUnits: 40,
              usedUnits: 10,
              unitType: 'HOURS',
              authorizationNumber: 'AUTH-001',
              effectiveDate: new Date('2024-01-01'),
              expirationDate: new Date('2024-12-31'), // Future date
              status: 'ACTIVE',
              requiresEVV: true,
            },
          ],
        } as TexasClientData,
      };

      const result = validator.validateEVVEligibility(stateData, 'EVV_SERVICE');

      expect(result.eligible).toBe(true);
      expect(result.reasons).toContain('Eligible for EVV service delivery');
    });

    it('should return not eligible with reasons for Texas when EVV requirements not met', () => {
      const stateData: StateSpecificClientData = {
        state: 'TX',
        texas: {
          // Missing evvEntityId
          evvRequirements: {
            evvMandatory: true,
            approvedClockMethods: ['MOBILE'],
            aggregatorSubmissionRequired: true,
            tmhpIntegration: false, // Missing TMHP integration
          },
          emergencyPlanOnFile: true,
          authorizedServices: [
            {
              id: '123e4567-e89b-12d3-a456-426614174001',
              serviceCode: 'EVV_SERVICE',
              serviceName: 'EVV Service',
              authorizedUnits: 40,
              usedUnits: 10,
              unitType: 'HOURS',
              authorizationNumber: 'AUTH-001',
              effectiveDate: new Date('2024-01-01'),
              expirationDate: new Date('2024-12-31'),
              status: 'ACTIVE',
              requiresEVV: true,
            },
          ],
        } as TexasClientData,
      };

      const result = validator.validateEVVEligibility(stateData, 'EVV_SERVICE');

      expect(result.eligible).toBe(false);
      expect(result.reasons).toContain('EVV entity ID not configured');
      expect(result.reasons).toContain(
        'TMHP integration not configured for EVV aggregator submission'
      );
    });

    it.skip('should return eligible with reasons for Florida when all requirements met', () => {
      const stateData: StateSpecificClientData = {
        state: 'FL',
        florida: {
          evvAggregatorId: 'evv-aggregator-123',
          evvSystemType: 'HHAX',
          rnSupervisorId: 'rn-123',
          backgroundScreeningStatus: 'COMPLIANT',
          authorizedServices: [
            {
              id: '123e4567-e89b-12d3-a456-426614174001',
              serviceCode: 'EVV_SERVICE',
              serviceName: 'EVV Service',
              authorizedUnits: 40,
              usedUnits: 10,
              unitType: 'HOURS',
              authorizationNumber: 'AUTH-001',
              effectiveDate: new Date('2024-01-01'),
              expirationDate: new Date('2024-12-31'), // Future date
              status: 'ACTIVE',
              requiresEVV: true,
              requiresRNSupervision: true,
            },
          ],
        } as FloridaClientData,
      };

      const result = validator.validateEVVEligibility(stateData, 'EVV_SERVICE');

      expect(result.eligible).toBe(true);
      expect(result.reasons).toContain('Eligible for EVV service delivery');
    });
  });

  describe('calculateComplianceStatus', () => {
    it('should return compliant status for Texas when no issues', () => {
      const stateData: StateSpecificClientData = {
        state: 'TX',
        texas: {
          emergencyPlanOnFile: true,
          authorizedServices: [
            {
              id: '123e4567-e89b-12d3-a456-426614174001',
              serviceCode: 'SERVICE',
              serviceName: 'Service',
              authorizedUnits: 40,
              usedUnits: 10,
              unitType: 'HOURS',
              authorizationNumber: 'AUTH-001',
              effectiveDate: new Date('2024-01-01'),
              expirationDate: new Date('2025-12-31'), // Future date
              status: 'ACTIVE',
              requiresEVV: false,
            },
          ],
        } as TexasClientData,
      };

      const result = validator.calculateComplianceStatus(stateData);

      expect(result.compliant).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should return non-compliant status for Texas when critical issues exist', () => {
      const stateData: StateSpecificClientData = {
        state: 'TX',
        texas: {
          emergencyPlanOnFile: false, // Critical issue
          authorizedServices: [
            {
              id: '123e4567-e89b-12d3-a456-426614174001',
              serviceCode: 'SERVICE',
              serviceName: 'Service',
              authorizedUnits: 40,
              usedUnits: 10,
              unitType: 'HOURS',
              authorizationNumber: 'AUTH-001',
              effectiveDate: new Date('2020-01-01'), // Past effective date
              expirationDate: new Date('2021-01-01'), // Past expiration date
              status: 'ACTIVE',
              requiresEVV: false,
            },
          ],
        } as TexasClientData,
      };

      const result = validator.calculateComplianceStatus(stateData);

      expect(result.compliant).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          severity: 'ERROR',
          message: 'Emergency plan not on file (26 TAC §558 requirement)',
        })
      );
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          severity: 'ERROR',
          message: '1 service authorization(s) expired',
        })
      );
    });

    it('should return compliant status for Florida when no issues', () => {
      const stateData: StateSpecificClientData = {
        state: 'FL',
        florida: {
          backgroundScreeningStatus: 'COMPLIANT',
          nextReviewDue: new Date('2025-12-31'), // Future date
          authorizedServices: [
            {
              id: '123e4567-e89b-12d3-a456-426614174001',
              serviceCode: 'SERVICE',
              serviceName: 'Service',
              authorizedUnits: 40,
              usedUnits: 10,
              unitType: 'HOURS',
              authorizationNumber: 'AUTH-001',
              effectiveDate: new Date('2024-01-01'),
              expirationDate: new Date('2025-12-31'), // Future date
              status: 'ACTIVE',
              requiresEVV: false,
              requiresRNSupervision: false,
            },
          ],
        } as FloridaClientData,
      };

      const result = validator.calculateComplianceStatus(stateData);

      expect(result.compliant).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should return non-compliant status for Florida when critical issues exist', () => {
      const stateData: StateSpecificClientData = {
        state: 'FL',
        florida: {
          backgroundScreeningStatus: 'NON_COMPLIANT',
          nextReviewDue: new Date('2020-01-01'), // Past date
          nextSupervisoryVisitDue: new Date('2020-01-01'), // Past date
          authorizedServices: [
            {
              id: '123e4567-e89b-12d3-a456-426614174001',
              serviceCode: 'SERVICE',
              serviceName: 'Service',
              authorizedUnits: 40,
              usedUnits: 10,
              unitType: 'HOURS',
              authorizationNumber: 'AUTH-001',
              effectiveDate: new Date('2020-01-01'),
              expirationDate: new Date('2021-01-01'), // Past date
              status: 'ACTIVE', // But still marked as active
              requiresEVV: false,
              requiresRNSupervision: false,
            },
          ],
        } as FloridaClientData,
      };

      const result = validator.calculateComplianceStatus(stateData);

      expect(result.compliant).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          severity: 'ERROR',
          message: 'Background screening non-compliant',
        })
      );
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          severity: 'ERROR',
          message: 'Plan of care review overdue (Florida Statute 400.487)',
        })
      );
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          severity: 'ERROR',
          message: 'RN supervisory visit overdue (59A-8.0095)',
        })
      );
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          severity: 'ERROR',
          message: '1 service authorization(s) expired',
        })
      );
    });

    it.skip('should return warnings for Texas when non-critical issues exist', () => {
      const emergencyPlanDate = new Date();
      emergencyPlanDate.setFullYear(emergencyPlanDate.getFullYear() - 2); // 2 years ago

      const stateData: StateSpecificClientData = {
        state: 'TX',
        texas: {
          emergencyPlanOnFile: true,
          emergencyPlanDate: emergencyPlanDate, // More than 1 year old
          authorizedServices: [
            {
              id: '123e4567-e89b-12d3-a456-426614174001',
              serviceCode: 'SERVICE',
              serviceName: 'Service',
              authorizedUnits: 40,
              usedUnits: 10,
              unitType: 'HOURS',
              authorizationNumber: 'AUTH-001',
              effectiveDate: new Date('2024-01-01'),
              expirationDate: new Date('2025-02-01'), // Expires within 30 days
              status: 'ACTIVE',
              requiresEVV: false,
            },
          ],
        } as TexasClientData,
      };

      const result = validator.calculateComplianceStatus(stateData);

      expect(result.compliant).toBe(true); // Still compliant despite warnings
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          severity: 'WARNING',
          message: 'Emergency plan over 1 year old, review recommended',
        })
      );
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          severity: 'WARNING',
          message: '1 service authorization(s) expiring within 30 days',
        })
      );
    });
  });
});
