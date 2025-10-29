/**
 * Deduction calculation utilities
 * 
 * Handles all types of payroll deductions including benefits and garnishments
 */

import { Deduction } from '../types/payroll';
import { roundToTwoDecimals } from './pay-calculations';

/**
 * Calculate deduction amount based on method
 */
export function calculateDeductionAmount(
  grossPay: number,
  netPay: number,
  deduction: Deduction
): number {
  let amount: number;

  switch (deduction.calculationMethod) {
    case 'FIXED':
      amount = deduction.amount;
      break;

    case 'PERCENTAGE':
      amount = grossPay * (deduction.percentage! / 100);
      break;

    case 'PERCENTAGE_OF_NET':
      amount = netPay * (deduction.percentage! / 100);
      break;

    case 'GRADUATED':
    case 'FORMULA':
      // These require custom logic based on specific deduction
      amount = deduction.amount;
      break;

    default:
      amount = deduction.amount;
  }

  // Check yearly limit
  if (deduction.hasLimit && deduction.yearlyLimit) {
    const remainingLimit = deduction.yearlyLimit - (deduction.yearToDateAmount || 0);
    amount = Math.min(amount, Math.max(0, remainingLimit));
  }

  return roundToTwoDecimals(amount);
}

/**
 * Calculate garnishment amount with priority and limits
 */
export function calculateGarnishmentAmount(
  grossPay: number,
  taxableIncome: number,
  deduction: Deduction
): number {
  if (!deduction.garnishmentOrder) {
    return calculateDeductionAmount(grossPay, taxableIncome, deduction);
  }

  const order = deduction.garnishmentOrder;
  let disposableIncome = taxableIncome;

  // Calculate maximum garnishment based on type and disposable income
  let maxPercentage: number;

  switch (order.orderType) {
    case 'CHILD_SUPPORT':
    case 'SPOUSAL_SUPPORT':
      // Up to 50-65% depending on circumstances
      maxPercentage = order.maxPercentage || 50;
      break;

    case 'TAX_LEVY':
      // IRS levy - exempt amount varies
      maxPercentage = order.maxPercentage || 100; // Can take everything after exemptions
      break;

    case 'STUDENT_LOAN':
      // Up to 15% for student loans
      maxPercentage = order.maxPercentage || 15;
      break;

    case 'CREDITOR':
    case 'BANKRUPTCY':
      // Up to 25% for creditor garnishments
      maxPercentage = order.maxPercentage || 25;
      break;

    default:
      maxPercentage = order.maxPercentage || 25;
  }

  let amount: number;

  if (deduction.calculationMethod === 'FIXED') {
    amount = order.orderAmount;
  } else {
    amount = disposableIncome * (maxPercentage / 100);
  }

  // Don't exceed remaining balance
  if (order.remainingBalance !== undefined && order.remainingBalance !== null) {
    amount = Math.min(amount, order.remainingBalance);
  }

  return roundToTwoDecimals(Math.max(0, amount));
}

/**
 * Calculate all deductions in proper order
 * Returns deductions with calculated amounts
 */
export function calculateAllDeductions(
  grossPay: number,
  preTaxDeductions: Deduction[],
  postTaxDeductions: Deduction[],
  statutoryDeductions: Deduction[]
): {
  preTaxTotal: number;
  postTaxTotal: number;
  statutoryTotal: number;
  calculatedDeductions: Array<Deduction & { calculatedAmount: number }>;
} {
  const calculatedDeductions: Array<Deduction & { calculatedAmount: number }> = [];
  
  // 1. Calculate pre-tax deductions (reduce taxable income)
  let taxableIncome = grossPay;
  let preTaxTotal = 0;

  for (const deduction of preTaxDeductions) {
    const amount = calculateDeductionAmount(grossPay, taxableIncome, deduction);
    preTaxTotal += amount;
    taxableIncome -= amount;

    calculatedDeductions.push({
      ...deduction,
      calculatedAmount: amount,
    });
  }

  // 2. Calculate statutory deductions (taxes - calculated separately)
  let statutoryTotal = 0;
  for (const deduction of statutoryDeductions) {
    const amount = deduction.amount; // Already calculated by tax service
    statutoryTotal += amount;

    calculatedDeductions.push({
      ...deduction,
      calculatedAmount: amount,
    });
  }

  // 3. Calculate post-tax deductions
  let netPay = taxableIncome - statutoryTotal;
  let postTaxTotal = 0;

  for (const deduction of postTaxDeductions) {
    const amount = deduction.garnishmentOrder
      ? calculateGarnishmentAmount(grossPay, taxableIncome, deduction)
      : calculateDeductionAmount(grossPay, netPay, deduction);
    
    postTaxTotal += amount;
    netPay -= amount;

    calculatedDeductions.push({
      ...deduction,
      calculatedAmount: amount,
    });
  }

  return {
    preTaxTotal: roundToTwoDecimals(preTaxTotal),
    postTaxTotal: roundToTwoDecimals(postTaxTotal),
    statutoryTotal: roundToTwoDecimals(statutoryTotal),
    calculatedDeductions,
  };
}

