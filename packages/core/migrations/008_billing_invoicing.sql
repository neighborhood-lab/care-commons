-- Migration: Billing & Invoicing
-- Description: Creates tables for billable items, invoices, payments, claims, and rate schedules
-- Version: 008
-- Date: 2024-01-25

-- ============================================================================
-- PAYERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS payers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    
    -- Identity
    payer_name VARCHAR(200) NOT NULL,
    payer_type VARCHAR(50) NOT NULL CHECK (payer_type IN (
        'MEDICAID', 'MEDICARE', 'MEDICARE_ADVANTAGE', 'PRIVATE_INSURANCE',
        'MANAGED_CARE', 'VETERANS_BENEFITS', 'WORKERS_COMP', 'PRIVATE_PAY',
        'GRANT', 'OTHER'
    )),
    payer_code VARCHAR(50),
    
    -- External identifiers
    national_payer_id VARCHAR(100),
    medicaid_provider_id VARCHAR(50),
    medicare_provider_id VARCHAR(50),
    tax_id VARCHAR(20),
    
    -- Contact
    address JSONB,
    phone VARCHAR(20),
    fax VARCHAR(20),
    email VARCHAR(100),
    website VARCHAR(200),
    
    -- Billing
    billing_address JSONB,
    billing_email VARCHAR(100),
    billing_portal_url VARCHAR(200),
    submission_methods JSONB, -- Array of submission methods
    edi_payer_id VARCHAR(50),
    clearinghouse_id UUID,
    
    -- Terms
    payment_terms_days INTEGER NOT NULL DEFAULT 30 CHECK (payment_terms_days BETWEEN 0 AND 365),
    requires_pre_authorization BOOLEAN DEFAULT false,
    requires_referral BOOLEAN DEFAULT false,
    claim_filing_limit INTEGER CHECK (claim_filing_limit BETWEEN 0 AND 365),
    
    -- Rates
    default_rate_schedule_id UUID,
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN (
        'ACTIVE', 'INACTIVE', 'SUSPENDED', 'TERMINATED'
    )),
    
    -- Performance metrics
    average_payment_days INTEGER,
    denial_rate DECIMAL(5, 2), -- Percentage
    
    -- Metadata
    notes TEXT,
    contacts JSONB, -- Array of payer contacts
    
    -- Standard entity fields
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by UUID NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    deleted_at TIMESTAMP,
    deleted_by UUID,
    
    CONSTRAINT fk_payer_organization FOREIGN KEY (organization_id) 
        REFERENCES organizations(id) ON DELETE RESTRICT
);

-- Indexes for payers
CREATE INDEX idx_payers_organization ON payers(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_payers_type ON payers(payer_type, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_payers_status ON payers(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_payers_name ON payers(organization_id, payer_name) WHERE deleted_at IS NULL;
CREATE INDEX idx_payers_national_id ON payers(national_payer_id) WHERE national_payer_id IS NOT NULL;

-- ============================================================================
-- RATE SCHEDULES
-- ============================================================================

CREATE TABLE IF NOT EXISTS rate_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    branch_id UUID,
    
    -- Identity
    name VARCHAR(200) NOT NULL,
    description TEXT,
    schedule_type VARCHAR(50) NOT NULL CHECK (schedule_type IN (
        'STANDARD', 'PAYER_SPECIFIC', 'CLIENT_SPECIFIC', 'PROGRAM', 'PROMOTIONAL'
    )),
    
    -- Payer
    payer_id UUID,
    payer_type VARCHAR(50),
    payer_name VARCHAR(200),
    
    -- Effective dates
    effective_from DATE NOT NULL,
    effective_to DATE,
    
    -- Rates (stored as JSONB array)
    rates JSONB NOT NULL,
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT' CHECK (status IN (
        'DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED'
    )),
    
    -- Approval
    approved_by UUID,
    approved_at TIMESTAMP,
    
    -- Metadata
    notes TEXT,
    
    -- Standard entity fields
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by UUID NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    
    CONSTRAINT fk_rate_schedule_organization FOREIGN KEY (organization_id) 
        REFERENCES organizations(id) ON DELETE RESTRICT,
    CONSTRAINT fk_rate_schedule_branch FOREIGN KEY (branch_id) 
        REFERENCES branches(id) ON DELETE RESTRICT,
    CONSTRAINT fk_rate_schedule_payer FOREIGN KEY (payer_id) 
        REFERENCES payers(id) ON DELETE SET NULL,
    CONSTRAINT chk_rate_schedule_dates CHECK (
        effective_to IS NULL OR effective_from <= effective_to
    )
);

