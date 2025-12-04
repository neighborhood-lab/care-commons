import type { Knex } from 'knex';

/**
 * Supplemental Query Optimization Indexes
 *
 * Adds strategic indexes for common query patterns identified during
 * performance analysis. Focuses on multi-table JOINs and frequently
 * filtered columns.
 *
 * Issue: #433 - Performance: Add database query optimization and indexing
 */

export async function up(knex: Knex): Promise<void> {
  // ============================================================================
  // VISITS - Enhanced JOIN and Filter Optimization
  // ============================================================================

  // Optimize visit → client → caregiver JOIN queries (common dashboard pattern)
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_visits_multi_join_optimization
    ON visits(organization_id, scheduled_date, status, client_id, assigned_caregiver_id)
    WHERE deleted_at IS NULL
  `);

  // Optimize "visits needing assignment" queries
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_visits_unassigned_priority
    ON visits(organization_id, scheduled_date, is_urgent)
    WHERE deleted_at IS NULL
      AND assigned_caregiver_id IS NULL
      AND status IN ('SCHEDULED', 'PENDING')
  `);

  // ============================================================================
  // EVV_RECORDS - Compliance Query Optimization
  // ============================================================================

  // Optimize compliance reporting queries (date range + status)
  // Note: evv_records does not use soft deletes, no deleted_at column
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_evv_compliance_reporting
    ON evv_records(organization_id, service_date, record_status)
  `);

  // Optimize exception/flag queries for compliance dashboards
  // Note: evv_records uses jsonb compliance_flags, not boolean exception columns
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_evv_exceptions
    ON evv_records(organization_id, service_date)
    WHERE compliance_flags @> '["GEOFENCE_VIOLATION"]'::jsonb
       OR compliance_flags @> '["LOCATION_SUSPICIOUS"]'::jsonb
       OR compliance_flags @> '["TIME_DISCREPANCY"]'::jsonb
  `);

  // ============================================================================
  // CLIENTS - Enhanced Search and Filter
  // ============================================================================

  // Optimize client list with status + last visit date (dashboard common query)
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_clients_status_activity
    ON clients(organization_id, status, last_visit_date DESC)
    WHERE deleted_at IS NULL
  `);

  // ============================================================================
  // CAREGIVERS - Availability and Assignment Optimization
  // ============================================================================

  // Optimize caregiver availability queries (active + has availability)
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_caregivers_availability
    ON caregivers(organization_id, status)
    WHERE deleted_at IS NULL
      AND status IN ('ACTIVE', 'ON_LEAVE')
      AND availability_schedule IS NOT NULL
  `);

  // Optimize caregiver certification expiry monitoring
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_caregivers_cert_expiry
    ON caregivers(organization_id, certification_expiry_date)
    WHERE deleted_at IS NULL
      AND status = 'ACTIVE'
      AND certification_expiry_date IS NOT NULL
      AND certification_expiry_date <= CURRENT_DATE + INTERVAL '90 days'
  `);

  // ============================================================================
  // USERS - Authentication and Session Optimization
  // ============================================================================

  // Optimize user login queries (email lookup is critical path)
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_users_email_active
    ON users(email)
    WHERE deleted_at IS NULL AND is_active = true
  `);

  // Optimize user → organization lookups (common in auth middleware)
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_users_org_role
    ON users(organization_id, role)
    WHERE deleted_at IS NULL AND is_active = true
  `);
}

export async function down(knex: Knex): Promise<void> {
  // Drop all indexes in reverse order
  await knex.raw('DROP INDEX IF EXISTS idx_users_org_role');
  await knex.raw('DROP INDEX IF EXISTS idx_users_email_active');
  await knex.raw('DROP INDEX IF EXISTS idx_caregivers_cert_expiry');
  await knex.raw('DROP INDEX IF EXISTS idx_caregivers_availability');
  await knex.raw('DROP INDEX IF EXISTS idx_clients_status_activity');
  await knex.raw('DROP INDEX IF EXISTS idx_evv_exceptions');
  await knex.raw('DROP INDEX IF EXISTS idx_evv_compliance_reporting');
  await knex.raw('DROP INDEX IF EXISTS idx_visits_unassigned_priority');
  await knex.raw('DROP INDEX IF EXISTS idx_visits_multi_join_optimization');
}
