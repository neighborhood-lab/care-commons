-- Migration: Payroll Processing
-- Description: Creates tables for pay periods, timesheets, pay runs, pay stubs, deductions, and payments
-- Version: 012
-- Date: 2025-10-29

-- ============================================================================
-- PAY PERIODS
-- ============================================================================

CREATE TABLE IF NOT EXISTS pay_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    branch_id UUID,
    
    -- Period identity
    period_number INTEGER NOT NULL CHECK (period_number > 0),
    period_year INTEGER NOT NULL CHECK (period_year BETWEEN 2000 AND 2100),
    period_type VARCHAR(50) NOT NULL CHECK (period_type IN (
        'WEEKLY', 'BI_WEEKLY', 'SEMI_MONTHLY', 'MONTHLY', 'DAILY', 'CUSTOM'
    )),
    
    -- Date range
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    pay_date DATE NOT NULL,
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT' CHECK (status IN (
        'DRAFT', 'OPEN', 'LOCKED', 'PROCESSING', 'PENDING_APPROVAL', 'APPROVED', 'PAID', 'CLOSED', 'CANCELLED'
    )),
    status_history JSONB NOT NULL DEFAULT '[]',
    
    -- Lock-down dates
    cutoff_date DATE,
    approval_deadline DATE,
    
    -- Pay run reference
    pay_run_id UUID,
    
    -- Statistics
    total_caregivers INTEGER CHECK (total_caregivers >= 0),
    total_hours DECIMAL(12, 2) CHECK (total_hours >= 0),
    total_gross_pay DECIMAL(12, 2) CHECK (total_gross_pay >= 0),
    total_net_pay DECIMAL(12, 2) CHECK (total_net_pay >= 0),
    total_tax_withheld DECIMAL(12, 2) CHECK (total_tax_withheld >= 0),
    total_deductions DECIMAL(12, 2) CHECK (total_deductions >= 0),
    
    -- Metadata
    notes TEXT,
    fiscal_quarter INTEGER CHECK (fiscal_quarter BETWEEN 1 AND 4),
    fiscal_year INTEGER CHECK (fiscal_year BETWEEN 2000 AND 2100),
    
    -- Standard entity fields
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by UUID NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    
    CONSTRAINT fk_pay_period_organization FOREIGN KEY (organization_id) 
        REFERENCES organizations(id) ON DELETE RESTRICT,
    CONSTRAINT fk_pay_period_branch FOREIGN KEY (branch_id) 
        REFERENCES branches(id) ON DELETE RESTRICT,
    CONSTRAINT chk_pay_period_dates CHECK (start_date <= end_date),
    CONSTRAINT chk_pay_period_cutoff CHECK (cutoff_date IS NULL OR cutoff_date >= end_date),
    CONSTRAINT uq_pay_period_number UNIQUE (organization_id, period_year, period_number)
);

-- Indexes for pay_periods
CREATE INDEX idx_pay_periods_organization ON pay_periods(organization_id, start_date DESC);
CREATE INDEX idx_pay_periods_branch ON pay_periods(branch_id, start_date DESC) WHERE branch_id IS NOT NULL;
CREATE INDEX idx_pay_periods_status ON pay_periods(status, pay_date);
CREATE INDEX idx_pay_periods_date_range ON pay_periods(organization_id, start_date, end_date);
CREATE INDEX idx_pay_periods_fiscal ON pay_periods(organization_id, fiscal_year, fiscal_quarter) 
    WHERE fiscal_year IS NOT NULL;

-- ============================================================================
-- TIME SHEETS
-- ============================================================================

