/**
 * Mobile API Routes
 * 
 * Provides mobile-optimized endpoints for caregiver mobile app
 */

import { Router, type Request, type Response } from 'express';
import { Database, AuthMiddleware } from '@care-commons/core';

export function createMobileRouter(db: Database): Router {
  const router = Router();
  const authMiddleware = new AuthMiddleware(db);

  // All mobile routes require authentication
  router.use(authMiddleware.requireAuth);

  router.get('/mobile/caregiver/today', async (req: Request, res: Response): Promise<void> => {
    try {
      if (req.userContext === undefined) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }
      
      const userId = req.userContext.userId;
      const today = new Date().toISOString().split('T')[0];

      const result = await db.query(
        `SELECT v.id, v.visit_number, v.status, v.scheduled_start, v.scheduled_end,
                v.actual_start, v.actual_end, c.id as client_id,
                c.first_name as client_first_name, c.last_name as client_last_name,
                c.primary_address as client_address,
                COUNT(t.id) as total_tasks,
                COUNT(t.id) FILTER (WHERE t.completed = true) as completed_tasks
         FROM visits v
         INNER JOIN clients c ON v.client_id = c.id
         LEFT JOIN tasks t ON v.id = t.visit_id
         WHERE v.caregiver_id = $1 AND DATE(v.scheduled_start) = $2 AND v.deleted_at IS NULL
         GROUP BY v.id, c.id
         ORDER BY v.scheduled_start`,
        [userId, today]
      );

      const visits = result.rows;
      res.json({
        success: true,
        data: {
          visits,
          summary: {
            total: visits.length,
            completed: visits.filter((v) => v.status === 'COMPLETED').length,
            inProgress: visits.filter((v) => v.status === 'IN_PROGRESS').length,
            upcoming: visits.filter((v) => v.status === 'CONFIRMED').length,
          },
          serverTime: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('Error fetching today\'s visits:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch today\'s visits' });
    }
  });

  router.get('/mobile/visits/:id', async (req: Request, res: Response): Promise<void> => {
    try {
      if (req.userContext === undefined) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }
      
      const userId = req.userContext.userId;
      const { id } = req.params;

      const result = await db.query(
        `SELECT v.*, c.id as client_id, c.first_name as client_first_name,
                c.last_name as client_last_name, c.primary_address as client_address,
                c.primary_phone as client_phone
         FROM visits v
         INNER JOIN clients c ON v.client_id = c.id
         WHERE v.id = $1 AND v.caregiver_id = $2 AND v.deleted_at IS NULL`,
        [id, userId]
      );

      if (result.rows.length === 0) {
        res.status(404).json({ success: false, error: 'Visit not found' });
        return;
      }

      res.json({ success: true, data: result.rows[0] });
    } catch (error) {
      console.error('Error fetching visit:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch visit details' });
    }
  });

  router.post('/mobile/visits/:id/start', async (req: Request, res: Response): Promise<void> => {
    try {
      if (req.userContext === undefined) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }
      
      const userId = req.userContext.userId;
      const { id } = req.params;
      const { location, deviceInfo } = req.body;

      if (location === undefined || location === null || deviceInfo === undefined || deviceInfo === null) {
        res.status(400).json({ success: false, error: 'Location and device info required' });
        return;
      }

      const visitCheck = await db.query(
        'SELECT id, status FROM visits WHERE id = $1 AND caregiver_id = $2 AND v.deleted_at IS NULL',
        [id, userId]
      );

      if (visitCheck.rows.length === 0) {
        res.status(404).json({ success: false, error: 'Visit not found' });
        return;
      }

      const visit = visitCheck.rows[0];
      if (visit?.status === 'IN_PROGRESS') {
        res.status(400).json({ success: false, error: 'Visit already in progress' });
        return;
      }

      await db.query('BEGIN');
      try {
        await db.query(
          `UPDATE visits SET status = 'IN_PROGRESS', actual_start = NOW(), updated_at = NOW() WHERE id = $1`,
          [id]
        );

        const deviceId = (deviceInfo.deviceId !== undefined && deviceInfo.deviceId !== null && deviceInfo.deviceId !== '') 
          ? deviceInfo.deviceId 
          : 'unknown';

        const timeEntryResult = await db.query(
          `INSERT INTO time_entries (
            id, visit_id, organization_id, caregiver_id, client_id,
            entry_type, entry_timestamp, location, device_id, device_info,
            integrity_hash, sync_metadata, offline_recorded, verification_passed,
            created_by, updated_by
          )
          SELECT gen_random_uuid(), $1, v.organization_id, v.caregiver_id, v.client_id,
                 'CLOCK_IN', NOW(), $2::jsonb, $3, $4::jsonb,
                 encode(digest($5, 'sha256'), 'hex'), 
                 jsonb_build_object('synced', true, 'syncedAt', NOW()),
                 false, true, $6, $6
          FROM visits v WHERE v.id = $1
          RETURNING id`,
          [id, JSON.stringify(location), deviceId, JSON.stringify(deviceInfo), `${id}-${userId}-${Date.now()}`, userId]
        );

        await db.query('COMMIT');
        res.json({
          success: true,
          data: { visitId: id, timeEntryId: timeEntryResult.rows[0]?.id, startedAt: new Date().toISOString() },
        });
      } catch (error) {
        await db.query('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error('Error starting visit:', error);
      res.status(500).json({ success: false, error: 'Failed to start visit' });
    }
  });

  router.post('/mobile/visits/:id/end', async (req: Request, res: Response): Promise<void> => {
    try {
      if (req.userContext === undefined) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }
      
      const userId = req.userContext.userId;
      const { id } = req.params;
      const { location, deviceInfo, notes } = req.body;

      if (location === undefined || location === null || deviceInfo === undefined || deviceInfo === null) {
        res.status(400).json({ success: false, error: 'Location and device info required' });
        return;
      }

      const visitCheck = await db.query(
        'SELECT id, status FROM visits WHERE id = $1 AND caregiver_id = $2 AND deleted_at IS NULL',
        [id, userId]
      );

      if (visitCheck.rows.length === 0) {
        res.status(404).json({ success: false, error: 'Visit not found' });
        return;
      }

      const visit = visitCheck.rows[0];
      if (visit !== undefined && visit.status !== 'IN_PROGRESS') {
        res.status(400).json({ success: false, error: 'Visit is not in progress' });
        return;
      }

      await db.query('BEGIN');
      try {
        await db.query(
          `UPDATE visits SET status = 'COMPLETED', actual_end = NOW(), notes = $2, updated_at = NOW() WHERE id = $1`,
          [id, notes]
        );

        const deviceId = (deviceInfo.deviceId !== undefined && deviceInfo.deviceId !== null && deviceInfo.deviceId !== '') 
          ? deviceInfo.deviceId 
          : 'unknown';

        const timeEntryResult = await db.query(
          `INSERT INTO time_entries (
            id, visit_id, organization_id, caregiver_id, client_id,
            entry_type, entry_timestamp, location, device_id, device_info,
            integrity_hash, sync_metadata, offline_recorded, verification_passed,
            created_by, updated_by
          )
          SELECT gen_random_uuid(), $1, v.organization_id, v.caregiver_id, v.client_id,
                 'CLOCK_OUT', NOW(), $2::jsonb, $3, $4::jsonb,
                 encode(digest($5, 'sha256'), 'hex'),
                 jsonb_build_object('synced', true, 'syncedAt', NOW()),
                 false, true, $6, $6
          FROM visits v WHERE v.id = $1
          RETURNING id`,
          [id, JSON.stringify(location), deviceId, JSON.stringify(deviceInfo), `${id}-${userId}-${Date.now()}`, userId]
        );

        await db.query('COMMIT');
        res.json({
          success: true,
          data: { visitId: id, timeEntryId: timeEntryResult.rows[0]?.id, endedAt: new Date().toISOString() },
        });
      } catch (error) {
        await db.query('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error('Error ending visit:', error);
      res.status(500).json({ success: false, error: 'Failed to end visit' });
    }
  });

  router.get('/mobile/visits/:id/tasks', async (req: Request, res: Response): Promise<void> => {
    try {
      if (req.userContext === undefined) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }
      
      const userId = req.userContext.userId;
      const { id } = req.params;

      const result = await db.query(
        `SELECT t.* FROM tasks t
         INNER JOIN visits v ON t.visit_id = v.id
         WHERE t.visit_id = $1 AND v.caregiver_id = $2 AND v.deleted_at IS NULL
         ORDER BY t.sequence_order, t.created_at`,
        [id, userId]
      );

      res.json({ success: true, data: result.rows });
    } catch (error) {
      console.error('Error fetching tasks:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch tasks' });
    }
  });

  router.post('/mobile/tasks/:id/complete', async (req: Request, res: Response): Promise<void> => {
    try {
      if (req.userContext === undefined) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }
      
      const userId = req.userContext.userId;
      const { id } = req.params;
      const { notes, completedValue } = req.body;

      const result = await db.query(
        `UPDATE tasks t
         SET completed = true, completed_at = NOW(), completed_by = $2,
             notes = $3, actual_value = $4, updated_at = NOW(), updated_by = $2
         FROM visits v
         WHERE t.id = $1 AND t.visit_id = v.id AND v.caregiver_id = $2 AND v.deleted_at IS NULL
         RETURNING t.*`,
        [id, userId, notes, completedValue]
      );

      if (result.rows.length === 0) {
        res.status(404).json({ success: false, error: 'Task not found' });
        return;
      }

      res.json({ success: true, data: result.rows[0] });
    } catch (error) {
      console.error('Error completing task:', error);
      res.status(500).json({ success: false, error: 'Failed to complete task' });
    }
  });

  router.post('/mobile/device/register', async (req: Request, res: Response): Promise<void> => {
    try {
      if (req.userContext === undefined) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }
      
      const userId = req.userContext.userId;
      const organizationId = req.userContext.organizationId;
      const { deviceId, deviceName, deviceType, osVersion, appVersion, manufacturer, model, pushToken, pushProvider } = req.body;

      if (deviceId === undefined || deviceId === '' || 
          deviceType === undefined || deviceType === '' || 
          appVersion === undefined || appVersion === '') {
        res.status(400).json({ success: false, error: 'deviceId, deviceType, and appVersion required' });
        return;
      }

      const result = await db.query(
        `INSERT INTO mobile_devices (
          id, user_id, organization_id, device_id, device_name, device_type, os_version, app_version,
          manufacturer, model, push_token, push_provider, push_enabled, push_token_updated_at,
          status, registered_at, last_seen_at, created_by, updated_by
        )
        VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(),
          'ACTIVE', NOW(), NOW(), $1, $1
        )
        ON CONFLICT (device_id) DO UPDATE SET
          user_id = $1, device_name = $4, os_version = $6, app_version = $7, manufacturer = $8, model = $9,
          push_token = $10, push_provider = $11, push_token_updated_at = NOW(), last_seen_at = NOW(),
          updated_at = NOW(), updated_by = $1
        RETURNING id, device_id`,
        [
          userId, organizationId, deviceId, deviceName, deviceType, osVersion, appVersion,
          manufacturer, model, pushToken, pushProvider, pushToken !== undefined
        ]
      );

      res.json({ success: true, data: result.rows[0] });
    } catch (error) {
      console.error('Error registering device:', error);
      res.status(500).json({ success: false, error: 'Failed to register device' });
    }
  });

  return router;
}
