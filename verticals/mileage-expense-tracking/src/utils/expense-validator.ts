import type { ExpenseCategory } from '../types/expense.js';

/**
 * Utility functions for expense validation
 */

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate expense amount
 */
export function validateExpenseAmount(
  amount: number,
  category: ExpenseCategory,
  organizationLimits?: Record<ExpenseCategory, number>
): ValidationResult {
  const errors: string[] = [];

  // Check if amount is positive
  if (amount <= 0) {
    errors.push('Amount must be positive');
  }

  // Check if amount is reasonable (not too large)
  const maxReasonableAmount = 1_000_000; // $10,000 in cents
  if (amount > maxReasonableAmount) {
    errors.push('Amount exceeds maximum allowed limit');
  }

  // Check category-specific limits if provided
  if (organizationLimits && organizationLimits[category]) {
    if (amount > organizationLimits[category]) {
      errors.push(
        `Amount exceeds category limit of $${(organizationLimits[category] / 100).toFixed(2)}`
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate expense description
 */
export function validateDescription(description: string): ValidationResult {
  const errors: string[] = [];

  if (!description || description.trim().length === 0) {
    errors.push('Description is required');
  }

  if (description.length > 500) {
    errors.push('Description must be 500 characters or less');
  }

  if (description.trim().length < 3) {
    errors.push('Description must be at least 3 characters');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate merchant name
 */
export function validateMerchantName(merchantName: string | undefined): ValidationResult {
  const errors: string[] = [];

  if (merchantName && merchantName.length > 200) {
    errors.push('Merchant name must be 200 characters or less');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate expense date
 */
export function validateExpenseDate(expenseDate: string): ValidationResult {
  const errors: string[] = [];

  const date = new Date(expenseDate);
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  // Check if date is valid
  if (Number.isNaN(date.getTime())) {
    errors.push('Invalid expense date');
    return { isValid: false, errors };
  }

  // Check if date is not in the future
  if (date > today) {
    errors.push('Expense date cannot be in the future');
  }

  // Check if date is not too old (e.g., more than 1 year ago)
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  if (date < oneYearAgo) {
    errors.push('Expense date cannot be more than 1 year in the past');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate currency code (ISO 4217)
 */
export function validateCurrency(currency: string): ValidationResult {
  const errors: string[] = [];

  // Common currency codes
  const validCurrencies = [
    'USD',
    'EUR',
    'GBP',
    'CAD',
    'AUD',
    'JPY',
    'CNY',
    'INR',
    'MXN',
    'BRL',
  ];

  if (!validCurrencies.includes(currency.toUpperCase())) {
    errors.push(`Unsupported currency: ${currency}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Check if expense category requires receipt
 */
export function isReceiptRequired(
  category: ExpenseCategory,
  amount: number,
  receiptThreshold = 2500 // $25 in cents
): boolean {
  // Always require receipt for certain categories
  const alwaysRequireReceipt: ExpenseCategory[] = ['LODGING', 'EQUIPMENT', 'TRAVEL'];

  if (alwaysRequireReceipt.includes(category)) {
    return true;
  }

  // Require receipt if amount exceeds threshold
  return amount >= receiptThreshold;
}

/**
 * Validate expense category
 */
export function validateCategory(category: string): ValidationResult {
  const errors: string[] = [];

  const validCategories: ExpenseCategory[] = [
    'MILEAGE',
    'MEALS',
    'LODGING',
    'SUPPLIES',
    'TRAINING',
    'EQUIPMENT',
    'TRAVEL',
    'OTHER',
  ];

  if (!validCategories.includes(category as ExpenseCategory)) {
    errors.push(`Invalid expense category: ${category}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate complete expense entry
 */
export function validateExpense(expense: {
  amount: number;
  category: ExpenseCategory;
  description: string;
  expenseDate: string;
  currency?: string;
  merchantName?: string;
  hasReceipt: boolean;
}): ValidationResult {
  const errors: string[] = [];

  // Validate amount
  const amountValidation = validateExpenseAmount(expense.amount, expense.category);
  errors.push(...amountValidation.errors);

  // Validate description
  const descriptionValidation = validateDescription(expense.description);
  errors.push(...descriptionValidation.errors);

  // Validate expense date
  const dateValidation = validateExpenseDate(expense.expenseDate);
  errors.push(...dateValidation.errors);

  // Validate currency
  if (expense.currency) {
    const currencyValidation = validateCurrency(expense.currency);
    errors.push(...currencyValidation.errors);
  }

  // Validate merchant name
  if (expense.merchantName) {
    const merchantValidation = validateMerchantName(expense.merchantName);
    errors.push(...merchantValidation.errors);
  }

  // Validate category
  const categoryValidation = validateCategory(expense.category);
  errors.push(...categoryValidation.errors);

  // Check if receipt is required but missing
  if (isReceiptRequired(expense.category, expense.amount) && !expense.hasReceipt) {
    errors.push('Receipt is required for this expense');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Format amount for display
 */
export function formatCurrency(amountInCents: number, currency = 'USD'): string {
  const amount = amountInCents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Calculate total expenses
 */
export function calculateTotalExpenses(amounts: number[]): number {
  return amounts.reduce((sum, amount) => sum + amount, 0);
}
