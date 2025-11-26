/**
 * Compliance Notification Service
 * 
 * Sends notifications for compliance deadlines, credential expirations,
 * and authorization alerts. Integrates with the central notification service.
 */

import { Database } from '../../db/connection.js';
import { UUID } from '../../types/base.js';
import { NotificationService, getNotificationService } from '../../notifications/notification-service.js';
import type { 
  NotificationRecipient, 
  NotificationChannel,
  NotificationPriority,
  NotificationEventType,
} from '../../notifications/types.js';
import type { ComplianceDeadline } from './types.js';

interface UserNotificationInfo {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  notificationPreferences?: {
    enabledChannels?: NotificationChannel[];
    complianceAlerts?: boolean;
    dailyDigest?: boolean;
  };
}

interface NotificationLogEntry {
  organizationId: string;
  deadlineId: string;
  recipientId: string;
  channel: NotificationChannel;
  eventType: NotificationEventType;
  success: boolean;
  error?: string;
}

export class ComplianceNotificationService {
  private readonly db: Database;
  private readonly notificationService: NotificationService;

  constructor(db: Database) {
    this.db = db;
    this.notificationService = getNotificationService(db);
  }

  /**
   * Send notifications for a list of deadlines
   */
  async sendDeadlineNotifications(
    organizationId: UUID,
    deadlines: ComplianceDeadline[]
  ): Promise<{ sent: number; failed: number; skipped: number }> {
    let sent = 0;
    let failed = 0;
    let skipped = 0;

    for (const deadline of deadlines) {
      try {
        // Check if notification was already sent recently (within 24 hours for daily, 7 days for weekly)
        const shouldNotify = await this.shouldSendNotification(deadline);
        if (!shouldNotify) {
          skipped++;
          continue;
        }

        // Get recipients based on deadline type and entity
        const recipients = await this.getRecipientsForDeadline(organizationId, deadline);
        if (recipients.length === 0) {
          skipped++;
          continue;
        }

        // Determine notification event type and priority
        const { eventType, priority } = this.getNotificationTypeAndPriority(deadline);

        // Get template data
        const templateData = this.getTemplateData(deadline);

        // Get template
        const template = NotificationService.getTemplate(eventType, templateData);

        // Send notification
        const results = await this.notificationService.send({
          eventType,
          priority,
          recipients,
          subject: template.subject,
          message: template.message,
          data: templateData,
          organizationId,
          relatedEntityType: this.getEntityType(deadline.entityType),
          relatedEntityId: deadline.entityId,
        });

        // Log results
        for (const result of results) {
          await this.logNotification({
            organizationId,
            deadlineId: deadline.id,
            recipientId: result.recipientId,
            channel: result.channel,
            eventType,
            success: result.success,
            error: result.error,
          });

          if (result.success) {
            sent++;
          } else {
            failed++;
          }
        }

        // Update deadline notification count
        await this.updateDeadlineNotificationCount(deadline.id);

      } catch (error) {
        console.error(`[ComplianceNotification] Error sending notification for deadline ${deadline.id}:`, error);
        failed++;
      }
    }

    return { sent, failed, skipped };
  }

  /**
   * Send daily digest email to coordinators/admins
   */
  async sendDailyDigest(organizationId: UUID): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    try {
      // Get deadline counts
      const counts = await this.getDeadlineCounts(organizationId);
      
      // Skip if no actionable items
      if (counts.overdue === 0 && counts.urgent === 0 && counts.warning === 0) {
        return { sent: 0, failed: 0 };
      }

      // Get admin/coordinator recipients who have daily digest enabled
      const recipients = await this.getDigestRecipients(organizationId);
      if (recipients.length === 0) {
        return { sent: 0, failed: 0 };
      }

      const templateData = {
        overdueCount: counts.overdue,
        urgentCount: counts.urgent,
        warningCount: counts.warning,
        totalCount: counts.overdue + counts.urgent + counts.warning,
      };

      const template = NotificationService.getTemplate('COMPLIANCE_DAILY_DIGEST', templateData);

      const results = await this.notificationService.send({
        eventType: 'COMPLIANCE_DAILY_DIGEST',
        priority: counts.overdue > 0 ? 'HIGH' : 'NORMAL',
        recipients,
        subject: template.subject,
        message: template.message,
        data: templateData,
        organizationId,
      });

      for (const result of results) {
        if (result.success) {
          sent++;
        } else {
          failed++;
        }
      }

    } catch (error) {
      console.error('[ComplianceNotification] Error sending daily digest:', error);
      failed++;
    }

