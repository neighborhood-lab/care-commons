/**
 * @folkcare/family-engagement - Video Check-in Repository
 *
 * Data access layer for video calls, participants, recurring schedules,
 * and invitations.
 */

import type { UUID } from '@folkcare/core';
import type {
  VideoCall,
  VideoCallParticipant,
  RecurringVideoSchedule,
  VideoCallInvitation,
  VideoCallFilters,
  RecurringScheduleFilters
} from '../types/video-checkin.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Database = { query: (text: string, params?: unknown[]) => Promise<{ rows: any[] }> };

// ============================================================================
// Video Call Repository
// ============================================================================

export class VideoCallRepository {
  constructor(private db: Database) {}

  async create(data: Partial<VideoCall>): Promise<VideoCall> {
    const result = await this.db.query(
      `INSERT INTO video_calls (
        session_id, client_id, visit_id, call_type, status, title,
        scheduled_start_time, scheduled_end_time, duration_minutes,
        is_recurring, recurring_schedule_id, recurrence_rule,
        host_user_id, host_role,
        room_url, join_code, password_protected, room_password,
        provider, max_participants, recording_enabled,
        notes, family_visible_notes,
        organization_id, branch_id, created_by, updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27)
      RETURNING *`,
      [
        data.sessionId,
        data.clientId,
        data.visitId,
        data.callType,
        data.status || 'SCHEDULED',
        data.title,
        data.scheduledStartTime,
        data.scheduledEndTime,
        data.durationMinutes,
        data.isRecurring ?? false,
        data.recurringScheduleId,
        data.recurrenceRule,
        data.hostUserId,
        data.hostRole,
        data.roomUrl,
        data.joinCode,
        data.passwordProtected ?? false,
        data.roomPassword,
        data.provider || 'daily',
        data.maxParticipants ?? 10,
        data.recordingEnabled ?? false,
        data.notes,
        data.familyVisibleNotes,
        data.organizationId,
        data.branchId,
        data.createdBy,
        data.updatedBy
      ]
    );
    return this.mapToVideoCall(result.rows[0]);
  }

  async findById(id: UUID): Promise<VideoCall | null> {
    const result = await this.db.query(
      'SELECT * FROM video_calls WHERE id = $1 AND is_deleted = false',
      [id]
    );
    return result.rows[0] ? this.mapToVideoCall(result.rows[0]) : null;
  }

  async findBySessionId(sessionId: string): Promise<VideoCall | null> {
    const result = await this.db.query(
      'SELECT * FROM video_calls WHERE session_id = $1 AND is_deleted = false',
      [sessionId]
    );
    return result.rows[0] ? this.mapToVideoCall(result.rows[0]) : null;
  }

  async findByClientId(clientId: UUID): Promise<VideoCall[]> {
    const result = await this.db.query(
      'SELECT * FROM video_calls WHERE client_id = $1 AND is_deleted = false ORDER BY scheduled_start_time DESC',
      [clientId]
    );
    return result.rows.map((row) => this.mapToVideoCall(row));
  }

  async findByVisitId(visitId: UUID): Promise<VideoCall[]> {
    const result = await this.db.query(
      'SELECT * FROM video_calls WHERE visit_id = $1 AND is_deleted = false ORDER BY scheduled_start_time DESC',
      [visitId]
    );
    return result.rows.map((row) => this.mapToVideoCall(row));
  }

