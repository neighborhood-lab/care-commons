/**
 * Audit Service Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuditService } from '../services/audit-service.js';
import { AuditRepository, AuditFindingRepository, CorrectiveActionRepository } from '../repositories/audit-repository.js';
import { PermissionService } from '@care-commons/core';
import type { UserContext } from '@care-commons/core';
import type { CreateAuditInput, CreateAuditFindingInput, CreateCorrectiveActionInput } from '../types/audit.js';

describe('AuditService', () => {
  let auditService: AuditService;
  let mockAuditRepo: any;
  let mockFindingRepo: any;
  let mockCorrectiveActionRepo: any;
  let mockPermissions: any;
  let mockContext: UserContext;

  beforeEach(() => {
    // Create mock repositories
    mockAuditRepo = {
      createAudit: vi.fn(),
      findById: vi.fn(),
      update: vi.fn(),
      getAuditSummaries: vi.fn(),
      updateFindingsCounts: vi.fn(),
    };

    mockFindingRepo = {
      createFinding: vi.fn(),
      findById: vi.fn(),
      findByAuditId: vi.fn(),
      update: vi.fn(),
      getCriticalFindings: vi.fn(),
    };

    mockCorrectiveActionRepo = {
      createCorrectiveAction: vi.fn(),
      findById: vi.fn(),
      findByAuditId: vi.fn(),
      update: vi.fn(),
      getOverdueActions: vi.fn(),
    };

    mockPermissions = {
      hasPermission: vi.fn().mockReturnValue(true),
    };

    mockContext = {
      userId: 'user-123',
      organizationId: 'org-123',
      roles: ['auditor'],
      permissions: ['audits:create', 'audits:view', 'audits:update'],
      branchIds: ['branch-123'],
    };

    auditService = new AuditService(
      mockAuditRepo as unknown as AuditRepository,
      mockFindingRepo as unknown as AuditFindingRepository,
      mockCorrectiveActionRepo as unknown as CorrectiveActionRepository,
      mockPermissions as unknown as PermissionService
    );
  });

  describe('createAudit', () => {
    it('should create an audit successfully', async () => {
      const input: CreateAuditInput = {
        title: 'Q1 2024 Compliance Audit',
        description: 'Quarterly compliance review',
        auditType: 'COMPLIANCE',
        priority: 'HIGH',
        scope: 'BRANCH',
        scopeEntityId: 'branch-123',
        scheduledStartDate: new Date('2024-01-15'),
        scheduledEndDate: new Date('2024-01-20'),
        leadAuditorId: 'auditor-123',
      };

      const mockAudit = {
        id: 'audit-123',
        ...input,
        auditNumber: 'AUD-2024-0001',
        status: 'DRAFT',
        leadAuditorName: 'John Doe',
        auditorIds: [],
        totalFindings: 0,
        criticalFindings: 0,
        majorFindings: 0,
        minorFindings: 0,
        requiresFollowUp: false,
        organizationId: 'org-123',
        branchId: 'branch-123',
        createdAt: new Date(),
        createdBy: 'user-123',
        updatedAt: new Date(),
        updatedBy: 'user-123',
        version: 1,
      };

      mockAuditRepo.createAudit.mockResolvedValue(mockAudit);

      const result = await auditService.createAudit(input, mockContext);

      expect(result).toEqual(mockAudit);
      expect(mockPermissions.hasPermission).toHaveBeenCalledWith(mockContext, 'audits:create');
      expect(mockAuditRepo.createAudit).toHaveBeenCalled();
    });

    it('should throw error if user lacks permission', async () => {
      mockPermissions.hasPermission.mockReturnValue(false);

      const input: CreateAuditInput = {
        title: 'Test Audit',
        description: 'Test',
        auditType: 'COMPLIANCE',
        priority: 'LOW',
        scope: 'BRANCH',
        scheduledStartDate: new Date(),
        scheduledEndDate: new Date(),
        leadAuditorId: 'auditor-123',
      };

      await expect(auditService.createAudit(input, mockContext)).rejects.toThrow('Insufficient permissions');
    });

    it('should throw error if start date is after end date', async () => {
      const input: CreateAuditInput = {
        title: 'Test Audit',
        description: 'Test',
        auditType: 'COMPLIANCE',
        priority: 'LOW',
        scope: 'BRANCH',
        scheduledStartDate: new Date('2024-01-20'),
        scheduledEndDate: new Date('2024-01-15'),
        leadAuditorId: 'auditor-123',
      };

      await expect(auditService.createAudit(input, mockContext)).rejects.toThrow('Scheduled start date must be before end date');
    });
  });

  describe('startAudit', () => {
    it('should start a scheduled audit', async () => {
      const mockAudit = {
        id: 'audit-123',
        status: 'SCHEDULED',
      };

      const updatedAudit = {
        ...mockAudit,
        status: 'IN_PROGRESS',
        actualStartDate: new Date(),
      };

      mockAuditRepo.findById.mockResolvedValue(mockAudit);
      mockAuditRepo.update.mockResolvedValue(updatedAudit);

      const result = await auditService.startAudit('audit-123', mockContext);

      expect(result.status).toBe('IN_PROGRESS');
      expect(mockAuditRepo.update).toHaveBeenCalledWith(
        'audit-123',
        expect.objectContaining({
          status: 'IN_PROGRESS',
          actualStartDate: expect.any(Date),
        }),
        mockContext
      );
    });

    it('should throw error if audit not found', async () => {
      mockAuditRepo.findById.mockResolvedValue(null);

      await expect(auditService.startAudit('nonexistent', mockContext)).rejects.toThrow('Audit not found');
    });

    it('should throw error if audit is not in scheduled or draft status', async () => {
      const mockAudit = {
        id: 'audit-123',
        status: 'COMPLETED',
      };

      mockAuditRepo.findById.mockResolvedValue(mockAudit);

      await expect(auditService.startAudit('audit-123', mockContext)).rejects.toThrow('Can only start audits that are scheduled or in draft');
    });
  });

  describe('createFinding', () => {
    it('should create a finding successfully', async () => {
      const input: CreateAuditFindingInput = {
        auditId: 'audit-123',
        title: 'Missing Certification',
        description: 'Caregiver certification expired',
        category: 'TRAINING',
        severity: 'MAJOR',
        requiredCorrectiveAction: 'Renew certification within 7 days',
      };

      const mockAudit = { id: 'audit-123', status: 'IN_PROGRESS' };
      const mockFinding = {
        id: 'finding-123',
        ...input,
        findingNumber: 'F-001',
        status: 'OPEN',
        observedBy: 'user-123',
        observedByName: 'John Doe',
        observedAt: new Date(),
        requiresFollowUp: false,
        organizationId: 'org-123',
        createdAt: new Date(),
        createdBy: 'user-123',
        updatedAt: new Date(),
        updatedBy: 'user-123',
        version: 1,
      };

      mockAuditRepo.findById.mockResolvedValue(mockAudit);
      mockFindingRepo.createFinding.mockResolvedValue(mockFinding);
      mockAuditRepo.updateFindingsCounts.mockResolvedValue(undefined);

      const result = await auditService.createFinding(input, mockContext);

      expect(result).toEqual(mockFinding);
      expect(mockFindingRepo.createFinding).toHaveBeenCalled();
      expect(mockAuditRepo.updateFindingsCounts).toHaveBeenCalledWith('audit-123');
    });

    it('should throw error if audit not found', async () => {
      const input: CreateAuditFindingInput = {
        auditId: 'nonexistent',
        title: 'Test Finding',
        description: 'Test',
        category: 'OTHER',
        severity: 'MINOR',
        requiredCorrectiveAction: 'Fix it',
      };

      mockAuditRepo.findById.mockResolvedValue(null);

      await expect(auditService.createFinding(input, mockContext)).rejects.toThrow('Audit not found');
    });
  });

  describe('createCorrectiveAction', () => {
    it('should create a corrective action successfully', async () => {
      const input: CreateCorrectiveActionInput = {
        findingId: 'finding-123',
        auditId: 'audit-123',
        title: 'Renew Certification',
        description: 'Schedule and complete certification renewal',
        actionType: 'IMMEDIATE',
        specificActions: [
          'Contact training provider',
          'Schedule exam',
          'Complete certification',
        ],
        responsiblePersonId: 'manager-123',
        targetCompletionDate: new Date('2024-01-25'),
      };

      const mockFinding = { id: 'finding-123', status: 'OPEN' };
      const mockAction = {
        id: 'action-123',
        ...input,
        actionNumber: 'CA-001',
        status: 'PLANNED',
        completionPercentage: 0,
        responsiblePersonName: 'Jane Manager',
        organizationId: 'org-123',
        createdAt: new Date(),
        createdBy: 'user-123',
        updatedAt: new Date(),
        updatedBy: 'user-123',
        version: 1,
      };

      mockFindingRepo.findById.mockResolvedValue(mockFinding);
      mockCorrectiveActionRepo.createCorrectiveAction.mockResolvedValue(mockAction);
      mockFindingRepo.update.mockResolvedValue({ ...mockFinding, status: 'IN_PROGRESS' });

      const result = await auditService.createCorrectiveAction(input, mockContext);

      expect(result).toEqual(mockAction);
      expect(mockCorrectiveActionRepo.createCorrectiveAction).toHaveBeenCalled();
    });

    it('should throw error if finding not found', async () => {
      const input: CreateCorrectiveActionInput = {
        findingId: 'nonexistent',
        auditId: 'audit-123',
        title: 'Test Action',
        description: 'Test',
        actionType: 'IMMEDIATE',
        specificActions: ['Do something'],
        responsiblePersonId: 'manager-123',
        targetCompletionDate: new Date(),
      };

      mockFindingRepo.findById.mockResolvedValue(null);

      await expect(auditService.createCorrectiveAction(input, mockContext)).rejects.toThrow('Finding not found');
    });
  });

  describe('completeAudit', () => {
    it('should complete an audit successfully', async () => {
      const mockAudit = {
        id: 'audit-123',
        status: 'IN_PROGRESS',
      };

      const mockFindings = [
        { severity: 'CRITICAL' },
        { severity: 'MAJOR' },
        { severity: 'MINOR' },
      ];

      const updatedAudit = {
        ...mockAudit,
        status: 'COMPLETED',
        actualEndDate: new Date(),
        executiveSummary: 'Audit completed successfully',
        recommendations: 'Address critical findings first',
        complianceScore: 70,
      };

      mockAuditRepo.findById.mockResolvedValue(mockAudit);
      mockFindingRepo.findByAuditId.mockResolvedValue(mockFindings);
      mockAuditRepo.update.mockResolvedValue(updatedAudit);

      const result = await auditService.completeAudit(
        'audit-123',
        'Audit completed successfully',
        'Address critical findings first',
        mockContext
      );

      expect(result.status).toBe('COMPLETED');
      expect(result.complianceScore).toBeDefined();
    });
  });

  describe('getAuditDashboard', () => {
    it('should return dashboard data', async () => {
      const mockUpcoming = [{ id: '1', status: 'SCHEDULED' }];
      const mockInProgress = [{ id: '2', status: 'IN_PROGRESS' }];
      const mockCompleted = [{ id: '3', status: 'COMPLETED' }];
      const mockCriticalFindings = [{ id: 'f1', severity: 'CRITICAL' }];
      const mockOverdueActions = [{ id: 'a1', status: 'IN_PROGRESS' }];

      mockAuditRepo.getAuditSummaries
        .mockResolvedValueOnce(mockUpcoming)
        .mockResolvedValueOnce(mockInProgress)
        .mockResolvedValueOnce(mockCompleted);

      mockFindingRepo.getCriticalFindings.mockResolvedValue(mockCriticalFindings);
      mockCorrectiveActionRepo.getOverdueActions.mockResolvedValue(mockOverdueActions);

      const result = await auditService.getAuditDashboard(mockContext);

      expect(result).toHaveProperty('upcomingAudits');
      expect(result).toHaveProperty('inProgressAudits');
      expect(result).toHaveProperty('recentlyCompleted');
      expect(result).toHaveProperty('criticalFindings');
      expect(result).toHaveProperty('overdueCorrectiveActions');
      expect(result).toHaveProperty('statistics');
    });
  });
});
