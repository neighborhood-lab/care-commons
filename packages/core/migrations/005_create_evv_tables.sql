-- Migration: Time Tracking & Electronic Visit Verification (EVV)
-- Description: Creates tables for EVV records, time entries, and geofences
-- Version: 005
-- Date: 2024-01-20

-- ============================================================================
-- EVV RECORDS
-- ============================================================================

CREATE TABLE IF NOT EXISTS evv_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id UUID NOT NULL UNIQUE,
    organization_id UUID NOT NULL,
    branch_id UUID NOT NULL,
    client_id UUID NOT NULL,
    caregiver_id UUID NOT NULL,
    
    -- Required EVV elements (21st Century Cures Act)
    -- 1. Type of service performed
    service_type_code VARCHAR(50) NOT NULL,
    service_type_name VARCHAR(200) NOT NULL,
    
    -- 2. Individual receiving the service
    client_name VARCHAR(200) NOT NULL, -- Encrypted at rest
    client_medicaid_id VARCHAR(50), -- Encrypted at rest
    
    -- 3. Individual providing the service
    caregiver_name VARCHAR(200) NOT NULL,
    caregiver_employee_id VARCHAR(50) NOT NULL,
    caregiver_npi VARCHAR(20), -- National Provider Identifier
    
    -- 4. Date of service
    service_date DATE NOT NULL,
    
    -- 5. Location of service delivery
    service_address JSONB NOT NULL,
    
    -- 6. Time service begins and ends
    clock_in_time TIMESTAMP NOT NULL,
    clock_out_time TIMESTAMP,
    total_duration INTEGER, -- minutes
    
    -- Location verification
    clock_in_verification JSONB NOT NULL,
    clock_out_verification JSONB,
    mid_visit_checks JSONB, -- Array of location checks during visit
    
    -- Events
    pause_events JSONB, -- Array of pause/resume events
    exception_events JSONB, -- Array of exception events
    
    -- Compliance and integrity
    record_status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (record_status IN (
        'PENDING', 'COMPLETE', 'SUBMITTED', 'APPROVED', 'REJECTED', 'DISPUTED', 'AMENDED', 'VOIDED'
    )),
    verification_level VARCHAR(50) NOT NULL CHECK (verification_level IN (
        'FULL', 'PARTIAL', 'MANUAL', 'PHONE', 'EXCEPTION'
    )),
    compliance_flags JSONB NOT NULL DEFAULT '["COMPLIANT"]',
    integrity_hash VARCHAR(64) NOT NULL, -- SHA-256 hash of core data
    integrity_checksum VARCHAR(64) NOT NULL, -- Additional tamper detection
    
    -- Audit and sync
    recorded_at TIMESTAMP NOT NULL DEFAULT NOW(),
    recorded_by UUID NOT NULL,
    sync_metadata JSONB NOT NULL,
    submitted_to_payor TIMESTAMP,
    payor_approval_status VARCHAR(50) CHECK (payor_approval_status IN (
        'PENDING', 'APPROVED', 'DENIED', 'PENDING_INFO', 'APPEALED'
    )),
    
    -- State-specific extensibility
    state_specific_data JSONB,
    
    -- Attestations
    caregiver_attestation JSONB,
    client_attestation JSONB,
    supervisor_review JSONB,
    
    -- Standard entity fields
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by UUID NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    
    CONSTRAINT fk_evv_visit FOREIGN KEY (visit_id) 
        REFERENCES visits(id) ON DELETE RESTRICT,
    CONSTRAINT fk_evv_organization FOREIGN KEY (organization_id) 
        REFERENCES organizations(id) ON DELETE RESTRICT,
    CONSTRAINT fk_evv_branch FOREIGN KEY (branch_id) 
        REFERENCES branches(id) ON DELETE RESTRICT,
    CONSTRAINT fk_evv_client FOREIGN KEY (client_id) 
        REFERENCES clients(id) ON DELETE RESTRICT,
    CONSTRAINT fk_evv_caregiver FOREIGN KEY (caregiver_id) 
        REFERENCES caregivers(id) ON DELETE RESTRICT,
    CONSTRAINT chk_evv_clock_times CHECK (
        clock_out_time IS NULL OR clock_in_time < clock_out_time
    ),
    CONSTRAINT chk_evv_duration CHECK (
        total_duration IS NULL OR total_duration >= 0
    )
);

