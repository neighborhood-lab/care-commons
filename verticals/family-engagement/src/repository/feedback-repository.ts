import { Repository, type Database, type PaginatedResult } from '@care-commons/core';
import type { FamilyFeedback, FeedbackSearchFilter } from '../types/family.js';

export class FeedbackRepository extends Repository<FamilyFeedback> {
  constructor(database: Database) {
    super({
      tableName: 'family_feedback',
      database,
      enableAudit: false,
      enableSoftDelete: false,
    });
  }

  protected mapRowToEntity(row: Record<string, unknown>): FamilyFeedback {
    return {
      id: row.id as string,
      organizationId: row.organization_id as string,
      familyMemberId: row.family_member_id as string,
      clientId: row.client_id as string,

      feedbackType: row.feedback_type as FamilyFeedback['feedbackType'],
      visitId: row.visit_id as string | undefined,
      caregiverId: row.caregiver_id as string | undefined,

      rating: row.rating as FamilyFeedback['rating'],
      comment: row.comment as string | undefined,
      sentiment: row.sentiment as FamilyFeedback['sentiment'],

      requiresFollowUp: row.requires_follow_up as boolean,
      followUpCompleted: row.follow_up_completed as boolean,
      followUpNotes: row.follow_up_notes as string | undefined,

      createdAt: new Date(row.created_at as string),
      createdBy: row.family_member_id as string,
      updatedAt: new Date(row.created_at as string),
      updatedBy: row.family_member_id as string,
      version: 1,
    };
  }

  protected mapEntityToRow(entity: Partial<FamilyFeedback>): Record<string, unknown> {
    const row: Record<string, unknown> = {};

    if (entity.organizationId !== undefined) row.organization_id = entity.organizationId;
    if (entity.familyMemberId !== undefined) row.family_member_id = entity.familyMemberId;
    if (entity.clientId !== undefined) row.client_id = entity.clientId;
    if (entity.feedbackType !== undefined) row.feedback_type = entity.feedbackType;
    if (entity.visitId !== undefined) row.visit_id = entity.visitId;
    if (entity.caregiverId !== undefined) row.caregiver_id = entity.caregiverId;
    if (entity.rating !== undefined) row.rating = entity.rating;
    if (entity.comment !== undefined) row.comment = entity.comment;
    if (entity.sentiment !== undefined) row.sentiment = entity.sentiment;
    if (entity.requiresFollowUp !== undefined) row.requires_follow_up = entity.requiresFollowUp;
    if (entity.followUpCompleted !== undefined) row.follow_up_completed = entity.followUpCompleted;
    if (entity.followUpNotes !== undefined) row.follow_up_notes = entity.followUpNotes;

    return row;
  }

  /**
   * Search feedback with filters
   */
  async search(
    filter: FeedbackSearchFilter,
    page = 1,
    limit = 50
  ): Promise<PaginatedResult<FamilyFeedback>> {
    const offset = (page - 1) * limit;
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (filter.clientId) {
      conditions.push(`client_id = $${paramIndex++}`);
      params.push(filter.clientId);
    }

    if (filter.familyMemberId) {
      conditions.push(`family_member_id = $${paramIndex++}`);
      params.push(filter.familyMemberId);
    }

    if (filter.caregiverId) {
      conditions.push(`caregiver_id = $${paramIndex++}`);
      params.push(filter.caregiverId);
    }

    if (filter.feedbackType) {
      conditions.push(`feedback_type = $${paramIndex++}`);
      params.push(filter.feedbackType);
    }

    if (filter.ratingMin !== undefined) {
      conditions.push(`rating >= $${paramIndex++}`);
      params.push(filter.ratingMin);
    }

    if (filter.ratingMax !== undefined) {
      conditions.push(`rating <= $${paramIndex++}`);
      params.push(filter.ratingMax);
    }

    if (filter.sentiment) {
      conditions.push(`sentiment = $${paramIndex++}`);
      params.push(filter.sentiment);
    }

    if (filter.requiresFollowUp !== undefined) {
      conditions.push(`requires_follow_up = $${paramIndex++}`);
      params.push(filter.requiresFollowUp);
    }

    if (filter.followUpCompleted !== undefined) {
      conditions.push(`follow_up_completed = $${paramIndex++}`);
      params.push(filter.followUpCompleted);
    }

    if (filter.dateFrom) {
      conditions.push(`created_at >= $${paramIndex++}`);
      params.push(filter.dateFrom);
    }

    if (filter.dateTo) {
      conditions.push(`created_at <= $${paramIndex++}`);
      params.push(filter.dateTo);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count total
    const countQuery = `SELECT COUNT(*) FROM ${this.tableName} ${whereClause}`;
    const countResult = await this.database.query(countQuery, params);
    const total = parseInt(countResult.rows[0]?.count as string, 10);

    // Get items
    const query = `
      SELECT * FROM ${this.tableName}
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    const result = await this.database.query(query, [...params, limit, offset]);

    return {
      items: result.rows.map((row) => this.mapRowToEntity(row as Record<string, unknown>)),
      total,
      page,
      limit,
    };
  }

  /**
   * Get average rating for a caregiver
   */
  async getAverageRatingForCaregiver(caregiverId: string): Promise<number> {
    const query = `
      SELECT AVG(rating) as avg_rating
      FROM ${this.tableName}
      WHERE caregiver_id = $1
    `;
    const result = await this.database.query(query, [caregiverId]);
    const avgRating = result.rows[0]?.avg_rating;
    return avgRating ? parseFloat(avgRating as string) : 0;
  }

  /**
   * Get feedback requiring follow-up
   */
  async findRequiringFollowUp(limit = 50): Promise<FamilyFeedback[]> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE requires_follow_up = true AND follow_up_completed = false
      ORDER BY created_at
      LIMIT $1
    `;
    const result = await this.database.query(query, [limit]);
    return result.rows.map((row) => this.mapRowToEntity(row as Record<string, unknown>));
  }

  /**
   * Mark follow-up as completed
   */
  async completeFollowUp(id: string, notes: string): Promise<void> {
    const query = `
      UPDATE ${this.tableName}
      SET follow_up_completed = true, follow_up_notes = $2
      WHERE id = $1
    `;
    await this.database.query(query, [id, notes]);
  }

  /**
   * Get sentiment distribution for analytics
   */
  async getSentimentStats(dateFrom?: Date, dateTo?: Date): Promise<Array<{ sentiment: string; count: number }>> {
    const conditions: string[] = ['sentiment IS NOT NULL'];
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
      SELECT sentiment, COUNT(*) as count
      FROM ${this.tableName}
      ${whereClause}
      GROUP BY sentiment
      ORDER BY count DESC
    `;
    const result = await this.database.query(query, params);
    return result.rows.map((row) => ({
      sentiment: row.sentiment as string,
      count: parseInt(row.count as string, 10),
    }));
  }
}
