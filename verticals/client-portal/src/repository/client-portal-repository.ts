/**
 * Client Portal Repository - Data Access Layer
 *
 * Handles database operations for all client portal tables:
 * - Portal access
 * - Visit ratings
 * - Schedule change requests
 * - Video call sessions
 * - Care plan access logs
 * - Portal sessions
 * - Portal preferences
 */

import { Repository, Database, PaginatedResult, PaginationParams } from '@care-commons/core';
import type {
  ClientPortalAccess,
  ClientVisitRating,
  ScheduleChangeRequest,
  VideoCallSession,
  CarePlanAccessLog,
  ClientPortalSession,
  PortalAccessStatus,
  ScheduleChangeRequestStatus,
  VideoCallStatus,
  PortalSessionStatus,
  VisitRatingFilters,
  ScheduleChangeRequestFilters,
  VideoCallSessionFilters,
  AccessibilityPreferences,
  PortalNotificationPreferences,
} from '../types/index';

// ============================================================================
// Client Portal Access Repository
// ============================================================================

export class ClientPortalAccessRepository extends Repository<ClientPortalAccess> {
  constructor(database: Database) {
    super({
      tableName: 'client_portal_access',
      database,
      enableAudit: true,
      enableSoftDelete: true,
    });
  }

  protected mapRowToEntity(row: Record<string, unknown>): ClientPortalAccess {
    return {
      id: row['id'] as string,
      clientId: row['client_id'] as string,
      organizationId: row['organization_id'] as string,
      branchId: row['branch_id'] as string,
      status: row['status'] as PortalAccessStatus,
      portalEnabled: row['portal_enabled'] as boolean,
      lastLoginAt: row['last_login_at'] as Date | null,
      lastLoginIp: row['last_login_ip'] as string | null,
      loginCount: row['login_count'] as number,
      invitationCode: row['invitation_code'] as string | null,
      invitationSentAt: row['invitation_sent_at'] as Date | null,
      invitationExpiresAt: row['invitation_expires_at'] as Date | null,
      activatedAt: row['activated_at'] as Date | null,
      accessibilityPreferences: this.parseJsonField<AccessibilityPreferences>(
        row['accessibility_preferences'],
        {} as AccessibilityPreferences
      ),
      notificationPreferences: this.parseJsonField<PortalNotificationPreferences>(
        row['notification_preferences'],
        {} as PortalNotificationPreferences
      ),
      passwordResetRequired: row['password_reset_required'] as boolean,
      passwordChangedAt: row['password_changed_at'] as Date | null,
      failedLoginAttempts: row['failed_login_attempts'] as number,
      lockedUntil: row['locked_until'] as Date | null,
      createdAt: row['created_at'] as Date,
      createdBy: row['created_by'] as string,
      updatedAt: row['updated_at'] as Date,
      updatedBy: row['updated_by'] as string,
      deletedAt: row['deleted_at'] as Date | null,
      deletedBy: row['deleted_by'] as string | null,
      version: row['version'] as number,
    };
  }

  protected override mapEntityToRow(entity: Partial<ClientPortalAccess>): Record<string, unknown> {
    const row: Record<string, unknown> = {};

    if (entity.clientId) row['client_id'] = entity.clientId;
    if (entity.organizationId) row['organization_id'] = entity.organizationId;
    if (entity.branchId) row['branch_id'] = entity.branchId;
    if (entity.status) row['status'] = entity.status;
    if (entity.portalEnabled !== undefined) row['portal_enabled'] = entity.portalEnabled;
    if (entity.lastLoginAt !== undefined) row['last_login_at'] = entity.lastLoginAt;
    if (entity.lastLoginIp !== undefined) row['last_login_ip'] = entity.lastLoginIp;
    if (entity.loginCount !== undefined) row['login_count'] = entity.loginCount;
    if (entity.invitationCode !== undefined) row['invitation_code'] = entity.invitationCode;
    if (entity.invitationSentAt !== undefined) row['invitation_sent_at'] = entity.invitationSentAt;
    if (entity.invitationExpiresAt !== undefined) row['invitation_expires_at'] = entity.invitationExpiresAt;
    if (entity.activatedAt !== undefined) row['activated_at'] = entity.activatedAt;
    if (entity.accessibilityPreferences) row['accessibility_preferences'] = JSON.stringify(entity.accessibilityPreferences);
    if (entity.notificationPreferences) row['notification_preferences'] = JSON.stringify(entity.notificationPreferences);
    if (entity.passwordResetRequired !== undefined) row['password_reset_required'] = entity.passwordResetRequired;
    if (entity.passwordChangedAt !== undefined) row['password_changed_at'] = entity.passwordChangedAt;
    if (entity.failedLoginAttempts !== undefined) row['failed_login_attempts'] = entity.failedLoginAttempts;
    if (entity.lockedUntil !== undefined) row['locked_until'] = entity.lockedUntil;

    return row;
  }

