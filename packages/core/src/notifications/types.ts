/**
 * Notification types and interfaces
 */

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
  id: string;
  userId: string;
  organizationId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  readAt?: Date;
  deletedAt?: Date;
}

export interface CreateNotificationInput {
  userId: string;
  organizationId: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationFilters {
  isRead?: boolean;
  type?: NotificationType;
  startDate?: Date;
  endDate?: Date;
}

export interface NotificationListOptions extends NotificationFilters {
  page?: number;
  limit?: number;
  sortBy?: 'created_at' | 'read_at';
  sortOrder?: 'asc' | 'desc';
}