-- Indexes for rate_schedules
CREATE INDEX idx_rate_schedules_organization ON rate_schedules(organization_id);
CREATE INDEX idx_rate_schedules_branch ON rate_schedules(branch_id) WHERE branch_id IS NOT NULL;
CREATE INDEX idx_rate_schedules_payer ON rate_schedules(payer_id) WHERE payer_id IS NOT NULL;
CREATE INDEX idx_rate_schedules_effective ON rate_schedules(effective_from, effective_to, status);
CREATE INDEX idx_rate_schedules_active ON rate_schedules(organization_id, status) 
    WHERE status = 'ACTIVE';

-- ============================================================================
-- SERVICE AUTHORIZATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS service_authorizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    branch_id UUID NOT NULL,
    client_id UUID NOT NULL,
    
    -- Authorization identity
    authorization_number VARCHAR(100) NOT NULL,
    authorization_type VARCHAR(50) NOT NULL CHECK (authorization_type IN (
        'INITIAL', 'RENEWAL', 'MODIFICATION', 'EMERGENCY', 'TEMPORARY'
    )),
    
    -- Payer
    payer_id UUID NOT NULL,
    payer_type VARCHAR(50) NOT NULL,
    payer_name VARCHAR(200) NOT NULL,
    
    -- Service
    service_type_id UUID NOT NULL,
    service_type_code VARCHAR(50) NOT NULL,
    service_type_name VARCHAR(200) NOT NULL,
    
    -- Authorized amounts
    authorized_units DECIMAL(10, 2) NOT NULL CHECK (authorized_units >= 0),
    unit_type VARCHAR(50) NOT NULL,
    unit_rate DECIMAL(10, 2),
    authorized_amount DECIMAL(10, 2),
    
    -- Period
    effective_from DATE NOT NULL,
    effective_to DATE NOT NULL,
    
    -- Usage tracking
    used_units DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (used_units >= 0),
    remaining_units DECIMAL(10, 2) NOT NULL CHECK (remaining_units >= 0),
    billed_units DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (billed_units >= 0),
    
    -- Restrictions
    requires_referral BOOLEAN DEFAULT false,
    referral_number VARCHAR(100),
    allowed_providers JSONB, -- Array of caregiver IDs
    location_restrictions TEXT,
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN (
        'PENDING', 'ACTIVE', 'DEPLETED', 'EXPIRED', 'SUSPENDED', 'CANCELLED', 'DENIED'
    )),
    status_history JSONB NOT NULL DEFAULT '[]',
    
    -- Review
    reviewed_by UUID,
    reviewed_at TIMESTAMP,
    review_notes TEXT,
    
    -- Alerts
    low_units_threshold DECIMAL(10, 2),
    expiration_warning_days INTEGER CHECK (expiration_warning_days BETWEEN 0 AND 90),
    
    -- Documents
    document_ids JSONB, -- Array of document IDs
    
    -- Metadata
    notes TEXT,
    internal_notes TEXT,
    
    -- Standard entity fields
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by UUID NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    deleted_at TIMESTAMP,
    deleted_by UUID,
    
    CONSTRAINT fk_authorization_organization FOREIGN KEY (organization_id) 
        REFERENCES organizations(id) ON DELETE RESTRICT,
    CONSTRAINT fk_authorization_branch FOREIGN KEY (branch_id) 
        REFERENCES branches(id) ON DELETE RESTRICT,
    CONSTRAINT fk_authorization_client FOREIGN KEY (client_id) 
        REFERENCES clients(id) ON DELETE RESTRICT,
    CONSTRAINT fk_authorization_payer FOREIGN KEY (payer_id) 
        REFERENCES payers(id) ON DELETE RESTRICT,
    CONSTRAINT chk_authorization_dates CHECK (effective_from <= effective_to),
    CONSTRAINT chk_authorization_units CHECK (used_units <= authorized_units)
);

-- Indexes for service_authorizations
CREATE UNIQUE INDEX idx_authorizations_number ON service_authorizations(authorization_number) 
    WHERE deleted_at IS NULL;
