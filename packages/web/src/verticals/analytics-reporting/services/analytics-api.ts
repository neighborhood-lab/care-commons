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
} from '@care-commons/analytics-reporting/types/analytics';

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
   * Get operational KPIs for dashboards
   */
  async getOperationalKPIs(filters: AnalyticsFilters): Promise<OperationalKPIs> {
    const response = await fetch(`${this.baseUrl}/analytics/kpis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(filters),
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
    const response = await fetch(`${this.baseUrl}/analytics/compliance-alerts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(filters),
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
    const response = await fetch(`${this.baseUrl}/analytics/revenue-trends`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(filters),
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
    const response = await fetch(
      `${this.baseUrl}/analytics/caregiver-performance/${caregiverId}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filters),
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
    const response = await fetch(`${this.baseUrl}/analytics/caregivers/performance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(filters),
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
    const response = await fetch(`${this.baseUrl}/analytics/evv-exceptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(filters),
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
