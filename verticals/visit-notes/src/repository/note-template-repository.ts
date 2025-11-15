/**
 * Note Template Repository
 *
 * Data access layer for visit note templates.
 * Handles CRUD operations and template search.
 */

import { Pool } from 'pg';
import { UUID, NotFoundError, PaginationParams, PaginatedResult, UserContext } from '@care-commons/core';
import type {
  VisitNoteTemplate,
  CreateNoteTemplateInput,
  UpdateNoteTemplateInput,
  TemplateSearchFilters,
} from '../types/index.js';

export class NoteTemplateRepository {
  constructor(private pool: Pool) {}

  /**
   * Create a new note template
   */
  async create(input: CreateNoteTemplateInput, context: UserContext): Promise<VisitNoteTemplate> {
    const query = `
      INSERT INTO visit_note_templates (
        organization_id, branch_id, name, description, category,
        template_text, template_html, prompts, default_activities,
        requires_signature, requires_incident_flag, requires_supervisor_review,
        is_active, is_system_template, sort_order, version,
        created_at, created_by, updated_at, updated_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
        NOW(), $17, NOW(), $17
      )
      RETURNING *
    `;

    const values = [
      input.organizationId,
      input.branchId ?? null,
      input.name,
      input.description ?? null,
      input.category,
      input.templateText,
      input.templateHtml ?? null,
      input.prompts ? JSON.stringify(input.prompts) : '[]',
      input.defaultActivities ? JSON.stringify(input.defaultActivities) : '[]',
      input.requiresSignature ?? false,
      input.requiresIncidentFlag ?? false,
      input.requiresSupervisorReview ?? false,
      true, // is_active (new templates are active by default)
      false, // is_system_template (user-created templates)
      input.sortOrder ?? 0,
      1, // version
      context.userId,
    ];

    const result = await this.pool.query(query, values);
    return this.mapRowToTemplate(result.rows[0]);
  }

  /**
   * Get template by ID
   */
  async findById(id: UUID): Promise<VisitNoteTemplate | null> {
    const query = `
      SELECT * FROM visit_note_templates
      WHERE id = $1 AND deleted_at IS NULL
    `;

    const result = await this.pool.query(query, [id]);
    return result.rows[0] ? this.mapRowToTemplate(result.rows[0]) : null;
  }

  /**
   * Update template
   */
  async update(id: UUID, input: UpdateNoteTemplateInput, context: UserContext): Promise<VisitNoteTemplate> {
    const template = await this.findById(id);
    if (!template) {
      throw new NotFoundError('Template not found', { id });
    }

    const updates: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    if (input.name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(input.name);
    }
    if (input.description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(input.description);
    }
    if (input.category !== undefined) {
      updates.push(`category = $${paramCount++}`);
      values.push(input.category);
    }
    if (input.templateText !== undefined) {
      updates.push(`template_text = $${paramCount++}`);
      values.push(input.templateText);
    }
    if (input.templateHtml !== undefined) {
      updates.push(`template_html = $${paramCount++}`);
      values.push(input.templateHtml);
    }
    if (input.prompts !== undefined) {
      updates.push(`prompts = $${paramCount++}`);
      values.push(JSON.stringify(input.prompts));
    }
    if (input.defaultActivities !== undefined) {
      updates.push(`default_activities = $${paramCount++}`);
      values.push(JSON.stringify(input.defaultActivities));
    }
    if (input.requiresSignature !== undefined) {
      updates.push(`requires_signature = $${paramCount++}`);
      values.push(input.requiresSignature);
    }
    if (input.requiresIncidentFlag !== undefined) {
      updates.push(`requires_incident_flag = $${paramCount++}`);
      values.push(input.requiresIncidentFlag);
    }
    if (input.requiresSupervisorReview !== undefined) {
      updates.push(`requires_supervisor_review = $${paramCount++}`);
      values.push(input.requiresSupervisorReview);
    }
    if (input.isActive !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(input.isActive);
    }
    if (input.sortOrder !== undefined) {
      updates.push(`sort_order = $${paramCount++}`);
      values.push(input.sortOrder);
    }

    updates.push(`updated_at = NOW()`);
    updates.push(`updated_by = $${paramCount++}`);
    values.push(context.userId);
    updates.push(`version = version + 1`);

    values.push(id);
    const query = `
      UPDATE visit_note_templates
      SET ${updates.join(', ')}
      WHERE id = $${paramCount} AND deleted_at IS NULL
      RETURNING *
    `;

    const result = await this.pool.query(query, values);
    if (result.rows.length === 0) {
      throw new NotFoundError('Template not found', { id });
    }

    return this.mapRowToTemplate(result.rows[0]);
  }

  /**
   * Soft delete template
   */
  async delete(id: UUID, context: UserContext): Promise<void> {
    const query = `
      UPDATE visit_note_templates
      SET
        deleted_at = NOW(),
        deleted_by = $1,
        updated_at = NOW(),
        updated_by = $1
      WHERE id = $2 AND deleted_at IS NULL
    `;

    const result = await this.pool.query(query, [context.userId, id]);
    if (result.rowCount === 0) {
      throw new NotFoundError('Template not found', { id });
    }
  }

