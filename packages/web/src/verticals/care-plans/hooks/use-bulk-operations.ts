import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useCarePlanApi } from './use-care-plans';
import type { TaskInstance } from '../types';

/**
 * Hook for bulk task creation from templates
 */
export const useBulkCreateTasks = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_data: {
      carePlanId: string;
      visitId?: string;
      scheduledDate: string;
      assignedCaregiverId?: string;
      templateIds: string[];
    }) => {
      // Placeholder implementation until createTaskFromTemplate API endpoint is available
      const tasks: TaskInstance[] = [];
      return tasks;
    },
    onSuccess: (tasks) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['care-plans'] });
      toast.success(`Created ${tasks.length} tasks successfully`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create tasks');
    },
  });
};

/**
 * Hook for bulk task completion
 */
export const useBulkCompleteTasks = () => {
  const carePlanApi = useCarePlanApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      taskIds: string[];
      completionNote: string;
    }) => {
      const completedTasks: TaskInstance[] = [];
      for (const taskId of data.taskIds) {
        const task = await carePlanApi.completeTask(taskId, {
          completionNote: data.completionNote,
        });
        completedTasks.push(task);
      }
      return completedTasks;
    },
    onSuccess: (tasks) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['care-plans'] });
      toast.success(`Completed ${tasks.length} tasks successfully`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to complete tasks');
    },
  });
};

/**
 * Hook for cloning a care plan to a new client
 */
export const useCloneCarePlan = () => {
  const carePlanApi = useCarePlanApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      carePlanId: string;
      newClientId: string;
      newName: string;
      effectiveDate: string;
    }) => {
      // Get the original care plan
      const originalPlan = await carePlanApi.getCarePlanById(data.carePlanId);

      // Create a new care plan based on the original
      const newPlan = await carePlanApi.createCarePlan({
        clientId: data.newClientId,
        organizationId: originalPlan.organizationId,
        branchId: originalPlan.branchId,
        name: data.newName,
        planType: originalPlan.planType,
        effectiveDate: data.effectiveDate,
        expirationDate: originalPlan.expirationDate,
        goals: originalPlan.goals.map(({ id, ...goal }) => goal),
        interventions: originalPlan.interventions.map(({ id, ...intervention }) => intervention),
        taskTemplates: originalPlan.taskTemplates?.map(({ id, ...template }) => template),
        coordinatorId: originalPlan.coordinatorId,
        notes: originalPlan.notes,
      });

      return newPlan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['care-plans'] });
      toast.success('Care plan cloned successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to clone care plan');
    },
  });
};

/**
 * Hook for bulk task assignment
 */
export const useBulkAssignTasks = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_data: {
      taskIds: string[];
      assignedCaregiverId: string;
    }) => {
      // Placeholder implementation until updateTask API endpoint is available
      const assignedTasks: TaskInstance[] = [];
      return assignedTasks;
    },
    onSuccess: (tasks) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success(`Assigned ${tasks.length} tasks successfully`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to assign tasks');
    },
  });
};

/**
 * Hook for bulk task deletion/cancellation
 */
export const useBulkCancelTasks = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_data: {
      taskIds: string[];
      reason: string;
    }) => {
      // Placeholder implementation until cancelTask API endpoint is available
      const cancelledTasks: TaskInstance[] = [];
      return cancelledTasks;
    },
    onSuccess: (tasks) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['care-plans'] });
      toast.success(`Cancelled ${tasks.length} tasks successfully`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to cancel tasks');
    },
  });
};
