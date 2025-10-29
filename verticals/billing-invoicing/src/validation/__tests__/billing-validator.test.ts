/**
 * Unit tests for billing validation functions
 * 
 * Tests validation logic for all billing input types and status transitions
 * without requiring database or external dependencies
 */

import {
  validateCreateBillableItem,
  validateCreateInvoice,
  validateCreatePayment,
  validateAllocatePayment,
  validateCreateRateSchedule,
  validateCreatePayer,
  validateCreateAuthorization,
  validateSubmitClaim,
  validateBillableStatusTransition,
  validateInvoiceStatusTransition,
  validatePaymentStatusTransition,
  validateAuthorizationStatusTransition,
  isValidPayerType,
  isValidUnitType,
} from '../billing-validator';
import {
  CreateBillableItemInput,
  CreateInvoiceInput,
  CreatePaymentInput,
  AllocatePaymentInput,
  CreateRateScheduleInput,
  CreatePayerInput,
  CreateAuthorizationInput,
  SubmitClaimInput,
} from '../../types/billing';

describe('Billable Item Validation', () => {
  const validBillableItem: CreateBillableItemInput = {
    organizationId: 'org-123' as any,
    branchId: 'branch-123' as any,
    clientId: 'client-123' as any,
    serviceTypeId: 'service-123' as any,
    serviceTypeCode: 'S5100',
    serviceTypeName: 'Personal Care',
    serviceDate: new Date('2024-01-15'),
    durationMinutes: 60,
    unitType: 'HOUR',
    units: 1,
    payerId: 'payer-123' as any,
    payerType: 'MEDICAID',
    payerName: 'State Medicaid',
  };

  describe('validateCreateBillableItem', () => {
    it('should validate a correct billable item', () => {
      const result = validateCreateBillableItem(validBillableItem);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should require organizationId', () => {
      const input = { ...validBillableItem, organizationId: '' as any };
      const result = validateCreateBillableItem(input);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('organizationId is required');
    });

    it('should require clientId', () => {
      const input = { ...validBillableItem, clientId: '' as any };
      const result = validateCreateBillableItem(input);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('clientId is required');
    });

    it('should require service information', () => {
      const input = {
        ...validBillableItem,
        serviceTypeCode: '',
        serviceTypeName: '',
      };
      const result = validateCreateBillableItem(input);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });

    it('should reject negative duration', () => {
      const input = { ...validBillableItem, durationMinutes: -30 };
      const result = validateCreateBillableItem(input);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('durationMinutes cannot be negative');
    });

    it('should reject zero or negative units', () => {
      const input = { ...validBillableItem, units: 0 };
      const result = validateCreateBillableItem(input);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('units must be greater than zero');
    });

    it('should reject invalid unit type', () => {
      const input = { ...validBillableItem, unitType: 'INVALID' as any };
      const result = validateCreateBillableItem(input);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Invalid unit type');
    });

    it('should reject future service dates', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const input = { ...validBillableItem, serviceDate: futureDate };
      const result = validateCreateBillableItem(input);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Service date cannot be in the future');
    });

    it('should warn about old service dates', () => {
      const oldDate = new Date();
      oldDate.setFullYear(oldDate.getFullYear() - 2);
      const input = { ...validBillableItem, serviceDate: oldDate };
      const result = validateCreateBillableItem(input);
      expect(result.warnings).toBeDefined();
      expect(result.warnings![0]).toContain('more than 1 year old');
    });

    it('should reject startTime after endTime', () => {
      const input = {
        ...validBillableItem,
        startTime: new Date('2024-01-15T10:00:00Z'),
        endTime: new Date('2024-01-15T09:00:00Z'),
      };
      const result = validateCreateBillableItem(input);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('startTime must be before endTime');
    });

    it('should warn about missing EVV for Medicaid', () => {
      const input = { ...validBillableItem, evvRecordId: undefined };
      const result = validateCreateBillableItem(input);
      expect(result.warnings).toBeDefined();
      expect(result.warnings!.some((w) => w.includes('EVV record ID recommended'))).toBe(true);
    });

    it('should accept valid billable item with all optional fields', () => {
      const input = {
        ...validBillableItem,
        visitId: 'visit-123' as any,
        evvRecordId: 'evv-123' as any,
        caregiverId: 'caregiver-123' as any,
        caregiverName: 'Jane Smith',
        providerNPI: '1234567890',
        authorizationId: 'auth-123' as any,
        authorizationNumber: 'AUTH-001',
        notes: 'Regular care visit',
      };
      const result = validateCreateBillableItem(input);
      expect(result.valid).toBe(true);
    });
  });
});

