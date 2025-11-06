/**
 * @care-commons/mileage-expense-tracking
 *
 * Comprehensive mileage and expense tracking system for staff reimbursements.
 * Supports expense management, mileage tracking, receipt uploads, and approval workflows.
 *
 * @module @care-commons/mileage-expense-tracking
 */

// ============================================================================
// Type Definitions
// ============================================================================

export type {
  // Expense types
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
  // Mileage types
  MileageEntry,
  MileageRate,
  MileageRateType,
  DistanceUnit,
  CreateMileageEntryInput,
  UpdateMileageEntryInput,
  CreateMileageRateInput,
  MileageQueryFilter,
  MileageSummary,
  // Receipt types
  Receipt,
  ReceiptFileType,
  ReceiptStatus,
  UploadReceiptInput,
  UpdateReceiptInput,
  VerifyReceiptInput,
  RejectReceiptInput,
  ReceiptQueryFilter,
  ReceiptStatistics,
} from './types/index.js';

// ============================================================================
// Repository Layer
// ============================================================================

export { ExpenseRepository } from './repository/expense-repository.js';
export { MileageRepository, MileageRateRepository } from './repository/mileage-repository.js';
export { ReceiptRepository } from './repository/receipt-repository.js';

// ============================================================================
// Service Layer
// ============================================================================

export { ExpenseService } from './service/expense-service.js';
export { MileageService } from './service/mileage-service.js';
export { ReceiptService } from './service/receipt-service.js';

// ============================================================================
// Utility Functions
// ============================================================================

export {
  // Mileage calculator utilities
  milesToKilometers,
  kilometersToMiles,
  convertDistance,
  calculateMileageAmount,
  calculateTotalDistance,
  calculateTotalAmount,
  isDistanceReasonable,
  formatDistance,
  formatAmount,
  calculateOdometerDistance,
  estimateDriveTime,
  IRS_STANDARD_RATES,
  getIRSStandardRate,
  // Expense validator utilities
  validateExpenseAmount,
  validateDescription,
  validateMerchantName,
  validateExpenseDate,
  validateCurrency,
  isReceiptRequired,
  validateCategory,
  validateExpense,
  formatCurrency,
  calculateTotalExpenses,
} from './utils/index.js';

export type { ValidationResult } from './utils/expense-validator.js';

// ============================================================================
// Route Handlers
// ============================================================================

export { createExpenseHandlers } from './routes/expense-handlers.js';
export { createMileageHandlers } from './routes/mileage-handlers.js';
export { createReceiptHandlers } from './routes/receipt-handlers.js';
