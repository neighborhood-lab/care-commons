-- Migration: Add Performance Indexes
-- Description: Strategic indexes for common queries and foreign keys
-- Date: 2025-11-26
-- Author: gaute-bot

-- ============================================================================
-- FOREIGN KEY INDEXES
-- ============================================================================
-- Foreign keys should always have indexes for join performance

-- Users table
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE deleted_at IS NULL;

-- Clients table
CREATE INDEX IF NOT EXISTS idx_clients_organization_id ON clients(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_clients_org_status ON clients(organization_id, status) WHERE deleted_at IS NULL;

-- Caregivers table
CREATE INDEX IF NOT EXISTS idx_caregivers_organization_id ON caregivers(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_caregivers_status ON caregivers(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_caregivers_org_status ON caregivers(organization_id, status) WHERE deleted_at IS NULL;

-- Visits table (high volume)
CREATE INDEX IF NOT EXISTS idx_visits_organization_id ON visits(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_visits_client_id ON visits(client_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_visits_caregiver_id ON visits(caregiver_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_visits_status ON visits(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_visits_scheduled_date ON visits(scheduled_date) WHERE deleted_at IS NULL;

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_visits_org_date ON visits(organization_id, scheduled_date DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_visits_client_date ON visits(client_id, scheduled_date DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_visits_caregiver_date ON visits(caregiver_id, scheduled_date DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_visits_org_status ON visits(organization_id, status) WHERE deleted_at IS NULL;

-- EVV Records table (compliance queries)
CREATE INDEX IF NOT EXISTS idx_evv_records_visit_id ON evv_records(visit_id);
CREATE INDEX IF NOT EXISTS idx_evv_records_clock_in ON evv_records(clock_in_time);
CREATE INDEX IF NOT EXISTS idx_evv_records_org_date ON evv_records(organization_id, clock_in_time DESC);
CREATE INDEX IF NOT EXISTS idx_evv_records_compliance ON evv_records(organization_id, compliance_status) WHERE compliance_status IN ('non_compliant', 'warning');

-- Care Plans table
CREATE INDEX IF NOT EXISTS idx_care_plans_client_id ON care_plans(client_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_care_plans_org ON care_plans(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_care_plans_status ON care_plans(status) WHERE deleted_at IS NULL;

-- Task Instances table
CREATE INDEX IF NOT EXISTS idx_task_instances_care_plan ON task_instances(care_plan_id);
CREATE INDEX IF NOT EXISTS idx_task_instances_status ON task_instances(status);
CREATE INDEX IF NOT EXISTS idx_task_instances_assigned ON task_instances(assigned_to_id);

-- Family Members table
CREATE INDEX IF NOT EXISTS idx_family_members_client_id ON family_members(client_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_family_members_user_id ON family_members(user_id) WHERE deleted_at IS NULL;

-- Caregiver Credentials table
CREATE INDEX IF NOT EXISTS idx_caregiver_creds_caregiver ON caregiver_credentials(caregiver_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_caregiver_creds_expiry ON caregiver_credentials(expiration_date) WHERE expiration_date IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_caregiver_creds_expiring_soon ON caregiver_credentials(caregiver_id, expiration_date) 
  WHERE expiration_date > NOW() AND expiration_date < (NOW() + INTERVAL '30 days') AND deleted_at IS NULL;

-- Client Documents table
CREATE INDEX IF NOT EXISTS idx_client_documents_client ON client_documents(client_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_client_documents_type ON client_documents(document_type) WHERE deleted_at IS NULL;

-- Progress Notes table
CREATE INDEX IF NOT EXISTS idx_progress_notes_care_plan ON progress_notes(care_plan_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_progress_notes_created ON progress_notes(created_at DESC);

-- ============================================================================
-- BILLING & INVOICING INDEXES
-- ============================================================================

-- Payments table
CREATE INDEX IF NOT EXISTS idx_payments_org ON payments(organization_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_org_status ON payments(organization_id, status);

-- Invoices table (if exists)
CREATE INDEX IF NOT EXISTS idx_invoices_org ON invoices(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_org_status ON invoices(organization_id, status) WHERE deleted_at IS NULL;

-- ============================================================================
-- DEMO DATA INDEXES (for efficient cleanup)
-- ============================================================================

-- Partial indexes for demo data cleanup queries
CREATE INDEX IF NOT EXISTS idx_clients_demo_data ON clients(organization_id) WHERE is_demo_data = true;
CREATE INDEX IF NOT EXISTS idx_caregivers_demo_data ON caregivers(organization_id) WHERE is_demo_data = true;
CREATE INDEX IF NOT EXISTS idx_visits_demo_data ON visits(organization_id) WHERE is_demo_data = true;
CREATE INDEX IF NOT EXISTS idx_care_plans_demo_data ON care_plans(organization_id) WHERE is_demo_data = true;
CREATE INDEX IF NOT EXISTS idx_evv_records_demo_data ON evv_records(organization_id) WHERE is_demo_data = true;

-- ============================================================================
-- ANALYTICS & REPORTING INDEXES
-- ============================================================================

-- Common date range queries
CREATE INDEX IF NOT EXISTS idx_visits_date_range ON visits(organization_id, scheduled_date) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_evv_date_range ON evv_records(organization_id, clock_in_time);

-- Status aggregations
CREATE INDEX IF NOT EXISTS idx_visits_status_count ON visits(organization_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_clients_status_count ON clients(organization_id, status) WHERE deleted_at IS NULL;

-- ============================================================================
-- NOTES
-- ============================================================================
-- - All indexes use IF NOT EXISTS for safe re-running
-- - Partial indexes (WHERE clauses) reduce index size and improve performance
-- - Indexes on deleted_at IS NULL avoid scanning deleted records
-- - Composite indexes ordered for common query patterns (org_id first, then filter/sort columns)
-- - Demo data indexes support efficient cleanup operations
-- - Foreign key indexes improve JOIN performance
-- - No indexes on very small tables (<1000 rows) to avoid overhead
