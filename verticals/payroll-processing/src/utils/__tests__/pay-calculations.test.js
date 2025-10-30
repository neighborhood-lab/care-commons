"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pay_calculations_1 = require("../pay-calculations");
const vitest_1 = require("vitest");
(0, vitest_1.describe)('Pay Calculation Utilities', () => {
    (0, vitest_1.describe)('roundToTwoDecimals', () => {
        (0, vitest_1.it)('should round positive numbers correctly', () => {
            (0, vitest_1.expect)((0, pay_calculations_1.roundToTwoDecimals)(15.678)).toBe(15.68);
            (0, vitest_1.expect)((0, pay_calculations_1.roundToTwoDecimals)(15.674)).toBe(15.67);
            (0, vitest_1.expect)((0, pay_calculations_1.roundToTwoDecimals)(15.675)).toBe(15.68);
        });
        (0, vitest_1.it)('should round negative numbers correctly', () => {
            (0, vitest_1.expect)((0, pay_calculations_1.roundToTwoDecimals)(-15.678)).toBe(-15.68);
            (0, vitest_1.expect)((0, pay_calculations_1.roundToTwoDecimals)(-15.674)).toBe(-15.67);
        });
        (0, vitest_1.it)('handle whole numbers', () => {
            (0, vitest_1.expect)((0, pay_calculations_1.roundToTwoDecimals)(15)).toBe(15);
            (0, vitest_1.expect)((0, pay_calculations_1.roundToTwoDecimals)(15.00)).toBe(15);
        });
        (0, vitest_1.it)('handle very small numbers', () => {
            (0, vitest_1.expect)((0, pay_calculations_1.roundToTwoDecimals)(0.001)).toBe(0);
            (0, vitest_1.expect)((0, pay_calculations_1.roundToTwoDecimals)(0.009)).toBe(0.01);
        });
    });
    (0, vitest_1.describe)('calculateOvertimeHours', () => {
        (0, vitest_1.it)('should return all regular hours when under threshold', () => {
            const result = (0, pay_calculations_1.calculateOvertimeHours)(35, 40);
            (0, vitest_1.expect)(result).toEqual({
                regular: 35,
                overtime: 0,
                doubleTime: 0,
            });
        });
        (0, vitest_1.it)('should calculate overtime when over threshold', () => {
            const result = (0, pay_calculations_1.calculateOvertimeHours)(45, 40);
            (0, vitest_1.expect)(result).toEqual({
                regular: 40,
                overtime: 5,
                doubleTime: 0,
            });
        });
        (0, vitest_1.it)('should calculate double time when over double threshold', () => {
            const result = (0, pay_calculations_1.calculateOvertimeHours)(50, 40, 48);
            (0, vitest_1.expect)(result).toEqual({
                regular: 40,
                overtime: 8,
                doubleTime: 2,
            });
        });
        (0, vitest_1.it)('should handle exactly at threshold', () => {
            const result = (0, pay_calculations_1.calculateOvertimeHours)(40, 40);
            (0, vitest_1.expect)(result).toEqual({
                regular: 40,
                overtime: 0,
                doubleTime: 0,
            });
        });
        (0, vitest_1.it)('should handle zero hours', () => {
            const result = (0, pay_calculations_1.calculateOvertimeHours)(0, 40);
            (0, vitest_1.expect)(result).toEqual({
                regular: 0,
                overtime: 0,
                doubleTime: 0,
            });
        });
        (0, vitest_1.it)('should use default thresholds when not specified', () => {
            const result = (0, pay_calculations_1.calculateOvertimeHours)(50);
            (0, vitest_1.expect)(result).toEqual({
                regular: 40,
                overtime: 10,
                doubleTime: 0,
            });
        });
    });
    (0, vitest_1.describe)('calculateOvertimePay', () => {
        (0, vitest_1.it)('should calculate pay with only regular hours', () => {
            const result = (0, pay_calculations_1.calculateOvertimePay)(40, 0, 0, 20);
            (0, vitest_1.expect)(result).toEqual({
                regularHours: 40,
                overtimeHours: 0,
                doubleTimeHours: 0,
                regularPay: 800,
                overtimePay: 0,
                doubleTimePay: 0,
                totalPay: 800,
            });
        });
        (0, vitest_1.it)('should calculate pay with overtime', () => {
            const result = (0, pay_calculations_1.calculateOvertimePay)(40, 5, 0, 20);
            (0, vitest_1.expect)(result).toEqual({
                regularHours: 40,
                overtimeHours: 5,
                doubleTimeHours: 0,
                regularPay: 800,
                overtimePay: 150,
                doubleTimePay: 0,
                totalPay: 950,
            });
        });
        (0, vitest_1.it)('should calculate pay with double time', () => {
            const result = (0, pay_calculations_1.calculateOvertimePay)(40, 8, 2, 20);
            (0, vitest_1.expect)(result).toEqual({
                regularHours: 40,
                overtimeHours: 8,
                doubleTimeHours: 2,
                regularPay: 800,
                overtimePay: 240,
                doubleTimePay: 80,
                totalPay: 1120,
            });
        });
        (0, vitest_1.it)('should use custom multipliers', () => {
            const result = (0, pay_calculations_1.calculateOvertimePay)(40, 5, 0, 20, 1.75, 2.5);
            (0, vitest_1.expect)(result.overtimePay).toBe(175);
        });
        (0, vitest_1.it)('should handle zero rate', () => {
            const result = (0, pay_calculations_1.calculateOvertimePay)(40, 5, 0, 0);
            (0, vitest_1.expect)(result.totalPay).toBe(0);
        });
    });
    (0, vitest_1.describe)('applyRateMultipliers', () => {
        (0, vitest_1.it)('should return base rate when no multipliers', () => {
            const result = (0, pay_calculations_1.applyRateMultipliers)(20, []);
            (0, vitest_1.expect)(result).toEqual({
                finalRate: 20,
                appliedMultipliers: [],
            });
        });
        (0, vitest_1.it)('should apply single multiplier', () => {
            const result = (0, pay_calculations_1.applyRateMultipliers)(20, [{ type: 'WEEKEND', multiplier: 1.2 }]);
            (0, vitest_1.expect)(result).toEqual({
                finalRate: 24,
                appliedMultipliers: [{
                        multiplierType: 'WEEKEND',
                        multiplier: 1.2,
                        baseRate: 20,
                        appliedAmount: 4,
                    }],
            });
        });
        (0, vitest_1.it)('should apply multiple multipliers', () => {
            const result = (0, pay_calculations_1.applyRateMultipliers)(20, [
                { type: 'WEEKEND', multiplier: 1.2 },
                { type: 'NIGHT_SHIFT', multiplier: 1.1 },
            ]);
            (0, vitest_1.expect)(result.finalRate).toBe(26);
            (0, vitest_1.expect)(result.appliedMultipliers).toHaveLength(2);
        });
        (0, vitest_1.it)('should handle multiplier less than 1', () => {
            const result = (0, pay_calculations_1.applyRateMultipliers)(20, [{ type: 'TRAINING', multiplier: 0.8 }]);
            (0, vitest_1.expect)(result.finalRate).toBe(16);
        });
    });
    (0, vitest_1.describe)('calculateDailyOvertime', () => {
        (0, vitest_1.it)('should return all regular hours when under daily threshold', () => {
            const result = (0, pay_calculations_1.calculateDailyOvertime)(6, 8, 12);
            (0, vitest_1.expect)(result).toEqual({
                regular: 6,
                overtime: 0,
                doubleTime: 0,
            });
        });
        (0, vitest_1.it)('should calculate daily overtime', () => {
            const result = (0, pay_calculations_1.calculateDailyOvertime)(10, 8, 12);
            (0, vitest_1.expect)(result).toEqual({
                regular: 8,
                overtime: 2,
                doubleTime: 0,
            });
        });
        (0, vitest_1.it)('should calculate daily double time', () => {
            const result = (0, pay_calculations_1.calculateDailyOvertime)(14, 8, 12);
            (0, vitest_1.expect)(result).toEqual({
                regular: 8,
                overtime: 4,
                doubleTime: 2,
            });
        });
        (0, vitest_1.it)('should use default thresholds', () => {
            const result = (0, pay_calculations_1.calculateDailyOvertime)(10);
            (0, vitest_1.expect)(result).toEqual({
                regular: 8,
                overtime: 2,
                doubleTime: 0,
            });
        });
    });
    (0, vitest_1.describe)('calculatePTOAccrual', () => {
        (0, vitest_1.it)('should calculate PTO accrual correctly', () => {
            const result = (0, pay_calculations_1.calculatePTOAccrual)(40, 0.0385);
            (0, vitest_1.expect)(result).toBe(1.54);
        });
        (0, vitest_1.it)('should handle zero hours', () => {
            const result = (0, pay_calculations_1.calculatePTOAccrual)(0, 0.0385);
            (0, vitest_1.expect)(result).toBe(0);
        });
        (0, vitest_1.it)('should handle zero accrual rate', () => {
            const result = (0, pay_calculations_1.calculatePTOAccrual)(40, 0);
            (0, vitest_1.expect)(result).toBe(0);
        });
    });
    (0, vitest_1.describe)('calculateBlendedOvertimeRate', () => {
        (0, vitest_1.it)('should calculate blended rate for multiple rates', () => {
            const result = (0, pay_calculations_1.calculateBlendedOvertimeRate)(1000, 40);
            (0, vitest_1.expect)(result).toBe(37.5);
        });
        (0, vitest_1.it)('should handle zero regular hours', () => {
            const result = (0, pay_calculations_1.calculateBlendedOvertimeRate)(1000, 0);
            (0, vitest_1.expect)(result).toBe(0);
        });
        (0, vitest_1.it)('should use custom multiplier', () => {
            const result = (0, pay_calculations_1.calculateBlendedOvertimeRate)(1000, 40, 1.75);
            (0, vitest_1.expect)(result).toBe(43.75);
        });
    });
    (0, vitest_1.describe)('calculateLiveInOvertime', () => {
        (0, vitest_1.it)('should calculate live-in overtime with default threshold', () => {
            const result = (0, pay_calculations_1.calculateLiveInOvertime)(50, 44, 20);
            (0, vitest_1.expect)(result).toEqual({
                regularHours: 44,
                overtimeHours: 6,
                doubleTimeHours: 0,
                regularPay: 880,
                overtimePay: 180,
                doubleTimePay: 0,
                totalPay: 1060,
            });
        });
        (0, vitest_1.it)('should calculate live-in overtime with double time', () => {
            const result = (0, pay_calculations_1.calculateLiveInOvertime)(60, 44, 20);
            (0, vitest_1.expect)(result.overtimeHours).toBeGreaterThan(0);
            (0, vitest_1.expect)(result.totalPay).toBeGreaterThan(1000);
        });
    });
    (0, vitest_1.describe)('calculateTotalCompensation', () => {
        (0, vitest_1.it)('should sum all compensation components', () => {
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
            const result = (0, pay_calculations_1.calculateTotalCompensation)(earnings);
            (0, vitest_1.expect)(result).toBe(2535);
        });
        (0, vitest_1.it)('should handle zero values', () => {
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
            const result = (0, pay_calculations_1.calculateTotalCompensation)(earnings);
            (0, vitest_1.expect)(result).toBe(0);
        });
    });
    (0, vitest_1.describe)('calculateSeventhDayOvertime', () => {
        (0, vitest_1.it)('should calculate seventh day overtime correctly', () => {
            const result = (0, pay_calculations_1.calculateSeventhDayOvertime)(6);
            (0, vitest_1.expect)(result).toEqual({
                regular: 0,
                overtime: 6,
                doubleTime: 0,
            });
        });
        (0, vitest_1.it)('should calculate seventh day double time', () => {
            const result = (0, pay_calculations_1.calculateSeventhDayOvertime)(10);
            (0, vitest_1.expect)(result).toEqual({
                regular: 0,
                overtime: 8,
                doubleTime: 2,
            });
        });
        (0, vitest_1.it)('should handle zero hours', () => {
            const result = (0, pay_calculations_1.calculateSeventhDayOvertime)(0);
            (0, vitest_1.expect)(result).toEqual({
                regular: 0,
                overtime: 0,
                doubleTime: 0,
            });
        });
    });
    (0, vitest_1.describe)('prorateSalary', () => {
        (0, vitest_1.it)('should prorate annual salary to weekly', () => {
            const result = (0, pay_calculations_1.prorateSalary)(52000, 'WEEKLY');
            (0, vitest_1.expect)(result).toBe(1000);
        });
        (0, vitest_1.it)('should prorate annual salary to bi-weekly', () => {
            const result = (0, pay_calculations_1.prorateSalary)(52000, 'BI_WEEKLY');
            (0, vitest_1.expect)(result).toBe(2000);
        });
        (0, vitest_1.it)('should prorate annual salary to semi-monthly', () => {
            const result = (0, pay_calculations_1.prorateSalary)(48000, 'SEMI_MONTHLY');
            (0, vitest_1.expect)(result).toBe(2000);
        });
        (0, vitest_1.it)('should prorate annual salary to monthly', () => {
            const result = (0, pay_calculations_1.prorateSalary)(60000, 'MONTHLY');
            (0, vitest_1.expect)(result).toBe(5000);
        });
    });
    (0, vitest_1.describe)('calculateOnCallPay', () => {
        (0, vitest_1.it)('should calculate on-call pay correctly', () => {
            const result = (0, pay_calculations_1.calculateOnCallPay)(8, 5);
            (0, vitest_1.expect)(result).toBe(40);
        });
        (0, vitest_1.it)('should handle zero hours', () => {
            const result = (0, pay_calculations_1.calculateOnCallPay)(0, 5);
            (0, vitest_1.expect)(result).toBe(0);
        });
        (0, vitest_1.it)('should handle zero rate', () => {
            const result = (0, pay_calculations_1.calculateOnCallPay)(8, 0);
            (0, vitest_1.expect)(result).toBe(0);
        });
    });
    (0, vitest_1.describe)('calculateShiftDifferential', () => {
        (0, vitest_1.it)('should calculate shift differential correctly', () => {
            const result = (0, pay_calculations_1.calculateShiftDifferential)(8, 2.50);
            (0, vitest_1.expect)(result).toBe(20);
        });
        (0, vitest_1.it)('should handle zero hours', () => {
            const result = (0, pay_calculations_1.calculateShiftDifferential)(0, 2.50);
            (0, vitest_1.expect)(result).toBe(0);
        });
        (0, vitest_1.it)('should handle zero differential', () => {
            const result = (0, pay_calculations_1.calculateShiftDifferential)(8, 0);
            (0, vitest_1.expect)(result).toBe(0);
        });
    });
    (0, vitest_1.describe)('Edge Cases and Error Handling', () => {
        (0, vitest_1.it)('should handle negative hours gracefully', () => {
            const result = (0, pay_calculations_1.calculateOvertimeHours)(-5, 40);
            (0, vitest_1.expect)(result.regular).toBe(-5);
            (0, vitest_1.expect)(result.overtime).toBe(0);
            (0, vitest_1.expect)(result.doubleTime).toBe(0);
        });
        (0, vitest_1.it)('should handle very large numbers', () => {
            const result = (0, pay_calculations_1.calculateOvertimePay)(1000, 100, 50, 100);
            (0, vitest_1.expect)(result.totalPay).toBeGreaterThan(0);
            (0, vitest_1.expect)(Number.isFinite(result.totalPay)).toBe(true);
        });
        (0, vitest_1.it)('should handle very small decimal rates', () => {
            const result = (0, pay_calculations_1.calculateOvertimePay)(40, 5, 0, 0.01);
            (0, vitest_1.expect)(result.totalPay).toBeCloseTo(0.48, 2);
        });
    });
});
//# sourceMappingURL=pay-calculations.test.js.map