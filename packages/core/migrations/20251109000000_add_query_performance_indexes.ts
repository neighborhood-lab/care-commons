import type { Knex } from 'knex';

/**
 * Query Performance Optimization Migration
 *
 * This migration adds additional indexes for:
 * - Billing-related queries (billable items, payments, authorizations)
 * - Payer and rate schedule lookups
 * - Multi-tenant scoped queries
 * - Common search and filter patterns
 */

export async function up(knex: Knex): Promise<void> {
  // ============================================================================
  // BILLABLE ITEMS - Optimize Billing Queries
  // ============================================================================

  // Optimize service date range queries with status filter
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_billable_items_date_status
    ON billable_items(service_date DESC, status)
    WHERE deleted_at IS NULL
  `);

  // Optimize authorization-related queries
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_billable_items_authorization
    ON billable_items(authorization_id, service_date DESC)
    WHERE deleted_at IS NULL AND is_authorized = true
  `);

  // Optimize caregiver billing queries
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_billable_items_caregiver_date
    ON billable_items(caregiver_id, service_date DESC)
    WHERE deleted_at IS NULL
  `);

  // Optimize EVV record linkage
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_billable_items_evv
    ON billable_items(evv_record_id)
    WHERE deleted_at IS NULL AND evv_record_id IS NOT NULL
  `);

  // Optimize hold and review queries
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_billable_items_review
    ON billable_items(organization_id, service_date DESC)
    WHERE deleted_at IS NULL AND (is_hold = true OR requires_review = true)
  `);

  // Optimize unpaid items queries
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_billable_items_unpaid
    ON billable_items(payer_id, service_date DESC)
    WHERE deleted_at IS NULL AND is_paid = false AND invoice_id IS NULL
  `);

  // ============================================================================
  // PAYMENTS - Optimize Payment Processing Queries
  // ============================================================================

  // Optimize unreconciled payment queries
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_payments_unreconciled
    ON payments(organization_id, payment_date DESC)
    WHERE is_reconciled = false
  `);

  // Optimize payment allocation queries
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_payments_unapplied
    ON payments(payer_id, payment_date DESC)
    WHERE unapplied_amount > 0 AND status != 'VOIDED'
  `);

  // Optimize date range queries for payment reporting
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_payments_date_range
    ON payments(payment_date, received_date)
    WHERE status IN ('APPLIED', 'PARTIALLY_APPLIED', 'UNAPPLIED')
  `);

  // ============================================================================
  // SERVICE AUTHORIZATIONS - Optimize Authorization Lookups
  // ============================================================================

  // Optimize client + service type authorization queries
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_authorizations_client_service
    ON service_authorizations(client_id, service_type_id, effective_from, effective_to)
    WHERE deleted_at IS NULL AND status = 'ACTIVE'
  `);

  // Optimize authorization expiration queries
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_authorizations_expiring
    ON service_authorizations(organization_id, effective_to)
    WHERE deleted_at IS NULL
      AND status = 'ACTIVE'
      AND effective_to >= CURRENT_DATE
      AND effective_to <= CURRENT_DATE + INTERVAL '30 days'
  `);

  // Optimize low units threshold alerts
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_authorizations_low_units
    ON service_authorizations(organization_id, remaining_units)
    WHERE deleted_at IS NULL
      AND status = 'ACTIVE'
      AND low_units_threshold IS NOT NULL
      AND remaining_units <= low_units_threshold
  `);

  // Optimize authorization number lookups (unique constraint creates index automatically, but explicit for clarity)
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_authorizations_number
    ON service_authorizations(authorization_number)
    WHERE deleted_at IS NULL
  `);

  // ============================================================================
  // PAYERS - Optimize Payer Queries
  // ============================================================================

  // Optimize active payer queries by organization
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_payers_org_status
    ON payers(organization_id, status, payer_name)
    WHERE deleted_at IS NULL
  `);

  // Optimize payer type filtering
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_payers_type
    ON payers(payer_type, organization_id)
    WHERE deleted_at IS NULL AND status = 'ACTIVE'
  `);

  // Optimize external ID lookups for EDI processing
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_payers_edi
    ON payers(edi_payer_id)
    WHERE deleted_at IS NULL AND edi_payer_id IS NOT NULL
  `);

  // ============================================================================
  // RATE SCHEDULES - Optimize Rate Lookup Queries
  // ============================================================================

  // Optimize active rate schedule queries by payer
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_rate_schedules_payer_active
    ON rate_schedules(payer_id, effective_from, effective_to)
    WHERE status = 'ACTIVE'
  `);

  // Optimize organization-wide rate queries
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_rate_schedules_org_effective
    ON rate_schedules(organization_id, effective_from DESC)
    WHERE status = 'ACTIVE' AND payer_id IS NULL
  `);

  // Optimize branch-specific rate queries
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_rate_schedules_branch_effective
    ON rate_schedules(branch_id, effective_from DESC)
    WHERE status = 'ACTIVE' AND branch_id IS NOT NULL
  `);

  // ============================================================================
  // CLIENTS - Additional Client Query Optimizations
  // ============================================================================

  // Optimize client search by name (for autocomplete)
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_clients_name_search
    ON clients(organization_id, first_name, last_name)
    WHERE deleted_at IS NULL AND status = 'ACTIVE'
  `);

  // Optimize program-based client queries
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_clients_program
    ON clients USING GIN(program_ids)
    WHERE deleted_at IS NULL
  `);

  // ============================================================================
  // CAREGIVERS - Additional Caregiver Query Optimizations
  // ============================================================================

  // Optimize caregiver search by name (for autocomplete)
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_caregivers_name_search
    ON caregivers(organization_id, first_name, last_name)
    WHERE deleted_at IS NULL AND status IN ('ACTIVE', 'ON_LEAVE')
  `);

  // Optimize skill-based matching queries
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_caregivers_skills
    ON caregivers USING GIN(skills)
    WHERE deleted_at IS NULL AND status = 'ACTIVE'
  `);

  // Optimize certification-based queries
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_caregivers_certifications
    ON caregivers USING GIN(certifications)
    WHERE deleted_at IS NULL AND status = 'ACTIVE'
  `);

  // ============================================================================
  // SCHEDULES - Optimize Schedule and Pattern Queries
  // ============================================================================

  // Optimize client schedule queries
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_schedules_client_dates
    ON schedules(client_id, effective_from, effective_to)
    WHERE deleted_at IS NULL AND status = 'ACTIVE'
  `);

  // Optimize service pattern queries by client
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_service_patterns_client
    ON service_patterns(client_id, day_of_week)
    WHERE deleted_at IS NULL AND is_active = true
  `);

  // ============================================================================
  // BRANCHES - Optimize Branch Queries
  // ============================================================================

  // Optimize organization branch queries
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_branches_org_status
    ON branches(organization_id, status)
    WHERE deleted_at IS NULL
  `);

  // ============================================================================
  // PROGRAMS - Optimize Program Queries
  // ============================================================================

  // Optimize program queries by organization
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_programs_org_status
    ON programs(organization_id, status)
    WHERE deleted_at IS NULL
  `);
}

