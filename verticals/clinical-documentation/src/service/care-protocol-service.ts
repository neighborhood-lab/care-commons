/**
 * Care Protocol Service
 *
 * Manages evidence-based care protocols for home health.
 * Includes protocol library, compliance tracking, and documentation.
 */

import { Pool } from 'pg';
import { UUID } from '@folkcare/core';
import { format } from 'date-fns';

// Enums
export type ProtocolType =
  | 'INFECTION_CONTROL'
  | 'WOUND_CARE'
  | 'FALL_PREVENTION'
  | 'MEDICATION_SAFETY'
  | 'CARDIAC'
  | 'RESPIRATORY'
  | 'DIABETES'
  | 'PAIN_MANAGEMENT'
  | 'SKIN_CARE'
  | 'NUTRITION'
  | 'MOBILITY'
  | 'COGNITIVE'
  | 'SAFETY'
  | 'EMERGENCY'
  | 'END_OF_LIFE'
  | 'GENERAL'
  | 'OTHER';

export type ProtocolPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export type ComplianceStatus =
  | 'FULLY_COMPLIANT'
  | 'PARTIALLY_COMPLIANT'
  | 'NON_COMPLIANT'
  | 'NOT_APPLICABLE'
  | 'DEVIATION_DOCUMENTED';

// Types
export interface ProtocolCategory {
  id: UUID;
  organizationId: UUID;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProtocolStep {
  step: number;
  title: string;
  instruction: string;
  duration?: string;
  notes?: string;
}

export interface CareProtocol {
  id: UUID;
  organizationId: UUID;
  categoryId?: UUID;
  name: string;
  code?: string;
  description?: string;
  protocolType: ProtocolType;
  purpose?: string;
  scope?: string;
  indications?: string;
  contraindications?: string;
  steps?: ProtocolStep[];
  equipmentNeeded?: string[];
  precautions?: string;
  expectedOutcomes?: string;
  documentationRequirements?: string[];
  evidenceBase?: string;
  references?: string[];
  sourceOrganization?: string;
  externalUrl?: string;
  version: string;
  effectiveDate?: Date;
  reviewDate?: Date;
  expirationDate?: Date;
  supersedesId?: UUID;
  isApproved: boolean;
  approvedBy?: UUID;
  approvedByName?: string;
  approvedAt?: Date;
  isMandatory: boolean;
  priority: ProtocolPriority;
  applicableConditions?: string[];
  tags?: string[];
  createdBy?: UUID;
  createdByName?: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  isDeleted: boolean;
}

export interface ProtocolCompliance {
  id: UUID;
  organizationId: UUID;
  protocolId: UUID;
  clientId: UUID;
  visitId?: UUID;
  complianceStatus: ComplianceStatus;
  stepsCompleted?: number[];
  complianceNotes?: string;
  hasDeviation: boolean;
  deviationReason?: string;
  deviationOutcome?: string;
  deviationApproved: boolean;
  deviationApprovedBy?: UUID;
  deviationApprovedByName?: string;
  documentedBy: UUID;
  documentedByName: string;
  documentedByCredentials?: string;
  documentedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}

// Input types
export interface CreateProtocolCategoryInput {
  organizationId: UUID;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  displayOrder?: number;
}

export interface CreateCareProtocolInput {
  organizationId: UUID;
  categoryId?: UUID;
  name: string;
  code?: string;
  description?: string;
  protocolType: ProtocolType;
  purpose?: string;
  scope?: string;
  indications?: string;
  contraindications?: string;
  steps?: ProtocolStep[];
  equipmentNeeded?: string[];
  precautions?: string;
  expectedOutcomes?: string;
  documentationRequirements?: string[];
  evidenceBase?: string;
  references?: string[];
  sourceOrganization?: string;
  externalUrl?: string;
  version?: string;
  effectiveDate?: string;
  reviewDate?: string;
  expirationDate?: string;
  isMandatory?: boolean;
  priority?: ProtocolPriority;
  applicableConditions?: string[];
  tags?: string[];
  createdBy?: UUID;
  createdByName?: string;
}

export interface UpdateCareProtocolInput {
  id: UUID;
  name?: string;
  description?: string;
  purpose?: string;
  scope?: string;
  indications?: string;
  contraindications?: string;
  steps?: ProtocolStep[];
  equipmentNeeded?: string[];
  precautions?: string;
  expectedOutcomes?: string;
  documentationRequirements?: string[];
  evidenceBase?: string;
  references?: string[];
  version?: string;
  reviewDate?: string;
  isMandatory?: boolean;
  priority?: ProtocolPriority;
  tags?: string[];
}

export interface CreateProtocolComplianceInput {
  organizationId: UUID;
  protocolId: UUID;
  clientId: UUID;
  visitId?: UUID;
  complianceStatus: ComplianceStatus;
  stepsCompleted?: number[];
  complianceNotes?: string;
  hasDeviation?: boolean;
  deviationReason?: string;
  deviationOutcome?: string;
  documentedBy: UUID;
  documentedByName: string;
  documentedByCredentials?: string;
  documentedAt: string;
}

export interface ProtocolSummary {
  totalProtocols: number;
  activeProtocols: number;
  mandatoryProtocols: number;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
  complianceRate: number;
  complianceThisMonth: number;
}

// Row types
interface ProtocolCategoryRow {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  is_active: boolean;
  display_order: number;
  created_at: Date;
  updated_at: Date;
}

interface CareProtocolRow {
  id: string;
  organization_id: string;
  category_id: string | null;
  name: string;
  code: string | null;
  description: string | null;
  protocol_type: ProtocolType;
  purpose: string | null;
  scope: string | null;
  indications: string | null;
  contraindications: string | null;
  steps: ProtocolStep[] | null;
  equipment_needed: string[] | null;
  precautions: string | null;
  expected_outcomes: string | null;
  documentation_requirements: string[] | null;
  evidence_base: string | null;
  references: string[] | null;
  source_organization: string | null;
  external_url: string | null;
  version: string;
  effective_date: Date | null;
  review_date: Date | null;
  expiration_date: Date | null;
  supersedes_id: string | null;
  is_approved: boolean;
  approved_by: string | null;
  approved_by_name: string | null;
  approved_at: Date | null;
  is_mandatory: boolean;
  priority: ProtocolPriority;
  applicable_conditions: string[] | null;
  tags: string[] | null;
  created_by: string | null;
  created_by_name: string | null;
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
  is_deleted: boolean;
}

interface ProtocolComplianceRow {
  id: string;
  organization_id: string;
  protocol_id: string;
  client_id: string;
  visit_id: string | null;
  compliance_status: ComplianceStatus;
  steps_completed: number[] | null;
  compliance_notes: string | null;
  has_deviation: boolean;
  deviation_reason: string | null;
  deviation_outcome: string | null;
  deviation_approved: boolean;
  deviation_approved_by: string | null;
  deviation_approved_by_name: string | null;
  documented_by: string;
  documented_by_name: string;
  documented_by_credentials: string | null;
  documented_at: Date;
  created_at: Date;
  updated_at: Date;
  is_deleted: boolean;
}

export class CareProtocolService {
  constructor(private pool: Pool) {}

