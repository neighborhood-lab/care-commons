/**
 * Credential Expiration Service Tests
 * 
 * Tests for credential monitoring, expiration alerts, and compliance gating.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CredentialExpirationService, DEFAULT_ALERT_THRESHOLDS } from '../services/credential-expiration-service.js';
import { CaregiverRepository } from '../repository/caregiver-repository.js';
import type { Database, UserContext } from '@care-commons/core';
import type { Caregiver, Credential, TrainingRecord } from '../types/caregiver.js';

// Fixed date for deterministic tests
const FIXED_NOW = new Date('2024-06-15T12:00:00Z');

// Helper to create dates relative to FIXED_NOW
function daysFromNow(days: number): Date {
  return new Date(FIXED_NOW.getTime() + days * 24 * 60 * 60 * 1000);
}

function createMockCaregiver(overrides: Partial<Caregiver> = {}): Caregiver {
  return {
    id: 'caregiver-123',
    organizationId: 'org-123',
    branchIds: ['branch-123'],
    primaryBranchId: 'branch-123',
    employeeNumber: 'EMP001',
    firstName: 'Maria',
    lastName: 'Garcia',
    dateOfBirth: new Date('1985-03-15'),
    primaryPhone: { number: '512-555-1234', type: 'MOBILE', canReceiveSMS: true },
    email: 'maria.garcia@example.com',
    preferredContactMethod: 'EMAIL',
    primaryAddress: {
      type: 'HOME',
      line1: '123 Main St',
      city: 'Austin',
      state: 'TX',
      postalCode: '78701',
      country: 'USA',
    },
    emergencyContacts: [],
    employmentType: 'FULL_TIME',
    employmentStatus: 'ACTIVE',
    hireDate: new Date('2022-01-15'),
    role: 'CAREGIVER',
    permissions: ['visits:read', 'visits:create'],
    credentials: [],
    training: [],
    skills: [],
    specializations: [],
    availability: {
      schedule: {
        monday: { available: true },
        tuesday: { available: true },
        wednesday: { available: true },
        thursday: { available: true },
        friday: { available: true },
        saturday: { available: false },
        sunday: { available: false },
      },
      lastUpdated: new Date(),
    },
    payRate: {
      id: 'rate-1',
      rateType: 'BASE',
      amount: 18.50,
      unit: 'HOURLY',
      effectiveDate: new Date('2022-01-15'),
    },
    complianceStatus: 'COMPLIANT',
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
    updatedBy: 'system',
    isDeleted: false,
    ...overrides,
  } as Caregiver;
}

function createMockCredential(overrides: Partial<Credential> = {}): Credential {
  return {
    id: 'cred-1',
    type: 'CNA',
    name: 'Certified Nursing Assistant',
    issuingAuthority: 'Texas HHSC',
    issueDate: new Date('2023-01-15'),
    expirationDate: daysFromNow(180), // 6 months from now
    status: 'ACTIVE',
    ...overrides,
  };
}

function createMockTraining(overrides: Partial<TrainingRecord> = {}): TrainingRecord {
  return {
    id: 'training-1',
    name: 'HIPAA Compliance Training',
    category: 'MANDATORY_COMPLIANCE',
    provider: 'Care Academy',
    completionDate: new Date('2023-06-01'),
    expirationDate: daysFromNow(90), // 3 months from now
    hours: 4,
    status: 'COMPLETED',
    ...overrides,
  };
}

describe('CredentialExpirationService', () => {
  let service: CredentialExpirationService;
  let mockDb: Database;
  let mockContext: UserContext;

  beforeEach(() => {
    // Mock Date.now() for deterministic tests
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);

    mockDb = {
      query: vi.fn(),
    } as unknown as Database;

    mockContext = {
      userId: 'user-123',
      organizationId: 'org-123',
      branchIds: ['branch-123'],
      roles: ['ORG_ADMIN'],
      permissions: ['caregivers:read', 'caregivers:update'],
    };

    service = new CredentialExpirationService(mockDb);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('DEFAULT_ALERT_THRESHOLDS', () => {
    it('should have correct default thresholds', () => {
      expect(DEFAULT_ALERT_THRESHOLDS).toEqual([90, 60, 30, 14, 7]);
    });
  });

  describe('getExpiringItems', () => {
    it('should return empty array when no caregivers have expiring items', async () => {
      const mockCaregiver = createMockCaregiver({
        credentials: [createMockCredential({ expirationDate: daysFromNow(365) })], // 1 year out
      });

      vi.spyOn(CaregiverRepository.prototype, 'findWithExpiringCredentials')
        .mockResolvedValue([mockCaregiver]);

      const items = await service.getExpiringItems('org-123', { daysAhead: 90 });

      expect(items).toHaveLength(0);
    });

    it('should return credentials expiring within threshold', async () => {
      const mockCaregiver = createMockCaregiver({
        credentials: [
          createMockCredential({ 
            id: 'cred-expiring',
            name: 'CPR Certification',
            expirationDate: daysFromNow(30), // 30 days out
          }),
        ],
      });

      vi.spyOn(CaregiverRepository.prototype, 'findWithExpiringCredentials')
        .mockResolvedValue([mockCaregiver]);

      const items = await service.getExpiringItems('org-123', { daysAhead: 90 });

      expect(items).toHaveLength(1);
      expect(items[0]!.itemName).toBe('CPR Certification');
      expect(items[0]!.daysUntilExpiration).toBe(30);
      expect(items[0]!.severity).toBe('WARNING');
      expect(items[0]!.caregiverName).toBe('Maria Garcia');
    });

    it('should return expired items when includeExpired is true', async () => {
      const mockCaregiver = createMockCaregiver({
        credentials: [
          createMockCredential({ 
            id: 'cred-expired',
            name: 'Expired License',
            expirationDate: daysFromNow(-10), // Expired 10 days ago
          }),
        ],
      });

      vi.spyOn(CaregiverRepository.prototype, 'findWithExpiringCredentials')
        .mockResolvedValue([mockCaregiver]);

      const items = await service.getExpiringItems('org-123', { 
        daysAhead: 90,
        includeExpired: true,
      });

      expect(items).toHaveLength(1);
      expect(items[0]!.daysUntilExpiration).toBe(-10);
      expect(items[0]!.severity).toBe('EXPIRED');
    });

    it('should check training expirations', async () => {
      const mockCaregiver = createMockCaregiver({
        training: [
          createMockTraining({
            id: 'training-expiring',
            name: 'Abuse Prevention Training',
            expirationDate: daysFromNow(14),
          }),
        ],
      });

      vi.spyOn(CaregiverRepository.prototype, 'findWithExpiringCredentials')
        .mockResolvedValue([mockCaregiver]);

      const items = await service.getExpiringItems('org-123', { 
        daysAhead: 90,
        itemTypes: ['TRAINING'],
      });

      expect(items).toHaveLength(1);
      expect(items[0]!.itemType).toBe('TRAINING');
      expect(items[0]!.itemName).toBe('Abuse Prevention Training');
      expect(items[0]!.severity).toBe('WARNING'); // 14 days = WARNING (8-30 range)
    });

    it('should check background check expirations', async () => {
      const mockCaregiver = createMockCaregiver({
        backgroundCheck: {
          provider: 'Sterling',
          checkDate: new Date('2022-06-15'),
          expirationDate: daysFromNow(7),
          status: 'CLEAR',
          reportId: 'BG-12345',
        },
      });

      vi.spyOn(CaregiverRepository.prototype, 'findWithExpiringCredentials')
        .mockResolvedValue([mockCaregiver]);

      const items = await service.getExpiringItems('org-123', { 
        daysAhead: 90,
        itemTypes: ['BACKGROUND_CHECK'],
      });

      expect(items).toHaveLength(1);
      expect(items[0]!.itemType).toBe('BACKGROUND_CHECK');
      expect(items[0]!.blocksScheduling).toBe(true);
      expect(items[0]!.severity).toBe('CRITICAL'); // 7 days = CRITICAL
    });

    it('should filter by branch when specified', async () => {
      const caregiverBranch1 = createMockCaregiver({
        id: 'cg-1',
        branchIds: ['branch-1'],
        credentials: [createMockCredential({ expirationDate: daysFromNow(20) })],
      });
      const caregiverBranch2 = createMockCaregiver({
        id: 'cg-2',
        branchIds: ['branch-2'],
        credentials: [createMockCredential({ expirationDate: daysFromNow(20) })],
      });

      vi.spyOn(CaregiverRepository.prototype, 'findWithExpiringCredentials')
        .mockResolvedValue([caregiverBranch1, caregiverBranch2]);

      const items = await service.getExpiringItems('org-123', { 
        daysAhead: 90,
        branchId: 'branch-1',
      });

      expect(items).toHaveLength(1);
      expect(items[0]!.caregiverId).toBe('cg-1');
    });

    it('should sort by days until expiration (expired first)', async () => {
      const mockCaregiver = createMockCaregiver({
        credentials: [
          createMockCredential({ id: 'c1', name: 'Cred 60 days', expirationDate: daysFromNow(60) }),
          createMockCredential({ id: 'c2', name: 'Cred Expired', expirationDate: daysFromNow(-5) }),
          createMockCredential({ id: 'c3', name: 'Cred 30 days', expirationDate: daysFromNow(30) }),
        ],
      });

      vi.spyOn(CaregiverRepository.prototype, 'findWithExpiringCredentials')
        .mockResolvedValue([mockCaregiver]);

      const items = await service.getExpiringItems('org-123', { 
        daysAhead: 90,
        includeExpired: true,
      });

      expect(items).toHaveLength(3);
      expect(items[0]!.itemName).toBe('Cred Expired');
      expect(items[1]!.itemName).toBe('Cred 30 days');
      expect(items[2]!.itemName).toBe('Cred 60 days');
    });
  });

  describe('getStatusSummary', () => {
    it('should return correct summary counts', async () => {
      const caregivers = [
        createMockCaregiver({ id: 'cg-1', complianceStatus: 'COMPLIANT' }),
        createMockCaregiver({ id: 'cg-2', complianceStatus: 'COMPLIANT' }),
        createMockCaregiver({ id: 'cg-3', complianceStatus: 'EXPIRING_SOON' }),
        createMockCaregiver({ id: 'cg-4', complianceStatus: 'EXPIRED' }),
        createMockCaregiver({ id: 'cg-5', complianceStatus: 'PENDING_VERIFICATION' }),
      ];

      vi.spyOn(CaregiverRepository.prototype, 'search')
        .mockResolvedValue({ items: caregivers, total: 5, page: 1, limit: 10000, totalPages: 1 });
      vi.spyOn(CaregiverRepository.prototype, 'findWithExpiringCredentials')
        .mockResolvedValue([]);

      const summary = await service.getStatusSummary('org-123');

      expect(summary.totalCaregivers).toBe(5);
      expect(summary.compliant).toBe(2);
      expect(summary.expiringSoon).toBe(1);
      expect(summary.expired).toBe(1);
      expect(summary.pendingVerification).toBe(1);
      expect(summary.nonCompliant).toBe(0);
    });
  });

  describe('canBeScheduled', () => {
    it('should allow scheduling for compliant caregiver', async () => {
      const mockCaregiver = createMockCaregiver({
        complianceStatus: 'COMPLIANT',
        employmentStatus: 'ACTIVE',
        status: 'ACTIVE',
      });

      vi.spyOn(CaregiverRepository.prototype, 'findById')
        .mockResolvedValue(mockCaregiver);
      vi.spyOn(CaregiverRepository.prototype, 'findWithExpiringCredentials')
        .mockResolvedValue([]);

      const result = await service.canBeScheduled('caregiver-123', new Date(), mockContext);

      expect(result.canSchedule).toBe(true);
      expect(result.blockingReasons).toHaveLength(0);
    });

    it('should block scheduling for non-compliant caregiver', async () => {
      const mockCaregiver = createMockCaregiver({
        complianceStatus: 'NON_COMPLIANT',
      });

      vi.spyOn(CaregiverRepository.prototype, 'findById')
        .mockResolvedValue(mockCaregiver);
      vi.spyOn(CaregiverRepository.prototype, 'findWithExpiringCredentials')
        .mockResolvedValue([]);

      const result = await service.canBeScheduled('caregiver-123', new Date(), mockContext);

      expect(result.canSchedule).toBe(false);
      expect(result.blockingReasons).toContain('Caregiver is non-compliant');
    });

    it('should block scheduling for caregiver with expired status', async () => {
      const mockCaregiver = createMockCaregiver({
        complianceStatus: 'EXPIRED',
      });

      vi.spyOn(CaregiverRepository.prototype, 'findById')
        .mockResolvedValue(mockCaregiver);
      vi.spyOn(CaregiverRepository.prototype, 'findWithExpiringCredentials')
        .mockResolvedValue([]);

      const result = await service.canBeScheduled('caregiver-123', new Date(), mockContext);

      expect(result.canSchedule).toBe(false);
      expect(result.blockingReasons).toContain('Caregiver has expired credentials');
    });

    it('should block scheduling for inactive caregiver', async () => {
      const mockCaregiver = createMockCaregiver({
        complianceStatus: 'COMPLIANT',
        employmentStatus: 'SUSPENDED',
      });

      vi.spyOn(CaregiverRepository.prototype, 'findById')
        .mockResolvedValue(mockCaregiver);
      vi.spyOn(CaregiverRepository.prototype, 'findWithExpiringCredentials')
        .mockResolvedValue([]);

      const result = await service.canBeScheduled('caregiver-123', new Date(), mockContext);

      expect(result.canSchedule).toBe(false);
      expect(result.blockingReasons).toContain('Employment status is SUSPENDED');
    });

    it('should throw NotFoundError for non-existent caregiver', async () => {
      vi.spyOn(CaregiverRepository.prototype, 'findById')
        .mockResolvedValue(null);

      await expect(
        service.canBeScheduled('non-existent', new Date(), mockContext)
      ).rejects.toThrow('Caregiver not found');
    });
  });

  describe('generateAlerts', () => {
    it('should generate alerts for items at threshold boundaries', async () => {
      const mockCaregiver = createMockCaregiver({
        credentials: [
          createMockCredential({ id: 'c1', name: 'At 30 days', expirationDate: daysFromNow(30) }),
          createMockCredential({ id: 'c2', name: 'At 45 days', expirationDate: daysFromNow(45) }),
          createMockCredential({ id: 'c3', name: 'At 7 days', expirationDate: daysFromNow(7) }),
        ],
      });

      vi.spyOn(CaregiverRepository.prototype, 'findWithExpiringCredentials')
        .mockResolvedValue([mockCaregiver]);

      const alerts = await service.generateAlerts('org-123');

      // Should only include 30 and 7 day items (at threshold boundaries)
      // 45 days is not at a threshold
      expect(alerts.length).toBe(2);
      const alertNames = alerts.map(a => a.itemName);
      expect(alertNames).toContain('At 30 days');
      expect(alertNames).toContain('At 7 days');
      expect(alertNames).not.toContain('At 45 days');
    });

    it('should include all items when forceAll is true', async () => {
      const mockCaregiver = createMockCaregiver({
        credentials: [
          createMockCredential({ id: 'c1', name: 'At 45 days', expirationDate: daysFromNow(45) }),
        ],
      });

      vi.spyOn(CaregiverRepository.prototype, 'findWithExpiringCredentials')
        .mockResolvedValue([mockCaregiver]);

      const alerts = await service.generateAlerts('org-123', { forceAll: true });

      expect(alerts.length).toBe(1);
      expect(alerts[0]!.itemName).toBe('At 45 days');
    });

    it('should always include expired items in alerts', async () => {
      const mockCaregiver = createMockCaregiver({
        credentials: [
          createMockCredential({ id: 'c1', name: 'Expired', expirationDate: daysFromNow(-3) }),
        ],
      });

      vi.spyOn(CaregiverRepository.prototype, 'findWithExpiringCredentials')
        .mockResolvedValue([mockCaregiver]);

      const alerts = await service.generateAlerts('org-123');

      expect(alerts.length).toBe(1);
      expect(alerts[0]!.itemName).toBe('Expired');
      expect(alerts[0]!.severity).toBe('EXPIRED');
    });
  });

  describe('severity levels', () => {
    it('should assign EXPIRED severity for negative days', async () => {
      const mockCaregiver = createMockCaregiver({
        credentials: [createMockCredential({ expirationDate: daysFromNow(-1) })],
      });

      vi.spyOn(CaregiverRepository.prototype, 'findWithExpiringCredentials')
        .mockResolvedValue([mockCaregiver]);

      const items = await service.getExpiringItems('org-123', { includeExpired: true });

      expect(items[0]!.severity).toBe('EXPIRED');
    });

    it('should assign CRITICAL severity for 7 days or less', async () => {
      const mockCaregiver = createMockCaregiver({
        credentials: [createMockCredential({ expirationDate: daysFromNow(5) })],
      });

      vi.spyOn(CaregiverRepository.prototype, 'findWithExpiringCredentials')
        .mockResolvedValue([mockCaregiver]);

      const items = await service.getExpiringItems('org-123');

      expect(items[0]!.severity).toBe('CRITICAL');
    });

    it('should assign WARNING severity for 8-30 days', async () => {
      const mockCaregiver = createMockCaregiver({
        credentials: [createMockCredential({ expirationDate: daysFromNow(20) })],
      });

      vi.spyOn(CaregiverRepository.prototype, 'findWithExpiringCredentials')
        .mockResolvedValue([mockCaregiver]);

      const items = await service.getExpiringItems('org-123');

      expect(items[0]!.severity).toBe('WARNING');
    });

    it('should assign INFO severity for more than 30 days', async () => {
      const mockCaregiver = createMockCaregiver({
        credentials: [createMockCredential({ expirationDate: daysFromNow(60) })],
      });

      vi.spyOn(CaregiverRepository.prototype, 'findWithExpiringCredentials')
        .mockResolvedValue([mockCaregiver]);

      const items = await service.getExpiringItems('org-123');

      expect(items[0]!.severity).toBe('INFO');
    });
  });
});