-- Indexes for evv_records
CREATE INDEX idx_evv_visit ON evv_records(visit_id);
CREATE INDEX idx_evv_organization ON evv_records(organization_id, service_date);
CREATE INDEX idx_evv_branch ON evv_records(branch_id, service_date);
CREATE INDEX idx_evv_client ON evv_records(client_id, service_date);
CREATE INDEX idx_evv_caregiver ON evv_records(caregiver_id, service_date);
CREATE INDEX idx_evv_service_date ON evv_records(service_date);
CREATE INDEX idx_evv_status ON evv_records(record_status);
CREATE INDEX idx_evv_verification_level ON evv_records(verification_level);
CREATE INDEX idx_evv_compliance ON evv_records USING gin(compliance_flags);
CREATE INDEX idx_evv_submission ON evv_records(submitted_to_payor) 
    WHERE submitted_to_payor IS NOT NULL;
CREATE INDEX idx_evv_pending ON evv_records(organization_id, service_date) 
    WHERE record_status = 'PENDING';
CREATE INDEX idx_evv_flagged ON evv_records(organization_id, service_date) 
    WHERE compliance_flags @> '["GEOFENCE_VIOLATION"]'::jsonb 
       OR compliance_flags @> '["LOCATION_SUSPICIOUS"]'::jsonb;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_evv_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.version = OLD.version + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_evv_records_updated_at
    BEFORE UPDATE ON evv_records
    FOR EACH ROW
    EXECUTE FUNCTION update_evv_records_updated_at();

-- ============================================================================
-- TIME ENTRIES
-- ============================================================================

CREATE TABLE IF NOT EXISTS time_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id UUID NOT NULL,
    evv_record_id UUID,
    organization_id UUID NOT NULL,
    caregiver_id UUID NOT NULL,
    client_id UUID NOT NULL,
    
    -- Entry details
    entry_type VARCHAR(50) NOT NULL CHECK (entry_type IN (
        'CLOCK_IN', 'CLOCK_OUT', 'PAUSE', 'RESUME', 'CHECK_IN'
    )),
    entry_timestamp TIMESTAMP NOT NULL,
    
    -- Location
    location JSONB NOT NULL,
    
    -- Device
    device_id VARCHAR(100) NOT NULL,
    device_info JSONB NOT NULL,
    
    -- Integrity
    integrity_hash VARCHAR(64) NOT NULL,
    server_received_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Sync (for offline capability)
    sync_metadata JSONB NOT NULL,
    offline_recorded BOOLEAN DEFAULT false,
    offline_recorded_at TIMESTAMP,
    
    -- Verification
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN (
        'PENDING', 'VERIFIED', 'FLAGGED', 'OVERRIDDEN', 'REJECTED', 'SYNCED'
    )),
    verification_passed BOOLEAN NOT NULL,
    verification_issues JSONB,
    manual_override JSONB,
    
    -- Standard entity fields
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by UUID NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    
    CONSTRAINT fk_time_entry_visit FOREIGN KEY (visit_id) 
        REFERENCES visits(id) ON DELETE CASCADE,
    CONSTRAINT fk_time_entry_evv FOREIGN KEY (evv_record_id) 
        REFERENCES evv_records(id) ON DELETE SET NULL,
    CONSTRAINT fk_time_entry_organization FOREIGN KEY (organization_id) 
        REFERENCES organizations(id) ON DELETE RESTRICT,
    CONSTRAINT fk_time_entry_caregiver FOREIGN KEY (caregiver_id) 
        REFERENCES caregivers(id) ON DELETE RESTRICT,
    CONSTRAINT fk_time_entry_client FOREIGN KEY (client_id) 
        REFERENCES clients(id) ON DELETE RESTRICT
);

