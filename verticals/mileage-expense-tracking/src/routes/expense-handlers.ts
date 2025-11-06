/**
 * Expense API Handlers
 *
 * Express request handlers for expense management
 */

import type { Request, Response } from 'express';
import type { UserContext, Role } from '@care-commons/core';
import { ExpenseService } from '../service/expense-service.js';

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
 * Create API handlers for expense management
 */
export function createExpenseHandlers(service: ExpenseService) {
  return {
    // ========================================================================
    // Expense Entry Management
    // ========================================================================

    /**
     * POST /expenses
     * Create a new expense entry
     */
    async createExpense(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        const expense = await service.createExpense(req.body, context);
        res.status(201).json(expense);
      } catch (error: unknown) {
        handleError(error, res, 'creating expense');
      }
    },

    /**
     * GET /expenses/:id
     * Get expense by ID
     */
    async getExpenseById(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        const expense = await service.getExpenseById(req.params['id'] as string, context);

        if (!expense) {
          res.status(404).json({ error: 'Expense not found' });
          return;
        }

        res.json(expense);
      } catch (error: unknown) {
        handleError(error, res, 'fetching expense');
      }
    },

    /**
     * PUT /expenses/:id
     * Update an expense entry
     */
    async updateExpense(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        const expense = await service.updateExpense(
          req.params['id'] as string,
          req.body,
          context
        );
        res.json(expense);
      } catch (error: unknown) {
        handleError(error, res, 'updating expense');
      }
    },

    /**
     * DELETE /expenses/:id
     * Delete an expense entry
     */
    async deleteExpense(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        await service.deleteExpense(req.params['id'] as string, context);
        res.status(204).send();
      } catch (error: unknown) {
        handleError(error, res, 'deleting expense');
      }
    },

    /**
     * GET /expenses/employee/:employeeId
     * Get expenses for an employee
     */
    async getEmployeeExpenses(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        const expenses = await service.getEmployeeExpenses(
          req.params['employeeId'] as string,
          context
        );
        res.json(expenses);
      } catch (error: unknown) {
        handleError(error, res, 'fetching employee expenses');
      }
    },

    /**
     * GET /expenses/status/:status
     * Get expenses by status
     */
    async getExpensesByStatus(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        const expenses = await service.getExpensesByStatus(
          req.params['status'] as any,
          context
        );
        res.json(expenses);
      } catch (error: unknown) {
        handleError(error, res, 'fetching expenses by status');
      }
    },

    /**
     * POST /expenses/query
     * Query expenses with filters
     */
    async queryExpenses(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        const expenses = await service.queryExpenses(req.body, context);
        res.json(expenses);
      } catch (error: unknown) {
        handleError(error, res, 'querying expenses');
      }
    },

    /**
     * POST /expenses/summary
     * Get expense summary
     */
    async getExpenseSummary(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        const summary = await service.getExpenseSummary(req.body, context);
        res.json(summary);
      } catch (error: unknown) {
        handleError(error, res, 'fetching expense summary');
      }
    },

    // ========================================================================
    // Expense Workflow Operations
    // ========================================================================

    /**
     * POST /expenses/submit
     * Submit expenses for approval
     */
    async submitExpenses(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        const expenses = await service.submitExpenses(req.body, context);
        res.json(expenses);
      } catch (error: unknown) {
        handleError(error, res, 'submitting expenses');
      }
    },

    /**
     * POST /expenses/approve
     * Approve expenses
     */
    async approveExpenses(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        const expenses = await service.approveExpenses(req.body, context);
        res.json(expenses);
      } catch (error: unknown) {
        handleError(error, res, 'approving expenses');
      }
    },

    /**
     * POST /expenses/reject
     * Reject expenses
     */
    async rejectExpenses(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        const expenses = await service.rejectExpenses(req.body, context);
        res.json(expenses);
      } catch (error: unknown) {
        handleError(error, res, 'rejecting expenses');
      }
    },

    /**
     * POST /expenses/mark-paid
     * Mark expenses as paid
     */
    async markExpensesPaid(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        const expenses = await service.markExpensesPaid(req.body, context);
        res.json(expenses);
      } catch (error: unknown) {
        handleError(error, res, 'marking expenses as paid');
      }
    },
  };
}
