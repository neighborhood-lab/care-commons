import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useApiClient } from '@/core/hooks';
import type { CarePlan } from '../types';

// Import template types and data
import type {
  CarePlanTemplateCategory,
  CarePlanTaskTemplate,
} from '@care-commons/care-plans-tasks/browser';

// For now, we'll import templates directly
// In a real implementation, these might come from an API
import { CARE_PLAN_TEMPLATES } from '@care-commons/care-plans-tasks/browser';

export interface CreateFromTemplateInput {
  templateId: string;
  clientId: string;
  name?: string;
  goals?: string;
  startDate?: Date;
  endDate?: Date;
  coordinatorId?: string;
  branchId?: string;
  notes?: string;
  tasks?: CarePlanTaskTemplate[];
}

/**
 * Hook to get all care plan templates
 */
export const useCarePlanTemplates = () => {
  return useQuery({
    queryKey: ['care-plan-templates'],
    queryFn: async () => {
      // In a real implementation, this might fetch from an API
      // For now, return the static templates
      return CARE_PLAN_TEMPLATES;
    },
    staleTime: Infinity, // Templates don't change often
  });
};

/**
 * Hook to get a specific template by ID
 */
export const useCarePlanTemplate = (id: string | undefined) => {
  return useQuery({
    queryKey: ['care-plan-templates', id],
    queryFn: async () => {
      if (!id) return;
      return CARE_PLAN_TEMPLATES.find((t) => t.id === id);
    },
    enabled: !!id,
    staleTime: Infinity,
  });
};

/**
 * Hook to get templates by category
 */
export const useCarePlanTemplatesByCategory = (
  category: CarePlanTemplateCategory | undefined
) => {
  return useQuery({
    queryKey: ['care-plan-templates', 'category', category],
    queryFn: async () => {
      if (!category) return CARE_PLAN_TEMPLATES;
      return CARE_PLAN_TEMPLATES.filter((t) => t.category === category);
    },
    enabled: !!category,
    staleTime: Infinity,
  });
};

/**
 * Hook to create a care plan from a template
 */
export const useCreateFromTemplate = () => {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateFromTemplateInput) => {
      // Call the API endpoint that will use the TemplateService
      return apiClient.post<CarePlan>('/api/care-plans/from-template', input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['care-plans'] });
      toast.success('Care plan created from template successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create care plan from template');
    },
  });
};
