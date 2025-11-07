/**
 * Quality Assurance & Audits - React Query Hooks
 *
 * Custom hooks for audit management using React Query
 */

import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useApiClient } from '@/core/hooks';
import { createAuditApiService, type AuditFilters, type FindingFilters, type CorrectiveActionFilters } from '../services';
import type {
  CreateAuditInput,
  UpdateAuditInput,
  CreateAuditFindingInput,
  CreateCorrectiveActionInput,
  UpdateCorrectiveActionProgressInput
} from '../types';

// ============================================================================
// API Client Hook
// ============================================================================

export const useAuditApi = () => {
  const apiClient = useApiClient();
  return useMemo(() => createAuditApiService(apiClient), [apiClient]);
};

// ============================================================================
// Dashboard
// ============================================================================

export const useAuditDashboard = () => {
  const auditApi = useAuditApi();

  return useQuery({
    queryKey: ['audits', 'dashboard'],
    queryFn: () => auditApi.getAuditDashboard(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// ============================================================================
// Audits
// ============================================================================

export const useAudits = (filters?: AuditFilters) => {
  const auditApi = useAuditApi();

  return useQuery({
    queryKey: ['audits', 'list', filters],
    queryFn: () => auditApi.getAudits(filters),
  });
};

export const useAudit = (id: string | undefined) => {
  const auditApi = useAuditApi();

  return useQuery({
    queryKey: ['audits', id],
    queryFn: () => auditApi.getAuditById(id!),
    enabled: !!id,
  });
};

export const useAuditDetail = (id: string | undefined) => {
  const auditApi = useAuditApi();

  return useQuery({
    queryKey: ['audits', id, 'detail'],
    queryFn: () => auditApi.getAuditDetail(id!),
    enabled: !!id,
  });
};

export const useCreateAudit = () => {
  const auditApi = useAuditApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateAuditInput) => auditApi.createAudit(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['audits'] });
      toast.success('Audit created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create audit');
    },
  });
};

export const useUpdateAudit = () => {
  const auditApi = useAuditApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateAuditInput }) =>
      auditApi.updateAudit(id, input),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['audits'] });
      void queryClient.invalidateQueries({ queryKey: ['audits', data.id] });
      toast.success('Audit updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update audit');
    },
  });
};

export const useStartAudit = () => {
  const auditApi = useAuditApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => auditApi.startAudit(id),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['audits'] });
      void queryClient.invalidateQueries({ queryKey: ['audits', data.id] });
      toast.success('Audit started');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to start audit');
    },
  });
};

export const useCompleteAudit = () => {
  const auditApi = useAuditApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, executiveSummary, recommendations }: { id: string; executiveSummary: string; recommendations: string }) =>
      auditApi.completeAudit(id, executiveSummary, recommendations),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['audits'] });
      void queryClient.invalidateQueries({ queryKey: ['audits', data.id] });
      toast.success('Audit completed');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to complete audit');
    },
  });
};

export const useDeleteAudit = () => {
  const auditApi = useAuditApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => auditApi.deleteAudit(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['audits'] });
      toast.success('Audit deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete audit');
    },
  });
};

// ============================================================================
// Findings
// ============================================================================

export const useFindings = (filters?: FindingFilters) => {
  const auditApi = useAuditApi();

  return useQuery({
    queryKey: ['audits', 'findings', 'list', filters],
    queryFn: () => auditApi.getFindings(filters),
  });
};

export const useFinding = (id: string | undefined) => {
  const auditApi = useAuditApi();

  return useQuery({
    queryKey: ['audits', 'findings', id],
    queryFn: () => auditApi.getFindingById(id!),
    enabled: !!id,
  });
};

export const useFindingsForAudit = (auditId: string | undefined) => {
  const auditApi = useAuditApi();

  return useQuery({
    queryKey: ['audits', auditId, 'findings'],
    queryFn: () => auditApi.getFindingsForAudit(auditId!),
    enabled: !!auditId,
  });
};

export const useCriticalFindings = (limit?: number) => {
  const auditApi = useAuditApi();

  return useQuery({
    queryKey: ['audits', 'findings', 'critical', limit],
    queryFn: () => auditApi.getCriticalFindings(limit),
  });
};

export const useCreateFinding = () => {
  const auditApi = useAuditApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateAuditFindingInput) => auditApi.createFinding(input),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['audits'] });
      void queryClient.invalidateQueries({ queryKey: ['audits', data.auditId] });
      void queryClient.invalidateQueries({ queryKey: ['audits', 'findings'] });
      toast.success('Finding created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create finding');
    },
  });
};