export async function down(knex: Knex): Promise<void> {
  // Drop all indexes in reverse order

  // Programs
  await knex.raw('DROP INDEX IF EXISTS idx_programs_org_status');

  // Branches
  await knex.raw('DROP INDEX IF EXISTS idx_branches_org_status');

  // Schedules
  await knex.raw('DROP INDEX IF EXISTS idx_service_patterns_client');
  await knex.raw('DROP INDEX IF EXISTS idx_schedules_client_dates');

  // Caregivers
  await knex.raw('DROP INDEX IF EXISTS idx_caregivers_certifications');
  await knex.raw('DROP INDEX IF EXISTS idx_caregivers_skills');
  await knex.raw('DROP INDEX IF EXISTS idx_caregivers_name_search');

  // Clients
  await knex.raw('DROP INDEX IF EXISTS idx_clients_program');
  await knex.raw('DROP INDEX IF EXISTS idx_clients_name_search');

  // Rate schedules
  await knex.raw('DROP INDEX IF EXISTS idx_rate_schedules_branch_effective');
  await knex.raw('DROP INDEX IF EXISTS idx_rate_schedules_org_effective');
  await knex.raw('DROP INDEX IF EXISTS idx_rate_schedules_payer_active');

  // Payers
  await knex.raw('DROP INDEX IF EXISTS idx_payers_edi');
  await knex.raw('DROP INDEX IF EXISTS idx_payers_type');
  await knex.raw('DROP INDEX IF EXISTS idx_payers_org_status');

  // Service authorizations
  await knex.raw('DROP INDEX IF EXISTS idx_authorizations_number');
  await knex.raw('DROP INDEX IF EXISTS idx_authorizations_low_units');
  await knex.raw('DROP INDEX IF EXISTS idx_authorizations_expiring');
  await knex.raw('DROP INDEX IF EXISTS idx_authorizations_client_service');

  // Payments
  await knex.raw('DROP INDEX IF EXISTS idx_payments_date_range');
  await knex.raw('DROP INDEX IF EXISTS idx_payments_unapplied');
  await knex.raw('DROP INDEX IF EXISTS idx_payments_unreconciled');

  // Billable items
  await knex.raw('DROP INDEX IF EXISTS idx_billable_items_unpaid');
  await knex.raw('DROP INDEX IF EXISTS idx_billable_items_review');
  await knex.raw('DROP INDEX IF EXISTS idx_billable_items_evv');
  await knex.raw('DROP INDEX IF EXISTS idx_billable_items_caregiver_date');
  await knex.raw('DROP INDEX IF EXISTS idx_billable_items_authorization');
  await knex.raw('DROP INDEX IF EXISTS idx_billable_items_date_status');
}
