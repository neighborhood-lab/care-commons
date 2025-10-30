"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateFederalIncomeTax = calculateFederalIncomeTax;
exports.calculateSocialSecurityTax = calculateSocialSecurityTax;
exports.calculateMedicareTax = calculateMedicareTax;
exports.calculateAdditionalMedicareTax = calculateAdditionalMedicareTax;
exports.calculateStateIncomeTax = calculateStateIncomeTax;
exports.calculateAllTaxes = calculateAllTaxes;
exports.calculateSupplementalWithholding = calculateSupplementalWithholding;
exports.estimateQuarterlyTaxLiability = estimateQuarterlyTaxLiability;
const pay_calculations_1 = require("./pay-calculations");
const SOCIAL_SECURITY_RATE = 0.062;
const SOCIAL_SECURITY_WAGE_BASE = 168600;
const MEDICARE_RATE = 0.0145;
const ADDITIONAL_MEDICARE_RATE = 0.009;
const ADDITIONAL_MEDICARE_THRESHOLD = 200000;
function calculateFederalIncomeTax(grossPay, payPeriodType, taxConfig) {
    if (taxConfig.federalExempt) {
        return 0;
    }
    let adjustedPay = grossPay;
    if (taxConfig.w4Step4aOtherIncome > 0) {
        const periodsPerYear = getPayPeriodsPerYear(payPeriodType);
        adjustedPay += taxConfig.w4Step4aOtherIncome / periodsPerYear;
    }
    if (taxConfig.w4Step3Dependents > 0) {
        const periodsPerYear = getPayPeriodsPerYear(payPeriodType);
        adjustedPay -= taxConfig.w4Step3Dependents / periodsPerYear;
    }
    if (taxConfig.w4Step4bDeductions > 0) {
        const periodsPerYear = getPayPeriodsPerYear(payPeriodType);
        adjustedPay -= taxConfig.w4Step4bDeductions / periodsPerYear;
    }
    const tentativeWithholding = calculateFederalWithholding(adjustedPay, payPeriodType, taxConfig.federalFilingStatus);
    const totalWithholding = tentativeWithholding + (taxConfig.w4Step4cExtraWithholding || 0);
    return (0, pay_calculations_1.roundToTwoDecimals)(Math.max(0, totalWithholding));
}
function calculateFederalWithholding(adjustedPay, payPeriodType, filingStatus) {
    const annualPay = adjustedPay * getPayPeriodsPerYear(payPeriodType);
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
    const periodicTax = tax / getPayPeriodsPerYear(payPeriodType);
    return (0, pay_calculations_1.roundToTwoDecimals)(periodicTax);
}
function getFederalTaxBrackets(filingStatus) {
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
function calculateSocialSecurityTax(grossPay, ytdGrossPay) {
    if (grossPay <= 0) {
        return 0;
    }
    if (ytdGrossPay >= SOCIAL_SECURITY_WAGE_BASE) {
        return 0;
    }
    const taxableWages = Math.min(grossPay, SOCIAL_SECURITY_WAGE_BASE - ytdGrossPay);
    return (0, pay_calculations_1.roundToTwoDecimals)(taxableWages * SOCIAL_SECURITY_RATE);
}
function calculateMedicareTax(grossPay) {
    if (grossPay <= 0) {
        return 0;
    }
    return (0, pay_calculations_1.roundToTwoDecimals)(grossPay * MEDICARE_RATE);
}
function calculateAdditionalMedicareTax(grossPay, ytdGrossPay) {
    if (ytdGrossPay < ADDITIONAL_MEDICARE_THRESHOLD) {
        const exceedsThreshold = (ytdGrossPay + grossPay) > ADDITIONAL_MEDICARE_THRESHOLD;
        if (!exceedsThreshold) {
            return 0;
        }
        const taxableAmount = (ytdGrossPay + grossPay) - ADDITIONAL_MEDICARE_THRESHOLD;
        return (0, pay_calculations_1.roundToTwoDecimals)(taxableAmount * ADDITIONAL_MEDICARE_RATE);
    }
    return (0, pay_calculations_1.roundToTwoDecimals)(grossPay * ADDITIONAL_MEDICARE_RATE);
}
function calculateStateIncomeTax(grossPay, stateCode, taxConfig) {
    if (taxConfig.stateExempt) {
        return 0;
    }
    const rate = getStateWithholdingRate(stateCode);
    const tax = grossPay * rate;
    const totalTax = tax + taxConfig.stateExtraWithholding;
    return (0, pay_calculations_1.roundToTwoDecimals)(Math.max(0, totalTax));
}
function getStateWithholdingRate(stateCode) {
    const stateRates = {
        'TX': 0.0,
        'FL': 0.0,
        'CA': 0.05,
        'NY': 0.04,
        'IL': 0.0495,
        'PA': 0.0307,
    };
    const rate = stateRates[stateCode];
    return rate !== undefined ? rate : 0.03;
}
function calculateAllTaxes(grossPay, ytdGrossPay, payPeriodType, taxConfig) {
    const federalIncomeTax = calculateFederalIncomeTax(grossPay, payPeriodType, taxConfig);
    const socialSecurityTax = calculateSocialSecurityTax(grossPay, ytdGrossPay);
    const medicareTax = calculateMedicareTax(grossPay);
    const additionalMedicareTax = calculateAdditionalMedicareTax(grossPay, ytdGrossPay);
    const stateIncomeTax = calculateStateIncomeTax(grossPay, taxConfig.stateResidence, taxConfig);
    const localIncomeTax = taxConfig.localTaxJurisdiction && !taxConfig.localExempt
        ? calculateLocalIncomeTax(grossPay, taxConfig.localTaxJurisdiction)
        : 0;
    const totalTax = federalIncomeTax +
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
        totalTax: (0, pay_calculations_1.roundToTwoDecimals)(totalTax),
    };
}
function calculateLocalIncomeTax(grossPay, jurisdiction) {
    const localRates = {
        'NYC': 0.03876,
        'PHL': 0.03792,
        'DET': 0.024,
    };
    const rate = localRates[jurisdiction] || 0;
    return (0, pay_calculations_1.roundToTwoDecimals)(grossPay * rate);
}
function getPayPeriodsPerYear(payPeriodType) {
    const periods = {
        WEEKLY: 52,
        BI_WEEKLY: 26,
        SEMI_MONTHLY: 24,
        MONTHLY: 12,
    };
    return periods[payPeriodType];
}
function calculateSupplementalWithholding(supplementalAmount, useFlatRate = true, aggregateParams) {
    if (supplementalAmount <= 0) {
        return 0;
    }
    if (useFlatRate) {
        const rate = supplementalAmount > 1000000 ? 0.37 : 0.22;
        return (0, pay_calculations_1.roundToTwoDecimals)(supplementalAmount * rate);
    }
    if (!aggregateParams) {
        throw new Error('Aggregate method requires aggregate parameters');
    }
    const { regularGrossPay, payPeriodType, taxConfig } = aggregateParams;
    const totalCombinedPay = regularGrossPay + supplementalAmount;
    const totalWithholding = calculateFederalIncomeTax(totalCombinedPay, payPeriodType, taxConfig);
    const regularWithholding = calculateFederalIncomeTax(regularGrossPay, payPeriodType, taxConfig);
    let supplementalWithholding = totalWithholding - regularWithholding;
    supplementalWithholding = Math.min(supplementalWithholding, supplementalAmount);
    supplementalWithholding = Math.max(0, supplementalWithholding);
    return (0, pay_calculations_1.roundToTwoDecimals)(supplementalWithholding);
}
function estimateQuarterlyTaxLiability(totalGrossWages, totalFederalWithheld) {
    const employerSocialSecurity = (0, pay_calculations_1.roundToTwoDecimals)(Math.min(totalGrossWages, SOCIAL_SECURITY_WAGE_BASE) * SOCIAL_SECURITY_RATE);
    const employerMedicare = (0, pay_calculations_1.roundToTwoDecimals)(totalGrossWages * MEDICARE_RATE);
    const totalEmployerTaxes = employerSocialSecurity + employerMedicare;
    const totalDeposits = totalFederalWithheld +
        (employerSocialSecurity * 2) +
        (employerMedicare * 2);
    return {
        employerSocialSecurity,
        employerMedicare,
        totalEmployerTaxes: (0, pay_calculations_1.roundToTwoDecimals)(totalEmployerTaxes),
        totalDeposits: (0, pay_calculations_1.roundToTwoDecimals)(totalDeposits),
    };
}
//# sourceMappingURL=tax-calculations.js.map