-- Billing & Invoicing Tables
-- Complete schema for invoicing, payments, and revenue tracking

-- =============================================================================
-- INVOICES
-- =============================================================================
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  
  -- Invoice identity
  invoice_number VARCHAR(50) NOT NULL,
  invoice_type VARCHAR(50) NOT NULL, -- CLAIM, STATEMENT, PRIVATE_PAY, etc.
  
  -- Payer information
  payer_id UUID NOT NULL,
  payer_type VARCHAR(50) NOT NULL, -- MEDICAID, MEDICARE, PRIVATE_INSURANCE, PRIVATE_PAY, etc.
  payer_name VARCHAR(255) NOT NULL,
  payer_address JSONB,
  
  -- Client (for private pay invoices)
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  client_name VARCHAR(255),
  
  -- Period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  
  -- Amounts
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5,4),
  discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  adjustment_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  paid_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  balance_due DECIMAL(12,2) NOT NULL DEFAULT 0,
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'DRAFT', -- DRAFT, PENDING, SUBMITTED, PAID, PARTIAL_PAID, OVERDUE, VOID
  status_history JSONB NOT NULL DEFAULT '[]',
  
  -- Submission
  submitted_date TIMESTAMPTZ,
  submitted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  submission_method VARCHAR(50), -- EDI, PORTAL, MAIL, FAX, etc.
  submission_confirmation VARCHAR(255),
  
  -- Payment terms
  payment_terms TEXT,
  late_fee_rate DECIMAL(5,4),
  
  -- Documents
  pdf_url TEXT,
  document_ids JSONB,
  
  -- Claims
  claim_ids JSONB,
  claim_status VARCHAR(50),
  
  -- Metadata
  notes TEXT,
  internal_notes TEXT,
  tags JSONB,
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  
  CONSTRAINT unique_invoice_number UNIQUE(organization_id, invoice_number)
);

