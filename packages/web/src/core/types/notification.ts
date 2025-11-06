/**
 * Notification types for frontend
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
  createdAt: string; // ISO date string from API
  readAt?: string; // ISO date string from API
}

export interface NotificationListResponse {
  items: Notification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UnreadCountResponse {
  count: number;
}

export interface NotificationFilters {
  isRead?: boolean;
  type?: NotificationType;
  page?: number;
  limit?: number;
}
