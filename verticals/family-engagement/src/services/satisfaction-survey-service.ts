/**
 * Satisfaction Survey Service
 *
 * Service for managing family satisfaction surveys with features for:
 * - Survey template management
 * - Survey invitations and delivery
 * - Response collection and scoring
 * - Analytics and reporting
 *
 * Designed to be "non-annoying" - respects survey frequency limits.
 */

import { Pool } from 'pg';
import { randomBytes } from 'crypto';
import type { UUID } from '@folkcare/core';
import type {
  SurveyTemplate,
  SurveyQuestion,
  SurveyInvitation,
  SurveyResponse,
  SurveyResponseAnswer,
  SurveyAnalytics,
  SurveyType,
  SurveyStatus,
  SurveyTriggerType,
  SurveyInvitationStatus,
  SurveyResponseStatus,
  CreateSurveyTemplateInput,
  UpdateSurveyTemplateInput,
  CreateSurveyQuestionInput,
  SendSurveyInvitationInput,
  SubmitSurveyAnswerInput,
  SurveySummary
} from '../types/family-engagement.js';

// ============================================================================
// Service Class
// ============================================================================

export class SatisfactionSurveyService {
  constructor(private pool: Pool) {}

  // ============================================================================
  // Survey Template Management
  // ============================================================================

  /**
   * Create a new survey template
   */
  async createSurveyTemplate(
    input: CreateSurveyTemplateInput,
    organizationId: UUID,
    userId: UUID
  ): Promise<SurveyTemplate> {
    const query = `
      INSERT INTO survey_templates (
        name, description, survey_type, status,
        estimated_minutes, allow_anonymous, is_required, min_days_between_surveys,
        trigger_type, trigger_days_after_event, schedule_frequency,
        schedule_day_of_week, schedule_day_of_month,
        welcome_message, thank_you_message, logo_url,
        organization_id, created_by, updated_by
      ) VALUES (
        $1, $2, $3, 'DRAFT',
        $4, $5, $6, $7,
        $8, $9, $10, $11, $12,
        $13, $14, $15,
        $16, $17, $17
      )
      RETURNING *
    `;

    const result = await this.pool.query(query, [
      input.name,
      input.description || null,
      input.surveyType,
      input.estimatedMinutes ?? 5,
      input.allowAnonymous ?? false,
      input.isRequired ?? false,
      input.minDaysBetweenSurveys ?? 30,
      input.triggerType,
      input.triggerDaysAfterEvent || null,
      input.scheduleFrequency || null,
      input.scheduleDayOfWeek || null,
      input.scheduleDayOfMonth || null,
      input.welcomeMessage || null,
      input.thankYouMessage || null,
      input.logoUrl || null,
      organizationId,
      userId
    ]);

    return this.mapRowToSurveyTemplate(result.rows[0]);
  }

