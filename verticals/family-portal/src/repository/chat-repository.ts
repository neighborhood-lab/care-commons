/**
 * Chat Repository
 *
 * Data access layer for chat conversations and messages
 */

import { Repository, Database, UUID, PaginatedResult, PaginationParams } from '@care-commons/core';
import type { ChatConversation, ChatMessage, MessageRole } from '../types/index.js';

export class ChatConversationRepository extends Repository<ChatConversation> {
  constructor(database: Database) {
    super({ tableName: 'chat_conversations', database, enableAudit: false, enableSoftDelete: false });
  }

  protected mapRowToEntity(row: any): ChatConversation {
    return {
      id: row.id,
      familyMemberId: row.family_member_id,
      clientId: row.client_id,
      title: row.title,
      summary: row.summary,
      messageCount: row.message_count,
      lastMessageAt: row.last_message_at,
      isActive: row.is_active,
      archivedAt: row.archived_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  protected mapEntityToRow(entity: Partial<ChatConversation>): Record<string, any> {
    const row: Record<string, any> = {};

    if (entity.id !== undefined) row.id = entity.id;
    if (entity.familyMemberId !== undefined) row.family_member_id = entity.familyMemberId;
    if (entity.clientId !== undefined) row.client_id = entity.clientId;
    if (entity.title !== undefined) row.title = entity.title;
    if (entity.summary !== undefined) row.summary = entity.summary;
    if (entity.messageCount !== undefined) row.message_count = entity.messageCount;
    if (entity.lastMessageAt !== undefined) row.last_message_at = entity.lastMessageAt;
    if (entity.isActive !== undefined) row.is_active = entity.isActive;
    if (entity.archivedAt !== undefined) row.archived_at = entity.archivedAt;
    if (entity.createdAt !== undefined) row.created_at = entity.createdAt;
    if (entity.updatedAt !== undefined) row.updated_at = entity.updatedAt;

    return row;
  }

  async findByFamilyMember(familyMemberId: UUID, activeOnly: boolean = true): Promise<ChatConversation[]> {
    let query = this.database.knex(this.tableName).where({ family_member_id: familyMemberId });

    if (activeOnly) {
      query = query.where({ is_active: true });
    }

    const rows = await query.orderBy('last_message_at', 'desc').orderBy('created_at', 'desc');
    return rows.map((row) => this.mapRowToEntity(row));
  }

  async incrementMessageCount(conversationId: UUID): Promise<void> {
    await this.database.knex(this.tableName)
      .where({ id: conversationId })
      .update({
        message_count: this.database.knex.raw('message_count + 1'),
        last_message_at: new Date(),
        updated_at: new Date(),
      });
  }

  async archive(conversationId: UUID): Promise<void> {
    await this.database.knex(this.tableName).where({ id: conversationId }).update({
      is_active: false,
      archived_at: new Date(),
      updated_at: new Date(),
    });
  }
}

export class ChatMessageRepository extends Repository<ChatMessage> {
  constructor(database: Database) {
    super({ tableName: 'chat_messages', database, enableAudit: false, enableSoftDelete: true });
  }

  protected mapRowToEntity(row: any): ChatMessage {
    return {
      id: row.id,
      conversationId: row.conversation_id,
      familyMemberId: row.family_member_id,
      role: row.role,
      content: row.content,
      tokens: row.tokens,
      model: row.model,
      contextUsed: row.context_used,
      createdAt: row.created_at,
      editedAt: row.edited_at,
      deletedAt: row.deleted_at,
    };
  }

  protected mapEntityToRow(entity: Partial<ChatMessage>): Record<string, any> {
    const row: Record<string, any> = {};

    if (entity.id !== undefined) row.id = entity.id;
    if (entity.conversationId !== undefined) row.conversation_id = entity.conversationId;
    if (entity.familyMemberId !== undefined) row.family_member_id = entity.familyMemberId;
    if (entity.role !== undefined) row.role = entity.role;
    if (entity.content !== undefined) row.content = entity.content;
    if (entity.tokens !== undefined) row.tokens = entity.tokens;
    if (entity.model !== undefined) row.model = entity.model;
    if (entity.contextUsed !== undefined) row.context_used = JSON.stringify(entity.contextUsed);
    if (entity.createdAt !== undefined) row.created_at = entity.createdAt;
    if (entity.editedAt !== undefined) row.edited_at = entity.editedAt;
    if (entity.deletedAt !== undefined) row.deleted_at = entity.deletedAt;

    return row;
  }

  async findByConversation(
    conversationId: UUID,
    pagination: PaginationParams
  ): Promise<PaginatedResult<ChatMessage>> {
    const query = this.database.knex(this.tableName)
      .where({ conversation_id: conversationId })
      .whereNull('deleted_at');

    const countResult = await query.clone().count('* as count').first();
    const total = Number(countResult?.count || 0);

    const offset = (pagination.page - 1) * pagination.limit;
    const rows = await query
      .orderBy('created_at', 'asc')
      .limit(pagination.limit)
      .offset(offset);

    return {
      items: rows.map((row) => this.mapRowToEntity(row)),
      total,
      page: pagination.page,
      limit: pagination.limit,
      pages: Math.ceil(total / pagination.limit),
    };
  }

  async findRecentMessages(conversationId: UUID, limit: number = 50): Promise<ChatMessage[]> {
    const rows = await this.database.knex(this.tableName)
      .where({ conversation_id: conversationId })
      .whereNull('deleted_at')
      .orderBy('created_at', 'desc')
      .limit(limit);

    return rows.reverse().map((row) => this.mapRowToEntity(row));
  }

  async getMessageCountByRole(conversationId: UUID, role: MessageRole): Promise<number> {
    const result = await this.database.knex(this.tableName)
      .where({ conversation_id: conversationId, role })
      .whereNull('deleted_at')
      .count('* as count')
      .first();

    return Number(result?.count || 0);
  }

  async getTotalTokens(conversationId: UUID): Promise<number> {
    const result = await this.database.knex(this.tableName)
      .where({ conversation_id: conversationId })
      .whereNull('deleted_at')
      .sum('tokens as total')
      .first();

    return Number(result?.total || 0);
  }
}
