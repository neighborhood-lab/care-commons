-- Migration: Scheduling & Visit Management
-- Description: Creates tables for service patterns, schedules, and visits
-- Version: 003
-- Date: 2024-01-15

-- ============================================================================
-- SERVICE PATTERNS
-- ============================================================================

CREATE TABLE IF NOT EXISTS service_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    branch_id UUID NOT NULL,
    client_id UUID NOT NULL,
    
    -- Pattern definition
    name VARCHAR(200) NOT NULL,
    description TEXT,
    pattern_type VARCHAR(50) NOT NULL CHECK (pattern_type IN ('RECURRING', 'ONE_TIME', 'AS_NEEDED', 'RESPITE')),
    
    -- Service details
    service_type_id UUID NOT NULL,
    service_type_name VARCHAR(200) NOT NULL,
    task_template_ids JSONB,
    
    -- Scheduling rules
    recurrence JSONB NOT NULL,
    duration INTEGER NOT NULL CHECK (duration BETWEEN 15 AND 1440),
    flexibility_window INTEGER CHECK (flexibility_window BETWEEN 0 AND 120),
    
    -- Requirements
    required_skills JSONB,
    required_certifications JSONB,
    preferred_caregivers JSONB,
    blocked_caregivers JSONB,
    gender_preference VARCHAR(50) CHECK (gender_preference IN ('MALE', 'FEMALE', 'NO_PREFERENCE')),
    language_preference VARCHAR(100),
    
    -- Timing preferences
    preferred_time_of_day VARCHAR(50) CHECK (preferred_time_of_day IN ('EARLY_MORNING', 'MORNING', 'AFTERNOON', 'EVENING', 'NIGHT', 'ANY')),
    must_start_by TIME,
    must_end_by TIME,
    
    -- Authorization
    authorized_hours_per_week NUMERIC(5,2) CHECK (authorized_hours_per_week BETWEEN 0 AND 168),
    authorized_visits_per_week INTEGER CHECK (authorized_visits_per_week BETWEEN 0 AND 100),
    authorization_start_date DATE,
    authorization_end_date DATE,
    funding_source_id UUID,
    
    -- Operational
    travel_time_before INTEGER CHECK (travel_time_before BETWEEN 0 AND 120),
    travel_time_after INTEGER CHECK (travel_time_after BETWEEN 0 AND 120),
    allow_back_to_back BOOLEAN DEFAULT false,
    
    -- Status and lifecycle
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'ACTIVE', 'SUSPENDED', 'COMPLETED', 'CANCELLED')),
    effective_from DATE NOT NULL,
    effective_to DATE,
    
    -- Metadata
    notes TEXT,
    client_instructions TEXT,
    caregiver_instructions TEXT,
    
    -- Audit fields
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by UUID NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    deleted_at TIMESTAMP,
    deleted_by UUID,
    
    CONSTRAINT chk_effective_dates CHECK (effective_to IS NULL OR effective_from <= effective_to),
    CONSTRAINT chk_authorization_dates CHECK (authorization_end_date IS NULL OR authorization_start_date IS NULL OR authorization_start_date <= authorization_end_date),
    CONSTRAINT chk_time_window CHECK (must_end_by IS NULL OR must_start_by IS NULL OR must_start_by < must_end_by)
);

