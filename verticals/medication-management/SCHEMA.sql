-- Medication Management Schema
-- PostgreSQL database schema for medication tracking and administration

-- ============================================================================
-- MEDICATIONS TABLE
-- ============================================================================
-- Stores medication records including prescriptions and PRN medications

CREATE TABLE medications (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Associations
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

  -- Medication identification
  name VARCHAR(255) NOT NULL,
  generic_name VARCHAR(255),
  strength VARCHAR(100),
  form VARCHAR(50) NOT NULL,  -- tablet, capsule, liquid, injection, etc.
  route VARCHAR(50) NOT NULL,  -- oral, topical, intravenous, etc.

  -- Dosing
  frequency VARCHAR(50) NOT NULL,  -- once_daily, twice_daily, as_needed, etc.
  frequency_details VARCHAR(500),  -- For custom frequencies
  dosage VARCHAR(255) NOT NULL,

  -- Prescriber information
  prescriber_name VARCHAR(255),
  prescriber_npi VARCHAR(50),
  prescription_number VARCHAR(100),

  -- Medical information
  indication VARCHAR(500),  -- Reason for medication
  instructions TEXT,  -- Special instructions for administration

  -- Schedule
  start_date DATE NOT NULL,
  end_date DATE,

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'active',  -- active, inactive, discontinued, on_hold

  -- PRN (as needed) flags
  is_prn BOOLEAN NOT NULL DEFAULT FALSE,
  prn_reason VARCHAR(500),

  -- Pharmacy information
  pharmacy_name VARCHAR(255),
  pharmacy_phone VARCHAR(50),
  refills_remaining INTEGER,
  last_refill_date DATE,

  -- Notes
  notes TEXT,

  -- Audit fields
  created_by UUID NOT NULL REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('active', 'inactive', 'discontinued', 'on_hold')),
  CONSTRAINT valid_form CHECK (form IN (
    'tablet', 'capsule', 'liquid', 'suspension', 'injection',
    'cream', 'ointment', 'patch', 'inhaler', 'drops',
    'spray', 'suppository', 'powder', 'other'
  )),
  CONSTRAINT valid_route CHECK (route IN (
    'oral', 'sublingual', 'topical', 'transdermal', 'intravenous',
    'intramuscular', 'subcutaneous', 'inhalation', 'nasal',
    'ophthalmic', 'otic', 'rectal', 'other'
  )),
  CONSTRAINT valid_frequency CHECK (frequency IN (
    'once_daily', 'twice_daily', 'three_times_daily', 'four_times_daily',
    'every_hour', 'every_2_hours', 'every_4_hours', 'every_6_hours',
    'every_8_hours', 'every_12_hours', 'weekly', 'monthly',
    'as_needed', 'custom'
  )),
  CONSTRAINT end_date_after_start CHECK (end_date IS NULL OR end_date >= start_date),
  CONSTRAINT prn_requires_reason CHECK (is_prn = FALSE OR prn_reason IS NOT NULL)
);

-- Indexes for medications table
CREATE INDEX idx_medications_client_id ON medications(client_id);
CREATE INDEX idx_medications_status ON medications(status);
CREATE INDEX idx_medications_start_date ON medications(start_date);
CREATE INDEX idx_medications_end_date ON medications(end_date) WHERE end_date IS NOT NULL;
CREATE INDEX idx_medications_is_prn ON medications(is_prn);
CREATE INDEX idx_medications_name ON medications(name);
CREATE INDEX idx_medications_generic_name ON medications(generic_name) WHERE generic_name IS NOT NULL;

-- ============================================================================
-- MEDICATION_ADMINISTRATIONS TABLE
-- ============================================================================
-- Tracks each instance of medication administration

