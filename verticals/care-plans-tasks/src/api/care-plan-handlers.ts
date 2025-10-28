/**
 * Care Plan API Handlers
 * 
 * Express request handlers for care plans, tasks, and progress notes
 */

import { Request, Response } from 'express';
import { CarePlanService } from '../service/care-plan-service';
import { UserContext } from '@care-commons/core';

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
    roles: (req.header('X-User-Roles') || 'CAREGIVER').split(',') as any[],
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
      } catch (error: any) {
        if (error.name === 'ValidationError') {
          res.status(400).json({ error: error.message, details: error.details });
        } else if (error.name === 'PermissionError') {
          res.status(403).json({ error: error.message });
        } else {
          console.error('Error creating care plan:', error);
          res.status(500).json({ error: 'Internal server error' });
        }
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
      } catch (error: any) {
        if (error.name === 'NotFoundError') {
          res.status(404).json({ error: error.message });
        } else if (error.name === 'PermissionError') {
          res.status(403).json({ error: error.message });
        } else {
          console.error('Error fetching care plan:', error);
          res.status(500).json({ error: 'Internal server error' });
        }
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
      } catch (error: any) {
        if (error.name === 'NotFoundError') {
          res.status(404).json({ error: error.message });
        } else if (error.name === 'ValidationError') {
          res.status(400).json({ error: error.message, details: error.details });
        } else if (error.name === 'PermissionError') {
          res.status(403).json({ error: error.message });
        } else {
          console.error('Error updating care plan:', error);
          res.status(500).json({ error: 'Internal server error' });
        }
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
      } catch (error: any) {
        if (error.name === 'NotFoundError') {
          res.status(404).json({ error: error.message });
        } else if (error.name === 'ValidationError') {
          res.status(400).json({ error: error.message, details: error.details });
        } else if (error.name === 'PermissionError') {
          res.status(403).json({ error: error.message });
        } else {
          console.error('Error activating care plan:', error);
          res.status(500).json({ error: 'Internal server error' });
        }
      }
    },

    /**
     * GET /care-plans
     * Search care plans
     */
    async searchCarePlans(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        const filters = {
          query: req.query.query as string,
          clientId: req.query.clientId as string,
          status: req.query.status ? (req.query.status as string).split(',') as any[] : undefined,
          planType: req.query.planType ? (req.query.planType as string).split(',') as any[] : undefined,
          coordinatorId: req.query.coordinatorId as string,
          expiringWithinDays: req.query.expiringWithinDays ? parseInt(req.query.expiringWithinDays as string) : undefined,
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
      } catch (error: any) {
        if (error.name === 'PermissionError') {
          res.status(403).json({ error: error.message });
        } else {
          console.error('Error searching care plans:', error);
          res.status(500).json({ error: 'Internal server error' });
        }
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
      } catch (error: any) {
        if (error.name === 'PermissionError') {
          res.status(403).json({ error: error.message });
        } else {
          console.error('Error fetching client care plans:', error);
          res.status(500).json({ error: 'Internal server error' });
        }
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
      } catch (error: any) {
        if (error.name === 'PermissionError') {
          res.status(403).json({ error: error.message });
        } else {
          console.error('Error fetching active care plan:', error);
          res.status(500).json({ error: 'Internal server error' });
        }
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
      } catch (error: any) {
        if (error.name === 'PermissionError') {
          res.status(403).json({ error: error.message });
        } else {
          console.error('Error fetching expiring care plans:', error);
          res.status(500).json({ error: 'Internal server error' });
        }
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
      } catch (error: any) {
        if (error.name === 'NotFoundError') {
          res.status(404).json({ error: error.message });
        } else if (error.name === 'ValidationError') {
          res.status(400).json({ error: error.message });
        } else if (error.name === 'PermissionError') {
          res.status(403).json({ error: error.message });
        } else {
          console.error('Error deleting care plan:', error);
          res.status(500).json({ error: 'Internal server error' });
        }
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
      } catch (error: any) {
        if (error.name === 'NotFoundError') {
          res.status(404).json({ error: error.message });
        } else if (error.name === 'ValidationError') {
          res.status(400).json({ error: error.message });
        } else if (error.name === 'PermissionError') {
          res.status(403).json({ error: error.message });
        } else {
          console.error('Error creating tasks:', error);
          res.status(500).json({ error: 'Internal server error' });
        }
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
      } catch (error: any) {
        if (error.name === 'ValidationError') {
          res.status(400).json({ error: error.message, details: error.details });
        } else if (error.name === 'PermissionError') {
          res.status(403).json({ error: error.message });
        } else {
          console.error('Error creating task:', error);
          res.status(500).json({ error: 'Internal server error' });
        }
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
      } catch (error: any) {
        if (error.name === 'NotFoundError') {
          res.status(404).json({ error: error.message });
        } else if (error.name === 'PermissionError') {
          res.status(403).json({ error: error.message });
        } else {
          console.error('Error fetching task:', error);
          res.status(500).json({ error: 'Internal server error' });
        }
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
      } catch (error: any) {
        if (error.name === 'NotFoundError') {
          res.status(404).json({ error: error.message });
        } else if (error.name === 'ValidationError') {
          res.status(400).json({ error: error.message, details: error.details });
        } else if (error.name === 'PermissionError') {
          res.status(403).json({ error: error.message });
        } else {
          console.error('Error completing task:', error);
          res.status(500).json({ error: 'Internal server error' });
        }
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
      } catch (error: any) {
        if (error.name === 'NotFoundError') {
          res.status(404).json({ error: error.message });
        } else if (error.name === 'ValidationError') {
          res.status(400).json({ error: error.message });
        } else if (error.name === 'PermissionError') {
          res.status(403).json({ error: error.message });
        } else {
          console.error('Error skipping task:', error);
          res.status(500).json({ error: 'Internal server error' });
        }
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
      } catch (error: any) {
        if (error.name === 'NotFoundError') {
          res.status(404).json({ error: error.message });
        } else if (error.name === 'PermissionError') {
          res.status(403).json({ error: error.message });
        } else {
          console.error('Error reporting task issue:', error);
          res.status(500).json({ error: 'Internal server error' });
        }
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
          assignedCaregiverId: req.query.assignedCaregiverId as string,
          visitId: req.query.visitId as string,
          status: req.query.status ? (req.query.status as string).split(',') as any[] : undefined,
          category: req.query.category ? (req.query.category as string).split(',') as any[] : undefined,
          scheduledDateFrom: req.query.scheduledDateFrom ? new Date(req.query.scheduledDateFrom as string) : undefined,
          scheduledDateTo: req.query.scheduledDateTo ? new Date(req.query.scheduledDateTo as string) : undefined,
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
      } catch (error: any) {
        if (error.name === 'PermissionError') {
          res.status(403).json({ error: error.message });
        } else {
          console.error('Error searching tasks:', error);
          res.status(500).json({ error: 'Internal server error' });
        }
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
      } catch (error: any) {
        if (error.name === 'PermissionError') {
          res.status(403).json({ error: error.message });
        } else {
          console.error('Error fetching visit tasks:', error);
          res.status(500).json({ error: 'Internal server error' });
        }
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
      } catch (error: any) {
        if (error.name === 'ValidationError') {
          res.status(400).json({ error: error.message, details: error.details });
        } else if (error.name === 'PermissionError') {
          res.status(403).json({ error: error.message });
        } else {
          console.error('Error creating progress note:', error);
          res.status(500).json({ error: 'Internal server error' });
        }
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
      } catch (error: any) {
        if (error.name === 'PermissionError') {
          res.status(403).json({ error: error.message });
        } else {
          console.error('Error fetching progress notes:', error);
          res.status(500).json({ error: 'Internal server error' });
        }
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
      } catch (error: any) {
        if (error.name === 'PermissionError') {
          res.status(403).json({ error: error.message });
        } else {
          console.error('Error fetching analytics:', error);
          res.status(500).json({ error: 'Internal server error' });
        }
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
      } catch (error: any) {
        if (error.name === 'PermissionError') {
          res.status(403).json({ error: error.message });
        } else {
          console.error('Error fetching task metrics:', error);
          res.status(500).json({ error: 'Internal server error' });
        }
      }
    },
  };
}

export default createCarePlanHandlers;
