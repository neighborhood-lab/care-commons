import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useApiClient } from '@/core/hooks';
import { createBillingApiService } from '../services/billing-api';
import type { 
  BillingSearchFilters, 
  CreateInvoiceInput, 
  UpdateInvoiceInput,
  CreatePaymentInput 
} from '../types';

export const useBillingApi = () => {
  const apiClient = useApiClient();
  return useMemo(() => createBillingApiService(apiClient), [apiClient]);
};

export const useInvoices = (filters?: BillingSearchFilters) => {
  const billingApi = useBillingApi();

  return useQuery({
    queryKey: ['invoices', filters],
    queryFn: () => billingApi.getInvoices(filters),
  });
};

export const useInvoice = (id: string | undefined) => {
  const billingApi = useBillingApi();

  return useQuery({
    queryKey: ['invoices', id],
    queryFn: () => billingApi.getInvoiceById(id!),
    enabled: !!id,
  });
};

export const useBillingSummary = (filters?: { startDate?: string; endDate?: string }) => {
  const billingApi = useBillingApi();

  return useQuery({
    queryKey: ['billing-summary', filters],
    queryFn: () => billingApi.getBillingSummary(filters),
  });
};

export const useInvoicePayments = (invoiceId: string | undefined) => {
  const billingApi = useBillingApi();

  return useQuery({
    queryKey: ['payments', 'invoice', invoiceId],
    queryFn: () => billingApi.getPaymentsByInvoice(invoiceId!),
    enabled: !!invoiceId,
  });
};

export const useCreateInvoice = () => {
  const billingApi = useBillingApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateInvoiceInput) => billingApi.createInvoice(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['billing-summary'] });
      toast.success('Invoice created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create invoice');
    },
  });
};

export const useUpdateInvoice = () => {
  const billingApi = useBillingApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateInvoiceInput }) =>
      billingApi.updateInvoice(id, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoices', data.id] });
      queryClient.invalidateQueries({ queryKey: ['billing-summary'] });
      toast.success('Invoice updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update invoice');
    },
  });
};

export const useDeleteInvoice = () => {
  const billingApi = useBillingApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => billingApi.deleteInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['billing-summary'] });
      toast.success('Invoice deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete invoice');
    },
  });
};

export const useSendInvoice = () => {
  const billingApi = useBillingApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => billingApi.sendInvoice(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoices', data.id] });
      toast.success('Invoice sent successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to send invoice');
    },
  });
};

export const useVoidInvoice = () => {
  const billingApi = useBillingApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => billingApi.voidInvoice(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoices', data.id] });
      queryClient.invalidateQueries({ queryKey: ['billing-summary'] });
      toast.success('Invoice voided successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to void invoice');
    },
  });
};

export const useCreatePayment = () => {
  const billingApi = useBillingApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreatePaymentInput) => billingApi.createPayment(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoices', data.invoiceId] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['billing-summary'] });
      toast.success('Payment recorded successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to record payment');
    },
  });
};

export const useDownloadInvoicePdf = () => {
  const billingApi = useBillingApi();

  return useMutation({
    mutationFn: async (id: string) => {
      const blob = await billingApi.generateInvoicePdf(id);

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
    onSuccess: () => {
      toast.success('Invoice PDF downloaded');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to download invoice');
    },
  });
};
