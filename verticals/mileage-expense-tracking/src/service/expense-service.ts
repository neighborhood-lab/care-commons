import type { UUID, UserContext } from '@care-commons/core';
import { PermissionService } from '@care-commons/core';
import type {
  ExpenseEntry,
  CreateExpenseEntryInput,
  UpdateExpenseEntryInput,
  SubmitExpenseInput,
  ApproveExpenseInput,
  RejectExpenseInput,
  MarkExpensePaidInput,
  ExpenseQueryFilter,
  ExpenseSummary,
  ExpenseStatus,
} from '../types/expense.js';
import { ExpenseRepository } from '../repository/expense-repository.js';

/**
 * Service for managing expense entries
 */
export class ExpenseService {
  constructor(
    private repository: ExpenseRepository,
    private permissions: PermissionService
  ) {}

  /**
   * Create a new expense entry
   */
  async createExpense(
    input: CreateExpenseEntryInput,
    context: UserContext
  ): Promise<ExpenseEntry> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'expenses:create')) {
      throw new Error('Insufficient permissions to create expenses');
    }

    // Business validation
    if (input.amount <= 0) {
      throw new Error('Expense amount must be positive');
    }

    if (!input.description || input.description.trim().length === 0) {
      throw new Error('Expense description is required');
    }

    // Validate expense date is not in the future
    const expenseDate = new Date(input.expenseDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (expenseDate > today) {
      throw new Error('Expense date cannot be in the future');
    }

    // Create expense with draft status
    const expense: Partial<ExpenseEntry> = {
      employeeId: input.employeeId,
      expenseDate: input.expenseDate,
      category: input.category,
      amount: input.amount,
      currency: input.currency || 'USD',
      description: input.description.trim(),
      merchantName: input.merchantName?.trim(),
      status: 'DRAFT',
      receiptId: input.receiptId,
      hasReceipt: !!input.receiptId,
      organizationId: context.organizationId,
      branchId: context.branchIds[0],
      notes: input.notes?.trim(),
      tags: input.tags,
    };

    return await this.repository.create(expense, context);
  }

  /**
   * Update an expense entry
   */
  async updateExpense(
    expenseId: UUID,
    input: UpdateExpenseEntryInput,
    context: UserContext
  ): Promise<ExpenseEntry> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'expenses:update')) {
      throw new Error('Insufficient permissions to update expenses');
    }

    // Get existing expense
    const existing = await this.repository.findById(expenseId, context);
    if (!existing) {
      throw new Error('Expense not found');
    }

    // Can only update draft expenses
    if (existing.status !== 'DRAFT') {
      throw new Error('Can only update expenses in DRAFT status');
    }

    // Validate updated values
    if (input.amount !== undefined && input.amount <= 0) {
      throw new Error('Expense amount must be positive');
    }

    if (input.description !== undefined && input.description.trim().length === 0) {
      throw new Error('Expense description cannot be empty');
    }

    // Build update object
    const updates: Partial<ExpenseEntry> = {};
    if (input.expenseDate !== undefined) updates.expenseDate = input.expenseDate;
    if (input.category !== undefined) updates.category = input.category;
    if (input.amount !== undefined) updates.amount = input.amount;
    if (input.currency !== undefined) updates.currency = input.currency;
    if (input.description !== undefined) updates.description = input.description.trim();
    if (input.merchantName !== undefined) updates.merchantName = input.merchantName.trim();
    if (input.receiptId !== undefined) {
      updates.receiptId = input.receiptId;
      updates.hasReceipt = !!input.receiptId;
    }
    if (input.notes !== undefined) updates.notes = input.notes.trim();
    if (input.tags !== undefined) updates.tags = input.tags;

    return await this.repository.update(expenseId, updates, context);
  }

  /**
   * Submit expense entries for approval
   */
  async submitExpenses(
    input: SubmitExpenseInput,
    context: UserContext
  ): Promise<ExpenseEntry[]> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'expenses:submit')) {
      throw new Error('Insufficient permissions to submit expenses');
    }

    if (input.expenseIds.length === 0) {
      throw new Error('At least one expense must be selected');
    }

    // Validate all expenses are in DRAFT status
    const expenses = await Promise.all(
      input.expenseIds.map((id) => this.repository.findById(id, context))
    );

    for (const expense of expenses) {
      if (!expense) {
        throw new Error('One or more expenses not found');
      }
      if (expense.status !== 'DRAFT') {
        throw new Error(`Expense ${expense.id} is not in DRAFT status`);
      }
    }

    // Update status to SUBMITTED
    await this.repository.updateStatus(input.expenseIds, 'SUBMITTED', context);

    // Also update submitted_at timestamp
    const now = new Date().toISOString();
    for (const expenseId of input.expenseIds) {
      await this.repository.update(expenseId, { submittedAt: now }, context);
    }

    // Fetch and return updated expenses
    return await Promise.all(
      input.expenseIds.map((id) => this.repository.findById(id, context))
    ) as ExpenseEntry[];
  }

  /**
   * Approve expense entries
   */
  async approveExpenses(
    input: ApproveExpenseInput,
    context: UserContext
  ): Promise<ExpenseEntry[]> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'expenses:approve')) {
      throw new Error('Insufficient permissions to approve expenses');
    }

    if (input.expenseIds.length === 0) {
      throw new Error('At least one expense must be selected');
    }

    // Validate all expenses are in SUBMITTED status
    const expenses = await Promise.all(
      input.expenseIds.map((id) => this.repository.findById(id, context))
    );

    for (const expense of expenses) {
      if (!expense) {
        throw new Error('One or more expenses not found');
      }
      if (expense.status !== 'SUBMITTED') {
        throw new Error(`Expense ${expense.id} is not in SUBMITTED status`);
      }
    }

    // Update status to APPROVED
    await this.repository.updateStatus(input.expenseIds, 'APPROVED', context);

    // Update approval metadata
    const now = new Date().toISOString();
    for (const expenseId of input.expenseIds) {
      await this.repository.update(
        expenseId,
        {
          approvedBy: context.userId,
          approvedAt: now,
          notes: input.notes,
        },
        context
      );
    }

    // Fetch and return updated expenses
    return await Promise.all(
      input.expenseIds.map((id) => this.repository.findById(id, context))
    ) as ExpenseEntry[];
  }

  /**
   * Reject expense entries
   */
  async rejectExpenses(
    input: RejectExpenseInput,
    context: UserContext
  ): Promise<ExpenseEntry[]> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'expenses:approve')) {
      throw new Error('Insufficient permissions to reject expenses');
    }

    if (input.expenseIds.length === 0) {
      throw new Error('At least one expense must be selected');
    }

    if (!input.rejectionReason || input.rejectionReason.trim().length === 0) {
      throw new Error('Rejection reason is required');
    }

    // Validate all expenses are in SUBMITTED status
    const expenses = await Promise.all(
      input.expenseIds.map((id) => this.repository.findById(id, context))
    );

    for (const expense of expenses) {
      if (!expense) {
        throw new Error('One or more expenses not found');
      }
      if (expense.status !== 'SUBMITTED') {
        throw new Error(`Expense ${expense.id} is not in SUBMITTED status`);
      }
    }

    // Update status to REJECTED
    await this.repository.updateStatus(input.expenseIds, 'REJECTED', context);

    // Update rejection metadata
    for (const expenseId of input.expenseIds) {
      await this.repository.update(
        expenseId,
        { rejectionReason: input.rejectionReason.trim() },
        context
      );
    }

    // Fetch and return updated expenses
    return await Promise.all(
      input.expenseIds.map((id) => this.repository.findById(id, context))
    ) as ExpenseEntry[];
  }

  /**
   * Mark expenses as paid
   */
  async markExpensesPaid(
    input: MarkExpensePaidInput,
    context: UserContext
  ): Promise<ExpenseEntry[]> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'expenses:pay')) {
      throw new Error('Insufficient permissions to mark expenses as paid');
    }

    if (input.expenseIds.length === 0) {
      throw new Error('At least one expense must be selected');
    }

    // Validate all expenses are in APPROVED status
    const expenses = await Promise.all(
      input.expenseIds.map((id) => this.repository.findById(id, context))
    );

    for (const expense of expenses) {
      if (!expense) {
        throw new Error('One or more expenses not found');
      }
      if (expense.status !== 'APPROVED') {
        throw new Error(`Expense ${expense.id} is not in APPROVED status`);
      }
    }

    // Update status to PAID
    await this.repository.updateStatus(input.expenseIds, 'PAID', context);

    // Update payment metadata
    const paidAt = input.paidAt || new Date().toISOString();
    for (const expenseId of input.expenseIds) {
      await this.repository.update(
        expenseId,
        {
          paidAt,
          paymentMethod: input.paymentMethod,
          paymentReference: input.paymentReference,
        },
        context
      );
    }

    // Fetch and return updated expenses
    return await Promise.all(
      input.expenseIds.map((id) => this.repository.findById(id, context))
    ) as ExpenseEntry[];
  }

  /**
   * Get expense by ID
   */
  async getExpenseById(expenseId: UUID, context: UserContext): Promise<ExpenseEntry | null> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'expenses:view')) {
      throw new Error('Insufficient permissions to view expenses');
    }

    return await this.repository.findById(expenseId, context);
  }

  /**
   * Get expenses for an employee
   */
  async getEmployeeExpenses(employeeId: UUID, context: UserContext): Promise<ExpenseEntry[]> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'expenses:view')) {
      throw new Error('Insufficient permissions to view expenses');
    }

    return await this.repository.findByEmployee(employeeId, context);
  }

  /**
   * Get expenses by status
   */
  async getExpensesByStatus(
    status: ExpenseStatus,
    context: UserContext
  ): Promise<ExpenseEntry[]> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'expenses:view')) {
      throw new Error('Insufficient permissions to view expenses');
    }

    return await this.repository.findByStatus(status, context);
  }

  /**
   * Query expenses with filters
   */
  async queryExpenses(
    filter: ExpenseQueryFilter,
    context: UserContext
  ): Promise<ExpenseEntry[]> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'expenses:view')) {
      throw new Error('Insufficient permissions to view expenses');
    }

    return await this.repository.findWithFilters(filter, context);
  }

  /**
   * Get expense summary
   */
  async getExpenseSummary(
    filter: ExpenseQueryFilter,
    context: UserContext
  ): Promise<ExpenseSummary> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'expenses:view')) {
      throw new Error('Insufficient permissions to view expenses');
    }

    return await this.repository.getSummary(filter, context);
  }

  /**
   * Delete an expense (only drafts can be deleted)
   */
  async deleteExpense(expenseId: UUID, context: UserContext): Promise<void> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'expenses:delete')) {
      throw new Error('Insufficient permissions to delete expenses');
    }

    // Get existing expense
    const existing = await this.repository.findById(expenseId, context);
    if (!existing) {
      throw new Error('Expense not found');
    }

    // Can only delete draft expenses
    if (existing.status !== 'DRAFT') {
      throw new Error('Can only delete expenses in DRAFT status');
    }

    await this.repository.delete(expenseId, context);
  }
}
