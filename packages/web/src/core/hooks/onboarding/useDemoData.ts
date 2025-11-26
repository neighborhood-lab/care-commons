import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth';
import { useApiClient } from '../api';

interface DemoDataStatus {
  hasDemoData: boolean;
  clientCount: number;
  caregiverCount: number;
  visitCount: number;
  carePlanCount: number;
}

export function useDemoData() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const api = useApiClient();
  const [isDismissed, setIsDismissed] = useState(false);
  
  const organizationId = user?.organizationId;

  // Query to check if org has demo data
  const { data: status, isLoading: isCheckingStatus } = useQuery<DemoDataStatus>({
    queryKey: ['demoData', 'status', organizationId],
    queryFn: async () => {
      if (!organizationId) throw new Error('No organization ID');
      
      return api.get<DemoDataStatus>(
        `/api/organizations/${organizationId}/demo-data/status`
      );
    },
    enabled: !!organizationId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Mutation to seed demo data
  const seedMutation = useMutation({
    mutationFn: async () => {
      if (!organizationId) throw new Error('No organization ID');
      
      await api.post(`/api/organizations/${organizationId}/seed-demo`);
    },
    onSuccess: () => {
      // Invalidate all queries to refetch with new demo data
      queryClient.invalidateQueries();
      setIsDismissed(false);
    },
  });

  // Mutation to remove demo data
  const removeMutation = useMutation({
    mutationFn: async () => {
      if (!organizationId) throw new Error('No organization ID');
      
      await api.delete(`/api/organizations/${organizationId}/demo-data`);
    },
    onSuccess: () => {
      // Invalidate all queries to show empty state
      queryClient.invalidateQueries();
      setIsDismissed(false);
    },
  });

  const loadDemoData = useCallback(() => {
    seedMutation.mutate();
  }, [seedMutation]);

  const removeDemoData = useCallback(() => {
    if (window.confirm(
      'Are you sure you want to remove all sample data? This will delete all demo clients, caregivers, visits, and care plans. This action cannot be undone.'
    )) {
      removeMutation.mutate();
    }
  }, [removeMutation]);

  const dismissBanner = useCallback(() => {
    setIsDismissed(true);
    // Store dismissal in localStorage
    if (organizationId) {
      localStorage.setItem(`demoBannerDismissed_${organizationId}`, 'true');
    }
  }, [organizationId]);

  // Check if banner was previously dismissed
  const wasPreviouslyDismissed = organizationId 
    ? localStorage.getItem(`demoBannerDismissed_${organizationId}`) === 'true'
    : false;

  const showBanner = status?.hasDemoData && !isDismissed && !wasPreviouslyDismissed;

  return {
    hasDemoData: status?.hasDemoData || false,
    demoDataStats: status,
    isCheckingStatus,
    isLoadingDemoData: seedMutation.isPending,
    isRemovingDemoData: removeMutation.isPending,
    loadDemoData,
    removeDemoData,
    dismissBanner,
    showBanner,
    error: seedMutation.error || removeMutation.error,
  };
}
