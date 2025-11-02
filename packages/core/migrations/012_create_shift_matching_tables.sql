-- Shift Requirements Table
CREATE TABLE shift_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id),
  visit_id UUID REFERENCES visits(id),
  service_type VARCHAR(100) NOT NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  required_skills TEXT[],
  required_certifications TEXT[],
  language_preference VARCHAR(50),
  gender_preference VARCHAR(20),
  max_distance_miles NUMERIC(5,2),
  state VARCHAR(2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
  assigned_caregiver_id UUID REFERENCES caregivers(id),

  -- Audit
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP,
  version INTEGER NOT NULL DEFAULT 1,

  CONSTRAINT chk_status CHECK (status IN ('OPEN', 'ASSIGNED', 'FULFILLED', 'CANCELLED'))
);

CREATE INDEX idx_shift_requirements_client ON shift_requirements(client_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_shift_requirements_visit ON shift_requirements(visit_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_shift_requirements_status ON shift_requirements(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_shift_requirements_state ON shift_requirements(state) WHERE deleted_at IS NULL;
CREATE INDEX idx_shift_requirements_start_time ON shift_requirements(start_time) WHERE deleted_at IS NULL;