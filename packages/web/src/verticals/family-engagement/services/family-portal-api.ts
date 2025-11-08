/**
 * Family Portal API Service
 *
 * API client for family engagement portal endpoints
 */

import type { ApiClient } from '@/core/services';
import type { UUID } from '@care-commons/core/browser';
import type {
  FamilyMember,
  FamilyDashboard,
  ActivityFeedItem,
  Notification,
  MessageThread,
  Message,
  NotificationPreferences,
} from '@care-commons/family-engagement';

const BASE_URL = '/api/family-engagement';

export interface FamilyPortalApiService {
  getFamilyMemberProfile(familyMemberId: UUID): Promise<FamilyMember>;
  getFamilyDashboard(familyMemberId: UUID): Promise<FamilyDashboard>;
  getRecentActivity(familyMemberId: UUID, limit?: number): Promise<ActivityFeedItem[]>;
  getUnreadNotifications(familyMemberId: UUID): Promise<Notification[]>;
  markNotificationAsRead(notificationId: UUID): Promise<void>;
  updateNotificationPreferences(
    familyMemberId: UUID,
    preferences: Partial<NotificationPreferences>
  ): Promise<FamilyMember>;
  getMessageThreads(familyMemberId: UUID): Promise<MessageThread[]>;
  getMessagesInThread(threadId: UUID): Promise<Message[]>;
  sendMessage(threadId: UUID, messageText: string): Promise<Message>;
  createMessageThread(
    familyMemberId: UUID,
    clientId: UUID,
    subject: string,
    initialMessage: string
  ): Promise<MessageThread>;
}

export const createFamilyPortalApiService = (apiClient: ApiClient): FamilyPortalApiService => {
  return {
    /**
     * Get family member profile with statistics
     */
    async getFamilyMemberProfile(familyMemberId: UUID): Promise<FamilyMember> {
      return apiClient.get<FamilyMember>(`${BASE_URL}/family-members/${familyMemberId}`);
    },

    /**
     * Get family dashboard data
     */
    async getFamilyDashboard(familyMemberId: UUID): Promise<FamilyDashboard> {
      return apiClient.get<FamilyDashboard>(`${BASE_URL}/dashboard/family-member/${familyMemberId}`);
    },

    /**
     * Get recent activity feed
     */
    async getRecentActivity(familyMemberId: UUID, limit = 20): Promise<ActivityFeedItem[]> {
      return apiClient.get<ActivityFeedItem[]>(
        `${BASE_URL}/activity-feed/family-member/${familyMemberId}?limit=${limit}`
      );
    },

    /**
     * Get unread notifications
     */
    async getUnreadNotifications(familyMemberId: UUID): Promise<Notification[]> {
      return apiClient.get<Notification[]>(
        `${BASE_URL}/notifications/family-member/${familyMemberId}/unread`
      );
    },

    /**
     * Mark notification as read
     */
    async markNotificationAsRead(notificationId: UUID): Promise<void> {
      await apiClient.patch<void>(`${BASE_URL}/notifications/${notificationId}/read`);
    },

    /**
     * Update notification preferences
     */
    async updateNotificationPreferences(
      familyMemberId: UUID,
      preferences: Partial<NotificationPreferences>
    ): Promise<FamilyMember> {
      return apiClient.patch<FamilyMember>(
        `${BASE_URL}/family-members/${familyMemberId}/preferences`,
        preferences
      );
    },

    /**
     * Get message threads for family member
     */
    async getMessageThreads(familyMemberId: UUID): Promise<MessageThread[]> {
      return apiClient.get<MessageThread[]>(
        `${BASE_URL}/messages/family-member/${familyMemberId}/threads`
      );
    },

    /**
     * Get messages in a thread
     */
    async getMessagesInThread(threadId: UUID): Promise<Message[]> {
      return apiClient.get<Message[]>(`${BASE_URL}/messages/threads/${threadId}/messages`);
    },

    /**
     * Send message in thread
     */
    async sendMessage(threadId: UUID, messageText: string): Promise<Message> {
      return apiClient.post<Message>(`${BASE_URL}/messages/threads/${threadId}/messages`, {
        messageText,
        senderType: 'FAMILY',
      });
    },

    /**
     * Create new message thread
     */
    async createMessageThread(
      familyMemberId: UUID,
      clientId: UUID,
      subject: string,
      initialMessage: string
    ): Promise<MessageThread> {
      return apiClient.post<MessageThread>(`${BASE_URL}/messages/threads`, {
        familyMemberId,
        clientId,
        subject,
        initialMessage,
        priority: 'NORMAL',
      });
    },
  };
};
