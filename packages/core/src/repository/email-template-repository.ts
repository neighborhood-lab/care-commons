/**
 * @care-commons/core - Email Template Repository
 *
 * Data access layer for customizable email templates
 */

import { Database } from '../db/connection';
import { UUID } from '../types/base';
import {
  EmailTemplate,
  EmailTemplateKey,
  CreateEmailTemplateRequest,
  UpdateEmailTemplateRequest,
} from '../types/white-label';

export interface IEmailTemplateRepository {
  getTemplateById(id: UUID): Promise<EmailTemplate | null>;
  getTemplateByKey(
    templateKey: EmailTemplateKey,
    organizationId: UUID | null
  ): Promise<EmailTemplate | null>;
  getTemplatesByOrganization(organizationId: UUID | null): Promise<EmailTemplate[]>;
  createTemplate(
    request: CreateEmailTemplateRequest,
    organizationId: UUID | null,
    createdBy: UUID
  ): Promise<EmailTemplate>;
  updateTemplate(
    id: UUID,
    updates: UpdateEmailTemplateRequest,
    updatedBy: UUID
  ): Promise<EmailTemplate>;
  deleteTemplate(id: UUID, deletedBy: UUID): Promise<void>;
}

export class EmailTemplateRepository implements IEmailTemplateRepository {
  constructor(private db: Database) {}

  async getTemplateById(id: UUID): Promise<EmailTemplate | null> {
    const query = `
      SELECT
        id, organization_id, template_key, name, description,
        subject, html_body, text_body, available_variables,
        is_active, is_system_template,
        created_at, created_by, updated_at, updated_by,
        deleted_at, deleted_by
      FROM email_templates
      WHERE id = $1 AND deleted_at IS NULL
    `;

    const result = await this.db.query<EmailTemplateRow>(query, [id]);

    const row = result.rows[0];
    if (row === undefined) {
      return null;
    }

    return this.mapRowToTemplate(row);
  }

  async getTemplateByKey(
    templateKey: EmailTemplateKey,
    organizationId: UUID | null
  ): Promise<EmailTemplate | null> {
    // First try to get organization-specific template
    if (organizationId) {
      const orgQuery = `
        SELECT
          id, organization_id, template_key, name, description,
          subject, html_body, text_body, available_variables,
          is_active, is_system_template,
          created_at, created_by, updated_at, updated_by,
          deleted_at, deleted_by
        FROM email_templates
        WHERE template_key = $1
          AND organization_id = $2
          AND is_active = true
          AND deleted_at IS NULL
        LIMIT 1
      `;

      const result = await this.db.query<EmailTemplateRow>(orgQuery, [
        templateKey,
        organizationId,
      ]);

      if (result.rows[0]) {
        return this.mapRowToTemplate(result.rows[0]);
      }
    }

    // Fallback to system default template
    const systemQuery = `
      SELECT
        id, organization_id, template_key, name, description,
        subject, html_body, text_body, available_variables,
        is_active, is_system_template,
        created_at, created_by, updated_at, updated_by,
        deleted_at, deleted_by
      FROM email_templates
      WHERE template_key = $1
        AND organization_id IS NULL
        AND is_active = true
        AND deleted_at IS NULL
      LIMIT 1
    `;

    const result = await this.db.query<EmailTemplateRow>(systemQuery, [templateKey]);

    const row = result.rows[0];
    if (row === undefined) {
      return null;
    }

    return this.mapRowToTemplate(row);
  }

  async getTemplatesByOrganization(organizationId: UUID | null): Promise<EmailTemplate[]> {
    const query = `
      SELECT
        id, organization_id, template_key, name, description,
        subject, html_body, text_body, available_variables,
        is_active, is_system_template,
        created_at, created_by, updated_at, updated_by,
        deleted_at, deleted_by
      FROM email_templates
      WHERE organization_id ${organizationId === null ? 'IS NULL' : '= $1'}
        AND deleted_at IS NULL
      ORDER BY template_key, created_at DESC
    `;

    const params = organizationId === null ? [] : [organizationId];
    const result = await this.db.query<EmailTemplateRow>(query, params);

    return result.rows.map((row) => this.mapRowToTemplate(row));
  }

