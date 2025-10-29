/**
 * Tax calculation utilities
 * 
 * Implements federal and state income tax withholding calculations
 * Based on IRS Publication 15-T (2024) and state-specific formulas
 */

import { TaxConfiguration, TaxCalculationResult, FederalFilingStatus } from '../types/payroll';
import { roundToTwoDecimals } from './pay-calculations';

// 2024 Social Security and Medicare rates
const SOCIAL_SECURITY_RATE = 0.062; // 6.2%
const SOCIAL_SECURITY_WAGE_BASE = 168600; // 2024 wage base
const MEDICARE_RATE = 0.0145; // 1.45%
const ADDITIONAL_MEDICARE_RATE = 0.009; // 0.9%
const ADDITIONAL_MEDICARE_THRESHOLD = 200000; // Single threshold

/**
 * Calculate federal income tax withholding using 2020+ W-4 format
 * Based on IRS Publication 15-T percentage method
 */
export function calculateFederalIncomeTax(
  grossPay: number,
  payPeriodType: 'WEEKLY' | 'BI_WEEKLY' | 'SEMI_MONTHLY' | 'MONTHLY',
  taxConfig: TaxConfiguration
): number {
  if (taxConfig.federalExempt) {
    return 0;
  }

  // Step 1: Adjust gross pay for W-4 Step 2 (multiple jobs)
  let adjustedPay = grossPay;

  // Step 2: Add other income (W-4 Step 4a)
  if (taxConfig.w4Step4aOtherIncome > 0) {
    const periodsPerYear = getPayPeriodsPerYear(payPeriodType);
    adjustedPay += taxConfig.w4Step4aOtherIncome / periodsPerYear;
  }

  // Step 3: Subtract dependent credit (W-4 Step 3)
  if (taxConfig.w4Step3Dependents > 0) {
    const periodsPerYear = getPayPeriodsPerYear(payPeriodType);
    adjustedPay -= taxConfig.w4Step3Dependents / periodsPerYear;
  }

  // Step 4: Subtract deductions (W-4 Step 4b)
  if (taxConfig.w4Step4bDeductions > 0) {
    const periodsPerYear = getPayPeriodsPerYear(payPeriodType);
    adjustedPay -= taxConfig.w4Step4bDeductions / periodsPerYear;
  }

  // Calculate tentative withholding using tax brackets
  const tentativeWithholding = calculateFederalWithholding(
    adjustedPay,
    payPeriodType,
    taxConfig.federalFilingStatus
  );

  // Step 5: Add extra withholding (W-4 Step 4c)
  const totalWithholding = tentativeWithholding + (taxConfig.w4Step4cExtraWithholding || 0);

  return roundToTwoDecimals(Math.max(0, totalWithholding));
}

/**
 * Calculate federal withholding using tax brackets
 * 2024 tax brackets (adjusted for pay period)
 */
function calculateFederalWithholding(
  adjustedPay: number,
  payPeriodType: 'WEEKLY' | 'BI_WEEKLY' | 'SEMI_MONTHLY' | 'MONTHLY',
  filingStatus: FederalFilingStatus
): number {
  const annualPay = adjustedPay * getPayPeriodsPerYear(payPeriodType);

  // 2024 tax brackets
  const brackets = getFederalTaxBrackets(filingStatus);

  let tax = 0;
  let previousBracket = 0;

  for (const bracket of brackets) {
    if (annualPay <= previousBracket) {
      break;
    }

    const taxableInBracket = Math.min(annualPay, bracket.limit) - previousBracket;
    tax += taxableInBracket * bracket.rate;
    previousBracket = bracket.limit;

    if (annualPay <= bracket.limit) {
      break;
    }
  }

  // Convert annual tax back to pay period tax
  const periodicTax = tax / getPayPeriodsPerYear(payPeriodType);
  return roundToTwoDecimals(periodicTax);
}

/**
 * Get federal tax brackets for 2024
 */
