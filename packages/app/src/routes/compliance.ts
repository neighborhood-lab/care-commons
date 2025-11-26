/**
 * Compliance Autopilot Routes
 * 
 * API endpoints for compliance monitoring, deadline tracking, and audit reporting.
 * Supports the Compliance Autopilot feature that proactively monitors regulatory deadlines.
 */

import { Router, Request, Response } from 'express';
import {
  Database,
  ComplianceAutopilotService,
  ComplianceNotificationService,
  AuthMiddleware,
  NotFoundError,
} from '@care-commons/core';

export function createComplianceRouter(db: Database): Router {
  const router = Router();
  const complianceService = new ComplianceAutopilotService(db);
  const notificationService = new ComplianceNotificationService(db);
  const authMiddleware = new AuthMiddleware(db);

  /**
   * @openapi
   * /api/compliance/dashboard:
   *   get:
   *     tags:
   *       - Compliance
   *     summary: Get compliance dashboard summary
   *     description: Retrieve the compliance dashboard summary for the organization
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Dashboard summary retrieved successfully
   *       401:
   *         description: Not authenticated
   */
  router.get('/dashboard',
    authMiddleware.requireAuth,
    async (req: Request, res: Response): Promise<void> => {
      try {
        const organizationId = req.user!.organizationId;
        const summary = await complianceService.getDashboardSummary(organizationId);

        res.json({
          success: true,
          data: summary,
        });
      } catch (error) {
        console.error('[Compliance] Get dashboard error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to get compliance dashboard',
        });
      }
    }
  );

  /**
   * @openapi
   * /api/compliance/scan:
   *   post:
   *     tags:
   *       - Compliance
   *     summary: Run compliance scan
   *     description: Scan the organization for compliance deadlines and issues
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Scan completed successfully
   *       401:
   *         description: Not authenticated
   */
  router.post('/scan',
    authMiddleware.requireAuth,
    async (req: Request, res: Response): Promise<void> => {
      try {
        const organizationId = req.user!.organizationId;
        const deadlines = await complianceService.scanOrganization(organizationId);

        res.json({
          success: true,
          data: {
            deadlines,
            scannedAt: new Date().toISOString(),
            totalDeadlines: deadlines.length,
          },
        });
      } catch (error) {
        console.error('[Compliance] Scan error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to run compliance scan',
        });
      }
    }
  );

  /**
   * @openapi
   * /api/compliance/deadlines:
   *   get:
   *     tags:
   *       - Compliance
   *     summary: Get compliance deadlines
   *     description: Retrieve all active compliance deadlines for the organization
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [OVERDUE, DUE_SOON, UPCOMING, CURRENT, BLOCKED]
   *         description: Filter by deadline status
   *       - in: query
   *         name: category
   *         schema:
   *           type: string
   *           enum: [CAREGIVER_CREDENTIAL, CAREGIVER_BACKGROUND, CAREGIVER_TRAINING, CLIENT_AUTHORIZATION, CARE_PLAN_REVIEW, EVV_SUBMISSION, INCIDENT_REPORT]
   *         description: Filter by deadline category
   *       - in: query
   *         name: priority
   *         schema:
   *           type: string
   *           enum: [CRITICAL, HIGH, MEDIUM, LOW]
   *         description: Filter by priority level
   *     responses:
   *       200:
   *         description: Deadlines retrieved successfully
   *       401:
   *         description: Not authenticated
   */
  router.get('/deadlines',
    authMiddleware.requireAuth,
    async (req: Request, res: Response): Promise<void> => {
      try {
        const organizationId = req.user!.organizationId;
        const { status, category, priority } = req.query;

        const allDeadlines = await complianceService.getActiveDeadlines(organizationId);
        
        // Apply filters if provided
        let filteredDeadlines = allDeadlines;
        if (typeof status === 'string' && status !== '') {
          filteredDeadlines = filteredDeadlines.filter(d => d.status === status);
        }
        if (typeof category === 'string' && category !== '') {
          filteredDeadlines = filteredDeadlines.filter(d => d.category === category);
        }
        if (typeof priority === 'string' && priority !== '') {
          filteredDeadlines = filteredDeadlines.filter(d => d.priority === priority);
        }

        res.json({
          success: true,
          data: {
            deadlines: filteredDeadlines,
            total: filteredDeadlines.length,
          },
        });
      } catch (error) {
        console.error('[Compliance] Get deadlines error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to get compliance deadlines',
        });
      }
    }
  );

  /**
   * @openapi
   * /api/compliance/deadlines/{deadlineId}/resolve:
   *   post:
   *     tags:
   *       - Compliance
   *     summary: Resolve a deadline
   *     description: Mark a compliance deadline as resolved
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: deadlineId
   *         required: true
   *         schema:
   *           type: string
   *         description: Deadline ID
   *     requestBody:
   *       required: false
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               note:
   *                 type: string
   *                 description: Resolution note
   *     responses:
   *       200:
   *         description: Deadline resolved successfully
   *       401:
   *         description: Not authenticated
   *       404:
   *         description: Deadline not found
   */
  router.post('/deadlines/:deadlineId/resolve',
    authMiddleware.requireAuth,
    async (req: Request, res: Response): Promise<void> => {
      try {
        const deadlineId = req.params['deadlineId'];
        if (deadlineId === undefined || deadlineId === '') {
          res.status(400).json({
            success: false,
            error: 'Deadline ID is required',
            code: 'MISSING_DEADLINE_ID',
          });
          return;
        }

        const organizationId = req.user!.organizationId;
        const userId = req.user!.userId;
        const { note } = req.body;

        await complianceService.resolveDeadline(
          organizationId,
          {
            deadlineId,
            resolutionNote: typeof note === 'string' ? note : undefined,
          },
          userId
        );

        res.json({
          success: true,
          message: 'Deadline resolved successfully',
        });
      } catch (error) {
        if (error instanceof NotFoundError) {
          res.status(404).json({
            success: false,
            error: error.message,
            code: 'DEADLINE_NOT_FOUND',
          });
          return;
        }

        console.error('[Compliance] Resolve deadline error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to resolve deadline',
        });
      }
    }
  );

  /**
   * @openapi
   * /api/compliance/caregivers/{caregiverId}/status:
   *   get:
   *     tags:
   *       - Compliance
   *     summary: Get caregiver credential status
   *     description: Retrieve the compliance status for a specific caregiver
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: caregiverId
   *         required: true
   *         schema:
   *           type: string
   *         description: Caregiver ID
   *     responses:
   *       200:
   *         description: Caregiver status retrieved successfully
   *       401:
   *         description: Not authenticated
   *       404:
   *         description: Caregiver not found
   */
  router.get('/caregivers/:caregiverId/status',
    authMiddleware.requireAuth,
    async (req: Request, res: Response): Promise<void> => {
      try {
        const caregiverId = req.params['caregiverId'];
        if (caregiverId === undefined || caregiverId === '') {
          res.status(400).json({
            success: false,
            error: 'Caregiver ID is required',
            code: 'MISSING_CAREGIVER_ID',
          });
          return;
        }

        const organizationId = req.user!.organizationId;
        const status = await complianceService.getCaregiverCredentialStatus(
          organizationId,
          caregiverId
        );

        res.json({
          success: true,
          data: status,
        });
      } catch (error) {
        if (error instanceof Error && error.message === 'Caregiver not found') {
          res.status(404).json({
            success: false,
            error: 'Caregiver not found',
            code: 'CAREGIVER_NOT_FOUND',
          });
          return;
        }

        console.error('[Compliance] Get caregiver status error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to get caregiver compliance status',
        });
      }
    }
  );

  /**
   * @openapi
   * /api/compliance/caregivers/{caregiverId}/can-schedule:
   *   get:
   *     tags:
   *       - Compliance
   *     summary: Check if caregiver can be scheduled
   *     description: Check if a caregiver is compliant and can be scheduled for visits
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: caregiverId
   *         required: true
   *         schema:
   *           type: string
   *         description: Caregiver ID
   *     responses:
   *       200:
   *         description: Scheduling eligibility checked successfully
   *       401:
   *         description: Not authenticated
   *       404:
   *         description: Caregiver not found
   */
  router.get('/caregivers/:caregiverId/can-schedule',
    authMiddleware.requireAuth,
    async (req: Request, res: Response): Promise<void> => {
      try {
        const caregiverId = req.params['caregiverId'];
        if (caregiverId === undefined || caregiverId === '') {
          res.status(400).json({
            success: false,
            error: 'Caregiver ID is required',
            code: 'MISSING_CAREGIVER_ID',
          });
          return;
        }

        const organizationId = req.user!.organizationId;
        const result = await complianceService.canCaregiverBeScheduled(
          organizationId,
          caregiverId
        );

        res.json({
          success: true,
          data: result,
        });
      } catch (error) {
        if (error instanceof Error && error.message === 'Caregiver not found') {
          res.status(404).json({
            success: false,
            error: 'Caregiver not found',
            code: 'CAREGIVER_NOT_FOUND',
          });
          return;
        }

        console.error('[Compliance] Check caregiver scheduling error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to check caregiver scheduling eligibility',
        });
      }
    }
  );

  /**
   * @openapi
   * /api/compliance/clients/{clientId}/authorizations:
   *   get:
   *     tags:
   *       - Compliance
   *     summary: Get client authorization usage
   *     description: Retrieve authorization usage details for a specific client
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: clientId
   *         required: true
   *         schema:
   *           type: string
   *         description: Client ID
   *     responses:
   *       200:
   *         description: Authorization usage retrieved successfully
   *       401:
   *         description: Not authenticated
   */
  router.get('/clients/:clientId/authorizations',
    authMiddleware.requireAuth,
    async (req: Request, res: Response): Promise<void> => {
      try {
        const clientId = req.params['clientId'];
        if (clientId === undefined || clientId === '') {
          res.status(400).json({
            success: false,
            error: 'Client ID is required',
            code: 'MISSING_CLIENT_ID',
          });
          return;
        }

        const organizationId = req.user!.organizationId;
        const usages = await complianceService.getAuthorizationUsage(
          organizationId,
          clientId
        );

        res.json({
          success: true,
          data: {
            authorizations: usages,
            total: usages.length,
          },
        });
      } catch (error) {
        console.error('[Compliance] Get authorization usage error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to get authorization usage',
        });
      }
    }
  );

  /**
   * @openapi
   * /api/compliance/reports/audit:
   *   get:
   *     tags:
   *       - Compliance
   *     summary: Generate compliance audit report
   *     description: Generate a comprehensive compliance audit report
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: startDate
   *         required: true
   *         schema:
   *           type: string
   *           format: date
   *         description: Report start date (YYYY-MM-DD)
   *       - in: query
   *         name: endDate
   *         required: true
   *         schema:
   *           type: string
   *           format: date
   *         description: Report end date (YYYY-MM-DD)
   *     responses:
   *       200:
   *         description: Audit report generated successfully
   *       400:
   *         description: Invalid date range
   *       401:
   *         description: Not authenticated
   */
  router.get('/reports/audit',
    authMiddleware.requireAuth,
    async (req: Request, res: Response): Promise<void> => {
      try {
        const { startDate, endDate } = req.query;

        if (typeof startDate !== 'string' || typeof endDate !== 'string') {
          res.status(400).json({
            success: false,
            error: 'Start date and end date are required (YYYY-MM-DD format)',
            code: 'INVALID_DATE_RANGE',
          });
          return;
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          res.status(400).json({
            success: false,
            error: 'Invalid date format. Use YYYY-MM-DD',
            code: 'INVALID_DATE_FORMAT',
          });
          return;
        }

        if (start > end) {
          res.status(400).json({
            success: false,
            error: 'Start date must be before end date',
            code: 'INVALID_DATE_RANGE',
          });
          return;
        }

        const organizationId = req.user!.organizationId;
        const report = await complianceService.generateAuditReport(
          organizationId,
          start,
          end
        );

        res.json({
          success: true,
          data: report,
        });
      } catch (error) {
        console.error('[Compliance] Generate audit report error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to generate audit report',
        });
      }
    }
  );

  /**
   * @openapi
   * /api/compliance/deadlines/count:
   *   get:
   *     tags:
   *       - Compliance
   *     summary: Get active deadline count
   *     description: Get the count of active (unresolved) compliance deadlines
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Deadline count retrieved successfully
   *       401:
   *         description: Not authenticated
   */
  router.get('/deadlines/count',
    authMiddleware.requireAuth,
    async (req: Request, res: Response): Promise<void> => {
      try {
        const organizationId = req.user!.organizationId;
        const deadlines = await complianceService.getActiveDeadlines(organizationId);

        res.json({
          success: true,
          data: {
            count: deadlines.length,
          },
        });
      } catch (error) {
        console.error('[Compliance] Get deadline count error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to get deadline count',
        });
      }
    }
  );

  /**
   * @openapi
   * /api/compliance/cron/scan:
   *   post:
   *     tags:
   *       - Compliance
   *     summary: Scheduled compliance scan (cron job)
   *     description: Run compliance scan for all organizations. Called by Vercel cron.
   *     security:
   *       - cronAuth: []
   *     responses:
   *       200:
   *         description: Scan completed successfully
   *       401:
   *         description: Invalid cron secret
   */
  router.post('/cron/scan',
    async (req: Request, res: Response): Promise<void> => {
      try {
        // Verify cron secret (Vercel sends this as Authorization header)
        const authHeader = req.headers['authorization'];
        const cronSecret = process.env['CRON_SECRET'];

        // If CRON_SECRET is set, verify it. If not set, only allow from Vercel cron.
        if (cronSecret !== undefined && cronSecret !== '') {
          if (authHeader !== `Bearer ${cronSecret}`) {
            res.status(401).json({
              success: false,
              error: 'Unauthorized: Invalid cron secret',
            });
            return;
          }
        } else {
          // Fallback: Check for Vercel cron user-agent in production
          const userAgent = req.headers['user-agent'] ?? '';
          const isVercelCron = userAgent.toLowerCase().includes('vercel-cron');
          const isLocalDev = process.env['NODE_ENV'] === 'development';

          if (!isVercelCron && !isLocalDev) {
            res.status(401).json({
              success: false,
              error: 'Unauthorized: Cron endpoint only callable by Vercel cron or with CRON_SECRET',
            });
            return;
          }
        }

        console.log('[Compliance Cron] Starting scheduled compliance scan');
        const startTime = Date.now();

        // Get all active organizations
        const orgResult = await db.query<{ id: string; name: string }>(
          `SELECT id, name FROM organizations WHERE deleted_at IS NULL`
        );

        const organizations = orgResult.rows;
        const results: {
          organizationId: string;
          organizationName: string;
          deadlinesFound: number;
          deadlinesUpdated: number;
          notificationsSent: number;
          notificationsFailed: number;
          error?: string;
        }[] = [];

        // Scan each organization
        for (const org of organizations) {
          try {
            // Scan for new deadlines
            const deadlines = await complianceService.scanOrganization(org.id);

            // Update statuses of existing deadlines
            const updatedCount = await complianceService.updateDeadlineStatuses(org.id);

            // Get deadlines that need notifications (urgent and overdue)
            const activeDeadlines = await complianceService.getActiveDeadlines(org.id);
            const notifyableDeadlines = activeDeadlines.filter(
              d => d.status === 'OVERDUE' || d.status === 'DUE_SOON' || d.status === 'UPCOMING'
            );

            // Send notifications for deadlines
            const notificationResult = await notificationService.sendDeadlineNotifications(
              org.id,
              notifyableDeadlines
            );

            // Send daily digest to admins
            const digestResult = await notificationService.sendDailyDigest(org.id);

            const totalSent = notificationResult.sent + digestResult.sent;
            const totalFailed = notificationResult.failed + digestResult.failed;

            results.push({
              organizationId: org.id,
              organizationName: org.name,
              deadlinesFound: deadlines.length,
              deadlinesUpdated: updatedCount,
              notificationsSent: totalSent,
              notificationsFailed: totalFailed,
            });

            console.log(`[Compliance Cron] Scanned ${org.name}: ${deadlines.length} deadlines, ${updatedCount} updated, ${totalSent} notifications sent`);
          } catch (orgError) {
            const errorMessage = orgError instanceof Error ? orgError.message : 'Unknown error';
            console.error(`[Compliance Cron] Error scanning ${org.name}:`, errorMessage);
            results.push({
              organizationId: org.id,
              organizationName: org.name,
              deadlinesFound: 0,
              deadlinesUpdated: 0,
              notificationsSent: 0,
              notificationsFailed: 0,
              error: errorMessage,
            });
          }
        }

        const duration = Date.now() - startTime;
        const totalDeadlines = results.reduce((sum, r) => sum + r.deadlinesFound, 0);
        const totalUpdated = results.reduce((sum, r) => sum + r.deadlinesUpdated, 0);
        const totalNotifications = results.reduce((sum, r) => sum + r.notificationsSent, 0);
        const errorCount = results.filter(r => r.error !== undefined).length;

        console.log(`[Compliance Cron] Completed: ${organizations.length} orgs, ${totalDeadlines} deadlines, ${totalUpdated} updated, ${totalNotifications} notifications, ${errorCount} errors, ${duration}ms`);

        res.json({
          success: true,
          data: {
            organizationsScanned: organizations.length,
            totalDeadlinesFound: totalDeadlines,
            totalDeadlinesUpdated: totalUpdated,
            totalNotificationsSent: totalNotifications,
            errorCount,
            durationMs: duration,
            completedAt: new Date().toISOString(),
            results,
          },
        });
      } catch (error) {
        console.error('[Compliance Cron] Scan error:', error);
        res.status(500).json({
          success: false,
          error: 'Scheduled compliance scan failed',
        });
      }
    }
  );

  return router;
}
