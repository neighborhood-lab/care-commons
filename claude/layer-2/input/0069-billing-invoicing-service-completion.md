# Task 0069: Billing & Invoicing Service Layer Completion

**Priority:** 🟠 HIGH
**Estimated Effort:** 2 weeks
**Vertical:** billing-invoicing
**Type:** Feature Implementation

---

## Context

The billing-invoicing vertical currently has:
- ✅ Complete database schema (20+ tables)
- ✅ TypeScript types and interfaces
- 🚧 Partial service layer implementation (estimated 60% complete)
- ❌ No UI implementation

The codebase analysis shows this vertical needs significant service layer work before UI can be built.

---

## Current State

**Schema (Complete):**
- `billing_codes` - Service and modifier codes
- `payer_contracts` - Insurance contracts
- `claim_submissions` - 837P claims
- `invoices` - Client billing
- `payments` - Payment tracking
- Rate schedules, adjustments, disputes

**Service Layer Gaps:**
1. Claim generation logic incomplete
2. EDI 837P file generation missing
3. Payment posting logic incomplete
4. Rate schedule application incomplete
5. Invoice generation incomplete
6. Adjustment handling incomplete

---

## Objectives

Complete the billing service layer to:
1. Generate accurate invoices from completed visits
2. Create EDI 837P claim files for insurance submission
3. Post payments and reconcile accounts
4. Apply rate schedules correctly
5. Handle adjustments and disputes
6. Calculate billable amounts with modifiers

---

## Technical Requirements

### 1. Visit-to-Billable Conversion Service

**File:** `verticals/billing-invoicing/src/services/billable-conversion-service.ts`

```typescript
export class BillableConversionService {
  /**
   * Convert completed visits to billable line items
   */
  async convertVisitsToBillables(
    visitIds: number[]
  ): Promise<BillableLineItem[]> {
    const billables: BillableLineItem[] = [];

    for (const visitId of visitIds) {
      const visit = await this.visitProvider.getVisit(visitId);

      if (!visit || visit.status !== 'completed') {
        continue;
      }

      // Get applicable rate schedule
      const rateSchedule = await this.getRateSchedule(
        visit.clientId,
        visit.serviceId,
        visit.scheduledStartTime
      );

      if (!rateSchedule) {
        throw new Error(`No rate schedule found for visit ${visitId}`);
      }

      // Calculate billable units (e.g., 15-minute increments)
      const units = this.calculateBillableUnits(
        visit.actualStartTime,
        visit.actualEndTime,
        rateSchedule.billing_increment
      );

      // Apply modifiers based on visit characteristics
      const modifiers = this.determineModifiers(visit);

      // Calculate base amount
      const unitRate = rateSchedule.rate_per_unit;
      const baseAmount = units * unitRate;

      // Apply modifier adjustments
      const adjustedAmount = this.applyModifierAdjustments(
        baseAmount,
        modifiers,
        rateSchedule
      );

      billables.push({
        visitId,
        clientId: visit.clientId,
        serviceId: visit.serviceId,
        billingCode: rateSchedule.billing_code,
        modifiers,
        units,
        unitRate,
        baseAmount,
        adjustedAmount,
        billingDate: new Date(),
      });
    }

    return billables;
  }

  /**
   * Calculate billable units based on actual time worked
   * Rounds to billing increment (e.g., 15 minutes)
   */
  private calculateBillableUnits(
    startTime: Date,
    endTime: Date,
    billingIncrement: number // minutes
  ): number {
    const durationMs = endTime.getTime() - startTime.getTime();
    const durationMinutes = durationMs / (1000 * 60);

    // Round to nearest billing increment
    const units = Math.round(durationMinutes / billingIncrement);

    return Math.max(1, units); // Minimum 1 unit
  }

  /**
   * Determine applicable modifiers based on visit characteristics
   * Examples: GT (telehealth), 95 (remote monitoring), GP (PCA services)
   */
  private determineModifiers(visit: Visit): string[] {
    const modifiers: string[] = [];

    // Time-based modifiers
    if (this.isWeekend(visit.scheduledStartTime)) {
      modifiers.push('U3'); // Weekend service
    }

    if (this.isAfterHours(visit.scheduledStartTime)) {
      modifiers.push('U4'); // After hours
    }

    // Service-based modifiers
    if (visit.isLiveIn) {
      modifiers.push('U7'); // Live-in care
    }

    if (visit.multipleCaregivers) {
      modifiers.push('U1'); // Multiple caregivers
    }

    return modifiers;
  }

  /**
   * Apply rate adjustments for modifiers
   */
  private applyModifierAdjustments(
    baseAmount: number,
    modifiers: string[],
    rateSchedule: RateSchedule
  ): number {
    let adjustedAmount = baseAmount;

    for (const modifier of modifiers) {
      const modifierRate = rateSchedule.modifier_rates?.[modifier];

      if (modifierRate) {
        if (modifierRate.type === 'percentage') {
          adjustedAmount *= (1 + modifierRate.value / 100);
        } else {
          adjustedAmount += modifierRate.value;
        }
      }
    }

    return adjustedAmount;
  }
}
```

