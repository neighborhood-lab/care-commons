/**
 * Holiday API Routes
 *
 * Endpoints for holiday calendar management
 */

import { Router } from 'express';
import { Database, AuthMiddleware, HolidayService } from '@care-commons/core';

export function createHolidayRouter(db: Database): Router {
  const router = Router();
  const authMiddleware = new AuthMiddleware(db);
  const holidayService = new HolidayService(db);

  // All holiday routes require authentication
  router.use(authMiddleware.requireAuth);

  /**
   * GET /api/holidays
   * Get holidays in a date range for a branch
   */
  router.get('/holidays', async (req, res, next) => {
    try {
      const { startDate, endDate, branchId } = req.query;

      if (
        typeof startDate !== 'string' ||
        typeof endDate !== 'string' ||
        typeof branchId !== 'string'
      ) {
        return res.status(400).json({
          error: 'Missing required parameters: startDate, endDate, branchId',
        });
      }

      const holidays = await holidayService.getHolidays(
        new Date(startDate),
        new Date(endDate),
        branchId
      );

      return res.json(holidays);
    } catch (error) {
      return next(error);
    }
  });

  /**
   * GET /api/holidays/year/:year
   * Get all holidays for a specific year
   */
  router.get('/holidays/year/:year', async (req, res, next) => {
    try {
      const { year } = req.params;
      const { branchId } = req.query;

      if (typeof branchId !== 'string') {
        return res.status(400).json({
          error: 'Missing required parameter: branchId',
        });
      }

      const holidays = await holidayService.getHolidaysForYear(
        Number(year),
        branchId
      );

      return res.json(holidays);
    } catch (error) {
      return next(error);
    }
  });

  /**
   * GET /api/holiday-calendars
   * Get all holiday calendars
   */
  router.get('/holiday-calendars', async (_req, res, next) => {
    try {
      const calendars = await holidayService.getCalendars();
      return res.json(calendars);
    } catch (error) {
      return next(error);
    }
  });

  return router;
}
