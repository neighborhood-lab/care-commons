-- Migration: State-Specific EVV Features & Revision Logging
-- Description: Adds Texas/Florida specific EVV requirements, revision logging, and exception queue
-- Version: 010
-- Date: 2024-01-25

-- ============================================================================
-- STATE-SPECIFIC EVV CONFIGURATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS evv_state_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    branch_id UUID,
    
    -- State
    state_code VARCHAR(2) NOT NULL CHECK (state_code IN ('TX', 'FL')),
    
    -- Aggregator settings
    aggregator_type VARCHAR(50) NOT NULL,
    aggregator_entity_id VARCHAR(100) NOT NULL,
    aggregator_endpoint TEXT NOT NULL,
    aggregator_api_key_encrypted TEXT,
    
    -- Program type
    program_type VARCHAR(50) NOT NULL,
    
    -- Verification settings
    allowed_clock_methods JSONB NOT NULL,
    requires_gps_for_mobile BOOLEAN DEFAULT true,
    geo_perimeter_tolerance INTEGER DEFAULT 100 CHECK (geo_perimeter_tolerance BETWEEN 0 AND 500),
    
    -- Grace periods (minutes)
    clock_in_grace_period INTEGER DEFAULT 10 CHECK (clock_in_grace_period BETWEEN 0 AND 60),
    clock_out_grace_period INTEGER DEFAULT 10 CHECK (clock_out_grace_period BETWEEN 0 AND 60),
    late_clock_in_threshold INTEGER DEFAULT 15 CHECK (late_clock_in_threshold BETWEEN 0 AND 120),
    
    -- Visit maintenance (TX-specific)
    vmur_enabled BOOLEAN DEFAULT false,
    vmur_approval_required BOOLEAN DEFAULT true,
    vmur_reason_codes_required BOOLEAN DEFAULT true,
    
    -- Multi-aggregator (FL-specific)
    additional_aggregators JSONB,
    
    -- MCO requirements (FL-specific)
    mco_requirements JSONB,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    effective_from DATE NOT NULL,
    effective_to DATE,
    
    -- Audit
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by UUID NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    
    CONSTRAINT fk_evv_config_organization FOREIGN KEY (organization_id) 
        REFERENCES organizations(id) ON DELETE RESTRICT,
    CONSTRAINT fk_evv_config_branch FOREIGN KEY (branch_id) 
        REFERENCES branches(id) ON DELETE RESTRICT,
    CONSTRAINT chk_effective_dates CHECK (effective_to IS NULL OR effective_from <= effective_to)
);

CREATE INDEX idx_evv_state_config_org ON evv_state_config(organization_id, state_code);
CREATE INDEX idx_evv_state_config_branch ON evv_state_config(branch_id) WHERE branch_id IS NOT NULL;
CREATE INDEX idx_evv_state_config_active ON evv_state_config(organization_id, is_active) WHERE is_active = true;

-- ============================================================================
-- EVV REVISIONS (Immutable Audit Trail)
-- ============================================================================