  /**
   * Search templates
   */
  async search(
    filters: TemplateSearchFilters,
    pagination: PaginationParams
  ): Promise<PaginatedResult<VisitNoteTemplate>> {
    const { conditions, values, paramCount } = this.buildSearchConditions(filters);
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count total
    const countQuery = `SELECT COUNT(*) FROM visit_note_templates ${whereClause}`;
    const countResult = await this.pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count, 10);

    // Get paginated results
    const offset = (pagination.page - 1) * pagination.limit;
    const sortBy = pagination.sortBy ?? 'sort_order';
    const sortOrder = pagination.sortOrder ?? 'asc';

    const dataQuery = `
      SELECT * FROM visit_note_templates
      ${whereClause}
      ORDER BY ${sortBy} ${sortOrder}, name ASC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    values.push(pagination.limit, offset);

    const result = await this.pool.query(dataQuery, values);
    const items = result.rows.map(row => this.mapRowToTemplate(row));

    return {
      items,
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit),
    };
  }

  /**
   * Get active templates for organization
   */
  async findActiveByOrganization(organizationId: UUID, branchId?: UUID): Promise<VisitNoteTemplate[]> {
    const query = `
      SELECT * FROM visit_note_templates
      WHERE organization_id = $1
        AND (branch_id IS NULL OR branch_id = $2)
        AND is_active = true
        AND deleted_at IS NULL
      ORDER BY sort_order ASC, name ASC
    `;

    const result = await this.pool.query(query, [organizationId, branchId ?? null]);
    return result.rows.map(row => this.mapRowToTemplate(row));
  }

  /**
   * Get templates by category
   */
  async findByCategory(
    organizationId: UUID,
    category: string,
    branchId?: UUID
  ): Promise<VisitNoteTemplate[]> {
    const query = `
      SELECT * FROM visit_note_templates
      WHERE organization_id = $1
        AND category = $2
        AND (branch_id IS NULL OR branch_id = $3)
        AND is_active = true
        AND deleted_at IS NULL
      ORDER BY sort_order ASC, name ASC
    `;

    const result = await this.pool.query(query, [organizationId, category, branchId ?? null]);
    return result.rows.map(row => this.mapRowToTemplate(row));
  }

  /**
   * Increment usage count
   */
  async incrementUsage(id: UUID): Promise<void> {
    const query = `
      UPDATE visit_note_templates
      SET
        usage_count = usage_count + 1,
        last_used_at = NOW()
      WHERE id = $1
    `;

    await this.pool.query(query, [id]);
  }

  /**
   * Build search conditions
   */
  private buildSearchConditions(filters: TemplateSearchFilters): {
    conditions: string[];
    values: unknown[];
    paramCount: number;
  } {
    const conditions: string[] = ['deleted_at IS NULL'];
    const values: unknown[] = [];
    let paramCount = 1;

    if (filters.organizationId) {
      conditions.push(`organization_id = $${paramCount++}`);
      values.push(filters.organizationId);
    }

    if (filters.branchId !== undefined) {
      if (filters.branchId === null) {
        conditions.push(`branch_id IS NULL`);
      } else {
        conditions.push(`branch_id = $${paramCount++}`);
        values.push(filters.branchId);
      }
    }

    if (filters.category && filters.category.length > 0) {
      conditions.push(`category = ANY($${paramCount++})`);
      values.push(filters.category);
    }

    if (filters.isActive !== undefined) {
      conditions.push(`is_active = $${paramCount++}`);
      values.push(filters.isActive);
    }

    if (filters.isSystemTemplate !== undefined) {
      conditions.push(`is_system_template = $${paramCount++}`);
      values.push(filters.isSystemTemplate);
    }

    return { conditions, values, paramCount };
  }

  /**
   * Map database row to VisitNoteTemplate
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapRowToTemplate(row: any): VisitNoteTemplate {
    return {
      id: row.id,
      organizationId: row.organization_id,
      branchId: row.branch_id,
      name: row.name,
      description: row.description,
      category: row.category,
      templateText: row.template_text,
      templateHtml: row.template_html,
      prompts: row.prompts ?? [],
      defaultActivities: row.default_activities ?? [],
      requiresSignature: row.requires_signature,
      requiresIncidentFlag: row.requires_incident_flag,
      requiresSupervisorReview: row.requires_supervisor_review,
      usageCount: row.usage_count,
      lastUsedAt: row.last_used_at,
      isActive: row.is_active,
      isSystemTemplate: row.is_system_template,
      sortOrder: row.sort_order,
      version: row.version,
      previousVersionId: row.previous_version_id,
      createdAt: row.created_at,
      createdBy: row.created_by,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by,
      deletedAt: row.deleted_at,
      deletedBy: row.deleted_by,
    };
  }
}
