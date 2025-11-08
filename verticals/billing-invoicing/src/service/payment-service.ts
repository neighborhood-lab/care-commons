/**
 * Payment Service
 *
 * Handles payment posting to invoices
 * Processes Electronic Remittance Advice (ERA) from insurance
 */

import { Pool, PoolClient } from 'pg';
import { UUID } from '@care-commons/core';
import { BillingRepository } from '../repository/billing-repository';
import { Payment, Invoice, Claim } from '../types/billing';

interface PaymentDetails {
  paymentDate: Date;
  amount: number;
  method: string;
  referenceNumber?: string;
  payerId: UUID;
}

interface ERAData {
  content: string;
  receivedDate: Date;
}

interface ERARemittance {
  claimNumber: string;
  paidAmount: number;
  paymentDate: Date;
  checkNumber: string;
  payerId: UUID;
  totalAdjustments: number;
  adjustments: Array<{
    reasonCode: string;
    amount: number;
    description: string;
  }>;
}

export class PaymentService {
  constructor(
    private pool: Pool,
    private repository: BillingRepository
  ) {}

  /**
   * Post payment to invoice
   */
  async postPayment(
    invoiceId: UUID,
    paymentDetails: PaymentDetails
  ): Promise<Payment> {
    const invoice = await this.repository.getInvoice(invoiceId);

    if (!invoice) {
      throw new Error(`Invoice ${invoiceId} not found`);
    }

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Create payment record
      const payment = await this.repository.createPayment(
        {
          invoice_id: invoiceId,
          payment_date: paymentDetails.paymentDate,
          amount: paymentDetails.amount,
          payment_method: paymentDetails.method,
          reference_number: paymentDetails.referenceNumber,
          payer_id: paymentDetails.payerId,
        } as any,
        client
      );

      // Update invoice balance
      const newBalance = invoice.balanceDue - paymentDetails.amount;
      await this.repository.updateInvoice(
        invoiceId,
        {
          balance: newBalance,
          status: newBalance <= 0 ? 'paid' : 'partial',
        } as any,
        client
      );

      // If overpayment, create credit
      if (newBalance < 0) {
        await this.repository.createCredit(
          {
            client_id: invoice.clientId,
            amount: Math.abs(newBalance),
            source: 'overpayment',
            reference_invoice_id: invoiceId,
          } as any,
          client
        );
      }

      await client.query('COMMIT');
      return payment;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Post ERA (Electronic Remittance Advice) from insurance
   */
  async postERA(eraData: ERAData): Promise<void> {
    // Parse ERA (EDI 835)
    const remittances = this.parseERA835(eraData.content);

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      for (const remittance of remittances) {
        const claim = await this.repository.getClaimByNumber(remittance.claimNumber);

        if (!claim) {
          console.warn(`Claim ${remittance.claimNumber} not found in ERA`);
          continue;
        }

        // Post payment
        if (remittance.paidAmount > 0 && claim.invoiceId) {
          await this.postPayment(claim.invoiceId, {
            amount: remittance.paidAmount,
            paymentDate: remittance.paymentDate,
            method: 'insurance',
            referenceNumber: remittance.checkNumber,
            payerId: remittance.payerId,
          });
        }

        // Handle adjustments
        for (const adjustment of remittance.adjustments) {
          await this.repository.createClaimAdjustment(
            {
              claim_id: claim.id,
              reason_code: adjustment.reasonCode,
              amount: adjustment.amount,
              description: adjustment.description,
            } as any,
            client
          );
        }

        // Update claim status
        await this.repository.updateClaim(
          claim.id,
          {
            status: this.determineClaimStatus(remittance),
            paid_amount: remittance.paidAmount,
            adjusted_amount: remittance.totalAdjustments,
          } as any,
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
   * Parse EDI 835 (ERA) file content
   */
  private parseERA835(content: string): ERARemittance[] {
    const remittances: ERARemittance[] = [];
    const segments = content.split('~').map(s => s.trim());

    let currentRemittance: Partial<ERARemittance> | null = null;
    let payerId: UUID | null = null;
    let paymentDate: Date | null = null;
    let checkNumber: string | null = null;

    for (const segment of segments) {
      const elements = segment.split('*');
      const segmentId = elements[0];

      switch (segmentId) {
        case 'N1':
          // Payer identification
          if (elements[1] === 'PR') {
            // Payer ID would be in subsequent NM1 or REF segment
            // This is simplified
          }
          break;

        case 'TRN':
          // Trace number (check/EFT number)
          if (elements[1] === '1') {
            checkNumber = elements[2];
          }
          break;

        case 'DTM':
          // Date - payment date
          if (elements[1] === '405') {
            paymentDate = this.parseEDIDate(elements[2]);
          }
          break;

        case 'CLP':
          // Claim Payment Information
          if (currentRemittance) {
            remittances.push(currentRemittance as ERARemittance);
          }

          currentRemittance = {
            claimNumber: elements[1],
            paidAmount: parseFloat(elements[4] || '0'),
            paymentDate: paymentDate || new Date(),
            checkNumber: checkNumber || 'UNKNOWN',
            payerId: payerId || ('UNKNOWN' as any),
            totalAdjustments: 0,
            adjustments: [],
          };
          break;

        case 'CAS':
          // Claim Adjustment
          if (currentRemittance) {
            const adjustmentGroup = elements[1]; // CO, PR, OA, PI
            const reasonCode = elements[2];
            const amount = parseFloat(elements[3] || '0');

            currentRemittance.adjustments = currentRemittance.adjustments || [];
            currentRemittance.adjustments.push({
              reasonCode: `${adjustmentGroup}-${reasonCode}`,
              amount,
              description: this.getAdjustmentDescription(adjustmentGroup, reasonCode),
            });

            currentRemittance.totalAdjustments =
              (currentRemittance.totalAdjustments || 0) + amount;
          }
          break;
      }
    }

    // Add last remittance
    if (currentRemittance) {
      remittances.push(currentRemittance as ERARemittance);
    }

    return remittances;
  }

  /**
   * Parse EDI date format (CCYYMMDD)
   */
  private parseEDIDate(dateStr: string): Date {
    const year = parseInt(dateStr.substring(0, 4));
    const month = parseInt(dateStr.substring(4, 6)) - 1;
    const day = parseInt(dateStr.substring(6, 8));
    return new Date(year, month, day);
  }

  /**
   * Get human-readable adjustment description
   */
  private getAdjustmentDescription(group: string, code: string): string {
    const descriptions: Record<string, string> = {
      'CO-45': 'Charge exceeds fee schedule',
      'CO-42': 'Charges exceed contracted rate',
      'PR-1': 'Deductible amount',
      'PR-2': 'Coinsurance amount',
      'PR-3': 'Co-payment amount',
      'OA-23': 'Payment adjusted due to impact of prior payer adjudication',
    };

    return descriptions[`${group}-${code}`] || `Adjustment ${group}-${code}`;
  }

  /**
   * Determine claim status from ERA remittance
   */
  private determineClaimStatus(remittance: ERARemittance): string {
    if (remittance.paidAmount === 0 && remittance.totalAdjustments > 0) {
      return 'DENIED';
    } else if (remittance.paidAmount > 0) {
      return 'APPROVED';
    } else {
      return 'PROCESSING';
    }
  }
}
