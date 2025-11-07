/**
 * Quality Assurance & Audits API Service
 *
 * API client for audit management, findings, and corrective actions
 */

import type { ApiClient } from '@/core/services';
import type { PaginatedResult, SearchParams } from '@/core/types';
import type {
  Audit,
  AuditSummary,
  AuditDetail,
  AuditDashboard,
  AuditFinding,
  CorrectiveAction,
  AuditTemplate,
  CreateAuditInput,
  UpdateAuditInput,
  CreateAuditFindingInput,
  CreateCorrectiveActionInput,
  UpdateCorrectiveActionProgressInput
} from '../types';

export interface AuditFilters extends SearchParams {
  status?: string;
  auditType?: string;
  priority?: string;
  branchId?: string;
  leadAuditorId?: string;
}

export interface FindingFilters extends SearchParams {
  severity?: string;
  status?: string;
  category?: string;
  auditId?: string;
}

export interface CorrectiveActionFilters extends SearchParams {
  status?: string;
  auditId?: string;
  findingId?: string;
  responsiblePersonId?: string;
}

export interface AuditApiService {
  // Audit management
  getAudits(filters?: AuditFilters): Promise<PaginatedResult<AuditSummary>>;
  getAuditById(id: string): Promise<Audit>;
  getAuditDetail(id: string): Promise<AuditDetail>;
  createAudit(input: CreateAuditInput): Promise<Audit>;
  updateAudit(id: string, input: UpdateAuditInput): Promise<Audit>;
  startAudit(id: string): Promise<Audit>;
  completeAudit(id: string, executiveSummary: string, recommendations: string): Promise<Audit>;
  deleteAudit(id: string): Promise<void>;

  // Audit findings
  getFindings(filters?: FindingFilters): Promise<PaginatedResult<AuditFinding>>;
  getFindingById(id: string): Promise<AuditFinding>;
  getFindingsForAudit(auditId: string): Promise<AuditFinding[]>;
  createFinding(input: CreateAuditFindingInput): Promise<AuditFinding>;
  updateFindingStatus(id: string, status: string, resolutionDescription?: string): Promise<AuditFinding>;
  verifyFinding(id: string, verificationNotes: string): Promise<AuditFinding>;
  getCriticalFindings(limit?: number): Promise<AuditFinding[]>;

  // Corrective actions
  getCorrectiveActions(filters?: CorrectiveActionFilters): Promise<PaginatedResult<CorrectiveAction>>;
  getCorrectiveActionById(id: string): Promise<CorrectiveAction>;
  getCorrectiveActionsForAudit(auditId: string): Promise<CorrectiveAction[]>;
  createCorrectiveAction(input: CreateCorrectiveActionInput): Promise<CorrectiveAction>;
  updateCorrectiveActionProgress(id: string, progress: UpdateCorrectiveActionProgressInput): Promise<CorrectiveAction>;
  completeCorrectiveAction(id: string): Promise<CorrectiveAction>;
  verifyCorrectiveAction(id: string, effectivenessRating: string, verificationNotes: string): Promise<CorrectiveAction>;
  getOverdueCorrectiveActions(limit?: number): Promise<CorrectiveAction[]>;

  // Audit templates
  getAuditTemplates(): Promise<AuditTemplate[]>;
  getAuditTemplateById(id: string): Promise<AuditTemplate>;

  // Dashboard
  getAuditDashboard(): Promise<AuditDashboard>;
}

