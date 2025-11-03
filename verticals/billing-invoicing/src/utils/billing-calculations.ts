/**
 * Billing calculation utilities
 *
 * Provides functions for rate calculations, rounding, modifiers,
 * and financial amount computations used across billing operations.
 */

import { UnitType, RoundingRule, BillingModifier, ServiceRate } from '../types/billing';

/**
 * Calculate billable units from duration in minutes
 */
export function calculateUnits(
  durationMinutes: number,
  unitType: UnitType,
  roundingRule?: RoundingRule
): number {
  let units: number;

  switch (unitType) {
    case 'HOUR':
      units = durationMinutes / 60;
      break;
    case 'VISIT':
      units = 1;
      break;
    case 'DAY':
      units = 1;
      break;
    case 'WEEK':
      units = 1;
      break;
    case 'MONTH':
      units = 1;
      break;
    case 'TASK':
      units = 1;
      break;
    case 'MILE':
      // For mileage, caller should pass miles, not minutes
      units = durationMinutes;
      break;
    case 'UNIT':
      units = durationMinutes;
      break;
    default:
      throw new Error(`Unknown unit type: ${unitType}`);
  }

  return roundingRule ? applyRounding(units, roundingRule) : units;
}

/**
 * Apply rounding rule to units
 */
export function applyRounding(units: number, rule: RoundingRule): number {
  switch (rule) {
    case 'NONE':
      return units;
    case 'UP':
      return Math.ceil(units);
    case 'DOWN':
      return Math.floor(units);
    case 'NEAREST':
      return Math.round(units);
    case 'QUARTER_HOUR':
      // Round to nearest 0.25 (15 minutes)
      return Math.ceil(units * 4) / 4;
    case 'HALF_HOUR':
      // Round to nearest 0.5 (30 minutes)
      return Math.ceil(units * 2) / 2;
    default:
      throw new Error(`Unknown rounding rule: ${rule}`);
  }
}

/**
 * Calculate base amount before modifiers
 */
export function calculateBaseAmount(units: number, unitRate: number): number {
  return roundToTwoDecimals(units * unitRate);
}

/**
 * Apply billing modifiers to amount
 */
export function applyModifiers(baseAmount: number, modifiers?: BillingModifier[]): number {
  if (!modifiers || modifiers.length === 0) {
    return baseAmount;
  }

  let amount = baseAmount;

  for (const modifier of modifiers) {
    if (modifier.multiplier !== undefined) {
      amount *= modifier.multiplier;
    }
    if (modifier.addedAmount !== undefined) {
      amount += modifier.addedAmount;
    }
  }

  return roundToTwoDecimals(amount);
}

/**
 * Calculate rate with time-based modifiers
 * Returns the adjusted rate based on service timing
 */
export function calculateRateWithTimeModifiers(
  baseRate: number,
  serviceRate?: ServiceRate,
  options?: {
    isWeekend?: boolean;
    isHoliday?: boolean;
    isNightShift?: boolean;
    isOvertime?: boolean;
  }
): number {
  let rate = baseRate;

  if (options?.isWeekend && serviceRate?.weekendRate) {
    rate *= serviceRate.weekendRate;
  }

  if (options?.isHoliday && serviceRate?.holidayRate) {
    rate *= serviceRate.holidayRate;
  }

  if (options?.isNightShift && serviceRate?.nightRate) {
    rate *= serviceRate.nightRate;
  }

  if (options?.isOvertime && serviceRate?.overtimeRate) {
    rate *= serviceRate.overtimeRate;
  }

  return roundToTwoDecimals(rate);
}

/**
 * Check if a date is a weekend
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday or Saturday
}

/**
 * Check if a date is a US federal holiday
 */
