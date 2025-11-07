import type { Knex } from 'knex';

/**
 * Additional Performance Indexes Migration
 *
 * This migration adds composite indexes for:
 * - Care plans (client + status queries, date range queries) - HAS deleted_at
 * - Task instances (caregiver assignment, visit tasks, scheduling) - NO deleted_at
 * - Invoices (client billing, status queries) - HAS deleted_at
 * - Audit events (enhanced event type and user activity queries) - NO deleted_at
 * - Audit revisions (entity change tracking) - NO deleted_at
 * - EVV records (compliance queries) - NO deleted_at
 */

export async function up(knex: Knex): Promise<void> {
  // ============================================================================
  // CARE PLANS - Optimize Client and Date Range Queries
  // ============================================================================
  // Note: care_plans table HAS deleted_at column

  // Optimize care plan queries filtered by client and status
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_care_plans_client_status
    ON care_plans(client_id, status)
    WHERE deleted_at IS NULL
  `);

  // Optimize date range queries for active care plans
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_care_plans_dates
    ON care_plans(effective_date, expiration_date)
    WHERE deleted_at IS NULL AND status = 'ACTIVE'
  `);

  // Optimize coordinator/supervisor lookups
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_care_plans_coordinator
    ON care_plans(coordinator_id, status)
    WHERE deleted_at IS NULL
  `);

  // ============================================================================
  // TASK INSTANCES - Optimize Assignment and Status Queries
  // ============================================================================
  // Note: task_instances table does NOT have deleted_at column

  // Optimize queries for caregiver's assigned tasks with status
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_task_instances_caregiver_status
    ON task_instances(assigned_caregiver_id, status)
  `);

  // Optimize queries for tasks within a visit
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_task_instances_visit_status
    ON task_instances(visit_id, status)
  `);

  // Optimize scheduling queries (tasks due on specific dates)
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_task_instances_scheduled_status
    ON task_instances(scheduled_date, status)
  `);

  // Optimize client task queries
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_task_instances_client_date
    ON task_instances(client_id, scheduled_date DESC)
  `);

  // Optimize care plan task lookups
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_task_instances_care_plan
    ON task_instances(care_plan_id, scheduled_date DESC)
  `);

  // ============================================================================
  // INVOICES - Optimize Billing and Status Queries
  // ============================================================================
  // Note: invoices table HAS deleted_at column

  // Optimize client invoice queries by date
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_invoices_client_date
    ON invoices(client_id, invoice_date DESC)
    WHERE deleted_at IS NULL
  `);

  // Optimize invoice status queries with date sorting
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_invoices_status_date
    ON invoices(status, invoice_date DESC)
    WHERE deleted_at IS NULL
  `);

  // Optimize payer invoice queries
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_invoices_payer_date
    ON invoices(payer_id, invoice_date DESC)
    WHERE deleted_at IS NULL
  `);

  // Optimize due date queries for accounts receivable
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_invoices_due_date_status
    ON invoices(due_date, status)
    WHERE deleted_at IS NULL AND balance_due > 0
  `);

  // Optimize organization/branch billing queries
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_invoices_org_period
    ON invoices(organization_id, period_start, period_end)
    WHERE deleted_at IS NULL
  `);

  // ============================================================================
  // AUDIT EVENTS - Enhance Event Type and User Activity Queries
  // ============================================================================
  // Note: audit_events table does NOT have deleted_at column

  // Optimize event type queries with resource filtering
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_audit_events_type_resource
    ON audit_events(event_type, resource, timestamp DESC)
  `);

  // Optimize user activity timeline queries (composite for better performance)
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_audit_events_user_timestamp
    ON audit_events(user_id, timestamp DESC)
  `);

  // Optimize organization audit queries
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_audit_events_org_timestamp
    ON audit_events(organization_id, timestamp DESC)
  `);

  // ============================================================================
  // AUDIT REVISIONS - Enhance Entity Change Tracking
  // ============================================================================
  // Note: audit_revisions table does NOT have deleted_at column

  // Optimize entity revision history with timestamp
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_audit_revisions_entity_timestamp
    ON audit_revisions(entity_type, entity_id, timestamp DESC)
  `);

  // ============================================================================
  // EVV RECORDS - Additional Indexes for Compliance Queries
  // ============================================================================
  // Note: evv_records table does NOT have deleted_at column

  // Optimize EVV record queries by timestamp for recent activity
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_evv_records_created_at
    ON evv_records(created_at DESC)
  `);

  // Optimize queries for records needing review
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_evv_records_status_date
    ON evv_records(record_status, service_date DESC)
  `);
}

export async function down(knex: Knex): Promise<void> {
  // Drop all indexes in reverse order

  // EVV records
  await knex.raw('DROP INDEX IF EXISTS idx_evv_records_status_date');
  await knex.raw('DROP INDEX IF EXISTS idx_evv_records_created_at');

  // Audit revisions
  await knex.raw('DROP INDEX IF EXISTS idx_audit_revisions_entity_timestamp');

  // Audit events
  await knex.raw('DROP INDEX IF EXISTS idx_audit_events_org_timestamp');
  await knex.raw('DROP INDEX IF EXISTS idx_audit_events_user_timestamp');
  await knex.raw('DROP INDEX IF EXISTS idx_audit_events_type_resource');

  // Invoices
  await knex.raw('DROP INDEX IF EXISTS idx_invoices_org_period');
  await knex.raw('DROP INDEX IF EXISTS idx_invoices_due_date_status');
  await knex.raw('DROP INDEX IF EXISTS idx_invoices_payer_date');
  await knex.raw('DROP INDEX IF EXISTS idx_invoices_status_date');
  await knex.raw('DROP INDEX IF EXISTS idx_invoices_client_date');

  // Task instances
  await knex.raw('DROP INDEX IF EXISTS idx_task_instances_care_plan');
  await knex.raw('DROP INDEX IF EXISTS idx_task_instances_client_date');
  await knex.raw('DROP INDEX IF EXISTS idx_task_instances_scheduled_status');
  await knex.raw('DROP INDEX IF EXISTS idx_task_instances_visit_status');
  await knex.raw('DROP INDEX IF EXISTS idx_task_instances_caregiver_status');

  // Care plans
  await knex.raw('DROP INDEX IF EXISTS idx_care_plans_coordinator');
  await knex.raw('DROP INDEX IF EXISTS idx_care_plans_dates');
  await knex.raw('DROP INDEX IF EXISTS idx_care_plans_client_status');
}