CREATE INDEX idx_authorizations_organization ON service_authorizations(organization_id) 
    WHERE deleted_at IS NULL;
CREATE INDEX idx_authorizations_client ON service_authorizations(client_id, status) 
    WHERE deleted_at IS NULL;
CREATE INDEX idx_authorizations_payer ON service_authorizations(payer_id, status) 
    WHERE deleted_at IS NULL;
CREATE INDEX idx_authorizations_status ON service_authorizations(status, effective_to) 
    WHERE deleted_at IS NULL;
CREATE INDEX idx_authorizations_expiring ON service_authorizations(effective_to) 
    WHERE status = 'ACTIVE' AND deleted_at IS NULL;
CREATE INDEX idx_authorizations_low_units ON service_authorizations(remaining_units) 
    WHERE status = 'ACTIVE' AND remaining_units < 10 AND deleted_at IS NULL;

-- ============================================================================
-- BILLABLE ITEMS
-- ============================================================================

CREATE TABLE IF NOT EXISTS billable_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    branch_id UUID NOT NULL,
    client_id UUID NOT NULL,
    
    -- Service reference
    visit_id UUID,
    evv_record_id UUID,
    service_type_id UUID NOT NULL,
    service_type_code VARCHAR(50) NOT NULL,
    service_type_name VARCHAR(200) NOT NULL,
    
    -- Timing
    service_date DATE NOT NULL,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes >= 0),
    
    -- Provider
    caregiver_id UUID,
    caregiver_name VARCHAR(200),
    provider_npi VARCHAR(20),
    
    -- Rates and pricing
    rate_schedule_id UUID,
    unit_type VARCHAR(50) NOT NULL,
    units DECIMAL(10, 2) NOT NULL CHECK (units >= 0),
    unit_rate DECIMAL(10, 2) NOT NULL CHECK (unit_rate >= 0),
    subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0),
    
    -- Modifiers
    modifiers JSONB, -- Array of billing modifiers
    adjustments JSONB, -- Array of adjustments
    final_amount DECIMAL(10, 2) NOT NULL CHECK (final_amount >= 0),
    
    -- Authorization
    authorization_id UUID,
    authorization_number VARCHAR(100),
    is_authorized BOOLEAN DEFAULT false,
    authorization_remaining_units DECIMAL(10, 2),
    
    -- Payer
    payer_id UUID NOT NULL,
    payer_type VARCHAR(50) NOT NULL,
    payer_name VARCHAR(200) NOT NULL,
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN (
        'PENDING', 'READY', 'INVOICED', 'SUBMITTED', 'PAID', 'PARTIAL_PAID',
        'DENIED', 'APPEALED', 'ADJUSTED', 'VOIDED', 'HOLD'
    )),
    status_history JSONB NOT NULL DEFAULT '[]',
    
    -- Billing grouping
    invoice_id UUID,
    invoice_date DATE,
    claim_id UUID,
    claim_submitted_date DATE,
    
    -- Flags
    is_hold BOOLEAN DEFAULT false,
    hold_reason TEXT,
    requires_review BOOLEAN DEFAULT false,
    review_reason TEXT,
    
    -- Denial handling
    is_denied BOOLEAN DEFAULT false,
    denial_reason TEXT,
    denial_code VARCHAR(50),
    denial_date DATE,
    is_appealable BOOLEAN DEFAULT false,
    
    -- Payment tracking
    is_paid BOOLEAN DEFAULT false,
    paid_amount DECIMAL(10, 2),
    paid_date DATE,
    payment_id UUID,
    
    -- Metadata
    notes TEXT,
    tags JSONB, -- Array of tags
    
    -- Standard entity fields
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by UUID NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    deleted_at TIMESTAMP,
    deleted_by UUID,
    
    CONSTRAINT fk_billable_organization FOREIGN KEY (organization_id) 
        REFERENCES organizations(id) ON DELETE RESTRICT,
    CONSTRAINT fk_billable_branch FOREIGN KEY (branch_id) 
        REFERENCES branches(id) ON DELETE RESTRICT,
    CONSTRAINT fk_billable_client FOREIGN KEY (client_id) 
        REFERENCES clients(id) ON DELETE RESTRICT,
    CONSTRAINT fk_billable_visit FOREIGN KEY (visit_id) 
        REFERENCES visits(id) ON DELETE SET NULL,
    CONSTRAINT fk_billable_evv FOREIGN KEY (evv_record_id) 
        REFERENCES evv_records(id) ON DELETE SET NULL,
    CONSTRAINT fk_billable_caregiver FOREIGN KEY (caregiver_id) 
        REFERENCES caregivers(id) ON DELETE SET NULL,
    CONSTRAINT fk_billable_rate_schedule FOREIGN KEY (rate_schedule_id) 
        REFERENCES rate_schedules(id) ON DELETE SET NULL,
    CONSTRAINT fk_billable_authorization FOREIGN KEY (authorization_id) 
        REFERENCES service_authorizations(id) ON DELETE SET NULL,
    CONSTRAINT fk_billable_payer FOREIGN KEY (payer_id) 
        REFERENCES payers(id) ON DELETE RESTRICT,
    CONSTRAINT chk_billable_times CHECK (
        start_time IS NULL OR end_time IS NULL OR start_time < end_time
    )
);