-- Indexes for service_patterns
CREATE INDEX idx_patterns_organization ON service_patterns(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_patterns_branch ON service_patterns(branch_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_patterns_client ON service_patterns(client_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_patterns_status ON service_patterns(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_patterns_active ON service_patterns(client_id, status) WHERE deleted_at IS NULL AND status = 'ACTIVE';
CREATE INDEX idx_patterns_dates ON service_patterns(effective_from, effective_to) WHERE deleted_at IS NULL;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_patterns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_patterns_updated_at
    BEFORE UPDATE ON service_patterns
    FOR EACH ROW
    EXECUTE FUNCTION update_patterns_updated_at();

-- ============================================================================
-- SCHEDULES
-- ============================================================================

CREATE TABLE IF NOT EXISTS schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    branch_id UUID NOT NULL,
    client_id UUID NOT NULL,
    pattern_id UUID NOT NULL,
    
    -- Schedule period
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    
    -- Generation metadata
    generated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    generated_by UUID NOT NULL,
    generation_method VARCHAR(50) NOT NULL CHECK (generation_method IN ('AUTO', 'MANUAL', 'IMPORT')),
    
    -- Statistics
    total_visits INTEGER NOT NULL DEFAULT 0,
    scheduled_visits INTEGER NOT NULL DEFAULT 0,
    unassigned_visits INTEGER NOT NULL DEFAULT 0,
    completed_visits INTEGER NOT NULL DEFAULT 0,
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
    notes TEXT,
    
    -- Audit fields
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by UUID NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    
    CONSTRAINT chk_schedule_dates CHECK (start_date <= end_date),
    CONSTRAINT fk_schedule_pattern FOREIGN KEY (pattern_id) REFERENCES service_patterns(id)
);

CREATE INDEX idx_schedules_pattern ON schedules(pattern_id);
CREATE INDEX idx_schedules_client ON schedules(client_id);
CREATE INDEX idx_schedules_dates ON schedules(start_date, end_date);
CREATE INDEX idx_schedules_status ON schedules(status);

-- ============================================================================
-- VISITS
-- ============================================================================

CREATE TABLE IF NOT EXISTS visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    branch_id UUID NOT NULL,
    client_id UUID NOT NULL,
    pattern_id UUID,
    schedule_id UUID,
    
    -- Visit identity
    visit_number VARCHAR(50) NOT NULL UNIQUE,
    visit_type VARCHAR(50) NOT NULL CHECK (visit_type IN ('REGULAR', 'INITIAL', 'DISCHARGE', 'RESPITE', 'EMERGENCY', 'MAKEUP', 'SUPERVISION', 'ASSESSMENT')),
    service_type_id UUID NOT NULL,
    service_type_name VARCHAR(200) NOT NULL,
    
    -- Scheduled timing
    scheduled_date DATE NOT NULL,
    scheduled_start_time TIME NOT NULL,
    scheduled_end_time TIME NOT NULL,
    scheduled_duration INTEGER NOT NULL CHECK (scheduled_duration BETWEEN 15 AND 1440),
    timezone VARCHAR(100) NOT NULL DEFAULT 'America/New_York',
    
    -- Actual timing
    actual_start_time TIMESTAMP,
    actual_end_time TIMESTAMP,
    actual_duration INTEGER,
    
    -- Assignment
    assigned_caregiver_id UUID,
    assigned_at TIMESTAMP,
    assigned_by UUID,
    assignment_method VARCHAR(50) NOT NULL DEFAULT 'MANUAL' CHECK (assignment_method IN ('MANUAL', 'AUTO_MATCH', 'SELF_ASSIGN', 'PREFERRED', 'OVERFLOW')),
    
    -- Location
    address JSONB NOT NULL,
    location_verification JSONB,
    
    -- Tasks and requirements
    task_ids JSONB,
    required_skills JSONB,
    required_certifications JSONB,
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'UNASSIGNED' CHECK (status IN (
        'DRAFT', 'SCHEDULED', 'UNASSIGNED', 'ASSIGNED', 'CONFIRMED',
        'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS', 'PAUSED', 'COMPLETED',
        'INCOMPLETE', 'CANCELLED', 'NO_SHOW_CLIENT', 'NO_SHOW_CAREGIVER', 'REJECTED'
    )),
    status_history JSONB NOT NULL DEFAULT '[]',
    
    -- Flags
    is_urgent BOOLEAN DEFAULT false,
    is_priority BOOLEAN DEFAULT false,
    requires_supervision BOOLEAN DEFAULT false,
    risk_flags JSONB,
    
    -- Verification (EVV compliance)
    verification_method VARCHAR(50) CHECK (verification_method IN ('GPS', 'PHONE', 'FACIAL', 'BIOMETRIC', 'MANUAL')),
    verification_data JSONB,
    
    -- Completion
    completion_notes TEXT,
    tasks_completed INTEGER CHECK (tasks_completed >= 0),
    tasks_total INTEGER CHECK (tasks_total >= 0),
    incident_reported BOOLEAN,
    
    -- Signature
    signature_required BOOLEAN DEFAULT true,
    signature_captured BOOLEAN,
    signature_data JSONB,
    
    -- Billing
    billable_hours NUMERIC(5,2) CHECK (billable_hours >= 0),
    billing_status VARCHAR(50) CHECK (billing_status IN ('PENDING', 'READY', 'BILLED', 'PAID', 'DENIED', 'ADJUSTED')),
    billing_notes TEXT,
    
    -- Instructions and notes
    client_instructions TEXT,
    caregiver_instructions TEXT,
    internal_notes TEXT,
    tags TEXT[],
    
    -- Audit fields
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by UUID NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    deleted_at TIMESTAMP,
    deleted_by UUID,
    
    CONSTRAINT chk_visit_times CHECK (scheduled_start_time < scheduled_end_time),
    CONSTRAINT chk_actual_times CHECK (actual_end_time IS NULL OR actual_start_time IS NULL OR actual_start_time < actual_end_time),
    CONSTRAINT chk_tasks CHECK (tasks_total IS NULL OR tasks_completed IS NULL OR tasks_completed <= tasks_total),
    CONSTRAINT fk_visit_pattern FOREIGN KEY (pattern_id) REFERENCES service_patterns(id),
    CONSTRAINT fk_visit_schedule FOREIGN KEY (schedule_id) REFERENCES schedules(id)
);

-- Indexes for visits
CREATE INDEX idx_visits_organization ON visits(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_visits_branch ON visits(branch_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_visits_client ON visits(client_id, scheduled_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_visits_caregiver ON visits(assigned_caregiver_id, scheduled_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_visits_pattern ON visits(pattern_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_visits_schedule ON visits(schedule_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_visits_date ON visits(scheduled_date, scheduled_start_time) WHERE deleted_at IS NULL;
CREATE INDEX idx_visits_status ON visits(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_visits_billing ON visits(billing_status) WHERE deleted_at IS NULL AND billing_status IS NOT NULL;

-- Composite indexes for common queries
CREATE INDEX idx_visits_unassigned ON visits(organization_id, branch_id, scheduled_date) 
    WHERE deleted_at IS NULL AND assigned_caregiver_id IS NULL AND status IN ('UNASSIGNED', 'SCHEDULED');
CREATE INDEX idx_visits_urgent ON visits(organization_id, scheduled_date, is_urgent) 
    WHERE deleted_at IS NULL AND is_urgent = true;
CREATE INDEX idx_visits_upcoming ON visits(assigned_caregiver_id, scheduled_date) 
    WHERE deleted_at IS NULL AND status IN ('ASSIGNED', 'CONFIRMED') AND scheduled_date >= CURRENT_DATE;

-- Full-text search index
CREATE INDEX idx_visits_search ON visits 
    USING gin(to_tsvector('english', 
        coalesce(visit_number, '') || ' ' ||
        coalesce(client_instructions, '') || ' ' || 
        coalesce(caregiver_instructions, '') || ' ' ||
        coalesce(internal_notes, '')))
    WHERE deleted_at IS NULL;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_visits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_visits_updated_at
    BEFORE UPDATE ON visits
    FOR EACH ROW
    EXECUTE FUNCTION update_visits_updated_at();

-- ============================================================================
-- VISIT EXCEPTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS visit_exceptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id UUID NOT NULL,
    client_id UUID NOT NULL,
    caregiver_id UUID,
    
    exception_type VARCHAR(50) NOT NULL CHECK (exception_type IN (
        'LATE_START', 'EARLY_END', 'OVERTIME', 'NO_SHOW_CLIENT', 'NO_SHOW_CAREGIVER',
        'LOCATION_MISMATCH', 'MISSED_TASKS', 'SAFETY_CONCERN', 'EQUIPMENT_ISSUE',
        'MEDICATION_ISSUE', 'CLIENT_REFUSED', 'EMERGENCY', 'OTHER'
    )),
    severity VARCHAR(50) NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    
    detected_at TIMESTAMP NOT NULL DEFAULT NOW(),
    detected_by UUID,
    automatic BOOLEAN NOT NULL DEFAULT false,
    
    description TEXT NOT NULL,
    resolution TEXT,
    resolved_at TIMESTAMP,
    resolved_by UUID,
    
    requires_followup BOOLEAN DEFAULT false,
    followup_assigned_to UUID,
    
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'ESCALATED')),
    
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_exception_visit FOREIGN KEY (visit_id) REFERENCES visits(id)
);

CREATE INDEX idx_exceptions_visit ON visit_exceptions(visit_id);
CREATE INDEX idx_exceptions_status ON visit_exceptions(status);
CREATE INDEX idx_exceptions_type ON visit_exceptions(exception_type);
CREATE INDEX idx_exceptions_severity ON visit_exceptions(severity) WHERE status != 'RESOLVED';
CREATE INDEX idx_exceptions_followup ON visit_exceptions(followup_assigned_to) WHERE requires_followup = true AND status != 'RESOLVED';

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE service_patterns IS 'Templates for recurring service schedules';
COMMENT ON TABLE schedules IS 'Generated visit schedules from patterns';
COMMENT ON TABLE visits IS 'Individual care visit occurrences';
COMMENT ON TABLE visit_exceptions IS 'Exceptions and issues during visits';

COMMENT ON COLUMN service_patterns.recurrence IS 'JSONB: Recurrence rule with frequency, interval, days/dates, start/end times, timezone';
COMMENT ON COLUMN service_patterns.flexibility_window IS 'Allowed variance in minutes from scheduled time';
COMMENT ON COLUMN visits.status_history IS 'JSONB: Array of status change records with timestamps and reasons';
COMMENT ON COLUMN visits.location_verification IS 'JSONB: GPS coordinates and verification data for EVV compliance';
COMMENT ON COLUMN visits.verification_data IS 'JSONB: Clock in/out verification records';
COMMENT ON COLUMN visits.signature_data IS 'JSONB: Digital signature capture data';