CREATE TABLE medication_administrations (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Associations
  medication_id UUID NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

  -- Scheduling
  scheduled_time TIMESTAMP NOT NULL,
  administered_time TIMESTAMP,

  -- Administration details
  administered_by UUID REFERENCES users(id),  -- Caregiver who administered
  status VARCHAR(20) NOT NULL DEFAULT 'pending',  -- administered, skipped, refused, missed, pending
  dosage_given VARCHAR(255),

  -- Reasons for non-administration
  skip_reason VARCHAR(500),
  refuse_reason VARCHAR(500),

  -- Notes
  notes TEXT,

  -- Witness (for controlled substances)
  witnessed_by UUID REFERENCES users(id),

  -- Audit fields
  created_by UUID NOT NULL REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('administered', 'skipped', 'refused', 'missed', 'pending')),
  CONSTRAINT skipped_requires_reason CHECK (status != 'skipped' OR skip_reason IS NOT NULL),
  CONSTRAINT refused_requires_reason CHECK (status != 'refused' OR refuse_reason IS NOT NULL),
  CONSTRAINT administered_requires_time CHECK (status != 'administered' OR administered_time IS NOT NULL)
);

-- Indexes for medication_administrations table
CREATE INDEX idx_med_admin_medication_id ON medication_administrations(medication_id);
CREATE INDEX idx_med_admin_client_id ON medication_administrations(client_id);
CREATE INDEX idx_med_admin_status ON medication_administrations(status);
CREATE INDEX idx_med_admin_scheduled_time ON medication_administrations(scheduled_time);
CREATE INDEX idx_med_admin_administered_time ON medication_administrations(administered_time) WHERE administered_time IS NOT NULL;
CREATE INDEX idx_med_admin_administered_by ON medication_administrations(administered_by) WHERE administered_by IS NOT NULL;

-- ============================================================================
-- MEDICATION_ALLERGIES TABLE
-- ============================================================================
-- Tracks client medication allergies and sensitivities

CREATE TABLE medication_allergies (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Associations
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

  -- Allergy details
  allergen VARCHAR(255) NOT NULL,  -- Medication or substance name
  reaction VARCHAR(500),  -- Description of reaction
  severity VARCHAR(20),  -- mild, moderate, severe, life_threatening

  -- Notes
  notes TEXT,

  -- Verification
  verified_date DATE,
  verified_by UUID REFERENCES users(id),

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  -- Audit fields
  created_by UUID NOT NULL REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_severity CHECK (severity IS NULL OR severity IN ('mild', 'moderate', 'severe', 'life_threatening'))
);

-- Indexes for medication_allergies table
CREATE INDEX idx_med_allergies_client_id ON medication_allergies(client_id);
CREATE INDEX idx_med_allergies_is_active ON medication_allergies(is_active);
CREATE INDEX idx_med_allergies_allergen ON medication_allergies(allergen);
CREATE INDEX idx_med_allergies_severity ON medication_allergies(severity) WHERE severity IS NOT NULL;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at timestamp on medications
CREATE OR REPLACE FUNCTION update_medications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER medications_updated_at_trigger
  BEFORE UPDATE ON medications
  FOR EACH ROW
  EXECUTE FUNCTION update_medications_updated_at();

-- Update updated_at timestamp on medication_administrations
CREATE OR REPLACE FUNCTION update_medication_administrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER medication_administrations_updated_at_trigger
  BEFORE UPDATE ON medication_administrations
  FOR EACH ROW
  EXECUTE FUNCTION update_medication_administrations_updated_at();

-- Update updated_at timestamp on medication_allergies
CREATE OR REPLACE FUNCTION update_medication_allergies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER medication_allergies_updated_at_trigger
  BEFORE UPDATE ON medication_allergies
  FOR EACH ROW
  EXECUTE FUNCTION update_medication_allergies_updated_at();

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Active medications with upcoming administrations
CREATE OR REPLACE VIEW active_medications_summary AS
SELECT
  m.id,
  m.client_id,
  m.name,
  m.generic_name,
  m.dosage,
  m.frequency,
  m.is_prn,
  m.status,
  COUNT(ma.id) FILTER (WHERE ma.status = 'pending' AND ma.scheduled_time > NOW()) as upcoming_doses,
  COUNT(ma.id) FILTER (WHERE ma.status = 'administered' AND ma.administered_time >= NOW() - INTERVAL '7 days') as doses_last_7_days
FROM medications m
LEFT JOIN medication_administrations ma ON m.id = ma.medication_id
WHERE m.status = 'active'
  AND (m.end_date IS NULL OR m.end_date >= CURRENT_DATE)
