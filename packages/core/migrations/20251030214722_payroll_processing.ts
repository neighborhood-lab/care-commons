import { type Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // ============================================================================
  // PAY PERIODS
  // ============================================================================

  await knex.schema.createTable('pay_periods', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('organization_id').notNullable();
    table.uuid('branch_id').nullable();
    
    // Period identity
    table.integer('period_number').notNullable();
    table.integer('period_year').notNullable();
    table.string('period_type', 50).notNullable();
    
    // Date range
    table.date('start_date').notNullable();
    table.date('end_date').notNullable();
    table.date('pay_date').notNullable();
    
    // Status
    table.string('status', 50).notNullable().defaultTo('DRAFT');
    table.jsonb('status_history').notNullable().defaultTo('[]');
    
    // Lock-down dates
    table.date('cutoff_date');
    table.date('approval_deadline');
    
    // Pay run reference
    table.uuid('pay_run_id');
    
    // Statistics
    table.integer('total_caregivers');
    table.decimal('total_hours', 12, 2);
    table.decimal('total_gross_pay', 12, 2);
    table.decimal('total_net_pay', 12, 2);
    table.decimal('total_tax_withheld', 12, 2);
    table.decimal('total_deductions', 12, 2);
    
    // Metadata
    table.text('notes');
    table.integer('fiscal_quarter');
    table.integer('fiscal_year');
    
    // Standard entity fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').notNullable();
    table.integer('version').notNullable().defaultTo(1);
  });

  // Add constraints to pay_periods
  await knex.raw(`
    ALTER TABLE pay_periods
    ADD CONSTRAINT chk_period_number CHECK (period_number > 0)
  `);

  await knex.raw(`
    ALTER TABLE pay_periods
    ADD CONSTRAINT chk_period_year CHECK (period_year BETWEEN 2000 AND 2100)
  `);

  await knex.raw(`
    ALTER TABLE pay_periods
    ADD CONSTRAINT chk_period_type CHECK (period_type IN (
        'WEEKLY', 'BI_WEEKLY', 'SEMI_MONTHLY', 'MONTHLY', 'DAILY', 'CUSTOM'
    ))
  `);

  await knex.raw(`
    ALTER TABLE pay_periods
    ADD CONSTRAINT chk_status CHECK (status IN (
        'DRAFT', 'OPEN', 'LOCKED', 'PROCESSING', 'PENDING_APPROVAL', 'APPROVED', 'PAID', 'CLOSED', 'CANCELLED'
    ))
  `);

  await knex.raw(`
    ALTER TABLE pay_periods
    ADD CONSTRAINT chk_total_caregivers CHECK (total_caregivers >= 0)
  `);

  await knex.raw(`
    ALTER TABLE pay_periods
    ADD CONSTRAINT chk_total_hours CHECK (total_hours >= 0)
  `);

  await knex.raw(`
    ALTER TABLE pay_periods
    ADD CONSTRAINT chk_total_gross_pay CHECK (total_gross_pay >= 0)
  `);

  await knex.raw(`
    ALTER TABLE pay_periods
    ADD CONSTRAINT chk_total_net_pay CHECK (total_net_pay >= 0)
  `);

  await knex.raw(`
    ALTER TABLE pay_periods
    ADD CONSTRAINT chk_total_tax_withheld CHECK (total_tax_withheld >= 0)
  `);

  await knex.raw(`
    ALTER TABLE pay_periods
    ADD CONSTRAINT chk_total_deductions CHECK (total_deductions >= 0)
  `);

  await knex.raw(`
    ALTER TABLE pay_periods
    ADD CONSTRAINT chk_fiscal_quarter CHECK (fiscal_quarter BETWEEN 1 AND 4)
  `);

  await knex.raw(`
    ALTER TABLE pay_periods
    ADD CONSTRAINT chk_fiscal_year CHECK (fiscal_year BETWEEN 2000 AND 2100)
  `);

  await knex.raw(`
    ALTER TABLE pay_periods
    ADD CONSTRAINT fk_pay_period_organization FOREIGN KEY (organization_id) 
        REFERENCES organizations(id) ON DELETE RESTRICT
  `);

  await knex.raw(`
    ALTER TABLE pay_periods
    ADD CONSTRAINT fk_pay_period_branch FOREIGN KEY (branch_id) 
        REFERENCES branches(id) ON DELETE RESTRICT
  `);

  await knex.raw(`
    ALTER TABLE pay_periods
    ADD CONSTRAINT chk_pay_period_dates CHECK (start_date <= end_date)
  `);

  await knex.raw(`
    ALTER TABLE pay_periods
    ADD CONSTRAINT chk_pay_period_cutoff CHECK (cutoff_date IS NULL OR cutoff_date >= end_date)
  `);

  await knex.raw(`
    ALTER TABLE pay_periods
    ADD CONSTRAINT uq_pay_period_number UNIQUE (organization_id, period_year, period_number)
  `);

  // Indexes for pay_periods
  await knex.schema.alterTable('pay_periods', (table) => {
    table.index(['organization_id', 'start_date'], 'idx_pay_periods_organization');
    table.index(['branch_id', 'start_date'], 'idx_pay_periods_branch');
    table.index(['status', 'pay_date'], 'idx_pay_periods_status');
    table.index(['organization_id', 'start_date', 'end_date'], 'idx_pay_periods_date_range');
  });

  await knex.raw(`
    CREATE INDEX idx_pay_periods_fiscal ON pay_periods(organization_id, fiscal_year, fiscal_quarter) 
    WHERE fiscal_year IS NOT NULL
  `);

  // ============================================================================
  // TIME SHEETS
  // ============================================================================

  await knex.schema.createTable('time_sheets', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('organization_id').notNullable();
    table.uuid('branch_id').notNullable();
    
    // Period and caregiver
    table.uuid('pay_period_id').notNullable();
    table.uuid('caregiver_id').notNullable();
    table.string('caregiver_name', 200).notNullable();
    table.string('caregiver_employee_id', 100).notNullable();
    
    // Time entries (stored as JSONB array)
    table.jsonb('time_entries').notNullable().defaultTo('[]');
    
    // Hours summary
    table.decimal('regular_hours', 10, 2).notNullable().defaultTo(0);
    table.decimal('overtime_hours', 10, 2).notNullable().defaultTo(0);
    table.decimal('double_time_hours', 10, 2).notNullable().defaultTo(0);
    table.decimal('pto_hours', 10, 2).notNullable().defaultTo(0);
    table.decimal('holiday_hours', 10, 2).notNullable().defaultTo(0);
    table.decimal('sick_hours', 10, 2).notNullable().defaultTo(0);
    table.decimal('other_hours', 10, 2).notNullable().defaultTo(0);
    table.decimal('total_hours', 10, 2).notNullable().defaultTo(0);
    
    // Rates
    table.decimal('regular_rate', 10, 2).notNullable();
    table.decimal('overtime_rate', 10, 2).notNullable();
    table.decimal('double_time_rate', 10, 2).notNullable();
    
    // Earnings
    table.decimal('regular_earnings', 12, 2).notNullable().defaultTo(0);
    table.decimal('overtime_earnings', 12, 2).notNullable().defaultTo(0);
    table.decimal('double_time_earnings', 12, 2).notNullable().defaultTo(0);
    table.decimal('pto_earnings', 12, 2).notNullable().defaultTo(0);
    table.decimal('holiday_earnings', 12, 2).notNullable().defaultTo(0);
    table.decimal('sick_earnings', 12, 2).notNullable().defaultTo(0);
    table.decimal('other_earnings', 12, 2).notNullable().defaultTo(0);
    table.decimal('gross_earnings', 12, 2).notNullable().defaultTo(0);
    
    // Additional payments (stored as JSONB arrays)
    table.jsonb('bonuses').notNullable().defaultTo('[]');
    table.jsonb('reimbursements').notNullable().defaultTo('[]');
    table.jsonb('adjustments').notNullable().defaultTo('[]');
    table.decimal('total_adjustments', 12, 2).notNullable().defaultTo(0);
    
    // Final gross
    table.decimal('total_gross_pay', 12, 2).notNullable().defaultTo(0);
    
    // Status
    table.string('status', 50).notNullable().defaultTo('DRAFT');
    table.jsonb('status_history').notNullable().defaultTo('[]');
    
    // Approval
    table.timestamp('submitted_at');
    table.uuid('submitted_by');
    table.timestamp('approved_at');
    table.uuid('approved_by');
    table.text('approval_notes');
    
    // Validation
    table.boolean('has_discrepancies').defaultTo(false);
    table.jsonb('discrepancy_flags').notNullable().defaultTo('[]');
    
    // Links
    table.jsonb('evv_record_ids').notNullable().defaultTo('[]');
    table.jsonb('visit_ids').notNullable().defaultTo('[]');
    
    // Metadata
    table.text('notes');
    table.text('review_notes');
    
    // Standard entity fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').notNullable();
    table.integer('version').notNullable().defaultTo(1);
    table.timestamp('deleted_at');
    table.uuid('deleted_by');
  });

  // Add constraints to time_sheets
  await knex.raw(`
    ALTER TABLE time_sheets
    ADD CONSTRAINT chk_regular_hours CHECK (regular_hours >= 0)
  `);

  await knex.raw(`
    ALTER TABLE time_sheets
    ADD CONSTRAINT chk_overtime_hours CHECK (overtime_hours >= 0)
  `);

  await knex.raw(`
    ALTER TABLE time_sheets
    ADD CONSTRAINT chk_double_time_hours CHECK (double_time_hours >= 0)
  `);

  await knex.raw(`
    ALTER TABLE time_sheets
    ADD CONSTRAINT chk_pto_hours CHECK (pto_hours >= 0)
  `);

  await knex.raw(`
    ALTER TABLE time_sheets
    ADD CONSTRAINT chk_holiday_hours CHECK (holiday_hours >= 0)
  `);

  await knex.raw(`
    ALTER TABLE time_sheets
    ADD CONSTRAINT chk_sick_hours CHECK (sick_hours >= 0)
  `);

  await knex.raw(`
    ALTER TABLE time_sheets
    ADD CONSTRAINT chk_other_hours CHECK (other_hours >= 0)
  `);

  await knex.raw(`
    ALTER TABLE time_sheets
    ADD CONSTRAINT chk_total_hours CHECK (total_hours >= 0)
  `);

  await knex.raw(`
    ALTER TABLE time_sheets
    ADD CONSTRAINT chk_regular_rate CHECK (regular_rate >= 0)
  `);

  await knex.raw(`
    ALTER TABLE time_sheets
    ADD CONSTRAINT chk_overtime_rate CHECK (overtime_rate >= 0)
  `);

  await knex.raw(`
    ALTER TABLE time_sheets
    ADD CONSTRAINT chk_double_time_rate CHECK (double_time_rate >= 0)
  `);

  await knex.raw(`
    ALTER TABLE time_sheets
    ADD CONSTRAINT chk_regular_earnings CHECK (regular_earnings >= 0)
  `);

  await knex.raw(`
    ALTER TABLE time_sheets
    ADD CONSTRAINT chk_overtime_earnings CHECK (overtime_earnings >= 0)
  `);

  await knex.raw(`
    ALTER TABLE time_sheets
    ADD CONSTRAINT chk_double_time_earnings CHECK (double_time_earnings >= 0)
  `);

  await knex.raw(`
    ALTER TABLE time_sheets
    ADD CONSTRAINT chk_pto_earnings CHECK (pto_earnings >= 0)
  `);

  await knex.raw(`
    ALTER TABLE time_sheets
    ADD CONSTRAINT chk_holiday_earnings CHECK (holiday_earnings >= 0)
  `);

  await knex.raw(`
    ALTER TABLE time_sheets
    ADD CONSTRAINT chk_sick_earnings CHECK (sick_earnings >= 0)
  `);

  await knex.raw(`
    ALTER TABLE time_sheets
    ADD CONSTRAINT chk_other_earnings CHECK (other_earnings >= 0)
  `);

  await knex.raw(`
    ALTER TABLE time_sheets
    ADD CONSTRAINT chk_gross_earnings CHECK (gross_earnings >= 0)
  `);

  await knex.raw(`
    ALTER TABLE time_sheets
    ADD CONSTRAINT chk_total_gross_pay CHECK (total_gross_pay >= 0)
  `);

  await knex.raw(`
    ALTER TABLE time_sheets
    ADD CONSTRAINT chk_status CHECK (status IN (
        'DRAFT', 'SUBMITTED', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'PROCESSING', 'PAID', 'VOIDED'
    ))
  `);

  await knex.raw(`
    ALTER TABLE time_sheets
    ADD CONSTRAINT fk_timesheet_organization FOREIGN KEY (organization_id) 
        REFERENCES organizations(id) ON DELETE RESTRICT
  `);

  await knex.raw(`
    ALTER TABLE time_sheets
    ADD CONSTRAINT fk_timesheet_branch FOREIGN KEY (branch_id) 
        REFERENCES branches(id) ON DELETE RESTRICT
  `);

  await knex.raw(`
    ALTER TABLE time_sheets
    ADD CONSTRAINT fk_timesheet_pay_period FOREIGN KEY (pay_period_id) 
        REFERENCES pay_periods(id) ON DELETE RESTRICT
  `);

  await knex.raw(`
    ALTER TABLE time_sheets
    ADD CONSTRAINT fk_timesheet_caregiver FOREIGN KEY (caregiver_id) 
        REFERENCES caregivers(id) ON DELETE RESTRICT
  `);

  await knex.raw(`
    ALTER TABLE time_sheets
    ADD CONSTRAINT uq_timesheet_caregiver_period UNIQUE (pay_period_id, caregiver_id)
  `);

  // Indexes for time_sheets
  await knex.raw(`
    CREATE INDEX idx_timesheets_organization ON time_sheets(organization_id, created_at DESC) 
    WHERE deleted_at IS NULL
  `);

  await knex.raw(`
    CREATE INDEX idx_timesheets_branch ON time_sheets(branch_id, created_at DESC) 
    WHERE deleted_at IS NULL
  `);

  await knex.raw(`
    CREATE INDEX idx_timesheets_pay_period ON time_sheets(pay_period_id, status) 
    WHERE deleted_at IS NULL
  `);

  await knex.raw(`
    CREATE INDEX idx_timesheets_caregiver ON time_sheets(caregiver_id, pay_period_id) 
    WHERE deleted_at IS NULL
  `);

  await knex.raw(`
    CREATE INDEX idx_timesheets_status ON time_sheets(status, pay_period_id) 
    WHERE deleted_at IS NULL
  `);

  await knex.raw(`
    CREATE INDEX idx_timesheets_approval ON time_sheets(organization_id) 
    WHERE status IN ('SUBMITTED', 'PENDING_REVIEW') AND deleted_at IS NULL
  `);

  await knex.raw(`
    CREATE INDEX idx_timesheets_discrepancies ON time_sheets(organization_id) 
    WHERE has_discrepancies = true AND deleted_at IS NULL
  `);

  // ============================================================================
  // PAY RUNS
  // ============================================================================

  await knex.schema.createTable('pay_runs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('organization_id').notNullable();
    table.uuid('branch_id').nullable();
    
    // Period
    table.uuid('pay_period_id').notNullable();
    table.date('pay_period_start_date').notNullable();
    table.date('pay_period_end_date').notNullable();
    table.date('pay_date').notNullable();
    
    // Run identity
    table.string('run_number', 100).notNullable();
    table.string('run_type', 50).notNullable();
    
    // Status
    table.string('status', 50).notNullable().defaultTo('DRAFT');
    table.jsonb('status_history').notNullable().defaultTo('[]');
    
    // Processing
    table.timestamp('initiated_at');
    table.uuid('initiated_by');
    table.timestamp('calculated_at');
    table.timestamp('approved_at');
    table.uuid('approved_by');
    table.timestamp('processed_at');
    table.uuid('processed_by');
    
    // Pay stubs
    table.jsonb('pay_stub_ids').notNullable().defaultTo('[]');
    table.integer('total_pay_stubs').notNullable().defaultTo(0);
    
    // Aggregates
    table.integer('total_caregivers').notNullable().defaultTo(0);
    table.decimal('total_hours', 12, 2).notNullable().defaultTo(0);
    table.decimal('total_gross_pay', 14, 2).notNullable().defaultTo(0);
    table.decimal('total_deductions', 14, 2).notNullable().defaultTo(0);
    table.decimal('total_tax_withheld', 14, 2).notNullable().defaultTo(0);
    table.decimal('total_net_pay', 14, 2).notNullable().defaultTo(0);
    
    // Tax totals
    table.decimal('federal_income_tax', 12, 2).notNullable().defaultTo(0);
    table.decimal('state_income_tax', 12, 2).notNullable().defaultTo(0);
    table.decimal('social_security_tax', 12, 2).notNullable().defaultTo(0);
    table.decimal('medicare_tax', 12, 2).notNullable().defaultTo(0);
    table.decimal('local_tax', 12, 2).notNullable().defaultTo(0);
    
    // Other deductions
    table.decimal('benefits_deductions', 12, 2).notNullable().defaultTo(0);
    table.decimal('garnishments', 12, 2).notNullable().defaultTo(0);
    table.decimal('other_deductions', 12, 2).notNullable().defaultTo(0);
    
    // Payment summary
    table.integer('direct_deposit_count').notNullable().defaultTo(0);
    table.decimal('direct_deposit_amount', 14, 2).notNullable().defaultTo(0);
    table.integer('check_count').notNullable().defaultTo(0);
    table.decimal('check_amount', 14, 2).notNullable().defaultTo(0);
    table.integer('cash_count').notNullable().defaultTo(0);
    table.decimal('cash_amount', 14, 2).notNullable().defaultTo(0);
    
    // Files
    table.string('payroll_register_url', 500);
    table.string('tax_report_url', 500);
    table.jsonb('export_files').notNullable().defaultTo('[]');
    
    // Compliance
    table.jsonb('compliance_checks').notNullable().defaultTo('[]');
    table.boolean('compliance_passed').defaultTo(true);
    
    // Errors and issues
    table.boolean('has_errors').defaultTo(false);
    table.jsonb('errors').notNullable().defaultTo('[]');
    table.jsonb('warnings').notNullable().defaultTo('[]');
    
    // Metadata
    table.text('notes');
    table.text('internal_notes');
    
    // Standard entity fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').notNullable();
    table.integer('version').notNullable().defaultTo(1);
  });

  // Add constraints to pay_runs
  await knex.raw(`
    ALTER TABLE pay_runs
    ADD CONSTRAINT chk_run_type CHECK (run_type IN (
        'REGULAR', 'OFF_CYCLE', 'CORRECTION', 'BONUS', 'FINAL', 'ADVANCE', 'RETRO'
    ))
  `);

  await knex.raw(`
    ALTER TABLE pay_runs
    ADD CONSTRAINT chk_pay_run_status CHECK (status IN (
        'DRAFT', 'CALCULATING', 'CALCULATED', 'PENDING_REVIEW', 'PENDING_APPROVAL', 
        'APPROVED', 'PROCESSING', 'PROCESSED', 'FUNDED', 'COMPLETED', 'FAILED', 'CANCELLED'
    ))
  `);

  await knex.raw(`
    ALTER TABLE pay_runs
    ADD CONSTRAINT chk_total_pay_stubs CHECK (total_pay_stubs >= 0)
  `);

  await knex.raw(`
    ALTER TABLE pay_runs
    ADD CONSTRAINT chk_total_caregivers CHECK (total_caregivers >= 0)
  `);

  await knex.raw(`
    ALTER TABLE pay_runs
    ADD CONSTRAINT chk_total_hours CHECK (total_hours >= 0)
  `);

  await knex.raw(`
    ALTER TABLE pay_runs
    ADD CONSTRAINT chk_total_gross_pay CHECK (total_gross_pay >= 0)
  `);

  await knex.raw(`
    ALTER TABLE pay_runs
    ADD CONSTRAINT chk_total_deductions CHECK (total_deductions >= 0)
  `);

  await knex.raw(`
    ALTER TABLE pay_runs
    ADD CONSTRAINT chk_total_tax_withheld CHECK (total_tax_withheld >= 0)
  `);

  await knex.raw(`
    ALTER TABLE pay_runs
    ADD CONSTRAINT chk_total_net_pay CHECK (total_net_pay >= 0)
  `);

  await knex.raw(`
    ALTER TABLE pay_runs
    ADD CONSTRAINT chk_federal_income_tax CHECK (federal_income_tax >= 0)
  `);

  await knex.raw(`
    ALTER TABLE pay_runs
    ADD CONSTRAINT chk_state_income_tax CHECK (state_income_tax >= 0)
  `);

  await knex.raw(`
    ALTER TABLE pay_runs
    ADD CONSTRAINT chk_social_security_tax CHECK (social_security_tax >= 0)
  `);

  await knex.raw(`
    ALTER TABLE pay_runs
    ADD CONSTRAINT chk_medicare_tax CHECK (medicare_tax >= 0)
  `);

  await knex.raw(`
    ALTER TABLE pay_runs
    ADD CONSTRAINT chk_local_tax CHECK (local_tax >= 0)
  `);

  await knex.raw(`
    ALTER TABLE pay_runs
    ADD CONSTRAINT chk_benefits_deductions CHECK (benefits_deductions >= 0)
  `);

  await knex.raw(`
    ALTER TABLE pay_runs
    ADD CONSTRAINT chk_garnishments CHECK (garnishments >= 0)
  `);

  await knex.raw(`
    ALTER TABLE pay_runs
    ADD CONSTRAINT chk_other_deductions CHECK (other_deductions >= 0)
  `);

  await knex.raw(`
    ALTER TABLE pay_runs
    ADD CONSTRAINT chk_direct_deposit_count CHECK (direct_deposit_count >= 0)
  `);

  await knex.raw(`
    ALTER TABLE pay_runs
    ADD CONSTRAINT chk_direct_deposit_amount CHECK (direct_deposit_amount >= 0)
  `);

  await knex.raw(`
    ALTER TABLE pay_runs
    ADD CONSTRAINT chk_check_count CHECK (check_count >= 0)
  `);

  await knex.raw(`
    ALTER TABLE pay_runs
    ADD CONSTRAINT chk_check_amount CHECK (check_amount >= 0)
  `);

  await knex.raw(`
    ALTER TABLE pay_runs
    ADD CONSTRAINT chk_cash_count CHECK (cash_count >= 0)
  `);

  await knex.raw(`
    ALTER TABLE pay_runs
    ADD CONSTRAINT chk_cash_amount CHECK (cash_amount >= 0)
  `);

  await knex.raw(`
    ALTER TABLE pay_runs
    ADD CONSTRAINT fk_pay_run_organization FOREIGN KEY (organization_id) 
        REFERENCES organizations(id) ON DELETE RESTRICT
  `);

  await knex.raw(`
    ALTER TABLE pay_runs
    ADD CONSTRAINT fk_pay_run_branch FOREIGN KEY (branch_id) 
        REFERENCES branches(id) ON DELETE RESTRICT
  `);

  await knex.raw(`
    ALTER TABLE pay_runs
    ADD CONSTRAINT fk_pay_run_pay_period FOREIGN KEY (pay_period_id) 
        REFERENCES pay_periods(id) ON DELETE RESTRICT
  `);

  await knex.raw(`
    ALTER TABLE pay_runs
    ADD CONSTRAINT chk_pay_run_period CHECK (pay_period_start_date <= pay_period_end_date)
  `);

  // Indexes for pay_runs
  await knex.schema.alterTable('pay_runs', (table) => {
    table.index(['run_number'], 'idx_pay_runs_number');
    table.index(['organization_id', 'created_at'], 'idx_pay_runs_organization');
    table.index(['branch_id', 'created_at'], 'idx_pay_runs_branch');
    table.index(['pay_period_id'], 'idx_pay_runs_pay_period');
    table.index(['status', 'pay_date'], 'idx_pay_runs_status');
  });

  await knex.raw('ALTER TABLE pay_runs ADD CONSTRAINT uq_run_number UNIQUE (run_number)');

  await knex.raw(`
    CREATE INDEX idx_pay_runs_approval ON pay_runs(organization_id) 
    WHERE status IN ('PENDING_REVIEW', 'PENDING_APPROVAL')
  `);

  // ============================================================================
  // TAX CONFIGURATIONS
  // ============================================================================

  await knex.schema.createTable('tax_configurations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('organization_id').notNullable();
    table.uuid('caregiver_id').notNullable();
    
    // Federal
    table.string('federal_filing_status', 50).notNullable();
    table.integer('federal_allowances').notNullable().defaultTo(0);
    table.decimal('federal_extra_withholding', 10, 2).notNullable().defaultTo(0);
    table.boolean('federal_exempt').defaultTo(false);
    
    // W-4 fields (2020+ format)
    table.boolean('w4_step_2').defaultTo(false);
    table.decimal('w4_step_3_dependents', 10, 2).notNullable().defaultTo(0);
    table.decimal('w4_step_4a_other_income', 10, 2).notNullable().defaultTo(0);
    table.decimal('w4_step_4b_deductions', 10, 2).notNullable().defaultTo(0);
    table.decimal('w4_step_4c_extra_withholding', 10, 2).notNullable().defaultTo(0);
    
    // State
    table.string('state_filing_status', 50).notNullable();
    table.integer('state_allowances').notNullable().defaultTo(0);
    table.decimal('state_extra_withholding', 10, 2).notNullable().defaultTo(0);
    table.boolean('state_exempt').defaultTo(false);
    table.string('state_residence', 2).notNullable();
    
    // Local
    table.string('local_tax_jurisdiction', 100);
    table.boolean('local_exempt').defaultTo(false);
    
    // Status
    table.date('effective_from').notNullable();
    table.date('effective_to');
    table.timestamp('last_updated').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').notNullable();
    
    // W-4 form
    table.boolean('w4_on_file').defaultTo(false);
    table.date('w4_file_date');
    table.uuid('w4_document_id');
    
    // State form
    table.boolean('state_form_on_file').defaultTo(false);
    table.date('state_form_date');
    table.uuid('state_form_document_id');
    
    // Standard entity fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();
    table.integer('version').notNullable().defaultTo(1);
  });

  // Add constraints to tax_configurations
  await knex.raw(`
    ALTER TABLE tax_configurations
    ADD CONSTRAINT chk_federal_filing_status CHECK (federal_filing_status IN (
        'SINGLE', 'MARRIED_JOINTLY', 'MARRIED_SEPARATELY', 'HEAD_OF_HOUSEHOLD', 'QUALIFYING_WIDOW'
    ))
  `);

  await knex.raw(`
    ALTER TABLE tax_configurations
    ADD CONSTRAINT chk_federal_allowances CHECK (federal_allowances >= 0)
  `);

  await knex.raw(`
    ALTER TABLE tax_configurations
    ADD CONSTRAINT chk_federal_extra_withholding CHECK (federal_extra_withholding >= 0)
  `);

  await knex.raw(`
    ALTER TABLE tax_configurations
    ADD CONSTRAINT chk_w4_step_3_dependents CHECK (w4_step_3_dependents >= 0)
  `);

  await knex.raw(`
    ALTER TABLE tax_configurations
    ADD CONSTRAINT chk_w4_step_4a_other_income CHECK (w4_step_4a_other_income >= 0)
  `);

  await knex.raw(`
    ALTER TABLE tax_configurations
    ADD CONSTRAINT chk_w4_step_4b_deductions CHECK (w4_step_4b_deductions >= 0)
  `);

  await knex.raw(`
    ALTER TABLE tax_configurations
    ADD CONSTRAINT chk_w4_step_4c_extra_withholding CHECK (w4_step_4c_extra_withholding >= 0)
  `);

  await knex.raw(`
    ALTER TABLE tax_configurations
    ADD CONSTRAINT chk_state_filing_status CHECK (state_filing_status IN (
        'SINGLE', 'MARRIED', 'MARRIED_JOINTLY', 'MARRIED_SEPARATELY', 'HEAD_OF_HOUSEHOLD', 'EXEMPT'
    ))
  `);

  await knex.raw(`
    ALTER TABLE tax_configurations
    ADD CONSTRAINT chk_state_allowances CHECK (state_allowances >= 0)
  `);

  await knex.raw(`
    ALTER TABLE tax_configurations
    ADD CONSTRAINT chk_state_extra_withholding CHECK (state_extra_withholding >= 0)
  `);

  await knex.raw(`
    ALTER TABLE tax_configurations
    ADD CONSTRAINT fk_tax_config_organization FOREIGN KEY (organization_id) 
        REFERENCES organizations(id) ON DELETE RESTRICT
  `);

  await knex.raw(`
    ALTER TABLE tax_configurations
    ADD CONSTRAINT fk_tax_config_caregiver FOREIGN KEY (caregiver_id) 
        REFERENCES caregivers(id) ON DELETE RESTRICT
  `);

  await knex.raw(`
    ALTER TABLE tax_configurations
    ADD CONSTRAINT chk_tax_config_dates CHECK (
        effective_to IS NULL OR effective_from <= effective_to
    )
  `);

  // Indexes for tax_configurations
  await knex.schema.alterTable('tax_configurations', (table) => {
    table.index(['organization_id'], 'idx_tax_configs_organization');
    table.index(['caregiver_id', 'effective_from'], 'idx_tax_configs_caregiver');
    table.index(['caregiver_id', 'effective_from', 'effective_to'], 'idx_tax_configs_effective');
    table.index(['state_residence'], 'idx_tax_configs_state');
  });

  // ============================================================================
  // CAREGIVER DEDUCTIONS
  // ============================================================================

  await knex.schema.createTable('caregiver_deductions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('caregiver_id').notNullable();
    
    // Deduction type
    table.string('deduction_type', 100).notNullable();
    table.string('deduction_code', 50).notNullable();
    table.text('description').notNullable();
    
    // Amount
    table.decimal('amount', 10, 2).notNullable().defaultTo(0);
    table.string('calculation_method', 50).notNullable();
    table.decimal('percentage', 5, 2);
    
    // Limits
    table.boolean('has_limit').defaultTo(false);
    table.decimal('yearly_limit', 10, 2);
    table.decimal('year_to_date_amount', 10, 2).defaultTo(0);
    table.decimal('remaining_amount', 10, 2);
    
    // Tax treatment
    table.boolean('is_pre_tax').defaultTo(false);
    table.boolean('is_post_tax').defaultTo(false);
    table.boolean('is_statutory').defaultTo(false);
    
    // Employer match (for retirement, etc.)
    table.decimal('employer_match', 10, 2);
    table.decimal('employer_match_percentage', 5, 2);
    
    // Garnishment specifics
    table.jsonb('garnishment_order');
    
    // Status
    table.boolean('is_active').defaultTo(true);
    table.date('effective_from');
    table.date('effective_to');
  });

  // Add constraints to caregiver_deductions
  await knex.raw(`
    ALTER TABLE caregiver_deductions
    ADD CONSTRAINT chk_deduction_type CHECK (deduction_type IN (
        'FEDERAL_INCOME_TAX', 'STATE_INCOME_TAX', 'LOCAL_INCOME_TAX',
        'SOCIAL_SECURITY', 'MEDICARE', 'ADDITIONAL_MEDICARE',
        'HEALTH_INSURANCE', 'DENTAL_INSURANCE', 'VISION_INSURANCE', 'LIFE_INSURANCE', 'DISABILITY_INSURANCE',
        'RETIREMENT_401K', 'RETIREMENT_403B', 'RETIREMENT_ROTH',
        'HSA', 'FSA_HEALTHCARE', 'FSA_DEPENDENT_CARE', 'COMMUTER_BENEFITS',
        'UNION_DUES',
        'GARNISHMENT_CHILD_SUPPORT', 'GARNISHMENT_TAX_LEVY', 'GARNISHMENT_CREDITOR', 'GARNISHMENT_STUDENT_LOAN',
        'LOAN_REPAYMENT', 'ADVANCE_REPAYMENT', 'UNIFORM', 'EQUIPMENT', 'OTHER'
    ))
  `);

  await knex.raw(`
    ALTER TABLE caregiver_deductions
    ADD CONSTRAINT chk_amount CHECK (amount >= 0)
  `);

  await knex.raw(`
    ALTER TABLE caregiver_deductions
    ADD CONSTRAINT chk_calculation_method CHECK (calculation_method IN (
        'FIXED', 'PERCENTAGE', 'PERCENTAGE_OF_NET', 'GRADUATED', 'FORMULA'
    ))
  `);

  await knex.raw(`
    ALTER TABLE caregiver_deductions
    ADD CONSTRAINT chk_percentage CHECK (percentage >= 0 AND percentage <= 100)
  `);

  await knex.raw(`
    ALTER TABLE caregiver_deductions
    ADD CONSTRAINT chk_yearly_limit CHECK (yearly_limit IS NULL OR yearly_limit >= 0)
  `);

  await knex.raw(`
    ALTER TABLE caregiver_deductions
    ADD CONSTRAINT chk_year_to_date_amount CHECK (year_to_date_amount >= 0)
  `);

  await knex.raw(`
    ALTER TABLE caregiver_deductions
    ADD CONSTRAINT chk_remaining_amount CHECK (remaining_amount IS NULL OR remaining_amount >= 0)
  `);

  await knex.raw(`
    ALTER TABLE caregiver_deductions
    ADD CONSTRAINT chk_employer_match CHECK (employer_match IS NULL OR employer_match >= 0)
  `);

  await knex.raw(`
    ALTER TABLE caregiver_deductions
    ADD CONSTRAINT chk_employer_match_percentage CHECK (employer_match_percentage IS NULL OR 
        (employer_match_percentage >= 0 AND employer_match_percentage <= 100))
  `);

  await knex.raw(`
    ALTER TABLE caregiver_deductions
    ADD CONSTRAINT fk_deduction_caregiver FOREIGN KEY (caregiver_id) 
        REFERENCES caregivers(id) ON DELETE RESTRICT
  `);

  await knex.raw(`
    ALTER TABLE caregiver_deductions
    ADD CONSTRAINT chk_deduction_dates CHECK (
        effective_to IS NULL OR effective_from IS NULL OR effective_from <= effective_to
    )
  `);

  await knex.raw(`
    ALTER TABLE caregiver_deductions
    ADD CONSTRAINT chk_deduction_calculation CHECK (
        (calculation_method IN ('FIXED', 'GRADUATED', 'FORMULA') AND percentage IS NULL) OR
        (calculation_method IN ('PERCENTAGE', 'PERCENTAGE_OF_NET') AND percentage IS NOT NULL)
    )
  `);

  // Indexes for caregiver_deductions
  await knex.schema.alterTable('caregiver_deductions', (table) => {
    table.index(['caregiver_id', 'is_active'], 'idx_deductions_caregiver');
    table.index(['deduction_type', 'is_active'], 'idx_deductions_type');
  });

  await knex.raw(`
    CREATE INDEX idx_deductions_effective ON caregiver_deductions(caregiver_id, effective_from, effective_to) 
    WHERE is_active = true
  `);

  // ============================================================================
  // PAY STUBS
  // ============================================================================

  await knex.schema.createTable('pay_stubs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('organization_id').notNullable();
    table.uuid('branch_id').notNullable();
    
    // References
    table.uuid('pay_run_id').notNullable();
    table.uuid('pay_period_id').notNullable();
    table.uuid('caregiver_id').notNullable();
    table.uuid('time_sheet_id').notNullable();
    
    // Caregiver info
    table.string('caregiver_name', 200).notNullable();
    table.string('caregiver_employee_id', 100).notNullable();
    table.jsonb('caregiver_address');
    
    // Period
    table.date('pay_period_start_date').notNullable();
    table.date('pay_period_end_date').notNullable();
    table.date('pay_date').notNullable();
    
    // Stub number
    table.string('stub_number', 100).notNullable();
    
    // Hours
    table.decimal('regular_hours', 10, 2).notNullable().defaultTo(0);
    table.decimal('overtime_hours', 10, 2).notNullable().defaultTo(0);
    table.decimal('double_time_hours', 10, 2).notNullable().defaultTo(0);
    table.decimal('pto_hours', 10, 2).notNullable().defaultTo(0);
    table.decimal('holiday_hours', 10, 2).notNullable().defaultTo(0);
    table.decimal('sick_hours', 10, 2).notNullable().defaultTo(0);
    table.decimal('other_hours', 10, 2).notNullable().defaultTo(0);
    table.decimal('total_hours', 10, 2).notNullable().defaultTo(0);
    
    // Earnings
    table.decimal('regular_pay', 12, 2).notNullable().defaultTo(0);
    table.decimal('overtime_pay', 12, 2).notNullable().defaultTo(0);
    table.decimal('double_time_pay', 12, 2).notNullable().defaultTo(0);
    table.decimal('pto_pay', 12, 2).notNullable().defaultTo(0);
    table.decimal('holiday_pay', 12, 2).notNullable().defaultTo(0);
    table.decimal('sick_pay', 12, 2).notNullable().defaultTo(0);
    table.decimal('other_pay', 12, 2).notNullable().defaultTo(0);
    
    // Additional earnings
    table.decimal('bonuses', 12, 2).notNullable().defaultTo(0);
    table.decimal('commissions', 12, 2).notNullable().defaultTo(0);
    table.decimal('reimbursements', 12, 2).notNullable().defaultTo(0);
    table.decimal('retroactive_pay', 12, 2).notNullable().defaultTo(0);
    table.decimal('other_earnings', 12, 2).notNullable().defaultTo(0);
    
    // Gross pay
    table.decimal('current_gross_pay', 12, 2).notNullable();
    table.decimal('year_to_date_gross_pay', 14, 2).notNullable();
    
    // Deductions (detailed array)
    table.jsonb('deductions').notNullable().defaultTo('[]');
    
    // Tax withholdings
    table.decimal('federal_income_tax', 10, 2).notNullable().defaultTo(0);
    table.decimal('state_income_tax', 10, 2).notNullable().defaultTo(0);
    table.decimal('local_income_tax', 10, 2).notNullable().defaultTo(0);
    table.decimal('social_security_tax', 10, 2).notNullable().defaultTo(0);
    table.decimal('medicare_tax', 10, 2).notNullable().defaultTo(0);
    table.decimal('additional_medicare_tax', 10, 2).notNullable().defaultTo(0);
    table.decimal('total_tax_withheld', 10, 2).notNullable().defaultTo(0);
    
    // Other deductions
    table.decimal('health_insurance', 10, 2).notNullable().defaultTo(0);
    table.decimal('dental_insurance', 10, 2).notNullable().defaultTo(0);
    table.decimal('vision_insurance', 10, 2).notNullable().defaultTo(0);
    table.decimal('life_insurance', 10, 2).notNullable().defaultTo(0);
    table.decimal('retirement_401k', 10, 2).notNullable().defaultTo(0);
    table.decimal('retirement_roth', 10, 2).notNullable().defaultTo(0);
    table.decimal('fsa_healthcare', 10, 2).notNullable().defaultTo(0);
    table.decimal('fsa_dependent_care', 10, 2).notNullable().defaultTo(0);
    table.decimal('hsa', 10, 2).notNullable().defaultTo(0);
    table.decimal('garnishments', 10, 2).notNullable().defaultTo(0);
    table.decimal('union_dues', 10, 2).notNullable().defaultTo(0);
    table.decimal('other_deductions', 10, 2).notNullable().defaultTo(0);
    table.decimal('total_other_deductions', 10, 2).notNullable().defaultTo(0);
    
    // Net pay
    table.decimal('current_net_pay', 12, 2).notNullable();
    table.decimal('year_to_date_net_pay', 14, 2).notNullable();
    
    // Year-to-date totals
    table.decimal('ytd_hours', 12, 2).notNullable().defaultTo(0);
    table.decimal('ytd_gross_pay', 14, 2).notNullable().defaultTo(0);
    table.decimal('ytd_federal_tax', 12, 2).notNullable().defaultTo(0);
    table.decimal('ytd_state_tax', 12, 2).notNullable().defaultTo(0);
    table.decimal('ytd_social_security', 12, 2).notNullable().defaultTo(0);
    table.decimal('ytd_medicare', 12, 2).notNullable().defaultTo(0);
    table.decimal('ytd_deductions', 12, 2).notNullable().defaultTo(0);
    table.decimal('ytd_net_pay', 14, 2).notNullable().defaultTo(0);
    
    // Payment method
    table.string('payment_method', 50).notNullable();
    table.uuid('payment_id');
    
    // Bank info (for direct deposit)
    table.uuid('bank_account_id');
    table.string('bank_account_last4', 4);
    
    // Check info
    table.string('check_number', 50);
    table.date('check_date');
    table.string('check_status', 50);
    
    // Status
    table.string('status', 50).notNullable().defaultTo('DRAFT');
    table.jsonb('status_history').notNullable().defaultTo('[]');
    
    // Approval
    table.timestamp('calculated_at').notNullable();
    table.uuid('calculated_by');
    table.timestamp('approved_at');
    table.uuid('approved_by');
    
    // Delivery
    table.timestamp('delivered_at');
    table.string('delivery_method', 50);
    table.timestamp('viewed_at');
    
    // Documents
    table.string('pdf_url', 500);
    table.timestamp('pdf_generated_at');
    
    // Flags
    table.boolean('is_void').defaultTo(false);
    table.text('void_reason');
    table.timestamp('voided_at');
    table.uuid('voided_by');
    
    // Metadata
    table.text('notes');
    table.text('internal_notes');
    
    // Standard entity fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').notNullable();
    table.integer('version').notNullable().defaultTo(1);
  });

  // Add constraints to pay_stubs
  await knex.raw(`
    ALTER TABLE pay_stubs
    ADD CONSTRAINT chk_regular_hours_ps CHECK (regular_hours >= 0)
  `);

  await knex.raw(`
    ALTER TABLE pay_stubs
    ADD CONSTRAINT chk_overtime_hours_ps CHECK (overtime_hours >= 0)
  `);

  await knex.raw(`
    ALTER TABLE pay_stubs
    ADD CONSTRAINT chk_double_time_hours_ps CHECK (double_time_hours >= 0)
  `);

  await knex.raw(`
    ALTER TABLE pay_stubs
    ADD CONSTRAINT chk_pto_hours_ps CHECK (pto_hours >= 0)
  `);

  await knex.raw(`
    ALTER TABLE pay_stubs
    ADD CONSTRAINT chk_holiday_hours_ps CHECK (holiday_hours >= 0)
  `);

  await knex.raw(`
    ALTER TABLE pay_stubs
    ADD CONSTRAINT chk_sick_hours_ps CHECK (sick_hours >= 0)
  `);

  await knex.raw(`
    ALTER TABLE pay_stubs
    ADD CONSTRAINT chk_other_hours_ps CHECK (other_hours >= 0)
  `);

  await knex.raw(`
    ALTER TABLE pay_stubs
    ADD CONSTRAINT chk_total_hours_ps CHECK (total_hours >= 0)
  `);

  await knex.raw(`
    ALTER TABLE pay_stubs
    ADD CONSTRAINT chk_regular_pay CHECK (regular_pay >= 0)
  `);

  await knex.raw(`
    ALTER TABLE pay_stubs
    ADD CONSTRAINT chk_overtime_pay CHECK (overtime_pay >= 0)
  `);

  await knex.raw(`
    ALTER TABLE pay_stubs
    ADD CONSTRAINT chk_double_time_pay CHECK (double_time_pay >= 0)
  `);

  await knex.raw(`
    ALTER TABLE pay_stubs
    ADD CONSTRAINT chk_pto_pay CHECK (pto_pay >= 0)
  `);

  await knex.raw(`
    ALTER TABLE pay_stubs
    ADD CONSTRAINT chk_holiday_pay CHECK (holiday_pay >= 0)
  `);

  await knex.raw(`
    ALTER TABLE pay_stubs
    ADD CONSTRAINT chk_sick_pay CHECK (sick_pay >= 0)
  `);

  await knex.raw(`
    ALTER TABLE pay_stubs
    ADD CONSTRAINT chk_other_pay CHECK (other_pay >= 0)
  `);

  await knex.raw(`
    ALTER TABLE pay_stubs
    ADD CONSTRAINT chk_bonuses CHECK (bonuses >= 0)
  `);

  await knex.raw(`
    ALTER TABLE pay_stubs
    ADD CONSTRAINT chk_commissions CHECK (commissions >= 0)
  `);

  await knex.raw(`
    ALTER TABLE pay_stubs
    ADD CONSTRAINT chk_reimbursements CHECK (reimbursements >= 0)
  `);

  await knex.raw(`
    ALTER TABLE pay_stubs
    ADD CONSTRAINT chk_other_earnings CHECK (other_earnings >= 0)
  `);

  await knex.raw(`
    ALTER TABLE pay_stubs
    ADD CONSTRAINT chk_current_gross_pay CHECK (current_gross_pay >= 0)
  `);

  await knex.raw(`
    ALTER TABLE pay_stubs
    ADD CONSTRAINT chk_year_to_date_gross_pay CHECK (year_to_date_gross_pay >= 0)
  `);

  await knex.raw(`
    ALTER TABLE pay_stubs
    ADD CONSTRAINT chk_federal_income_tax_ps CHECK (federal_income_tax >= 0)
  `);

  await knex.raw(`
    ALTER TABLE pay_stubs
    ADD CONSTRAINT chk_state_income_tax_ps CHECK (state_income_tax >= 0)
  `);

  await knex.raw(`
    ALTER TABLE pay_stubs
    ADD CONSTRAINT chk_local_income_tax_ps CHECK (local_income_tax >= 0)
  `);

  await knex.raw(`
    ALTER TABLE pay_stubs
    ADD CONSTRAINT chk_social_security_tax_ps CHECK (social_security_tax >= 0)
  `);

  await knex.raw(`
    ALTER TABLE pay_stubs
    ADD CONSTRAINT chk_medicare_tax_ps CHECK (medicare_tax >= 0)
  `);

  await knex.raw(`
    ALTER TABLE pay_stubs
    ADD CONSTRAINT chk_additional_medicare_tax CHECK (additional_medicare_tax >= 0)
  `);

  await knex.raw(`
    ALTER TABLE pay_stubs
    ADD CONSTRAINT chk_total_tax_withheld_ps CHECK (total_tax_withheld >= 0)
  `);

  await knex.raw(`
    ALTER TABLE pay_stubs
    ADD CONSTRAINT chk_health_insurance CHECK (health_insurance >= 0)
  `);

  await knex.raw(`
    ALTER TABLE pay_stubs
    ADD CONSTRAINT chk_dental_insurance CHECK (dental_insurance >= 0)
  `);

  await knex.raw(`
    ALTER TABLE pay_stubs
    ADD CONSTRAINT chk_vision_insurance CHECK (vision_insurance >= 0)
  `);

  await knex.raw(`
    ALTER TABLE pay_stubs
    ADD CONSTRAINT chk_life_insurance CHECK (life_insurance >= 0)
  `);

  await knex.raw(`
    ALTER TABLE pay_stubs
    ADD CONSTRAINT chk_retirement_401k CHECK (retirement_401k >= 0)
  `);

  await knex.raw(`
    ALTER TABLE pay_stubs
    ADD CONSTRAINT chk_retirement_roth CHECK (retirement_roth >= 0)
  `);

  await knex.raw(`
    ALTER TABLE pay_stubs
    ADD CONSTRAINT chk_fsa_healthcare CHECK (fsa_healthcare >= 0)
  `);

  await knex.raw(`
    ALTER TABLE pay_stubs
    ADD CONSTRAINT chk_fsa_dependent_care CHECK (fsa_dependent_care >= 0)
  `);

  await knex.raw(`
    ALTER TABLE pay_stubs
    ADD CONSTRAINT chk_hsa_ps CHECK (hsa >= 0)
  `);

  await knex.raw(`
    ALTER TABLE pay_stubs
    ADD CONSTRAINT chk_garnishments_ps CHECK (garnishments >= 0)
  `);

  await knex.raw(`
    ALTER TABLE pay_stubs
    ADD CONSTRAINT chk_union_dues_ps CHECK (union_dues >= 0)
  `);

  await knex.raw(`
    ALTER TABLE pay_stubs
    ADD CONSTRAINT chk_other_deductions_ps CHECK (other_deductions >= 0)
  `);

  await knex.raw(`
    ALTER TABLE pay_stubs
    ADD CONSTRAINT chk_total_other_deductions CHECK (total_other_deductions >= 0)
  `);

  await knex.raw(`
    ALTER TABLE pay_stubs
    ADD CONSTRAINT chk_current_net_pay CHECK (current_net_pay >= 0)
  `);

  await knex.raw(`
    ALTER TABLE pay_stubs
    ADD CONSTRAINT chk_year_to_date_net_pay CHECK (year_to_date_net_pay >= 0)
  `);

  await knex.raw(`
    ALTER TABLE pay_stubs
    ADD CONSTRAINT chk_ytd_hours CHECK (ytd_hours >= 0)
  `);

  await knex.raw(`
    ALTER TABLE pay_stubs
    ADD CONSTRAINT chk_ytd_gross_pay CHECK (ytd_gross_pay >= 0)
  `);

  await knex.raw(`
    ALTER TABLE pay_stubs
    ADD CONSTRAINT chk_ytd_federal_tax CHECK (ytd_federal_tax >= 0)
  `);

  await knex.raw(`
    ALTER TABLE pay_stubs
    ADD CONSTRAINT chk_ytd_state_tax CHECK (ytd_state_tax >= 0)
  `);

  await knex.raw(`
    ALTER TABLE pay_stubs
    ADD CONSTRAINT chk_ytd_social_security CHECK (ytd_social_security >= 0)
  `);

  await knex.raw(`
    ALTER TABLE pay_stubs
    ADD CONSTRAINT chk_ytd_medicare CHECK (ytd_medicare >= 0)
  `);

  await knex.raw(`
    ALTER TABLE pay_stubs
    ADD CONSTRAINT chk_ytd_deductions CHECK (ytd_deductions >= 0)
  `);

  await knex.raw(`
    ALTER TABLE pay_stubs
    ADD CONSTRAINT chk_ytd_net_pay CHECK (ytd_net_pay >= 0)
  `);

  await knex.raw(`
    ALTER TABLE pay_stubs
    ADD CONSTRAINT chk_payment_method CHECK (payment_method IN (
        'DIRECT_DEPOSIT', 'CHECK', 'CASH', 'PAYCARD', 'WIRE', 'VENMO', 'ZELLE'
    ))
  `);

  await knex.raw(`
    ALTER TABLE pay_stubs
    ADD CONSTRAINT chk_check_status CHECK (check_status IN (
        'ISSUED', 'DELIVERED', 'CASHED', 'VOID', 'STOP_PAYMENT', 'LOST', 'REISSUED'
    ))
  `);

  await knex.raw(`
    ALTER TABLE pay_stubs
    ADD CONSTRAINT chk_status_ps CHECK (status IN (
        'DRAFT', 'CALCULATED', 'PENDING_APPROVAL', 'APPROVED', 'PAYMENT_PENDING', 'PAID', 'VOID', 'CANCELLED'
    ))
  `);

  await knex.raw(`
    ALTER TABLE pay_stubs
    ADD CONSTRAINT chk_delivery_method CHECK (delivery_method IN ('EMAIL', 'PRINT', 'PORTAL', 'MAIL'))
  `);

  await knex.raw(`
    ALTER TABLE pay_stubs
    ADD CONSTRAINT fk_pay_stub_organization FOREIGN KEY (organization_id) 
        REFERENCES organizations(id) ON DELETE RESTRICT
  `);

  await knex.raw(`
    ALTER TABLE pay_stubs
    ADD CONSTRAINT fk_pay_stub_branch FOREIGN KEY (branch_id) 
        REFERENCES branches(id) ON DELETE RESTRICT
  `);

  await knex.raw(`
    ALTER TABLE pay_stubs
    ADD CONSTRAINT fk_pay_stub_pay_run FOREIGN KEY (pay_run_id) 
        REFERENCES pay_runs(id) ON DELETE RESTRICT
  `);

  await knex.raw(`
    ALTER TABLE pay_stubs
    ADD CONSTRAINT fk_pay_stub_pay_period FOREIGN KEY (pay_period_id) 
        REFERENCES pay_periods(id) ON DELETE RESTRICT
  `);

  await knex.raw(`
    ALTER TABLE pay_stubs
    ADD CONSTRAINT fk_pay_stub_caregiver FOREIGN KEY (caregiver_id) 
        REFERENCES caregivers(id) ON DELETE RESTRICT
  `);

  await knex.raw(`
    ALTER TABLE pay_stubs
    ADD CONSTRAINT fk_pay_stub_timesheet FOREIGN KEY (time_sheet_id) 
        REFERENCES time_sheets(id) ON DELETE RESTRICT
  `);

  await knex.raw(`
    ALTER TABLE pay_stubs
    ADD CONSTRAINT chk_pay_stub_period CHECK (pay_period_start_date <= pay_period_end_date)
  `);

  // Indexes for pay_stubs
  await knex.schema.alterTable('pay_stubs', (table) => {
    table.index(['organization_id', 'pay_date'], 'idx_pay_stubs_organization');
    table.index(['branch_id', 'pay_date'], 'idx_pay_stubs_branch');
    table.index(['pay_run_id'], 'idx_pay_stubs_pay_run');
    table.index(['pay_period_id'], 'idx_pay_stubs_pay_period');
    table.index(['caregiver_id', 'pay_date'], 'idx_pay_stubs_caregiver');
    table.index(['status', 'pay_date'], 'idx_pay_stubs_status');
  });

  await knex.raw('ALTER TABLE pay_stubs ADD CONSTRAINT uq_pay_stubs_number UNIQUE (stub_number)');

  await knex.raw(`
    CREATE INDEX idx_pay_stubs_payment ON pay_stubs(payment_id) WHERE payment_id IS NOT NULL
  `);

  // ============================================================================
  // PAYMENT RECORDS
  // ============================================================================

  await knex.schema.createTable('payment_records', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('organization_id').notNullable();
    table.uuid('branch_id').notNullable();
    
    // References
    table.uuid('pay_run_id').notNullable();
    table.uuid('pay_stub_id').notNullable();
    table.uuid('caregiver_id').notNullable();
    
    // Payment details
    table.string('payment_number', 100).notNullable();
    table.string('payment_method', 50).notNullable();
    table.decimal('payment_amount', 12, 2).notNullable();
    table.date('payment_date').notNullable();
    
    // Direct deposit
    table.uuid('bank_account_id');
    table.string('routing_number', 255); // Encrypted
    table.string('account_number', 255); // Encrypted
    table.string('account_type', 20);
    table.string('transaction_id', 100);
    table.string('trace_number', 100);
    
    // Check
    table.string('check_number', 50);
    table.date('check_date');
    table.string('check_status', 50);
    table.date('check_cleared_date');
    table.string('check_image_url', 500);
    
    // Status
    table.string('status', 50).notNullable().defaultTo('PENDING');
    table.jsonb('status_history').notNullable().defaultTo('[]');
    
    // Processing
    table.timestamp('initiated_at').notNullable();
    table.uuid('initiated_by').notNullable();
    table.timestamp('processed_at');
    table.timestamp('settled_at');
    
    // ACH batch (for direct deposit)
    table.uuid('ach_batch_id');
    table.string('ach_file_id', 100);
    
    // Errors
    table.boolean('has_errors').defaultTo(false);
    table.string('error_code', 50);
    table.text('error_message');
    table.text('error_details');
    
    // Reissue tracking
    table.boolean('is_reissue').defaultTo(false);
    table.uuid('original_payment_id');
    table.text('reissue_reason');
    
    // Metadata
    table.text('notes');
    
    // Standard entity fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').notNullable();
    table.integer('version').notNullable().defaultTo(1);
  });

  // Add constraints to payment_records
  await knex.raw(`
    ALTER TABLE payment_records
    ADD CONSTRAINT chk_payment_amount CHECK (payment_amount >= 0)
  `);

  await knex.raw(`
    ALTER TABLE payment_records
    ADD CONSTRAINT chk_payment_method_pr CHECK (payment_method IN (
        'DIRECT_DEPOSIT', 'CHECK', 'CASH', 'PAYCARD', 'WIRE', 'VENMO', 'ZELLE'
    ))
  `);

  await knex.raw(`
    ALTER TABLE payment_records
    ADD CONSTRAINT chk_account_type CHECK (account_type IN ('CHECKING', 'SAVINGS'))
  `);

  await knex.raw(`
    ALTER TABLE payment_records
    ADD CONSTRAINT chk_check_status_pr CHECK (check_status IN (
        'ISSUED', 'DELIVERED', 'CASHED', 'VOID', 'STOP_PAYMENT', 'LOST', 'REISSUED'
    ))
  `);

  await knex.raw(`
    ALTER TABLE payment_records
    ADD CONSTRAINT chk_status_pr CHECK (status IN (
        'PENDING', 'SCHEDULED', 'PROCESSING', 'SENT', 'CLEARED', 'RETURNED', 'CANCELLED', 'VOIDED', 'FAILED', 'ON_HOLD'
    ))
  `);

  await knex.raw(`
    ALTER TABLE payment_records
    ADD CONSTRAINT fk_payment_organization FOREIGN KEY (organization_id) 
        REFERENCES organizations(id) ON DELETE RESTRICT
  `);

  await knex.raw(`
    ALTER TABLE payment_records
    ADD CONSTRAINT fk_payment_branch FOREIGN KEY (branch_id) 
        REFERENCES branches(id) ON DELETE RESTRICT
  `);

  await knex.raw(`
    ALTER TABLE payment_records
    ADD CONSTRAINT fk_payment_pay_run FOREIGN KEY (pay_run_id) 
        REFERENCES pay_runs(id) ON DELETE RESTRICT
  `);

  await knex.raw(`
    ALTER TABLE payment_records
    ADD CONSTRAINT fk_payment_pay_stub FOREIGN KEY (pay_stub_id) 
        REFERENCES pay_stubs(id) ON DELETE RESTRICT
  `);

  await knex.raw(`
    ALTER TABLE payment_records
    ADD CONSTRAINT fk_payment_caregiver FOREIGN KEY (caregiver_id) 
        REFERENCES caregivers(id) ON DELETE RESTRICT
  `);

  // Indexes for payment_records
  await knex.schema.alterTable('payment_records', (table) => {
    table.index(['organization_id', 'payment_date'], 'idx_payment_records_organization');
    table.index(['branch_id', 'payment_date'], 'idx_payment_records_branch');
    table.index(['pay_run_id'], 'idx_payment_records_pay_run');
    table.index(['pay_stub_id'], 'idx_payment_records_pay_stub');
    table.index(['caregiver_id', 'payment_date'], 'idx_payment_records_caregiver');
    table.index(['status', 'payment_date'], 'idx_payment_records_status');
    table.index(['payment_method', 'status'], 'idx_payment_records_method');
  });

  await knex.raw('ALTER TABLE payment_records ADD CONSTRAINT uq_payment_records_number UNIQUE (payment_number)');

  await knex.raw(`
    CREATE INDEX idx_payment_records_ach_batch ON payment_records(ach_batch_id) WHERE ach_batch_id IS NOT NULL
  `);

  await knex.raw(`
    CREATE INDEX idx_payment_records_errors ON payment_records(organization_id) WHERE has_errors = true
  `);

  await knex.raw(`
    CREATE INDEX idx_payment_records_pending ON payment_records(organization_id, payment_date) 
    WHERE status IN ('PENDING', 'SCHEDULED', 'PROCESSING')
  `);

  // ============================================================================
  // ACH BATCHES
  // ============================================================================

  await knex.schema.createTable('ach_batches', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('organization_id').notNullable();
    
    // Batch details
    table.string('batch_number', 100).notNullable();
    table.date('batch_date').notNullable();
    table.date('effective_date').notNullable();
    
    // Company (employer) info
    table.string('company_name', 200).notNullable();
    table.string('company_id', 50).notNullable();
    table.string('company_entry_description', 100).notNullable();
    
    // Payments
    table.jsonb('payment_ids').notNullable().defaultTo('[]');
    table.integer('transaction_count').notNullable().defaultTo(0);
    table.decimal('total_debit_amount', 14, 2).notNullable().defaultTo(0);
    table.decimal('total_credit_amount', 14, 2).notNullable().defaultTo(0);
    
    // File generation
    table.string('ach_file_url', 500);
    table.string('ach_file_format', 50).notNullable();
    table.timestamp('ach_file_generated_at');
    table.string('ach_file_hash', 255);
    
    // Processing
    table.string('status', 50).notNullable().defaultTo('DRAFT');
    table.timestamp('submitted_at');
    table.uuid('submitted_by');
    
    // Bank info
    table.string('originating_bank_routing_number', 20).notNullable();
    table.string('originating_bank_account_number', 255).notNullable(); // Encrypted
    
    // Settlement
    table.timestamp('settled_at');
    table.string('settlement_confirmation', 200);
    
    // Errors
    table.boolean('has_returns').defaultTo(false);
    table.integer('return_count').defaultTo(0);
    table.jsonb('returns').notNullable().defaultTo('[]');
    
    // Metadata
    table.text('notes');
    
    // Standard entity fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').notNullable();
    table.integer('version').notNullable().defaultTo(1);
  });

  // Add constraints to ach_batches
  await knex.raw(`
    ALTER TABLE ach_batches
    ADD CONSTRAINT chk_transaction_count CHECK (transaction_count >= 0)
  `);

  await knex.raw(`
    ALTER TABLE ach_batches
    ADD CONSTRAINT chk_total_debit_amount CHECK (total_debit_amount >= 0)
  `);

  await knex.raw(`
    ALTER TABLE ach_batches
    ADD CONSTRAINT chk_total_credit_amount CHECK (total_credit_amount >= 0)
  `);

  await knex.raw(`
    ALTER TABLE ach_batches
    ADD CONSTRAINT chk_ach_file_format CHECK (ach_file_format IN ('NACHA', 'CCD', 'PPD', 'CTX'))
  `);

  await knex.raw(`
    ALTER TABLE ach_batches
    ADD CONSTRAINT chk_ach_status CHECK (status IN (
        'DRAFT', 'READY', 'SUBMITTED', 'PROCESSING', 'SETTLED', 'COMPLETED', 'PARTIAL_RETURN', 'FAILED'
    ))
  `);

  await knex.raw(`
    ALTER TABLE ach_batches
    ADD CONSTRAINT chk_return_count CHECK (return_count >= 0)
  `);

  await knex.raw(`
    ALTER TABLE ach_batches
    ADD CONSTRAINT fk_ach_batch_organization FOREIGN KEY (organization_id) 
        REFERENCES organizations(id) ON DELETE RESTRICT
  `);

  await knex.raw(`
    ALTER TABLE ach_batches
    ADD CONSTRAINT chk_ach_batch_dates CHECK (batch_date <= effective_date)
  `);

  // Indexes for ach_batches
  await knex.schema.alterTable('ach_batches', (table) => {
    table.index(['organization_id', 'batch_date'], 'idx_ach_batches_organization');
    table.index(['status', 'effective_date'], 'idx_ach_batches_status');
    table.index(['effective_date'], 'idx_ach_batches_effective');
  });

  await knex.raw('ALTER TABLE ach_batches ADD CONSTRAINT uq_ach_batches_number UNIQUE (batch_number)');

  await knex.raw(`
    CREATE INDEX idx_ach_batches_returns ON ach_batches(organization_id) WHERE has_returns = true
  `);

  // ============================================================================
  // TRIGGERS
  // ============================================================================

  // Update triggers for updated_at and version
  await knex.raw(`
    CREATE OR REPLACE FUNCTION update_payroll_entity_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        NEW.version = OLD.version + 1;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `);

  await knex.raw(`
    CREATE TRIGGER trigger_pay_periods_updated_at
        BEFORE UPDATE ON pay_periods
        FOR EACH ROW
        EXECUTE FUNCTION update_payroll_entity_updated_at()
  `);

  await knex.raw(`
    CREATE TRIGGER trigger_time_sheets_updated_at
        BEFORE UPDATE ON time_sheets
        FOR EACH ROW
        EXECUTE FUNCTION update_payroll_entity_updated_at()
  `);

  await knex.raw(`
    CREATE TRIGGER trigger_pay_runs_updated_at
        BEFORE UPDATE ON pay_runs
        FOR EACH ROW
        EXECUTE FUNCTION update_payroll_entity_updated_at()
  `);

  await knex.raw(`
    CREATE TRIGGER trigger_pay_stubs_updated_at
        BEFORE UPDATE ON pay_stubs
        FOR EACH ROW
        EXECUTE FUNCTION update_payroll_entity_updated_at()
  `);

  await knex.raw(`
    CREATE TRIGGER trigger_payment_records_updated_at
        BEFORE UPDATE ON payment_records
        FOR EACH ROW
        EXECUTE FUNCTION update_payroll_entity_updated_at()
  `);

  await knex.raw(`
    CREATE TRIGGER trigger_ach_batches_updated_at
        BEFORE UPDATE ON ach_batches
        FOR EACH ROW
        EXECUTE FUNCTION update_payroll_entity_updated_at()
  `);
}