describe('Invoice Validation', () => {
  const validInvoice: CreateInvoiceInput = {
    organizationId: 'org-123' as any,
    branchId: 'branch-123' as any,
    invoiceType: 'STANDARD',
    payerId: 'payer-123' as any,
    payerType: 'MEDICAID',
    payerName: 'State Medicaid',
    periodStart: new Date('2024-01-01'),
    periodEnd: new Date('2024-01-31'),
    invoiceDate: new Date('2024-02-01'),
    dueDate: new Date('2024-03-02'),
    billableItemIds: ['item-1' as any, 'item-2' as any],
  };

  describe('validateCreateInvoice', () => {
    it('should validate a correct invoice', () => {
      const result = validateCreateInvoice(validInvoice);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should require organizationId', () => {
      const input = { ...validInvoice, organizationId: '' as any };
      const result = validateCreateInvoice(input);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('organizationId is required');
    });

    it('should require at least one billable item', () => {
      const input = { ...validInvoice, billableItemIds: [] };
      const result = validateCreateInvoice(input);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('At least one billable item is required');
    });

    it('should reject periodStart after periodEnd', () => {
      const input = {
        ...validInvoice,
        periodStart: new Date('2024-01-31'),
        periodEnd: new Date('2024-01-01'),
      };
      const result = validateCreateInvoice(input);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('periodStart must be before or equal to periodEnd');
    });

    it('should reject invoiceDate after dueDate', () => {
      const input = {
        ...validInvoice,
        invoiceDate: new Date('2024-03-15'),
        dueDate: new Date('2024-03-01'),
      };
      const result = validateCreateInvoice(input);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('invoiceDate must be before or equal to dueDate');
    });

    it('should warn about missing clientId for private pay', () => {
      const input = {
        ...validInvoice,
        payerType: 'PRIVATE_PAY' as any,
        clientId: undefined,
      };
      const result = validateCreateInvoice(input);
      expect(result.warnings).toBeDefined();
      expect(result.warnings![0]).toContain('clientId recommended for private pay');
    });
  });
});

describe('Payment Validation', () => {
  const validPayment: CreatePaymentInput = {
    organizationId: 'org-123' as any,
    branchId: 'branch-123' as any,
    payerId: 'payer-123' as any,
    payerType: 'MEDICAID',
    payerName: 'State Medicaid',
    amount: 1000,
    paymentDate: new Date('2024-02-15'),
    receivedDate: new Date('2024-02-15'),
    paymentMethod: 'EFT',
  };

  describe('validateCreatePayment', () => {
    it('should validate a correct payment', () => {
      const result = validateCreatePayment(validPayment);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should require amount', () => {
      const input = { ...validPayment, amount: 0 as any };
      const result = validateCreatePayment(input);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('amount is required');
    });

    it('should reject zero or negative amount', () => {
      const input = { ...validPayment, amount: -100 };
      const result = validateCreatePayment(input);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('amount must be greater than zero');
    });

    it('should reject paymentDate after receivedDate', () => {
      const input = {
        ...validPayment,
        paymentDate: new Date('2024-02-20'),
        receivedDate: new Date('2024-02-15'),
      };
      const result = validateCreatePayment(input);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('paymentDate cannot be after receivedDate');
    });

    it('should warn about missing check number for CHECK payment', () => {
      const input = {
        ...validPayment,
        paymentMethod: 'CHECK' as any,
        referenceNumber: undefined,
      };
      const result = validateCreatePayment(input);
      expect(result.warnings).toBeDefined();
      expect(result.warnings![0]).toContain('Reference number');
    });

    it('should warn about future payment dates', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const input = {
        ...validPayment,
        paymentDate: futureDate,
        receivedDate: futureDate,
      };
      const result = validateCreatePayment(input);
      expect(result.warnings).toBeDefined();
      expect(result.warnings![0]).toContain('paymentDate is in the future');
    });
  });
});