function getFederalTaxBrackets(filingStatus: FederalFilingStatus): Array<{
  rate: number;
  limit: number;
}> {
  // 2024 federal tax brackets
  switch (filingStatus) {
    case 'SINGLE':
      return [
        { rate: 0.10, limit: 11600 },
        { rate: 0.12, limit: 47150 },
        { rate: 0.22, limit: 100525 },
        { rate: 0.24, limit: 191950 },
        { rate: 0.32, limit: 243725 },
        { rate: 0.35, limit: 609350 },
        { rate: 0.37, limit: Infinity },
      ];

    case 'MARRIED_JOINTLY':
    case 'QUALIFYING_WIDOW':
      return [
        { rate: 0.10, limit: 23200 },
        { rate: 0.12, limit: 94300 },
        { rate: 0.22, limit: 201050 },
        { rate: 0.24, limit: 383900 },
        { rate: 0.32, limit: 487450 },
        { rate: 0.35, limit: 731200 },
        { rate: 0.37, limit: Infinity },
      ];

    case 'MARRIED_SEPARATELY':
      return [
        { rate: 0.10, limit: 11600 },
        { rate: 0.12, limit: 47150 },
        { rate: 0.22, limit: 100525 },
        { rate: 0.24, limit: 191950 },
        { rate: 0.32, limit: 243725 },
        { rate: 0.35, limit: 365600 },
        { rate: 0.37, limit: Infinity },
      ];

    case 'HEAD_OF_HOUSEHOLD':
      return [
        { rate: 0.10, limit: 16550 },
        { rate: 0.12, limit: 63100 },
        { rate: 0.22, limit: 100500 },
        { rate: 0.24, limit: 191950 },
        { rate: 0.32, limit: 243700 },
        { rate: 0.35, limit: 609350 },
        { rate: 0.37, limit: Infinity },
      ];

    default:
      return getFederalTaxBrackets('SINGLE');
  }
}

/**
 * Calculate Social Security tax (FICA)
 */
export function calculateSocialSecurityTax(
  grossPay: number,
  ytdGrossPay: number
): number {
  // Check if already at wage base
  if (ytdGrossPay >= SOCIAL_SECURITY_WAGE_BASE) {
    return 0;
  }

  // Check if this payment will exceed wage base
  const taxableWages = Math.min(
    grossPay,
    SOCIAL_SECURITY_WAGE_BASE - ytdGrossPay
  );

  return roundToTwoDecimals(taxableWages * SOCIAL_SECURITY_RATE);
}

/**
 * Calculate Medicare tax
 */
export function calculateMedicareTax(grossPay: number): number {
  return roundToTwoDecimals(grossPay * MEDICARE_RATE);
}

/**
 * Calculate Additional Medicare Tax (for high earners)
 */
export function calculateAdditionalMedicareTax(
  grossPay: number,
  ytdGrossPay: number
): number {
  // Only applies when YTD exceeds threshold
  if (ytdGrossPay < ADDITIONAL_MEDICARE_THRESHOLD) {
    const exceedsThreshold = (ytdGrossPay + grossPay) > ADDITIONAL_MEDICARE_THRESHOLD;
    if (!exceedsThreshold) {
      return 0;
    }

    // Only tax the amount over threshold
    const taxableAmount = (ytdGrossPay + grossPay) - ADDITIONAL_MEDICARE_THRESHOLD;
    return roundToTwoDecimals(taxableAmount * ADDITIONAL_MEDICARE_RATE);
  }

  // Already over threshold, tax entire amount
  return roundToTwoDecimals(grossPay * ADDITIONAL_MEDICARE_RATE);
}

/**
 * Calculate state income tax
 * Simplified version - real implementation would have state-specific formulas
 */
export function calculateStateIncomeTax(
  grossPay: number,
  stateCode: string,
  taxConfig: TaxConfiguration
): number {
  if (taxConfig.stateExempt) {
    return 0;
  }

  // State-specific calculations
  const rate = getStateWithholdingRate(stateCode);
  const tax = grossPay * rate;

  // Add extra withholding if specified
  const totalTax = tax + taxConfig.stateExtraWithholding;

  return roundToTwoDecimals(Math.max(0, totalTax));
}

/**
 * Get state withholding rate
 * Simplified - real implementation would use actual state formulas
 */
function getStateWithholdingRate(
  stateCode: string
): number {
  // Simplified state rates (real implementation would use state brackets)
  const stateRates: Record<string, number> = {
    'TX': 0.0, // Texas has no state income tax
    'FL': 0.0, // Florida has no state income tax
    'CA': 0.05, // California simplified
    'NY': 0.04, // New York simplified
    'IL': 0.0495, // Illinois flat tax
    'PA': 0.0307, // Pennsylvania flat tax
    // Add more states as needed
  };

  return stateRates[stateCode] || 0.03; // Default 3% if state not found
}

