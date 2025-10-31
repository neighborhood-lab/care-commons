import type { ApiClient } from '@/core/services';
import type {
  OpenShift,
  MatchCandidate,
  AssignmentProposal,
  MatchingMetrics,
  OpenShiftListResponse,
  MatchCandidateListResponse,
  ProposalListResponse,
  OpenShiftSearchFilters,
  ProposalSearchFilters,
  MatchShiftInput,
  CreateProposalInput,
  RespondToProposalInput,
} from '../types';

export interface ShiftMatchingApiService {
  getOpenShifts(filters?: OpenShiftSearchFilters): Promise<OpenShiftListResponse>;
  getOpenShiftById(id: string): Promise<OpenShift>;
  matchShift(input: MatchShiftInput): Promise<MatchCandidateListResponse>;
  getMatchCandidates(openShiftId: string): Promise<MatchCandidateListResponse>;

  getProposals(filters?: ProposalSearchFilters): Promise<ProposalListResponse>;
  getProposalById(id: string): Promise<AssignmentProposal>;
  createProposal(input: CreateProposalInput): Promise<AssignmentProposal>;
  respondToProposal(id: string, input: RespondToProposalInput): Promise<AssignmentProposal>;
  withdrawProposal(id: string): Promise<AssignmentProposal>;

  getMatchingMetrics(dateFrom?: string, dateTo?: string): Promise<MatchingMetrics>;
}

export const createShiftMatchingApiService = (apiClient: ApiClient): ShiftMatchingApiService => {
  return {
    getOpenShifts: async (filters?: OpenShiftSearchFilters) => {
      const params = new URLSearchParams();

      if (filters?.clientId) params.append('clientId', filters.clientId);
      if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters?.dateTo) params.append('dateTo', filters.dateTo);
      if (filters?.priority) params.append('priority', filters.priority);
      if (filters?.matchingStatus) params.append('matchingStatus', filters.matchingStatus);
      if (filters?.isUrgent !== undefined) params.append('isUrgent', filters.isUrgent.toString());
      if (filters?.serviceTypeId) params.append('serviceTypeId', filters.serviceTypeId);

      const url = `/api/shift-matching/open-shifts${params.toString() ? `?${params.toString()}` : ''}`;
      return apiClient.get<OpenShiftListResponse>(url);
    },

    getOpenShiftById: async (id: string) => {
      return apiClient.get<OpenShift>(`/api/shift-matching/open-shifts/${id}`);
    },

    matchShift: async (input: MatchShiftInput) => {
      return apiClient.post<MatchCandidateListResponse>(
        `/api/shift-matching/open-shifts/${input.openShiftId}/match`,
        input
      );
    },

    getMatchCandidates: async (openShiftId: string) => {
      return apiClient.get<MatchCandidateListResponse>(
        `/api/shift-matching/open-shifts/${openShiftId}/candidates`
      );
    },

    getProposals: async (filters?: ProposalSearchFilters) => {
      const params = new URLSearchParams();

      if (filters?.caregiverId) params.append('caregiverId', filters.caregiverId);
      if (filters?.openShiftId) params.append('openShiftId', filters.openShiftId);
      if (filters?.proposalStatus) params.append('proposalStatus', filters.proposalStatus);
      if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters?.dateTo) params.append('dateTo', filters.dateTo);
      if (filters?.matchQuality) params.append('matchQuality', filters.matchQuality);

      const url = `/api/shift-matching/proposals${params.toString() ? `?${params.toString()}` : ''}`;
      return apiClient.get<ProposalListResponse>(url);
    },

    getProposalById: async (id: string) => {
      return apiClient.get<AssignmentProposal>(`/api/shift-matching/proposals/${id}`);
    },

    createProposal: async (input: CreateProposalInput) => {
      return apiClient.post<AssignmentProposal>('/api/shift-matching/proposals', input);
    },

    respondToProposal: async (id: string, input: RespondToProposalInput) => {
      return apiClient.post<AssignmentProposal>(
        `/api/shift-matching/proposals/${id}/respond`,
        input
      );
    },

    withdrawProposal: async (id: string) => {
      return apiClient.post<AssignmentProposal>(
        `/api/shift-matching/proposals/${id}/withdraw`,
        {}
      );
    },

    getMatchingMetrics: async (dateFrom?: string, dateTo?: string) => {
      const params = new URLSearchParams();
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);

      const url = `/api/shift-matching/metrics${params.toString() ? `?${params.toString()}` : ''}`;
      return apiClient.get<MatchingMetrics>(url);
    },
  };
};