describe('Payment Allocation Validation', () => {
  const validAllocation: AllocatePaymentInput = {
    paymentId: 'payment-123' as any,
    allocations: [
      {
        invoiceId: 'invoice-1' as any,
        amount: 500,
      },
      {
        invoiceId: 'invoice-2' as any,
        amount: 300,
      },
    ],
  };

  describe('validateAllocatePayment', () => {
    it('should validate correct allocation', () => {
      const result = validateAllocatePayment(validAllocation, 1000);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should require at least one allocation', () => {
      const input = { ...validAllocation, allocations: [] };
      const result = validateAllocatePayment(input, 1000);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('At least one allocation is required');
    });

    it('should reject allocation exceeding unapplied amount', () => {
      const result = validateAllocatePayment(validAllocation, 700); // Only 700 available
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('exceeds unapplied amount');
    });

    it('should reject allocation with missing invoiceId', () => {
      const input = {
        paymentId: 'payment-123' as any,
        allocations: [{ invoiceId: '' as any, amount: 500 }],
      };
      const result = validateAllocatePayment(input, 1000);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Each allocation must have an invoiceId');
    });

    it('should reject zero or negative allocation amounts', () => {
      const input = {
        paymentId: 'payment-123' as any,
        allocations: [{ invoiceId: 'invoice-1' as any, amount: 0 }],
      };
      const result = validateAllocatePayment(input, 1000);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Allocation amount must be greater than zero');
    });

    it('should warn about partial allocation', () => {
      const input = {
        paymentId: 'payment-123' as any,
        allocations: [{ invoiceId: 'invoice-1' as any, amount: 500 }],
      };
      const result = validateAllocatePayment(input, 1000);
      expect(result.warnings).toBeDefined();
      expect(result.warnings![0]).toContain('will remain unapplied');
    });
  });
});

describe('Rate Schedule Validation', () => {
  const validRateSchedule: CreateRateScheduleInput = {
    organizationId: 'org-123' as any,
    name: 'Standard Rates 2024',
    scheduleType: 'STANDARD',
    effectiveFrom: new Date('2024-01-01'),
    rates: [
      {
        serviceTypeId: 'service-1' as any,
        serviceTypeCode: 'S5100',
        serviceTypeName: 'Personal Care',
        unitType: 'HOUR',
        unitRate: 25.5,
      },
    ],
  };

  describe('validateCreateRateSchedule', () => {
    it('should validate correct rate schedule', () => {
      const result = validateCreateRateSchedule(validRateSchedule);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should require at least one rate', () => {
      const input = { ...validRateSchedule, rates: [] };
      const result = validateCreateRateSchedule(input);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('At least one rate is required');
    });

    it('should reject effectiveFrom after effectiveTo', () => {
      const input = {
        ...validRateSchedule,
        effectiveFrom: new Date('2024-12-31'),
        effectiveTo: new Date('2024-01-01'),
      };
      const result = validateCreateRateSchedule(input);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('effectiveFrom must be before or equal to effectiveTo');
    });

    it('should require payerId for PAYER_SPECIFIC schedule', () => {
      const input = {
        ...validRateSchedule,
        scheduleType: 'PAYER_SPECIFIC' as any,
        payerId: undefined,
      };
      const result = validateCreateRateSchedule(input);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('payerId required for PAYER_SPECIFIC schedule type');
    });

    it('should validate rate fields', () => {
      const input = {
        ...validRateSchedule,
        rates: [
          {
            serviceTypeId: '' as any,
            serviceTypeCode: '',
            serviceTypeName: '',
            unitType: '' as any,
            unitRate: -5,
          },
        ],
      };
      const result = validateCreateRateSchedule(input);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(3);
    });

    it('should reject invalid minimum/maximum units', () => {
      const input = {
        ...validRateSchedule,
        rates: [
          {
            ...validRateSchedule.rates[0],
            minimumUnits: 5,
            maximumUnits: 2,
          },
        ],
      };
      const result = validateCreateRateSchedule(input);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('minimumUnits cannot exceed maximumUnits');
    });
  });
});

describe('Payer Validation', () => {
  const validPayer: CreatePayerInput = {
    organizationId: 'org-123' as any,
    payerName: 'State Medicaid',
    payerType: 'MEDICAID',
    paymentTermsDays: 30,
    requiresPreAuthorization: true,
    requiresReferral: false,
  };

  describe('validateCreatePayer', () => {
    it('should validate correct payer', () => {
      const result = validateCreatePayer(validPayer);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should require payerName', () => {
      const input = { ...validPayer, payerName: '' };
      const result = validateCreatePayer(input);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('payerName is required');
    });

    it('should reject negative payment terms', () => {
      const input = { ...validPayer, paymentTermsDays: -10 };
      const result = validateCreatePayer(input);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('paymentTermsDays cannot be negative');
    });

    it('should warn about excessive payment terms', () => {
      const input = { ...validPayer, paymentTermsDays: 400 };
      const result = validateCreatePayer(input);
      expect(result.warnings).toBeDefined();
      expect(result.warnings![0]).toContain('exceeds 1 year');
    });

    it('should validate email format', () => {
      const input = { ...validPayer, email: 'invalid-email' };
      const result = validateCreatePayer(input);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid email address');
    });

    it('should validate billing email format', () => {
      const input = { ...validPayer, billingEmail: 'not-an-email' };
      const result = validateCreatePayer(input);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid billing email address');
    });
  });
});

