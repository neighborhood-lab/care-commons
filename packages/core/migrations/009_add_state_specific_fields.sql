-- Care Commons - State-Specific Fields for TX and FL Compliance
-- Add state-specific compliance fields for Texas (26 TAC §558, HHSC) and Florida (59A-8, AHCA)

-- Add state-specific field to clients table
ALTER TABLE clients
ADD COLUMN state_specific JSONB;

-- Add state-specific field to caregivers table
ALTER TABLE caregivers
ADD COLUMN state_specific JSONB;

-- Create indexes for state-specific queries
CREATE INDEX idx_clients_state_specific ON clients USING gin(state_specific) WHERE deleted_at IS NULL;
CREATE INDEX idx_caregivers_state_specific ON caregivers USING gin(state_specific) WHERE deleted_at IS NULL;

-- Create audit log table for client record access and disclosure (HIPAA/Texas compliance)
CREATE TABLE client_access_audit (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id),
    accessed_by UUID NOT NULL REFERENCES users(id),
    access_type VARCHAR(50) NOT NULL, -- 'VIEW', 'UPDATE', 'DISCLOSURE', 'EXPORT'
    access_timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
    access_reason TEXT,
    ip_address INET,
    user_agent TEXT,
    disclosure_recipient VARCHAR(255), -- For DISCLOSURE type
    disclosure_method VARCHAR(50), -- 'VERBAL', 'WRITTEN', 'ELECTRONIC', 'FAX'
    authorization_reference VARCHAR(255),
    information_disclosed TEXT,
    
    -- Audit metadata
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_access_type CHECK (access_type IN (
        'VIEW', 'UPDATE', 'CREATE', 'DELETE', 'DISCLOSURE', 'EXPORT', 'PRINT'
    )),
    CONSTRAINT valid_disclosure_method CHECK (
        disclosure_method IS NULL OR 
        disclosure_method IN ('VERBAL', 'WRITTEN', 'ELECTRONIC', 'FAX', 'PORTAL')
    )
);

-- Indexes for audit log queries
CREATE INDEX idx_client_access_audit_client ON client_access_audit(client_id);
CREATE INDEX idx_client_access_audit_user ON client_access_audit(accessed_by);
CREATE INDEX idx_client_access_audit_type ON client_access_audit(access_type);
CREATE INDEX idx_client_access_audit_timestamp ON client_access_audit(access_timestamp);
CREATE INDEX idx_client_access_audit_disclosure ON client_access_audit(client_id, access_type) 
    WHERE access_type = 'DISCLOSURE';

-- Comments
COMMENT ON TABLE client_access_audit IS 'HIPAA-compliant audit log for client record access and disclosure (Texas Privacy Protection Act)';
COMMENT ON COLUMN client_access_audit.access_type IS 'Type of access to client record';
COMMENT ON COLUMN client_access_audit.disclosure_recipient IS 'Name of person/organization receiving disclosed information';
COMMENT ON COLUMN client_access_audit.disclosure_method IS 'Method used for disclosure';
COMMENT ON COLUMN client_access_audit.authorization_reference IS 'Reference to authorization/consent document';

-- Create registry check results table for Texas compliance
CREATE TABLE registry_check_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    caregiver_id UUID NOT NULL REFERENCES caregivers(id),
    registry_type VARCHAR(50) NOT NULL, -- 'TX_EMPLOYEE_MISCONDUCT', 'TX_NURSE_AIDE', 'FL_LEVEL2_BACKGROUND'
    check_date TIMESTAMP NOT NULL,
    expiration_date DATE,
    status VARCHAR(50) NOT NULL, -- 'CLEAR', 'PENDING', 'LISTED', 'FLAGGED', 'EXPIRED'
    confirmation_number VARCHAR(100),
    performed_by UUID NOT NULL REFERENCES users(id),
    
    -- Listing details (if flagged)
    listing_details JSONB,
    
    -- Documentation
    document_path VARCHAR(500),
    notes TEXT,
    
    -- Audit fields
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES users(id),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by UUID NOT NULL REFERENCES users(id),
    
    -- Constraints
    CONSTRAINT valid_registry_type CHECK (registry_type IN (
        'TX_EMPLOYEE_MISCONDUCT',
        'TX_NURSE_AIDE',
        'TX_DPS_FINGERPRINT',
        'FL_LEVEL2_BACKGROUND',
        'FL_AHCA_CLEARINGHOUSE',
        'OTHER'
    )),
    CONSTRAINT valid_check_status CHECK (status IN (
        'CLEAR', 'PENDING', 'LISTED', 'FLAGGED', 'EXPIRED', 'DISQUALIFIED'
    ))
);

-- Indexes for registry checks
CREATE INDEX idx_registry_checks_caregiver ON registry_check_results(caregiver_id);
CREATE INDEX idx_registry_checks_type ON registry_check_results(registry_type);
CREATE INDEX idx_registry_checks_status ON registry_check_results(status);
CREATE INDEX idx_registry_checks_expiration ON registry_check_results(expiration_date);
CREATE INDEX idx_registry_checks_date ON registry_check_results(check_date);

-- Partial index for expired checks
CREATE INDEX idx_registry_checks_expired ON registry_check_results(caregiver_id, registry_type, expiration_date)
    WHERE status = 'EXPIRED';