  // ==================== CATEGORIES ====================

  /**
   * Get protocol categories
   */
  async getProtocolCategories(
    organizationId: UUID,
    activeOnly = true
  ): Promise<ProtocolCategory[]> {
    const conditions = ['organization_id = $1'];
    if (activeOnly) {
      conditions.push('is_active = true');
    }

    // Conditions are from hardcoded strings, safe for dynamic SQL
    // eslint-disable-next-line sonarjs/sql-queries
    const result = await this.pool.query<ProtocolCategoryRow>(
      `SELECT * FROM protocol_categories WHERE ${conditions.join(' AND ')} ORDER BY display_order, name`,
      [organizationId]
    );

    return result.rows.map(this.mapProtocolCategory);
  }

  /**
   * Create protocol category
   */
  async createProtocolCategory(input: CreateProtocolCategoryInput): Promise<ProtocolCategory> {
    const result = await this.pool.query<ProtocolCategoryRow>(
      `INSERT INTO protocol_categories (organization_id, name, description, icon, color, display_order)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        input.organizationId,
        input.name,
        input.description ?? null,
        input.icon ?? null,
        input.color ?? null,
        input.displayOrder ?? 0,
      ]
    );
    // INSERT RETURNING always returns the inserted row
    return this.mapProtocolCategory(result.rows[0]!);
  }

  // ==================== PROTOCOLS ====================

  /**
   * Get care protocols
   */
  async getCareProtocols(
    organizationId: UUID,
    options?: {
      categoryId?: UUID;
      protocolType?: ProtocolType;
      isMandatory?: boolean;
      search?: string;
      activeOnly?: boolean;
      limit?: number;
      offset?: number;
    }
  ): Promise<CareProtocol[]> {
    const conditions = ['organization_id = $1', 'is_deleted = false'];
    const values: unknown[] = [organizationId];
    let paramCount = 1;

    if (options?.categoryId) {
      paramCount++;
      conditions.push(`category_id = $${paramCount}`);
      values.push(options.categoryId);
    }

    if (options?.protocolType) {
      paramCount++;
      conditions.push(`protocol_type = $${paramCount}`);
      values.push(options.protocolType);
    }

    if (options?.isMandatory !== undefined) {
      paramCount++;
      conditions.push(`is_mandatory = $${paramCount}`);
      values.push(options.isMandatory);
    }

    if (options?.search) {
      paramCount++;
      conditions.push(`(name ILIKE $${paramCount} OR description ILIKE $${paramCount} OR code ILIKE $${paramCount})`);
      values.push(`%${options.search}%`);
    }

    if (options?.activeOnly !== false) {
      conditions.push('is_active = true');
    }

    let query = `SELECT * FROM care_protocols WHERE ${conditions.join(' AND ')} ORDER BY priority DESC, name`;

    if (options?.limit) {
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      values.push(options.limit);
    }

    if (options?.offset) {
      paramCount++;
      query += ` OFFSET $${paramCount}`;
      values.push(options.offset);
    }

    // Conditions are from hardcoded strings, safe for dynamic SQL
    // eslint-disable-next-line sonarjs/sql-queries
    const result = await this.pool.query<CareProtocolRow>(query, values);
    return result.rows.map(this.mapCareProtocol);
  }

  /**
   * Get protocol by ID
   */
  async getProtocolById(id: UUID): Promise<CareProtocol | null> {
    const result = await this.pool.query<CareProtocolRow>(
      `SELECT * FROM care_protocols WHERE id = $1 AND is_deleted = false`,
      [id]
    );
    return result.rows[0] ? this.mapCareProtocol(result.rows[0]) : null;
  }

  /**
   * Get protocol by code
   */
  async getProtocolByCode(code: string, organizationId: UUID): Promise<CareProtocol | null> {
    const result = await this.pool.query<CareProtocolRow>(
      `SELECT * FROM care_protocols WHERE code = $1 AND organization_id = $2 AND is_deleted = false`,
      [code, organizationId]
    );
    return result.rows[0] ? this.mapCareProtocol(result.rows[0]) : null;
  }

  /**
   * Get infection control protocols
   */
  async getInfectionControlProtocols(organizationId: UUID): Promise<CareProtocol[]> {
    const result = await this.pool.query<CareProtocolRow>(
      `SELECT * FROM care_protocols
       WHERE organization_id = $1
         AND protocol_type = 'INFECTION_CONTROL'
         AND is_active = true
         AND is_deleted = false
       ORDER BY is_mandatory DESC, priority DESC, name`,
      [organizationId]
    );
    return result.rows.map(this.mapCareProtocol);
  }

  /**
   * Get mandatory protocols
   */
  async getMandatoryProtocols(organizationId: UUID): Promise<CareProtocol[]> {
    const result = await this.pool.query<CareProtocolRow>(
      `SELECT * FROM care_protocols
       WHERE organization_id = $1
         AND is_mandatory = true
         AND is_active = true
         AND is_deleted = false
       ORDER BY protocol_type, priority DESC, name`,
      [organizationId]
    );
    return result.rows.map(this.mapCareProtocol);
  }

  /**
   * Create care protocol
   */
  async createCareProtocol(input: CreateCareProtocolInput): Promise<CareProtocol> {
    const result = await this.pool.query<CareProtocolRow>(
      `INSERT INTO care_protocols (
        organization_id, category_id, name, code, description, protocol_type,
        purpose, scope, indications, contraindications, steps, equipment_needed,
        precautions, expected_outcomes, documentation_requirements, evidence_base,
        "references", source_organization, external_url, version, effective_date,
        review_date, expiration_date, is_mandatory, priority, applicable_conditions,
        tags, created_by, created_by_name
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29)
      RETURNING *`,
      [
        input.organizationId,
        input.categoryId ?? null,
        input.name,
        input.code ?? null,
        input.description ?? null,
        input.protocolType,
        input.purpose ?? null,
        input.scope ?? null,
        input.indications ?? null,
        input.contraindications ?? null,
        input.steps ? JSON.stringify(input.steps) : null,
        input.equipmentNeeded ? JSON.stringify(input.equipmentNeeded) : null,
        input.precautions ?? null,
        input.expectedOutcomes ?? null,
        input.documentationRequirements ? JSON.stringify(input.documentationRequirements) : null,
        input.evidenceBase ?? null,
        input.references ? JSON.stringify(input.references) : null,
        input.sourceOrganization ?? null,
        input.externalUrl ?? null,
        input.version ?? '1.0',
        input.effectiveDate ?? null,
        input.reviewDate ?? null,
        input.expirationDate ?? null,
        input.isMandatory ?? false,
        input.priority ?? 'MEDIUM',
        input.applicableConditions ? JSON.stringify(input.applicableConditions) : null,
        input.tags ? JSON.stringify(input.tags) : null,
        input.createdBy ?? null,
        input.createdByName ?? null,
      ]
    );
    // INSERT RETURNING always returns the inserted row
    return this.mapCareProtocol(result.rows[0]!);
  }

  /**
   * Update care protocol
   */
  async updateCareProtocol(input: UpdateCareProtocolInput): Promise<CareProtocol> {
    const setClauses: string[] = ['updated_at = NOW()'];
    const values: unknown[] = [];
    let paramCount = 0;

    const fieldMap: Record<string, string> = {
      name: 'name',
      description: 'description',
      purpose: 'purpose',
      scope: 'scope',
      indications: 'indications',
      contraindications: 'contraindications',
      precautions: 'precautions',
      expectedOutcomes: 'expected_outcomes',
      evidenceBase: 'evidence_base',
      version: 'version',
      reviewDate: 'review_date',
      isMandatory: 'is_mandatory',
      priority: 'priority',
    };

    for (const [key, column] of Object.entries(fieldMap)) {
      if (input[key as keyof typeof input] !== undefined) {
        paramCount++;
        setClauses.push(`${column} = $${paramCount}`);
        values.push(input[key as keyof typeof input]);
      }
    }

    // Handle JSON fields
    if (input.steps !== undefined) {
      paramCount++;
      setClauses.push(`steps = $${paramCount}`);
      values.push(JSON.stringify(input.steps));
    }
    if (input.equipmentNeeded !== undefined) {
      paramCount++;
      setClauses.push(`equipment_needed = $${paramCount}`);
      values.push(JSON.stringify(input.equipmentNeeded));
    }
    if (input.documentationRequirements !== undefined) {
      paramCount++;
      setClauses.push(`documentation_requirements = $${paramCount}`);
      values.push(JSON.stringify(input.documentationRequirements));
    }
    if (input.references !== undefined) {
      paramCount++;
      setClauses.push(`"references" = $${paramCount}`);
      values.push(JSON.stringify(input.references));
    }
    if (input.tags !== undefined) {
      paramCount++;
      setClauses.push(`tags = $${paramCount}`);
      values.push(JSON.stringify(input.tags));
    }

    paramCount++;
    values.push(input.id);

    // Column names are from hardcoded field map, safe for dynamic SQL
    // eslint-disable-next-line sonarjs/sql-queries
    const result = await this.pool.query<CareProtocolRow>(
      `UPDATE care_protocols SET ${setClauses.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (!result.rows[0]) {
      throw new Error('Care protocol not found');
    }

    return this.mapCareProtocol(result.rows[0]);
  }

  /**
   * Approve protocol
   */
  async approveProtocol(
    id: UUID,
    approvedBy: UUID,
    approvedByName: string
  ): Promise<CareProtocol> {
    const result = await this.pool.query<CareProtocolRow>(
      `UPDATE care_protocols SET
        is_approved = true,
        approved_by = $2,
        approved_by_name = $3,
        approved_at = NOW(),
        updated_at = NOW()
      WHERE id = $1 RETURNING *`,
      [id, approvedBy, approvedByName]
    );

    if (!result.rows[0]) {
      throw new Error('Care protocol not found');
    }

    return this.mapCareProtocol(result.rows[0]);
  }

  /**
   * Deactivate protocol
   */
  async deactivateProtocol(id: UUID): Promise<void> {
    await this.pool.query(
      `UPDATE care_protocols SET is_active = false, updated_at = NOW() WHERE id = $1`,
      [id]
    );
  }

  /**
   * Delete protocol
   */
  async deleteProtocol(id: UUID): Promise<void> {
    await this.pool.query(
      `UPDATE care_protocols SET is_deleted = true, updated_at = NOW() WHERE id = $1`,
      [id]
    );
  }

  // ==================== COMPLIANCE ====================

  /**
   * Record protocol compliance
   */
  async recordCompliance(input: CreateProtocolComplianceInput): Promise<ProtocolCompliance> {
    const result = await this.pool.query<ProtocolComplianceRow>(
      `INSERT INTO protocol_compliance (
        organization_id, protocol_id, client_id, visit_id,
        compliance_status, steps_completed, compliance_notes,
        has_deviation, deviation_reason, deviation_outcome,
        documented_by, documented_by_name, documented_by_credentials, documented_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        input.organizationId,
        input.protocolId,
        input.clientId,
        input.visitId ?? null,
        input.complianceStatus,
        input.stepsCompleted ? JSON.stringify(input.stepsCompleted) : null,
        input.complianceNotes ?? null,
        input.hasDeviation ?? false,
        input.deviationReason ?? null,
        input.deviationOutcome ?? null,
        input.documentedBy,
        input.documentedByName,
        input.documentedByCredentials ?? null,
        input.documentedAt,
      ]
    );
    // INSERT RETURNING always returns the inserted row
    return this.mapProtocolCompliance(result.rows[0]!);
  }

  /**
   * Get compliance records for client
   */
  async getClientCompliance(
    clientId: UUID,
    options?: {
      protocolId?: UUID;
      startDate?: string;
      endDate?: string;
      limit?: number;
    }
  ): Promise<ProtocolCompliance[]> {
    const conditions = ['client_id = $1', 'is_deleted = false'];
    const values: unknown[] = [clientId];
    let paramCount = 1;

    if (options?.protocolId) {
      paramCount++;
      conditions.push(`protocol_id = $${paramCount}`);
      values.push(options.protocolId);
    }

    if (options?.startDate) {
      paramCount++;
      conditions.push(`documented_at >= $${paramCount}`);
      values.push(options.startDate);
    }

    if (options?.endDate) {
      paramCount++;
      conditions.push(`documented_at <= $${paramCount}`);
      values.push(options.endDate);
    }

    let query = `SELECT * FROM protocol_compliance WHERE ${conditions.join(' AND ')} ORDER BY documented_at DESC`;

    if (options?.limit) {
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      values.push(options.limit);
    }

    // Conditions are from hardcoded strings, safe for dynamic SQL
    // eslint-disable-next-line sonarjs/sql-queries
    const result = await this.pool.query<ProtocolComplianceRow>(query, values);
    return result.rows.map(this.mapProtocolCompliance);
  }

  /**
   * Get compliance for visit
   */
  async getVisitCompliance(visitId: UUID): Promise<ProtocolCompliance[]> {
    const result = await this.pool.query<ProtocolComplianceRow>(
      `SELECT * FROM protocol_compliance WHERE visit_id = $1 AND is_deleted = false ORDER BY documented_at`,
      [visitId]
    );
    return result.rows.map(this.mapProtocolCompliance);
  }

  /**
   * Approve deviation
   */
  async approveDeviation(
    id: UUID,
    approvedBy: UUID,
    approvedByName: string
  ): Promise<ProtocolCompliance> {
    const result = await this.pool.query<ProtocolComplianceRow>(
      `UPDATE protocol_compliance SET
        deviation_approved = true,
        deviation_approved_by = $2,
        deviation_approved_by_name = $3,
        updated_at = NOW()
      WHERE id = $1 RETURNING *`,
      [id, approvedBy, approvedByName]
    );

    if (!result.rows[0]) {
      throw new Error('Protocol compliance record not found');
    }

    return this.mapProtocolCompliance(result.rows[0]);
  }

  // ==================== SUMMARY ====================

  /**
   * Get protocol summary
   */
  async getProtocolSummary(organizationId: UUID): Promise<ProtocolSummary> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Total protocols
    const totalResult = await this.pool.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM care_protocols WHERE organization_id = $1 AND is_deleted = false`,
      [organizationId]
    );

    // Active protocols
    const activeResult = await this.pool.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM care_protocols
       WHERE organization_id = $1 AND is_deleted = false AND is_active = true`,
      [organizationId]
    );

    // Mandatory protocols
    const mandatoryResult = await this.pool.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM care_protocols
       WHERE organization_id = $1 AND is_deleted = false AND is_mandatory = true`,
      [organizationId]
    );

    // By type
    const typeResult = await this.pool.query<{ protocol_type: string; count: string }>(
      `SELECT protocol_type, COUNT(*) as count FROM care_protocols
       WHERE organization_id = $1 AND is_deleted = false
       GROUP BY protocol_type`,
      [organizationId]
    );

    // By priority
    const priorityResult = await this.pool.query<{ priority: string; count: string }>(
      `SELECT priority, COUNT(*) as count FROM care_protocols
       WHERE organization_id = $1 AND is_deleted = false
       GROUP BY priority`,
      [organizationId]
    );

    // Compliance rate (this month)
    const complianceTotal = await this.pool.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM protocol_compliance
       WHERE organization_id = $1 AND is_deleted = false AND documented_at >= $2`,
      [organizationId, monthStart]
    );

    const compliantCount = await this.pool.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM protocol_compliance
       WHERE organization_id = $1 AND is_deleted = false AND documented_at >= $2
         AND compliance_status IN ('FULLY_COMPLIANT', 'PARTIALLY_COMPLIANT')`,
      [organizationId, monthStart]
    );

    const byType: Record<string, number> = {};
    for (const row of typeResult.rows) {
      byType[row.protocol_type] = parseInt(row.count, 10);
    }

    const byPriority: Record<string, number> = {};
    for (const row of priorityResult.rows) {
      byPriority[row.priority] = parseInt(row.count, 10);
    }

    const totalCompliance = parseInt(complianceTotal.rows[0]!.count, 10);
    const compliant = parseInt(compliantCount.rows[0]!.count, 10);

    return {
      totalProtocols: parseInt(totalResult.rows[0]!.count, 10),
      activeProtocols: parseInt(activeResult.rows[0]!.count, 10),
      mandatoryProtocols: parseInt(mandatoryResult.rows[0]!.count, 10),
      byType,
      byPriority,
      complianceRate: totalCompliance > 0 ? Math.round((compliant / totalCompliance) * 100) : 100,
      complianceThisMonth: totalCompliance,
    };
  }

