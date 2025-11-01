/**
 * Billing validation layer
 * 
 * Comprehensive validation for billing entities and operations
 */

import {
  CreateBillableItemInput,
  CreateInvoiceInput,
  CreatePaymentInput,
  AllocatePaymentInput,
  CreateRateScheduleInput,
  CreatePayerInput,
  CreateAuthorizationInput,
  SubmitClaimInput,
  PayerType,
  UnitType,
  BillableStatus,
  InvoiceStatus,
  PaymentStatus,
  AuthorizationStatus,
} from '../types/billing';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

/**
 * Validate billable item creation
 */
export function validateCreateBillableItem(
  input: CreateBillableItemInput
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
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

  // Duration and units
  if (input.durationMinutes < 0) {
    errors.push('durationMinutes cannot be negative');
  }
  if (input.units <= 0) {
    errors.push('units must be greater than zero');
  }

  // Unit type validation
  const validUnitTypes: UnitType[] = [
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

  // Service date validation
  if (input.serviceDate) {
    const serviceDate = new Date(input.serviceDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today

    if (serviceDate > today) {
      errors.push('Service date cannot be in the future');
    }

    // Warn if service date is very old (> 1 year)
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    if (serviceDate < oneYearAgo) {
      warnings.push(
        'Service date is more than 1 year old - may be past claim filing limit'
      );
    }
  }

  // Time validation
  if (input.startTime && input.endTime) {
    const start = new Date(input.startTime);
    const end = new Date(input.endTime);
    if (start >= end) {
      errors.push('startTime must be before endTime');
    }
  }

  // Authorization validation
  if (input.authorizationId && !input.authorizationNumber) {
    warnings.push('Authorization ID provided but authorization number missing');
  }

  // EVV validation for Medicaid/Medicare
  if (
    (input.payerType === 'MEDICAID' || input.payerType === 'MEDICARE') &&
    !input.evvRecordId
  ) {
    warnings.push(
      'EVV record ID recommended for Medicaid/Medicare billing compliance'
    );
  }

  const result: ValidationResult = {
    valid: errors.length === 0,
    errors,
  };
  if (warnings.length > 0) {
    result.warnings = warnings;
  }
  return result;
}

/**
 * Validate invoice creation
 */
export function validateCreateInvoice(
  input: CreateInvoiceInput
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
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

  // Billable items
  if (!input.billableItemIds || input.billableItemIds.length === 0) {
    errors.push('At least one billable item is required');
  }

  // Date validations
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

  // Private pay specific validation
  if (input.payerType === 'PRIVATE_PAY' && !input.clientId) {
    warnings.push('clientId recommended for private pay invoices');
  }

  const result: ValidationResult = {
    valid: errors.length === 0,
    errors,
  };
  if (warnings.length > 0) {
    result.warnings = warnings;
  }
  return result;
}

/**
 * Validate payment creation
 */
export function validateCreatePayment(
  input: CreatePaymentInput
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
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

  // Amount validation
  if (input.amount <= 0) {
    errors.push('amount must be greater than zero');
  }

  // Date validation
  if (input.paymentDate && input.receivedDate) {
    const paymentDate = new Date(input.paymentDate);
    const receivedDate = new Date(input.receivedDate);
    if (paymentDate > receivedDate) {
      errors.push('paymentDate cannot be after receivedDate');
    }

    // Warn if payment date is in the future
    const today = new Date();
    if (paymentDate > today) {
      warnings.push('paymentDate is in the future');
    }
  }

  // Reference number for checks
  if (input.paymentMethod === 'CHECK' && !input.referenceNumber) {
    warnings.push('Reference number (check number) recommended for check payments');
  }

  const result: ValidationResult = {
    valid: errors.length === 0,
    errors,
  };
  if (warnings.length > 0) {
    result.warnings = warnings;
  }
  return result;
}

/**
 * Validate payment allocation
 */
export function validateAllocatePayment(
  input: AllocatePaymentInput,
  currentUnapplied: number
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!input.paymentId) {
    errors.push('paymentId is required');
  }
  if (!input.allocations || input.allocations.length === 0) {
    errors.push('At least one allocation is required');
  }

  // Calculate total allocation
  const totalAllocated = input.allocations.reduce(
    (sum, alloc) => sum + alloc.amount,
    0
  );

  // Check if allocation exceeds available amount
  if (totalAllocated > currentUnapplied) {
    errors.push(
      `Total allocation (${totalAllocated}) exceeds unapplied amount (${currentUnapplied})`
    );
  }

  // Validate individual allocations
  for (const allocation of input.allocations) {
    if (!allocation.invoiceId) {
      errors.push('Each allocation must have an invoiceId');
    }
    if (allocation.amount <= 0) {
      errors.push('Allocation amount must be greater than zero');
    }
  }

  // Warn if not fully allocating payment
  if (totalAllocated < currentUnapplied) {
    const remaining = currentUnapplied - totalAllocated;
    warnings.push(
      `${remaining.toFixed(2)} will remain unapplied after this allocation`
    );
  }

  const result: ValidationResult = {
    valid: errors.length === 0,
    errors,
  };
  if (warnings.length > 0) {
    result.warnings = warnings;
  }
  return result;
}

/**
 * Validate rate schedule creation
 */
export function validateCreateRateSchedule(
  input: CreateRateScheduleInput
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
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

  // Date validation
  if (input.effectiveFrom && input.effectiveTo) {
    const from = new Date(input.effectiveFrom);
    const to = new Date(input.effectiveTo);
    if (from > to) {
      errors.push('effectiveFrom must be before or equal to effectiveTo');
    }
  }

  // Payer-specific validation
  if (input.scheduleType === 'PAYER_SPECIFIC' && !input.payerId) {
    errors.push('payerId required for PAYER_SPECIFIC schedule type');
  }

  // Validate rates
  if (input.rates) {
    for (let i = 0; i < input.rates.length; i++) {
      const rate = input.rates[i];
      if (!rate) continue;
      
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

      // Validate minimum/maximum
      if (
        rate.minimumUnits !== undefined &&
        rate.maximumUnits !== undefined &&
        rate.minimumUnits > rate.maximumUnits
      ) {
        errors.push(`${ratePrefix}: minimumUnits cannot exceed maximumUnits`);
      }
    }
  }

  const result: ValidationResult = {
    valid: errors.length === 0,
    errors,
  };
  if (warnings.length > 0) {
    result.warnings = warnings;
  }
  return result;
}

/**
 * Validate payer creation
 */
export function validateCreatePayer(input: CreatePayerInput): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!input.organizationId) {
    errors.push('organizationId is required');
  }
  if (!input.payerName) {
    errors.push('payerName is required');
  }
  if (!input.payerType) {
    errors.push('payerType is required');
  }

  // Payment terms validation
  if (input.paymentTermsDays < 0) {
    errors.push('paymentTermsDays cannot be negative');
  }
  if (input.paymentTermsDays > 365) {
    warnings.push('paymentTermsDays exceeds 1 year');
  }

  // Type-specific validation (future enhancement for payer-specific fields)
  if (input.payerType === 'MEDICAID') {
    warnings.push('Ensure Medicaid provider ID is configured');
  }
  if (input.payerType === 'MEDICARE') {
    warnings.push('Ensure Medicare provider ID is configured');
  }

  // Billing contact validation
  if (input.billingEmail && !isValidEmail(input.billingEmail)) {
    errors.push('Invalid billing email address');
  }
  if (input.email && !isValidEmail(input.email)) {
    errors.push('Invalid email address');
  }

  const result: ValidationResult = {
    valid: errors.length === 0,
    errors,
  };
  if (warnings.length > 0) {
    result.warnings = warnings;
  }
  return result;
}

