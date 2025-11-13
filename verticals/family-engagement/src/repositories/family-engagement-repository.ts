/**
 * Family Engagement Repository
 *
 * Data access layer for family portal, notifications, activity feed, and messaging
 */

import { Repository, Database } from '@care-commons/core';
import type { UUID } from '@care-commons/core';
import type {
  FamilyMember,
  FamilyMemberProfile,
  Notification,
  ActivityFeedItem,
  MessageThread,
  Message,
  InviteFamilyMemberInput,
  SendNotificationInput,
  CreateMessageThreadInput,
  SendMessageInput
} from '../types/family-engagement';

/**
 * Repository for family member management
 */
export class FamilyMemberRepository extends Repository<FamilyMember> {
  constructor(database: Database) {
    super({
      tableName: 'family_members',
      database,
      enableAudit: true,
      enableSoftDelete: false
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected mapRowToEntity(row: any): FamilyMember {
    return {
      id: row.id,
      clientId: row.client_id,
      relationship: row.relationship,
      relationshipNote: row.relationship_note,
      isPrimaryContact: row.is_primary_contact,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      phoneNumber: row.phone_number,
      preferredContactMethod: row.preferred_contact_method,
      portalAccessLevel: row.portal_access_level,
      accessGrantedBy: row.access_granted_by,
      accessGrantedAt: row.access_granted_at,
      accessExpiresAt: row.access_expires_at,
      status: row.status,
      invitationStatus: row.invitation_status,
      invitationSentAt: row.invitation_sent_at,
      invitationAcceptedAt: row.invitation_accepted_at,
      receiveNotifications: row.receive_notifications,
      notificationPreferences: row.notification_preferences,
      lastLoginAt: row.last_login_at,
      passwordResetRequired: row.password_reset_required,
      organizationId: row.organization_id,
      branchId: row.branch_id,
      createdAt: row.created_at,
      createdBy: row.created_by,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by,
      version: row.version
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected mapEntityToRow(entity: Partial<FamilyMember>): Record<string, any> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row: Record<string, any> = {};

    if (entity.id !== undefined) row.id = entity.id;
    if (entity.clientId !== undefined) row.client_id = entity.clientId;
    if (entity.relationship !== undefined) row.relationship = entity.relationship;
    if (entity.relationshipNote !== undefined) row.relationship_note = entity.relationshipNote;
    if (entity.isPrimaryContact !== undefined) row.is_primary_contact = entity.isPrimaryContact;
    if (entity.firstName !== undefined) row.first_name = entity.firstName;
    if (entity.lastName !== undefined) row.last_name = entity.lastName;
    if (entity.email !== undefined) row.email = entity.email;
    if (entity.phoneNumber !== undefined) row.phone_number = entity.phoneNumber;
    if (entity.preferredContactMethod !== undefined) row.preferred_contact_method = entity.preferredContactMethod;
    if (entity.portalAccessLevel !== undefined) row.portal_access_level = entity.portalAccessLevel;
    if (entity.accessGrantedBy !== undefined) row.access_granted_by = entity.accessGrantedBy;
    if (entity.accessGrantedAt !== undefined) row.access_granted_at = entity.accessGrantedAt;
    if (entity.accessExpiresAt !== undefined) row.access_expires_at = entity.accessExpiresAt;
    if (entity.status !== undefined) row.status = entity.status;
    if (entity.invitationStatus !== undefined) row.invitation_status = entity.invitationStatus;
    if (entity.invitationSentAt !== undefined) row.invitation_sent_at = entity.invitationSentAt;
    if (entity.invitationAcceptedAt !== undefined) row.invitation_accepted_at = entity.invitationAcceptedAt;
    if (entity.receiveNotifications !== undefined) row.receive_notifications = entity.receiveNotifications;
    if (entity.notificationPreferences !== undefined) row.notification_preferences = JSON.stringify(entity.notificationPreferences);
    if (entity.lastLoginAt !== undefined) row.last_login_at = entity.lastLoginAt;
    if (entity.passwordResetRequired !== undefined) row.password_reset_required = entity.passwordResetRequired;
    if (entity.organizationId !== undefined) row.organization_id = entity.organizationId;
    if (entity.branchId !== undefined) row.branch_id = entity.branchId;
    if (entity.createdAt !== undefined) row.created_at = entity.createdAt;
    if (entity.createdBy !== undefined) row.created_by = entity.createdBy;
    if (entity.updatedAt !== undefined) row.updated_at = entity.updatedAt;
    if (entity.updatedBy !== undefined) row.updated_by = entity.updatedBy;
    if (entity.version !== undefined) row.version = entity.version;

    return row;
  }

  /**
   * Create family member and send invitation
   */
  async createFamilyMember(
    input: InviteFamilyMemberInput & { createdBy: UUID }
  ): Promise<FamilyMember> {
    const query = `
      INSERT INTO family_members (
        id, client_id, relationship, relationship_note, is_primary_contact,
        first_name, last_name, email, phone_number, portal_access_level,
        access_granted_by, access_expires_at, notification_preferences,
        organization_id, branch_id, created_by, updated_by, created_at, updated_at, version
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $15,
        NOW(), NOW(), 1
      )
      RETURNING *
    `;

    const result = await this.database.query(query, [
      input.clientId,
      input.relationship,
      input.relationshipNote || null,
      input.isPrimaryContact,
      input.firstName,
      input.lastName,
      input.email,
      input.phoneNumber,
      input.portalAccessLevel,
      input.createdBy,
      input.accessExpiresAt || null,
      JSON.stringify(input.notificationPreferences || {}),
      // Note: organizationId and branchId would come from userContext
      input.clientId, // Placeholder - would need to fetch from client
      input.clientId, // Placeholder - would need to fetch from client
      input.createdBy
    ]);

    return this.mapRowToEntity(result.rows[0]);
  }

  /**
   * Find family members for a client
   */
  async findByClientId(clientId: UUID): Promise<FamilyMember[]> {
    const query = `
      SELECT * FROM family_members
      WHERE client_id = $1
      AND status = 'ACTIVE'
      ORDER BY is_primary_contact DESC, created_at DESC
    `;

    const result = await this.database.query(query, [clientId]);
    return result.rows.map(row => this.mapRowToEntity(row));
  }

  /**
   * Find family member by email
   */
  async findByEmail(email: string): Promise<FamilyMember | null> {
    const query = `
      SELECT * FROM family_members
      WHERE email = $1
      AND status = 'ACTIVE'
    `;

    const result = await this.database.query(query, [email]);
    return result.rows.length > 0 ? this.mapRowToEntity(result.rows[0]) : null;
  }

  /**
   * Get family member profile with statistics
   */
  async getFamilyMemberProfile(familyMemberId: UUID): Promise<FamilyMemberProfile | null> {
    const query = `
      SELECT
        fm.*,
        COUNT(DISTINCT fn.id) FILTER (WHERE fn.delivery_status NOT IN ('READ', 'DISMISSED')) as unread_notifications,
        COUNT(DISTINCT fn.id) as total_notifications,
        COUNT(DISTINCT mt.id) as total_message_threads,
        SUM(mt.unread_count_family) as unread_messages,
        MAX(faf.occurred_at) as last_activity_date
      FROM family_members fm
      LEFT JOIN family_notifications fn ON fn.family_member_id = fm.id
      LEFT JOIN message_threads mt ON mt.family_member_id = fm.id
      LEFT JOIN family_activity_feed faf ON faf.family_member_id = fm.id
      WHERE fm.id = $1
      GROUP BY fm.id
    `;

    const result = await this.database.query(query, [familyMemberId]);
    if (result.rows.length === 0) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row = result.rows[0] as any;
    const familyMember = this.mapRowToEntity(row);

    return {
      ...familyMember,
      statistics: {
        totalNotifications: parseInt(row.total_notifications as string) || 0,
        unreadNotifications: parseInt(row.unread_notifications as string) || 0,
        totalMessages: parseInt(row.total_message_threads as string) || 0,
        unreadMessages: parseInt(row.unread_messages as string) || 0,
        lastActivityDate: row.last_activity_date as Date | undefined
      }
    };
  }
}

/**
 * Repository for notifications
 */
export class NotificationRepository extends Repository<Notification> {
  constructor(database: Database) {
    super({
      tableName: 'family_notifications',
      database,
      enableAudit: true,
      enableSoftDelete: false
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected mapRowToEntity(row: any): Notification {
    return {
      id: row.id,
      familyMemberId: row.family_member_id,
      clientId: row.client_id,
      category: row.category,
      priority: row.priority,
      title: row.title,
      message: row.message,
      actionUrl: row.action_url,
      actionLabel: row.action_label,
      relatedEntityType: row.related_entity_type,
      relatedEntityId: row.related_entity_id,
      deliveryStatus: row.delivery_status,
      sentAt: row.sent_at,
      deliveredAt: row.delivered_at,
      readAt: row.read_at,
      dismissedAt: row.dismissed_at,
      emailSent: row.email_sent,
      smsSent: row.sms_sent,
      pushSent: row.push_sent,
      expiresAt: row.expires_at,
      organizationId: row.organization_id,
      createdAt: row.created_at,
      createdBy: row.created_by,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by,
      version: row.version
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected mapEntityToRow(entity: Partial<Notification>): Record<string, any> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row: Record<string, any> = {};

    if (entity.id !== undefined) row.id = entity.id;
    if (entity.familyMemberId !== undefined) row.family_member_id = entity.familyMemberId;
    if (entity.clientId !== undefined) row.client_id = entity.clientId;
    if (entity.category !== undefined) row.category = entity.category;
    if (entity.priority !== undefined) row.priority = entity.priority;
    if (entity.title !== undefined) row.title = entity.title;
    if (entity.message !== undefined) row.message = entity.message;
    if (entity.actionUrl !== undefined) row.action_url = entity.actionUrl;
    if (entity.actionLabel !== undefined) row.action_label = entity.actionLabel;
    if (entity.relatedEntityType !== undefined) row.related_entity_type = entity.relatedEntityType;
    if (entity.relatedEntityId !== undefined) row.related_entity_id = entity.relatedEntityId;
    if (entity.deliveryStatus !== undefined) row.delivery_status = entity.deliveryStatus;
    if (entity.sentAt !== undefined) row.sent_at = entity.sentAt;
    if (entity.deliveredAt !== undefined) row.delivered_at = entity.deliveredAt;
    if (entity.readAt !== undefined) row.read_at = entity.readAt;
    if (entity.dismissedAt !== undefined) row.dismissed_at = entity.dismissedAt;
    if (entity.emailSent !== undefined) row.email_sent = entity.emailSent;
    if (entity.smsSent !== undefined) row.sms_sent = entity.smsSent;
    if (entity.pushSent !== undefined) row.push_sent = entity.pushSent;
    if (entity.expiresAt !== undefined) row.expires_at = entity.expiresAt;
    if (entity.organizationId !== undefined) row.organization_id = entity.organizationId;
    if (entity.createdAt !== undefined) row.created_at = entity.createdAt;
    if (entity.createdBy !== undefined) row.created_by = entity.createdBy;
    if (entity.updatedAt !== undefined) row.updated_at = entity.updatedAt;
    if (entity.updatedBy !== undefined) row.updated_by = entity.updatedBy;

    return row;
  }

  /**
   * Create notification
   */
  async createNotification(
    input: SendNotificationInput & { createdBy: UUID; organizationId: UUID }
  ): Promise<Notification> {
    const query = `
      INSERT INTO family_notifications (
        id, family_member_id, client_id, category, priority, title, message,
        action_url, action_label, related_entity_type, related_entity_id,
        organization_id, created_by, updated_by, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $12, NOW(), NOW()
      )
      RETURNING *
    `;

    const result = await this.database.query(query, [
      input.familyMemberId,
      input.clientId,
      input.category,
      input.priority,
      input.title,
      input.message,
      input.actionUrl || null,
      input.actionLabel || null,
      input.relatedEntityType || null,
      input.relatedEntityId || null,
      input.organizationId,
      input.createdBy
    ]);

    return this.mapRowToEntity(result.rows[0]);
  }

  /**
   * Get unread notifications for family member
   */
  async getUnreadNotifications(familyMemberId: UUID): Promise<Notification[]> {
    const query = `
      SELECT * FROM family_notifications
      WHERE family_member_id = $1
      AND delivery_status NOT IN ('READ', 'DISMISSED')
      AND (expires_at IS NULL OR expires_at > NOW())
      ORDER BY priority DESC, created_at DESC
      LIMIT 50
    `;

    const result = await this.database.query(query, [familyMemberId]);
    return result.rows.map(row => this.mapRowToEntity(row));
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: UUID): Promise<void> {
    const query = `
      UPDATE family_notifications
      SET delivery_status = 'READ', read_at = NOW()
      WHERE id = $1
    `;

    await this.database.query(query, [notificationId]);
  }
}

/**
 * Repository for activity feed
 */
export class ActivityFeedRepository extends Repository<ActivityFeedItem> {
  constructor(database: Database) {
    super({
      tableName: 'family_activity_feed',
      database,
      enableAudit: true,
      enableSoftDelete: false
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected mapRowToEntity(row: any): ActivityFeedItem {
    return {
      id: row.id,
      familyMemberId: row.family_member_id,
      clientId: row.client_id,
      activityType: row.activity_type,
      title: row.title,
      description: row.description,
      summary: row.summary,
      relatedEntityType: row.related_entity_type,
      relatedEntityId: row.related_entity_id,
      performedBy: row.performed_by,
      performedByName: row.performed_by_name,
      occurredAt: row.occurred_at,
      iconType: row.icon_type,
      viewedByFamily: row.viewed_by_family,
      viewedAt: row.viewed_at,
      organizationId: row.organization_id,
      branchId: row.branch_id,
      createdAt: row.created_at,
      createdBy: row.created_by,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by,
      version: row.version
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected mapEntityToRow(entity: Partial<ActivityFeedItem>): Record<string, any> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row: Record<string, any> = {};

    if (entity.id !== undefined) row.id = entity.id;
    if (entity.familyMemberId !== undefined) row.family_member_id = entity.familyMemberId;
    if (entity.clientId !== undefined) row.client_id = entity.clientId;
    if (entity.activityType !== undefined) row.activity_type = entity.activityType;
    if (entity.title !== undefined) row.title = entity.title;
    if (entity.description !== undefined) row.description = entity.description;
    if (entity.summary !== undefined) row.summary = entity.summary;
    if (entity.relatedEntityType !== undefined) row.related_entity_type = entity.relatedEntityType;
    if (entity.relatedEntityId !== undefined) row.related_entity_id = entity.relatedEntityId;
    if (entity.performedBy !== undefined) row.performed_by = entity.performedBy;
    if (entity.performedByName !== undefined) row.performed_by_name = entity.performedByName;
    if (entity.occurredAt !== undefined) row.occurred_at = entity.occurredAt;
    if (entity.iconType !== undefined) row.icon_type = entity.iconType;
    if (entity.viewedByFamily !== undefined) row.viewed_by_family = entity.viewedByFamily;
    if (entity.viewedAt !== undefined) row.viewed_at = entity.viewedAt;
    if (entity.organizationId !== undefined) row.organization_id = entity.organizationId;
    if (entity.branchId !== undefined) row.branch_id = entity.branchId;
    if (entity.createdAt !== undefined) row.created_at = entity.createdAt;
    if (entity.createdBy !== undefined) row.created_by = entity.createdBy;
    if (entity.updatedAt !== undefined) row.updated_at = entity.updatedAt;
    if (entity.updatedBy !== undefined) row.updated_by = entity.updatedBy;

    return row;
  }

  /**
   * Get recent activity for family member
   */
  async getRecentActivity(
    familyMemberId: UUID,
    limit: number = 20
  ): Promise<ActivityFeedItem[]> {
    const query = `
      SELECT * FROM family_activity_feed
      WHERE family_member_id = $1
      ORDER BY occurred_at DESC
      LIMIT $2
    `;

    const result = await this.database.query(query, [familyMemberId, limit]);
    return result.rows.map(row => this.mapRowToEntity(row));
  }
}

/**
 * Repository for message threads and messages
 */
export class MessageRepository {
  constructor(private database: Database) {}

  /**
   * Create message thread
   */
  async createThread(
    input: CreateMessageThreadInput & { createdBy: UUID; organizationId: UUID; branchId: UUID }
  ): Promise<MessageThread> {
    const query = `
      INSERT INTO message_threads (
        id, family_member_id, client_id, subject, priority, participants,
        assigned_to_user_id, organization_id, branch_id,
        created_by, updated_by, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $9, NOW(), NOW()
      )
      RETURNING *
    `;

    const result = await this.database.query(query, [
      input.familyMemberId,
      input.clientId,
      input.subject,
      input.priority || 'NORMAL',
      JSON.stringify([input.familyMemberId, input.createdBy]),
      input.assignedToUserId || null,
      input.organizationId,
      input.branchId,
      input.createdBy
    ]);

    return this.mapRowToThread(result.rows[0]);
  }

  /**
   * Send message in thread
   */
  async sendMessage(
    input: SendMessageInput & {
      familyMemberId: UUID;
      clientId: UUID;
      sentBy: UUID;
      senderType: 'FAMILY' | 'STAFF';
      senderName: string;
      organizationId: UUID;
      createdBy: UUID;
    }
  ): Promise<Message> {
    const query = `
      INSERT INTO messages (
        id, thread_id, family_member_id, client_id, sent_by, sender_type, sender_name,
        message_text, attachment_urls, is_internal, organization_id,
        created_by, updated_by, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $11, NOW(), NOW()
      )
      RETURNING *
    `;

    const result = await this.database.query(query, [
      input.threadId,
      input.familyMemberId,
      input.clientId,
      input.sentBy,
      input.senderType,
      input.senderName,
      input.messageText,
      input.attachmentUrls ? JSON.stringify(input.attachmentUrls) : null,
      input.isInternal || false,
      input.organizationId,
      input.createdBy
    ]);

    // Update thread last_message_at and message_count
    await this.database.query(`
      UPDATE message_threads
      SET last_message_at = NOW(),
          message_count = message_count + 1,
          unread_count_${input.senderType === 'FAMILY' ? 'staff' : 'family'} = unread_count_${input.senderType === 'FAMILY' ? 'staff' : 'family'} + 1
      WHERE id = $1
    `, [input.threadId]);

    return this.mapRowToMessage(result.rows[0]);
  }

  /**
   * Get threads for family member
   */
  async getThreadsForFamilyMember(familyMemberId: UUID): Promise<MessageThread[]> {
    const query = `
      SELECT * FROM message_threads
      WHERE family_member_id = $1
      AND status != 'ARCHIVED'
      ORDER BY last_message_at DESC
    `;

    const result = await this.database.query(query, [familyMemberId]);
    return result.rows.map(row => this.mapRowToThread(row));
  }

  /**
   * Get thread by ID
   */
  async getThreadById(threadId: UUID): Promise<MessageThread | null> {
    const query = `
      SELECT * FROM message_threads
      WHERE id = $1
      AND deleted_at IS NULL
    `;

    const result = await this.database.query(query, [threadId]);
    return result.rows[0] ? this.mapRowToThread(result.rows[0]) : null;
  }

  /**
   * Get messages in thread
   */
  async getMessagesInThread(threadId: UUID): Promise<Message[]> {
    const query = `
      SELECT * FROM messages
      WHERE thread_id = $1
      AND is_internal = false
      ORDER BY created_at ASC
    `;

    const result = await this.database.query(query, [threadId]);
    return result.rows.map(row => this.mapRowToMessage(row));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapRowToThread(row: any): MessageThread {
    return {
      id: row.id,
      familyMemberId: row.family_member_id,
      clientId: row.client_id,
      subject: row.subject,
      status: row.status,
      priority: row.priority,
      participants: row.participants,
      assignedToUserId: row.assigned_to_user_id,
      lastMessageAt: row.last_message_at,
      messageCount: row.message_count,
      unreadCountFamily: row.unread_count_family,
      unreadCountStaff: row.unread_count_staff,
      organizationId: row.organization_id,
      branchId: row.branch_id,
      createdAt: row.created_at,
      createdBy: row.created_by,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by,
      version: row.version
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapRowToMessage(row: any): Message {
    return {
      id: row.id,
      threadId: row.thread_id,
      familyMemberId: row.family_member_id,
      clientId: row.client_id,
      sentBy: row.sent_by,
      senderType: row.sender_type,
      senderName: row.sender_name,
      messageText: row.message_text,
      attachmentUrls: row.attachment_urls,
      status: row.status,
      readAt: row.read_at,
      readBy: row.read_by,
      isInternal: row.is_internal,
      flaggedForReview: row.flagged_for_review,
      flaggedReason: row.flagged_reason,
      organizationId: row.organization_id,
      createdAt: row.created_at,
      createdBy: row.created_by,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by,
      version: row.version
    };
  }
}