    return { sent, failed };
  }

  /**
   * Check if we should send a notification for this deadline
   * (prevents notification spam)
   */
  private async shouldSendNotification(deadline: ComplianceDeadline): Promise<boolean> {
    // Don't notify for already resolved deadlines
    if (deadline.resolvedAt !== undefined) {
      return false;
    }
    
    // Don't notify for CURRENT status (no action needed)
    if (deadline.status === 'CURRENT') {
      return false;
    }

    // Check last notification time
    const result = await this.db.query<{ last_notified_at: Date | null; notification_count: number }>(
      `SELECT last_notified_at, notification_count FROM compliance_deadlines WHERE id = $1`,
      [deadline.id]
    );

    if (result.rows.length === 0) {
      return false;
    }

    const { last_notified_at, notification_count } = result.rows[0]!;

    // First notification - always send
    if (last_notified_at === null) {
      return true;
    }

    const hoursSinceLastNotification = (Date.now() - new Date(last_notified_at).getTime()) / (1000 * 60 * 60);

    // For overdue items, notify every 24 hours (max 7 times)
    if (deadline.status === 'OVERDUE') {
      return hoursSinceLastNotification >= 24 && notification_count < 7;
    }

    // For urgent items, notify every 48 hours (max 3 times)
    if (deadline.status === 'DUE_SOON') {
      return hoursSinceLastNotification >= 48 && notification_count < 3;
    }

    // For warning items, notify once
    if (deadline.status === 'UPCOMING') {
      return notification_count === 0;
    }

    return false;
  }

  /**
   * Get recipients for a deadline based on entity type
   */
  private async getRecipientsForDeadline(
    organizationId: UUID,
    deadline: ComplianceDeadline
  ): Promise<NotificationRecipient[]> {
    const recipients: NotificationRecipient[] = [];

    if (deadline.entityType === 'CAREGIVER') {
      // Notify the caregiver
      const caregiver = await this.getCaregiverNotificationInfo(deadline.entityId);
      if (caregiver !== null) {
        recipients.push(this.toNotificationRecipient(caregiver));
      }

      // Notify supervisors for urgent/overdue
      if (deadline.status === 'DUE_SOON' || deadline.status === 'OVERDUE') {
        const supervisors = await this.getSupervisors(organizationId);
        recipients.push(...supervisors.map(s => this.toNotificationRecipient(s)));
      }
    } else if (deadline.entityType === 'CLIENT') {
      // Notify coordinators and care managers
      const coordinators = await this.getCoordinators(organizationId);
      recipients.push(...coordinators.map(c => this.toNotificationRecipient(c)));
    } else if (deadline.entityType === 'CARE_PLAN') {
      // Notify assigned nurse/coordinator
      const assignedStaff = await this.getCarePlanAssignedStaff(deadline.entityId);
      recipients.push(...assignedStaff.map(s => this.toNotificationRecipient(s)));
    }

    return recipients;
  }

  /**
   * Get notification event type and priority based on deadline status
   */
  private getNotificationTypeAndPriority(deadline: ComplianceDeadline): {
    eventType: NotificationEventType;
    priority: NotificationPriority;
  } {
    if (deadline.status === 'OVERDUE') {
      return { eventType: 'COMPLIANCE_DEADLINE_OVERDUE', priority: 'URGENT' };
    }
    if (deadline.status === 'DUE_SOON') {
      return { eventType: 'COMPLIANCE_DEADLINE_URGENT', priority: 'HIGH' };
    }
    return { eventType: 'COMPLIANCE_DEADLINE_WARNING', priority: 'NORMAL' };
  }

  /**
   * Get template data from deadline
   */
  private getTemplateData(deadline: ComplianceDeadline): Record<string, unknown> {
    const now = new Date();
    const deadlineDate = new Date(deadline.deadlineDate);
    const daysRemaining = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const daysOverdue = daysRemaining < 0 ? Math.abs(daysRemaining) : 0;

    return {
      title: deadline.title,
      description: deadline.description,
      entityName: deadline.entityName,
      entityType: deadline.entityType,
      deadlineDate: deadlineDate.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      daysRemaining: Math.max(0, daysRemaining),
      daysOverdue,
      category: deadline.category,
      priority: deadline.priority,
      regulation: deadline.regulation,
      stateCode: deadline.stateCode,
    };
  }

  /**
   * Get entity type for notification
   */
  private getEntityType(entityType: string): 'visit' | 'client' | 'caregiver' | undefined {
    if (entityType === 'CAREGIVER') return 'caregiver';
    if (entityType === 'CLIENT') return 'client';
    return undefined;
  }

  /**
   * Log notification to database
   */
  private async logNotification(entry: NotificationLogEntry): Promise<void> {
    try {
      await this.db.query(
        `INSERT INTO notification_logs (
          organization_id, deadline_id, recipient_id, channel, event_type, success, error, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        ON CONFLICT DO NOTHING`,
        [
          entry.organizationId,
          entry.deadlineId,
          entry.recipientId,
          entry.channel,
          entry.eventType,
          entry.success,
          entry.error ?? null,
        ]
      );
    } catch (error) {
      // Log table might not exist yet - that's okay
      console.debug('[ComplianceNotification] Could not log notification:', error);
    }
  }

  /**
   * Update deadline notification count
   */
  private async updateDeadlineNotificationCount(deadlineId: string): Promise<void> {
    await this.db.query(
      `UPDATE compliance_deadlines 
       SET notification_count = notification_count + 1, 
           last_notified_at = NOW(),
           updated_at = NOW()
       WHERE id = $1`,
      [deadlineId]
    );
  }

  /**
   * Get deadline counts by status
   */
  private async getDeadlineCounts(organizationId: UUID): Promise<{
    overdue: number;
    urgent: number;
    warning: number;
  }> {
    const result = await this.db.query<{ status: string; count: string }>(
      `SELECT status, COUNT(*) as count 
       FROM compliance_deadlines 
       WHERE organization_id = $1 AND resolved_at IS NULL
       GROUP BY status`,
      [organizationId]
    );

    const counts = { overdue: 0, urgent: 0, warning: 0 };
    for (const row of result.rows) {
      if (row.status === 'OVERDUE') counts.overdue = parseInt(row.count, 10);
      if (row.status === 'DUE_SOON') counts.urgent = parseInt(row.count, 10);
      if (row.status === 'UPCOMING') counts.warning = parseInt(row.count, 10);
    }
    return counts;
  }

  /**
   * Get caregiver notification info
   */
  private async getCaregiverNotificationInfo(caregiverId: string): Promise<UserNotificationInfo | null> {
    const result = await this.db.query<{
      id: string;
      email: string;
      first_name: string;
      last_name: string;
    }>(
      `SELECT c.id, c.email, c.first_name, c.last_name
       FROM caregivers c
       WHERE c.id = $1 AND c.deleted_at IS NULL`,
      [caregiverId]
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0]!;
    return {
      userId: row.id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      roles: ['CAREGIVER'],
    };
  }

  /**
   * Get supervisors for an organization
   */
  private async getSupervisors(organizationId: UUID): Promise<UserNotificationInfo[]> {
    const result = await this.db.query<{
      id: string;
      email: string;
      first_name: string;
      last_name: string;
      roles: string[];
    }>(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.roles
       FROM users u
       WHERE u.organization_id = $1 
         AND u.deleted_at IS NULL
         AND u.roles && ARRAY['ORG_ADMIN', 'BRANCH_ADMIN', 'COORDINATOR']::varchar[]`,
      [organizationId]
    );

    return result.rows.map(row => ({
      userId: row.id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      roles: row.roles,
    }));
  }

  /**
   * Get coordinators for an organization
   */
  private async getCoordinators(organizationId: UUID): Promise<UserNotificationInfo[]> {
    const result = await this.db.query<{
      id: string;
      email: string;
      first_name: string;
      last_name: string;
      roles: string[];
    }>(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.roles
       FROM users u
       WHERE u.organization_id = $1 
         AND u.deleted_at IS NULL
         AND 'COORDINATOR' = ANY(u.roles)`,
      [organizationId]
    );

    return result.rows.map(row => ({
      userId: row.id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      roles: row.roles,
    }));
  }

  /**
   * Get staff assigned to a care plan
   */
  private async getCarePlanAssignedStaff(carePlanId: string): Promise<UserNotificationInfo[]> {
    const result = await this.db.query<{
      id: string;
      email: string;
      first_name: string;
      last_name: string;
      roles: string[];
    }>(
      `SELECT DISTINCT u.id, u.email, u.first_name, u.last_name, u.roles
       FROM care_plans cp
       JOIN users u ON u.organization_id = cp.organization_id
       WHERE cp.id = $1 
         AND cp.deleted_at IS NULL
         AND u.deleted_at IS NULL
         AND u.roles && ARRAY['COORDINATOR', 'RN', 'LPN']::varchar[]`,
      [carePlanId]
    );

    return result.rows.map(row => ({
      userId: row.id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      roles: row.roles,
    }));
  }

  /**
   * Get recipients for daily digest (admins and coordinators with digest enabled)
   */
  private async getDigestRecipients(organizationId: UUID): Promise<NotificationRecipient[]> {
    const result = await this.db.query<{
      id: string;
      email: string;
      first_name: string;
      last_name: string;
      roles: string[];
    }>(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.roles
       FROM users u
       WHERE u.organization_id = $1 
         AND u.deleted_at IS NULL
         AND u.roles && ARRAY['ORG_ADMIN', 'BRANCH_ADMIN', 'COORDINATOR']::varchar[]`,
      [organizationId]
    );

    return result.rows.map(row => this.toNotificationRecipient({
      userId: row.id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      roles: row.roles,
    }));
  }

  /**
   * Convert user info to notification recipient
   */
  private toNotificationRecipient(user: UserNotificationInfo): NotificationRecipient {
    // Default to email for compliance notifications
    // Future enhancement: Check user preferences and push token availability
    const preferredChannels: NotificationChannel[] = ['EMAIL'];
    
    return {
      userId: user.userId,
      email: user.email,
      preferredChannels,
    };
  }
}
