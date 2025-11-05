/**
 * Analytics React Hooks
 * React Query hooks for analytics data fetching
 */

import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../services/analytics-api';

/**
 * Hook to fetch operational KPIs
 */
export function useOperationalKPIs(params?: {
  organizationId?: string;
  branchId?: string;
  startDate?: string;
  endDate?: string;
  refetchInterval?: number;
}) {
  const { refetchInterval, ...queryParams } = params || {};

  return useQuery({
    queryKey: ['analytics', 'kpis', queryParams],
    queryFn: () => analyticsApi.getKPIs(queryParams),
    refetchInterval: refetchInterval || 30000, // Refetch every 30 seconds by default
    staleTime: 20000, // Consider data stale after 20 seconds
  });
}

/**
 * Hook to fetch compliance alerts
 */
export function useComplianceAlerts(params?: {
  organizationId?: string;
  branchId?: string;
  refetchInterval?: number;
}) {
  const { refetchInterval, ...queryParams } = params || {};

  return useQuery({
    queryKey: ['analytics', 'compliance-alerts', queryParams],
    queryFn: () => analyticsApi.getComplianceAlerts(queryParams),
    refetchInterval: refetchInterval || 60000, // Refetch every minute
    staleTime: 45000,
  });
}

/**
 * Hook to fetch revenue trends
 */
export function useRevenueTrends(params?: {
  organizationId?: string;
  branchId?: string;
  months?: number;
}) {
  return useQuery({
    queryKey: ['analytics', 'revenue-trends', params],
    queryFn: () => analyticsApi.getRevenueTrends(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch caregiver performance
 */
export function useCaregiverPerformance(
  caregiverId: string,
  params?: {
    startDate?: string;
    endDate?: string;
  }
) {
  return useQuery({
    queryKey: ['analytics', 'caregiver-performance', caregiverId, params],
    queryFn: () => analyticsApi.getCaregiverPerformance(caregiverId, params),
    enabled: !!caregiverId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch EVV exceptions
 */
export function useEVVExceptions(params?: {
  organizationId?: string;
  branchId?: string;
  refetchInterval?: number;
}) {
  const { refetchInterval, ...queryParams } = params || {};

  return useQuery({
    queryKey: ['analytics', 'evv-exceptions', queryParams],
    queryFn: () => analyticsApi.getEVVExceptions(queryParams),
    refetchInterval: refetchInterval || 60000, // Refetch every minute
    staleTime: 45000,
  });
}

/**
 * Hook to fetch dashboard stats
 */
export function useDashboardStats(params?: {
  organizationId?: string;
  branchId?: string;
  refetchInterval?: number;
}) {
  const { refetchInterval, ...queryParams } = params || {};

  return useQuery({
    queryKey: ['analytics', 'dashboard-stats', queryParams],
    queryFn: () => analyticsApi.getDashboardStats(queryParams),
    refetchInterval: refetchInterval || 30000, // Refetch every 30 seconds
    staleTime: 20000,
  });
}