-- Indexes for time_entries
CREATE INDEX idx_time_entries_visit ON time_entries(visit_id, entry_timestamp);
CREATE INDEX idx_time_entries_evv ON time_entries(evv_record_id);
CREATE INDEX idx_time_entries_organization ON time_entries(organization_id, entry_timestamp);
CREATE INDEX idx_time_entries_caregiver ON time_entries(caregiver_id, entry_timestamp);
CREATE INDEX idx_time_entries_client ON time_entries(client_id, entry_timestamp);
CREATE INDEX idx_time_entries_status ON time_entries(status);
CREATE INDEX idx_time_entries_type ON time_entries(entry_type, entry_timestamp);
CREATE INDEX idx_time_entries_device ON time_entries(device_id, entry_timestamp);
CREATE INDEX idx_time_entries_offline ON time_entries(offline_recorded, status) 
    WHERE offline_recorded = true;
CREATE INDEX idx_time_entries_pending ON time_entries(organization_id, status) 
    WHERE status = 'PENDING';
CREATE INDEX idx_time_entries_flagged ON time_entries(organization_id, entry_timestamp) 
    WHERE status = 'FLAGGED';

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_time_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.version = OLD.version + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_time_entries_updated_at
    BEFORE UPDATE ON time_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_time_entries_updated_at();

-- ============================================================================
-- GEOFENCES
-- ============================================================================

CREATE TABLE IF NOT EXISTS geofences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    client_id UUID NOT NULL,
    address_id UUID NOT NULL, -- Links to address in client or visit
    
    -- Location
    center_latitude DECIMAL(10, 8) NOT NULL,
    center_longitude DECIMAL(11, 8) NOT NULL,
    radius_meters INTEGER NOT NULL CHECK (radius_meters BETWEEN 10 AND 500),
    radius_type VARCHAR(50) NOT NULL DEFAULT 'STANDARD' CHECK (radius_type IN (
        'STANDARD', 'EXPANDED', 'CUSTOM'
    )),
    shape VARCHAR(50) NOT NULL DEFAULT 'CIRCLE' CHECK (shape IN (
        'CIRCLE', 'POLYGON'
    )),
    polygon_points JSONB, -- Array of lat/lng points for polygon geofences
    
    -- Settings
    is_active BOOLEAN DEFAULT true,
    allowed_variance INTEGER DEFAULT 0 CHECK (allowed_variance BETWEEN 0 AND 100), -- Additional meters
    
    -- Calibration
    calibrated_at TIMESTAMP,
    calibrated_by UUID,
    calibration_method VARCHAR(50) CHECK (calibration_method IN ('AUTO', 'MANUAL')),
    calibration_notes TEXT,
    
    -- Performance metrics
    verification_count INTEGER DEFAULT 0 CHECK (verification_count >= 0),
    successful_verifications INTEGER DEFAULT 0 CHECK (successful_verifications >= 0),
    failed_verifications INTEGER DEFAULT 0 CHECK (failed_verifications >= 0),
    average_accuracy DECIMAL(8, 2), -- Average GPS accuracy in meters
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN (
        'ACTIVE', 'SUSPENDED', 'ARCHIVED'
    )),
    
    -- Standard entity fields
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by UUID NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    
    CONSTRAINT fk_geofence_organization FOREIGN KEY (organization_id) 
        REFERENCES organizations(id) ON DELETE RESTRICT,
    CONSTRAINT fk_geofence_client FOREIGN KEY (client_id) 
        REFERENCES clients(id) ON DELETE CASCADE,
    CONSTRAINT chk_geofence_verifications CHECK (
        successful_verifications + failed_verifications <= verification_count
    ),
    CONSTRAINT chk_geofence_polygon CHECK (
        shape != 'POLYGON' OR polygon_points IS NOT NULL
    )
);

