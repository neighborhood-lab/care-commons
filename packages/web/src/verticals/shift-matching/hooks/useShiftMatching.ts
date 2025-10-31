import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useApiClient } from '@/core/hooks';
import { createShiftMatchingApiService } from '../services/shift-matching-api';
import type {
  OpenShiftSearchFilters,
  ProposalSearchFilters,
  MatchShiftInput,
  CreateProposalInput,
  RespondToProposalInput,
} from '../types';

export const useShiftMatchingApi = () => {
  const apiClient = useApiClient();
  return useMemo(() => createShiftMatchingApiService(apiClient), [apiClient]);
};

export const useOpenShifts = (filters?: OpenShiftSearchFilters) => {
  const shiftMatchingApi = useShiftMatchingApi();

  return useQuery({
    queryKey: ['open-shifts', filters],
    queryFn: () => shiftMatchingApi.getOpenShifts(filters),
  });
};

export const useOpenShift = (id: string | undefined) => {
  const shiftMatchingApi = useShiftMatchingApi();

  return useQuery({
    queryKey: ['open-shifts', id],
    queryFn: () => shiftMatchingApi.getOpenShiftById(id!),
    enabled: !!id,
  });
};

export const useMatchCandidates = (openShiftId: string | undefined) => {
  const shiftMatchingApi = useShiftMatchingApi();

  return useQuery({
    queryKey: ['match-candidates', openShiftId],
    queryFn: () => shiftMatchingApi.getMatchCandidates(openShiftId!),
    enabled: !!openShiftId,
  });
};

export const useProposals = (filters?: ProposalSearchFilters) => {
  const shiftMatchingApi = useShiftMatchingApi();

  return useQuery({
    queryKey: ['proposals', filters],
    queryFn: () => shiftMatchingApi.getProposals(filters),
  });
};

export const useProposal = (id: string | undefined) => {
  const shiftMatchingApi = useShiftMatchingApi();

  return useQuery({
    queryKey: ['proposals', id],
    queryFn: () => shiftMatchingApi.getProposalById(id!),
    enabled: !!id,
  });
};

export const useMatchingMetrics = (dateFrom?: string, dateTo?: string) => {
  const shiftMatchingApi = useShiftMatchingApi();

  return useQuery({
    queryKey: ['matching-metrics', dateFrom, dateTo],
    queryFn: () => shiftMatchingApi.getMatchingMetrics(dateFrom, dateTo),
  });
};

export const useMatchShift = () => {
  const shiftMatchingApi = useShiftMatchingApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: MatchShiftInput) => shiftMatchingApi.matchShift(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['match-candidates', variables.openShiftId] });
      queryClient.invalidateQueries({ queryKey: ['open-shifts'] });
      toast.success('Matching completed successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to match shift');
    },
  });
};

export const useCreateProposal = () => {
  const shiftMatchingApi = useShiftMatchingApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateProposalInput) => shiftMatchingApi.createProposal(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      queryClient.invalidateQueries({ queryKey: ['open-shifts', data.openShiftId] });
      toast.success('Proposal created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create proposal');
    },
  });
};

export const useRespondToProposal = () => {
  const shiftMatchingApi = useShiftMatchingApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: RespondToProposalInput }) =>
      shiftMatchingApi.respondToProposal(id, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      queryClient.invalidateQueries({ queryKey: ['proposals', data.id] });
      queryClient.invalidateQueries({ queryKey: ['open-shifts'] });
      toast.success(data.proposalStatus === 'ACCEPTED' ? 'Proposal accepted' : 'Proposal rejected');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to respond to proposal');
    },
  });
};

export const useWithdrawProposal = () => {
  const shiftMatchingApi = useShiftMatchingApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => shiftMatchingApi.withdrawProposal(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      queryClient.invalidateQueries({ queryKey: ['proposals', data.id] });
      toast.success('Proposal withdrawn');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to withdraw proposal');
    },
  });
};
