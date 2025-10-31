/**
 * Care Plan API Handlers
 * 
 * Express request handlers for care plans, tasks, and progress notes
 */

import { Request, Response } from 'express';
import { CarePlanService } from '../service/care-plan-service';
import { UserContext, Role, ValidationError, PermissionError, NotFoundError } from '@care-commons/core';
import { CarePlanStatus, CarePlanType, TaskStatus, TaskCategory } from '../types/care-plan';

/**
 * Type guard to check if error is a known domain error
 */
function isDomainError(error: unknown): error is ValidationError | PermissionError | NotFoundError {
  return error instanceof ValidationError || error instanceof PermissionError || error instanceof NotFoundError;
}

/**
 * Handle errors consistently across all handlers
 */
function handleError(error: unknown, res: Response, operation: string): void {
  if (isDomainError(error)) {
    if (error instanceof ValidationError) {
      res.status(400).json({ error: error.message, details: error.context });
    } else if (error instanceof PermissionError) {
      res.status(403).json({ error: error.message });
    } else if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.message });
    }
  } else {
    console.error(`Error ${operation}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Extract user context from request
 * In production, this would extract from JWT or session
 */
function getUserContext(req: Request): UserContext {
  // This is a placeholder - in production, extract from authenticated session
  const branchId = req.header('X-Branch-Id');
  return {
    userId: req.header('X-User-Id') || 'system',
    organizationId: req.header('X-Organization-Id') || '',
    branchIds: branchId ? [branchId] : [],
    roles: (req.header('X-User-Roles') || 'CAREGIVER').split(',') as Role[],
    permissions: (req.header('X-User-Permissions') || '').split(',').filter(Boolean),
  };
}

/**
 * Create API handlers for care plans
 */
export function createCarePlanHandlers(service: CarePlanService) {
  return {
    /**
     * POST /care-plans
     * Create a new care plan
     */
    async createCarePlan(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        const carePlan = await service.createCarePlan(req.body, context);
        res.status(201).json(carePlan);
      } catch (error: unknown) {
        handleError(error, res, 'creating care plan');
      }
    },

    /**
     * GET /care-plans/:id
     * Get care plan by ID
     */
    async getCarePlanById(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        const carePlan = await service.getCarePlanById(req.params.id, context);
        res.json(carePlan);
      } catch (error: unknown) {
        handleError(error, res, 'fetching care plan');
      }
    },

    /**
     * PUT /care-plans/:id
     * Update care plan
     */
    async updateCarePlan(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        const carePlan = await service.updateCarePlan(req.params.id, req.body, context);
        res.json(carePlan);
      } catch (error: unknown) {
        handleError(error, res, 'updating care plan');
      }
    },

    /**
     * POST /care-plans/:id/activate
     * Activate a care plan
     */
    async activateCarePlan(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        const carePlan = await service.activateCarePlan(req.params.id, context);
        res.json(carePlan);
      } catch (error: unknown) {
        handleError(error, res, 'activating care plan');
      }
    },

    /**
     * GET /care-plans
     * Search care plans
     */
    async searchCarePlans(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        // Validate and sanitize query parameters
        const query = typeof req.query.query === 'string' ? req.query.query.trim() : undefined;
        const clientId = typeof req.query.clientId === 'string' ? req.query.clientId.trim() : undefined;
        const coordinatorId = typeof req.query.coordinatorId === 'string' ? req.query.coordinatorId.trim() : undefined;
        
        // Validate status values
        let status: CarePlanStatus[] | undefined;
        if (typeof req.query.status === 'string') {
          const validStatuses: CarePlanStatus[] = ['DRAFT', 'PENDING_APPROVAL', 'ACTIVE', 'ON_HOLD', 'EXPIRED', 'DISCONTINUED', 'COMPLETED'];
          status = req.query.status.split(',')
            .map(s => s.trim().toUpperCase())
            .filter(s => validStatuses.includes(s as CarePlanStatus)) as CarePlanStatus[];
          if (status.length === 0) status = undefined;
        }
        
        // Validate plan type values
        let planType: CarePlanType[] | undefined;
        if (typeof req.query.planType === 'string') {
          const validPlanTypes: CarePlanType[] = ['PERSONAL_CARE', 'COMPANION', 'SKILLED_NURSING', 'THERAPY', 'HOSPICE', 'RESPITE', 'LIVE_IN', 'CUSTOM'];
          planType = req.query.planType.split(',')
            .map(s => s.trim().toUpperCase())
            .filter(s => validPlanTypes.includes(s as CarePlanType)) as CarePlanType[];
          if (planType.length === 0) planType = undefined;
        }
        
        // Validate expiringWithinDays
        let expiringWithinDays: number | undefined;
        if (typeof req.query.expiringWithinDays === 'string') {
          const days = parseInt(req.query.expiringWithinDays, 10);
          if (!isNaN(days) && days > 0 && days <= 365) {
            expiringWithinDays = days;
          }
        }

        const filters = {
          query,
          clientId,
          status,
          planType,
          coordinatorId,
          expiringWithinDays,
          needsReview: req.query.needsReview === 'true',
        };
        const pagination = {
          page: parseInt(req.query.page as string) || 1,
          limit: parseInt(req.query.limit as string) || 20,
          sortBy: req.query.sortBy as string,
          sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
        };
        const result = await service.searchCarePlans(filters, pagination, context);
        res.json(result);
      } catch (error: unknown) {
        handleError(error, res, 'searching care plans');
      }
    },

    /**
     * GET /clients/:clientId/care-plans
     * Get care plans for a client
     */
    async getCarePlansByClientId(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        const plans = await service.getCarePlansByClientId(req.params.clientId, context);
        res.json(plans);
      } catch (error: unknown) {
        handleError(error, res, 'fetching client care plans');
      }
    },

    /**
     * GET /clients/:clientId/care-plans/active
     * Get active care plan for a client
     */
    async getActiveCarePlanForClient(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        const plan = await service.getActiveCarePlanForClient(req.params.clientId, context);
        if (!plan) {
          res.status(404).json({ error: 'No active care plan found' });
        } else {
          res.json(plan);
        }
      } catch (error: unknown) {
        handleError(error, res, 'fetching active care plan');
      }
    },

    /**
     * GET /care-plans/expiring
     * Get care plans expiring soon
     */
    async getExpiringCarePlans(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        const days = parseInt(req.query.days as string) || 30;
        const plans = await service.getExpiringCarePlans(days, context);
        res.json(plans);
      } catch (error: unknown) {
        handleError(error, res, 'fetching expiring care plans');
      }
    },

    /**
     * DELETE /care-plans/:id
     * Delete care plan (soft delete)
     */
    async deleteCarePlan(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        await service.deleteCarePlan(req.params.id, context);
        res.status(204).send();
      } catch (error: unknown) {
        handleError(error, res, 'deleting care plan');
      }
    },

    /**
     * POST /care-plans/:id/tasks/generate
     * Generate tasks for a visit
     */
    async createTasksForVisit(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        const { visitId, visitDate } = req.body;
        const tasks = await service.createTasksForVisit(
          req.params.id,
          visitId,
          new Date(visitDate),
          context
        );
        res.status(201).json(tasks);
      } catch (error: unknown) {
        handleError(error, res, 'creating tasks');
      }
    },

    /**
     * POST /tasks
     * Create a task instance
     */
    async createTaskInstance(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        const task = await service.createTaskInstance(req.body, context);
        res.status(201).json(task);
      } catch (error: unknown) {
        handleError(error, res, 'creating task');
      }
    },

    /**
     * GET /tasks/:id
     * Get task instance by ID
     */
    async getTaskInstanceById(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        const task = await service.getTaskInstanceById(req.params.id, context);
        res.json(task);
      } catch (error: unknown) {
        handleError(error, res, 'fetching task');
      }
    },

    /**
     * POST /tasks/:id/complete
     * Complete a task
     */
    async completeTask(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        const task = await service.completeTask(req.params.id, req.body, context);
        res.json(task);
      } catch (error: unknown) {
        handleError(error, res, 'completing task');
      }
    },

    /**
     * POST /tasks/:id/skip
     * Skip a task
     */
    async skipTask(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        const { reason, note } = req.body;
        const task = await service.skipTask(req.params.id, reason, note, context);
        res.json(task);
      } catch (error: unknown) {
        handleError(error, res, 'skipping task');
      }
    },

    /**
     * POST /tasks/:id/report-issue
     * Report an issue with a task
     */
    async reportTaskIssue(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        const { issueDescription } = req.body;
        const task = await service.reportTaskIssue(req.params.id, issueDescription, context);
        res.json(task);
      } catch (error: unknown) {
        handleError(error, res, 'reporting task issue');
      }
    },

    /**
     * GET /tasks
     * Search task instances
     */
    async searchTaskInstances(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        const filters = {
          carePlanId: req.query.carePlanId as string,
          clientId: req.query.clientId as string,
          // Validate and sanitize task search parameters
          assignedCaregiverId: typeof req.query.assignedCaregiverId === 'string' ? req.query.assignedCaregiverId.trim() : undefined,
          visitId: typeof req.query.visitId === 'string' ? req.query.visitId.trim() : undefined,
          
          // Validate task status values
          status: (() => {
            if (typeof req.query.status !== 'string') return undefined;
            const validStatuses: TaskStatus[] = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'MISSED', 'CANCELLED', 'ISSUE_REPORTED'];
            const filtered = req.query.status.split(',')
              .map(s => s.trim().toUpperCase())
              .filter(s => validStatuses.includes(s as TaskStatus)) as TaskStatus[];
            return filtered.length > 0 ? filtered : undefined;
          })(),
          
          // Validate task category values
          category: (() => {
            if (typeof req.query.category !== 'string') return undefined;
            const validCategories: TaskCategory[] = ['PERSONAL_HYGIENE', 'BATHING', 'DRESSING', 'GROOMING', 'TOILETING', 'MOBILITY', 'TRANSFERRING', 'AMBULATION', 'MEDICATION', 'MEAL_PREPARATION', 'FEEDING', 'HOUSEKEEPING', 'LAUNDRY', 'SHOPPING', 'TRANSPORTATION', 'COMPANIONSHIP', 'MONITORING', 'DOCUMENTATION', 'OTHER'];
            const filtered = req.query.category.split(',')
              .map(s => s.trim().toUpperCase())
              .filter(s => validCategories.includes(s as TaskCategory)) as TaskCategory[];
            return filtered.length > 0 ? filtered : undefined;
          })(),
          
          // Validate date ranges
          scheduledDateFrom: (() => {
            if (typeof req.query.scheduledDateFrom !== 'string') return undefined;
            const date = new Date(req.query.scheduledDateFrom);
            return !isNaN(date.getTime()) ? date : undefined;
          })(),
          scheduledDateTo: (() => {
            if (typeof req.query.scheduledDateTo !== 'string') return undefined;
            const date = new Date(req.query.scheduledDateTo);
            return !isNaN(date.getTime()) ? date : undefined;
          })(),
          
          overdue: req.query.overdue === 'true',
          requiresSignature: req.query.requiresSignature === 'true' ? true : undefined,
        };
        const pagination = {
          page: parseInt(req.query.page as string) || 1,
          limit: parseInt(req.query.limit as string) || 20,
          sortBy: req.query.sortBy as string,
          sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'asc',
        };
        const result = await service.searchTaskInstances(filters, pagination, context);
        res.json(result);
      } catch (error: unknown) {
        handleError(error, res, 'searching tasks');
      }
    },

    /**
     * GET /visits/:visitId/tasks
     * Get tasks for a visit
     */
    async getTasksByVisitId(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        const tasks = await service.getTasksByVisitId(req.params.visitId, context);
        res.json(tasks);
      } catch (error: unknown) {
        handleError(error, res, 'fetching visit tasks');
      }
    },

    /**
     * POST /progress-notes
     * Create a progress note
     */
    async createProgressNote(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        const note = await service.createProgressNote(req.body, context);
        res.status(201).json(note);
      } catch (error: unknown) {
        handleError(error, res, 'creating progress note');
      }
    },

    /**
     * GET /care-plans/:id/progress-notes
     * Get progress notes for a care plan
     */
    async getProgressNotesByCarePlanId(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        const notes = await service.getProgressNotesByCarePlanId(req.params.id, context);
        res.json(notes);
      } catch (error: unknown) {
        handleError(error, res, 'fetching progress notes');
      }
    },

    /**
     * GET /analytics/care-plans
     * Get care plan analytics
     */
    async getCarePlanAnalytics(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        const analytics = await service.getCarePlanAnalytics(context.organizationId, context);
        res.json(analytics);
      } catch (error: unknown) {
        handleError(error, res, 'fetching analytics');
      }
    },

    /**
     * GET /analytics/tasks/completion
     * Get task completion metrics
     */
    async getTaskCompletionMetrics(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : new Date();
        const metrics = await service.getTaskCompletionMetrics({
          dateFrom,
          dateTo,
          organizationId: context.organizationId,
        }, context);
        res.json(metrics);
      } catch (error: unknown) {
        handleError(error, res, 'fetching task metrics');
      }
    },
  };
}

export default createCarePlanHandlers;
