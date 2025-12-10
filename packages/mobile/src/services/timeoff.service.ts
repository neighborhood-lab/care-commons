/**
 * Time-Off Request Service
 *
 * Manages PTO/time-off requests for caregivers.
 * Features:
 * - Submit time-off requests
 * - View request history and status
 * - Cancel pending requests
 * - Offline-first with AsyncStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const TIMEOFF_REQUESTS_KEY = '@folkcare_timeoff_requests';

export type TimeOffType = 'vacation' | 'sick' | 'personal' | 'bereavement' | 'other';
export type TimeOffStatus = 'pending' | 'approved' | 'denied' | 'cancelled';

export interface TimeOffRequest {
  id: string;
  type: TimeOffType;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  reason: string;
  status: TimeOffStatus;
  createdAt: string;
  updatedAt: string;
  reviewedBy?: string;
  reviewNote?: string;
}

export interface TimeOffBalance {
  vacation: number;
  sick: number;
  personal: number;
  used: {
    vacation: number;
    sick: number;
    personal: number;
  };
}

export class TimeOffService {
  /**
   * Calculate number of days between two dates (inclusive)
   */
  private calculateDays(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  }

  /**
   * Get all time-off requests
   */
  async getAllRequests(): Promise<TimeOffRequest[]> {
    const requestsStr = await AsyncStorage.getItem(TIMEOFF_REQUESTS_KEY);
    if (!requestsStr) {
      return [];
    }
    return JSON.parse(requestsStr);
  }

  /**
   * Get requests by status
   */
  async getRequestsByStatus(status: TimeOffStatus): Promise<TimeOffRequest[]> {
    const allRequests = await this.getAllRequests();
    return allRequests.filter((r) => r.status === status);
  }

  /**
   * Get pending requests
   */
  async getPendingRequests(): Promise<TimeOffRequest[]> {
    return this.getRequestsByStatus('pending');
  }

  /**
   * Get approved requests
   */
  async getApprovedRequests(): Promise<TimeOffRequest[]> {
    return this.getRequestsByStatus('approved');
  }

  /**
   * Get upcoming approved time off (in the future)
   */
  async getUpcomingTimeOff(): Promise<TimeOffRequest[]> {
    const approved = await this.getApprovedRequests();
    const today = new Date().toISOString().split('T')[0];
    return approved.filter((r) => r.startDate >= today);
  }

  /**
   * Submit a new time-off request
   */
  async submitRequest(
    type: TimeOffType,
    startDate: string,
    endDate: string,
    reason: string
  ): Promise<TimeOffRequest> {
    const now = new Date().toISOString();
    const request: TimeOffRequest = {
      id: `timeoff_${Date.now()}`,
      type,
      startDate,
      endDate,
      reason,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    const requests = await this.getAllRequests();
    requests.unshift(request);
    await AsyncStorage.setItem(TIMEOFF_REQUESTS_KEY, JSON.stringify(requests));

    return request;
  }

  /**
   * Cancel a pending request
   */
  async cancelRequest(requestId: string): Promise<boolean> {
    const requests = await this.getAllRequests();
    const index = requests.findIndex((r) => r.id === requestId);

    if (index === -1) {
      return false;
    }

    if (requests[index].status !== 'pending') {
      return false; // Can only cancel pending requests
    }

    requests[index].status = 'cancelled';
    requests[index].updatedAt = new Date().toISOString();

    await AsyncStorage.setItem(TIMEOFF_REQUESTS_KEY, JSON.stringify(requests));
    return true;
  }

  /**
   * Get a single request by ID
   */
  async getRequest(requestId: string): Promise<TimeOffRequest | null> {
    const requests = await this.getAllRequests();
    return requests.find((r) => r.id === requestId) || null;
  }

  /**
   * Get time-off balance (mock data for demo)
   * In production, this would come from the backend
   */
  async getBalance(): Promise<TimeOffBalance> {
    const requests = await this.getAllRequests();
    const approved = requests.filter((r) => r.status === 'approved');

    const used = {
      vacation: 0,
      sick: 0,
      personal: 0,
    };

    for (const request of approved) {
      const days = this.calculateDays(request.startDate, request.endDate);
      if (request.type === 'vacation' || request.type === 'sick' || request.type === 'personal') {
        used[request.type] += days;
      }
    }

    // Mock balance - in production this would come from HR system
    return {
      vacation: 15, // 15 days/year
      sick: 10, // 10 days/year
      personal: 3, // 3 days/year
      used,
    };
  }

  /**
   * Check if dates overlap with existing approved time-off
   */
  async hasOverlap(startDate: string, endDate: string, excludeId?: string): Promise<boolean> {
    const approved = await this.getApprovedRequests();
    const pending = await this.getPendingRequests();
    const existingRequests = [...approved, ...pending].filter((r) => r.id !== excludeId);

    for (const request of existingRequests) {
      // Check for overlap
      if (startDate <= request.endDate && endDate >= request.startDate) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get requests in a date range
   */
  async getRequestsInRange(startDate: string, endDate: string): Promise<TimeOffRequest[]> {
    const allRequests = await this.getAllRequests();
    return allRequests.filter((r) => {
      return r.startDate <= endDate && r.endDate >= startDate;
    });
  }

  /**
   * Delete a request (for testing/demo)
   */
  async deleteRequest(requestId: string): Promise<void> {
    const requests = await this.getAllRequests();
    const filtered = requests.filter((r) => r.id !== requestId);
    await AsyncStorage.setItem(TIMEOFF_REQUESTS_KEY, JSON.stringify(filtered));
  }

  /**
   * Clear all data (for testing/reset)
   */
  async clearAllData(): Promise<void> {
    await AsyncStorage.removeItem(TIMEOFF_REQUESTS_KEY);
  }

  /**
   * Format date for display
   */
  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  /**
   * Format date range for display
   */
  formatDateRange(startDate: string, endDate: string): string {
    if (startDate === endDate) {
      return this.formatDate(startDate);
    }
    return `${this.formatDate(startDate)} - ${this.formatDate(endDate)}`;
  }

  /**
   * Get type display name
   */
  getTypeLabel(type: TimeOffType): string {
    const labels: Record<TimeOffType, string> = {
      vacation: 'Vacation',
      sick: 'Sick Leave',
      personal: 'Personal',
      bereavement: 'Bereavement',
      other: 'Other',
    };
    return labels[type];
  }

  /**
   * Get status display info
   */
  getStatusInfo(status: TimeOffStatus): { label: string; color: string } {
    const info: Record<TimeOffStatus, { label: string; color: string }> = {
      pending: { label: 'Pending', color: '#F59E0B' },
      approved: { label: 'Approved', color: '#10B981' },
      denied: { label: 'Denied', color: '#EF4444' },
      cancelled: { label: 'Cancelled', color: '#6B7280' },
    };
    return info[status];
  }
}

export const timeOffService = new TimeOffService();