  private parseJsonField<T>(value: unknown, defaultValue: T): T {
    if (value === null || value === undefined) {
      return defaultValue;
    }
    if (typeof value === 'object') {
      return value as T;
    }
    if (typeof value === 'string') {
      try {
        return JSON.parse(value) as T;
      } catch {
        return defaultValue;
      }
    }
    return defaultValue;
  }

  async findByClientId(clientId: string): Promise<ClientPortalAccess | null> {
    const rows = await this.db(this.tableName)
      .where({ client_id: clientId, deleted_at: null })
      .select('*');

    return rows.length > 0 ? this.mapRowToEntity(rows[0]) : null;
  }

  async findByInvitationCode(invitationCode: string): Promise<ClientPortalAccess | null> {
    const rows = await this.db(this.tableName)
      .where({ invitation_code: invitationCode, deleted_at: null })
      .select('*');

    return rows.length > 0 ? this.mapRowToEntity(rows[0]) : null;
  }

  async incrementLoginCount(id: string, ipAddress: string): Promise<void> {
    await this.db(this.tableName)
      .where({ id })
      .increment('login_count', 1)
      .update({
        last_login_at: this.db.fn.now(),
        last_login_ip: ipAddress,
        failed_login_attempts: 0,
        updated_at: this.db.fn.now(),
      });
  }

  async incrementFailedLoginAttempts(id: string): Promise<void> {
    await this.db(this.tableName)
      .where({ id })
      .increment('failed_login_attempts', 1)
      .update({
        updated_at: this.db.fn.now(),
      });
  }

  async lockAccount(id: string, lockUntil: Date): Promise<void> {
    await this.db(this.tableName)
      .where({ id })
      .update({
        locked_until: lockUntil,
        updated_at: this.db.fn.now(),
      });
  }
}

// ============================================================================
// Visit Rating Repository
// ============================================================================

export class VisitRatingRepository extends Repository<ClientVisitRating> {
  constructor(database: Database) {
    super({
      tableName: 'client_visit_ratings',
      database,
      enableAudit: true,
      enableSoftDelete: true,
    });
  }

  protected mapRowToEntity(row: Record<string, unknown>): ClientVisitRating {
    return {
      id: row['id'] as string,
      clientId: row['client_id'] as string,
      visitId: row['visit_id'] as string,
      caregiverId: row['caregiver_id'] as string,
      organizationId: row['organization_id'] as string,
      overallRating: row['overall_rating'] as number,
      professionalismRating: row['professionalism_rating'] as number | null,
      punctualityRating: row['punctuality_rating'] as number | null,
      qualityOfCareRating: row['quality_of_care_rating'] as number | null,
      communicationRating: row['communication_rating'] as number | null,
      positiveFeedback: row['positive_feedback'] as string | null,
      improvementFeedback: row['improvement_feedback'] as string | null,
      additionalComments: row['additional_comments'] as string | null,
      wouldRequestAgain: row['would_request_again'] as boolean | null,
      flaggedForReview: row['flagged_for_review'] as boolean,
      flagReason: row['flag_reason'] as string | null,
      ratedAt: row['rated_at'] as Date,
      isAnonymous: row['is_anonymous'] as boolean,
      visibleToCaregiver: row['visible_to_caregiver'] as boolean,
      coordinatorResponse: row['coordinator_response'] as string | null,
      coordinatorRespondedAt: row['coordinator_responded_at'] as Date | null,
      coordinatorId: row['coordinator_id'] as string | null,
      createdAt: row['created_at'] as Date,
      createdBy: row['created_by'] as string,
      updatedAt: row['updated_at'] as Date,
      updatedBy: row['updated_by'] as string,
      deletedAt: row['deleted_at'] as Date | null,
      deletedBy: row['deleted_by'] as string | null,
    };
  }

