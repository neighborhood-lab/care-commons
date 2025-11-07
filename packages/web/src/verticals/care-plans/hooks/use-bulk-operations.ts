import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useCarePlanApi } from './use-care-plans';
import type { TaskInstance, CreateTaskInstanceInput, CompleteTaskInput } from '../types';

/**
 * Hook for bulk task creation from templates
 */
export const useBulkCreateTasks = () => {
  const carePlanApi = useCarePlanApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      carePlanId: string;
      visitId?: string;
      scheduledDate: string;
      assignedCaregiverId?: string;
      templateIds: string[];
    }) => {
      // Create multiple tasks from templates
      const tasks: TaskInstance[] = [];
      for (const templateId of data.templateIds) {
        // In a real implementation, this would create tasks from the template
        // For now, this is a placeholder
        const task = await carePlanApi.createTaskFromTemplate(templateId, {
          carePlanId: data.carePlanId,
          visitId: data.visitId,
          scheduledDate: data.scheduledDate,
          assignedCaregiverId: data.assignedCaregiverId,
        });
        tasks.push(task);
      }
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
        ...originalPlan,
        id: undefined as any,
        clientId: data.newClientId,
        name: data.newName,
        effectiveDate: new Date(data.effectiveDate),
        status: 'DRAFT',
        createdAt: undefined as any,
        updatedAt: undefined as any,
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
  const carePlanApi = useCarePlanApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      taskIds: string[];
      assignedCaregiverId: string;
    }) => {
      const assignedTasks: TaskInstance[] = [];
      for (const taskId of data.taskIds) {
        // In a real implementation, this would update the task assignment
        // For now, this is a placeholder using the update endpoint
        const task = await carePlanApi.updateTask(taskId, {
          assignedCaregiverId: data.assignedCaregiverId,
        });
        assignedTasks.push(task);
      }
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
  const carePlanApi = useCarePlanApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      taskIds: string[];
      reason: string;
    }) => {
      const cancelledTasks: TaskInstance[] = [];
      for (const taskId of data.taskIds) {
        // In a real implementation, this would cancel the task
        const task = await carePlanApi.cancelTask(taskId, data.reason);
        cancelledTasks.push(task);
      }
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
