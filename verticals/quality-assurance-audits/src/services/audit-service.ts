/* eslint-disable sonarjs/todo-tag */
/**
 * Quality Assurance & Audits Service
 *
 * Business logic for audit management, findings, and corrective actions
 */

import type {
  UserContext,
  UUID,
  ValidationError,
  PermissionError,
  NotFoundError
} from '@care-commons/core';
import { PermissionService } from '@care-commons/core';
import type {
  Audit,
  AuditFinding,
  CorrectiveAction,
  CreateAuditInput,
  UpdateAuditInput,
  CreateAuditFindingInput,
  CreateCorrectiveActionInput,
  UpdateCorrectiveActionProgressInput,
  AuditSummary,
  AuditDetail,
  AuditDashboard,
  AuditStatistics
} from '../types/audit';
import {
  AuditRepository,
  AuditFindingRepository,
  CorrectiveActionRepository
} from '../repositories/audit-repository';

/**
 * Service for managing quality assurance and audits
 */
export class AuditService {
  constructor(
    private auditRepo: AuditRepository,
    private findingRepo: AuditFindingRepository,
    private correctiveActionRepo: CorrectiveActionRepository,
    private permissions: PermissionService
  ) {}

  // ============================================================================
  // Audit Management
  // ============================================================================

  /**
   * Create a new audit
   */
  async createAudit(
    input: CreateAuditInput,
    context: UserContext
  ): Promise<Audit> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'audits:create')) {
      throw new Error('Insufficient permissions to create audits') as PermissionError;
    }

    // Validate dates
    if (new Date(input.scheduledStartDate) > new Date(input.scheduledEndDate)) {
      throw new Error('Scheduled start date must be before end date') as ValidationError;
    }

    // Create audit
    const audit = await this.auditRepo.createAudit({
      ...input,
      createdBy: context.userId,
      organizationId: context.organizationId,
      branchId: context.branchIds[0]
    });

    return audit;
  }

  /**
   * Get audit by ID
   */
  async getAudit(
    auditId: UUID,
    context: UserContext
  ): Promise<Audit | null> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'audits:view')) {
      throw new Error('Insufficient permissions to view audits') as PermissionError;
    }

    return await this.auditRepo.findById(auditId);
  }

  /**
   * Get audit with findings and corrective actions
   */
  async getAuditDetail(
    auditId: UUID,
    context: UserContext
  ): Promise<AuditDetail | null> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'audits:view')) {
      throw new Error('Insufficient permissions to view audit details') as PermissionError;
    }

    const audit = await this.auditRepo.findById(auditId);
    if (!audit) {
      return null;
    }

    const findings = await this.findingRepo.findByAuditId(auditId);
    const correctiveActions = await this.correctiveActionRepo.findByAuditId(auditId);

    return {
      ...audit,
      findings,
      correctiveActions
    };
  }

  /**
   * Update audit
   */
  async updateAudit(
    auditId: UUID,
    updates: UpdateAuditInput,
    context: UserContext
  ): Promise<Audit> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'audits:update')) {
      throw new Error('Insufficient permissions to update audits') as PermissionError;
    }

    const audit = await this.auditRepo.findById(auditId);
    if (!audit) {
      throw new Error('Audit not found') as NotFoundError;
    }

    // Validate status transitions
    if (updates.status && !this.isValidStatusTransition(audit.status, updates.status)) {
      throw new Error(`Invalid status transition from ${audit.status} to ${updates.status}`) as ValidationError;
    }

    return await this.auditRepo.update(auditId, {
      ...updates,
      updatedBy: context.userId
    }, context);
  }

  /**
   * Start audit (move to in progress)
   */
  async startAudit(
    auditId: UUID,
    context: UserContext
  ): Promise<Audit> {
    const audit = await this.auditRepo.findById(auditId);
    if (!audit) {
      throw new Error('Audit not found') as NotFoundError;
    }

    if (audit.status !== 'SCHEDULED' && audit.status !== 'DRAFT') {
      throw new Error('Can only start audits that are scheduled or in draft') as ValidationError;
    }

    return await this.auditRepo.update(auditId, {
      status: 'IN_PROGRESS',
      actualStartDate: new Date(),
      updatedBy: context.userId
    }, context);
  }

  /**
   * Complete audit
   */
  async completeAudit(
    auditId: UUID,
    executiveSummary: string,
    recommendations: string,
    context: UserContext
  ): Promise<Audit> {
    const audit = await this.auditRepo.findById(auditId);
    if (!audit) {
      throw new Error('Audit not found') as NotFoundError;
    }

    if (audit.status !== 'IN_PROGRESS' && audit.status !== 'FINDINGS_REVIEW') {
      throw new Error('Can only complete audits that are in progress or in findings review') as ValidationError;
    }

    // Calculate compliance score
    const complianceScore = await this.calculateComplianceScore(auditId);

    return await this.auditRepo.update(auditId, {
      status: 'COMPLETED',
      actualEndDate: new Date(),
      executiveSummary,
      recommendations,
      complianceScore,
      updatedBy: context.userId
    }, context);
  }

  /**
   * Get audit summaries with filters
   */
  async getAuditSummaries(
    filters: { status?: string; auditType?: string; branchId?: UUID },
    context: UserContext
  ): Promise<AuditSummary[]> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'audits:view')) {
      throw new Error('Insufficient permissions to view audits') as PermissionError;
    }

    return await this.auditRepo.getAuditSummaries(context.organizationId, filters);
  }

  /**
   * Calculate compliance score based on findings
   */
  private async calculateComplianceScore(auditId: UUID): Promise<number> {
    const findings = await this.findingRepo.findByAuditId(auditId);

    if (findings.length === 0) {
      return 100;
    }

    // Weight findings by severity
    const weights = {
      CRITICAL: 10,
      MAJOR: 5,
      MINOR: 2,
      OBSERVATION: 1
    };

    const totalWeight = findings.reduce((sum, finding) => {
      return sum + weights[finding.severity];
    }, 0);

    // Assume perfect score is 0 deductions, worst score is 100% deductions
    const maxPossibleWeight = findings.length * weights.CRITICAL;
    const score = Math.max(0, 100 - (totalWeight / maxPossibleWeight) * 100);

    return Math.round(score);
  }

  /**
   * Validate status transition
   */
  private isValidStatusTransition(currentStatus: string, newStatus: string): boolean {
    const validTransitions: Record<string, string[]> = {
      DRAFT: ['SCHEDULED', 'IN_PROGRESS'],
      SCHEDULED: ['IN_PROGRESS', 'DRAFT'],
      IN_PROGRESS: ['FINDINGS_REVIEW', 'COMPLETED'],
      FINDINGS_REVIEW: ['CORRECTIVE_ACTIONS', 'COMPLETED', 'IN_PROGRESS'],
      CORRECTIVE_ACTIONS: ['COMPLETED'],
      COMPLETED: ['APPROVED', 'ARCHIVED'],
      APPROVED: ['ARCHIVED'],
      ARCHIVED: []
    };

    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }

  // ============================================================================
  // Audit Findings Management
  // ============================================================================

  /**
   * Create audit finding
   */
  async createFinding(
    input: CreateAuditFindingInput,
    context: UserContext
  ): Promise<AuditFinding> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'audits:create-findings')) {
      throw new Error('Insufficient permissions to create findings') as PermissionError;
    }

    // Verify audit exists
    const audit = await this.auditRepo.findById(input.auditId);
    if (!audit) {
      throw new Error('Audit not found') as NotFoundError;
    }

    // Create finding
    const finding = await this.findingRepo.createFinding({
      ...input,
      observedBy: context.userId,
      createdBy: context.userId,
      organizationId: context.organizationId,
      branchId: context.branchIds[0]
    });

    // Update audit findings count
    await this.auditRepo.updateFindingsCounts(input.auditId);

    return finding;
  }

  /**
   * Get findings for audit
   */
  async getFindingsForAudit(
    auditId: UUID,
    context: UserContext
  ): Promise<AuditFinding[]> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'audits:view')) {
      throw new Error('Insufficient permissions to view findings') as PermissionError;
    }

    return await this.findingRepo.findByAuditId(auditId);
  }

  /**
   * Update finding status
   */
  async updateFindingStatus(
    findingId: UUID,
    status: string,
    resolutionDescription?: string,
    context?: UserContext
  ): Promise<AuditFinding> {
    const finding = await this.findingRepo.findById(findingId);
    if (!finding) {
      throw new Error('Finding not found') as NotFoundError;
    }

    const updates: Partial<AuditFinding> = {
      status: status as AuditFinding['status']
    };

    if (status === 'RESOLVED') {
      updates.actualResolutionDate = new Date();
      updates.resolutionDescription = resolutionDescription;
    }

    return await this.findingRepo.update(findingId, updates, context as UserContext);
  }

  /**
   * Verify finding resolution
   */
  async verifyFinding(
    findingId: UUID,
    _verificationNotes: string,
    context: UserContext
  ): Promise<AuditFinding> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'audits:verify-findings')) {
      throw new Error('Insufficient permissions to verify findings') as PermissionError;
    }

    const finding = await this.findingRepo.findById(findingId);
    if (!finding) {
      throw new Error('Finding not found') as NotFoundError;
    }

    if (finding.status !== 'RESOLVED') {
      throw new Error('Can only verify resolved findings') as ValidationError;
    }

    return await this.findingRepo.update(findingId, {
      status: 'VERIFIED',
      verifiedBy: context.userId,
      verifiedAt: new Date()
    }, context);
  }

  /**
   * Get critical findings across organization
   */
  async getCriticalFindings(
    context: UserContext,
    limit: number = 10
  ): Promise<AuditFinding[]> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'audits:view')) {
      throw new Error('Insufficient permissions to view findings') as PermissionError;
    }

    return await this.findingRepo.getCriticalFindings(context.organizationId, limit);
  }

  // ============================================================================
  // Corrective Action Management
  // ============================================================================

  /**
   * Create corrective action
   */
  async createCorrectiveAction(
    input: CreateCorrectiveActionInput,
    context: UserContext
  ): Promise<CorrectiveAction> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'audits:create-corrective-actions')) {
      throw new Error('Insufficient permissions to create corrective actions') as PermissionError;
    }

    // Verify finding exists
    const finding = await this.findingRepo.findById(input.findingId);
    if (!finding) {
      throw new Error('Finding not found') as NotFoundError;
    }

    // Create corrective action
    const action = await this.correctiveActionRepo.createCorrectiveAction({
      ...input,
      createdBy: context.userId,
      organizationId: context.organizationId,
      branchId: context.branchIds[0]
    });

    // Update finding status to indicate corrective action in progress
    await this.updateFindingStatus(input.findingId, 'IN_PROGRESS', undefined, context);

    return action;
  }

  /**
   * Get corrective actions for audit
   */
  async getCorrectiveActionsForAudit(
    auditId: UUID,
    context: UserContext
  ): Promise<CorrectiveAction[]> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'audits:view')) {
      throw new Error('Insufficient permissions to view corrective actions') as PermissionError;
    }

    return await this.correctiveActionRepo.findByAuditId(auditId);
  }

  /**
   * Update corrective action progress
   */
  async updateCorrectiveActionProgress(
    actionId: UUID,
    progressInput: UpdateCorrectiveActionProgressInput,
    context: UserContext
  ): Promise<CorrectiveAction> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'audits:update-corrective-actions')) {
      throw new Error('Insufficient permissions to update corrective actions') as PermissionError;
    }

    const action = await this.correctiveActionRepo.findById(actionId);
    if (!action) {
      throw new Error('Corrective action not found') as NotFoundError;
    }

    // Add progress update
    const progressUpdate = {
      updateDate: new Date(),
      updatedBy: context.userId,
      updatedByName: context.userId, // Placeholder
      progressNote: progressInput.progressNote,
      completionPercentage: progressInput.completionPercentage,
      issuesEncountered: progressInput.issuesEncountered,
      nextSteps: progressInput.nextSteps
    };

    const progressUpdates = [...(action.progressUpdates || []), progressUpdate];

    // Update status based on completion percentage
    let status = action.status;
    if (progressInput.completionPercentage === 100) {
      status = 'IMPLEMENTED';
    } else if (progressInput.completionPercentage > 0 && status === 'PLANNED') {
      status = 'IN_PROGRESS';
    }

    return await this.correctiveActionRepo.update(actionId, {
      progressUpdates,
      completionPercentage: progressInput.completionPercentage,
      status,
      updatedBy: context.userId
    }, context);
  }

  /**
   * Complete corrective action
   */
  async completeCorrectiveAction(
    actionId: UUID,
    context: UserContext
  ): Promise<CorrectiveAction> {
    const action = await this.correctiveActionRepo.findById(actionId);
    if (!action) {
      throw new Error('Corrective action not found') as NotFoundError;
    }

    const updatedAction = await this.correctiveActionRepo.update(actionId, {
      status: 'IMPLEMENTED',
      actualCompletionDate: new Date(),
      completionPercentage: 100,
      updatedBy: context.userId
    }, context);

    // Update related finding
    await this.updateFindingStatus(action.findingId, 'RESOLVED', 'Corrective action completed', context);

    return updatedAction;
  }

  /**
   * Verify corrective action effectiveness
   */
  async verifyCorrectiveAction(
    actionId: UUID,
    effectivenessRating: 'EFFECTIVE' | 'PARTIALLY_EFFECTIVE' | 'INEFFECTIVE',
    verificationNotes: string,
    context: UserContext
  ): Promise<CorrectiveAction> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'audits:verify-corrective-actions')) {
      throw new Error('Insufficient permissions to verify corrective actions') as PermissionError;
    }

    const action = await this.correctiveActionRepo.findById(actionId);
    if (!action) {
      throw new Error('Corrective action not found') as NotFoundError;
    }

    if (action.status !== 'IMPLEMENTED') {
      throw new Error('Can only verify implemented corrective actions') as ValidationError;
    }

    const updatedAction = await this.correctiveActionRepo.update(actionId, {
      status: 'VERIFIED',
      verifiedBy: context.userId,
      verifiedAt: new Date(),
      verificationNotes,
      effectivenessRating,
      updatedBy: context.userId
    }, context);

    // If effective, close the finding
    if (effectivenessRating === 'EFFECTIVE') {
      await this.updateFindingStatus(action.findingId, 'CLOSED', verificationNotes, context);
    }

    return updatedAction;
  }

  /**
   * Get overdue corrective actions
   */
  async getOverdueCorrectiveActions(
    context: UserContext,
    limit: number = 20
  ): Promise<CorrectiveAction[]> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'audits:view')) {
      throw new Error('Insufficient permissions to view corrective actions') as PermissionError;
    }

    return await this.correctiveActionRepo.getOverdueActions(context.organizationId, limit);
  }

  // ============================================================================
  // Dashboard & Statistics
  // ============================================================================

  /**
   * Get audit dashboard data
   */
  async getAuditDashboard(context: UserContext): Promise<AuditDashboard> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'audits:view')) {
      throw new Error('Insufficient permissions to view audit dashboard') as PermissionError;
    }

    // Get upcoming audits
    const upcomingAudits = await this.auditRepo.getAuditSummaries(context.organizationId, {
      status: 'SCHEDULED'
    });

    // Get in-progress audits
    const inProgressAudits = await this.auditRepo.getAuditSummaries(context.organizationId, {
      status: 'IN_PROGRESS'
    });

    // Get recently completed
    const recentlyCompleted = await this.auditRepo.getAuditSummaries(context.organizationId, {
      status: 'COMPLETED'
    });

    // Get critical findings
    const criticalFindings = await this.findingRepo.getCriticalFindings(context.organizationId, 10);

    // Get overdue corrective actions
    const overdueCorrectiveActions = await this.correctiveActionRepo.getOverdueActions(context.organizationId, 10);

    // Calculate statistics from all audits
    const allAudits = [...upcomingAudits, ...inProgressAudits, ...recentlyCompleted];
    
    // Group audits by status
    const auditsByStatus: Record<string, number> = {};
    for (const audit of allAudits) {
      auditsByStatus[audit.status] = (auditsByStatus[audit.status] || 0) + 1;
    }
    
    // Group audits by type
    const auditsByType: Record<string, number> = {};
    for (const audit of allAudits) {
      auditsByType[audit.auditType] = (auditsByType[audit.auditType] || 0) + 1;
    }
    
    // Group findings by severity from critical findings
    const findingsBySeverity: Record<string, number> = {};
    for (const finding of criticalFindings) {
      findingsBySeverity[finding.severity] = (findingsBySeverity[finding.severity] || 0) + 1;
    }
    
    // Calculate average compliance score from completed audits
    const completedAuditsWithScores = recentlyCompleted.filter(audit => 
      audit.complianceScore !== undefined && audit.complianceScore !== null
    );
    const averageComplianceScore = completedAuditsWithScores.length > 0
      ? completedAuditsWithScores.reduce((sum, audit) => sum + (audit.complianceScore || 0), 0) / completedAuditsWithScores.length
      : 0;
    
    // Get all corrective actions for organization to count open ones
    // Use repository findAll method with high limit to get all for statistics
    const allCorrectiveActionsResult = await this.correctiveActionRepo.findAll({
      page: 1,
      limit: 1000 // High limit to get all for stats calculation
    });
    const openCorrectiveActions = allCorrectiveActionsResult.items.filter((action: CorrectiveAction) => 
      action.status !== 'IMPLEMENTED' && action.status !== 'VERIFIED' && action.status !== 'CLOSED'
    ).length;
    
    const statistics: AuditStatistics = {
      totalAudits: allAudits.length,
      auditsByStatus,
      auditsByType,
      totalFindings: criticalFindings.length,
      findingsBySeverity,
      averageComplianceScore: Math.round(averageComplianceScore * 10) / 10, // Round to 1 decimal
      openCorrectiveActions,
      overdueCorrectiveActions: overdueCorrectiveActions.length
    };

    return {
      upcomingAudits: upcomingAudits.slice(0, 5),
      inProgressAudits: inProgressAudits.slice(0, 5),
      recentlyCompleted: recentlyCompleted.slice(0, 5),
      criticalFindings,
      overdueCorrectiveActions,
      statistics
    };
  }
}
