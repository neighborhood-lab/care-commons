/**
 * Chat repository - data access layer for AI chatbot
 */

import { Repository, Database } from '@care-commons/core';
import {
  ChatSession,
  ChatMessage,
  ChatFeedback,
  ChatEscalation,
  KnowledgeBaseArticle,
  ChatSessionStatus,
  ChatIntent,
} from '../types/ai-chatbot.js';

export class ChatSessionRepository extends Repository<ChatSession> {
  constructor(database: Database) {
    super({
      tableName: 'chat_sessions',
      database,
      enableAudit: false,
      enableSoftDelete: false,
    });
  }

  /**
   * Map database row to ChatSession entity
   */
  protected mapRowToEntity(row: Record<string, unknown>): ChatSession {
    return {
      id: row['id'] as string,
      familyMemberId: row['family_member_id'] as string,
      clientId: row['client_id'] as string,
      status: row['status'] as ChatSessionStatus,
      startedAt: row['started_at'] as Date,
      lastActivityAt: row['last_activity_at'] as Date,
      endedAt: row['ended_at'] as Date | undefined,
      context: JSON.parse(row['context'] as string),
      conversationHistory: JSON.parse(row['conversation_history'] as string),
      totalMessages: row['total_messages'] as number,
      totalTokensUsed: row['total_tokens_used'] as number | undefined,
      language: row['language'] as string | undefined,
      createdAt: row['created_at'] as Date,
      updatedAt: row['updated_at'] as Date,
    };
  }

  /**
   * Find active session for family member
   */
  async findActiveSession(
    familyMemberId: string,
    clientId: string
  ): Promise<ChatSession | null> {
    const rows = await this.database.query<Record<string, unknown>>(
      `SELECT * FROM chat_sessions
       WHERE family_member_id = $1
         AND client_id = $2
         AND status = 'ACTIVE'
       ORDER BY last_activity_at DESC
       LIMIT 1`,
      [familyMemberId, clientId]
    );
    return rows.length > 0 ? this.mapRowToEntity(rows[0]) : null;
  }

  /**
   * Find sessions by family member
   */
  async findByFamilyMember(
    familyMemberId: string,
    limit = 50,
    offset = 0
  ): Promise<ChatSession[]> {
    const rows = await this.database.query<Record<string, unknown>>(
      `SELECT * FROM chat_sessions
       WHERE family_member_id = $1
       ORDER BY last_activity_at DESC
       LIMIT $2 OFFSET $3`,
      [familyMemberId, limit, offset]
    );
    return rows.map(row => this.mapRowToEntity(row));
  }

  /**
   * Update last activity
   */
  async updateLastActivity(sessionId: string): Promise<void> {
    await this.database.query(
      `UPDATE chat_sessions
       SET last_activity_at = NOW(),
           updated_at = NOW()
       WHERE id = $1`,
      [sessionId]
    );
  }

  /**
   * Update context
   */
  async updateContext(sessionId: string, context: any): Promise<void> {
    await this.database.query(
      `UPDATE chat_sessions
       SET context = $2,
           updated_at = NOW()
       WHERE id = $1`,
      [sessionId, JSON.stringify(context)]
    );
  }

  /**
   * Increment message count
   */
  async incrementMessageCount(sessionId: string, tokensUsed?: number): Promise<void> {
    let query = `UPDATE chat_sessions
                 SET total_messages = total_messages + 1,
                     last_activity_at = NOW(),
                     updated_at = NOW()`;

    const params: any[] = [];
    let paramIndex = 1;

    if (tokensUsed) {
      params.push(tokensUsed);
      query += `, total_tokens_used = COALESCE(total_tokens_used, 0) + $${paramIndex++}`;
    }

    params.push(sessionId);
    query += ` WHERE id = $${paramIndex}`;

    await this.database.query(query, params);
  }

  /**
   * End session
   */
  async endSession(sessionId: string, status: ChatSessionStatus = 'ENDED'): Promise<void> {
    await this.database.query(
      `UPDATE chat_sessions
       SET status = $2,
           ended_at = NOW(),
           updated_at = NOW()
       WHERE id = $1`,
      [sessionId, status]
    );
  }

  /**
   * Find idle sessions
   */
  async findIdleSessions(idleMinutes = 30): Promise<ChatSession[]> {
    const rows = await this.database.query<Record<string, unknown>>(
      `SELECT * FROM chat_sessions
       WHERE status = 'ACTIVE'
         AND last_activity_at < NOW() - INTERVAL '${idleMinutes} minutes'
       ORDER BY last_activity_at ASC
       LIMIT 100`
    );
    return rows.map(row => this.mapRowToEntity(row));
  }

