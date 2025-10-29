/**
 * Billing repository layer
 * 
 * Database access for billing entities
 */

import { Pool, PoolClient } from 'pg';
import { v4 as uuid } from 'uuid';
import { UUID } from '@care-commons/core';
import {
  BillableItem,
  Invoice,
  Payment,
  Payer,
  RateSchedule,
  ServiceAuthorization,
  BillableItemSearchFilters,
  InvoiceSearchFilters,
  PaymentSearchFilters,
} from '../types/billing';

export class BillingRepository {
  constructor(private pool: Pool) {}

  /**
   * PAYER OPERATIONS
   */

  async createPayer(
    payer: Omit<Payer, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'deletedAt' | 'deletedBy'>,
    client?: PoolClient
  ): Promise<Payer> {
    const db = client || this.pool;
    const id = uuid();
    const now = new Date();

    const result = await db.query(
      `
      INSERT INTO payers (
        id, organization_id, payer_name, payer_type, payer_code,
        national_payer_id, medicaid_provider_id, medicare_provider_id, tax_id,
        address, phone, fax, email, website,
        billing_address, billing_email, billing_portal_url,
        submission_methods, edi_payer_id, clearinghouse_id,
        payment_terms_days, requires_pre_authorization, requires_referral,
        claim_filing_limit, default_rate_schedule_id, status,
        average_payment_days, denial_rate, notes, contacts,
        created_at, created_by, updated_at, updated_by, version
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
        $31, $32, $33, $34, $35
      )
      RETURNING *
      `,
      [
        id,
        payer.organizationId,
        payer.payerName,
        payer.payerType,
        payer.payerCode || null,
        payer.nationalPayerId || null,
        payer.medicaidProviderId || null,
        payer.medicareProviderId || null,
        payer.taxId || null,
        payer.address ? JSON.stringify(payer.address) : null,
        payer.phone || null,
        payer.fax || null,
        payer.email || null,
        payer.website || null,
        payer.billingAddress ? JSON.stringify(payer.billingAddress) : null,
        payer.billingEmail || null,
        payer.billingPortalUrl || null,
        payer.submissionMethod ? JSON.stringify(payer.submissionMethod) : null,
        payer.ediPayerId || null,
        payer.clearinghouseId || null,
        payer.paymentTermsDays,
        payer.requiresPreAuthorization,
        payer.requiresReferral,
        payer.claimFilingLimit || null,
        payer.defaultRateScheduleId || null,
        payer.status,
        payer.averagePaymentDays || null,
        payer.denialRate || null,
        payer.notes || null,
        payer.contacts ? JSON.stringify(payer.contacts) : null,
        now,
        payer.createdBy,
        now,
        payer.updatedBy,
        1,
      ]
    );

    return this.mapPayer(result.rows[0]);
  }

