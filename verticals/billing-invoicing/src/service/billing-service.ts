/**
 * Billing Service
 *
 * Core billing service implementing SOLID principles
 * Orchestrates billing operations with proper separation of concerns
 */

import { Pool, PoolClient } from 'pg';
import { v4 as uuid } from 'uuid';
import { UUID } from '@care-commons/core';
import { BillingRepository } from '../repository/billing-repository';
import {
  CreateBillableItemInput,
  CreateInvoiceInput,
  CreatePaymentInput,
  AllocatePaymentInput,
  BillableItem,
  Invoice,
  Payment,
  InvoiceLineItem,
} from '../types/billing';
import {
  validateCreateBillableItem,
  validateCreateInvoice,
  validateCreatePayment,
  validateAllocatePayment,
} from '../validation/billing-validator';
import {
  calculateUnits,
  calculateBaseAmount,
  applyModifiers,
  calculateInvoiceTotal,
  generateInvoiceNumber,
  generatePaymentNumber,
  calculateDueDate,
} from '../utils/billing-calculations';

export class BillingService {
  private repository: BillingRepository;

  constructor(private pool: Pool) {
    this.repository = new BillingRepository(pool);
  }

  /**
   * Create billable item from completed visit/EVV record
   */
  async createBillableItem(input: CreateBillableItemInput, userId: UUID): Promise<BillableItem> {
    // Validate input
    const validation = validateCreateBillableItem(input);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Look up rate schedule
    const rateSchedule = await this.repository.findActiveRateSchedule(
      input.organizationId,
      input.payerId
    );

    if (!rateSchedule) {
      throw new Error('No active rate schedule found for payer');
    }

    // Find matching rate for service
    const serviceRate = rateSchedule.rates.find((r) => r.serviceTypeCode === input.serviceTypeCode);

    if (!serviceRate) {
      throw new Error(`No rate found for service code ${input.serviceTypeCode}`);
    }

    // Calculate units and amounts
    const units =
      input.units ||
      calculateUnits(input.durationMinutes, input.unitType, serviceRate.roundingRule);

    const unitRate = input.rateScheduleId ? serviceRate.unitRate : serviceRate.unitRate;

    const subtotal = calculateBaseAmount(units, unitRate);
    const finalAmount = applyModifiers(subtotal, input.modifiers);

    // Check authorization if required
    let authorizationRemainingUnits: number | undefined;
    let isAuthorized = false;

    if (input.authorizationId) {
      const auth = await this.repository.findAuthorizationByNumber(input.authorizationNumber!);

      if (!auth) {
        throw new Error('Authorization not found');
      }

      if (auth.status !== 'ACTIVE') {
        throw new Error(`Authorization is ${auth.status}, not ACTIVE`);
      }

      if (auth.remainingUnits < units) {
        throw new Error(
          `Insufficient authorization units. Needed: ${units}, Available: ${auth.remainingUnits}`
        );
      }

      authorizationRemainingUnits = auth.remainingUnits - units;
      isAuthorized = true;
    }

    // Create billable item
    const billableItem: Omit<
      BillableItem,
      'id' | 'createdAt' | 'updatedAt' | 'version' | 'deletedAt' | 'deletedBy'
    > = {
      ...input,
      units,
      unitRate,
      subtotal,
      finalAmount,
      isAuthorized,
      ...(authorizationRemainingUnits !== undefined ? { authorizationRemainingUnits } : {}),
      status: 'PENDING',
      statusHistory: [
        {
          id: uuid(),
          fromStatus: null,
          toStatus: 'PENDING',
          timestamp: new Date(),
          changedBy: userId,
          reason: 'Billable item created from service delivery',
        },
      ],
      isHold: false,
      requiresReview: false,
      isDenied: false,
      isAppealable: false,
      isPaid: false,
      createdBy: userId,
      updatedBy: userId,
    };

    const created = await this.repository.createBillableItem(billableItem);

    // Update authorization units if applicable
    if (input.authorizationId && isAuthorized) {
      await this.repository.updateAuthorizationUnits(
        input.authorizationId,
        units,
        0, // not yet billed
        userId
      );
    }

    return created;
  }

