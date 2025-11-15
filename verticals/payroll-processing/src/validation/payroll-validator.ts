/**
 * Payroll validation layer
 *
 * Comprehensive validation for payroll entities and operations
 */

import {
  CreatePayPeriodInput,
  CreateTimeSheetInput,
  AddTimeSheetAdjustmentInput,
  CreatePayRunInput,
  ApprovePayRunInput,
  PayPeriodType,
  PayRunType,
  AdjustmentType,
  PaymentMethod,
  DeductionType,
  DeductionCalculationMethod,
  FederalFilingStatus,
  StateFilingStatus,
} from '../types/payroll';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

/**
 * Validate pay period creation
 */
export function validateCreatePayPeriod(
  input: CreatePayPeriodInput
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!input.organizationId) {
    errors.push('organizationId is required');
  }

  if (!input.periodType) {
    errors.push('periodType is required');
  }

  if (!input.startDate) {
    errors.push('startDate is required');
  }

  if (!input.endDate) {
    errors.push('endDate is required');
  }

  if (!input.payDate) {
    errors.push('payDate is required');
  }

  // Period type validation
  const validPeriodTypes: PayPeriodType[] = [
    'WEEKLY',
    'BI_WEEKLY',
    'SEMI_MONTHLY',
    'MONTHLY',
    'DAILY',
    'CUSTOM',
  ];
  if (input.periodType && !validPeriodTypes.includes(input.periodType)) {
    errors.push(`Invalid period type: ${input.periodType}`);
  }

  // Date validations
  if (input.startDate && input.endDate) {
    const startDate = new Date(input.startDate);
    const endDate = new Date(input.endDate);

    if (startDate >= endDate) {
      errors.push('startDate must be before endDate');
    }

    // Check period length is reasonable
    const diffDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    if (input.periodType === 'WEEKLY' && (diffDays < 6 || diffDays > 8)) {
      warnings.push(`Weekly pay period should be 7 days, but is ${diffDays} days`);
    }

    if (input.periodType === 'BI_WEEKLY' && (diffDays < 13 || diffDays > 15)) {
      warnings.push(`Bi-weekly pay period should be 14 days, but is ${diffDays} days`);
    }

    if (input.periodType === 'SEMI_MONTHLY' && (diffDays < 14 || diffDays > 17)) {
      warnings.push(`Semi-monthly pay period should be 15-16 days, but is ${diffDays} days`);
    }

    if (input.periodType === 'MONTHLY' && (diffDays < 28 || diffDays > 31)) {
      warnings.push(`Monthly pay period should be 28-31 days, but is ${diffDays} days`);
    }

    if (diffDays > 365) {
      errors.push('Pay period cannot exceed 365 days');
    }
  }

  // Pay date validation
  if (input.endDate && input.payDate) {
    const endDate = new Date(input.endDate);
    const payDate = new Date(input.payDate);

    if (payDate < endDate) {
      errors.push('payDate must be on or after endDate');
    }

    const daysAfter = Math.ceil((payDate.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysAfter > 30) {
      warnings.push(`Pay date is ${daysAfter} days after period end - consider shortening`);
    }
  }

  // Cutoff date validation
  if (input.cutoffDate && input.endDate) {
    const cutoffDate = new Date(input.cutoffDate);
    const endDate = new Date(input.endDate);

    if (cutoffDate < endDate) {
      errors.push('cutoffDate must be on or after endDate');
    }
  }

  // Approval deadline validation
  if (input.approvalDeadline && input.payDate) {
    const approvalDeadline = new Date(input.approvalDeadline);
    const payDate = new Date(input.payDate);

    if (approvalDeadline > payDate) {
      errors.push('approvalDeadline must be before or on payDate');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Validate timesheet creation
 */
export function validateCreateTimeSheet(
  input: CreateTimeSheetInput
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!input.organizationId) {
    errors.push('organizationId is required');
  }

  if (!input.branchId) {
    errors.push('branchId is required');
  }

  if (!input.payPeriodId) {
    errors.push('payPeriodId is required');
  }

  if (!input.caregiverId) {
    errors.push('caregiverId is required');
  }

  // At least one of evvRecordIds or visitIds should be provided
  const hasEVVRecords = input.evvRecordIds && input.evvRecordIds.length > 0;
  const hasVisits = input.visitIds && input.visitIds.length > 0;

  if (!hasEVVRecords && !hasVisits) {
    warnings.push('No EVV records or visits provided - timesheet will be empty');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Validate timesheet adjustment
 */
export function validateTimeSheetAdjustment(
  input: AddTimeSheetAdjustmentInput
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!input.timeSheetId) {
    errors.push('timeSheetId is required');
  }

  if (!input.adjustmentType) {
    errors.push('adjustmentType is required');
  }

  if (input.amount === undefined || input.amount === null) {
    errors.push('amount is required');
  }

  if (!input.description) {
    errors.push('description is required');
  }

  if (!input.reason) {
    errors.push('reason is required');
  }

  // Adjustment type validation
  const validAdjustmentTypes: AdjustmentType[] = [
    'BONUS',
    'COMMISSION',
    'REIMBURSEMENT',
    'MILEAGE',
    'CORRECTION',
    'RETROACTIVE',
    'RETENTION',
    'REFERRAL',
    'HOLIDAY_BONUS',
    'SHIFT_DIFFERENTIAL',
    'HAZARD_PAY',
    'OTHER',
  ];

  if (input.adjustmentType && !validAdjustmentTypes.includes(input.adjustmentType)) {
    errors.push(`Invalid adjustment type: ${input.adjustmentType}`);
  }

  // Amount validation
  if (input.amount !== undefined && input.amount !== null) {
    if (isNaN(input.amount)) {
      errors.push('amount must be a valid number');
    }

    // Reasonable limits
    if (Math.abs(input.amount) > 100000) {
      warnings.push(`Adjustment amount $${input.amount.toFixed(2)} is unusually large`);
    }

    // Negative amounts for corrections are allowed
    if (input.amount < 0 && input.adjustmentType !== 'CORRECTION') {
      warnings.push('Negative amounts should typically use adjustmentType=CORRECTION');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Validate pay run creation
 */
export function validateCreatePayRun(
  input: CreatePayRunInput
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!input.organizationId) {
    errors.push('organizationId is required');
  }

  if (!input.payPeriodId) {
    errors.push('payPeriodId is required');
  }

  if (!input.runType) {
    errors.push('runType is required');
  }

  // Run type validation
  const validRunTypes: PayRunType[] = [
    'REGULAR',
    'OFF_CYCLE',
    'CORRECTION',
    'BONUS',
    'FINAL',
    'ADVANCE',
    'RETRO',
  ];

  if (input.runType && !validRunTypes.includes(input.runType)) {
    errors.push(`Invalid run type: ${input.runType}`);
  }

  // Caregiver IDs validation
  if (input.caregiverIds && input.caregiverIds.length === 0) {
    warnings.push('caregiverIds is empty array - no caregivers will be included');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Validate pay run approval
 */
export function validateApprovePayRun(
  input: ApprovePayRunInput
): ValidationResult {
  const errors: string[] = [];

  // Required fields
  if (!input.payRunId) {
    errors.push('payRunId is required');
  }

  if (!input.approvedBy) {
    errors.push('approvedBy is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate payment method
 */
export function validatePaymentMethod(
  paymentMethod: PaymentMethod
): ValidationResult {
  const errors: string[] = [];

  const validMethods: PaymentMethod[] = [
    'DIRECT_DEPOSIT',
    'CHECK',
    'CASH',
    'PAYCARD',
    'WIRE',
    'VENMO',
    'ZELLE',
  ];

  if (!validMethods.includes(paymentMethod)) {
    errors.push(`Invalid payment method: ${paymentMethod}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate deduction type
 */
export function validateDeductionType(
  deductionType: DeductionType
): ValidationResult {
  const errors: string[] = [];

  const validTypes: DeductionType[] = [
    'FEDERAL_INCOME_TAX',
    'STATE_INCOME_TAX',
    'LOCAL_INCOME_TAX',
    'SOCIAL_SECURITY',
    'MEDICARE',
    'ADDITIONAL_MEDICARE',
    'HEALTH_INSURANCE',
    'DENTAL_INSURANCE',
    'VISION_INSURANCE',
    'LIFE_INSURANCE',
    'DISABILITY_INSURANCE',
    'RETIREMENT_401K',
    'RETIREMENT_403B',
    'RETIREMENT_ROTH',
    'HSA',
    'FSA_HEALTHCARE',
    'FSA_DEPENDENT_CARE',
    'COMMUTER_BENEFITS',
    'UNION_DUES',
    'GARNISHMENT_CHILD_SUPPORT',
    'GARNISHMENT_TAX_LEVY',
    'GARNISHMENT_CREDITOR',
    'GARNISHMENT_STUDENT_LOAN',
    'LOAN_REPAYMENT',
    'ADVANCE_REPAYMENT',
    'UNIFORM',
    'EQUIPMENT',
    'OTHER',
  ];

  if (!validTypes.includes(deductionType)) {
    errors.push(`Invalid deduction type: ${deductionType}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate tax withholding configuration
 */
export function validateTaxConfiguration(
  federalFilingStatus: FederalFilingStatus,
  stateFilingStatus: StateFilingStatus,
  stateResidence: string
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Federal filing status validation
  const validFederalStatuses: FederalFilingStatus[] = [
    'SINGLE',
    'MARRIED_JOINTLY',
    'MARRIED_SEPARATELY',
    'HEAD_OF_HOUSEHOLD',
    'QUALIFYING_WIDOW',
  ];

  if (!validFederalStatuses.includes(federalFilingStatus)) {
    errors.push(`Invalid federal filing status: ${federalFilingStatus}`);
  }

  // State filing status validation
  const validStateStatuses: StateFilingStatus[] = [
    'SINGLE',
    'MARRIED',
    'MARRIED_JOINTLY',
    'MARRIED_SEPARATELY',
    'HEAD_OF_HOUSEHOLD',
    'EXEMPT',
  ];

  if (!validStateStatuses.includes(stateFilingStatus)) {
    errors.push(`Invalid state filing status: ${stateFilingStatus}`);
  }

  // State residence validation
  const validStateCodes = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
    'DC', 'PR', 'VI', 'GU', 'AS', 'MP',
  ];

  if (!validStateCodes.includes(stateResidence)) {
    errors.push(`Invalid state residence code: ${stateResidence}`);
  }

  // Texas has no state income tax
  if (stateResidence === 'TX' && stateFilingStatus !== 'EXEMPT') {
    warnings.push('Texas has no state income tax - state filing status should be EXEMPT');
  }

  // States with no income tax
  const noIncomeTaxStates = ['AK', 'FL', 'NV', 'NH', 'SD', 'TN', 'TX', 'WA', 'WY'];
  if (noIncomeTaxStates.includes(stateResidence) && stateFilingStatus !== 'EXEMPT') {
    warnings.push(`${stateResidence} has no state income tax - state filing status should be EXEMPT`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Validate hours worked
 */
export function validateHoursWorked(
  regularHours: number,
  overtimeHours: number,
  doubleTimeHours: number
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for negative hours
  if (regularHours < 0) {
    errors.push('regularHours cannot be negative');
  }

  if (overtimeHours < 0) {
    errors.push('overtimeHours cannot be negative');
  }

  if (doubleTimeHours < 0) {
    errors.push('doubleTimeHours cannot be negative');
  }

  const totalHours = regularHours + overtimeHours + doubleTimeHours;

  // Check for reasonable limits
  if (totalHours === 0) {
    warnings.push('Total hours is zero - no pay will be calculated');
  }

  if (totalHours > 168) {
    errors.push(`Total hours (${totalHours}) exceeds 168 (hours in a week)`);
  }

  if (totalHours > 80 && totalHours <= 168) {
    warnings.push(`Total hours (${totalHours}) is unusually high (>80 per week)`);
  }

  if (regularHours > 40 && overtimeHours === 0) {
    warnings.push('Regular hours exceed 40 with no overtime hours - check overtime calculation');
  }

  if (overtimeHours > 0 && regularHours !== 40) {
    warnings.push('Overtime hours present but regular hours is not 40 - verify calculation');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Validate pay rates
 */
export function validatePayRates(
  regularRate: number,
  overtimeRate: number,
  doubleTimeRate: number
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for negative rates
  if (regularRate < 0) {
    errors.push('regularRate cannot be negative');
  }

  if (overtimeRate < 0) {
    errors.push('overtimeRate cannot be negative');
  }

  if (doubleTimeRate < 0) {
    errors.push('doubleTimeRate cannot be negative');
  }

  // Check for zero rates
  if (regularRate === 0) {
    errors.push('regularRate cannot be zero');
  }

  // Federal minimum wage check (as of 2024)
  const federalMinimumWage = 7.25;
  if (regularRate < federalMinimumWage && regularRate > 0) {
    warnings.push(`regularRate ($${regularRate.toFixed(2)}) is below federal minimum wage ($${federalMinimumWage.toFixed(2)})`);
  }

  // Overtime rate should be 1.5x regular
  const expectedOvertimeRate = regularRate * 1.5;
  if (overtimeRate > 0 && Math.abs(overtimeRate - expectedOvertimeRate) > 0.01) {
    warnings.push(`overtimeRate ($${overtimeRate.toFixed(2)}) does not match 1.5x regular rate ($${expectedOvertimeRate.toFixed(2)})`);
  }

  // Double time rate should be 2x regular
  const expectedDoubleTimeRate = regularRate * 2.0;
  if (doubleTimeRate > 0 && Math.abs(doubleTimeRate - expectedDoubleTimeRate) > 0.01) {
    warnings.push(`doubleTimeRate ($${doubleTimeRate.toFixed(2)}) does not match 2x regular rate ($${expectedDoubleTimeRate.toFixed(2)})`);
  }

  // Unusually high rates
  if (regularRate > 200) {
    warnings.push(`regularRate ($${regularRate.toFixed(2)}/hr) is unusually high`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Validate gross pay calculation
 */
export function validateGrossPayCalculation(
  regularHours: number,
  overtimeHours: number,
  doubleTimeHours: number,
  regularRate: number,
  overtimeRate: number,
  doubleTimeRate: number,
  calculatedGrossPay: number
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const expectedRegularPay = regularHours * regularRate;
  const expectedOvertimePay = overtimeHours * overtimeRate;
  const expectedDoubleTimePay = doubleTimeHours * doubleTimeRate;
  const expectedGrossPay = expectedRegularPay + expectedOvertimePay + expectedDoubleTimePay;

  // Allow for minor rounding differences (1 cent)
  const difference = Math.abs(calculatedGrossPay - expectedGrossPay);

  if (difference > 0.01) {
    errors.push(
      `Gross pay mismatch: calculated=$${calculatedGrossPay.toFixed(2)}, expected=$${expectedGrossPay.toFixed(2)}`
    );
  }

  // Check for reasonable pay amounts
  if (calculatedGrossPay < 0) {
    errors.push('Gross pay cannot be negative');
  }

  if (calculatedGrossPay === 0) {
    warnings.push('Gross pay is zero - no payment will be issued');
  }

  if (calculatedGrossPay > 100000) {
    warnings.push(`Gross pay ($${calculatedGrossPay.toFixed(2)}) is unusually high for a single pay period`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}
