/**
 * ONE-TIME seed endpoint to create admin user in production
 * 
 * DELETE THIS FILE AFTER USING!
 * 
 * Hit this endpoint once to create the admin user, then remove this file
 * and redeploy to prevent unauthorized access.
 */

import { Router } from 'express';
import { Database, PasswordUtils } from '@care-commons/core';
import { v4 as uuidv4 } from 'uuid';

export function createSeedAdminRouter(db: Database): Router {
  const router = Router();

  // ONE-TIME endpoint to create admin user
  // DELETE THIS AFTER USING!
  router.post('/api/seed-admin-one-time', async (_req, res) => {
    try {
      // Check if admin already exists
      const existingUser = await db.query(
        'SELECT id FROM users WHERE email = $1',
        ['admin@carecommons.example']
      );

      if (existingUser.rows.length > 0) {
        return res.status(400).json({ 
          error: 'Admin user already exists' 
        });
      }

      // Create organization first
      const orgId = uuidv4();
      await db.query(
        `INSERT INTO organizations (id, name, code, status, created_at, updated_at)
         VALUES ($1, $2, $3, 'ACTIVE', NOW(), NOW())`,
        [orgId, 'Care Commons', 'CARE001']
      );

      // Create admin user
      const userId = uuidv4();
      const passwordHash = PasswordUtils.hashPassword('Admin123!');

      await db.query(
        `INSERT INTO users (
          id, organization_id, email, username, password_hash, 
          first_name, last_name, roles, permissions, status,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8::text[], $9::text[], 'ACTIVE',
          NOW(), NOW()
        )`,
        [
          userId,
          orgId,
          'admin@carecommons.example',
          'admin',
          passwordHash,
          'System',
          'Administrator',
          ['SUPER_ADMIN'],
          [
            'organizations:*',
            'users:*',
            'clients:*',
            'caregivers:*',
            'visits:*',
            'schedules:*',
            'care-plans:*',
            'billing:*',
            'reports:*',
            'settings:*'
          ]
        ]
      );

      console.log('✅ Admin user created successfully');
      
      return res.json({ 
        success: true,
        message: 'Admin user created. DELETE THE SEED ENDPOINT FILE NOW!' 
      });
    } catch (error) {
      console.error('Error creating admin user:', error);
      return res.status(500).json({ 
        error: 'Failed to create admin user',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  return router;
}