export const createAuditApiService = (apiClient: ApiClient): AuditApiService => {
  return {
    // ========================================================================
    // Audit Management
    // ========================================================================

    async getAudits(filters?: AuditFilters): Promise<PaginatedResult<AuditSummary>> {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.auditType) params.append('auditType', filters.auditType);
      if (filters?.priority) params.append('priority', filters.priority);
      if (filters?.branchId) params.append('branchId', filters.branchId);
      if (filters?.leadAuditorId) params.append('leadAuditorId', filters.leadAuditorId);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.pageSize) params.append('pageSize', filters.pageSize.toString());
      if (filters?.sortBy) params.append('sortBy', filters.sortBy);
      if (filters?.sortDirection) params.append('sortDirection', filters.sortDirection);

      const queryString = params.toString();
      return apiClient.get<PaginatedResult<AuditSummary>>(
        `/api/audits${queryString ? `?${queryString}` : ''}`
      );
    },

    async getAuditById(id: string): Promise<Audit> {
      return apiClient.get<Audit>(`/api/audits/${id}`);
    },

    async getAuditDetail(id: string): Promise<AuditDetail> {
      return apiClient.get<AuditDetail>(`/api/audits/${id}/detail`);
    },

    async createAudit(input: CreateAuditInput): Promise<Audit> {
      return apiClient.post<Audit>('/api/audits', input);
    },

    async updateAudit(id: string, input: UpdateAuditInput): Promise<Audit> {
      return apiClient.patch<Audit>(`/api/audits/${id}`, input);
    },

    async startAudit(id: string): Promise<Audit> {
      return apiClient.post<Audit>(`/api/audits/${id}/start`, {});
    },

    async completeAudit(
      id: string,
      executiveSummary: string,
      recommendations: string
    ): Promise<Audit> {
      return apiClient.post<Audit>(`/api/audits/${id}/complete`, {
        executiveSummary,
        recommendations
      });
    },

    async deleteAudit(id: string): Promise<void> {
      return apiClient.delete<void>(`/api/audits/${id}`);
    },

    // ========================================================================
    // Audit Findings
    // ========================================================================

    async getFindings(filters?: FindingFilters): Promise<PaginatedResult<AuditFinding>> {
      const params = new URLSearchParams();
      if (filters?.severity) params.append('severity', filters.severity);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.category) params.append('category', filters.category);
      if (filters?.auditId) params.append('auditId', filters.auditId);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.pageSize) params.append('pageSize', filters.pageSize.toString());
      if (filters?.sortBy) params.append('sortBy', filters.sortBy);
      if (filters?.sortDirection) params.append('sortDirection', filters.sortDirection);

      const queryString = params.toString();
      return apiClient.get<PaginatedResult<AuditFinding>>(
        `/api/audits/findings${queryString ? `?${queryString}` : ''}`
      );
    },

    async getFindingById(id: string): Promise<AuditFinding> {
      return apiClient.get<AuditFinding>(`/api/audits/findings/${id}`);
    },

    async getFindingsForAudit(auditId: string): Promise<AuditFinding[]> {
      return apiClient.get<AuditFinding[]>(`/api/audits/${auditId}/findings`);
    },

    async createFinding(input: CreateAuditFindingInput): Promise<AuditFinding> {
      return apiClient.post<AuditFinding>('/api/audits/findings', input);
    },

    async updateFindingStatus(
      id: string,
      status: string,
      resolutionDescription?: string
    ): Promise<AuditFinding> {
      return apiClient.patch<AuditFinding>(`/api/audits/findings/${id}/status`, {
        status,
        resolutionDescription
      });
    },

    async verifyFinding(id: string, verificationNotes: string): Promise<AuditFinding> {
      return apiClient.post<AuditFinding>(`/api/audits/findings/${id}/verify`, {
        verificationNotes
      });
    },

    async getCriticalFindings(limit: number = 10): Promise<AuditFinding[]> {
      return apiClient.get<AuditFinding[]>(`/api/audits/findings/critical?limit=${limit}`);
    },

    // ========================================================================
    // Corrective Actions
    // ========================================================================

    async getCorrectiveActions(
      filters?: CorrectiveActionFilters
    ): Promise<PaginatedResult<CorrectiveAction>> {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.auditId) params.append('auditId', filters.auditId);
      if (filters?.findingId) params.append('findingId', filters.findingId);
      if (filters?.responsiblePersonId) params.append('responsiblePersonId', filters.responsiblePersonId);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.pageSize) params.append('pageSize', filters.pageSize.toString());
      if (filters?.sortBy) params.append('sortBy', filters.sortBy);
      if (filters?.sortDirection) params.append('sortDirection', filters.sortDirection);

      const queryString = params.toString();
      return apiClient.get<PaginatedResult<CorrectiveAction>>(
        `/api/audits/corrective-actions${queryString ? `?${queryString}` : ''}`
      );
    },

    async getCorrectiveActionById(id: string): Promise<CorrectiveAction> {
      return apiClient.get<CorrectiveAction>(`/api/audits/corrective-actions/${id}`);
    },

    async getCorrectiveActionsForAudit(auditId: string): Promise<CorrectiveAction[]> {
      return apiClient.get<CorrectiveAction[]>(`/api/audits/${auditId}/corrective-actions`);
    },

    async createCorrectiveAction(input: CreateCorrectiveActionInput): Promise<CorrectiveAction> {
      return apiClient.post<CorrectiveAction>('/api/audits/corrective-actions', input);
    },

    async updateCorrectiveActionProgress(
      id: string,
      progress: UpdateCorrectiveActionProgressInput
    ): Promise<CorrectiveAction> {
      return apiClient.patch<CorrectiveAction>(
        `/api/audits/corrective-actions/${id}/progress`,
        progress
      );
    },

    async completeCorrectiveAction(id: string): Promise<CorrectiveAction> {
      return apiClient.post<CorrectiveAction>(`/api/audits/corrective-actions/${id}/complete`, {});
    },

    async verifyCorrectiveAction(
      id: string,
      effectivenessRating: string,
      verificationNotes: string
    ): Promise<CorrectiveAction> {
      return apiClient.post<CorrectiveAction>(
        `/api/audits/corrective-actions/${id}/verify`,
        {
          effectivenessRating,
          verificationNotes
        }
      );
    },

    async getOverdueCorrectiveActions(limit: number = 20): Promise<CorrectiveAction[]> {
      return apiClient.get<CorrectiveAction[]>(
        `/api/audits/corrective-actions/overdue?limit=${limit}`
      );
    },

    // ========================================================================
    // Audit Templates
    // ========================================================================

    async getAuditTemplates(): Promise<AuditTemplate[]> {
      return apiClient.get<AuditTemplate[]>('/api/audits/templates');
    },

    async getAuditTemplateById(id: string): Promise<AuditTemplate> {
      return apiClient.get<AuditTemplate>(`/api/audits/templates/${id}`);
    },

    // ========================================================================
    // Dashboard
    // ========================================================================

    async getAuditDashboard(): Promise<AuditDashboard> {
      return apiClient.get<AuditDashboard>('/api/audits/dashboard');
    }
  };
};
