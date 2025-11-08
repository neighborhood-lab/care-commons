/**
 * Sync API Routes
 * 
 * Provides offline sync capabilities for mobile devices
 */

import { Router, type Request, type Response } from 'express';
import { Database, AuthMiddleware } from '@care-commons/core';

export function createSyncRouter(db: Database): Router {
  const router = Router();
  const authMiddleware = new AuthMiddleware(db);

  // All sync routes require authentication
  router.use(authMiddleware.requireAuth);

  router.get('/sync/changes', async (req: Request, res: Response): Promise<void> => {
    try {
      if (req.userContext === undefined) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }
      
      const userId = req.userContext.userId;
      const { lastPulledAt } = req.query;

      if (typeof lastPulledAt !== 'string') {
        res.status(400).json({ success: false, error: 'lastPulledAt timestamp required' });
        return;
      }

      const timestamp = new Date(parseInt(lastPulledAt, 10));

      const [visits, tasks, clients] = await Promise.all([
        db.query(
          `SELECT * FROM visits WHERE caregiver_id = $1 AND updated_at > $2 ORDER BY updated_at`,
          [userId, timestamp]
        ),
        db.query(
          `SELECT t.* FROM tasks t
           INNER JOIN visits v ON t.visit_id = v.id
           WHERE v.caregiver_id = $1 AND t.updated_at > $2
           ORDER BY t.updated_at`,
          [userId, timestamp]
        ),
        db.query(
          `SELECT DISTINCT c.* FROM clients c
           INNER JOIN visits v ON c.id = v.client_id
           WHERE v.caregiver_id = $1 AND c.updated_at > $2
           ORDER BY c.updated_at`,
          [userId, timestamp]
        ),
      ]);

      res.json({
        success: true,
        data: {
          changes: { visits: visits.rows, tasks: tasks.rows, clients: clients.rows },
          timestamp: Date.now(),
          hasMore: false,
        },
      });
    } catch (error) {
      console.error('Error fetching sync changes:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch sync changes' });
    }
  });

  router.post('/sync/push', async (req: Request, res: Response): Promise<void> => {
    try {
      if (req.userContext === undefined) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }
      
      const userId = req.userContext.userId;
      const organizationId = req.userContext.organizationId;
      const { changes, deviceId } = req.body;

      if (changes === undefined || changes === null || !Array.isArray(changes)) {
        res.status(400).json({ success: false, error: 'changes array required' });
        return;
      }

      const results: Array<{ success: boolean; entityType: string; entityId: string; error?: string }> = [];

      await db.query('BEGIN');
      try {
        for (const change of changes) {
          const { entityType, entityId, operation, data, clientTimestamp } = change;

          try {
            await db.query(
              `INSERT INTO sync_metadata (
                id, device_id, user_id, organization_id, entity_type, entity_id, operation,
                client_timestamp, change_data, sync_status, created_by, updated_by
              )
              VALUES (
                gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8::jsonb, 'SYNCED', $2, $2
              )`,
              [deviceId, userId, organizationId, entityType, entityId, operation, new Date(clientTimestamp), JSON.stringify(data)]
            );

            if (operation === 'UPDATE' && entityType === 'TASK') {
              await db.query(
                `UPDATE tasks 
                 SET completed = $2, completed_at = $3, notes = $4, updated_at = NOW(), updated_by = $5
                 WHERE id = $1`,
                [entityId, data.completed, data.completedAt, data.notes, userId]
              );
            } else if (operation === 'UPDATE' && entityType === 'VISIT') {
              await db.query(
                `UPDATE visits
                 SET status = $2, actual_start = $3, actual_end = $4, notes = $5, updated_at = NOW()
                 WHERE id = $1`,
                [entityId, data.status, data.actualStart, data.actualEnd, data.notes]
              );
            }

            results.push({ success: true, entityType, entityId });
          } catch (error) {
            console.error(`Error syncing ${entityType} ${entityId}:`, error);
            results.push({
              success: false,
              entityType,
              entityId,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }

        await db.query('COMMIT');
        res.json({
          success: true,
          data: {
            results,
            syncedCount: results.filter((r) => r.success).length,
            failedCount: results.filter((r) => !r.success).length,
            timestamp: Date.now(),
          },
        });
      } catch (error) {
        await db.query('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error('Error pushing sync changes:', error);
      res.status(500).json({ success: false, error: 'Failed to push sync changes' });
    }
  });

  router.get('/sync/status/:deviceId', async (req: Request, res: Response): Promise<void> => {
    try {
      if (req.userContext === undefined) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }
      
      const userId = req.userContext.userId;
      const { deviceId } = req.params;

      const result = await db.query(
        `SELECT 
          COUNT(*) as total_syncs,
          COUNT(*) FILTER (WHERE sync_status = 'SYNCED') as successful_syncs,
          COUNT(*) FILTER (WHERE sync_status = 'CONFLICT') as conflicts,
          COUNT(*) FILTER (WHERE sync_status = 'ERROR') as errors,
          MAX(server_timestamp) as last_sync_time
        FROM sync_metadata
        WHERE device_id = $1 AND user_id = $2`,
        [deviceId, userId]
      );

      const deviceResult = await db.query(
        `SELECT last_sync_at, last_seen_at, status
         FROM mobile_devices
         WHERE device_id = $1 AND user_id = $2`,
        [deviceId, userId]
      );

      if (deviceResult.rows.length === 0) {
        res.status(404).json({ success: false, error: 'Device not found' });
        return;
      }

      res.json({
        success: true,
        data: {
          syncStats: result.rows[0],
          device: deviceResult.rows[0],
        },
      });
    } catch (error) {
      console.error('Error fetching sync status:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch sync status' });
    }
  });

  router.post('/sync/heartbeat', async (req: Request, res: Response): Promise<void> => {
    try {
      if (req.userContext === undefined) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }
      
      const userId = req.userContext.userId;
      const { deviceId } = req.body;

      if (deviceId === undefined || deviceId === null) {
        res.status(400).json({ success: false, error: 'deviceId required' });
        return;
      }

      await db.query(
        `UPDATE mobile_devices
         SET last_seen_at = NOW(), updated_at = NOW()
         WHERE device_id = $1 AND user_id = $2`,
        [deviceId, userId]
      );

      res.json({ success: true, data: { timestamp: Date.now() } });
    } catch (error) {
      console.error('Error updating heartbeat:', error);
      res.status(500).json({ success: false, error: 'Failed to update heartbeat' });
    }
  });

  return router;
}
