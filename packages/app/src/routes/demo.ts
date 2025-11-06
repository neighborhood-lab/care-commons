/**
 * Demo API Routes
 * 
 * Write-enabled demo endpoints for interactive demonstrations.
 * All modifications are session-scoped and isolated per user.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { Database, getDemoSessionManager, DemoSnapshot, DemoPersonaType } from '@care-commons/core';

interface TypedRequest<T = Record<string, never>> extends Request {
  body: T;
}

export function createDemoRouter(db: Database): Router {
  const router = Router();
  const sessionManager = getDemoSessionManager();

  // ============================================================================
  // SESSION MANAGEMENT
  // ============================================================================

  /**
   * POST /api/demo/sessions
   * Create a new demo session
   */
  router.post('/sessions', async (req: TypedRequest<{ userId?: string; personaType?: DemoPersonaType }>, res: Response, next: NextFunction) => {
    try {
      const { userId, personaType } = req.body;
      const effectiveUserId = userId ?? `demo-user-${Date.now()}`;

      const snapshot = await getDemoSnapshot(db);
      const session = await sessionManager.createSession(effectiveUserId, snapshot, {
        initialPersonaType: personaType,
        ttl: 4 * 60 * 60 * 1000
      });

      res.status(201).json({
        success: true,
        data: {
          sessionId: session.id,
          currentPersona: session.currentPersona,
          availablePersonas: session.availablePersonas.map((p) => ({
            id: p.id,
            type: p.type,
            name: p.name,
            role: p.role
          })),
          expiresAt: session.expiresAt
        }
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/demo/sessions/:sessionId
   * Get current session state
   */
  router.get('/sessions/:sessionId', (req: Request, res: Response, next: NextFunction) => {
    try {
      const sessionId = String(req.params.sessionId);
      
      // Validate sessionId (frontend sometimes sends 'undefined' string)
      if (sessionId.length === 0 || sessionId === 'undefined') {
        res.status(400).json({
          success: false,
          error: 'Invalid session ID'
        });
        return;
      }
      
      const session = sessionManager.getSession(sessionId);

      res.json({
        success: true,
        data: {
          sessionId: session.id,
          currentPersona: session.currentPersona,
          state: {
            currentTime: session.state.currentTime,
            eventCount: session.state.events.length
          }
        }
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/demo/sessions/:sessionId/persona
   * Switch persona
   */
  router.post('/sessions/:sessionId/persona', (req: TypedRequest<{ personaType: DemoPersonaType }>, res: Response, next: NextFunction) => {
    try {
      const sessionId = String(req.params.sessionId);
      const { personaType } = req.body;
      const session = sessionManager.switchPersona(sessionId, personaType);

      res.json({
        success: true,
        data: { currentPersona: session.currentPersona }
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/demo/sessions/:sessionId/reset
   * Reset session
   */
  router.post('/sessions/:sessionId/reset', (req: Request, res: Response, next: NextFunction) => {
    try {
      const sessionId = String(req.params.sessionId);
      sessionManager.resetSession(sessionId);

      res.json({
        success: true,
        data: { message: 'Session reset to base state' }
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * DELETE /api/demo/sessions/:sessionId
   * Delete session
   */
  router.delete('/sessions/:sessionId', (req: Request, res: Response, next: NextFunction) => {
    try {
      const sessionId = String(req.params.sessionId);
      
      // Gracefully handle invalid session IDs (frontend sometimes sends 'undefined')
      if (sessionId.length === 0 || sessionId === 'undefined') {
        res.json({
          success: true,
          data: { message: 'No session to delete' }
        });
        return;
      }
      
      sessionManager.deleteSession(sessionId);

      res.json({
        success: true,
        data: { message: 'Session deleted' }
      });
    } catch (error) {
      next(error);
    }
  });

  // ============================================================================
  // CAREGIVER ACTIONS
  // ============================================================================

  /**
   * POST /api/demo/sessions/:sessionId/visits/:visitId/clock-in
   */
  router.post('/sessions/:sessionId/visits/:visitId/clock-in', (req: TypedRequest<{ location: { latitude: number; longitude: number; accuracy: number } }>, res: Response, next: NextFunction) => {
    try {
      const sessionId = String(req.params.sessionId);
      const visitId = String(req.params.visitId);
      const { location } = req.body;

      const session = sessionManager.addEvent(sessionId, 'VISIT_CLOCK_IN', { visitId, location });

      res.json({
        success: true,
        data: {
          visitId,
          status: 'IN_PROGRESS',
          actualStartTime: session.state.currentTime
        }
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/demo/sessions/:sessionId/visits/:visitId/clock-out
   */
  router.post('/sessions/:sessionId/visits/:visitId/clock-out', (req: Request, res: Response, next: NextFunction) => {
    try {
      const sessionId = String(req.params.sessionId);
      const visitId = String(req.params.visitId);

      const session = sessionManager.addEvent(sessionId, 'VISIT_CLOCK_OUT', { visitId });

      res.json({
        success: true,
        data: {
          visitId,
          status: 'COMPLETED',
          actualEndTime: session.state.currentTime
        }
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/demo/sessions/:sessionId/tasks/:taskId/complete
   */
  router.post('/sessions/:sessionId/tasks/:taskId/complete', (req: Request, res: Response, next: NextFunction) => {
    try {
      const sessionId = String(req.params.sessionId);
      const taskId = String(req.params.taskId);

      const session = sessionManager.addEvent(sessionId, 'TASK_COMPLETE', { taskId });

      res.json({
        success: true,
        data: {
          taskId,
          status: 'COMPLETED',
          completedAt: session.state.currentTime
        }
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/demo/sessions/:sessionId/visits/:visitId/notes
   */
  router.post('/sessions/:sessionId/visits/:visitId/notes', (req: TypedRequest<{ content: string }>, res: Response, next: NextFunction) => {
    try {
      const sessionId = String(req.params.sessionId);
      const visitId = String(req.params.visitId);
      const { content } = req.body;

      const session = sessionManager.addEvent(sessionId, 'NOTE_ADDED', { visitId, content });

      res.json({
        success: true,
        data: {
          visitId,
          note: { content, createdAt: session.state.currentTime }
        }
      });
    } catch (error) {
      next(error);
    }
  });

  // ============================================================================
  // COORDINATOR ACTIONS
  // ============================================================================

  /**
   * POST /api/demo/sessions/:sessionId/visits/:visitId/assign
   */
  router.post('/sessions/:sessionId/visits/:visitId/assign', (req: TypedRequest<{ caregiverId: string }>, res: Response, next: NextFunction) => {
    try {
      const sessionId = String(req.params.sessionId);
      const visitId = String(req.params.visitId);
      const { caregiverId } = req.body;

      sessionManager.addEvent(sessionId, 'VISIT_ASSIGNED', { visitId, caregiverId });

      res.json({
        success: true,
        data: { visitId, caregiverId, status: 'ASSIGNED' }
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/demo/sessions/:sessionId/exceptions/:exceptionId/resolve
   */
  router.post('/sessions/:sessionId/exceptions/:exceptionId/resolve', (req: TypedRequest<{ resolution: string }>, res: Response, next: NextFunction) => {
    try {
      const sessionId = String(req.params.sessionId);
      const exceptionId = String(req.params.exceptionId);
      const { resolution } = req.body;

      const session = sessionManager.addEvent(sessionId, 'EXCEPTION_RESOLVED', { exceptionId, resolution });

      res.json({
        success: true,
        data: {
          exceptionId,
          status: 'RESOLVED',
          resolvedAt: session.state.currentTime
        }
      });
    } catch (error) {
      next(error);
    }
  });

  // ============================================================================
  // UTILITIES
  // ============================================================================

  /**
   * GET /api/demo/stats
   */
  router.get('/stats', (_req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = sessionManager.getStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function getDemoSnapshot(db: Database): Promise<DemoSnapshot> {
  const orgResult = await db.query('SELECT id FROM organizations ORDER BY created_at ASC LIMIT 1');
  const branchResult = await db.query('SELECT id FROM branches ORDER BY created_at ASC LIMIT 1');

  if (orgResult.rows.length === 0 || branchResult.rows.length === 0) {
    throw new Error('Demo data not found. Please run: npm run db:seed:demo-v2');
  }

  const orgId = orgResult.rows[0]?.id as string;
  const branchId = branchResult.rows[0]?.id as string;

  const caregiversResult = await db.query(
    'SELECT id FROM caregivers WHERE organization_id = $1 AND deleted_at IS NULL',
    [orgId]
  );
  const caregiverIds = caregiversResult.rows.map(row => row.id as string);

  const clientsResult = await db.query(
    'SELECT id FROM clients WHERE organization_id = $1 AND deleted_at IS NULL',
    [orgId]
  );
  const clientIds = clientsResult.rows.map(row => row.id as string);

  const caregiverPersonasResult = await db.query(
    `SELECT id, first_name, last_name, email, role
     FROM caregivers
     WHERE organization_id = $1 AND deleted_at IS NULL
     LIMIT 3`,
    [orgId]
  );

  const coordinatorPersonasResult = await db.query(
    `SELECT id, first_name, last_name, email, roles
     FROM users
     WHERE organization_id = $1 AND deleted_at IS NULL
     AND ('FIELD_COORDINATOR' = ANY(roles) OR 'SCHEDULING_COORDINATOR' = ANY(roles))`,
    [orgId]
  );

  // Get admin user to create synthetic personas if needed
  const adminUserResult = await db.query(
    `SELECT id, first_name, last_name, email FROM users WHERE organization_id = $1 AND deleted_at IS NULL LIMIT 1`,
    [orgId]
  );

  let personas: Array<{
    id: string;
    type: DemoPersonaType;
    name: string;
    email: string;
    role: string;
    organizationId: string;
    branchId: string;
    permissions: string[];
  }> = [];

  // If we have real caregiver/coordinator data, use it
  if (caregiverPersonasResult.rows.length > 0 || coordinatorPersonasResult.rows.length > 0) {
    personas = [
      ...caregiverPersonasResult.rows.map(row => ({
        id: row.id as string,
        type: 'CAREGIVER' as DemoPersonaType,
        name: `${row.first_name as string} ${row.last_name as string}`,
        email: row.email as string,
        role: row.role as string,
        organizationId: orgId,
        branchId,
        permissions: ['visits:read', 'visits:update']
      })),
      ...coordinatorPersonasResult.rows.map(row => ({
        id: row.id as string,
        type: 'COORDINATOR_FIELD' as DemoPersonaType,
        name: `${row.first_name as string} ${row.last_name as string}`,
        email: row.email as string,
        role: 'Field Coordinator',
        organizationId: orgId,
        branchId,
        permissions: ['visits:*', 'caregivers:*']
      }))
    ];
  } else if (adminUserResult.rows.length > 0) {
    // Create synthetic personas using admin user as template
    const adminUser = adminUserResult.rows[0] as { id: string; first_name: string; last_name: string; email: string };

    personas = [
      {
        id: `demo-caregiver-1`,
        type: 'CAREGIVER' as DemoPersonaType,
        name: 'Sarah Johnson',
        email: 'sarah.johnson@demo.example',
        role: 'Certified Nursing Assistant',
        organizationId: orgId,
        branchId,
        permissions: ['visits:read', 'visits:update']
      },
      {
        id: `demo-caregiver-2`,
        type: 'CAREGIVER' as DemoPersonaType,
        name: 'Michael Chen',
        email: 'michael.chen@demo.example',
        role: 'Home Health Aide',
        organizationId: orgId,
        branchId,
        permissions: ['visits:read', 'visits:update']
      },
      {
        id: `demo-coordinator-1`,
        type: 'COORDINATOR_FIELD' as DemoPersonaType,
        name: 'Emily Rodriguez',
        email: 'emily.rodriguez@demo.example',
        role: 'Field Coordinator',
        organizationId: orgId,
        branchId,
        permissions: ['visits:*', 'caregivers:*', 'clients:*']
      },
      {
        id: `demo-coordinator-2`,
        type: 'COORDINATOR_SCHEDULING' as DemoPersonaType,
        name: 'David Williams',
        email: 'david.williams@demo.example',
        role: 'Scheduling Coordinator',
        organizationId: orgId,
        branchId,
        permissions: ['visits:*', 'schedule:*']
      },
      {
        id: adminUser.id,
        type: 'ADMINISTRATOR' as DemoPersonaType,
        name: `${adminUser.first_name} ${adminUser.last_name}`,
        email: adminUser.email,
        role: 'Administrator',
        organizationId: orgId,
        branchId,
        permissions: ['*:*']
      }
    ];
  } else {
    // Fallback: Create fully synthetic personas if no users exist
    // This ensures demo mode works even on completely empty databases
    personas = [
      {
        id: `demo-caregiver-1`,
        type: 'CAREGIVER' as DemoPersonaType,
        name: 'Sarah Johnson',
        email: 'sarah.johnson@demo.example',
        role: 'Certified Nursing Assistant',
        organizationId: orgId,
        branchId,
        permissions: ['visits:read', 'visits:update']
      },
      {
        id: `demo-caregiver-2`,
        type: 'CAREGIVER' as DemoPersonaType,
        name: 'Michael Chen',
        email: 'michael.chen@demo.example',
        role: 'Home Health Aide',
        organizationId: orgId,
        branchId,
        permissions: ['visits:read', 'visits:update']
      },
      {
        id: `demo-coordinator-1`,
        type: 'COORDINATOR_FIELD' as DemoPersonaType,
        name: 'Emily Rodriguez',
        email: 'emily.rodriguez@demo.example',
        role: 'Field Coordinator',
        organizationId: orgId,
        branchId,
        permissions: ['visits:*', 'caregivers:*', 'clients:*']
      },
      {
        id: `demo-coordinator-2`,
        type: 'COORDINATOR_SCHEDULING' as DemoPersonaType,
        name: 'David Williams',
        email: 'david.williams@demo.example',
        role: 'Scheduling Coordinator',
        organizationId: orgId,
        branchId,
        permissions: ['visits:*', 'schedule:*']
      },
      {
        id: `demo-admin-1`,
        type: 'ADMINISTRATOR' as DemoPersonaType,
        name: 'Alex Morgan',
        email: 'alex.morgan@demo.example',
        role: 'Administrator',
        organizationId: orgId,
        branchId,
        permissions: ['*:*']
      }
    ];
  }

  return {
    organizationId: orgId,
    branchId,
    baseTime: new Date(),
    caregiverIds,
    clientIds,
    coordinatorIds: [],
    visitIds: [],
    personas
  };
}
