/**
 * Invoice Service
 *
 * Generates invoices from billable line items
 * Handles invoice numbering, totals calculation, and adjustments
 */

import { Pool, PoolClient } from 'pg';
import { UUID } from '@care-commons/core';
import { BillingRepository } from '../repository/billing-repository';
import { Invoice } from '../types/billing';
import { BillableConversionService } from './billable-conversion-service';

interface Visit {
  id: number;
  clientId: UUID;
  serviceId: UUID;
  scheduledStartTime: Date;
  status: string;
}

interface InvoiceOptions {
  adjustments?: InvoiceAdjustment[];
  paymentTerms?: number; // days
}

interface InvoiceAdjustment {
  type: string;
  amount: number;
  reason: string;
}

export class InvoiceService {
  constructor(
    private pool: Pool,
    private repository: BillingRepository,
    private billableConversionService: BillableConversionService,
    private visitProvider: any // Would be injected visit service
  ) {}

  /**
   * Generate invoice for client for a given period
   */
  async generateInvoice(
    clientId: UUID,
    startDate: Date,
    endDate: Date,
    options: InvoiceOptions = {}
  ): Promise<Invoice> {
    // Get completed visits in period
    const visits = await this.visitProvider.getVisitsInPeriod(
      clientId,
      startDate,
      endDate,
      { status: 'completed' }
    );

    if (visits.length === 0) {
      throw new Error('No completed visits found for invoice period');
    }

    // Convert visits to billable line items
    const lineItems = await this.billableConversionService.convertVisitsToBillables(
      visits.map((v: Visit) => v.id)
    );

    // Calculate totals
    const subtotal = lineItems.reduce((sum, item) => sum + item.adjustedAmount, 0);

    // Apply invoice-level adjustments
    const adjustments = options.adjustments || [];
    const adjustmentTotal = adjustments.reduce((sum, adj) => sum + adj.amount, 0);

    const total = subtotal + adjustmentTotal;

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Create invoice record
      const invoice = await this.repository.createInvoice(
        {
          client_id: clientId,
          invoice_number: await this.generateInvoiceNumber(client),
          invoice_date: new Date(),
          period_start: startDate,
          period_end: endDate,
          subtotal,
          adjustment_total: adjustmentTotal,
          total,
          status: 'pending',
          due_date: this.calculateDueDate(new Date(), options.paymentTerms || 30),
        } as any,
        client
      );

      // Create line items
      for (const item of lineItems) {
        await this.repository.createInvoiceLineItem(
          {
            invoice_id: invoice.id,
            visit_id: item.visitId,
            billing_code: item.billingCode,
            modifiers: item.modifiers,
            units: item.units,
            unit_rate: item.unitRate,
            amount: item.adjustedAmount,
            description: item.description,
          } as any,
          client
        );
      }

      // Create adjustments
      for (const adjustment of adjustments) {
        await this.repository.createInvoiceAdjustment(
          {
            invoice_id: invoice.id,
            type: adjustment.type,
            amount: adjustment.amount,
            reason: adjustment.reason,
          } as any,
          client
        );
      }

      await client.query('COMMIT');
      return invoice;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Generate unique invoice number
   * Format: INV-YYYYMM-NNNN
   */
  async generateInvoiceNumber(client?: PoolClient): Promise<string> {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Get count of invoices this month
    const count = await this.repository.getInvoiceCountForMonth(yearMonth, client);
    const sequence = String(count + 1).padStart(4, '0');

    return `INV-${yearMonth}-${sequence}`;
  }

  /**
   * Calculate invoice due date
   */
  calculateDueDate(invoiceDate: Date, paymentTerms: number): Date {
    const dueDate = new Date(invoiceDate);
    dueDate.setDate(dueDate.getDate() + paymentTerms);
    return dueDate;
  }
}
