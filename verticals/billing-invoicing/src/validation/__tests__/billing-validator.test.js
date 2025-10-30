"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const billing_validator_1 = require("../billing-validator");
describe('Billable Item Validation', () => {
    const validBillableItem = {
        organizationId: 'org-123',
        branchId: 'branch-123',
        clientId: 'client-123',
        serviceTypeId: 'service-123',
        serviceTypeCode: 'S5100',
        serviceTypeName: 'Personal Care',
        serviceDate: new Date('2024-01-15'),
        durationMinutes: 60,
        unitType: 'HOUR',
        units: 1,
        payerId: 'payer-123',
        payerType: 'MEDICAID',
        payerName: 'State Medicaid',
    };
    describe('validateCreateBillableItem', () => {
        it('should validate a correct billable item', () => {
            const result = (0, billing_validator_1.validateCreateBillableItem)(validBillableItem);
            expect(result.valid).toBe(true);
            expect(result.errors).toEqual([]);
        });
        it('should require organizationId', () => {
            const input = { ...validBillableItem, organizationId: '' };
            const result = (0, billing_validator_1.validateCreateBillableItem)(input);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('organizationId is required');
        });
        it('should require clientId', () => {
            const input = { ...validBillableItem, clientId: '' };
            const result = (0, billing_validator_1.validateCreateBillableItem)(input);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('clientId is required');
        });
        it('should require service information', () => {
            const input = {
                ...validBillableItem,
                serviceTypeCode: '',
                serviceTypeName: '',
            };
            const result = (0, billing_validator_1.validateCreateBillableItem)(input);
            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(1);
        });
        it('should reject negative duration', () => {
            const input = { ...validBillableItem, durationMinutes: -30 };
            const result = (0, billing_validator_1.validateCreateBillableItem)(input);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('durationMinutes cannot be negative');
        });
        it('should reject zero or negative units', () => {
            const input = { ...validBillableItem, units: 0 };
            const result = (0, billing_validator_1.validateCreateBillableItem)(input);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('units must be greater than zero');
        });
        it('should reject invalid unit type', () => {
            const input = { ...validBillableItem, unitType: 'INVALID' };
            const result = (0, billing_validator_1.validateCreateBillableItem)(input);
            expect(result.valid).toBe(false);
            expect(result.errors[0]).toContain('Invalid unit type');
        });
        it('should reject future service dates', () => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 7);
            const input = { ...validBillableItem, serviceDate: futureDate };
            const result = (0, billing_validator_1.validateCreateBillableItem)(input);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Service date cannot be in the future');
        });
        it('should warn about old service dates', () => {
            const oldDate = new Date();
            oldDate.setFullYear(oldDate.getFullYear() - 2);
            const input = { ...validBillableItem, serviceDate: oldDate };
            const result = (0, billing_validator_1.validateCreateBillableItem)(input);
            expect(result.warnings).toBeDefined();
            expect(result.warnings[0]).toContain('more than 1 year old');
        });
        it('should reject startTime after endTime', () => {
            const input = {
                ...validBillableItem,
                startTime: new Date('2024-01-15T10:00:00Z'),
                endTime: new Date('2024-01-15T09:00:00Z'),
            };
            const result = (0, billing_validator_1.validateCreateBillableItem)(input);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('startTime must be before endTime');
        });
        it('should warn about missing EVV for Medicaid', () => {
            const input = { ...validBillableItem, evvRecordId: undefined };
            const result = (0, billing_validator_1.validateCreateBillableItem)(input);
            expect(result.warnings).toBeDefined();
            expect(result.warnings.some((w) => w.includes('EVV record ID recommended'))).toBe(true);
        });
        it('should accept valid billable item with all optional fields', () => {
            const input = {
                ...validBillableItem,
                visitId: 'visit-123',
                evvRecordId: 'evv-123',
                caregiverId: 'caregiver-123',
                caregiverName: 'Jane Smith',
                providerNPI: '1234567890',
                authorizationId: 'auth-123',
                authorizationNumber: 'AUTH-001',
                notes: 'Regular care visit',
            };
            const result = (0, billing_validator_1.validateCreateBillableItem)(input);
            expect(result.valid).toBe(true);
        });
    });
});
describe('Invoice Validation', () => {
    const validInvoice = {
        organizationId: 'org-123',
        branchId: 'branch-123',
        invoiceType: 'STANDARD',
        payerId: 'payer-123',
        payerType: 'MEDICAID',
        payerName: 'State Medicaid',
        periodStart: new Date('2024-01-01'),
        periodEnd: new Date('2024-01-31'),
        invoiceDate: new Date('2024-02-01'),
        dueDate: new Date('2024-03-02'),
        billableItemIds: ['item-1', 'item-2'],
    };
    describe('validateCreateInvoice', () => {
        it('should validate a correct invoice', () => {
            const result = (0, billing_validator_1.validateCreateInvoice)(validInvoice);
            expect(result.valid).toBe(true);
            expect(result.errors).toEqual([]);
        });
        it('should require organizationId', () => {
            const input = { ...validInvoice, organizationId: '' };
            const result = (0, billing_validator_1.validateCreateInvoice)(input);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('organizationId is required');
        });
        it('should require at least one billable item', () => {
            const input = { ...validInvoice, billableItemIds: [] };
            const result = (0, billing_validator_1.validateCreateInvoice)(input);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('At least one billable item is required');
        });
        it('should reject periodStart after periodEnd', () => {
            const input = {
                ...validInvoice,
                periodStart: new Date('2024-01-31'),
                periodEnd: new Date('2024-01-01'),
            };
            const result = (0, billing_validator_1.validateCreateInvoice)(input);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('periodStart must be before or equal to periodEnd');
        });
        it('should reject invoiceDate after dueDate', () => {
            const input = {
                ...validInvoice,
                invoiceDate: new Date('2024-03-15'),
                dueDate: new Date('2024-03-01'),
            };
            const result = (0, billing_validator_1.validateCreateInvoice)(input);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('invoiceDate must be before or equal to dueDate');
        });
        it('should warn about missing clientId for private pay', () => {
            const input = {
                ...validInvoice,
                payerType: 'PRIVATE_PAY',
                clientId: undefined,
            };
            const result = (0, billing_validator_1.validateCreateInvoice)(input);
            expect(result.warnings).toBeDefined();
            expect(result.warnings[0]).toContain('clientId recommended for private pay');
        });
    });
});
describe('Payment Validation', () => {
    const validPayment = {
        organizationId: 'org-123',
        branchId: 'branch-123',
        payerId: 'payer-123',
        payerType: 'MEDICAID',
        payerName: 'State Medicaid',
        amount: 1000,
        paymentDate: new Date('2024-02-15'),
        receivedDate: new Date('2024-02-15'),
        paymentMethod: 'EFT',
    };
    describe('validateCreatePayment', () => {
        it('should validate a correct payment', () => {
            const result = (0, billing_validator_1.validateCreatePayment)(validPayment);
            expect(result.valid).toBe(true);
            expect(result.errors).toEqual([]);
        });
        it('should require amount', () => {
            const input = { ...validPayment, amount: 0 };
            const result = (0, billing_validator_1.validateCreatePayment)(input);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('amount is required');
        });
        it('should reject zero or negative amount', () => {
            const input = { ...validPayment, amount: -100 };
            const result = (0, billing_validator_1.validateCreatePayment)(input);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('amount must be greater than zero');
        });
        it('should reject paymentDate after receivedDate', () => {
            const input = {
                ...validPayment,
                paymentDate: new Date('2024-02-20'),
                receivedDate: new Date('2024-02-15'),
            };
            const result = (0, billing_validator_1.validateCreatePayment)(input);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('paymentDate cannot be after receivedDate');
        });
        it('should warn about missing check number for CHECK payment', () => {
            const input = {
                ...validPayment,
                paymentMethod: 'CHECK',
                referenceNumber: undefined,
            };
            const result = (0, billing_validator_1.validateCreatePayment)(input);
            expect(result.warnings).toBeDefined();
            expect(result.warnings[0]).toContain('Reference number');
        });
        it('should warn about future payment dates', () => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 7);
            const input = {
                ...validPayment,
                paymentDate: futureDate,
                receivedDate: futureDate,
            };
            const result = (0, billing_validator_1.validateCreatePayment)(input);
            expect(result.warnings).toBeDefined();
            expect(result.warnings[0]).toContain('paymentDate is in the future');
        });
    });
});
describe('Payment Allocation Validation', () => {
    const validAllocation = {
        paymentId: 'payment-123',
        allocations: [
            {
                invoiceId: 'invoice-1',
                amount: 500,
            },
            {
                invoiceId: 'invoice-2',
                amount: 300,
            },
        ],
    };
    describe('validateAllocatePayment', () => {
        it('should validate correct allocation', () => {
            const result = (0, billing_validator_1.validateAllocatePayment)(validAllocation, 1000);
            expect(result.valid).toBe(true);
            expect(result.errors).toEqual([]);
        });
        it('should require at least one allocation', () => {
            const input = { ...validAllocation, allocations: [] };
            const result = (0, billing_validator_1.validateAllocatePayment)(input, 1000);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('At least one allocation is required');
        });
        it('should reject allocation exceeding unapplied amount', () => {
            const result = (0, billing_validator_1.validateAllocatePayment)(validAllocation, 700);
            expect(result.valid).toBe(false);
            expect(result.errors[0]).toContain('exceeds unapplied amount');
        });
        it('should reject allocation with missing invoiceId', () => {
            const input = {
                paymentId: 'payment-123',
                allocations: [{ invoiceId: '', amount: 500 }],
            };
            const result = (0, billing_validator_1.validateAllocatePayment)(input, 1000);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Each allocation must have an invoiceId');
        });
        it('should reject zero or negative allocation amounts', () => {
            const input = {
                paymentId: 'payment-123',
                allocations: [{ invoiceId: 'invoice-1', amount: 0 }],
            };
            const result = (0, billing_validator_1.validateAllocatePayment)(input, 1000);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Allocation amount must be greater than zero');
        });
        it('should warn about partial allocation', () => {
            const input = {
                paymentId: 'payment-123',
                allocations: [{ invoiceId: 'invoice-1', amount: 500 }],
            };
            const result = (0, billing_validator_1.validateAllocatePayment)(input, 1000);
            expect(result.warnings).toBeDefined();
            expect(result.warnings[0]).toContain('will remain unapplied');
        });
    });
});
describe('Rate Schedule Validation', () => {
    const validRateSchedule = {
        organizationId: 'org-123',
        name: 'Standard Rates 2024',
        scheduleType: 'STANDARD',
        effectiveFrom: new Date('2024-01-01'),
        rates: [
            {
                serviceTypeId: 'service-1',
                serviceTypeCode: 'S5100',
                serviceTypeName: 'Personal Care',
                unitType: 'HOUR',
                unitRate: 25.5,
            },
        ],
    };
    describe('validateCreateRateSchedule', () => {
        it('should validate correct rate schedule', () => {
            const result = (0, billing_validator_1.validateCreateRateSchedule)(validRateSchedule);
            expect(result.valid).toBe(true);
            expect(result.errors).toEqual([]);
        });
        it('should require at least one rate', () => {
            const input = { ...validRateSchedule, rates: [] };
            const result = (0, billing_validator_1.validateCreateRateSchedule)(input);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('At least one rate is required');
        });
        it('should reject effectiveFrom after effectiveTo', () => {
            const input = {
                ...validRateSchedule,
                effectiveFrom: new Date('2024-12-31'),
                effectiveTo: new Date('2024-01-01'),
            };
            const result = (0, billing_validator_1.validateCreateRateSchedule)(input);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('effectiveFrom must be before or equal to effectiveTo');
        });
        it('should require payerId for PAYER_SPECIFIC schedule', () => {
            const input = {
                ...validRateSchedule,
                scheduleType: 'PAYER_SPECIFIC',
                payerId: undefined,
            };
            const result = (0, billing_validator_1.validateCreateRateSchedule)(input);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('payerId required for PAYER_SPECIFIC schedule type');
        });
        it('should validate rate fields', () => {
            const input = {
                ...validRateSchedule,
                rates: [
                    {
                        serviceTypeId: '',
                        serviceTypeCode: '',
                        serviceTypeName: '',
                        unitType: '',
                        unitRate: -5,
                    },
                ],
            };
            const result = (0, billing_validator_1.validateCreateRateSchedule)(input);
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
            const result = (0, billing_validator_1.validateCreateRateSchedule)(input);
            expect(result.valid).toBe(false);
            expect(result.errors[0]).toContain('minimumUnits cannot exceed maximumUnits');
        });
    });
});
describe('Payer Validation', () => {
    const validPayer = {
        organizationId: 'org-123',
        payerName: 'State Medicaid',
        payerType: 'MEDICAID',
        paymentTermsDays: 30,
        requiresPreAuthorization: true,
        requiresReferral: false,
    };
    describe('validateCreatePayer', () => {
        it('should validate correct payer', () => {
            const result = (0, billing_validator_1.validateCreatePayer)(validPayer);
            expect(result.valid).toBe(true);
            expect(result.errors).toEqual([]);
        });
        it('should require payerName', () => {
            const input = { ...validPayer, payerName: '' };
            const result = (0, billing_validator_1.validateCreatePayer)(input);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('payerName is required');
        });
        it('should reject negative payment terms', () => {
            const input = { ...validPayer, paymentTermsDays: -10 };
            const result = (0, billing_validator_1.validateCreatePayer)(input);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('paymentTermsDays cannot be negative');
        });
        it('should warn about excessive payment terms', () => {
            const input = { ...validPayer, paymentTermsDays: 400 };
            const result = (0, billing_validator_1.validateCreatePayer)(input);
            expect(result.warnings).toBeDefined();
            expect(result.warnings[0]).toContain('exceeds 1 year');
        });
        it('should validate email format', () => {
            const input = { ...validPayer, email: 'invalid-email' };
            const result = (0, billing_validator_1.validateCreatePayer)(input);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Invalid email address');
        });
        it('should validate billing email format', () => {
            const input = { ...validPayer, billingEmail: 'not-an-email' };
            const result = (0, billing_validator_1.validateCreatePayer)(input);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Invalid billing email address');
        });
    });
});
describe('Authorization Validation', () => {
    const validAuth = {
        organizationId: 'org-123',
        branchId: 'branch-123',
        clientId: 'client-123',
        authorizationNumber: 'AUTH-2024-001',
        authorizationType: 'INITIAL',
        payerId: 'payer-123',
        payerType: 'MEDICAID',
        payerName: 'State Medicaid',
        serviceTypeId: 'service-123',
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
            const result = (0, billing_validator_1.validateCreateAuthorization)(validAuth);
            expect(result.valid).toBe(true);
            expect(result.errors).toEqual([]);
        });
        it('should require authorization number', () => {
            const input = { ...validAuth, authorizationNumber: '' };
            const result = (0, billing_validator_1.validateCreateAuthorization)(input);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('authorizationNumber is required');
        });
        it('should reject zero or negative authorized units', () => {
            const input = { ...validAuth, authorizedUnits: 0 };
            const result = (0, billing_validator_1.validateCreateAuthorization)(input);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('authorizedUnits must be greater than zero');
        });
        it('should reject effectiveFrom after effectiveTo', () => {
            const input = {
                ...validAuth,
                effectiveFrom: new Date('2024-12-31'),
                effectiveTo: new Date('2024-01-01'),
            };
            const result = (0, billing_validator_1.validateCreateAuthorization)(input);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('effectiveFrom must be before effectiveTo');
        });
        it('should warn about short authorization periods', () => {
            const input = {
                ...validAuth,
                effectiveFrom: new Date('2024-01-01'),
                effectiveTo: new Date('2024-01-05'),
            };
            const result = (0, billing_validator_1.validateCreateAuthorization)(input);
            expect(result.warnings).toBeDefined();
            expect(result.warnings[0]).toContain('less than 1 week');
        });
        it('should warn about expired authorizations', () => {
            const pastDate = new Date();
            pastDate.setFullYear(pastDate.getFullYear() - 1);
            const input = {
                ...validAuth,
                effectiveFrom: pastDate,
                effectiveTo: pastDate,
            };
            const result = (0, billing_validator_1.validateCreateAuthorization)(input);
            expect(result.warnings).toBeDefined();
            expect(result.warnings.some((w) => w.includes('in the past'))).toBe(true);
        });
        it('should warn about missing referral number', () => {
            const input = {
                ...validAuth,
                effectiveFrom: new Date('2025-01-01'),
                effectiveTo: new Date('2025-12-31'),
                requiresReferral: true,
                referralNumber: undefined,
            };
            const result = (0, billing_validator_1.validateCreateAuthorization)(input);
            expect(result.warnings).toBeDefined();
            expect(result.warnings.some((w) => w.includes('Referral number recommended'))).toBe(true);
        });
    });
});
describe('Claim Validation', () => {
    const validClaim = {
        organizationId: 'org-123',
        branchId: 'branch-123',
        invoiceId: 'invoice-123',
        claimType: 'PROFESSIONAL',
        claimFormat: 'CMS_1500',
        submissionMethod: 'PORTAL',
    };
    describe('validateSubmitClaim', () => {
        it('should validate correct claim submission', () => {
            const result = (0, billing_validator_1.validateSubmitClaim)(validClaim);
            expect(result.valid).toBe(true);
            expect(result.errors).toEqual([]);
        });
        it('should require all basic fields', () => {
            const input = {
                organizationId: '',
                branchId: '',
                invoiceId: '',
                claimType: '',
                claimFormat: '',
                submissionMethod: '',
            };
            const result = (0, billing_validator_1.validateSubmitClaim)(input);
            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(5);
        });
        it('should warn about EDI format with non-EDI submission', () => {
            const input = {
                ...validClaim,
                claimFormat: 'EDI_837P',
                submissionMethod: 'MAIL',
            };
            const result = (0, billing_validator_1.validateSubmitClaim)(input);
            expect(result.warnings).toBeDefined();
            expect(result.warnings[0]).toContain('EDI claim formats');
        });
    });
});
describe('Status Transition Validation', () => {
    describe('validateBillableStatusTransition', () => {
        it('should allow valid transitions', () => {
            expect((0, billing_validator_1.validateBillableStatusTransition)('PENDING', 'READY').valid).toBe(true);
            expect((0, billing_validator_1.validateBillableStatusTransition)('READY', 'INVOICED').valid).toBe(true);
            expect((0, billing_validator_1.validateBillableStatusTransition)('INVOICED', 'SUBMITTED').valid).toBe(true);
            expect((0, billing_validator_1.validateBillableStatusTransition)('SUBMITTED', 'PAID').valid).toBe(true);
        });
        it('should reject invalid transitions', () => {
            expect((0, billing_validator_1.validateBillableStatusTransition)('PENDING', 'PAID').valid).toBe(false);
            expect((0, billing_validator_1.validateBillableStatusTransition)('VOIDED', 'READY').valid).toBe(false);
            expect((0, billing_validator_1.validateBillableStatusTransition)('PAID', 'PENDING').valid).toBe(false);
        });
        it('should warn about risky transitions', () => {
            const result = (0, billing_validator_1.validateBillableStatusTransition)('PAID', 'ADJUSTED');
            expect(result.valid).toBe(true);
            expect(result.warnings).toBeDefined();
            expect(result.warnings[0]).toContain('payment reversal or refund');
        });
    });
    describe('validateInvoiceStatusTransition', () => {
        it('should allow valid transitions', () => {
            expect((0, billing_validator_1.validateInvoiceStatusTransition)('DRAFT', 'PENDING_REVIEW').valid).toBe(true);
            expect((0, billing_validator_1.validateInvoiceStatusTransition)('PENDING_REVIEW', 'APPROVED').valid).toBe(true);
            expect((0, billing_validator_1.validateInvoiceStatusTransition)('APPROVED', 'SENT').valid).toBe(true);
            expect((0, billing_validator_1.validateInvoiceStatusTransition)('SENT', 'PAID').valid).toBe(true);
        });
        it('should reject invalid transitions', () => {
            expect((0, billing_validator_1.validateInvoiceStatusTransition)('DRAFT', 'PAID').valid).toBe(false);
            expect((0, billing_validator_1.validateInvoiceStatusTransition)('CANCELLED', 'SENT').valid).toBe(false);
            expect((0, billing_validator_1.validateInvoiceStatusTransition)('PAID', 'DRAFT').valid).toBe(false);
        });
    });
    describe('validatePaymentStatusTransition', () => {
        it('should allow valid transitions', () => {
            expect((0, billing_validator_1.validatePaymentStatusTransition)('PENDING', 'RECEIVED').valid).toBe(true);
            expect((0, billing_validator_1.validatePaymentStatusTransition)('RECEIVED', 'APPLIED').valid).toBe(true);
            expect((0, billing_validator_1.validatePaymentStatusTransition)('APPLIED', 'DEPOSITED').valid).toBe(true);
        });
        it('should reject invalid transitions', () => {
            expect((0, billing_validator_1.validatePaymentStatusTransition)('PENDING', 'CLEARED').valid).toBe(false);
            expect((0, billing_validator_1.validatePaymentStatusTransition)('VOIDED', 'APPLIED').valid).toBe(false);
        });
    });
    describe('validateAuthorizationStatusTransition', () => {
        it('should allow valid transitions', () => {
            expect((0, billing_validator_1.validateAuthorizationStatusTransition)('PENDING', 'ACTIVE').valid).toBe(true);
            expect((0, billing_validator_1.validateAuthorizationStatusTransition)('ACTIVE', 'DEPLETED').valid).toBe(true);
            expect((0, billing_validator_1.validateAuthorizationStatusTransition)('SUSPENDED', 'ACTIVE').valid).toBe(true);
        });
        it('should reject invalid transitions', () => {
            expect((0, billing_validator_1.validateAuthorizationStatusTransition)('DENIED', 'ACTIVE').valid).toBe(false);
            expect((0, billing_validator_1.validateAuthorizationStatusTransition)('EXPIRED', 'ACTIVE').valid).toBe(false);
            expect((0, billing_validator_1.validateAuthorizationStatusTransition)('CANCELLED', 'ACTIVE').valid).toBe(false);
        });
    });
});
describe('Type Validators', () => {
    describe('isValidPayerType', () => {
        it('should validate correct payer types', () => {
            expect((0, billing_validator_1.isValidPayerType)('MEDICAID')).toBe(true);
            expect((0, billing_validator_1.isValidPayerType)('MEDICARE')).toBe(true);
            expect((0, billing_validator_1.isValidPayerType)('PRIVATE_PAY')).toBe(true);
        });
        it('should reject invalid payer types', () => {
            expect((0, billing_validator_1.isValidPayerType)('INVALID')).toBe(false);
            expect((0, billing_validator_1.isValidPayerType)('')).toBe(false);
        });
    });
    describe('isValidUnitType', () => {
        it('should validate correct unit types', () => {
            expect((0, billing_validator_1.isValidUnitType)('HOUR')).toBe(true);
            expect((0, billing_validator_1.isValidUnitType)('VISIT')).toBe(true);
            expect((0, billing_validator_1.isValidUnitType)('DAY')).toBe(true);
            expect((0, billing_validator_1.isValidUnitType)('MILE')).toBe(true);
        });
        it('should reject invalid unit types', () => {
            expect((0, billing_validator_1.isValidUnitType)('INVALID')).toBe(false);
            expect((0, billing_validator_1.isValidUnitType)('')).toBe(false);
        });
    });
});
//# sourceMappingURL=billing-validator.test.js.map