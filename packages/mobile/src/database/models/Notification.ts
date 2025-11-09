/**
 * Notification Model - WatermelonDB model for push notifications
 */

import { Model } from '@nozbe/watermelondb';
import { field, readonly, date, json } from '@nozbe/watermelondb/decorators';

export type NotificationType = 'visit_reminder' | 'message' | 'schedule_change' | 'system';
export type NotificationPriority = 'low' | 'normal' | 'high';
export type EntityType = 'visit' | 'message' | 'schedule';

export interface ActionData {
  screen?: string;
  params?: Record<string, unknown>;
  url?: string;
}

export class Notification extends Model {
  static table = 'notifications';

  @field('notification_id') notificationId!: string;
  @field('user_id') userId!: string;
  @field('organization_id') organizationId!: string;

  // Notification content
  @field('title') title!: string;
  @field('body') body!: string;
  @field('notification_type') notificationType!: NotificationType;
  @field('priority') priority!: NotificationPriority;

  // Related entities
  @field('related_entity_type') relatedEntityType!: EntityType | null;
  @field('related_entity_id') relatedEntityId!: string | null;

  // Action data
  @json('action_data_json', (json: unknown) => json) actionData!: ActionData | null;

  // Status
  @field('is_read') isRead!: boolean;
  @date('read_at') readAt!: Date | null;
  @field('is_dismissed') isDismissed!: boolean;
  @date('dismissed_at') dismissedAt!: Date | null;

  // Scheduling
  @date('scheduled_for') scheduledFor!: Date | null;
  @date('sent_at') sentAt!: Date | null;
  @date('received_at') receivedAt!: Date | null;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