export async function down(knex: Knex): Promise<void> {
  // Drop triggers and functions
  await knex.raw('DROP TRIGGER IF EXISTS trigger_ach_batches_updated_at ON ach_batches');
  await knex.raw('DROP TRIGGER IF EXISTS trigger_payment_records_updated_at ON payment_records');
  await knex.raw('DROP TRIGGER IF EXISTS trigger_pay_stubs_updated_at ON pay_stubs');
  await knex.raw('DROP TRIGGER IF EXISTS trigger_pay_runs_updated_at ON pay_runs');
  await knex.raw('DROP TRIGGER IF EXISTS trigger_time_sheets_updated_at ON time_sheets');
  await knex.raw('DROP TRIGGER IF EXISTS trigger_pay_periods_updated_at ON pay_periods');
  await knex.raw('DROP FUNCTION IF EXISTS update_payroll_entity_updated_at()');
  
  // Drop tables
  await knex.schema.dropTableIfExists('ach_batches');
  await knex.schema.dropTableIfExists('payment_records');
  await knex.schema.dropTableIfExists('pay_stubs');
  await knex.schema.dropTableIfExists('caregiver_deductions');
  await knex.schema.dropTableIfExists('tax_configurations');
  await knex.schema.dropTableIfExists('pay_runs');
  await knex.schema.dropTableIfExists('time_sheets');
  await knex.schema.dropTableIfExists('pay_periods');
}