-- Trigger for registry check results
CREATE TRIGGER update_registry_checks_updated_at 
    BEFORE UPDATE ON registry_check_results
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE registry_check_results IS 'State registry checks for caregivers (TX Employee Misconduct, TX Nurse Aide, FL Level 2)';
COMMENT ON COLUMN registry_check_results.registry_type IS 'Type of registry check performed';
COMMENT ON COLUMN registry_check_results.confirmation_number IS 'Registry confirmation/reference number';
COMMENT ON COLUMN registry_check_results.listing_details IS 'Details if caregiver is listed on registry (JSONB)';

-- Create plan of care authorization tracking table
CREATE TABLE client_authorizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id),
    authorization_number VARCHAR(100) NOT NULL,
    authorization_type VARCHAR(50) NOT NULL, -- 'SERVICE', 'PLAN_OF_CARE', 'MEDICAID', 'INSURANCE'
    
    -- Authorization details
    state VARCHAR(2), -- 'TX', 'FL'
    authorizing_entity VARCHAR(255), -- HHSC, AHCA, Insurance company
    authorizing_provider VARCHAR(255), -- Physician/licensed professional
    authorization_date DATE NOT NULL,
    effective_date DATE NOT NULL,
    expiration_date DATE NOT NULL,
    
    -- Services and units
    authorized_services JSONB NOT NULL DEFAULT '[]',
    total_authorized_units DECIMAL(10, 2),
    used_units DECIMAL(10, 2) DEFAULT 0,
    remaining_units DECIMAL(10, 2),
    unit_type VARCHAR(50), -- 'HOURS', 'VISITS', 'DAYS'
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    status_reason TEXT,
    
    -- Documentation
    form_number VARCHAR(100), -- e.g., 'HHSC Form 4100', 'AHCA Form 484'
    document_path VARCHAR(500),
    
    -- Review and renewal
    last_review_date DATE,
    next_review_due DATE,
    
    -- Metadata
    notes TEXT,
    custom_fields JSONB,
    
    -- Audit fields
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES users(id),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by UUID NOT NULL REFERENCES users(id),
    version INTEGER NOT NULL DEFAULT 1,
    deleted_at TIMESTAMP,
    deleted_by UUID REFERENCES users(id),
    
    -- Constraints
    CONSTRAINT valid_auth_state CHECK (state IN ('TX', 'FL')),
    CONSTRAINT valid_auth_type CHECK (authorization_type IN (
        'SERVICE', 'PLAN_OF_CARE', 'MEDICAID', 'MEDICARE', 'INSURANCE', 'OTHER'
    )),
    CONSTRAINT valid_auth_status CHECK (status IN (
        'ACTIVE', 'EXPIRED', 'SUSPENDED', 'CANCELLED', 'PENDING'
    )),
    CONSTRAINT valid_auth_unit_type CHECK (unit_type IN (
        'HOURS', 'VISITS', 'DAYS', 'UNITS', 'EPISODES'
    )),
    CONSTRAINT valid_date_range CHECK (expiration_date > effective_date),
    CONSTRAINT valid_unit_usage CHECK (
        used_units IS NULL OR 
        total_authorized_units IS NULL OR 
        used_units <= total_authorized_units
    )
);

-- Indexes for authorization tracking
CREATE INDEX idx_client_auths_client ON client_authorizations(client_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_client_auths_status ON client_authorizations(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_client_auths_state ON client_authorizations(state) WHERE deleted_at IS NULL;
CREATE INDEX idx_client_auths_effective ON client_authorizations(effective_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_client_auths_expiration ON client_authorizations(expiration_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_client_auths_number ON client_authorizations(authorization_number) WHERE deleted_at IS NULL;
CREATE INDEX idx_client_auths_review_due ON client_authorizations(next_review_due) 
    WHERE deleted_at IS NULL AND status = 'ACTIVE';

-- Partial index for active authorizations
CREATE INDEX idx_client_auths_active ON client_authorizations(client_id, effective_date, expiration_date)
    WHERE deleted_at IS NULL AND status = 'ACTIVE';

-- JSONB index for authorized services
CREATE INDEX idx_client_auths_services ON client_authorizations USING gin(authorized_services);

-- Trigger for authorization tracking
CREATE TRIGGER update_client_authorizations_updated_at 
    BEFORE UPDATE ON client_authorizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate remaining units
CREATE OR REPLACE FUNCTION calculate_remaining_units()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.total_authorized_units IS NOT NULL AND NEW.used_units IS NOT NULL THEN
        NEW.remaining_units := NEW.total_authorized_units - NEW.used_units;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically calculate remaining units
CREATE TRIGGER calculate_authorization_remaining_units
    BEFORE INSERT OR UPDATE OF total_authorized_units, used_units ON client_authorizations
    FOR EACH ROW
    EXECUTE FUNCTION calculate_remaining_units();

-- Comments
COMMENT ON TABLE client_authorizations IS 'Plan of care and service authorizations for clients (TX/FL compliance)';
COMMENT ON COLUMN client_authorizations.authorization_number IS 'Unique authorization identifier from payer/state';
COMMENT ON COLUMN client_authorizations.authorized_services IS 'Array of authorized service codes and details (JSONB)';
COMMENT ON COLUMN client_authorizations.form_number IS 'State-specific form reference (e.g., HHSC Form 4100)';
COMMENT ON COLUMN client_authorizations.remaining_units IS 'Auto-calculated remaining authorized units';
