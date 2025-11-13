/**
 * Base Compliance Validator Tests
 * 
 * Tests common validation logic shared across all states.
 * State-specific validators will have their own test files.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { addDays, subDays } from 'date-fns';
import {
  BaseComplianceValidator,
  StateCredentialConfig,
  StateAuthorizationConfig,
} from '../base-validator';
import type {
  CaregiverCredentials,
  VisitDetails,
  ClientDetails,
  ServiceAuthorization,
} from '../types/index';
import type { StateCode } from '../../types/base';

/**
 * Test implementation of BaseComplianceValidator
 */
class TestStateValidator extends BaseComplianceValidator {
  readonly state: StateCode = 'TX';
  
  protected readonly credentialConfig: StateCredentialConfig = {
    backgroundScreening: {
      required: true,
      type: 'LEVEL_2',
      frequency: 'ANNUAL',
      expirationDays: 365,
      warningDays: 30,
    },
    licensure: {
      required: true,
      roles: ['RN', 'LPN', 'CNA'],
      verificationFrequency: 'ANNUAL',
    },
    registryChecks: [
      {
        name: 'Employee Misconduct Registry',
        type: 'EMPLOYEE_MISCONDUCT',
        frequency: 'ANNUAL',
        expirationDays: 365,
      },
      {
        name: 'Nurse Aide Registry',
        type: 'NURSE_AIDE',
        frequency: 'AT_HIRE',
        expirationDays: 730,
      },
    ],
  };
  
  protected readonly authorizationConfig: StateAuthorizationConfig = {
    required: true,
    warningThreshold: 0.9,
    allowOverage: false,
  };
  
  protected getBackgroundRegulation(): string {
    return 'Test Code §1.0';
  }
  
  protected getLicensureRegulation(): string {
    return 'Test Code §2.0';
  }
  
  protected getRegistryRegulation(_type: string): string {
    return 'Test Code §3.0';
  }
  
  protected getAuthorizationRegulation(): string {
    return 'Test Code §4.0';
  }
  
  protected getDocumentationRegulation(): string {
    return 'Test Code §5.0';
  }
  
  protected getPlanOfCareRegulation(): string {
    return 'Test Code §6.0';
  }
}

