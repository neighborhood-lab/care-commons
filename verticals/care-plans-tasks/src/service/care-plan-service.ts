/**
 * Care Plan Service
 * 
 * Business logic for care plans and tasks management
 */

import { UserContext, PaginationParams, PaginatedResult, UUID, NotFoundError, ValidationError, PermissionError } from '@care-commons/core';
import { PermissionService, Timestamp } from '@care-commons/core';
import { v4 as uuid } from 'uuid';
import { addDays, isBefore, isAfter } from 'date-fns';
import {
  CarePlan,
  CreateCarePlanInput,
  UpdateCarePlanInput,
  CarePlanSearchFilters,
  TaskInstance,
  CreateTaskInstanceInput,
  CompleteTaskInput,
  TaskInstanceSearchFilters,
  ProgressNote,
  CreateProgressNoteInput,
  CarePlanStatus,
  TaskStatus,
  CarePlanAnalytics,
  TaskCompletionMetrics,
  TaskTemplate,
} from '../types/care-plan';
import { CarePlanRepository } from '../repository/care-plan-repository';
import { CarePlanValidator } from '../validation/care-plan-validator';

export class CarePlanService {
  private repository: CarePlanRepository;
  private permissions: PermissionService;

  constructor(repository: CarePlanRepository, permissions: PermissionService) {
    this.repository = repository;
    this.permissions = permissions;
  }

