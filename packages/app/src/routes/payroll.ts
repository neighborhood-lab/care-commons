/**
 * Payroll Processing API Routes
 *
 * REST API endpoints for payroll operations:
 * - Pay period management
 * - Timesheet compilation and approval
 * - Pay run execution
 * - Pay stub generation and retrieval
 */

import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import {
  PayrollService,
  PayStubGeneratorService,
  PayrollRepository,
  CreatePayPeriodInput,
  CompileTimeSheetInput,
  CreatePayRunInput,
  ApproveTimeSheetInput,
  PayStub,
  PayPeriod,
  PayStubSearchFilters,
  PayPeriodSearchFilters,
  TimeSheetSearchFilters,
} from '@care-commons/payroll-processing';
import { Database } from '@care-commons/core';
import { requireAuth } from '../middleware/auth-context';

/**
 * Create payroll router with all endpoints
 */
export function createPayrollRouter(db: Database): Router {
  const router = Router();
  const pool = db.getPool();
  const payrollService = new PayrollService(pool);
  const payStubGenerator = new PayStubGeneratorService();
  const payrollRepository = new PayrollRepository(pool);

  // Apply authentication to all payroll routes
  router.use(requireAuth);

  /**
   * GET /api/payroll/periods
   * List pay periods with optional filters
   */
  router.get('/payroll/periods', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId, status, year, limit = 50, offset = 0 } = req.query;

      const filters: PayPeriodSearchFilters = {};
      if (organizationId !== undefined) {
        filters.organizationId = String(organizationId);
      }
      if (status !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        filters.status = (Array.isArray(status) ? status : [status]) as any;
      }
      if (year !== undefined) {
        filters.year = Number(year);
      }

      const periods = await payrollRepository.findPayPeriods(filters);

      // Apply pagination
      const start = Number(offset);
      const end = start + Number(limit);
      const paginatedPeriods = periods.slice(start, end);

      res.json({
        data: paginatedPeriods,
        meta: {
          total: periods.length,
          limit: Number(limit),
          offset: Number(offset),
        },
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/payroll/periods
   * Create a new pay period
   */
  router.post('/payroll/periods', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.headers['x-user-id'];
      if (typeof userId !== 'string' || userId.length === 0) {
        res.status(401).json({ error: 'User ID required' });
        return;
      }

      const input: CreatePayPeriodInput = req.body;
      const period = await payrollService.createPayPeriod(input, userId);

      res.status(201).json({ data: period });
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/payroll/periods/:id
   * Get a specific pay period by ID
   */
  router.get('/payroll/periods/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id ?? "";
      if (id.length === 0) {
        res.status(400).json({ error: 'Pay period ID required' });
        return;
      }

      const period = await payrollRepository.findPayPeriodById(id);

      if (period === null) {
        res.status(404).json({ error: 'Pay period not found' });
        return;
      }

      res.json({ data: period });
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/payroll/periods/:id/open
   * Open a pay period for timesheet submission
   */
  router.post('/payroll/periods/:id/open', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.headers['x-user-id'];
      if (typeof userId !== 'string' || userId.length === 0) {
        res.status(401).json({ error: 'User ID required' });
        return;
      }

      const id = req.params.id ?? "";
      if (id.length === 0) {
        res.status(400).json({ error: 'Pay period ID required' });
        return;
      }

      await payrollService.openPayPeriod(id, userId);

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/payroll/periods/:id/lock
   * Lock a pay period to prevent timesheet changes
   */
  router.post('/payroll/periods/:id/lock', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.headers['x-user-id'];
      if (typeof userId !== 'string' || userId.length === 0) {
        res.status(401).json({ error: 'User ID required' });
        return;
      }

      const id = req.params.id ?? "";
      if (id.length === 0) {
        res.status(400).json({ error: 'Pay period ID required' });
        return;
      }

      await payrollService.lockPayPeriod(id, userId);

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/payroll/timesheets
   * Compile a timesheet from EVV records
   */
  router.post('/payroll/timesheets', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.headers['x-user-id'];
      if (typeof userId !== 'string' || userId.length === 0) {
        res.status(401).json({ error: 'User ID required' });
        return;
      }

      const input: CompileTimeSheetInput = req.body;
      const timesheet = await payrollService.compileTimeSheet(input, userId);

      res.status(201).json({ data: timesheet });
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/payroll/timesheets
   * Search timesheets with filters
   */
  router.get('/payroll/timesheets', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId, payPeriodId, caregiverId, status } = req.query;

      const filters: TimeSheetSearchFilters = {};
      if (organizationId !== undefined) {
        filters.organizationId = String(organizationId);
      }
      if (payPeriodId !== undefined) {
        filters.payPeriodId = String(payPeriodId);
      }
      if (caregiverId !== undefined) {
        filters.caregiverId = String(caregiverId);
      }
      if (status !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        filters.status = (Array.isArray(status) ? status : [status]) as any;
      }

      const timesheets = await payrollRepository.findTimeSheets(filters);

      res.json({ data: timesheets });
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/payroll/timesheets/:id
   * Get a specific timesheet by ID
   */
  router.get('/payroll/timesheets/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id ?? "";
      if (id.length === 0) {
        res.status(400).json({ error: 'Timesheet ID required' });
        return;
      }

      const timesheet = await payrollRepository.findTimeSheetById(id);

      if (timesheet === null) {
        res.status(404).json({ error: 'Timesheet not found' });
        return;
      }

      res.json({ data: timesheet });
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/payroll/timesheets/:id/approve
   * Approve a timesheet for payroll processing
   */
  router.post('/payroll/timesheets/:id/approve', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.headers['x-user-id'];
      if (typeof userId !== 'string' || userId.length === 0) {
        res.status(401).json({ error: 'User ID required' });
        return;
      }

      const id = req.params.id ?? "";
      const approvalNotes = req.body?.approvalNotes as string | undefined;

      const input: ApproveTimeSheetInput = {
        timeSheetId: id,
      };
      if (approvalNotes !== undefined && approvalNotes.length > 0) {
        input.approvalNotes = approvalNotes;
      }

      await payrollService.approveTimeSheet(input, userId);

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/payroll/pay-runs
   * Create and calculate a pay run
   */
  router.post('/payroll/pay-runs', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.headers['x-user-id'];
      if (typeof userId !== 'string' || userId.length === 0) {
        res.status(401).json({ error: 'User ID required' });
        return;
      }

      const input: CreatePayRunInput = req.body;
      const payRun = await payrollService.createPayRun(input, userId);

      res.status(201).json({ data: payRun });
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/payroll/pay-runs
   * List pay runs with filters
   */
  router.get('/payroll/pay-runs', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { payPeriodId } = req.query;

      if (payPeriodId === undefined) {
        res.status(400).json({ error: 'payPeriodId is required' });
        return;
      }

      const payRuns = await payrollRepository.findPayRunsByPeriod(String(payPeriodId));

      res.json({ data: payRuns });
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/payroll/pay-runs/:id
   * Get a specific pay run by ID
   */
  router.get('/payroll/pay-runs/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id ?? "";
      if (id.length === 0) {
        res.status(400).json({ error: 'Pay run ID required' });
        return;
      }

      const payRun = await payrollRepository.findPayRunById(id);

      if (payRun === null) {
        res.status(404).json({ error: 'Pay run not found' });
        return;
      }

      res.json({ data: payRun });
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/payroll/pay-runs/:id/approve
   * Approve a pay run for payment processing
   */
  router.post('/payroll/pay-runs/:id/approve', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.headers['x-user-id'];
      if (typeof userId !== 'string' || userId.length === 0) {
        res.status(401).json({ error: 'User ID required' });
        return;
      }

      const id = req.params.id ?? "";
      if (id.length === 0) {
        res.status(400).json({ error: 'Pay run ID required' });
        return;
      }

      await payrollService.approvePayRun(id, userId);

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/payroll/pay-stubs
   * Search pay stubs with filters
   */
  router.get('/payroll/pay-stubs', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId, payRunId, payPeriodId, caregiverId, status } = req.query;

      const filters: PayStubSearchFilters = {};
      if (organizationId !== undefined) {
        filters.organizationId = String(organizationId);
      }
      if (payRunId !== undefined) {
        filters.payRunId = String(payRunId);
      }
      if (payPeriodId !== undefined) {
        filters.payPeriodId = String(payPeriodId);
      }
      if (caregiverId !== undefined) {
        filters.caregiverId = String(caregiverId);
      }
      if (status !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        filters.status = (Array.isArray(status) ? status : [status]) as any;
      }

      const payStubs = await payrollRepository.findPayStubs(filters);

      res.json({ data: payStubs });
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/payroll/pay-stubs/:id
   * Get a specific pay stub by ID
   */
  router.get('/payroll/pay-stubs/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id ?? "";
      if (id.length === 0) {
        res.status(400).json({ error: 'Pay stub ID required' });
        return;
      }

      const payStub = await payrollRepository.findPayStubById(id);

      if (payStub === null) {
        res.status(404).json({ error: 'Pay stub not found' });
        return;
      }

      res.json({ data: payStub });
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/payroll/pay-stubs/:id/pdf
   * Generate and download pay stub PDF
   */
  router.get('/payroll/pay-stubs/:id/pdf', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id ?? "";
      if (id.length === 0) {
        res.status(400).json({ error: 'Pay stub ID required' });
        return;
      }

      const payStub = await payrollRepository.findPayStubById(id);

      if (payStub === null) {
        res.status(404).json({ error: 'Pay stub not found' });
        return;
      }

      // Generate PDF
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pdfBuffer = await payStubGenerator.generatePayStubPDF(payStub as any);

      // Set response headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="pay-stub-${payStub.stubNumber}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);

      res.send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/payroll/caregivers/:caregiverId/pay-stubs
   * Get all pay stubs for a caregiver
   */
  router.get('/payroll/caregivers/:caregiverId/pay-stubs', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { caregiverId } = req.params;
      const { limit = 50 } = req.query;

      const filters: PayStubSearchFilters = { caregiverId };

      const payStubs = await payrollRepository.findPayStubs(filters);

      // Sort by pay date descending
      const sortedPayStubs = [...payStubs].sort((a: PayStub, b: PayStub) =>
        new Date(b.payDate).getTime() - new Date(a.payDate).getTime()
      );

      // Apply limit
      const limitedPayStubs = sortedPayStubs.slice(0, Number(limit));

      res.json({ data: limitedPayStubs });
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/payroll/current-period
   * Get the current active pay period
   */
  router.get('/payroll/current-period', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId } = req.query;

      if (organizationId === undefined) {
        res.status(400).json({ error: 'organizationId is required' });
        return;
      }

      const periods = await payrollRepository.findPayPeriods({
        organizationId: String(organizationId),
        status: ['OPEN', 'LOCKED', 'PROCESSING'],
      });

      // Get the most recent period
      const sortedPeriods = [...periods].sort((a: PayPeriod, b: PayPeriod) =>
        new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
      );

      if (sortedPeriods.length === 0) {
        res.status(404).json({ error: 'No active pay period found' });
        return;
      }

      const currentPeriod = sortedPeriods[0];

      res.json({ data: currentPeriod });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
