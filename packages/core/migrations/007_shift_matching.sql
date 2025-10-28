-- Migration: Shift Matching & Assignment
-- Description: Creates tables for intelligent shift matching, assignment proposals, and caregiver preferences
-- Version: 007
-- Date: 2024-01-20

-- ============================================================================
-- OPEN SHIFTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS open_shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    branch_id UUID NOT NULL,
    
    -- Visit reference
    visit_id UUID NOT NULL UNIQUE,
    client_id UUID NOT NULL,
    
    -- Shift details
    scheduled_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration INTEGER NOT NULL CHECK (duration BETWEEN 15 AND 1440),
    timezone VARCHAR(100) NOT NULL DEFAULT 'America/New_York',
    
    -- Service requirements
    service_type_id UUID NOT NULL,
    service_type_name VARCHAR(200) NOT NULL,
    task_ids JSONB,
    required_skills JSONB,
    required_certifications JSONB,
    
    -- Client preferences and restrictions
    preferred_caregivers JSONB,
    blocked_caregivers JSONB,
    gender_preference VARCHAR(50) CHECK (gender_preference IN ('MALE', 'FEMALE', 'NO_PREFERENCE')),
    language_preference VARCHAR(100),
    
    -- Location
    address JSONB NOT NULL,
    latitude NUMERIC(10, 8),
    longitude NUMERIC(11, 8),
    
    -- Priority and urgency
    priority VARCHAR(50) NOT NULL DEFAULT 'NORMAL' CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'CRITICAL')),
    is_urgent BOOLEAN DEFAULT false,
    fill_by_date TIMESTAMP,
    
    -- Matching metadata
    matching_status VARCHAR(50) NOT NULL DEFAULT 'NEW' CHECK (matching_status IN ('NEW', 'MATCHING', 'MATCHED', 'PROPOSED', 'ASSIGNED', 'NO_MATCH', 'EXPIRED')),
    last_matched_at TIMESTAMP,
    match_attempts INTEGER NOT NULL DEFAULT 0,
    
    -- Assignment tracking
    proposed_assignments JSONB DEFAULT '[]',
    rejected_caregivers JSONB DEFAULT '[]',
    
    -- Metadata
    client_instructions TEXT,
    internal_notes TEXT,
    tags TEXT[],
    
    -- Audit fields
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by UUID NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    
    CONSTRAINT chk_shift_times CHECK (start_time < end_time),
    CONSTRAINT chk_fill_by_future CHECK (fill_by_date IS NULL OR fill_by_date > NOW()),
    CONSTRAINT fk_open_shift_visit FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE
);

-- Indexes for open_shifts
CREATE INDEX idx_open_shifts_organization ON open_shifts(organization_id);
CREATE INDEX idx_open_shifts_branch ON open_shifts(branch_id);
CREATE INDEX idx_open_shifts_client ON open_shifts(client_id);
CREATE INDEX idx_open_shifts_date ON open_shifts(scheduled_date, start_time);
CREATE INDEX idx_open_shifts_status ON open_shifts(matching_status);
CREATE INDEX idx_open_shifts_priority ON open_shifts(priority, is_urgent) WHERE matching_status IN ('NEW', 'MATCHING', 'NO_MATCH');
CREATE INDEX idx_open_shifts_urgent ON open_shifts(scheduled_date) WHERE is_urgent = true AND matching_status NOT IN ('ASSIGNED', 'EXPIRED');
CREATE INDEX idx_open_shifts_location ON open_shifts USING gist(ll_to_earth(latitude, longitude)) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
CREATE INDEX idx_open_shifts_fill_by ON open_shifts(fill_by_date) WHERE fill_by_date IS NOT NULL AND matching_status NOT IN ('ASSIGNED', 'EXPIRED');

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_open_shifts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_open_shifts_updated_at
    BEFORE UPDATE ON open_shifts
    FOR EACH ROW
    EXECUTE FUNCTION update_open_shifts_updated_at();