-- Indexes for geofences
CREATE INDEX idx_geofences_organization ON geofences(organization_id);
CREATE INDEX idx_geofences_client ON geofences(client_id);
CREATE INDEX idx_geofences_address ON geofences(address_id) 
    WHERE is_active = true AND status = 'ACTIVE';
CREATE INDEX idx_geofences_location ON geofences(center_latitude, center_longitude) 
    WHERE is_active = true AND status = 'ACTIVE';
CREATE INDEX idx_geofences_active ON geofences(organization_id, status) 
    WHERE is_active = true AND status = 'ACTIVE';
CREATE INDEX idx_geofences_performance ON geofences(verification_count DESC, average_accuracy) 
    WHERE is_active = true;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_geofences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.version = OLD.version + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_geofences_updated_at
    BEFORE UPDATE ON geofences
    FOR EACH ROW
    EXECUTE FUNCTION update_geofences_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE evv_records IS 'Electronic Visit Verification records for compliance and billing';
COMMENT ON TABLE time_entries IS 'Individual clock-in/out events with location verification';
COMMENT ON TABLE geofences IS 'Virtual boundaries for location verification';

COMMENT ON COLUMN evv_records.service_type_code IS 'Federal requirement: Type of service performed';
COMMENT ON COLUMN evv_records.client_name IS 'Federal requirement: Individual receiving service (encrypted)';
COMMENT ON COLUMN evv_records.caregiver_name IS 'Federal requirement: Individual providing service';
COMMENT ON COLUMN evv_records.service_date IS 'Federal requirement: Date of service';
COMMENT ON COLUMN evv_records.service_address IS 'Federal requirement: Location of service delivery';
COMMENT ON COLUMN evv_records.clock_in_time IS 'Federal requirement: Time service begins';
COMMENT ON COLUMN evv_records.clock_out_time IS 'Federal requirement: Time service ends';
COMMENT ON COLUMN evv_records.clock_in_verification IS 'JSONB: GPS coordinates, accuracy, device info for clock-in';
COMMENT ON COLUMN evv_records.clock_out_verification IS 'JSONB: GPS coordinates, accuracy, device info for clock-out';
COMMENT ON COLUMN evv_records.compliance_flags IS 'JSONB: Array of compliance flags (COMPLIANT, GEOFENCE_VIOLATION, etc.)';
COMMENT ON COLUMN evv_records.integrity_hash IS 'SHA-256 hash of core EVV data for tamper detection';
COMMENT ON COLUMN evv_records.sync_metadata IS 'JSONB: Sync status, IDs, timestamps for offline capability';

COMMENT ON COLUMN time_entries.location IS 'JSONB: Complete location verification data';
COMMENT ON COLUMN time_entries.device_info IS 'JSONB: Device model, OS, app version, security status';
COMMENT ON COLUMN time_entries.integrity_hash IS 'SHA-256 hash for tamper detection';
COMMENT ON COLUMN time_entries.sync_metadata IS 'JSONB: Offline sync status and conflict resolution';
COMMENT ON COLUMN time_entries.manual_override IS 'JSONB: Supervisor override details if verification failed';

COMMENT ON COLUMN geofences.radius_meters IS 'Geofence radius in meters (10-500m allowed)';
COMMENT ON COLUMN geofences.allowed_variance IS 'Additional tolerance in meters for GPS accuracy';
COMMENT ON COLUMN geofences.verification_count IS 'Total verification attempts at this location';
COMMENT ON COLUMN geofences.successful_verifications IS 'Count of successful verifications';
COMMENT ON COLUMN geofences.failed_verifications IS 'Count of failed verifications';
COMMENT ON COLUMN geofences.average_accuracy IS 'Running average of GPS accuracy at this location';