  async update(id: UUID, data: Partial<VideoCall>): Promise<VideoCall | null> {
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    const fieldMap: Record<string, string> = {
      status: 'status',
      title: 'title',
      scheduledStartTime: 'scheduled_start_time',
      scheduledEndTime: 'scheduled_end_time',
      actualStartTime: 'actual_start_time',
      actualEndTime: 'actual_end_time',
      durationMinutes: 'duration_minutes',
      roomUrl: 'room_url',
      joinCode: 'join_code',
      recordingEnabled: 'recording_enabled',
      recordingUrl: 'recording_url',
      qualityRating: 'quality_rating',
      averageLatency: 'average_latency',
      packetLoss: 'packet_loss',
      notes: 'notes',
      familyVisibleNotes: 'family_visible_notes',
      updatedBy: 'updated_by'
    };

    for (const [key, dbField] of Object.entries(fieldMap)) {
      if (data[key as keyof VideoCall] !== undefined) {
        setClauses.push(`${dbField} = $${paramIndex}`);
        values.push(data[key as keyof VideoCall]);
        paramIndex++;
      }
    }

    if (setClauses.length === 0) return this.findById(id);

    setClauses.push(`updated_at = NOW()`);
    setClauses.push(`version = version + 1`);
    values.push(id);

    const result = await this.db.query(
      `UPDATE video_calls SET ${setClauses.join(', ')} WHERE id = $${paramIndex} AND is_deleted = false RETURNING *`,
      values
    );
    return result.rows[0] ? this.mapToVideoCall(result.rows[0]) : null;
  }

  async findByFilters(filters: VideoCallFilters): Promise<VideoCall[]> {
    const conditions: string[] = ['is_deleted = false'];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (filters.clientId) {
      conditions.push(`client_id = $${paramIndex}`);
      values.push(filters.clientId);
      paramIndex++;
    }

    if (filters.visitId) {
      conditions.push(`visit_id = $${paramIndex}`);
      values.push(filters.visitId);
      paramIndex++;
    }

    if (filters.hostUserId) {
      conditions.push(`host_user_id = $${paramIndex}`);
      values.push(filters.hostUserId);
      paramIndex++;
    }

    if (filters.status) {
      if (Array.isArray(filters.status)) {
        conditions.push(`status = ANY($${paramIndex})`);
        values.push(filters.status);
      } else {
        conditions.push(`status = $${paramIndex}`);
        values.push(filters.status);
      }
      paramIndex++;
    }

    if (filters.callType) {
      conditions.push(`call_type = $${paramIndex}`);
      values.push(filters.callType);
      paramIndex++;
    }

    if (filters.scheduledFrom) {
      conditions.push(`scheduled_start_time >= $${paramIndex}`);
      values.push(filters.scheduledFrom);
      paramIndex++;
    }

    if (filters.scheduledTo) {
      conditions.push(`scheduled_start_time <= $${paramIndex}`);
      values.push(filters.scheduledTo);
      paramIndex++;
    }

    if (filters.organizationId) {
      conditions.push(`organization_id = $${paramIndex}`);
      values.push(filters.organizationId);
      paramIndex++;
    }

    if (filters.branchId) {
      conditions.push(`branch_id = $${paramIndex}`);
      values.push(filters.branchId);
      paramIndex++;
    }

    const result = await this.db.query(
      `SELECT * FROM video_calls WHERE ${conditions.join(' AND ')} ORDER BY scheduled_start_time ASC`,
      values
    );
    return result.rows.map((row) => this.mapToVideoCall(row));
  }

  async findUpcoming(organizationId?: UUID, limit: number = 10): Promise<VideoCall[]> {
    const conditions = [
      'is_deleted = false',
      "status IN ('SCHEDULED', 'WAITING')",
      'scheduled_start_time > NOW()'
    ];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (organizationId) {
      conditions.push(`organization_id = $${paramIndex}`);
      values.push(organizationId);
      paramIndex++;
    }

    values.push(limit);

    const result = await this.db.query(
      `SELECT * FROM video_calls WHERE ${conditions.join(' AND ')} ORDER BY scheduled_start_time ASC LIMIT $${paramIndex}`,
      values
    );
    return result.rows.map((row) => this.mapToVideoCall(row));
  }

  async findInProgress(organizationId?: UUID): Promise<VideoCall[]> {
    const conditions = ['is_deleted = false', "status = 'IN_PROGRESS'"];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (organizationId) {
      conditions.push(`organization_id = $${paramIndex}`);
      values.push(organizationId);
      paramIndex++;
    }

    const result = await this.db.query(
      `SELECT * FROM video_calls WHERE ${conditions.join(' AND ')} ORDER BY actual_start_time ASC`,
      values
    );
    return result.rows.map((row) => this.mapToVideoCall(row));
  }