describe('Authorization Validation', () => {
  const validAuth: CreateAuthorizationInput = {
    organizationId: 'org-123' as any,
    branchId: 'branch-123' as any,
    clientId: 'client-123' as any,
    authorizationNumber: 'AUTH-2024-001',
    authorizationType: 'INITIAL',
    payerId: 'payer-123' as any,
    payerType: 'MEDICAID',
    payerName: 'State Medicaid',
    serviceTypeId: 'service-123' as any,
    serviceTypeCode: 'S5100',
    serviceTypeName: 'Personal Care',
    authorizedUnits: 100,
    unitType: 'HOUR',
    effectiveFrom: new Date('2024-01-01'),
    effectiveTo: new Date('2024-12-31'),
    requiresReferral: false,
  };

  describe('validateCreateAuthorization', () => {
    it('should validate correct authorization', () => {
      const result = validateCreateAuthorization(validAuth);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should require authorization number', () => {
      const input = { ...validAuth, authorizationNumber: '' };
      const result = validateCreateAuthorization(input);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('authorizationNumber is required');
    });

    it('should reject zero or negative authorized units', () => {
      const input = { ...validAuth, authorizedUnits: 0 };
      const result = validateCreateAuthorization(input);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('authorizedUnits must be greater than zero');
    });

    it('should reject effectiveFrom after effectiveTo', () => {
      const input = {
        ...validAuth,
        effectiveFrom: new Date('2024-12-31'),
        effectiveTo: new Date('2024-01-01'),
      };
      const result = validateCreateAuthorization(input);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('effectiveFrom must be before effectiveTo');
    });

    it('should warn about short authorization periods', () => {
      const input = {
        ...validAuth,
        effectiveFrom: new Date('2024-01-01'),
        effectiveTo: new Date('2024-01-05'),
      };
      const result = validateCreateAuthorization(input);
      expect(result.warnings).toBeDefined();
      expect(result.warnings![0]).toContain('less than 1 week');
    });

    it('should warn about expired authorizations', () => {
      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 1);
      const input = {
        ...validAuth,
        effectiveFrom: pastDate,
        effectiveTo: pastDate,
      };
      const result = validateCreateAuthorization(input);
      expect(result.warnings).toBeDefined();
      expect(result.warnings!.some((w) => w.includes('in the past'))).toBe(true);
    });

    it('should warn about missing referral number', () => {
      const input = {
        ...validAuth,
        effectiveFrom: new Date('2025-01-01'),
        effectiveTo: new Date('2025-12-31'),
        requiresReferral: true,
        referralNumber: undefined,
      };
      const result = validateCreateAuthorization(input);
      expect(result.warnings).toBeDefined();
      expect(result.warnings!.some((w) => w.includes('Referral number recommended'))).toBe(true);
    });
  });
});

describe('Claim Validation', () => {
  const validClaim: SubmitClaimInput = {
    organizationId: 'org-123' as any,
    branchId: 'branch-123' as any,
    invoiceId: 'invoice-123' as any,
    claimType: 'PROFESSIONAL',
    claimFormat: 'CMS_1500',
    submissionMethod: 'PORTAL',
  };

  describe('validateSubmitClaim', () => {
    it('should validate correct claim submission', () => {
      const result = validateSubmitClaim(validClaim);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should require all basic fields', () => {
      const input = {
        organizationId: '' as any,
        branchId: '' as any,
        invoiceId: '' as any,
        claimType: '' as any,
        claimFormat: '' as any,
        submissionMethod: '' as any,
      };
      const result = validateSubmitClaim(input);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(5);
    });

    it('should warn about EDI format with non-EDI submission', () => {
      const input = {
        ...validClaim,
        claimFormat: 'EDI_837P' as any,
        submissionMethod: 'MAIL' as any,
      };
      const result = validateSubmitClaim(input);
      expect(result.warnings).toBeDefined();
      expect(result.warnings![0]).toContain('EDI claim formats');
    });
  });
});

