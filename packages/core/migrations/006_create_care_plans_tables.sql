-- Care Plans & Tasks Library Schema
-- Comprehensive care planning, task management, and progress tracking

-- Care Plans table
CREATE TABLE care_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identification
    plan_number VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    
    -- Associations
    client_id UUID NOT NULL REFERENCES clients(id),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    branch_id UUID REFERENCES branches(id),
    
    -- Plan metadata
    plan_type VARCHAR(50) NOT NULL CHECK (plan_type IN (
        'PERSONAL_CARE', 'COMPANION', 'SKILLED_NURSING', 'THERAPY',
        'HOSPICE', 'RESPITE', 'LIVE_IN', 'CUSTOM'
    )),
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT' CHECK (status IN (
        'DRAFT', 'PENDING_APPROVAL', 'ACTIVE', 'ON_HOLD',
        'EXPIRED', 'DISCONTINUED', 'COMPLETED'
    )),
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN (
        'LOW', 'MEDIUM', 'HIGH', 'URGENT'
    )),
    
    -- Dates
    effective_date DATE NOT NULL,
    expiration_date DATE,
    review_date DATE,
    last_reviewed_date DATE,
    
    -- Care team
    primary_caregiver_id UUID REFERENCES caregivers(id),
    coordinator_id UUID REFERENCES users(id),
    supervisor_id UUID REFERENCES users(id),
    physician_id UUID,
    
    -- Assessment and diagnosis
    assessment_summary TEXT,
    medical_diagnosis TEXT[],
    functional_limitations TEXT[],
    
    -- Plan content (stored as JSONB for flexibility)
    goals JSONB NOT NULL DEFAULT '[]',
    interventions JSONB NOT NULL DEFAULT '[]',
    task_templates JSONB NOT NULL DEFAULT '[]',
    
    -- Frequency and schedule
    service_frequency JSONB,
    estimated_hours_per_week DECIMAL(5, 2),
    
    -- Authorization
    authorized_by UUID REFERENCES users(id),
    authorized_date DATE,
    authorization_number VARCHAR(100),
    payer_source JSONB,
    authorization_hours DECIMAL(7, 2),
    authorization_start_date DATE,
    authorization_end_date DATE,
    
    -- Documentation requirements
    required_documentation JSONB,
    signature_requirements JSONB,
    
    -- Safety and restrictions
    restrictions TEXT[],
    precautions TEXT[],
    allergies JSONB,
    contraindications TEXT[],
    
    -- Progress and outcomes
    progress_notes JSONB,
    outcomes_measured JSONB,
    
    -- Compliance
    regulatory_requirements TEXT[],
    compliance_status VARCHAR(50) DEFAULT 'PENDING_REVIEW' CHECK (compliance_status IN (
        'COMPLIANT', 'PENDING_REVIEW', 'EXPIRED', 'NON_COMPLIANT'
    )),
    last_compliance_check TIMESTAMP,
    
    -- Modification history
    modification_history JSONB,
    
    -- Metadata
    notes TEXT,
    tags TEXT[],
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
    CONSTRAINT valid_dates CHECK (expiration_date IS NULL OR expiration_date > effective_date),
    CONSTRAINT valid_authorization_dates CHECK (
        authorization_end_date IS NULL OR 
        authorization_start_date IS NULL OR 
        authorization_end_date >= authorization_start_date
    )
);

