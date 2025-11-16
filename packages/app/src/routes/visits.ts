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

  /**
   * GET /api/visits/:id/notes
   * Get all notes for a visit
   * 
   * Query params:
   * - includeDeleted: boolean (default: false)
   * 
   * Returns: Array of notes
   */
  router.get('/:id/notes', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id: visitId } = req.params;
      const includeDeleted = req.query['includeDeleted'] === 'true';

      // Verify visit exists
      const visitCheck = await db.query(
        `SELECT id, organization_id FROM visits WHERE id = $1 AND deleted_at IS NULL`,
        [visitId]
      );

      if (visitCheck.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'Visit not found',
        });
        return;
      }

      // Fetch notes
      const query = includeDeleted
        ? `SELECT vn.*,
                  c.first_name as caregiver_first_name,
                  c.last_name as caregiver_last_name,
                  u.email as created_by_email
           FROM visit_notes vn
           LEFT JOIN caregivers c ON vn.caregiver_id = c.id
           LEFT JOIN users u ON vn.created_by = u.id
           WHERE vn.visit_id = $1
           ORDER BY vn.created_at DESC`
        : `SELECT vn.*,
                  c.first_name as caregiver_first_name,
                  c.last_name as caregiver_last_name,
                  u.email as created_by_email
           FROM visit_notes vn
           LEFT JOIN caregivers c ON vn.caregiver_id = c.id
           LEFT JOIN users u ON vn.created_by = u.id
           WHERE vn.visit_id = $1 AND vn.deleted_at IS NULL
           ORDER BY vn.created_at DESC`;

      const result = await db.query(query, [visitId]);

      res.json({
        success: true,
        data: result.rows,
        meta: {
          count: result.rows.length,
          hasIncidents: result.rows.some((note: Record<string, unknown>) => (note.is_incident as boolean) === true),
        },
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * PUT /api/visits/:id/notes/:noteId
   * Update a visit note (only if not locked)
   * 
   * Body: Same as POST (partial updates allowed)
   * 
   * Returns: Updated note
   */
  router.put('/:id/notes/:noteId', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const context = req.userContext!;
      const { id: visitId, noteId } = req.params;

      // Check if note exists and is not locked
      const noteCheck = await db.query(
        `SELECT id, visit_id, is_locked, locked_at, caregiver_id
         FROM visit_notes
         WHERE id = $1 AND visit_id = $2 AND deleted_at IS NULL`,
        [noteId, visitId]
      );

      if (noteCheck.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'Note not found',
        });
        return;
      }

      const note = noteCheck.rows[0] as { id: string; visit_id: string; is_locked: boolean; locked_at: Date | null; caregiver_id: string };

      if (note.is_locked) {
        res.status(403).json({
          success: false,
          error: `Note is locked and cannot be modified. Locked at: ${note.locked_at !== null ? note.locked_at.toISOString() : 'unknown'}`,
        });
        return;
      }

      // Build update query dynamically based on provided fields
      const updates: string[] = [];
      const values: unknown[] = [];
      let paramIndex = 1;

      const {
        noteType,
        noteText,
        noteHtml,
        activitiesPerformed,
        clientMood,
        clientConditionNotes,
        isIncident,
        incidentSeverity,
        incidentDescription,
      } = req.body;

      if (noteType !== undefined) {
        updates.push(`note_type = $${paramIndex++}`);
        values.push(noteType);
      }
      if (noteText !== undefined) {
        updates.push(`note_text = $${paramIndex++}`);
        values.push(noteText.trim());
      }
      if (noteHtml !== undefined) {
        updates.push(`note_html = $${paramIndex++}`);
        values.push(noteHtml);
      }
      if (activitiesPerformed !== undefined) {
        updates.push(`activities_performed = $${paramIndex++}::jsonb`);
        values.push(JSON.stringify(activitiesPerformed));
      }
      if (clientMood !== undefined) {
        updates.push(`client_mood = $${paramIndex++}`);
        values.push(clientMood);
      }
      if (clientConditionNotes !== undefined) {
        updates.push(`client_condition_notes = $${paramIndex++}`);
        values.push(clientConditionNotes);
      }
      if (isIncident !== undefined) {
        updates.push(`is_incident = $${paramIndex++}`);
        values.push(isIncident);
      }
      if (incidentSeverity !== undefined) {
        updates.push(`incident_severity = $${paramIndex++}`);
        values.push(incidentSeverity);
      }
      if (incidentDescription !== undefined) {
        updates.push(`incident_description = $${paramIndex++}`);
        values.push(incidentDescription);
      }

      if (updates.length === 0) {
        res.status(400).json({
          success: false,
          error: 'No fields to update',
        });
        return;
      }

      // Add updated_by
      updates.push(`updated_by = $${paramIndex++}`);
      values.push(context.userId);

      // Add WHERE clause params
      values.push(noteId);

      const result = await db.query(
        `UPDATE visit_notes
         SET ${updates.join(', ')}
         WHERE id = $${paramIndex}
         RETURNING *`,
        values
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
   * DELETE /api/visits/:id/notes/:noteId
   * Soft delete a visit note
   * 
   * Returns: Success message
   */
  router.delete('/:id/notes/:noteId', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const context = req.userContext!;
      const { id: visitId, noteId } = req.params;

      // Check if note exists
      const noteCheck = await db.query(
        `SELECT id, is_locked FROM visit_notes
         WHERE id = $1 AND visit_id = $2 AND deleted_at IS NULL`,
        [noteId, visitId]
      );

      if (noteCheck.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'Note not found',
        });
        return;
      }

      const note = noteCheck.rows[0] as { id: string; is_locked: boolean };

      if (note.is_locked) {
        res.status(403).json({
          success: false,
          error: 'Cannot delete a locked note',
        });
        return;
      }

      // Soft delete
      await db.query(
        `UPDATE visit_notes
         SET deleted_at = NOW(), deleted_by = $1
         WHERE id = $2`,
        [context.userId, noteId]
      );

      res.json({
        success: true,
        message: 'Note deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/visits/calendar
   * Get all visits within a date range for calendar view
   * Requires coordinator or admin role
   *
   * Query params:
   * - start_date: Start date (YYYY-MM-DD format)
   * - end_date: End date (YYYY-MM-DD format)
   * - branch_ids: Optional comma-separated branch IDs to filter
   *
   * Returns: Array of visits with client and caregiver information
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
      if (!isValidUUID(organizationId)) {
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
      if (!isValidUUID(organizationId)) {
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
      if (!isValidUUID(organizationId)) {
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
      if (!isValidUUID(organizationId)) {
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