  /**
   * Create invoice from billable items
   */
  async createInvoice(input: CreateInvoiceInput, userId: UUID, orgCode: string): Promise<Invoice> {
    // Validate input
    const validation = validateCreateInvoice(input);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Get billable items
      const billableItems = await this.repository.searchBillableItems({
        organizationId: input.organizationId,
      });

      const items = billableItems.filter((item) => input.billableItemIds.includes(item.id));

      if (items.length === 0) {
        throw new Error('No billable items found');
      }

      // Verify all items are for the same payer
      const payerIds = new Set(items.map((item) => item.payerId));
      if (payerIds.size > 1) {
        throw new Error('All billable items must be for the same payer');
      }

      // Verify all items are in READY status
      const notReady = items.filter((item) => item.status !== 'READY');
      if (notReady.length > 0) {
        throw new Error(`${notReady.length} items are not in READY status`);
      }

      // Calculate totals
      const subtotal = items.reduce((sum, item) => sum + item.finalAmount, 0);
      const taxAmount = 0; // Healthcare services typically tax-exempt
      const totalAmount = calculateInvoiceTotal(subtotal, taxAmount, 0, 0);
      const balanceDue = totalAmount;

      // Generate invoice number
      const invoiceCount = await this.getInvoiceCount(
        input.organizationId,
        new Date().getFullYear(),
        client
      );
      const invoiceNumber = generateInvoiceNumber(
        orgCode,
        invoiceCount + 1,
        new Date().getFullYear()
      );

      // Create line items
      const lineItems: InvoiceLineItem[] = items.map((item) => {
        const lineItem: InvoiceLineItem = {
          id: uuid(),
          billableItemId: item.id,
          serviceDate: item.serviceDate,
          serviceCode: item.serviceTypeCode,
          serviceDescription: item.serviceTypeName,
          unitType: item.unitType,
          units: item.units,
          unitRate: item.unitRate,
          subtotal: item.subtotal,
          adjustments: 0,
          total: item.finalAmount,
          clientId: item.clientId,
        };
        if (item.caregiverName) lineItem.providerName = item.caregiverName;
        if (item.providerNPI) lineItem.providerNPI = item.providerNPI;
        if (item.modifiers) lineItem.modifiers = item.modifiers;
        if (item.authorizationNumber) lineItem.authorizationNumber = item.authorizationNumber;
        return lineItem;
      });

      // Get payer info
      const payer = await this.repository.findPayerById(input.payerId);
      if (!payer) {
        throw new Error('Payer not found');
      }

      // Calculate due date
      const dueDate = calculateDueDate(input.invoiceDate, payer.paymentTermsDays);

      // Create invoice
      const invoice: Omit<
        Invoice,
        'id' | 'createdAt' | 'updatedAt' | 'version' | 'deletedAt' | 'deletedBy'
      > = {
        organizationId: input.organizationId,
        branchId: input.branchId,
        invoiceNumber,
        invoiceType: input.invoiceType,
        payerId: input.payerId,
        payerType: input.payerType,
        payerName: input.payerName,
        ...(payer.billingAddress
          ? { payerAddress: payer.billingAddress }
          : payer.address
            ? { payerAddress: payer.address }
            : {}),
        ...(input.clientId ? { clientId: input.clientId } : {}),
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        invoiceDate: input.invoiceDate,
        dueDate,
        billableItemIds: input.billableItemIds,
        lineItems,
        subtotal,
        taxAmount,
        discountAmount: 0,
        adjustmentAmount: 0,
        totalAmount,
        paidAmount: 0,
        balanceDue,
        status: 'DRAFT',
        statusHistory: [
          {
            id: uuid(),
            fromStatus: null,
            toStatus: 'DRAFT',
            timestamp: new Date(),
            changedBy: userId,
            reason: 'Invoice created',
          },
        ],
        payments: [],
        ...(input.notes ? { notes: input.notes } : {}),
        createdBy: userId,
        updatedBy: userId,
      };

      const created = await this.repository.createInvoice(invoice, client);

      // Update billable items to INVOICED status
      for (const item of items) {
        await this.repository.updateBillableItemStatus(
          item.id,
          'INVOICED',
          {
            id: uuid(),
            fromStatus: 'READY',
            toStatus: 'INVOICED',
            timestamp: new Date(),
            changedBy: userId,
            reason: `Added to invoice ${invoiceNumber}`,
          },
          userId,
          client
        );
      }

      await client.query('COMMIT');
      return created;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Create payment from payer
   */
  async createPayment(input: CreatePaymentInput, userId: UUID, orgCode: string): Promise<Payment> {
    // Validate input
    const validation = validateCreatePayment(input);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Generate payment number
    const paymentCount = await this.getPaymentCount(input.organizationId, new Date().getFullYear());
    const paymentNumber = generatePaymentNumber(
      orgCode,
      paymentCount + 1,
      new Date().getFullYear()
    );

    // Create payment
    const payment: Omit<Payment, 'id' | 'createdAt' | 'updatedAt' | 'version'> = {
      organizationId: input.organizationId,
      branchId: input.branchId,
      paymentNumber,
      paymentType: 'FULL',
      payerId: input.payerId,
      payerType: input.payerType,
      payerName: input.payerName,
      amount: input.amount,
      currency: 'USD',
      paymentDate: input.paymentDate,
      receivedDate: input.receivedDate,
      paymentMethod: input.paymentMethod,
      ...(input.referenceNumber ? { referenceNumber: input.referenceNumber } : {}),
      allocations: [],
      unappliedAmount: input.amount,
      status: 'RECEIVED',
      statusHistory: [
        {
          id: uuid(),
          fromStatus: null,
          toStatus: 'RECEIVED',
          timestamp: new Date(),
          changedBy: userId,
          reason: 'Payment received',
        },
      ],
      isReconciled: false,
      ...(input.notes ? { notes: input.notes } : {}),
      createdBy: userId,
      updatedBy: userId,
    };

    return this.repository.createPayment(payment);
  }

  /**
   * Allocate payment to invoices
   */
  async allocatePayment(input: AllocatePaymentInput, userId: UUID): Promise<void> {
    // Get payment
    const payment = await this.repository.findPaymentById(input.paymentId);
    if (!payment) {
      throw new Error('Payment not found');
    }

    // Validate allocation
    const validation = validateAllocatePayment(input, payment.unappliedAmount);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Apply each allocation
      for (const allocation of input.allocations) {
        // Get invoice
        const invoice = await this.repository.findInvoiceById(allocation.invoiceId);
        if (!invoice) {
          throw new Error(`Invoice ${allocation.invoiceId} not found`);
        }

        // Verify amount doesn't exceed balance
        if (allocation.amount > invoice.balanceDue) {
          throw new Error(
            `Allocation amount ${allocation.amount} exceeds balance due ${invoice.balanceDue}`
          );
        }

        // Add payment allocation
        const paymentAllocation = {
          id: uuid(),
          invoiceId: allocation.invoiceId,
          invoiceNumber: invoice.invoiceNumber,
          amount: allocation.amount,
          appliedAt: new Date(),
          appliedBy: userId,
          notes: allocation.notes,
        };

        await this.repository.allocatePayment(payment.id, paymentAllocation, userId, client);

        // Update invoice payment status
        await this.repository.updateInvoicePayment(
          invoice.id,
          allocation.amount,
          {
            paymentId: payment.id,
            amount: allocation.amount,
            date: payment.paymentDate,
          },
          userId,
          client
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Approve billable item (move from PENDING to READY)
   */
  async approveBillableItem(billableItemId: UUID, userId: UUID): Promise<void> {
    const item = await this.repository.searchBillableItems({
      organizationId: undefined!,
    });

    const billableItem = item.find((i) => i.id === billableItemId);
    if (!billableItem) {
      throw new Error('Billable item not found');
    }

    if (billableItem.status !== 'PENDING') {
      throw new Error(`Cannot approve item in ${billableItem.status} status`);
    }

    await this.repository.updateBillableItemStatus(
      billableItemId,
      'READY',
      {
        id: uuid(),
        fromStatus: 'PENDING',
        toStatus: 'READY',
        timestamp: new Date(),
        changedBy: userId,
        reason: 'Approved for billing',
      },
      userId
    );
  }

  /**
   * Approve invoice for submission
   */
  async approveInvoice(invoiceId: UUID): Promise<void> {
    const invoice = await this.repository.findInvoiceById(invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (invoice.status !== 'DRAFT' && invoice.status !== 'PENDING_REVIEW') {
      throw new Error(`Cannot approve invoice in ${invoice.status} status`);
    }

    // In a transaction, update status (would use repository method)
    // This is a simplified version
    throw new Error('Not implemented - would update status to APPROVED');
  }

  /**
   * Get invoice count for number generation
   */
  private async getInvoiceCount(
    organizationId: UUID,
    year: number,
    client?: PoolClient
  ): Promise<number> {
    const db = client || this.pool;
    const result = await db.query(
      `SELECT COUNT(*) as count FROM invoices 
       WHERE organization_id = $1 
       AND EXTRACT(YEAR FROM invoice_date) = $2`,
      [organizationId, year]
    );
    return parseInt(result.rows[0].count);
  }

  /**
   * Get payment count for number generation
   */
  private async getPaymentCount(organizationId: UUID, year: number): Promise<number> {
    const result = await this.pool.query(
      `SELECT COUNT(*) as count FROM payments 
       WHERE organization_id = $1 
       AND EXTRACT(YEAR FROM payment_date) = $2`,
      [organizationId, year]
    );
    return parseInt(result.rows[0].count);
  }
}
