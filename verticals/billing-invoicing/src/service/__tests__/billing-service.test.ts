/**
 * Integration tests for BillingService
 * 
 * Tests service business logic orchestration with mocked repository layer
 * Focus on workflows, error handling, and transaction boundaries
 */

import { Pool, PoolClient } from 'pg';
import { BillingService } from '../billing-service';
import { BillingRepository } from '../../repository/billing-repository';
import {
  CreateBillableItemInput,
  CreateInvoiceInput,
  CreatePaymentInput,
  AllocatePaymentInput,
  BillableItem,
  Invoice,
  Payment,
  RateSchedule,
  ServiceAuthorization,
  Payer,
} from '../../types/billing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock the repository
vi.mock('../../repository/billing-repository');
vi.mock('uuid', () => ({
  v4: vi.fn(() => 'test-uuid-123'),
}));

describe('BillingService Integration Tests', () => {
  let service: BillingService;
  let mockPool: any;
  let mockClient: any;
  let mockRepository: any;

  beforeEach(() => {
    // Setup mock pool and client
    mockClient = {
      query: vi.fn(),
      release: vi.fn(),
    } as any;

    mockPool = {
      connect: vi.fn().mockResolvedValue(mockClient),
      query: vi.fn(),
    } as any;

    // Create service instance
    service = new BillingService(mockPool);
    mockRepository = (service as any).repository;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createBillableItem', () => {
    const input: CreateBillableItemInput = {
      organizationId: 'org-123' as any,
      branchId: 'branch-123' as any,
      clientId: 'client-123' as any,
      serviceTypeId: 'service-123' as any,
      serviceTypeCode: 'S5100',
      serviceTypeName: 'Personal Care',
      serviceDate: new Date('2024-01-15'),
      durationMinutes: 120,
      unitType: 'HOUR',
      units: 2,
      payerId: 'payer-123' as any,
      payerType: 'MEDICAID',
      payerName: 'State Medicaid',
    };

    it('should create billable item with rate calculation', async () => {
      // Mock rate schedule lookup
      const mockRateSchedule: RateSchedule = {
        id: 'rate-schedule-123' as any,
        organizationId: 'org-123' as any,
        name: 'Standard Rates',
        scheduleType: 'STANDARD',
        effectiveFrom: new Date('2024-01-01'),
        rates: [
          {
            id: 'rate-1' as any,
            serviceTypeId: 'service-123' as any,
            serviceTypeCode: 'S5100',
            serviceTypeName: 'Personal Care',
            unitType: 'HOUR',
            unitRate: 25.5,
          },
        ],
        status: 'ACTIVE',
        createdAt: new Date(),
        createdBy: 'admin' as any,
        updatedAt: new Date(),
        updatedBy: 'admin' as any,
        version: 1,
      };

      mockRepository.findActiveRateSchedule.mockResolvedValue(mockRateSchedule);

      // Mock created billable item
      const mockBillableItem: BillableItem = {
        ...input,
        id: 'item-123' as any,
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
        createdBy: 'user-123' as any,
        updatedAt: new Date(),
        updatedBy: 'user-123' as any,
        version: 1,
        deletedAt: null,
        deletedBy: null,
      };

      mockRepository.createBillableItem.mockResolvedValue(mockBillableItem);

      const result = await service.createBillableItem(input, 'user-123' as any);

      expect(result.id).toBe('item-123');
      expect(result.unitRate).toBe(25.5);
      expect(result.subtotal).toBe(51);
      expect(result.finalAmount).toBe(51);
      expect(result.status).toBe('PENDING');
      expect(mockRepository.findActiveRateSchedule).toHaveBeenCalledWith(
        input.organizationId,
        input.payerId
      );
      expect(mockRepository.createBillableItem).toHaveBeenCalled();
    });

    it('should throw error when no active rate schedule found', async () => {
      mockRepository.findActiveRateSchedule.mockResolvedValue(null);

      await expect(service.createBillableItem(input, 'user-123' as any)).rejects.toThrow(
        'No active rate schedule found for payer'
      );
    });

    it('should throw error when service code not in rate schedule', async () => {
      const mockRateSchedule: RateSchedule = {
        id: 'rate-schedule-123' as any,
        organizationId: 'org-123' as any,
        name: 'Standard Rates',
        scheduleType: 'STANDARD',
        effectiveFrom: new Date('2024-01-01'),
        rates: [], // No matching rate
        status: 'ACTIVE',
        createdAt: new Date(),
        createdBy: 'admin' as any,
        updatedAt: new Date(),
        updatedBy: 'admin' as any,
        version: 1,
      };

      mockRepository.findActiveRateSchedule.mockResolvedValue(mockRateSchedule);

      await expect(service.createBillableItem(input, 'user-123' as any)).rejects.toThrow(
        'No rate found for service code'
      );
    });

    it('should validate authorization and check remaining units', async () => {
      const inputWithAuth = {
        ...input,
        authorizationId: 'auth-123' as any,
        authorizationNumber: 'AUTH-001',
      };

      const mockRateSchedule: RateSchedule = {
        id: 'rate-schedule-123' as any,
        organizationId: 'org-123' as any,
        name: 'Standard Rates',
        scheduleType: 'STANDARD',
        effectiveFrom: new Date('2024-01-01'),
        rates: [
          {
            id: 'rate-1' as any,
            serviceTypeId: 'service-123' as any,
            serviceTypeCode: 'S5100',
            serviceTypeName: 'Personal Care',
            unitType: 'HOUR',
            unitRate: 25.5,
          },
        ],
        status: 'ACTIVE',
        createdAt: new Date(),
        createdBy: 'admin' as any,
        updatedAt: new Date(),
        updatedBy: 'admin' as any,
        version: 1,
      };

      const mockAuth: ServiceAuthorization = {
        id: 'auth-123' as any,
        organizationId: 'org-123' as any,
        branchId: 'branch-123' as any,
        clientId: 'client-123' as any,
        authorizationNumber: 'AUTH-001',
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
        usedUnits: 50,
        remainingUnits: 50,
        billedUnits: 40,
        requiresReferral: false,
        status: 'ACTIVE',
        statusHistory: [],
        createdAt: new Date(),
        createdBy: 'admin' as any,
        updatedAt: new Date(),
        updatedBy: 'admin' as any,
        version: 1,
        deletedAt: null,
        deletedBy: null,
      };

      mockRepository.findActiveRateSchedule.mockResolvedValue(mockRateSchedule);
      mockRepository.findAuthorizationByNumber.mockResolvedValue(mockAuth);
      mockRepository.createBillableItem.mockResolvedValue({
        ...inputWithAuth,
        id: 'item-123' as any,
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
        createdBy: 'user-123' as any,
        updatedAt: new Date(),
        updatedBy: 'user-123' as any,
        version: 1,
        deletedAt: null,
        deletedBy: null,
      });

      const result = await service.createBillableItem(inputWithAuth, 'user-123' as any);

      expect(result.isAuthorized).toBe(true);
      expect(result.authorizationRemainingUnits).toBe(48);
      expect(mockRepository.updateAuthorizationUnits).toHaveBeenCalledWith(
        'auth-123',
        2,
        0,
        'user-123'
      );
    });

    it('should reject when authorization has insufficient units', async () => {
      const inputWithAuth = {
        ...input,
        authorizationId: 'auth-123' as any,
        authorizationNumber: 'AUTH-001',
        units: 100, // Requesting more than available
      };

      const mockRateSchedule: RateSchedule = {
        id: 'rate-schedule-123' as any,
        organizationId: 'org-123' as any,
        name: 'Standard Rates',
        scheduleType: 'STANDARD',
        effectiveFrom: new Date('2024-01-01'),
        rates: [
          {
            id: 'rate-1' as any,
            serviceTypeId: 'service-123' as any,
            serviceTypeCode: 'S5100',
            serviceTypeName: 'Personal Care',
            unitType: 'HOUR',
            unitRate: 25.5,
          },
        ],
        status: 'ACTIVE',
        createdAt: new Date(),
        createdBy: 'admin' as any,
        updatedAt: new Date(),
        updatedBy: 'admin' as any,
        version: 1,
      };

      const mockAuth: ServiceAuthorization = {
        id: 'auth-123' as any,
        organizationId: 'org-123' as any,
        branchId: 'branch-123' as any,
        clientId: 'client-123' as any,
        authorizationNumber: 'AUTH-001',
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
        usedUnits: 95,
        remainingUnits: 5, // Only 5 units remaining
        billedUnits: 90,
        requiresReferral: false,
        status: 'ACTIVE',
        statusHistory: [],
        createdAt: new Date(),
        createdBy: 'admin' as any,
        updatedAt: new Date(),
        updatedBy: 'admin' as any,
        version: 1,
        deletedAt: null,
        deletedBy: null,
      };

      mockRepository.findActiveRateSchedule.mockResolvedValue(mockRateSchedule);
      mockRepository.findAuthorizationByNumber.mockResolvedValue(mockAuth);

      await expect(
        service.createBillableItem(inputWithAuth, 'user-123' as any)
      ).rejects.toThrow('Insufficient authorization units');
    });
  });

  describe('createInvoice', () => {
    it('should create invoice from multiple billable items', async () => {
      const input: CreateInvoiceInput = {
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

      const mockBillableItems: BillableItem[] = [
        {
          id: 'item-1' as any,
          organizationId: 'org-123' as any,
          branchId: 'branch-123' as any,
          clientId: 'client-123' as any,
          serviceTypeId: 'service-123' as any,
          serviceTypeCode: 'S5100',
          serviceTypeName: 'Personal Care',
          serviceDate: new Date('2024-01-15'),
          durationMinutes: 120,
          unitType: 'HOUR',
          units: 2,
          unitRate: 25.5,
          subtotal: 51,
          finalAmount: 51,
          payerId: 'payer-123' as any,
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
          createdBy: 'user-123' as any,
          updatedAt: new Date(),
          updatedBy: 'user-123' as any,
          version: 1,
          deletedAt: null,
          deletedBy: null,
        },
        {
          id: 'item-2' as any,
          organizationId: 'org-123' as any,
          branchId: 'branch-123' as any,
          clientId: 'client-123' as any,
          serviceTypeId: 'service-123' as any,
          serviceTypeCode: 'S5100',
          serviceTypeName: 'Personal Care',
          serviceDate: new Date('2024-01-16'),
          durationMinutes: 120,
          unitType: 'HOUR',
          units: 2,
          unitRate: 25.5,
          subtotal: 51,
          finalAmount: 51,
          payerId: 'payer-123' as any,
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
          createdBy: 'user-123' as any,
          updatedAt: new Date(),
          updatedBy: 'user-123' as any,
          version: 1,
          deletedAt: null,
          deletedBy: null,
        },
      ];

      const mockPayer: Payer = {
        id: 'payer-123' as any,
        organizationId: 'org-123' as any,
        payerName: 'State Medicaid',
        payerType: 'MEDICAID',
        paymentTermsDays: 30,
        requiresPreAuthorization: true,
        requiresReferral: false,
        status: 'ACTIVE',
        createdAt: new Date(),
        createdBy: 'admin' as any,
        updatedAt: new Date(),
        updatedBy: 'admin' as any,
        version: 1,
        deletedAt: null,
        deletedBy: null,
      };

      mockRepository.searchBillableItems.mockResolvedValue(mockBillableItems);
      mockRepository.findPayerById.mockResolvedValue(mockPayer);
      
      // Mock the query that counts invoices
      (mockClient.query as any).mockImplementation((sql: string) => {
        if (typeof sql === 'string' && sql.includes('COUNT')) {
          return Promise.resolve({ rows: [{ count: '0' }] });
        }
        return Promise.resolve({ rows: [] });
      });

      const mockInvoice: Invoice = {
        id: 'invoice-123' as any,
        ...input,
        invoiceNumber: 'INV-ORG-2024-000001',
        billableItemIds: ['item-1' as any, 'item-2' as any],
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
        createdBy: 'user-123' as any,
        updatedAt: new Date(),
        updatedBy: 'user-123' as any,
        version: 1,
        deletedAt: null,
        deletedBy: null,
      };

      mockRepository.createInvoice.mockResolvedValue(mockInvoice);

      const result = await service.createInvoice(input, 'user-123' as any, 'ORG');

      expect(result.totalAmount).toBe(102);
      expect(result.billableItemIds).toHaveLength(2);
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockRepository.updateBillableItemStatus).toHaveBeenCalledTimes(2);
    });

    it('should rollback on error', async () => {
      const input: CreateInvoiceInput = {
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
        billableItemIds: ['item-1' as any],
      };

      mockRepository.searchBillableItems.mockRejectedValue(new Error('Database error'));

      await expect(service.createInvoice(input, 'user-123' as any, 'ORG')).rejects.toThrow(
        'Database error'
      );

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should reject mixed payer billable items', async () => {
      const input: CreateInvoiceInput = {
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

      const mockBillableItems: BillableItem[] = [
        {
          id: 'item-1' as any,
          organizationId: 'org-123' as any,
          branchId: 'branch-123' as any,
          clientId: 'client-123' as any,
          serviceTypeId: 'service-123' as any,
          serviceTypeCode: 'S5100',
          serviceTypeName: 'Personal Care',
          serviceDate: new Date('2024-01-15'),
          durationMinutes: 120,
          unitType: 'HOUR',
          units: 2,
          unitRate: 25.5,
          subtotal: 51,
          finalAmount: 51,
          payerId: 'payer-123' as any,
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
          createdBy: 'user-123' as any,
          updatedAt: new Date(),
          updatedBy: 'user-123' as any,
          version: 1,
          deletedAt: null,
          deletedBy: null,
        },
        {
          id: 'item-2' as any,
          organizationId: 'org-123' as any,
          branchId: 'branch-123' as any,
          clientId: 'client-123' as any,
          serviceTypeId: 'service-123' as any,
          serviceTypeCode: 'S5100',
          serviceTypeName: 'Personal Care',
          serviceDate: new Date('2024-01-16'),
          durationMinutes: 120,
          unitType: 'HOUR',
          units: 2,
          unitRate: 25.5,
          subtotal: 51,
          finalAmount: 51,
          payerId: 'payer-999' as any, // Different payer!
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
          createdBy: 'user-123' as any,
          updatedAt: new Date(),
          updatedBy: 'user-123' as any,
          version: 1,
          deletedAt: null,
          deletedBy: null,
        },
      ];

      mockRepository.searchBillableItems.mockResolvedValue(mockBillableItems);

      await expect(service.createInvoice(input, 'user-123' as any, 'ORG')).rejects.toThrow(
        'All billable items must be for the same payer'
      );
    });
  });

  describe('createPayment and allocatePayment', () => {
    it('should create payment with unapplied amount', async () => {
      const input: CreatePaymentInput = {
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

      const mockPayment: Payment = {
        id: 'payment-123' as any,
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
        createdBy: 'user-123' as any,
        updatedAt: new Date(),
        updatedBy: 'user-123' as any,
        version: 1,
      };

      (mockPool.query as any).mockResolvedValue({ rows: [{ count: '0' }] });
      mockRepository.createPayment.mockResolvedValue(mockPayment);

      const result = await service.createPayment(input, 'user-123' as any, 'ORG');

      expect(result.amount).toBe(1000);
      expect(result.unappliedAmount).toBe(1000);
      expect(result.status).toBe('RECEIVED');
    });

    it('should allocate payment to invoices', async () => {
      const input: AllocatePaymentInput = {
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

      const mockPayment: Payment = {
        id: 'payment-123' as any,
        organizationId: 'org-123' as any,
        branchId: 'branch-123' as any,
        paymentNumber: 'PAY-ORG-2024-000001',
        paymentType: 'FULL',
        payerId: 'payer-123' as any,
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
        createdBy: 'user-123' as any,
        updatedAt: new Date(),
        updatedBy: 'user-123' as any,
        version: 1,
      };

      const mockInvoice1: Invoice = {
        id: 'invoice-1' as any,
        organizationId: 'org-123' as any,
        branchId: 'branch-123' as any,
        invoiceNumber: 'INV-001',
        invoiceType: 'STANDARD',
        payerId: 'payer-123' as any,
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
        createdBy: 'user-123' as any,
        updatedAt: new Date(),
        updatedBy: 'user-123' as any,
        version: 1,
        deletedAt: null,
        deletedBy: null,
      };

      const mockInvoice2: Invoice = {
        ...mockInvoice1,
        id: 'invoice-2' as any,
        invoiceNumber: 'INV-002',
        totalAmount: 400,
        balanceDue: 400,
      };

      mockRepository.findPaymentById.mockResolvedValue(mockPayment);
      mockRepository.findInvoiceById
        .mockResolvedValueOnce(mockInvoice1)
        .mockResolvedValueOnce(mockInvoice2);

      (mockClient.query as any).mockResolvedValue({ rows: [] });

      await service.allocatePayment(input, 'user-123' as any);

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockRepository.allocatePayment).toHaveBeenCalledTimes(2);
      expect(mockRepository.updateInvoicePayment).toHaveBeenCalledTimes(2);
    });

    it('should reject allocation exceeding invoice balance', async () => {
      const input: AllocatePaymentInput = {
        paymentId: 'payment-123' as any,
        allocations: [
          {
            invoiceId: 'invoice-1' as any,
            amount: 1000, // More than balance due
          },
        ],
      };

      const mockPayment: Payment = {
        id: 'payment-123' as any,
        organizationId: 'org-123' as any,
        branchId: 'branch-123' as any,
        paymentNumber: 'PAY-ORG-2024-000001',
        paymentType: 'FULL',
        payerId: 'payer-123' as any,
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
        createdBy: 'user-123' as any,
        updatedAt: new Date(),
        updatedBy: 'user-123' as any,
        version: 1,
      };

      const mockInvoice: Invoice = {
        id: 'invoice-1' as any,
        organizationId: 'org-123' as any,
        branchId: 'branch-123' as any,
        invoiceNumber: 'INV-001',
        invoiceType: 'STANDARD',
        payerId: 'payer-123' as any,
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
        balanceDue: 500, // Only $500 balance
        status: 'SENT',
        statusHistory: [],
        payments: [],
        createdAt: new Date(),
        createdBy: 'user-123' as any,
        updatedAt: new Date(),
        updatedBy: 'user-123' as any,
        version: 1,
        deletedAt: null,
        deletedBy: null,
      };

      mockRepository.findPaymentById.mockResolvedValue(mockPayment);
      mockRepository.findInvoiceById.mockResolvedValue(mockInvoice);

      await expect(service.allocatePayment(input, 'user-123' as any)).rejects.toThrow(
        'exceeds balance due'
      );

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });
  });

  describe('approveBillableItem', () => {
    it('should approve billable item from PENDING to READY', async () => {
      const mockItem: BillableItem = {
        id: 'item-123' as any,
        organizationId: 'org-123' as any,
        branchId: 'branch-123' as any,
        clientId: 'client-123' as any,
        serviceTypeId: 'service-123' as any,
        serviceTypeCode: 'S5100',
        serviceTypeName: 'Personal Care',
        serviceDate: new Date(),
        durationMinutes: 120,
        unitType: 'HOUR',
        units: 2,
        unitRate: 25.5,
        subtotal: 51,
        finalAmount: 51,
        payerId: 'payer-123' as any,
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
        createdBy: 'user-123' as any,
        updatedAt: new Date(),
        updatedBy: 'user-123' as any,
        version: 1,
        deletedAt: null,
        deletedBy: null,
      };

      mockRepository.searchBillableItems.mockResolvedValue([mockItem]);

      await service.approveBillableItem('item-123' as any, 'user-123' as any);

      expect(mockRepository.updateBillableItemStatus).toHaveBeenCalledWith(
        'item-123',
        'READY',
        expect.objectContaining({
          fromStatus: 'PENDING',
          toStatus: 'READY',
        }),
        'user-123'
      );
    });

    it('should reject approval of non-PENDING items', async () => {
      const mockItem: BillableItem = {
        id: 'item-123' as any,
        organizationId: 'org-123' as any,
        branchId: 'branch-123' as any,
        clientId: 'client-123' as any,
        serviceTypeId: 'service-123' as any,
        serviceTypeCode: 'S5100',
        serviceTypeName: 'Personal Care',
        serviceDate: new Date(),
        durationMinutes: 120,
        unitType: 'HOUR',
        units: 2,
        unitRate: 25.5,
        subtotal: 51,
        finalAmount: 51,
        payerId: 'payer-123' as any,
        payerType: 'MEDICAID',
        payerName: 'State Medicaid',
        isAuthorized: false,
        status: 'PAID', // Already paid!
        statusHistory: [],
        isHold: false,
        requiresReview: false,
        isDenied: false,
        isAppealable: false,
        isPaid: true,
        createdAt: new Date(),
        createdBy: 'user-123' as any,
        updatedAt: new Date(),
        updatedBy: 'user-123' as any,
        version: 1,
        deletedAt: null,
        deletedBy: null,
      };

      mockRepository.searchBillableItems.mockResolvedValue([mockItem]);

      await expect(
        service.approveBillableItem('item-123' as any, 'user-123' as any)
      ).rejects.toThrow('Cannot approve item in PAID status');
    });
  });
});
