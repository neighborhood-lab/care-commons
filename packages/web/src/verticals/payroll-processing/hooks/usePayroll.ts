import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useApiClient } from '@/core/hooks';
import { createPayrollApiService } from '../services/payroll-api';
import type {
  PayrollSearchFilters,
  PayRunSearchFilters,
  PayStubSearchFilters,
  CreatePayRunInput,
  ApprovePayRunInput,
} from '../types';

export const usePayrollApi = () => {
  const apiClient = useApiClient();
  return useMemo(() => createPayrollApiService(apiClient), [apiClient]);
};

export const usePayPeriods = (filters?: PayrollSearchFilters) => {
  const payrollApi = usePayrollApi();

  return useQuery({
    queryKey: ['pay-periods', filters],
    queryFn: () => payrollApi.getPayPeriods(filters),
  });
};

export const usePayPeriod = (id: string | undefined) => {
  const payrollApi = usePayrollApi();

  return useQuery({
    queryKey: ['pay-periods', id],
    queryFn: () => payrollApi.getPayPeriodById(id!),
    enabled: !!id,
  });
};

export const usePayRuns = (filters?: PayRunSearchFilters) => {
  const payrollApi = usePayrollApi();

  return useQuery({
    queryKey: ['pay-runs', filters],
    queryFn: () => payrollApi.getPayRuns(filters),
  });
};

export const usePayRun = (id: string | undefined) => {
  const payrollApi = usePayrollApi();

  return useQuery({
    queryKey: ['pay-runs', id],
    queryFn: () => payrollApi.getPayRunById(id!),
    enabled: !!id,
  });
};

export const usePayStubs = (filters?: PayStubSearchFilters) => {
  const payrollApi = usePayrollApi();

  return useQuery({
    queryKey: ['pay-stubs', filters],
    queryFn: () => payrollApi.getPayStubs(filters),
  });
};

export const usePayStub = (id: string | undefined) => {
  const payrollApi = usePayrollApi();

  return useQuery({
    queryKey: ['pay-stubs', id],
    queryFn: () => payrollApi.getPayStubById(id!),
    enabled: !!id,
  });
};

export const usePayrollSummary = () => {
  const payrollApi = usePayrollApi();

  return useQuery({
    queryKey: ['payroll-summary'],
    queryFn: () => payrollApi.getPayrollSummary(),
  });
};

export const useCreatePayRun = () => {
  const payrollApi = usePayrollApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreatePayRunInput) => payrollApi.createPayRun(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pay-runs'] });
      queryClient.invalidateQueries({ queryKey: ['pay-periods'] });
      queryClient.invalidateQueries({ queryKey: ['payroll-summary'] });
      toast.success('Pay run created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create pay run');
    },
  });
};

export const useCalculatePayRun = () => {
  const payrollApi = usePayrollApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => payrollApi.calculatePayRun(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pay-runs'] });
      queryClient.invalidateQueries({ queryKey: ['pay-runs', data.id] });
      toast.success('Pay run calculated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to calculate pay run');
    },
  });
};

export const useApprovePayRun = () => {
  const payrollApi = usePayrollApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input?: ApprovePayRunInput }) =>
      payrollApi.approvePayRun(id, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pay-runs'] });
      queryClient.invalidateQueries({ queryKey: ['pay-runs', data.id] });
      queryClient.invalidateQueries({ queryKey: ['payroll-summary'] });
      toast.success('Pay run approved successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to approve pay run');
    },
  });
};

export const useProcessPayRun = () => {
  const payrollApi = usePayrollApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => payrollApi.processPayRun(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pay-runs'] });
      queryClient.invalidateQueries({ queryKey: ['pay-runs', data.id] });
      queryClient.invalidateQueries({ queryKey: ['pay-stubs'] });
      queryClient.invalidateQueries({ queryKey: ['payroll-summary'] });
      toast.success('Pay run processed successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to process pay run');
    },
  });
};

export const useDownloadPayStubPdf = () => {
  const payrollApi = usePayrollApi();

  return useMutation({
    mutationFn: async (id: string) => {
      const blob = await payrollApi.downloadPayStubPdf(id);

      // Sanitize the id to prevent XSS
      const sanitizedId = id.replace(/[^a-zA-Z0-9-_]/g, '');
      
      // Use modern download API without DOM manipulation
      if ('showSaveFilePicker' in window && typeof window.showSaveFilePicker === 'function') {
        type FilePickerOptions = {
          suggestedName: string;
          types: Array<{
            description: string;
            accept: Record<string, string[]>;
          }>;
        };
        
        type FileSystemFileHandle = {
          createWritable(): Promise<FileSystemWritableFileStream>;
        };
        
        type FileSystemWritableFileStream = {
          write(data: globalThis.Blob): Promise<void>;
          close(): Promise<void>;
        };
        
        const fileHandle = await (window as unknown as {
          showSaveFilePicker(options: FilePickerOptions): Promise<FileSystemFileHandle>;
        }).showSaveFilePicker({
          suggestedName: `paystub-${sanitizedId}.pdf`,
          types: [{
            description: 'PDF files',
            accept: { 'application/pdf': ['.pdf'] }
          }]
        });
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
      } else {
        // Fallback: inform user to use modern browser
        throw new Error(
          'PDF download requires a modern browser with File System Access API support. ' +
          'Please update your browser or contact support for assistance.'
        );
      }
    },
    onSuccess: () => {
      toast.success('Pay stub PDF downloaded');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to download pay stub');
    },
  });
};
