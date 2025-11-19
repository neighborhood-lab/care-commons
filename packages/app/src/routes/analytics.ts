/**
 * Analytics API routes
 */

import { Router, Request, Response, NextFunction } from 'express';
import { Database, AuthMiddleware } from '@care-commons/core';
import { AnalyticsService } from '@care-commons/analytics-reporting';
import { ExportService } from '@care-commons/analytics-reporting';
import type { AnalyticsQueryOptions, ExportFormat, Report } from '@care-commons/analytics-reporting';

export function createAnalyticsRouter(db: Database): Router {
  const router = Router();
  const authMiddleware = new AuthMiddleware(db);

  // All routes require authentication with proper JWT verification
  router.use(authMiddleware.requireAuth);

  /**
   * GET /api/analytics/kpis
   * Get operational KPIs for dashboard
   */
  router.get('/kpis', async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get user from JWT token (set by AuthMiddleware)
      const user = req.user!;
      const service = new AnalyticsService(db);

      const options: AnalyticsQueryOptions = {
        organizationId: user.organizationId!,
        branchId: req.query['branchId'] as string | undefined,
        dateRange: {
          startDate: req.query['startDate'] !== undefined ? new Date(req.query['startDate'] as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: req.query['endDate'] !== undefined ? new Date(req.query['endDate'] as string) : new Date(),
        },
      };

      // Create context for the service (compatibility with existing code)
      const context = {
        userId: user.userId,
        organizationId: user.organizationId,
        branchIds: [],
        roles: user.roles,
        permissions: user.permissions,
      };

      const kpis = await service.getOperationalKPIs(options, context);
      res.json(kpis);
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/analytics/compliance-alerts
   * Get compliance alerts
   */
  router.get('/compliance-alerts', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const service = new AnalyticsService(db);

      const context = {
        userId: user.userId,
        organizationId: user.organizationId,
        branchIds: [],
        roles: user.roles,
        permissions: user.permissions,
      };

      const branchId = req.query['branchId'] as string | undefined;
      const alerts = await service.getComplianceAlerts(user.organizationId!, branchId, context);
      res.json(alerts);
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/analytics/revenue-trends
   * Get revenue trends by month
   */
  router.get('/revenue-trends', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const context = {
        userId: user.userId,
        organizationId: user.organizationId,
        branchIds: [],
        roles: user.roles,
        permissions: user.permissions,
      };
      const service = new AnalyticsService(db);

      const months = parseInt((req.query['months'] as string | undefined) ?? '6', 10);
      const branchId = req.query['branchId'] as string | undefined;

      const trends = await service.getRevenueTrends(context.organizationId!, months, branchId, context);
      res.json(trends);
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/analytics/evv-exceptions
   * Get EVV exceptions needing review
   */
  router.get('/evv-exceptions', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const context = {
        userId: user.userId,
        organizationId: user.organizationId,
        branchIds: [],
        roles: user.roles,
        permissions: user.permissions,
      };
      const service = new AnalyticsService(db);

      const branchId = req.query['branchId'] as string | undefined;
      const exceptions = await service.getEVVExceptions(context.organizationId!, branchId, context);
      res.json(exceptions);
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/analytics/dashboard-stats
   * Get real-time dashboard stats for coordinators
   */
  router.get('/dashboard-stats', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const context = {
        userId: user.userId,
        organizationId: user.organizationId,
        branchIds: [],
        roles: user.roles,
        permissions: user.permissions,
      };
      const service = new AnalyticsService(db);

      const branchId = req.query['branchId'] as string | undefined;
      const stats = await service.getDashboardStats(context.organizationId!, branchId, context);
      res.json(stats);
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/analytics/caregiver-performance/:caregiverId
   * Get performance metrics for a specific caregiver
   */
  router.get('/caregiver-performance/:caregiverId', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const context = {
        userId: user.userId,
        organizationId: user.organizationId,
        branchIds: [],
        roles: user.roles,
        permissions: user.permissions,
      };
      const service = new AnalyticsService(db);

      const dateRange = {
        startDate: req.query['startDate'] !== undefined ? new Date(req.query['startDate'] as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: req.query['endDate'] !== undefined ? new Date(req.query['endDate'] as string) : new Date(),
      };

      const performance = await service.getCaregiverPerformance(
        req.params['caregiverId']!,
        dateRange,
        context
      );
      res.json(performance);
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/analytics/caregiver-performance
   * Get performance metrics for all caregivers
   */
  router.get('/caregiver-performance', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const context = {
        userId: user.userId,
        organizationId: user.organizationId,
        branchIds: [],
        roles: user.roles,
        permissions: user.permissions,
      };
      const service = new AnalyticsService(db);

      const options: AnalyticsQueryOptions = {
        organizationId: context.organizationId!,
        branchId: req.query['branchId'] as string | undefined,
        dateRange: {
          startDate: req.query['startDate'] !== undefined ? new Date(req.query['startDate'] as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: req.query['endDate'] !== undefined ? new Date(req.query['endDate'] as string) : new Date(),
        },
      };

      // Use the repository directly to get all caregiver performance
      const repository = service['repository'];
      const performance = await repository.getCaregiverPerformanceData(
        options.organizationId,
        options.dateRange,
        options.branchId
      );
      res.json(performance);
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/analytics/export
   * Export analytics report to specified format
   */
  router.post('/export', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const exportService = new ExportService();

      const format = (req.body['format'] as ExportFormat | undefined) ?? 'CSV';
      const report = req.body['report'] as Report | undefined;

      if (report === undefined) {
        res.status(400).json({ error: 'Report data is required' });
        return;
      }

      // Convert string dates to Date objects
      report.period.startDate = new Date(report.period.startDate);
      report.period.endDate = new Date(report.period.endDate);
      report.generatedAt = new Date(report.generatedAt);

      const exportData = await exportService.exportReport(report, format);
      const filename = exportService.generateFilename(report, format);
      const mimeType = exportService.getMimeType(format);

      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', mimeType);
      res.send(exportData);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