GROUP BY m.id;

-- Client medication summary with allergy count
CREATE OR REPLACE VIEW client_medication_summary AS
SELECT
  c.id as client_id,
  c.first_name,
  c.last_name,
  COUNT(DISTINCT m.id) FILTER (WHERE m.status = 'active') as active_medications,
  COUNT(DISTINCT m.id) FILTER (WHERE m.is_prn = TRUE AND m.status = 'active') as prn_medications,
  COUNT(DISTINCT ma.id) as active_allergies
FROM clients c
LEFT JOIN medications m ON c.id = m.client_id
LEFT JOIN medication_allergies ma ON c.id = ma.client_id AND ma.is_active = TRUE
GROUP BY c.id, c.first_name, c.last_name;

-- Medication adherence summary (last 30 days)
CREATE OR REPLACE VIEW medication_adherence_summary AS
SELECT
  m.id as medication_id,
  m.client_id,
  m.name,
  COUNT(*) FILTER (WHERE ma.scheduled_time >= NOW() - INTERVAL '30 days') as scheduled_doses,
  COUNT(*) FILTER (WHERE ma.status = 'administered' AND ma.scheduled_time >= NOW() - INTERVAL '30 days') as administered_doses,
  COUNT(*) FILTER (WHERE ma.status = 'skipped' AND ma.scheduled_time >= NOW() - INTERVAL '30 days') as skipped_doses,
  COUNT(*) FILTER (WHERE ma.status = 'refused' AND ma.scheduled_time >= NOW() - INTERVAL '30 days') as refused_doses,
  COUNT(*) FILTER (WHERE ma.status = 'missed' AND ma.scheduled_time >= NOW() - INTERVAL '30 days') as missed_doses,
  CASE
    WHEN COUNT(*) FILTER (WHERE ma.scheduled_time >= NOW() - INTERVAL '30 days') > 0
    THEN ROUND(
      (COUNT(*) FILTER (WHERE ma.status = 'administered' AND ma.scheduled_time >= NOW() - INTERVAL '30 days')::DECIMAL /
       COUNT(*) FILTER (WHERE ma.scheduled_time >= NOW() - INTERVAL '30 days')::DECIMAL) * 100,
      1
    )
    ELSE NULL
  END as adherence_rate_percent
FROM medications m
LEFT JOIN medication_administrations ma ON m.id = ma.medication_id
WHERE m.status = 'active'
GROUP BY m.id, m.client_id, m.name;

-- ============================================================================
-- SAMPLE DATA (for development/testing)
-- ============================================================================

-- Note: Uncomment to insert sample data for testing
/*
-- Sample medication
INSERT INTO medications (
  client_id, name, generic_name, strength, form, route, frequency, dosage,
  prescriber_name, indication, start_date, status, is_prn, created_by
) VALUES (
  'client-uuid-here',
  'Metformin',
  'Metformin HCl',
  '500mg',
  'tablet',
  'oral',
  'twice_daily',
  '1 tablet',
  'Dr. John Smith',
  'Type 2 Diabetes',
  CURRENT_DATE,
  'active',
  FALSE,
  'system-user-id'
);

-- Sample allergy
INSERT INTO medication_allergies (
  client_id, allergen, reaction, severity, is_active, created_by
) VALUES (
  'client-uuid-here',
  'Penicillin',
  'Hives and rash',
  'moderate',
  TRUE,
  'system-user-id'
);
*/

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE medications IS 'Stores medication records including prescriptions and PRN medications';
COMMENT ON TABLE medication_administrations IS 'Tracks each instance of medication administration';
COMMENT ON TABLE medication_allergies IS 'Tracks client medication allergies and sensitivities';

COMMENT ON COLUMN medications.is_prn IS 'PRN = Pro Re Nata (as needed)';
COMMENT ON COLUMN medications.frequency_details IS 'Custom frequency description when frequency is set to custom';
COMMENT ON COLUMN medication_administrations.witnessed_by IS 'Required for controlled substances in some jurisdictions';
COMMENT ON COLUMN medication_allergies.verified_date IS 'Date when allergy was verified by healthcare professional';
