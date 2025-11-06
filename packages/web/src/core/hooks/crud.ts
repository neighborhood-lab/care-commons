import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useApiClient } from './api';

/**
 * Generic API service interface for CRUD operations
 */
export interface CrudApiService<T, TListResponse, TFilters, TCreateInput, TUpdateInput> {
  getAll: (filters?: TFilters) => Promise<TListResponse>;
  getById: (id: string) => Promise<T>;
  create: (input: TCreateInput) => Promise<T>;
  update: (id: string, input: TUpdateInput) => Promise<T>;
  delete: (id: string) => Promise<void>;
}

/**
 * Configuration for CRUD hooks
 */
export interface CrudHooksConfig {
  entityName: string; // e.g., 'client', 'invoice', 'caregiver'
  entityNamePlural: string; // e.g., 'clients', 'invoices', 'caregivers'
  messages?: {
    createSuccess?: string;
    createError?: string;
    updateSuccess?: string;
    updateError?: string;
    deleteSuccess?: string;
    deleteError?: string;
  };
}

/**
 * Factory function to create a set of CRUD hooks for any entity
 *
 * @example
 * ```typescript
 * const clientHooks = createCrudHooks(
 *   createClientApiService,
 *   { entityName: 'client', entityNamePlural: 'clients' }
 * );
 *
 * // Use the generated hooks
 * const { data: clients } = clientHooks.useList(filters);
 * const { data: client } = clientHooks.useOne(id);
 * const createMutation = clientHooks.useCreate();
 * ```
 */
export function createCrudHooks<T, TListResponse, TFilters, TCreateInput, TUpdateInput>(
  createApiService: (apiClient: any) => CrudApiService<T, TListResponse, TFilters, TCreateInput, TUpdateInput>,
  config: CrudHooksConfig
) {
  const { entityName, entityNamePlural, messages = {} } = config;

  // Hook to create the API service instance
  const useApi = () => {
    const apiClient = useApiClient();
    return useMemo(() => createApiService(apiClient), [apiClient]);
  };

  // Hook to fetch list of entities
  const useList = (
    filters?: TFilters,
    options?: Omit<UseQueryOptions<TListResponse, Error>, 'queryKey' | 'queryFn'>
  ) => {
    const api = useApi();

    return useQuery({
      queryKey: [entityNamePlural, filters],
      queryFn: () => api.getAll(filters),
      ...options,
    });
  };

  // Hook to fetch a single entity by ID
  const useOne = (
    id: string | undefined,
    options?: Omit<UseQueryOptions<T, Error>, 'queryKey' | 'queryFn' | 'enabled'>
  ) => {
    const api = useApi();

    return useQuery({
      queryKey: [entityNamePlural, id],
      queryFn: () => api.getById(id!),
      enabled: !!id,
      ...options,
    });
  };

  // Hook to create a new entity
  const useCreate = (
    options?: Omit<UseMutationOptions<T, Error, TCreateInput>, 'mutationFn'>
  ) => {
    const api = useApi();
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (input: TCreateInput) => api.create(input),
      onSuccess: (data, variables, context) => {
        queryClient.invalidateQueries({ queryKey: [entityNamePlural] });
        toast.success(messages.createSuccess || `${entityName} created successfully`);
        options?.onSuccess?.(data, variables, context);
      },
      onError: (error: Error, variables, context) => {
        toast.error(error.message || messages.createError || `Failed to create ${entityName}`);
        options?.onError?.(error, variables, context);
      },
      ...options,
    });
  };

  // Hook to update an existing entity
  const useUpdate = (
    options?: Omit<UseMutationOptions<T, Error, { id: string; input: TUpdateInput }>, 'mutationFn'>
  ) => {
    const api = useApi();
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: ({ id, input }: { id: string; input: TUpdateInput }) =>
        api.update(id, input),
      onSuccess: (data: any, variables, context) => {
        queryClient.invalidateQueries({ queryKey: [entityNamePlural] });
        queryClient.invalidateQueries({ queryKey: [entityNamePlural, data.id] });
        toast.success(messages.updateSuccess || `${entityName} updated successfully`);
        options?.onSuccess?.(data, variables, context);
      },
      onError: (error: Error, variables, context) => {
        toast.error(error.message || messages.updateError || `Failed to update ${entityName}`);
        options?.onError?.(error, variables, context);
      },
      ...options,
    });
  };

  // Hook to delete an entity
  const useDelete = (
    options?: Omit<UseMutationOptions<void, Error, string>, 'mutationFn'>
  ) => {
    const api = useApi();
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (id: string) => api.delete(id),
      onSuccess: (data, variables, context) => {
        queryClient.invalidateQueries({ queryKey: [entityNamePlural] });
        toast.success(messages.deleteSuccess || `${entityName} deleted successfully`);
        options?.onSuccess?.(data, variables, context);
      },
      onError: (error: Error, variables, context) => {
        toast.error(error.message || messages.deleteError || `Failed to delete ${entityName}`);
        options?.onError?.(error, variables, context);
      },
      ...options,
    });
  };

  return {
    useApi,
    useList,
    useOne,
    useCreate,
    useUpdate,
    useDelete,
  };
}
