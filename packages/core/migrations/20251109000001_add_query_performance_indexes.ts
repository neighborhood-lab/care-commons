import type { Knex } from 'knex';

/**
 * Query Performance Optimization Migration
 *
 * This migration adds supplemental indexes for query patterns not covered
 * by existing migrations. It only adds indexes for:
 * - Composite queries that span multiple filter dimensions
 * - Date range queries with additional filters
 * - Name search optimization for autocomplete
 *
 * Note: Many indexes already exist from prior migrations. This migration
 * only adds NEW indexes that provide measurable query optimization.
 */

export async function up(knex: Knex): Promise<void> {
  // ============================================================================
  // BILLABLE ITEMS - Additional Query Optimizations
  // ============================================================================

  // Optimize date + status queries (date DESC for recent-first ordering)
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_billable_items_date_status
    ON billable_items(service_date DESC, status)
    WHERE deleted_at IS NULL
  `);

  // Optimize authorization date range queries
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_billable_items_authorization_date
    ON billable_items(authorization_id, service_date DESC)
    WHERE deleted_at IS NULL AND is_authorized = true
  `);

  // ============================================================================
  // PAYMENTS - Additional Query Optimizations
  // ============================================================================

  // Optimize unreconciled payment queries
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_payments_unreconciled
    ON payments(organization_id, payment_date DESC)
    WHERE is_reconciled = false
  `);

  // Optimize unapplied payment queries
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_payments_unapplied
    ON payments(payer_id, payment_date DESC)
    WHERE unapplied_amount > 0 AND status != 'VOIDED'
  `);

  // ============================================================================
  // SERVICE AUTHORIZATIONS - Additional Query Optimizations
  // ============================================================================

  // Optimize client + service type authorization lookups
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_authorizations_client_service
    ON service_authorizations(client_id, service_type_id, effective_from, effective_to)
    WHERE deleted_at IS NULL AND status = 'ACTIVE'
  `);

  // Optimize low units threshold alert queries
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_authorizations_low_units_threshold
    ON service_authorizations(organization_id, remaining_units)
    WHERE deleted_at IS NULL
      AND status = 'ACTIVE'
      AND low_units_threshold IS NOT NULL
      AND remaining_units <= low_units_threshold
  `);

  // ============================================================================
  // PAYERS - Additional Query Optimizations
  // ============================================================================

  // Optimize EDI payer ID lookups
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_payers_edi
    ON payers(edi_payer_id)
    WHERE deleted_at IS NULL AND edi_payer_id IS NOT NULL
  `);

  // ============================================================================
  // RATE SCHEDULES - Additional Query Optimizations
  // ============================================================================

  // Optimize payer rate schedule effective date queries
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_rate_schedules_payer_effective
    ON rate_schedules(payer_id, effective_from, effective_to)
    WHERE status = 'ACTIVE'
  `);

  // ============================================================================
  // CLIENTS - Name Search Optimization
  // ============================================================================

  // Optimize client name search for autocomplete
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_clients_name_search
    ON clients(organization_id, first_name, last_name)
    WHERE deleted_at IS NULL AND status = 'ACTIVE'
  `);

  // ============================================================================
  // CAREGIVERS - Name Search Optimization
  // ============================================================================

  // Optimize caregiver name search for autocomplete
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_caregivers_name_search
    ON caregivers(organization_id, first_name, last_name)
    WHERE deleted_at IS NULL AND status IN ('ACTIVE', 'ON_LEAVE')
  `);
}

export async function down(knex: Knex): Promise<void> {
  // Drop all indexes in reverse order

  // Caregivers
  await knex.raw('DROP INDEX IF EXISTS idx_caregivers_name_search');

  // Clients
  await knex.raw('DROP INDEX IF EXISTS idx_clients_name_search');

  // Rate schedules
  await knex.raw('DROP INDEX IF EXISTS idx_rate_schedules_payer_effective');

  // Payers
  await knex.raw('DROP INDEX IF EXISTS idx_payers_edi');

  // Service authorizations
  await knex.raw('DROP INDEX IF EXISTS idx_authorizations_low_units_threshold');
  await knex.raw('DROP INDEX IF EXISTS idx_authorizations_client_service');

  // Payments
  await knex.raw('DROP INDEX IF EXISTS idx_payments_unapplied');
  await knex.raw('DROP INDEX IF EXISTS idx_payments_unreconciled');

  // Billable items
  await knex.raw('DROP INDEX IF EXISTS idx_billable_items_authorization_date');
  await knex.raw('DROP INDEX IF EXISTS idx_billable_items_date_status');
}