-- Indexes for billable_items
CREATE INDEX idx_billable_organization ON billable_items(organization_id, service_date) 
    WHERE deleted_at IS NULL;
CREATE INDEX idx_billable_branch ON billable_items(branch_id, service_date) 
    WHERE deleted_at IS NULL;
CREATE INDEX idx_billable_client ON billable_items(client_id, service_date) 
    WHERE deleted_at IS NULL;
CREATE INDEX idx_billable_caregiver ON billable_items(caregiver_id, service_date) 
    WHERE caregiver_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_billable_payer ON billable_items(payer_id, service_date) 
    WHERE deleted_at IS NULL;
CREATE INDEX idx_billable_status ON billable_items(status, service_date) 
    WHERE deleted_at IS NULL;
CREATE INDEX idx_billable_visit ON billable_items(visit_id) 
    WHERE visit_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_billable_evv ON billable_items(evv_record_id) 
    WHERE evv_record_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_billable_invoice ON billable_items(invoice_id) 
    WHERE invoice_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_billable_authorization ON billable_items(authorization_id) 
    WHERE authorization_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_billable_ready ON billable_items(organization_id, payer_id) 
    WHERE status = 'READY' AND deleted_at IS NULL;
CREATE INDEX idx_billable_hold ON billable_items(organization_id) 
    WHERE is_hold = true AND deleted_at IS NULL;
CREATE INDEX idx_billable_review ON billable_items(organization_id) 
    WHERE requires_review = true AND deleted_at IS NULL;
CREATE INDEX idx_billable_unpaid ON billable_items(payer_id, service_date) 
    WHERE is_paid = false AND status NOT IN ('VOIDED', 'HOLD') AND deleted_at IS NULL;

-- ============================================================================
-- INVOICES
-- ============================================================================

CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    branch_id UUID NOT NULL,
    
    -- Invoice identity
    invoice_number VARCHAR(100) NOT NULL,
    invoice_type VARCHAR(50) NOT NULL CHECK (invoice_type IN (
        'STANDARD', 'INTERIM', 'FINAL', 'CREDIT', 'PROFORMA', 'STATEMENT'
    )),
    
    -- Payer
    payer_id UUID NOT NULL,
    payer_type VARCHAR(50) NOT NULL,
    payer_name VARCHAR(200) NOT NULL,
    payer_address JSONB,
    
    -- Client (for private pay)
    client_id UUID,
    client_name VARCHAR(200),
    
    -- Period
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    
    -- Line items (stored as JSONB)
    billable_item_ids JSONB NOT NULL, -- Array of billable item IDs
    line_items JSONB NOT NULL, -- Array of invoice line items
    
    -- Amounts
    subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0),
    tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
    tax_rate DECIMAL(5, 4),
    discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    adjustment_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
    paid_amount DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
    balance_due DECIMAL(10, 2) NOT NULL CHECK (balance_due >= 0),
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT' CHECK (status IN (
        'DRAFT', 'PENDING_REVIEW', 'APPROVED', 'SENT', 'SUBMITTED',
        'PARTIALLY_PAID', 'PAID', 'PAST_DUE', 'DISPUTED', 'CANCELLED', 'VOIDED'
    )),
    status_history JSONB NOT NULL DEFAULT '[]',
    
    -- Submission
    submitted_date DATE,
    submitted_by UUID,
    submission_method VARCHAR(50),
    submission_confirmation VARCHAR(200),
    
    -- Payment
    payment_terms VARCHAR(200),
    late_fee_rate DECIMAL(5, 4),
    payments JSONB NOT NULL DEFAULT '[]', -- Array of payment references
    
    -- Documents
    pdf_url VARCHAR(500),
    document_ids JSONB, -- Array of document IDs
    
    -- Claims (for insurance)
    claim_ids JSONB, -- Array of claim IDs
    claim_status VARCHAR(50),
    
    -- Metadata
    notes TEXT,
    internal_notes TEXT,
    tags JSONB, -- Array of tags
    
    -- Standard entity fields
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by UUID NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    deleted_at TIMESTAMP,
    deleted_by UUID,
    
    CONSTRAINT fk_invoice_organization FOREIGN KEY (organization_id) 
        REFERENCES organizations(id) ON DELETE RESTRICT,
    CONSTRAINT fk_invoice_branch FOREIGN KEY (branch_id) 
        REFERENCES branches(id) ON DELETE RESTRICT,
    CONSTRAINT fk_invoice_payer FOREIGN KEY (payer_id) 
        REFERENCES payers(id) ON DELETE RESTRICT,
    CONSTRAINT fk_invoice_client FOREIGN KEY (client_id) 
        REFERENCES clients(id) ON DELETE SET NULL,
    CONSTRAINT chk_invoice_period CHECK (period_start <= period_end),
    CONSTRAINT chk_invoice_dates CHECK (invoice_date <= due_date),
    CONSTRAINT chk_invoice_balance CHECK (
        balance_due = total_amount - paid_amount
    )
);

-- Indexes for invoices
CREATE UNIQUE INDEX idx_invoices_number ON invoices(invoice_number) WHERE deleted_at IS NULL;
CREATE INDEX idx_invoices_organization ON invoices(organization_id, invoice_date DESC) 
    WHERE deleted_at IS NULL;
CREATE INDEX idx_invoices_branch ON invoices(branch_id, invoice_date DESC) 
    WHERE deleted_at IS NULL;
CREATE INDEX idx_invoices_payer ON invoices(payer_id, invoice_date DESC) 
    WHERE deleted_at IS NULL;
CREATE INDEX idx_invoices_client ON invoices(client_id, invoice_date DESC) 
    WHERE client_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_invoices_status ON invoices(status, due_date) 
    WHERE deleted_at IS NULL;
CREATE INDEX idx_invoices_period ON invoices(period_start, period_end) 
    WHERE deleted_at IS NULL;
CREATE INDEX idx_invoices_past_due ON invoices(due_date) 
    WHERE status IN ('SENT', 'SUBMITTED', 'PARTIALLY_PAID') 
        AND due_date < CURRENT_DATE AND deleted_at IS NULL;
CREATE INDEX idx_invoices_unpaid ON invoices(organization_id, payer_id) 
    WHERE balance_due > 0 AND status NOT IN ('CANCELLED', 'VOIDED') 
        AND deleted_at IS NULL;

-- ============================================================================
-- PAYMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    branch_id UUID NOT NULL,
    
    -- Payment identity
    payment_number VARCHAR(100) NOT NULL,
    payment_type VARCHAR(50) NOT NULL CHECK (payment_type IN (
        'FULL', 'PARTIAL', 'DEPOSIT', 'REFUND', 'ADJUSTMENT'
    )),
    
    -- Payer
    payer_id UUID NOT NULL,
    payer_type VARCHAR(50) NOT NULL,
    payer_name VARCHAR(200) NOT NULL,
    
    -- Amount
    amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    
    -- Dates
    payment_date DATE NOT NULL,
    received_date DATE NOT NULL,
    deposited_date DATE,
    
    -- Method
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN (
        'CHECK', 'EFT', 'ACH', 'WIRE', 'CREDIT_CARD', 'DEBIT_CARD',
        'CASH', 'MONEY_ORDER', 'ERA'
    )),
    reference_number VARCHAR(100),
    
    -- Application
    allocations JSONB NOT NULL DEFAULT '[]', -- Array of payment allocations
    unapplied_amount DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (unapplied_amount >= 0),
    
    -- Bank information
    bank_account_id UUID,
    deposit_slip_number VARCHAR(100),
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN (
        'PENDING', 'RECEIVED', 'APPLIED', 'DEPOSITED', 'CLEARED',
        'RETURNED', 'VOIDED', 'REFUNDED'
    )),
    status_history JSONB NOT NULL DEFAULT '[]',
    
    -- Reconciliation
    is_reconciled BOOLEAN DEFAULT false,
    reconciled_date DATE,
    reconciled_by UUID,
    
    -- Documents
    image_url VARCHAR(500),
    document_ids JSONB, -- Array of document IDs
    
    -- Metadata
    notes TEXT,
    internal_notes TEXT,
    
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
    CONSTRAINT fk_payment_payer FOREIGN KEY (payer_id) 
        REFERENCES payers(id) ON DELETE RESTRICT,
    CONSTRAINT chk_payment_dates CHECK (received_date >= payment_date)
);

