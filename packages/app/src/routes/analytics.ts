/**
 * Analytics & Reporting API routes
 */

import { Router, Request, Response, NextFunction } from 'express';
import { Database } from '@care-commons/core';
import { requireAuth } from '../middleware/auth-context.js';
import { AnalyticsService } from '@care-commons/analytics-reporting/service/analytics-service';
import { ReportService } from '@care-commons/analytics-reporting/service/report-service';
import { ExportService } from '@care-commons/analytics-reporting/service/export-service';
import type { AnalyticsQueryOptions, ExportFormat } from '@care-commons/analytics-reporting/types/analytics';

export function createAnalyticsRouter(db: Database): Router {
  const router = Router();

  // All routes require authentication
  router.use(requireAuth);

  /**
   * GET /api/analytics/kpis
   * Get operational KPIs for dashboard
   */
  router.get('/kpis', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const context = req.userContext!;
      const service = new AnalyticsService(db);

      const startDate = req.query['startDate'] !== undefined
        ? new Date(req.query['startDate'] as string)
        : new Date(new Date().setDate(new Date().getDate() - 30));
      const endDate = req.query['endDate'] !== undefined
        ? new Date(req.query['endDate'] as string)
        : new Date();

      const options: AnalyticsQueryOptions = {
        organizationId: (req.query['organizationId'] as string | undefined) ?? context.organizationId!,
        branchId: req.query['branchId'] as string | undefined,
        dateRange: { startDate, endDate },
        includeSubBranches: req.query['includeSubBranches'] === 'true',
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
  router.get(
    '/compliance-alerts',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const context = req.userContext!;
        const service = new AnalyticsService(db);

        const orgId = (req.query['organizationId'] as string | undefined) ?? context.organizationId!;
        const branchId = req.query['branchId'] as string | undefined;

        const alerts = await service.getComplianceAlerts(orgId, branchId, context);
        res.json(alerts);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * GET /api/analytics/revenue-trends
   * Get revenue trends over time
   */
  router.get(
    '/revenue-trends',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const context = req.userContext!;
        const service = new AnalyticsService(db);

        const orgId = (req.query['organizationId'] as string | undefined) ?? context.organizationId!;
        const branchId = req.query['branchId'] as string | undefined;
        const months = parseInt((req.query['months'] as string | undefined) ?? '12', 10);

        const trends = await service.getRevenueTrends(orgId, months, branchId, context);
        res.json(trends);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * GET /api/analytics/caregiver-performance/:caregiverId
   * Get performance metrics for a specific caregiver
   */
  router.get(
    '/caregiver-performance/:caregiverId',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const context = req.userContext!;
        const service = new AnalyticsService(db);

        const startDate = req.query['startDate'] !== undefined
          ? new Date(req.query['startDate'] as string)
          : new Date(new Date().setDate(new Date().getDate() - 30));
        const endDate = req.query['endDate'] !== undefined
          ? new Date(req.query['endDate'] as string)
          : new Date();

        const performance = await service.getCaregiverPerformance(
          req.params['caregiverId']!,
          { startDate, endDate },
          context
        );

        res.json(performance);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * GET /api/analytics/evv-exceptions
   * Get EVV exceptions requiring review
   */
  router.get(
    '/evv-exceptions',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const context = req.userContext!;
        const service = new AnalyticsService(db);

        const orgId = (req.query['organizationId'] as string | undefined) ?? context.organizationId!;
        const branchId = req.query['branchId'] as string | undefined;

        const exceptions = await service.getEVVExceptions(orgId, branchId, context);
        res.json(exceptions);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * GET /api/analytics/dashboard-stats
   * Get stats for coordinator dashboard
   */
  router.get(
    '/dashboard-stats',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const context = req.userContext!;
        const service = new AnalyticsService(db);

        const orgId = (req.query['organizationId'] as string | undefined) ?? context.organizationId!;
        const branchId = req.query['branchId'] as string | undefined;

        const stats = await service.getDashboardStats(orgId, branchId, context);
        res.json(stats);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * POST /api/analytics/reports/evv-compliance
   * Generate EVV compliance report
   */
  router.post(
    '/reports/evv-compliance',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const context = req.userContext!;
        const reportService = new ReportService(db);

        const { organizationId, branchId, state, startDate, endDate } = req.body;

        const report = await reportService.generateEVVComplianceReport(
          organizationId ?? context.organizationId!,
          state,
          {
            startDate: new Date(startDate),
            endDate: new Date(endDate),
          },
          branchId,
          context
        );

        res.json(report);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * POST /api/analytics/reports/productivity
   * Generate productivity report
   */
  router.post(
    '/reports/productivity',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const context = req.userContext!;
        const reportService = new ReportService(db);

        const { organizationId, branchId, startDate, endDate } = req.body;

        const report = await reportService.generateProductivityReport(
          organizationId ?? context.organizationId!,
          {
            startDate: new Date(startDate),
            endDate: new Date(endDate),
          },
          branchId,
          context
        );

        res.json(report);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * POST /api/analytics/reports/revenue-cycle
   * Generate revenue cycle report
   */
  router.post(
    '/reports/revenue-cycle',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const context = req.userContext!;
        const reportService = new ReportService(db);

        const { organizationId, branchId, startDate, endDate } = req.body;

        const report = await reportService.generateRevenueCycleReport(
          organizationId ?? context.organizationId!,
          {
            startDate: new Date(startDate),
            endDate: new Date(endDate),
          },
          branchId,
          context
        );

        res.json(report);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * GET /api/analytics/reports/:reportId/export
   * Export report to specified format
   */
  router.get(
    '/reports/:reportId/export',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const context = req.userContext!;
        const exportService = new ExportService();

        const format = (req.query['format'] as ExportFormat | undefined) ?? 'PDF';

        // In a real implementation, you would fetch the report from storage/cache
        // For now, this is a placeholder
        const reportId = req.params['reportId'];
        if (reportId === undefined || reportId === '') {
          res.status(400).json({ error: 'Report ID is required' });
          return;
        }

        const report = {
          id: reportId,
          reportType: 'EVV_COMPLIANCE' as const,
          title: 'Sample Report',
          organizationId: context.organizationId!,
          generatedAt: new Date(),
          generatedBy: context.userId,
          period: {
            startDate: new Date(),
            endDate: new Date(),
          },
          exportFormats: ['PDF', 'EXCEL', 'CSV'] as ExportFormat[],
          data: {},
        };

        const exportData = await exportService.exportReport(report, format);
        const filename = exportService.generateFilename(report, format);
        const mimeType = exportService.getMimeType(format);

        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(exportData);
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}