CREATE TABLE IF NOT EXISTS evv_revisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evv_record_id UUID NOT NULL,
    visit_id UUID NOT NULL,
    organization_id UUID NOT NULL,
    
    -- Revision metadata
    revision_number INTEGER NOT NULL CHECK (revision_number > 0),
    revision_type VARCHAR(50) NOT NULL,
    revision_reason TEXT NOT NULL,
    revision_reason_code VARCHAR(50),
    
    -- Who made the change
    revised_by UUID NOT NULL,
    revised_by_name VARCHAR(200) NOT NULL,
    revised_by_role VARCHAR(50) NOT NULL,
    revised_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- What changed
    field_path VARCHAR(200) NOT NULL,
    original_value JSONB NOT NULL,
    new_value JSONB NOT NULL,
    
    -- Why it was changed
    justification TEXT NOT NULL,
    supporting_documents JSONB,
    
    -- Approval workflow
    requires_approval BOOLEAN DEFAULT false,
    approval_status VARCHAR(20) CHECK (approval_status IN ('PENDING', 'APPROVED', 'DENIED')),
    approved_by UUID,
    approved_by_name VARCHAR(200),
    approved_at TIMESTAMP,
    denial_reason TEXT,
    
    -- Aggregator notification
    aggregator_notified BOOLEAN DEFAULT false,
    aggregator_notified_at TIMESTAMP,
    aggregator_confirmation VARCHAR(200),
    resubmission_required BOOLEAN DEFAULT false,
    resubmitted_at TIMESTAMP,
    
    -- Integrity chain
    revision_hash VARCHAR(64) NOT NULL,
    previous_revision_hash VARCHAR(64),
    
    -- Compliance review
    compliance_notes TEXT,
    compliance_reviewed BOOLEAN DEFAULT false,
    compliance_reviewed_by UUID,
    compliance_reviewed_at TIMESTAMP,
    
    -- Audit
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_revision_evv_record FOREIGN KEY (evv_record_id) 
        REFERENCES evv_records(id) ON DELETE CASCADE,
    CONSTRAINT fk_revision_visit FOREIGN KEY (visit_id) 
        REFERENCES visits(id) ON DELETE CASCADE,
    CONSTRAINT fk_revision_organization FOREIGN KEY (organization_id) 
        REFERENCES organizations(id) ON DELETE RESTRICT,
    CONSTRAINT uq_revision_number UNIQUE (evv_record_id, revision_number)
);

CREATE INDEX idx_evv_revisions_record ON evv_revisions(evv_record_id, revision_number DESC);
CREATE INDEX idx_evv_revisions_visit ON evv_revisions(visit_id);
CREATE INDEX idx_evv_revisions_org ON evv_revisions(organization_id, revised_at);
CREATE INDEX idx_evv_revisions_pending ON evv_revisions(organization_id, approval_status) 
    WHERE requires_approval = true AND approval_status = 'PENDING';
CREATE INDEX idx_evv_revisions_type ON evv_revisions(revision_type, revised_at);
CREATE INDEX idx_evv_revisions_revised_by ON evv_revisions(revised_by, revised_at);

-- ============================================================================
-- EVV ORIGINAL DATA (Immutable Baseline)
-- ============================================================================

CREATE TABLE IF NOT EXISTS evv_original_data (
    evv_record_id UUID PRIMARY KEY,
    
    -- Original timing (never modified)
    original_clock_in_time TIMESTAMP NOT NULL,
    original_clock_out_time TIMESTAMP,
    original_duration INTEGER,
    
    -- Original location (never modified)
    original_clock_in_location JSONB NOT NULL,
    original_clock_out_location JSONB,
    
    -- Device and method
    original_clock_in_device VARCHAR(100) NOT NULL,
    original_clock_out_device VARCHAR(100),
    original_verification_method VARCHAR(50) NOT NULL,
    
    -- Capture metadata
    captured_at TIMESTAMP NOT NULL DEFAULT NOW(),
    captured_by UUID NOT NULL,
    captured_via_device VARCHAR(100) NOT NULL,
    captured_via_app VARCHAR(100) NOT NULL,
    
    -- Integrity
    original_integrity_hash VARCHAR(64) NOT NULL,
    original_checksum VARCHAR(64) NOT NULL,
    
    -- Lock mechanism
    locked_for_editing BOOLEAN DEFAULT false,
    lock_reason VARCHAR(200),
    locked_at TIMESTAMP,
    locked_by UUID,
    
    CONSTRAINT fk_original_data_evv FOREIGN KEY (evv_record_id) 
        REFERENCES evv_records(id) ON DELETE CASCADE
);

CREATE INDEX idx_evv_original_data_captured_at ON evv_original_data(captured_at);
CREATE INDEX idx_evv_original_data_locked ON evv_original_data(locked_for_editing) 
    WHERE locked_for_editing = true;

-- ============================================================================
-- EVV ACCESS LOG
-- ============================================================================

