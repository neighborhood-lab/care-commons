/**
 * React hooks for fetching visits
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createVisitApiService } from '../services';
import { createApiClient } from '@/core/services';
import type {
  VisitSearchFilters,
  CreateVisitInput,
  AssignVisitInput,
} from '../types';

// Create API client instance
const apiClient = createApiClient('', () => null);
const visitApi = createVisitApiService(apiClient);

export function useVisits(
  filters: VisitSearchFilters = {},
  page: number = 1,
  limit: number = 20
) {
  return useQuery({
    queryKey: ['visits', filters, page, limit],
    queryFn: () => visitApi.searchVisits(filters, page, limit),
    staleTime: 10000, // 10 seconds - visits change frequently
  });
}

export function useVisit(id: string | undefined) {
  return useQuery({
    queryKey: ['visit', id],
    queryFn: () => visitApi.getVisitById(id!),
    enabled: !!id,
    staleTime: 30000, // 30 seconds
  });
}

export function useUnassignedVisits(
  branchId?: string,
  dateFrom?: Date,
  dateTo?: Date
) {
  return useQuery({
    queryKey: ['unassignedVisits', branchId, dateFrom, dateTo],
    queryFn: () => visitApi.getUnassignedVisits(branchId, dateFrom, dateTo),
    staleTime: 5000, // 5 seconds - unassigned visits are high priority
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

export function useCreateVisit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateVisitInput) => visitApi.createVisit(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits'] });
      queryClient.invalidateQueries({ queryKey: ['unassignedVisits'] });
    },
  });
}

export function useAssignVisit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AssignVisitInput) => visitApi.assignVisit(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits'] });
      queryClient.invalidateQueries({ queryKey: ['unassignedVisits'] });
    },
  });
}

export function useUnassignVisit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (visitId: string) => visitApi.unassignVisit(visitId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits'] });
      queryClient.invalidateQueries({ queryKey: ['unassignedVisits'] });
    },
  });
}

export function useUpdateVisitStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      visitId,
      status,
      notes,
    }: {
      visitId: string;
      status: string;
      notes?: string;
    }) => visitApi.updateVisitStatus(visitId, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits'] });
      queryClient.invalidateQueries({ queryKey: ['visit'] });
    },
  });
}

export function useCaregiverAvailability(
  caregiverId: string | undefined,
  date: Date,
  startTime: string,
  endTime: string
) {
  return useQuery({
    queryKey: ['caregiverAvailability', caregiverId, date, startTime, endTime],
    queryFn: () =>
      visitApi.getCaregiverAvailability(caregiverId!, date, startTime, endTime),
    enabled: !!caregiverId && !!date && !!startTime && !!endTime,
    staleTime: 5000, // 5 seconds
  });
}