/**
 * Validate service authorization creation
 */
export function validateCreateAuthorization(
  input: CreateAuthorizationInput
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
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

  // Units validation
  if (input.authorizedUnits <= 0) {
    errors.push('authorizedUnits must be greater than zero');
  }
  if (!input.unitType) {
    errors.push('unitType is required');
  }

  // Date validation
  if (input.effectiveFrom && input.effectiveTo) {
    const from = new Date(input.effectiveFrom);
    const to = new Date(input.effectiveTo);
    if (from > to) {
      errors.push('effectiveFrom must be before effectiveTo');
    }

    // Warn if authorization period is very short
    const daysDiff = Math.floor(
      (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysDiff < 7) {
      warnings.push('Authorization period is less than 1 week');
    }

    // Warn if authorization is already expired
    const today = new Date();
    if (to < today) {
      warnings.push('Authorization end date is in the past');
    }
  }

  // Referral validation
  if (input.requiresReferral && !input.referralNumber) {
    warnings.push('Referral number recommended when referral is required');
  }

  const result: ValidationResult = {
    valid: errors.length === 0,
    errors,
  };
  if (warnings.length > 0) {
    result.warnings = warnings;
  }
  return result;
}

/**
 * Validate claim submission
 */
export function validateSubmitClaim(input: SubmitClaimInput): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
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

  // Format-method compatibility
  if (
    input.claimFormat === 'EDI_837P' ||
    input.claimFormat === 'EDI_837I'
  ) {
    if (
      input.submissionMethod !== 'EDI' &&
      input.submissionMethod !== 'CLEARINGHOUSE'
    ) {
      warnings.push(
        'EDI claim formats typically require EDI or CLEARINGHOUSE submission method'
      );
    }
  }

  const result: ValidationResult = {
    valid: errors.length === 0,
    errors,
  };
  if (warnings.length > 0) {
    result.warnings = warnings;
  }
  return result;
}