  protected override mapEntityToRow(entity: Partial<ClientVisitRating>): Record<string, unknown> {
    const row: Record<string, unknown> = {};

    if (entity.clientId) row['client_id'] = entity.clientId;
    if (entity.visitId) row['visit_id'] = entity.visitId;
    if (entity.caregiverId) row['caregiver_id'] = entity.caregiverId;
    if (entity.organizationId) row['organization_id'] = entity.organizationId;
    if (entity.overallRating !== undefined) row['overall_rating'] = entity.overallRating;
    if (entity.professionalismRating !== undefined) row['professionalism_rating'] = entity.professionalismRating;
    if (entity.punctualityRating !== undefined) row['punctuality_rating'] = entity.punctualityRating;
    if (entity.qualityOfCareRating !== undefined) row['quality_of_care_rating'] = entity.qualityOfCareRating;
    if (entity.communicationRating !== undefined) row['communication_rating'] = entity.communicationRating;
    if (entity.positiveFeedback !== undefined) row['positive_feedback'] = entity.positiveFeedback;
    if (entity.improvementFeedback !== undefined) row['improvement_feedback'] = entity.improvementFeedback;
    if (entity.additionalComments !== undefined) row['additional_comments'] = entity.additionalComments;
    if (entity.wouldRequestAgain !== undefined) row['would_request_again'] = entity.wouldRequestAgain;
    if (entity.flaggedForReview !== undefined) row['flagged_for_review'] = entity.flaggedForReview;
    if (entity.flagReason !== undefined) row['flag_reason'] = entity.flagReason;
    if (entity.ratedAt) row['rated_at'] = entity.ratedAt;
    if (entity.isAnonymous !== undefined) row['is_anonymous'] = entity.isAnonymous;
    if (entity.visibleToCaregiver !== undefined) row['visible_to_caregiver'] = entity.visibleToCaregiver;
    if (entity.coordinatorResponse !== undefined) row['coordinator_response'] = entity.coordinatorResponse;
    if (entity.coordinatorRespondedAt !== undefined) row['coordinator_responded_at'] = entity.coordinatorRespondedAt;
    if (entity.coordinatorId !== undefined) row['coordinator_id'] = entity.coordinatorId;

    return row;
  }

  async findByVisitId(visitId: string): Promise<ClientVisitRating | null> {
    const rows = await this.db(this.tableName)
      .where({ visit_id: visitId, deleted_at: null })
      .select('*');

    return rows.length > 0 ? this.mapRowToEntity(rows[0]) : null;
  }

