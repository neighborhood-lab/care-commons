import type { ApiClient } from '@/core/services';
import type { PaginatedResult, SearchParams } from '@/core/types';
import type {
  IncidentReport,
  RiskAssessment,
  Investigation,
  CorrectiveAction,
  RiskDashboard,
  CreateIncidentReportInput,
  CreateRiskAssessmentInput,
  CreateCorrectiveActionInput,
  IncidentReportSearchFilters,
  RiskAssessmentSearchFilters,
} from '../types';

export interface IncidentRiskApiService {
  // Incident Reports
  getIncidentReports(
    filters?: IncidentReportSearchFilters & SearchParams
  ): Promise<PaginatedResult<IncidentReport>>;
  getIncidentReportById(id: string): Promise<IncidentReport>;
  createIncidentReport(input: CreateIncidentReportInput): Promise<IncidentReport>;
  updateIncidentReport(id: string, input: Partial<IncidentReport>): Promise<IncidentReport>;
  closeIncident(id: string, closureNotes: string): Promise<IncidentReport>;

  // Risk Assessments
  getRiskAssessments(
    filters?: RiskAssessmentSearchFilters & SearchParams
  ): Promise<PaginatedResult<RiskAssessment>>;
  getRiskAssessmentById(id: string): Promise<RiskAssessment>;
  getClientActiveRisks(clientId: string): Promise<RiskAssessment[]>;
  createRiskAssessment(input: CreateRiskAssessmentInput): Promise<RiskAssessment>;

  // Investigations
  getInvestigationById(id: string): Promise<Investigation>;
  getInvestigationByIncidentId(incidentId: string): Promise<Investigation | null>;
  startInvestigation(input: {
    incidentReportId: string;
    priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    assignedTo: string;
    dueDate: string;
    methodsUsed: string[];
  }): Promise<Investigation>;
  completeInvestigation(
    id: string,
    findings: string,
    outcome: string,
    recommendations: string[]
  ): Promise<Investigation>;

  // Corrective Actions
  getCorrectiveActionsByIncident(incidentId: string): Promise<CorrectiveAction[]>;
  createCorrectiveAction(input: CreateCorrectiveActionInput): Promise<CorrectiveAction>;
  updateCorrectiveActionProgress(
    id: string,
    progress: number,
    notes: string
  ): Promise<CorrectiveAction>;
  verifyCorrectiveAction(
    id: string,
    effectivenessRating: string,
    verificationNotes: string
  ): Promise<CorrectiveAction>;

  // Dashboard
  getRiskDashboard(organizationId: string, branchId?: string): Promise<RiskDashboard>;
}

