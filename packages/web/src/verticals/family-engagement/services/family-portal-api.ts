/**
 * Family Portal API Service
 *
 * API client for family engagement portal endpoints
 */

import type {
  FamilyMember,
  FamilyDashboard,
  ActivityFeedItem,
  Notification,
  MessageThread,
  Message,
  NotificationPreferences,
  UUID,
} from '@care-commons/family-engagement';
import { apiClient } from '../../../core/services/api-client';

const BASE_URL = '/api/family-engagement';

export const familyPortalApi = {
  /**
   * Get family member profile with statistics
   */
  async getFamilyMemberProfile(familyMemberId: UUID): Promise<FamilyMember> {
    const response = await apiClient.get(`${BASE_URL}/family-members/${familyMemberId}`);
    return response.data;
  },

  /**
   * Get family dashboard data
   */
  async getFamilyDashboard(familyMemberId: UUID): Promise<FamilyDashboard> {
    const response = await apiClient.get(`${BASE_URL}/dashboard/family-member/${familyMemberId}`);
    return response.data;
  },

  /**
   * Get recent activity feed
   */
  async getRecentActivity(familyMemberId: UUID, limit = 20): Promise<ActivityFeedItem[]> {
    const response = await apiClient.get(
      `${BASE_URL}/activity-feed/family-member/${familyMemberId}?limit=${limit}`
    );
    return response.data;
  },

  /**
   * Get unread notifications
   */
  async getUnreadNotifications(familyMemberId: UUID): Promise<Notification[]> {
    const response = await apiClient.get(
      `${BASE_URL}/notifications/family-member/${familyMemberId}/unread`
    );
    return response.data;
  },

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: UUID): Promise<void> {
    await apiClient.patch(`${BASE_URL}/notifications/${notificationId}/read`);
  },

  /**
   * Update notification preferences
   */
  async updateNotificationPreferences(
    familyMemberId: UUID,
    preferences: Partial<NotificationPreferences>
  ): Promise<FamilyMember> {
    const response = await apiClient.patch(
      `${BASE_URL}/family-members/${familyMemberId}/preferences`,
      preferences
    );
    return response.data;
  },

  /**
   * Get message threads for family member
   */
  async getMessageThreads(familyMemberId: UUID): Promise<MessageThread[]> {
    const response = await apiClient.get(
      `${BASE_URL}/messages/family-member/${familyMemberId}/threads`
    );
    return response.data;
  },

  /**
   * Get messages in a thread
   */
  async getMessagesInThread(threadId: UUID): Promise<Message[]> {
    const response = await apiClient.get(`${BASE_URL}/messages/threads/${threadId}/messages`);
    return response.data;
  },

  /**
   * Send message in thread
   */
  async sendMessage(threadId: UUID, messageText: string): Promise<Message> {
    const response = await apiClient.post(`${BASE_URL}/messages/threads/${threadId}/messages`, {
      messageText,
      senderType: 'FAMILY',
    });
    return response.data;
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
    const response = await apiClient.post(`${BASE_URL}/messages/threads`, {
      familyMemberId,
      clientId,
      subject,
      initialMessage,
      priority: 'NORMAL',
    });
    return response.data;
  },
};
