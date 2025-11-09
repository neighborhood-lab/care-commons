import type { Knex } from 'knex';

/**
 * Performance Optimization Migration
 *
 * This migration implements comprehensive database performance optimizations:
 * 1. Additional strategic indexes for common query patterns
 * 2. Database-level query optimization settings
 * 3. Prepared statement support
 * 4. Query timeout configuration
 */

export async function up(knex: Knex): Promise<void> {
  console.log('Running performance optimization migration...');

  // ============================================================================
  // 1. STRATEGIC COVERING INDEXES FOR JOIN OPTIMIZATION
  // ============================================================================
  console.log('  - Adding covering indexes for JOIN optimization...');

  // Covering index for client + branch JOINs (includes commonly accessed columns)
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_clients_org_branch_status_covering
    ON clients (organization_id, branch_id, status)
    INCLUDE (first_name, last_name, client_number, email, phone)
    WHERE deleted_at IS NULL;
  `);

  // Covering index for caregiver assignment queries
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_caregivers_org_status_covering
    ON caregivers (organization_id, status, compliance_status)
    INCLUDE (first_name, last_name, employee_number, email, phone)
    WHERE deleted_at IS NULL;
  `);

  // ============================================================================
  // 2. ANALYTICS & REPORTING OPTIMIZATION INDEXES
  // ============================================================================
  console.log('  - Adding analytics and reporting indexes...');

  // Visit statistics by date range
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_visits_org_date_status_stats
    ON visits (organization_id, scheduled_start_time, status)
    INCLUDE (scheduled_end_time, actual_start_time, actual_end_time)
    WHERE deleted_at IS NULL;
  `);

  // Task completion analytics
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_task_instances_completion_stats
    ON task_instances (care_plan_id, status, completed_at)
    INCLUDE (template_id, completed_by)
    WHERE deleted_at IS NULL;
  `);

  // Invoice aging reports
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_invoices_aging_report
    ON invoices (organization_id, status, due_date)
    INCLUDE (invoice_number, total_amount, balance_due)
    WHERE deleted_at IS NULL;
  `);

  // Timesheet approval workflow
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_timesheets_approval_workflow
    ON timesheets (organization_id, status, pay_period_id)
    INCLUDE (caregiver_id, submitted_at, approved_at)
    WHERE deleted_at IS NULL;
  `);

  // ============================================================================
  // 3. COMPOSITE INDEXES FOR MULTI-COLUMN FILTERS
  // ============================================================================
  console.log('  - Adding composite indexes for common filter combinations...');

  // EVV records by status and submission date
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_evv_records_status_submission
    ON evv_records (organization_id, submission_status, verification_date)
    WHERE deleted_at IS NULL;
  `);

  // Care plans by coordinator and status
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_care_plans_coordinator_status
    ON care_plans (care_coordinator_id, status, effective_date)
    WHERE deleted_at IS NULL;
  `);

  // Service authorizations by client and dates
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_care_plans_client_dates
    ON care_plans (client_id, effective_date, expiration_date)
    WHERE deleted_at IS NULL;
  `);

  // ============================================================================
  // 4. PARTIAL INDEXES FOR FILTERED QUERIES
  // ============================================================================
  console.log('  - Adding partial indexes for common filtered queries...');

  // Active visits only (most queries filter for non-cancelled)
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_visits_active_only
    ON visits (organization_id, scheduled_start_time, caregiver_id)
    WHERE deleted_at IS NULL
      AND status NOT IN ('CANCELLED', 'NO_SHOW');
  `);

  // Pending approvals (timesheets, invoices, etc.)
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_timesheets_pending_approval
    ON timesheets (organization_id, pay_period_id, submitted_at)
    WHERE deleted_at IS NULL
      AND status = 'PENDING_APPROVAL';
  `);

  // Overdue invoices
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_invoices_overdue
    ON invoices (organization_id, due_date, balance_due)
    WHERE deleted_at IS NULL
      AND status NOT IN ('PAID', 'CANCELLED')
      AND due_date < CURRENT_DATE;
  `);

  // Failed EVV submissions
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_evv_records_failed
    ON evv_records (organization_id, verification_date, submission_status)
    WHERE deleted_at IS NULL
      AND submission_status = 'FAILED';
  `);

  // ============================================================================
  // 5. JSONB QUERY OPTIMIZATION
  // ============================================================================
  console.log('  - Adding JSONB-specific indexes...');

  // Task instance details search
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_task_instances_details_gin
    ON task_instances USING gin(task_details jsonb_path_ops)
    WHERE deleted_at IS NULL;
  `);

  // Visit exception details
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_visit_exceptions_details_gin
    ON visit_exceptions USING gin(exception_details jsonb_path_ops)
    WHERE deleted_at IS NULL;
  `);

  // ============================================================================
  // 6. FOREIGN KEY INDEXES (if missing)
  // ============================================================================
  console.log('  - Ensuring foreign key indexes exist...');

  // These should already exist, but we check to ensure optimal JOIN performance
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_visits_service_pattern_id
    ON visits (service_pattern_id)
    WHERE deleted_at IS NULL;
  `);

  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_task_instances_visit_id
    ON task_instances (visit_id)
    WHERE deleted_at IS NULL;
  `);

  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_progress_notes_visit_id
    ON progress_notes (visit_id)
    WHERE deleted_at IS NULL;
  `);

  // ============================================================================
  // 7. DATABASE CONFIGURATION FOR QUERY OPTIMIZATION
  // ============================================================================
  console.log('  - Configuring database query optimization settings...');

  // Enable plan caching for prepared statements
  await knex.raw(`
    ALTER DATABASE ${knex.client.database()}
    SET plan_cache_mode = 'auto';
  `);

  // Set default statement timeout (30 seconds) to prevent runaway queries
  await knex.raw(`
    ALTER DATABASE ${knex.client.database()}
    SET statement_timeout = '30s';
  `);

  // Optimize work_mem for sorting/hashing operations
  await knex.raw(`
    ALTER DATABASE ${knex.client.database()}
    SET work_mem = '16MB';
  `);

  // Enable parallel query execution for large datasets
  await knex.raw(`
    ALTER DATABASE ${knex.client.database()}
    SET max_parallel_workers_per_gather = 2;
  `);

  // Set effective_cache_size (helps query planner make better decisions)
  await knex.raw(`
    ALTER DATABASE ${knex.client.database()}
    SET effective_cache_size = '256MB';
  `);

  // Enable JIT compilation for complex queries (PostgreSQL 11+)
  await knex.raw(`
    ALTER DATABASE ${knex.client.database()}
    SET jit = on;
  `);

  console.log('✓ Performance optimization migration completed');
}