  async findByClientId(clientId: string, pagination: PaginationParams): Promise<PaginatedResult<ClientVisitRating>> {
    const { page, limit, sortBy = 'rated_at', sortOrder = 'desc' } = pagination;
    const offset = (page - 1) * limit;

    const query = this.db(this.tableName)
      .where({ client_id: clientId, deleted_at: null });

    const [items, countResult] = await Promise.all([
      query.clone()
        .orderBy(sortBy, sortOrder)
        .limit(limit)
        .offset(offset)
        .select('*'),
      query.clone().count('* as count').first(),
    ]);

    const total = Number(countResult?.['count'] || 0);

    return {
      items: items.map((row) => this.mapRowToEntity(row)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async searchRatings(
    filters: VisitRatingFilters,
    pagination: PaginationParams
  ): Promise<PaginatedResult<ClientVisitRating>> {
    const { page, limit, sortBy = 'rated_at', sortOrder = 'desc' } = pagination;
    const offset = (page - 1) * limit;

    let query = this.db(this.tableName).where({ deleted_at: null });

    if (filters.clientId) {
      query = query.where('client_id', filters.clientId);
    }
    if (filters.caregiverId) {
      query = query.where('caregiver_id', filters.caregiverId);
    }
    if (filters.minRating !== undefined) {
      query = query.where('overall_rating', '>=', filters.minRating);
    }
    if (filters.maxRating !== undefined) {
      query = query.where('overall_rating', '<=', filters.maxRating);
    }
    if (filters.flaggedOnly) {
      query = query.where('flagged_for_review', true);
    }
    if (filters.startDate) {
      query = query.where('rated_at', '>=', filters.startDate);
    }
    if (filters.endDate) {
      query = query.where('rated_at', '<=', filters.endDate);
    }

    const [items, countResult] = await Promise.all([
      query.clone()
        .orderBy(sortBy, sortOrder)
        .limit(limit)
        .offset(offset)
        .select('*'),
      query.clone().count('* as count').first(),
    ]);

    const total = Number(countResult?.['count'] || 0);

    return {
      items: items.map((row) => this.mapRowToEntity(row)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getCaregiverAverageRating(caregiverId: string): Promise<number | null> {
    const result = await this.db(this.tableName)
      .where({ caregiver_id: caregiverId, deleted_at: null })
      .avg('overall_rating as avg_rating')
      .first();

    return result?.['avg_rating'] ? Number(result['avg_rating']) : null;
  }
}

// ============================================================================
// Schedule Change Request Repository
// ============================================================================

export class ScheduleChangeRequestRepository extends Repository<ScheduleChangeRequest> {
  constructor(database: Database) {
    super({
      tableName: 'client_schedule_change_requests',
      database,
      enableAudit: true,
      enableSoftDelete: true,
    });
  }

  protected mapRowToEntity(row: Record<string, unknown>): ScheduleChangeRequest {
    return {
      id: row['id'] as string,
      clientId: row['client_id'] as string,
      visitId: row['visit_id'] as string | null,
      organizationId: row['organization_id'] as string,
      branchId: row['branch_id'] as string,
      requestType: row['request_type'] as ScheduleChangeRequest['requestType'],
      priority: row['priority'] as number,
      currentStartTime: row['current_start_time'] as Date | null,
      currentEndTime: row['current_end_time'] as Date | null,
      requestedStartTime: row['requested_start_time'] as Date | null,
      requestedEndTime: row['requested_end_time'] as Date | null,
      requestedReason: row['requested_reason'] as string,
      status: row['status'] as ScheduleChangeRequestStatus,
      reviewedBy: row['reviewed_by'] as string | null,
      reviewedAt: row['reviewed_at'] as Date | null,
      reviewNotes: row['review_notes'] as string | null,
      denialReason: row['denial_reason'] as string | null,
      newVisitId: row['new_visit_id'] as string | null,
      changeApplied: row['change_applied'] as boolean,
      appliedAt: row['applied_at'] as Date | null,
      clientNotified: row['client_notified'] as boolean,
      clientNotifiedAt: row['client_notified_at'] as Date | null,
      createdAt: row['created_at'] as Date,
      createdBy: row['created_by'] as string,
      updatedAt: row['updated_at'] as Date,
      updatedBy: row['updated_by'] as string,
      deletedAt: row['deleted_at'] as Date | null,
      deletedBy: row['deleted_by'] as string | null,
    };
  }

  protected override mapEntityToRow(entity: Partial<ScheduleChangeRequest>): Record<string, unknown> {
    const row: Record<string, unknown> = {};

    if (entity.clientId) row['client_id'] = entity.clientId;
    if (entity.visitId !== undefined) row['visit_id'] = entity.visitId;
    if (entity.organizationId) row['organization_id'] = entity.organizationId;
    if (entity.branchId) row['branch_id'] = entity.branchId;
    if (entity.requestType) row['request_type'] = entity.requestType;
    if (entity.priority !== undefined) row['priority'] = entity.priority;
    if (entity.currentStartTime !== undefined) row['current_start_time'] = entity.currentStartTime;
    if (entity.currentEndTime !== undefined) row['current_end_time'] = entity.currentEndTime;
    if (entity.requestedStartTime !== undefined) row['requested_start_time'] = entity.requestedStartTime;
    if (entity.requestedEndTime !== undefined) row['requested_end_time'] = entity.requestedEndTime;
    if (entity.requestedReason) row['requested_reason'] = entity.requestedReason;
    if (entity.status) row['status'] = entity.status;
    if (entity.reviewedBy !== undefined) row['reviewed_by'] = entity.reviewedBy;
    if (entity.reviewedAt !== undefined) row['reviewed_at'] = entity.reviewedAt;
    if (entity.reviewNotes !== undefined) row['review_notes'] = entity.reviewNotes;
    if (entity.denialReason !== undefined) row['denial_reason'] = entity.denialReason;
    if (entity.newVisitId !== undefined) row['new_visit_id'] = entity.newVisitId;
    if (entity.changeApplied !== undefined) row['change_applied'] = entity.changeApplied;
    if (entity.appliedAt !== undefined) row['applied_at'] = entity.appliedAt;
    if (entity.clientNotified !== undefined) row['client_notified'] = entity.clientNotified;
    if (entity.clientNotifiedAt !== undefined) row['client_notified_at'] = entity.clientNotifiedAt;

    return row;
  }

  async findPendingByClientId(clientId: string): Promise<ScheduleChangeRequest[]> {
    const rows = await this.db(this.tableName)
      .where({ client_id: clientId, status: 'PENDING', deleted_at: null })
      .orderBy('created_at', 'desc')
      .select('*');

    return rows.map((row) => this.mapRowToEntity(row));
  }

  async searchRequests(
    filters: ScheduleChangeRequestFilters,
    pagination: PaginationParams
  ): Promise<PaginatedResult<ScheduleChangeRequest>> {
    const { page, limit, sortBy = 'created_at', sortOrder = 'desc' } = pagination;
    const offset = (page - 1) * limit;

    let query = this.db(this.tableName).where({ deleted_at: null });

    if (filters.clientId) {
      query = query.where('client_id', filters.clientId);
    }
    if (filters.status && filters.status.length > 0) {
      query = query.whereIn('status', filters.status);
    }
    if (filters.requestType && filters.requestType.length > 0) {
      query = query.whereIn('request_type', filters.requestType);
    }
    if (filters.startDate) {
      query = query.where('created_at', '>=', filters.startDate);
    }
    if (filters.endDate) {
      query = query.where('created_at', '<=', filters.endDate);
    }

    const [items, countResult] = await Promise.all([
      query.clone()
        .orderBy(sortBy, sortOrder)
        .limit(limit)
        .offset(offset)
        .select('*'),
      query.clone().count('* as count').first(),
    ]);

    const total = Number(countResult?.['count'] || 0);

    return {
      items: items.map((row) => this.mapRowToEntity(row)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}

// ============================================================================
// Video Call Session Repository
// ============================================================================

export class VideoCallSessionRepository extends Repository<VideoCallSession> {
  constructor(database: Database) {
    super({
      tableName: 'client_video_call_sessions',
      database,
      enableAudit: true,
      enableSoftDelete: true,
    });
  }

  protected mapRowToEntity(row: Record<string, unknown>): VideoCallSession {
    return {
      id: row['id'] as string,
      clientId: row['client_id'] as string,
      coordinatorId: row['coordinator_id'] as string,
      organizationId: row['organization_id'] as string,
      branchId: row['branch_id'] as string,
      callType: row['call_type'] as VideoCallSession['callType'],
      status: row['status'] as VideoCallStatus,
      scheduledStart: row['scheduled_start'] as Date | null,
      scheduledEnd: row['scheduled_end'] as Date | null,
      actualStart: row['actual_start'] as Date | null,
      actualEnd: row['actual_end'] as Date | null,
      durationMinutes: row['duration_minutes'] as number | null,
      platform: row['platform'] as VideoCallSession['platform'],
      externalSessionId: row['external_session_id'] as string | null,
      clientJoinUrl: row['client_join_url'] as string | null,
      coordinatorJoinUrl: row['coordinator_join_url'] as string | null,
      platformMetadata: this.parseJsonField(row['platform_metadata'], null),
      callPurpose: row['call_purpose'] as string | null,
      coordinatorNotes: row['coordinator_notes'] as string | null,
      clientNotes: row['client_notes'] as string | null,
      clientRating: row['client_rating'] as number | null,
      clientFeedback: row['client_feedback'] as string | null,
      qualityMetrics: this.parseJsonField(row['quality_metrics'], null),
      captionsEnabled: row['captions_enabled'] as boolean,
      signLanguageInterpreter: row['sign_language_interpreter'] as boolean,
      languagePreference: row['language_preference'] as string | null,
      createdAt: row['created_at'] as Date,
      createdBy: row['created_by'] as string,
      updatedAt: row['updated_at'] as Date,
      updatedBy: row['updated_by'] as string,
      deletedAt: row['deleted_at'] as Date | null,
      deletedBy: row['deleted_by'] as string | null,
    };
  }

  protected override mapEntityToRow(entity: Partial<VideoCallSession>): Record<string, unknown> {
    const row: Record<string, unknown> = {};

    if (entity.clientId) row['client_id'] = entity.clientId;
    if (entity.coordinatorId) row['coordinator_id'] = entity.coordinatorId;
    if (entity.organizationId) row['organization_id'] = entity.organizationId;
    if (entity.branchId) row['branch_id'] = entity.branchId;
    if (entity.callType) row['call_type'] = entity.callType;
    if (entity.status) row['status'] = entity.status;
    if (entity.scheduledStart !== undefined) row['scheduled_start'] = entity.scheduledStart;
    if (entity.scheduledEnd !== undefined) row['scheduled_end'] = entity.scheduledEnd;
    if (entity.actualStart !== undefined) row['actual_start'] = entity.actualStart;
    if (entity.actualEnd !== undefined) row['actual_end'] = entity.actualEnd;
    if (entity.durationMinutes !== undefined) row['duration_minutes'] = entity.durationMinutes;
    if (entity.platform !== undefined) row['platform'] = entity.platform;
    if (entity.externalSessionId !== undefined) row['external_session_id'] = entity.externalSessionId;
    if (entity.clientJoinUrl !== undefined) row['client_join_url'] = entity.clientJoinUrl;
    if (entity.coordinatorJoinUrl !== undefined) row['coordinator_join_url'] = entity.coordinatorJoinUrl;
    if (entity.platformMetadata !== undefined) row['platform_metadata'] = entity.platformMetadata ? JSON.stringify(entity.platformMetadata) : null;
    if (entity.callPurpose !== undefined) row['call_purpose'] = entity.callPurpose;
    if (entity.coordinatorNotes !== undefined) row['coordinator_notes'] = entity.coordinatorNotes;
    if (entity.clientNotes !== undefined) row['client_notes'] = entity.clientNotes;
    if (entity.clientRating !== undefined) row['client_rating'] = entity.clientRating;
    if (entity.clientFeedback !== undefined) row['client_feedback'] = entity.clientFeedback;
    if (entity.qualityMetrics !== undefined) row['quality_metrics'] = entity.qualityMetrics ? JSON.stringify(entity.qualityMetrics) : null;
    if (entity.captionsEnabled !== undefined) row['captions_enabled'] = entity.captionsEnabled;
    if (entity.signLanguageInterpreter !== undefined) row['sign_language_interpreter'] = entity.signLanguageInterpreter;
    if (entity.languagePreference !== undefined) row['language_preference'] = entity.languagePreference;

    return row;
  }

  private parseJsonField<T>(value: unknown, defaultValue: T): T {
    if (value === null || value === undefined) {
      return defaultValue;
    }
    if (typeof value === 'object') {
      return value as T;
    }
    if (typeof value === 'string') {
      try {
        return JSON.parse(value) as T;
      } catch {
        return defaultValue;
      }
    }
    return defaultValue;
  }

  async findUpcomingByClientId(clientId: string): Promise<VideoCallSession[]> {
    const now = new Date();
    const rows = await this.db(this.tableName)
      .where({ client_id: clientId, deleted_at: null })
      .whereIn('status', ['SCHEDULED', 'ACTIVE'])
      .where('scheduled_start', '>=', now)
      .orderBy('scheduled_start', 'asc')
      .select('*');

    return rows.map((row) => this.mapRowToEntity(row));
  }

  async searchSessions(
    filters: VideoCallSessionFilters,
    pagination: PaginationParams
  ): Promise<PaginatedResult<VideoCallSession>> {
    const { page, limit, sortBy = 'scheduled_start', sortOrder = 'desc' } = pagination;
    const offset = (page - 1) * limit;

    let query = this.db(this.tableName).where({ deleted_at: null });

    if (filters.clientId) {
      query = query.where('client_id', filters.clientId);
    }
    if (filters.coordinatorId) {
      query = query.where('coordinator_id', filters.coordinatorId);
    }
    if (filters.status && filters.status.length > 0) {
      query = query.whereIn('status', filters.status);
    }
    if (filters.callType && filters.callType.length > 0) {
      query = query.whereIn('call_type', filters.callType);
    }
    if (filters.startDate) {
      query = query.where('scheduled_start', '>=', filters.startDate);
    }
    if (filters.endDate) {
      query = query.where('scheduled_start', '<=', filters.endDate);
    }

    const [items, countResult] = await Promise.all([
      query.clone()
        .orderBy(sortBy, sortOrder)
        .limit(limit)
        .offset(offset)
        .select('*'),
      query.clone().count('* as count').first(),
    ]);

    const total = Number(countResult?.['count'] || 0);

    return {
      items: items.map((row) => this.mapRowToEntity(row)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}

// ============================================================================
// Care Plan Access Log Repository
// ============================================================================

export class CarePlanAccessLogRepository {
  constructor(private db: Database) {}

  async create(log: Omit<CarePlanAccessLog, 'id'>): Promise<CarePlanAccessLog> {
    const [row] = await this.db('client_care_plan_access_logs')
      .insert({
        client_id: log.clientId,
        care_plan_id: log.carePlanId,
        organization_id: log.organizationId,
        accessed_at: log.accessedAt,
        access_type: log.accessType,
        client_ip: log.clientIp,
        user_agent: log.userAgent,
        device_type: log.deviceType,
        portal_session_id: log.portalSessionId,
        time_spent_seconds: log.timeSpentSeconds,
        fully_read: log.fullyRead,
        accessibility_features: log.accessibilityFeatures ? JSON.stringify(log.accessibilityFeatures) : null,
      })
      .returning('*');

    return this.mapRowToEntity(row);
  }

  async findByCarePlanId(carePlanId: string, limit = 100): Promise<CarePlanAccessLog[]> {
    const rows = await this.db('client_care_plan_access_logs')
      .where({ care_plan_id: carePlanId })
      .orderBy('accessed_at', 'desc')
      .limit(limit)
      .select('*');

    return rows.map((row) => this.mapRowToEntity(row));
  }

  async findByClientId(clientId: string, limit = 100): Promise<CarePlanAccessLog[]> {
    const rows = await this.db('client_care_plan_access_logs')
      .where({ client_id: clientId })
      .orderBy('accessed_at', 'desc')
      .limit(limit)
      .select('*');

    return rows.map((row) => this.mapRowToEntity(row));
  }

  private mapRowToEntity(row: Record<string, unknown>): CarePlanAccessLog {
    return {
      id: row['id'] as string,
      clientId: row['client_id'] as string,
      carePlanId: row['care_plan_id'] as string,
      organizationId: row['organization_id'] as string,
      accessedAt: row['accessed_at'] as Date,
      accessType: row['access_type'] as CarePlanAccessLog['accessType'],
      clientIp: row['client_ip'] as string | null,
      userAgent: row['user_agent'] as string | null,
      deviceType: row['device_type'] as CarePlanAccessLog['deviceType'],
      portalSessionId: row['portal_session_id'] as string | null,
      timeSpentSeconds: row['time_spent_seconds'] as number | null,
      fullyRead: row['fully_read'] as boolean,
      accessibilityFeatures: this.parseJsonField(row['accessibility_features'], null),
    };
  }

  private parseJsonField<T>(value: unknown, defaultValue: T): T {
    if (value === null || value === undefined) {
      return defaultValue;
    }
    if (typeof value === 'object') {
      return value as T;
    }
    if (typeof value === 'string') {
      try {
        return JSON.parse(value) as T;
      } catch {
        return defaultValue;
      }
    }
    return defaultValue;
  }
}

// ============================================================================
// Portal Session Repository
// ============================================================================

export class PortalSessionRepository {
  constructor(private db: Database) {}

  async create(session: Omit<ClientPortalSession, 'id'>): Promise<ClientPortalSession> {
    const [row] = await this.db('client_portal_sessions')
      .insert({
        client_portal_access_id: session.clientPortalAccessId,
        client_id: session.clientId,
        session_token: session.sessionToken,
        started_at: session.startedAt,
        expires_at: session.expiresAt,
        last_activity_at: session.lastActivityAt,
        ended_at: session.endedAt,
        ip_address: session.ipAddress,
        user_agent: session.userAgent,
        device_type: session.deviceType,
        device_info: session.deviceInfo ? JSON.stringify(session.deviceInfo) : null,
        status: session.status,
      })
      .returning('*');

    return this.mapRowToEntity(row);
  }

  async findByToken(sessionToken: string): Promise<ClientPortalSession | null> {
    const row = await this.db('client_portal_sessions')
      .where({ session_token: sessionToken })
      .first();

    return row ? this.mapRowToEntity(row) : null;
  }

  async updateLastActivity(id: string): Promise<void> {
    await this.db('client_portal_sessions')
      .where({ id })
      .update({
        last_activity_at: this.db.fn.now(),
      });
  }

  async endSession(id: string): Promise<void> {
    await this.db('client_portal_sessions')
      .where({ id })
      .update({
        status: 'LOGGED_OUT',
        ended_at: this.db.fn.now(),
      });
  }

  async expireOldSessions(): Promise<void> {
    await this.db('client_portal_sessions')
      .where('expires_at', '<', this.db.fn.now())
      .where('status', 'ACTIVE')
      .update({
        status: 'EXPIRED',
      });
  }

  private mapRowToEntity(row: Record<string, unknown>): ClientPortalSession {
    return {
      id: row['id'] as string,
      clientPortalAccessId: row['client_portal_access_id'] as string,
      clientId: row['client_id'] as string,
      sessionToken: row['session_token'] as string,
      startedAt: row['started_at'] as Date,
      expiresAt: row['expires_at'] as Date,
      lastActivityAt: row['last_activity_at'] as Date,
      endedAt: row['ended_at'] as Date | null,
      ipAddress: row['ip_address'] as string,
      userAgent: row['user_agent'] as string | null,
      deviceType: row['device_type'] as ClientPortalSession['deviceType'],
      deviceInfo: this.parseJsonField(row['device_info'], null),
      status: row['status'] as PortalSessionStatus,
    };
  }

  private parseJsonField<T>(value: unknown, defaultValue: T): T {
    if (value === null || value === undefined) {
      return defaultValue;
    }
    if (typeof value === 'object') {
      return value as T;
    }
    if (typeof value === 'string') {
      try {
        return JSON.parse(value) as T;
      } catch {
        return defaultValue;
      }
    }
    return defaultValue;
  }
}