CREATE INDEX idx_invoices_organization ON invoices(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_invoices_branch ON invoices(branch_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_invoices_client ON invoices(client_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_invoices_payer ON invoices(payer_id, payer_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_invoices_status ON invoices(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_invoices_invoice_date ON invoices(invoice_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_invoices_due_date ON invoices(due_date) WHERE deleted_at IS NULL;

-- =============================================================================
-- INVOICE LINE ITEMS
-- =============================================================================
CREATE TABLE IF NOT EXISTS invoice_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Line item details
  line_number INTEGER NOT NULL,
  description TEXT NOT NULL,
  
  -- Service reference
  billable_item_id UUID,
  visit_id UUID REFERENCES schedules(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  service_date DATE NOT NULL,
  
  -- Service details
  service_code VARCHAR(50), -- CPT, HCPCS, etc.
  service_type VARCHAR(255),
  caregiver_id UUID REFERENCES users(id) ON DELETE SET NULL,
  caregiver_name VARCHAR(255),
  
  -- Pricing
  unit_type VARCHAR(50) NOT NULL, -- HOUR, VISIT, DAY, etc.
  units DECIMAL(10,2) NOT NULL,
  unit_rate DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  
  -- Modifiers
  modifiers JSONB,
  adjustments JSONB,
  
  -- Total
  total_amount DECIMAL(12,2) NOT NULL,
  
  -- Authorization
  authorization_id UUID,
  authorization_number VARCHAR(100),
  
  -- Metadata
  notes TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT unique_invoice_line UNIQUE(invoice_id, line_number)
);

CREATE INDEX idx_invoice_line_items_invoice ON invoice_line_items(invoice_id);
CREATE INDEX idx_invoice_line_items_organization ON invoice_line_items(organization_id);
CREATE INDEX idx_invoice_line_items_visit ON invoice_line_items(visit_id);
CREATE INDEX idx_invoice_line_items_client ON invoice_line_items(client_id);
CREATE INDEX idx_invoice_line_items_service_date ON invoice_line_items(service_date);

-- =============================================================================
-- PAYMENTS
-- =============================================================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Payment identity
  payment_number VARCHAR(50),
  payment_type VARCHAR(50) NOT NULL, -- CHECK, ACH, CREDIT_CARD, CASH, EFT, WIRE, etc.
  
  -- Invoice reference
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  
  -- Payer
  payer_id UUID NOT NULL,
  payer_type VARCHAR(50) NOT NULL,
  payer_name VARCHAR(255) NOT NULL,
  
  -- Payment details
  payment_date DATE NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  
  -- Payment method details
  check_number VARCHAR(50),
  transaction_id VARCHAR(255),
  confirmation_number VARCHAR(255),
  
  -- Bank details (for ACH/Wire)
  bank_name VARCHAR(255),
  account_last_four VARCHAR(4),
  
  -- Card details (for credit card)
  card_type VARCHAR(50),
  card_last_four VARCHAR(4),
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, CLEARED, BOUNCED, REFUNDED, VOID
  cleared_date DATE,
  
  -- Applied amounts
  applied_to_invoice DECIMAL(12,2) NOT NULL,
  unapplied_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  
  -- ERA/Remittance
  era_id VARCHAR(255),
  remittance_advice_url TEXT,
  
  -- Adjustments
  adjustments JSONB,
  
  -- Metadata
  notes TEXT,
  internal_notes TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_payments_organization ON payments(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_payments_invoice ON payments(invoice_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_payments_payer ON payments(payer_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_payments_payment_date ON payments(payment_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_payments_status ON payments(status) WHERE deleted_at IS NULL;

-- =============================================================================
-- RATE SCHEDULES
-- =============================================================================
CREATE TABLE IF NOT EXISTS rate_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Rate schedule identity
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Applicability
  payer_id UUID,
  payer_type VARCHAR(50),
  service_type VARCHAR(255),
  state_code VARCHAR(2), -- For state-specific rates
  
  -- Effective dates
  effective_start DATE NOT NULL,
  effective_end DATE,
  
  -- Rates
  unit_type VARCHAR(50) NOT NULL,
  base_rate DECIMAL(10,2) NOT NULL,
  
  -- Rate variations
  weekend_rate DECIMAL(10,2),
  holiday_rate DECIMAL(10,2),
  overtime_rate DECIMAL(10,2),
  
  -- Modifiers
  modifiers JSONB,
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_rate_schedules_organization ON rate_schedules(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_rate_schedules_payer ON rate_schedules(payer_id, payer_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_rate_schedules_effective ON rate_schedules(effective_start, effective_end) WHERE deleted_at IS NULL;

-- =============================================================================
-- PAYERS
-- =============================================================================
CREATE TABLE IF NOT EXISTS payers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Payer identity
  payer_name VARCHAR(255) NOT NULL,
  payer_type VARCHAR(50) NOT NULL,
  payer_code VARCHAR(50), -- External payer ID
  
  -- Contact information
  contact_name VARCHAR(255),
  phone VARCHAR(20),
  email VARCHAR(255),
  fax VARCHAR(20),
  website VARCHAR(255),
  
  -- Address
  address JSONB,
  
  -- Billing details
  billing_address JSONB,
  remittance_address JSONB,
  electronic_payer_id VARCHAR(50),
  
  -- Terms
  payment_terms_days INTEGER DEFAULT 30,
  claim_submission_method VARCHAR(50), -- EDI, PORTAL, MAIL, etc.
  portal_url VARCHAR(255),
  portal_credentials JSONB, -- Encrypted
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Metadata
  notes TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_payers_organization ON payers(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_payers_type ON payers(payer_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_payers_active ON payers(is_active) WHERE deleted_at IS NULL;

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on all billing tables
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE payers ENABLE ROW LEVEL SECURITY;

-- Invoices RLS policies
CREATE POLICY invoices_org_isolation ON invoices
  FOR ALL
  USING (organization_id = current_setting('app.current_organization_id', TRUE)::UUID);

-- Invoice line items RLS policies
CREATE POLICY invoice_line_items_org_isolation ON invoice_line_items
  FOR ALL
  USING (organization_id = current_setting('app.current_organization_id', TRUE)::UUID);

-- Payments RLS policies
CREATE POLICY payments_org_isolation ON payments
  FOR ALL
  USING (organization_id = current_setting('app.current_organization_id', TRUE)::UUID);

-- Rate schedules RLS policies
CREATE POLICY rate_schedules_org_isolation ON rate_schedules
  FOR ALL
  USING (organization_id = current_setting('app.current_organization_id', TRUE)::UUID);

-- Payers RLS policies
CREATE POLICY payers_org_isolation ON payers
  FOR ALL
  USING (organization_id = current_setting('app.current_organization_id', TRUE)::UUID);
