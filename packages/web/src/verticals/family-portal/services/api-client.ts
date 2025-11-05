/**
 * Family Portal API Client
 */

const API_BASE = '/api/family-portal';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class FamilyPortalApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('family_portal_token', token);
    } else {
      localStorage.removeItem('family_portal_token');
    }
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('family_portal_token');
    }
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    return data;
  }

  // Auth
  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async refreshToken(refreshToken: string) {
    return this.request('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  }

  async getProfile() {
    return this.request('/auth/me');
  }

  async updateProfile(updates: any) {
    return this.request('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.request('/auth/password/change', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  async requestPasswordReset(email: string) {
    return this.request('/auth/password/reset-request', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, newPassword: string) {
    return this.request('/auth/password/reset', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  }

  // Invitations
  async verifyInvitation(token: string) {
    return this.request(`/invitations/verify/${token}`);
  }

  async acceptInvitation(data: {
    token: string;
    password: string;
    firstName: string;
    lastName: string;
  }) {
    return this.request('/invitations/accept', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Dashboard
  async getDashboard() {
    return this.request('/dashboard');
  }

  // Chat
  async sendMessage(message: string, conversationId?: string, includeContext?: any) {
    return this.request('/chat/messages', {
      method: 'POST',
      body: JSON.stringify({ message, conversationId, includeContext }),
    });
  }

  async getConversations(isActive?: boolean) {
    const query = isActive !== undefined ? `?isActive=${isActive}` : '';
    return this.request(`/chat/conversations${query}`);
  }

  async getMessages(conversationId: string, limit: number = 50) {
    return this.request(`/chat/conversations/${conversationId}/messages?limit=${limit}`);
  }

  async archiveConversation(conversationId: string) {
    return this.request(`/chat/conversations/${conversationId}/archive`, {
      method: 'POST',
    });
  }

  // Notifications
  async getNotifications(params?: any) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/notifications${query ? `?${query}` : ''}`);
  }

  async getNotificationSummary() {
    return this.request('/notifications/summary');
  }

  async markNotificationAsRead(id: string) {
    return this.request(`/notifications/${id}/read`, {
      method: 'PUT',
    });
  }

  async markMultipleAsRead(notificationIds: string[]) {
    return this.request('/notifications/mark-read', {
      method: 'POST',
      body: JSON.stringify({ notificationIds }),
    });
  }

  async markAllAsRead() {
    return this.request('/notifications/mark-all-read', {
      method: 'POST',
    });
  }

  async dismissNotification(id: string) {
    return this.request(`/notifications/${id}`, {
      method: 'DELETE',
    });
  }
}

export const familyPortalApi = new FamilyPortalApiClient();
