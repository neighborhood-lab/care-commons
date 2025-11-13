/**
 * Quality Assurance & Audits Service Tests
 *
 * Tests business logic for audit management:
 * - Permission validation
 * - Audit creation, updating, and status transitions
 * - Findings and corrective actions management
 * - Compliance score calculation
 * - Error handling
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuditService } from '../audit-service.js';
import type { UserContext } from '@care-commons/core';
import type {
  Audit,
  CreateAuditInput,
  UpdateAuditInput,
  AuditFinding,
  CorrectiveAction,
} from '../../types/audit';

describe('AuditService', () => {
  let service: AuditService;
  let mockAuditRepo: any;
  let mockFindingRepo: any;
  let mockCorrectiveActionRepo: any;
  let mockPermissions: any;
  let userContext: UserContext;

  const mockAudit: Audit = {
    id: '00000000-0000-0000-0000-000000000001',
    auditNumber: 'AUD-2024-001',
    title: 'Annual Compliance Audit',
    description: 'Annual review of compliance standards',
    auditType: 'COMPLIANCE',
    status: 'DRAFT',
    priority: 'HIGH',
    scope: 'ORGANIZATION',
    scopeEntityId: null,
    scopeEntityName: null,
    scheduledStartDate: new Date('2024-02-01'),
    scheduledEndDate: new Date('2024-02-15'),
    actualStartDate: null,
    actualEndDate: null,
    leadAuditorId: '00000000-0000-0000-0000-000000000002',
    leadAuditorName: 'John Auditor',
    auditorIds: [],
    standardsReference: ['ISO 9001', 'HIPAA'],
    auditCriteria: null,
    templateId: null,
    totalFindings: 0,
    criticalFindings: 0,
    majorFindings: 0,
    minorFindings: 0,
    complianceScore: null,
    overallRating: null,
    executiveSummary: null,
    recommendations: null,
    attachmentUrls: null,
    reviewedBy: null,
    reviewedAt: null,
    approvedBy: null,
    approvedAt: null,
    requiresFollowUp: false,
    followUpDate: null,
    followUpAuditId: null,
    organizationId: '00000000-0000-0000-0000-000000000003',
    branchId: '00000000-0000-0000-0000-000000000004',
    createdAt: new Date('2024-01-15'),
    createdBy: '00000000-0000-0000-0000-000000000005',
    updatedAt: new Date('2024-01-15'),
    updatedBy: '00000000-0000-0000-0000-000000000005',
    version: 1,
  };

  beforeEach(() => {
    // Mock repositories
    mockAuditRepo = {
      createAudit: vi.fn(),
      findById: vi.fn(),
      update: vi.fn(),
      findAll: vi.fn(),
    };

    mockFindingRepo = {
      findByAuditId: vi.fn(),
      createFinding: vi.fn(),
      updateFinding: vi.fn(),
    };

    mockCorrectiveActionRepo = {
      findByAuditId: vi.fn(),
      createCorrectiveAction: vi.fn(),
      updateProgress: vi.fn(),
    };

    // Mock permissions service
    mockPermissions = {
      hasPermission: vi.fn().mockReturnValue(true),
    };

    // User context
    userContext = {
      userId: '00000000-0000-0000-0000-000000000005',
      organizationId: '00000000-0000-0000-0000-000000000003',
      branchIds: ['00000000-0000-0000-0000-000000000004'],
      roles: ['ADMIN'],
      permissions: ['audits:create', 'audits:view', 'audits:update'],
    };

    service = new AuditService(
      mockAuditRepo,
      mockFindingRepo,
      mockCorrectiveActionRepo,
      mockPermissions
    );
  });

  describe('createAudit', () => {
    const createInput: CreateAuditInput = {
      title: 'Annual Compliance Audit',
      description: 'Annual review of compliance standards',
      auditType: 'COMPLIANCE',
      priority: 'HIGH',
      scope: 'ORGANIZATION',
      scheduledStartDate: new Date('2024-02-01'),
      scheduledEndDate: new Date('2024-02-15'),
      leadAuditorId: '00000000-0000-0000-0000-000000000002',
      leadAuditorName: 'John Auditor',
    };

    it('should create audit with valid permissions', async () => {
      mockAuditRepo.createAudit.mockResolvedValue(mockAudit);

      const result = await service.createAudit(createInput, userContext);

      expect(result).toEqual(mockAudit);
      expect(mockPermissions.hasPermission).toHaveBeenCalledWith(userContext, 'audits:create');
      expect(mockAuditRepo.createAudit).toHaveBeenCalledWith({
        ...createInput,
        createdBy: userContext.userId,
        organizationId: userContext.organizationId,
        branchId: userContext.branchIds[0],
      });
    });

    it('should throw PermissionError when user lacks permissions', async () => {
      mockPermissions.hasPermission.mockReturnValue(false);

      await expect(service.createAudit(createInput, userContext)).rejects.toThrow(
        'Insufficient permissions to create audits'
      );

      expect(mockAuditRepo.createAudit).not.toHaveBeenCalled();
    });

    it('should throw ValidationError when start date is after end date', async () => {
      const invalidInput = {
        ...createInput,
        scheduledStartDate: new Date('2024-02-15'),
        scheduledEndDate: new Date('2024-02-01'),
      };

      await expect(service.createAudit(invalidInput, userContext)).rejects.toThrow(
        'Scheduled start date must be before end date'
      );

      expect(mockAuditRepo.createAudit).not.toHaveBeenCalled();
    });
  });

  describe('getAudit', () => {
    it('should return audit when user has permissions', async () => {
      mockAuditRepo.findById.mockResolvedValue(mockAudit);

      const result = await service.getAudit(mockAudit.id, userContext);

      expect(result).toEqual(mockAudit);
      expect(mockPermissions.hasPermission).toHaveBeenCalledWith(userContext, 'audits:view');
      expect(mockAuditRepo.findById).toHaveBeenCalledWith(mockAudit.id);
    });

    it('should throw PermissionError when user lacks permissions', async () => {
      mockPermissions.hasPermission.mockReturnValue(false);

      await expect(service.getAudit(mockAudit.id, userContext)).rejects.toThrow(
        'Insufficient permissions to view audits'
      );

      expect(mockAuditRepo.findById).not.toHaveBeenCalled();
    });

    it('should return null when audit not found', async () => {
      mockAuditRepo.findById.mockResolvedValue(null);

      const result = await service.getAudit(mockAudit.id, userContext);

      expect(result).toBeNull();
    });
  });

  describe('getAuditDetail', () => {
    const mockFindings: AuditFinding[] = [
      {
        id: '00000000-0000-0000-0000-000000000010',
        auditId: mockAudit.id,
        findingNumber: 'F-001',
        category: 'DOCUMENTATION',
        severity: 'MAJOR',
        title: 'Missing documentation',
        description: 'Required documentation not found',
        evidenceDescription: 'Checked files',
        evidenceAttachmentUrls: null,
        regulatoryReference: null,
        standardReference: null,
        recommendations: 'Complete documentation',
        affectedAreaDescription: 'All departments',
        riskLevel: 'MEDIUM',
        status: 'OPEN',
        identifiedDate: new Date('2024-02-05'),
        identifiedBy: userContext.userId,
        assignedTo: null,
        dueDate: new Date('2024-03-05'),
        resolvedDate: null,
        resolvedBy: null,
        resolutionNotes: null,
        organizationId: mockAudit.organizationId,
        branchId: mockAudit.branchId,
        createdAt: new Date('2024-02-05'),
        createdBy: userContext.userId,
        updatedAt: new Date('2024-02-05'),
        updatedBy: userContext.userId,
        version: 1,
      },
    ];

    const mockCorrectiveActions: CorrectiveAction[] = [];

    it('should return audit detail with findings and corrective actions', async () => {
      mockAuditRepo.findById.mockResolvedValue(mockAudit);
      mockFindingRepo.findByAuditId.mockResolvedValue(mockFindings);
      mockCorrectiveActionRepo.findByAuditId.mockResolvedValue(mockCorrectiveActions);

      const result = await service.getAuditDetail(mockAudit.id, userContext);

      expect(result).toEqual({
        ...mockAudit,
        findings: mockFindings,
        correctiveActions: mockCorrectiveActions,
      });
      expect(mockPermissions.hasPermission).toHaveBeenCalledWith(
        userContext,
        'audits:view'
      );
    });

    it('should throw PermissionError when user lacks permissions', async () => {
      mockPermissions.hasPermission.mockReturnValue(false);

      await expect(service.getAuditDetail(mockAudit.id, userContext)).rejects.toThrow(
        'Insufficient permissions to view audit details'
      );
    });

    it('should return null when audit not found', async () => {
      mockAuditRepo.findById.mockResolvedValue(null);

      const result = await service.getAuditDetail(mockAudit.id, userContext);

      expect(result).toBeNull();
    });
  });

  describe('updateAudit', () => {
    const updateInput: UpdateAuditInput = {
      title: 'Updated Title',
      description: 'Updated Description',
    };

    it('should update audit when user has permissions', async () => {
      const updatedAudit = { ...mockAudit, ...updateInput };
      mockAuditRepo.findById.mockResolvedValue(mockAudit);
      mockAuditRepo.update.mockResolvedValue(updatedAudit);

      const result = await service.updateAudit(mockAudit.id, updateInput, userContext);

      expect(result).toEqual(updatedAudit);
      expect(mockPermissions.hasPermission).toHaveBeenCalledWith(
        userContext,
        'audits:update'
      );
      expect(mockAuditRepo.update).toHaveBeenCalledWith(
        mockAudit.id,
        {
          ...updateInput,
          updatedBy: userContext.userId,
        },
        userContext
      );
    });

    it('should throw PermissionError when user lacks permissions', async () => {
      mockPermissions.hasPermission.mockReturnValue(false);

      await expect(
        service.updateAudit(mockAudit.id, updateInput, userContext)
      ).rejects.toThrow('Insufficient permissions to update audits');

      expect(mockAuditRepo.findById).not.toHaveBeenCalled();
    });

    it('should throw NotFoundError when audit not found', async () => {
      mockAuditRepo.findById.mockResolvedValue(null);

      await expect(
        service.updateAudit(mockAudit.id, updateInput, userContext)
      ).rejects.toThrow('Audit not found');

      expect(mockAuditRepo.update).not.toHaveBeenCalled();
    });
  });

  describe('startAudit', () => {
    it('should start audit when status is SCHEDULED', async () => {
      const scheduledAudit = { ...mockAudit, status: 'SCHEDULED' as const };
      const inProgressAudit = { ...scheduledAudit, status: 'IN_PROGRESS' as const };
      mockAuditRepo.findById.mockResolvedValue(scheduledAudit);
      mockAuditRepo.update.mockResolvedValue(inProgressAudit);

      const result = await service.startAudit(mockAudit.id, userContext);

      expect(result.status).toBe('IN_PROGRESS');
      expect(mockAuditRepo.update).toHaveBeenCalledWith(
        mockAudit.id,
        expect.objectContaining({
          status: 'IN_PROGRESS',
          actualStartDate: expect.any(Date),
          updatedBy: userContext.userId,
        }),
        userContext
      );
    });

    it('should start audit when status is DRAFT', async () => {
      const draftAudit = { ...mockAudit, status: 'DRAFT' as const };
      mockAuditRepo.findById.mockResolvedValue(draftAudit);
      mockAuditRepo.update.mockResolvedValue({ ...draftAudit, status: 'IN_PROGRESS' as const });

      await service.startAudit(mockAudit.id, userContext);

      expect(mockAuditRepo.update).toHaveBeenCalled();
    });

    it('should throw NotFoundError when audit not found', async () => {
      mockAuditRepo.findById.mockResolvedValue(null);

      await expect(service.startAudit(mockAudit.id, userContext)).rejects.toThrow(
        'Audit not found'
      );
    });

    it('should throw ValidationError when audit is already in progress', async () => {
      const inProgressAudit = { ...mockAudit, status: 'IN_PROGRESS' as const };
      mockAuditRepo.findById.mockResolvedValue(inProgressAudit);

      await expect(service.startAudit(mockAudit.id, userContext)).rejects.toThrow(
        'Can only start audits that are scheduled or in draft'
      );
    });

    it('should throw ValidationError when audit is completed', async () => {
      const completedAudit = { ...mockAudit, status: 'COMPLETED' as const };
      mockAuditRepo.findById.mockResolvedValue(completedAudit);

      await expect(service.startAudit(mockAudit.id, userContext)).rejects.toThrow(
        'Can only start audits that are scheduled or in draft'
      );
    });
  });

  describe('completeAudit', () => {
    it('should complete audit when status is IN_PROGRESS', async () => {
      const inProgressAudit = { ...mockAudit, status: 'IN_PROGRESS' as const };
      const completedAudit = {
        ...inProgressAudit,
        status: 'COMPLETED' as const,
        complianceScore: 85,
      };
      mockAuditRepo.findById.mockResolvedValue(inProgressAudit);
      mockAuditRepo.update.mockResolvedValue(completedAudit);

      // Mock calculateComplianceScore method
      vi.spyOn(service as any, 'calculateComplianceScore').mockResolvedValue(85);

      const result = await service.completeAudit(
        mockAudit.id,
        'Executive summary',
        'Recommendations',
        userContext
      );

      expect(result.status).toBe('COMPLETED');
      expect(result.complianceScore).toBe(85);
      expect(mockAuditRepo.update).toHaveBeenCalledWith(
        mockAudit.id,
        expect.objectContaining({
          status: 'COMPLETED',
          actualEndDate: expect.any(Date),
          executiveSummary: 'Executive summary',
          recommendations: 'Recommendations',
          complianceScore: 85,
          updatedBy: userContext.userId,
        }),
        userContext
      );
    });

    it('should complete audit when status is FINDINGS_REVIEW', async () => {
      const reviewAudit = { ...mockAudit, status: 'FINDINGS_REVIEW' as const };
      mockAuditRepo.findById.mockResolvedValue(reviewAudit);
      mockAuditRepo.update.mockResolvedValue({ ...reviewAudit, status: 'COMPLETED' as const });
      vi.spyOn(service as any, 'calculateComplianceScore').mockResolvedValue(90);

      await service.completeAudit(
        mockAudit.id,
        'Executive summary',
        'Recommendations',
        userContext
      );

      expect(mockAuditRepo.update).toHaveBeenCalled();
    });

    it('should throw NotFoundError when audit not found', async () => {
      mockAuditRepo.findById.mockResolvedValue(null);

      await expect(
        service.completeAudit(mockAudit.id, 'Summary', 'Recommendations', userContext)
      ).rejects.toThrow('Audit not found');
    });

    it('should throw ValidationError when audit is DRAFT', async () => {
      mockAuditRepo.findById.mockResolvedValue(mockAudit); // status is DRAFT

      await expect(
        service.completeAudit(mockAudit.id, 'Summary', 'Recommendations', userContext)
      ).rejects.toThrow('Can only complete audits that are in progress or in findings review');
    });

    it('should throw ValidationError when audit is already COMPLETED', async () => {
      const completedAudit = { ...mockAudit, status: 'COMPLETED' as const };
      mockAuditRepo.findById.mockResolvedValue(completedAudit);

      await expect(
        service.completeAudit(mockAudit.id, 'Summary', 'Recommendations', userContext)
      ).rejects.toThrow('Can only complete audits that are in progress or in findings review');
    });
  });
});
