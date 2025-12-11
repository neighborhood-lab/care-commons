/**
 * Shift Swap Service
 *
 * Manages shift swap requests between caregivers.
 * Features:
 * - View available shifts for swap
 * - Request to swap shifts with other caregivers
 * - Accept/decline incoming swap requests
 * - Track swap request status
 * - Offline-first with AsyncStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const SHIFT_SWAP_REQUESTS_KEY = '@folkcare_shift_swap_requests';
const AVAILABLE_SHIFTS_KEY = '@folkcare_available_shifts';

export type SwapStatus = 'pending' | 'accepted' | 'declined' | 'cancelled' | 'completed';

export interface Shift {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  clientName: string;
  clientAddress: string;
  caregiverId: string;
  caregiverName: string;
  services: string[];
}

export interface ShiftSwapRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  targetCaregiverId: string;
  targetCaregiverName: string;
  requesterShiftId: string;
  requesterShift: Shift;
  targetShiftId: string;
  targetShift: Shift;
  reason: string;
  status: SwapStatus;
  createdAt: string;
  updatedAt: string;
  responseNote?: string;
}

export interface AvailableShift extends Shift {
  isAvailableForSwap: boolean;
  swapNote?: string;
}

export class ShiftSwapService {
  private currentUserId = 'caregiver_1'; // Mock current user
  private currentUserName = 'Maria Garcia';

  /**
   * Get all swap requests (sent and received)
   */
  async getAllSwapRequests(): Promise<ShiftSwapRequest[]> {
    const requestsStr = await AsyncStorage.getItem(SHIFT_SWAP_REQUESTS_KEY);
    if (!requestsStr) {
      return [];
    }
    return JSON.parse(requestsStr);
  }

  /**
   * Get swap requests sent by current user
   */
  async getSentRequests(): Promise<ShiftSwapRequest[]> {
    const all = await this.getAllSwapRequests();
    return all.filter((r) => r.requesterId === this.currentUserId);
  }

  /**
   * Get swap requests received by current user
   */
  async getReceivedRequests(): Promise<ShiftSwapRequest[]> {
    const all = await this.getAllSwapRequests();
    return all.filter((r) => r.targetCaregiverId === this.currentUserId);
  }

  /**
   * Get pending received requests (need response)
   */
  async getPendingReceivedRequests(): Promise<ShiftSwapRequest[]> {
    const received = await this.getReceivedRequests();
    return received.filter((r) => r.status === 'pending');
  }

  /**
   * Get shifts available for swap from other caregivers
   */
  async getAvailableShiftsForSwap(): Promise<AvailableShift[]> {
    const shiftsStr = await AsyncStorage.getItem(AVAILABLE_SHIFTS_KEY);
    if (!shiftsStr) {
      // Return mock data for demo
      return this.getMockAvailableShifts();
    }
    return JSON.parse(shiftsStr);
  }

  /**
   * Get current user's shifts that can be offered for swap
   */
  async getMyShiftsForSwap(): Promise<Shift[]> {
    // Mock data for demo
    return [
      {
        id: 'shift_my_1',
        date: this.getFutureDate(1),
        startTime: '09:00',
        endTime: '13:00',
        clientName: 'Robert Johnson',
        clientAddress: '123 Main St, Austin, TX',
        caregiverId: this.currentUserId,
        caregiverName: this.currentUserName,
        services: ['Personal Care', 'Medication'],
      },
      {
        id: 'shift_my_2',
        date: this.getFutureDate(2),
        startTime: '14:00',
        endTime: '18:00',
        clientName: 'Susan Williams',
        clientAddress: '456 Oak Ave, Austin, TX',
        caregiverId: this.currentUserId,
        caregiverName: this.currentUserName,
        services: ['Meal Prep', 'Companionship'],
      },
      {
        id: 'shift_my_3',
        date: this.getFutureDate(4),
        startTime: '08:00',
        endTime: '16:00',
        clientName: 'James Brown',
        clientAddress: '789 Elm Dr, Austin, TX',
        caregiverId: this.currentUserId,
        caregiverName: this.currentUserName,
        services: ['Personal Care', 'Light Housekeeping'],
      },
    ];
  }

  /**
   * Submit a shift swap request
   */
  async submitSwapRequest(
    myShiftId: string,
    targetShiftId: string,
    reason: string
  ): Promise<ShiftSwapRequest> {
    const myShifts = await this.getMyShiftsForSwap();
    const availableShifts = await this.getAvailableShiftsForSwap();

    const myShift = myShifts.find((s) => s.id === myShiftId);
    const targetShift = availableShifts.find((s) => s.id === targetShiftId);

    if (!myShift || !targetShift) {
      throw new Error('Invalid shift selection');
    }

    const now = new Date().toISOString();
    const request: ShiftSwapRequest = {
      id: `swap_${Date.now()}`,
      requesterId: this.currentUserId,
      requesterName: this.currentUserName,
      targetCaregiverId: targetShift.caregiverId,
      targetCaregiverName: targetShift.caregiverName,
      requesterShiftId: myShiftId,
      requesterShift: myShift,
      targetShiftId: targetShiftId,
      targetShift: targetShift,
      reason,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    const requests = await this.getAllSwapRequests();
    requests.unshift(request);
    await AsyncStorage.setItem(SHIFT_SWAP_REQUESTS_KEY, JSON.stringify(requests));

    return request;
  }

  /**
   * Accept a swap request
   */
  async acceptSwapRequest(requestId: string, note?: string): Promise<boolean> {
    const requests = await this.getAllSwapRequests();
    const index = requests.findIndex((r) => r.id === requestId);

    if (index === -1 || requests[index].status !== 'pending') {
      return false;
    }

    requests[index].status = 'accepted';
    requests[index].updatedAt = new Date().toISOString();
    if (note) {
      requests[index].responseNote = note;
    }

    await AsyncStorage.setItem(SHIFT_SWAP_REQUESTS_KEY, JSON.stringify(requests));
    return true;
  }

  /**
   * Decline a swap request
   */
  async declineSwapRequest(requestId: string, note?: string): Promise<boolean> {
    const requests = await this.getAllSwapRequests();
    const index = requests.findIndex((r) => r.id === requestId);

    if (index === -1 || requests[index].status !== 'pending') {
      return false;
    }

    requests[index].status = 'declined';
    requests[index].updatedAt = new Date().toISOString();
    if (note) {
      requests[index].responseNote = note;
    }

    await AsyncStorage.setItem(SHIFT_SWAP_REQUESTS_KEY, JSON.stringify(requests));
    return true;
  }

  /**
   * Cancel a sent swap request
   */
  async cancelSwapRequest(requestId: string): Promise<boolean> {
    const requests = await this.getAllSwapRequests();
    const index = requests.findIndex((r) => r.id === requestId);

    if (
      index === -1 ||
      requests[index].status !== 'pending' ||
      requests[index].requesterId !== this.currentUserId
    ) {
      return false;
    }

    requests[index].status = 'cancelled';
    requests[index].updatedAt = new Date().toISOString();

    await AsyncStorage.setItem(SHIFT_SWAP_REQUESTS_KEY, JSON.stringify(requests));
    return true;
  }

  /**
   * Post a shift as available for swap
   */
  async postShiftForSwap(shiftId: string, note?: string): Promise<void> {
    const myShifts = await this.getMyShiftsForSwap();
    const shift = myShifts.find((s) => s.id === shiftId);

    if (!shift) {
      throw new Error('Shift not found');
    }

    const availableShifts = await this.getAvailableShiftsForSwap();
    const availableShift: AvailableShift = {
      ...shift,
      isAvailableForSwap: true,
      swapNote: note,
    };

    availableShifts.push(availableShift);
    await AsyncStorage.setItem(AVAILABLE_SHIFTS_KEY, JSON.stringify(availableShifts));
  }

  /**
   * Get status display info
   */
  getStatusInfo(status: SwapStatus): { label: string; color: string } {
    const info: Record<SwapStatus, { label: string; color: string }> = {
      pending: { label: 'Pending', color: '#F59E0B' },
      accepted: { label: 'Accepted', color: '#10B981' },
      declined: { label: 'Declined', color: '#EF4444' },
      cancelled: { label: 'Cancelled', color: '#6B7280' },
      completed: { label: 'Completed', color: '#3B82F6' },
    };
    return info[status];
  }

  /**
   * Format shift time range
   */
  formatShiftTime(shift: Shift): string {
    return `${shift.startTime} - ${shift.endTime}`;
  }

  /**
   * Format shift date
   */
  formatShiftDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }

  /**
   * Get future date string (for mock data)
   */
  private getFutureDate(daysAhead: number): string {
    const date = new Date();
    date.setDate(date.getDate() + daysAhead);
    return date.toISOString().split('T')[0];
  }

  /**
   * Get mock available shifts for demo
   */
  private getMockAvailableShifts(): AvailableShift[] {
    return [
      {
        id: 'shift_avail_1',
        date: this.getFutureDate(1),
        startTime: '14:00',
        endTime: '18:00',
        clientName: 'Elizabeth Taylor',
        clientAddress: '321 Pine St, Austin, TX',
        caregiverId: 'caregiver_2',
        caregiverName: 'John Smith',
        services: ['Personal Care', 'Meal Prep'],
        isAvailableForSwap: true,
        swapNote: 'Have a doctor appointment',
      },
      {
        id: 'shift_avail_2',
        date: this.getFutureDate(2),
        startTime: '08:00',
        endTime: '12:00',
        clientName: 'Michael Davis',
        clientAddress: '654 Maple Rd, Austin, TX',
        caregiverId: 'caregiver_3',
        caregiverName: 'Sarah Johnson',
        services: ['Medication', 'Companionship'],
        isAvailableForSwap: true,
        swapNote: 'Family event',
      },
      {
        id: 'shift_avail_3',
        date: this.getFutureDate(3),
        startTime: '10:00',
        endTime: '14:00',
        clientName: 'Patricia Wilson',
        clientAddress: '987 Cedar Ln, Austin, TX',
        caregiverId: 'caregiver_4',
        caregiverName: 'Emily Brown',
        services: ['Light Housekeeping', 'Meal Prep'],
        isAvailableForSwap: true,
      },
      {
        id: 'shift_avail_4',
        date: this.getFutureDate(5),
        startTime: '16:00',
        endTime: '20:00',
        clientName: 'David Anderson',
        clientAddress: '147 Birch Ave, Austin, TX',
        caregiverId: 'caregiver_2',
        caregiverName: 'John Smith',
        services: ['Personal Care'],
        isAvailableForSwap: true,
        swapNote: 'Overtime - would prefer to swap',
      },
    ];
  }

  /**
   * Clear all data (for testing/reset)
   */
  async clearAllData(): Promise<void> {
    await AsyncStorage.removeItem(SHIFT_SWAP_REQUESTS_KEY);
    await AsyncStorage.removeItem(AVAILABLE_SHIFTS_KEY);
  }
}

export const shiftSwapService = new ShiftSwapService();
