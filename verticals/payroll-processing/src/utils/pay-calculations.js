"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateOvertimeHours = calculateOvertimeHours;
exports.calculateOvertimePay = calculateOvertimePay;
exports.applyRateMultipliers = applyRateMultipliers;
exports.calculateDailyOvertime = calculateDailyOvertime;
exports.calculatePTOAccrual = calculatePTOAccrual;
exports.calculateBlendedOvertimeRate = calculateBlendedOvertimeRate;
exports.calculateLiveInOvertime = calculateLiveInOvertime;
exports.roundToTwoDecimals = roundToTwoDecimals;
exports.calculateTotalCompensation = calculateTotalCompensation;
exports.calculateSeventhDayOvertime = calculateSeventhDayOvertime;
exports.prorateSalary = prorateSalary;
exports.calculateOnCallPay = calculateOnCallPay;
exports.calculateShiftDifferential = calculateShiftDifferential;
function calculateOvertimeHours(totalHours, regularThreshold = 40, doubleTimeThreshold) {
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
function calculateOvertimePay(regularHours, overtimeHours, doubleTimeHours, regularRate, overtimeMultiplier = 1.5, doubleTimeMultiplier = 2.0) {
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
function applyRateMultipliers(baseRate, multipliers) {
    let finalRate = baseRate;
    const appliedMultipliers = [];
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
function calculateDailyOvertime(dailyHours, dailyThreshold = 8, doubleTimeThreshold = 12) {
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
function calculatePTOAccrual(hoursWorked, accrualRate) {
    return roundToTwoDecimals(hoursWorked * accrualRate);
}
function calculateBlendedOvertimeRate(regularEarnings, regularHours, overtimeMultiplier = 1.5) {
    if (regularHours === 0)
        return 0;
    const regularRate = regularEarnings / regularHours;
    const overtimeRate = regularRate * overtimeMultiplier;
    return roundToTwoDecimals(overtimeRate);
}
function calculateLiveInOvertime(hoursWorked, threshold = 44, rate) {
    const { regular, overtime, doubleTime } = calculateOvertimeHours(hoursWorked, threshold);
    return calculateOvertimePay(regular, overtime, doubleTime, rate);
}
function roundToTwoDecimals(value) {
    return Math.round(value * 100) / 100;
}
function calculateTotalCompensation(earnings) {
    const total = earnings.regularPay +
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
function calculateSeventhDayOvertime(hoursOnSeventhDay) {
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
function prorateSalary(annualSalary, payPeriodType) {
    const periods = {
        WEEKLY: 52,
        BI_WEEKLY: 26,
        SEMI_MONTHLY: 24,
        MONTHLY: 12,
    };
    return roundToTwoDecimals(annualSalary / periods[payPeriodType]);
}
function calculateOnCallPay(onCallHours, onCallRate) {
    return roundToTwoDecimals(onCallHours * onCallRate);
}
function calculateShiftDifferential(hours, differentialAmount) {
    return roundToTwoDecimals(hours * differentialAmount);
}
//# sourceMappingURL=pay-calculations.js.map