  /**
   * Update a survey template
   */
  async updateSurveyTemplate(
    templateId: UUID,
    input: UpdateSurveyTemplateInput,
    userId: UUID
  ): Promise<SurveyTemplate> {
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (input.name !== undefined) {
      setClauses.push(`name = $${paramIndex++}`);
      values.push(input.name);
    }
    if (input.description !== undefined) {
      setClauses.push(`description = $${paramIndex++}`);
      values.push(input.description);
    }
    if (input.status !== undefined) {
      setClauses.push(`status = $${paramIndex++}`);
      values.push(input.status);
    }
    if (input.estimatedMinutes !== undefined) {
      setClauses.push(`estimated_minutes = $${paramIndex++}`);
      values.push(input.estimatedMinutes);
    }
    if (input.allowAnonymous !== undefined) {
      setClauses.push(`allow_anonymous = $${paramIndex++}`);
      values.push(input.allowAnonymous);
    }
    if (input.isRequired !== undefined) {
      setClauses.push(`is_required = $${paramIndex++}`);
      values.push(input.isRequired);
    }
    if (input.minDaysBetweenSurveys !== undefined) {
      setClauses.push(`min_days_between_surveys = $${paramIndex++}`);
      values.push(input.minDaysBetweenSurveys);
    }
    if (input.triggerType !== undefined) {
      setClauses.push(`trigger_type = $${paramIndex++}`);
      values.push(input.triggerType);
    }
    if (input.triggerDaysAfterEvent !== undefined) {
      setClauses.push(`trigger_days_after_event = $${paramIndex++}`);
      values.push(input.triggerDaysAfterEvent);
    }
    if (input.scheduleFrequency !== undefined) {
      setClauses.push(`schedule_frequency = $${paramIndex++}`);
      values.push(input.scheduleFrequency);
    }
    if (input.scheduleDayOfWeek !== undefined) {
      setClauses.push(`schedule_day_of_week = $${paramIndex++}`);
      values.push(input.scheduleDayOfWeek);
    }
    if (input.scheduleDayOfMonth !== undefined) {
      setClauses.push(`schedule_day_of_month = $${paramIndex++}`);
      values.push(input.scheduleDayOfMonth);
    }
    if (input.welcomeMessage !== undefined) {
      setClauses.push(`welcome_message = $${paramIndex++}`);
      values.push(input.welcomeMessage);
    }
    if (input.thankYouMessage !== undefined) {
      setClauses.push(`thank_you_message = $${paramIndex++}`);
      values.push(input.thankYouMessage);
    }
    if (input.logoUrl !== undefined) {
      setClauses.push(`logo_url = $${paramIndex++}`);
      values.push(input.logoUrl);
    }

    setClauses.push(`updated_by = $${paramIndex++}`);
    values.push(userId);

    setClauses.push(`version = version + 1`);

    values.push(templateId);

    const query = `
      UPDATE survey_templates
      SET ${setClauses.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await this.pool.query(query, values);

    if (result.rows.length === 0) {
      throw new Error('Survey template not found');
    }

    return this.mapRowToSurveyTemplate(result.rows[0]);
  }

  /**
   * Get survey template by ID
   */
  async getSurveyTemplateById(templateId: UUID): Promise<SurveyTemplate | null> {
    const query = `SELECT * FROM survey_templates WHERE id = $1`;
    const result = await this.pool.query(query, [templateId]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToSurveyTemplate(result.rows[0]);
  }

  /**
   * Get all survey templates for an organization
   */
  async getSurveyTemplates(
    organizationId: UUID,
    status?: SurveyStatus
  ): Promise<SurveyTemplate[]> {
    let query = `
      SELECT * FROM survey_templates
      WHERE organization_id = $1
    `;
    const params: unknown[] = [organizationId];

    if (status) {
      query += ` AND status = $2`;
      params.push(status);
    }

    query += ` ORDER BY created_at DESC`;

    const result = await this.pool.query(query, params);
    return result.rows.map(row => this.mapRowToSurveyTemplate(row));
  }

  /**
   * Activate a survey template
   */
  async activateSurveyTemplate(templateId: UUID, userId: UUID): Promise<SurveyTemplate> {
    return this.updateSurveyTemplate(templateId, { status: 'ACTIVE' }, userId);
  }

  /**
   * Archive a survey template
   */
  async archiveSurveyTemplate(templateId: UUID, userId: UUID): Promise<SurveyTemplate> {
    return this.updateSurveyTemplate(templateId, { status: 'ARCHIVED' }, userId);
  }

  // ============================================================================
  // Survey Question Management
  // ============================================================================

  /**
   * Add a question to a survey template
   */
  async addSurveyQuestion(
    input: CreateSurveyQuestionInput,
    userId: UUID
  ): Promise<SurveyQuestion> {
    const query = `
      INSERT INTO survey_questions (
        survey_template_id, order_index, question_type, question_text, help_text,
        is_required, options, min_value, max_value, min_label, max_label,
        conditional_on_question_id, conditional_operator, conditional_value,
        category, created_by, updated_by
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10, $11,
        $12, $13, $14,
        $15, $16, $16
      )
      RETURNING *
    `;

    const result = await this.pool.query(query, [
      input.surveyTemplateId,
      input.orderIndex,
      input.questionType,
      input.questionText,
      input.helpText || null,
      input.isRequired ?? true,
      input.options ? JSON.stringify(input.options) : null,
      input.minValue || null,
      input.maxValue || null,
      input.minLabel || null,
      input.maxLabel || null,
      input.conditionalOnQuestionId || null,
      input.conditionalOperator || null,
      input.conditionalValue || null,
      input.category || null,
      userId
    ]);

    return this.mapRowToSurveyQuestion(result.rows[0]);
  }

  /**
   * Get questions for a survey template
   */
  async getSurveyQuestions(surveyTemplateId: UUID): Promise<SurveyQuestion[]> {
    const query = `
      SELECT * FROM survey_questions
      WHERE survey_template_id = $1
      ORDER BY order_index ASC
    `;

    const result = await this.pool.query(query, [surveyTemplateId]);
    return result.rows.map(row => this.mapRowToSurveyQuestion(row));
  }

  /**
   * Delete a survey question
   */
  async deleteSurveyQuestion(questionId: UUID): Promise<void> {
    await this.pool.query('DELETE FROM survey_questions WHERE id = $1', [questionId]);
  }

  /**
   * Reorder survey questions
   */
  async reorderSurveyQuestions(
    surveyTemplateId: UUID,
    questionIds: UUID[],
    userId: UUID
  ): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      for (let i = 0; i < questionIds.length; i++) {
        await client.query(
          `UPDATE survey_questions SET order_index = $1, updated_by = $2 WHERE id = $3 AND survey_template_id = $4`,
          [i + 1, userId, questionIds[i], surveyTemplateId]
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // ============================================================================
  // Survey Invitation Management
  // ============================================================================

  /**
   * Send a survey invitation to a family member
   */
  async sendSurveyInvitation(
    input: SendSurveyInvitationInput,
    organizationId: UUID,
    userId: UUID
  ): Promise<SurveyInvitation> {
    // Check if family member can receive survey (frequency limit)
    const canSend = await this.canSendSurveyToFamilyMember(
      input.surveyTemplateId,
      input.familyMemberId
    );

    if (!canSend) {
      throw new Error('Cannot send survey: frequency limit not met');
    }

    // Generate unique invitation code
    const invitationCode = this.generateInvitationCode();

    // Calculate expiration (default: 14 days)
    const expiresAt = input.expiresAt || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    // Get template trigger type
    const template = await this.getSurveyTemplateById(input.surveyTemplateId);
    if (!template) {
      throw new Error('Survey template not found');
    }

    const query = `
      INSERT INTO survey_invitations (
        survey_template_id, family_member_id, client_id,
        status, invitation_code,
        scheduled_send_at, expires_at,
        trigger_type, trigger_entity_id, trigger_entity_type,
        organization_id, created_by, updated_by
      ) VALUES (
        $1, $2, $3,
        'SENT', $4,
        COALESCE($5, NOW()), $6,
        $7, $8, $9,
        $10, $11, $11
      )
      RETURNING *
    `;

    const result = await this.pool.query(query, [
      input.surveyTemplateId,
      input.familyMemberId,
      input.clientId,
      invitationCode,
      input.scheduledSendAt || null,
      expiresAt,
      template.triggerType,
      input.triggerEntityId || null,
      input.triggerEntityType || null,
      organizationId,
      userId
    ]);

    const invitation = this.mapRowToSurveyInvitation(result.rows[0]);

    // Update sent_at timestamp
    await this.pool.query(
      `UPDATE survey_invitations SET sent_at = NOW(), status = 'SENT' WHERE id = $1`,
      [invitation.id]
    );

    return invitation;
  }

  /**
   * Check if a survey can be sent to a family member based on frequency limits
   */
  async canSendSurveyToFamilyMember(
    surveyTemplateId: UUID,
    familyMemberId: UUID
  ): Promise<boolean> {
    // Get template's min days between surveys
    const template = await this.getSurveyTemplateById(surveyTemplateId);
    if (!template) {
      return false;
    }

    // Check last completed survey for this template and family member
    const query = `
      SELECT MAX(si.completed_at) as last_completed
      FROM survey_invitations si
      WHERE si.survey_template_id = $1
        AND si.family_member_id = $2
        AND si.status = 'COMPLETED'
    `;

    const result = await this.pool.query(query, [surveyTemplateId, familyMemberId]);

    if (!result.rows[0].last_completed) {
      return true; // No previous surveys
    }

    const lastCompleted = new Date(result.rows[0].last_completed);
    const minDays = template.minDaysBetweenSurveys;
    const daysSinceLast = Math.floor(
      (Date.now() - lastCompleted.getTime()) / (1000 * 60 * 60 * 24)
    );

    return daysSinceLast >= minDays;
  }

  /**
   * Get survey invitation by code
   */
  async getSurveyInvitationByCode(invitationCode: string): Promise<SurveyInvitation | null> {
    const query = `SELECT * FROM survey_invitations WHERE invitation_code = $1`;
    const result = await this.pool.query(query, [invitationCode]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToSurveyInvitation(result.rows[0]);
  }

  /**
   * Get pending invitations for a family member
   */
  async getPendingInvitationsForFamilyMember(
    familyMemberId: UUID
  ): Promise<SurveyInvitation[]> {
    const query = `
      SELECT * FROM survey_invitations
      WHERE family_member_id = $1
        AND status IN ('SENT', 'OPENED', 'STARTED')
        AND expires_at > NOW()
      ORDER BY sent_at DESC
    `;

    const result = await this.pool.query(query, [familyMemberId]);
    return result.rows.map(row => this.mapRowToSurveyInvitation(row));
  }

  /**
   * Mark invitation as opened
   */
  async markInvitationOpened(invitationId: UUID): Promise<void> {
    await this.pool.query(
      `UPDATE survey_invitations SET status = 'OPENED', opened_at = NOW() WHERE id = $1`,
      [invitationId]
    );
  }

  /**
   * Decline survey invitation
   */
  async declineInvitation(invitationId: UUID, reason?: string): Promise<void> {
    await this.pool.query(
      `UPDATE survey_invitations SET status = 'DECLINED', declined_at = NOW(), decline_reason = $2 WHERE id = $1`,
      [invitationId, reason || null]
    );
  }

  // ============================================================================
  // Survey Response Management
  // ============================================================================

  /**
   * Start a survey response
   */
  async startSurveyResponse(
    invitationId: UUID,
    isAnonymous: boolean,
    deviceType?: 'DESKTOP' | 'MOBILE' | 'TABLET',
    browser?: string
  ): Promise<SurveyResponse> {
    const invitation = await this.pool.query(
      `SELECT * FROM survey_invitations WHERE id = $1`,
      [invitationId]
    );

    if (invitation.rows.length === 0) {
      throw new Error('Survey invitation not found');
    }

    const inv = invitation.rows[0];

    // Check if already started
    const existingResponse = await this.pool.query(
      `SELECT * FROM survey_responses WHERE survey_invitation_id = $1`,
      [invitationId]
    );

    if (existingResponse.rows.length > 0) {
      return this.mapRowToSurveyResponse(existingResponse.rows[0]);
    }

    const query = `
      INSERT INTO survey_responses (
        survey_invitation_id, survey_template_id, family_member_id, client_id,
        is_anonymous, status, completion_percentage,
        device_type, browser,
        organization_id, created_by, updated_by
      ) VALUES (
        $1, $2, $3, $4,
        $5, 'IN_PROGRESS', 0,
        $6, $7,
        $8, $3, $3
      )
      RETURNING *
    `;

    const result = await this.pool.query(query, [
      invitationId,
      inv.survey_template_id,
      isAnonymous ? null : inv.family_member_id,
      inv.client_id,
      isAnonymous,
      deviceType || null,
      browser || null,
      inv.organization_id
    ]);

    // Update invitation status
    await this.pool.query(
      `UPDATE survey_invitations SET status = 'STARTED', started_at = NOW() WHERE id = $1`,
      [invitationId]
    );

    return this.mapRowToSurveyResponse(result.rows[0]);
  }

  /**
   * Submit an answer to a survey question
   */
  async submitAnswer(
    input: SubmitSurveyAnswerInput,
    _userId?: UUID
  ): Promise<SurveyResponseAnswer> {
    const query = `
      INSERT INTO survey_response_answers (
        survey_response_id, survey_question_id,
        rating_value, text_value, selected_options,
        time_spent_seconds, was_skipped
      ) VALUES (
        $1, $2,
        $3, $4, $5,
        $6, $7
      )
      ON CONFLICT (survey_response_id, survey_question_id)
      DO UPDATE SET
        rating_value = EXCLUDED.rating_value,
        text_value = EXCLUDED.text_value,
        selected_options = EXCLUDED.selected_options,
        time_spent_seconds = EXCLUDED.time_spent_seconds,
        was_skipped = EXCLUDED.was_skipped,
        answered_at = NOW()
      RETURNING *
    `;

    const result = await this.pool.query(query, [
      input.surveyResponseId,
      input.surveyQuestionId,
      input.ratingValue || null,
      input.textValue || null,
      input.selectedOptions ? JSON.stringify(input.selectedOptions) : null,
      input.timeSpentSeconds || null,
      input.wasSkipped ?? false
    ]);

    // Update completion percentage
    await this.updateCompletionPercentage(input.surveyResponseId);

    return this.mapRowToSurveyResponseAnswer(result.rows[0]);
  }

  /**
   * Update completion percentage for a response
   */
  private async updateCompletionPercentage(responseId: UUID): Promise<void> {
    // Get total questions
    const response = await this.pool.query(
      `SELECT survey_template_id FROM survey_responses WHERE id = $1`,
      [responseId]
    );

    if (response.rows.length === 0) return;

    const templateId = response.rows[0].survey_template_id;

    const totalQuestions = await this.pool.query(
      `SELECT COUNT(*) as count FROM survey_questions WHERE survey_template_id = $1 AND is_required = true`,
      [templateId]
    );

    const answeredQuestions = await this.pool.query(
      `SELECT COUNT(*) as count FROM survey_response_answers WHERE survey_response_id = $1 AND was_skipped = false`,
      [responseId]
    );

    const total = parseInt(totalQuestions.rows[0].count);
    const answered = parseInt(answeredQuestions.rows[0].count);
    const percentage = total > 0 ? Math.round((answered / total) * 100) : 0;

    await this.pool.query(
      `UPDATE survey_responses SET completion_percentage = $1 WHERE id = $2`,
      [percentage, responseId]
    );
  }

  /**
   * Complete a survey response
   */
  async completeSurveyResponse(
    responseId: UUID,
    totalTimeSpentSeconds: number
  ): Promise<SurveyResponse> {
    // Calculate scores
    const scores = await this.calculateResponseScores(responseId);

    const query = `
      UPDATE survey_responses
      SET status = 'COMPLETED',
          completion_percentage = 100,
          completed_at = NOW(),
          time_spent_seconds = $1,
          overall_satisfaction_score = $2,
          nps_score = $3,
          category_scores = $4
      WHERE id = $5
      RETURNING *
    `;

    const result = await this.pool.query(query, [
      totalTimeSpentSeconds,
      scores.overallSatisfactionScore,
      scores.npsScore,
      JSON.stringify(scores.categoryScores),
      responseId
    ]);

    // Update invitation status
    const response = result.rows[0];
    await this.pool.query(
      `UPDATE survey_invitations SET status = 'COMPLETED', completed_at = NOW() WHERE id = $1`,
      [response.survey_invitation_id]
    );

    return this.mapRowToSurveyResponse(result.rows[0]);
  }

  /**
   * Calculate scores for a completed survey response
   */
  private async calculateResponseScores(responseId: UUID): Promise<{
    overallSatisfactionScore: number | null;
    npsScore: number | null;
    categoryScores: Record<string, number>;
  }> {
    // Get all answers with question details
    const query = `
      SELECT sra.*, sq.question_type, sq.category, sq.min_value, sq.max_value
      FROM survey_response_answers sra
      JOIN survey_questions sq ON sra.survey_question_id = sq.id
      WHERE sra.survey_response_id = $1
        AND sra.was_skipped = false
    `;

    const result = await this.pool.query(query, [responseId]);

    const categoryScores: Record<string, { sum: number; count: number }> = {};
    let npsScore: number | null = null;
    let totalRatingSum = 0;
    let totalRatingCount = 0;

    for (const row of result.rows) {
      if (row.question_type === 'NPS' && row.rating_value !== null) {
        npsScore = row.rating_value;
      } else if (
        ['RATING', 'SCALE'].includes(row.question_type) &&
        row.rating_value !== null
      ) {
        // Normalize to 0-10 scale
        const minVal = row.min_value || 1;
        const maxVal = row.max_value || 5;
        const normalized = ((row.rating_value - minVal) / (maxVal - minVal)) * 10;

        totalRatingSum += normalized;
        totalRatingCount++;

        if (row.category) {
          if (!categoryScores[row.category]) {
            categoryScores[row.category] = { sum: 0, count: 0 };
          }
          const categoryEntry = categoryScores[row.category]!;
          categoryEntry.sum += normalized;
          categoryEntry.count++;
        }
      } else if (row.question_type === 'YES_NO' && row.rating_value !== null) {
        // YES_NO: 1 = Yes (100%), 0 = No (0%)
        const score = row.rating_value === 1 ? 10 : 0;
        totalRatingSum += score;
        totalRatingCount++;

        if (row.category) {
          if (!categoryScores[row.category]) {
            categoryScores[row.category] = { sum: 0, count: 0 };
          }
          const categoryEntry = categoryScores[row.category]!;
          categoryEntry.sum += score;
          categoryEntry.count++;
        }
      }
    }

    const overallSatisfactionScore =
      totalRatingCount > 0 ? Math.round((totalRatingSum / totalRatingCount) * 10) / 10 : null;

    const finalCategoryScores: Record<string, number> = {};
    for (const [category, data] of Object.entries(categoryScores)) {
      finalCategoryScores[category] =
        Math.round((data.sum / data.count) * 10) / 10;
    }

    return {
      overallSatisfactionScore,
      npsScore,
      categoryScores: finalCategoryScores
    };
  }

  /**
   * Get survey response by ID
   */
  async getSurveyResponseById(responseId: UUID): Promise<SurveyResponse | null> {
    const query = `SELECT * FROM survey_responses WHERE id = $1`;
    const result = await this.pool.query(query, [responseId]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToSurveyResponse(result.rows[0]);
  }

  /**
   * Get answers for a survey response
   */
  async getSurveyResponseAnswers(responseId: UUID): Promise<SurveyResponseAnswer[]> {
    const query = `
      SELECT * FROM survey_response_answers
      WHERE survey_response_id = $1
      ORDER BY answered_at ASC
    `;

    const result = await this.pool.query(query, [responseId]);
    return result.rows.map(row => this.mapRowToSurveyResponseAnswer(row));
  }

  // ============================================================================
  // Analytics & Reporting
  // ============================================================================

  /**
   * Get survey summary for a template
   */
  async getSurveySummary(
    templateId: UUID,
    _organizationId: UUID
  ): Promise<SurveySummary | null> {
    const template = await this.getSurveyTemplateById(templateId);
    if (!template) {
      return null;
    }

    // Get response stats
    const statsQuery = `
      SELECT
        COUNT(*) as total_responses,
        COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed_responses,
        AVG(time_spent_seconds) FILTER (WHERE status = 'COMPLETED') as avg_completion_time,
        AVG(overall_satisfaction_score) FILTER (WHERE status = 'COMPLETED') as avg_satisfaction,
        AVG(nps_score) FILTER (WHERE status = 'COMPLETED' AND nps_score IS NOT NULL) as avg_nps
      FROM survey_responses
      WHERE survey_template_id = $1
    `;

    const statsResult = await this.pool.query(statsQuery, [templateId]);
    const stats = statsResult.rows[0];

    // Get invitation count for response rate
    const invitationCount = await this.pool.query(
      `SELECT COUNT(*) as count FROM survey_invitations WHERE survey_template_id = $1 AND status NOT IN ('PENDING', 'EXPIRED')`,
      [templateId]
    );

    const totalInvitations = parseInt(invitationCount.rows[0].count) || 1;
    const completedResponses = parseInt(stats.completed_responses) || 0;
    const responseRate = Math.round((completedResponses / totalInvitations) * 100);

    // Calculate trend (compare last 30 days to previous 30 days)
    const trendQuery = `
      SELECT
        AVG(overall_satisfaction_score) FILTER (WHERE completed_at > NOW() - INTERVAL '30 days') as recent_avg,
        AVG(overall_satisfaction_score) FILTER (WHERE completed_at BETWEEN NOW() - INTERVAL '60 days' AND NOW() - INTERVAL '30 days') as previous_avg
      FROM survey_responses
      WHERE survey_template_id = $1 AND status = 'COMPLETED'
    `;

    const trendResult = await this.pool.query(trendQuery, [templateId]);
    const trend = trendResult.rows[0];

    let recentTrend: 'UP' | 'DOWN' | 'STABLE' = 'STABLE';
    if (trend.recent_avg && trend.previous_avg) {
      const diff = parseFloat(trend.recent_avg) - parseFloat(trend.previous_avg);
      if (diff > 0.5) recentTrend = 'UP';
      else if (diff < -0.5) recentTrend = 'DOWN';
    }

    return {
      templateId,
      templateName: template.name,
      surveyType: template.surveyType,
      totalResponses: parseInt(stats.total_responses) || 0,
      completedResponses,
      avgCompletionTime: Math.round(parseFloat(stats.avg_completion_time) || 0),
      avgSatisfactionScore: stats.avg_satisfaction
        ? Math.round(parseFloat(stats.avg_satisfaction) * 10) / 10
        : undefined,
      npsScore: stats.avg_nps
        ? Math.round(parseFloat(stats.avg_nps))
        : undefined,
      responseRate,
      recentTrend
    };
  }

  /**
   * Get recent survey responses for a client
   */
  async getRecentResponsesForClient(
    clientId: UUID,
    limit: number = 10
  ): Promise<SurveyResponse[]> {
    const query = `
      SELECT * FROM survey_responses
      WHERE client_id = $1 AND status = 'COMPLETED'
      ORDER BY completed_at DESC
      LIMIT $2
    `;

    const result = await this.pool.query(query, [clientId, limit]);
    return result.rows.map(row => this.mapRowToSurveyResponse(row));
  }

  /**
   * Get aggregated analytics for a template
   */
  async getSurveyAnalytics(
    templateId: UUID,
    periodType: 'DAILY' | 'WEEKLY' | 'MONTHLY',
    startDate: Date,
    endDate: Date
  ): Promise<SurveyAnalytics[]> {
    const query = `
      SELECT * FROM survey_analytics
      WHERE survey_template_id = $1
        AND period_type = $2
        AND period_date BETWEEN $3 AND $4
      ORDER BY period_date DESC
    `;

    const result = await this.pool.query(query, [
      templateId,
      periodType,
      startDate,
      endDate
    ]);

    return result.rows.map(row => this.mapRowToSurveyAnalytics(row));
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private generateInvitationCode(): string {
    return randomBytes(16).toString('hex');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapRowToSurveyTemplate(row: any): SurveyTemplate {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      surveyType: row.survey_type as SurveyType,
      status: row.status as SurveyStatus,
      estimatedMinutes: row.estimated_minutes,
      allowAnonymous: row.allow_anonymous,
      isRequired: row.is_required,
      minDaysBetweenSurveys: row.min_days_between_surveys,
      triggerType: row.trigger_type as SurveyTriggerType,
      triggerDaysAfterEvent: row.trigger_days_after_event,
      scheduleFrequency: row.schedule_frequency,
      scheduleDayOfWeek: row.schedule_day_of_week,
      scheduleDayOfMonth: row.schedule_day_of_month,
      welcomeMessage: row.welcome_message,
      thankYouMessage: row.thank_you_message,
      logoUrl: row.logo_url,
      organizationId: row.organization_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdBy: row.created_by,
      updatedBy: row.updated_by,
      version: row.version
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapRowToSurveyQuestion(row: any): SurveyQuestion {
    return {
      id: row.id,
      surveyTemplateId: row.survey_template_id,
      orderIndex: row.order_index,
      questionType: row.question_type,
      questionText: row.question_text,
      helpText: row.help_text,
      isRequired: row.is_required,
      options: row.options,
      minValue: row.min_value,
      maxValue: row.max_value,
      minLabel: row.min_label,
      maxLabel: row.max_label,
      conditionalOnQuestionId: row.conditional_on_question_id,
      conditionalOperator: row.conditional_operator,
      conditionalValue: row.conditional_value,
      category: row.category,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdBy: row.created_by,
      updatedBy: row.updated_by,
      version: row.version
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapRowToSurveyInvitation(row: any): SurveyInvitation {
    return {
      id: row.id,
      surveyTemplateId: row.survey_template_id,
      familyMemberId: row.family_member_id,
      clientId: row.client_id,
      status: row.status as SurveyInvitationStatus,
      invitationCode: row.invitation_code,
      scheduledSendAt: row.scheduled_send_at,
      sentAt: row.sent_at,
      expiresAt: row.expires_at,
      triggerType: row.trigger_type as SurveyTriggerType,
      triggerEntityId: row.trigger_entity_id,
      triggerEntityType: row.trigger_entity_type,
      openedAt: row.opened_at,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      declinedAt: row.declined_at,
      declineReason: row.decline_reason,
      reminderCount: row.reminder_count,
      lastReminderAt: row.last_reminder_at,
      organizationId: row.organization_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdBy: row.created_by,
      updatedBy: row.updated_by,
      version: row.version
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapRowToSurveyResponse(row: any): SurveyResponse {
    return {
      id: row.id,
      surveyInvitationId: row.survey_invitation_id,
      surveyTemplateId: row.survey_template_id,
      familyMemberId: row.family_member_id,
      clientId: row.client_id,
      isAnonymous: row.is_anonymous,
      status: row.status as SurveyResponseStatus,
      completionPercentage: row.completion_percentage,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      timeSpentSeconds: row.time_spent_seconds,
      overallSatisfactionScore: row.overall_satisfaction_score
        ? parseFloat(row.overall_satisfaction_score)
        : undefined,
      npsScore: row.nps_score,
      categoryScores: row.category_scores,
      deviceType: row.device_type,
      browser: row.browser,
      organizationId: row.organization_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdBy: row.created_by,
      updatedBy: row.updated_by,
      version: row.version
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapRowToSurveyResponseAnswer(row: any): SurveyResponseAnswer {
    return {
      id: row.id,
      surveyResponseId: row.survey_response_id,
      surveyQuestionId: row.survey_question_id,
      ratingValue: row.rating_value,
      textValue: row.text_value,
      selectedOptions: row.selected_options,
      timeSpentSeconds: row.time_spent_seconds,
      answeredAt: row.answered_at,
      wasSkipped: row.was_skipped,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapRowToSurveyAnalytics(row: any): SurveyAnalytics {
    return {
      id: row.id,
      surveyTemplateId: row.survey_template_id,
      periodDate: row.period_date,
      periodType: row.period_type,
      invitationsSent: row.invitations_sent,
      invitationsOpened: row.invitations_opened,
      responsesStarted: row.responses_started,
      responsesCompleted: row.responses_completed,
      responsesAbandoned: row.responses_abandoned,
      completionRate: row.completion_rate
        ? parseFloat(row.completion_rate)
        : undefined,
      avgSatisfactionScore: row.avg_satisfaction_score
        ? parseFloat(row.avg_satisfaction_score)
        : undefined,
      avgNpsScore: row.avg_nps_score,
      avgCategoryScores: row.avg_category_scores,
      avgTimeSpentSeconds: row.avg_time_spent_seconds,
      organizationId: row.organization_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}
