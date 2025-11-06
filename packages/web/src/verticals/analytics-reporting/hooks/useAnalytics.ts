/**
 * Analytics Hooks
 */

import { useQuery } from '@tanstack/react-query';
import { useDataProvider } from '@/core/providers/data-provider-context';
import type { AnalyticsFilters } from '../types';

export function useOperationalKPIs(filters?: AnalyticsFilters) {
  const provider = useDataProvider();

  return useQuery({
    queryKey: ['analytics', 'kpis', filters],
    queryFn: () => provider.analytics.getKPIs(filters),
    refetchInterval: 60000, // Refetch every 60 seconds
  });
}

export function useComplianceAlerts(filters?: AnalyticsFilters) {
  const provider = useDataProvider();

  return useQuery({
    queryKey: ['analytics', 'compliance-alerts', filters],
    queryFn: () => provider.analytics.getComplianceAlerts(filters),
    refetchInterval: 60000, // Refetch every 60 seconds
  });
}

export function useDashboardStats(filters?: AnalyticsFilters) {
  const provider = useDataProvider();

  return useQuery({
    queryKey: ['analytics', 'dashboard-stats', filters],
    queryFn: () => provider.analytics.getDashboardStats(filters),
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}
