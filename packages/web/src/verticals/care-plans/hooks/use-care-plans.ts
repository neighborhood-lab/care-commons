import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useApiClient } from '@/core/hooks';
import { createCarePlanApiService } from '../services/care-plan-api-service';
import type {
  CarePlanSearchFilters,
  TaskInstanceSearchFilters,
  CreateCarePlanInput,
  UpdateCarePlanInput,
  CompleteTaskInput,
} from '../types';
import type { SearchParams } from '@/core/types';

export const useCarePlanApi = () => {
  const apiClient = useApiClient();
  return useMemo(() => createCarePlanApiService(apiClient), [apiClient]);
};

export const useCarePlans = (filters?: CarePlanSearchFilters & SearchParams) => {
  const carePlanApi = useCarePlanApi();

  return useQuery({
    queryKey: ['care-plans', filters],
    queryFn: () => carePlanApi.getCarePlans(filters),
  });
};

export const useCarePlan = (id: string | undefined) => {
  const carePlanApi = useCarePlanApi();

  return useQuery({
    queryKey: ['care-plans', id],
    queryFn: () => carePlanApi.getCarePlanById(id!),
    enabled: !!id,
  });
};

export const useCreateCarePlan = () => {
  const carePlanApi = useCarePlanApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCarePlanInput) => carePlanApi.createCarePlan(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['care-plans'] });
      toast.success('Care plan created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create care plan');
    },
  });
};

export const useUpdateCarePlan = () => {
  const carePlanApi = useCarePlanApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCarePlanInput }) =>
      carePlanApi.updateCarePlan(id, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['care-plans'] });
      queryClient.invalidateQueries({ queryKey: ['care-plans', data.id] });
      toast.success('Care plan updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update care plan');
    },
  });
};

export const useActivateCarePlan = () => {
  const carePlanApi = useCarePlanApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => carePlanApi.activateCarePlan(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['care-plans'] });
      queryClient.invalidateQueries({ queryKey: ['care-plans', data.id] });
      toast.success('Care plan activated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to activate care plan');
    },
  });
};

export const useTasks = (filters?: TaskInstanceSearchFilters & SearchParams) => {
  const carePlanApi = useCarePlanApi();

  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => carePlanApi.getTasks(filters),
  });
};

export const useTask = (id: string | undefined) => {
  const carePlanApi = useCarePlanApi();

  return useQuery({
    queryKey: ['tasks', id],
    queryFn: () => carePlanApi.getTaskById(id!),
    enabled: !!id,
  });
};

export const useCompleteTask = () => {
  const carePlanApi = useCarePlanApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CompleteTaskInput }) =>
      carePlanApi.completeTask(id, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', data.id] });
      queryClient.invalidateQueries({ queryKey: ['care-plans', data.carePlanId] });
      toast.success('Task completed successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to complete task');
    },
  });
};
