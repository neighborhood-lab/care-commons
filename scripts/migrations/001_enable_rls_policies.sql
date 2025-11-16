/**
 * Enable Row-Level Security (RLS) Policies
 * 
 * This migration implements PostgreSQL Row-Level Security to enforce
 * organization-level data isolation at the database layer.
 * 
 * CRITICAL SECURITY: RLS provides defense-in-depth by ensuring that
 * even if application-level scoping is bypassed, the database will
 * still enforce multi-tenancy isolation.
 * 
 * WARNING: This migration requires careful testing before production deployment.
 * Test thoroughly in staging environment first.
 */

-- =============================================================================
-- PART 1: Enable RLS on Core Tables
-- =============================================================================

-- Organizations table (base table - special handling)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Branches table
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;

-- Organization invitations
ALTER TABLE organization_invitations ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- PART 2: Enable RLS on Client Demographics Tables
-- =============================================================================

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- PART 3: Enable RLS on Caregiver/Staff Tables
-- =============================================================================

ALTER TABLE caregivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE caregiver_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE caregiver_service_authorizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE state_background_screenings ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- PART 4: Enable RLS on Scheduling/Visits Tables
-- =============================================================================

ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- PART 5: Enable RLS on Care Plans/Tasks Tables
-- =============================================================================

ALTER TABLE care_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_plan_tasks ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- PART 6: Enable RLS on EVV/Time Tracking Tables
-- =============================================================================

ALTER TABLE evv_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE evv_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE evv_aggregator_submissions ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- PART 7: Enable RLS on Visit Notes Tables
-- =============================================================================

ALTER TABLE visit_notes ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- PART 8: Enable RLS on Billing/Invoicing Tables
-- =============================================================================

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- PART 9: Enable RLS on Payroll Tables
-- =============================================================================

ALTER TABLE payroll_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_entries ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- PART 10: Enable RLS on Incident Reporting Tables
-- =============================================================================

ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- PART 11: Enable RLS on QA/Audit Tables
-- =============================================================================

ALTER TABLE qa_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE qa_audit_findings ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- PART 12: Enable RLS on Family Engagement Tables
-- =============================================================================

ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_communication_logs ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- PART 13: Create RLS Helper Function
-- =============================================================================

/**
 * Get current organization ID from JWT token or session variable
 * 
 * This function extracts the organization_id from the current session.
 * The application must set this via:
 *   SET LOCAL app.current_organization_id = '<org_id>';
 * 
 * This should be set at the start of each transaction/request.
 */
CREATE OR REPLACE FUNCTION app_get_current_organization_id()
RETURNS UUID AS $$
DECLARE
  org_id TEXT;
BEGIN
  -- Get organization ID from session variable
  org_id := current_setting('app.current_organization_id', TRUE);
  
  -- Return NULL if not set (will deny access via RLS)
  IF org_id IS NULL OR org_id = '' THEN
    RETURN NULL;
  END IF;
  
  RETURN org_id::UUID;
EXCEPTION
  WHEN OTHERS THEN
    -- If variable not set or invalid UUID, return NULL (deny access)
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

/**
 * Check if current user is a super admin
 * 
 * Super admins can bypass RLS for administrative operations.
 * Use this sparingly and only for legitimate admin operations.
 */
CREATE OR REPLACE FUNCTION app_is_super_admin()
RETURNS BOOLEAN AS $$
DECLARE
  is_admin TEXT;
BEGIN
  is_admin := current_setting('app.is_super_admin', TRUE);
  RETURN is_admin = 'true';
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- =============================================================================
-- PART 14: Create RLS Policies for Core Tables
-- =============================================================================

-- Organizations: Users can only see their own organization
CREATE POLICY org_isolation_policy ON organizations
  FOR ALL
  USING (
    id = app_get_current_organization_id() 
    OR app_is_super_admin()
  );

-- Users: Can only see users in same organization
CREATE POLICY org_isolation_policy ON users
  FOR ALL
  USING (
    organization_id = app_get_current_organization_id()
    OR app_is_super_admin()
  );

-- Branches: Can only see branches in same organization
CREATE POLICY org_isolation_policy ON branches
  FOR ALL
  USING (
    organization_id = app_get_current_organization_id()
    OR app_is_super_admin()
  );

-- Organization invitations: Can only see invitations for own org
CREATE POLICY org_isolation_policy ON organization_invitations
  FOR ALL
  USING (
    organization_id = app_get_current_organization_id()
    OR app_is_super_admin()
  );

-- =============================================================================
-- PART 15: Create RLS Policies for Data Tables
-- =============================================================================

-- Generic policy template for all data tables
-- This ensures all tables filter by organization_id

-- Clients
CREATE POLICY org_isolation_policy ON clients
  FOR ALL
  USING (
    organization_id = app_get_current_organization_id()
    OR app_is_super_admin()
  );

-- Caregivers
CREATE POLICY org_isolation_policy ON caregivers
  FOR ALL
  USING (
    organization_id = app_get_current_organization_id()
    OR app_is_super_admin()
  );

-- Caregiver Credentials
CREATE POLICY org_isolation_policy ON caregiver_credentials
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM caregivers 
      WHERE caregivers.id = caregiver_credentials.caregiver_id
      AND caregivers.organization_id = app_get_current_organization_id()
    )
    OR app_is_super_admin()
  );

-- Caregiver Service Authorizations
CREATE POLICY org_isolation_policy ON caregiver_service_authorizations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM caregivers 
      WHERE caregivers.id = caregiver_service_authorizations.caregiver_id
      AND caregivers.organization_id = app_get_current_organization_id()
    )
    OR app_is_super_admin()
  );

