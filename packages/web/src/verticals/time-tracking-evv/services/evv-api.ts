import type { ApiClient } from '@/core/services';
import type { EVVRecord, EVVSearchFilters, EVVListResponse } from '../types';

export interface EVVApiService {
  getEVVRecords(filters?: EVVSearchFilters): Promise<EVVListResponse>;
  getEVVRecordById(id: string): Promise<EVVRecord>;
  clockIn(
    visitId: string,
    data: {
      gpsCoordinates?: { latitude: number; longitude: number };
      verificationMethod: string;
    }
  ): Promise<EVVRecord>;
  clockOut(
    id: string,
    data: {
      gpsCoordinates?: { latitude: number; longitude: number };
      notes?: string;
    }
  ): Promise<EVVRecord>;
}

export const createEVVApiService = (apiClient: ApiClient): EVVApiService => {
  return {
    getEVVRecords: async (filters?: EVVSearchFilters) => {
      const queryParams = new URLSearchParams();

      if (filters?.caregiverId) queryParams.append('caregiverId', filters.caregiverId);
      if (filters?.clientId) queryParams.append('clientId', filters.clientId);
      if (filters?.status) queryParams.append('status', filters.status);
      if (filters?.startDate) queryParams.append('startDate', filters.startDate);
      if (filters?.endDate) queryParams.append('endDate', filters.endDate);
      if (filters?.verificationMethod)
        queryParams.append('verificationMethod', filters.verificationMethod);

      const url = `/api/evv${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      return apiClient.get<EVVListResponse>(url);
    },

    getEVVRecordById: async (id: string) => {
      return apiClient.get<EVVRecord>(`/api/evv/${id}`);
    },

    clockIn: async (visitId: string, data) => {
      return apiClient.post<EVVRecord>(`/api/evv/clock-in`, {
        visitId,
        ...data,
      });
    },

    clockOut: async (id: string, data) => {
      return apiClient.post<EVVRecord>(`/api/evv/${id}/clock-out`, data);
    },
  };
};
