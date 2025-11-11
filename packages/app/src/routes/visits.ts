/**
 * Visit API routes
 * 
 * Handles visit and scheduling endpoints for mobile and web applications
 */

import { Router, Request, Response, NextFunction } from 'express';
import { Database } from '@care-commons/core';
import { requireAuth } from '../middleware/auth-context.js';
import { ScheduleRepository } from '@care-commons/scheduling-visits';

export function createVisitRouter(db: Database): Router {
  const router = Router();

  // All routes require authentication
  router.use(requireAuth);

  /**
   * GET /api/visits/my-visits
   * Get visits assigned to the authenticated caregiver within a date range
   * 
   * Query params:
   * - start_date: Start date (YYYY-MM-DD format)
   * - end_date: End date (YYYY-MM-DD format)
   * 
   * Returns: Array of visits with client information
   */
  router.get('/my-visits', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const context = req.userContext!;
      
      // Validate query parameters
      const startDateStr = req.query['start_date'] as string | undefined;
      const endDateStr = req.query['end_date'] as string | undefined;

      if (startDateStr == null || startDateStr === '' || endDateStr == null || endDateStr === '') {
        res.status(400).json({
          success: false,
          error: 'Missing required parameters: start_date and end_date',
        });
        return;
      }

      // Parse dates
      const startDate = new Date(startDateStr);
      const endDate = new Date(endDateStr);

      // Validate date format
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        res.status(400).json({
          success: false,
          error: 'Invalid date format. Use YYYY-MM-DD format',
        });
        return;
      }

      // Validate date range (max 31 days)
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff > 31) {
        res.status(400).json({
          success: false,
          error: 'Date range cannot exceed 31 days',
        });
        return;
      }

      if (daysDiff < 0) {
        res.status(400).json({
          success: false,
          error: 'End date must be after start date',
        });
        return;
      }

      // Get caregiver ID from user context
      // For now, we'll use the userId directly. In production, we'd look up the caregiver
      // record linked to this user (via email or user_id field when added)
      const caregiverId = context.userId;

      // Fetch visits
      const repository = new ScheduleRepository(db.getPool());
      const visits = await repository.getVisitsByCaregiver(caregiverId, startDate, endDate);

      res.json({
        success: true,
        data: visits,
        meta: {
          startDate: startDateStr,
          endDate: endDateStr,
          count: visits.length,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
