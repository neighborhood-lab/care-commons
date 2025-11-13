import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useApiClient } from '@/core/hooks';
import { createClientApiService } from '../services/client-api';
import type { ClientSearchFilters, CreateClientInput, UpdateClientInput } from '../types';
import type { SearchParams } from '@/core/types';

export const useClientApi = () => {
  const apiClient = useApiClient();
  return useMemo(() => createClientApiService(apiClient), [apiClient]);
};

export const useClients = (filters?: ClientSearchFilters & SearchParams) => {
  const clientApi = useClientApi();
  
  return useQuery({
    queryKey: ['clients', filters],
    queryFn: () => clientApi.getClients(filters),
  });
};

export const useClient = (id: string | undefined) => {
  const clientApi = useClientApi();
  
  return useQuery({
    queryKey: ['clients', id],
    queryFn: () => clientApi.getClientById(id!),
    enabled: !!id,
  });
};

export const useCreateClient = () => {
  const clientApi = useClientApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateClientInput) => clientApi.createClient(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create client');
    },
  });
};

export const useUpdateClient = () => {
  const clientApi = useClientApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateClientInput }) =>
      clientApi.updateClient(id, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['clients', data.id] });
      toast.success('Client updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update client');
    },
  });
};

export const useDeleteClient = () => {
  const clientApi = useClientApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => clientApi.deleteClient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete client');
    },
  });
};

export const useClientsDashboard = (filters?: ClientSearchFilters & SearchParams) => {
  const clientApi = useClientApi();
  
  return useQuery({
    queryKey: ['clients', 'dashboard', filters],
    queryFn: () => clientApi.getClientsDashboard(filters),
  });
};
