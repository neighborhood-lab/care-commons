/**
 * Analytics API Service
 */

import type { ApiClient } from '@/core/api/api-client';
import type { OperationalKPIs, ComplianceAlert, DashboardStats, AnalyticsFilters } from '../types';

export function createAnalyticsApiService(apiClient: ApiClient) {
  return {
    /**
     * Get operational KPIs
     */
    getKPIs: async (filters?: AnalyticsFilters): Promise<OperationalKPIs> => {
      const params = new URLSearchParams();

      if (filters?.organizationId) params.append('organizationId', filters.organizationId);
      if (filters?.branchId) params.append('branchId', filters.branchId);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);

      const response = await apiClient.get(`/api/analytics/kpis?${params.toString()}`);
      return response.data;
    },

    /**
     * Get compliance alerts
     */
    getComplianceAlerts: async (filters?: AnalyticsFilters): Promise<ComplianceAlert[]> => {
      const params = new URLSearchParams();

      if (filters?.organizationId) params.append('organizationId', filters.organizationId);
      if (filters?.branchId) params.append('branchId', filters.branchId);

      const response = await apiClient.get(`/api/analytics/compliance-alerts?${params.toString()}`);
      return response.data;
    },

    /**
     * Get dashboard stats
     */
    getDashboardStats: async (filters?: AnalyticsFilters): Promise<DashboardStats> => {
      const params = new URLSearchParams();

      if (filters?.organizationId) params.append('organizationId', filters.organizationId);
      if (filters?.branchId) params.append('branchId', filters.branchId);

      const response = await apiClient.get(`/api/analytics/dashboard-stats?${params.toString()}`);
      return response.data;
    },
  };
}

export type AnalyticsApiService = ReturnType<typeof createAnalyticsApiService>;