CREATE TABLE IF NOT EXISTS time_sheets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    branch_id UUID NOT NULL,
    
    -- Period and caregiver
    pay_period_id UUID NOT NULL,
    caregiver_id UUID NOT NULL,
    caregiver_name VARCHAR(200) NOT NULL,
    caregiver_employee_id VARCHAR(100) NOT NULL,
    
    -- Time entries (stored as JSONB array)
    time_entries JSONB NOT NULL DEFAULT '[]',
    
    -- Hours summary
    regular_hours DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (regular_hours >= 0),
    overtime_hours DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (overtime_hours >= 0),
    double_time_hours DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (double_time_hours >= 0),
    pto_hours DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (pto_hours >= 0),
    holiday_hours DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (holiday_hours >= 0),
    sick_hours DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (sick_hours >= 0),
    other_hours DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (other_hours >= 0),
    total_hours DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (total_hours >= 0),
    
    -- Rates
    regular_rate DECIMAL(10, 2) NOT NULL CHECK (regular_rate >= 0),
    overtime_rate DECIMAL(10, 2) NOT NULL CHECK (overtime_rate >= 0),
    double_time_rate DECIMAL(10, 2) NOT NULL CHECK (double_time_rate >= 0),
    
    -- Earnings
    regular_earnings DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (regular_earnings >= 0),
    overtime_earnings DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (overtime_earnings >= 0),
    double_time_earnings DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (double_time_earnings >= 0),
    pto_earnings DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (pto_earnings >= 0),
    holiday_earnings DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (holiday_earnings >= 0),
    sick_earnings DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (sick_earnings >= 0),
    other_earnings DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (other_earnings >= 0),
    gross_earnings DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (gross_earnings >= 0),
    
    -- Additional payments (stored as JSONB arrays)
    bonuses JSONB NOT NULL DEFAULT '[]',
    reimbursements JSONB NOT NULL DEFAULT '[]',
    adjustments JSONB NOT NULL DEFAULT '[]',
    total_adjustments DECIMAL(12, 2) NOT NULL DEFAULT 0,
    
    -- Final gross
    total_gross_pay DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (total_gross_pay >= 0),
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT' CHECK (status IN (
        'DRAFT', 'SUBMITTED', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'PROCESSING', 'PAID', 'VOIDED'
    )),
    status_history JSONB NOT NULL DEFAULT '[]',
    
    -- Approval
    submitted_at TIMESTAMP,
    submitted_by UUID,
    approved_at TIMESTAMP,
    approved_by UUID,
    approval_notes TEXT,
    
    -- Validation
    has_discrepancies BOOLEAN DEFAULT false,
    discrepancy_flags JSONB NOT NULL DEFAULT '[]',
    
    -- Links
    evv_record_ids JSONB NOT NULL DEFAULT '[]',
    visit_ids JSONB NOT NULL DEFAULT '[]',
    
    -- Metadata
    notes TEXT,
    review_notes TEXT,
    
    -- Standard entity fields
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by UUID NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    deleted_at TIMESTAMP,
    deleted_by UUID,
    
    CONSTRAINT fk_timesheet_organization FOREIGN KEY (organization_id) 
        REFERENCES organizations(id) ON DELETE RESTRICT,
    CONSTRAINT fk_timesheet_branch FOREIGN KEY (branch_id) 
        REFERENCES branches(id) ON DELETE RESTRICT,
    CONSTRAINT fk_timesheet_pay_period FOREIGN KEY (pay_period_id) 
        REFERENCES pay_periods(id) ON DELETE RESTRICT,
    CONSTRAINT fk_timesheet_caregiver FOREIGN KEY (caregiver_id) 
        REFERENCES caregivers(id) ON DELETE RESTRICT,
    CONSTRAINT uq_timesheet_caregiver_period UNIQUE (pay_period_id, caregiver_id)
);

-- Indexes for time_sheets
CREATE INDEX idx_timesheets_organization ON time_sheets(organization_id, created_at DESC) 
    WHERE deleted_at IS NULL;
CREATE INDEX idx_timesheets_branch ON time_sheets(branch_id, created_at DESC) 
    WHERE deleted_at IS NULL;
CREATE INDEX idx_timesheets_pay_period ON time_sheets(pay_period_id, status) 
    WHERE deleted_at IS NULL;
CREATE INDEX idx_timesheets_caregiver ON time_sheets(caregiver_id, pay_period_id) 
    WHERE deleted_at IS NULL;
CREATE INDEX idx_timesheets_status ON time_sheets(status, pay_period_id) 
    WHERE deleted_at IS NULL;
CREATE INDEX idx_timesheets_approval ON time_sheets(organization_id) 
    WHERE status IN ('SUBMITTED', 'PENDING_REVIEW') AND deleted_at IS NULL;
CREATE INDEX idx_timesheets_discrepancies ON time_sheets(organization_id) 
    WHERE has_discrepancies = true AND deleted_at IS NULL;

-- ============================================================================
-- PAY RUNS
-- ============================================================================

