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
   * Get auth headers with token
   */
  private getAuthHeaders(): Record<string, string> {
    // Zustand persists auth under 'auth-storage' key
    const authStorage = globalThis.localStorage?.getItem('auth-storage');
    let token: string | null = null;
    
    if (authStorage) {
      try {
        const parsed = JSON.parse(authStorage);
        token = parsed.state?.token || null;
      } catch (e) {
        console.error('Failed to parse auth storage:', e);
      }
    }
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  /**
   * Get operational KPIs for dashboards
   */
  async getOperationalKPIs(filters: AnalyticsFilters): Promise<OperationalKPIs> {
    const params = new URLSearchParams({
      startDate: filters.dateRange.startDate.toISOString(),
      endDate: filters.dateRange.endDate.toISOString(),
    });
    
    if (filters.branchId) {
      params.append('branchId', filters.branchId);
    }

    const response = await fetch(`${this.baseUrl}/api/analytics/kpis?${params.toString()}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
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
    const params = new URLSearchParams();
    
    if (filters.branchId) {
      params.append('branchId', filters.branchId);
    }

    const queryString = params.toString();
    const url = queryString 
      ? `${this.baseUrl}/api/analytics/compliance-alerts?${queryString}`
      : `${this.baseUrl}/api/analytics/compliance-alerts`;

    const response = await fetch(url, {
      method: 'GET',
      headers: this.getAuthHeaders(),
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

    const queryString = params.toString();
    const url = queryString 
      ? `${this.baseUrl}/api/analytics/revenue-trends?${queryString}`
      : `${this.baseUrl}/api/analytics/revenue-trends`;

    const response = await fetch(url, {
      method: 'GET',
      headers: this.getAuthHeaders(),
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
    const params = new URLSearchParams({
      startDate: filters.dateRange.startDate.toISOString(),
      endDate: filters.dateRange.endDate.toISOString(),
    });

    const response = await fetch(
      `${this.baseUrl}/api/analytics/caregiver-performance/${caregiverId}?${params.toString()}`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
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
    const params = new URLSearchParams({
      startDate: filters.dateRange.startDate.toISOString(),
      endDate: filters.dateRange.endDate.toISOString(),
    });
    
    if (filters.branchId) {
      params.append('branchId', filters.branchId);
    }

    const response = await fetch(`${this.baseUrl}/api/analytics/caregiver-performance?${params.toString()}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
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
    const params = new URLSearchParams();
    
    if (filters.branchId) {
      params.append('branchId', filters.branchId);
    }

    const queryString = params.toString();
    const url = queryString 
      ? `${this.baseUrl}/api/analytics/evv-exceptions?${queryString}`
      : `${this.baseUrl}/api/analytics/evv-exceptions`;

    const response = await fetch(url, {
      method: 'GET',
      headers: this.getAuthHeaders(),
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
    const response = await fetch(`${this.baseUrl}/api/analytics/dashboard-stats`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
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
    const response = await fetch(`${this.baseUrl}/api/analytics/reports/generate`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
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
    const response = await fetch(`${this.baseUrl}/api/analytics/reports${queryParams}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
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
      `${this.baseUrl}/api/analytics/reports/${reportId}/export?format=${format}`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
        credentials: 'include',
      }
    );

    if (!response.ok) {
      throw new Error('Failed to export report');
    }

    return response.blob();
  }
}
