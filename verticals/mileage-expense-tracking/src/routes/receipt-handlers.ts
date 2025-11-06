/**
 * Receipt API Handlers
 *
 * Express request handlers for receipt management
 */

import type { Request, Response } from 'express';
import type { UserContext, Role } from '@care-commons/core';
import { ReceiptService } from '../service/receipt-service.js';

/**
 * Extract user context from request
 * In production, this would extract from JWT or session
 */
function getUserContext(req: Request): UserContext {
  const branchId = req.header('X-Branch-Id');
  return {
    userId: req.header('X-User-Id') || 'system',
    organizationId: req.header('X-Organization-Id') || '',
    branchIds: branchId ? [branchId] : [],
    roles: (req.header('X-User-Roles') || 'STAFF').split(',') as Role[],
    permissions: (req.header('X-User-Permissions') || '').split(',').filter(Boolean),
  };
}

/**
 * Handle errors consistently across all handlers
 */
function handleError(error: unknown, res: Response, operation: string): void {
  const err = error as Error & { statusCode?: number };

  if (err.message.includes('permissions')) {
    res.status(403).json({ error: err.message });
  } else if (err.message.includes('not found')) {
    res.status(404).json({ error: err.message });
  } else if (err.message.includes('validation') || err.message.includes('already')) {
    res.status(400).json({ error: err.message });
  } else {
    console.error(`Error ${operation}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Create API handlers for receipt management
 */
export function createReceiptHandlers(service: ReceiptService) {
  return {
    // ========================================================================
    // Receipt Management
    // ========================================================================

    /**
     * POST /receipts
     * Upload a new receipt
     */
    async uploadReceipt(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        const receipt = await service.uploadReceipt(req.body, context);
        res.status(201).json(receipt);
      } catch (error: unknown) {
        handleError(error, res, 'uploading receipt');
      }
    },

    /**
     * GET /receipts/:id
     * Get receipt by ID
     */
    async getReceiptById(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        const receipt = await service.getReceiptById(req.params['id'] as string, context);

        if (!receipt) {
          res.status(404).json({ error: 'Receipt not found' });
          return;
        }

        res.json(receipt);
      } catch (error: unknown) {
        handleError(error, res, 'fetching receipt');
      }
    },

    /**
     * PUT /receipts/:id
     * Update receipt metadata
     */
    async updateReceipt(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        const receipt = await service.updateReceipt(
          req.params['id'] as string,
          req.body,
          context
        );
        res.json(receipt);
      } catch (error: unknown) {
        handleError(error, res, 'updating receipt');
      }
    },

    /**
     * DELETE /receipts/:id
     * Delete a receipt
     */
    async deleteReceipt(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        await service.deleteReceipt(req.params['id'] as string, context);
        res.status(204).send();
      } catch (error: unknown) {
        handleError(error, res, 'deleting receipt');
      }
    },

    /**
     * GET /receipts/employee/:employeeId
     * Get receipts for an employee
     */
    async getEmployeeReceipts(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        const receipts = await service.getEmployeeReceipts(
          req.params['employeeId'] as string,
          context
        );
        res.json(receipts);
      } catch (error: unknown) {
        handleError(error, res, 'fetching employee receipts');
      }
    },

    /**
     * GET /receipts/expense/:expenseId
     * Get receipts for an expense
     */
    async getExpenseReceipts(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        const receipts = await service.getExpenseReceipts(
          req.params['expenseId'] as string,
          context
        );
        res.json(receipts);
      } catch (error: unknown) {
        handleError(error, res, 'fetching expense receipts');
      }
    },

    /**
     * GET /receipts/mileage/:mileageId
     * Get receipts for a mileage entry
     */
    async getMileageReceipts(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        const receipts = await service.getMileageReceipts(
          req.params['mileageId'] as string,
          context
        );
        res.json(receipts);
      } catch (error: unknown) {
        handleError(error, res, 'fetching mileage receipts');
      }
    },

    /**
     * GET /receipts/unlinked
     * Get unlinked receipts
     */
    async getUnlinkedReceipts(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        const receipts = await service.getUnlinkedReceipts(context);
        res.json(receipts);
      } catch (error: unknown) {
        handleError(error, res, 'fetching unlinked receipts');
      }
    },

    /**
     * POST /receipts/query
     * Query receipts with filters
     */
    async queryReceipts(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        const receipts = await service.queryReceipts(req.body, context);
        res.json(receipts);
      } catch (error: unknown) {
        handleError(error, res, 'querying receipts');
      }
    },

    /**
     * POST /receipts/statistics
     * Get receipt statistics
     */
    async getReceiptStatistics(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        const statistics = await service.getReceiptStatistics(req.body, context);
        res.json(statistics);
      } catch (error: unknown) {
        handleError(error, res, 'fetching receipt statistics');
      }
    },

    // ========================================================================
    // Receipt Workflow Operations
    // ========================================================================

    /**
     * POST /receipts/verify
     * Verify receipts
     */
    async verifyReceipts(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        const receipts = await service.verifyReceipts(req.body, context);
        res.json(receipts);
      } catch (error: unknown) {
        handleError(error, res, 'verifying receipts');
      }
    },

    /**
     * POST /receipts/reject
     * Reject receipts
     */
    async rejectReceipts(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        const receipts = await service.rejectReceipts(req.body, context);
        res.json(receipts);
      } catch (error: unknown) {
        handleError(error, res, 'rejecting receipts');
      }
    },

    /**
     * POST /receipts/archive
     * Archive receipts
     */
    async archiveReceipts(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        const receipts = await service.archiveReceipts(req.body.receiptIds, context);
        res.json(receipts);
      } catch (error: unknown) {
        handleError(error, res, 'archiving receipts');
      }
    },

    /**
     * POST /receipts/:id/link-expense
     * Link receipt to expense
     */
    async linkToExpense(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        const receipt = await service.linkToExpense(
          req.params['id'] as string,
          req.body.expenseId,
          context
        );
        res.json(receipt);
      } catch (error: unknown) {
        handleError(error, res, 'linking receipt to expense');
      }
    },

    /**
     * POST /receipts/:id/link-mileage
     * Link receipt to mileage
     */
    async linkToMileage(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        const receipt = await service.linkToMileage(
          req.params['id'] as string,
          req.body.mileageId,
          context
        );
        res.json(receipt);
      } catch (error: unknown) {
        handleError(error, res, 'linking receipt to mileage');
      }
    },
  };
}
