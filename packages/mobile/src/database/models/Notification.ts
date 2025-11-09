/**
 * Notification Model
 *
 * Represents push notifications for visit reminders, messages, etc.
 */

import { Model } from '@nozbe/watermelondb';
import { field, readonly, date } from '@nozbe/watermelondb/decorators';

export class Notification extends Model {
  static table = 'notifications';

  @field('notification_type') notificationType!: 'VISIT_REMINDER' | 'MESSAGE' | 'SCHEDULE_CHANGE' | 'SYSTEM';
  @field('title') title!: string;
  @field('body') body!: string;
  @field('data_json') dataJson?: string;

  // Related entities
  @field('visit_id') visitId?: string;
  @field('user_id') userId!: string;

  // Scheduling
  @field('scheduled_at') scheduledAt?: number;
  @field('delivered_at') deliveredAt?: number;

  // Status
  @field('status') status!: 'PENDING' | 'SCHEDULED' | 'DELIVERED' | 'READ' | 'DISMISSED';
  @field('is_read') isRead!: boolean;

  // Timestamps
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  /**
   * Get parsed notification data
   */
  get data(): Record<string, unknown> | null {
    if (!this.dataJson) return null;
    try {
      return JSON.parse(this.dataJson) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  /**
   * Mark notification as read
   */
  markAsRead() {
    return this.update(() => {
      this.isRead = true;
      this.status = 'READ';
    });
  }

  /**
   * Dismiss notification
   */
  dismiss() {
    return this.update(() => {
      this.status = 'DISMISSED';
    });
  }
}