-- State Background Screenings
CREATE POLICY org_isolation_policy ON state_background_screenings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM caregivers 
      WHERE caregivers.id = state_background_screenings.caregiver_id
      AND caregivers.organization_id = app_get_current_organization_id()
    )
    OR app_is_super_admin()
  );

-- Schedules
CREATE POLICY org_isolation_policy ON schedules
  FOR ALL
  USING (
    organization_id = app_get_current_organization_id()
    OR app_is_super_admin()
  );

-- Visits
CREATE POLICY org_isolation_policy ON visits
  FOR ALL
  USING (
    organization_id = app_get_current_organization_id()
    OR app_is_super_admin()
  );

-- Care Plans
CREATE POLICY org_isolation_policy ON care_plans
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = care_plans.client_id
      AND clients.organization_id = app_get_current_organization_id()
    )
    OR app_is_super_admin()
  );

-- Care Plan Tasks
CREATE POLICY org_isolation_policy ON care_plan_tasks
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM care_plans
      JOIN clients ON clients.id = care_plans.client_id
      WHERE care_plans.id = care_plan_tasks.care_plan_id
      AND clients.organization_id = app_get_current_organization_id()
    )
    OR app_is_super_admin()
  );

-- EVV Records
CREATE POLICY org_isolation_policy ON evv_records
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM visits 
      WHERE visits.id = evv_records.visit_id
      AND visits.organization_id = app_get_current_organization_id()
    )
    OR app_is_super_admin()
  );

-- EVV Exceptions
CREATE POLICY org_isolation_policy ON evv_exceptions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM evv_records
      JOIN visits ON visits.id = evv_records.visit_id
      WHERE evv_records.id = evv_exceptions.evv_record_id
      AND visits.organization_id = app_get_current_organization_id()
    )
    OR app_is_super_admin()
  );

-- EVV Aggregator Submissions
CREATE POLICY org_isolation_policy ON evv_aggregator_submissions
  FOR ALL
  USING (
    organization_id = app_get_current_organization_id()
    OR app_is_super_admin()
  );

-- Visit Notes
CREATE POLICY org_isolation_policy ON visit_notes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM visits 
      WHERE visits.id = visit_notes.visit_id
      AND visits.organization_id = app_get_current_organization_id()
    )
    OR app_is_super_admin()
  );

-- Invoices
CREATE POLICY org_isolation_policy ON invoices
  FOR ALL
  USING (
    organization_id = app_get_current_organization_id()
    OR app_is_super_admin()
  );

-- Invoice Line Items
CREATE POLICY org_isolation_policy ON invoice_line_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM invoices 
      WHERE invoices.id = invoice_line_items.invoice_id
      AND invoices.organization_id = app_get_current_organization_id()
    )
    OR app_is_super_admin()
  );

-- Payroll Periods
CREATE POLICY org_isolation_policy ON payroll_periods
  FOR ALL
  USING (
    organization_id = app_get_current_organization_id()
    OR app_is_super_admin()
  );

-- Payroll Entries
CREATE POLICY org_isolation_policy ON payroll_entries
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM payroll_periods 
      WHERE payroll_periods.id = payroll_entries.payroll_period_id
      AND payroll_periods.organization_id = app_get_current_organization_id()
    )
    OR app_is_super_admin()
  );

-- Incidents
CREATE POLICY org_isolation_policy ON incidents
  FOR ALL
  USING (
    organization_id = app_get_current_organization_id()
    OR app_is_super_admin()
  );

-- QA Audits
CREATE POLICY org_isolation_policy ON qa_audits
  FOR ALL
  USING (
    organization_id = app_get_current_organization_id()
    OR app_is_super_admin()
  );

-- QA Audit Findings
CREATE POLICY org_isolation_policy ON qa_audit_findings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM qa_audits 
      WHERE qa_audits.id = qa_audit_findings.audit_id
      AND qa_audits.organization_id = app_get_current_organization_id()
    )
    OR app_is_super_admin()
  );

-- Family Members
CREATE POLICY org_isolation_policy ON family_members
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = family_members.client_id
      AND clients.organization_id = app_get_current_organization_id()
    )
    OR app_is_super_admin()
  );

-- Family Communication Logs
CREATE POLICY org_isolation_policy ON family_communication_logs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM family_members
      JOIN clients ON clients.id = family_members.client_id
      WHERE family_members.id = family_communication_logs.family_member_id
      AND clients.organization_id = app_get_current_organization_id()
    )
    OR app_is_super_admin()
  );

-- =============================================================================
-- PART 16: Grant Necessary Permissions
-- =============================================================================

-- Grant execute permission on helper functions to application role
-- Adjust role name as needed for your deployment
GRANT EXECUTE ON FUNCTION app_get_current_organization_id() TO PUBLIC;
GRANT EXECUTE ON FUNCTION app_is_super_admin() TO PUBLIC;

-- =============================================================================
-- NOTES
-- =============================================================================

/**
 * To use RLS in your application:
 * 
 * 1. At the start of each request/transaction, set the organization context:
 *    await db.query("SET LOCAL app.current_organization_id = $1", [organizationId]);
 * 
 * 2. For super admin operations (use sparingly):
 *    await db.query("SET LOCAL app.is_super_admin = 'true'");
 * 
 * 3. The RLS policies will automatically filter all queries to the current organization.
 * 
 * 4. To disable RLS for a specific query (NOT RECOMMENDED in production):
 *    You must have BYPASSRLS privilege or be a superuser.
 * 
 * TESTING:
 * - Test cross-organization access attempts
 * - Test super admin access
 * - Test performance impact of RLS policies
 * - Ensure indexes exist on organization_id columns for performance
 */