/**
 * Calculate all taxes
 */
export function calculateAllTaxes(
  grossPay: number,
  ytdGrossPay: number,
  payPeriodType: 'WEEKLY' | 'BI_WEEKLY' | 'SEMI_MONTHLY' | 'MONTHLY',
  taxConfig: TaxConfiguration
): TaxCalculationResult {
  const federalIncomeTax = calculateFederalIncomeTax(
    grossPay,
    payPeriodType,
    taxConfig
  );

  const socialSecurityTax = calculateSocialSecurityTax(grossPay, ytdGrossPay);
  const medicareTax = calculateMedicareTax(grossPay);
  const additionalMedicareTax = calculateAdditionalMedicareTax(grossPay, ytdGrossPay);

  const stateIncomeTax = calculateStateIncomeTax(
    grossPay,
    taxConfig.stateResidence,
    taxConfig
  );

  // Local tax calculation would go here
  const localIncomeTax = taxConfig.localTaxJurisdiction && !taxConfig.localExempt
    ? calculateLocalIncomeTax(grossPay, taxConfig.localTaxJurisdiction)
    : 0;

  const totalTax =
    federalIncomeTax +
    stateIncomeTax +
    localIncomeTax +
    socialSecurityTax +
    medicareTax +
    additionalMedicareTax;

  return {
    federalIncomeTax,
    stateIncomeTax,
    localIncomeTax,
    socialSecurityTax,
    medicareTax,
    additionalMedicareTax,
    totalTax: roundToTwoDecimals(totalTax),
  };
}

/**
 * Calculate local income tax
 * Simplified - would use actual local tax rules
 */
function calculateLocalIncomeTax(
  grossPay: number,
  jurisdiction: string
): number {
  // Simplified local tax rates
  const localRates: Record<string, number> = {
    'NYC': 0.03876, // New York City
    'PHL': 0.03792, // Philadelphia
    'DET': 0.024, // Detroit
    // Add more jurisdictions as needed
  };

  const rate = localRates[jurisdiction] || 0;
  return roundToTwoDecimals(grossPay * rate);
}

/**
 * Get number of pay periods per year
 */
function getPayPeriodsPerYear(
  payPeriodType: 'WEEKLY' | 'BI_WEEKLY' | 'SEMI_MONTHLY' | 'MONTHLY'
): number {
  const periods = {
    WEEKLY: 52,
    BI_WEEKLY: 26,
    SEMI_MONTHLY: 24,
    MONTHLY: 12,
  };

  return periods[payPeriodType];
}

/**
 * Calculate supplemental wage withholding
 * Used for bonuses, commissions, etc.
 * Can use flat rate method or aggregate method
 */
export function calculateSupplementalWithholding(
  supplementalAmount: number,
  useFlatRate: boolean = true
): number {
  if (useFlatRate) {
    // IRS flat rate for supplemental wages: 22% (or 37% if over $1 million)
    const rate = supplementalAmount > 1000000 ? 0.37 : 0.22;
    return roundToTwoDecimals(supplementalAmount * rate);
  }

  // Aggregate method would combine with regular wages and recalculate
  // Not implemented here for simplicity
  return 0;
}

/**
 * Estimate quarterly tax liability for 941 filing
 */
export function estimateQuarterlyTaxLiability(
  totalGrossWages: number,
  totalFederalWithheld: number
): {
  employerSocialSecurity: number;
  employerMedicare: number;
  totalEmployerTaxes: number;
  totalDeposits: number;
} {
  const employerSocialSecurity = roundToTwoDecimals(
    Math.min(totalGrossWages, SOCIAL_SECURITY_WAGE_BASE) * SOCIAL_SECURITY_RATE
  );

  const employerMedicare = roundToTwoDecimals(totalGrossWages * MEDICARE_RATE);

  const totalEmployerTaxes = employerSocialSecurity + employerMedicare;

  // Total deposits include withheld taxes plus employer portion
  const totalDeposits =
    totalFederalWithheld +
    (employerSocialSecurity * 2) + // Employee + employer
    (employerMedicare * 2); // Employee + employer

  return {
    employerSocialSecurity,
    employerMedicare,
    totalEmployerTaxes: roundToTwoDecimals(totalEmployerTaxes),
    totalDeposits: roundToTwoDecimals(totalDeposits),
  };
}
