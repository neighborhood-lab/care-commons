import { Repository, type Database } from '@care-commons/core';
import type { AIConversation } from '../types/family.js';

export class AIConversationRepository extends Repository<AIConversation> {
  constructor(database: Database) {
    super({
      tableName: 'family_ai_conversations',
      database,
      enableAudit: false,
      enableSoftDelete: false,
    });
  }

  protected mapRowToEntity(row: Record<string, unknown>): AIConversation {
    return {
      id: row.id as string,
      organizationId: row.organization_id as string,
      familyMemberId: row.family_member_id as string,
      clientId: row.client_id as string,

      sessionId: row.session_id as string,
      userMessage: row.user_message as string,
      aiResponse: row.ai_response as string,

      contextData: row.context_data as Record<string, any> | undefined,

      detectedIntent: row.detected_intent as string | undefined,
      confidenceScore: row.confidence_score ? parseFloat(row.confidence_score as string) : undefined,

      escalatedToHuman: row.escalated_to_human as boolean,
      escalationReason: row.escalation_reason as string | undefined,

      createdAt: new Date(row.created_at as string),
      createdBy: row.family_member_id as string,
      updatedAt: new Date(row.created_at as string),
      updatedBy: row.family_member_id as string,
      version: 1,
    };
  }

  protected mapEntityToRow(entity: Partial<AIConversation>): Record<string, unknown> {
    const row: Record<string, unknown> = {};

    if (entity.organizationId !== undefined) row.organization_id = entity.organizationId;
    if (entity.familyMemberId !== undefined) row.family_member_id = entity.familyMemberId;
    if (entity.clientId !== undefined) row.client_id = entity.clientId;
    if (entity.sessionId !== undefined) row.session_id = entity.sessionId;
    if (entity.userMessage !== undefined) row.user_message = entity.userMessage;
    if (entity.aiResponse !== undefined) row.ai_response = entity.aiResponse;
    if (entity.contextData !== undefined) row.context_data = JSON.stringify(entity.contextData);
    if (entity.detectedIntent !== undefined) row.detected_intent = entity.detectedIntent;
    if (entity.confidenceScore !== undefined) row.confidence_score = entity.confidenceScore;
    if (entity.escalatedToHuman !== undefined) row.escalated_to_human = entity.escalatedToHuman;
    if (entity.escalationReason !== undefined) row.escalation_reason = entity.escalationReason;

    return row;
  }

  /**
   * Get conversation history by session ID
   */
  async findBySessionId(sessionId: string, limit = 50): Promise<AIConversation[]> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE session_id = $1
      ORDER BY created_at ASC
      LIMIT $2
    `;
    const result = await this.database.query(query, [sessionId, limit]);
    return result.rows.map((row) => this.mapRowToEntity(row as Record<string, unknown>));
  }

  /**
   * Get recent conversations for a family member
   */
  async findRecentByFamilyMember(familyMemberId: string, limit = 20): Promise<AIConversation[]> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE family_member_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;
    const result = await this.database.query(query, [familyMemberId, limit]);
    return result.rows.map((row) => this.mapRowToEntity(row as Record<string, unknown>));
  }

  /**
   * Get escalated conversations that need human attention
   */
  async findEscalated(limit = 50): Promise<AIConversation[]> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE escalated_to_human = true
      ORDER BY created_at DESC
      LIMIT $1
    `;
    const result = await this.database.query(query, [limit]);
    return result.rows.map((row) => this.mapRowToEntity(row as Record<string, unknown>));
  }

  /**
   * Get analytics: intent distribution
   */
  async getIntentStats(dateFrom?: Date, dateTo?: Date): Promise<Array<{ intent: string; count: number }>> {
    const conditions: string[] = ['detected_intent IS NOT NULL'];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (dateFrom) {
      conditions.push(`created_at >= $${paramIndex++}`);
      params.push(dateFrom);
    }

    if (dateTo) {
      conditions.push(`created_at <= $${paramIndex++}`);
      params.push(dateTo);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT detected_intent as intent, COUNT(*) as count
      FROM ${this.tableName}
      ${whereClause}
      GROUP BY detected_intent
      ORDER BY count DESC
    `;
    const result = await this.database.query(query, params);
    return result.rows.map((row) => ({
      intent: row.detected_intent as string,
      count: parseInt(row.count as string, 10),
    }));
  }
}
