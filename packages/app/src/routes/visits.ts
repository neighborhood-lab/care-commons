/**
 * Visit API routes
 * 
 * Handles visit and scheduling endpoints for mobile and web applications
 */

import { Router, Request, Response, NextFunction } from 'express';
import { Database, isValidUUID } from '@care-commons/core';
import { requireAuth } from '../middleware/auth-context.js';
import { ScheduleRepository } from '@care-commons/scheduling-visits';

/**
 * Validates date range parameters for calendar/list endpoints
 * Returns error response or null if valid
 */
function validateDateRangeParams(
  startDateStr: string | undefined,
  endDateStr: string | undefined,
  res: Response
): { startDate: Date; endDate: Date } | null {
  // Check required parameters
  if (startDateStr == null || startDateStr === '' || endDateStr == null || endDateStr === '') {
    res.status(400).json({
      success: false,
      error: 'Missing required parameters: start_date and end_date',
    });
    return null;
  }

  // Validate date string format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(startDateStr) || !dateRegex.test(endDateStr)) {
    res.status(400).json({
      success: false,
      error: 'Invalid date format. Use YYYY-MM-DD format (e.g., 2025-01-15)',
    });
    return null;
  }

  // Parse dates - use UTC to avoid timezone issues
  const startDate = new Date(startDateStr + 'T00:00:00Z');
  const endDate = new Date(endDateStr + 'T23:59:59Z');

  // Validate date parsing
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    res.status(400).json({
      success: false,
      error: 'Invalid date values. Dates must be valid calendar dates',
    });
    return null;
  }

  // Validate date range (max 60 days for calendar view)
  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  if (daysDiff > 60) {
    res.status(400).json({
      success: false,
      error: 'Date range cannot exceed 60 days',
    });
    return null;
  }

  if (daysDiff < 0) {
    res.status(400).json({
      success: false,
      error: 'End date must be on or after start date',
    });
    return null;
  }

  return { startDate, endDate };
}

