-- Add state-specific fields for TX and FL compliance to care plans
-- TX: 26 TAC §§558, HHSC Forms 1746/8606, Form 485/Plan of Care
-- FL: AHCA Chapter 59A-8, Florida Statute 400.487

-- Add state-specific fields to care_plans table
ALTER TABLE care_plans
    ADD COLUMN IF NOT EXISTS state_jurisdiction VARCHAR(2), -- Two-letter state code
    ADD COLUMN IF NOT EXISTS state_specific_data JSONB DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS order_source VARCHAR(100), -- TX: Physician/authorized professional
    ADD COLUMN IF NOT EXISTS ordering_provider_id UUID REFERENCES users(id),
    ADD COLUMN IF NOT EXISTS ordering_provider_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS ordering_provider_license VARCHAR(100),
    ADD COLUMN IF NOT EXISTS ordering_provider_npi VARCHAR(20),
    ADD COLUMN IF NOT EXISTS order_date TIMESTAMP,
    ADD COLUMN IF NOT EXISTS verbal_order_authenticated_by UUID REFERENCES users(id),
    ADD COLUMN IF NOT EXISTS verbal_order_authenticated_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS rn_delegation_id UUID, -- FL: RN delegation per 59A-8.0216
    ADD COLUMN IF NOT EXISTS rn_supervisor_id UUID REFERENCES users(id),
    ADD COLUMN IF NOT EXISTS rn_supervisor_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS rn_supervisor_license VARCHAR(100),
    ADD COLUMN IF NOT EXISTS last_supervisory_visit_date DATE,
    ADD COLUMN IF NOT EXISTS next_supervisory_visit_due DATE,
    ADD COLUMN IF NOT EXISTS plan_review_interval_days INTEGER DEFAULT 60, -- TX/FL: 60-90 day reviews
    ADD COLUMN IF NOT EXISTS next_review_due DATE,
    ADD COLUMN IF NOT EXISTS last_review_completed_date DATE,
    ADD COLUMN IF NOT EXISTS last_review_completed_by UUID REFERENCES users(id),
    ADD COLUMN IF NOT EXISTS medicaid_program VARCHAR(100), -- TX: STAR+Plus, Community First Choice, etc.
    ADD COLUMN IF NOT EXISTS medicaid_waiver VARCHAR(100), -- TX/FL: Waiver program if applicable
    ADD COLUMN IF NOT EXISTS service_authorization_form VARCHAR(100), -- TX: HHSC Form 4100 series
    ADD COLUMN IF NOT EXISTS service_authorization_units DECIMAL(7, 2), -- Hours or units authorized
    ADD COLUMN IF NOT EXISTS service_authorization_period_start DATE,
    ADD COLUMN IF NOT EXISTS service_authorization_period_end DATE,
    ADD COLUMN IF NOT EXISTS is_cds_model BOOLEAN DEFAULT FALSE, -- TX: Consumer Directed Services
    ADD COLUMN IF NOT EXISTS employer_authority_id UUID, -- TX CDS: Who manages caregivers
    ADD COLUMN IF NOT EXISTS financial_management_service_id UUID, -- TX CDS: FMS provider
    ADD COLUMN IF NOT EXISTS plan_of_care_form_number VARCHAR(50), -- TX Form 485, FL AHCA Form 484
    ADD COLUMN IF NOT EXISTS disaster_plan_on_file BOOLEAN DEFAULT FALSE, -- TX: §558 Emergency Preparedness
    ADD COLUMN IF NOT EXISTS infection_control_plan_reviewed BOOLEAN DEFAULT FALSE;

-- Create index for state jurisdiction queries
CREATE INDEX IF NOT EXISTS idx_care_plans_state_jurisdiction 
    ON care_plans(state_jurisdiction) WHERE deleted_at IS NULL;

-- Create index for review due dates
CREATE INDEX IF NOT EXISTS idx_care_plans_review_due 
    ON care_plans(next_review_due) WHERE deleted_at IS NULL AND next_review_due IS NOT NULL;

-- Create index for supervisory visit tracking
CREATE INDEX IF NOT EXISTS idx_care_plans_supervisory_visit_due 
    ON care_plans(next_supervisory_visit_due) WHERE deleted_at IS NULL AND next_supervisory_visit_due IS NOT NULL;

-- Create index for Medicaid program tracking
CREATE INDEX IF NOT EXISTS idx_care_plans_medicaid_program 
    ON care_plans(medicaid_program) WHERE deleted_at IS NULL AND medicaid_program IS NOT NULL;

-- Create GIN index for state-specific data JSONB
CREATE INDEX IF NOT EXISTS idx_care_plans_state_specific_data_gin 
    ON care_plans USING gin(state_specific_data);

-- Add state-specific task tracking
ALTER TABLE task_instances
    ADD COLUMN IF NOT EXISTS requires_supervision BOOLEAN DEFAULT FALSE, -- FL: RN oversight required
    ADD COLUMN IF NOT EXISTS supervisor_review_required BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS supervisor_reviewed_by UUID REFERENCES users(id),
    ADD COLUMN IF NOT EXISTS supervisor_reviewed_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS delegation_authority_id UUID, -- FL: RN delegation record
    ADD COLUMN IF NOT EXISTS skill_level_required VARCHAR(50), -- CNA, HHA, RN, LPN, etc.
    ADD COLUMN IF NOT EXISTS state_specific_task_data JSONB DEFAULT '{}';