export function isHoliday(date: Date): boolean {
  const month = date.getMonth() + 1; // JavaScript months are 0-indexed
  const day = date.getDate();

  // New Year's Day
  if (month === 1 && day === 1) return true;

  // Martin Luther King Jr. Day (3rd Monday in January)
  if (month === 1 && isNthWeekdayOfMonth(date, 1, 3)) return true;

  // Presidents Day (3rd Monday in February)
  if (month === 2 && isNthWeekdayOfMonth(date, 1, 3)) return true;

  // Memorial Day (Last Monday in May)
  if (month === 5 && isLastWeekdayOfMonth(date, 1)) return true;

  // Juneteenth (June 19)
  if (month === 6 && day === 19) return true;

  // Independence Day (July 4)
  if (month === 7 && day === 4) return true;

  // Labor Day (1st Monday in September)
  if (month === 9 && isNthWeekdayOfMonth(date, 1, 1)) return true;

  // Columbus Day (2nd Monday in October)
  if (month === 10 && isNthWeekdayOfMonth(date, 1, 2)) return true;

  // Veterans Day (November 11)
  if (month === 11 && day === 11) return true;

  // Thanksgiving (4th Thursday in November)
  if (month === 11 && isNthWeekdayOfMonth(date, 4, 4)) return true;

  // Christmas Day (December 25)
  if (month === 12 && day === 25) return true;

  return false;
}

/**
 * Check if date is the nth occurrence of a weekday in the month
 * @param date - The date to check
 * @param weekday - Day of week (0=Sunday, 1=Monday, etc.)
 * @param nth - Which occurrence (1=first, 2=second, etc.)
 */
function isNthWeekdayOfMonth(date: Date, weekday: number, nth: number): boolean {
  if (date.getDay() !== weekday) return false;

  const dayOfMonth = date.getDate();
  const nthStart = (nth - 1) * 7 + 1;
  const nthEnd = nth * 7;

  return dayOfMonth >= nthStart && dayOfMonth <= nthEnd;
}

/**
 * Helper: Check if date is the last occurrence of a weekday in the month
 */
function isLastWeekdayOfMonth(date: Date, weekday: number): boolean {
  if (date.getDay() !== weekday) return false;

  // Check if adding 7 days would push us to next month
  const nextWeek = new Date(date);
  nextWeek.setDate(date.getDate() + 7);

  return nextWeek.getMonth() !== date.getMonth();
}

/**
 * Check if time is during night shift (typically 10 PM - 6 AM)
 */
export function isNightShift(time: Date, nightStart: number = 22, nightEnd: number = 6): boolean {
  const hour = time.getHours();

  if (nightStart > nightEnd) {
    // Night shift crosses midnight (e.g., 10 PM - 6 AM)
    return hour >= nightStart || hour < nightEnd;
  } else {
    // Night shift within same day (unusual, but handle it)
    return hour >= nightStart && hour < nightEnd;
  }
}

/**
 * Calculate tax amount
 */
export function calculateTax(subtotal: number, taxRate: number): number {
  if (taxRate <= 0) return 0;
  return roundToTwoDecimals(subtotal * taxRate);
}

/**
 * Calculate invoice total
 */
export function calculateInvoiceTotal(
  subtotal: number,
  taxAmount: number = 0,
  discountAmount: number = 0,
  adjustmentAmount: number = 0
): number {
  const total = subtotal + taxAmount - discountAmount + adjustmentAmount;
  return roundToTwoDecimals(Math.max(0, total)); // Never negative
}

/**
 * Calculate balance due
 */
export function calculateBalanceDue(totalAmount: number, paidAmount: number): number {
  const balance = totalAmount - paidAmount;
  return roundToTwoDecimals(Math.max(0, balance)); // Never negative
}

/**
 * Round to two decimal places (for currency)
 */