export function createVisitRouter(db: Database): Router {
  const router = Router();

  // All routes require authentication
  router.use(requireAuth);

  /**
   * GET /api/visits/calendar
   * Get visits for calendar view (optimized for month/week display)
   */
  // eslint-disable-next-line sonarjs/cognitive-complexity
  router.get('/calendar', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const context = req.userContext!;

      // Validate query parameters
      const startDateStr = req.query['start_date'] as string | undefined;
      const endDateStr = req.query['end_date'] as string | undefined;
      const branchIdsStr = req.query['branch_ids'] as string | undefined;

      const dateRange = validateDateRangeParams(startDateStr, endDateStr, res);
      if (dateRange === null) {
        return; // Response already sent by validator
      }
      const { startDate, endDate } = dateRange;

      // Validate organization_id is present and valid
      if (context.organizationId === undefined) {
        res.status(400).json({
          success: false,
          error: 'Organization ID is required for this endpoint',
        });
        return;
      }

      const organizationId = context.organizationId;
      if (isValidUUID(organizationId) === false) {
        res.status(400).json({
          success: false,
          error: 'Invalid organization ID format',
        });
        return;
      }

      // Parse and validate branch IDs if provided
      let branchIds: string[] = context.branchIds;
      if (branchIdsStr != null && branchIdsStr !== '') {
        branchIds = branchIdsStr.split(',')
          .map(id => id.trim())
          .filter(id => id !== '');

        // Validate UUID format for branch IDs
        const uuidRegex = /^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i;
        const invalidBranchIds = branchIds.filter(id => !uuidRegex.test(id));
        if (invalidBranchIds.length > 0) {
          res.status(400).json({
            success: false,
            error: `Invalid branch IDs: ${invalidBranchIds.join(', ')}`,
          });
          return;
        }

        // Ensure user has access to requested branches
        const userBranchIds: string[] = context.branchIds ?? [];
        const unauthorizedBranches = branchIds.filter(id => userBranchIds.includes(id) === false);
        if (unauthorizedBranches.length > 0) {
          res.status(403).json({
            success: false,
            error: 'Access denied to requested branches',
          });
          return;
        }
      }

      // Fetch visits with client information
      const repository = new ScheduleRepository(db.getPool());
      const visits = await repository.getVisitsByDateRange(
        organizationId,
        startDate,
        endDate,
        branchIds.length > 0 ? branchIds : undefined
      );

      res.json({
        success: true,
        data: visits,
        meta: {
          startDate: startDateStr,
          endDate: endDateStr,
          count: visits.length,
          branchesFilter: branchIds.length > 0 ? branchIds : 'all',
        },
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * PUT /api/visits/:id/assign
   * Assign a caregiver to a visit
   * Requires coordinator or admin role
   *
   * Body:
   * - caregiverId: UUID of caregiver to assign
   * - checkConflicts: boolean (default: true) - whether to check for scheduling conflicts
   *
   * Returns: Updated visit with assignment details
   */
  router.put('/:id/assign', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const context = req.userContext!;
      const { id: visitId } = req.params;
      const { caregiverId, checkConflicts = true } = req.body;

      // Validate required fields
      if (caregiverId === undefined || caregiverId === null || caregiverId.trim() === '') {
        res.status(400).json({
          success: false,
          error: 'caregiverId is required',
        });
        return;
      }

      // Validate organization_id is present
      if (context.organizationId === undefined) {
        res.status(400).json({
          success: false,
          error: 'Organization ID is required for this endpoint',
        });
        return;
      }

      const organizationId = context.organizationId;
      if (isValidUUID(organizationId) === false) {
        res.status(400).json({
          success: false,
          error: 'Invalid organization ID format',
        });
        return;
      }

      // Verify visit exists
      const visitCheck = await db.query(
        `SELECT id, organization_id, branch_id, scheduled_date, scheduled_start_time, scheduled_end_time, status
         FROM visits
         WHERE id = $1 AND deleted_at IS NULL`,
        [visitId]
      );

      if (visitCheck.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'Visit not found',
        });
        return;
      }

      const visit = visitCheck.rows[0] as {
        id: string;
        organization_id: string;
        branch_id: string;
        scheduled_date: Date;
        scheduled_start_time: string;
        scheduled_end_time: string;
        status: string;
      };

      // Check organization access
      if (visit.organization_id !== context.organizationId) {
        res.status(403).json({
          success: false,
          error: 'Access denied',
        });
        return;
      }

      // Check branch access
      if (context.branchIds.includes(visit.branch_id) === false) {
        res.status(403).json({
          success: false,
          error: 'No access to this branch',
        });
        return;
      }

      // Verify caregiver exists and is active
      const caregiverCheck = await db.query(
        `SELECT id, status FROM caregivers
         WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL`,
        [caregiverId, context.organizationId]
      );

      if (caregiverCheck.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'Caregiver not found',
        });
        return;
      }

      const caregiver = caregiverCheck.rows[0] as { id: string; status: string };

      if (caregiver.status !== 'ACTIVE') {
        res.status(400).json({
          success: false,
          error: 'Caregiver is not active',
        });
        return;
      }

      // Check for conflicts if requested
      if (checkConflicts === true) {
        const conflicts = await db.query(
          `SELECT id, scheduled_start_time, scheduled_end_time, client_id
           FROM visits
           WHERE assigned_caregiver_id = $1
             AND scheduled_date = $2
             AND deleted_at IS NULL
             AND status NOT IN ('CANCELLED', 'COMPLETED', 'NO_SHOW_CAREGIVER')
             AND id != $3
             AND (
               (scheduled_start_time < $5 AND scheduled_end_time > $4)
               OR (scheduled_start_time >= $4 AND scheduled_start_time < $5)
             )`,
          [caregiverId, visit.scheduled_date, visitId, visit.scheduled_start_time, visit.scheduled_end_time]
        );

        if (conflicts.rows.length > 0) {
          res.status(409).json({
            success: false,
            error: 'Scheduling conflict detected',
            conflicts: conflicts.rows,
          });
          return;
        }
      }

      // Assign caregiver to visit
      const result = await db.query(
        `UPDATE visits
         SET assigned_caregiver_id = $1,
             assigned_at = NOW(),
             assignment_method = 'MANUAL',
             status = CASE
               WHEN status = 'UNASSIGNED' THEN 'ASSIGNED'
               ELSE status
             END,
             updated_by = $2,
             updated_at = NOW()
         WHERE id = $3
         RETURNING *`,
        [caregiverId, context.userId, visitId]
      );

      res.json({
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/visits/:id/check-conflicts
   * Check for scheduling conflicts when assigning a caregiver to a visit
   *
   * Body:
   * - caregiverId: UUID of caregiver to check
   *
   * Returns: Array of conflicting visits
   */
  router.post('/:id/check-conflicts', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const context = req.userContext!;
      const { id: visitId } = req.params;
      const { caregiverId } = req.body;

      // Validate required fields
      if (caregiverId === undefined || caregiverId === null || caregiverId.trim() === '') {
        res.status(400).json({
          success: false,
          error: 'caregiverId is required',
        });
        return;
      }

      // Validate organization_id is present
      if (context.organizationId === undefined) {
        res.status(400).json({
          success: false,
          error: 'Organization ID is required for this endpoint',
        });
        return;
      }

      const organizationId = context.organizationId;
      if (isValidUUID(organizationId) === false) {
        res.status(400).json({
          success: false,
          error: 'Invalid organization ID format',
        });
        return;
      }

      // Verify visit exists
      const visitCheck = await db.query(
        `SELECT id, organization_id, scheduled_date, scheduled_start_time, scheduled_end_time
         FROM visits
         WHERE id = $1 AND deleted_at IS NULL`,
        [visitId]
      );

      if (visitCheck.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'Visit not found',
        });
        return;
      }

      const visit = visitCheck.rows[0] as {
        id: string;
        organization_id: string;
        scheduled_date: Date;
        scheduled_start_time: string;
        scheduled_end_time: string;
      };

      // Check organization access
      if (visit.organization_id !== context.organizationId) {
        res.status(403).json({
          success: false,
          error: 'Access denied',
        });
        return;
      }

      // Find conflicting visits
      const conflicts = await db.query(
        `SELECT v.id, v.scheduled_start_time, v.scheduled_end_time, v.status,
                c.first_name as client_first_name, c.last_name as client_last_name,
                v.address
         FROM visits v
         LEFT JOIN clients c ON v.client_id = c.id
         WHERE v.assigned_caregiver_id = $1
           AND v.scheduled_date = $2
           AND v.deleted_at IS NULL
           AND v.status NOT IN ('CANCELLED', 'COMPLETED', 'NO_SHOW_CAREGIVER')
           AND v.id != $3
           AND (
             (v.scheduled_start_time < $5 AND v.scheduled_end_time > $4)
             OR (v.scheduled_start_time >= $4 AND v.scheduled_start_time < $5)
           )
         ORDER BY v.scheduled_start_time`,
        [caregiverId, visit.scheduled_date, visitId, visit.scheduled_start_time, visit.scheduled_end_time]
      );

      res.json({
        success: true,
        hasConflicts: conflicts.rows.length > 0,
        conflicts: conflicts.rows,
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/visits/caregivers/availability
   * Get caregiver availability for a specific date range
   * Returns caregivers with their assigned visits to show availability
   *
   * Query params:
   * - date: Date to check (YYYY-MM-DD format)
   * - branch_ids: Optional comma-separated branch IDs to filter
   *
   * Returns: Array of caregivers with their visits for the date
   */
  router.get('/caregivers/availability', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const context = req.userContext!;
      const dateStr = req.query['date'] as string | undefined;
      const branchIdsStr = req.query['branch_ids'] as string | undefined;

      if (dateStr == null || dateStr === '') {
        res.status(400).json({
          success: false,
          error: 'Missing required parameter: date',
        });
        return;
      }

      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        res.status(400).json({
          success: false,
          error: 'Invalid date format. Use YYYY-MM-DD format',
        });
        return;
      }

      // Validate organization_id is present and valid
      if (context.organizationId === undefined) {
        res.status(400).json({
          success: false,
          error: 'Organization ID is required for this endpoint',
        });
        return;
      }

      const organizationId = context.organizationId;
      if (isValidUUID(organizationId) === false) {
        res.status(400).json({
          success: false,
          error: 'Invalid organization ID format',
        });
        return;
      }

      // Parse branch IDs if provided
      const branchIds = branchIdsStr != null && branchIdsStr !== ''
        ? branchIdsStr.split(',').filter(id => id.trim() !== '')
        : context.branchIds;

      // Get caregivers and their visits for the date
      const result = await db.query(
        `SELECT
           cg.id as caregiver_id,
           cg.first_name,
           cg.last_name,
           cg.status as caregiver_status,
           COALESCE(
             json_agg(
               json_build_object(
                 'id', v.id,
                 'scheduled_start_time', v.scheduled_start_time,
                 'scheduled_end_time', v.scheduled_end_time,
                 'status', v.status,
                 'client_name', c.first_name || ' ' || c.last_name
               )
               ORDER BY v.scheduled_start_time
             ) FILTER (WHERE v.id IS NOT NULL),
             '[]'
           ) as visits
         FROM caregivers cg
         LEFT JOIN visits v ON cg.id = v.assigned_caregiver_id
           AND v.scheduled_date = $1
           AND v.deleted_at IS NULL
           AND v.status NOT IN ('CANCELLED', 'COMPLETED', 'NO_SHOW_CAREGIVER')
         LEFT JOIN clients c ON v.client_id = c.id
         WHERE cg.organization_id = $2
           AND cg.deleted_at IS NULL
           AND cg.status = 'ACTIVE'
           AND ($3::uuid[] IS NULL OR cg.branch_ids && $3::uuid[])
         GROUP BY cg.id, cg.first_name, cg.last_name, cg.status
         ORDER BY cg.last_name, cg.first_name`,
        [date, organizationId, branchIds.length > 0 ? branchIds : null]
      );

      res.json({
        success: true,
        data: result.rows,
        meta: {
          date: dateStr,
          count: result.rows.length,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
