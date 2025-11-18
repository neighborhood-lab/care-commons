/**
 * EVV (Electronic Visit Verification) Routes
 * 
 * RESTful API endpoints for EVV clock-in/out and record management
 * 
 * NOTE: This is a simplified implementation for demo purposes.
 * Full EVV functionality with state compliance is available via the demo routes.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { Database, AuthMiddleware } from '@care-commons/core';
import { EVVRepository } from '@care-commons/time-tracking-evv';

export function createEVVRouter(db: Database): Router {
  const router = Router();
  const authMiddleware = new AuthMiddleware(db);
  const evvRepository = new EVVRepository(db);

  // All EVV routes require authentication
  router.use(authMiddleware.requireAuth);

  /**
   * GET /api/evv
   * Search EVV records with filters
   */
  router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orgId = req.user?.organizationId;
      if (orgId === undefined) {
        res.status(400).json({ error: 'Organization ID required' });
        return;
      }

      const filters: Record<string, unknown> = {
        organizationId: orgId,
      };
      
      if (typeof req.query.branchId === 'string' && req.query.branchId !== '') {
        filters.branchId = req.query.branchId;
      }
      if (typeof req.query.caregiverId === 'string' && req.query.caregiverId !== '') {
        filters.caregiverId = req.query.caregiverId;
      }
      if (typeof req.query.clientId === 'string' && req.query.clientId !== '') {
        filters.clientId = req.query.clientId;
      }
      if (typeof req.query.status === 'string' && req.query.status !== '') {
        filters.status = [req.query.status];
      }

      const pagination = {
        page: parseInt((typeof req.query.page === 'string' && req.query.page !== '') ? req.query.page : '1', 10),
        limit: parseInt((typeof req.query.limit === 'string' && req.query.limit !== '') ? req.query.limit : '25', 10),
      };

      const records = await evvRepository.searchEVVRecords(filters, pagination);
      
      res.json({
        items: records.items,
        total: records.total,
        page: pagination.page,
        limit: pagination.limit,
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/evv/:id
   * Get EVV record by ID
   */
  router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id;
      if (id === undefined || id === '') {
        res.status(400).json({ error: 'ID required' });
        return;
      }

      const record = await evvRepository.getEVVRecordById(id);
      
      if (record === null) {
        res.status(404).json({ error: 'EVV record not found' });
        return;
      }
      
      res.json(record);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
