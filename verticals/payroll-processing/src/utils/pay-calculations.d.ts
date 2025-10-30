import { OvertimeCalculationResult, PayRateMultiplier } from '../types/payroll';
export declare function calculateOvertimeHours(totalHours: number, regularThreshold?: number, doubleTimeThreshold?: number): {
    regular: number;
    overtime: number;
    doubleTime: number;
};
export declare function calculateOvertimePay(regularHours: number, overtimeHours: number, doubleTimeHours: number, regularRate: number, overtimeMultiplier?: number, doubleTimeMultiplier?: number): OvertimeCalculationResult;
export declare function applyRateMultipliers(baseRate: number, multipliers: Array<{
    type: string;
    multiplier: number;
}>): {
    finalRate: number;
    appliedMultipliers: PayRateMultiplier[];
};
export declare function calculateDailyOvertime(dailyHours: number, dailyThreshold?: number, doubleTimeThreshold?: number): {
    regular: number;
    overtime: number;
    doubleTime: number;
};
export declare function calculatePTOAccrual(hoursWorked: number, accrualRate: number): number;
export declare function calculateBlendedOvertimeRate(regularEarnings: number, regularHours: number, overtimeMultiplier?: number): number;
export declare function calculateLiveInOvertime(hoursWorked: number, threshold: number | undefined, rate: number): OvertimeCalculationResult;
export declare function roundToTwoDecimals(value: number): number;
export declare function calculateTotalCompensation(earnings: {
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
}): number;
export declare function calculateSeventhDayOvertime(hoursOnSeventhDay: number): {
    regular: number;
    overtime: number;
    doubleTime: number;
};
export declare function prorateSalary(annualSalary: number, payPeriodType: 'WEEKLY' | 'BI_WEEKLY' | 'SEMI_MONTHLY' | 'MONTHLY'): number;
export declare function calculateOnCallPay(onCallHours: number, onCallRate: number): number;
export declare function calculateShiftDifferential(hours: number, differentialAmount: number): number;
//# sourceMappingURL=pay-calculations.d.ts.map