  /**
   * Generate printable protocol document
   */
  generateProtocolDocument(protocol: CareProtocol): string {
    const lines: string[] = [];
    lines.push('='.repeat(60));
    lines.push(protocol.name.toUpperCase());
    if (protocol.code) {
      lines.push(`Protocol Code: ${protocol.code}`);
    }
    lines.push('='.repeat(60));
    lines.push('');

    if (protocol.purpose) {
      lines.push('PURPOSE');
      lines.push('-'.repeat(40));
      lines.push(protocol.purpose);
      lines.push('');
    }

    if (protocol.scope) {
      lines.push('SCOPE');
      lines.push('-'.repeat(40));
      lines.push(protocol.scope);
      lines.push('');
    }

    if (protocol.indications) {
      lines.push('INDICATIONS');
      lines.push('-'.repeat(40));
      lines.push(protocol.indications);
      lines.push('');
    }

    if (protocol.contraindications) {
      lines.push('CONTRAINDICATIONS');
      lines.push('-'.repeat(40));
      lines.push(protocol.contraindications);
      lines.push('');
    }

    if (protocol.equipmentNeeded && protocol.equipmentNeeded.length > 0) {
      lines.push('EQUIPMENT NEEDED');
      lines.push('-'.repeat(40));
      for (const item of protocol.equipmentNeeded) {
        lines.push(`• ${item}`);
      }
      lines.push('');
    }

    if (protocol.steps && protocol.steps.length > 0) {
      lines.push('PROCEDURE');
      lines.push('-'.repeat(40));
      for (const step of protocol.steps) {
        const duration = step.duration ? ` (${step.duration})` : '';
        lines.push(`${step.step}. ${step.title}${duration}`);
        lines.push(`   ${step.instruction}`);
        if (step.notes) {
          lines.push(`   Note: ${step.notes}`);
        }
      }
      lines.push('');
    }

    if (protocol.precautions) {
      lines.push('PRECAUTIONS');
      lines.push('-'.repeat(40));
      lines.push(protocol.precautions);
      lines.push('');
    }

    if (protocol.expectedOutcomes) {
      lines.push('EXPECTED OUTCOMES');
      lines.push('-'.repeat(40));
      lines.push(protocol.expectedOutcomes);
      lines.push('');
    }

    if (protocol.evidenceBase) {
      lines.push('EVIDENCE BASE');
      lines.push('-'.repeat(40));
      lines.push(protocol.evidenceBase);
      lines.push('');
    }

    lines.push('='.repeat(60));
    lines.push(`Version: ${protocol.version}`);
    if (protocol.sourceOrganization) {
      lines.push(`Source: ${protocol.sourceOrganization}`);
    }
    lines.push(`Generated: ${format(new Date(), 'MMM d, yyyy h:mm a')}`);
    lines.push('='.repeat(60));

    return lines.join('\n');
  }

