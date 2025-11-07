import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '@/core/hooks';

// Types from family-engagement vertical
interface FamilyDashboard {
  client: {
    id: string;
    name: string;
    photoUrl?: string;
  };
  upcomingVisits: VisitSummary[];
  recentActivity: ActivityFeedItem[];
  unreadNotifications: number;
  unreadMessages: number;
  activeCarePlan?: {
    id: string;
    name: string;
    goalsTotal: number;
    goalsAchieved: number;
  };
}

interface VisitSummary {
  id: string;
  visitId: string;
  clientId: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  actualStartTime?: string;
  actualEndTime?: string;
  caregiverName: string;
  caregiverPhotoUrl?: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  visitNotes?: string;
  tasksCompleted: VisitTaskSummary[];
}

interface VisitTaskSummary {
  taskId: string;
  taskName: string;
  category: string;
  status: 'COMPLETED' | 'SKIPPED' | 'INCOMPLETE';
  completedAt?: string;
  skipReason?: string;
  notes?: string;
}

interface ActivityFeedItem {
  id: string;
  familyMemberId: string;
  clientId: string;
  activityType: string;
  title: string;
  description: string;
  summary?: string;
  relatedEntityType: string;
  relatedEntityId: string;
  performedBy?: string;
  performedByName?: string;
  occurredAt: string;
  iconType?: string;
  viewedByFamily: boolean;
  viewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Hook for family portal dashboard data
 */
export function useFamilyDashboard(familyMemberId: string) {
  const api = useApiClient();

  return useQuery({
    queryKey: ['family-dashboard', familyMemberId],
    queryFn: async () => {
      const response = await api.get<FamilyDashboard>(
        `/family-engagement/dashboard/family-member/${familyMemberId}`
      );
      return response.data;
    },
    enabled: !!familyMemberId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

/**
 * Hook for activity feed data
 */
export function useActivityFeed(familyMemberId: string, limit = 20) {
  const api = useApiClient();

  return useQuery({
    queryKey: ['activity-feed', familyMemberId, limit],
    queryFn: async () => {
      const response = await api.get<ActivityFeedItem[]>(
        `/family-engagement/activity-feed/family-member/${familyMemberId}?limit=${limit}`
      );
      return response.data;
    },
    enabled: !!familyMemberId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

/**
 * Hook to mark activity as viewed
 */
export function useMarkActivityViewed() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (activityId: string) => {
      await api.patch(`/family-engagement/activity-feed/${activityId}/viewed`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
    },
  });
}

/**
 * Hook for upcoming visits
 */
export function useUpcomingVisits(clientId: string) {
  const api = useApiClient();

  return useQuery({
    queryKey: ['upcoming-visits', clientId],
    queryFn: async () => {
      const response = await api.get<VisitSummary[]>(
        `/family-engagement/visits/client/${clientId}/upcoming`
      );
      return response.data;
    },
    enabled: !!clientId,
    refetchInterval: 60000, // Refresh every minute
  });
}

/**
 * Hook for care team information
 */
export function useCareTeam(clientId: string) {
  const api = useApiClient();

  return useQuery({
    queryKey: ['care-team', clientId],
    queryFn: async () => {
      const response = await api.get(
        `/family-engagement/care-team/client/${clientId}`
      );
      return response.data;
    },
    enabled: !!clientId,
  });
}
