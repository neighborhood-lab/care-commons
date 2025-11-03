/**
 * Pay calculation utilities
 *
 * Handles overtime calculations, rate multipliers, and earnings computations
 */

import { OvertimeCalculationResult, PayRateMultiplier } from '../types/payroll';

/**
 * Calculate overtime hours based on weekly threshold
 * Standard overtime rules: >40 hours/week = overtime at 1.5x
 */
export function calculateOvertimeHours(
  totalHours: number,
  regularThreshold: number = 40,
  doubleTimeThreshold?: number
): { regular: number; overtime: number; doubleTime: number } {
  if (totalHours <= regularThreshold) {
    return {
      regular: totalHours,
      overtime: 0,
      doubleTime: 0,
    };
  }

  if (doubleTimeThreshold && totalHours > doubleTimeThreshold) {
    return {
      regular: regularThreshold,
      overtime: doubleTimeThreshold - regularThreshold,
      doubleTime: totalHours - doubleTimeThreshold,
    };
  }

  return {
    regular: regularThreshold,
    overtime: totalHours - regularThreshold,
    doubleTime: 0,
  };
}

/**
 * Calculate pay for regular, overtime, and double time hours
 */
export function calculateOvertimePay(
  regularHours: number,
  overtimeHours: number,
  doubleTimeHours: number,
  regularRate: number,
  overtimeMultiplier: number = 1.5,
  doubleTimeMultiplier: number = 2.0
): OvertimeCalculationResult {
  const overtimeRate = regularRate * overtimeMultiplier;
  const doubleTimeRate = regularRate * doubleTimeMultiplier;

  const regularPay = regularHours * regularRate;
  const overtimePay = overtimeHours * overtimeRate;
  const doubleTimePay = doubleTimeHours * doubleTimeRate;

  return {
    regularHours,
    overtimeHours,
    doubleTimeHours,
    regularPay: roundToTwoDecimals(regularPay),
    overtimePay: roundToTwoDecimals(overtimePay),
    doubleTimePay: roundToTwoDecimals(doubleTimePay),
    totalPay: roundToTwoDecimals(regularPay + overtimePay + doubleTimePay),
  };
}

/**
 * Apply rate multipliers for special shifts (weekend, holiday, etc.)
 */
export function applyRateMultipliers(
  baseRate: number,
  multipliers: Array<{ type: string; multiplier: number }>
): { finalRate: number; appliedMultipliers: PayRateMultiplier[] } {
  let finalRate = baseRate;
  const appliedMultipliers: PayRateMultiplier[] = [];

  for (const mult of multipliers) {
    const appliedAmount = baseRate * (mult.multiplier - 1);
    finalRate += appliedAmount;

    appliedMultipliers.push({
      multiplierType: mult.type,
      multiplier: mult.multiplier,
      baseRate,
      appliedAmount: roundToTwoDecimals(appliedAmount),
    });
  }

  return {
    finalRate: roundToTwoDecimals(finalRate),
    appliedMultipliers,
  };
}

/**
 * Calculate daily overtime for states with daily OT rules (e.g., California)
 */
export function calculateDailyOvertime(
  dailyHours: number,
  dailyThreshold: number = 8,
  doubleTimeThreshold: number = 12
): { regular: number; overtime: number; doubleTime: number } {
  if (dailyHours <= dailyThreshold) {
    return {
      regular: dailyHours,
      overtime: 0,
      doubleTime: 0,
    };
  }

  if (dailyHours > doubleTimeThreshold) {
    return {
      regular: dailyThreshold,
      overtime: doubleTimeThreshold - dailyThreshold,
      doubleTime: dailyHours - doubleTimeThreshold,
    };
  }

  return {
    regular: dailyThreshold,
    overtime: dailyHours - dailyThreshold,
    doubleTime: 0,
  };
}

/**
 * Calculate PTO accrual based on hours worked
 */
export function calculatePTOAccrual(
  hoursWorked: number,
  accrualRate: number // Hours of PTO per hour worked (e.g., 0.0385 = 1 hour PTO per 26 hours worked)
): number {
  return roundToTwoDecimals(hoursWorked * accrualRate);
}

/**
 * Calculate blended overtime rate for employees working at multiple rates
 * Used when an employee works at different pay rates in the same week
 */
export function calculateBlendedOvertimeRate(
  regularEarnings: number,
  regularHours: number,
  overtimeMultiplier: number = 1.5
): number {
  if (regularHours === 0) return 0;

  const regularRate = regularEarnings / regularHours;
  const overtimeRate = regularRate * overtimeMultiplier;

  return roundToTwoDecimals(overtimeRate);
}

/**
 * Calculate live-in care overtime (different rules apply)
 * Live-in caregivers may have different overtime thresholds
 */
export function calculateLiveInOvertime(
  hoursWorked: number,
  threshold: number = 44, // Many states use 44-hour threshold for live-in
  rate: number
): OvertimeCalculationResult {
  const { regular, overtime, doubleTime } = calculateOvertimeHours(hoursWorked, threshold);

  return calculateOvertimePay(regular, overtime, doubleTime, rate);
}

/**
 * Round to two decimal places for currency
 */
export function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Calculate total compensation including all pay types
 */
export function calculateTotalCompensation(earnings: {
  regularPay: number;
  overtimePay: number;
  doubleTimePay: number;
  ptoPay: number;
  holidayPay: number;
  sickPay: number;
  otherPay: number;
  bonuses: number;
  commissions: number;
  reimbursements: number;
  otherEarnings: number;
}): number {
  const total =
    earnings.regularPay +
    earnings.overtimePay +
    earnings.doubleTimePay +
    earnings.ptoPay +
    earnings.holidayPay +
    earnings.sickPay +
    earnings.otherPay +
    earnings.bonuses +
    earnings.commissions +
    earnings.reimbursements +
    earnings.otherEarnings;

  return roundToTwoDecimals(total);
}

/**
 * Calculate seventh consecutive day overtime (California rule)
 */
export function calculateSeventhDayOvertime(hoursOnSeventhDay: number): {
  regular: number;
  overtime: number;
  doubleTime: number;
} {
  // In California, 7th consecutive workday: first 8 hours at 1.5x, over 8 at 2x
  if (hoursOnSeventhDay <= 0) {
    return { regular: 0, overtime: 0, doubleTime: 0 };
  }

  if (hoursOnSeventhDay <= 8) {
    return {
      regular: 0,
      overtime: hoursOnSeventhDay,
      doubleTime: 0,
    };
  }

  return {
    regular: 0,
    overtime: 8,
    doubleTime: hoursOnSeventhDay - 8,
  };
}

/**
 * Prorate annual salary to pay period
 */
export function prorateSalary(
  annualSalary: number,
  payPeriodType: 'WEEKLY' | 'BI_WEEKLY' | 'SEMI_MONTHLY' | 'MONTHLY'
): number {
  const periods = {
    WEEKLY: 52,
    BI_WEEKLY: 26,
    SEMI_MONTHLY: 24,
    MONTHLY: 12,
  };

  return roundToTwoDecimals(annualSalary / periods[payPeriodType]);
}

/**
 * Calculate on-call pay
 * Typically paid at a lower rate for hours on-call but not actively working
 */
export function calculateOnCallPay(onCallHours: number, onCallRate: number): number {
  return roundToTwoDecimals(onCallHours * onCallRate);
}

/**
 * Calculate shift differential
 * Additional pay for working less desirable shifts (night, weekend, etc.)
 */
export function calculateShiftDifferential(
  hours: number,
  differentialAmount: number // Fixed amount per hour
): number {
  return roundToTwoDecimals(hours * differentialAmount);
}