/**
 * Validate billable item status transition
 */
export function validateBillableStatusTransition(
  currentStatus: BillableStatus,
  newStatus: BillableStatus
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Define valid transitions
  const validTransitions: Record<BillableStatus, BillableStatus[]> = {
    PENDING: ['READY', 'HOLD', 'VOIDED'],
    READY: ['INVOICED', 'HOLD', 'VOIDED'],
    INVOICED: ['SUBMITTED', 'ADJUSTED', 'VOIDED'],
    SUBMITTED: ['PAID', 'PARTIAL_PAID', 'DENIED', 'ADJUSTED'],
    PAID: ['ADJUSTED'],
    PARTIAL_PAID: ['PAID', 'ADJUSTED'],
    DENIED: ['APPEALED', 'VOIDED'],
    APPEALED: ['PAID', 'PARTIAL_PAID', 'VOIDED'],
    ADJUSTED: ['READY', 'INVOICED', 'PAID'],
    VOIDED: [], // Cannot transition from VOIDED
    HOLD: ['READY', 'VOIDED'],
  };

  const allowedTransitions = validTransitions[currentStatus] || [];

  if (!allowedTransitions.includes(newStatus)) {
    errors.push(
      `Invalid status transition from ${currentStatus} to ${newStatus}`
    );
  }

  // Warnings for specific transitions
  if (currentStatus === 'PAID' && newStatus === 'ADJUSTED') {
    warnings.push(
      'Adjusting a paid billable item may require payment reversal or refund'
    );
  }

  const result: ValidationResult = {
    valid: errors.length === 0,
    errors,
  };
  if (warnings.length > 0) {
    result.warnings = warnings;
  }
  return result;
}

/**
 * Validate invoice status transition
 */
