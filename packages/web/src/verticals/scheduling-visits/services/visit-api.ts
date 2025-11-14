import type { ApiClient } from '@/core/services';
import type { Visit, VisitSearchFilters } from '../types';

export interface VisitApiResponse {
  success: boolean;
  data: Visit[];
  meta: {
    startDate: string;
    endDate: string;
    count: number;
  };
}

export interface VisitApiService {
  getMyVisits(startDate: Date, endDate: Date): Promise<Visit[]>;
  getVisitsByFilters(filters: VisitSearchFilters): Promise<Visit[]>;
}

export const createVisitApiService = (apiClient: ApiClient): VisitApiService => {
  return {
    async getMyVisits(startDate: Date, endDate: Date): Promise<Visit[]> {
      const params = new URLSearchParams();
      params.append('start_date', startDate.toISOString().split('T')[0]!); // YYYY-MM-DD
      params.append('end_date', endDate.toISOString().split('T')[0]!); // YYYY-MM-DD

      const response = await apiClient.get<VisitApiResponse>(
        `/api/visits/my-visits?${params.toString()}`
      );

      return response.data;
    },

    async getVisitsByFilters(filters: VisitSearchFilters): Promise<Visit[]> {
      // For now, this uses the my-visits endpoint with date filtering
      // In the future, this could be expanded to support more complex filters
      const startDate = filters.dateFrom ?? new Date();
      const endDate = filters.dateTo ?? new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days ahead

      return this.getMyVisits(startDate, endDate);
    },
  };
};