-- Create index for tasks requiring supervision
CREATE INDEX IF NOT EXISTS idx_task_instances_supervision_required 
    ON task_instances(requires_supervision) WHERE requires_supervision = TRUE;

-- Create index for tasks needing supervisor review
CREATE INDEX IF NOT EXISTS idx_task_instances_supervisor_review 
    ON task_instances(supervisor_review_required, supervisor_reviewed_at) 
    WHERE supervisor_review_required = TRUE AND supervisor_reviewed_at IS NULL;

-- Create GIN index for state-specific task data
CREATE INDEX IF NOT EXISTS idx_task_instances_state_specific_data_gin 
    ON task_instances USING gin(state_specific_task_data);

-- Add TX-specific tracking table for service authorization and service delivery
CREATE TABLE IF NOT EXISTS service_authorizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Core identifiers
    care_plan_id UUID NOT NULL REFERENCES care_plans(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    
    -- TX/FL authorization details
    state_jurisdiction VARCHAR(2) NOT NULL,
    authorization_type VARCHAR(100) NOT NULL, -- TX: HHSC, MCO; FL: AHCA, SMMC
    authorization_number VARCHAR(100) NOT NULL,
    payer_name VARCHAR(255) NOT NULL,
    payer_id VARCHAR(100),
    
    -- Authorization scope
    service_codes TEXT[] NOT NULL, -- Procedure codes
    authorized_units DECIMAL(10, 2) NOT NULL, -- Hours or units
    unit_type VARCHAR(50) NOT NULL, -- HOURS, VISITS, DAYS
    rate_per_unit DECIMAL(10, 2),
    
    -- Period
    effective_date DATE NOT NULL,
    expiration_date DATE NOT NULL,
    
    -- Usage tracking
    units_used DECIMAL(10, 2) DEFAULT 0,
    units_remaining DECIMAL(10, 2),
    last_usage_date DATE,
    
    -- TX-specific
    form_number VARCHAR(50), -- HHSC Form 4100 series
    mcoid VARCHAR(100), -- TX MCO ID
    
    -- FL-specific  
    ahca_provider_number VARCHAR(50),
    smmc_plan_name VARCHAR(100),
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN (
        'PENDING', 'ACTIVE', 'EXPIRING_SOON', 'EXPIRED', 'SUSPENDED', 'TERMINATED'
    )),
    
    -- Metadata
    notes TEXT,
    state_specific_data JSONB DEFAULT '{}',
    
    -- Audit
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES users(id),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by UUID NOT NULL REFERENCES users(id),
    version INTEGER NOT NULL DEFAULT 1,
    deleted_at TIMESTAMP,
    deleted_by UUID REFERENCES users(id),
    
    -- Constraints
    CONSTRAINT valid_authorization_period CHECK (expiration_date > effective_date),
    CONSTRAINT valid_units CHECK (authorized_units > 0),
    CONSTRAINT valid_units_remaining CHECK (units_remaining >= 0)
);