export const createIncidentRiskApiService = (apiClient: ApiClient): IncidentRiskApiService => {
  return {
    // ============================================================================
    // Incident Reports
    // ============================================================================

    async getIncidentReports(
      filters?: IncidentReportSearchFilters & SearchParams
    ): Promise<PaginatedResult<IncidentReport>> {
      const params = new URLSearchParams();
      if (filters?.query) params.append('query', filters.query);
      if (filters?.clientId) params.append('clientId', filters.clientId);
      if (filters?.organizationId) params.append('organizationId', filters.organizationId);
      if (filters?.branchId) params.append('branchId', filters.branchId);
      if (filters?.status) for (const s of filters.status) params.append('status', s);
      if (filters?.severity) for (const sev of filters.severity) params.append('severity', sev);
      if (filters?.incidentType)
        for (const t of filters.incidentType) params.append('incidentType', t);
      if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters?.dateTo) params.append('dateTo', filters.dateTo);
      if (filters?.reportedBy) params.append('reportedBy', filters.reportedBy);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.pageSize) params.append('pageSize', filters.pageSize.toString());
      if (filters?.sortBy) params.append('sortBy', filters.sortBy);
      if (filters?.sortDirection) params.append('sortDirection', filters.sortDirection);

      const queryString = params.toString();
      return apiClient.get<PaginatedResult<IncidentReport>>(
        `/api/incidents${queryString ? `?${queryString}` : ''}`
      );
    },

    async getIncidentReportById(id: string): Promise<IncidentReport> {
      return apiClient.get<IncidentReport>(`/api/incidents/${id}`);
    },

    async createIncidentReport(input: CreateIncidentReportInput): Promise<IncidentReport> {
      return apiClient.post<IncidentReport>('/api/incidents', input);
    },

    async updateIncidentReport(
      id: string,
      input: Partial<IncidentReport>
    ): Promise<IncidentReport> {
      return apiClient.patch<IncidentReport>(`/api/incidents/${id}`, input);
    },

    async closeIncident(id: string, closureNotes: string): Promise<IncidentReport> {
      return apiClient.post<IncidentReport>(`/api/incidents/${id}/close`, { closureNotes });
    },

    // ============================================================================
    // Risk Assessments
    // ============================================================================

    async getRiskAssessments(
      filters?: RiskAssessmentSearchFilters & SearchParams
    ): Promise<PaginatedResult<RiskAssessment>> {
      const params = new URLSearchParams();
      if (filters?.query) params.append('query', filters.query);
      if (filters?.clientId) params.append('clientId', filters.clientId);
      if (filters?.organizationId) params.append('organizationId', filters.organizationId);
      if (filters?.branchId) params.append('branchId', filters.branchId);
      if (filters?.riskType) for (const t of filters.riskType) params.append('riskType', t);
      if (filters?.riskLevel) for (const l of filters.riskLevel) params.append('riskLevel', l);
      if (filters?.status) for (const s of filters.status) params.append('status', s);
      if (filters?.overdueReview)
        params.append('overdueReview', filters.overdueReview.toString());
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.pageSize) params.append('pageSize', filters.pageSize.toString());
      if (filters?.sortBy) params.append('sortBy', filters.sortBy);
      if (filters?.sortDirection) params.append('sortDirection', filters.sortDirection);

      const queryString = params.toString();
      return apiClient.get<PaginatedResult<RiskAssessment>>(
        `/api/risk-assessments${queryString ? `?${queryString}` : ''}`
      );
    },

    async getRiskAssessmentById(id: string): Promise<RiskAssessment> {
      return apiClient.get<RiskAssessment>(`/api/risk-assessments/${id}`);
    },

    async getClientActiveRisks(clientId: string): Promise<RiskAssessment[]> {
      return apiClient.get<RiskAssessment[]>(`/api/clients/${clientId}/risk-assessments/active`);
    },

    async createRiskAssessment(input: CreateRiskAssessmentInput): Promise<RiskAssessment> {
      return apiClient.post<RiskAssessment>('/api/risk-assessments', input);
    },

    // ============================================================================
    // Investigations
    // ============================================================================

    async getInvestigationById(id: string): Promise<Investigation> {
      return apiClient.get<Investigation>(`/api/investigations/${id}`);
    },

    async getInvestigationByIncidentId(incidentId: string): Promise<Investigation | null> {
      return apiClient.get<Investigation | null>(`/api/incidents/${incidentId}/investigation`);
    },

    async startInvestigation(input: {
      incidentReportId: string;
      priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
      assignedTo: string;
      dueDate: string;
      methodsUsed: string[];
    }): Promise<Investigation> {
      return apiClient.post<Investigation>('/api/investigations', input);
    },

    async completeInvestigation(
      id: string,
      findings: string,
      outcome: string,
      recommendations: string[]
    ): Promise<Investigation> {
      return apiClient.post<Investigation>(`/api/investigations/${id}/complete`, {
        findings,
        outcome,
        recommendations,
      });
    },

    // ============================================================================
    // Corrective Actions
    // ============================================================================

    async getCorrectiveActionsByIncident(incidentId: string): Promise<CorrectiveAction[]> {
      return apiClient.get<CorrectiveAction[]>(`/api/incidents/${incidentId}/corrective-actions`);
    },

    async createCorrectiveAction(input: CreateCorrectiveActionInput): Promise<CorrectiveAction> {
      return apiClient.post<CorrectiveAction>('/api/corrective-actions', input);
    },

    async updateCorrectiveActionProgress(
      id: string,
      progress: number,
      notes: string
    ): Promise<CorrectiveAction> {
      return apiClient.patch<CorrectiveAction>(`/api/corrective-actions/${id}/progress`, {
        progress,
        notes,
      });
    },

    async verifyCorrectiveAction(
      id: string,
      effectivenessRating: string,
      verificationNotes: string
    ): Promise<CorrectiveAction> {
      return apiClient.post<CorrectiveAction>(`/api/corrective-actions/${id}/verify`, {
        effectivenessRating,
        verificationNotes,
      });
    },

    // ============================================================================
    // Dashboard
    // ============================================================================

    async getRiskDashboard(organizationId: string, branchId?: string): Promise<RiskDashboard> {
      const params = new URLSearchParams();
      params.append('organizationId', organizationId);
      if (branchId) params.append('branchId', branchId);

      return apiClient.get<RiskDashboard>(`/api/risk-dashboard?${params.toString()}`);
    },
  };
};