export const useUpdateFindingStatus = () => {
  const auditApi = useAuditApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status, resolutionDescription }: { id: string; status: string; resolutionDescription?: string }) =>
      auditApi.updateFindingStatus(id, status, resolutionDescription),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['audits'] });
      void queryClient.invalidateQueries({ queryKey: ['audits', data.auditId] });
      void queryClient.invalidateQueries({ queryKey: ['audits', 'findings'] });
      toast.success('Finding status updated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update finding status');
    },
  });
};

export const useVerifyFinding = () => {
  const auditApi = useAuditApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, verificationNotes }: { id: string; verificationNotes: string }) =>
      auditApi.verifyFinding(id, verificationNotes),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['audits'] });
      void queryClient.invalidateQueries({ queryKey: ['audits', data.auditId] });
      void queryClient.invalidateQueries({ queryKey: ['audits', 'findings'] });
      toast.success('Finding verified');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to verify finding');
    },
  });
};

// ============================================================================
// Corrective Actions
// ============================================================================

export const useCorrectiveActions = (filters?: CorrectiveActionFilters) => {
  const auditApi = useAuditApi();

  return useQuery({
    queryKey: ['audits', 'corrective-actions', 'list', filters],
    queryFn: () => auditApi.getCorrectiveActions(filters),
  });
};

export const useCorrectiveAction = (id: string | undefined) => {
  const auditApi = useAuditApi();

  return useQuery({
    queryKey: ['audits', 'corrective-actions', id],
    queryFn: () => auditApi.getCorrectiveActionById(id!),
    enabled: !!id,
  });
};

export const useCorrectiveActionsForAudit = (auditId: string | undefined) => {
  const auditApi = useAuditApi();

  return useQuery({
    queryKey: ['audits', auditId, 'corrective-actions'],
    queryFn: () => auditApi.getCorrectiveActionsForAudit(auditId!),
    enabled: !!auditId,
  });
};

export const useOverdueCorrectiveActions = (limit?: number) => {
  const auditApi = useAuditApi();

  return useQuery({
    queryKey: ['audits', 'corrective-actions', 'overdue', limit],
    queryFn: () => auditApi.getOverdueCorrectiveActions(limit),
  });
};

export const useCreateCorrectiveAction = () => {
  const auditApi = useAuditApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCorrectiveActionInput) => auditApi.createCorrectiveAction(input),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['audits'] });
      void queryClient.invalidateQueries({ queryKey: ['audits', data.auditId] });
      void queryClient.invalidateQueries({ queryKey: ['audits', 'corrective-actions'] });
      toast.success('Corrective action created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create corrective action');
    },
  });
};

export const useUpdateCorrectiveActionProgress = () => {
  const auditApi = useAuditApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, progress }: { id: string; progress: UpdateCorrectiveActionProgressInput }) =>
      auditApi.updateCorrectiveActionProgress(id, progress),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['audits'] });
      void queryClient.invalidateQueries({ queryKey: ['audits', data.auditId] });
      void queryClient.invalidateQueries({ queryKey: ['audits', 'corrective-actions'] });
      toast.success('Progress updated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update progress');
    },
  });
};

export const useCompleteCorrectiveAction = () => {
  const auditApi = useAuditApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => auditApi.completeCorrectiveAction(id),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['audits'] });
      void queryClient.invalidateQueries({ queryKey: ['audits', data.auditId] });
      void queryClient.invalidateQueries({ queryKey: ['audits', 'corrective-actions'] });
      toast.success('Corrective action completed');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to complete corrective action');
    },
  });
};

export const useVerifyCorrectiveAction = () => {
  const auditApi = useAuditApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, effectivenessRating, verificationNotes }: { id: string; effectivenessRating: string; verificationNotes: string }) =>
      auditApi.verifyCorrectiveAction(id, effectivenessRating, verificationNotes),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['audits'] });
      void queryClient.invalidateQueries({ queryKey: ['audits', data.auditId] });
      void queryClient.invalidateQueries({ queryKey: ['audits', 'corrective-actions'] });
      toast.success('Corrective action verified');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to verify corrective action');
    },
  });
};

// ============================================================================
// Templates
// ============================================================================

export const useAuditTemplates = () => {
  const auditApi = useAuditApi();

  return useQuery({
    queryKey: ['audits', 'templates'],
    queryFn: () => auditApi.getAuditTemplates(),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};

export const useAuditTemplate = (id: string | undefined) => {
  const auditApi = useAuditApi();

  return useQuery({
    queryKey: ['audits', 'templates', id],
    queryFn: () => auditApi.getAuditTemplateById(id!),
    enabled: !!id,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};
