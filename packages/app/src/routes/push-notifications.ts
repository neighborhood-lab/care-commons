/**
 * Push Notifications API Routes
 * 
 * Endpoints for managing push notification tokens and sending push notifications.
 */

import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { getDatabase } from '@care-commons/core';

const router = Router();

// Validation schemas
const RegisterTokenSchema = z.object({
  deviceToken: z.string().min(1, 'Device token is required'),
  deviceType: z.enum(['ios', 'android']),
  deviceName: z.string().optional(),
});

const UnregisterTokenSchema = z.object({
  deviceToken: z.string().min(1, 'Device token is required'),
});

/**
 * POST /api/push/register
 * Register a device token for push notifications
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { deviceToken, deviceType, deviceName } = RegisterTokenSchema.parse(req.body);

    // Get authenticated user ID from session/token
    const userId = req.userContext?.userId;
    
    if (userId === undefined || userId.length === 0) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const db = getDatabase();

    // Check if token already exists
    const existing = await db.query(
      'SELECT id, is_active FROM push_tokens WHERE device_token = $1',
      [deviceToken]
    );

    if (existing.rows.length > 0) {
      // Reactivate if inactive, update user_id if changed
      await db.query(
        `UPDATE push_tokens 
         SET user_id = $1, is_active = true, last_used_at = NOW(), updated_at = NOW()
         WHERE device_token = $2`,
        [userId, deviceToken]
      );

      const firstRow = existing.rows[0];
      res.json({
        success: true,
        message: 'Device token updated',
        tokenId: firstRow?.['id'] as string,
      });
      return;
    }

    // Insert new token
    const result = await db.query(
      `INSERT INTO push_tokens (user_id, device_token, device_type, device_name, is_active, last_used_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, true, NOW(), NOW(), NOW())
       RETURNING id`,
      [userId, deviceToken, deviceType, deviceName ?? null]
    );

    const firstRow = result.rows[0];
    res.status(201).json({
      success: true,
      message: 'Device token registered',
      tokenId: firstRow?.['id'] as string,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation error',
        details: error.issues,
      });
      return;
    }

    console.error('[Push] Registration error:', error);
    res.status(500).json({
      error: 'Failed to register device token',
    });
  }
});

/**
 * POST /api/push/unregister
 * Unregister a device token (deactivate)
 */
router.post('/unregister', async (req: Request, res: Response): Promise<void> => {
  try {
    const { deviceToken } = UnregisterTokenSchema.parse(req.body);

    const userId = req.userContext?.userId;
    
    if (userId === undefined || userId === '') {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const db = getDatabase();

    // Deactivate token (don't delete for audit trail)
    await db.query(
      `UPDATE push_tokens 
       SET is_active = false, updated_at = NOW()
       WHERE device_token = $1 AND user_id = $2`,
      [deviceToken, userId]
    );

    res.json({
      success: true,
      message: 'Device token unregistered',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation error',
        details: error.issues,
      });
      return;
    }

    console.error('[Push] Unregistration error:', error);
    res.status(500).json({
      error: 'Failed to unregister device token',
    });
  }
});

/**
 * GET /api/push/tokens
 * Get active push tokens for current user
 */
router.get('/tokens', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userContext?.userId;
    
    if (userId === undefined || userId === '') {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const db = getDatabase();

    const result = await db.query(
      `SELECT id, device_type, device_name, last_used_at, created_at
       FROM push_tokens
       WHERE user_id = $1 AND is_active = true
       ORDER BY last_used_at DESC`,
      [userId]
    );

    res.json({
      tokens: result.rows,
    });
  } catch (error) {
    console.error('[Push] Get tokens error:', error);
    res.status(500).json({
      error: 'Failed to get device tokens',
    });
  }
});

export default router;
