"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const billing_service_1 = require("../billing-service");
const vitest_1 = require("vitest");
vitest_1.vi.mock('../../repository/billing-repository');
vitest_1.vi.mock('uuid', () => ({
    v4: vitest_1.vi.fn(() => 'test-uuid-123'),
}));
(0, vitest_1.describe)('BillingService Integration Tests', () => {
    let service;
    let mockPool;
    let mockClient;
    let mockRepository;
    (0, vitest_1.beforeEach)(() => {
        mockClient = {
            query: vitest_1.vi.fn(),
            release: vitest_1.vi.fn(),
        };
        mockPool = {
            connect: vitest_1.vi.fn().mockResolvedValue(mockClient),
            query: vitest_1.vi.fn(),
        };
        service = new billing_service_1.BillingService(mockPool);
        mockRepository = service.repository;
    });
    (0, vitest_1.afterEach)(() => {
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.describe)('createBillableItem', () => {
        const input = {
            organizationId: 'org-123',
            branchId: 'branch-123',
            clientId: 'client-123',
            serviceTypeId: 'service-123',
            serviceTypeCode: 'S5100',
            serviceTypeName: 'Personal Care',
            serviceDate: new Date('2024-01-15'),
            durationMinutes: 120,
            unitType: 'HOUR',
            units: 2,
            payerId: 'payer-123',
            payerType: 'MEDICAID',
            payerName: 'State Medicaid',
        };
        (0, vitest_1.it)('should create billable item with rate calculation', async () => {
            const mockRateSchedule = {
                id: 'rate-schedule-123',
                organizationId: 'org-123',
                name: 'Standard Rates',
                scheduleType: 'STANDARD',
                effectiveFrom: new Date('2024-01-01'),
                rates: [
                    {
                        id: 'rate-1',
                        serviceTypeId: 'service-123',
                        serviceTypeCode: 'S5100',
                        serviceTypeName: 'Personal Care',
                        unitType: 'HOUR',
                        unitRate: 25.5,
                    },
                ],
                status: 'ACTIVE',
                createdAt: new Date(),
                createdBy: 'admin',
                updatedAt: new Date(),
                updatedBy: 'admin',
                version: 1,
            };
            mockRepository.findActiveRateSchedule.mockResolvedValue(mockRateSchedule);
            const mockBillableItem = {
                ...input,
                id: 'item-123',
                unitRate: 25.5,
                subtotal: 51,
                finalAmount: 51,
                isAuthorized: false,
                status: 'PENDING',
                statusHistory: [],
                isHold: false,
                requiresReview: false,
                isDenied: false,
                isAppealable: false,
                isPaid: false,
                createdAt: new Date(),
                createdBy: 'user-123',
                updatedAt: new Date(),
                updatedBy: 'user-123',
                version: 1,
                deletedAt: null,
                deletedBy: null,
            };
            mockRepository.createBillableItem.mockResolvedValue(mockBillableItem);
            const result = await service.createBillableItem(input, 'user-123');
            (0, vitest_1.expect)(result.id).toBe('item-123');
            (0, vitest_1.expect)(result.unitRate).toBe(25.5);
            (0, vitest_1.expect)(result.subtotal).toBe(51);
            (0, vitest_1.expect)(result.finalAmount).toBe(51);
            (0, vitest_1.expect)(result.status).toBe('PENDING');
            (0, vitest_1.expect)(mockRepository.findActiveRateSchedule).toHaveBeenCalledWith(input.organizationId, input.payerId);
            (0, vitest_1.expect)(mockRepository.createBillableItem).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should throw error when no active rate schedule found', async () => {
            mockRepository.findActiveRateSchedule.mockResolvedValue(null);
            await (0, vitest_1.expect)(service.createBillableItem(input, 'user-123')).rejects.toThrow('No active rate schedule found for payer');
        });
        (0, vitest_1.it)('should throw error when service code not in rate schedule', async () => {
            const mockRateSchedule = {
                id: 'rate-schedule-123',
                organizationId: 'org-123',
                name: 'Standard Rates',
                scheduleType: 'STANDARD',
                effectiveFrom: new Date('2024-01-01'),
                rates: [],
                status: 'ACTIVE',
                createdAt: new Date(),
                createdBy: 'admin',
                updatedAt: new Date(),
                updatedBy: 'admin',
                version: 1,
            };
            mockRepository.findActiveRateSchedule.mockResolvedValue(mockRateSchedule);
            await (0, vitest_1.expect)(service.createBillableItem(input, 'user-123')).rejects.toThrow('No rate found for service code');
        });
        (0, vitest_1.it)('should validate authorization and check remaining units', async () => {
            const inputWithAuth = {
                ...input,
                authorizationId: 'auth-123',
                authorizationNumber: 'AUTH-001',
            };
            const mockRateSchedule = {
                id: 'rate-schedule-123',
                organizationId: 'org-123',
                name: 'Standard Rates',
                scheduleType: 'STANDARD',
                effectiveFrom: new Date('2024-01-01'),
                rates: [
                    {
                        id: 'rate-1',
                        serviceTypeId: 'service-123',
                        serviceTypeCode: 'S5100',
                        serviceTypeName: 'Personal Care',
                        unitType: 'HOUR',
                        unitRate: 25.5,
                    },
                ],
                status: 'ACTIVE',
                createdAt: new Date(),
                createdBy: 'admin',
                updatedAt: new Date(),
                updatedBy: 'admin',
                version: 1,
            };
            const mockAuth = {
                id: 'auth-123',
                organizationId: 'org-123',
                branchId: 'branch-123',
                clientId: 'client-123',
                authorizationNumber: 'AUTH-001',
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
                usedUnits: 50,
                remainingUnits: 50,
                billedUnits: 40,
                requiresReferral: false,
                status: 'ACTIVE',
                statusHistory: [],
                createdAt: new Date(),
                createdBy: 'admin',
                updatedAt: new Date(),
                updatedBy: 'admin',
                version: 1,
                deletedAt: null,
                deletedBy: null,
            };
            mockRepository.findActiveRateSchedule.mockResolvedValue(mockRateSchedule);
            mockRepository.findAuthorizationByNumber.mockResolvedValue(mockAuth);
            mockRepository.createBillableItem.mockResolvedValue({
                ...inputWithAuth,
                id: 'item-123',
                unitRate: 25.5,
                subtotal: 51,
                finalAmount: 51,
                isAuthorized: true,
                authorizationRemainingUnits: 48,
                status: 'PENDING',
                statusHistory: [],
                isHold: false,
                requiresReview: false,
                isDenied: false,
                isAppealable: false,
                isPaid: false,
                createdAt: new Date(),
                createdBy: 'user-123',
                updatedAt: new Date(),
                updatedBy: 'user-123',
                version: 1,
                deletedAt: null,
                deletedBy: null,
            });
            const result = await service.createBillableItem(inputWithAuth, 'user-123');
            (0, vitest_1.expect)(result.isAuthorized).toBe(true);
            (0, vitest_1.expect)(result.authorizationRemainingUnits).toBe(48);
            (0, vitest_1.expect)(mockRepository.updateAuthorizationUnits).toHaveBeenCalledWith('auth-123', 2, 0, 'user-123');
        });
        (0, vitest_1.it)('should reject when authorization has insufficient units', async () => {
            const inputWithAuth = {
                ...input,
                authorizationId: 'auth-123',
                authorizationNumber: 'AUTH-001',
                units: 100,
            };
            const mockRateSchedule = {
                id: 'rate-schedule-123',
                organizationId: 'org-123',
                name: 'Standard Rates',
                scheduleType: 'STANDARD',
                effectiveFrom: new Date('2024-01-01'),
                rates: [
                    {
                        id: 'rate-1',
                        serviceTypeId: 'service-123',
                        serviceTypeCode: 'S5100',
                        serviceTypeName: 'Personal Care',
                        unitType: 'HOUR',
                        unitRate: 25.5,
                    },
                ],
                status: 'ACTIVE',
                createdAt: new Date(),
                createdBy: 'admin',
                updatedAt: new Date(),
                updatedBy: 'admin',
                version: 1,
            };
            const mockAuth = {
                id: 'auth-123',
                organizationId: 'org-123',
                branchId: 'branch-123',
                clientId: 'client-123',
                authorizationNumber: 'AUTH-001',
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
                usedUnits: 95,
                remainingUnits: 5,
                billedUnits: 90,
                requiresReferral: false,
                status: 'ACTIVE',
                statusHistory: [],
                createdAt: new Date(),
                createdBy: 'admin',
                updatedAt: new Date(),
                updatedBy: 'admin',
                version: 1,
                deletedAt: null,
                deletedBy: null,
            };
            mockRepository.findActiveRateSchedule.mockResolvedValue(mockRateSchedule);
            mockRepository.findAuthorizationByNumber.mockResolvedValue(mockAuth);
            await (0, vitest_1.expect)(service.createBillableItem(inputWithAuth, 'user-123')).rejects.toThrow('Insufficient authorization units');
        });
    });
    (0, vitest_1.describe)('createInvoice', () => {
        (0, vitest_1.it)('should create invoice from multiple billable items', async () => {
            const input = {
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
            const mockBillableItems = [
                {
                    id: 'item-1',
                    organizationId: 'org-123',
                    branchId: 'branch-123',
                    clientId: 'client-123',
                    serviceTypeId: 'service-123',
                    serviceTypeCode: 'S5100',
                    serviceTypeName: 'Personal Care',
                    serviceDate: new Date('2024-01-15'),
                    durationMinutes: 120,
                    unitType: 'HOUR',
                    units: 2,
                    unitRate: 25.5,
                    subtotal: 51,
                    finalAmount: 51,
                    payerId: 'payer-123',
                    payerType: 'MEDICAID',
                    payerName: 'State Medicaid',
                    isAuthorized: false,
                    status: 'READY',
                    statusHistory: [],
                    isHold: false,
                    requiresReview: false,
                    isDenied: false,
                    isAppealable: false,
                    isPaid: false,
                    createdAt: new Date(),
                    createdBy: 'user-123',
                    updatedAt: new Date(),
                    updatedBy: 'user-123',
                    version: 1,
                    deletedAt: null,
                    deletedBy: null,
                },
                {
                    id: 'item-2',
                    organizationId: 'org-123',
                    branchId: 'branch-123',
                    clientId: 'client-123',
                    serviceTypeId: 'service-123',
                    serviceTypeCode: 'S5100',
                    serviceTypeName: 'Personal Care',
                    serviceDate: new Date('2024-01-16'),
                    durationMinutes: 120,
                    unitType: 'HOUR',
                    units: 2,
                    unitRate: 25.5,
                    subtotal: 51,
                    finalAmount: 51,
                    payerId: 'payer-123',
                    payerType: 'MEDICAID',
                    payerName: 'State Medicaid',
                    isAuthorized: false,
                    status: 'READY',
                    statusHistory: [],
                    isHold: false,
                    requiresReview: false,
                    isDenied: false,
                    isAppealable: false,
                    isPaid: false,
                    createdAt: new Date(),
                    createdBy: 'user-123',
                    updatedAt: new Date(),
                    updatedBy: 'user-123',
                    version: 1,
                    deletedAt: null,
                    deletedBy: null,
                },
            ];
            const mockPayer = {
                id: 'payer-123',
                organizationId: 'org-123',
                payerName: 'State Medicaid',
                payerType: 'MEDICAID',
                paymentTermsDays: 30,
                requiresPreAuthorization: true,
                requiresReferral: false,
                status: 'ACTIVE',
                createdAt: new Date(),
                createdBy: 'admin',
                updatedAt: new Date(),
                updatedBy: 'admin',
                version: 1,
                deletedAt: null,
                deletedBy: null,
            };
            mockRepository.searchBillableItems.mockResolvedValue(mockBillableItems);
            mockRepository.findPayerById.mockResolvedValue(mockPayer);
            mockClient.query.mockImplementation((sql) => {
                if (typeof sql === 'string' && sql.includes('COUNT')) {
                    return Promise.resolve({ rows: [{ count: '0' }] });
                }
                return Promise.resolve({ rows: [] });
            });
            const mockInvoice = {
                id: 'invoice-123',
                ...input,
                invoiceNumber: 'INV-ORG-2024-000001',
                billableItemIds: ['item-1', 'item-2'],
                lineItems: [],
                subtotal: 102,
                taxAmount: 0,
                discountAmount: 0,
                adjustmentAmount: 0,
                totalAmount: 102,
                paidAmount: 0,
                balanceDue: 102,
                status: 'DRAFT',
                statusHistory: [],
                payments: [],
                createdAt: new Date(),
                createdBy: 'user-123',
                updatedAt: new Date(),
                updatedBy: 'user-123',
                version: 1,
                deletedAt: null,
                deletedBy: null,
            };
            mockRepository.createInvoice.mockResolvedValue(mockInvoice);
            const result = await service.createInvoice(input, 'user-123', 'ORG');
            (0, vitest_1.expect)(result.totalAmount).toBe(102);
            (0, vitest_1.expect)(result.billableItemIds).toHaveLength(2);
            (0, vitest_1.expect)(mockClient.query).toHaveBeenCalledWith('BEGIN');
            (0, vitest_1.expect)(mockClient.query).toHaveBeenCalledWith('COMMIT');
            (0, vitest_1.expect)(mockRepository.updateBillableItemStatus).toHaveBeenCalledTimes(2);
        });
        (0, vitest_1.it)('should rollback on error', async () => {
            const input = {
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
                billableItemIds: ['item-1'],
            };
            mockRepository.searchBillableItems.mockRejectedValue(new Error('Database error'));
            await (0, vitest_1.expect)(service.createInvoice(input, 'user-123', 'ORG')).rejects.toThrow('Database error');
            (0, vitest_1.expect)(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
            (0, vitest_1.expect)(mockClient.release).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should reject mixed payer billable items', async () => {
            const input = {
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
            const mockBillableItems = [
                {
                    id: 'item-1',
                    organizationId: 'org-123',
                    branchId: 'branch-123',
                    clientId: 'client-123',
                    serviceTypeId: 'service-123',
                    serviceTypeCode: 'S5100',
                    serviceTypeName: 'Personal Care',
                    serviceDate: new Date('2024-01-15'),
                    durationMinutes: 120,
                    unitType: 'HOUR',
                    units: 2,
                    unitRate: 25.5,
                    subtotal: 51,
                    finalAmount: 51,
                    payerId: 'payer-123',
                    payerType: 'MEDICAID',
                    payerName: 'State Medicaid',
                    isAuthorized: false,
                    status: 'READY',
                    statusHistory: [],
                    isHold: false,
                    requiresReview: false,
                    isDenied: false,
                    isAppealable: false,
                    isPaid: false,
                    createdAt: new Date(),
                    createdBy: 'user-123',
                    updatedAt: new Date(),
                    updatedBy: 'user-123',
                    version: 1,
                    deletedAt: null,
                    deletedBy: null,
                },
                {
                    id: 'item-2',
                    organizationId: 'org-123',
                    branchId: 'branch-123',
                    clientId: 'client-123',
                    serviceTypeId: 'service-123',
                    serviceTypeCode: 'S5100',
                    serviceTypeName: 'Personal Care',
                    serviceDate: new Date('2024-01-16'),
                    durationMinutes: 120,
                    unitType: 'HOUR',
                    units: 2,
                    unitRate: 25.5,
                    subtotal: 51,
                    finalAmount: 51,
                    payerId: 'payer-999',
                    payerType: 'MEDICARE',
                    payerName: 'Medicare',
                    isAuthorized: false,
                    status: 'READY',
                    statusHistory: [],
                    isHold: false,
                    requiresReview: false,
                    isDenied: false,
                    isAppealable: false,
                    isPaid: false,
                    createdAt: new Date(),
                    createdBy: 'user-123',
                    updatedAt: new Date(),
                    updatedBy: 'user-123',
                    version: 1,
                    deletedAt: null,
                    deletedBy: null,
                },
            ];
            mockRepository.searchBillableItems.mockResolvedValue(mockBillableItems);
            await (0, vitest_1.expect)(service.createInvoice(input, 'user-123', 'ORG')).rejects.toThrow('All billable items must be for the same payer');
        });
    });
    (0, vitest_1.describe)('createPayment and allocatePayment', () => {
        (0, vitest_1.it)('should create payment with unapplied amount', async () => {
            const input = {
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
            const mockPayment = {
                id: 'payment-123',
                ...input,
                paymentNumber: 'PAY-ORG-2024-000001',
                paymentType: 'FULL',
                currency: 'USD',
                allocations: [],
                unappliedAmount: 1000,
                status: 'RECEIVED',
                statusHistory: [],
                isReconciled: false,
                createdAt: new Date(),
                createdBy: 'user-123',
                updatedAt: new Date(),
                updatedBy: 'user-123',
                version: 1,
            };
            mockPool.query.mockResolvedValue({ rows: [{ count: '0' }] });
            mockRepository.createPayment.mockResolvedValue(mockPayment);
            const result = await service.createPayment(input, 'user-123', 'ORG');
            (0, vitest_1.expect)(result.amount).toBe(1000);
            (0, vitest_1.expect)(result.unappliedAmount).toBe(1000);
            (0, vitest_1.expect)(result.status).toBe('RECEIVED');
        });
        (0, vitest_1.it)('should allocate payment to invoices', async () => {
            const input = {
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
            const mockPayment = {
                id: 'payment-123',
                organizationId: 'org-123',
                branchId: 'branch-123',
                paymentNumber: 'PAY-ORG-2024-000001',
                paymentType: 'FULL',
                payerId: 'payer-123',
                payerType: 'MEDICAID',
                payerName: 'State Medicaid',
                amount: 1000,
                currency: 'USD',
                paymentDate: new Date(),
                receivedDate: new Date(),
                paymentMethod: 'EFT',
                allocations: [],
                unappliedAmount: 1000,
                status: 'RECEIVED',
                statusHistory: [],
                isReconciled: false,
                createdAt: new Date(),
                createdBy: 'user-123',
                updatedAt: new Date(),
                updatedBy: 'user-123',
                version: 1,
            };
            const mockInvoice1 = {
                id: 'invoice-1',
                organizationId: 'org-123',
                branchId: 'branch-123',
                invoiceNumber: 'INV-001',
                invoiceType: 'STANDARD',
                payerId: 'payer-123',
                payerType: 'MEDICAID',
                payerName: 'State Medicaid',
                periodStart: new Date(),
                periodEnd: new Date(),
                invoiceDate: new Date(),
                dueDate: new Date(),
                billableItemIds: [],
                lineItems: [],
                subtotal: 500,
                taxAmount: 0,
                discountAmount: 0,
                adjustmentAmount: 0,
                totalAmount: 500,
                paidAmount: 0,
                balanceDue: 500,
                status: 'SENT',
                statusHistory: [],
                payments: [],
                createdAt: new Date(),
                createdBy: 'user-123',
                updatedAt: new Date(),
                updatedBy: 'user-123',
                version: 1,
                deletedAt: null,
                deletedBy: null,
            };
            const mockInvoice2 = {
                ...mockInvoice1,
                id: 'invoice-2',
                invoiceNumber: 'INV-002',
                totalAmount: 400,
                balanceDue: 400,
            };
            mockRepository.findPaymentById.mockResolvedValue(mockPayment);
            mockRepository.findInvoiceById
                .mockResolvedValueOnce(mockInvoice1)
                .mockResolvedValueOnce(mockInvoice2);
            mockClient.query.mockResolvedValue({ rows: [] });
            await service.allocatePayment(input, 'user-123');
            (0, vitest_1.expect)(mockClient.query).toHaveBeenCalledWith('BEGIN');
            (0, vitest_1.expect)(mockClient.query).toHaveBeenCalledWith('COMMIT');
            (0, vitest_1.expect)(mockRepository.allocatePayment).toHaveBeenCalledTimes(2);
            (0, vitest_1.expect)(mockRepository.updateInvoicePayment).toHaveBeenCalledTimes(2);
        });
        (0, vitest_1.it)('should reject allocation exceeding invoice balance', async () => {
            const input = {
                paymentId: 'payment-123',
                allocations: [
                    {
                        invoiceId: 'invoice-1',
                        amount: 1000,
                    },
                ],
            };
            const mockPayment = {
                id: 'payment-123',
                organizationId: 'org-123',
                branchId: 'branch-123',
                paymentNumber: 'PAY-ORG-2024-000001',
                paymentType: 'FULL',
                payerId: 'payer-123',
                payerType: 'MEDICAID',
                payerName: 'State Medicaid',
                amount: 1000,
                currency: 'USD',
                paymentDate: new Date(),
                receivedDate: new Date(),
                paymentMethod: 'EFT',
                allocations: [],
                unappliedAmount: 1000,
                status: 'RECEIVED',
                statusHistory: [],
                isReconciled: false,
                createdAt: new Date(),
                createdBy: 'user-123',
                updatedAt: new Date(),
                updatedBy: 'user-123',
                version: 1,
            };
            const mockInvoice = {
                id: 'invoice-1',
                organizationId: 'org-123',
                branchId: 'branch-123',
                invoiceNumber: 'INV-001',
                invoiceType: 'STANDARD',
                payerId: 'payer-123',
                payerType: 'MEDICAID',
                payerName: 'State Medicaid',
                periodStart: new Date(),
                periodEnd: new Date(),
                invoiceDate: new Date(),
                dueDate: new Date(),
                billableItemIds: [],
                lineItems: [],
                subtotal: 500,
                taxAmount: 0,
                discountAmount: 0,
                adjustmentAmount: 0,
                totalAmount: 500,
                paidAmount: 0,
                balanceDue: 500,
                status: 'SENT',
                statusHistory: [],
                payments: [],
                createdAt: new Date(),
                createdBy: 'user-123',
                updatedAt: new Date(),
                updatedBy: 'user-123',
                version: 1,
                deletedAt: null,
                deletedBy: null,
            };
            mockRepository.findPaymentById.mockResolvedValue(mockPayment);
            mockRepository.findInvoiceById.mockResolvedValue(mockInvoice);
            await (0, vitest_1.expect)(service.allocatePayment(input, 'user-123')).rejects.toThrow('exceeds balance due');
            (0, vitest_1.expect)(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
        });
    });
    (0, vitest_1.describe)('approveBillableItem', () => {
        (0, vitest_1.it)('should approve billable item from PENDING to READY', async () => {
            const mockItem = {
                id: 'item-123',
                organizationId: 'org-123',
                branchId: 'branch-123',
                clientId: 'client-123',
                serviceTypeId: 'service-123',
                serviceTypeCode: 'S5100',
                serviceTypeName: 'Personal Care',
                serviceDate: new Date(),
                durationMinutes: 120,
                unitType: 'HOUR',
                units: 2,
                unitRate: 25.5,
                subtotal: 51,
                finalAmount: 51,
                payerId: 'payer-123',
                payerType: 'MEDICAID',
                payerName: 'State Medicaid',
                isAuthorized: false,
                status: 'PENDING',
                statusHistory: [],
                isHold: false,
                requiresReview: false,
                isDenied: false,
                isAppealable: false,
                isPaid: false,
                createdAt: new Date(),
                createdBy: 'user-123',
                updatedAt: new Date(),
                updatedBy: 'user-123',
                version: 1,
                deletedAt: null,
                deletedBy: null,
            };
            mockRepository.searchBillableItems.mockResolvedValue([mockItem]);
            await service.approveBillableItem('item-123', 'user-123');
            (0, vitest_1.expect)(mockRepository.updateBillableItemStatus).toHaveBeenCalledWith('item-123', 'READY', vitest_1.expect.objectContaining({
                fromStatus: 'PENDING',
                toStatus: 'READY',
            }), 'user-123');
        });
        (0, vitest_1.it)('should reject approval of non-PENDING items', async () => {
            const mockItem = {
                id: 'item-123',
                organizationId: 'org-123',
                branchId: 'branch-123',
                clientId: 'client-123',
                serviceTypeId: 'service-123',
                serviceTypeCode: 'S5100',
                serviceTypeName: 'Personal Care',
                serviceDate: new Date(),
                durationMinutes: 120,
                unitType: 'HOUR',
                units: 2,
                unitRate: 25.5,
                subtotal: 51,
                finalAmount: 51,
                payerId: 'payer-123',
                payerType: 'MEDICAID',
                payerName: 'State Medicaid',
                isAuthorized: false,
                status: 'PAID',
                statusHistory: [],
                isHold: false,
                requiresReview: false,
                isDenied: false,
                isAppealable: false,
                isPaid: true,
                createdAt: new Date(),
                createdBy: 'user-123',
                updatedAt: new Date(),
                updatedBy: 'user-123',
                version: 1,
                deletedAt: null,
                deletedBy: null,
            };
            mockRepository.searchBillableItems.mockResolvedValue([mockItem]);
            await (0, vitest_1.expect)(service.approveBillableItem('item-123', 'user-123')).rejects.toThrow('Cannot approve item in PAID status');
        });
    });
});
//# sourceMappingURL=billing-service.test.js.map