/**
 * Type definitions for Mileage & Expense Tracking vertical
 */

// Export all expense-related types
export type {
  ExpenseEntry,
  ExpenseCategory,
  ExpenseStatus,
  PaymentMethod,
  CreateExpenseEntryInput,
  UpdateExpenseEntryInput,
  SubmitExpenseInput,
  ApproveExpenseInput,
  RejectExpenseInput,
  MarkExpensePaidInput,
  ExpenseQueryFilter,
  ExpenseSummary,
} from './expense.js';

// Export all mileage-related types
export type {
  MileageEntry,
  MileageRate,
  MileageRateType,
  DistanceUnit,
  CreateMileageEntryInput,
  UpdateMileageEntryInput,
  CreateMileageRateInput,
  MileageQueryFilter,
  MileageSummary,
} from './mileage.js';

// Export all receipt-related types
export type {
  Receipt,
  ReceiptFileType,
  ReceiptStatus,
  UploadReceiptInput,
  UpdateReceiptInput,
  VerifyReceiptInput,
  RejectReceiptInput,
  ReceiptQueryFilter,
  ReceiptStatistics,
} from './receipt.js';
