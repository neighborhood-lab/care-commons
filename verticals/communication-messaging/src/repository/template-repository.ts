/**
 * Template repository - data access layer for message templates
 */

import { Repository, Database } from '@care-commons/core';
import type {
  MessageTemplate,
  TemplateVariable,
  TemplateChannelVersion,
  ChannelType,
  NotificationCategory,
} from '../types/communication.js';

export class MessageTemplateRepository extends Repository<MessageTemplate> {
  constructor(database: Database) {
    super({
      tableName: 'message_templates',
      database,
      enableAudit: true,
      enableSoftDelete: false,
    });
  }

  protected mapRowToEntity(row: Record<string, unknown>): MessageTemplate {
    return {
      id: row['id'] as string,
      organizationId: row['organization_id'] as string,
      templateName: row['template_name'] as string,
      description: row['description'] as string | undefined,
      category: row['category'] as NotificationCategory,
      subject: row['subject'] as string | undefined,
      content: row['content'] as string,
      contentFormat: row['content_format'] as 'PLAIN_TEXT' | 'MARKDOWN' | 'HTML',
      variables: JSON.parse(row['variables'] as string),
      channelVersions: JSON.parse((row['channel_versions'] as string) || '{}'),
      usageCount: row['usage_count'] as number,
      lastUsedAt: row['last_used_at'] as Date | null | undefined,
      status: row['status'] as 'DRAFT' | 'ACTIVE' | 'ARCHIVED',
      isSystem: row['is_system'] as boolean,
      tags: JSON.parse((row['tags'] as string) || '[]'),
      language: row['language'] as string,
      createdAt: row['created_at'] as Date,
      createdBy: row['created_by'] as string,
      updatedAt: row['updated_at'] as Date,
      updatedBy: row['updated_by'] as string,
      version: row['version'] as number,
    };
  }

  protected mapEntityToRow(entity: Partial<MessageTemplate>): Record<string, unknown> {
    const row: Record<string, unknown> = {};

    if (entity.organizationId !== undefined) row['organization_id'] = entity.organizationId;
    if (entity.templateName !== undefined) row['template_name'] = entity.templateName;
    if (entity.description !== undefined) row['description'] = entity.description;
    if (entity.category !== undefined) row['category'] = entity.category;
    if (entity.subject !== undefined) row['subject'] = entity.subject;
    if (entity.content !== undefined) row['content'] = entity.content;
    if (entity.contentFormat !== undefined) row['content_format'] = entity.contentFormat;
    if (entity.variables !== undefined) row['variables'] = JSON.stringify(entity.variables);
    if (entity.channelVersions !== undefined) row['channel_versions'] = JSON.stringify(entity.channelVersions);
    if (entity.usageCount !== undefined) row['usage_count'] = entity.usageCount;
    if (entity.lastUsedAt !== undefined) row['last_used_at'] = entity.lastUsedAt;
    if (entity.status !== undefined) row['status'] = entity.status;
    if (entity.isSystem !== undefined) row['is_system'] = entity.isSystem;
    if (entity.tags !== undefined) row['tags'] = JSON.stringify(entity.tags);
    if (entity.language !== undefined) row['language'] = entity.language;

    return row;
  }

  /**
   * Find templates by category
   */
  async findByCategory(organizationId: string, category: NotificationCategory): Promise<MessageTemplate[]> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE organization_id = $1
        AND category = $2
        AND status = 'ACTIVE'
      ORDER BY template_name ASC
    `;

    const result = await this.database.query(query, [organizationId, category]);
    return result.rows.map((row) => this.mapRowToEntity(row));
  }

  /**
   * Find active templates for organization
   */
  async findActive(organizationId: string): Promise<MessageTemplate[]> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE organization_id = $1
        AND status = 'ACTIVE'
      ORDER BY category, template_name ASC
    `;

    const result = await this.database.query(query, [organizationId]);
    return result.rows.map((row) => this.mapRowToEntity(row));
  }

  /**
   * Find template by name
   */
  async findByName(organizationId: string, templateName: string): Promise<MessageTemplate | null> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE organization_id = $1
        AND template_name = $2
    `;

    const result = await this.database.query(query, [organizationId, templateName]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToEntity(result.rows[0] as Record<string, unknown>);
  }

  /**
   * Increment usage count
   */
  async incrementUsage(templateId: string): Promise<void> {
    const query = `
      UPDATE ${this.tableName}
      SET usage_count = usage_count + 1,
          last_used_at = NOW(),
          updated_at = NOW()
      WHERE id = $1
    `;

    await this.database.query(query, [templateId]);
  }

  /**
   * Find system templates
   */
  async findSystemTemplates(): Promise<MessageTemplate[]> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE is_system = true
        AND status = 'ACTIVE'
      ORDER BY category, template_name ASC
    `;

    const result = await this.database.query(query, []);
    return result.rows.map((row) => this.mapRowToEntity(row));
  }
}
