-- Care Commons - Clients Table
-- Client & Demographics Management vertical

CREATE TABLE clients (
    -- Primary key and organization
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    branch_id UUID NOT NULL REFERENCES branches(id),
    
    -- Identity
    client_number VARCHAR(50) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    preferred_name VARCHAR(100),
    date_of_birth DATE NOT NULL,
    ssn VARCHAR(255), -- Encrypted
    gender VARCHAR(50),
    pronouns VARCHAR(50),
    
    -- Contact information
    primary_phone JSONB,
    alternate_phone JSONB,
    email VARCHAR(255),
    preferred_contact_method VARCHAR(50),
    communication_preferences JSONB,
    
    -- Demographics
    language VARCHAR(50),
    ethnicity VARCHAR(100),
    race JSONB,
    marital_status VARCHAR(50),
    veteran_status BOOLEAN DEFAULT FALSE,
    
    -- Residence
    primary_address JSONB NOT NULL,
    secondary_addresses JSONB,
    living_arrangement JSONB,
    mobility_info JSONB,
    
    -- Contacts
    emergency_contacts JSONB NOT NULL DEFAULT '[]',
    authorized_contacts JSONB NOT NULL DEFAULT '[]',
    
    -- Healthcare
    primary_physician JSONB,
    pharmacy JSONB,
    insurance JSONB,
    medical_record_number VARCHAR(100),
    
    -- Service information
    programs JSONB NOT NULL DEFAULT '[]',
    service_eligibility JSONB NOT NULL,
    funding_sources JSONB,
    
    -- Risk and safety
    risk_flags JSONB NOT NULL DEFAULT '[]',
    allergies JSONB,
    special_instructions TEXT,
    access_instructions TEXT,
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING_INTAKE',
    intake_date DATE,
    discharge_date DATE,
    discharge_reason TEXT,
    
    -- Metadata
    referral_source VARCHAR(255),
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
    CONSTRAINT unique_client_number UNIQUE (organization_id, client_number),
    CONSTRAINT valid_status CHECK (status IN (
        'INQUIRY', 'PENDING_INTAKE', 'ACTIVE', 'INACTIVE', 
        'ON_HOLD', 'DISCHARGED', 'DECEASED'
    ))
);

-- Indexes for performance
CREATE INDEX idx_clients_organization ON clients(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_clients_branch ON clients(branch_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_clients_status ON clients(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_clients_client_number ON clients(client_number) WHERE deleted_at IS NULL;
CREATE INDEX idx_clients_name ON clients(last_name, first_name) WHERE deleted_at IS NULL;
CREATE INDEX idx_clients_dob ON clients(date_of_birth) WHERE deleted_at IS NULL;
CREATE INDEX idx_clients_intake_date ON clients(intake_date) WHERE deleted_at IS NULL;

-- Full-text search index
CREATE INDEX idx_clients_search ON clients USING gin(
    to_tsvector('english', 
        coalesce(first_name, '') || ' ' || 
        coalesce(last_name, '') || ' ' || 
        coalesce(client_number, '')
    )
) WHERE deleted_at IS NULL;

-- JSONB indexes for querying embedded data
CREATE INDEX idx_clients_primary_address ON clients USING gin(primary_address);
CREATE INDEX idx_clients_risk_flags ON clients USING gin(risk_flags);
CREATE INDEX idx_clients_programs ON clients USING gin(programs);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_clients_updated_at 
    BEFORE UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE clients IS 'Individuals receiving care services';
COMMENT ON COLUMN clients.client_number IS 'Human-readable unique identifier';
COMMENT ON COLUMN clients.ssn IS 'Social Security Number (encrypted)';
COMMENT ON COLUMN clients.primary_address IS 'Primary residence address (JSONB)';
COMMENT ON COLUMN clients.emergency_contacts IS 'Emergency contact list (JSONB array)';
COMMENT ON COLUMN clients.authorized_contacts IS 'Authorized contacts with permissions (JSONB array)';
COMMENT ON COLUMN clients.risk_flags IS 'Safety and care risk flags (JSONB array)';
COMMENT ON COLUMN clients.service_eligibility IS 'Insurance and program eligibility (JSONB)';
COMMENT ON COLUMN clients.programs IS 'Program enrollments (JSONB array)';
