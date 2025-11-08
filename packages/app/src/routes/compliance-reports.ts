/**
 * Compliance Reporting API routes
 */

import { Router, Request, Response, NextFunction } from 'express';
import { Database } from '@care-commons/core';
import { requireAuth } from '../middleware/auth-context.js';
import { ComplianceReportService, SchedulerService } from '@care-commons/compliance-reporting';
import type {
  GenerateReportRequest,
  ReportQueryFilters,
  ScheduleReportParams,
  ExportFormat
} from '@care-commons/core/types/compliance-reporting.js';

export function createComplianceReportRouter(db: Database): Router {
  const router = Router();

  // All routes require authentication
  router.use(requireAuth);

  /**
   * GET /api/compliance-reports
   * Query compliance reports with filters
   */
  router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const context = req.userContext!;
      const service = new ComplianceReportService(db.pool);

      const filters: ReportQueryFilters = {
        organizationId: context.organizationId,
        branchId: req.query['branchId'] as string | undefined,
        stateCode: req.query['stateCode'] as any,
        reportType: req.query['reportType'] as any,
        status: req.query['status'] as any,
        periodStart: req.query['periodStart'] ? new Date(req.query['periodStart'] as string) : undefined,
        periodEnd: req.query['periodEnd'] ? new Date(req.query['periodEnd'] as string) : undefined
      };

      const reports = await service.queryReports(filters);
      res.json(reports);
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/compliance-reports/:id
   * Get compliance report by ID
   */
  router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const service = new ComplianceReportService(db.pool);
      const report = await service.getReportById(req.params['id']!);
      res.json(report);
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/compliance-reports/generate
   * Generate a new compliance report
   */
  router.post('/generate', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const context = req.userContext!;
      const service = new ComplianceReportService(db.pool);

      const request: GenerateReportRequest = {
        templateId: req.body['templateId'],
        organizationId: context.organizationId,
        branchId: req.body['branchId'],
        periodStartDate: new Date(req.body['periodStartDate']),
        periodEndDate: new Date(req.body['periodEndDate']),
        exportFormats: req.body['exportFormats'] || ['PDF'],
        filterCriteria: req.body['filterCriteria'],
        autoSubmit: req.body['autoSubmit'] || false
      };

      const report = await service.generateReport(request, context.userId);
      res.status(201).json(report);
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/compliance-reports/:id/audit-trail
   * Get audit trail for a report
   */
  router.get('/:id/audit-trail', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const service = new ComplianceReportService(db.pool);
      const auditTrail = await service['auditService'].getAuditTrail(req.params['id']!);
      res.json(auditTrail);
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/compliance-reports/:id/export/:format
   * Download exported report file
   */
  router.get('/:id/export/:format', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const service = new ComplianceReportService(db.pool);
      const format = req.params['format']!.toUpperCase() as ExportFormat;

      const filePath = await service['exportService'].getFilePath(req.params['id']!, format);

      if (!filePath) {
        res.status(404).json({ error: 'Export not found' });
        return;
      }

      // Log access
      await service['auditService'].logAccess(req.params['id']!, req.userContext!.userId, 'DOWNLOAD');

      res.download(filePath);
    } catch (error) {
      next(error);
    }
  });

  return router;
}

/**
 * Create scheduled reports router
 */
export function createScheduledReportsRouter(db: Database): Router {
  const router = Router();

  // All routes require authentication
  router.use(requireAuth);

  /**
   * GET /api/compliance-reports/schedules
   * Get all scheduled reports for the organization
   */
  router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const context = req.userContext!;

      const result = await db.pool.query(
        `SELECT * FROM scheduled_compliance_reports
         WHERE organization_id = $1 AND deleted = false
         ORDER BY schedule_name`,
        [context.organizationId]
      );

      res.json(result.rows);
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/compliance-reports/schedules
   * Create a new scheduled report
   */
  router.post('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const context = req.userContext!;
      const schedulerService = new SchedulerService(db.pool);

      const params: ScheduleReportParams = {
        templateId: req.body['templateId'],
        organizationId: context.organizationId,
        branchId: req.body['branchId'],
        scheduleName: req.body['scheduleName'],
        frequency: req.body['frequency'],
        exportFormats: req.body['exportFormats'] || ['PDF'],
        deliveryMethod: req.body['deliveryMethod'] || 'EMAIL',
        deliveryConfig: req.body['deliveryConfig'] || {},
        dateRangeType: req.body['dateRangeType'],
        dayOfMonth: req.body['dayOfMonth'],
        dayOfWeek: req.body['dayOfWeek'],
        timeOfDay: req.body['timeOfDay']
      };

      const schedule = await schedulerService.createSchedule(params, context.userId);
      res.status(201).json(schedule);
    } catch (error) {
      next(error);
    }
  });

  /**
   * PATCH /api/compliance-reports/schedules/:id
   * Update a scheduled report
   */
  router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const context = req.userContext!;
      const schedulerService = new SchedulerService(db.pool);

      const schedule = await schedulerService.updateSchedule(
        req.params['id']!,
        req.body,
        context.userId
      );

      res.json(schedule);
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/compliance-reports/schedules/:id/toggle
   * Enable/disable a schedule
   */
  router.post('/:id/toggle', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const context = req.userContext!;
      const schedulerService = new SchedulerService(db.pool);

      await schedulerService.toggleSchedule(
        req.params['id']!,
        req.body['enabled'],
        context.userId
      );

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  /**
   * DELETE /api/compliance-reports/schedules/:id
   * Delete a scheduled report
   */
  router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const context = req.userContext!;
      const schedulerService = new SchedulerService(db.pool);

      await schedulerService.deleteSchedule(req.params['id']!, context.userId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  return router;
}

/**
 * Create templates router
 */
export function createTemplatesRouter(db: Database): Router {
  const router = Router();

  // All routes require authentication
  router.use(requireAuth);

  /**
   * GET /api/compliance-reports/templates
   * Get all available report templates
   */
  router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stateCode = req.query['stateCode'] as string | undefined;
      const reportType = req.query['reportType'] as string | undefined;

      let query = 'SELECT * FROM compliance_report_templates WHERE is_active = true';
      const params: any[] = [];
      let paramIndex = 1;

      if (stateCode) {
        query += ` AND state_code = $${paramIndex++}`;
        params.push(stateCode);
      }

      if (reportType) {
        query += ` AND report_type = $${paramIndex++}`;
        params.push(reportType);
      }

      query += ' ORDER BY state_code, report_type';

      const result = await db.pool.query(query, params);
      res.json(result.rows);
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/compliance-reports/templates/:id
   * Get template by ID
   */
  router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await db.pool.query(
        'SELECT * FROM compliance_report_templates WHERE id = $1',
        [req.params['id']]
      );

      if (result.rows.length === 0) {
        res.status(404).json({ error: 'Template not found' });
        return;
      }

      res.json(result.rows[0]);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
