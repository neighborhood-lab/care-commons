-- Care Commons - Caregivers Table
-- Caregiver & Staff Management vertical

CREATE TABLE caregivers (
    -- Primary key and organization
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    branch_ids UUID[] NOT NULL DEFAULT '{}',
    primary_branch_id UUID NOT NULL REFERENCES branches(id),
    
    -- Identity
    employee_number VARCHAR(50) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    preferred_name VARCHAR(100),
    date_of_birth DATE NOT NULL,
    ssn VARCHAR(255), -- Encrypted
    gender VARCHAR(50),
    pronouns VARCHAR(50),
    
    -- Contact information
    primary_phone JSONB NOT NULL,
    alternate_phone JSONB,
    email VARCHAR(255) NOT NULL,
    preferred_contact_method VARCHAR(50) NOT NULL DEFAULT 'PHONE',
    communication_preferences JSONB,
    
    -- Demographics
    language VARCHAR(50),
    languages VARCHAR(50)[] DEFAULT '{}',
    ethnicity VARCHAR(100),
    race VARCHAR(100)[] DEFAULT '{}',
    
    -- Address
    primary_address JSONB NOT NULL,
    mailing_address JSONB,
    
    -- Emergency contacts
    emergency_contacts JSONB NOT NULL DEFAULT '[]',
    
    -- Employment information
    employment_type VARCHAR(50) NOT NULL,
    employment_status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    hire_date DATE NOT NULL,
    termination_date DATE,
    termination_reason TEXT,
    rehire_eligible BOOLEAN,
    
    -- Role and permissions
    role VARCHAR(100) NOT NULL,
    permissions VARCHAR(100)[] DEFAULT '{}',
    supervisor_id UUID REFERENCES caregivers(id),
    
    -- Credentials and compliance
    credentials JSONB NOT NULL DEFAULT '[]',
    background_check JSONB,
    drug_screening JSONB,
    health_screening JSONB,
    
    -- Training and qualifications
    training JSONB NOT NULL DEFAULT '[]',
    skills JSONB NOT NULL DEFAULT '[]',
    specializations VARCHAR(100)[] DEFAULT '{}',
    
    -- Availability and preferences
    availability JSONB NOT NULL,
    work_preferences JSONB,
    max_hours_per_week INTEGER,
    min_hours_per_week INTEGER,
    willing_to_travel BOOLEAN DEFAULT FALSE,
    max_travel_distance INTEGER, -- miles
    
    -- Compensation
    pay_rate JSONB NOT NULL,
    alternate_pay_rates JSONB,
    payroll_info JSONB,
    
    -- Performance and compliance
    performance_rating DECIMAL(2, 1),
    last_review_date DATE,
    next_review_date DATE,
    compliance_status VARCHAR(50) NOT NULL DEFAULT 'PENDING_VERIFICATION',
    last_compliance_check TIMESTAMP,
    
    -- Scheduling metadata
    reliability_score DECIMAL(3, 2),
    preferred_clients UUID[],
    restricted_clients UUID[],
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING_ONBOARDING',
    status_reason TEXT,
    
    -- Documents
    documents JSONB,
    
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
    CONSTRAINT unique_employee_number UNIQUE (organization_id, employee_number),
    CONSTRAINT unique_email UNIQUE (email),
    CONSTRAINT valid_employment_type CHECK (employment_type IN (
        'FULL_TIME', 'PART_TIME', 'PER_DIEM', 'CONTRACT', 'TEMPORARY', 'SEASONAL'
    )),
    CONSTRAINT valid_employment_status CHECK (employment_status IN (
        'ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'TERMINATED', 'RETIRED'
    )),
    CONSTRAINT valid_role CHECK (role IN (
        'CAREGIVER', 'SENIOR_CAREGIVER', 'CERTIFIED_NURSING_ASSISTANT',
        'HOME_HEALTH_AIDE', 'PERSONAL_CARE_AIDE', 'COMPANION',
        'NURSE_RN', 'NURSE_LPN', 'THERAPIST', 
        'COORDINATOR', 'SUPERVISOR', 'SCHEDULER', 'ADMINISTRATIVE'
    )),
    CONSTRAINT valid_status CHECK (status IN (
        'APPLICATION', 'INTERVIEWING', 'PENDING_ONBOARDING', 'ONBOARDING',
        'ACTIVE', 'INACTIVE', 'ON_LEAVE', 'SUSPENDED', 'TERMINATED', 'RETIRED'
    )),
    CONSTRAINT valid_compliance_status CHECK (compliance_status IN (
        'COMPLIANT', 'PENDING_VERIFICATION', 'EXPIRING_SOON', 'EXPIRED', 'NON_COMPLIANT'
    )),
    CONSTRAINT valid_performance_rating CHECK (
        performance_rating IS NULL OR (performance_rating >= 1.0 AND performance_rating <= 5.0)
    ),
    CONSTRAINT valid_reliability_score CHECK (
        reliability_score IS NULL OR (reliability_score >= 0.0 AND reliability_score <= 1.0)
    ),
    CONSTRAINT primary_branch_in_branches CHECK (
        primary_branch_id = ANY(branch_ids)
    )
);

