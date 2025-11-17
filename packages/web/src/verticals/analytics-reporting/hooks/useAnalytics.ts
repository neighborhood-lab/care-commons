/**
 * React Query hooks for analytics data
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
} from '@/types/analytics-types';
import { AnalyticsApiService, type AnalyticsFilters } from '../services/analytics-api';

// Initialize API service
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const analyticsApi = new AnalyticsApiService(API_BASE_URL);

/**
 * Hook to fetch operational KPIs
 */
export function useOperationalKPIs(
  filters: AnalyticsFilters,
  options?: { refetchInterval?: number }
) {
  return useQuery<OperationalKPIs>({
    queryKey: ['analytics', 'kpis', filters],
    queryFn: () => analyticsApi.getOperationalKPIs(filters),
    refetchInterval: options?.refetchInterval,
    refetchIntervalInBackground: false,
  });
}

/**
 * Hook to fetch compliance alerts
 */
export function useComplianceAlerts(
  filters: AnalyticsFilters,
  options?: { refetchInterval?: number }
) {
  return useQuery<ComplianceAlert[]>({
    queryKey: ['analytics', 'compliance-alerts', filters],
    queryFn: () => analyticsApi.getComplianceAlerts(filters),
    refetchInterval: options?.refetchInterval,
    refetchIntervalInBackground: false,
    retry: false, // Don't retry on error - polling will refetch anyway
  });
}

/**
 * Hook to fetch revenue trends
 */
export function useRevenueTrends(filters: AnalyticsFilters) {
  return useQuery<RevenueTrendDataPoint[]>({
    queryKey: ['analytics', 'revenue-trends', filters],
    queryFn: () => analyticsApi.getRevenueTrends(filters),
  });
}

/**
 * Hook to fetch caregiver performance
 */
export function useCaregiverPerformance(
  caregiverId: string,
  filters: AnalyticsFilters
) {
  return useQuery<CaregiverPerformance>({
    queryKey: ['analytics', 'caregiver-performance', caregiverId, filters],
    queryFn: () => analyticsApi.getCaregiverPerformance(caregiverId, filters),
    enabled: !!caregiverId,
  });
}

/**
 * Hook to fetch all caregiver performance data
 */
export function useAllCaregiverPerformance(filters: AnalyticsFilters) {
  return useQuery<CaregiverPerformance[]>({
    queryKey: ['analytics', 'all-caregivers-performance', filters],
    queryFn: () => analyticsApi.getAllCaregiverPerformance(filters),
  });
}

/**
 * Hook to fetch EVV exceptions
 */
export function useEVVExceptions(
  filters: AnalyticsFilters,
  options?: { refetchInterval?: number }
) {
  return useQuery<VisitException[]>({
    queryKey: ['analytics', 'evv-exceptions', filters],
    queryFn: () => analyticsApi.getEVVExceptions(filters),
    refetchInterval: options?.refetchInterval,
    refetchIntervalInBackground: false,
    retry: false, // Don't retry on error - polling will refetch anyway
  });
}

/**
 * Hook to fetch dashboard statistics
 */
export function useDashboardStats(options?: { refetchInterval?: number }) {
  return useQuery<DashboardStats>({
    queryKey: ['analytics', 'dashboard-stats'],
    queryFn: () => analyticsApi.getDashboardStats(),
    refetchInterval: options?.refetchInterval,
    refetchIntervalInBackground: false,
    retry: false, // Don't retry on error - polling will refetch anyway
  });
}

/**
 * Hook to fetch reports list
 */
export function useReports(filters?: Partial<AnalyticsFilters>) {
  return useQuery<Report[]>({
    queryKey: ['analytics', 'reports', filters],
    queryFn: () => analyticsApi.getReports(filters),
  });
}

/**
 * Hook to generate a report
 */
export function useGenerateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      reportType,
      filters,
    }: {
      reportType: ReportType;
      filters: AnalyticsFilters;
    }) => analyticsApi.generateReport(reportType, filters),
    onSuccess: () => {
      // Invalidate reports list to refetch
      queryClient.invalidateQueries({ queryKey: ['analytics', 'reports'] });
    },
  });
}

/**
 * Hook to export a report
 */
export function useExportReport() {
  return useMutation({
    mutationFn: ({
      reportId,
      format,
    }: {
      reportId: string;
      format: ExportFormat;
    }) => analyticsApi.exportReport(reportId, format),
    onSuccess: (blob, variables) => {
      // Trigger download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `report-${variables.reportId}.${variables.format.toLowerCase()}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
  });
}
