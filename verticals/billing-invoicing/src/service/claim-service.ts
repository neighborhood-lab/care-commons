/**
 * Claim Service
 *
 * Generates insurance claims and EDI 837P files
 * Handles claim submissions and status tracking
 */

import { Pool, PoolClient } from 'pg';
import { UUID } from '@care-commons/core';
import { BillingRepository } from '../repository/billing-repository';
import { Claim, ClaimLineItem } from '../types/billing';
import { BillableConversionService } from './billable-conversion-service';

interface Agency {
  id: UUID;
  name: string;
  npi: string;
  taxId: string;
  address: {
    line1: string;
    city: string;
    state: string;
    postalCode: string;
  };
}

interface Payer {
  id: UUID;
  payerName: string;
  payer_id: string;
  nationalPayerId?: string;
}

interface Client {
  id: UUID;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  memberId?: string;
  address: {
    line1: string;
    city: string;
    state: string;
    postalCode: string;
  };
}

export class ClaimService {
  constructor(
    private pool: Pool,
    private repository: BillingRepository,
    private billableConversionService: BillableConversionService,
    private payerProvider: any,
    private clientProvider: any,
    private agencyProvider: any
  ) {}

  /**
   * Generate EDI 837P claim file for insurance submission
   */
  async generateClaim(
    payerId: UUID,
    visitIds: number[]
  ): Promise<Claim> {
    // Get payer details
    const payer = await this.payerProvider.getPayer(payerId);
    if (!payer) {
      throw new Error(`Payer ${payerId} not found`);
    }

    // Convert visits to billable line items
    const lineItems = await this.billableConversionService.convertVisitsToBillables(
      visitIds
    );

    // Group by client (each client gets a claim)
    const claimsByClient = this.groupByClient(lineItems);

    const claims: Claim[] = [];

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      for (const [clientId, items] of Object.entries(claimsByClient)) {
        const clientData = await this.clientProvider.getClient(clientId);

        // Create claim record
        const claim = await this.repository.createClaim(
          {
            payer_id: payerId,
            client_id: clientId,
            claim_number: await this.generateClaimNumber(client),
            submission_date: new Date(),
            total_billed: items.reduce((sum, item) => sum + item.adjustedAmount, 0),
            status: 'pending',
          } as any,
          client
        );

        // Create claim line items
        for (const item of items) {
          await this.repository.createClaimLineItem(
            {
              claim_id: claim.id,
              visit_id: item.visitId,
              billing_code: item.billingCode,
              modifiers: item.modifiers,
              units: item.units,
              amount: item.adjustedAmount,
              service_date: item.serviceDate,
            } as any,
            client
          );
        }

        claims.push(claim);
      }

      await client.query('COMMIT');
      return claims[0]; // Return first claim (may need to adjust for batch)
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Generate EDI 837P file content
   */
  async generateEDI837P(claimId: UUID): Promise<string> {
    const claim = await this.repository.getClaim(claimId);
    if (!claim) {
      throw new Error(`Claim ${claimId} not found`);
    }

    const lineItems = await this.repository.getClaimLineItems(claimId);
    const payer = await this.payerProvider.getPayer(claim.payerId);
    const client = await this.clientProvider.getClient(claim.clientId);
    const agency = await this.agencyProvider.getAgency();

    // Build EDI 837P segments
    const segments: string[] = [];

    // ISA - Interchange Control Header
    segments.push(this.buildISA(agency, payer));

    // GS - Functional Group Header
    segments.push(this.buildGS(agency, payer));

    // ST - Transaction Set Header (837P)
    segments.push('ST*837*0001*005010X222A1~');

    // BHT - Beginning of Hierarchical Transaction
    segments.push(this.buildBHT(claim));

    // NM1 - Submitter Name
    segments.push(this.buildNM1Submitter(agency));

    // NM1 - Receiver Name
    segments.push(this.buildNM1Receiver(payer));

    // HL - Billing Provider Hierarchical Level
    segments.push('HL*1**20*1~');
    segments.push(this.buildNM1BillingProvider(agency));

    // HL - Subscriber Hierarchical Level
    segments.push('HL*2*1*22*0~');
    segments.push(this.buildSBR(client)); // Subscriber Information
    segments.push(this.buildNM1Subscriber(client));

    // CLM - Claim Information
    segments.push(this.buildCLM(claim, lineItems));

    // Service Line Loop
    for (let i = 0; i < lineItems.length; i++) {
      const item = lineItems[i];
      segments.push(this.buildLX(i + 1)); // Service Line Number
      segments.push(this.buildSV1(item)); // Professional Service
      segments.push(this.buildDTP(item)); // Service Date
    }

    // SE - Transaction Set Trailer
    segments.push(`SE*${segments.length + 1}*0001~`);

    // GE - Functional Group Trailer
    segments.push('GE*1*1~');

    // IEA - Interchange Control Trailer
    segments.push('IEA*1*000000001~');

    return segments.join('\n');
  }

  // Helper methods for building EDI segments
  private buildISA(agency: Agency, payer: Payer): string {
    const now = new Date();
    const date = now.toISOString().slice(2, 10).replace(/-/g, ''); // YYMMDD
    const time = now.toTimeString().slice(0, 5).replace(':', ''); // HHMM

    return `ISA*00*          *00*          *ZZ*${agency.npi.padEnd(15)}*ZZ*${payer.payer_id.padEnd(15)}*${date}*${time}*^*00501*000000001*0*P*:~`;
  }

  private buildGS(agency: Agency, payer: Payer): string {
    const now = new Date();
    const date = now.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
    const time = now.toTimeString().slice(0, 5).replace(':', ''); // HHMM

    return `GS*HC*${agency.npi}*${payer.payer_id}*${date}*${time}*1*X*005010X222A1~`;
  }

  private buildBHT(claim: Claim): string {
    const claimDate = claim.submittedDate.toISOString().slice(0, 10).replace(/-/g, '');
    const claimTime = claim.submittedDate.toTimeString().slice(0, 5).replace(':', '');

    return `BHT*0019*00*${claim.claimNumber}*${claimDate}*${claimTime}*CH~`;
  }

  private buildNM1Submitter(agency: Agency): string {
    return `NM1*41*2*${agency.name}*****46*${agency.npi}~`;
  }

  private buildNM1Receiver(payer: Payer): string {
    return `NM1*40*2*${payer.payerName}*****46*${payer.nationalPayerId || payer.payer_id}~`;
  }

  private buildNM1BillingProvider(agency: Agency): string {
    return `NM1*85*2*${agency.name}*****XX*${agency.npi}~\nN3*${agency.address.line1}~\nN4*${agency.address.city}*${agency.address.state}*${agency.address.postalCode}~`;
  }

  private buildSBR(client: Client): string {
    return `SBR*P*18*******CI~`;
  }

  private buildNM1Subscriber(client: Client): string {
    const memberId = client.memberId || 'UNKNOWN';
    return `NM1*IL*1*${client.lastName}*${client.firstName}****MI*${memberId}~\nN3*${client.address.line1}~\nN4*${client.address.city}*${client.address.state}*${client.address.postalCode}~\nDMG*D8*${this.formatDate(client.dateOfBirth)}~`;
  }

  private buildCLM(claim: Claim, lineItems: ClaimLineItem[]): string {
    const totalBilled = lineItems.reduce((sum, item) => sum + item.chargeAmount, 0);
    const placeOfService = '12'; // Home

    return `CLM*${claim.claimNumber}*${totalBilled.toFixed(2)}***${placeOfService}:B:1*Y*A*Y*Y~`;
  }

  private buildLX(lineNumber: number): string {
    return `LX*${lineNumber}~`;
  }

  private buildSV1(item: ClaimLineItem): string {
    const procedure = item.serviceCode;
    const modifiers = item.modifiers && item.modifiers.length > 0
      ? ':' + item.modifiers.map(m => m.code).join(':')
      : '';
    const charge = item.chargeAmount.toFixed(2);
    const units = item.units;

    return `SV1*HC:${procedure}${modifiers}*${charge}*UN*${units}***1~`;
  }

  private buildDTP(item: ClaimLineItem): string {
    const serviceDate = this.formatDate(item.serviceDate);
    return `DTP*472*D8*${serviceDate}~`;
  }

  /**
   * Generate unique claim number
   */
  private async generateClaimNumber(client?: PoolClient): Promise<string> {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Get count of claims this month
    const count = await this.repository.getClaimCountForMonth(yearMonth, client);
    const sequence = String(count + 1).padStart(5, '0');

    return `CLM${yearMonth}${sequence}`;
  }

  /**
   * Group billable items by client
   */
  private groupByClient(lineItems: any[]): Record<string, any[]> {
    return lineItems.reduce((acc, item) => {
      const clientId = item.clientId.toString();
      if (!acc[clientId]) {
        acc[clientId] = [];
      }
      acc[clientId].push(item);
      return acc;
    }, {} as Record<string, any[]>);
  }

  /**
   * Format date for EDI (YYYYMMDD or CCYYMMDD)
   */
  private formatDate(date: Date): string {
    return date.toISOString().slice(0, 10).replace(/-/g, '');
  }
}