CREATE TABLE IF NOT EXISTS evv_access_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evv_record_id UUID NOT NULL,
    
    -- Who accessed
    accessed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    accessed_by UUID NOT NULL,
    accessed_by_name VARCHAR(200) NOT NULL,
    accessed_by_role VARCHAR(50) NOT NULL,
    accessed_by_ip INET,
    
    -- What was accessed
    access_type VARCHAR(50) NOT NULL CHECK (access_type IN (
        'VIEW', 'EDIT', 'EXPORT', 'PRINT', 'AUDIT_REVIEW', 
        'AGGREGATOR_SUBMISSION', 'SUPERVISOR_REVIEW', 'COMPLIANCE_CHECK'
    )),
    access_reason TEXT,
    
    -- Details
    fields_accessed JSONB,
    search_filters JSONB,
    
    -- Export tracking
    export_format VARCHAR(20) CHECK (export_format IN ('PDF', 'CSV', 'JSON', 'HL7', 'STATE_FORMAT')),
    export_destination TEXT,
    
    CONSTRAINT fk_access_log_evv FOREIGN KEY (evv_record_id) 
        REFERENCES evv_records(id) ON DELETE CASCADE
);

CREATE INDEX idx_evv_access_log_record ON evv_access_log(evv_record_id, accessed_at DESC);
CREATE INDEX idx_evv_access_log_user ON evv_access_log(accessed_by, accessed_at DESC);
CREATE INDEX idx_evv_access_log_type ON evv_access_log(access_type, accessed_at);
CREATE INDEX idx_evv_access_log_export ON evv_access_log(export_format, accessed_at) 
    WHERE export_format IS NOT NULL;

-- ============================================================================
-- TEXAS VMUR (Visit Maintenance Unlock Request)
-- ============================================================================

CREATE TABLE IF NOT EXISTS texas_vmur (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evv_record_id UUID NOT NULL,
    visit_id UUID NOT NULL,
    
    -- Request details
    requested_by UUID NOT NULL,
    requested_by_name VARCHAR(200) NOT NULL,
    requested_at TIMESTAMP NOT NULL DEFAULT NOW(),
    request_reason VARCHAR(50) NOT NULL,
    request_reason_details TEXT NOT NULL,
    
    -- Approval workflow
    approval_status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (approval_status IN (
        'PENDING', 'APPROVED', 'DENIED', 'EXPIRED'
    )),
    approved_by UUID,
    approved_by_name VARCHAR(200),
    approved_at TIMESTAMP,
    denial_reason TEXT,
    
    -- Original vs corrected data
    original_data JSONB NOT NULL,
    corrected_data JSONB NOT NULL,
    changes_summary JSONB NOT NULL,
    
    -- Submission tracking
    submitted_to_aggregator BOOLEAN DEFAULT false,
    aggregator_confirmation VARCHAR(200),
    submitted_at TIMESTAMP,
    
    -- Compliance
    expires_at TIMESTAMP NOT NULL,
    compliance_notes TEXT,
    
    -- Audit
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_vmur_evv_record FOREIGN KEY (evv_record_id) 
        REFERENCES evv_records(id) ON DELETE CASCADE,
    CONSTRAINT fk_vmur_visit FOREIGN KEY (visit_id) 
        REFERENCES visits(id) ON DELETE CASCADE
);

CREATE INDEX idx_texas_vmur_record ON texas_vmur(evv_record_id);
CREATE INDEX idx_texas_vmur_visit ON texas_vmur(visit_id);
CREATE INDEX idx_texas_vmur_status ON texas_vmur(approval_status, requested_at);
CREATE INDEX idx_texas_vmur_pending ON texas_vmur(expires_at) 
    WHERE approval_status = 'PENDING';
CREATE INDEX idx_texas_vmur_requested_by ON texas_vmur(requested_by, requested_at DESC);

