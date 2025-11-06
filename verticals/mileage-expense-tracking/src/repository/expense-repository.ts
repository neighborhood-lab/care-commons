import { Repository, type Database, type UUID, type UserContext } from '@care-commons/core';
import type {
  ExpenseEntry,
  ExpenseQueryFilter,
  ExpenseSummary,
  ExpenseStatus,
} from '../types/expense.js';

/**
 * Repository for managing expense entries in the database
 */
export class ExpenseRepository extends Repository<ExpenseEntry> {
  constructor(database: Database) {
    super({
      tableName: 'expense_entries',
      database,
      enableAudit: true,
      enableSoftDelete: false,
    });
  }

  /**
   * Maps a database row to an ExpenseEntry entity
   */
  protected mapRowToEntity(row: Record<string, unknown>): ExpenseEntry {
    return {
      id: row.id as UUID,
      employeeId: row.employee_id as UUID,
      expenseDate: row.expense_date as string,
      category: row.category as ExpenseEntry['category'],
      amount: row.amount as number,
      currency: row.currency as string,
      description: row.description as string,
      merchantName: row.merchant_name as string | undefined,
      status: row.status as ExpenseStatus,
      submittedAt: row.submitted_at as string | undefined,
      approvedBy: row.approved_by as UUID | undefined,
      approvedAt: row.approved_at as string | undefined,
      rejectionReason: row.rejection_reason as string | undefined,
      paidAt: row.paid_at as string | undefined,
      paymentMethod: row.payment_method as ExpenseEntry['paymentMethod'] | undefined,
      paymentReference: row.payment_reference as string | undefined,
      receiptId: row.receipt_id as UUID | undefined,
      hasReceipt: row.has_receipt as boolean,
      organizationId: row.organization_id as UUID,
      branchId: row.branch_id as UUID,
      notes: row.notes as string | undefined,
      tags: row.tags as string[] | undefined,
      createdBy: row.created_by as UUID,
      updatedBy: row.updated_by as UUID | undefined,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string | undefined,
      version: row.version as number,
    };
  }

  /**
   * Maps an ExpenseEntry entity to a database row
   */
  protected mapEntityToRow(entity: Partial<ExpenseEntry>): Record<string, unknown> {
    const row: Record<string, unknown> = {};

    if (entity.employeeId !== undefined) row.employee_id = entity.employeeId;
    if (entity.expenseDate !== undefined) row.expense_date = entity.expenseDate;
    if (entity.category !== undefined) row.category = entity.category;
    if (entity.amount !== undefined) row.amount = entity.amount;
    if (entity.currency !== undefined) row.currency = entity.currency;
    if (entity.description !== undefined) row.description = entity.description;
    if (entity.merchantName !== undefined) row.merchant_name = entity.merchantName;
    if (entity.status !== undefined) row.status = entity.status;
    if (entity.submittedAt !== undefined) row.submitted_at = entity.submittedAt;
    if (entity.approvedBy !== undefined) row.approved_by = entity.approvedBy;
    if (entity.approvedAt !== undefined) row.approved_at = entity.approvedAt;
    if (entity.rejectionReason !== undefined) row.rejection_reason = entity.rejectionReason;
    if (entity.paidAt !== undefined) row.paid_at = entity.paidAt;
    if (entity.paymentMethod !== undefined) row.payment_method = entity.paymentMethod;
    if (entity.paymentReference !== undefined) row.payment_reference = entity.paymentReference;
    if (entity.receiptId !== undefined) row.receipt_id = entity.receiptId;
    if (entity.hasReceipt !== undefined) row.has_receipt = entity.hasReceipt;
    if (entity.organizationId !== undefined) row.organization_id = entity.organizationId;
    if (entity.branchId !== undefined) row.branch_id = entity.branchId;
    if (entity.notes !== undefined) row.notes = entity.notes;
    if (entity.tags !== undefined) row.tags = entity.tags;

    return row;
  }

  /**
   * Find expenses by employee ID
   */
  async findByEmployee(employeeId: UUID, context: UserContext): Promise<ExpenseEntry[]> {
    const query = `
      SELECT * FROM expense_entries
      WHERE employee_id = $1
        AND organization_id = $2
      ORDER BY expense_date DESC, created_at DESC
    `;
    const result = await this.database.query(query, [employeeId, context.organizationId]);
    return result.rows.map((row) => this.mapRowToEntity(row));
  }

  /**
   * Find expenses by status
   */
  async findByStatus(status: ExpenseStatus, context: UserContext): Promise<ExpenseEntry[]> {
    const query = `
      SELECT * FROM expense_entries
      WHERE status = $1
        AND organization_id = $2
      ORDER BY expense_date DESC, created_at DESC
    `;
    const result = await this.database.query(query, [status, context.organizationId]);
    return result.rows.map((row) => this.mapRowToEntity(row));
  }