describe('Status Transition Validation', () => {
  describe('validateBillableStatusTransition', () => {
    it('should allow valid transitions', () => {
      expect(validateBillableStatusTransition('PENDING', 'READY').valid).toBe(true);
      expect(validateBillableStatusTransition('READY', 'INVOICED').valid).toBe(true);
      expect(validateBillableStatusTransition('INVOICED', 'SUBMITTED').valid).toBe(true);
      expect(validateBillableStatusTransition('SUBMITTED', 'PAID').valid).toBe(true);
    });

    it('should reject invalid transitions', () => {
      expect(validateBillableStatusTransition('PENDING', 'PAID').valid).toBe(false);
      expect(validateBillableStatusTransition('VOIDED', 'READY').valid).toBe(false);
      expect(validateBillableStatusTransition('PAID', 'PENDING').valid).toBe(false);
    });

    it('should warn about risky transitions', () => {
      const result = validateBillableStatusTransition('PAID', 'ADJUSTED');
      expect(result.valid).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(result.warnings![0]).toContain('payment reversal or refund');
    });
  });

  describe('validateInvoiceStatusTransition', () => {
    it('should allow valid transitions', () => {
      expect(validateInvoiceStatusTransition('DRAFT', 'PENDING_REVIEW').valid).toBe(true);
      expect(validateInvoiceStatusTransition('PENDING_REVIEW', 'APPROVED').valid).toBe(true);
      expect(validateInvoiceStatusTransition('APPROVED', 'SENT').valid).toBe(true);
      expect(validateInvoiceStatusTransition('SENT', 'PAID').valid).toBe(true);
    });

    it('should reject invalid transitions', () => {
      expect(validateInvoiceStatusTransition('DRAFT', 'PAID').valid).toBe(false);
      expect(validateInvoiceStatusTransition('CANCELLED', 'SENT').valid).toBe(false);
      expect(validateInvoiceStatusTransition('PAID', 'DRAFT').valid).toBe(false);
    });
  });

  describe('validatePaymentStatusTransition', () => {
    it('should allow valid transitions', () => {
      expect(validatePaymentStatusTransition('PENDING', 'RECEIVED').valid).toBe(true);
      expect(validatePaymentStatusTransition('RECEIVED', 'APPLIED').valid).toBe(true);
      expect(validatePaymentStatusTransition('APPLIED', 'DEPOSITED').valid).toBe(true);
    });

    it('should reject invalid transitions', () => {
      expect(validatePaymentStatusTransition('PENDING', 'CLEARED').valid).toBe(false);
      expect(validatePaymentStatusTransition('VOIDED', 'APPLIED').valid).toBe(false);
    });
  });

  describe('validateAuthorizationStatusTransition', () => {
    it('should allow valid transitions', () => {
      expect(validateAuthorizationStatusTransition('PENDING', 'ACTIVE').valid).toBe(true);
      expect(validateAuthorizationStatusTransition('ACTIVE', 'DEPLETED').valid).toBe(true);
      expect(validateAuthorizationStatusTransition('SUSPENDED', 'ACTIVE').valid).toBe(true);
    });

    it('should reject invalid transitions', () => {
      expect(validateAuthorizationStatusTransition('DENIED', 'ACTIVE').valid).toBe(false);
      expect(validateAuthorizationStatusTransition('EXPIRED', 'ACTIVE').valid).toBe(false);
      expect(validateAuthorizationStatusTransition('CANCELLED', 'ACTIVE').valid).toBe(false);
    });
  });
});

describe('Type Validators', () => {
  describe('isValidPayerType', () => {
    it('should validate correct payer types', () => {
      expect(isValidPayerType('MEDICAID')).toBe(true);
      expect(isValidPayerType('MEDICARE')).toBe(true);
      expect(isValidPayerType('PRIVATE_PAY')).toBe(true);
    });

    it('should reject invalid payer types', () => {
      expect(isValidPayerType('INVALID')).toBe(false);
      expect(isValidPayerType('')).toBe(false);
    });
  });

  describe('isValidUnitType', () => {
    it('should validate correct unit types', () => {
      expect(isValidUnitType('HOUR')).toBe(true);
      expect(isValidUnitType('VISIT')).toBe(true);
      expect(isValidUnitType('DAY')).toBe(true);
      expect(isValidUnitType('MILE')).toBe(true);
    });

    it('should reject invalid unit types', () => {
      expect(isValidUnitType('INVALID')).toBe(false);
      expect(isValidUnitType('')).toBe(false);
    });
  });
});
