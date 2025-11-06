/**
 * Mileage API Handlers
 *
 * Express request handlers for mileage tracking
 */

import type { Request, Response } from 'express';
import type { UserContext, Role } from '@care-commons/core';
import { MileageService } from '../service/mileage-service.js';

/**
 * Extract user context from request
 * In production, this would extract from JWT or session
 */
function getUserContext(req: Request): UserContext {
  const branchId = req.header('X-Branch-Id');
  return {
    userId: req.header('X-User-Id') || 'system',
    organizationId: req.header('X-Organization-Id') || '',
    branchIds: branchId ? [branchId] : [],
    roles: (req.header('X-User-Roles') || 'STAFF').split(',') as Role[],
    permissions: (req.header('X-User-Permissions') || '').split(',').filter(Boolean),
  };
}

/**
 * Handle errors consistently across all handlers
 */
function handleError(error: unknown, res: Response, operation: string): void {
  const err = error as Error & { statusCode?: number };

  if (err.message.includes('permissions')) {
    res.status(403).json({ error: err.message });
  } else if (err.message.includes('not found')) {
    res.status(404).json({ error: err.message });
  } else if (err.message.includes('validation') || err.message.includes('already')) {
    res.status(400).json({ error: err.message });
  } else {
    console.error(`Error ${operation}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Create API handlers for mileage tracking
 */
export function createMileageHandlers(service: MileageService) {
  return {
    // ========================================================================
    // Mileage Entry Management
    // ========================================================================

    /**
     * POST /mileage
     * Create a new mileage entry
     */
    async createMileage(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        const mileage = await service.createMileage(req.body, context);
        res.status(201).json(mileage);
      } catch (error: unknown) {
        handleError(error, res, 'creating mileage entry');
      }
    },

    /**
     * GET /mileage/:id
     * Get mileage entry by ID
     */
    async getMileageById(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        const mileage = await service.getMileageById(req.params['id'] as string, context);

        if (!mileage) {
          res.status(404).json({ error: 'Mileage entry not found' });
          return;
        }

        res.json(mileage);
      } catch (error: unknown) {
        handleError(error, res, 'fetching mileage entry');
      }
    },

    /**
     * PUT /mileage/:id
     * Update a mileage entry
     */
    async updateMileage(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        const mileage = await service.updateMileage(
          req.params['id'] as string,
          req.body,
          context
        );
        res.json(mileage);
      } catch (error: unknown) {
        handleError(error, res, 'updating mileage entry');
      }
    },

    /**
     * DELETE /mileage/:id
     * Delete a mileage entry
     */
    async deleteMileage(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        await service.deleteMileage(req.params['id'] as string, context);
        res.status(204).send();
      } catch (error: unknown) {
        handleError(error, res, 'deleting mileage entry');
      }
    },

    /**
     * GET /mileage/employee/:employeeId
     * Get mileage entries for an employee
     */
    async getEmployeeMileage(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        const mileage = await service.getEmployeeMileage(
          req.params['employeeId'] as string,
          context
        );
        res.json(mileage);
      } catch (error: unknown) {
        handleError(error, res, 'fetching employee mileage');
      }
    },

    /**
     * GET /mileage/client/:clientId
     * Get mileage entries for a client
     */
    async getClientMileage(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        const mileage = await service.getClientMileage(
          req.params['clientId'] as string,
          context
        );
        res.json(mileage);
      } catch (error: unknown) {
        handleError(error, res, 'fetching client mileage');
      }
    },

    /**
     * POST /mileage/query
     * Query mileage entries with filters
     */
    async queryMileage(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        const mileage = await service.queryMileage(req.body, context);
        res.json(mileage);
      } catch (error: unknown) {
        handleError(error, res, 'querying mileage entries');
      }
    },

    /**
     * POST /mileage/summary
     * Get mileage summary
     */
    async getMileageSummary(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        const summary = await service.getMileageSummary(req.body, context);
        res.json(summary);
      } catch (error: unknown) {
        handleError(error, res, 'fetching mileage summary');
      }
    },

    // ========================================================================
    // Mileage Workflow Operations
    // ========================================================================

    /**
     * POST /mileage/submit
     * Submit mileage entries for approval
     */
    async submitMileage(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        const mileage = await service.submitMileage(req.body.mileageIds, context);
        res.json(mileage);
      } catch (error: unknown) {
        handleError(error, res, 'submitting mileage entries');
      }
    },

    /**
     * POST /mileage/approve
     * Approve mileage entries
     */
    async approveMileage(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        const mileage = await service.approveMileage(
          req.body.mileageIds,
          req.body.notes,
          context
        );
        res.json(mileage);
      } catch (error: unknown) {
        handleError(error, res, 'approving mileage entries');
      }
    },

    /**
     * POST /mileage/reject
     * Reject mileage entries
     */
    async rejectMileage(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        const mileage = await service.rejectMileage(
          req.body.mileageIds,
          req.body.rejectionReason,
          context
        );
        res.json(mileage);
      } catch (error: unknown) {
        handleError(error, res, 'rejecting mileage entries');
      }
    },

    /**
     * POST /mileage/mark-paid
     * Mark mileage entries as paid
     */
    async markMileagePaid(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        const mileage = await service.markMileagePaid(
          req.body.mileageIds,
          req.body.paymentReference,
          context
        );
        res.json(mileage);
      } catch (error: unknown) {
        handleError(error, res, 'marking mileage as paid');
      }
    },

    // ========================================================================
    // Mileage Rate Management
    // ========================================================================

    /**
     * POST /mileage-rates
     * Create a new mileage rate
     */
    async createRate(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        const rate = await service.createRate(req.body, context);
        res.status(201).json(rate);
      } catch (error: unknown) {
        handleError(error, res, 'creating mileage rate');
      }
    },

    /**
     * GET /mileage-rates/active
     * Get all active rates for a specific date
     */
    async getActiveRates(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        const date = (req.query['date'] as string) || new Date().toISOString();
        const rates = await service.getActiveRates(date, context);
        res.json(rates);
      } catch (error: unknown) {
        handleError(error, res, 'fetching active mileage rates');
      }
    },

    /**
     * GET /mileage-rates/:rateType/active
     * Get active rate for a specific rate type and date
     */
    async getActiveRate(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        const date = (req.query['date'] as string) || new Date().toISOString();
        const rate = await service.getActiveRate(
          req.params['rateType'] as string,
          date,
          context
        );

        if (!rate) {
          res.status(404).json({ error: 'No active rate found' });
          return;
        }

        res.json(rate);
      } catch (error: unknown) {
        handleError(error, res, 'fetching active mileage rate');
      }
    },
  };
}