-- ============================================================================
-- MATCHING CONFIGURATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS matching_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    branch_id UUID,
    
    name VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Score weights (must sum to 100)
    weights JSONB NOT NULL DEFAULT '{
        "skillMatch": 20,
        "availabilityMatch": 20,
        "proximityMatch": 15,
        "preferenceMatch": 10,
        "experienceMatch": 10,
        "reliabilityMatch": 10,
        "complianceMatch": 10,
        "capacityMatch": 5
    }',
    
    -- Constraints
    max_travel_distance INTEGER CHECK (max_travel_distance > 0),
    max_travel_time INTEGER CHECK (max_travel_time > 0),
    require_exact_skill_match BOOLEAN DEFAULT false,
    require_active_certifications BOOLEAN DEFAULT true,
    respect_gender_preference BOOLEAN DEFAULT true,
    respect_language_preference BOOLEAN DEFAULT true,
    
    -- Matching behavior
    auto_assign_threshold INTEGER CHECK (auto_assign_threshold BETWEEN 0 AND 100),
    min_score_for_proposal INTEGER NOT NULL DEFAULT 50 CHECK (min_score_for_proposal BETWEEN 0 AND 100),
    max_proposals_per_shift INTEGER NOT NULL DEFAULT 5 CHECK (max_proposals_per_shift BETWEEN 1 AND 20),
    proposal_expiration_minutes INTEGER NOT NULL DEFAULT 120 CHECK (proposal_expiration_minutes BETWEEN 15 AND 1440),
    
    -- Optimization preferences
    optimize_for VARCHAR(50) NOT NULL DEFAULT 'BEST_MATCH' CHECK (optimize_for IN ('BEST_MATCH', 'FASTEST_FILL', 'COST_EFFICIENT', 'BALANCED_WORKLOAD', 'CONTINUITY', 'CAREGIVER_SATISFACTION')),
    consider_cost_efficiency BOOLEAN DEFAULT false,
    balance_workload_across_caregivers BOOLEAN DEFAULT false,
    prioritize_continuity_of_care BOOLEAN DEFAULT true,
    
    -- Advanced rules
    prefer_same_caregiver_for_recurring BOOLEAN DEFAULT true,
    penalize_frequent_rejections BOOLEAN DEFAULT true,
    boost_reliable_performers BOOLEAN DEFAULT true,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    
    notes TEXT,
    
    -- Audit fields
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by UUID NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    
    CONSTRAINT unique_default_per_scope UNIQUE NULLS NOT FIRST (organization_id, branch_id, is_default) DEFERRABLE INITIALLY DEFERRED
);

-- Indexes for matching_configurations
CREATE INDEX idx_matching_configs_org ON matching_configurations(organization_id);
CREATE INDEX idx_matching_configs_branch ON matching_configurations(branch_id);
CREATE INDEX idx_matching_configs_active ON matching_configurations(organization_id, is_active) WHERE is_active = true;
CREATE INDEX idx_matching_configs_default ON matching_configurations(organization_id, branch_id, is_default) WHERE is_default = true;

-- ============================================================================
-- ASSIGNMENT PROPOSALS
-- ============================================================================