---

### 2. Invoice Generation Service

**File:** `verticals/billing-invoicing/src/services/invoice-service.ts`

```typescript
export class InvoiceService {
  /**
   * Generate invoice for client for a given period
   */
  async generateInvoice(
    clientId: number,
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
      visits.map(v => v.id)
    );

    // Calculate totals
    const subtotal = lineItems.reduce((sum, item) => sum + item.adjustedAmount, 0);

    // Apply invoice-level adjustments
    const adjustments = options.adjustments || [];
    const adjustmentTotal = adjustments.reduce((sum, adj) => sum + adj.amount, 0);

    const total = subtotal + adjustmentTotal;

    // Create invoice record
    const invoice = await this.repository.createInvoice({
      client_id: clientId,
      invoice_number: await this.generateInvoiceNumber(),
      invoice_date: new Date(),
      period_start: startDate,
      period_end: endDate,
      subtotal,
      adjustment_total: adjustmentTotal,
      total,
      status: 'pending',
      due_date: this.calculateDueDate(new Date(), options.paymentTerms || 30),
    });

    // Create line items
    for (const item of lineItems) {
      await this.repository.createInvoiceLineItem({
        invoice_id: invoice.id,
        visit_id: item.visitId,
        billing_code: item.billingCode,
        modifiers: item.modifiers,
        units: item.units,
        unit_rate: item.unitRate,
        amount: item.adjustedAmount,
        description: item.description,
      });
    }

    // Create adjustments
    for (const adjustment of adjustments) {
      await this.repository.createInvoiceAdjustment({
        invoice_id: invoice.id,
        type: adjustment.type,
        amount: adjustment.amount,
        reason: adjustment.reason,
      });
    }

    return invoice;
  }

  /**
   * Generate unique invoice number
   * Format: INV-YYYYMM-NNNN
   */
  private async generateInvoiceNumber(): Promise<string> {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Get count of invoices this month
    const count = await this.repository.getInvoiceCountForMonth(yearMonth);
    const sequence = String(count + 1).padStart(4, '0');

    return `INV-${yearMonth}-${sequence}`;
  }

  /**
   * Calculate invoice due date
   */
  private calculateDueDate(invoiceDate: Date, paymentTerms: number): Date {
    const dueDate = new Date(invoiceDate);
    dueDate.setDate(dueDate.getDate() + paymentTerms);
    return dueDate;
  }
}
```

---

### 3. Claim Generation Service (EDI 837P)

**File:** `verticals/billing-invoicing/src/services/claim-service.ts`

```typescript
export class ClaimService {
  /**
   * Generate EDI 837P claim file for insurance submission
   */
  async generateClaim(
    payerId: number,
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

    for (const [clientId, items] of Object.entries(claimsByClient)) {
      const client = await this.clientProvider.getClient(Number(clientId));

      // Create claim record
      const claim = await this.repository.createClaim({
        payer_id: payerId,
        client_id: Number(clientId),
        claim_number: await this.generateClaimNumber(),
        submission_date: new Date(),
        total_billed: items.reduce((sum, item) => sum + item.adjustedAmount, 0),
        status: 'pending',
      });

      // Create claim line items
      for (const item of items) {
        await this.repository.createClaimLineItem({
          claim_id: claim.id,
          visit_id: item.visitId,
          billing_code: item.billingCode,
          modifiers: item.modifiers,
          units: item.units,
          amount: item.adjustedAmount,
          service_date: item.serviceDate,
        });
      }

      claims.push(claim);
    }

    return claims[0]; // Return first claim (may need to adjust for batch)
  }

  /**
   * Generate EDI 837P file content
   */
  async generateEDI837P(claimId: number): Promise<string> {
    const claim = await this.repository.getClaim(claimId);
    const lineItems = await this.repository.getClaimLineItems(claimId);
    const payer = await this.payerProvider.getPayer(claim.payer_id);
    const client = await this.clientProvider.getClient(claim.client_id);
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
    const date = now.toISOString().slice(0, 10).replace(/-/g, '').slice(2); // YYMMDD
    const time = now.toTimeString().slice(0, 5).replace(':', ''); // HHMM

    return `ISA*00*          *00*          *ZZ*${agency.npi.padEnd(15)}*ZZ*${payer.payer_id.padEnd(15)}*${date}*${time}*^*00501*000000001*0*P*:~`;
  }

  private buildCLM(claim: Claim, lineItems: ClaimLineItem[]): string {
    const totalBilled = lineItems.reduce((sum, item) => sum + item.amount, 0);
    const placeOfService = '12'; // Home

    return `CLM*${claim.claim_number}*${totalBilled.toFixed(2)}***${placeOfService}:B:1*Y*A*Y*Y~`;
  }

  private buildSV1(item: ClaimLineItem): string {
    const procedure = item.billing_code;
    const modifiers = item.modifiers.join(':');
    const charge = item.amount.toFixed(2);
    const units = item.units;

    return `SV1*HC:${procedure}${modifiers ? ':' + modifiers : ''}*${charge}*UN*${units}***1~`;
  }

  // ... more EDI segment builders
}
```

