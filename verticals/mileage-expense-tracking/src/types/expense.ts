import type { Entity, UUID, Timestamp } from '@care-commons/core';

/**
 * Expense category types
 */
export type ExpenseCategory =
  | 'MILEAGE'
  | 'MEALS'
  | 'LODGING'
  | 'SUPPLIES'
  | 'TRAINING'
  | 'EQUIPMENT'
  | 'TRAVEL'
  | 'OTHER';

/**
 * Expense status types
 */
export type ExpenseStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'PAID';

/**
 * Payment method types
 */
export type PaymentMethod =
  | 'DIRECT_DEPOSIT'
  | 'CHECK'
  | 'PAYROLL'
  | 'CASH';

/**
 * Expense entry entity representing a single expense claim
 */
export interface ExpenseEntry extends Entity {
  // Employee information
  employeeId: UUID;

  // Expense details
  expenseDate: Timestamp;
  category: ExpenseCategory;
  amount: number; // In cents
  currency: string; // ISO 4217 currency code (e.g., 'USD')
  description: string;
  merchantName?: string;

  // Status and approval
  status: ExpenseStatus;
  submittedAt?: Timestamp;
  approvedBy?: UUID;
  approvedAt?: Timestamp;
  rejectionReason?: string;

  // Payment information
  paidAt?: Timestamp;
  paymentMethod?: PaymentMethod;
  paymentReference?: string;

  // Receipt information
  receiptId?: UUID;
  hasReceipt: boolean;

  // Metadata
  organizationId: UUID;
  branchId: UUID;
  notes?: string;
  tags?: string[];
}

/**
 * Input for creating a new expense entry
 */
export interface CreateExpenseEntryInput {
  employeeId: UUID;
  expenseDate: Timestamp;
  category: ExpenseCategory;
  amount: number;
  currency?: string;
  description: string;
  merchantName?: string;
  receiptId?: UUID;
  notes?: string;
  tags?: string[];
}

/**
 * Input for updating an expense entry
 */
export interface UpdateExpenseEntryInput {
  expenseDate?: Timestamp;
  category?: ExpenseCategory;
  amount?: number;
  currency?: string;
  description?: string;
  merchantName?: string;
  receiptId?: UUID;
  notes?: string;
  tags?: string[];
}

/**
 * Input for submitting an expense entry for approval
 */
export interface SubmitExpenseInput {
  expenseIds: UUID[];
}

/**
 * Input for approving an expense entry
 */
export interface ApproveExpenseInput {
  expenseIds: UUID[];
  notes?: string;
}

/**
 * Input for rejecting an expense entry
 */
export interface RejectExpenseInput {
  expenseIds: UUID[];
  rejectionReason: string;
}

/**
 * Input for marking an expense as paid
 */
export interface MarkExpensePaidInput {
  expenseIds: UUID[];
  paymentMethod: PaymentMethod;
  paymentReference?: string;
  paidAt?: Timestamp;
}

/**
 * Filter criteria for querying expenses
 */
export interface ExpenseQueryFilter {
  employeeId?: UUID;
  category?: ExpenseCategory;
  status?: ExpenseStatus;
  startDate?: Timestamp;
  endDate?: Timestamp;
  minAmount?: number;
  maxAmount?: number;
  organizationId?: UUID;
  branchId?: UUID;
}

/**
 * Summary statistics for expenses
 */
export interface ExpenseSummary {
  totalAmount: number;
  totalCount: number;
  byCategory: Record<ExpenseCategory, { count: number; amount: number }>;
  byStatus: Record<ExpenseStatus, { count: number; amount: number }>;
  pendingAmount: number;
  approvedAmount: number;
  paidAmount: number;
}
