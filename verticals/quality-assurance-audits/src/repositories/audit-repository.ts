/**
 * Quality Assurance & Audits Repository
 *
 * Data access layer for audits, findings, corrective actions, and templates
 */

import { Repository, Database } from '@care-commons/core';
import type { UUID } from '@care-commons/core';
import type {
  Audit,
  AuditFinding,
  CorrectiveAction,
  CreateAuditInput,
  CreateAuditFindingInput,
  CreateCorrectiveActionInput,
  AuditSummary
} from '../types/audit.js';

/**
 * Repository for audit management
 */
export class AuditRepository extends Repository<Audit> {
  constructor(database: Database) {
    super({
      tableName: 'audits',
      database,
      enableAudit: true,
      enableSoftDelete: false
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected mapRowToEntity(row: any): Audit {
    return {
      id: row.id,
      auditNumber: row.audit_number,
      title: row.title,
      description: row.description,
      auditType: row.audit_type,
      status: row.status,
      priority: row.priority,
      scope: row.scope,
      scopeEntityId: row.scope_entity_id,
      scopeEntityName: row.scope_entity_name,
      scheduledStartDate: row.scheduled_start_date,
      scheduledEndDate: row.scheduled_end_date,
      actualStartDate: row.actual_start_date,
      actualEndDate: row.actual_end_date,
      leadAuditorId: row.lead_auditor_id,
      leadAuditorName: row.lead_auditor_name,
      auditorIds: row.auditor_ids || [],
      standardsReference: row.standards_reference,
      auditCriteria: row.audit_criteria,
      templateId: row.template_id,
      totalFindings: row.total_findings || 0,
      criticalFindings: row.critical_findings || 0,
      majorFindings: row.major_findings || 0,
      minorFindings: row.minor_findings || 0,
      complianceScore: row.compliance_score,
      overallRating: row.overall_rating,
      executiveSummary: row.executive_summary,
      recommendations: row.recommendations,
      attachmentUrls: row.attachment_urls,
      reviewedBy: row.reviewed_by,
      reviewedAt: row.reviewed_at,
      approvedBy: row.approved_by,
      approvedAt: row.approved_at,
      requiresFollowUp: row.requires_follow_up || false,
      followUpDate: row.follow_up_date,
      followUpAuditId: row.follow_up_audit_id,
      organizationId: row.organization_id,
      branchId: row.branch_id,
      createdAt: row.created_at,
      createdBy: row.created_by,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by,
      version: row.version
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected mapEntityToRow(entity: Partial<Audit>): Record<string, any> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row: Record<string, any> = {};

    if (entity.id !== undefined) row.id = entity.id;
    if (entity.auditNumber !== undefined) row.audit_number = entity.auditNumber;
    if (entity.title !== undefined) row.title = entity.title;
    if (entity.description !== undefined) row.description = entity.description;
    if (entity.auditType !== undefined) row.audit_type = entity.auditType;
    if (entity.status !== undefined) row.status = entity.status;
    if (entity.priority !== undefined) row.priority = entity.priority;
    if (entity.scope !== undefined) row.scope = entity.scope;
    if (entity.scopeEntityId !== undefined) row.scope_entity_id = entity.scopeEntityId;
    if (entity.scopeEntityName !== undefined) row.scope_entity_name = entity.scopeEntityName;
    if (entity.scheduledStartDate !== undefined) row.scheduled_start_date = entity.scheduledStartDate;
    if (entity.scheduledEndDate !== undefined) row.scheduled_end_date = entity.scheduledEndDate;
    if (entity.actualStartDate !== undefined) row.actual_start_date = entity.actualStartDate;
    if (entity.actualEndDate !== undefined) row.actual_end_date = entity.actualEndDate;
    if (entity.leadAuditorId !== undefined) row.lead_auditor_id = entity.leadAuditorId;
    if (entity.leadAuditorName !== undefined) row.lead_auditor_name = entity.leadAuditorName;
    if (entity.auditorIds !== undefined) row.auditor_ids = JSON.stringify(entity.auditorIds);
    if (entity.standardsReference !== undefined) row.standards_reference = entity.standardsReference;
    if (entity.auditCriteria !== undefined) row.audit_criteria = JSON.stringify(entity.auditCriteria);
    if (entity.templateId !== undefined) row.template_id = entity.templateId;
    if (entity.totalFindings !== undefined) row.total_findings = entity.totalFindings;
    if (entity.criticalFindings !== undefined) row.critical_findings = entity.criticalFindings;
    if (entity.majorFindings !== undefined) row.major_findings = entity.majorFindings;
    if (entity.minorFindings !== undefined) row.minor_findings = entity.minorFindings;
    if (entity.complianceScore !== undefined) row.compliance_score = entity.complianceScore;
    if (entity.overallRating !== undefined) row.overall_rating = entity.overallRating;
    if (entity.executiveSummary !== undefined) row.executive_summary = entity.executiveSummary;
    if (entity.recommendations !== undefined) row.recommendations = entity.recommendations;
    if (entity.attachmentUrls !== undefined) row.attachment_urls = JSON.stringify(entity.attachmentUrls);
    if (entity.reviewedBy !== undefined) row.reviewed_by = entity.reviewedBy;
    if (entity.reviewedAt !== undefined) row.reviewed_at = entity.reviewedAt;
    if (entity.approvedBy !== undefined) row.approved_by = entity.approvedBy;
    if (entity.approvedAt !== undefined) row.approved_at = entity.approvedAt;
    if (entity.requiresFollowUp !== undefined) row.requires_follow_up = entity.requiresFollowUp;
    if (entity.followUpDate !== undefined) row.follow_up_date = entity.followUpDate;
    if (entity.followUpAuditId !== undefined) row.follow_up_audit_id = entity.followUpAuditId;
    if (entity.organizationId !== undefined) row.organization_id = entity.organizationId;
    if (entity.branchId !== undefined) row.branch_id = entity.branchId;
    if (entity.createdAt !== undefined) row.created_at = entity.createdAt;
    if (entity.createdBy !== undefined) row.created_by = entity.createdBy;
    if (entity.updatedAt !== undefined) row.updated_at = entity.updatedAt;
    if (entity.updatedBy !== undefined) row.updated_by = entity.updatedBy;
    if (entity.version !== undefined) row.version = entity.version;

    return row;
  }

  /**
   * Create new audit
   */
  async createAudit(
    input: CreateAuditInput & { createdBy: UUID; organizationId: UUID; branchId?: UUID }
  ): Promise<Audit> {
    // Generate audit number
    const auditNumber = await this.generateAuditNumber(input.organizationId);

    const query = `
      INSERT INTO audits (
        id, audit_number, title, description, audit_type, status, priority,
        scope, scope_entity_id, scope_entity_name,
        scheduled_start_date, scheduled_end_date,
        lead_auditor_id, lead_auditor_name, auditor_ids,
        standards_reference, audit_criteria, template_id,
        organization_id, branch_id, created_by, updated_by,
        created_at, updated_at, version
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, 'DRAFT', $5,
        $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
        $17, $18, $19, $19, NOW(), NOW(), 1
      )
      RETURNING *
    `;

    const result = await this.database.query(query, [
      auditNumber,
      input.title,
      input.description,
      input.auditType,
      input.priority,
      input.scope,
      input.scopeEntityId || null,
      input.scopeEntityName || null,
      input.scheduledStartDate,
      input.scheduledEndDate,
      input.leadAuditorId,
      'Lead Auditor', // Placeholder - would fetch from user service
      JSON.stringify(input.auditorIds || []),
      input.standardsReference || null,
      JSON.stringify(input.auditCriteria || []),
      input.templateId || null,
      input.organizationId,
      input.branchId || null,
      input.createdBy
    ]);

    return this.mapRowToEntity(result.rows[0]);
  }

  /**
   * Generate unique audit number
   */
  private async generateAuditNumber(organizationId: UUID): Promise<string> {
    const year = new Date().getFullYear();
    const query = `
      SELECT COUNT(*) as count
      FROM audits
      WHERE organization_id = $1
      AND EXTRACT(YEAR FROM created_at) = $2
    `;

    const result = await this.database.query(query, [organizationId, year]);
    const count = parseInt((result.rows[0]?.count as string) || '0') + 1;
    return `AUD-${year}-${count.toString().padStart(4, '0')}`;
  }

  /**
   * Get audits by status
   */
  async findByStatus(organizationId: UUID, status: string): Promise<Audit[]> {
    const query = `
      SELECT * FROM audits
      WHERE organization_id = $1
      AND status = $2
      ORDER BY scheduled_start_date DESC
    `;

    const result = await this.database.query(query, [organizationId, status]);
    return result.rows.map(row => this.mapRowToEntity(row));
  }

  /**
   * Get audit summaries
   */
  async getAuditSummaries(
    organizationId: UUID,
    filters?: { status?: string; auditType?: string; branchId?: UUID }
  ): Promise<AuditSummary[]> {
    let query = `
      SELECT
        id, audit_number, title, audit_type, status, priority,
        scheduled_start_date, scheduled_end_date, lead_auditor_name,
        total_findings, critical_findings, compliance_score, overall_rating
      FROM audits
      WHERE organization_id = $1
    `;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params: any[] = [organizationId];
    let paramIndex = 2;

    if (filters?.status) {
      query += ` AND status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    if (filters?.auditType) {
      query += ` AND audit_type = $${paramIndex}`;
      params.push(filters.auditType);
      paramIndex++;
    }

    if (filters?.branchId) {
      query += ` AND branch_id = $${paramIndex}`;
      params.push(filters.branchId);
    }

    query += ` ORDER BY scheduled_start_date DESC LIMIT 100`;

    const result = await this.database.query(query, params);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return result.rows.map((row: any): AuditSummary => ({
      id: row.id as string,
      auditNumber: row.audit_number as string,
      title: row.title as string,
      auditType: row.audit_type,
      status: row.status,
      priority: row.priority,
      scheduledStartDate: row.scheduled_start_date as Date,
      scheduledEndDate: row.scheduled_end_date as Date,
      leadAuditorName: row.lead_auditor_name as string,
      totalFindings: (row.total_findings || 0) as number,
      criticalFindings: (row.critical_findings || 0) as number,
      complianceScore: row.compliance_score as number | undefined,
      overallRating: row.overall_rating as string | undefined
    }));
  }

  /**
   * Update audit findings count
   */
  async updateFindingsCounts(auditId: UUID): Promise<void> {
    const query = `
      UPDATE audits
      SET
        total_findings = (SELECT COUNT(*) FROM audit_findings WHERE audit_id = $1),
        critical_findings = (SELECT COUNT(*) FROM audit_findings WHERE audit_id = $1 AND severity = 'CRITICAL'),
        major_findings = (SELECT COUNT(*) FROM audit_findings WHERE audit_id = $1 AND severity = 'MAJOR'),
        minor_findings = (SELECT COUNT(*) FROM audit_findings WHERE audit_id = $1 AND severity = 'MINOR')
      WHERE id = $1
    `;

    await this.database.query(query, [auditId]);
  }
}

/**
 * Repository for audit findings
 */
export class AuditFindingRepository extends Repository<AuditFinding> {
  constructor(database: Database) {
    super({
      tableName: 'audit_findings',
      database,
      enableAudit: true,
      enableSoftDelete: false
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected mapRowToEntity(row: any): AuditFinding {
    return {
      id: row.id,
      auditId: row.audit_id,
      findingNumber: row.finding_number,
      title: row.title,
      description: row.description,
      category: row.category,
      severity: row.severity,
      status: row.status,
      standardReference: row.standard_reference,
      regulatoryRequirement: row.regulatory_requirement,
      evidenceDescription: row.evidence_description,
      evidenceUrls: row.evidence_urls,
      observedBy: row.observed_by,
      observedByName: row.observed_by_name,
      observedAt: row.observed_at,
      locationDescription: row.location_description,
      affectedEntity: row.affected_entity,
      affectedEntityId: row.affected_entity_id,
      affectedEntityName: row.affected_entity_name,
      potentialImpact: row.potential_impact,
      actualImpact: row.actual_impact,
      requiredCorrectiveAction: row.required_corrective_action,
      recommendedTimeframe: row.recommended_timeframe,
      targetResolutionDate: row.target_resolution_date,
      actualResolutionDate: row.actual_resolution_date,
      resolutionDescription: row.resolution_description,
      verifiedBy: row.verified_by,
      verifiedAt: row.verified_at,
      requiresFollowUp: row.requires_follow_up || false,
      followUpNotes: row.follow_up_notes,
      organizationId: row.organization_id,
      branchId: row.branch_id,
      createdAt: row.created_at,
      createdBy: row.created_by,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by,
      version: row.version
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected mapEntityToRow(entity: Partial<AuditFinding>): Record<string, any> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row: Record<string, any> = {};

    if (entity.id !== undefined) row.id = entity.id;
    if (entity.auditId !== undefined) row.audit_id = entity.auditId;
    if (entity.findingNumber !== undefined) row.finding_number = entity.findingNumber;
    if (entity.title !== undefined) row.title = entity.title;
    if (entity.description !== undefined) row.description = entity.description;
    if (entity.category !== undefined) row.category = entity.category;
    if (entity.severity !== undefined) row.severity = entity.severity;
    if (entity.status !== undefined) row.status = entity.status;
    if (entity.standardReference !== undefined) row.standard_reference = entity.standardReference;
    if (entity.regulatoryRequirement !== undefined) row.regulatory_requirement = entity.regulatoryRequirement;
    if (entity.evidenceDescription !== undefined) row.evidence_description = entity.evidenceDescription;
    if (entity.evidenceUrls !== undefined) row.evidence_urls = JSON.stringify(entity.evidenceUrls);
    if (entity.observedBy !== undefined) row.observed_by = entity.observedBy;
    if (entity.observedByName !== undefined) row.observed_by_name = entity.observedByName;
    if (entity.observedAt !== undefined) row.observed_at = entity.observedAt;
    if (entity.locationDescription !== undefined) row.location_description = entity.locationDescription;
    if (entity.affectedEntity !== undefined) row.affected_entity = entity.affectedEntity;
    if (entity.affectedEntityId !== undefined) row.affected_entity_id = entity.affectedEntityId;
    if (entity.affectedEntityName !== undefined) row.affected_entity_name = entity.affectedEntityName;
    if (entity.potentialImpact !== undefined) row.potential_impact = entity.potentialImpact;
    if (entity.actualImpact !== undefined) row.actual_impact = entity.actualImpact;
    if (entity.requiredCorrectiveAction !== undefined) row.required_corrective_action = entity.requiredCorrectiveAction;
    if (entity.recommendedTimeframe !== undefined) row.recommended_timeframe = entity.recommendedTimeframe;
    if (entity.targetResolutionDate !== undefined) row.target_resolution_date = entity.targetResolutionDate;
    if (entity.actualResolutionDate !== undefined) row.actual_resolution_date = entity.actualResolutionDate;
    if (entity.resolutionDescription !== undefined) row.resolution_description = entity.resolutionDescription;
    if (entity.verifiedBy !== undefined) row.verified_by = entity.verifiedBy;
    if (entity.verifiedAt !== undefined) row.verified_at = entity.verifiedAt;
    if (entity.requiresFollowUp !== undefined) row.requires_follow_up = entity.requiresFollowUp;
    if (entity.followUpNotes !== undefined) row.follow_up_notes = entity.followUpNotes;
    if (entity.organizationId !== undefined) row.organization_id = entity.organizationId;
    if (entity.branchId !== undefined) row.branch_id = entity.branchId;
    if (entity.createdAt !== undefined) row.created_at = entity.createdAt;
    if (entity.createdBy !== undefined) row.created_by = entity.createdBy;
    if (entity.updatedAt !== undefined) row.updated_at = entity.updatedAt;
    if (entity.updatedBy !== undefined) row.updated_by = entity.updatedBy;
    if (entity.version !== undefined) row.version = entity.version;

    return row;
  }

  /**
   * Create audit finding
   */
  async createFinding(
    input: CreateAuditFindingInput & { observedBy: UUID; createdBy: UUID; organizationId: UUID; branchId?: UUID }
  ): Promise<AuditFinding> {
    // Generate finding number
    const findingNumber = await this.generateFindingNumber(input.auditId);

    const query = `
      INSERT INTO audit_findings (
        id, audit_id, finding_number, title, description, category, severity, status,
        standard_reference, regulatory_requirement, evidence_description, evidence_urls,
        observed_by, observed_by_name, observed_at,
        location_description, affected_entity, affected_entity_id, affected_entity_name,
        potential_impact, required_corrective_action, recommended_timeframe, target_resolution_date,
        organization_id, branch_id, created_by, updated_by, created_at, updated_at, version
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, 'OPEN',
        $7, $8, $9, $10, $11, $12, NOW(),
        $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $23, NOW(), NOW(), 1
      )
      RETURNING *
    `;

    const result = await this.database.query(query, [
      input.auditId,
      findingNumber,
      input.title,
      input.description,
      input.category,
      input.severity,
      input.standardReference || null,
      input.regulatoryRequirement || null,
      input.evidenceDescription || null,
      JSON.stringify(input.evidenceUrls || []),
      input.observedBy,
      'Auditor Name', // Placeholder
      input.locationDescription || null,
      input.affectedEntity || null,
      input.affectedEntityId || null,
      input.affectedEntityName || null,
      input.potentialImpact || null,
      input.requiredCorrectiveAction,
      input.recommendedTimeframe || null,
      input.targetResolutionDate || null,
      input.organizationId,
      input.branchId || null,
      input.createdBy
    ]);

    return this.mapRowToEntity(result.rows[0]);
  }

  /**
   * Generate finding number for audit
   */
  private async generateFindingNumber(auditId: UUID): Promise<string> {
    const query = `
      SELECT COUNT(*) as count
      FROM audit_findings
      WHERE audit_id = $1
    `;

    const result = await this.database.query(query, [auditId]);
    const count = parseInt((result.rows[0]?.count as string) || '0') + 1;
    return `F-${count.toString().padStart(3, '0')}`;
  }

  /**
   * Get findings for audit
   */
  async findByAuditId(auditId: UUID): Promise<AuditFinding[]> {
    const query = `
      SELECT * FROM audit_findings
      WHERE audit_id = $1
      ORDER BY severity DESC, created_at DESC
    `;

    const result = await this.database.query(query, [auditId]);
    return result.rows.map(row => this.mapRowToEntity(row));
  }

  /**
   * Get critical findings across organization
   */
  async getCriticalFindings(organizationId: UUID, limit: number = 10): Promise<AuditFinding[]> {
    const query = `
      SELECT * FROM audit_findings
      WHERE organization_id = $1
      AND severity = 'CRITICAL'
      AND status IN ('OPEN', 'IN_PROGRESS')
      ORDER BY observed_at DESC
      LIMIT $2
    `;

    const result = await this.database.query(query, [organizationId, limit]);
    return result.rows.map(row => this.mapRowToEntity(row));
  }
}

/**
 * Repository for corrective actions
 */
export class CorrectiveActionRepository extends Repository<CorrectiveAction> {
  constructor(database: Database) {
    super({
      tableName: 'corrective_actions',
      database,
      enableAudit: true,
      enableSoftDelete: false
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected mapRowToEntity(row: any): CorrectiveAction {
    return {
      id: row.id,
      findingId: row.finding_id,
      auditId: row.audit_id,
      actionNumber: row.action_number,
      title: row.title,
      description: row.description,
      actionType: row.action_type,
      status: row.status,
      rootCause: row.root_cause,
      contributingFactors: row.contributing_factors,
      specificActions: row.specific_actions,
      responsiblePersonId: row.responsible_person_id,
      responsiblePersonName: row.responsible_person_name,
      targetCompletionDate: row.target_completion_date,
      actualCompletionDate: row.actual_completion_date,
      resourcesRequired: row.resources_required,
      estimatedCost: row.estimated_cost,
      actualCost: row.actual_cost,
      monitoringPlan: row.monitoring_plan,
      successCriteria: row.success_criteria,
      verificationMethod: row.verification_method,
      progressUpdates: row.progress_updates || [],
      completionPercentage: row.completion_percentage || 0,
      verifiedBy: row.verified_by,
      verifiedAt: row.verified_at,
      verificationNotes: row.verification_notes,
      effectivenessRating: row.effectiveness_rating,
      attachmentUrls: row.attachment_urls,
      organizationId: row.organization_id,
      branchId: row.branch_id,
      createdAt: row.created_at,
      createdBy: row.created_by,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by,
      version: row.version
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected mapEntityToRow(entity: Partial<CorrectiveAction>): Record<string, any> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row: Record<string, any> = {};

    if (entity.id !== undefined) row.id = entity.id;
    if (entity.findingId !== undefined) row.finding_id = entity.findingId;
    if (entity.auditId !== undefined) row.audit_id = entity.auditId;
    if (entity.actionNumber !== undefined) row.action_number = entity.actionNumber;
    if (entity.title !== undefined) row.title = entity.title;
    if (entity.description !== undefined) row.description = entity.description;
    if (entity.actionType !== undefined) row.action_type = entity.actionType;
    if (entity.status !== undefined) row.status = entity.status;
    if (entity.rootCause !== undefined) row.root_cause = entity.rootCause;
    if (entity.contributingFactors !== undefined) row.contributing_factors = JSON.stringify(entity.contributingFactors);
    if (entity.specificActions !== undefined) row.specific_actions = JSON.stringify(entity.specificActions);
    if (entity.responsiblePersonId !== undefined) row.responsible_person_id = entity.responsiblePersonId;
    if (entity.responsiblePersonName !== undefined) row.responsible_person_name = entity.responsiblePersonName;
    if (entity.targetCompletionDate !== undefined) row.target_completion_date = entity.targetCompletionDate;
    if (entity.actualCompletionDate !== undefined) row.actual_completion_date = entity.actualCompletionDate;
    if (entity.resourcesRequired !== undefined) row.resources_required = entity.resourcesRequired;
    if (entity.estimatedCost !== undefined) row.estimated_cost = entity.estimatedCost;
    if (entity.actualCost !== undefined) row.actual_cost = entity.actualCost;
    if (entity.monitoringPlan !== undefined) row.monitoring_plan = entity.monitoringPlan;
    if (entity.successCriteria !== undefined) row.success_criteria = JSON.stringify(entity.successCriteria);
    if (entity.verificationMethod !== undefined) row.verification_method = entity.verificationMethod;
    if (entity.progressUpdates !== undefined) row.progress_updates = JSON.stringify(entity.progressUpdates);
    if (entity.completionPercentage !== undefined) row.completion_percentage = entity.completionPercentage;
    if (entity.verifiedBy !== undefined) row.verified_by = entity.verifiedBy;
    if (entity.verifiedAt !== undefined) row.verified_at = entity.verifiedAt;
    if (entity.verificationNotes !== undefined) row.verification_notes = entity.verificationNotes;
    if (entity.effectivenessRating !== undefined) row.effectiveness_rating = entity.effectivenessRating;
    if (entity.attachmentUrls !== undefined) row.attachment_urls = JSON.stringify(entity.attachmentUrls);
    if (entity.organizationId !== undefined) row.organization_id = entity.organizationId;
    if (entity.branchId !== undefined) row.branch_id = entity.branchId;
    if (entity.createdAt !== undefined) row.created_at = entity.createdAt;
    if (entity.createdBy !== undefined) row.created_by = entity.createdBy;
    if (entity.updatedAt !== undefined) row.updated_at = entity.updatedAt;
    if (entity.updatedBy !== undefined) row.updated_by = entity.updatedBy;
    if (entity.version !== undefined) row.version = entity.version;

    return row;
  }

  /**
   * Create corrective action
   */
  async createCorrectiveAction(
    input: CreateCorrectiveActionInput & { createdBy: UUID; organizationId: UUID; branchId?: UUID }
  ): Promise<CorrectiveAction> {
    // Generate action number
    const actionNumber = await this.generateActionNumber(input.auditId);

    const query = `
      INSERT INTO corrective_actions (
        id, finding_id, audit_id, action_number, title, description, action_type, status,
        root_cause, contributing_factors, specific_actions,
        responsible_person_id, responsible_person_name, target_completion_date,
        resources_required, estimated_cost, monitoring_plan, success_criteria, verification_method,
        completion_percentage, organization_id, branch_id, created_by, updated_by,
        created_at, updated_at, version
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, 'PLANNED',
        $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
        0, $18, $19, $20, $20, NOW(), NOW(), 1
      )
      RETURNING *
    `;

    const result = await this.database.query(query, [
      input.findingId,
      input.auditId,
      actionNumber,
      input.title,
      input.description,
      input.actionType,
      input.rootCause || null,
      JSON.stringify(input.contributingFactors || []),
      JSON.stringify(input.specificActions),
      input.responsiblePersonId,
      'Responsible Person', // Placeholder
      input.targetCompletionDate,
      input.resourcesRequired || null,
      input.estimatedCost || null,
      input.monitoringPlan || null,
      JSON.stringify(input.successCriteria || []),
      input.verificationMethod || null,
      input.organizationId,
      input.branchId || null,
      input.createdBy
    ]);

    return this.mapRowToEntity(result.rows[0]);
  }

  /**
   * Generate action number for audit
   */
  private async generateActionNumber(auditId: UUID): Promise<string> {
    const query = `
      SELECT COUNT(*) as count
      FROM corrective_actions
      WHERE audit_id = $1
    `;

    const result = await this.database.query(query, [auditId]);
    const count = parseInt((result.rows[0]?.count as string) || '0') + 1;
    return `CA-${count.toString().padStart(3, '0')}`;
  }

  /**
   * Get corrective actions for audit
   */
  async findByAuditId(auditId: UUID): Promise<CorrectiveAction[]> {
    const query = `
      SELECT * FROM corrective_actions
      WHERE audit_id = $1
      ORDER BY created_at DESC
    `;

    const result = await this.database.query(query, [auditId]);
    return result.rows.map(row => this.mapRowToEntity(row));
  }

  /**
   * Get overdue corrective actions
   */
  async getOverdueActions(organizationId: UUID, limit: number = 20): Promise<CorrectiveAction[]> {
    const query = `
      SELECT * FROM corrective_actions
      WHERE organization_id = $1
      AND status IN ('PLANNED', 'IN_PROGRESS')
      AND target_completion_date < NOW()
      ORDER BY target_completion_date ASC
      LIMIT $2
    `;

    const result = await this.database.query(query, [organizationId, limit]);
    return result.rows.map(row => this.mapRowToEntity(row));
  }
}