CREATE TABLE IF NOT EXISTS pay_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    branch_id UUID,
    
    -- Period
    pay_period_id UUID NOT NULL,
    pay_period_start_date DATE NOT NULL,
    pay_period_end_date DATE NOT NULL,
    pay_date DATE NOT NULL,
    
    -- Run identity
    run_number VARCHAR(100) NOT NULL,
    run_type VARCHAR(50) NOT NULL CHECK (run_type IN (
        'REGULAR', 'OFF_CYCLE', 'CORRECTION', 'BONUS', 'FINAL', 'ADVANCE', 'RETRO'
    )),
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT' CHECK (status IN (
        'DRAFT', 'CALCULATING', 'CALCULATED', 'PENDING_REVIEW', 'PENDING_APPROVAL', 
        'APPROVED', 'PROCESSING', 'PROCESSED', 'FUNDED', 'COMPLETED', 'FAILED', 'CANCELLED'
    )),
    status_history JSONB NOT NULL DEFAULT '[]',
    
    -- Processing
    initiated_at TIMESTAMP,
    initiated_by UUID,
    calculated_at TIMESTAMP,
    approved_at TIMESTAMP,
    approved_by UUID,
    processed_at TIMESTAMP,
    processed_by UUID,
    
    -- Pay stubs
    pay_stub_ids JSONB NOT NULL DEFAULT '[]',
    total_pay_stubs INTEGER NOT NULL DEFAULT 0 CHECK (total_pay_stubs >= 0),
    
    -- Aggregates
    total_caregivers INTEGER NOT NULL DEFAULT 0 CHECK (total_caregivers >= 0),
    total_hours DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (total_hours >= 0),
    total_gross_pay DECIMAL(14, 2) NOT NULL DEFAULT 0 CHECK (total_gross_pay >= 0),
    total_deductions DECIMAL(14, 2) NOT NULL DEFAULT 0 CHECK (total_deductions >= 0),
    total_tax_withheld DECIMAL(14, 2) NOT NULL DEFAULT 0 CHECK (total_tax_withheld >= 0),
    total_net_pay DECIMAL(14, 2) NOT NULL DEFAULT 0 CHECK (total_net_pay >= 0),
    
    -- Tax totals
    federal_income_tax DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (federal_income_tax >= 0),
    state_income_tax DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (state_income_tax >= 0),
    social_security_tax DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (social_security_tax >= 0),
    medicare_tax DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (medicare_tax >= 0),
    local_tax DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (local_tax >= 0),
    
    -- Other deductions
    benefits_deductions DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (benefits_deductions >= 0),
    garnishments DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (garnishments >= 0),
    other_deductions DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (other_deductions >= 0),
    
    -- Payment summary
    direct_deposit_count INTEGER NOT NULL DEFAULT 0 CHECK (direct_deposit_count >= 0),
    direct_deposit_amount DECIMAL(14, 2) NOT NULL DEFAULT 0 CHECK (direct_deposit_amount >= 0),
    check_count INTEGER NOT NULL DEFAULT 0 CHECK (check_count >= 0),
    check_amount DECIMAL(14, 2) NOT NULL DEFAULT 0 CHECK (check_amount >= 0),
    cash_count INTEGER NOT NULL DEFAULT 0 CHECK (cash_count >= 0),
    cash_amount DECIMAL(14, 2) NOT NULL DEFAULT 0 CHECK (cash_amount >= 0),
    
    -- Files
    payroll_register_url VARCHAR(500),
    tax_report_url VARCHAR(500),
    export_files JSONB NOT NULL DEFAULT '[]',
    
    -- Compliance
    compliance_checks JSONB NOT NULL DEFAULT '[]',
    compliance_passed BOOLEAN DEFAULT true,
    
    -- Errors and issues
    has_errors BOOLEAN DEFAULT false,
    errors JSONB NOT NULL DEFAULT '[]',
    warnings JSONB NOT NULL DEFAULT '[]',
    
    -- Metadata
    notes TEXT,
    internal_notes TEXT,
    
    -- Standard entity fields
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by UUID NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    
    CONSTRAINT fk_pay_run_organization FOREIGN KEY (organization_id) 
        REFERENCES organizations(id) ON DELETE RESTRICT,
    CONSTRAINT fk_pay_run_branch FOREIGN KEY (branch_id) 
        REFERENCES branches(id) ON DELETE RESTRICT,
    CONSTRAINT fk_pay_run_pay_period FOREIGN KEY (pay_period_id) 
        REFERENCES pay_periods(id) ON DELETE RESTRICT,
    CONSTRAINT chk_pay_run_period CHECK (pay_period_start_date <= pay_period_end_date)
);

-- Indexes for pay_runs
CREATE UNIQUE INDEX idx_pay_runs_number ON pay_runs(run_number);
CREATE INDEX idx_pay_runs_organization ON pay_runs(organization_id, created_at DESC);
CREATE INDEX idx_pay_runs_branch ON pay_runs(branch_id, created_at DESC) WHERE branch_id IS NOT NULL;
CREATE INDEX idx_pay_runs_pay_period ON pay_runs(pay_period_id);
CREATE INDEX idx_pay_runs_status ON pay_runs(status, pay_date);
CREATE INDEX idx_pay_runs_approval ON pay_runs(organization_id) 
    WHERE status IN ('PENDING_REVIEW', 'PENDING_APPROVAL');

