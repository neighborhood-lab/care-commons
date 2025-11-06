import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '@/core/hooks';
import type { PaginatedResult } from '@care-commons/core';
import type {
  Visit,
  VisitWithDetails,
  VisitSearchFilters,
  AssignCaregiverInput,
  UpdateVisitStatusInput,
  CaregiverAvailability,
  SchedulingStats,
} from '../types';

const QUERY_KEYS = {
  visits: 'visits',
  visit: (id: string) => ['visits', id],
  unassigned: 'visits-unassigned',
  availability: (visitId: string) => ['visits', visitId, 'availability'],
  stats: 'visits-stats',
};

export function useVisits(filters: VisitSearchFilters = {}) {
  const api = useApiClient();

  return useQuery<PaginatedResult<VisitWithDetails>>({
    queryKey: [QUERY_KEYS.visits, filters],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filters.query) params.append('query', filters.query);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom.toISOString());
      if (filters.dateTo) params.append('dateTo', filters.dateTo.toISOString());
      if (filters.status) filters.status.forEach(s => params.append('status', s));
      if (filters.visitType) filters.visitType.forEach(t => params.append('visitType', t));
      if (filters.clientIds) filters.clientIds.forEach(id => params.append('clientId', id));
      if (filters.caregiverIds) filters.caregiverIds.forEach(id => params.append('caregiverId', id));
      if (filters.branchIds) filters.branchIds.forEach(id => params.append('branchId', id));
      if (filters.isUnassigned) params.append('isUnassigned', 'true');
      if (filters.isUrgent) params.append('isUrgent', 'true');
      if (filters.requiresSupervision) params.append('requiresSupervision', 'true');

      return await api.get<PaginatedResult<VisitWithDetails>>(`/api/visits?${params.toString()}`);
    },
  });
}

export function useVisit(id: string) {
  const api = useApiClient();

  return useQuery<VisitWithDetails>({
    queryKey: QUERY_KEYS.visit(id),
    queryFn: async () => {
      return await api.get<VisitWithDetails>(`/api/visits/${id}`);
    },
    enabled: Boolean(id),
  });
}

export function useUnassignedVisits() {
  const api = useApiClient();

  return useQuery<Visit[]>({
    queryKey: [QUERY_KEYS.unassigned],
    queryFn: async () => {
      return await api.get<Visit[]>('/api/visits/unassigned');
    },
  });
}

export function useAvailableCaregivers(visitId: string) {
  const api = useApiClient();

  return useQuery<CaregiverAvailability[]>({
    queryKey: QUERY_KEYS.availability(visitId),
    queryFn: async () => {
      return await api.get<CaregiverAvailability[]>(`/api/visits/${visitId}/available-caregivers`);
    },
    enabled: Boolean(visitId),
  });
}

export function useSchedulingStats(dateRange?: { start: Date; end: Date }) {
  const api = useApiClient();

  return useQuery<SchedulingStats>({
    queryKey: [QUERY_KEYS.stats, dateRange],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateRange) {
        params.append('start', dateRange.start.toISOString());
        params.append('end', dateRange.end.toISOString());
      }
      return await api.get<SchedulingStats>(`/api/visits/stats?${params.toString()}`);
    },
  });
}

export function useAssignCaregiver() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AssignCaregiverInput) => {
      return await api.post<Visit>(`/api/visits/${input.visitId}/assign`, {
        caregiverId: input.caregiverId,
        assignmentMethod: 'MANUAL',
        notes: input.notes,
      });
    },
    onSuccess: (_, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.visits] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.visit(variables.visitId) });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.unassigned] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.stats] });
    },
  });
}

export function useUpdateVisitStatus() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateVisitStatusInput) => {
      return await api.patch<Visit>(`/api/visits/${input.visitId}/status`, {
        newStatus: input.newStatus,
        notes: input.notes,
        reason: input.reason,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.visits] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.visit(variables.visitId) });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.stats] });
    },
  });
}

export function useBulkAssign() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assignments: AssignCaregiverInput[]) => {
      return await api.post<{ success: boolean; assigned: number }>('/api/visits/bulk-assign', { assignments });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.visits] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.unassigned] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.stats] });
    },
  });
}