-- Indexes for payments
CREATE UNIQUE INDEX idx_payments_number ON payments(payment_number);
CREATE INDEX idx_payments_organization ON payments(organization_id, received_date DESC);
CREATE INDEX idx_payments_branch ON payments(branch_id, received_date DESC);
CREATE INDEX idx_payments_payer ON payments(payer_id, payment_date DESC);
CREATE INDEX idx_payments_status ON payments(status, received_date);
CREATE INDEX idx_payments_reference ON payments(reference_number) 
    WHERE reference_number IS NOT NULL;
CREATE INDEX idx_payments_unreconciled ON payments(organization_id) 
    WHERE is_reconciled = false;
CREATE INDEX idx_payments_unapplied ON payments(organization_id) 
    WHERE unapplied_amount > 0;

-- ============================================================================
-- CLAIMS
-- ============================================================================

CREATE TABLE IF NOT EXISTS claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    branch_id UUID NOT NULL,
    
    -- Claim identity
    claim_number VARCHAR(100) NOT NULL,
    claim_type VARCHAR(50) NOT NULL CHECK (claim_type IN (
        'PROFESSIONAL', 'INSTITUTIONAL', 'DENTAL', 'PHARMACY', 'VISION'
    )),
    claim_format VARCHAR(50) NOT NULL CHECK (claim_format IN (
        'CMS_1500', 'UB_04', 'EDI_837P', 'EDI_837I', 'PROPRIETARY'
    )),
    
    -- Payer
    payer_id UUID NOT NULL,
    payer_type VARCHAR(50) NOT NULL,
    payer_name VARCHAR(200) NOT NULL,
    
    -- Patient
    client_id UUID NOT NULL,
    client_name VARCHAR(200) NOT NULL,
    
    -- Invoice
    invoice_id UUID NOT NULL,
    invoice_number VARCHAR(100) NOT NULL,
    
    -- Billable items
    billable_item_ids JSONB NOT NULL, -- Array of billable item IDs
    line_items JSONB NOT NULL, -- Array of claim line items
    
    -- Amounts
    total_charges DECIMAL(10, 2) NOT NULL CHECK (total_charges >= 0),
    total_approved DECIMAL(10, 2),
    total_paid DECIMAL(10, 2),
    total_adjustments DECIMAL(10, 2),
    patient_responsibility DECIMAL(10, 2),
    
    -- Submission
    submitted_date DATE NOT NULL,
    submitted_by UUID NOT NULL,
    submission_method VARCHAR(50) NOT NULL,
    submission_batch_id UUID,
    control_number VARCHAR(100), -- Payer-assigned
    
    -- Processing
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN (
        'PENDING', 'ACCEPTED', 'REJECTED', 'PROCESSING', 'APPROVED',
        'DENIED', 'APPEALED', 'RESUBMITTED'
    )),
    status_history JSONB NOT NULL DEFAULT '[]',
    processing_date DATE,
    payment_date DATE,
    
    -- Denial/rejection
    denial_reason TEXT,
    denial_code VARCHAR(50),
    denial_date DATE,
    is_appealable BOOLEAN DEFAULT false,
    appeal_deadline DATE,
    
    -- Appeal
    appeal_id UUID,
    appeal_submitted_date DATE,
    appeal_status VARCHAR(50),
    
    -- ERA (Electronic Remittance Advice)
    era_received BOOLEAN DEFAULT false,
    era_received_date DATE,
    era_document_id UUID,
    
    -- Documents
    claim_form_url VARCHAR(500),
    supporting_document_ids JSONB, -- Array of document IDs
    
    -- Metadata
    notes TEXT,
    internal_notes TEXT,
    
    -- Standard entity fields
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by UUID NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    
    CONSTRAINT fk_claim_organization FOREIGN KEY (organization_id) 
        REFERENCES organizations(id) ON DELETE RESTRICT,
    CONSTRAINT fk_claim_branch FOREIGN KEY (branch_id) 
        REFERENCES branches(id) ON DELETE RESTRICT,
    CONSTRAINT fk_claim_payer FOREIGN KEY (payer_id) 
        REFERENCES payers(id) ON DELETE RESTRICT,
    CONSTRAINT fk_claim_client FOREIGN KEY (client_id) 
        REFERENCES clients(id) ON DELETE RESTRICT,
    CONSTRAINT fk_claim_invoice FOREIGN KEY (invoice_id) 
        REFERENCES invoices(id) ON DELETE RESTRICT
);