  /**
   * Create a new care plan
   */
  async createCarePlan(
    input: CreateCarePlanInput,
    context: UserContext
  ): Promise<CarePlan> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'care-plans:create')) {
      throw new PermissionError('Insufficient permissions to create care plans');
    }

    // Validate input
    const validatedInput = CarePlanValidator.validateCreateCarePlan(input);

    // Generate plan number
    const planNumber = await this.generatePlanNumber(input.organizationId);

    // Create care plan
    const carePlan = await this.repository.createCarePlan({
      ...validatedInput,
      planNumber,
      createdBy: context.userId,
    });

    return carePlan;
  }

  /**
   * Get care plan by ID
   */
  async getCarePlanById(
    id: UUID,
    context: UserContext
  ): Promise<CarePlan> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'care-plans:read')) {
      throw new PermissionError('Insufficient permissions to read care plans');
    }

    const carePlan = await this.repository.getCarePlanById(id);
    if (!carePlan) {
      throw new NotFoundError('Care plan not found', { id });
    }

    // Check organization access
    if (carePlan.organizationId !== context.organizationId) {
      throw new PermissionError('Cannot access care plan from another organization');
    }

    return carePlan;
  }

  /**
   * Update care plan
   */
  async updateCarePlan(
    id: UUID,
    input: UpdateCarePlanInput,
    context: UserContext
  ): Promise<CarePlan> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'care-plans:update')) {
      throw new PermissionError('Insufficient permissions to update care plans');
    }

    // Validate input
    const validatedInput = CarePlanValidator.validateUpdateCarePlan(input);

    // Get existing care plan
    const existing = await this.getCarePlanById(id, context);

    // Prevent updates to completed/discontinued plans without proper permissions
    if (['COMPLETED', 'DISCONTINUED'].includes(existing.status) &&
      !this.permissions.hasPermission(context, 'care-plans:update:archived')) {
      throw new PermissionError('Cannot update completed or discontinued care plans');
    }

    const updated = await this.repository.updateCarePlan(
      id,
      validatedInput,
      context.userId
    );

    return updated;
  }

  /**
   * Activate a care plan
   */
  async activateCarePlan(
    id: UUID,
    context: UserContext
  ): Promise<CarePlan> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'care-plans:activate')) {
      throw new PermissionError('Insufficient permissions to activate care plans');
    }

    const carePlan = await this.getCarePlanById(id, context);

    // Validate plan is ready for activation
    const validation = CarePlanValidator.validateCarePlanActivation(carePlan);
    if (!validation.valid) {
      throw new ValidationError('Care plan cannot be activated', {
        errors: validation.errors,
      });
    }

    // Check for existing active plan
    const existingActive = await this.repository.getActiveCarePlanForClient(
      carePlan.clientId
    );

    if (existingActive && existingActive.id !== id) {
      // Optionally expire the old plan
      await this.repository.updateCarePlan(
        existingActive.id,
        { status: 'EXPIRED' as CarePlanStatus },
        context.userId
      );
    }

    return await this.repository.updateCarePlan(
      id,
      { status: 'ACTIVE' as CarePlanStatus },
      context.userId
    );
  }

  /**
   * Search care plans
   */
  async searchCarePlans(
    filters: CarePlanSearchFilters,
    pagination: PaginationParams,
    context: UserContext
  ): Promise<PaginatedResult<CarePlan>> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'care-plans:read')) {
      throw new PermissionError('Insufficient permissions to search care plans');
    }

    // Validate filters
    const validatedFilters = CarePlanValidator.validateCarePlanSearchFilters(filters);

    // Enforce organization filter
    const orgFilters = {
      ...validatedFilters,
      organizationId: context.organizationId,
    };

    return await this.repository.searchCarePlans(orgFilters, pagination);
  }

  /**
   * Get care plans for a client
   */
  async getCarePlansByClientId(
    clientId: UUID,
    context: UserContext
  ): Promise<CarePlan[]> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'care-plans:read')) {
      throw new PermissionError('Insufficient permissions to read care plans');
    }

    const plans = await this.repository.getCarePlansByClientId(clientId);

    // Filter by organization
    return plans.filter(plan => plan.organizationId === context.organizationId);
  }

  /**
   * Get active care plan for a client
   */
  async getActiveCarePlanForClient(
    clientId: UUID,
    context: UserContext
  ): Promise<CarePlan | null> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'care-plans:read')) {
      throw new PermissionError('Insufficient permissions to read care plans');
    }

    const plan = await this.repository.getActiveCarePlanForClient(clientId);

    // Check organization access
    if (plan && plan.organizationId !== context.organizationId) {
      return null;
    }

    return plan;
  }

  /**
   * Get care plans expiring soon
   */
  async getExpiringCarePlans(
    daysUntilExpiration: number,
    context: UserContext
  ): Promise<CarePlan[]> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'care-plans:read')) {
      throw new PermissionError('Insufficient permissions to read care plans');
    }

    return await this.repository.getExpiringCarePlans(
      context.organizationId,
      daysUntilExpiration
    );
  }

  /**
   * Delete care plan (soft delete)
   */
  async deleteCarePlan(
    id: UUID,
    context: UserContext
  ): Promise<void> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'care-plans:delete')) {
      throw new PermissionError('Insufficient permissions to delete care plans');
    }

    const carePlan = await this.getCarePlanById(id, context);

    // Prevent deletion of active plans
    if (carePlan.status === 'ACTIVE') {
      throw new ValidationError('Cannot delete an active care plan. Please discontinue it first.');
    }

    await this.repository.deleteCarePlan(id, context.userId);
  }

  /**
   * Create task instances from templates for a visit
   */
  async createTasksForVisit(
    carePlanId: UUID,
    visitId: UUID,
    visitDate: Date,
    context: UserContext
  ): Promise<TaskInstance[]> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'tasks:create')) {
      throw new PermissionError('Insufficient permissions to create tasks');
    }

    const carePlan = await this.getCarePlanById(carePlanId, context);

    const tasks: TaskInstance[] = [];

    for (const template of carePlan.taskTemplates || []) {
      if (template.status !== 'ACTIVE') {
        continue;
      }

      // Check if task should be created based on frequency
      if (this.shouldCreateTaskForDate(template, visitDate)) {
        const task = await this.createTaskInstance({
          carePlanId,
          templateId: template.id,
          visitId,
          clientId: carePlan.clientId,
          name: template.name,
          description: template.description,
          category: template.category,
          instructions: template.instructions,
          scheduledDate: visitDate,
          requiredSignature: template.requiresSignature,
          requiredNote: template.requiresNote,
        }, context);

        tasks.push(task);
      }
    }

    return tasks;
  }

  /**
   * Create a task instance
   */
  async createTaskInstance(
    input: CreateTaskInstanceInput,
    context: UserContext
  ): Promise<TaskInstance> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'tasks:create')) {
      throw new PermissionError('Insufficient permissions to create tasks');
    }

    // Validate input
    const validatedInput = CarePlanValidator.validateCreateTaskInstance(input);

    const task = await this.repository.createTaskInstance({
      ...validatedInput,
      createdBy: context.userId,
      status: 'SCHEDULED',
    });

    return task;
  }

  /**
   * Get task instance by ID
   */
  async getTaskInstanceById(
    id: UUID,
    context: UserContext
  ): Promise<TaskInstance> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'tasks:read')) {
      throw new PermissionError('Insufficient permissions to read tasks');
    }

    const task = await this.repository.getTaskInstanceById(id);
    if (!task) {
      throw new NotFoundError('Task not found', { id });
    }

    return task;
  }

  /**
   * Complete a task
   */
  async completeTask(
    id: UUID,
    input: CompleteTaskInput,
    context: UserContext
  ): Promise<TaskInstance> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'tasks:complete')) {
      throw new PermissionError('Insufficient permissions to complete tasks');
    }

    const task = await this.getTaskInstanceById(id, context);

    // Validate task can be completed
    if (task.status === 'COMPLETED') {
      throw new ValidationError('Task is already completed');
    }
    if (task.status === 'CANCELLED') {
      throw new ValidationError('Cannot complete a cancelled task');
    }

    // Validate input
    const validatedInput = CarePlanValidator.validateCompleteTask(input);

    // Check requirements
    const validation = CarePlanValidator.validateTaskCompletion(task, validatedInput);
    if (!validation.valid) {
      throw new ValidationError('Task completion requirements not met', {
        errors: validation.errors,
      });
    }

    // Validate vital signs if provided
    if (validatedInput.verificationData?.vitalSigns) {
      const vitalValidation = CarePlanValidator.validateVitalSigns(
        validatedInput.verificationData.vitalSigns
      );
      if (vitalValidation.warnings.length > 0) {
        // Log warnings but don't block completion
        console.warn('Vital signs warnings:', vitalValidation.warnings);
      }
    }

    const now = new Date();

    // Update task
    const completed = await this.repository.updateTaskInstance(
      id,
      {
        status: 'COMPLETED',
        completedAt: now,
        completedBy: context.userId,
        completionNote: validatedInput.completionNote,
        completionSignature: validatedInput.signature ? {
          ...validatedInput.signature,
          signedAt: now,
        } : undefined,
        verificationData: validatedInput.verificationData ? {
          ...validatedInput.verificationData,
          verifiedAt: now,
          verifiedBy: context.userId,
          gpsLocation: validatedInput.verificationData.gpsLocation
            ? {
              ...validatedInput.verificationData.gpsLocation,
              // Ensure the required field exists for the persisted type:
              timestamp: now, // If Timestamp is not Date, convert appropriately (e.g., now.toISOString()).
            }
            : undefined,
        } : undefined,
        qualityCheckResponses: validatedInput.qualityCheckResponses,
        customFieldValues: validatedInput.customFieldValues,
      },
      context.userId
    );

    return completed;
  }

  /**
   * Skip a task
   */
  async skipTask(
    id: UUID,
    reason: string,
    note?: string,
    context: UserContext = {} as UserContext
  ): Promise<TaskInstance> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'tasks:skip')) {
      throw new PermissionError('Insufficient permissions to skip tasks');
    }

    const task = await this.getTaskInstanceById(id, context);

    // Validate task can be skipped
    if (task.status === 'COMPLETED') {
      throw new ValidationError('Cannot skip a completed task');
    }
    if (task.status === 'CANCELLED') {
      throw new ValidationError('Cannot skip a cancelled task');
    }

    const skipped = await this.repository.updateTaskInstance(
      id,
      {
        status: 'SKIPPED',
        skippedAt: new Date(),
        skippedBy: context.userId,
        skipReason: reason,
        skipNote: note,
      },
      context.userId
    );

    return skipped;
  }

  /**
   * Report an issue with a task
   */
  async reportTaskIssue(
    id: UUID,
    issueDescription: string,
    context: UserContext
  ): Promise<TaskInstance> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'tasks:update')) {
      throw new PermissionError('Insufficient permissions to report task issues');
    }

    const task = await this.getTaskInstanceById(id, context);

    const updated = await this.repository.updateTaskInstance(
      id,
      {
        status: 'ISSUE_REPORTED',
        issueReported: true,
        issueDescription,
        issueReportedAt: new Date(),
        issueReportedBy: context.userId,
      },
      context.userId
    );

    return updated;
  }

  /**
   * Search task instances
   */
  async searchTaskInstances(
    filters: TaskInstanceSearchFilters,
    pagination: PaginationParams,
    context: UserContext
  ): Promise<PaginatedResult<TaskInstance>> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'tasks:read')) {
      throw new PermissionError('Insufficient permissions to search tasks');
    }

    // Validate filters
    const validatedFilters = CarePlanValidator.validateTaskInstanceSearchFilters(filters);

    return await this.repository.searchTaskInstances(validatedFilters, pagination);
  }

  /**
   * Get tasks for a visit
   */
  async getTasksByVisitId(
    visitId: UUID,
    context: UserContext
  ): Promise<TaskInstance[]> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'tasks:read')) {
      throw new PermissionError('Insufficient permissions to read tasks');
    }

    return await this.repository.getTasksByVisitId(visitId);
  }

  /**
   * Create a progress note
   */
  async createProgressNote(
    input: CreateProgressNoteInput,
    context: UserContext
  ): Promise<ProgressNote> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'progress-notes:create')) {
      throw new PermissionError('Insufficient permissions to create progress notes');
    }

    // Validate input
    const validatedInput = CarePlanValidator.validateCreateProgressNote(input);

    const now = new Date();

    // If Timestamp is a Date, this is fine.
    // If your Timestamp is an ISO string alias, use: const makeTs = () => new Date().toISOString() as Timestamp;
    const makeTs = () => now as unknown as Timestamp;

    const normalizedObservations: CreateProgressNoteInput['observations'] =
      validatedInput.observations?.map(observation => ({
        ...observation,
        timestamp: new Date(),
      }));

    const signature: CreateProgressNoteInput['signature'] = validatedInput.signature
      ? { ...validatedInput.signature }
      : undefined;

    const noteInput: CreateProgressNoteInput = {
      carePlanId: validatedInput.carePlanId,
      clientId: validatedInput.clientId,
      visitId: validatedInput.visitId,
      noteType: validatedInput.noteType,
      content: validatedInput.content,
      goalProgress: validatedInput.goalProgress,
      observations: normalizedObservations,
      concerns: validatedInput.concerns,
      recommendations: validatedInput.recommendations,
      signature,
    };

    // Get user details for author
    // Extract role and construct author name from context
    const authorRole = context.roles?.[0] || 'CAREGIVER';
    // In production, this would be fetched from a user repository
    // For now, construct from available context data
    const authorName = context.userId ? `User ${context.userId.substring(0, 8)}` : 'System User';

    const note = await this.repository.createProgressNote({
      ...noteInput,
      authorId: context.userId,
      authorName,
      authorRole: String(authorRole),
      noteDate: now,
    });

    return note;
  }

  /**
   * Get progress notes for a care plan
   */
  async getProgressNotesByCarePlanId(
    carePlanId: UUID,
    context: UserContext
  ): Promise<ProgressNote[]> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'progress-notes:read')) {
      throw new PermissionError('Insufficient permissions to read progress notes');
    }

    return await this.repository.getProgressNotesByCarePlanId(carePlanId);
  }

  /**
   * Get care plan analytics
   */
  async getCarePlanAnalytics(
    organizationId: UUID,
    context: UserContext
  ): Promise<CarePlanAnalytics> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'analytics:read')) {
      throw new PermissionError('Insufficient permissions to view analytics');
    }

    // Get all care plans for organization
    const plans = await this.repository.searchCarePlans(
      { organizationId },
      { page: 1, limit: 10000 }
    );

    const activePlans = plans.items.filter(p => p.status === 'ACTIVE');
    const expiringPlans = plans.items.filter(p =>
      p.expirationDate &&
      isBefore(p.expirationDate, addDays(new Date(), 30))
    );

    // Calculate metrics
    let totalGoals = 0;
    let achievedGoals = 0;

    plans.items.forEach(plan => {
      totalGoals += plan.goals.length;
      achievedGoals += plan.goals.filter(g => g.status === 'ACHIEVED').length;
    });

    // Get task metrics for organization
    const thirtyDaysAgo = addDays(new Date(), -30);
    const taskMetrics = await this.getTaskCompletionMetrics({
      dateFrom: thirtyDaysAgo,
      dateTo: new Date(),
      organizationId,
    }, context);

    // Calculate compliance based on active plans with no expiring credentials
    const compliantPlans = activePlans.filter(p => p.complianceStatus === 'COMPLIANT').length;
    const complianceRate = activePlans.length > 0 ? (compliantPlans / activePlans.length) * 100 : 100;

    return {
      totalPlans: plans.total,
      activePlans: activePlans.length,
      expiringPlans: expiringPlans.length,
      goalCompletionRate: totalGoals > 0 ? (achievedGoals / totalGoals) * 100 : 0,
      taskCompletionRate: taskMetrics.completionRate,
      averageGoalsPerPlan: plans.total > 0 ? totalGoals / plans.total : 0,
      averageTasksPerVisit: taskMetrics.totalTasks > 0 ? taskMetrics.totalTasks / plans.total : 0,
      complianceRate,
    };
  }

  /**
   * Get task completion metrics
   */
  async getTaskCompletionMetrics(
    filters: { dateFrom: Date; dateTo: Date; organizationId: UUID },
    context: UserContext
  ): Promise<TaskCompletionMetrics> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'analytics:read')) {
      throw new PermissionError('Insufficient permissions to view analytics');
    }

    const tasks = await this.repository.searchTaskInstances(
      {
        scheduledDateFrom: filters.dateFrom,
        scheduledDateTo: filters.dateTo,
      },
      { page: 1, limit: 10000 }
    );

    const completed = tasks.items.filter(t => t.status === 'COMPLETED');
    const skipped = tasks.items.filter(t => t.status === 'SKIPPED');
    const missed = tasks.items.filter(t => t.status === 'MISSED');
    const issues = tasks.items.filter(t => t.issueReported);

    // Group by category
    const tasksByCategory = tasks.items.reduce((acc, task) => {
      acc[task.category] = (acc[task.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate average completion time
    const completionTimes = completed
      .filter(t => t.completedAt && t.scheduledDate)
      .map(t => {
        const scheduled = new Date(t.scheduledDate).getTime();
        const completed = new Date(t.completedAt!).getTime();
        return (completed - scheduled) / (1000 * 60); // minutes
      });

    const avgCompletionTime = completionTimes.length > 0
      ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length
      : 0;

    return {
      totalTasks: tasks.total,
      completedTasks: completed.length,
      skippedTasks: skipped.length,
      missedTasks: missed.length,
      completionRate: tasks.total > 0 ? (completed.length / tasks.total) * 100 : 0,
      averageCompletionTime: avgCompletionTime,
      tasksByCategory: tasksByCategory as any,
      issuesReported: issues.length,
    };
  }

  /**
   * Helper: Generate unique plan number
   */
  private async generatePlanNumber(organizationId: UUID): Promise<string> {
    const prefix = 'CP';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  /**
   * Helper: Determine if task should be created for a date based on frequency
   */
  private shouldCreateTaskForDate(template: TaskTemplate, date: Date): boolean {
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
    const frequency = template.frequency;

    if (frequency.pattern === 'DAILY') {
      return true;
    }

    if (frequency.pattern === 'WEEKLY' && frequency.specificDays) {
      return frequency.specificDays.includes(dayOfWeek as any);
    }

    if (frequency.pattern === 'AS_NEEDED') {
      return false; // Manual creation required
    }

    // Default to creating the task
    return true;
  }
}

export default CarePlanService;
