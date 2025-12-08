/**
 * Visit API routes
 * 
 * Handles visit and scheduling endpoints for mobile and web applications
 */

import { Router, Request, Response, NextFunction } from 'express';
import { Database, isValidUUID, ComplianceAutopilotService, AuditService, UserContext } from '@folkcare/core';
import { requireAuth } from '../middleware/auth-context.js';
import { ScheduleRepository } from '@folkcare/scheduling-visits';
import { ComplianceCheckingService, complianceCheckRequestSchema, DocumentationQualityService, HospitalizationRiskService, VitalsAnomalyService, SentimentAnalysisService } from '@folkcare/visit-notes';
import { VisitDurationPredictionService } from '@folkcare/scheduling-visits';
import knex from 'knex';

/**
 * Create a Knex instance for AI services that need it.
 * Note: Consider adding a getKnex() function to @folkcare/core in the future.
 */
function getKnexInstance(): ReturnType<typeof knex> {
  const connectionString = process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/folk-care-0';
  return knex({
    client: 'pg',
    connection: connectionString,
  });
}

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

      // Look up the user's email to find their caregiver record
      const userResult = await db.query(
        `SELECT email FROM users WHERE id = $1`,
        [context.userId]
      );

      if (userResult.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'User not found',
        });
        return;
      }

      const userEmail = (userResult.rows[0] as { email: string }).email;

      // Find caregiver record by email
      const caregiverResult = await db.query(
        `SELECT id FROM caregivers WHERE email = $1 AND deleted_at IS NULL`,
        [userEmail]
      );

      if (caregiverResult.rows.length === 0) {
        // User doesn't have a caregiver record - return empty array
        // This is valid for coordinators, admins, etc.
        res.json({
          success: true,
          data: [],
          meta: {
            startDate: startDateStr,
            endDate: endDateStr,
            count: 0,
            message: 'No caregiver record found for this user',
          },
        });
        return;
      }

      const caregiverId = (caregiverResult.rows[0] as { id: string }).id;

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

  /**
   * GET /api/visits/calendar
   * Get visits for calendar view (optimized for month/week display)
   */
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

  // Initialize compliance service for scheduling checks
  const complianceService = new ComplianceAutopilotService(db);

  /**
   * PUT /api/visits/:id/assign
   * Assign a caregiver to a visit
   * Requires coordinator or admin role
   *
   * Body:
   * - caregiverId: UUID of caregiver to assign
   * - checkConflicts: boolean (default: true) - whether to check for scheduling conflicts
   * - checkCompliance: boolean (default: true) - whether to check caregiver compliance
   * - forceAssignment: boolean (default: false) - force assignment despite compliance issues (requires supervisor role)
   * - overrideReason: string (required if forceAssignment is true) - audit trail for compliance override
   *
   * Returns: Updated visit with assignment details
   */
  // eslint-disable-next-line sonarjs/cognitive-complexity -- Well-structured with validation, compliance, and assignment sections
  router.put('/:id/assign', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const context = req.userContext!;
      const { id: visitId } = req.params;
      const { 
        caregiverId, 
        checkConflicts = true,
        checkCompliance = true,
        forceAssignment = false,
        overrideReason,
      } = req.body;

      // Validate required fields
      if (caregiverId === undefined || caregiverId === null || caregiverId.trim() === '') {
        res.status(400).json({
          success: false,
          error: 'caregiverId is required',
        });
        return;
      }

      // Validate override reason if forcing assignment
      if (forceAssignment === true && (overrideReason === undefined || overrideReason.trim() === '')) {
        res.status(400).json({
          success: false,
          error: 'overrideReason is required when forceAssignment is true',
          code: 'OVERRIDE_REASON_REQUIRED',
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
        `SELECT id, status, first_name, last_name FROM caregivers
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

      const caregiver = caregiverCheck.rows[0] as { 
        id: string; 
        status: string;
        first_name: string;
        last_name: string;
      };

      if (caregiver.status !== 'ACTIVE') {
        res.status(400).json({
          success: false,
          error: 'Caregiver is not active',
        });
        return;
      }

      // Check caregiver compliance status
      let complianceOverridden = false;
      let complianceIssues: string[] = [];
      
      if (checkCompliance === true) {
        const complianceResult = await complianceService.canCaregiverBeScheduled(
          organizationId,
          caregiverId
        );

        if (complianceResult.canSchedule === false) {
          complianceIssues = complianceResult.blockingIssues;

          // If not forcing assignment, block with compliance error
          if (forceAssignment !== true) {
            res.status(422).json({
              success: false,
              error: 'Caregiver has compliance issues that block scheduling',
              code: 'COMPLIANCE_BLOCK',
              complianceIssues: complianceResult.blockingIssues,
              canForceAssignment: true,
              message: `${caregiver.first_name} ${caregiver.last_name} cannot be scheduled: ${complianceResult.blockingIssues.join(', ')}. ` +
                       'A supervisor can force this assignment with an override reason.',
            });
            return;
          }

          // Check if user has supervisor role to force assignment
          const supervisorRoles = ['SUPER_ADMIN', 'ORG_ADMIN', 'BRANCH_ADMIN', 'COORDINATOR'];
          const hasSupervisorRole = context.roles.some(role => supervisorRoles.includes(role));

          if (hasSupervisorRole === false) {
            res.status(403).json({
              success: false,
              error: 'Only supervisors can force assignment with compliance issues',
              code: 'SUPERVISOR_REQUIRED',
              complianceIssues: complianceResult.blockingIssues,
            });
            return;
          }

          complianceOverridden = true;
        }
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

      // If compliance was overridden, log the override for audit trail
      if (complianceOverridden) {
        await db.query(
          `INSERT INTO audit_logs (
            organization_id, user_id, action, entity_type, entity_id,
            details, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
          [
            organizationId,
            context.userId,
            'COMPLIANCE_OVERRIDE',
            'VISIT',
            visitId,
            JSON.stringify({
              caregiverId,
              caregiverName: `${caregiver.first_name} ${caregiver.last_name}`,
              complianceIssues,
              overrideReason,
              visitDate: visit.scheduled_date,
            }),
          ]
        );
      }

      // Assign caregiver to visit
      const result = await db.query(
        `UPDATE visits
         SET assigned_caregiver_id = $1,
             assigned_at = NOW(),
             assignment_method = $2,
             status = CASE
               WHEN status = 'UNASSIGNED' THEN 'ASSIGNED'
               ELSE status
             END,
             updated_by = $3,
             updated_at = NOW()
         WHERE id = $4
         RETURNING *`,
        [
          caregiverId, 
          complianceOverridden ? 'MANUAL_OVERRIDE' : 'MANUAL',
          context.userId, 
          visitId
        ]
      );

      res.json({
        success: true,
        data: result.rows[0],
        complianceOverridden,
        ...(complianceOverridden && {
          warning: 'Assignment completed with compliance override. This has been logged for audit purposes.',
          overriddenIssues: complianceIssues,
        }),
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
   * POST /api/visits/:id/check-assignment
   * Check if a caregiver can be assigned to a visit
   * Combines compliance and conflict checks for UI validation
   *
   * Body:
   * - caregiverId: UUID of caregiver to check
   *
   * Returns: Assignment eligibility with any blocking issues
   */
  router.post('/:id/check-assignment', async (req: Request, res: Response, next: NextFunction) => {
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

      // Get caregiver info
      const caregiverCheck = await db.query(
        `SELECT id, first_name, last_name, status FROM caregivers
         WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL`,
        [caregiverId, organizationId]
      );

      if (caregiverCheck.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'Caregiver not found',
        });
        return;
      }

      const caregiver = caregiverCheck.rows[0] as {
        id: string;
        first_name: string;
        last_name: string;
        status: string;
      };

      // Build eligibility result
      const result: {
        canAssign: boolean;
        caregiverName: string;
        caregiverStatus: string;
        complianceStatus: {
          isCompliant: boolean;
          blockingIssues: string[];
          canOverride: boolean;
        };
        schedulingStatus: {
          hasConflicts: boolean;
          conflicts: unknown[];
        };
        warnings: string[];
      } = {
        canAssign: true,
        caregiverName: `${caregiver.first_name} ${caregiver.last_name}`,
        caregiverStatus: caregiver.status,
        complianceStatus: {
          isCompliant: true,
          blockingIssues: [],
          canOverride: false,
        },
        schedulingStatus: {
          hasConflicts: false,
          conflicts: [],
        },
        warnings: [],
      };

      // Check if caregiver is active
      if (caregiver.status !== 'ACTIVE') {
        result.canAssign = false;
        result.warnings.push(`Caregiver is ${caregiver.status}`);
      }

      // Check compliance
      const complianceResult = await complianceService.canCaregiverBeScheduled(
        organizationId,
        caregiverId
      );

      if (complianceResult.canSchedule === false) {
        result.complianceStatus.isCompliant = false;
        result.complianceStatus.blockingIssues = complianceResult.blockingIssues;
        result.complianceStatus.canOverride = true;
        result.canAssign = false;
      }

      // Check for scheduling conflicts
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

      if (conflicts.rows.length > 0) {
        result.schedulingStatus.hasConflicts = true;
        result.schedulingStatus.conflicts = conflicts.rows;
        result.canAssign = false;
      }

      res.json({
        success: true,
        data: result,
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

  /**
   * POST /api/visits/:id/notes
   * Create a new note for a visit
   * 
   * Body:
   * - noteType: 'GENERAL' | 'CLINICAL' | 'INCIDENT' | 'TASK'
   * - noteText: string (required)
   * - noteHtml: string (optional)
   * - activitiesPerformed: string[] (optional)
   * - clientMood: enum (optional)
   * - clientConditionNotes: string (optional)
   * - isIncident: boolean
   * - incidentSeverity: enum (optional, required if isIncident=true)
   * - incidentDescription: string (optional)
   * - isVoiceNote: boolean
   * - audioFileUri: string (optional)
   * - transcriptionConfidence: number (optional)
   * 
   * Returns: Created note with ID
   */
  router.post('/:id/notes', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const context = req.userContext!;
      const { id: visitId } = req.params;
      
      // Validate required fields
      const {
        noteType = 'GENERAL',
        noteText,
        noteHtml,
        activitiesPerformed = [],
        clientMood,
        clientConditionNotes,
        isIncident = false,
        incidentSeverity,
        incidentDescription,
        isVoiceNote = false,
        audioFileUri,
        transcriptionConfidence,
      } = req.body;

      if (noteText === undefined || noteText === null || noteText.trim() === '') {
        res.status(400).json({
          success: false,
          error: 'noteText is required',
        });
        return;
      }

      // Validate incident fields
      if (isIncident === true && incidentSeverity === undefined) {
        res.status(400).json({
          success: false,
          error: 'incidentSeverity is required when isIncident is true',
        });
        return;
      }

      // Verify visit exists and user has access
      const visitCheck = await db.query(
        `SELECT id, assigned_caregiver_id, organization_id, status
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

      const visit = visitCheck.rows[0] as { id: string; assigned_caregiver_id: string | null; organization_id: string; status: string };

      // Verify user is the assigned caregiver or has admin access
      // For now, we'll allow if user is the caregiver
      // NOTE: Future enhancement - add organization-level access control
      if (visit.assigned_caregiver_id == null) {
        res.status(400).json({
          success: false,
          error: 'Visit is not assigned to a caregiver',
        });
        return;
      }

      const caregiverCheck = await db.query(
        `SELECT id FROM caregivers WHERE id = $1 AND deleted_at IS NULL`,
        [visit.assigned_caregiver_id]
      );

      if (caregiverCheck.rows.length === 0) {
        res.status(403).json({
          success: false,
          error: 'Access denied',
        });
        return;
      }

      const caregiverId = (caregiverCheck.rows[0] as { id: string }).id;

      // Insert note
      const result = await db.query(
        `INSERT INTO visit_notes (
          visit_id, organization_id, caregiver_id,
          note_type, note_text, note_html,
          activities_performed,
          client_mood, client_condition_notes,
          is_incident, incident_severity, incident_description,
          incident_reported_at,
          is_voice_note, audio_file_uri, transcription_confidence,
          is_synced, sync_pending,
          created_by, updated_by
        ) VALUES (
          $1, $2, $3,
          $4, $5, $6,
          $7::jsonb,
          $8, $9,
          $10, $11, $12,
          $13,
          $14, $15, $16,
          TRUE, FALSE,
          $17, $17
        ) RETURNING *`,
        [
          visitId,
          visit.organization_id,
          caregiverId,
          noteType,
          noteText.trim(),
          noteHtml ?? null,
          JSON.stringify(activitiesPerformed),
          clientMood ?? null,
          clientConditionNotes ?? null,
          isIncident,
          incidentSeverity ?? null,
          incidentDescription ?? null,
          isIncident === true ? new Date() : null,
          isVoiceNote,
          audioFileUri ?? null,
          transcriptionConfidence ?? null,
          context.userId,
        ]
      );

      res.status(201).json({
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      next(error);
    }
  });

// POST /visits/compliance-check
  // Automated compliance checking for visits (AI-powered)
  // eslint-disable-next-line sonarjs/cognitive-complexity -- Sequential validation guards are inherently branchy
  router.post('/compliance-check', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    const knexDb = getKnexInstance();
    const auditService = new AuditService(db);

    try {
      // Validate request body using Zod
      const parseResult = complianceCheckRequestSchema.safeParse(req.body);
      if (parseResult.success === false) {
        res.status(400).json({
          success: false,
          error: 'Invalid request parameters',
          details: parseResult.error.issues,
        });
        return;
      }

      const { visitId, clientId, lookbackDays } = parseResult.data;

      // Get user context for permission checking
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const user = req.user;

      // Create user context for audit logging
      const context: UserContext = {
        userId: user.userId,
        organizationId: user.organizationId ?? '',
        roles: user.roles ?? [],
        permissions: user.permissions ?? [],
        branchIds: user.branchIds ?? [],
      };

      // Check that user has permission to read visits (required for compliance checking)
      // The requireAuth middleware already ensures the user is authenticated
      // Here we ensure they have proper organization context
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
      if (!context.organizationId) {
        res.status(403).json({
          success: false,
          error: 'User must belong to an organization to perform compliance checks',
        });
        return;
      }

      // Run compliance check
      const complianceService = new ComplianceCheckingService(knexDb);
      const effectiveLookbackDays = lookbackDays ?? 7;
      const result = await complianceService.checkCompliance({
        visitId,
        clientId,
        lookbackDays: effectiveLookbackDays,
      });

      // Log audit event for HIPAA compliance
      await auditService.logEvent(context, {
        eventType: 'DATA_ACCESS',
        resource: 'COMPLIANCE_CHECK',
        resourceId: visitId ?? clientId ?? 'all',
        action: 'COMPLIANCE_CHECK',
        result: 'SUCCESS',
        metadata: {
          visitId,
          clientId,
          lookbackDays,
          visitCount: result.visitResults.length,
          overallStatus: result.overallStatus,
          criticalIssueCount: result.criticalIssues.length,
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      // Log failure audit event
      const user = req.user;
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
      if (user) {
        const context: UserContext = {
          userId: user.userId,
          organizationId: user.organizationId ?? '',
          roles: user.roles ?? [],
          permissions: user.permissions ?? [],
          branchIds: user.branchIds ?? [],
        };
        const bodyVisitId = typeof req.body?.visitId === 'string' ? req.body.visitId : null;
        const bodyClientId = typeof req.body?.clientId === 'string' ? req.body.clientId : null;
        await auditService.logEvent(context, {
          eventType: 'DATA_ACCESS',
          resource: 'COMPLIANCE_CHECK',
          resourceId: bodyVisitId ?? bodyClientId ?? 'all',
          action: 'COMPLIANCE_CHECK',
          result: 'FAILURE',
          metadata: {
            error: error instanceof Error ? error.message : 'Unknown error',
          },
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        }).catch(() => {
          // Swallow audit logging errors to not mask original error
        });
      }
      next(error);
    } finally {
      await knexDb.destroy();
    }
  });

  // POST /visits/:visitId/notes/:noteId/quality-score
  // Score documentation quality for a visit note
  router.post('/:visitId/notes/:noteId/quality-score', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    const knexDbForQuality = getKnexInstance();
    try {
      const { noteId } = req.params;

      if (noteId === undefined || noteId === '') {
        res.status(400).json({ success: false, error: 'Note ID is required' });
        return;
      }

      const qualityService = new DocumentationQualityService(knexDbForQuality);
      const result = await qualityService.scoreDocumentationQuality({ noteId });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    } finally {
      await knexDbForQuality.destroy();
    }
  });

  // POST /visits/hospitalization-risk
  // Predict hospitalization risk for a client
  router.post('/hospitalization-risk', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    const knexDbForRisk = getKnexInstance();
    try {
      const { clientId, lookbackDays } = req.body as { clientId?: string; lookbackDays?: number };

      if (clientId === undefined || clientId === '') {
        res.status(400).json({ success: false, error: 'Client ID is required' });
        return;
      }

      const riskService = new HospitalizationRiskService(knexDbForRisk);
      const result = await riskService.predictHospitalizationRisk({
        clientId,
        lookbackDays: lookbackDays ?? 30,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    } finally {
      await knexDbForRisk.destroy();
    }
  });

  // POST /visits/vitals-anomalies
  // Detect anomalies in vital signs patterns
  router.post('/vitals-anomalies', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    const knexDbForVitals = getKnexInstance();
    try {
      const { clientId, lookbackDays } = req.body as { clientId?: string; lookbackDays?: number };

      if (clientId === undefined || clientId === '') {
        res.status(400).json({ success: false, error: 'Client ID is required' });
        return;
      }

      const vitalsService = new VitalsAnomalyService(knexDbForVitals);
      const result = await vitalsService.detectVitalsAnomalies({
        clientId,
        lookbackDays: lookbackDays ?? 30,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    } finally {
      await knexDbForVitals.destroy();
    }
  });

  // POST /visits/sentiment-analysis
  // Analyze sentiment in visit notes to detect burnout, distress, concerns
  router.post('/sentiment-analysis', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    const knexDbForSentiment = getKnexInstance();
    try {
      const { clientId, caregiverId, lookbackDays } = req.body as { clientId?: string; caregiverId?: string; lookbackDays?: number };

      if ((clientId === undefined || clientId === '') && (caregiverId === undefined || caregiverId === '')) {
        res.status(400).json({ success: false, error: 'Either clientId or caregiverId is required' });
        return;
      }

      const sentimentService = new SentimentAnalysisService(knexDbForSentiment);
      const result = await sentimentService.analyzeSentiment({
        clientId,
        caregiverId,
        lookbackDays: lookbackDays ?? 30,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    } finally {
      await knexDbForSentiment.destroy();
    }
  });

  // POST /visits/predict-duration
  // Predict visit duration based on client needs and history
  router.post('/predict-duration', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    const knexDbForDuration = getKnexInstance();
    try {
      const { clientId, visitType, caregiverId, scheduledDate, tasksPlanned } = req.body as {
        clientId?: string;
        visitType?: string;
        caregiverId?: string;
        scheduledDate?: string;
        tasksPlanned?: string[];
      };

      if (clientId === undefined || clientId === '') {
        res.status(400).json({ success: false, error: 'Client ID is required' });
        return;
      }

      if (visitType === undefined || visitType === '') {
        res.status(400).json({ success: false, error: 'Visit type is required' });
        return;
      }

      const durationService = new VisitDurationPredictionService(knexDbForDuration);
      const result = await durationService.predictDuration({
        clientId,
        visitType,
        caregiverId,
        scheduledDate,
        tasksPlanned,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    } finally {
      await knexDbForDuration.destroy();
    }
  });

  return router;
}