  /**
   * Find expenses with advanced filtering
   */
  async findWithFilters(filter: ExpenseQueryFilter, context: UserContext): Promise<ExpenseEntry[]> {
    const conditions: string[] = ['organization_id = $1'];
    const parameters: unknown[] = [context.organizationId];
    let paramIndex = 2;

    if (filter.employeeId) {
      conditions.push(`employee_id = $${paramIndex++}`);
      parameters.push(filter.employeeId);
    }

    if (filter.category) {
      conditions.push(`category = $${paramIndex++}`);
      parameters.push(filter.category);
    }

    if (filter.status) {
      conditions.push(`status = $${paramIndex++}`);
      parameters.push(filter.status);
    }

    if (filter.startDate) {
      conditions.push(`expense_date >= $${paramIndex++}`);
      parameters.push(filter.startDate);
    }

    if (filter.endDate) {
      conditions.push(`expense_date <= $${paramIndex++}`);
      parameters.push(filter.endDate);
    }

    if (filter.minAmount !== undefined) {
      conditions.push(`amount >= $${paramIndex++}`);
      parameters.push(filter.minAmount);
    }

    if (filter.maxAmount !== undefined) {
      conditions.push(`amount <= $${paramIndex++}`);
      parameters.push(filter.maxAmount);
    }

    if (filter.branchId) {
      conditions.push(`branch_id = $${paramIndex++}`);
      parameters.push(filter.branchId);
    }

    const query = `
      SELECT * FROM expense_entries
      WHERE ${conditions.join(' AND ')}
      ORDER BY expense_date DESC, created_at DESC
    `;

    const result = await this.database.query(query, parameters);
    return result.rows.map((row) => this.mapRowToEntity(row));
  }

  /**
   * Update expense status
   */
  async updateStatus(
    expenseIds: UUID[],
    status: ExpenseStatus,
    context: UserContext
  ): Promise<void> {
    const query = `
      UPDATE expense_entries
      SET status = $1,
          updated_by = $2,
          updated_at = NOW(),
          version = version + 1
      WHERE id = ANY($3)
        AND organization_id = $4
    `;
    await this.database.query(query, [status, context.userId, expenseIds, context.organizationId]);
  }

  /**
   * Get expense summary statistics
   */
  async getSummary(filter: ExpenseQueryFilter, context: UserContext): Promise<ExpenseSummary> {
    const conditions: string[] = ['organization_id = $1'];
    const parameters: unknown[] = [context.organizationId];
    let paramIndex = 2;

    if (filter.employeeId) {
      conditions.push(`employee_id = $${paramIndex++}`);
      parameters.push(filter.employeeId);
    }

    if (filter.startDate) {
      conditions.push(`expense_date >= $${paramIndex++}`);
      parameters.push(filter.startDate);
    }

    if (filter.endDate) {
      conditions.push(`expense_date <= $${paramIndex++}`);
      parameters.push(filter.endDate);
    }

    if (filter.branchId) {
      conditions.push(`branch_id = $${paramIndex++}`);
      parameters.push(filter.branchId);
    }

    const query = `
      SELECT
        COUNT(*) as total_count,
        SUM(amount) as total_amount,
        category,
        status,
        COUNT(*) FILTER (WHERE status = 'SUBMITTED') as pending_count,
        SUM(amount) FILTER (WHERE status = 'SUBMITTED') as pending_amount,
        COUNT(*) FILTER (WHERE status = 'APPROVED') as approved_count,
        SUM(amount) FILTER (WHERE status = 'APPROVED') as approved_amount,
        COUNT(*) FILTER (WHERE status = 'PAID') as paid_count,
        SUM(amount) FILTER (WHERE status = 'PAID') as paid_amount
      FROM expense_entries
      WHERE ${conditions.join(' AND ')}
      GROUP BY category, status
    `;

    const result = await this.database.query(query, parameters);

    // Process the results into a summary object
    const summary: ExpenseSummary = {
      totalAmount: 0,
      totalCount: 0,
      byCategory: {} as ExpenseSummary['byCategory'],
      byStatus: {} as ExpenseSummary['byStatus'],
      pendingAmount: 0,
      approvedAmount: 0,
      paidAmount: 0,
    };

    for (const row of result.rows) {
      const category = row.category as ExpenseEntry['category'];
      const status = row.status as ExpenseStatus;
      const count = Number.parseInt(row.total_count as string, 10);
      const amount = Number.parseInt(row.total_amount as string, 10) || 0;

      if (!summary.byCategory[category]) {
        summary.byCategory[category] = { count: 0, amount: 0 };
      }

      if (!summary.byStatus[status]) {
        summary.byStatus[status] = { count: 0, amount: 0 };
      }

      summary.byCategory[category].count += count;
      summary.byCategory[category].amount += amount;
      summary.byStatus[status].count += count;
      summary.byStatus[status].amount += amount;
      summary.totalCount += count;
      summary.totalAmount += amount;

      if (row.pending_amount) {
        summary.pendingAmount += Number.parseInt(row.pending_amount as string, 10);
      }
      if (row.approved_amount) {
        summary.approvedAmount += Number.parseInt(row.approved_amount as string, 10);
      }
      if (row.paid_amount) {
        summary.paidAmount += Number.parseInt(row.paid_amount as string, 10);
      }
    }

    return summary;
  }
}
