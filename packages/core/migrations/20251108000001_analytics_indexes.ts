import type { Knex } from 'knex';

/**
 * Analytics Indexes Migration
 *
 * Adds missing indexes for analytics queries:
 * - Schedules/visits table indexes for date-range and status queries
 * - EVV records indexes for compliance reporting
 * - Invoices and payments indexes for revenue reports
 *
 * These indexes support the analytics materialized views and direct queries
 */

export async function up(knex: Knex): Promise<void> {
  // ============================================================================
  // SCHEDULES (Visits) - Analytics Query Optimization
  // ============================================================================

  // Status filter (commonly used in analytics)
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_schedules_status
      ON schedules(status)
  `);

  // Scheduled start date (for date range queries)
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_schedules_scheduled_start_date
      ON schedules(DATE(scheduled_start_time))
  `);

  // Caregiver + date composite (for caregiver performance reports)
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_schedules_caregiver_date
      ON schedules(caregiver_id, DATE(scheduled_start_time))
  `);

  // Client + date composite (for client service reports)
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_schedules_client_date
      ON schedules(client_id, DATE(scheduled_start_time))
  `);

  // Branch + date composite (for branch-level reports)
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_schedules_branch_date
      ON schedules(branch_id, DATE(scheduled_start_time))
  `);

  // Partial index for completed visits with common filters
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_schedules_analytics_completed
      ON schedules(status, caregiver_id, scheduled_start_time)
      WHERE status = 'COMPLETED'
  `);

  // ============================================================================
  // EVV RECORDS - Compliance Reporting
  // ============================================================================

  // Visit ID + compliance status (for linking to visits and filtering)
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_evv_records_visit_compliance
      ON evv_records(visit_id, compliance_status)
  `);

  // Submitted date (for submission tracking reports)
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_evv_records_submitted_date
      ON evv_records(DATE(submitted_at))
      WHERE submitted_at IS NOT NULL
  `);

  // Compliance status filter (for compliance reports)
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_evv_records_compliance_status
      ON evv_records(compliance_status)
  `);

  // Service date (for date range queries)
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_evv_records_service_date
      ON evv_records(service_date)
  `);

  // ============================================================================
  // INVOICES - Revenue Reporting
  // ============================================================================

  // Invoice date (for date range queries)
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_invoices_invoice_date
      ON invoices(DATE(invoice_date))
  `);

  // Status + date composite (for revenue cycle reports)
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_invoices_status_date
      ON invoices(status, DATE(invoice_date))
  `);

  // Payer + date (for payer analysis)
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_invoices_payer_date
      ON invoices(payer_id, DATE(invoice_date))
      WHERE payer_id IS NOT NULL
  `);

  // Client + invoice date (for client billing history)
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_invoices_client_date
      ON invoices(client_id, DATE(invoice_date))
      WHERE deleted_at IS NULL
  `);

  // ============================================================================
  // PAYMENTS - Payment Tracking
  // ============================================================================

  // Payment date (for revenue reports)
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_payments_payment_date
      ON payments(DATE(payment_date))
  `);

  // Invoice + payment date (for payment reconciliation)
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_payments_invoice_date
      ON payments(invoice_id, DATE(payment_date))
  `);

  // ============================================================================
  // INVOICE LINE ITEMS - Detailed Revenue Analysis
  // ============================================================================

  // Invoice ID + service (for detailed billing analysis)
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_invoice_line_items_invoice_service
      ON invoice_line_items(invoice_id, service_id)
      WHERE service_id IS NOT NULL
  `);

  console.log('✅ Analytics indexes created successfully');
}

export async function down(knex: Knex): Promise<void> {
  // Drop in reverse order
  await knex.raw('DROP INDEX IF EXISTS idx_invoice_line_items_invoice_service');
  await knex.raw('DROP INDEX IF EXISTS idx_payments_invoice_date');
  await knex.raw('DROP INDEX IF EXISTS idx_payments_payment_date');
  await knex.raw('DROP INDEX IF EXISTS idx_invoices_client_date');
  await knex.raw('DROP INDEX IF EXISTS idx_invoices_payer_date');
  await knex.raw('DROP INDEX IF EXISTS idx_invoices_status_date');
  await knex.raw('DROP INDEX IF EXISTS idx_invoices_invoice_date');
  await knex.raw('DROP INDEX IF EXISTS idx_evv_records_service_date');
  await knex.raw('DROP INDEX IF EXISTS idx_evv_records_compliance_status');
  await knex.raw('DROP INDEX IF EXISTS idx_evv_records_submitted_date');
  await knex.raw('DROP INDEX IF EXISTS idx_evv_records_visit_compliance');
  await knex.raw('DROP INDEX IF EXISTS idx_schedules_analytics_completed');
  await knex.raw('DROP INDEX IF EXISTS idx_schedules_branch_date');
  await knex.raw('DROP INDEX IF EXISTS idx_schedules_client_date');
  await knex.raw('DROP INDEX IF EXISTS idx_schedules_caregiver_date');
  await knex.raw('DROP INDEX IF EXISTS idx_schedules_scheduled_start_date');
  await knex.raw('DROP INDEX IF EXISTS idx_schedules_status');

  console.log('✅ Analytics indexes dropped successfully');
}