  async delete(id: UUID): Promise<boolean> {
    await this.db.query(
      'UPDATE video_calls SET is_deleted = true, updated_at = NOW() WHERE id = $1 AND is_deleted = false',
      [id]
    );
    return true;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapToVideoCall(row: any): VideoCall {
    return {
      id: row.id as UUID,
      sessionId: row.session_id,
      clientId: row.client_id as UUID,
      visitId: row.visit_id as UUID,
      callType: row.call_type,
      status: row.status,
      title: row.title,
      scheduledStartTime: row.scheduled_start_time,
      scheduledEndTime: row.scheduled_end_time,
      actualStartTime: row.actual_start_time,
      actualEndTime: row.actual_end_time,
      durationMinutes: row.duration_minutes,
      isRecurring: row.is_recurring,
      recurringScheduleId: row.recurring_schedule_id as UUID,
      recurrenceRule: row.recurrence_rule,
      hostUserId: row.host_user_id as UUID,
      hostRole: row.host_role,
      roomUrl: row.room_url,
      joinCode: row.join_code,
      passwordProtected: row.password_protected,
      roomPassword: row.room_password,
      provider: row.provider,
      maxParticipants: row.max_participants,
      recordingEnabled: row.recording_enabled,
      recordingUrl: row.recording_url,
      qualityRating: row.quality_rating,
      averageLatency: row.average_latency,
      packetLoss: row.packet_loss,
      notes: row.notes,
      familyVisibleNotes: row.family_visible_notes,
      organizationId: row.organization_id as UUID,
      branchId: row.branch_id as UUID,
      createdAt: row.created_at,
      createdBy: row.created_by as UUID,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by as UUID,
      version: row.version ?? 1
    };
  }
}

// ============================================================================
// Video Call Participant Repository
// ============================================================================

export class VideoCallParticipantRepository {
  constructor(private db: Database) {}

