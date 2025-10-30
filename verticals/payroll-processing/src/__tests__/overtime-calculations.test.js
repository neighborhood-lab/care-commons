"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pay_calculations_1 = require("../utils/pay-calculations");
const vitest_1 = require("vitest");
(0, vitest_1.describe)('Overtime Calculations and Edge Cases', () => {
    (0, vitest_1.describe)('Basic Overtime Calculations', () => {
        (0, vitest_1.it)('should calculate simple overtime pay', () => {
            const result = (0, pay_calculations_1.calculateOvertimePay)(40, 10, 0, 20.00, 1.5);
            (0, vitest_1.expect)(result.overtimePay).toBe(300);
        });
        (0, vitest_1.it)('should calculate double time pay', () => {
            const result = (0, pay_calculations_1.calculateOvertimePay)(40, 0, 5, 25.00, 1.5, 2.0);
            (0, vitest_1.expect)(result.doubleTimePay).toBe(250);
        });
        (0, vitest_1.it)('should calculate triple time pay', () => {
            const result = (0, pay_calculations_1.calculateOvertimePay)(40, 2, 0, 30.00, 3.0);
            (0, vitest_1.expect)(result.overtimePay).toBe(180);
        });
        (0, vitest_1.it)('should handle zero overtime hours', () => {
            const result = (0, pay_calculations_1.calculateOvertimePay)(40, 0, 0, 25.00, 1.5);
            (0, vitest_1.expect)(result.overtimePay).toBe(0);
        });
        (0, vitest_1.it)('should handle fractional overtime hours', () => {
            const result = (0, pay_calculations_1.calculateOvertimePay)(40, 2.5, 0, 24.00, 1.5);
            (0, vitest_1.expect)(result.overtimePay).toBe(90);
        });
        (0, vitest_1.it)('should handle very small overtime fractions', () => {
            const result = (0, pay_calculations_1.calculateOvertimePay)(40, 0.25, 0, 40.00, 1.5);
            (0, vitest_1.expect)(result.overtimePay).toBe(15);
        });
        (0, vitest_1.it)('should handle large overtime hours', () => {
            const result = (0, pay_calculations_1.calculateOvertimePay)(40, 60, 0, 50.00, 1.5);
            (0, vitest_1.expect)(result.overtimePay).toBe(4500);
        });
    });
    (0, vitest_1.describe)('Weekly Overtime Calculations', () => {
        (0, vitest_1.it)('should calculate regular week with no overtime', () => {
            const hours = (0, pay_calculations_1.calculateOvertimeHours)(40, 40);
            const result = (0, pay_calculations_1.calculateOvertimePay)(hours.regular, hours.overtime, hours.doubleTime, 25.00);
            (0, vitest_1.expect)(result.regularHours).toBe(40);
            (0, vitest_1.expect)(result.overtimeHours).toBe(0);
            (0, vitest_1.expect)(result.doubleTimeHours).toBe(0);
            (0, vitest_1.expect)(result.regularPay).toBe(1000);
            (0, vitest_1.expect)(result.overtimePay).toBe(0);
            (0, vitest_1.expect)(result.doubleTimePay).toBe(0);
        });
        (0, vitest_1.it)('should calculate week with overtime only', () => {
            const hours = (0, pay_calculations_1.calculateOvertimeHours)(45, 40);
            const result = (0, pay_calculations_1.calculateOvertimePay)(hours.regular, hours.overtime, hours.doubleTime, 25.00);
            (0, vitest_1.expect)(result.regularHours).toBe(40);
            (0, vitest_1.expect)(result.overtimeHours).toBe(5);
            (0, vitest_1.expect)(result.doubleTimeHours).toBe(0);
            (0, vitest_1.expect)(result.regularPay).toBe(1000);
            (0, vitest_1.expect)(result.overtimePay).toBe(187.5);
            (0, vitest_1.expect)(result.doubleTimePay).toBe(0);
        });
        (0, vitest_1.it)('should calculate week with fractional overtime', () => {
            const hours = (0, pay_calculations_1.calculateOvertimeHours)(42.5, 40);
            const result = (0, pay_calculations_1.calculateOvertimePay)(hours.regular, hours.overtime, hours.doubleTime, 24.00);
            (0, vitest_1.expect)(result.regularHours).toBe(40);
            (0, vitest_1.expect)(result.overtimeHours).toBe(2.5);
            (0, vitest_1.expect)(result.doubleTimeHours).toBe(0);
            (0, vitest_1.expect)(result.regularPay).toBe(960);
            (0, vitest_1.expect)(result.overtimePay).toBe(90);
            (0, vitest_1.expect)(result.doubleTimePay).toBe(0);
        });
        (0, vitest_1.it)('should calculate week with double time', () => {
            const hours = (0, pay_calculations_1.calculateOvertimeHours)(60, 40, 48);
            const result = (0, pay_calculations_1.calculateOvertimePay)(hours.regular, hours.overtime, hours.doubleTime, 30.00);
            (0, vitest_1.expect)(result.regularHours).toBe(40);
            (0, vitest_1.expect)(result.overtimeHours).toBe(8);
            (0, vitest_1.expect)(result.doubleTimeHours).toBe(12);
            (0, vitest_1.expect)(result.regularPay).toBe(1200);
            (0, vitest_1.expect)(result.overtimePay).toBe(360);
            (0, vitest_1.expect)(result.doubleTimePay).toBe(720);
        });
        (0, vitest_1.it)('should handle zero hours worked', () => {
            const hours = (0, pay_calculations_1.calculateOvertimeHours)(0, 40);
            const result = (0, pay_calculations_1.calculateOvertimePay)(hours.regular, hours.overtime, hours.doubleTime, 25.00);
            (0, vitest_1.expect)(result.overtimeHours).toBe(0);
            (0, vitest_1.expect)(result.regularPay).toBe(0);
            (0, vitest_1.expect)(result.overtimePay).toBe(0);
            (0, vitest_1.expect)(result.doubleTimePay).toBe(0);
        });
    });
    (0, vitest_1.describe)('California Daily Overtime', () => {
        (0, vitest_1.it)('should calculate regular day with no overtime', () => {
            const dailyHours = [8, 8, 8, 8, 8];
            const rate = 25.00;
            let totalRegular = 0, totalOvertime = 0, totalDoubleTime = 0;
            for (const hours of dailyHours) {
                const dayResult = (0, pay_calculations_1.calculateDailyOvertime)(hours, 8, 12);
                totalRegular += dayResult.regular;
                totalOvertime += dayResult.overtime;
                totalDoubleTime += dayResult.doubleTime;
            }
            const result = (0, pay_calculations_1.calculateOvertimePay)(totalRegular, totalOvertime, totalDoubleTime, rate);
            (0, vitest_1.expect)(result.regularHours).toBe(40);
            (0, vitest_1.expect)(result.overtimeHours).toBe(0);
            (0, vitest_1.expect)(result.doubleTimeHours).toBe(0);
            (0, vitest_1.expect)(result.regularPay).toBe(1000);
            (0, vitest_1.expect)(result.overtimePay).toBe(0);
            (0, vitest_1.expect)(result.doubleTimePay).toBe(0);
        });
        (0, vitest_1.it)('should calculate day with overtime only', () => {
            const dailyHours = [8, 8, 8, 8, 10];
            const rate = 25.00;
            let totalRegular = 0, totalOvertime = 0, totalDoubleTime = 0;
            for (const hours of dailyHours) {
                const dayResult = (0, pay_calculations_1.calculateDailyOvertime)(hours, 8, 12);
                totalRegular += dayResult.regular;
                totalOvertime += dayResult.overtime;
                totalDoubleTime += dayResult.doubleTime;
            }
            const result = (0, pay_calculations_1.calculateOvertimePay)(totalRegular, totalOvertime, totalDoubleTime, rate);
            (0, vitest_1.expect)(result.regularHours).toBe(40);
            (0, vitest_1.expect)(result.overtimeHours).toBe(2);
            (0, vitest_1.expect)(result.doubleTimeHours).toBe(0);
            (0, vitest_1.expect)(result.regularPay).toBe(1000);
            (0, vitest_1.expect)(result.overtimePay).toBe(75);
            (0, vitest_1.expect)(result.doubleTimePay).toBe(0);
        });
        (0, vitest_1.it)('should calculate day with double time', () => {
            const dailyHours = [8, 8, 8, 8, 14];
            const rate = 25.00;
            let totalRegular = 0, totalOvertime = 0, totalDoubleTime = 0;
            for (const hours of dailyHours) {
                const dayResult = (0, pay_calculations_1.calculateDailyOvertime)(hours, 8, 12);
                totalRegular += dayResult.regular;
                totalOvertime += dayResult.overtime;
                totalDoubleTime += dayResult.doubleTime;
            }
            const result = (0, pay_calculations_1.calculateOvertimePay)(totalRegular, totalOvertime, totalDoubleTime, rate);
            (0, vitest_1.expect)(result.regularHours).toBe(40);
            (0, vitest_1.expect)(result.overtimeHours).toBe(4);
            (0, vitest_1.expect)(result.doubleTimeHours).toBe(2);
            (0, vitest_1.expect)(result.regularPay).toBe(1000);
            (0, vitest_1.expect)(result.overtimePay).toBe(150);
            (0, vitest_1.expect)(result.doubleTimePay).toBe(100);
        });
    });
    (0, vitest_1.describe)('Seventh Day Overtime', () => {
        (0, vitest_1.it)('should calculate seventh day overtime', () => {
            const result = (0, pay_calculations_1.calculateSeventhDayOvertime)(6);
            (0, vitest_1.expect)(result.regular).toBe(0);
            (0, vitest_1.expect)(result.overtime).toBe(6);
            (0, vitest_1.expect)(result.doubleTime).toBe(0);
        });
        (0, vitest_1.it)('should calculate seventh day double time', () => {
            const result = (0, pay_calculations_1.calculateSeventhDayOvertime)(10);
            (0, vitest_1.expect)(result.regular).toBe(0);
            (0, vitest_1.expect)(result.overtime).toBe(8);
            (0, vitest_1.expect)(result.doubleTime).toBe(2);
        });
        (0, vitest_1.it)('should handle zero hours on seventh day', () => {
            const result = (0, pay_calculations_1.calculateSeventhDayOvertime)(0);
            (0, vitest_1.expect)(result.regular).toBe(0);
            (0, vitest_1.expect)(result.overtime).toBe(0);
            (0, vitest_1.expect)(result.doubleTime).toBe(0);
        });
    });
    (0, vitest_1.describe)('Live-In Overtime', () => {
        (0, vitest_1.it)('should calculate live-in overtime with standard threshold', () => {
            const result = (0, pay_calculations_1.calculateLiveInOvertime)(50, 44, 20);
            (0, vitest_1.expect)(result.regularHours).toBe(44);
            (0, vitest_1.expect)(result.overtimeHours).toBe(6);
            (0, vitest_1.expect)(result.doubleTimeHours).toBe(0);
            (0, vitest_1.expect)(result.regularPay).toBe(880);
            (0, vitest_1.expect)(result.overtimePay).toBe(180);
        });
        (0, vitest_1.it)('should calculate live-in overtime with double time', () => {
            const result = (0, pay_calculations_1.calculateLiveInOvertime)(60, 44, 20);
            (0, vitest_1.expect)(result.regularHours).toBe(44);
            (0, vitest_1.expect)(result.overtimeHours).toBe(16);
            (0, vitest_1.expect)(result.doubleTimeHours).toBe(0);
            (0, vitest_1.expect)(result.regularPay).toBe(880);
            (0, vitest_1.expect)(result.overtimePay).toBe(480);
        });
    });
    (0, vitest_1.describe)('Blended Overtime Rate', () => {
        (0, vitest_1.it)('should calculate blended overtime rate', () => {
            const result = (0, pay_calculations_1.calculateBlendedOvertimeRate)(1000, 40);
            (0, vitest_1.expect)(result).toBe(37.5);
        });
        (0, vitest_1.it)('should handle zero regular hours', () => {
            const result = (0, pay_calculations_1.calculateBlendedOvertimeRate)(1000, 0);
            (0, vitest_1.expect)(result).toBe(0);
        });
    });
    (0, vitest_1.describe)('Edge Cases', () => {
        (0, vitest_1.it)('should handle negative hours gracefully', () => {
            const hours = (0, pay_calculations_1.calculateOvertimeHours)(-5, 40);
            (0, vitest_1.expect)(hours.regular).toBe(-5);
            (0, vitest_1.expect)(hours.overtime).toBe(0);
            (0, vitest_1.expect)(hours.doubleTime).toBe(0);
        });
        (0, vitest_1.it)('should handle very large hour values', () => {
            const hours = (0, pay_calculations_1.calculateOvertimeHours)(100, 40, 60);
            (0, vitest_1.expect)(hours.regular).toBe(40);
            (0, vitest_1.expect)(hours.overtime).toBe(20);
            (0, vitest_1.expect)(hours.doubleTime).toBe(40);
        });
        (0, vitest_1.it)('should handle decimal precision correctly', () => {
            const result = (0, pay_calculations_1.calculateOvertimePay)(40, 1.5, 0, 15.67, 1.5);
            (0, vitest_1.expect)(result.overtimePay).toBeCloseTo(35.26, 2);
        });
    });
});
//# sourceMappingURL=overtime-calculations.test.js.map