-- Indexes for care_plans
CREATE INDEX idx_care_plans_client ON care_plans(client_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_care_plans_organization ON care_plans(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_care_plans_branch ON care_plans(branch_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_care_plans_status ON care_plans(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_care_plans_coordinator ON care_plans(coordinator_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_care_plans_plan_type ON care_plans(plan_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_care_plans_compliance ON care_plans(compliance_status) WHERE deleted_at IS NULL;
CREATE INDEX idx_care_plans_effective_date ON care_plans(effective_date DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_care_plans_expiration_date ON care_plans(expiration_date) WHERE deleted_at IS NULL AND expiration_date IS NOT NULL;
CREATE INDEX idx_care_plans_active ON care_plans(client_id, status) WHERE deleted_at IS NULL AND status = 'ACTIVE';

-- GIN indexes for JSONB columns
CREATE INDEX idx_care_plans_goals_gin ON care_plans USING gin(goals);
CREATE INDEX idx_care_plans_interventions_gin ON care_plans USING gin(interventions);
CREATE INDEX idx_care_plans_task_templates_gin ON care_plans USING gin(task_templates);
CREATE INDEX idx_care_plans_custom_fields_gin ON care_plans USING gin(custom_fields);

-- Task Instances table
CREATE TABLE task_instances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- References
    care_plan_id UUID NOT NULL REFERENCES care_plans(id) ON DELETE CASCADE,
    template_id UUID, -- Reference to template within care plan (stored in JSONB)
    visit_id UUID, -- Will reference visits table when created
    client_id UUID NOT NULL REFERENCES clients(id),
    assigned_caregiver_id UUID REFERENCES caregivers(id),
    
    -- Task details
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN (
        'PERSONAL_HYGIENE', 'BATHING', 'DRESSING', 'GROOMING', 'TOILETING',
        'MOBILITY', 'TRANSFERRING', 'AMBULATION',
        'MEDICATION', 'MEAL_PREPARATION', 'FEEDING',
        'HOUSEKEEPING', 'LAUNDRY', 'SHOPPING', 'TRANSPORTATION',
        'COMPANIONSHIP', 'MONITORING', 'DOCUMENTATION', 'OTHER'
    )),
    instructions TEXT NOT NULL,
    
    -- Scheduling
    scheduled_date DATE NOT NULL,
    scheduled_time TIME,
    time_of_day VARCHAR(20) CHECK (time_of_day IN (
        'EARLY_MORNING', 'MORNING', 'AFTERNOON', 'EVENING', 'NIGHT', 'OVERNIGHT', 'ANY'
    )),
    estimated_duration INTEGER, -- minutes
    
    -- Status and completion
    status VARCHAR(50) NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN (
        'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'MISSED', 'CANCELLED', 'ISSUE_REPORTED'
    )),
    completed_at TIMESTAMP,
    completed_by UUID REFERENCES users(id),
    completion_note TEXT,
    completion_signature JSONB,
    completion_photo TEXT[],
    
    -- Verification
    verification_data JSONB,
    quality_check_responses JSONB,
    
    -- Skipping
    skipped_at TIMESTAMP,
    skipped_by UUID REFERENCES users(id),
    skip_reason VARCHAR(255),
    skip_note TEXT,
    
    -- Issues
    issue_reported BOOLEAN DEFAULT FALSE,
    issue_description TEXT,
    issue_reported_at TIMESTAMP,
    issue_reported_by UUID REFERENCES users(id),
    
    -- Requirements
    required_signature BOOLEAN DEFAULT FALSE,
    required_note BOOLEAN DEFAULT FALSE,
    
    -- Custom data
    custom_field_values JSONB,
    notes TEXT,
    
    -- Audit fields
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES users(id),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by UUID NOT NULL REFERENCES users(id),
    version INTEGER NOT NULL DEFAULT 1
);

-- Indexes for task_instances
CREATE INDEX idx_task_instances_care_plan ON task_instances(care_plan_id);
CREATE INDEX idx_task_instances_client ON task_instances(client_id);
CREATE INDEX idx_task_instances_caregiver ON task_instances(assigned_caregiver_id);
CREATE INDEX idx_task_instances_visit ON task_instances(visit_id);
CREATE INDEX idx_task_instances_status ON task_instances(status);
CREATE INDEX idx_task_instances_category ON task_instances(category);
CREATE INDEX idx_task_instances_scheduled_date ON task_instances(scheduled_date DESC);
CREATE INDEX idx_task_instances_completed_at ON task_instances(completed_at DESC) WHERE completed_at IS NOT NULL;
CREATE INDEX idx_task_instances_overdue ON task_instances(scheduled_date, status) WHERE status IN ('SCHEDULED', 'IN_PROGRESS');
CREATE INDEX idx_task_instances_issues ON task_instances(issue_reported) WHERE issue_reported = TRUE;

-- GIN indexes for JSONB columns
CREATE INDEX idx_task_instances_verification_gin ON task_instances USING gin(verification_data);
CREATE INDEX idx_task_instances_custom_fields_gin ON task_instances USING gin(custom_field_values);

-- Progress Notes table
CREATE TABLE progress_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- References
    care_plan_id UUID NOT NULL REFERENCES care_plans(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id),
    visit_id UUID, -- Will reference visits table when created
    
    -- Note metadata
    note_type VARCHAR(50) NOT NULL CHECK (note_type IN (
        'VISIT_NOTE', 'WEEKLY_SUMMARY', 'MONTHLY_SUMMARY',
        'CARE_PLAN_REVIEW', 'INCIDENT', 'CHANGE_IN_CONDITION',
        'COMMUNICATION', 'OTHER'
    )),
    note_date DATE NOT NULL,
    
    -- Author information
    author_id UUID NOT NULL REFERENCES users(id),
    author_name VARCHAR(255) NOT NULL,
    author_role VARCHAR(100) NOT NULL,
    
    -- Content
    content TEXT NOT NULL,
    
    -- Structured data
    goal_progress JSONB,
    observations JSONB,
    concerns TEXT[],
    recommendations TEXT[],
    
    -- Review and approval
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP,
    approved BOOLEAN DEFAULT FALSE,
    
    -- Attachments
    attachments TEXT[],
    
    -- Signature
    signature JSONB,
    
    -- Metadata
    tags TEXT[],
    is_private BOOLEAN DEFAULT FALSE,
    
    -- Audit fields
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES users(id),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by UUID NOT NULL REFERENCES users(id),
    version INTEGER NOT NULL DEFAULT 1
);

-- Indexes for progress_notes
CREATE INDEX idx_progress_notes_care_plan ON progress_notes(care_plan_id);
CREATE INDEX idx_progress_notes_client ON progress_notes(client_id);
CREATE INDEX idx_progress_notes_visit ON progress_notes(visit_id);
CREATE INDEX idx_progress_notes_author ON progress_notes(author_id);
CREATE INDEX idx_progress_notes_note_type ON progress_notes(note_type);
CREATE INDEX idx_progress_notes_note_date ON progress_notes(note_date DESC);
CREATE INDEX idx_progress_notes_created_at ON progress_notes(created_at DESC);
CREATE INDEX idx_progress_notes_reviewed ON progress_notes(reviewed_by, reviewed_at) WHERE reviewed_at IS NOT NULL;

-- GIN indexes for JSONB columns
CREATE INDEX idx_progress_notes_goal_progress_gin ON progress_notes USING gin(goal_progress);
CREATE INDEX idx_progress_notes_observations_gin ON progress_notes USING gin(observations);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_care_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.version = OLD.version + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER care_plans_updated_at
    BEFORE UPDATE ON care_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_care_plans_updated_at();

CREATE OR REPLACE FUNCTION update_task_instances_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.version = OLD.version + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER task_instances_updated_at
    BEFORE UPDATE ON task_instances
    FOR EACH ROW
    EXECUTE FUNCTION update_task_instances_updated_at();

CREATE OR REPLACE FUNCTION update_progress_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.version = OLD.version + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER progress_notes_updated_at
    BEFORE UPDATE ON progress_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_progress_notes_updated_at();

-- Comments for documentation
COMMENT ON TABLE care_plans IS 'Comprehensive care plans defining goals, interventions, and task templates';
COMMENT ON TABLE task_instances IS 'Individual task instances created from templates or ad-hoc for specific visits';
COMMENT ON TABLE progress_notes IS 'Clinical notes documenting client progress, observations, and care outcomes';

COMMENT ON COLUMN care_plans.goals IS 'Array of care plan goals with targets, milestones, and progress tracking';
COMMENT ON COLUMN care_plans.interventions IS 'Array of interventions detailing specific actions to achieve goals';
COMMENT ON COLUMN care_plans.task_templates IS 'Array of reusable task templates for generating visit-specific tasks';
COMMENT ON COLUMN task_instances.verification_data IS 'GPS location, photos, vital signs, or other verification data';
COMMENT ON COLUMN task_instances.quality_check_responses IS 'Responses to quality check questions for the task';
COMMENT ON COLUMN progress_notes.goal_progress IS 'Structured progress updates for each goal';
COMMENT ON COLUMN progress_notes.observations IS 'Structured clinical observations categorized by type';
