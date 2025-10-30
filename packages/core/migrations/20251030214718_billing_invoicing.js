"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    await knex.schema.createTable('payers', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.uuid('organization_id').notNullable();
        table.string('payer_name', 200).notNullable();
        table.string('payer_type', 50).notNullable();
        table.string('payer_code', 50);
        table.string('national_payer_id', 100);
        table.string('medicaid_provider_id', 50);
        table.string('medicare_provider_id', 50);
        table.string('tax_id', 20);
        table.jsonb('address');
        table.string('phone', 20);
        table.string('fax', 20);
        table.string('email', 100);
        table.string('website', 200);
        table.jsonb('billing_address');
        table.string('billing_email', 100);
        table.string('billing_portal_url', 200);
        table.jsonb('submission_methods');
        table.string('edi_payer_id', 50);
        table.uuid('clearinghouse_id');
        table.integer('payment_terms_days').notNullable().defaultTo(30);
        table.boolean('requires_pre_authorization').defaultTo(false);
        table.boolean('requires_referral').defaultTo(false);
        table.integer('claim_filing_limit');
        table.uuid('default_rate_schedule_id');
        table.string('status', 50).notNullable().defaultTo('ACTIVE');
        table.integer('average_payment_days');
        table.decimal('denial_rate', 5, 2);
        table.text('notes');
        table.jsonb('contacts');
        table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
        table.uuid('created_by').notNullable();
        table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
        table.uuid('updated_by').notNullable();
        table.integer('version').notNullable().defaultTo(1);
        table.timestamp('deleted_at');
        table.uuid('deleted_by');
        table.foreign('organization_id').references('id').inTable('organizations').onDelete('RESTRICT');
    });
    await knex.raw(`
    ALTER TABLE payers ADD CONSTRAINT chk_payer_type CHECK (
      payer_type IN ('MEDICAID', 'MEDICARE', 'MEDICARE_ADVANTAGE', 'PRIVATE_INSURANCE',
      'MANAGED_CARE', 'VETERANS_BENEFITS', 'WORKERS_COMP', 'PRIVATE_PAY',
      'GRANT', 'OTHER')
    )
  `);
    await knex.raw('ALTER TABLE payers ADD CONSTRAINT chk_payment_terms_days CHECK (payment_terms_days BETWEEN 0 AND 365)');
    await knex.raw('ALTER TABLE payers ADD CONSTRAINT chk_claim_filing_limit CHECK (claim_filing_limit IS NULL OR claim_filing_limit BETWEEN 0 AND 365)');
    await knex.raw(`
    ALTER TABLE payers ADD CONSTRAINT chk_payer_status CHECK (
      status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'TERMINATED')
    )
  `);
    await knex.raw('CREATE INDEX idx_payers_organization ON payers(organization_id) WHERE deleted_at IS NULL');
    await knex.raw('CREATE INDEX idx_payers_type ON payers(payer_type, status) WHERE deleted_at IS NULL');
    await knex.raw('CREATE INDEX idx_payers_status ON payers(status) WHERE deleted_at IS NULL');
    await knex.raw('CREATE INDEX idx_payers_name ON payers(organization_id, payer_name) WHERE deleted_at IS NULL');
    await knex.raw('CREATE INDEX idx_payers_national_id ON payers(national_payer_id) WHERE national_payer_id IS NOT NULL');
    await knex.schema.createTable('rate_schedules', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.uuid('organization_id').notNullable();
        table.uuid('branch_id');
        table.string('name', 200).notNullable();
        table.text('description');
        table.string('schedule_type', 50).notNullable();
        table.uuid('payer_id');
        table.string('payer_type', 50);
        table.string('payer_name', 200);
        table.date('effective_from').notNullable();
        table.date('effective_to');
        table.jsonb('rates').notNullable();
        table.string('status', 50).notNullable().defaultTo('DRAFT');
        table.uuid('approved_by');
        table.timestamp('approved_at');
        table.text('notes');
        table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
        table.uuid('created_by').notNullable();
        table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
        table.uuid('updated_by').notNullable();
        table.integer('version').notNullable().defaultTo(1);
        table.foreign('organization_id').references('id').inTable('organizations').onDelete('RESTRICT');
        table.foreign('branch_id').references('id').inTable('branches').onDelete('RESTRICT');
        table.foreign('payer_id').references('id').inTable('payers').onDelete('SET NULL');
    });
    await knex.raw(`
    ALTER TABLE rate_schedules ADD CONSTRAINT chk_schedule_type CHECK (
      schedule_type IN ('STANDARD', 'PAYER_SPECIFIC', 'CLIENT_SPECIFIC', 'PROGRAM', 'PROMOTIONAL')
    )
  `);
    await knex.raw('ALTER TABLE rate_schedules ADD CONSTRAINT chk_rate_schedule_dates CHECK (effective_to IS NULL OR effective_from <= effective_to)');
    await knex.raw(`
    ALTER TABLE rate_schedules ADD CONSTRAINT chk_rate_schedule_status CHECK (
      status IN ('DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED')
    )
  `);
    await knex.raw('CREATE INDEX idx_rate_schedules_organization ON rate_schedules(organization_id)');
    await knex.raw('CREATE INDEX idx_rate_schedules_branch ON rate_schedules(branch_id) WHERE branch_id IS NOT NULL');
    await knex.raw('CREATE INDEX idx_rate_schedules_payer ON rate_schedules(payer_id) WHERE payer_id IS NOT NULL');
    await knex.raw('CREATE INDEX idx_rate_schedules_effective ON rate_schedules(effective_from, effective_to, status)');
    await knex.raw('CREATE INDEX idx_rate_schedules_active ON rate_schedules(organization_id, status) WHERE status = \'ACTIVE\'');
    await knex.schema.createTable('service_authorizations', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.uuid('organization_id').notNullable();
        table.uuid('branch_id').notNullable();
        table.uuid('client_id').notNullable();
        table.string('authorization_number', 100).notNullable();
        table.string('authorization_type', 50).notNullable();
        table.uuid('payer_id').notNullable();
        table.string('payer_type', 50).notNullable();
        table.string('payer_name', 200).notNullable();
        table.uuid('service_type_id').notNullable();
        table.string('service_type_code', 50).notNullable();
        table.string('service_type_name', 200).notNullable();
        table.decimal('authorized_units', 10, 2).notNullable();
        table.string('unit_type', 50).notNullable();
        table.decimal('unit_rate', 10, 2);
        table.decimal('authorized_amount', 10, 2);
        table.date('effective_from').notNullable();
        table.date('effective_to').notNullable();
        table.decimal('used_units', 10, 2).notNullable().defaultTo(0);
        table.decimal('remaining_units', 10, 2).notNullable();
        table.decimal('billed_units', 10, 2).notNullable().defaultTo(0);
        table.boolean('requires_referral').defaultTo(false);
        table.string('referral_number', 100);
        table.jsonb('allowed_providers');
        table.text('location_restrictions');
        table.string('status', 50).notNullable().defaultTo('PENDING');
        table.jsonb('status_history').notNullable().defaultTo('[]');
        table.uuid('reviewed_by');
        table.timestamp('reviewed_at');
        table.text('review_notes');
        table.decimal('low_units_threshold', 10, 2);
        table.integer('expiration_warning_days');
        table.jsonb('document_ids');
        table.text('notes');
        table.text('internal_notes');
        table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
        table.uuid('created_by').notNullable();
        table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
        table.uuid('updated_by').notNullable();
        table.integer('version').notNullable().defaultTo(1);
        table.timestamp('deleted_at');
        table.uuid('deleted_by');
        table.foreign('organization_id').references('id').inTable('organizations').onDelete('RESTRICT');
        table.foreign('branch_id').references('id').inTable('branches').onDelete('RESTRICT');
        table.foreign('client_id').references('id').inTable('clients').onDelete('RESTRICT');
        table.foreign('payer_id').references('id').inTable('payers').onDelete('RESTRICT');
    });
    await knex.raw(`
    ALTER TABLE service_authorizations ADD CONSTRAINT chk_authorization_type CHECK (
      authorization_type IN ('INITIAL', 'RENEWAL', 'MODIFICATION', 'EMERGENCY', 'TEMPORARY')
    )
  `);
    await knex.raw('ALTER TABLE service_authorizations ADD CONSTRAINT chk_authorized_units CHECK (authorized_units >= 0)');
    await knex.raw('ALTER TABLE service_authorizations ADD CONSTRAINT chk_used_units CHECK (used_units >= 0)');
    await knex.raw('ALTER TABLE service_authorizations ADD CONSTRAINT chk_remaining_units CHECK (remaining_units >= 0)');
    await knex.raw('ALTER TABLE service_authorizations ADD CONSTRAINT chk_billed_units CHECK (billed_units >= 0)');
    await knex.raw('ALTER TABLE service_authorizations ADD CONSTRAINT chk_authorization_dates CHECK (effective_from <= effective_to)');
    await knex.raw('ALTER TABLE service_authorizations ADD CONSTRAINT chk_authorization_units CHECK (used_units <= authorized_units)');
    await knex.raw('ALTER TABLE service_authorizations ADD CONSTRAINT chk_expiration_warning_days CHECK (expiration_warning_days IS NULL OR expiration_warning_days BETWEEN 0 AND 90)');
    await knex.raw(`
    ALTER TABLE service_authorizations ADD CONSTRAINT chk_authorization_status CHECK (
      status IN ('PENDING', 'ACTIVE', 'DEPLETED', 'EXPIRED', 'SUSPENDED', 'CANCELLED', 'DENIED')
    )
  `);
    await knex.raw('CREATE UNIQUE INDEX idx_authorizations_number ON service_authorizations(authorization_number) WHERE deleted_at IS NULL');
    await knex.raw('CREATE INDEX idx_authorizations_organization ON service_authorizations(organization_id) WHERE deleted_at IS NULL');
    await knex.raw('CREATE INDEX idx_authorizations_client ON service_authorizations(client_id, status) WHERE deleted_at IS NULL');
    await knex.raw('CREATE INDEX idx_authorizations_payer ON service_authorizations(payer_id, status) WHERE deleted_at IS NULL');
    await knex.raw('CREATE INDEX idx_authorizations_status ON service_authorizations(status, effective_to) WHERE deleted_at IS NULL');
    await knex.raw('CREATE INDEX idx_authorizations_expiring ON service_authorizations(effective_to) WHERE status = \'ACTIVE\' AND deleted_at IS NULL');
    await knex.raw('CREATE INDEX idx_authorizations_low_units ON service_authorizations(remaining_units) WHERE status = \'ACTIVE\' AND remaining_units < 10 AND deleted_at IS NULL');
    await knex.schema.createTable('billable_items', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.uuid('organization_id').notNullable();
        table.uuid('branch_id').notNullable();
        table.uuid('client_id').notNullable();
        table.uuid('visit_id');
        table.uuid('evv_record_id');
        table.uuid('service_type_id').notNullable();
        table.string('service_type_code', 50).notNullable();
        table.string('service_type_name', 200).notNullable();
        table.date('service_date').notNullable();
        table.timestamp('start_time');
        table.timestamp('end_time');
        table.integer('duration_minutes').notNullable();
        table.uuid('caregiver_id');
        table.string('caregiver_name', 200);
        table.string('provider_npi', 20);
        table.uuid('rate_schedule_id');
        table.string('unit_type', 50).notNullable();
        table.decimal('units', 10, 2).notNullable();
        table.decimal('unit_rate', 10, 2).notNullable();
        table.decimal('subtotal', 10, 2).notNullable();
        table.jsonb('modifiers');
        table.jsonb('adjustments');
        table.decimal('final_amount', 10, 2).notNullable();
        table.uuid('authorization_id');
        table.string('authorization_number', 100);
        table.boolean('is_authorized').defaultTo(false);
        table.decimal('authorization_remaining_units', 10, 2);
        table.uuid('payer_id').notNullable();
        table.string('payer_type', 50).notNullable();
        table.string('payer_name', 200).notNullable();
        table.string('status', 50).notNullable().defaultTo('PENDING');
        table.jsonb('status_history').notNullable().defaultTo('[]');
        table.uuid('invoice_id');
        table.date('invoice_date');
        table.uuid('claim_id');
        table.date('claim_submitted_date');
        table.boolean('is_hold').defaultTo(false);
        table.text('hold_reason');
        table.boolean('requires_review').defaultTo(false);
        table.text('review_reason');
        table.boolean('is_denied').defaultTo(false);
        table.text('denial_reason');
        table.string('denial_code', 50);
        table.date('denial_date');
        table.boolean('is_appealable').defaultTo(false);
        table.boolean('is_paid').defaultTo(false);
        table.decimal('paid_amount', 10, 2);
        table.date('paid_date');
        table.uuid('payment_id');
        table.text('notes');
        table.jsonb('tags');
        table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
        table.uuid('created_by').notNullable();
        table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
        table.uuid('updated_by').notNullable();
        table.integer('version').notNullable().defaultTo(1);
        table.timestamp('deleted_at');
        table.uuid('deleted_by');
        table.foreign('organization_id').references('id').inTable('organizations').onDelete('RESTRICT');
        table.foreign('branch_id').references('id').inTable('branches').onDelete('RESTRICT');
        table.foreign('client_id').references('id').inTable('clients').onDelete('RESTRICT');
        table.foreign('visit_id').references('id').inTable('visits').onDelete('SET NULL');
        table.foreign('evv_record_id').references('id').inTable('evv_records').onDelete('SET NULL');
        table.foreign('caregiver_id').references('id').inTable('caregivers').onDelete('SET NULL');
        table.foreign('rate_schedule_id').references('id').inTable('rate_schedules').onDelete('SET NULL');
        table.foreign('authorization_id').references('id').inTable('service_authorizations').onDelete('SET NULL');
        table.foreign('payer_id').references('id').inTable('payers').onDelete('RESTRICT');
    });
    await knex.raw('ALTER TABLE billable_items ADD CONSTRAINT chk_duration_minutes CHECK (duration_minutes >= 0)');
    await knex.raw('ALTER TABLE billable_items ADD CONSTRAINT chk_units CHECK (units >= 0)');
    await knex.raw('ALTER TABLE billable_items ADD CONSTRAINT chk_unit_rate CHECK (unit_rate >= 0)');
    await knex.raw('ALTER TABLE billable_items ADD CONSTRAINT chk_subtotal CHECK (subtotal >= 0)');
    await knex.raw('ALTER TABLE billable_items ADD CONSTRAINT chk_final_amount CHECK (final_amount >= 0)');
    await knex.raw('ALTER TABLE billable_items ADD CONSTRAINT chk_authorization_remaining_units CHECK (authorization_remaining_units IS NULL OR authorization_remaining_units >= 0)');
    await knex.raw(`
    ALTER TABLE billable_items ADD CONSTRAINT chk_billable_status CHECK (
      status IN ('PENDING', 'READY', 'INVOICED', 'SUBMITTED', 'PAID', 'PARTIAL_PAID',
      'DENIED', 'APPEALED', 'ADJUSTED', 'VOIDED', 'HOLD')
    )
  `);
    await knex.raw('ALTER TABLE billable_items ADD CONSTRAINT chk_paid_amount CHECK (paid_amount IS NULL OR paid_amount >= 0)');
    await knex.raw(`
    ALTER TABLE billable_items ADD CONSTRAINT chk_billable_times CHECK (
      start_time IS NULL OR end_time IS NULL OR start_time < end_time
    )
  `);
    await knex.raw('CREATE INDEX idx_billable_organization ON billable_items(organization_id, service_date) WHERE deleted_at IS NULL');
    await knex.raw('CREATE INDEX idx_billable_branch ON billable_items(branch_id, service_date) WHERE deleted_at IS NULL');
    await knex.raw('CREATE INDEX idx_billable_client ON billable_items(client_id, service_date) WHERE deleted_at IS NULL');
    await knex.raw('CREATE INDEX idx_billable_caregiver ON billable_items(caregiver_id, service_date) WHERE caregiver_id IS NOT NULL AND deleted_at IS NULL');
    await knex.raw('CREATE INDEX idx_billable_payer ON billable_items(payer_id, service_date) WHERE deleted_at IS NULL');
    await knex.raw('CREATE INDEX idx_billable_status ON billable_items(status, service_date) WHERE deleted_at IS NULL');
    await knex.raw('CREATE INDEX idx_billable_visit ON billable_items(visit_id) WHERE visit_id IS NOT NULL AND deleted_at IS NULL');
    await knex.raw('CREATE INDEX idx_billable_evv ON billable_items(evv_record_id) WHERE evv_record_id IS NOT NULL AND deleted_at IS NULL');
    await knex.raw('CREATE INDEX idx_billable_invoice ON billable_items(invoice_id) WHERE invoice_id IS NOT NULL AND deleted_at IS NULL');
    await knex.raw('CREATE INDEX idx_billable_authorization ON billable_items(authorization_id) WHERE authorization_id IS NOT NULL AND deleted_at IS NULL');
    await knex.raw('CREATE INDEX idx_billable_ready ON billable_items(organization_id, payer_id) WHERE status = \'READY\' AND deleted_at IS NULL');
    await knex.raw('CREATE INDEX idx_billable_hold ON billable_items(organization_id) WHERE is_hold = true AND deleted_at IS NULL');
    await knex.raw('CREATE INDEX idx_billable_review ON billable_items(organization_id) WHERE requires_review = true AND deleted_at IS NULL');
    await knex.raw('CREATE INDEX idx_billable_unpaid ON billable_items(payer_id, service_date) WHERE is_paid = false AND status NOT IN (\'VOIDED\', \'HOLD\') AND deleted_at IS NULL');
    await knex.schema.createTable('invoices', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.uuid('organization_id').notNullable();
        table.uuid('branch_id').notNullable();
        table.string('invoice_number', 100).notNullable();
        table.string('invoice_type', 50).notNullable();
        table.uuid('payer_id').notNullable();
        table.string('payer_type', 50).notNullable();
        table.string('payer_name', 200).notNullable();
        table.jsonb('payer_address');
        table.uuid('client_id');
        table.string('client_name', 200);
        table.date('period_start').notNullable();
        table.date('period_end').notNullable();
        table.date('invoice_date').notNullable();
        table.date('due_date').notNullable();
        table.jsonb('billable_item_ids').notNullable();
        table.jsonb('line_items').notNullable();
        table.decimal('subtotal', 10, 2).notNullable();
        table.decimal('tax_amount', 10, 2).notNullable().defaultTo(0);
        table.decimal('tax_rate', 5, 4);
        table.decimal('discount_amount', 10, 2).notNullable().defaultTo(0);
        table.decimal('adjustment_amount', 10, 2).notNullable().defaultTo(0);
        table.decimal('total_amount', 10, 2).notNullable();
        table.decimal('paid_amount', 10, 2).notNullable().defaultTo(0);
        table.decimal('balance_due', 10, 2).notNullable();
        table.string('status', 50).notNullable().defaultTo('DRAFT');
        table.jsonb('status_history').notNullable().defaultTo('[]');
        table.date('submitted_date');
        table.uuid('submitted_by');
        table.string('submission_method', 50);
        table.string('submission_confirmation', 200);
        table.string('payment_terms', 200);
        table.decimal('late_fee_rate', 5, 4);
        table.jsonb('payments').notNullable().defaultTo('[]');
        table.string('pdf_url', 500);
        table.jsonb('document_ids');
        table.jsonb('claim_ids');
        table.string('claim_status', 50);
        table.text('notes');
        table.text('internal_notes');
        table.jsonb('tags');
        table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
        table.uuid('created_by').notNullable();
        table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
        table.uuid('updated_by').notNullable();
        table.integer('version').notNullable().defaultTo(1);
        table.timestamp('deleted_at');
        table.uuid('deleted_by');
        table.foreign('organization_id').references('id').inTable('organizations').onDelete('RESTRICT');
        table.foreign('branch_id').references('id').inTable('branches').onDelete('RESTRICT');
        table.foreign('payer_id').references('id').inTable('payers').onDelete('RESTRICT');
        table.foreign('client_id').references('id').inTable('clients').onDelete('SET NULL');
    });
    await knex.raw(`
    ALTER TABLE invoices ADD CONSTRAINT chk_invoice_type CHECK (
      invoice_type IN ('STANDARD', 'INTERIM', 'FINAL', 'CREDIT', 'PROFORMA', 'STATEMENT')
    )
  `);
    await knex.raw('ALTER TABLE invoices ADD CONSTRAINT chk_subtotal CHECK (subtotal >= 0)');
    await knex.raw('ALTER TABLE invoices ADD CONSTRAINT chk_tax_amount CHECK (tax_amount >= 0)');
    await knex.raw('ALTER TABLE invoices ADD CONSTRAINT chk_discount_amount CHECK (discount_amount >= 0)');
    await knex.raw('ALTER TABLE invoices ADD CONSTRAINT chk_adjustment_amount CHECK (adjustment_amount >= 0)');
    await knex.raw('ALTER TABLE invoices ADD CONSTRAINT chk_total_amount CHECK (total_amount >= 0)');
    await knex.raw('ALTER TABLE invoices ADD CONSTRAINT chk_paid_amount CHECK (paid_amount >= 0)');
    await knex.raw('ALTER TABLE invoices ADD CONSTRAINT chk_balance_due CHECK (balance_due >= 0)');
    await knex.raw(`
    ALTER TABLE invoices ADD CONSTRAINT chk_invoice_status CHECK (
      status IN ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'SENT', 'SUBMITTED',
      'PARTIALLY_PAID', 'PAID', 'PAST_DUE', 'DISPUTED', 'CANCELLED', 'VOIDED')
    )
  `);
    await knex.raw('ALTER TABLE invoices ADD CONSTRAINT chk_invoice_period CHECK (period_start <= period_end)');
    await knex.raw('ALTER TABLE invoices ADD CONSTRAINT chk_invoice_dates CHECK (invoice_date <= due_date)');
    await knex.raw('ALTER TABLE invoices ADD CONSTRAINT chk_invoice_balance CHECK (balance_due = total_amount - paid_amount)');
    await knex.raw('CREATE UNIQUE INDEX idx_invoices_number ON invoices(invoice_number) WHERE deleted_at IS NULL');
    await knex.raw('CREATE INDEX idx_invoices_organization ON invoices(organization_id, invoice_date DESC) WHERE deleted_at IS NULL');
    await knex.raw('CREATE INDEX idx_invoices_branch ON invoices(branch_id, invoice_date DESC) WHERE deleted_at IS NULL');
    await knex.raw('CREATE INDEX idx_invoices_payer ON invoices(payer_id, invoice_date DESC) WHERE deleted_at IS NULL');
    await knex.raw('CREATE INDEX idx_invoices_client ON invoices(client_id, invoice_date DESC) WHERE client_id IS NOT NULL AND deleted_at IS NULL');
    await knex.raw('CREATE INDEX idx_invoices_status ON invoices(status, due_date) WHERE deleted_at IS NULL');
    await knex.raw('CREATE INDEX idx_invoices_period ON invoices(period_start, period_end) WHERE deleted_at IS NULL');
    await knex.raw(`
    CREATE INDEX idx_invoices_past_due ON invoices(due_date, status) 
    WHERE status IN ('SENT', 'SUBMITTED', 'PARTIALLY_PAID') AND deleted_at IS NULL
  `);
    await knex.raw(`
    CREATE INDEX idx_invoices_unpaid ON invoices(organization_id, payer_id, status) 
    WHERE status NOT IN ('CANCELLED', 'VOIDED') AND deleted_at IS NULL
  `);
    await knex.schema.createTable('payments', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.uuid('organization_id').notNullable();
        table.uuid('branch_id').notNullable();
        table.string('payment_number', 100).notNullable();
        table.string('payment_type', 50).notNullable();
        table.uuid('payer_id').notNullable();
        table.string('payer_type', 50).notNullable();
        table.string('payer_name', 200).notNullable();
        table.decimal('amount', 10, 2).notNullable();
        table.string('currency', 3).notNullable().defaultTo('USD');
        table.date('payment_date').notNullable();
        table.date('received_date').notNullable();
        table.date('deposited_date');
        table.string('payment_method', 50).notNullable();
        table.string('reference_number', 100);
        table.jsonb('allocations').notNullable().defaultTo('[]');
        table.decimal('unapplied_amount', 10, 2).notNullable().defaultTo(0);
        table.uuid('bank_account_id');
        table.string('deposit_slip_number', 100);
        table.string('status', 50).notNullable().defaultTo('PENDING');
        table.jsonb('status_history').notNullable().defaultTo('[]');
        table.boolean('is_reconciled').defaultTo(false);
        table.date('reconciled_date');
        table.uuid('reconciled_by');
        table.string('image_url', 500);
        table.jsonb('document_ids');
        table.text('notes');
        table.text('internal_notes');
        table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
        table.uuid('created_by').notNullable();
        table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
        table.uuid('updated_by').notNullable();
        table.integer('version').notNullable().defaultTo(1);
        table.foreign('organization_id').references('id').inTable('organizations').onDelete('RESTRICT');
        table.foreign('branch_id').references('id').inTable('branches').onDelete('RESTRICT');
        table.foreign('payer_id').references('id').inTable('payers').onDelete('RESTRICT');
    });
    await knex.raw(`
    ALTER TABLE payments ADD CONSTRAINT chk_payment_type CHECK (
      payment_type IN ('FULL', 'PARTIAL', 'DEPOSIT', 'REFUND', 'ADJUSTMENT')
    )
  `);
    await knex.raw('ALTER TABLE payments ADD CONSTRAINT chk_amount CHECK (amount > 0)');
    await knex.raw('ALTER TABLE payments ADD CONSTRAINT chk_unapplied_amount CHECK (unapplied_amount >= 0)');
    await knex.raw(`
    ALTER TABLE payments ADD CONSTRAINT chk_payment_method CHECK (
      payment_method IN ('CHECK', 'EFT', 'ACH', 'WIRE', 'CREDIT_CARD', 'DEBIT_CARD',
      'CASH', 'MONEY_ORDER', 'ERA')
    )
  `);
    await knex.raw(`
    ALTER TABLE payments ADD CONSTRAINT chk_payment_status CHECK (
      status IN ('PENDING', 'RECEIVED', 'APPLIED', 'DEPOSITED', 'CLEARED',
      'RETURNED', 'VOIDED', 'REFUNDED')
    )
  `);
    await knex.raw('ALTER TABLE payments ADD CONSTRAINT chk_payment_dates CHECK (received_date >= payment_date)');
    await knex.raw('CREATE UNIQUE INDEX idx_payments_number ON payments(payment_number)');
    await knex.raw('CREATE INDEX idx_payments_organization ON payments(organization_id, received_date DESC)');
    await knex.raw('CREATE INDEX idx_payments_branch ON payments(branch_id, received_date DESC)');
    await knex.raw('CREATE INDEX idx_payments_payer ON payments(payer_id, payment_date DESC)');
    await knex.raw('CREATE INDEX idx_payments_status ON payments(status, received_date)');
    await knex.raw('CREATE INDEX idx_payments_reference ON payments(reference_number) WHERE reference_number IS NOT NULL');
    await knex.raw('CREATE INDEX idx_payments_unreconciled ON payments(organization_id) WHERE is_reconciled = false');
    await knex.raw('CREATE INDEX idx_payments_unapplied ON payments(organization_id, unapplied_amount)');
    await knex.schema.createTable('claims', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.uuid('organization_id').notNullable();
        table.uuid('branch_id').notNullable();
        table.string('claim_number', 100).notNullable();
        table.string('claim_type', 50).notNullable();
        table.string('claim_format', 50).notNullable();
        table.uuid('payer_id').notNullable();
        table.string('payer_type', 50).notNullable();
        table.string('payer_name', 200).notNullable();
        table.uuid('client_id').notNullable();
        table.string('client_name', 200).notNullable();
        table.uuid('invoice_id').notNullable();
        table.string('invoice_number', 100).notNullable();
        table.jsonb('billable_item_ids').notNullable();
        table.jsonb('line_items').notNullable();
        table.decimal('total_charges', 10, 2).notNullable();
        table.decimal('total_approved', 10, 2);
        table.decimal('total_paid', 10, 2);
        table.decimal('total_adjustments', 10, 2);
        table.decimal('patient_responsibility', 10, 2);
        table.date('submitted_date').notNullable();
        table.uuid('submitted_by').notNullable();
        table.string('submission_method', 50).notNullable();
        table.uuid('submission_batch_id');
        table.string('control_number', 100);
        table.string('status', 50).notNullable().defaultTo('PENDING');
        table.jsonb('status_history').notNullable().defaultTo('[]');
        table.date('processing_date');
        table.date('payment_date');
        table.text('denial_reason');
        table.string('denial_code', 50);
        table.date('denial_date');
        table.boolean('is_appealable').defaultTo(false);
        table.date('appeal_deadline');
        table.uuid('appeal_id');
        table.date('appeal_submitted_date');
        table.string('appeal_status', 50);
        table.boolean('era_received').defaultTo(false);
        table.date('era_received_date');
        table.uuid('era_document_id');
        table.string('claim_form_url', 500);
        table.jsonb('supporting_document_ids');
        table.text('notes');
        table.text('internal_notes');
        table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
        table.uuid('created_by').notNullable();
        table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
        table.uuid('updated_by').notNullable();
        table.integer('version').notNullable().defaultTo(1);
        table.foreign('organization_id').references('id').inTable('organizations').onDelete('RESTRICT');
        table.foreign('branch_id').references('id').inTable('branches').onDelete('RESTRICT');
        table.foreign('payer_id').references('id').inTable('payers').onDelete('RESTRICT');
        table.foreign('client_id').references('id').inTable('clients').onDelete('RESTRICT');
        table.foreign('invoice_id').references('id').inTable('invoices').onDelete('RESTRICT');
    });
    await knex.raw(`
    ALTER TABLE claims ADD CONSTRAINT chk_claim_type CHECK (
      claim_type IN ('PROFESSIONAL', 'INSTITUTIONAL', 'DENTAL', 'PHARMACY', 'VISION')
    )
  `);
    await knex.raw(`
    ALTER TABLE claims ADD CONSTRAINT chk_claim_format CHECK (
      claim_format IN ('CMS_1500', 'UB_04', 'EDI_837P', 'EDI_837I', 'PROPRIETARY')
    )
  `);
    await knex.raw('ALTER TABLE claims ADD CONSTRAINT chk_total_charges CHECK (total_charges >= 0)');
    await knex.raw('ALTER TABLE claims ADD CONSTRAINT chk_total_approved CHECK (total_approved IS NULL OR total_approved >= 0)');
    await knex.raw('ALTER TABLE claims ADD CONSTRAINT chk_total_paid CHECK (total_paid IS NULL OR total_paid >= 0)');
    await knex.raw('ALTER TABLE claims ADD CONSTRAINT chk_total_adjustments CHECK (total_adjustments IS NULL OR total_adjustments >= 0)');
    await knex.raw('ALTER TABLE claims ADD CONSTRAINT chk_patient_responsibility CHECK (patient_responsibility IS NULL OR patient_responsibility >= 0)');
    await knex.raw(`
    ALTER TABLE claims ADD CONSTRAINT chk_claim_status CHECK (
      status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'PROCESSING', 'APPROVED',
      'DENIED', 'APPEALED', 'RESUBMITTED')
    )
  `);
    await knex.raw('CREATE UNIQUE INDEX idx_claims_number ON claims(claim_number)');
    await knex.raw('CREATE INDEX idx_claims_organization ON claims(organization_id, submitted_date DESC)');
    await knex.raw('CREATE INDEX idx_claims_branch ON claims(branch_id, submitted_date DESC)');
    await knex.raw('CREATE INDEX idx_claims_payer ON claims(payer_id, submitted_date DESC)');
    await knex.raw('CREATE INDEX idx_claims_client ON claims(client_id, submitted_date DESC)');
    await knex.raw('CREATE INDEX idx_claims_invoice ON claims(invoice_id)');
    await knex.raw('CREATE INDEX idx_claims_status ON claims(status, submitted_date)');
    await knex.raw('CREATE INDEX idx_claims_control ON claims(control_number) WHERE control_number IS NOT NULL');
    await knex.raw('CREATE INDEX idx_claims_denied ON claims(organization_id) WHERE status = \'DENIED\' AND is_appealable = true');
    await knex.raw(`
    CREATE INDEX idx_claims_pending ON claims(organization_id, submitted_date) 
    WHERE status IN ('PENDING', 'ACCEPTED', 'PROCESSING')
  `);
    await knex.raw(`
    CREATE OR REPLACE FUNCTION update_billing_entity_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        NEW.version = OLD.version + 1;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);
    await knex.raw(`
    CREATE TRIGGER trigger_payers_updated_at
        BEFORE UPDATE ON payers
        FOR EACH ROW
        EXECUTE FUNCTION update_billing_entity_updated_at();
  `);
    await knex.raw(`
    CREATE TRIGGER trigger_rate_schedules_updated_at
        BEFORE UPDATE ON rate_schedules
        FOR EACH ROW
        EXECUTE FUNCTION update_billing_entity_updated_at();
  `);
    await knex.raw(`
    CREATE TRIGGER trigger_authorizations_updated_at
        BEFORE UPDATE ON service_authorizations
        FOR EACH ROW
        EXECUTE FUNCTION update_billing_entity_updated_at();
  `);
    await knex.raw(`
    CREATE TRIGGER trigger_billable_items_updated_at
        BEFORE UPDATE ON billable_items
        FOR EACH ROW
        EXECUTE FUNCTION update_billing_entity_updated_at();
  `);
    await knex.raw(`
    CREATE TRIGGER trigger_invoices_updated_at
        BEFORE UPDATE ON invoices
        FOR EACH ROW
        EXECUTE FUNCTION update_billing_entity_updated_at();
  `);
    await knex.raw(`
    CREATE TRIGGER trigger_payments_updated_at
        BEFORE UPDATE ON payments
        FOR EACH ROW
        EXECUTE FUNCTION update_billing_entity_updated_at();
  `);
    await knex.raw(`
    CREATE TRIGGER trigger_claims_updated_at
        BEFORE UPDATE ON claims
        FOR EACH ROW
        EXECUTE FUNCTION update_billing_entity_updated_at();
  `);
    await knex.raw(`COMMENT ON TABLE payers IS 'Insurance companies, agencies, or individuals paying for services'`);
    await knex.raw(`COMMENT ON TABLE rate_schedules IS 'Pricing rules by service type and payer'`);
    await knex.raw(`COMMENT ON TABLE service_authorizations IS 'Pre-approvals for services from payers'`);
    await knex.raw(`COMMENT ON TABLE billable_items IS 'Individual service occurrences ready for billing'`);
    await knex.raw(`COMMENT ON TABLE invoices IS 'Collections of billable items for payers'`);
    await knex.raw(`COMMENT ON TABLE payments IS 'Incoming payments from payers'`);
    await knex.raw(`COMMENT ON TABLE claims IS 'Insurance claim submissions'`);
    await knex.raw(`COMMENT ON COLUMN billable_items.evv_record_id IS 'Links to EVV record for compliance verification'`);
    await knex.raw(`COMMENT ON COLUMN billable_items.authorization_id IS 'Links to service authorization if required'`);
    await knex.raw(`COMMENT ON COLUMN billable_items.is_hold IS 'Temporarily held from billing'`);
    await knex.raw(`COMMENT ON COLUMN billable_items.requires_review IS 'Flags item for manual review'`);
    await knex.raw(`COMMENT ON COLUMN invoices.balance_due IS 'Calculated as total_amount - paid_amount'`);
    await knex.raw(`COMMENT ON COLUMN payments.unapplied_amount IS 'Payment amount not yet allocated to invoices'`);
    await knex.raw(`COMMENT ON COLUMN claims.era_received IS 'Electronic Remittance Advice received from payer'`);
}
async function down(knex) {
    await knex.raw('DROP TRIGGER IF EXISTS trigger_claims_updated_at ON claims');
    await knex.raw('DROP TRIGGER IF EXISTS trigger_payments_updated_at ON payments');
    await knex.raw('DROP TRIGGER IF EXISTS trigger_invoices_updated_at ON invoices');
    await knex.raw('DROP TRIGGER IF EXISTS trigger_billable_items_updated_at ON billable_items');
    await knex.raw('DROP TRIGGER IF EXISTS trigger_authorizations_updated_at ON service_authorizations');
    await knex.raw('DROP TRIGGER IF EXISTS trigger_rate_schedules_updated_at ON rate_schedules');
    await knex.raw('DROP TRIGGER IF EXISTS trigger_payers_updated_at ON payers');
    await knex.raw('DROP FUNCTION IF EXISTS update_billing_entity_updated_at');
    await knex.schema.dropTableIfExists('claims');
    await knex.schema.dropTableIfExists('payments');
    await knex.schema.dropTableIfExists('invoices');
    await knex.schema.dropTableIfExists('billable_items');
    await knex.schema.dropTableIfExists('service_authorizations');
    await knex.schema.dropTableIfExists('rate_schedules');
    await knex.schema.dropTableIfExists('payers');
}
//# sourceMappingURL=20251030214718_billing_invoicing.js.map