  // ==================== MAPPING ====================

  private mapProtocolCategory(row: ProtocolCategoryRow): ProtocolCategory {
    return {
      id: row.id,
      organizationId: row.organization_id,
      name: row.name,
      description: row.description ?? undefined,
      icon: row.icon ?? undefined,
      color: row.color ?? undefined,
      isActive: row.is_active,
      displayOrder: row.display_order,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapCareProtocol(row: CareProtocolRow): CareProtocol {
    return {
      id: row.id,
      organizationId: row.organization_id,
      categoryId: row.category_id ?? undefined,
      name: row.name,
      code: row.code ?? undefined,
      description: row.description ?? undefined,
      protocolType: row.protocol_type,
      purpose: row.purpose ?? undefined,
      scope: row.scope ?? undefined,
      indications: row.indications ?? undefined,
      contraindications: row.contraindications ?? undefined,
      steps: row.steps ?? undefined,
      equipmentNeeded: row.equipment_needed ?? undefined,
      precautions: row.precautions ?? undefined,
      expectedOutcomes: row.expected_outcomes ?? undefined,
      documentationRequirements: row.documentation_requirements ?? undefined,
      evidenceBase: row.evidence_base ?? undefined,
      references: row.references ?? undefined,
      sourceOrganization: row.source_organization ?? undefined,
      externalUrl: row.external_url ?? undefined,
      version: row.version,
      effectiveDate: row.effective_date ?? undefined,
      reviewDate: row.review_date ?? undefined,
      expirationDate: row.expiration_date ?? undefined,
      supersedesId: row.supersedes_id ?? undefined,
      isApproved: row.is_approved,
      approvedBy: row.approved_by ?? undefined,
      approvedByName: row.approved_by_name ?? undefined,
      approvedAt: row.approved_at ?? undefined,
      isMandatory: row.is_mandatory,
      priority: row.priority,
      applicableConditions: row.applicable_conditions ?? undefined,
      tags: row.tags ?? undefined,
      createdBy: row.created_by ?? undefined,
      createdByName: row.created_by_name ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      isActive: row.is_active,
      isDeleted: row.is_deleted,
    };
  }

  private mapProtocolCompliance(row: ProtocolComplianceRow): ProtocolCompliance {
    return {
      id: row.id,
      organizationId: row.organization_id,
      protocolId: row.protocol_id,
      clientId: row.client_id,
      visitId: row.visit_id ?? undefined,
      complianceStatus: row.compliance_status,
      stepsCompleted: row.steps_completed ?? undefined,
      complianceNotes: row.compliance_notes ?? undefined,
      hasDeviation: row.has_deviation,
      deviationReason: row.deviation_reason ?? undefined,
      deviationOutcome: row.deviation_outcome ?? undefined,
      deviationApproved: row.deviation_approved,
      deviationApprovedBy: row.deviation_approved_by ?? undefined,
      deviationApprovedByName: row.deviation_approved_by_name ?? undefined,
      documentedBy: row.documented_by,
      documentedByName: row.documented_by_name,
      documentedByCredentials: row.documented_by_credentials ?? undefined,
      documentedAt: row.documented_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      isDeleted: row.is_deleted,
    };
  }
}
