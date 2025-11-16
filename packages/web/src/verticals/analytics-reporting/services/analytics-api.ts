/**
 * Analytics API Service
 * Provides methods to interact with the analytics and reporting backend
 */

import type {
  OperationalKPIs,
  ComplianceAlert,
  CaregiverPerformance,
  RevenueTrendDataPoint,
  VisitException,
  DashboardStats,
  Report,
  ReportType,
  ExportFormat,
  DateRange,
} from '@/types/analytics-types';

export interface AnalyticsFilters {
  dateRange: DateRange;
  clientIds?: string[];
  caregiverIds?: string[];
  serviceTypes?: string[];
  status?: string[];
  branchId?: string;
}

export class AnalyticsApiService {
  constructor(private baseUrl: string) {}

  /**
   * Build query string from filters
   */
  private buildQueryString(filters: Partial<AnalyticsFilters>): string {
    const params = new URLSearchParams();
    
    if (filters.dateRange?.startDate) {
      params.append('startDate', filters.dateRange.startDate.toISOString());
    }
    if (filters.dateRange?.endDate) {
      params.append('endDate', filters.dateRange.endDate.toISOString());
    }
    if (filters.branchId) {
      params.append('branchId', filters.branchId);
    }
    
    return params.toString();
  }

  /**
   * Get operational KPIs for dashboards
   */
  async getOperationalKPIs(filters: AnalyticsFilters): Promise<OperationalKPIs> {
    const queryString = this.buildQueryString(filters);
    const response = await fetch(`${this.baseUrl}/analytics/kpis?${queryString}`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch operational KPIs');
    }

    return response.json();
  }

  /**
   * Get compliance alerts requiring attention
   */
  async getComplianceAlerts(filters: AnalyticsFilters): Promise<ComplianceAlert[]> {
    const queryString = this.buildQueryString(filters);
    const response = await fetch(`${this.baseUrl}/analytics/compliance-alerts?${queryString}`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch compliance alerts');
    }

    return response.json();
  }

  /**
   * Get revenue trends over time
   */
  async getRevenueTrends(filters: AnalyticsFilters): Promise<RevenueTrendDataPoint[]> {
    const params = new URLSearchParams();
    if (filters.branchId) {
      params.append('branchId', filters.branchId);
    }
    // Default to 6 months if no date range specified
    params.append('months', '6');
    
    const response = await fetch(`${this.baseUrl}/analytics/revenue-trends?${params.toString()}`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch revenue trends');
    }

    return response.json();
  }

  /**
   * Get caregiver performance metrics
   */
  async getCaregiverPerformance(
    caregiverId: string,
    filters: AnalyticsFilters
  ): Promise<CaregiverPerformance> {
    const queryString = this.buildQueryString(filters);
    const response = await fetch(
      `${this.baseUrl}/analytics/caregiver-performance/${caregiverId}?${queryString}`,
      {
        method: 'GET',
        credentials: 'include',
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch caregiver performance');
    }

    return response.json();
  }

  /**
   * Get all caregiver performance data
   */
  async getAllCaregiverPerformance(
    filters: AnalyticsFilters
  ): Promise<CaregiverPerformance[]> {
    const queryString = this.buildQueryString(filters);
    const response = await fetch(`${this.baseUrl}/analytics/caregiver-performance?${queryString}`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch all caregiver performance');
    }

    return response.json();
  }

  /**
   * Get EVV exceptions
   */
  async getEVVExceptions(filters: AnalyticsFilters): Promise<VisitException[]> {
    const queryString = this.buildQueryString(filters);
    const response = await fetch(`${this.baseUrl}/analytics/evv-exceptions?${queryString}`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch EVV exceptions');
    }

    return response.json();
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await fetch(`${this.baseUrl}/analytics/dashboard-stats`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch dashboard stats');
    }

    return response.json();
  }

  /**
   * Generate a report
   */
  async generateReport(
    reportType: ReportType,
    filters: AnalyticsFilters
  ): Promise<Report> {
    const response = await fetch(`${this.baseUrl}/analytics/reports/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportType, ...filters }),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to generate report');
    }

    return response.json();
  }

  /**
   * Get list of generated reports
   */
  async getReports(filters?: Partial<AnalyticsFilters>): Promise<Report[]> {
    const queryParams = filters ? `?${new URLSearchParams(filters as any)}` : '';
    const response = await fetch(`${this.baseUrl}/analytics/reports${queryParams}`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch reports');
    }

    return response.json();
  }

  /**
   * Export a report in a specific format
   */
  async exportReport(
    reportId: string,
    format: ExportFormat
  ): Promise<Blob> {
    const response = await fetch(
      `${this.baseUrl}/analytics/reports/${reportId}/export?format=${format}`,
      {
        method: 'GET',
        credentials: 'include',
      }
    );

    if (!response.ok) {
      throw new Error('Failed to export report');
    }

    return response.blob();
  }
}