-- ============================================================================
-- TAX CONFIGURATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS tax_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    caregiver_id UUID NOT NULL,
    
    -- Federal
    federal_filing_status VARCHAR(50) NOT NULL CHECK (federal_filing_status IN (
        'SINGLE', 'MARRIED_JOINTLY', 'MARRIED_SEPARATELY', 'HEAD_OF_HOUSEHOLD', 'QUALIFYING_WIDOW'
    )),
    federal_allowances INTEGER NOT NULL DEFAULT 0 CHECK (federal_allowances >= 0),
    federal_extra_withholding DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (federal_extra_withholding >= 0),
    federal_exempt BOOLEAN DEFAULT false,
    
    -- W-4 fields (2020+ format)
    w4_step_2 BOOLEAN DEFAULT false,
    w4_step_3_dependents DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (w4_step_3_dependents >= 0),
    w4_step_4a_other_income DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (w4_step_4a_other_income >= 0),
    w4_step_4b_deductions DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (w4_step_4b_deductions >= 0),
    w4_step_4c_extra_withholding DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (w4_step_4c_extra_withholding >= 0),
    
    -- State
    state_filing_status VARCHAR(50) NOT NULL CHECK (state_filing_status IN (
        'SINGLE', 'MARRIED', 'MARRIED_JOINTLY', 'MARRIED_SEPARATELY', 'HEAD_OF_HOUSEHOLD', 'EXEMPT'
    )),
    state_allowances INTEGER NOT NULL DEFAULT 0 CHECK (state_allowances >= 0),
    state_extra_withholding DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (state_extra_withholding >= 0),
    state_exempt BOOLEAN DEFAULT false,
    state_residence VARCHAR(2) NOT NULL,
    
    -- Local
    local_tax_jurisdiction VARCHAR(100),
    local_exempt BOOLEAN DEFAULT false,
    
    -- Status
    effective_from DATE NOT NULL,
    effective_to DATE,
    last_updated TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by UUID NOT NULL,
    
    -- W-4 form
    w4_on_file BOOLEAN DEFAULT false,
    w4_file_date DATE,
    w4_document_id UUID,
    
    -- State form
    state_form_on_file BOOLEAN DEFAULT false,
    state_form_date DATE,
    state_form_document_id UUID,
    
    -- Standard entity fields
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    
    CONSTRAINT fk_tax_config_organization FOREIGN KEY (organization_id) 
        REFERENCES organizations(id) ON DELETE RESTRICT,
    CONSTRAINT fk_tax_config_caregiver FOREIGN KEY (caregiver_id) 
        REFERENCES caregivers(id) ON DELETE RESTRICT,
    CONSTRAINT chk_tax_config_dates CHECK (
        effective_to IS NULL OR effective_from <= effective_to
    )
);

-- Indexes for tax_configurations
CREATE INDEX idx_tax_configs_organization ON tax_configurations(organization_id);
CREATE INDEX idx_tax_configs_caregiver ON tax_configurations(caregiver_id, effective_from DESC);
CREATE INDEX idx_tax_configs_effective ON tax_configurations(caregiver_id, effective_from, effective_to);
CREATE INDEX idx_tax_configs_state ON tax_configurations(state_residence);

-- ============================================================================
-- CAREGIVER DEDUCTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS caregiver_deductions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    caregiver_id UUID NOT NULL,
    
    -- Deduction type
    deduction_type VARCHAR(100) NOT NULL CHECK (deduction_type IN (
        'FEDERAL_INCOME_TAX', 'STATE_INCOME_TAX', 'LOCAL_INCOME_TAX',
        'SOCIAL_SECURITY', 'MEDICARE', 'ADDITIONAL_MEDICARE',
        'HEALTH_INSURANCE', 'DENTAL_INSURANCE', 'VISION_INSURANCE', 'LIFE_INSURANCE', 'DISABILITY_INSURANCE',
        'RETIREMENT_401K', 'RETIREMENT_403B', 'RETIREMENT_ROTH',
        'HSA', 'FSA_HEALTHCARE', 'FSA_DEPENDENT_CARE', 'COMMUTER_BENEFITS',
        'UNION_DUES',
        'GARNISHMENT_CHILD_SUPPORT', 'GARNISHMENT_TAX_LEVY', 'GARNISHMENT_CREDITOR', 'GARNISHMENT_STUDENT_LOAN',
        'LOAN_REPAYMENT', 'ADVANCE_REPAYMENT', 'UNIFORM', 'EQUIPMENT', 'OTHER'
    )),
    deduction_code VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    
    -- Amount
    amount DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (amount >= 0),
    calculation_method VARCHAR(50) NOT NULL CHECK (calculation_method IN (
        'FIXED', 'PERCENTAGE', 'PERCENTAGE_OF_NET', 'GRADUATED', 'FORMULA'
    )),
    percentage DECIMAL(5, 2) CHECK (percentage >= 0 AND percentage <= 100),
    
    -- Limits
    has_limit BOOLEAN DEFAULT false,
    yearly_limit DECIMAL(10, 2) CHECK (yearly_limit IS NULL OR yearly_limit >= 0),
    year_to_date_amount DECIMAL(10, 2) DEFAULT 0 CHECK (year_to_date_amount >= 0),
    remaining_amount DECIMAL(10, 2) CHECK (remaining_amount IS NULL OR remaining_amount >= 0),
    
    -- Tax treatment
    is_pre_tax BOOLEAN DEFAULT false,
    is_post_tax BOOLEAN DEFAULT false,
    is_statutory BOOLEAN DEFAULT false,
    
    -- Employer match (for retirement, etc.)
    employer_match DECIMAL(10, 2) CHECK (employer_match IS NULL OR employer_match >= 0),
    employer_match_percentage DECIMAL(5, 2) CHECK (employer_match_percentage IS NULL OR 
        (employer_match_percentage >= 0 AND employer_match_percentage <= 100)),
    
    -- Garnishment specifics
    garnishment_order JSONB,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    effective_from DATE,
    effective_to DATE,
    
    CONSTRAINT fk_deduction_caregiver FOREIGN KEY (caregiver_id) 
        REFERENCES caregivers(id) ON DELETE RESTRICT,
    CONSTRAINT chk_deduction_dates CHECK (
        effective_to IS NULL OR effective_from IS NULL OR effective_from <= effective_to
    ),
    CONSTRAINT chk_deduction_calculation CHECK (
        (calculation_method IN ('FIXED', 'GRADUATED', 'FORMULA') AND percentage IS NULL) OR
        (calculation_method IN ('PERCENTAGE', 'PERCENTAGE_OF_NET') AND percentage IS NOT NULL)
    )
);

