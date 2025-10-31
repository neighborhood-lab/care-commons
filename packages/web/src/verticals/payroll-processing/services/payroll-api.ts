import type { ApiClient } from '@/core/services';
import type {
  PayPeriod,
  PayRun,
  PayStub,
  PayPeriodListResponse,
  PayRunListResponse,
  PayStubListResponse,
  PayrollSummary,
  PayrollSearchFilters,
  PayRunSearchFilters,
  PayStubSearchFilters,
  CreatePayRunInput,
  ApprovePayRunInput,
} from '../types';

export interface PayrollApiService {
  getPayPeriods(filters?: PayrollSearchFilters): Promise<PayPeriodListResponse>;
  getPayPeriodById(id: string): Promise<PayPeriod>;
  getPayRuns(filters?: PayRunSearchFilters): Promise<PayRunListResponse>;
  getPayRunById(id: string): Promise<PayRun>;
  createPayRun(input: CreatePayRunInput): Promise<PayRun>;
  calculatePayRun(id: string): Promise<PayRun>;
  approvePayRun(id: string, input?: ApprovePayRunInput): Promise<PayRun>;
  processPayRun(id: string): Promise<PayRun>;
  getPayStubs(filters?: PayStubSearchFilters): Promise<PayStubListResponse>;
  getPayStubById(id: string): Promise<PayStub>;
  downloadPayStubPdf(id: string): Promise<Blob>;
  getPayrollSummary(): Promise<PayrollSummary>;
}

export const createPayrollApiService = (apiClient: ApiClient): PayrollApiService => {
  return {
    getPayPeriods: async (filters?: PayrollSearchFilters) => {
      const params = new URLSearchParams();

      if (filters?.periodType) params.append('periodType', filters.periodType);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.year) params.append('year', filters.year.toString());
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);

      const url = `/api/payroll/periods${params.toString() ? `?${params.toString()}` : ''}`;
      return apiClient.get<PayPeriodListResponse>(url);
    },

    getPayPeriodById: async (id: string) => {
      return apiClient.get<PayPeriod>(`/api/payroll/periods/${id}`);
    },

    getPayRuns: async (filters?: PayRunSearchFilters) => {
      const params = new URLSearchParams();

      if (filters?.payPeriodId) params.append('payPeriodId', filters.payPeriodId);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);

      const url = `/api/payroll/runs${params.toString() ? `?${params.toString()}` : ''}`;
      return apiClient.get<PayRunListResponse>(url);
    },

    getPayRunById: async (id: string) => {
      return apiClient.get<PayRun>(`/api/payroll/runs/${id}`);
    },

    createPayRun: async (input: CreatePayRunInput) => {
      return apiClient.post<PayRun>('/api/payroll/runs', input);
    },

    calculatePayRun: async (id: string) => {
      return apiClient.post<PayRun>(`/api/payroll/runs/${id}/calculate`, {});
    },

    approvePayRun: async (id: string, input?: ApprovePayRunInput) => {
      return apiClient.post<PayRun>(`/api/payroll/runs/${id}/approve`, input || {});
    },

    processPayRun: async (id: string) => {
      return apiClient.post<PayRun>(`/api/payroll/runs/${id}/process`, {});
    },

    getPayStubs: async (filters?: PayStubSearchFilters) => {
      const params = new URLSearchParams();

      if (filters?.payRunId) params.append('payRunId', filters.payRunId);
      if (filters?.payPeriodId) params.append('payPeriodId', filters.payPeriodId);
      if (filters?.caregiverId) params.append('caregiverId', filters.caregiverId);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.paymentMethod) params.append('paymentMethod', filters.paymentMethod);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);

      const url = `/api/payroll/stubs${params.toString() ? `?${params.toString()}` : ''}`;
      return apiClient.get<PayStubListResponse>(url);
    },

    getPayStubById: async (id: string) => {
      return apiClient.get<PayStub>(`/api/payroll/stubs/${id}`);
    },

    downloadPayStubPdf: async (id: string) => {
      const response = await fetch(`/api/payroll/stubs/${id}/pdf`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      return response.blob();
    },

    getPayrollSummary: async () => {
      return apiClient.get<PayrollSummary>('/api/payroll/summary');
    },
  };
};
