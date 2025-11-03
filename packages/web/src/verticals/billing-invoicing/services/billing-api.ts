import type { ApiClient } from '@/core/services';
import type {
  Invoice,
  Payment,
  CreateInvoiceInput,
  UpdateInvoiceInput,
  CreatePaymentInput,
  BillingSearchFilters,
  InvoiceListResponse,
  BillingSummary,
} from '../types';

export interface BillingApiService {
  getInvoices(filters?: BillingSearchFilters): Promise<InvoiceListResponse>;
  getInvoiceById(id: string): Promise<Invoice>;
  createInvoice(input: CreateInvoiceInput): Promise<Invoice>;
  updateInvoice(id: string, input: UpdateInvoiceInput): Promise<Invoice>;
  deleteInvoice(id: string): Promise<void>;
  sendInvoice(id: string): Promise<Invoice>;
  voidInvoice(id: string): Promise<Invoice>;

  getPaymentsByInvoice(invoiceId: string): Promise<Payment[]>;
  createPayment(input: CreatePaymentInput): Promise<Payment>;

  getBillingSummary(filters?: { startDate?: string; endDate?: string }): Promise<BillingSummary>;
  generateInvoicePdf(id: string): Promise<globalThis.Blob>;
}

export const createBillingApiService = (apiClient: ApiClient): BillingApiService => {
  return {
    getInvoices: async (filters?: BillingSearchFilters) => {
      const params = new URLSearchParams();

      if (filters?.clientId) params.append('clientId', filters.clientId);
      if (filters?.payerId) params.append('payerId', filters.payerId);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.payerType) params.append('payerType', filters.payerType);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.minAmount) params.append('minAmount', filters.minAmount.toString());
      if (filters?.maxAmount) params.append('maxAmount', filters.maxAmount.toString());
      if (filters?.isPastDue !== undefined)
        params.append('isPastDue', filters.isPastDue.toString());

      const url = `/api/billing/invoices${params.toString() ? `?${params.toString()}` : ''}`;
      return apiClient.get<InvoiceListResponse>(url);
    },

    getInvoiceById: async (id: string) => {
      return apiClient.get<Invoice>(`/api/billing/invoices/${id}`);
    },

    createInvoice: async (input: CreateInvoiceInput) => {
      return apiClient.post<Invoice>('/api/billing/invoices', input);
    },

    updateInvoice: async (id: string, input: UpdateInvoiceInput) => {
      return apiClient.patch<Invoice>(`/api/billing/invoices/${id}`, input);
    },

    deleteInvoice: async (id: string) => {
      return apiClient.delete<void>(`/api/billing/invoices/${id}`);
    },

    sendInvoice: async (id: string) => {
      return apiClient.post<Invoice>(`/api/billing/invoices/${id}/send`, {});
    },

    voidInvoice: async (id: string) => {
      return apiClient.post<Invoice>(`/api/billing/invoices/${id}/void`, {});
    },

    getPaymentsByInvoice: async (invoiceId: string) => {
      return apiClient.get<Payment[]>(`/api/billing/invoices/${invoiceId}/payments`);
    },

    createPayment: async (input: CreatePaymentInput) => {
      return apiClient.post<Payment>('/api/billing/payments', input);
    },

    getBillingSummary: async (filters?: { startDate?: string; endDate?: string }) => {
      const params = new URLSearchParams();
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);

      const url = `/api/billing/summary${params.toString() ? `?${params.toString()}` : ''}`;
      return apiClient.get<BillingSummary>(url);
    },

    generateInvoicePdf: async (id: string) => {
      const response = await fetch(`/api/billing/invoices/${id}/pdf`, {
        headers: {
          Authorization: `Bearer ${globalThis.localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      return response.blob();
    },
  };
};