-- Indexes for caregiver_deductions
CREATE INDEX idx_deductions_caregiver ON caregiver_deductions(caregiver_id, is_active);
CREATE INDEX idx_deductions_type ON caregiver_deductions(deduction_type, is_active);
CREATE INDEX idx_deductions_effective ON caregiver_deductions(caregiver_id, effective_from, effective_to) 
    WHERE is_active = true;

-- ============================================================================
-- PAY STUBS
-- ============================================================================

CREATE TABLE IF NOT EXISTS pay_stubs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    branch_id UUID NOT NULL,
    
    -- References
    pay_run_id UUID NOT NULL,
    pay_period_id UUID NOT NULL,
    caregiver_id UUID NOT NULL,
    time_sheet_id UUID NOT NULL,
    
    -- Caregiver info
    caregiver_name VARCHAR(200) NOT NULL,
    caregiver_employee_id VARCHAR(100) NOT NULL,
    caregiver_address JSONB,
    
    -- Period
    pay_period_start_date DATE NOT NULL,
    pay_period_end_date DATE NOT NULL,
    pay_date DATE NOT NULL,
    
    -- Stub number
    stub_number VARCHAR(100) NOT NULL,
    
    -- Hours
    regular_hours DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (regular_hours >= 0),
    overtime_hours DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (overtime_hours >= 0),
    double_time_hours DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (double_time_hours >= 0),
    pto_hours DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (pto_hours >= 0),
    holiday_hours DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (holiday_hours >= 0),
    sick_hours DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (sick_hours >= 0),
    other_hours DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (other_hours >= 0),
    total_hours DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (total_hours >= 0),
    
    -- Earnings
    regular_pay DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (regular_pay >= 0),
    overtime_pay DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (overtime_pay >= 0),
    double_time_pay DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (double_time_pay >= 0),
    pto_pay DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (pto_pay >= 0),
    holiday_pay DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (holiday_pay >= 0),
    sick_pay DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (sick_pay >= 0),
    other_pay DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (other_pay >= 0),
    
    -- Additional earnings
    bonuses DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (bonuses >= 0),
    commissions DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (commissions >= 0),
    reimbursements DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (reimbursements >= 0),
    retroactive_pay DECIMAL(12, 2) NOT NULL DEFAULT 0,
    other_earnings DECIMAL(12, 2) NOT NULL DEFAULT 0,
    
    -- Gross pay
    current_gross_pay DECIMAL(12, 2) NOT NULL CHECK (current_gross_pay >= 0),
    year_to_date_gross_pay DECIMAL(14, 2) NOT NULL CHECK (year_to_date_gross_pay >= 0),
    
    -- Deductions (detailed array)
    deductions JSONB NOT NULL DEFAULT '[]',
    
    -- Tax withholdings
    federal_income_tax DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (federal_income_tax >= 0),
    state_income_tax DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (state_income_tax >= 0),
    local_income_tax DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (local_income_tax >= 0),
    social_security_tax DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (social_security_tax >= 0),
    medicare_tax DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (medicare_tax >= 0),
    additional_medicare_tax DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (additional_medicare_tax >= 0),
    total_tax_withheld DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (total_tax_withheld >= 0),
    
    -- Other deductions
    health_insurance DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (health_insurance >= 0),
    dental_insurance DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (dental_insurance >= 0),
    vision_insurance DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (vision_insurance >= 0),
    life_insurance DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (life_insurance >= 0),
    retirement_401k DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (retirement_401k >= 0),
    retirement_roth DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (retirement_roth >= 0),
    fsa_healthcare DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (fsa_healthcare >= 0),
    fsa_dependent_care DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (fsa_dependent_care >= 0),
    hsa DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (hsa >= 0),
    garnishments DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (garnishments >= 0),
    union_dues DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (union_dues >= 0),
    other_deductions DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (other_deductions >= 0),
    total_other_deductions DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (total_other_deductions >= 0),
    
    -- Net pay
    current_net_pay DECIMAL(12, 2) NOT NULL CHECK (current_net_pay >= 0),
    year_to_date_net_pay DECIMAL(14, 2) NOT NULL CHECK (year_to_date_net_pay >= 0),
    
    -- Year-to-date totals
    ytd_hours DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (ytd_hours >= 0),
    ytd_gross_pay DECIMAL(14, 2) NOT NULL DEFAULT 0 CHECK (ytd_gross_pay >= 0),
    ytd_federal_tax DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (ytd_federal_tax >= 0),
    ytd_state_tax DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (ytd_state_tax >= 0),
    ytd_social_security DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (ytd_social_security >= 0),
    ytd_medicare DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (ytd_medicare >= 0),
    ytd_deductions DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (ytd_deductions >= 0),
    ytd_net_pay DECIMAL(14, 2) NOT NULL DEFAULT 0 CHECK (ytd_net_pay >= 0),
    
    -- Payment method
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN (
        'DIRECT_DEPOSIT', 'CHECK', 'CASH', 'PAYCARD', 'WIRE', 'VENMO', 'ZELLE'
    )),
    payment_id UUID,
    
    -- Bank info (for direct deposit)
    bank_account_id UUID,
    bank_account_last4 VARCHAR(4),
    
    -- Check info
    check_number VARCHAR(50),
    check_date DATE,
    check_status VARCHAR(50) CHECK (check_status IN (
        'ISSUED', 'DELIVERED', 'CASHED', 'VOID', 'STOP_PAYMENT', 'LOST', 'REISSUED'
    )),
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT' CHECK (status IN (
        'DRAFT', 'CALCULATED', 'PENDING_APPROVAL', 'APPROVED', 'PAYMENT_PENDING', 'PAID', 'VOID', 'CANCELLED'
    )),
    status_history JSONB NOT NULL DEFAULT '[]',
    
    -- Approval
    calculated_at TIMESTAMP NOT NULL,
    calculated_by UUID,
    approved_at TIMESTAMP,
    approved_by UUID,
    
    -- Delivery
    delivered_at TIMESTAMP,
    delivery_method VARCHAR(50) CHECK (delivery_method IN ('EMAIL', 'PRINT', 'PORTAL', 'MAIL')),
    viewed_at TIMESTAMP,
    
    -- Documents
    pdf_url VARCHAR(500),
    pdf_generated_at TIMESTAMP,
    
    -- Flags
    is_void BOOLEAN DEFAULT false,
    void_reason TEXT,
    voided_at TIMESTAMP,
    voided_by UUID,
    
    -- Metadata
    notes TEXT,
    internal_notes TEXT,
    
    -- Standard entity fields
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by UUID NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    
    CONSTRAINT fk_pay_stub_organization FOREIGN KEY (organization_id) 
        REFERENCES organizations(id) ON DELETE RESTRICT,
    CONSTRAINT fk_pay_stub_branch FOREIGN KEY (branch_id) 
        REFERENCES branches(id) ON DELETE RESTRICT,
    CONSTRAINT fk_pay_stub_pay_run FOREIGN KEY (pay_run_id) 
        REFERENCES pay_runs(id) ON DELETE RESTRICT,
    CONSTRAINT fk_pay_stub_pay_period FOREIGN KEY (pay_period_id) 
        REFERENCES pay_periods(id) ON DELETE RESTRICT,
    CONSTRAINT fk_pay_stub_caregiver FOREIGN KEY (caregiver_id) 
        REFERENCES caregivers(id) ON DELETE RESTRICT,
    CONSTRAINT fk_pay_stub_timesheet FOREIGN KEY (time_sheet_id) 
        REFERENCES time_sheets(id) ON DELETE RESTRICT,
    CONSTRAINT chk_pay_stub_period CHECK (pay_period_start_date <= pay_period_end_date)
);