export function roundToTwoDecimals(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Calculate collection rate (percentage)
 */
export function calculateCollectionRate(totalBilled: number, totalPaid: number): number {
  if (totalBilled === 0) return 0;
  return roundToTwoDecimals((totalPaid / totalBilled) * 100);
}

/**
 * Calculate denial rate (percentage)
 */
export function calculateDenialRate(totalClaims: number, deniedClaims: number): number {
  if (totalClaims === 0) return 0;
  return roundToTwoDecimals((deniedClaims / totalClaims) * 100);
}

/**
 * Calculate average payment days
 */
export function calculateAveragePaymentDays(
  invoices: Array<{ invoiceDate: Date; paymentDate: Date }>
): number {
  if (invoices.length === 0) return 0;

  const totalDays = invoices.reduce((sum, invoice) => {
    const days = Math.floor(
      (invoice.paymentDate.getTime() - invoice.invoiceDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    return sum + days;
  }, 0);

  return Math.round(totalDays / invoices.length);
}

/**
 * Check if invoice is past due
 */
export function isInvoicePastDue(dueDate: Date, currentDate: Date = new Date()): boolean {
  return currentDate > dueDate;
}

/**
 * Calculate days past due
 */
export function calculateDaysPastDue(dueDate: Date, currentDate: Date = new Date()): number {
  if (!isInvoicePastDue(dueDate, currentDate)) return 0;

  const days = Math.floor((currentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

  return Math.max(0, days);
}

/**
 * Calculate late fee
 */
export function calculateLateFee(
  balanceDue: number,
  lateFeeRate: number,
  daysPastDue: number,
  gracePeriodDays: number = 0
): number {
  if (daysPastDue <= gracePeriodDays) return 0;
  if (lateFeeRate <= 0) return 0;

  const applicableDays = daysPastDue - gracePeriodDays;
  const dailyRate = lateFeeRate / 365; // Convert annual rate to daily
  const lateFee = balanceDue * dailyRate * applicableDays;

  return roundToTwoDecimals(lateFee);
}

/**
 * Validate amounts for consistency
 */
export function validateInvoiceAmounts(invoice: {
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  adjustmentAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Calculate expected total
  const expectedTotal = calculateInvoiceTotal(
    invoice.subtotal,
    invoice.taxAmount,
    invoice.discountAmount,
    invoice.adjustmentAmount
  );

  if (Math.abs(invoice.totalAmount - expectedTotal) > 0.01) {
    errors.push(`Total amount mismatch: expected ${expectedTotal}, got ${invoice.totalAmount}`);
  }

  // Calculate expected balance
  const expectedBalance = calculateBalanceDue(invoice.totalAmount, invoice.paidAmount);

  if (Math.abs(invoice.balanceDue - expectedBalance) > 0.01) {
    errors.push(`Balance due mismatch: expected ${expectedBalance}, got ${invoice.balanceDue}`);
  }

  // Check for negative amounts where not allowed
  if (invoice.subtotal < 0) {
    errors.push('Subtotal cannot be negative');
  }

  if (invoice.taxAmount < 0) {
    errors.push('Tax amount cannot be negative');
  }

  if (invoice.totalAmount < 0) {
    errors.push('Total amount cannot be negative');
  }

  if (invoice.paidAmount < 0) {
    errors.push('Paid amount cannot be negative');
  }

  if (invoice.balanceDue < 0) {
    errors.push('Balance due cannot be negative');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generate invoice number
 */
export function generateInvoiceNumber(
  organizationCode: string,
  sequence: number,
  year?: number
): string {
  const invoiceYear = year || new Date().getFullYear();
  const paddedSequence = sequence.toString().padStart(6, '0');
  return `INV-${organizationCode}-${invoiceYear}-${paddedSequence}`;
}

/**
 * Generate payment number
 */
export function generatePaymentNumber(
  organizationCode: string,
  sequence: number,
  year?: number
): string {
  const paymentYear = year || new Date().getFullYear();
  const paddedSequence = sequence.toString().padStart(6, '0');
  return `PAY-${organizationCode}-${paymentYear}-${paddedSequence}`;
}

/**
 * Generate claim number
 */
export function generateClaimNumber(
  organizationCode: string,
  sequence: number,
  year?: number
): string {
  const claimYear = year || new Date().getFullYear();
  const paddedSequence = sequence.toString().padStart(6, '0');
  return `CLM-${organizationCode}-${claimYear}-${paddedSequence}`;
}

/**
 * Parse service date range from period
 */
export function getServiceDateRange(
  periodStart: Date,
  periodEnd: Date
): { startDate: Date; endDate: Date } {
  return {
    startDate: new Date(periodStart),
    endDate: new Date(periodEnd),
  };
}

/**
 * Calculate due date from invoice date and payment terms
 */
export function calculateDueDate(invoiceDate: Date, paymentTermsDays: number): Date {
  const dueDate = new Date(invoiceDate);
  dueDate.setDate(dueDate.getDate() + paymentTermsDays);
  return dueDate;
}