  async findPayerById(id: UUID): Promise<Payer | null> {
    const result = await this.pool.query(
      'SELECT * FROM payers WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );
    return result.rows[0] ? this.mapPayer(result.rows[0]) : null;
  }

  async findPayersByOrganization(organizationId: UUID): Promise<Payer[]> {
    const result = await this.pool.query(
      `SELECT * FROM payers 
       WHERE organization_id = $1 AND deleted_at IS NULL
       ORDER BY payer_name ASC`,
      [organizationId]
    );
    return result.rows.map(this.mapPayer);
  }

  /**
   * RATE SCHEDULE OPERATIONS
   */

  async createRateSchedule(
    schedule: Omit<RateSchedule, 'id' | 'createdAt' | 'updatedAt' | 'version'>,
    client?: PoolClient
  ): Promise<RateSchedule> {
    const db = client || this.pool;
    const id = uuid();
    const now = new Date();

    const result = await db.query(
      `
      INSERT INTO rate_schedules (
        id, organization_id, branch_id, name, description, schedule_type,
        payer_id, payer_type, payer_name,
        effective_from, effective_to, rates, status,
        approved_by, approved_at, notes,
        created_at, created_by, updated_at, updated_by, version
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
      )
      RETURNING *
      `,
      [
        id,
        schedule.organizationId,
        schedule.branchId || null,
        schedule.name,
        schedule.description || null,
        schedule.scheduleType,
        schedule.payerId || null,
        schedule.payerType || null,
        schedule.payerName || null,
        schedule.effectiveFrom,
        schedule.effectiveTo || null,
        JSON.stringify(schedule.rates),
        schedule.status,
        schedule.approvedBy || null,
        schedule.approvedAt || null,
        schedule.notes || null,
        now,
        schedule.createdBy,
        now,
        schedule.updatedBy,
        1,
      ]
    );

    return this.mapRateSchedule(result.rows[0]);
  }

  async findActiveRateSchedule(
    organizationId: UUID,
    payerId?: UUID,
    date: Date = new Date()
  ): Promise<RateSchedule | null> {
    const query = payerId
      ? `SELECT * FROM rate_schedules 
         WHERE organization_id = $1 
         AND (payer_id = $2 OR payer_id IS NULL)
         AND status = 'ACTIVE'
         AND effective_from <= $3
         AND (effective_to IS NULL OR effective_to >= $3)
         ORDER BY payer_id DESC NULLS LAST
         LIMIT 1`
      : `SELECT * FROM rate_schedules 
         WHERE organization_id = $1
         AND status = 'ACTIVE'
         AND effective_from <= $2
         AND (effective_to IS NULL OR effective_to >= $2)
         AND payer_id IS NULL
         ORDER BY effective_from DESC
         LIMIT 1`;

    const params = payerId ? [organizationId, payerId, date] : [organizationId, date];
    const result = await this.pool.query(query, params);

    return result.rows[0] ? this.mapRateSchedule(result.rows[0]) : null;
  }

  /**
   * AUTHORIZATION OPERATIONS
   */

  async createAuthorization(
    auth: Omit<
      ServiceAuthorization,
      'id' | 'createdAt' | 'updatedAt' | 'version' | 'deletedAt' | 'deletedBy'
    >,
    client?: PoolClient
  ): Promise<ServiceAuthorization> {
    const db = client || this.pool;
    const id = uuid();
    const now = new Date();

    const result = await db.query(
      `
      INSERT INTO service_authorizations (
        id, organization_id, branch_id, client_id,
        authorization_number, authorization_type,
        payer_id, payer_type, payer_name,
        service_type_id, service_type_code, service_type_name,
        authorized_units, unit_type, unit_rate, authorized_amount,
        effective_from, effective_to,
        used_units, remaining_units, billed_units,
        requires_referral, referral_number, allowed_providers, location_restrictions,
        status, status_history,
        reviewed_by, reviewed_at, review_notes,
        low_units_threshold, expiration_warning_days,
        document_ids, notes, internal_notes,
        created_at, created_by, updated_at, updated_by, version
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
        $31, $32, $33, $34, $35, $36, $37, $38, $39
      )
      RETURNING *
      `,
      [
        id,
        auth.organizationId,
        auth.branchId,
        auth.clientId,
        auth.authorizationNumber,
        auth.authorizationType,
        auth.payerId,
        auth.payerType,
        auth.payerName,
        auth.serviceTypeId,
        auth.serviceTypeCode,
        auth.serviceTypeName,
        auth.authorizedUnits,
        auth.unitType,
        auth.unitRate || null,
        auth.authorizedAmount || null,
        auth.effectiveFrom,
        auth.effectiveTo,
        auth.usedUnits || 0,
        auth.remainingUnits || auth.authorizedUnits,
        auth.billedUnits || 0,
        auth.requiresReferral,
        auth.referralNumber || null,
        auth.allowedProviders ? JSON.stringify(auth.allowedProviders) : null,
        auth.locationRestrictions || null,
        auth.status,
        JSON.stringify(auth.statusHistory || []),
        auth.reviewedBy || null,
        auth.reviewedAt || null,
        auth.reviewNotes || null,
        auth.lowUnitsThreshold || null,
        auth.expirationWarningDays || null,
        auth.documentIds ? JSON.stringify(auth.documentIds) : null,
        auth.notes || null,
        auth.internalNotes || null,
        now,
        auth.createdBy,
        now,
        auth.updatedBy,
        1,
      ]
    );

    return this.mapAuthorization(result.rows[0]);
  }

  async findAuthorizationByNumber(
    authNumber: string
  ): Promise<ServiceAuthorization | null> {
    const result = await this.pool.query(
      'SELECT * FROM service_authorizations WHERE authorization_number = $1 AND deleted_at IS NULL',
      [authNumber]
    );
    return result.rows[0] ? this.mapAuthorization(result.rows[0]) : null;
  }

  async findActiveAuthorizationsForClient(
    clientId: UUID,
    serviceTypeId?: UUID
  ): Promise<ServiceAuthorization[]> {
    const query = serviceTypeId
      ? `SELECT * FROM service_authorizations 
         WHERE client_id = $1 AND service_type_id = $2
         AND status = 'ACTIVE' AND deleted_at IS NULL
         AND effective_from <= CURRENT_DATE
         AND effective_to >= CURRENT_DATE
         ORDER BY effective_from DESC`
      : `SELECT * FROM service_authorizations 
         WHERE client_id = $1
         AND status = 'ACTIVE' AND deleted_at IS NULL
         AND effective_from <= CURRENT_DATE
         AND effective_to >= CURRENT_DATE
         ORDER BY effective_from DESC`;

    const params = serviceTypeId ? [clientId, serviceTypeId] : [clientId];
    const result = await this.pool.query(query, params);
    return result.rows.map(this.mapAuthorization);
  }

  async updateAuthorizationUnits(
    authId: UUID,
    unitsUsed: number,
    unitsBilled: number,
    userId: UUID,
    client?: PoolClient
  ): Promise<void> {
    const db = client || this.pool;

    await db.query(
      `
      UPDATE service_authorizations
      SET 
        used_units = used_units + $2,
        billed_units = billed_units + $3,
        remaining_units = authorized_units - (used_units + $2),
        updated_by = $4,
        updated_at = NOW(),
        version = version + 1
      WHERE id = $1
      `,
      [authId, unitsUsed, unitsBilled, userId]
    );
  }

  /**
   * BILLABLE ITEM OPERATIONS
   */

  async createBillableItem(
    item: Omit<
      BillableItem,
      'id' | 'createdAt' | 'updatedAt' | 'version' | 'deletedAt' | 'deletedBy'
    >,
    client?: PoolClient
  ): Promise<BillableItem> {
    const db = client || this.pool;
    const id = uuid();
    const now = new Date();

    const result = await db.query(
      `
      INSERT INTO billable_items (
        id, organization_id, branch_id, client_id,
        visit_id, evv_record_id, service_type_id, service_type_code, service_type_name,
        service_date, start_time, end_time, duration_minutes,
        caregiver_id, caregiver_name, provider_npi,
        rate_schedule_id, unit_type, units, unit_rate, subtotal,
        modifiers, adjustments, final_amount,
        authorization_id, authorization_number, is_authorized, authorization_remaining_units,
        payer_id, payer_type, payer_name,
        status, status_history,
        invoice_id, invoice_date, claim_id, claim_submitted_date,
        is_hold, hold_reason, requires_review, review_reason,
        is_denied, denial_reason, denial_code, denial_date, is_appealable,
        is_paid, paid_amount, paid_date, payment_id,
        notes, tags,
        created_at, created_by, updated_at, updated_by, version
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
        $31, $32, $33, $34, $35, $36, $37, $38, $39, $40,
        $41, $42, $43, $44, $45, $46, $47, $48, $49, $50,
        $51, $52, $53, $54, $55, $56
      )
      RETURNING *
      `,
      [
        id,
        item.organizationId,
        item.branchId,
        item.clientId,
        item.visitId || null,
        item.evvRecordId || null,
        item.serviceTypeId,
        item.serviceTypeCode,
        item.serviceTypeName,
        item.serviceDate,
        item.startTime || null,
        item.endTime || null,
        item.durationMinutes,
        item.caregiverId || null,
        item.caregiverName || null,
        item.providerNPI || null,
        item.rateScheduleId || null,
        item.unitType,
        item.units,
        item.unitRate,
        item.subtotal,
        item.modifiers ? JSON.stringify(item.modifiers) : null,
        item.adjustments ? JSON.stringify(item.adjustments) : null,
        item.finalAmount,
        item.authorizationId || null,
        item.authorizationNumber || null,
        item.isAuthorized,
        item.authorizationRemainingUnits || null,
        item.payerId,
        item.payerType,
        item.payerName,
        item.status,
        JSON.stringify(item.statusHistory || []),
        item.invoiceId || null,
        item.invoiceDate || null,
        item.claimId || null,
        item.claimSubmittedDate || null,
        item.isHold,
        item.holdReason || null,
        item.requiresReview,
        item.reviewReason || null,
        item.isDenied,
        item.denialReason || null,
        item.denialCode || null,
        item.denialDate || null,
        item.isAppealable,
        item.isPaid,
        item.paidAmount || null,
        item.paidDate || null,
        item.paymentId || null,
        item.notes || null,
        item.tags ? JSON.stringify(item.tags) : null,
        now,
        item.createdBy,
        now,
        item.updatedBy,
        1,
      ]
    );

    return this.mapBillableItem(result.rows[0]);
  }

  async searchBillableItems(
    filters: BillableItemSearchFilters
  ): Promise<BillableItem[]> {
    const conditions: string[] = ['deleted_at IS NULL'];
    const params: any[] = [];
    let paramCount = 1;

    if (filters.organizationId) {
      conditions.push(`organization_id = $${paramCount++}`);
      params.push(filters.organizationId);
    }

    if (filters.branchIds && filters.branchIds.length > 0) {
      conditions.push(`branch_id = ANY($${paramCount++})`);
      params.push(filters.branchIds);
    }

    if (filters.clientIds && filters.clientIds.length > 0) {
      conditions.push(`client_id = ANY($${paramCount++})`);
      params.push(filters.clientIds);
    }

    if (filters.payerId) {
      conditions.push(`payer_id = $${paramCount++}`);
      params.push(filters.payerId);
    }

    if (filters.status && filters.status.length > 0) {
      conditions.push(`status = ANY($${paramCount++})`);
      params.push(filters.status);
    }

    if (filters.startDate) {
      conditions.push(`service_date >= $${paramCount++}`);
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      conditions.push(`service_date <= $${paramCount++}`);
      params.push(filters.endDate);
    }

    if (filters.isHold !== undefined) {
      conditions.push(`is_hold = $${paramCount++}`);
      params.push(filters.isHold);
    }

    if (filters.requiresReview !== undefined) {
      conditions.push(`requires_review = $${paramCount++}`);
      params.push(filters.requiresReview);
    }

    if (filters.isPaid !== undefined) {
      conditions.push(`is_paid = $${paramCount++}`);
      params.push(filters.isPaid);
    }

    const query = `
      SELECT * FROM billable_items
      WHERE ${conditions.join(' AND ')}
      ORDER BY service_date DESC, created_at DESC
      LIMIT 1000
    `;

    const result = await this.pool.query(query, params);
    return result.rows.map(this.mapBillableItem);
  }

  async updateBillableItemStatus(
    id: UUID,
    status: string,
    statusChange: any,
    userId: UUID,
    client?: PoolClient
  ): Promise<void> {
    const db = client || this.pool;

    await db.query(
      `
      UPDATE billable_items
      SET 
        status = $2,
        status_history = status_history || $3::jsonb,
        updated_by = $4,
        updated_at = NOW(),
        version = version + 1
      WHERE id = $1
      `,
      [id, status, JSON.stringify([statusChange]), userId]
    );
  }

  /**
   * INVOICE OPERATIONS
   */

  async createInvoice(
    invoice: Omit<
      Invoice,
      'id' | 'createdAt' | 'updatedAt' | 'version' | 'deletedAt' | 'deletedBy'
    >,
    client?: PoolClient
  ): Promise<Invoice> {
    const db = client || this.pool;
    const id = uuid();
    const now = new Date();

    const result = await db.query(
      `
      INSERT INTO invoices (
        id, organization_id, branch_id,
        invoice_number, invoice_type,
        payer_id, payer_type, payer_name, payer_address,
        client_id, client_name,
        period_start, period_end, invoice_date, due_date,
        billable_item_ids, line_items,
        subtotal, tax_amount, tax_rate, discount_amount, adjustment_amount,
        total_amount, paid_amount, balance_due,
        status, status_history,
        submitted_date, submitted_by, submission_method, submission_confirmation,
        payment_terms, late_fee_rate, payments,
        pdf_url, document_ids,
        claim_ids, claim_status,
        notes, internal_notes, tags,
        created_at, created_by, updated_at, updated_by, version
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
        $31, $32, $33, $34, $35, $36, $37, $38, $39, $40,
        $41, $42, $43, $44, $45, $46
      )
      RETURNING *
      `,
      [
        id,
        invoice.organizationId,
        invoice.branchId,
        invoice.invoiceNumber,
        invoice.invoiceType,
        invoice.payerId,
        invoice.payerType,
        invoice.payerName,
        invoice.payerAddress ? JSON.stringify(invoice.payerAddress) : null,
        invoice.clientId || null,
        invoice.clientName || null,
        invoice.periodStart,
        invoice.periodEnd,
        invoice.invoiceDate,
        invoice.dueDate,
        JSON.stringify(invoice.billableItemIds),
        JSON.stringify(invoice.lineItems),
        invoice.subtotal,
        invoice.taxAmount,
        invoice.taxRate || null,
        invoice.discountAmount,
        invoice.adjustmentAmount,
        invoice.totalAmount,
        invoice.paidAmount,
        invoice.balanceDue,
        invoice.status,
        JSON.stringify(invoice.statusHistory || []),
        invoice.submittedDate || null,
        invoice.submittedBy || null,
        invoice.submissionMethod || null,
        invoice.submissionConfirmation || null,
        invoice.paymentTerms || null,
        invoice.lateFeeRate || null,
        JSON.stringify(invoice.payments || []),
        invoice.pdfUrl || null,
        invoice.documentIds ? JSON.stringify(invoice.documentIds) : null,
        invoice.claimIds ? JSON.stringify(invoice.claimIds) : null,
        invoice.claimStatus || null,
        invoice.notes || null,
        invoice.internalNotes || null,
        invoice.tags ? JSON.stringify(invoice.tags) : null,
        now,
        invoice.createdBy,
        now,
        invoice.updatedBy,
        1,
      ]
    );

    return this.mapInvoice(result.rows[0]);
  }

  async findInvoiceById(id: UUID): Promise<Invoice | null> {
    const result = await this.pool.query(
      'SELECT * FROM invoices WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );
    return result.rows[0] ? this.mapInvoice(result.rows[0]) : null;
  }

  async findInvoiceByNumber(invoiceNumber: string): Promise<Invoice | null> {
    const result = await this.pool.query(
      'SELECT * FROM invoices WHERE invoice_number = $1 AND deleted_at IS NULL',
      [invoiceNumber]
    );
    return result.rows[0] ? this.mapInvoice(result.rows[0]) : null;
  }

  async searchInvoices(filters: InvoiceSearchFilters): Promise<Invoice[]> {
    const conditions: string[] = ['deleted_at IS NULL'];
    const params: any[] = [];
    let paramCount = 1;

    if (filters.organizationId) {
      conditions.push(`organization_id = $${paramCount++}`);
      params.push(filters.organizationId);
    }

    if (filters.payerId) {
      conditions.push(`payer_id = $${paramCount++}`);
      params.push(filters.payerId);
    }

    if (filters.clientId) {
      conditions.push(`client_id = $${paramCount++}`);
      params.push(filters.clientId);
    }

    if (filters.status && filters.status.length > 0) {
      conditions.push(`status = ANY($${paramCount++})`);
      params.push(filters.status);
    }

    if (filters.startDate) {
      conditions.push(`invoice_date >= $${paramCount++}`);
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      conditions.push(`invoice_date <= $${paramCount++}`);
      params.push(filters.endDate);
    }

    if (filters.isPastDue) {
      conditions.push(`due_date < CURRENT_DATE`);
      conditions.push(`balance_due > 0`);
    }

    if (filters.hasBalance) {
      conditions.push(`balance_due > 0`);
    }

    const query = `
      SELECT * FROM invoices
      WHERE ${conditions.join(' AND ')}
      ORDER BY invoice_date DESC
      LIMIT 1000
    `;

    const result = await this.pool.query(query, params);
    return result.rows.map(this.mapInvoice);
  }

  async updateInvoicePayment(
    id: UUID,
    paymentAmount: number,
    paymentReference: any,
    userId: UUID,
    client?: PoolClient
  ): Promise<void> {
    const db = client || this.pool;

    await db.query(
      `
      UPDATE invoices
      SET 
        paid_amount = paid_amount + $2,
        balance_due = total_amount - (paid_amount + $2),
        payments = payments || $3::jsonb,
        status = CASE
          WHEN total_amount - (paid_amount + $2) = 0 THEN 'PAID'
          WHEN paid_amount + $2 > 0 THEN 'PARTIALLY_PAID'
          ELSE status
        END,
        updated_by = $4,
        updated_at = NOW(),
        version = version + 1
      WHERE id = $1
      `,
      [id, paymentAmount, JSON.stringify([paymentReference]), userId]
    );
  }

  /**
   * PAYMENT OPERATIONS
   */

  async createPayment(
    payment: Omit<Payment, 'id' | 'createdAt' | 'updatedAt' | 'version'>,
    client?: PoolClient
  ): Promise<Payment> {
    const db = client || this.pool;
    const id = uuid();
    const now = new Date();

    const result = await db.query(
      `
      INSERT INTO payments (
        id, organization_id, branch_id,
        payment_number, payment_type,
        payer_id, payer_type, payer_name,
        amount, currency,
        payment_date, received_date, deposited_date,
        payment_method, reference_number,
        allocations, unapplied_amount,
        bank_account_id, deposit_slip_number,
        status, status_history,
        is_reconciled, reconciled_date, reconciled_by,
        image_url, document_ids,
        notes, internal_notes,
        created_at, created_by, updated_at, updated_by, version
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
        $31, $32, $33
      )
      RETURNING *
      `,
      [
        id,
        payment.organizationId,
        payment.branchId,
        payment.paymentNumber,
        payment.paymentType,
        payment.payerId,
        payment.payerType,
        payment.payerName,
        payment.amount,
        payment.currency,
        payment.paymentDate,
        payment.receivedDate,
        payment.depositedDate || null,
        payment.paymentMethod,
        payment.referenceNumber || null,
        JSON.stringify(payment.allocations),
        payment.unappliedAmount,
        payment.bankAccountId || null,
        payment.depositSlipNumber || null,
        payment.status,
        JSON.stringify(payment.statusHistory || []),
        payment.isReconciled,
        payment.reconciledDate || null,
        payment.reconciledBy || null,
        payment.imageUrl || null,
        payment.documentIds ? JSON.stringify(payment.documentIds) : null,
        payment.notes || null,
        payment.internalNotes || null,
        now,
        payment.createdBy,
        now,
        payment.updatedBy,
        1,
      ]
    );

    return this.mapPayment(result.rows[0]);
  }

  async findPaymentById(id: UUID): Promise<Payment | null> {
    const result = await this.pool.query('SELECT * FROM payments WHERE id = $1', [
      id,
    ]);
    return result.rows[0] ? this.mapPayment(result.rows[0]) : null;
  }

  async searchPayments(filters: PaymentSearchFilters): Promise<Payment[]> {
    const conditions: string[] = [];
    const params: any[] = [];
    let paramCount = 1;

    if (filters.organizationId) {
      conditions.push(`organization_id = $${paramCount++}`);
      params.push(filters.organizationId);
    }

    if (filters.payerId) {
      conditions.push(`payer_id = $${paramCount++}`);
      params.push(filters.payerId);
    }

    if (filters.status && filters.status.length > 0) {
      conditions.push(`status = ANY($${paramCount++})`);
      params.push(filters.status);
    }

    if (filters.startDate) {
      conditions.push(`payment_date >= $${paramCount++}`);
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      conditions.push(`payment_date <= $${paramCount++}`);
      params.push(filters.endDate);
    }

    if (filters.isReconciled !== undefined) {
      conditions.push(`is_reconciled = $${paramCount++}`);
      params.push(filters.isReconciled);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const query = `
      SELECT * FROM payments
      ${whereClause}
      ORDER BY payment_date DESC
      LIMIT 1000
    `;

    const result = await this.pool.query(query, params);
    return result.rows.map(this.mapPayment);
  }

  async allocatePayment(
    paymentId: UUID,
    allocation: any,
    userId: UUID,
    client?: PoolClient
  ): Promise<void> {
    const db = client || this.pool;

    await db.query(
      `
      UPDATE payments
      SET 
        allocations = allocations || $2::jsonb,
        unapplied_amount = unapplied_amount - $3,
        status = CASE
          WHEN unapplied_amount - $3 = 0 THEN 'APPLIED'
          ELSE status
        END,
        updated_by = $4,
        updated_at = NOW(),
        version = version + 1
      WHERE id = $1
      `,
      [paymentId, JSON.stringify([allocation]), allocation.amount, userId]
    );
  }

  /**
   * MAPPING FUNCTIONS
   */

  private mapPayer(row: any): Payer {
    return {
      id: row.id,
      organizationId: row.organization_id,
      payerName: row.payer_name,
      payerType: row.payer_type,
      payerCode: row.payer_code,
      nationalPayerId: row.national_payer_id,
      medicaidProviderId: row.medicaid_provider_id,
      medicareProviderId: row.medicare_provider_id,
      taxId: row.tax_id,
      address: row.address,
      phone: row.phone,
      fax: row.fax,
      email: row.email,
      website: row.website,
      billingAddress: row.billing_address,
      billingEmail: row.billing_email,
      billingPortalUrl: row.billing_portal_url,
      submissionMethod: row.submission_methods,
      ediPayerId: row.edi_payer_id,
      clearinghouseId: row.clearinghouse_id,
      paymentTermsDays: row.payment_terms_days,
      requiresPreAuthorization: row.requires_pre_authorization,
      requiresReferral: row.requires_referral,
      claimFilingLimit: row.claim_filing_limit,
      defaultRateScheduleId: row.default_rate_schedule_id,
      status: row.status,
      averagePaymentDays: row.average_payment_days,
      denialRate: row.denial_rate,
      notes: row.notes,
      contacts: row.contacts,
      createdAt: row.created_at,
      createdBy: row.created_by,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by,
      version: row.version,
      deletedAt: row.deleted_at,
      deletedBy: row.deleted_by,
    };
  }

  private mapRateSchedule(row: any): RateSchedule {
    return {
      id: row.id,
      organizationId: row.organization_id,
      branchId: row.branch_id,
      name: row.name,
      description: row.description,
      scheduleType: row.schedule_type,
      payerId: row.payer_id,
      payerType: row.payer_type,
      payerName: row.payer_name,
      effectiveFrom: row.effective_from,
      effectiveTo: row.effective_to,
      rates: row.rates,
      status: row.status,
      approvedBy: row.approved_by,
      approvedAt: row.approved_at,
      notes: row.notes,
      createdAt: row.created_at,
      createdBy: row.created_by,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by,
      version: row.version,
    };
  }

  private mapAuthorization(row: any): ServiceAuthorization {
    return {
      id: row.id,
      organizationId: row.organization_id,
      branchId: row.branch_id,
      clientId: row.client_id,
      authorizationNumber: row.authorization_number,
      authorizationType: row.authorization_type,
      payerId: row.payer_id,
      payerType: row.payer_type,
      payerName: row.payer_name,
      serviceTypeId: row.service_type_id,
      serviceTypeCode: row.service_type_code,
      serviceTypeName: row.service_type_name,
      authorizedUnits: parseFloat(row.authorized_units),
      unitType: row.unit_type,
      unitRate: row.unit_rate ? parseFloat(row.unit_rate) : undefined,
      authorizedAmount: row.authorized_amount
        ? parseFloat(row.authorized_amount)
        : undefined,
      effectiveFrom: row.effective_from,
      effectiveTo: row.effective_to,
      usedUnits: parseFloat(row.used_units),
      remainingUnits: parseFloat(row.remaining_units),
      billedUnits: parseFloat(row.billed_units),
      requiresReferral: row.requires_referral,
      referralNumber: row.referral_number,
      allowedProviders: row.allowed_providers,
      locationRestrictions: row.location_restrictions,
      status: row.status,
      statusHistory: row.status_history,
      reviewedBy: row.reviewed_by,
      reviewedAt: row.reviewed_at,
      reviewNotes: row.review_notes,
      lowUnitsThreshold: row.low_units_threshold
        ? parseFloat(row.low_units_threshold)
        : undefined,
      expirationWarningDays: row.expiration_warning_days,
      documentIds: row.document_ids,
      notes: row.notes,
      internalNotes: row.internal_notes,
      createdAt: row.created_at,
      createdBy: row.created_by,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by,
      version: row.version,
      deletedAt: row.deleted_at,
      deletedBy: row.deleted_by,
    };
  }

  private mapBillableItem(row: any): BillableItem {
    return {
      id: row.id,
      organizationId: row.organization_id,
      branchId: row.branch_id,
      clientId: row.client_id,
      visitId: row.visit_id,
      evvRecordId: row.evv_record_id,
      serviceTypeId: row.service_type_id,
      serviceTypeCode: row.service_type_code,
      serviceTypeName: row.service_type_name,
      serviceDate: row.service_date,
      startTime: row.start_time,
      endTime: row.end_time,
      durationMinutes: row.duration_minutes,
      caregiverId: row.caregiver_id,
      caregiverName: row.caregiver_name,
      providerNPI: row.provider_npi,
      rateScheduleId: row.rate_schedule_id,
      unitType: row.unit_type,
      units: parseFloat(row.units),
      unitRate: parseFloat(row.unit_rate),
      subtotal: parseFloat(row.subtotal),
      modifiers: row.modifiers,
      adjustments: row.adjustments,
      finalAmount: parseFloat(row.final_amount),
      authorizationId: row.authorization_id,
      authorizationNumber: row.authorization_number,
      isAuthorized: row.is_authorized,
      authorizationRemainingUnits: row.authorization_remaining_units
        ? parseFloat(row.authorization_remaining_units)
        : undefined,
      payerId: row.payer_id,
      payerType: row.payer_type,
      payerName: row.payer_name,
      status: row.status,
      statusHistory: row.status_history,
      invoiceId: row.invoice_id,
      invoiceDate: row.invoice_date,
      claimId: row.claim_id,
      claimSubmittedDate: row.claim_submitted_date,
      isHold: row.is_hold,
      holdReason: row.hold_reason,
      requiresReview: row.requires_review,
      reviewReason: row.review_reason,
      isDenied: row.is_denied,
      denialReason: row.denial_reason,
      denialCode: row.denial_code,
      denialDate: row.denial_date,
      isAppealable: row.is_appealable,
      isPaid: row.is_paid,
      paidAmount: row.paid_amount ? parseFloat(row.paid_amount) : undefined,
      paidDate: row.paid_date,
      paymentId: row.payment_id,
      notes: row.notes,
      tags: row.tags,
      createdAt: row.created_at,
      createdBy: row.created_by,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by,
      version: row.version,
      deletedAt: row.deleted_at,
      deletedBy: row.deleted_by,
    };
  }

  private mapInvoice(row: any): Invoice {
    return {
      id: row.id,
      organizationId: row.organization_id,
      branchId: row.branch_id,
      invoiceNumber: row.invoice_number,
      invoiceType: row.invoice_type,
      payerId: row.payer_id,
      payerType: row.payer_type,
      payerName: row.payer_name,
      payerAddress: row.payer_address,
      clientId: row.client_id,
      clientName: row.client_name,
      periodStart: row.period_start,
      periodEnd: row.period_end,
      invoiceDate: row.invoice_date,
      dueDate: row.due_date,
      billableItemIds: row.billable_item_ids,
      lineItems: row.line_items,
      subtotal: parseFloat(row.subtotal),
      taxAmount: parseFloat(row.tax_amount),
      taxRate: row.tax_rate ? parseFloat(row.tax_rate) : undefined,
      discountAmount: parseFloat(row.discount_amount),
      adjustmentAmount: parseFloat(row.adjustment_amount),
      totalAmount: parseFloat(row.total_amount),
      paidAmount: parseFloat(row.paid_amount),
      balanceDue: parseFloat(row.balance_due),
      status: row.status,
      statusHistory: row.status_history,
      submittedDate: row.submitted_date,
      submittedBy: row.submitted_by,
      submissionMethod: row.submission_method,
      submissionConfirmation: row.submission_confirmation,
      paymentTerms: row.payment_terms,
      lateFeeRate: row.late_fee_rate ? parseFloat(row.late_fee_rate) : undefined,
      payments: row.payments,
      pdfUrl: row.pdf_url,
      documentIds: row.document_ids,
      claimIds: row.claim_ids,
      claimStatus: row.claim_status,
      notes: row.notes,
      internalNotes: row.internal_notes,
      tags: row.tags,
      createdAt: row.created_at,
      createdBy: row.created_by,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by,
      version: row.version,
      deletedAt: row.deleted_at,
      deletedBy: row.deleted_by,
    };
  }

  private mapPayment(row: any): Payment {
    return {
      id: row.id,
      organizationId: row.organization_id,
      branchId: row.branch_id,
      paymentNumber: row.payment_number,
      paymentType: row.payment_type,
      payerId: row.payer_id,
      payerType: row.payer_type,
      payerName: row.payer_name,
      amount: parseFloat(row.amount),
      currency: row.currency,
      paymentDate: row.payment_date,
      receivedDate: row.received_date,
      depositedDate: row.deposited_date,
      paymentMethod: row.payment_method,
      referenceNumber: row.reference_number,
      allocations: row.allocations,
      unappliedAmount: parseFloat(row.unapplied_amount),
      bankAccountId: row.bank_account_id,
      depositSlipNumber: row.deposit_slip_number,
      status: row.status,
      statusHistory: row.status_history,
      isReconciled: row.is_reconciled,
      reconciledDate: row.reconciled_date,
      reconciledBy: row.reconciled_by,
      imageUrl: row.image_url,
      documentIds: row.document_ids,
      notes: row.notes,
      internalNotes: row.internal_notes,
      createdAt: row.created_at,
      createdBy: row.created_by,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by,
      version: row.version,
    };
  }
}
