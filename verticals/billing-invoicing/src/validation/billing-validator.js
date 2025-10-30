"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCreateBillableItem = validateCreateBillableItem;
exports.validateCreateInvoice = validateCreateInvoice;
exports.validateCreatePayment = validateCreatePayment;
exports.validateAllocatePayment = validateAllocatePayment;
exports.validateCreateRateSchedule = validateCreateRateSchedule;
exports.validateCreatePayer = validateCreatePayer;
exports.validateCreateAuthorization = validateCreateAuthorization;
exports.validateSubmitClaim = validateSubmitClaim;
exports.validateBillableStatusTransition = validateBillableStatusTransition;
exports.validateInvoiceStatusTransition = validateInvoiceStatusTransition;
exports.validatePaymentStatusTransition = validatePaymentStatusTransition;
exports.validateAuthorizationStatusTransition = validateAuthorizationStatusTransition;
exports.isValidPayerType = isValidPayerType;
exports.isValidUnitType = isValidUnitType;
function validateCreateBillableItem(input) {
    const errors = [];
    const warnings = [];
    if (!input.organizationId) {
        errors.push('organizationId is required');
    }
    if (!input.branchId) {
        errors.push('branchId is required');
    }
    if (!input.clientId) {
        errors.push('clientId is required');
    }
    if (!input.serviceTypeId) {
        errors.push('serviceTypeId is required');
    }
    if (!input.serviceTypeCode) {
        errors.push('serviceTypeCode is required');
    }
    if (!input.serviceTypeName) {
        errors.push('serviceTypeName is required');
    }
    if (!input.serviceDate) {
        errors.push('serviceDate is required');
    }
    if (!input.payerId) {
        errors.push('payerId is required');
    }
    if (!input.payerType) {
        errors.push('payerType is required');
    }
    if (!input.payerName) {
        errors.push('payerName is required');
    }
    if (input.durationMinutes < 0) {
        errors.push('durationMinutes cannot be negative');
    }
    if (input.units <= 0) {
        errors.push('units must be greater than zero');
    }
    const validUnitTypes = [
        'HOUR',
        'VISIT',
        'DAY',
        'WEEK',
        'MONTH',
        'TASK',
        'MILE',
        'UNIT',
    ];
    if (!validUnitTypes.includes(input.unitType)) {
        errors.push(`Invalid unit type: ${input.unitType}`);
    }
    if (input.serviceDate) {
        const serviceDate = new Date(input.serviceDate);
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        if (serviceDate > today) {
            errors.push('Service date cannot be in the future');
        }
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        if (serviceDate < oneYearAgo) {
            warnings.push('Service date is more than 1 year old - may be past claim filing limit');
        }
    }
    if (input.startTime && input.endTime) {
        const start = new Date(input.startTime);
        const end = new Date(input.endTime);
        if (start >= end) {
            errors.push('startTime must be before endTime');
        }
    }
    if (input.authorizationId && !input.authorizationNumber) {
        warnings.push('Authorization ID provided but authorization number missing');
    }
    if ((input.payerType === 'MEDICAID' || input.payerType === 'MEDICARE') &&
        !input.evvRecordId) {
        warnings.push('EVV record ID recommended for Medicaid/Medicare billing compliance');
    }
    return {
        valid: errors.length === 0,
        errors,
        warnings: warnings.length > 0 ? warnings : undefined,
    };
}
function validateCreateInvoice(input) {
    const errors = [];
    const warnings = [];
    if (!input.organizationId) {
        errors.push('organizationId is required');
    }
    if (!input.branchId) {
        errors.push('branchId is required');
    }
    if (!input.payerId) {
        errors.push('payerId is required');
    }
    if (!input.payerType) {
        errors.push('payerType is required');
    }
    if (!input.payerName) {
        errors.push('payerName is required');
    }
    if (!input.periodStart) {
        errors.push('periodStart is required');
    }
    if (!input.periodEnd) {
        errors.push('periodEnd is required');
    }
    if (!input.invoiceDate) {
        errors.push('invoiceDate is required');
    }
    if (!input.dueDate) {
        errors.push('dueDate is required');
    }
    if (!input.billableItemIds || input.billableItemIds.length === 0) {
        errors.push('At least one billable item is required');
    }
    if (input.periodStart && input.periodEnd) {
        const start = new Date(input.periodStart);
        const end = new Date(input.periodEnd);
        if (start > end) {
            errors.push('periodStart must be before or equal to periodEnd');
        }
    }
    if (input.invoiceDate && input.dueDate) {
        const invoiceDate = new Date(input.invoiceDate);
        const dueDate = new Date(input.dueDate);
        if (invoiceDate > dueDate) {
            errors.push('invoiceDate must be before or equal to dueDate');
        }
    }
    if (input.payerType === 'PRIVATE_PAY' && !input.clientId) {
        warnings.push('clientId recommended for private pay invoices');
    }
    return {
        valid: errors.length === 0,
        errors,
        warnings: warnings.length > 0 ? warnings : undefined,
    };
}
function validateCreatePayment(input) {
    const errors = [];
    const warnings = [];
    if (!input.organizationId) {
        errors.push('organizationId is required');
    }
    if (!input.branchId) {
        errors.push('branchId is required');
    }
    if (!input.payerId) {
        errors.push('payerId is required');
    }
    if (!input.payerType) {
        errors.push('payerType is required');
    }
    if (!input.payerName) {
        errors.push('payerName is required');
    }
    if (!input.amount) {
        errors.push('amount is required');
    }
    if (!input.paymentDate) {
        errors.push('paymentDate is required');
    }
    if (!input.receivedDate) {
        errors.push('receivedDate is required');
    }
    if (!input.paymentMethod) {
        errors.push('paymentMethod is required');
    }
    if (input.amount <= 0) {
        errors.push('amount must be greater than zero');
    }
    if (input.paymentDate && input.receivedDate) {
        const paymentDate = new Date(input.paymentDate);
        const receivedDate = new Date(input.receivedDate);
        if (paymentDate > receivedDate) {
            errors.push('paymentDate cannot be after receivedDate');
        }
        const today = new Date();
        if (paymentDate > today) {
            warnings.push('paymentDate is in the future');
        }
    }
    if (input.paymentMethod === 'CHECK' && !input.referenceNumber) {
        warnings.push('Reference number (check number) recommended for check payments');
    }
    return {
        valid: errors.length === 0,
        errors,
        warnings: warnings.length > 0 ? warnings : undefined,
    };
}
function validateAllocatePayment(input, currentUnapplied) {
    const errors = [];
    const warnings = [];
    if (!input.paymentId) {
        errors.push('paymentId is required');
    }
    if (!input.allocations || input.allocations.length === 0) {
        errors.push('At least one allocation is required');
    }
    const totalAllocated = input.allocations.reduce((sum, alloc) => sum + alloc.amount, 0);
    if (totalAllocated > currentUnapplied) {
        errors.push(`Total allocation (${totalAllocated}) exceeds unapplied amount (${currentUnapplied})`);
    }
    for (const allocation of input.allocations) {
        if (!allocation.invoiceId) {
            errors.push('Each allocation must have an invoiceId');
        }
        if (allocation.amount <= 0) {
            errors.push('Allocation amount must be greater than zero');
        }
    }
    if (totalAllocated < currentUnapplied) {
        const remaining = currentUnapplied - totalAllocated;
        warnings.push(`${remaining.toFixed(2)} will remain unapplied after this allocation`);
    }
    return {
        valid: errors.length === 0,
        errors,
        warnings: warnings.length > 0 ? warnings : undefined,
    };
}
function validateCreateRateSchedule(input) {
    const errors = [];
    const warnings = [];
    if (!input.organizationId) {
        errors.push('organizationId is required');
    }
    if (!input.name) {
        errors.push('name is required');
    }
    if (!input.scheduleType) {
        errors.push('scheduleType is required');
    }
    if (!input.effectiveFrom) {
        errors.push('effectiveFrom is required');
    }
    if (!input.rates || input.rates.length === 0) {
        errors.push('At least one rate is required');
    }
    if (input.effectiveFrom && input.effectiveTo) {
        const from = new Date(input.effectiveFrom);
        const to = new Date(input.effectiveTo);
        if (from > to) {
            errors.push('effectiveFrom must be before or equal to effectiveTo');
        }
    }
    if (input.scheduleType === 'PAYER_SPECIFIC' && !input.payerId) {
        errors.push('payerId required for PAYER_SPECIFIC schedule type');
    }
    for (let i = 0; i < (input.rates?.length || 0); i++) {
        const rate = input.rates[i];
        const ratePrefix = `Rate ${i + 1}`;
        if (!rate.serviceTypeId) {
            errors.push(`${ratePrefix}: serviceTypeId is required`);
        }
        if (!rate.serviceTypeCode) {
            errors.push(`${ratePrefix}: serviceTypeCode is required`);
        }
        if (!rate.serviceTypeName) {
            errors.push(`${ratePrefix}: serviceTypeName is required`);
        }
        if (!rate.unitType) {
            errors.push(`${ratePrefix}: unitType is required`);
        }
        if (rate.unitRate === undefined || rate.unitRate < 0) {
            errors.push(`${ratePrefix}: unitRate must be >= 0`);
        }
        if (rate.minimumUnits !== undefined &&
            rate.maximumUnits !== undefined &&
            rate.minimumUnits > rate.maximumUnits) {
            errors.push(`${ratePrefix}: minimumUnits cannot exceed maximumUnits`);
        }
    }
    return {
        valid: errors.length === 0,
        errors,
        warnings: warnings.length > 0 ? warnings : undefined,
    };
}
function validateCreatePayer(input) {
    const errors = [];
    const warnings = [];
    if (!input.organizationId) {
        errors.push('organizationId is required');
    }
    if (!input.payerName) {
        errors.push('payerName is required');
    }
    if (!input.payerType) {
        errors.push('payerType is required');
    }
    if (input.paymentTermsDays < 0) {
        errors.push('paymentTermsDays cannot be negative');
    }
    if (input.paymentTermsDays > 365) {
        warnings.push('paymentTermsDays exceeds 1 year');
    }
    if (input.payerType === 'MEDICAID') {
        warnings.push('Ensure Medicaid provider ID is configured');
    }
    if (input.payerType === 'MEDICARE') {
        warnings.push('Ensure Medicare provider ID is configured');
    }
    if (input.billingEmail && !isValidEmail(input.billingEmail)) {
        errors.push('Invalid billing email address');
    }
    if (input.email && !isValidEmail(input.email)) {
        errors.push('Invalid email address');
    }
    return {
        valid: errors.length === 0,
        errors,
        warnings: warnings.length > 0 ? warnings : undefined,
    };
}
function validateCreateAuthorization(input) {
    const errors = [];
    const warnings = [];
    if (!input.organizationId) {
        errors.push('organizationId is required');
    }
    if (!input.branchId) {
        errors.push('branchId is required');
    }
    if (!input.clientId) {
        errors.push('clientId is required');
    }
    if (!input.authorizationNumber) {
        errors.push('authorizationNumber is required');
    }
    if (!input.authorizationType) {
        errors.push('authorizationType is required');
    }
    if (!input.payerId) {
        errors.push('payerId is required');
    }
    if (!input.serviceTypeId) {
        errors.push('serviceTypeId is required');
    }
    if (!input.effectiveFrom) {
        errors.push('effectiveFrom is required');
    }
    if (!input.effectiveTo) {
        errors.push('effectiveTo is required');
    }
    if (input.authorizedUnits <= 0) {
        errors.push('authorizedUnits must be greater than zero');
    }
    if (!input.unitType) {
        errors.push('unitType is required');
    }
    if (input.effectiveFrom && input.effectiveTo) {
        const from = new Date(input.effectiveFrom);
        const to = new Date(input.effectiveTo);
        if (from > to) {
            errors.push('effectiveFrom must be before effectiveTo');
        }
        const daysDiff = Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff < 7) {
            warnings.push('Authorization period is less than 1 week');
        }
        const today = new Date();
        if (to < today) {
            warnings.push('Authorization end date is in the past');
        }
    }
    if (input.requiresReferral && !input.referralNumber) {
        warnings.push('Referral number recommended when referral is required');
    }
    return {
        valid: errors.length === 0,
        errors,
        warnings: warnings.length > 0 ? warnings : undefined,
    };
}
function validateSubmitClaim(input) {
    const errors = [];
    const warnings = [];
    if (!input.organizationId) {
        errors.push('organizationId is required');
    }
    if (!input.branchId) {
        errors.push('branchId is required');
    }
    if (!input.invoiceId) {
        errors.push('invoiceId is required');
    }
    if (!input.claimType) {
        errors.push('claimType is required');
    }
    if (!input.claimFormat) {
        errors.push('claimFormat is required');
    }
    if (!input.submissionMethod) {
        errors.push('submissionMethod is required');
    }
    if (input.claimFormat === 'EDI_837P' ||
        input.claimFormat === 'EDI_837I') {
        if (input.submissionMethod !== 'EDI' &&
            input.submissionMethod !== 'CLEARINGHOUSE') {
            warnings.push('EDI claim formats typically require EDI or CLEARINGHOUSE submission method');
        }
    }
    return {
        valid: errors.length === 0,
        errors,
        warnings: warnings.length > 0 ? warnings : undefined,
    };
}
function validateBillableStatusTransition(currentStatus, newStatus) {
    const errors = [];
    const warnings = [];
    const validTransitions = {
        PENDING: ['READY', 'HOLD', 'VOIDED'],
        READY: ['INVOICED', 'HOLD', 'VOIDED'],
        INVOICED: ['SUBMITTED', 'ADJUSTED', 'VOIDED'],
        SUBMITTED: ['PAID', 'PARTIAL_PAID', 'DENIED', 'ADJUSTED'],
        PAID: ['ADJUSTED'],
        PARTIAL_PAID: ['PAID', 'ADJUSTED'],
        DENIED: ['APPEALED', 'VOIDED'],
        APPEALED: ['PAID', 'PARTIAL_PAID', 'VOIDED'],
        ADJUSTED: ['READY', 'INVOICED', 'PAID'],
        VOIDED: [],
        HOLD: ['READY', 'VOIDED'],
    };
    const allowedTransitions = validTransitions[currentStatus] || [];
    if (!allowedTransitions.includes(newStatus)) {
        errors.push(`Invalid status transition from ${currentStatus} to ${newStatus}`);
    }
    if (currentStatus === 'PAID' && newStatus === 'ADJUSTED') {
        warnings.push('Adjusting a paid billable item may require payment reversal or refund');
    }
    return {
        valid: errors.length === 0,
        errors,
        warnings: warnings.length > 0 ? warnings : undefined,
    };
}
function validateInvoiceStatusTransition(currentStatus, newStatus) {
    const errors = [];
    const warnings = [];
    const validTransitions = {
        DRAFT: ['PENDING_REVIEW', 'CANCELLED'],
        PENDING_REVIEW: ['APPROVED', 'DRAFT', 'CANCELLED'],
        APPROVED: ['SENT', 'SUBMITTED', 'CANCELLED'],
        SENT: ['PARTIALLY_PAID', 'PAID', 'PAST_DUE', 'DISPUTED', 'CANCELLED'],
        SUBMITTED: ['PARTIALLY_PAID', 'PAID', 'PAST_DUE', 'DISPUTED'],
        PARTIALLY_PAID: ['PAID', 'PAST_DUE', 'DISPUTED'],
        PAID: ['DISPUTED'],
        PAST_DUE: ['PARTIALLY_PAID', 'PAID', 'DISPUTED', 'CANCELLED'],
        DISPUTED: ['SENT', 'PARTIALLY_PAID', 'PAID', 'CANCELLED'],
        CANCELLED: [],
        VOIDED: [],
    };
    const allowedTransitions = validTransitions[currentStatus] || [];
    if (!allowedTransitions.includes(newStatus)) {
        errors.push(`Invalid status transition from ${currentStatus} to ${newStatus}`);
    }
    return {
        valid: errors.length === 0,
        errors,
        warnings: warnings.length > 0 ? warnings : undefined,
    };
}
function validatePaymentStatusTransition(currentStatus, newStatus) {
    const errors = [];
    const validTransitions = {
        PENDING: ['RECEIVED', 'VOIDED'],
        RECEIVED: ['APPLIED', 'DEPOSITED', 'RETURNED', 'VOIDED'],
        APPLIED: ['DEPOSITED', 'RETURNED', 'VOIDED', 'REFUNDED'],
        DEPOSITED: ['CLEARED', 'RETURNED'],
        CLEARED: ['REFUNDED'],
        RETURNED: ['VOIDED'],
        VOIDED: [],
        REFUNDED: [],
    };
    const allowedTransitions = validTransitions[currentStatus] || [];
    if (!allowedTransitions.includes(newStatus)) {
        errors.push(`Invalid status transition from ${currentStatus} to ${newStatus}`);
    }
    return {
        valid: errors.length === 0,
        errors,
    };
}
function validateAuthorizationStatusTransition(currentStatus, newStatus) {
    const errors = [];
    const validTransitions = {
        PENDING: ['ACTIVE', 'DENIED', 'CANCELLED'],
        ACTIVE: ['DEPLETED', 'EXPIRED', 'SUSPENDED', 'CANCELLED'],
        DEPLETED: ['EXPIRED'],
        EXPIRED: [],
        SUSPENDED: ['ACTIVE', 'CANCELLED'],
        CANCELLED: [],
        DENIED: [],
    };
    const allowedTransitions = validTransitions[currentStatus] || [];
    if (!allowedTransitions.includes(newStatus)) {
        errors.push(`Invalid status transition from ${currentStatus} to ${newStatus}`);
    }
    return {
        valid: errors.length === 0,
        errors,
    };
}
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
function isValidPayerType(payerType) {
    const validTypes = [
        'MEDICAID',
        'MEDICARE',
        'MEDICARE_ADVANTAGE',
        'PRIVATE_INSURANCE',
        'MANAGED_CARE',
        'VETERANS_BENEFITS',
        'WORKERS_COMP',
        'PRIVATE_PAY',
        'GRANT',
        'OTHER',
    ];
    return validTypes.includes(payerType);
}
function isValidUnitType(unitType) {
    const validTypes = [
        'HOUR',
        'VISIT',
        'DAY',
        'WEEK',
        'MONTH',
        'TASK',
        'MILE',
        'UNIT',
    ];
    return validTypes.includes(unitType);
}
//# sourceMappingURL=billing-validator.js.map