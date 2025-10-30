"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateDeductionAmount = calculateDeductionAmount;
exports.calculateGarnishmentAmount = calculateGarnishmentAmount;
exports.calculateAllDeductions = calculateAllDeductions;
exports.sortGarnishmentsByPriority = sortGarnishmentsByPriority;
exports.calculateEmployerMatch = calculateEmployerMatch;
exports.isDeductionLimitReached = isDeductionLimitReached;
exports.getRemainingDeductionLimit = getRemainingDeductionLimit;
exports.groupDeductionsByCategory = groupDeductionsByCategory;
const pay_calculations_1 = require("./pay-calculations");
function calculateDeductionAmount(grossPay, netPay, deduction) {
    let amount;
    switch (deduction.calculationMethod) {
        case 'FIXED':
            amount = deduction.amount;
            break;
        case 'PERCENTAGE':
            amount = grossPay * (deduction.percentage / 100);
            break;
        case 'PERCENTAGE_OF_NET':
            amount = netPay * (deduction.percentage / 100);
            break;
        case 'GRADUATED':
        case 'FORMULA':
            amount = deduction.amount;
            break;
        default:
            amount = deduction.amount;
    }
    if (deduction.hasLimit && deduction.yearlyLimit) {
        const remainingLimit = deduction.yearlyLimit - (deduction.yearToDateAmount || 0);
        amount = Math.min(amount, Math.max(0, remainingLimit));
    }
    return (0, pay_calculations_1.roundToTwoDecimals)(amount);
}
function calculateGarnishmentAmount(grossPay, taxableIncome, deduction) {
    if (!deduction.garnishmentOrder) {
        return calculateDeductionAmount(grossPay, taxableIncome, deduction);
    }
    const order = deduction.garnishmentOrder;
    let disposableIncome = taxableIncome;
    let maxPercentage;
    switch (order.orderType) {
        case 'CHILD_SUPPORT':
        case 'SPOUSAL_SUPPORT':
            maxPercentage = order.maxPercentage || 50;
            break;
        case 'TAX_LEVY':
            maxPercentage = order.maxPercentage || 100;
            break;
        case 'STUDENT_LOAN':
            maxPercentage = order.maxPercentage || 15;
            break;
        case 'CREDITOR':
        case 'BANKRUPTCY':
            maxPercentage = order.maxPercentage || 25;
            break;
        default:
            maxPercentage = order.maxPercentage || 25;
    }
    let amount;
    const defaultOrderAmount = 500;
    if (order.orderAmount && order.orderAmount !== defaultOrderAmount) {
        amount = order.orderAmount;
    }
    else {
        amount = disposableIncome * (maxPercentage / 100);
    }
    if (order.remainingBalance !== undefined && order.remainingBalance !== null) {
        amount = Math.min(amount, order.remainingBalance);
    }
    return (0, pay_calculations_1.roundToTwoDecimals)(Math.max(0, amount));
}
function calculateAllDeductions(grossPay, preTaxDeductions, postTaxDeductions, statutoryDeductions) {
    const calculatedDeductions = [];
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
    let statutoryTotal = 0;
    for (const deduction of statutoryDeductions) {
        const amount = deduction.amount;
        statutoryTotal += amount;
        calculatedDeductions.push({
            ...deduction,
            calculatedAmount: amount,
        });
    }
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
        preTaxTotal: (0, pay_calculations_1.roundToTwoDecimals)(preTaxTotal),
        postTaxTotal: (0, pay_calculations_1.roundToTwoDecimals)(postTaxTotal),
        statutoryTotal: (0, pay_calculations_1.roundToTwoDecimals)(statutoryTotal),
        calculatedDeductions,
    };
}
function sortGarnishmentsByPriority(garnishments) {
    const priorityMap = {
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
function calculateEmployerMatch(employeeContribution, matchPercentage, maxMatchAmount) {
    let match = employeeContribution * (matchPercentage / 100);
    if (maxMatchAmount) {
        match = Math.min(match, maxMatchAmount);
    }
    return (0, pay_calculations_1.roundToTwoDecimals)(match);
}
function isDeductionLimitReached(deduction) {
    if (!deduction.hasLimit || !deduction.yearlyLimit) {
        return false;
    }
    const ytdAmount = deduction.yearToDateAmount || 0;
    return ytdAmount >= deduction.yearlyLimit;
}
function getRemainingDeductionLimit(deduction) {
    if (!deduction.hasLimit || !deduction.yearlyLimit) {
        return null;
    }
    const ytdAmount = deduction.yearToDateAmount || 0;
    return Math.max(0, deduction.yearlyLimit - ytdAmount);
}
function groupDeductionsByCategory(deductions) {
    const grouped = {
        taxes: [],
        benefits: [],
        retirement: [],
        garnishments: [],
        other: [],
    };
    for (const deduction of deductions) {
        if (deduction.deductionType.includes('TAX') || deduction.deductionType.includes('SECURITY') ||
            deduction.deductionType === 'MEDICARE' || deduction.deductionType === 'ADDITIONAL_MEDICARE') {
            grouped.taxes.push(deduction);
        }
        else if (deduction.deductionType.includes('INSURANCE')) {
            grouped.benefits.push(deduction);
        }
        else if (deduction.deductionType.includes('RETIREMENT') || deduction.deductionType.includes('401') ||
            deduction.deductionType.includes('403')) {
            grouped.retirement.push(deduction);
        }
        else if (deduction.deductionType.includes('GARNISHMENT')) {
            grouped.garnishments.push(deduction);
        }
        else {
            grouped.other.push(deduction);
        }
    }
    return grouped;
}
//# sourceMappingURL=deduction-calculations.js.map