  async createTemplate(
    request: CreateEmailTemplateRequest,
    organizationId: UUID | null,
    createdBy: UUID
  ): Promise<EmailTemplate> {
    const query = `
      INSERT INTO email_templates (
        organization_id, template_key, name, description,
        subject, html_body, text_body, available_variables,
        is_active, is_system_template,
        created_by, updated_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, false, $10, $10)
      RETURNING
        id, organization_id, template_key, name, description,
        subject, html_body, text_body, available_variables,
        is_active, is_system_template,
        created_at, created_by, updated_at, updated_by,
        deleted_at, deleted_by
    `;

    const values = [
      organizationId,
      request.templateKey,
      request.name,
      request.description ?? null,
      request.subject,
      request.htmlBody,
      request.textBody ?? null,
      request.availableVariables ?? [],
      request.isActive ?? true,
      createdBy,
    ];

    const result = await this.db.query<EmailTemplateRow>(query, values);

    return this.mapRowToTemplate(result.rows[0]!);
  }

  async updateTemplate(
    id: UUID,
    updates: UpdateEmailTemplateRequest,
    updatedBy: UUID
  ): Promise<EmailTemplate> {
    const updateFields: string[] = [];
    const values: unknown[] = [id, updatedBy];
    let paramIndex = 3;

    if (updates.name !== undefined) {
      updateFields.push(`name = $${paramIndex++}`);
      values.push(updates.name);
    }
    if (updates.description !== undefined) {
      updateFields.push(`description = $${paramIndex++}`);
      values.push(updates.description);
    }
    if (updates.subject !== undefined) {
      updateFields.push(`subject = $${paramIndex++}`);
      values.push(updates.subject);
    }
    if (updates.htmlBody !== undefined) {
      updateFields.push(`html_body = $${paramIndex++}`);
      values.push(updates.htmlBody);
    }
    if (updates.textBody !== undefined) {
      updateFields.push(`text_body = $${paramIndex++}`);
      values.push(updates.textBody);
    }
    if (updates.availableVariables !== undefined) {
      updateFields.push(`available_variables = $${paramIndex++}`);
      values.push(updates.availableVariables);
    }
    if (updates.isActive !== undefined) {
      updateFields.push(`is_active = $${paramIndex++}`);
      values.push(updates.isActive);
    }

    if (updateFields.length === 0) {
      // No updates, just return current
      const current = await this.getTemplateById(id);
      if (!current) {
        throw new Error('Template not found');
      }
      return current;
    }

    const query = `
      UPDATE email_templates
      SET ${updateFields.join(', ')}, updated_by = $2, updated_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING
        id, organization_id, template_key, name, description,
        subject, html_body, text_body, available_variables,
        is_active, is_system_template,
        created_at, created_by, updated_at, updated_by,
        deleted_at, deleted_by
    `;

    const result = await this.db.query<EmailTemplateRow>(query, values);

    const row = result.rows[0];
    if (!row) {
      throw new Error('Template not found');
    }

    return this.mapRowToTemplate(row);
  }

  async deleteTemplate(id: UUID, deletedBy: UUID): Promise<void> {
    // Check if it's a system template (can't be deleted)
    const checkQuery = `
      SELECT is_system_template FROM email_templates WHERE id = $1 AND deleted_at IS NULL
    `;
    const checkResult = await this.db.query<{ is_system_template: boolean }>(checkQuery, [id]);

    if (checkResult.rows[0]?.is_system_template) {
      throw new Error('Cannot delete system template');
    }

    const query = `
      UPDATE email_templates
      SET deleted_at = NOW(),
          deleted_by = $2,
          updated_at = NOW(),
          updated_by = $2
      WHERE id = $1 AND deleted_at IS NULL
    `;

    await this.db.query(query, [id, deletedBy]);
  }

  private mapRowToTemplate(row: EmailTemplateRow): EmailTemplate {
    return {
      id: row.id,
      organizationId: row.organization_id,
      templateKey: row.template_key as EmailTemplateKey,
      name: row.name,
      description: row.description,
      subject: row.subject,
      htmlBody: row.html_body,
      textBody: row.text_body,
      availableVariables: row.available_variables,
      isActive: row.is_active,
      isSystemTemplate: row.is_system_template,
      createdAt: row.created_at,
      createdBy: row.created_by,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by,
      version: 1, // Not tracking version for templates
      deletedAt: row.deleted_at,
      deletedBy: row.deleted_by,
    };
  }
}

interface EmailTemplateRow extends Record<string, unknown> {
  id: string;
  organization_id: string | null;
  template_key: string;
  name: string;
  description: string | null;
  subject: string;
  html_body: string;
  text_body: string | null;
  available_variables: string[];
  is_active: boolean;
  is_system_template: boolean;
  created_at: Date;
  created_by: string;
  updated_at: Date;
  updated_by: string;
  deleted_at: Date | null;
  deleted_by: string | null;
}