export async function down(knex: Knex): Promise<void> {
  console.log('Rolling back performance optimization migration...');

  // Drop all indexes created
  await knex.raw('DROP INDEX IF EXISTS idx_clients_org_branch_status_covering;');
  await knex.raw('DROP INDEX IF EXISTS idx_caregivers_org_status_covering;');
  await knex.raw('DROP INDEX IF EXISTS idx_visits_org_date_status_stats;');
  await knex.raw('DROP INDEX IF EXISTS idx_task_instances_completion_stats;');
  await knex.raw('DROP INDEX IF EXISTS idx_invoices_aging_report;');
  await knex.raw('DROP INDEX IF EXISTS idx_timesheets_approval_workflow;');
  await knex.raw('DROP INDEX IF EXISTS idx_evv_records_status_submission;');
  await knex.raw('DROP INDEX IF EXISTS idx_care_plans_coordinator_status;');
  await knex.raw('DROP INDEX IF EXISTS idx_care_plans_client_dates;');
  await knex.raw('DROP INDEX IF EXISTS idx_visits_active_only;');
  await knex.raw('DROP INDEX IF EXISTS idx_timesheets_pending_approval;');
  await knex.raw('DROP INDEX IF EXISTS idx_invoices_overdue;');
  await knex.raw('DROP INDEX IF EXISTS idx_evv_records_failed;');
  await knex.raw('DROP INDEX IF EXISTS idx_task_instances_details_gin;');
  await knex.raw('DROP INDEX IF EXISTS idx_visit_exceptions_details_gin;');
  await knex.raw('DROP INDEX IF EXISTS idx_visits_service_pattern_id;');
  await knex.raw('DROP INDEX IF EXISTS idx_task_instances_visit_id;');
  await knex.raw('DROP INDEX IF EXISTS idx_progress_notes_visit_id;');

  // Reset database configuration to defaults
  await knex.raw(`ALTER DATABASE ${knex.client.database()} RESET plan_cache_mode;`);
  await knex.raw(`ALTER DATABASE ${knex.client.database()} RESET statement_timeout;`);
  await knex.raw(`ALTER DATABASE ${knex.client.database()} RESET work_mem;`);
  await knex.raw(`ALTER DATABASE ${knex.client.database()} RESET max_parallel_workers_per_gather;`);
  await knex.raw(`ALTER DATABASE ${knex.client.database()} RESET effective_cache_size;`);
  await knex.raw(`ALTER DATABASE ${knex.client.database()} RESET jit;`);

  console.log('✓ Performance optimization migration rolled back');
}