-- Indexes for pay_stubs
CREATE UNIQUE INDEX idx_pay_stubs_number ON pay_stubs(stub_number);
CREATE INDEX idx_pay_stubs_organization ON pay_stubs(organization_id, pay_date DESC);
CREATE INDEX idx_pay_stubs_branch ON pay_stubs(branch_id, pay_date DESC);
CREATE INDEX idx_pay_stubs_pay_run ON pay_stubs(pay_run_id);
CREATE INDEX idx_pay_stubs_pay_period ON pay_stubs(pay_period_id);
CREATE INDEX idx_pay_stubs_caregiver ON pay_stubs(caregiver_id, pay_date DESC);
CREATE INDEX idx_pay_stubs_status ON pay_stubs(status, pay_date);
CREATE INDEX idx_pay_stubs_payment ON pay_stubs(payment_id) WHERE payment_id IS NOT NULL;

-- ============================================================================
-- PAYMENT RECORDS
-- ============================================================================

CREATE TABLE IF NOT EXISTS payment_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    branch_id UUID NOT NULL,
    
    -- References
    pay_run_id UUID NOT NULL,
    pay_stub_id UUID NOT NULL,
    caregiver_id UUID NOT NULL,
    
    -- Payment details
    payment_number VARCHAR(100) NOT NULL,
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN (
        'DIRECT_DEPOSIT', 'CHECK', 'CASH', 'PAYCARD', 'WIRE', 'VENMO', 'ZELLE'
    )),
    payment_amount DECIMAL(12, 2) NOT NULL CHECK (payment_amount >= 0),
    payment_date DATE NOT NULL,
    
    -- Direct deposit
    bank_account_id UUID,
    routing_number VARCHAR(255), -- Encrypted
    account_number VARCHAR(255), -- Encrypted
    account_type VARCHAR(20) CHECK (account_type IN ('CHECKING', 'SAVINGS')),
    transaction_id VARCHAR(100),
    trace_number VARCHAR(100),
    
    -- Check
    check_number VARCHAR(50),
    check_date DATE,
    check_status VARCHAR(50) CHECK (check_status IN (
        'ISSUED', 'DELIVERED', 'CASHED', 'VOID', 'STOP_PAYMENT', 'LOST', 'REISSUED'
    )),
    check_cleared_date DATE,
    check_image_url VARCHAR(500),
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN (
        'PENDING', 'SCHEDULED', 'PROCESSING', 'SENT', 'CLEARED', 'RETURNED', 'CANCELLED', 'VOIDED', 'FAILED', 'ON_HOLD'
    )),
    status_history JSONB NOT NULL DEFAULT '[]',
    
    -- Processing
    initiated_at TIMESTAMP NOT NULL,
    initiated_by UUID NOT NULL,
    processed_at TIMESTAMP,
    settled_at TIMESTAMP,
    
    -- ACH batch (for direct deposit)
    ach_batch_id UUID,
    ach_file_id VARCHAR(100),
    
    -- Errors
    has_errors BOOLEAN DEFAULT false,
    error_code VARCHAR(50),
    error_message TEXT,
    error_details TEXT,
    
    -- Reissue tracking
    is_reissue BOOLEAN DEFAULT false,
    original_payment_id UUID,
    reissue_reason TEXT,
    
    -- Metadata
    notes TEXT,
    
    -- Standard entity fields
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by UUID NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    
    CONSTRAINT fk_payment_organization FOREIGN KEY (organization_id) 
        REFERENCES organizations(id) ON DELETE RESTRICT,
    CONSTRAINT fk_payment_branch FOREIGN KEY (branch_id) 
        REFERENCES branches(id) ON DELETE RESTRICT,
    CONSTRAINT fk_payment_pay_run FOREIGN KEY (pay_run_id) 
        REFERENCES pay_runs(id) ON DELETE RESTRICT,
    CONSTRAINT fk_payment_pay_stub FOREIGN KEY (pay_stub_id) 
        REFERENCES pay_stubs(id) ON DELETE RESTRICT,
    CONSTRAINT fk_payment_caregiver FOREIGN KEY (caregiver_id) 
        REFERENCES caregivers(id) ON DELETE RESTRICT
);