-- Indexes for performance
CREATE INDEX idx_caregivers_organization ON caregivers(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_caregivers_branch ON caregivers USING gin(branch_ids) WHERE deleted_at IS NULL;
CREATE INDEX idx_caregivers_primary_branch ON caregivers(primary_branch_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_caregivers_status ON caregivers(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_caregivers_employment_status ON caregivers(employment_status) WHERE deleted_at IS NULL;
CREATE INDEX idx_caregivers_compliance_status ON caregivers(compliance_status) WHERE deleted_at IS NULL;
CREATE INDEX idx_caregivers_employee_number ON caregivers(employee_number) WHERE deleted_at IS NULL;
CREATE INDEX idx_caregivers_email ON caregivers(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_caregivers_name ON caregivers(last_name, first_name) WHERE deleted_at IS NULL;
CREATE INDEX idx_caregivers_role ON caregivers(role) WHERE deleted_at IS NULL;
CREATE INDEX idx_caregivers_supervisor ON caregivers(supervisor_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_caregivers_hire_date ON caregivers(hire_date) WHERE deleted_at IS NULL;

-- Full-text search index
CREATE INDEX idx_caregivers_search ON caregivers USING gin(
    to_tsvector('english', 
        coalesce(first_name, '') || ' ' || 
        coalesce(last_name, '') || ' ' || 
        coalesce(employee_number, '')
    )
) WHERE deleted_at IS NULL;

-- JSONB indexes for querying embedded data
CREATE INDEX idx_caregivers_credentials ON caregivers USING gin(credentials);
CREATE INDEX idx_caregivers_skills ON caregivers USING gin(skills);
CREATE INDEX idx_caregivers_training ON caregivers USING gin(training);
CREATE INDEX idx_caregivers_availability ON caregivers USING gin(availability);
CREATE INDEX idx_caregivers_languages ON caregivers USING gin(languages);

-- GIN index for array columns
CREATE INDEX idx_caregivers_specializations ON caregivers USING gin(specializations);
CREATE INDEX idx_caregivers_permissions ON caregivers USING gin(permissions);

-- Partial indexes for common queries
CREATE INDEX idx_caregivers_active ON caregivers(id) 
    WHERE deleted_at IS NULL AND status = 'ACTIVE' AND compliance_status = 'COMPLIANT';
CREATE INDEX idx_caregivers_expiring_credentials ON caregivers(id)
    WHERE deleted_at IS NULL AND compliance_status IN ('EXPIRING_SOON', 'EXPIRED');

-- Trigger to automatically update updated_at
CREATE TRIGGER update_caregivers_updated_at 
    BEFORE UPDATE ON caregivers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to validate credential expiration
CREATE OR REPLACE FUNCTION check_credential_expiration()
RETURNS TRIGGER AS $$
BEGIN
    -- Update compliance status if credentials are expiring or expired
    IF NEW.credentials IS NOT NULL THEN
        -- Check for expired credentials
        IF EXISTS (
            SELECT 1 FROM jsonb_array_elements(NEW.credentials) AS cred
            WHERE cred->>'status' = 'ACTIVE'
              AND (cred->>'expirationDate')::date < CURRENT_DATE
        ) THEN
            NEW.compliance_status := 'EXPIRED';
        -- Check for expiring credentials (within 30 days)
        ELSIF EXISTS (
            SELECT 1 FROM jsonb_array_elements(NEW.credentials) AS cred
            WHERE cred->>'status' = 'ACTIVE'
              AND (cred->>'expirationDate')::date <= CURRENT_DATE + INTERVAL '30 days'
              AND (cred->>'expirationDate')::date >= CURRENT_DATE
        ) THEN
            IF NEW.compliance_status = 'COMPLIANT' THEN
                NEW.compliance_status := 'EXPIRING_SOON';
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to check credential expiration on insert/update
CREATE TRIGGER check_caregiver_credentials
    BEFORE INSERT OR UPDATE OF credentials ON caregivers
    FOR EACH ROW
    EXECUTE FUNCTION check_credential_expiration();

-- Comments for documentation
COMMENT ON TABLE caregivers IS 'Personnel providing care services';
COMMENT ON COLUMN caregivers.employee_number IS 'Human-readable unique identifier';
COMMENT ON COLUMN caregivers.ssn IS 'Social Security Number (encrypted)';
COMMENT ON COLUMN caregivers.branch_ids IS 'Branches where caregiver can work';
COMMENT ON COLUMN caregivers.primary_branch_id IS 'Primary branch assignment';
COMMENT ON COLUMN caregivers.credentials IS 'Certifications and licenses (JSONB array)';
COMMENT ON COLUMN caregivers.background_check IS 'Background check record (JSONB)';
COMMENT ON COLUMN caregivers.drug_screening IS 'Drug screening record (JSONB)';
COMMENT ON COLUMN caregivers.health_screening IS 'Health screening and immunizations (JSONB)';
COMMENT ON COLUMN caregivers.training IS 'Training records (JSONB array)';
COMMENT ON COLUMN caregivers.skills IS 'Skills and proficiency levels (JSONB array)';
COMMENT ON COLUMN caregivers.availability IS 'Weekly availability schedule (JSONB)';
COMMENT ON COLUMN caregivers.work_preferences IS 'Shift and client preferences (JSONB)';
COMMENT ON COLUMN caregivers.pay_rate IS 'Primary pay rate (JSONB)';
COMMENT ON COLUMN caregivers.alternate_pay_rates IS 'Alternative pay rates by service type (JSONB array)';
COMMENT ON COLUMN caregivers.payroll_info IS 'Payroll and banking information (JSONB, encrypted)';
COMMENT ON COLUMN caregivers.compliance_status IS 'Overall compliance status based on credentials and checks';
COMMENT ON COLUMN caregivers.reliability_score IS 'Calculated reliability metric (0.0 to 1.0)';
COMMENT ON COLUMN caregivers.preferred_clients IS 'Client IDs for preferred assignments';
COMMENT ON COLUMN caregivers.restricted_clients IS 'Client IDs that cannot be assigned';