  async create(data: Partial<VideoCallParticipant>): Promise<VideoCallParticipant> {
    const result = await this.db.query(
      `INSERT INTO video_call_participants (
        video_call_id, user_id, role, status, family_member_id,
        invited_at, device_type, browser_type,
        created_by, updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        data.videoCallId,
        data.userId,
        data.role,
        data.status || 'INVITED',
        data.familyMemberId,
        data.invitedAt || new Date().toISOString(),
        data.deviceType,
        data.browserType,
        data.createdBy,
        data.updatedBy
      ]
    );
    return this.mapToParticipant(result.rows[0]);
  }

  async findById(id: UUID): Promise<VideoCallParticipant | null> {
    const result = await this.db.query(
      'SELECT * FROM video_call_participants WHERE id = $1 AND is_deleted = false',
      [id]
    );
    return result.rows[0] ? this.mapToParticipant(result.rows[0]) : null;
  }

  async findByVideoCallId(videoCallId: UUID): Promise<VideoCallParticipant[]> {
    const result = await this.db.query(
      'SELECT * FROM video_call_participants WHERE video_call_id = $1 AND is_deleted = false ORDER BY invited_at ASC',
      [videoCallId]
    );
    return result.rows.map((row) => this.mapToParticipant(row));
  }

  async findByUserAndCall(userId: UUID, videoCallId: UUID): Promise<VideoCallParticipant | null> {
    const result = await this.db.query(
      'SELECT * FROM video_call_participants WHERE user_id = $1 AND video_call_id = $2 AND is_deleted = false',
      [userId, videoCallId]
    );
    return result.rows[0] ? this.mapToParticipant(result.rows[0]) : null;
  }

  async update(id: UUID, data: Partial<VideoCallParticipant>): Promise<VideoCallParticipant | null> {
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    const fieldMap: Record<string, string> = {
      status: 'status',
      joinedAt: 'joined_at',
      leftAt: 'left_at',
      connectionDurationSeconds: 'connection_duration_seconds',
      deviceType: 'device_type',
      browserType: 'browser_type',
      qualityRating: 'quality_rating',
      feedbackNotes: 'feedback_notes',
      hadTechnicalIssues: 'had_technical_issues',
      technicalIssueNotes: 'technical_issue_notes',
      updatedBy: 'updated_by'
    };

    for (const [key, dbField] of Object.entries(fieldMap)) {
      if (data[key as keyof VideoCallParticipant] !== undefined) {
        setClauses.push(`${dbField} = $${paramIndex}`);
        values.push(data[key as keyof VideoCallParticipant]);
        paramIndex++;
      }
    }

    if (setClauses.length === 0) return this.findById(id);

    setClauses.push(`updated_at = NOW()`);
    setClauses.push(`version = version + 1`);
    values.push(id);

    const result = await this.db.query(
      `UPDATE video_call_participants SET ${setClauses.join(', ')} WHERE id = $${paramIndex} AND is_deleted = false RETURNING *`,
      values
    );
    return result.rows[0] ? this.mapToParticipant(result.rows[0]) : null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapToParticipant(row: any): VideoCallParticipant {
    return {
      id: row.id as UUID,
      videoCallId: row.video_call_id as UUID,
      userId: row.user_id as UUID,
      role: row.role,
      status: row.status,
      familyMemberId: row.family_member_id as UUID,
      invitedAt: row.invited_at,
      joinedAt: row.joined_at,
      leftAt: row.left_at,
      connectionDurationSeconds: row.connection_duration_seconds,
      deviceType: row.device_type,
      browserType: row.browser_type,
      qualityRating: row.quality_rating,
      feedbackNotes: row.feedback_notes,
      hadTechnicalIssues: row.had_technical_issues,
      technicalIssueNotes: row.technical_issue_notes,
      createdAt: row.created_at,
      createdBy: row.created_by as UUID,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by as UUID,
      version: row.version ?? 1
    };
  }
}

// ============================================================================
// Recurring Video Schedule Repository
// ============================================================================

export class RecurringVideoScheduleRepository {
  constructor(private db: Database) {}

  async create(data: Partial<RecurringVideoSchedule>): Promise<RecurringVideoSchedule> {
    const result = await this.db.query(
      `INSERT INTO recurring_video_schedules (
        client_id, title, description, recurrence_rule, duration,
        start_date, end_date, is_active,
        default_participants, auto_create_session,
        reminder_minutes_before, max_participants, recording_enabled,
        created_by_user_id, organization_id, branch_id,
        created_by, updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *`,
      [
        data.clientId,
        data.title,
        data.description,
        data.recurrenceRule,
        data.duration,
        data.startDate,
        data.endDate,
        data.isActive ?? true,
        JSON.stringify(data.defaultParticipants || []),
        data.autoCreateSession ?? true,
        data.reminderMinutesBefore || [30, 5],
        data.maxParticipants ?? 10,
        data.recordingEnabled ?? false,
        data.createdByUserId,
        data.organizationId,
        data.branchId,
        data.createdBy,
        data.updatedBy
      ]
    );
    return this.mapToSchedule(result.rows[0]);
  }

  async findById(id: UUID): Promise<RecurringVideoSchedule | null> {
    const result = await this.db.query(
      'SELECT * FROM recurring_video_schedules WHERE id = $1 AND is_deleted = false',
      [id]
    );
    return result.rows[0] ? this.mapToSchedule(result.rows[0]) : null;
  }

  async findByClientId(clientId: UUID): Promise<RecurringVideoSchedule[]> {
    const result = await this.db.query(
      'SELECT * FROM recurring_video_schedules WHERE client_id = $1 AND is_deleted = false ORDER BY created_at DESC',
      [clientId]
    );
    return result.rows.map((row) => this.mapToSchedule(row));
  }

  async findByFilters(filters: RecurringScheduleFilters): Promise<RecurringVideoSchedule[]> {
    const conditions: string[] = ['is_deleted = false'];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (filters.clientId) {
      conditions.push(`client_id = $${paramIndex}`);
      values.push(filters.clientId);
      paramIndex++;
    }

    if (filters.isActive !== undefined) {
      conditions.push(`is_active = $${paramIndex}`);
      values.push(filters.isActive);
      paramIndex++;
    }

    if (filters.createdByUserId) {
      conditions.push(`created_by_user_id = $${paramIndex}`);
      values.push(filters.createdByUserId);
      paramIndex++;
    }

    if (filters.organizationId) {
      conditions.push(`organization_id = $${paramIndex}`);
      values.push(filters.organizationId);
      paramIndex++;
    }

    const result = await this.db.query(
      `SELECT * FROM recurring_video_schedules WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC`,
      values
    );
    return result.rows.map((row) => this.mapToSchedule(row));
  }

  async update(id: UUID, data: Partial<RecurringVideoSchedule>): Promise<RecurringVideoSchedule | null> {
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    const fieldMap: Record<string, string> = {
      title: 'title',
      description: 'description',
      recurrenceRule: 'recurrence_rule',
      duration: 'duration',
      endDate: 'end_date',
      isActive: 'is_active',
      autoCreateSession: 'auto_create_session',
      reminderMinutesBefore: 'reminder_minutes_before',
      maxParticipants: 'max_participants',
      recordingEnabled: 'recording_enabled',
      updatedBy: 'updated_by'
    };

    for (const [key, dbField] of Object.entries(fieldMap)) {
      if (data[key as keyof RecurringVideoSchedule] !== undefined) {
        setClauses.push(`${dbField} = $${paramIndex}`);
        values.push(data[key as keyof RecurringVideoSchedule]);
        paramIndex++;
      }
    }

    if (data.defaultParticipants !== undefined) {
      setClauses.push(`default_participants = $${paramIndex}`);
      values.push(JSON.stringify(data.defaultParticipants));
      paramIndex++;
    }

    if (setClauses.length === 0) return this.findById(id);

    setClauses.push(`updated_at = NOW()`);
    setClauses.push(`version = version + 1`);
    values.push(id);

    const result = await this.db.query(
      `UPDATE recurring_video_schedules SET ${setClauses.join(', ')} WHERE id = $${paramIndex} AND is_deleted = false RETURNING *`,
      values
    );
    return result.rows[0] ? this.mapToSchedule(result.rows[0]) : null;
  }

  async delete(id: UUID): Promise<boolean> {
    await this.db.query(
      'UPDATE recurring_video_schedules SET is_deleted = true, updated_at = NOW() WHERE id = $1 AND is_deleted = false',
      [id]
    );
    return true;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapToSchedule(row: any): RecurringVideoSchedule {
    return {
      id: row.id as UUID,
      clientId: row.client_id as UUID,
      title: row.title,
      description: row.description,
      recurrenceRule: row.recurrence_rule,
      duration: row.duration,
      startDate: row.start_date,
      endDate: row.end_date,
      isActive: row.is_active,
      defaultParticipants: row.default_participants || [],
      autoCreateSession: row.auto_create_session,
      reminderMinutesBefore: row.reminder_minutes_before || [],
      maxParticipants: row.max_participants,
      recordingEnabled: row.recording_enabled,
      createdByUserId: row.created_by_user_id as UUID,
      organizationId: row.organization_id as UUID,
      branchId: row.branch_id as UUID,
      createdAt: row.created_at,
      createdBy: row.created_by as UUID,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by as UUID,
      version: row.version ?? 1
    };
  }
}

// ============================================================================
// Video Call Invitation Repository
// ============================================================================

export class VideoCallInvitationRepository {
  constructor(private db: Database) {}

  async create(data: Partial<VideoCallInvitation>): Promise<VideoCallInvitation> {
    const result = await this.db.query(
      `INSERT INTO video_call_invitations (
        video_call_id, participant_id,
        recipient_user_id, recipient_email, recipient_phone, recipient_name,
        invitation_type, sent_at, join_url, join_code, expires_at,
        created_by, updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        data.videoCallId,
        data.participantId,
        data.recipientUserId,
        data.recipientEmail,
        data.recipientPhone,
        data.recipientName,
        data.invitationType,
        data.sentAt || new Date().toISOString(),
        data.joinUrl,
        data.joinCode,
        data.expiresAt,
        data.createdBy,
        data.updatedBy
      ]
    );
    return this.mapToInvitation(result.rows[0]);
  }

  async findById(id: UUID): Promise<VideoCallInvitation | null> {
    const result = await this.db.query(
      'SELECT * FROM video_call_invitations WHERE id = $1 AND is_deleted = false',
      [id]
    );
    return result.rows[0] ? this.mapToInvitation(result.rows[0]) : null;
  }

  async findByVideoCallId(videoCallId: UUID): Promise<VideoCallInvitation[]> {
    const result = await this.db.query(
      'SELECT * FROM video_call_invitations WHERE video_call_id = $1 AND is_deleted = false ORDER BY sent_at DESC',
      [videoCallId]
    );
    return result.rows.map((row) => this.mapToInvitation(row));
  }

  async findByRecipientEmail(email: string): Promise<VideoCallInvitation[]> {
    const result = await this.db.query(
      'SELECT * FROM video_call_invitations WHERE recipient_email = $1 AND is_deleted = false ORDER BY sent_at DESC',
      [email]
    );
    return result.rows.map((row) => this.mapToInvitation(row));
  }

  async findPendingByUserId(userId: UUID): Promise<VideoCallInvitation[]> {
    const result = await this.db.query(
      `SELECT i.* FROM video_call_invitations i
       JOIN video_calls v ON i.video_call_id = v.id
       WHERE i.recipient_user_id = $1
       AND i.is_deleted = false
       AND i.response IS NULL
       AND i.expires_at > NOW()
       AND v.status IN ('SCHEDULED', 'WAITING')
       ORDER BY v.scheduled_start_time ASC`,
      [userId]
    );
    return result.rows.map((row) => this.mapToInvitation(row));
  }

  async update(id: UUID, data: Partial<VideoCallInvitation>): Promise<VideoCallInvitation | null> {
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    const fieldMap: Record<string, string> = {
      openedAt: 'opened_at',
      respondedAt: 'responded_at',
      response: 'response',
      remindersSent: 'reminders_sent',
      lastReminderAt: 'last_reminder_at',
      updatedBy: 'updated_by'
    };

    for (const [key, dbField] of Object.entries(fieldMap)) {
      if (data[key as keyof VideoCallInvitation] !== undefined) {
        setClauses.push(`${dbField} = $${paramIndex}`);
        values.push(data[key as keyof VideoCallInvitation]);
        paramIndex++;
      }
    }

    if (setClauses.length === 0) return this.findById(id);

    setClauses.push(`updated_at = NOW()`);
    setClauses.push(`version = version + 1`);
    values.push(id);

    const result = await this.db.query(
      `UPDATE video_call_invitations SET ${setClauses.join(', ')} WHERE id = $${paramIndex} AND is_deleted = false RETURNING *`,
      values
    );
    return result.rows[0] ? this.mapToInvitation(result.rows[0]) : null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapToInvitation(row: any): VideoCallInvitation {
    return {
      id: row.id as UUID,
      videoCallId: row.video_call_id as UUID,
      participantId: row.participant_id as UUID,
      recipientUserId: row.recipient_user_id as UUID,
      recipientEmail: row.recipient_email,
      recipientPhone: row.recipient_phone,
      recipientName: row.recipient_name,
      invitationType: row.invitation_type,
      sentAt: row.sent_at,
      openedAt: row.opened_at,
      respondedAt: row.responded_at,
      response: row.response,
      joinUrl: row.join_url,
      joinCode: row.join_code,
      expiresAt: row.expires_at,
      remindersSent: row.reminders_sent,
      lastReminderAt: row.last_reminder_at,
      createdAt: row.created_at,
      createdBy: row.created_by as UUID,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by as UUID,
      version: row.version ?? 1
    };
  }
}
