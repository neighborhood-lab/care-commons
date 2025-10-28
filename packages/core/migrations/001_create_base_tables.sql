-- Care Commons - Base Schema
-- Core tables for audit, revisions, and shared infrastructure

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Organizations table
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255),
    tax_id VARCHAR(50),
    license_number VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    primary_address JSONB NOT NULL,
    billing_address JSONB,
    settings JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by UUID NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    deleted_at TIMESTAMP,
    deleted_by UUID
);

CREATE INDEX idx_organizations_status ON organizations(status) WHERE deleted_at IS NULL;

-- Branches table
CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    phone VARCHAR(20),
    email VARCHAR(255),
    address JSONB NOT NULL,
    service_area JSONB,
    settings JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by UUID NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    deleted_at TIMESTAMP,
    deleted_by UUID
);

CREATE INDEX idx_branches_organization ON branches(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_branches_status ON branches(status) WHERE deleted_at IS NULL;

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    roles VARCHAR(50)[] NOT NULL DEFAULT '{}',
    permissions VARCHAR(100)[] DEFAULT '{}',
    branch_ids UUID[] DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'ACTIVE',
    last_login_at TIMESTAMP,
    password_changed_at TIMESTAMP,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by UUID NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    deleted_at TIMESTAMP,
    deleted_by UUID
);

CREATE INDEX idx_users_organization ON users(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_status ON users(status) WHERE deleted_at IS NULL;

-- Audit events table
CREATE TABLE audit_events (
    event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
    user_id UUID NOT NULL REFERENCES users(id),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    event_type VARCHAR(50) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    resource_id VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    result VARCHAR(20) NOT NULL,
    metadata JSONB DEFAULT '{}',
    ip_address VARCHAR(45),
    user_agent TEXT
);

CREATE INDEX idx_audit_events_user ON audit_events(user_id);
CREATE INDEX idx_audit_events_resource ON audit_events(resource, resource_id);
CREATE INDEX idx_audit_events_timestamp ON audit_events(timestamp DESC);
CREATE INDEX idx_audit_events_organization ON audit_events(organization_id);

-- Audit revisions table (detailed change history)
CREATE TABLE audit_revisions (
    revision_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_id UUID NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
    user_id UUID NOT NULL REFERENCES users(id),
    operation VARCHAR(20) NOT NULL,
    changes JSONB NOT NULL,
    snapshot JSONB NOT NULL,
    reason TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT
);

CREATE INDEX idx_audit_revisions_entity ON audit_revisions(entity_id, entity_type);
CREATE INDEX idx_audit_revisions_timestamp ON audit_revisions(timestamp DESC);
CREATE INDEX idx_audit_revisions_user ON audit_revisions(user_id);

-- Programs table
CREATE TABLE programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    description TEXT,
    program_type VARCHAR(100),
    funding_source VARCHAR(100),
    eligibility_criteria JSONB,
    service_types VARCHAR(100)[],
    hourly_rate DECIMAL(10, 2),
    settings JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'ACTIVE',
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by UUID NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    deleted_at TIMESTAMP,
    deleted_by UUID
);

CREATE INDEX idx_programs_organization ON programs(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_programs_status ON programs(status) WHERE deleted_at IS NULL;

-- Comments for documentation
COMMENT ON TABLE organizations IS 'Top-level organizational entities';
COMMENT ON TABLE branches IS 'Physical or logical divisions within an organization';
COMMENT ON TABLE users IS 'System users with role-based access';
COMMENT ON TABLE audit_events IS 'Security and compliance event log';
COMMENT ON TABLE audit_revisions IS 'Detailed entity change history';
COMMENT ON TABLE programs IS 'Service programs and funding sources';