CREATE TABLE IF NOT EXISTS assignment_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    branch_id UUID NOT NULL,
    
    -- Assignment details
    open_shift_id UUID NOT NULL,
    visit_id UUID NOT NULL,
    caregiver_id UUID NOT NULL,
    
    -- Match quality
    match_score INTEGER NOT NULL CHECK (match_score BETWEEN 0 AND 100),
    match_quality VARCHAR(50) NOT NULL CHECK (match_quality IN ('EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'INELIGIBLE')),
    match_reasons JSONB NOT NULL DEFAULT '[]',
    
    -- Proposal lifecycle
    proposal_status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (proposal_status IN ('PENDING', 'SENT', 'VIEWED', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'SUPERSEDED', 'WITHDRAWN')),
    proposed_by UUID NOT NULL,
    proposed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    proposal_method VARCHAR(50) NOT NULL CHECK (proposal_method IN ('AUTOMATIC', 'MANUAL', 'CAREGIVER_SELF_SELECT')),
    
    -- Response tracking
    sent_to_caregiver BOOLEAN DEFAULT false,
    sent_at TIMESTAMP,
    notification_method VARCHAR(50) CHECK (notification_method IN ('PUSH', 'SMS', 'EMAIL', 'PHONE_CALL', 'IN_APP')),
    
    viewed_by_caregiver BOOLEAN DEFAULT false,
    viewed_at TIMESTAMP,
    
    responded_at TIMESTAMP,
    response_method VARCHAR(50) CHECK (response_method IN ('MOBILE', 'WEB', 'PHONE', 'IN_PERSON')),
    
    -- Decision
    accepted_at TIMESTAMP,
    accepted_by UUID,
    
    rejected_at TIMESTAMP,
    rejected_by UUID,
    rejection_reason TEXT,
    rejection_category VARCHAR(50) CHECK (rejection_category IN ('TOO_FAR', 'TIME_CONFLICT', 'PERSONAL_REASON', 'PREFER_DIFFERENT_CLIENT', 'RATE_TOO_LOW', 'ALREADY_BOOKED', 'NOT_INTERESTED', 'OTHER')),
    
    expired_at TIMESTAMP,
    
    -- Priority flags
    is_preferred BOOLEAN DEFAULT false,
    urgency_flag BOOLEAN DEFAULT false,
    
    -- Metadata
    notes TEXT,
    internal_notes TEXT,
    
    -- Audit fields
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by UUID NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    deleted_at TIMESTAMP,
    deleted_by UUID,
    
    CONSTRAINT fk_proposal_open_shift FOREIGN KEY (open_shift_id) REFERENCES open_shifts(id) ON DELETE CASCADE,
    CONSTRAINT fk_proposal_visit FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE,
    CONSTRAINT chk_response_consistency CHECK (
        (proposal_status = 'ACCEPTED' AND accepted_at IS NOT NULL) OR
        (proposal_status = 'REJECTED' AND rejected_at IS NOT NULL) OR
        (proposal_status NOT IN ('ACCEPTED', 'REJECTED'))
    )
);

-- Indexes for assignment_proposals
CREATE INDEX idx_proposals_organization ON assignment_proposals(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_proposals_branch ON assignment_proposals(branch_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_proposals_open_shift ON assignment_proposals(open_shift_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_proposals_caregiver ON assignment_proposals(caregiver_id, proposal_status) WHERE deleted_at IS NULL;
CREATE INDEX idx_proposals_status ON assignment_proposals(proposal_status) WHERE deleted_at IS NULL;
CREATE INDEX idx_proposals_pending ON assignment_proposals(caregiver_id, proposed_at) 
    WHERE deleted_at IS NULL AND proposal_status IN ('PENDING', 'SENT', 'VIEWED');
CREATE INDEX idx_proposals_expiring ON assignment_proposals(sent_at) 
    WHERE deleted_at IS NULL AND proposal_status IN ('SENT', 'VIEWED');
CREATE INDEX idx_proposals_match_quality ON assignment_proposals(match_quality, match_score) WHERE deleted_at IS NULL;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_proposals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_proposals_updated_at
    BEFORE UPDATE ON assignment_proposals
    FOR EACH ROW
    EXECUTE FUNCTION update_proposals_updated_at();

-- ============================================================================
-- CAREGIVER PREFERENCE PROFILES
-- ============================================================================

CREATE TABLE IF NOT EXISTS caregiver_preference_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    caregiver_id UUID NOT NULL UNIQUE,
    organization_id UUID NOT NULL,
    
    -- Shift preferences
    preferred_days_of_week JSONB, -- Array of day names
    preferred_time_ranges JSONB, -- Array of {startTime, endTime}
    preferred_shift_types JSONB, -- Array of shift type names
    
    -- Client preferences
    preferred_client_ids JSONB,
    preferred_client_types JSONB,
    preferred_service_types JSONB,
    
    -- Location preferences
    max_travel_distance INTEGER CHECK (max_travel_distance > 0),
    preferred_zip_codes TEXT[],
    avoid_zip_codes TEXT[],
    
    -- Work-life balance
    max_shifts_per_day INTEGER CHECK (max_shifts_per_day BETWEEN 1 AND 10),
    max_shifts_per_week INTEGER CHECK (max_shifts_per_week BETWEEN 1 AND 50),
    max_hours_per_week INTEGER CHECK (max_hours_per_week BETWEEN 1 AND 168),
    require_minimum_hours_between_shifts INTEGER CHECK (require_minimum_hours_between_shifts >= 0),
    
    -- Willingness
    willing_to_accept_urgent_shifts BOOLEAN DEFAULT true,
    willing_to_work_weekends BOOLEAN DEFAULT true,
    willing_to_work_holidays BOOLEAN DEFAULT false,
    accept_auto_assignment BOOLEAN DEFAULT false,
    
    -- Notification preferences
    notification_methods JSONB NOT NULL DEFAULT '["PUSH", "SMS"]',
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    
    -- Metadata
    last_updated TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by UUID NOT NULL,
    
    -- Audit fields
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    
    CONSTRAINT chk_quiet_hours CHECK (quiet_hours_end IS NULL OR quiet_hours_start IS NULL OR quiet_hours_start != quiet_hours_end)
);

-- Indexes for caregiver_preference_profiles
CREATE INDEX idx_preferences_caregiver ON caregiver_preference_profiles(caregiver_id);
CREATE INDEX idx_preferences_organization ON caregiver_preference_profiles(organization_id);
CREATE INDEX idx_preferences_auto_assign ON caregiver_preference_profiles(caregiver_id) WHERE accept_auto_assignment = true;

-- ============================================================================
-- BULK MATCH REQUESTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS bulk_match_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    branch_id UUID,
    
    -- Request scope
    date_from DATE NOT NULL,
    date_to DATE NOT NULL,
    open_shift_ids JSONB,
    
    -- Configuration
    configuration_id UUID,
    optimization_goal VARCHAR(50) CHECK (optimization_goal IN ('BEST_MATCH', 'FASTEST_FILL', 'COST_EFFICIENT', 'BALANCED_WORKLOAD', 'CONTINUITY', 'CAREGIVER_SATISFACTION')),
    
    -- Processing
    requested_by UUID NOT NULL,
    requested_at TIMESTAMP NOT NULL DEFAULT NOW(),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED')),
    
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    
    -- Results
    total_shifts INTEGER NOT NULL DEFAULT 0,
    matched_shifts INTEGER NOT NULL DEFAULT 0,
    unmatched_shifts INTEGER NOT NULL DEFAULT 0,
    proposals_generated INTEGER NOT NULL DEFAULT 0,
    
    error_message TEXT,
    notes TEXT,
    
    -- Audit fields
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by UUID NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    
    CONSTRAINT chk_bulk_dates CHECK (date_from <= date_to),
    CONSTRAINT fk_bulk_config FOREIGN KEY (configuration_id) REFERENCES matching_configurations(id)
);

-- Indexes for bulk_match_requests
CREATE INDEX idx_bulk_requests_organization ON bulk_match_requests(organization_id);
CREATE INDEX idx_bulk_requests_status ON bulk_match_requests(status);
CREATE INDEX idx_bulk_requests_dates ON bulk_match_requests(date_from, date_to);
CREATE INDEX idx_bulk_requests_pending ON bulk_match_requests(requested_at) WHERE status = 'PENDING';

-- ============================================================================
-- MATCH HISTORY
-- ============================================================================

CREATE TABLE IF NOT EXISTS match_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    open_shift_id UUID NOT NULL,
    visit_id UUID NOT NULL,
    caregiver_id UUID,
    
    -- Match attempt
    attempt_number INTEGER NOT NULL CHECK (attempt_number > 0),
    matched_at TIMESTAMP NOT NULL DEFAULT NOW(),
    matched_by UUID,
    
    match_score INTEGER CHECK (match_score BETWEEN 0 AND 100),
    match_quality VARCHAR(50) CHECK (match_quality IN ('EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'INELIGIBLE')),
    
    -- Outcome
    outcome VARCHAR(50) NOT NULL CHECK (outcome IN ('PROPOSED', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'SUPERSEDED', 'NO_CANDIDATES', 'MANUAL_OVERRIDE')),
    outcome_determined_at TIMESTAMP,
    
    -- If assigned
    assignment_proposal_id UUID,
    assigned_successfully BOOLEAN DEFAULT false,
    
    -- If rejected
    rejection_reason TEXT,
    
    -- Configuration used
    configuration_id UUID,
    configuration_snapshot JSONB,
    
    -- Performance tracking
    response_time_minutes INTEGER CHECK (response_time_minutes >= 0),
    
    notes TEXT,
    
    -- Audit fields
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by UUID NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    
    CONSTRAINT fk_history_open_shift FOREIGN KEY (open_shift_id) REFERENCES open_shifts(id) ON DELETE CASCADE,
    CONSTRAINT fk_history_proposal FOREIGN KEY (assignment_proposal_id) REFERENCES assignment_proposals(id) ON DELETE SET NULL
);

-- Indexes for match_history
CREATE INDEX idx_history_open_shift ON match_history(open_shift_id);
CREATE INDEX idx_history_caregiver ON match_history(caregiver_id) WHERE caregiver_id IS NOT NULL;
CREATE INDEX idx_history_outcome ON match_history(outcome);
CREATE INDEX idx_history_matched_at ON match_history(matched_at);
CREATE INDEX idx_history_performance ON match_history(caregiver_id, outcome, response_time_minutes) 
    WHERE caregiver_id IS NOT NULL AND outcome IN ('ACCEPTED', 'REJECTED');

-- ============================================================================
-- MATERIALIZED VIEW FOR ACTIVE OPEN SHIFTS
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS active_open_shifts AS
SELECT 
    os.id,
    os.organization_id,
    os.branch_id,
    os.visit_id,
    os.client_id,
    os.scheduled_date,
    os.start_time,
    os.end_time,
    os.duration,
    os.service_type_name,
    os.priority,
    os.is_urgent,
    os.matching_status,
    os.match_attempts,
    os.latitude,
    os.longitude,
    os.fill_by_date,
    os.required_skills,
    os.required_certifications,
    COUNT(ap.id) FILTER (WHERE ap.proposal_status IN ('PENDING', 'SENT', 'VIEWED')) as active_proposals,
    MAX(ap.match_score) as best_match_score,
    os.created_at
FROM open_shifts os
LEFT JOIN assignment_proposals ap ON os.id = ap.open_shift_id AND ap.deleted_at IS NULL
WHERE os.matching_status NOT IN ('ASSIGNED', 'EXPIRED')
  AND os.scheduled_date >= CURRENT_DATE
GROUP BY os.id;

CREATE INDEX idx_active_open_shifts_org ON active_open_shifts(organization_id);
CREATE INDEX idx_active_open_shifts_branch ON active_open_shifts(branch_id);
CREATE INDEX idx_active_open_shifts_date ON active_open_shifts(scheduled_date);
CREATE INDEX idx_active_open_shifts_priority ON active_open_shifts(priority, is_urgent);

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_active_open_shifts()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY active_open_shifts;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to calculate distance between two points (Haversine formula)
CREATE OR REPLACE FUNCTION calculate_distance(
    lat1 NUMERIC,
    lon1 NUMERIC,
    lat2 NUMERIC,
    lon2 NUMERIC
) RETURNS NUMERIC AS $$
DECLARE
    R NUMERIC := 3959; -- Earth radius in miles
    dLat NUMERIC;
    dLon NUMERIC;
    a NUMERIC;
    c NUMERIC;
BEGIN
    IF lat1 IS NULL OR lon1 IS NULL OR lat2 IS NULL OR lon2 IS NULL THEN
        RETURN NULL;
    END IF;
    
    dLat := radians(lat2 - lat1);
    dLon := radians(lon2 - lon1);
    
    a := sin(dLat/2) * sin(dLat/2) + 
         cos(radians(lat1)) * cos(radians(lat2)) * 
         sin(dLon/2) * sin(dLon/2);
    
    c := 2 * atan2(sqrt(a), sqrt(1-a));
    
    RETURN R * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to check if caregiver is available for a shift
CREATE OR REPLACE FUNCTION is_caregiver_available(
    p_caregiver_id UUID,
    p_date DATE,
    p_start_time TIME,
    p_end_time TIME
) RETURNS BOOLEAN AS $$
DECLARE
    conflict_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO conflict_count
    FROM visits
    WHERE assigned_caregiver_id = p_caregiver_id
      AND scheduled_date = p_date
      AND deleted_at IS NULL
      AND status NOT IN ('CANCELLED', 'NO_SHOW_CAREGIVER', 'REJECTED')
      AND (
          (scheduled_start_time, scheduled_end_time) OVERLAPS (p_start_time, p_end_time)
      );
    
    RETURN conflict_count = 0;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE open_shifts IS 'Unassigned visits needing caregiver assignment';
COMMENT ON TABLE matching_configurations IS 'Configurable rules and weights for shift matching algorithm';
COMMENT ON TABLE assignment_proposals IS 'System-generated or manual caregiver-shift pairing suggestions';
COMMENT ON TABLE caregiver_preference_profiles IS 'Caregiver self-service shift and work preferences';
COMMENT ON TABLE bulk_match_requests IS 'Batch matching requests for multiple shifts';
COMMENT ON TABLE match_history IS 'Audit log of all matching attempts and outcomes';
COMMENT ON MATERIALIZED VIEW active_open_shifts IS 'Optimized view of currently unassigned shifts with proposal counts';

COMMENT ON COLUMN open_shifts.matching_status IS 'Current state in the matching workflow';
COMMENT ON COLUMN open_shifts.fill_by_date IS 'Deadline for assignment - triggers escalation if approaching';
COMMENT ON COLUMN assignment_proposals.match_score IS 'Composite score 0-100 indicating caregiver fit';
COMMENT ON COLUMN assignment_proposals.match_reasons IS 'JSONB: Detailed reasons contributing to match score';
COMMENT ON COLUMN matching_configurations.weights IS 'JSONB: Score weights for eight matching dimensions, must sum to 100';
COMMENT ON COLUMN caregiver_preference_profiles.notification_methods IS 'JSONB: Array of preferred notification channels';