  /**
   * Get session statistics
   */
  async getStatistics(familyMemberId: string): Promise<{
    totalSessions: number;
    totalMessages: number;
    totalTokens: number;
    averageSessionLength: number;
  }> {
    const rows = await this.database.query<Record<string, unknown>>(
      `SELECT
         COUNT(*) as total_sessions,
         SUM(total_messages) as total_messages,
         SUM(total_tokens_used) as total_tokens,
         AVG(EXTRACT(EPOCH FROM (COALESCE(ended_at, NOW()) - started_at))) as avg_session_length
       FROM chat_sessions
       WHERE family_member_id = $1`,
      [familyMemberId]
    );

    const row = rows[0];
    return {
      totalSessions: parseInt(row['total_sessions'] as string, 10),
      totalMessages: parseInt(row['total_messages'] as string, 10) || 0,
      totalTokens: parseInt(row['total_tokens'] as string, 10) || 0,
      averageSessionLength: parseFloat(row['avg_session_length'] as string) || 0,
    };
  }
}

export class ChatMessageRepository extends Repository<ChatMessage> {
  constructor(database: Database) {
    super({
      tableName: 'chat_messages',
      database,
      enableAudit: false,
      enableSoftDelete: false,
    });
  }

  /**
   * Map database row to ChatMessage entity
   */
  protected mapRowToEntity(row: Record<string, unknown>): ChatMessage {
    return {
      id: row['id'] as string,
      sessionId: row['session_id'] as string,
      role: row['role'] as any,
      content: row['content'] as string,
      timestamp: row['timestamp'] as Date,
      intent: row['intent'] as ChatIntent | undefined,
      confidence: row['confidence'] ? parseFloat(row['confidence'] as string) : undefined,
      entities: row['entities'] ? JSON.parse(row['entities'] as string) : undefined,
      responseType: row['response_type'] as any | undefined,
      suggestedActions: row['suggested_actions'] ? JSON.parse(row['suggested_actions'] as string) : undefined,
      quickReplies: row['quick_replies'] ? JSON.parse(row['quick_replies'] as string) : undefined,
      tokensUsed: row['tokens_used'] as number | undefined,
      processingTimeMs: row['processing_time_ms'] as number | undefined,
      modelVersion: row['model_version'] as string | undefined,
      containsPHI: row['contains_phi'] as boolean,
      sanitized: row['sanitized'] as boolean,
    };
  }

  /**
   * Find messages by session
   */
  async findBySession(sessionId: string, limit = 100): Promise<ChatMessage[]> {
    const rows = await this.database.query<Record<string, unknown>>(
      `SELECT * FROM chat_messages
       WHERE session_id = $1
       ORDER BY timestamp ASC
       LIMIT $2`,
      [sessionId, limit]
    );
    return rows.map(row => this.mapRowToEntity(row));
  }

  /**
   * Find recent messages
   */
  async findRecentMessages(sessionId: string, count = 10): Promise<ChatMessage[]> {
    const rows = await this.database.query<Record<string, unknown>>(
      `SELECT * FROM chat_messages
       WHERE session_id = $1
       ORDER BY timestamp DESC
       LIMIT $2`,
      [sessionId, count]
    );
    return rows.map(row => this.mapRowToEntity(row)).reverse();
  }

  /**
   * Get conversation context (recent messages for context window)
   */
  async getConversationContext(sessionId: string, maxMessages = 20): Promise<ChatMessage[]> {
    return this.findRecentMessages(sessionId, maxMessages);
  }

  /**
   * Find messages by intent
   */
  async findByIntent(sessionId: string, intent: ChatIntent): Promise<ChatMessage[]> {
    const rows = await this.database.query<Record<string, unknown>>(
      `SELECT * FROM chat_messages
       WHERE session_id = $1 AND intent = $2
       ORDER BY timestamp DESC`,
      [sessionId, intent]
    );
    return rows.map(row => this.mapRowToEntity(row));
  }

  /**
   * Get average confidence for session
   */
  async getAverageConfidence(sessionId: string): Promise<number> {
    const rows = await this.database.query<{ avg: string }>(
      `SELECT AVG(confidence) as avg FROM chat_messages
       WHERE session_id = $1 AND confidence IS NOT NULL`,
      [sessionId]
    );
    return rows.length > 0 ? parseFloat(rows[0].avg) : 0;
  }
}

