/**
 * Unit tests for pay calculation utilities
 * 
 * Tests overtime calculations, rate multipliers, and earnings computations
 * with realistic scenarios and edge cases
 */

import {
  calculateOvertimeHours,
  calculateOvertimePay,
  applyRateMultipliers,
  calculateDailyOvertime,
  calculatePTOAccrual,
  calculateBlendedOvertimeRate,
  calculateLiveInOvertime,
  roundToTwoDecimals,
  calculateTotalCompensation,
  calculateSeventhDayOvertime,
  prorateSalary,
  calculateOnCallPay,
  calculateShiftDifferential,
} from '../pay-calculations';

describe('Pay Calculation Utilities', () => {
  describe('roundToTwoDecimals', () => {
    it('should round positive numbers correctly', () => {
      expect(roundToTwoDecimals(15.678)).toBe(15.68);
      expect(roundToTwoDecimals(15.674)).toBe(15.67);
      expect(roundToTwoDecimals(15.675)).toBe(15.68);
    });

    it('should round negative numbers correctly', () => {
      expect(roundToTwoDecimals(-15.678)).toBe(-15.68);
      expect(roundToTwoDecimals(-15.674)).toBe(-15.67);
    });

    it('handle whole numbers', () => {
      expect(roundToTwoDecimals(15)).toBe(15);
      expect(roundToTwoDecimals(15.00)).toBe(15);
    });

    it('handle very small numbers', () => {
      expect(roundToTwoDecimals(0.001)).toBe(0);
      expect(roundToTwoDecimals(0.009)).toBe(0.01);
    });
  });

  describe('calculateOvertimeHours', () => {
    it('should return all regular hours when under threshold', () => {
      const result = calculateOvertimeHours(35, 40);
      expect(result).toEqual({
        regular: 35,
        overtime: 0,
        doubleTime: 0,
      });
    });

    it('should calculate overtime when over threshold', () => {
      const result = calculateOvertimeHours(45, 40);
      expect(result).toEqual({
        regular: 40,
        overtime: 5,
        doubleTime: 0,
      });
    });

    it('should calculate double time when over double threshold', () => {
      const result = calculateOvertimeHours(50, 40, 48);
      expect(result).toEqual({
        regular: 40,
        overtime: 8,
        doubleTime: 2,
      });
    });

    it('should handle exactly at threshold', () => {
      const result = calculateOvertimeHours(40, 40);
      expect(result).toEqual({
        regular: 40,
        overtime: 0,
        doubleTime: 0,
      });
    });

    it('should handle zero hours', () => {
      const result = calculateOvertimeHours(0, 40);
      expect(result).toEqual({
        regular: 0,
        overtime: 0,
        doubleTime: 0,
      });
    });

    it('should use default thresholds when not specified', () => {
      const result = calculateOvertimeHours(50);
      expect(result).toEqual({
        regular: 40,
        overtime: 10,
        doubleTime: 0,
      });
    });
  });

  describe('calculateOvertimePay', () => {
    it('should calculate pay with only regular hours', () => {
      const result = calculateOvertimePay(40, 0, 0, 20);
      expect(result).toEqual({
        regularHours: 40,
        overtimeHours: 0,
        doubleTimeHours: 0,
        regularPay: 800,
        overtimePay: 0,
        doubleTimePay: 0,
        totalPay: 800,
      });
    });

    it('should calculate pay with overtime', () => {
      const result = calculateOvertimePay(40, 5, 0, 20);
      expect(result).toEqual({
        regularHours: 40,
        overtimeHours: 5,
        doubleTimeHours: 0,
        regularPay: 800,
        overtimePay: 150, // 5 * 20 * 1.5
        doubleTimePay: 0,
        totalPay: 950,
      });
    });

    it('should calculate pay with double time', () => {
      const result = calculateOvertimePay(40, 8, 2, 20);
      expect(result).toEqual({
        regularHours: 40,
        overtimeHours: 8,
        doubleTimeHours: 2,
        regularPay: 800,
        overtimePay: 240, // 8 * 20 * 1.5
        doubleTimePay: 80, // 2 * 20 * 2
        totalPay: 1120,
      });
    });

    it('should use custom multipliers', () => {
      const result = calculateOvertimePay(40, 5, 0, 20, 1.75, 2.5);
      expect(result.overtimePay).toBe(175); // 5 * 20 * 1.75
    });

    it('should handle zero rate', () => {
      const result = calculateOvertimePay(40, 5, 0, 0);
      expect(result.totalPay).toBe(0);
    });
  });

  describe('applyRateMultipliers', () => {
    it('should return base rate when no multipliers', () => {
      const result = applyRateMultipliers(20, []);
      expect(result).toEqual({
        finalRate: 20,
        appliedMultipliers: [],
      });
    });

    it('should apply single multiplier', () => {
      const result = applyRateMultipliers(20, [{ type: 'WEEKEND', multiplier: 1.2 }]);
      expect(result).toEqual({
        finalRate: 24, // 20 + (20 * 0.2)
        appliedMultipliers: [{
          multiplierType: 'WEEKEND',
          multiplier: 1.2,
          baseRate: 20,
          appliedAmount: 4,
        }],
      });
    });

    it('should apply multiple multipliers', () => {
      const result = applyRateMultipliers(20, [
        { type: 'WEEKEND', multiplier: 1.2 },
        { type: 'NIGHT_SHIFT', multiplier: 1.1 },
      ]);
      expect(result.finalRate).toBe(26); // 20 + 4 + 2
      expect(result.appliedMultipliers).toHaveLength(2);
    });

    it('should handle multiplier less than 1', () => {
      const result = applyRateMultipliers(20, [{ type: 'TRAINING', multiplier: 0.8 }]);
      expect(result.finalRate).toBe(16); // 20 - (20 * 0.2)
    });
  });

  describe('calculateDailyOvertime', () => {
    it('should return all regular hours when under daily threshold', () => {
      const result = calculateDailyOvertime(6, 8, 12);
      expect(result).toEqual({
        regular: 6,
        overtime: 0,
        doubleTime: 0,
      });
    });

    it('should calculate daily overtime', () => {
      const result = calculateDailyOvertime(10, 8, 12);
      expect(result).toEqual({
        regular: 8,
        overtime: 2,
        doubleTime: 0,
      });
    });

    it('should calculate daily double time', () => {
      const result = calculateDailyOvertime(14, 8, 12);
      expect(result).toEqual({
        regular: 8,
        overtime: 4,
        doubleTime: 2,
      });
    });

    it('should use default thresholds', () => {
      const result = calculateDailyOvertime(10);
      expect(result).toEqual({
        regular: 8,
        overtime: 2,
        doubleTime: 0,
      });
    });
  });

  describe('calculatePTOAccrual', () => {
    it('should calculate PTO accrual correctly', () => {
      const result = calculatePTOAccrual(40, 0.0385); // 1 hour PTO per 26 hours worked
      expect(result).toBe(1.54); // 40 * 0.0385
    });

    it('should handle zero hours', () => {
      const result = calculatePTOAccrual(0, 0.0385);
      expect(result).toBe(0);
    });

    it('should handle zero accrual rate', () => {
      const result = calculatePTOAccrual(40, 0);
      expect(result).toBe(0);
    });
  });

  describe('calculateBlendedOvertimeRate', () => {
    it('should calculate blended rate for multiple rates', () => {
      const result = calculateBlendedOvertimeRate(1000, 40); // $25/hr average
      expect(result).toBe(37.5); // 25 * 1.5
    });

    it('should handle zero regular hours', () => {
      const result = calculateBlendedOvertimeRate(1000, 0);
      expect(result).toBe(0);
    });

    it('should use custom multiplier', () => {
      const result = calculateBlendedOvertimeRate(1000, 40, 1.75);
      expect(result).toBe(43.75); // 25 * 1.75
    });
  });

  describe('calculateLiveInOvertime', () => {
    it('should calculate live-in overtime with default threshold', () => {
      const result = calculateLiveInOvertime(50, 44, 20);
      expect(result).toEqual({
        regularHours: 44,
        overtimeHours: 6,
        doubleTimeHours: 0,
        regularPay: 880,
        overtimePay: 180, // 6 * 20 * 1.5
        doubleTimePay: 0,
        totalPay: 1060,
      });
    });

    it('should calculate live-in overtime with double time', () => {
      const result = calculateLiveInOvertime(60, 44, 20);
      expect(result.overtimeHours).toBeGreaterThan(0);
      expect(result.totalPay).toBeGreaterThan(1000);
    });
  });

  describe('calculateTotalCompensation', () => {
    it('should sum all compensation components', () => {
      const earnings = {
        regularPay: 800,
        overtimePay: 150,
        doubleTimePay: 80,
        ptoPay: 200,
        holidayPay: 160,
        sickPay: 120,
        otherPay: 50,
        bonuses: 500,
        commissions: 300,
        reimbursements: 100,
        otherEarnings: 75,
      };
      const result = calculateTotalCompensation(earnings);
      expect(result).toBe(2535);
    });

    it('should handle zero values', () => {
      const earnings = {
        regularPay: 0,
        overtimePay: 0,
        doubleTimePay: 0,
        ptoPay: 0,
        holidayPay: 0,
        sickPay: 0,
        otherPay: 0,
        bonuses: 0,
        commissions: 0,
        reimbursements: 0,
        otherEarnings: 0,
      };
      const result = calculateTotalCompensation(earnings);
      expect(result).toBe(0);
    });
  });

  describe('calculateSeventhDayOvertime', () => {
    it('should calculate seventh day overtime correctly', () => {
      const result = calculateSeventhDayOvertime(6);
      expect(result).toEqual({
        regular: 0,
        overtime: 6,
        doubleTime: 0,
      });
    });

    it('should calculate seventh day double time', () => {
      const result = calculateSeventhDayOvertime(10);
      expect(result).toEqual({
        regular: 0,
        overtime: 8,
        doubleTime: 2,
      });
    });

    it('should handle zero hours', () => {
      const result = calculateSeventhDayOvertime(0);
      expect(result).toEqual({
        regular: 0,
        overtime: 0,
        doubleTime: 0,
      });
    });
  });

  describe('prorateSalary', () => {
    it('should prorate annual salary to weekly', () => {
      const result = prorateSalary(52000, 'WEEKLY');
      expect(result).toBe(1000); // 52000 / 52
    });

    it('should prorate annual salary to bi-weekly', () => {
      const result = prorateSalary(52000, 'BI_WEEKLY');
      expect(result).toBe(2000); // 52000 / 26
    });

    it('should prorate annual salary to semi-monthly', () => {
      const result = prorateSalary(48000, 'SEMI_MONTHLY');
      expect(result).toBe(2000); // 48000 / 24
    });

    it('should prorate annual salary to monthly', () => {
      const result = prorateSalary(60000, 'MONTHLY');
      expect(result).toBe(5000); // 60000 / 12
    });
  });

  describe('calculateOnCallPay', () => {
    it('should calculate on-call pay correctly', () => {
      const result = calculateOnCallPay(8, 5);
      expect(result).toBe(40); // 8 * 5
    });

    it('should handle zero hours', () => {
      const result = calculateOnCallPay(0, 5);
      expect(result).toBe(0);
    });

    it('should handle zero rate', () => {
      const result = calculateOnCallPay(8, 0);
      expect(result).toBe(0);
    });
  });

  describe('calculateShiftDifferential', () => {
    it('should calculate shift differential correctly', () => {
      const result = calculateShiftDifferential(8, 2.50);
      expect(result).toBe(20); // 8 * 2.50
    });

    it('should handle zero hours', () => {
      const result = calculateShiftDifferential(0, 2.50);
      expect(result).toBe(0);
    });

    it('should handle zero differential', () => {
      const result = calculateShiftDifferential(8, 0);
      expect(result).toBe(0);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle negative hours gracefully', () => {
      const result = calculateOvertimeHours(-5, 40);
      expect(result.regular).toBe(-5);
      expect(result.overtime).toBe(0);
      expect(result.doubleTime).toBe(0);
    });

    it('should handle very large numbers', () => {
      const result = calculateOvertimePay(1000, 100, 50, 100);
      expect(result.totalPay).toBeGreaterThan(0);
      expect(Number.isFinite(result.totalPay)).toBe(true);
    });

    it('should handle very small decimal rates', () => {
      const result = calculateOvertimePay(40, 5, 0, 0.01);
      expect(result.totalPay).toBeCloseTo(0.48, 2);
    });
  });
});