-- ============================================================================
-- STATE AGGREGATOR SUBMISSIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS state_aggregator_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    state_code VARCHAR(2) NOT NULL CHECK (state_code IN ('TX', 'FL')),
    evv_record_id UUID NOT NULL,
    aggregator_id VARCHAR(100) NOT NULL,
    aggregator_type VARCHAR(50) NOT NULL,
    
    -- Submission data
    submission_payload JSONB NOT NULL,
    submission_format VARCHAR(20) NOT NULL CHECK (submission_format IN ('JSON', 'XML', 'HL7', 'PROPRIETARY')),
    submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),
    submitted_by UUID NOT NULL,
    
    -- Response tracking
    submission_status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (submission_status IN (
        'PENDING', 'ACCEPTED', 'REJECTED', 'PARTIAL', 'RETRY'
    )),
    aggregator_response JSONB,
    aggregator_confirmation_id VARCHAR(200),
    aggregator_received_at TIMESTAMP,
    
    -- Error handling
    error_code VARCHAR(50),
    error_message TEXT,
    error_details JSONB,
    retry_count INTEGER DEFAULT 0 CHECK (retry_count >= 0),
    max_retries INTEGER DEFAULT 3 CHECK (max_retries >= 0),
    next_retry_at TIMESTAMP,
    
    -- Audit
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_submission_evv_record FOREIGN KEY (evv_record_id) 
        REFERENCES evv_records(id) ON DELETE CASCADE
);

CREATE INDEX idx_aggregator_submissions_record ON state_aggregator_submissions(evv_record_id);
CREATE INDEX idx_aggregator_submissions_state ON state_aggregator_submissions(state_code, submitted_at);
CREATE INDEX idx_aggregator_submissions_status ON state_aggregator_submissions(submission_status, submitted_at);
CREATE INDEX idx_aggregator_submissions_retry ON state_aggregator_submissions(next_retry_at) 
    WHERE submission_status = 'RETRY' AND next_retry_at IS NOT NULL;
CREATE INDEX idx_aggregator_submissions_aggregator ON state_aggregator_submissions(aggregator_id, submitted_at);

-- ============================================================================
-- EVV EXCEPTION QUEUE
-- ============================================================================

CREATE TABLE IF NOT EXISTS evv_exception_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evv_record_id UUID NOT NULL,
    visit_id UUID NOT NULL,
    organization_id UUID NOT NULL,
    branch_id UUID NOT NULL,
    
    -- Exception details
    exception_type VARCHAR(50) NOT NULL,
    exception_code VARCHAR(50) NOT NULL,
    exception_severity VARCHAR(20) NOT NULL CHECK (exception_severity IN ('INFO', 'WARNING', 'ERROR', 'CRITICAL')),
    exception_description TEXT NOT NULL,
    
    -- Issues
    issues JSONB NOT NULL,
    issue_count INTEGER NOT NULL CHECK (issue_count > 0),
    
    -- Detection
    detected_at TIMESTAMP NOT NULL DEFAULT NOW(),
    detected_by VARCHAR(20) NOT NULL CHECK (detected_by IN ('SYSTEM', 'AGGREGATOR', 'SUPERVISOR', 'AUDIT')),
    detection_method VARCHAR(100),
    
    -- Assignment
    assigned_to UUID,
    assigned_to_role VARCHAR(50),
    assigned_at TIMESTAMP,
    
    -- Resolution
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'ESCALATED', 'CLOSED')),
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
    
    due_date TIMESTAMP,
    sla_deadline TIMESTAMP,
    
    resolution_method VARCHAR(50) CHECK (resolution_method IN ('REVISION', 'OVERRIDE', 'RESUBMISSION', 'WAIVER', 'NO_ACTION')),
    resolved_at TIMESTAMP,
    resolved_by UUID,
    resolution_notes TEXT,
    
    -- Escalation
    escalated_at TIMESTAMP,
    escalated_to UUID,
    escalation_reason TEXT,
    
    -- Tracking
    viewed_at TIMESTAMP,
    viewed_by UUID,
    notification_sent BOOLEAN DEFAULT false,
    notification_sent_at TIMESTAMP,
    
    -- Audit
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_exception_evv_record FOREIGN KEY (evv_record_id) 
        REFERENCES evv_records(id) ON DELETE CASCADE,
    CONSTRAINT fk_exception_visit FOREIGN KEY (visit_id) 
        REFERENCES visits(id) ON DELETE CASCADE,
    CONSTRAINT fk_exception_organization FOREIGN KEY (organization_id) 
        REFERENCES organizations(id) ON DELETE RESTRICT,
    CONSTRAINT fk_exception_branch FOREIGN KEY (branch_id) 
        REFERENCES branches(id) ON DELETE RESTRICT
);

