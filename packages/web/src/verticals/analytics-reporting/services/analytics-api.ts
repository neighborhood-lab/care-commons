/**
 * Analytics API Client
 * Frontend API client for analytics and reporting
 */

import { apiClient } from '../../../core/services/api-client';

export interface DateRange {
  startDate: string; // ISO date string
  endDate: string;
}

export interface OperationalKPIs {
  visits: {
    scheduled: number;
    completed: number;
    missed: number;
    inProgress: number;
    completionRate: number;
  };
  evvCompliance: {
    compliantVisits: number;
    totalVisits: number;
    complianceRate: number;
    flaggedVisits: number;
    pendingReview: number;
  };
  revenueMetrics: {
    billableHours: number;
    billedAmount: number;
    paidAmount: number;
    outstandingAR: number;
    averageReimbursementRate: number;
  };
  staffing: {
    activeCaregivers: number;
    utilizationRate: number;
    overtimeHours: number;
    credentialExpirations: number;
  };
  clientMetrics: {
    activeClients: number;
    newClients: number;
    dischargedClients: number;
    highRiskClients: number;
    overdueAssessments: number;
  };
}

export interface ComplianceAlert {
  type: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'WARNING' | 'INFO';
  count: number;
  message: string;
  actionRequired: string;
  dueDate?: string;
}

export interface RevenueTrendDataPoint {
  month: string;
  year: number;
  billed: number;
  paid: number;
  outstanding: number;
}

export interface VisitException {
  id: string;
  visitId: string;
  caregiverId: string;
  caregiverName: string;
  clientId: string;
  clientName: string;
  visitDate: string;
  exceptionType: string;
  description: string;
  severity: string;
  status: string;
  complianceFlags: string[];
}

export interface DashboardStats {
  inProgress: number;
  completedToday: number;
  upcoming: number;
  needsReview: number;
}

export const analyticsApi = {
  /**
   * Get operational KPIs
   */
  async getKPIs(params?: {
    organizationId?: string;
    branchId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<OperationalKPIs> {
    const response = await apiClient.get('/analytics/kpis', { params });
    return response.data;
  },

  /**
   * Get compliance alerts
   */
  async getComplianceAlerts(params?: {
    organizationId?: string;
    branchId?: string;
  }): Promise<ComplianceAlert[]> {
    const response = await apiClient.get('/analytics/compliance-alerts', { params });
    return response.data;
  },

  /**
   * Get revenue trends
   */
  async getRevenueTrends(params?: {
    organizationId?: string;
    branchId?: string;
    months?: number;
  }): Promise<RevenueTrendDataPoint[]> {
    const response = await apiClient.get('/analytics/revenue-trends', { params });
    return response.data;
  },

  /**
   * Get caregiver performance
   */
  async getCaregiverPerformance(
    caregiverId: string,
    params?: {
      startDate?: string;
      endDate?: string;
    }
  ): Promise<any> {
    const response = await apiClient.get(`/analytics/caregiver-performance/${caregiverId}`, { params });
    return response.data;
  },

  /**
   * Get EVV exceptions
   */
  async getEVVExceptions(params?: {
    organizationId?: string;
    branchId?: string;
  }): Promise<VisitException[]> {
    const response = await apiClient.get('/analytics/evv-exceptions', { params });
    return response.data;
  },

  /**
   * Get dashboard stats
   */
  async getDashboardStats(params?: {
    organizationId?: string;
    branchId?: string;
  }): Promise<DashboardStats> {
    const response = await apiClient.get('/analytics/dashboard-stats', { params });
    return response.data;
  },

  /**
   * Generate EVV compliance report
   */
  async generateEVVComplianceReport(data: {
    organizationId?: string;
    branchId?: string;
    state: string;
    startDate: string;
    endDate: string;
  }): Promise<any> {
    const response = await apiClient.post('/analytics/reports/evv-compliance', data);
    return response.data;
  },

  /**
   * Generate productivity report
   */
  async generateProductivityReport(data: {
    organizationId?: string;
    branchId?: string;
    startDate: string;
    endDate: string;
  }): Promise<any> {
    const response = await apiClient.post('/analytics/reports/productivity', data);
    return response.data;
  },

  /**
   * Generate revenue cycle report
   */
  async generateRevenueCycleReport(data: {
    organizationId?: string;
    branchId?: string;
    startDate: string;
    endDate: string;
  }): Promise<any> {
    const response = await apiClient.post('/analytics/reports/revenue-cycle', data);
    return response.data;
  },

  /**
   * Export report
   */
  async exportReport(reportId: string, format: 'PDF' | 'EXCEL' | 'CSV'): Promise<Blob> {
    const response = await apiClient.get(`/analytics/reports/${reportId}/export`, {
      params: { format },
      responseType: 'blob',
    });
    return response.data;
  },
};