-- Indexes for claims
CREATE UNIQUE INDEX idx_claims_number ON claims(claim_number);
CREATE INDEX idx_claims_organization ON claims(organization_id, submitted_date DESC);
CREATE INDEX idx_claims_branch ON claims(branch_id, submitted_date DESC);
CREATE INDEX idx_claims_payer ON claims(payer_id, submitted_date DESC);
CREATE INDEX idx_claims_client ON claims(client_id, submitted_date DESC);
CREATE INDEX idx_claims_invoice ON claims(invoice_id);
CREATE INDEX idx_claims_status ON claims(status, submitted_date);
CREATE INDEX idx_claims_control ON claims(control_number) WHERE control_number IS NOT NULL;
CREATE INDEX idx_claims_denied ON claims(organization_id) 
    WHERE status = 'DENIED' AND is_appealable = true;
CREATE INDEX idx_claims_pending ON claims(organization_id, submitted_date) 
    WHERE status IN ('PENDING', 'ACCEPTED', 'PROCESSING');

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update triggers for updated_at and version
CREATE OR REPLACE FUNCTION update_billing_entity_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.version = OLD.version + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_payers_updated_at
    BEFORE UPDATE ON payers
    FOR EACH ROW
    EXECUTE FUNCTION update_billing_entity_updated_at();

CREATE TRIGGER trigger_rate_schedules_updated_at
    BEFORE UPDATE ON rate_schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_billing_entity_updated_at();

CREATE TRIGGER trigger_authorizations_updated_at
    BEFORE UPDATE ON service_authorizations
    FOR EACH ROW
    EXECUTE FUNCTION update_billing_entity_updated_at();

CREATE TRIGGER trigger_billable_items_updated_at
    BEFORE UPDATE ON billable_items
    FOR EACH ROW
    EXECUTE FUNCTION update_billing_entity_updated_at();

CREATE TRIGGER trigger_invoices_updated_at
    BEFORE UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_billing_entity_updated_at();

CREATE TRIGGER trigger_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_billing_entity_updated_at();

CREATE TRIGGER trigger_claims_updated_at
    BEFORE UPDATE ON claims
    FOR EACH ROW
    EXECUTE FUNCTION update_billing_entity_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE payers IS 'Insurance companies, agencies, or individuals paying for services';
COMMENT ON TABLE rate_schedules IS 'Pricing rules by service type and payer';
COMMENT ON TABLE service_authorizations IS 'Pre-approvals for services from payers';
COMMENT ON TABLE billable_items IS 'Individual service occurrences ready for billing';
COMMENT ON TABLE invoices IS 'Collections of billable items for payers';
COMMENT ON TABLE payments IS 'Incoming payments from payers';
COMMENT ON TABLE claims IS 'Insurance claim submissions';

COMMENT ON COLUMN billable_items.evv_record_id IS 'Links to EVV record for compliance verification';
COMMENT ON COLUMN billable_items.authorization_id IS 'Links to service authorization if required';
COMMENT ON COLUMN billable_items.is_hold IS 'Temporarily held from billing';
COMMENT ON COLUMN billable_items.requires_review IS 'Flags item for manual review';
COMMENT ON COLUMN invoices.balance_due IS 'Calculated as total_amount - paid_amount';
COMMENT ON COLUMN payments.unapplied_amount IS 'Payment amount not yet allocated to invoices';
COMMENT ON COLUMN claims.era_received IS 'Electronic Remittance Advice received from payer';