export function validateInvoiceStatusTransition(
  currentStatus: InvoiceStatus,
  newStatus: InvoiceStatus
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Define valid transitions
  const validTransitions: Record<InvoiceStatus, InvoiceStatus[]> = {
    DRAFT: ['PENDING_REVIEW', 'CANCELLED'],
    PENDING_REVIEW: ['APPROVED', 'DRAFT', 'CANCELLED'],
    APPROVED: ['SENT', 'SUBMITTED', 'CANCELLED'],
    SENT: ['PARTIALLY_PAID', 'PAID', 'PAST_DUE', 'DISPUTED', 'CANCELLED'],
    SUBMITTED: ['PARTIALLY_PAID', 'PAID', 'PAST_DUE', 'DISPUTED'],
    PARTIALLY_PAID: ['PAID', 'PAST_DUE', 'DISPUTED'],
    PAID: ['DISPUTED'], // Can dispute even after payment
    PAST_DUE: ['PARTIALLY_PAID', 'PAID', 'DISPUTED', 'CANCELLED'],
    DISPUTED: ['SENT', 'PARTIALLY_PAID', 'PAID', 'CANCELLED'],
    CANCELLED: [], // Cannot transition from CANCELLED
    VOIDED: [], // Cannot transition from VOIDED
  };

  const allowedTransitions = validTransitions[currentStatus] || [];

  if (!allowedTransitions.includes(newStatus)) {
    errors.push(
      `Invalid status transition from ${currentStatus} to ${newStatus}`
    );
  }

  const result: ValidationResult = {
    valid: errors.length === 0,
    errors,
  };
  if (warnings.length > 0) {
    result.warnings = warnings;
  }
  return result;
}

/**
 * Validate payment status transition
 */
export function validatePaymentStatusTransition(
  currentStatus: PaymentStatus,
  newStatus: PaymentStatus
): ValidationResult {
  const errors: string[] = [];

  // Define valid transitions
  const validTransitions: Record<PaymentStatus, PaymentStatus[]> = {
    PENDING: ['RECEIVED', 'VOIDED'],
    RECEIVED: ['APPLIED', 'DEPOSITED', 'RETURNED', 'VOIDED'],
    APPLIED: ['DEPOSITED', 'RETURNED', 'VOIDED', 'REFUNDED'],
    DEPOSITED: ['CLEARED', 'RETURNED'],
    CLEARED: ['REFUNDED'],
    RETURNED: ['VOIDED'],
    VOIDED: [], // Cannot transition from VOIDED
    REFUNDED: [], // Cannot transition from REFUNDED
  };

  const allowedTransitions = validTransitions[currentStatus] || [];

  if (!allowedTransitions.includes(newStatus)) {
    errors.push(
      `Invalid status transition from ${currentStatus} to ${newStatus}`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate authorization status transition
 */
export function validateAuthorizationStatusTransition(
  currentStatus: AuthorizationStatus,
  newStatus: AuthorizationStatus
): ValidationResult {
  const errors: string[] = [];

  // Define valid transitions
  const validTransitions: Record<AuthorizationStatus, AuthorizationStatus[]> = {
    PENDING: ['ACTIVE', 'DENIED', 'CANCELLED'],
    ACTIVE: ['DEPLETED', 'EXPIRED', 'SUSPENDED', 'CANCELLED'],
    DEPLETED: ['EXPIRED'], // Can only expire after depletion
    EXPIRED: [], // Cannot transition from EXPIRED
    SUSPENDED: ['ACTIVE', 'CANCELLED'],
    CANCELLED: [], // Cannot transition from CANCELLED
    DENIED: [], // Cannot transition from DENIED
  };

  const allowedTransitions = validTransitions[currentStatus] || [];

  if (!allowedTransitions.includes(newStatus)) {
    errors.push(
      `Invalid status transition from ${currentStatus} to ${newStatus}`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Helper: Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate payer type
 */
export function isValidPayerType(payerType: string): payerType is PayerType {
  const validTypes: PayerType[] = [
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
  return validTypes.includes(payerType as PayerType);
}

/**
 * Validate unit type
 */
export function isValidUnitType(unitType: string): unitType is UnitType {
  const validTypes: UnitType[] = [
    'HOUR',
    'VISIT',
    'DAY',
    'WEEK',
    'MONTH',
    'TASK',
    'MILE',
    'UNIT',
  ];
  return validTypes.includes(unitType as UnitType);
}