CREATE INDEX idx_exception_queue_record ON evv_exception_queue(evv_record_id);
CREATE INDEX idx_exception_queue_visit ON evv_exception_queue(visit_id);
CREATE INDEX idx_exception_queue_org ON evv_exception_queue(organization_id, status, detected_at);
CREATE INDEX idx_exception_queue_branch ON evv_exception_queue(branch_id, status);
CREATE INDEX idx_exception_queue_assigned ON evv_exception_queue(assigned_to, status) WHERE assigned_to IS NOT NULL;
CREATE INDEX idx_exception_queue_status ON evv_exception_queue(status, priority, detected_at);
CREATE INDEX idx_exception_queue_severity ON evv_exception_queue(exception_severity, status) WHERE status != 'RESOLVED';
CREATE INDEX idx_exception_queue_overdue ON evv_exception_queue(due_date) WHERE status IN ('OPEN', 'IN_PROGRESS') AND due_date < NOW();
CREATE INDEX idx_exception_queue_sla ON evv_exception_queue(sla_deadline) WHERE status IN ('OPEN', 'IN_PROGRESS') AND sla_deadline < NOW();
CREATE INDEX idx_exception_queue_unassigned ON evv_exception_queue(organization_id, detected_at) WHERE assigned_to IS NULL AND status = 'OPEN';

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-increment revision number
CREATE OR REPLACE FUNCTION set_revision_number()
RETURNS TRIGGER AS $$
BEGIN
    SELECT COALESCE(MAX(revision_number), 0) + 1
    INTO NEW.revision_number
    FROM evv_revisions
    WHERE evv_record_id = NEW.evv_record_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_revision_number
    BEFORE INSERT ON evv_revisions
    FOR EACH ROW
    WHEN (NEW.revision_number IS NULL)
    EXECUTE FUNCTION set_revision_number();

-- Update timestamps
CREATE OR REPLACE FUNCTION update_evv_state_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.version = OLD.version + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_evv_state_config_updated_at
    BEFORE UPDATE ON evv_state_config
    FOR EACH ROW
    EXECUTE FUNCTION update_evv_state_config_updated_at();

CREATE OR REPLACE FUNCTION update_texas_vmur_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_texas_vmur_updated_at
    BEFORE UPDATE ON texas_vmur
    FOR EACH ROW
    EXECUTE FUNCTION update_texas_vmur_updated_at();

CREATE OR REPLACE FUNCTION update_exception_queue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_exception_queue_updated_at
    BEFORE UPDATE ON evv_exception_queue
    FOR EACH ROW
    EXECUTE FUNCTION update_exception_queue_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE evv_state_config IS 'State-specific EVV configuration for Texas and Florida';
COMMENT ON TABLE evv_revisions IS 'Immutable append-only audit trail of all EVV record changes';
COMMENT ON TABLE evv_original_data IS 'Immutable baseline data captured at clock-in/out - never modified';
COMMENT ON TABLE evv_access_log IS 'Comprehensive access log for EVV records (HIPAA compliance)';
COMMENT ON TABLE texas_vmur IS 'Texas Visit Maintenance Unlock Requests per HHSC EVV Policy';
COMMENT ON TABLE state_aggregator_submissions IS 'Submissions to state EVV aggregators (HHAeXchange, etc.)';
COMMENT ON TABLE evv_exception_queue IS 'Queue of EVV anomalies requiring review/resolution';

COMMENT ON COLUMN evv_revisions.revision_hash IS 'SHA-256 hash of revision for tamper detection';
COMMENT ON COLUMN evv_revisions.previous_revision_hash IS 'Hash of previous revision - creates integrity chain';
COMMENT ON COLUMN evv_original_data.original_integrity_hash IS 'SHA-256 hash of original immutable data';
COMMENT ON COLUMN texas_vmur.expires_at IS 'VMUR requests expire if not completed per HHSC policy';
COMMENT ON COLUMN evv_exception_queue.sla_deadline IS 'Service Level Agreement deadline for resolution';