---

### 4. Payment Posting Service

**File:** `verticals/billing-invoicing/src/services/payment-service.ts`

```typescript
export class PaymentService {
  /**
   * Post payment to invoice
   */
  async postPayment(
    invoiceId: number,
    paymentDetails: PaymentDetails
  ): Promise<Payment> {
    const invoice = await this.repository.getInvoice(invoiceId);

    if (!invoice) {
      throw new Error(`Invoice ${invoiceId} not found`);
    }

    // Create payment record
    const payment = await this.repository.createPayment({
      invoice_id: invoiceId,
      payment_date: paymentDetails.paymentDate,
      amount: paymentDetails.amount,
      payment_method: paymentDetails.method,
      reference_number: paymentDetails.referenceNumber,
      payer_id: paymentDetails.payerId,
    });

    // Update invoice balance
    const newBalance = invoice.balance - paymentDetails.amount;
    await this.repository.updateInvoice(invoiceId, {
      balance: newBalance,
      status: newBalance <= 0 ? 'paid' : 'partial',
    });

    // If overpayment, create credit
    if (newBalance < 0) {
      await this.repository.createCredit({
        client_id: invoice.client_id,
        amount: Math.abs(newBalance),
        source: 'overpayment',
        reference_invoice_id: invoiceId,
      });
    }

    return payment;
  }

  /**
   * Post ERA (Electronic Remittance Advice) from insurance
   */
  async postERA(eraData: ERAData): Promise<void> {
    // Parse ERA (EDI 835)
    const remittances = this.parseERA835(eraData.content);

    for (const remittance of remittances) {
      const claim = await this.repository.getClaimByNumber(remittance.claimNumber);

      if (!claim) {
        console.warn(`Claim ${remittance.claimNumber} not found in ERA`);
        continue;
      }

      // Post payment
      if (remittance.paidAmount > 0) {
        await this.postPayment(claim.invoice_id, {
          amount: remittance.paidAmount,
          paymentDate: remittance.paymentDate,
          method: 'insurance',
          referenceNumber: remittance.checkNumber,
          payerId: remittance.payerId,
        });
      }

      // Handle adjustments
      for (const adjustment of remittance.adjustments) {
        await this.repository.createClaimAdjustment({
          claim_id: claim.id,
          reason_code: adjustment.reasonCode,
          amount: adjustment.amount,
          description: adjustment.description,
        });
      }

      // Update claim status
      await this.repository.updateClaim(claim.id, {
        status: this.determineClaimStatus(remittance),
        paid_amount: remittance.paidAmount,
        adjusted_amount: remittance.totalAdjustments,
      });
    }
  }
}
```

---

### 5. Rate Schedule Service

**File:** `verticals/billing-invoicing/src/services/rate-schedule-service.ts`

