/**
 * Unit tests for InvoiceService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InvoiceService } from '../invoice-service';

describe('InvoiceService', () => {
  let service: InvoiceService;
  let mockPool: any;
  let mockRepository: any;
  let mockBillableConversionService: any;
  let mockVisitProvider: any;

  beforeEach(() => {
    mockPool = {
      connect: vi.fn(),
    };

    mockRepository = {
      createInvoice: vi.fn(),
      createInvoiceLineItem: vi.fn(),
      createInvoiceAdjustment: vi.fn(),
      getInvoiceCountForMonth: vi.fn(),
    };

    mockBillableConversionService = {
      convertVisitsToBillables: vi.fn(),
    };

    mockVisitProvider = {
      getVisitsInPeriod: vi.fn(),
    };

    service = new InvoiceService(
      mockPool,
      mockRepository,
      mockBillableConversionService,
      mockVisitProvider
    );
  });

  describe('generateInvoiceNumber', () => {
    it('should generate invoice number in correct format', async () => {
      mockRepository.getInvoiceCountForMonth.mockResolvedValue(5);

      const invoiceNumber = await service.generateInvoiceNumber();

      const now = new Date();
      const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;

      expect(invoiceNumber).toBe(`INV-${yearMonth}-0006`);
    });

    it('should pad sequence number with zeros', async () => {
      mockRepository.getInvoiceCountForMonth.mockResolvedValue(99);

      const invoiceNumber = await service.generateInvoiceNumber();

      const now = new Date();
      const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;

      expect(invoiceNumber).toBe(`INV-${yearMonth}-0100`);
    });

    it('should handle first invoice of month', async () => {
      mockRepository.getInvoiceCountForMonth.mockResolvedValue(0);

      const invoiceNumber = await service.generateInvoiceNumber();

      const now = new Date();
      const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;

      expect(invoiceNumber).toBe(`INV-${yearMonth}-0001`);
    });
  });

  describe('calculateDueDate', () => {
    it('should calculate due date correctly for 30 day terms', () => {
      const invoiceDate = new Date('2025-01-01');
      const dueDate = service.calculateDueDate(invoiceDate, 30);

      expect(dueDate.getFullYear()).toBe(2025);
      expect(dueDate.getMonth()).toBe(0); // January
      expect(dueDate.getDate()).toBe(31);
    });

    it('should calculate due date correctly for 15 day terms', () => {
      const invoiceDate = new Date('2025-01-01');
      const dueDate = service.calculateDueDate(invoiceDate, 15);

      expect(dueDate.getFullYear()).toBe(2025);
      expect(dueDate.getMonth()).toBe(0); // January
      expect(dueDate.getDate()).toBe(16);
    });

    it('should handle month boundary correctly', () => {
      const invoiceDate = new Date('2025-01-20');
      const dueDate = service.calculateDueDate(invoiceDate, 30);

      expect(dueDate.getFullYear()).toBe(2025);
      expect(dueDate.getMonth()).toBe(1); // February
      expect(dueDate.getDate()).toBe(19);
    });
  });
});
