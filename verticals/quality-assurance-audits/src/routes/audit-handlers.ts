/**
 * Quality Assurance & Audits API Handlers
 *
 * Express route handlers for audit management
 */

import type { Request, Response, Router } from 'express';
import type { AuditService } from '../services/audit-service';
import type { UserContext, Database, TokenPayload } from '@care-commons/core';
import { AuthMiddleware } from '@care-commons/core';

/**
 * Extend Express Request to include userContext
 */
interface RequestWithContext extends Request {
  userContext?: UserContext;
  user?: TokenPayload;
}

/**
 * Create audit routes
 */
export function createAuditRoutes(auditService: AuditService, router: Router): Router {
  // Initialize authentication middleware
  const authMiddleware = new AuthMiddleware({} as Database);

  // All audit routes require authentication
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.use(authMiddleware.requireAuth as any);

  // Map req.user to req.userContext for compatibility
  router.use((req: RequestWithContext, _res: Response, next) => {
    if (req.user) {
      req.userContext = {
        userId: req.user.userId,
        organizationId: req.user.organizationId,
        roles: req.user.roles,
        permissions: req.user.permissions,
        branchIds: [] // Fetch branch IDs from user profile if needed
      };
    }
    next();
  });

  // ============================================================================
  // Audit Routes
  // ============================================================================

  /**
   * GET /api/audits - List audits with filters
   */
  router.get('/audits', async (req: Request, res: Response) => {
    try {
      const context = (req as Request & { userContext?: UserContext }).userContext;
      if (!context) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { status, auditType, branchId } = req.query;
      const audits = await auditService.getAuditSummaries(
        {
          status: status as string,
          auditType: auditType as string,
          branchId: branchId as string
        },
        context
      );

      return res.json(audits);
    } catch (error) {
      console.error('Error fetching audits:', error);
      return res.status(500).json({ error: 'Failed to fetch audits' });
    }
  });

  /**
   * GET /api/audits/:id - Get audit details
   */
  router.get('/audits/:id', async (req: Request, res: Response) => {
    try {
      const context = (req as Request & { userContext?: UserContext }).userContext;
      if (!context) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ error: 'Audit ID is required' });
      }

      const audit = await auditService.getAuditDetail(id, context);
      if (!audit) {
        return res.status(404).json({ error: 'Audit not found' });
      }

      return res.json(audit);
    } catch (error) {
      console.error('Error fetching audit:', error);
      return res.status(500).json({ error: 'Failed to fetch audit' });
    }
  });

  /**
   * POST /api/audits - Create new audit
   */
  router.post('/audits', async (req: Request, res: Response) => {
    try {
      const context = (req as Request & { userContext?: UserContext }).userContext;
      if (!context) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const audit = await auditService.createAudit(req.body, context);
      return res.status(201).json(audit);
    } catch (error) {
      console.error('Error creating audit:', error);
      return res.status(500).json({ error: 'Failed to create audit' });
    }
  });

  /**
   * PATCH /api/audits/:id - Update audit
   */
  router.patch('/audits/:id', async (req: Request, res: Response) => {
    try {
      const context = (req as Request & { userContext?: UserContext }).userContext;
      if (!context) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ error: 'Audit ID is required' });
      }

      const audit = await auditService.updateAudit(id, req.body, context);
      return res.json(audit);
    } catch (error) {
      console.error('Error updating audit:', error);
      return res.status(500).json({ error: 'Failed to update audit' });
    }
  });

  /**
   * POST /api/audits/:id/start - Start audit
   */
  router.post('/audits/:id/start', async (req: Request, res: Response) => {
    try {
      const context = (req as Request & { userContext?: UserContext }).userContext;
      if (!context) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ error: 'Audit ID is required' });
      }

      const audit = await auditService.startAudit(id, context);
      return res.json(audit);
    } catch (error) {
      console.error('Error starting audit:', error);
      return res.status(500).json({ error: 'Failed to start audit' });
    }
  });

  /**
   * POST /api/audits/:id/complete - Complete audit
   */
  router.post('/audits/:id/complete', async (req: Request, res: Response) => {
    try {
      const context = (req as Request & { userContext?: UserContext }).userContext;
      if (!context) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ error: 'Audit ID is required' });
      }

      const { executiveSummary, recommendations } = req.body;
      const audit = await auditService.completeAudit(
        id,
        executiveSummary,
        recommendations,
        context
      );
      return res.json(audit);
    } catch (error) {
      console.error('Error completing audit:', error);
      return res.status(500).json({ error: 'Failed to complete audit' });
    }
  });

  // ============================================================================
  // Finding Routes
  // ============================================================================

  /**
   * GET /api/audits/:auditId/findings - Get findings for audit
   */
  router.get('/audits/:auditId/findings', async (req: Request, res: Response) => {
    try {
      const context = (req as Request & { userContext?: UserContext }).userContext;
      if (!context) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { auditId } = req.params;
      if (!auditId) {
        return res.status(400).json({ error: 'Audit ID is required' });
      }

      const findings = await auditService.getFindingsForAudit(auditId, context);
      return res.json(findings);
    } catch (error) {
      console.error('Error fetching findings:', error);
      return res.status(500).json({ error: 'Failed to fetch findings' });
    }
  });

  /**
   * POST /api/audits/:auditId/findings - Create finding
   */
  router.post('/audits/:auditId/findings', async (req: Request, res: Response) => {
    try {
      const context = (req as Request & { userContext?: UserContext }).userContext;
      if (!context) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { auditId } = req.params;
      if (!auditId) {
        return res.status(400).json({ error: 'Audit ID is required' });
      }

      const finding = await auditService.createFinding(
        { ...req.body, auditId },
        context
      );
      return res.status(201).json(finding);
    } catch (error) {
      console.error('Error creating finding:', error);
      return res.status(500).json({ error: 'Failed to create finding' });
    }
  });

  /**
   * PATCH /api/findings/:id/status - Update finding status
   */
  router.patch('/findings/:id/status', async (req: Request, res: Response) => {
    try {
      const context = (req as Request & { userContext?: UserContext }).userContext;
      if (!context) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ error: 'Finding ID is required' });
      }

      const { status, resolutionDescription } = req.body;
      const finding = await auditService.updateFindingStatus(
        id,
        status,
        resolutionDescription,
        context
      );
      return res.json(finding);
    } catch (error) {
      console.error('Error updating finding status:', error);
      return res.status(500).json({ error: 'Failed to update finding status' });
    }
  });

  /**
   * POST /api/findings/:id/verify - Verify finding resolution
   */
  router.post('/findings/:id/verify', async (req: Request, res: Response) => {
    try {
      const context = (req as Request & { userContext?: UserContext }).userContext;
      if (!context) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ error: 'Finding ID is required' });
      }

      const { verificationNotes } = req.body;
      const finding = await auditService.verifyFinding(
        id,
        verificationNotes,
        context
      );
      return res.json(finding);
    } catch (error) {
      console.error('Error verifying finding:', error);
      return res.status(500).json({ error: 'Failed to verify finding' });
    }
  });

  // ============================================================================
  // Corrective Action Routes
  // ============================================================================

  /**
   * GET /api/audits/:auditId/corrective-actions - Get corrective actions
   */
  router.get('/audits/:auditId/corrective-actions', async (req: Request, res: Response) => {
    try {
      const context = (req as Request & { userContext?: UserContext }).userContext;
      if (!context) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { auditId } = req.params;
      if (!auditId) {
        return res.status(400).json({ error: 'Audit ID is required' });
      }

      const actions = await auditService.getCorrectiveActionsForAudit(auditId, context);
      return res.json(actions);
    } catch (error) {
      console.error('Error fetching corrective actions:', error);
      return res.status(500).json({ error: 'Failed to fetch corrective actions' });
    }
  });

  /**
   * POST /api/corrective-actions - Create corrective action
   */
  router.post('/corrective-actions', async (req: Request, res: Response) => {
    try {
      const context = (req as Request & { userContext?: UserContext }).userContext;
      if (!context) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const action = await auditService.createCorrectiveAction(req.body, context);
      return res.status(201).json(action);
    } catch (error) {
      console.error('Error creating corrective action:', error);
      return res.status(500).json({ error: 'Failed to create corrective action' });
    }
  });

  /**
   * POST /api/corrective-actions/:id/progress - Update progress
   */
  router.post('/corrective-actions/:id/progress', async (req: Request, res: Response) => {
    try {
      const context = (req as Request & { userContext?: UserContext }).userContext;
      if (!context) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ error: 'Action ID is required' });
      }

      const action = await auditService.updateCorrectiveActionProgress(
        id,
        req.body,
        context
      );
      return res.json(action);
    } catch (error) {
      console.error('Error updating corrective action progress:', error);
      return res.status(500).json({ error: 'Failed to update progress' });
    }
  });

  /**
   * POST /api/corrective-actions/:id/complete - Complete action
   */
  router.post('/corrective-actions/:id/complete', async (req: Request, res: Response) => {
    try {
      const context = (req as Request & { userContext?: UserContext }).userContext;
      if (!context) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ error: 'Action ID is required' });
      }

      const action = await auditService.completeCorrectiveAction(id, context);
      return res.json(action);
    } catch (error) {
      console.error('Error completing corrective action:', error);
      return res.status(500).json({ error: 'Failed to complete corrective action' });
    }
  });

  /**
   * POST /api/corrective-actions/:id/verify - Verify effectiveness
   */
  router.post('/corrective-actions/:id/verify', async (req: Request, res: Response) => {
    try {
      const context = (req as Request & { userContext?: UserContext }).userContext;
      if (!context) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ error: 'Action ID is required' });
      }

      const { effectivenessRating, verificationNotes } = req.body;
      const action = await auditService.verifyCorrectiveAction(
        id,
        effectivenessRating,
        verificationNotes,
        context
      );
      return res.json(action);
    } catch (error) {
      console.error('Error verifying corrective action:', error);
      return res.status(500).json({ error: 'Failed to verify corrective action' });
    }
  });

  // ============================================================================
  // Dashboard Routes
  // ============================================================================

  /**
   * GET /api/audits/dashboard - Get audit dashboard
   */
  router.get('/audits-dashboard', async (req: Request, res: Response) => {
    try {
      const context = (req as Request & { userContext?: UserContext }).userContext;
      if (!context) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const dashboard = await auditService.getAuditDashboard(context);
      return res.json(dashboard);
    } catch (error) {
      console.error('Error fetching audit dashboard:', error);
      return res.status(500).json({ error: 'Failed to fetch dashboard' });
    }
  });

  /**
   * GET /api/audits/critical-findings - Get critical findings
   */
  router.get('/audits/critical-findings', async (req: Request, res: Response) => {
    try {
      const context = (req as Request & { userContext?: UserContext }).userContext;
      if (!context) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const findings = await auditService.getCriticalFindings(context);
      return res.json(findings);
    } catch (error) {
      console.error('Error fetching critical findings:', error);
      return res.status(500).json({ error: 'Failed to fetch critical findings' });
    }
  });

  /**
   * GET /api/audits/overdue-actions - Get overdue corrective actions
   */
  router.get('/audits/overdue-actions', async (req: Request, res: Response) => {
    try {
      const context = (req as Request & { userContext?: UserContext }).userContext;
      if (!context) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const actions = await auditService.getOverdueCorrectiveActions(context);
      return res.json(actions);
    } catch (error) {
      console.error('Error fetching overdue actions:', error);
      return res.status(500).json({ error: 'Failed to fetch overdue actions' });
    }
  });

  return router;
}
