"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateUnits = calculateUnits;
exports.applyRounding = applyRounding;
exports.calculateBaseAmount = calculateBaseAmount;
exports.applyModifiers = applyModifiers;
exports.calculateRateWithTimeModifiers = calculateRateWithTimeModifiers;
exports.isWeekend = isWeekend;
exports.isHoliday = isHoliday;
exports.isNightShift = isNightShift;
exports.calculateTax = calculateTax;
exports.calculateInvoiceTotal = calculateInvoiceTotal;
exports.calculateBalanceDue = calculateBalanceDue;
exports.roundToTwoDecimals = roundToTwoDecimals;
exports.formatCurrency = formatCurrency;
exports.calculateCollectionRate = calculateCollectionRate;
exports.calculateDenialRate = calculateDenialRate;
exports.calculateAveragePaymentDays = calculateAveragePaymentDays;
exports.isInvoicePastDue = isInvoicePastDue;
exports.calculateDaysPastDue = calculateDaysPastDue;
exports.calculateLateFee = calculateLateFee;
exports.validateInvoiceAmounts = validateInvoiceAmounts;
exports.generateInvoiceNumber = generateInvoiceNumber;
exports.generatePaymentNumber = generatePaymentNumber;
exports.generateClaimNumber = generateClaimNumber;
exports.getServiceDateRange = getServiceDateRange;
exports.calculateDueDate = calculateDueDate;
function calculateUnits(durationMinutes, unitType, roundingRule) {
    let units;
    switch (unitType) {
        case 'HOUR':
            units = durationMinutes / 60;
            break;
        case 'VISIT':
            units = 1;
            break;
        case 'DAY':
            units = 1;
            break;
        case 'WEEK':
            units = 1;
            break;
        case 'MONTH':
            units = 1;
            break;
        case 'TASK':
            units = 1;
            break;
        case 'MILE':
            units = durationMinutes;
            break;
        case 'UNIT':
            units = durationMinutes;
            break;
        default:
            throw new Error(`Unknown unit type: ${unitType}`);
    }
    return roundingRule ? applyRounding(units, roundingRule) : units;
}
function applyRounding(units, rule) {
    switch (rule) {
        case 'NONE':
            return units;
        case 'UP':
            return Math.ceil(units);
        case 'DOWN':
            return Math.floor(units);
        case 'NEAREST':
            return Math.round(units);
        case 'QUARTER_HOUR':
            return Math.ceil(units * 4) / 4;
        case 'HALF_HOUR':
            return Math.ceil(units * 2) / 2;
        default:
            throw new Error(`Unknown rounding rule: ${rule}`);
    }
}
function calculateBaseAmount(units, unitRate) {
    return roundToTwoDecimals(units * unitRate);
}
function applyModifiers(baseAmount, modifiers) {
    if (!modifiers || modifiers.length === 0) {
        return baseAmount;
    }
    let amount = baseAmount;
    for (const modifier of modifiers) {
        if (modifier.multiplier !== undefined) {
            amount *= modifier.multiplier;
        }
        if (modifier.addedAmount !== undefined) {
            amount += modifier.addedAmount;
        }
    }
    return roundToTwoDecimals(amount);
}
function calculateRateWithTimeModifiers(baseRate, serviceRate, options) {
    let rate = baseRate;
    if (options?.isWeekend && serviceRate?.weekendRate) {
        rate *= serviceRate.weekendRate;
    }
    if (options?.isHoliday && serviceRate?.holidayRate) {
        rate *= serviceRate.holidayRate;
    }
    if (options?.isNightShift && serviceRate?.nightRate) {
        rate *= serviceRate.nightRate;
    }
    if (options?.isOvertime && serviceRate?.overtimeRate) {
        rate *= serviceRate.overtimeRate;
    }
    return roundToTwoDecimals(rate);
}
function isWeekend(date) {
    const day = date.getDay();
    return day === 0 || day === 6;
}
function isHoliday(date) {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear();
    if (month === 1 && day === 1)
        return true;
    if (month === 1 && isNthWeekdayOfMonth(date, 1, 3))
        return true;
    if (month === 2 && isNthWeekdayOfMonth(date, 1, 3))
        return true;
    if (month === 5 && isLastWeekdayOfMonth(date, 1))
        return true;
    if (month === 6 && day === 19)
        return true;
    if (month === 7 && day === 4)
        return true;
    if (month === 9 && isNthWeekdayOfMonth(date, 1, 1))
        return true;
    if (month === 10 && isNthWeekdayOfMonth(date, 1, 2))
        return true;
    if (month === 11 && day === 11)
        return true;
    if (month === 11 && isNthWeekdayOfMonth(date, 4, 4))
        return true;
    if (month === 12 && day === 25)
        return true;
    return false;
}
function isNthWeekdayOfMonth(date, weekday, nth) {
    if (date.getDay() !== weekday)
        return false;
    const dayOfMonth = date.getDate();
    const nthStart = (nth - 1) * 7 + 1;
    const nthEnd = nth * 7;
    return dayOfMonth >= nthStart && dayOfMonth <= nthEnd;
}
function isLastWeekdayOfMonth(date, weekday) {
    if (date.getDay() !== weekday)
        return false;
    const nextWeek = new Date(date);
    nextWeek.setDate(date.getDate() + 7);
    return nextWeek.getMonth() !== date.getMonth();
}
function isNightShift(time, nightStart = 22, nightEnd = 6) {
    const hour = time.getHours();
    if (nightStart > nightEnd) {
        return hour >= nightStart || hour < nightEnd;
    }
    else {
        return hour >= nightStart && hour < nightEnd;
    }
}
function calculateTax(subtotal, taxRate) {
    if (taxRate <= 0)
        return 0;
    return roundToTwoDecimals(subtotal * taxRate);
}
function calculateInvoiceTotal(subtotal, taxAmount = 0, discountAmount = 0, adjustmentAmount = 0) {
    const total = subtotal + taxAmount - discountAmount + adjustmentAmount;
    return roundToTwoDecimals(Math.max(0, total));
}
function calculateBalanceDue(totalAmount, paidAmount) {
    const balance = totalAmount - paidAmount;
    return roundToTwoDecimals(Math.max(0, balance));
}
function roundToTwoDecimals(amount) {
    return Math.round(amount * 100) / 100;
}
function formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
    }).format(amount);
}
function calculateCollectionRate(totalBilled, totalPaid) {
    if (totalBilled === 0)
        return 0;
    return roundToTwoDecimals((totalPaid / totalBilled) * 100);
}
function calculateDenialRate(totalClaims, deniedClaims) {
    if (totalClaims === 0)
        return 0;
    return roundToTwoDecimals((deniedClaims / totalClaims) * 100);
}
function calculateAveragePaymentDays(invoices) {
    if (invoices.length === 0)
        return 0;
    const totalDays = invoices.reduce((sum, invoice) => {
        const days = Math.floor((invoice.paymentDate.getTime() - invoice.invoiceDate.getTime()) /
            (1000 * 60 * 60 * 24));
        return sum + days;
    }, 0);
    return Math.round(totalDays / invoices.length);
}
function isInvoicePastDue(dueDate, currentDate = new Date()) {
    return currentDate > dueDate;
}
function calculateDaysPastDue(dueDate, currentDate = new Date()) {
    if (!isInvoicePastDue(dueDate, currentDate))
        return 0;
    const days = Math.floor((currentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
}
function calculateLateFee(balanceDue, lateFeeRate, daysPastDue, gracePeriodDays = 0) {
    if (daysPastDue <= gracePeriodDays)
        return 0;
    if (lateFeeRate <= 0)
        return 0;
    const applicableDays = daysPastDue - gracePeriodDays;
    const dailyRate = lateFeeRate / 365;
    const lateFee = balanceDue * dailyRate * applicableDays;
    return roundToTwoDecimals(lateFee);
}
function validateInvoiceAmounts(invoice) {
    const errors = [];
    const expectedTotal = calculateInvoiceTotal(invoice.subtotal, invoice.taxAmount, invoice.discountAmount, invoice.adjustmentAmount);
    if (Math.abs(invoice.totalAmount - expectedTotal) > 0.01) {
        errors.push(`Total amount mismatch: expected ${expectedTotal}, got ${invoice.totalAmount}`);
    }
    const expectedBalance = calculateBalanceDue(invoice.totalAmount, invoice.paidAmount);
    if (Math.abs(invoice.balanceDue - expectedBalance) > 0.01) {
        errors.push(`Balance due mismatch: expected ${expectedBalance}, got ${invoice.balanceDue}`);
    }
    if (invoice.subtotal < 0) {
        errors.push('Subtotal cannot be negative');
    }
    if (invoice.taxAmount < 0) {
        errors.push('Tax amount cannot be negative');
    }
    if (invoice.totalAmount < 0) {
        errors.push('Total amount cannot be negative');
    }
    if (invoice.paidAmount < 0) {
        errors.push('Paid amount cannot be negative');
    }
    if (invoice.balanceDue < 0) {
        errors.push('Balance due cannot be negative');
    }
    return {
        valid: errors.length === 0,
        errors,
    };
}
function generateInvoiceNumber(organizationCode, sequence, year) {
    const invoiceYear = year || new Date().getFullYear();
    const paddedSequence = sequence.toString().padStart(6, '0');
    return `INV-${organizationCode}-${invoiceYear}-${paddedSequence}`;
}
function generatePaymentNumber(organizationCode, sequence, year) {
    const paymentYear = year || new Date().getFullYear();
    const paddedSequence = sequence.toString().padStart(6, '0');
    return `PAY-${organizationCode}-${paymentYear}-${paddedSequence}`;
}
function generateClaimNumber(organizationCode, sequence, year) {
    const claimYear = year || new Date().getFullYear();
    const paddedSequence = sequence.toString().padStart(6, '0');
    return `CLM-${organizationCode}-${claimYear}-${paddedSequence}`;
}
function getServiceDateRange(periodStart, periodEnd) {
    return {
        startDate: new Date(periodStart),
        endDate: new Date(periodEnd),
    };
}
function calculateDueDate(invoiceDate, paymentTermsDays) {
    const dueDate = new Date(invoiceDate);
    dueDate.setDate(dueDate.getDate() + paymentTermsDays);
    return dueDate;
}
//# sourceMappingURL=billing-calculations.js.map