-- Indexes for payment_records
CREATE UNIQUE INDEX idx_payment_records_number ON payment_records(payment_number);
CREATE INDEX idx_payment_records_organization ON payment_records(organization_id, payment_date DESC);
CREATE INDEX idx_payment_records_branch ON payment_records(branch_id, payment_date DESC);
CREATE INDEX idx_payment_records_pay_run ON payment_records(pay_run_id);
CREATE INDEX idx_payment_records_pay_stub ON payment_records(pay_stub_id);
CREATE INDEX idx_payment_records_caregiver ON payment_records(caregiver_id, payment_date DESC);
CREATE INDEX idx_payment_records_status ON payment_records(status, payment_date);
CREATE INDEX idx_payment_records_method ON payment_records(payment_method, status);
CREATE INDEX idx_payment_records_ach_batch ON payment_records(ach_batch_id) WHERE ach_batch_id IS NOT NULL;
CREATE INDEX idx_payment_records_errors ON payment_records(organization_id) WHERE has_errors = true;
CREATE INDEX idx_payment_records_pending ON payment_records(organization_id, payment_date) 
    WHERE status IN ('PENDING', 'SCHEDULED', 'PROCESSING');

-- ============================================================================
-- ACH BATCHES
-- ============================================================================

CREATE TABLE IF NOT EXISTS ach_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    
    -- Batch details
    batch_number VARCHAR(100) NOT NULL,
    batch_date DATE NOT NULL,
    effective_date DATE NOT NULL,
    
    -- Company (employer) info
    company_name VARCHAR(200) NOT NULL,
    company_id VARCHAR(50) NOT NULL,
    company_entry_description VARCHAR(100) NOT NULL,
    
    -- Payments
    payment_ids JSONB NOT NULL DEFAULT '[]',
    transaction_count INTEGER NOT NULL DEFAULT 0 CHECK (transaction_count >= 0),
    total_debit_amount DECIMAL(14, 2) NOT NULL DEFAULT 0 CHECK (total_debit_amount >= 0),
    total_credit_amount DECIMAL(14, 2) NOT NULL DEFAULT 0 CHECK (total_credit_amount >= 0),
    
    -- File generation
    ach_file_url VARCHAR(500),
    ach_file_format VARCHAR(50) NOT NULL CHECK (ach_file_format IN ('NACHA', 'CCD', 'PPD', 'CTX')),
    ach_file_generated_at TIMESTAMP,
    ach_file_hash VARCHAR(255),
    
    -- Processing
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT' CHECK (status IN (
        'DRAFT', 'READY', 'SUBMITTED', 'PROCESSING', 'SETTLED', 'COMPLETED', 'PARTIAL_RETURN', 'FAILED'
    )),
    submitted_at TIMESTAMP,
    submitted_by UUID,
    
    -- Bank info
    originating_bank_routing_number VARCHAR(20) NOT NULL,
    originating_bank_account_number VARCHAR(255) NOT NULL, -- Encrypted
    
    -- Settlement
    settled_at TIMESTAMP,
    settlement_confirmation VARCHAR(200),
    
    -- Errors
    has_returns BOOLEAN DEFAULT false,
    return_count INTEGER DEFAULT 0 CHECK (return_count >= 0),
    returns JSONB NOT NULL DEFAULT '[]',
    
    -- Metadata
    notes TEXT,
    
    -- Standard entity fields
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by UUID NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    
    CONSTRAINT fk_ach_batch_organization FOREIGN KEY (organization_id) 
        REFERENCES organizations(id) ON DELETE RESTRICT,
    CONSTRAINT chk_ach_batch_dates CHECK (batch_date <= effective_date)
);