export class ChatFeedbackRepository extends Repository<ChatFeedback> {
  constructor(database: Database) {
    super({
      tableName: 'chat_feedback',
      database,
      enableAudit: false,
      enableSoftDelete: false,
    });
  }

  /**
   * Map database row to ChatFeedback entity
   */
  protected mapRowToEntity(row: Record<string, unknown>): ChatFeedback {
    return {
      id: row['id'] as string,
      sessionId: row['session_id'] as string,
      messageId: row['message_id'] as string | undefined,
      familyMemberId: row['family_member_id'] as string,
      rating: row['rating'] as any,
      feedbackType: row['feedback_type'] as any,
      comment: row['comment'] as string | undefined,
      issues: row['issues'] ? JSON.parse(row['issues'] as string) : undefined,
      createdAt: row['created_at'] as Date,
    };
  }

  /**
   * Find feedback by session
   */
  async findBySession(sessionId: string): Promise<ChatFeedback[]> {
    const rows = await this.database.query<Record<string, unknown>>(
      `SELECT * FROM chat_feedback
       WHERE session_id = $1
       ORDER BY created_at DESC`,
      [sessionId]
    );
    return rows.map(row => this.mapRowToEntity(row));
  }

  /**
   * Get average rating
   */
  async getAverageRating(startDate?: Date, endDate?: Date): Promise<number> {
    let query = `SELECT AVG(rating) as avg FROM chat_feedback WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;

    if (startDate) {
      params.push(startDate);
      query += ` AND created_at >= $${paramIndex++}`;
    }

    if (endDate) {
      params.push(endDate);
      query += ` AND created_at <= $${paramIndex++}`;
    }

    const rows = await this.database.query<{ avg: string }>(query, params);
    return rows.length > 0 ? parseFloat(rows[0].avg) : 0;
  }

  /**
   * Get feedback statistics
   */
  async getStatistics(): Promise<{
    totalFeedback: number;
    averageRating: number;
    ratingDistribution: Record<number, number>;
    commonIssues: Record<string, number>;
  }> {
    const rows = await this.database.query<Record<string, unknown>>(
      `SELECT
         COUNT(*) as total,
         AVG(rating) as avg_rating,
         COUNT(*) FILTER (WHERE rating = 1) as rating_1,
         COUNT(*) FILTER (WHERE rating = 2) as rating_2,
         COUNT(*) FILTER (WHERE rating = 3) as rating_3,
         COUNT(*) FILTER (WHERE rating = 4) as rating_4,
         COUNT(*) FILTER (WHERE rating = 5) as rating_5
       FROM chat_feedback`
    );

    const row = rows[0];
    return {
      totalFeedback: parseInt(row['total'] as string, 10),
      averageRating: parseFloat(row['avg_rating'] as string) || 0,
      ratingDistribution: {
        1: parseInt(row['rating_1'] as string, 10),
        2: parseInt(row['rating_2'] as string, 10),
        3: parseInt(row['rating_3'] as string, 10),
        4: parseInt(row['rating_4'] as string, 10),
        5: parseInt(row['rating_5'] as string, 10),
      },
      commonIssues: {}, // Would need more complex query to aggregate issues
    };
  }
}

export class ChatEscalationRepository extends Repository<ChatEscalation> {
  constructor(database: Database) {
    super({
      tableName: 'chat_escalations',
      database,
      enableAudit: false,
      enableSoftDelete: false,
    });
  }

  /**
   * Map database row to ChatEscalation entity
   */
  protected mapRowToEntity(row: Record<string, unknown>): ChatEscalation {
    return {
      id: row['id'] as string,
      sessionId: row['session_id'] as string,
      familyMemberId: row['family_member_id'] as string,
      clientId: row['client_id'] as string,
      reason: row['reason'] as any,
      priority: row['priority'] as any,
      description: row['description'] as string,
      assignedTo: row['assigned_to'] as string | undefined,
      assignedAt: row['assigned_at'] as Date | undefined,
      status: row['status'] as any,
      resolvedAt: row['resolved_at'] as Date | undefined,
      resolvedBy: row['resolved_by'] as string | undefined,
      resolution: row['resolution'] as string | undefined,
      createdAt: row['created_at'] as Date,
      updatedAt: row['updated_at'] as Date,
    };
  }

  /**
   * Find pending escalations
   */
  async findPending(): Promise<ChatEscalation[]> {
    const rows = await this.database.query<Record<string, unknown>>(
      `SELECT * FROM chat_escalations
       WHERE status IN ('PENDING', 'ASSIGNED', 'IN_PROGRESS')
       ORDER BY priority DESC, created_at ASC`
    );
    return rows.map(row => this.mapRowToEntity(row));
  }

  /**
   * Find escalations by assignee
   */
  async findByAssignee(userId: string): Promise<ChatEscalation[]> {
    const rows = await this.database.query<Record<string, unknown>>(
      `SELECT * FROM chat_escalations
       WHERE assigned_to = $1
         AND status IN ('ASSIGNED', 'IN_PROGRESS')
       ORDER BY priority DESC, created_at ASC`,
      [userId]
    );
    return rows.map(row => this.mapRowToEntity(row));
  }

  /**
   * Assign escalation
   */
  async assign(escalationId: string, userId: string): Promise<void> {
    await this.database.query(
      `UPDATE chat_escalations
       SET assigned_to = $2,
           assigned_at = NOW(),
           status = 'ASSIGNED',
           updated_at = NOW()
       WHERE id = $1`,
      [escalationId, userId]
    );
  }

  /**
   * Resolve escalation
   */
  async resolve(
    escalationId: string,
    userId: string,
    resolution: string
  ): Promise<void> {
    await this.database.query(
      `UPDATE chat_escalations
       SET resolved_by = $2,
           resolved_at = NOW(),
           resolution = $3,
           status = 'RESOLVED',
           updated_at = NOW()
       WHERE id = $1`,
      [escalationId, userId, resolution]
    );
  }
}

export class KnowledgeBaseRepository extends Repository<KnowledgeBaseArticle> {
  constructor(database: Database) {
    super({
      tableName: 'knowledge_base_articles',
      database,
      enableAudit: false,
      enableSoftDelete: false,
    });
  }

  /**
   * Map database row to KnowledgeBaseArticle entity
   */
  protected mapRowToEntity(row: Record<string, unknown>): KnowledgeBaseArticle {
    return {
      id: row['id'] as string,
      title: row['title'] as string,
      content: row['content'] as string,
      category: row['category'] as any,
      tags: row['tags'] ? JSON.parse(row['tags'] as string) : [],
      embedding: row['embedding'] as number[] | undefined,
      embeddingModel: row['embedding_model'] as string | undefined,
      relevanceScore: row['relevance_score'] ? parseFloat(row['relevance_score'] as string) : undefined,
      usageCount: row['usage_count'] as number,
      isPublished: row['is_published'] as boolean,
      publishedAt: row['published_at'] as Date | undefined,
      applicableStates: row['applicable_states'] ? JSON.parse(row['applicable_states'] as string) : undefined,
      createdAt: row['created_at'] as Date,
      updatedAt: row['updated_at'] as Date,
    };
  }

  /**
   * Search by text
   */
  async searchByText(query: string, limit = 10): Promise<KnowledgeBaseArticle[]> {
    const rows = await this.database.query<Record<string, unknown>>(
      `SELECT * FROM knowledge_base_articles
       WHERE is_published = true
         AND to_tsvector('english', title || ' ' || content) @@ plainto_tsquery('english', $1)
       ORDER BY ts_rank(to_tsvector('english', title || ' ' || content), plainto_tsquery('english', $1)) DESC
       LIMIT $2`,
      [query, limit]
    );
    return rows.map(row => this.mapRowToEntity(row));
  }

  /**
   * Find by category
   */
  async findByCategory(category: string): Promise<KnowledgeBaseArticle[]> {
    const rows = await this.database.query<Record<string, unknown>>(
      `SELECT * FROM knowledge_base_articles
       WHERE category = $1 AND is_published = true
       ORDER BY usage_count DESC, created_at DESC`,
      [category]
    );
    return rows.map(row => this.mapRowToEntity(row));
  }

  /**
   * Increment usage count
   */
  async incrementUsageCount(id: string): Promise<void> {
    await this.database.query(
      `UPDATE knowledge_base_articles
       SET usage_count = usage_count + 1,
           updated_at = NOW()
       WHERE id = $1`,
      [id]
    );
  }

  /**
   * Find popular articles
   */
  async findPopular(limit = 10): Promise<KnowledgeBaseArticle[]> {
    const rows = await this.database.query<Record<string, unknown>>(
      `SELECT * FROM knowledge_base_articles
       WHERE is_published = true
       ORDER BY usage_count DESC, created_at DESC
       LIMIT $1`,
      [limit]
    );
    return rows.map(row => this.mapRowToEntity(row));
  }
}
