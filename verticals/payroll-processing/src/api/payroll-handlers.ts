/**
 * HTTP/API handlers for Payroll Processing
 *
 * RESTful endpoints for payroll operations including timesheets, pay runs,
 * and pay stubs
 */

import { Request, Response, NextFunction } from 'express';
import { UserContext } from '@care-commons/core';
import { PayrollService, CompileTimeSheetInput } from '../service/payroll-service';
import { PayStubGeneratorService } from '../service/pay-stub-generator.service';
import {
  CreatePayPeriodInput,
  CreatePayRunInput,
  PayPeriodSearchFilters,
  TimeSheetSearchFilters,
  PayStubSearchFilters,
  PayRunType,
  PayPeriodStatus,
  TimeSheetStatus,
  PayStubStatus,
  AdjustmentType,
} from '../types/payroll';
import {
  validateCreatePayPeriod,
  validateCreateTimeSheet,
  validateTimeSheetAdjustment,
  validateCreatePayRun,
} from '../validation/payroll-validator';

/**
 * Extract user context from authenticated request
 */
function getUserContext(req: Request): UserContext {
  // In production, this would be populated by auth middleware
  return (req as Request & { userContext: UserContext }).userContext;
}

/**
 * Handle async route errors
 */
function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void | Response>) {
  return (req: Request, res: Response, next: NextFunction) => {
    // eslint-disable-next-line promise/no-callback-in-promise
    void Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Payroll API handlers
 */
export class PayrollHandlers {
  private payStubGenerator: PayStubGeneratorService;

  constructor(private payrollService: PayrollService) {
    this.payStubGenerator = new PayStubGeneratorService();
  }

  /**
   * @openapi
   * /api/payroll/pay-periods:
   *   post:
   *     tags:
   *       - Payroll
   *     summary: Create a new pay period
   *     description: Create a new pay period for payroll processing
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreatePayPeriodInput'
   *     responses:
   *       201:
   *         description: Pay period created successfully
   *       400:
   *         description: Invalid input
   *       401:
   *         description: Not authenticated
   *       500:
   *         description: Server error
   */
  createPayPeriod = asyncHandler(async (req: Request, res: Response) => {
    const context = getUserContext(req);
    const input: CreatePayPeriodInput = req.body;

    // Validate input
    const validation = validateCreatePayPeriod(input);
    if (!validation.valid) {
      res.status(400).json({
        success: false,
        errors: validation.errors,
        warnings: validation.warnings,
      });
      return;
    }

    const payPeriod = await this.payrollService.createPayPeriod(input, context.userId);

    res.status(201).json({
      success: true,
      data: payPeriod,
    });
  });

  /**
   * @openapi
   * /api/payroll/pay-periods:
   *   get:
   *     tags:
   *       - Payroll
   *     summary: List pay periods
   *     description: Search and filter pay periods
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: organizationId
   *         schema:
   *           type: string
   *           format: uuid
   *       - in: query
   *         name: branchId
   *         schema:
   *           type: string
   *           format: uuid
   *       - in: query
   *         name: year
   *         schema:
   *           type: integer
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Pay periods retrieved
   *       401:
   *         description: Not authenticated
   *       500:
   *         description: Server error
   */
  listPayPeriods = asyncHandler(async (req: Request, res: Response) => {
    const filters = this.buildPayPeriodSearchFilters(req);
    // In a full implementation, this would use repository directly
    // For now, return an appropriate response
    res.json({
      success: true,
      data: [],
      message: 'Pay periods endpoint - implementation in progress',
    });
  });

  /**
   * @openapi
   * /api/payroll/pay-periods/{id}/open:
   *   post:
   *     tags:
   *       - Payroll
   *     summary: Open a pay period
   *     description: Open a pay period for timesheet submission
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Pay period opened
   *       404:
   *         description: Pay period not found
   *       500:
   *         description: Server error
   */
  openPayPeriod = asyncHandler(async (req: Request, res: Response) => {
    const context = getUserContext(req);
    const { id } = req.params;

    await this.payrollService.openPayPeriod(id, context.userId);

    res.json({
      success: true,
      message: 'Pay period opened for timesheet submission',
    });
  });

  /**
   * @openapi
   * /api/payroll/pay-periods/{id}/lock:
   *   post:
   *     tags:
   *       - Payroll
   *     summary: Lock a pay period
   *     description: Lock a pay period to prevent further timesheet changes
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Pay period locked
   *       404:
   *         description: Pay period not found
   *       500:
   *         description: Server error
   */
  lockPayPeriod = asyncHandler(async (req: Request, res: Response) => {
    const context = getUserContext(req);
    const { id } = req.params;

    await this.payrollService.lockPayPeriod(id, context.userId);

    res.json({
      success: true,
      message: 'Pay period locked for payroll processing',
    });
  });

  /**
   * @openapi
   * /api/payroll/timesheets:
   *   post:
   *     tags:
   *       - Payroll
   *     summary: Compile a timesheet from EVV records
   *     description: Create a timesheet by aggregating EVV time tracking records
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               organizationId:
   *                 type: string
   *                 format: uuid
   *               branchId:
   *                 type: string
   *                 format: uuid
   *               payPeriodId:
   *                 type: string
   *                 format: uuid
   *               caregiverId:
   *                 type: string
   *                 format: uuid
   *               caregiverName:
   *                 type: string
   *               caregiverEmployeeId:
   *                 type: string
   *               evvRecordIds:
   *                 type: array
   *                 items:
   *                   type: string
   *                   format: uuid
   *               regularRate:
   *                 type: number
   *     responses:
   *       201:
   *         description: Timesheet compiled successfully
   *       400:
   *         description: Invalid input
   *       500:
   *         description: Server error
   */
  compileTimeSheet = asyncHandler(async (req: Request, res: Response) => {
    const context = getUserContext(req);
    const input: CompileTimeSheetInput = req.body;

    // Validate input
    const validation = validateCreateTimeSheet({
      organizationId: input.organizationId,
      branchId: input.branchId,
      payPeriodId: input.payPeriodId,
      caregiverId: input.caregiverId,
      evvRecordIds: input.evvRecordIds,
    });

    if (!validation.valid) {
      res.status(400).json({
        success: false,
        errors: validation.errors,
        warnings: validation.warnings,
      });
      return;
    }

    const timeSheet = await this.payrollService.compileTimeSheet(input, context.userId);

    res.status(201).json({
      success: true,
      data: timeSheet,
      warnings: timeSheet.hasDiscrepancies
        ? ['Timesheet has discrepancies - review required before approval']
        : undefined,
    });
  });

  /**
   * @openapi
   * /api/payroll/timesheets/{id}/adjustments:
   *   post:
   *     tags:
   *       - Payroll
   *     summary: Add adjustment to timesheet
   *     description: Add bonus, reimbursement, or other adjustment to timesheet
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               adjustmentType:
   *                 type: string
   *                 enum: [BONUS, MILEAGE, REIMBURSEMENT, CORRECTION]
   *               amount:
   *                 type: number
   *               description:
   *                 type: string
   *               reason:
   *                 type: string
   *     responses:
   *       200:
   *         description: Adjustment added
   *       400:
   *         description: Invalid input
   *       404:
   *         description: Timesheet not found
   *       500:
   *         description: Server error
   */
  addTimeSheetAdjustment = asyncHandler(async (req: Request, res: Response) => {
    const context = getUserContext(req);
    const { id } = req.params;
    const { adjustmentType, amount, description, reason, notes } = req.body;

    // Validate input
    const validation = validateTimeSheetAdjustment({
      timeSheetId: id,
      adjustmentType: adjustmentType as AdjustmentType,
      amount,
      description,
      reason,
      notes,
    });

    if (!validation.valid) {
      res.status(400).json({
        success: false,
        errors: validation.errors,
        warnings: validation.warnings,
      });
      return;
    }

    await this.payrollService.addTimeSheetAdjustment(
      id,
      {
        adjustmentType,
        amount,
        description,
        reason,
        notes,
      },
      context.userId
    );

    res.json({
      success: true,
      message: 'Adjustment added to timesheet',
    });
  });

  /**
   * @openapi
   * /api/payroll/timesheets/{id}/approve:
   *   post:
   *     tags:
   *       - Payroll
   *     summary: Approve a timesheet
   *     description: Approve a timesheet for payroll processing
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               approvalNotes:
   *                 type: string
   *     responses:
   *       200:
   *         description: Timesheet approved
   *       400:
   *         description: Cannot approve (has unresolved discrepancies)
   *       404:
   *         description: Timesheet not found
   *       500:
   *         description: Server error
   */
  approveTimeSheet = asyncHandler(async (req: Request, res: Response) => {
    const context = getUserContext(req);
    const { id } = req.params;
    const { approvalNotes } = req.body;

    await this.payrollService.approveTimeSheet(
      { timeSheetId: id, approvalNotes },
      context.userId
    );

    res.json({
      success: true,
      message: 'Timesheet approved for payroll',
    });
  });

  /**
   * @openapi
   * /api/payroll/pay-runs:
   *   post:
   *     tags:
   *       - Payroll
   *     summary: Create a pay run
   *     description: Create a pay run to calculate pay stubs for approved timesheets
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               organizationId:
   *                 type: string
   *                 format: uuid
   *               branchId:
   *                 type: string
   *                 format: uuid
   *               payPeriodId:
   *                 type: string
   *                 format: uuid
   *               runType:
   *                 type: string
   *                 enum: [REGULAR, OFF_CYCLE, CORRECTION, BONUS]
   *               notes:
   *                 type: string
   *     responses:
   *       201:
   *         description: Pay run created successfully
   *       400:
   *         description: Invalid input or no approved timesheets
   *       500:
   *         description: Server error
   */
  createPayRun = asyncHandler(async (req: Request, res: Response) => {
    const context = getUserContext(req);
    const input: CreatePayRunInput = req.body;

    // Validate input
    const validation = validateCreatePayRun(input);
    if (!validation.valid) {
      res.status(400).json({
        success: false,
        errors: validation.errors,
        warnings: validation.warnings,
      });
      return;
    }

    const payRun = await this.payrollService.createPayRun(input, context.userId);

    res.status(201).json({
      success: true,
      data: payRun,
      message: `Pay run created with ${payRun.totalPayStubs} pay stubs`,
    });
  });

  /**
   * @openapi
   * /api/payroll/pay-runs/{id}/approve:
   *   post:
   *     tags:
   *       - Payroll
   *     summary: Approve a pay run
   *     description: Approve a pay run for payment processing
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Pay run approved
   *       400:
   *         description: Cannot approve (has errors)
   *       404:
   *         description: Pay run not found
   *       500:
   *         description: Server error
   */
  approvePayRun = asyncHandler(async (req: Request, res: Response) => {
    const context = getUserContext(req);
    const { id } = req.params;

    await this.payrollService.approvePayRun(id, context.userId);

    res.json({
      success: true,
      message: 'Pay run approved for payment processing',
    });
  });

  /**
   * @openapi
   * /api/payroll/pay-stubs:
   *   get:
   *     tags:
   *       - Payroll
   *     summary: List pay stubs
   *     description: Search and filter pay stubs
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: organizationId
   *         schema:
   *           type: string
   *           format: uuid
   *       - in: query
   *         name: caregiverId
   *         schema:
   *           type: string
   *           format: uuid
   *       - in: query
   *         name: payPeriodId
   *         schema:
   *           type: string
   *           format: uuid
   *       - in: query
   *         name: payRunId
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Pay stubs retrieved
   *       401:
   *         description: Not authenticated
   *       500:
   *         description: Server error
   */
  listPayStubs = asyncHandler(async (req: Request, res: Response) => {
    const filters = this.buildPayStubSearchFilters(req);
    // Implementation would use repository
    res.json({
      success: true,
      data: [],
      message: 'Pay stubs endpoint - implementation in progress',
    });
  });

  /**
   * @openapi
   * /api/payroll/pay-stubs/{id}/pdf:
   *   get:
   *     tags:
   *       - Payroll
   *     summary: Generate pay stub PDF
   *     description: Generate a PDF document for a pay stub
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: PDF generated
   *         content:
   *           application/pdf:
   *             schema:
   *               type: string
   *               format: binary
   *       404:
   *         description: Pay stub not found
   *       500:
   *         description: Server error
   */
  generatePayStubPDF = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    // In production, would fetch pay stub from repository
    // For demonstration, return a mock response
    res.status(501).json({
      success: false,
      message: 'PDF generation endpoint - implementation in progress',
    });
  });

  /**
   * Build pay period search filters from request
   */
  private buildPayPeriodSearchFilters(req: Request): PayPeriodSearchFilters {
    const {
      organizationId,
      branchId,
      periodType,
      status,
      year,
      quarter,
    } = req.query;

    const filters: PayPeriodSearchFilters = {};

    if (organizationId) {
      filters.organizationId = String(organizationId);
    }

    if (branchId) {
      filters.branchId = String(branchId);
    }

    if (status) {
      const statuses = String(status).split(',') as PayPeriodStatus[];
      filters.status = statuses;
    }

    if (year) {
      filters.year = Number(year);
    }

    if (quarter) {
      filters.quarter = Number(quarter);
    }

    return filters;
  }

  /**
   * Build timesheet search filters from request
   */
  private buildTimeSheetSearchFilters(req: Request): TimeSheetSearchFilters {
    const {
      organizationId,
      branchId,
      payPeriodId,
      caregiverId,
      status,
      hasDiscrepancies,
    } = req.query;

    const filters: TimeSheetSearchFilters = {};

    if (organizationId) {
      filters.organizationId = String(organizationId);
    }

    if (branchId) {
      filters.branchId = String(branchId);
    }

    if (payPeriodId) {
      filters.payPeriodId = String(payPeriodId);
    }

    if (caregiverId) {
      filters.caregiverId = String(caregiverId);
    }

    if (status) {
      const statuses = String(status).split(',') as TimeSheetStatus[];
      filters.status = statuses;
    }

    if (hasDiscrepancies !== undefined) {
      filters.hasDiscrepancies = String(hasDiscrepancies) === 'true';
    }

    return filters;
  }

  /**
   * Build pay stub search filters from request
   */
  private buildPayStubSearchFilters(req: Request): PayStubSearchFilters {
    const {
      organizationId,
      branchId,
      payRunId,
      payPeriodId,
      caregiverId,
      status,
    } = req.query;

    const filters: PayStubSearchFilters = {};

    if (organizationId) {
      filters.organizationId = String(organizationId);
    }

    if (branchId) {
      filters.branchId = String(branchId);
    }

    if (payRunId) {
      filters.payRunId = String(payRunId);
    }

    if (payPeriodId) {
      filters.payPeriodId = String(payPeriodId);
    }

    if (caregiverId) {
      filters.caregiverId = String(caregiverId);
    }

    if (status) {
      const statuses = String(status).split(',') as PayStubStatus[];
      filters.status = statuses;
    }

    return filters;
  }
}

/**
 * Create router with all payroll endpoints
 */
export function createPayrollRouter(payrollService: PayrollService) {
  const handlers = new PayrollHandlers(payrollService);
  // Routes would be registered here in full implementation
  // This is a placeholder for the router pattern
  return handlers;
}
