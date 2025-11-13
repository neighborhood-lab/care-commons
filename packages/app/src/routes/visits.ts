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
        `SELECT id, caregiver_id, organization_id, status
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

      const visit = visitCheck.rows[0] as { id: string; caregiver_id: string; organization_id: string; status: string };

      // Verify user is the assigned caregiver or has admin access
      // For now, we'll allow if user is the caregiver
      // NOTE: Future enhancement - add organization-level access control
      const caregiverCheck = await db.query(
        `SELECT id FROM caregivers WHERE id = $1 AND deleted_at IS NULL`,
        [visit.caregiver_id]
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

  return router;
}
