/**
 * Template Service
 *
 * Service for managing care plan templates and creating care plans from templates
 */

import { UUID, UserContext, NotFoundError } from '@care-commons/core';
import { addDays } from 'date-fns';
import {
  CARE_PLAN_TEMPLATES,
  CarePlanTemplate,
  CarePlanTemplateCategory,
  mapTaskCategory,
  mapFrequency,
  TaskTemplate as TemplateTask,
} from '../templates/care-plan-templates';
import {
  CarePlan,
  CreateCarePlanInput,
  CarePlanType,
  TaskTemplate,
  Priority,
  GoalStatus,
} from '../types/care-plan';
import { CarePlanRepository } from '../repository/care-plan-repository';

/**
 * Options for customizing a care plan created from a template
 */
export interface CreateFromTemplateOptions {
  name?: string;
  goals?: string;
  start_date?: Date;
  end_date?: Date;
  tasks?: TemplateTask[];
  coordinatorId?: UUID;
  branchId?: UUID;
  notes?: string;
}

export class TemplateService {
  private repository: CarePlanRepository;

  constructor(repository: CarePlanRepository) {
    this.repository = repository;
  }

  /**
   * Get all care plan templates
   */
  getAllTemplates(): CarePlanTemplate[] {
    return CARE_PLAN_TEMPLATES;
  }

  /**
   * Get template by ID
   */
  getTemplateById(id: string): CarePlanTemplate | undefined {
    return CARE_PLAN_TEMPLATES.find((t) => t.id === id);
  }

  /**
   * Get templates by category
   */
  getTemplatesByCategory(category: CarePlanTemplateCategory): CarePlanTemplate[] {
    return CARE_PLAN_TEMPLATES.filter((t) => t.category === category);
  }

  /**
   * Create care plan from template
   */
  async createFromTemplate(
    templateId: string,
    clientId: UUID,
    organizationId: UUID,
    context: UserContext,
    customizations?: CreateFromTemplateOptions
  ): Promise<CarePlan> {
    const template = this.getTemplateById(templateId);
    if (!template) {
      throw new NotFoundError('Template not found', { templateId });
    }

    // Determine which tasks to include
    const tasksToInclude = customizations?.tasks || template.tasks;

    // Map template category to CarePlanType
    const planType = this.mapTemplateCategoryToCarePlanType(template.category);

    // Calculate dates
    const startDate = customizations?.start_date || new Date();
    const endDate =
      customizations?.end_date || addDays(startDate, template.typical_duration_days);

    // Create goal from template
    const goal = {
      name: customizations?.name || template.name,
      description: customizations?.goals || template.goals,
      category: 'ADL' as const,
      status: 'NOT_STARTED' as GoalStatus,
      priority: 'MEDIUM' as Priority,
    };

    // Create task templates from template tasks
    const taskTemplates: Omit<TaskTemplate, 'id'>[] = tasksToInclude.map((task) => ({
      name: task.description,
      description: task.description,
      category: mapTaskCategory(task.category),
      frequency: {
        pattern: mapFrequency(task.frequency),
        specificTimes: task.scheduled_time ? [task.scheduled_time] : undefined,
      },
      estimatedDuration: task.estimated_duration_minutes,
      instructions: task.instructions || '',
      requiresSignature: task.priority === 'critical' || task.priority === 'high',
      requiresNote: task.priority === 'critical',
      isOptional: task.priority === 'low',
      allowSkip: task.priority === 'low' || task.priority === 'medium',
      status: 'ACTIVE' as const,
    }));

    // Create interventions (basic implementation)
    const interventions = tasksToInclude.map((task) => ({
      name: task.description,
      description: task.instructions || task.description,
      category: 'ASSISTANCE_WITH_ADL' as const,
      goalIds: [],
      frequency: {
        pattern: mapFrequency(task.frequency),
        specificTimes: task.scheduled_time ? [task.scheduled_time] : undefined,
      },
      duration: task.estimated_duration_minutes,
      instructions: task.instructions || '',
      performedBy: ['CAREGIVER' as const],
      requiresDocumentation: task.priority === 'critical' || task.priority === 'high',
      status: 'ACTIVE' as const,
      startDate,
    }));

    // Create care plan input
    const carePlanInput: CreateCarePlanInput = {
      clientId,
      organizationId,
      branchId: customizations?.branchId,
      name: customizations?.name || template.name,
      planType,
      effectiveDate: startDate,
      expirationDate: endDate,
      goals: [goal],
      interventions,
      taskTemplates,
      coordinatorId: customizations?.coordinatorId,
      notes: customizations?.notes,
    };

    // Create the care plan using repository
    const carePlan = await this.repository.createCarePlan({
      ...carePlanInput,
      status: 'DRAFT',
      planNumber: await this.generatePlanNumber(),
      createdBy: context.userId,
    });

    return carePlan;
  }

  /**
   * Map template category to CarePlanType
   */
  private mapTemplateCategoryToCarePlanType(
    category: CarePlanTemplateCategory
  ): CarePlanType {
    const mapping: Record<CarePlanTemplateCategory, CarePlanType> = {
      personal_care: 'PERSONAL_CARE',
      skilled_nursing: 'SKILLED_NURSING',
      companionship: 'COMPANION',
      memory_care: 'PERSONAL_CARE',
      post_hospital: 'SKILLED_NURSING',
    };
    return mapping[category];
  }

  /**
   * Generate unique plan number
   */
  private async generatePlanNumber(): Promise<string> {
    const prefix = 'CP';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }
}

export default TemplateService;