describe('BaseComplianceValidator', () => {
  let validator: TestStateValidator;
  
  beforeEach(() => {
    validator = new TestStateValidator();
  });
  
  describe('Background Screening Validation', () => {
    it('should block assignment when no background check on file', async () => {
      const caregiver: CaregiverCredentials = {
        backgroundScreening: undefined,
        licenses: [],
        registryChecks: [],
      };
      
      const visit: VisitDetails = {
        id: 'visit-1',
        clientId: 'client-1',
        serviceType: 'PERSONAL_CARE',
        scheduledStart: new Date(),
        scheduledEnd: addDays(new Date(), 1),
        state: 'TX',
      };
      
      const client: ClientDetails = {
        id: 'client-1',
        state: 'TX',
      };
      
      const result = await validator.canAssignToVisit(caregiver, visit, client);
      
      expect(result.canProceed).toBe(false);
      expect(result.issues).toHaveLength(4); // BG + license + 2 registry checks
      
      const bgIssue = result.issues.find(i => i.type === 'TX_BACKGROUND_MISSING');
      expect(bgIssue).toMatchObject({
        type: 'TX_BACKGROUND_MISSING',
        severity: 'BLOCKING',
        category: 'CAREGIVER_CREDENTIALS',
        canBeOverridden: false,
        requiresComplianceReview: true,
      });
    });
    
    it('should block assignment when background check pending', async () => {
      const caregiver: CaregiverCredentials = {
        backgroundScreening: {
          type: 'LEVEL_2',
          checkDate: subDays(new Date(), 5),
          status: 'PENDING',
        },
        licenses: [],
        registryChecks: [],
      };
      
      const visit: VisitDetails = {
        id: 'visit-1',
        clientId: 'client-1',
        serviceType: 'PERSONAL_CARE',
        scheduledStart: new Date(),
        scheduledEnd: addDays(new Date(), 1),
        state: 'TX',
      };
      
      const client: ClientDetails = {
        id: 'client-1',
        state: 'TX',
      };
      
      const result = await validator.canAssignToVisit(caregiver, visit, client);
      
      expect(result.canProceed).toBe(false);
      const bgIssue = result.issues.find(i => i.type === 'TX_BACKGROUND_PENDING');
      expect(bgIssue).toBeDefined();
      expect(bgIssue?.severity).toBe('BLOCKING');
      expect(bgIssue?.canBeOverridden).toBe(false);
    });
    
    it('should block assignment when background check has issues', async () => {
      const caregiver: CaregiverCredentials = {
        backgroundScreening: {
          type: 'LEVEL_2',
          checkDate: new Date(),
          status: 'ISSUES',
        },
        licenses: [],
        registryChecks: [],
      };
      
      const visit: VisitDetails = {
        id: 'visit-1',
        clientId: 'client-1',
        serviceType: 'PERSONAL_CARE',
        scheduledStart: new Date(),
        scheduledEnd: addDays(new Date(), 1),
        state: 'TX',
      };
      
      const client: ClientDetails = {
        id: 'client-1',
        state: 'TX',
      };
      
      const result = await validator.canAssignToVisit(caregiver, visit, client);
      
      expect(result.canProceed).toBe(false);
      const bgIssue = result.issues.find(i => i.type === 'TX_BACKGROUND_ISSUES');
      expect(bgIssue).toBeDefined();
      expect(bgIssue?.requiresComplianceReview).toBe(true);
    });
    
    it('should block assignment when background check expired', async () => {
      const caregiver: CaregiverCredentials = {
        backgroundScreening: {
          type: 'LEVEL_2',
          checkDate: subDays(new Date(), 400),
          status: 'CLEAR',
          expirationDate: subDays(new Date(), 35), // Expired 35 days ago
        },
        licenses: [],
        registryChecks: [],
      };
      
      const visit: VisitDetails = {
        id: 'visit-1',
        clientId: 'client-1',
        serviceType: 'PERSONAL_CARE',
        scheduledStart: new Date(),
        scheduledEnd: addDays(new Date(), 1),
        state: 'TX',
      };
      
      const client: ClientDetails = {
        id: 'client-1',
        state: 'TX',
      };
      
      const result = await validator.canAssignToVisit(caregiver, visit, client);
      
      expect(result.canProceed).toBe(false);
      const bgIssue = result.issues.find(i => i.type === 'TX_BACKGROUND_EXPIRED');
      expect(bgIssue).toBeDefined();
      expect(bgIssue?.severity).toBe('BLOCKING');
      expect(bgIssue?.metadata).toMatchObject({
        expiredDays: expect.any(Number),
      });
    });
    
    it('should warn when background check expiring soon', async () => {
      const caregiver: CaregiverCredentials = {
        backgroundScreening: {
          type: 'LEVEL_2',
          checkDate: subDays(new Date(), 340),
          status: 'CLEAR',
          expirationDate: addDays(new Date(), 20), // Expires in 20 days
        },
        licenses: [
          {
            type: 'CNA',
            number: 'CNA123456',
            state: 'TX',
            issueDate: subDays(new Date(), 200),
            expirationDate: addDays(new Date(), 165),
            status: 'ACTIVE',
          },
        ],
        registryChecks: [
          {
            name: 'Employee Misconduct Registry',
            type: 'EMPLOYEE_MISCONDUCT',
            checkDate: subDays(new Date(), 100),
            status: 'CLEAR',
            state: 'TX',
          },
          {
            name: 'Nurse Aide Registry',
            type: 'NURSE_AIDE',
            checkDate: subDays(new Date(), 100),
            status: 'CLEAR',
            state: 'TX',
          },
        ],
      };
      
      const visit: VisitDetails = {
        id: 'visit-1',
        clientId: 'client-1',
        serviceType: 'PERSONAL_CARE',
        scheduledStart: new Date(),
        scheduledEnd: addDays(new Date(), 1),
        state: 'TX',
      };
      
      const client: ClientDetails = {
        id: 'client-1',
        state: 'TX',
      };
      
      const result = await validator.canAssignToVisit(caregiver, visit, client);
      
      expect(result.canProceed).toBe(true); // Should allow but warn
      const bgWarning = result.issues.find(i => i.type === 'TX_BACKGROUND_EXPIRING_SOON');
      expect(bgWarning).toBeDefined();
      expect(bgWarning?.severity).toBe('WARNING');
      expect(bgWarning?.canBeOverridden).toBe(true);
    });
    
    it('should allow assignment with valid background check', async () => {
      const caregiver: CaregiverCredentials = {
        backgroundScreening: {
          type: 'LEVEL_2',
          checkDate: subDays(new Date(), 90),
          status: 'CLEAR',
          expirationDate: addDays(new Date(), 275),
        },
        licenses: [
          {
            type: 'CNA',
            number: 'CNA123456',
            state: 'TX',
            issueDate: subDays(new Date(), 200),
            expirationDate: addDays(new Date(), 165),
            status: 'ACTIVE',
          },
        ],
        registryChecks: [
          {
            name: 'Employee Misconduct Registry',
            type: 'EMPLOYEE_MISCONDUCT',
            checkDate: subDays(new Date(), 100),
            status: 'CLEAR',
            state: 'TX',
          },
          {
            name: 'Nurse Aide Registry',
            type: 'NURSE_AIDE',
            checkDate: subDays(new Date(), 100),
            status: 'CLEAR',
            state: 'TX',
          },
        ],
      };
      
      const visit: VisitDetails = {
        id: 'visit-1',
        clientId: 'client-1',
        serviceType: 'PERSONAL_CARE',
        scheduledStart: new Date(),
        scheduledEnd: addDays(new Date(), 1),
        state: 'TX',
      };
      
      const client: ClientDetails = {
        id: 'client-1',
        state: 'TX',
      };
      
      const result = await validator.canAssignToVisit(caregiver, visit, client);
      
      expect(result.canProceed).toBe(true);
      const blockingIssues = result.issues.filter(i => i.severity === 'BLOCKING');
      expect(blockingIssues).toHaveLength(0);
    });
  });
  
  describe('Authorization Validation', () => {
    it('should block visit when authorization expired', async () => {
      const authorization: ServiceAuthorization = {
        authorizationNumber: 'AUTH-123',
        payor: 'Medicaid MCO',
        authorizedServices: ['PERSONAL_CARE'],
        authorizedUnits: 100,
        unitsConsumed: 50,
        unitsRemaining: 50,
        startDate: subDays(new Date(), 60),
        endDate: subDays(new Date(), 5), // Expired 5 days ago
        status: 'EXPIRED',
      };
      
      const result = await validator.validateAuthorization(
        authorization,
        'PERSONAL_CARE',
        new Date(),
        10
      );
      
      expect(result.canProceed).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'TX_AUTHORIZATION_EXPIRED',
          severity: 'BLOCKING',
        })
      );
    });
    
    it('should block visit when exceeding authorized units', async () => {
      const authorization: ServiceAuthorization = {
        authorizationNumber: 'AUTH-123',
        payor: 'Medicaid MCO',
        authorizedServices: ['PERSONAL_CARE'],
        authorizedUnits: 100,
        unitsConsumed: 95,
        unitsRemaining: 5,
        startDate: subDays(new Date(), 30),
        endDate: addDays(new Date(), 30),
        status: 'ACTIVE',
      };
      
      const result = await validator.validateAuthorization(
        authorization,
        'PERSONAL_CARE',
        new Date(),
        10 // Would exceed by 5 units
      );
      
      expect(result.canProceed).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'TX_AUTHORIZATION_EXCEEDED',
          severity: 'BLOCKING',
          metadata: expect.objectContaining({
            overage: 5,
          }),
        })
      );
    });
    
    it('should warn when nearing authorized units limit', async () => {
      const authorization: ServiceAuthorization = {
        authorizationNumber: 'AUTH-123',
        payor: 'Medicaid MCO',
        authorizedServices: ['PERSONAL_CARE'],
        authorizedUnits: 100,
        unitsConsumed: 85,
        unitsRemaining: 15,
        startDate: subDays(new Date(), 30),
        endDate: addDays(new Date(), 30),
        status: 'ACTIVE',
      };
      
      const result = await validator.validateAuthorization(
        authorization,
        'PERSONAL_CARE',
        new Date(),
        7 // Will be at 92% utilization
      );
      
      expect(result.canProceed).toBe(true); // Allow but warn
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'TX_AUTHORIZATION_NEARING_LIMIT',
          severity: 'WARNING',
        })
      );
    });
    
    it('should block visit when service not authorized', async () => {
      const authorization: ServiceAuthorization = {
        authorizationNumber: 'AUTH-123',
        payor: 'Medicaid MCO',
        authorizedServices: ['PERSONAL_CARE'],
        authorizedUnits: 100,
        unitsConsumed: 50,
        unitsRemaining: 50,
        startDate: subDays(new Date(), 30),
        endDate: addDays(new Date(), 30),
        status: 'ACTIVE',
      };
      
      const result = await validator.validateAuthorization(
        authorization,
        'SKILLED_NURSING', // Not authorized
        new Date(),
        10
      );
      
      expect(result.canProceed).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'TX_SERVICE_NOT_AUTHORIZED',
          severity: 'BLOCKING',
        })
      );
    });
    
    it('should allow visit with valid authorization', async () => {
      const authorization: ServiceAuthorization = {
        authorizationNumber: 'AUTH-123',
        payor: 'Medicaid MCO',
        authorizedServices: ['PERSONAL_CARE', 'HOMEMAKING'],
        authorizedUnits: 100,
        unitsConsumed: 50,
        unitsRemaining: 50,
        startDate: subDays(new Date(), 30),
        endDate: addDays(new Date(), 30),
        status: 'ACTIVE',
      };
      
      const result = await validator.validateAuthorization(
        authorization,
        'PERSONAL_CARE',
        new Date(),
        10
      );
      
      expect(result.canProceed).toBe(true);
      const blockingIssues = result.issues.filter(i => i.severity === 'BLOCKING');
      expect(blockingIssues).toHaveLength(0);
    });
  });
  
  describe('Registry Checks Validation', () => {
    it('should block assignment when caregiver listed on registry', async () => {
      const caregiver: CaregiverCredentials = {
        backgroundScreening: {
          type: 'LEVEL_2',
          checkDate: new Date(),
          status: 'CLEAR',
          expirationDate: addDays(new Date(), 365),
        },
        licenses: [],
        registryChecks: [
          {
            name: 'Employee Misconduct Registry',
            type: 'EMPLOYEE_MISCONDUCT',
            checkDate: new Date(),
            status: 'LISTED', // RED FLAG
            state: 'TX',
          },
        ],
      };
      
      const visit: VisitDetails = {
        id: 'visit-1',
        clientId: 'client-1',
        serviceType: 'PERSONAL_CARE',
        scheduledStart: new Date(),
        scheduledEnd: addDays(new Date(), 1),
        state: 'TX',
      };
      
      const client: ClientDetails = {
        id: 'client-1',
        state: 'TX',
      };
      
      const result = await validator.canAssignToVisit(caregiver, visit, client);
      
      expect(result.canProceed).toBe(false);
      const registryIssue = result.issues.find(
        i => i.type === 'TX_REGISTRY_LISTED_EMPLOYEE_MISCONDUCT'
      );
      expect(registryIssue).toBeDefined();
      expect(registryIssue?.severity).toBe('BLOCKING');
      expect(registryIssue?.canBeOverridden).toBe(false);
      expect(registryIssue?.requiresComplianceReview).toBe(true);
    });
  });
});