-- Indexes for ach_batches
CREATE UNIQUE INDEX idx_ach_batches_number ON ach_batches(batch_number);
CREATE INDEX idx_ach_batches_organization ON ach_batches(organization_id, batch_date DESC);
CREATE INDEX idx_ach_batches_status ON ach_batches(status, effective_date);
CREATE INDEX idx_ach_batches_effective ON ach_batches(effective_date);
CREATE INDEX idx_ach_batches_returns ON ach_batches(organization_id) WHERE has_returns = true;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update triggers for updated_at and version
CREATE OR REPLACE FUNCTION update_payroll_entity_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.version = OLD.version + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_pay_periods_updated_at
    BEFORE UPDATE ON pay_periods
    FOR EACH ROW
    EXECUTE FUNCTION update_payroll_entity_updated_at();

CREATE TRIGGER trigger_time_sheets_updated_at
    BEFORE UPDATE ON time_sheets
    FOR EACH ROW
    EXECUTE FUNCTION update_payroll_entity_updated_at();

CREATE TRIGGER trigger_pay_runs_updated_at
    BEFORE UPDATE ON pay_runs
    FOR EACH ROW
    EXECUTE FUNCTION update_payroll_entity_updated_at();

CREATE TRIGGER trigger_pay_stubs_updated_at
    BEFORE UPDATE ON pay_stubs
    FOR EACH ROW
    EXECUTE FUNCTION update_payroll_entity_updated_at();

CREATE TRIGGER trigger_payment_records_updated_at
    BEFORE UPDATE ON payment_records
    FOR EACH ROW
    EXECUTE FUNCTION update_payroll_entity_updated_at();

CREATE TRIGGER trigger_ach_batches_updated_at
    BEFORE UPDATE ON ach_batches
    FOR EACH ROW
    EXECUTE FUNCTION update_payroll_entity_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE pay_periods IS 'Pay period definitions for payroll cycles';
COMMENT ON TABLE time_sheets IS 'Aggregated time entries for each caregiver per pay period';
COMMENT ON TABLE pay_runs IS 'Payroll execution records for pay periods';
COMMENT ON TABLE tax_configurations IS 'Tax withholding configurations per caregiver';
COMMENT ON TABLE caregiver_deductions IS 'Deduction enrollments for caregivers';
COMMENT ON TABLE pay_stubs IS 'Individual earnings statements for caregivers';
COMMENT ON TABLE payment_records IS 'Payment disbursement records';
COMMENT ON TABLE ach_batches IS 'ACH direct deposit batches';

COMMENT ON COLUMN time_sheets.time_entries IS 'Array of time entry records from EVV';
COMMENT ON COLUMN time_sheets.evv_record_ids IS 'Links to source EVV records';
COMMENT ON COLUMN pay_stubs.deductions IS 'Detailed array of all deductions applied';
COMMENT ON COLUMN pay_stubs.current_net_pay IS 'Net pay after all deductions';
COMMENT ON COLUMN pay_stubs.year_to_date_gross_pay IS 'YTD gross earnings for tax reporting';
COMMENT ON COLUMN payment_records.routing_number IS 'Encrypted bank routing number';
COMMENT ON COLUMN payment_records.account_number IS 'Encrypted bank account number';
COMMENT ON COLUMN ach_batches.originating_bank_account_number IS 'Encrypted company bank account';