/**
 * Sort garnishments by legal priority
 */
export function sortGarnishmentsByPriority(garnishments: Deduction[]): Deduction[] {
  const priorityMap: Record<string, number> = {
    'GARNISHMENT_CHILD_SUPPORT': 1,
    'GARNISHMENT_TAX_LEVY': 2,
    'GARNISHMENT_STUDENT_LOAN': 3,
    'GARNISHMENT_CREDITOR': 4,
  };

  return garnishments.sort((a, b) => {
    const aPriority = a.garnishmentOrder?.priority ?? priorityMap[a.deductionType] ?? 999;
    const bPriority = b.garnishmentOrder?.priority ?? priorityMap[b.deductionType] ?? 999;
    return aPriority - bPriority;
  });
}

/**
 * Calculate employer match for retirement contributions
 */
export function calculateEmployerMatch(
  employeeContribution: number,
  matchPercentage: number,
  maxMatchAmount?: number
): number {
  let match = employeeContribution * (matchPercentage / 100);

  if (maxMatchAmount) {
    match = Math.min(match, maxMatchAmount);
  }

  return roundToTwoDecimals(match);
}

/**
 * Check if deduction limit has been reached
 */
export function isDeductionLimitReached(deduction: Deduction): boolean {
  if (!deduction.hasLimit || !deduction.yearlyLimit) {
    return false;
  }

  const ytdAmount = deduction.yearToDateAmount || 0;
  return ytdAmount >= deduction.yearlyLimit;
}

/**
 * Calculate remaining deduction limit
 */
export function getRemainingDeductionLimit(deduction: Deduction): number | null {
  if (!deduction.hasLimit || !deduction.yearlyLimit) {
    return null;
  }

  const ytdAmount = deduction.yearToDateAmount || 0;
  return Math.max(0, deduction.yearlyLimit - ytdAmount);
}

/**
 * Group deductions by category for pay stub display
 */
export function groupDeductionsByCategory(
  deductions: Array<Deduction & { calculatedAmount: number }>
): {
  taxes: Array<Deduction & { calculatedAmount: number }>;
  benefits: Array<Deduction & { calculatedAmount: number }>;
  retirement: Array<Deduction & { calculatedAmount: number }>;
  garnishments: Array<Deduction & { calculatedAmount: number }>;
  other: Array<Deduction & { calculatedAmount: number }>;
} {
  const grouped = {
    taxes: [] as Array<Deduction & { calculatedAmount: number }>,
    benefits: [] as Array<Deduction & { calculatedAmount: number }>,
    retirement: [] as Array<Deduction & { calculatedAmount: number }>,
    garnishments: [] as Array<Deduction & { calculatedAmount: number }>,
    other: [] as Array<Deduction & { calculatedAmount: number }>,
  };

  for (const deduction of deductions) {
    if (deduction.deductionType.includes('TAX') || deduction.deductionType.includes('SECURITY') || 
        deduction.deductionType === 'MEDICARE' || deduction.deductionType === 'ADDITIONAL_MEDICARE') {
      grouped.taxes.push(deduction);
    } else if (deduction.deductionType.includes('INSURANCE')) {
      grouped.benefits.push(deduction);
    } else if (deduction.deductionType.includes('RETIREMENT') || deduction.deductionType.includes('401') ||
               deduction.deductionType.includes('403')) {
      grouped.retirement.push(deduction);
    } else if (deduction.deductionType.includes('GARNISHMENT')) {
      grouped.garnishments.push(deduction);
    } else {
      grouped.other.push(deduction);
    }
  }

  return grouped;
}