```typescript
export class RateScheduleService {
  /**
   * Get applicable rate schedule for a visit
   */
  async getRateSchedule(
    clientId: number,
    serviceId: number,
    visitDate: Date
  ): Promise<RateSchedule | null> {
    const client = await this.clientProvider.getClient(clientId);

    // Priority order:
    // 1. Client-specific rate (private pay)
    // 2. Payer contract rate (insurance)
    // 3. Default agency rate

    // Check for client-specific rate
    let rateSchedule = await this.repository.getClientRate(
      clientId,
      serviceId,
      visitDate
    );

    if (rateSchedule) {
      return rateSchedule;
    }

    // Check for payer contract rate
    if (client.primary_payer_id) {
      rateSchedule = await this.repository.getPayerContractRate(
        client.primary_payer_id,
        serviceId,
        visitDate
      );

      if (rateSchedule) {
        return rateSchedule;
      }
    }

    // Fall back to default agency rate
    rateSchedule = await this.repository.getDefaultRate(serviceId, visitDate);

    return rateSchedule;
  }

  /**
   * Create rate schedule
   */
  async createRateSchedule(data: RateScheduleData): Promise<RateSchedule> {
    // Validate no overlapping schedules
    const overlapping = await this.repository.findOverlappingSchedules(
      data.serviceId,
      data.effectiveDate,
      data.expirationDate,
      data.clientId || data.payerId
    );

    if (overlapping.length > 0) {
      throw new Error('Overlapping rate schedule exists for this period');
    }

    return this.repository.createRateSchedule(data);
  }
}
```

---

## Repository Methods

Add missing repository methods in `verticals/billing-invoicing/src/repository/billing-repository.ts`:

```typescript
export interface IBillingRepository {
  // Invoice methods
  createInvoice(data: CreateInvoiceData): Promise<Invoice>;
  getInvoice(id: number): Promise<Invoice | null>;
  updateInvoice(id: number, updates: Partial<Invoice>): Promise<void>;
  getInvoiceCountForMonth(yearMonth: string): Promise<number>;

  // Line item methods
  createInvoiceLineItem(data: CreateLineItemData): Promise<InvoiceLineItem>;
  getInvoiceLineItems(invoiceId: number): Promise<InvoiceLineItem[]>;

  // Payment methods
  createPayment(data: CreatePaymentData): Promise<Payment>;
  getPaymentsForInvoice(invoiceId: number): Promise<Payment[]>;

  // Claim methods
  createClaim(data: CreateClaimData): Promise<Claim>;
  getClaim(id: number): Promise<Claim | null>;
  getClaimByNumber(claimNumber: string): Promise<Claim | null>;
  updateClaim(id: number, updates: Partial<Claim>): Promise<void>;

  // Rate schedule methods
  getClientRate(clientId: number, serviceId: number, date: Date): Promise<RateSchedule | null>;
  getPayerContractRate(payerId: number, serviceId: number, date: Date): Promise<RateSchedule | null>;
  getDefaultRate(serviceId: number, date: Date): Promise<RateSchedule | null>;
  createRateSchedule(data: RateScheduleData): Promise<RateSchedule>;
}
```

---

## Testing Requirements

### Unit Tests

```typescript
describe('BillableConversionService', () => {
  it('should calculate units correctly for 1.5 hour visit', () => {
    // 1.5 hours = 90 minutes = 6 units of 15 minutes
    const units = service.calculateBillableUnits(
      new Date('2025-01-01T09:00:00'),
      new Date('2025-01-01T10:30:00'),
      15
    );
    expect(units).toBe(6);
  });

  it('should apply weekend modifier', () => {
    // Saturday visit should get U3 modifier
    const modifiers = service.determineModifiers({
      scheduledStartTime: new Date('2025-01-04T09:00:00'), // Saturday
    });
    expect(modifiers).toContain('U3');
  });
});

describe('InvoiceService', () => {
  it('should generate invoice with correct totals', async () => {
    const invoice = await service.generateInvoice(
      clientId,
      new Date('2025-01-01'),
      new Date('2025-01-31')
    );

    expect(invoice.total).toBeGreaterThan(0);
    expect(invoice.total).toBe(invoice.subtotal + invoice.adjustment_total);
  });
});

describe('ClaimService', () => {
  it('should generate valid EDI 837P', async () => {
    const edi = await service.generateEDI837P(claimId);

    expect(edi).toContain('ISA*');
    expect(edi).toContain('ST*837*');
    expect(edi).toContain('CLM*');
    expect(edi).toContain('SE*');
  });
});
```

---

## Success Criteria

- [ ] Visit-to-billable conversion working
- [ ] Invoice generation working with line items
- [ ] EDI 837P claim files generated correctly
- [ ] Payment posting updates invoice balances
- [ ] ERA processing handles insurance payments
- [ ] Rate schedules applied correctly
- [ ] Modifiers calculated automatically
- [ ] All unit tests passing
- [ ] Integration tests passing
- [ ] Ready for UI implementation

---

## Related Tasks

- Task 0070: Shift Matching UI (similar service layer completion pattern)
- Future: Billing UI implementation task