-- Indexes for service_authorizations
CREATE INDEX idx_service_authorizations_care_plan 
    ON service_authorizations(care_plan_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_service_authorizations_client 
    ON service_authorizations(client_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_service_authorizations_organization 
    ON service_authorizations(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_service_authorizations_status 
    ON service_authorizations(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_service_authorizations_expiring 
    ON service_authorizations(expiration_date) WHERE deleted_at IS NULL AND status = 'ACTIVE';
CREATE INDEX idx_service_authorizations_state 
    ON service_authorizations(state_jurisdiction) WHERE deleted_at IS NULL;

-- Trigger for service_authorizations updated_at
CREATE OR REPLACE FUNCTION update_service_authorizations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.version = OLD.version + 1;
    
    -- Auto-calculate units_remaining
    NEW.units_remaining = NEW.authorized_units - COALESCE(NEW.units_used, 0);
    
    -- Auto-update status based on expiration
    IF NEW.expiration_date < CURRENT_DATE THEN
        NEW.status = 'EXPIRED';
    ELSIF NEW.expiration_date <= CURRENT_DATE + INTERVAL '30 days' AND NEW.status = 'ACTIVE' THEN
        NEW.status = 'EXPIRING_SOON';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER service_authorizations_updated_at
    BEFORE UPDATE ON service_authorizations
    FOR EACH ROW
    EXECUTE FUNCTION update_service_authorizations_updated_at();

-- Add RN delegation tracking for FL (59A-8.0216)
CREATE TABLE IF NOT EXISTS rn_delegations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Core identifiers
    care_plan_id UUID NOT NULL REFERENCES care_plans(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    branch_id UUID REFERENCES branches(id),
    
    -- Delegation details
    delegating_rn_id UUID NOT NULL REFERENCES users(id), -- Must be RN
    delegating_rn_name VARCHAR(255) NOT NULL,
    delegating_rn_license VARCHAR(100) NOT NULL,
    
    delegated_to_caregiver_id UUID REFERENCES caregivers(id), -- CNA, HHA, etc.
    delegated_to_caregiver_name VARCHAR(255) NOT NULL,
    delegated_to_credential_type VARCHAR(50) NOT NULL, -- CNA, HHA, etc.
    delegated_to_credential_number VARCHAR(100),
    
    -- Scope of delegation
    task_category VARCHAR(50) NOT NULL, -- MEDICATION, WOUND_CARE, etc.
    task_description TEXT NOT NULL,
    specific_skills_delegated TEXT[] NOT NULL,
    limitations TEXT[],
    
    -- Training and competency
    training_provided BOOLEAN NOT NULL DEFAULT FALSE,
    training_date DATE,
    training_method VARCHAR(100), -- In-person, virtual, etc.
    competency_evaluated BOOLEAN NOT NULL DEFAULT FALSE,
    competency_evaluation_date DATE,
    competency_evaluator_id UUID REFERENCES users(id),
    evaluation_result VARCHAR(50) CHECK (evaluation_result IN (
        'COMPETENT', 'NEEDS_IMPROVEMENT', 'NOT_COMPETENT', 'PENDING'
    )),
    
    -- Period and supervision
    effective_date DATE NOT NULL,
    expiration_date DATE,
    supervision_frequency VARCHAR(100), -- Daily, Weekly, Per Visit, etc.
    last_supervision_date DATE,
    next_supervision_due DATE,
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN (
        'PENDING_TRAINING', 'PENDING_EVALUATION', 'ACTIVE', 'SUSPENDED', 'REVOKED', 'EXPIRED'
    )),
    revocation_reason TEXT,
    revoked_by UUID REFERENCES users(id),
    revoked_at TIMESTAMP,
    
    -- FL-specific
    ahca_delegation_form_number VARCHAR(50),
    state_specific_data JSONB DEFAULT '{}',
    
    -- Metadata
    notes TEXT,
    
    -- Audit
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES users(id),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by UUID NOT NULL REFERENCES users(id),
    version INTEGER NOT NULL DEFAULT 1,
    deleted_at TIMESTAMP,
    deleted_by UUID REFERENCES users(id),
    
    -- Constraints
    CONSTRAINT valid_delegation_period CHECK (
        expiration_date IS NULL OR expiration_date > effective_date
    )
);

-- Indexes for rn_delegations
CREATE INDEX idx_rn_delegations_care_plan 
    ON rn_delegations(care_plan_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_rn_delegations_client 
    ON rn_delegations(client_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_rn_delegations_rn 
    ON rn_delegations(delegating_rn_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_rn_delegations_caregiver 
    ON rn_delegations(delegated_to_caregiver_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_rn_delegations_status 
    ON rn_delegations(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_rn_delegations_supervision_due 
    ON rn_delegations(next_supervision_due) WHERE deleted_at IS NULL AND status = 'ACTIVE';
CREATE INDEX idx_rn_delegations_task_category 
    ON rn_delegations(task_category) WHERE deleted_at IS NULL;

-- Trigger for rn_delegations updated_at
CREATE OR REPLACE FUNCTION update_rn_delegations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.version = OLD.version + 1;
    
    -- Auto-update status based on expiration
    IF NEW.expiration_date IS NOT NULL AND NEW.expiration_date < CURRENT_DATE AND NEW.status = 'ACTIVE' THEN
        NEW.status = 'EXPIRED';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER rn_delegations_updated_at
    BEFORE UPDATE ON rn_delegations
    FOR EACH ROW
    EXECUTE FUNCTION update_rn_delegations_updated_at();

-- Comments
COMMENT ON TABLE service_authorizations IS 'TX/FL service authorizations tracking HHSC/AHCA approved services and units';
COMMENT ON TABLE rn_delegations IS 'FL RN delegation records per 59A-8.0216 for delegated nursing tasks';

COMMENT ON COLUMN care_plans.state_jurisdiction IS 'Two-letter state code (TX, FL) for jurisdiction-specific compliance';
COMMENT ON COLUMN care_plans.order_source IS 'TX: Physician or authorized professional ordering services';
COMMENT ON COLUMN care_plans.rn_delegation_id IS 'FL: Active RN delegation record ID if nursing tasks delegated';
COMMENT ON COLUMN care_plans.plan_review_interval_days IS 'TX/FL: Days between mandatory plan reviews (typically 60-90)';
COMMENT ON COLUMN care_plans.is_cds_model IS 'TX: Consumer Directed Services model (client is employer)';
COMMENT ON COLUMN care_plans.disaster_plan_on_file IS 'TX 26 TAC §558: Emergency preparedness plan documented';

COMMENT ON COLUMN task_instances.requires_supervision IS 'FL: Task requires RN supervision per delegation';
COMMENT ON COLUMN task_instances.skill_level_required IS 'Minimum credential required: CNA, HHA, RN, LPN';
