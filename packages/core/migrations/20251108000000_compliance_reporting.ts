import type { Knex } from 'knex';

/**
 * Compliance Reporting Automation
 *
 * Creates tables for automated state-specific compliance reporting:
 * - Report templates for all 7 states (TX, FL, OH, PA, GA, NC, AZ)
 * - Scheduled report generation (monthly/quarterly)
 * - Report generation and validation
 * - Multi-format export (PDF, CSV, XML)
 * - Submission tracking and audit trail
 *
 * Compliance:
 * - State-specific validation rules
 * - Complete audit trail for all operations
 * - Submission tracking with timestamps
 * - Export format versioning
 */
export async function up(knex: Knex): Promise<void> {
  // ============================================================================
  // Compliance Report Templates
  // ============================================================================

  const hasReportTemplatesTable = await knex.schema.hasTable('compliance_report_templates');
  if (!hasReportTemplatesTable) {
    await knex.schema.createTable('compliance_report_templates', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

      // Template identification
      table.string('template_name', 200).notNullable();
      table.string('template_code', 100).notNullable().unique();
      table.text('description');

      // State-specific
      table.string('state_code', 2).notNullable();
      table.string('report_type', 100).notNullable(); // EVV_VISIT_LOGS, CAREGIVER_TRAINING, CLIENT_CARE_PLANS, INCIDENT_REPORTS, QA_AUDITS
      table.string('regulatory_agency', 200).notNullable(); // e.g., "Texas Health and Human Services"
      table.string('regulation_reference', 200); // e.g., "TAC Title 26, Chapter 745"

      // Format and structure
      table.jsonb('required_fields').notNullable().defaultTo('[]');
      table.jsonb('validation_rules').notNullable().defaultTo('{}');
      table.jsonb('export_formats').notNullable().defaultTo('["PDF"]'); // PDF, CSV, XML
      table.text('template_content'); // Template for document generation
      table.jsonb('metadata_schema').defaultTo('{}'); // Additional metadata structure

      // Scheduling defaults
      table.string('default_frequency', 50).notNullable().defaultTo('MONTHLY'); // WEEKLY, MONTHLY, QUARTERLY, ANNUALLY
      table.integer('default_day_of_month'); // Day to run monthly reports
      table.integer('default_quarter_end_offset_days'); // Days after quarter end

      // Versioning
      table.integer('version').notNullable().defaultTo(1);
      table.timestamp('effective_date').notNullable().defaultTo(knex.fn.now());
      table.timestamp('expiration_date');
      table.boolean('is_active').notNullable().defaultTo(true);

      // Audit fields
      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      table.uuid('created_by').notNullable().references('id').inTable('users');
      table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
      table.uuid('updated_by').notNullable().references('id').inTable('users');

      // Constraints
      table.check(`state_code IN ('TX', 'FL', 'OH', 'PA', 'GA', 'NC', 'AZ')`);
      table.check(`report_type IN ('EVV_VISIT_LOGS', 'CAREGIVER_TRAINING', 'CLIENT_CARE_PLANS', 'INCIDENT_REPORTS', 'QA_AUDITS', 'SERVICE_AUTHORIZATION', 'BILLING_SUMMARY')`);
      table.check(`default_frequency IN ('WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUALLY', 'ON_DEMAND')`);

      // Indexes
      table.index(['state_code', 'report_type', 'is_active'], 'idx_templates_state_type_active');
      table.index('template_code', 'idx_templates_code');
    });
  }

  // ============================================================================
  // Scheduled Compliance Reports
  // ============================================================================

  const hasScheduledReportsTable = await knex.schema.hasTable('scheduled_compliance_reports');
  if (!hasScheduledReportsTable) {
    await knex.schema.createTable('scheduled_compliance_reports', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

      // Template reference
      table.uuid('template_id').notNullable().references('id').inTable('compliance_report_templates').onDelete('RESTRICT');

      // Organization scope
      table.uuid('organization_id').notNullable().references('id').inTable('organizations').onDelete('CASCADE');
      table.uuid('branch_id').references('id').inTable('branches').onDelete('CASCADE'); // null = all branches

      // Schedule configuration
      table.string('schedule_name', 200).notNullable();
      table.string('frequency', 50).notNullable(); // WEEKLY, MONTHLY, QUARTERLY, ANNUALLY
      table.integer('day_of_month'); // For monthly reports (1-31)
      table.integer('day_of_week'); // For weekly reports (0-6, 0=Sunday)
      table.integer('month_of_year'); // For annual reports (1-12)
      table.string('quarter', 2); // For quarterly reports (Q1, Q2, Q3, Q4)
      table.time('time_of_day').defaultTo('02:00:00'); // Default to 2 AM

      // Date range parameters
      table.string('date_range_type', 50).notNullable().defaultTo('PREVIOUS_PERIOD'); // PREVIOUS_PERIOD, CUSTOM, YEAR_TO_DATE
      table.integer('lookback_days'); // For custom date ranges

      // Export configuration
      table.specificType('export_formats', 'text[]').notNullable().defaultTo(knex.raw("'{PDF}'"));
      table.boolean('auto_submit').notNullable().defaultTo(false);
      table.string('delivery_method', 50).notNullable().defaultTo('EMAIL'); // EMAIL, API, MANUAL
      table.jsonb('delivery_config').defaultTo('{}'); // Email addresses, API endpoints, etc.

      // Status
      table.boolean('is_enabled').notNullable().defaultTo(true);
      table.timestamp('last_run_at');
      table.timestamp('next_run_at');
      table.uuid('last_generated_report_id').references('id').inTable('generated_compliance_reports');

      // Audit fields
      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      table.uuid('created_by').notNullable().references('id').inTable('users');
      table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
      table.uuid('updated_by').notNullable().references('id').inTable('users');
      table.boolean('deleted').notNullable().defaultTo(false);
      table.timestamp('deleted_at');
      table.uuid('deleted_by').references('id').inTable('users');

      // Constraints
      table.check(`frequency IN ('WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUALLY', 'ON_DEMAND')`);
      table.check(`date_range_type IN ('PREVIOUS_PERIOD', 'CUSTOM', 'YEAR_TO_DATE', 'MONTH_TO_DATE', 'QUARTER_TO_DATE')`);
      table.check(`delivery_method IN ('EMAIL', 'API', 'SFTP', 'MANUAL')`);

      // Indexes
      table.index(['organization_id', 'is_enabled', 'deleted'], 'idx_scheduled_reports_org_enabled');
      table.index('next_run_at', 'idx_scheduled_reports_next_run');
      table.index('template_id', 'idx_scheduled_reports_template');
    });
  }

  // ============================================================================
  // Generated Compliance Reports
  // ============================================================================

  const hasGeneratedReportsTable = await knex.schema.hasTable('generated_compliance_reports');
  if (!hasGeneratedReportsTable) {
    await knex.schema.createTable('generated_compliance_reports', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

      // Template and schedule references
      table.uuid('template_id').notNullable().references('id').inTable('compliance_report_templates').onDelete('RESTRICT');
      table.uuid('scheduled_report_id').references('id').inTable('scheduled_compliance_reports').onDelete('SET NULL');

      // Organization scope
      table.uuid('organization_id').notNullable().references('id').inTable('organizations').onDelete('CASCADE');
      table.uuid('branch_id').references('id').inTable('branches').onDelete('CASCADE');

      // Report metadata
      table.string('report_title', 300).notNullable();
      table.string('report_number', 100).unique(); // Auto-generated unique identifier
      table.string('state_code', 2).notNullable();
      table.string('report_type', 100).notNullable();

      // Reporting period
      table.date('period_start_date').notNullable();
      table.date('period_end_date').notNullable();
      table.string('reporting_period', 50); // e.g., "2024-Q3", "2024-11", "2024-W44"

      // Generation details
      table.timestamp('generated_at').notNullable().defaultTo(knex.fn.now());
      table.uuid('generated_by').notNullable().references('id').inTable('users');
      table.string('generation_method', 50).notNullable().defaultTo('SCHEDULED'); // SCHEDULED, MANUAL, API

      // Data summary
      table.integer('record_count').notNullable().defaultTo(0);
      table.jsonb('data_summary').defaultTo('{}'); // Counts, totals, etc.
      table.jsonb('filter_criteria').defaultTo('{}'); // Filters applied to data

      // Validation
      table.string('validation_status', 50).notNullable().defaultTo('PENDING'); // PENDING, PASSED, FAILED, WARNING
      table.jsonb('validation_results').defaultTo('{}');
      table.timestamp('validated_at');
      table.uuid('validated_by').references('id').inTable('users');

      // File storage
      table.string('file_storage_path', 500); // Path to stored files
      table.jsonb('generated_files').defaultTo('{}'); // Map of format -> file info
      table.integer('file_size_bytes');
      table.string('file_hash', 128); // SHA-256 hash for integrity

      // Status
      table.string('status', 50).notNullable().defaultTo('DRAFT'); // DRAFT, VALIDATED, SUBMITTED, FAILED, ARCHIVED
      table.text('status_notes');
      table.timestamp('finalized_at');
      table.uuid('finalized_by').references('id').inTable('users');

      // Audit fields
      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      table.uuid('created_by').notNullable().references('id').inTable('users');
      table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
      table.uuid('updated_by').notNullable().references('id').inTable('users');
      table.boolean('deleted').notNullable().defaultTo(false);
      table.timestamp('deleted_at');
      table.uuid('deleted_by').references('id').inTable('users');

      // Constraints
      table.check(`state_code IN ('TX', 'FL', 'OH', 'PA', 'GA', 'NC', 'AZ')`);
      table.check(`generation_method IN ('SCHEDULED', 'MANUAL', 'API')`);
      table.check(`validation_status IN ('PENDING', 'PASSED', 'FAILED', 'WARNING')`);
      table.check(`status IN ('DRAFT', 'VALIDATED', 'SUBMITTED', 'FAILED', 'ARCHIVED')`);
      table.check('period_end_date >= period_start_date');

      // Indexes
      table.index(['organization_id', 'state_code', 'report_type', 'status'], 'idx_generated_reports_org_state_type');
      table.index(['period_start_date', 'period_end_date'], 'idx_generated_reports_period');
      table.index('report_number', 'idx_generated_reports_number');
      table.index(['template_id', 'status'], 'idx_generated_reports_template_status');
      table.index('generated_at', 'idx_generated_reports_generated_at');
    });
  }

  // ============================================================================
  // Compliance Report Submissions
  // ============================================================================

  const hasSubmissionsTable = await knex.schema.hasTable('compliance_report_submissions');
  if (!hasSubmissionsTable) {
    await knex.schema.createTable('compliance_report_submissions', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

      // Report reference
      table.uuid('report_id').notNullable().references('id').inTable('generated_compliance_reports').onDelete('RESTRICT');

      // Submission details
      table.timestamp('submitted_at').notNullable().defaultTo(knex.fn.now());
      table.uuid('submitted_by').notNullable().references('id').inTable('users');
      table.string('submission_method', 50).notNullable(); // EMAIL, API, SFTP, PORTAL, MANUAL
      table.string('submission_format', 20).notNullable(); // PDF, CSV, XML

      // Destination
      table.string('regulatory_agency', 200).notNullable();
      table.string('destination_email', 255);
      table.string('destination_api_endpoint', 500);
      table.string('destination_sftp_path', 500);

      // Submission tracking
      table.string('submission_reference_number', 200); // External reference from regulatory agency
      table.string('confirmation_number', 200);
      table.jsonb('submission_metadata').defaultTo('{}'); // Additional tracking info

      // Status
      table.string('status', 50).notNullable().defaultTo('PENDING'); // PENDING, SENT, DELIVERED, ACCEPTED, REJECTED, FAILED
      table.text('status_message');
      table.timestamp('status_updated_at').defaultTo(knex.fn.now());

      // Response tracking
      table.timestamp('acknowledged_at');
      table.string('acknowledgment_reference', 200);
      table.jsonb('response_data').defaultTo('{}');

      // Retry logic
      table.integer('attempt_number').notNullable().defaultTo(1);
      table.integer('max_attempts').notNullable().defaultTo(3);
      table.timestamp('next_retry_at');

      // Audit fields
      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      table.uuid('created_by').notNullable().references('id').inTable('users');
      table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
      table.uuid('updated_by').notNullable().references('id').inTable('users');

      // Constraints
      table.check(`submission_method IN ('EMAIL', 'API', 'SFTP', 'PORTAL', 'MANUAL')`);
      table.check(`submission_format IN ('PDF', 'CSV', 'XML', 'JSON', 'XLSX')`);
      table.check(`status IN ('PENDING', 'SENT', 'DELIVERED', 'ACCEPTED', 'REJECTED', 'FAILED', 'RETRYING')`);

      // Indexes
      table.index(['report_id', 'status'], 'idx_submissions_report_status');
      table.index('submitted_at', 'idx_submissions_submitted_at');
      table.index('submission_reference_number', 'idx_submissions_reference');
      table.index(['status', 'next_retry_at'], 'idx_submissions_retry');
    });
  }

  // ============================================================================
  // Compliance Report Audit Trail
  // ============================================================================

  const hasAuditTrailTable = await knex.schema.hasTable('compliance_report_audit_trail');
  if (!hasAuditTrailTable) {
    await knex.schema.createTable('compliance_report_audit_trail', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

      // Reference to report
      table.uuid('report_id').notNullable().references('id').inTable('generated_compliance_reports').onDelete('CASCADE');
      table.uuid('submission_id').references('id').inTable('compliance_report_submissions').onDelete('CASCADE');

      // Event details
      table.timestamp('event_timestamp').notNullable().defaultTo(knex.fn.now());
      table.string('event_type', 100).notNullable(); // GENERATED, VALIDATED, EXPORTED, SUBMITTED, APPROVED, REJECTED, etc.
      table.string('event_category', 50).notNullable(); // GENERATION, VALIDATION, EXPORT, SUBMISSION, APPROVAL
      table.text('event_description').notNullable();

      // Actor
      table.uuid('user_id').references('id').inTable('users');
      table.string('actor_type', 50).notNullable().defaultTo('USER'); // USER, SYSTEM, EXTERNAL_API
      table.string('actor_name', 200);

      // Context
      table.jsonb('event_data').defaultTo('{}'); // Additional context about the event
      table.jsonb('before_state').defaultTo('{}'); // State before change
      table.jsonb('after_state').defaultTo('{}'); // State after change

      // IP and session tracking
      table.string('ip_address', 45);
      table.string('user_agent', 500);
      table.uuid('session_id');

      // Audit metadata
      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

      // Constraints
      table.check(`event_category IN ('GENERATION', 'VALIDATION', 'EXPORT', 'SUBMISSION', 'APPROVAL', 'MODIFICATION', 'ACCESS', 'DELETION')`);
      table.check(`actor_type IN ('USER', 'SYSTEM', 'EXTERNAL_API', 'SCHEDULED_JOB')`);

      // Indexes
      table.index(['report_id', 'event_timestamp'], 'idx_audit_trail_report_time');
      table.index('event_type', 'idx_audit_trail_event_type');
      table.index('user_id', 'idx_audit_trail_user');
      table.index('event_timestamp', 'idx_audit_trail_timestamp');
    });
  }

  // ============================================================================
  // Insert default templates for all 7 states
  // ============================================================================

  // Get the system user ID (or use a placeholder)
  const systemUser = await knex('users').where({ email: 'system@care-commons.local' }).first();
  const systemUserId = systemUser?.id || '00000000-0000-0000-0000-000000000000';

  const defaultTemplates = [
    // Texas
    {
      template_name: 'Texas EVV Visit Log Report',
      template_code: 'TX_EVV_MONTHLY',
      state_code: 'TX',
      report_type: 'EVV_VISIT_LOGS',
      regulatory_agency: 'Texas Health and Human Services Commission (HHSC)',
      regulation_reference: 'Texas Administrative Code Title 26, Part 1, Chapter 354',
      description: 'Monthly EVV visit log report for Texas HHSC compliance',
      required_fields: JSON.stringify(['client_id', 'caregiver_id', 'service_date', 'check_in_time', 'check_out_time', 'service_code', 'location_verified']),
      validation_rules: JSON.stringify({
        check_in_required: true,
        check_out_required: true,
        location_verification_required: true,
        signature_required: false
      }),
      export_formats: JSON.stringify(['CSV', 'PDF']),
      default_frequency: 'MONTHLY',
      default_day_of_month: 5
    },
    {
      template_name: 'Texas Caregiver Training Records',
      template_code: 'TX_TRAINING_QUARTERLY',
      state_code: 'TX',
      report_type: 'CAREGIVER_TRAINING',
      regulatory_agency: 'Texas Health and Human Services Commission (HHSC)',
      regulation_reference: 'Texas Administrative Code Title 26, Part 1, Chapter 745',
      description: 'Quarterly caregiver training compliance report for Texas',
      required_fields: JSON.stringify(['caregiver_id', 'training_type', 'training_date', 'hours_completed', 'certification_number', 'expiration_date']),
      validation_rules: JSON.stringify({
        minimum_annual_hours: 12,
        initial_training_required: true,
        cpr_certification_required: true
      }),
      export_formats: JSON.stringify(['PDF', 'CSV']),
      default_frequency: 'QUARTERLY',
      default_quarter_end_offset_days: 15
    },

    // Florida
    {
      template_name: 'Florida EVV Service Delivery Report',
      template_code: 'FL_EVV_MONTHLY',
      state_code: 'FL',
      report_type: 'EVV_VISIT_LOGS',
      regulatory_agency: 'Florida Agency for Health Care Administration (AHCA)',
      regulation_reference: 'Florida Statutes Chapter 409.906',
      description: 'Monthly EVV service delivery report for Florida Medicaid',
      required_fields: JSON.stringify(['client_medicaid_id', 'provider_id', 'service_date', 'service_start_time', 'service_end_time', 'service_type', 'authorization_number']),
      validation_rules: JSON.stringify({
        medicaid_id_required: true,
        authorization_match_required: true,
        telephony_verification_allowed: true
      }),
      export_formats: JSON.stringify(['XML', 'CSV']),
      default_frequency: 'MONTHLY',
      default_day_of_month: 10
    },

    // Ohio
    {
      template_name: 'Ohio EVV Compliance Report',
      template_code: 'OH_EVV_MONTHLY',
      state_code: 'OH',
      report_type: 'EVV_VISIT_LOGS',
      regulatory_agency: 'Ohio Department of Medicaid',
      regulation_reference: 'Ohio Administrative Code 5160-1-17.2',
      description: 'Monthly EVV compliance report for Ohio Department of Medicaid',
      required_fields: JSON.stringify(['individual_id', 'provider_id', 'service_date', 'time_in', 'time_out', 'service_code', 'location_data']),
      validation_rules: JSON.stringify({
        gps_verification_required: true,
        six_elements_required: true // Type, individual, provider, date, time in, time out
      }),
      export_formats: JSON.stringify(['CSV', 'PDF']),
      default_frequency: 'MONTHLY',
      default_day_of_month: 7
    },

    // Pennsylvania
    {
      template_name: 'Pennsylvania EVV Transaction Report',
      template_code: 'PA_EVV_MONTHLY',
      state_code: 'PA',
      report_type: 'EVV_VISIT_LOGS',
      regulatory_agency: 'Pennsylvania Department of Human Services',
      regulation_reference: 'Pennsylvania Code Title 55, Chapter 52',
      description: 'Monthly EVV transaction report for PA DHS',
      required_fields: JSON.stringify(['participant_id', 'provider_number', 'date_of_service', 'start_time', 'end_time', 'procedure_code', 'location_verified']),
      validation_rules: JSON.stringify({
        evv_system_approved: true,
        real_time_capture_required: true
      }),
      export_formats: JSON.stringify(['CSV', 'XML']),
      default_frequency: 'MONTHLY',
      default_day_of_month: 5
    },

    // Georgia
    {
      template_name: 'Georgia EVV Visit Documentation',
      template_code: 'GA_EVV_MONTHLY',
      state_code: 'GA',
      report_type: 'EVV_VISIT_LOGS',
      regulatory_agency: 'Georgia Department of Community Health',
      regulation_reference: 'Georgia Medicaid EVV Requirements',
      description: 'Monthly EVV visit documentation for Georgia Medicaid',
      required_fields: JSON.stringify(['member_id', 'provider_id', 'service_date', 'clock_in', 'clock_out', 'service_delivered', 'location_coordinates']),
      validation_rules: JSON.stringify({
        location_verification_required: true,
        member_signature_required: false,
        tasks_documented: true
      }),
      export_formats: JSON.stringify(['CSV', 'PDF']),
      default_frequency: 'MONTHLY',
      default_day_of_month: 8
    },

    // North Carolina
    {
      template_name: 'North Carolina EVV Claims Report',
      template_code: 'NC_EVV_MONTHLY',
      state_code: 'NC',
      report_type: 'EVV_VISIT_LOGS',
      regulatory_agency: 'North Carolina Department of Health and Human Services',
      regulation_reference: 'NC DMA EVV Requirements',
      description: 'Monthly EVV claims report for North Carolina DHHS',
      required_fields: JSON.stringify(['recipient_id', 'provider_npi', 'dos', 'time_start', 'time_end', 'billing_code', 'verification_method']),
      validation_rules: JSON.stringify({
        npi_required: true,
        electronic_verification_required: true
      }),
      export_formats: JSON.stringify(['CSV', 'XML']),
      default_frequency: 'MONTHLY',
      default_day_of_month: 10
    },

    // Arizona
    {
      template_name: 'Arizona EVV Service Report',
      template_code: 'AZ_EVV_MONTHLY',
      state_code: 'AZ',
      report_type: 'EVV_VISIT_LOGS',
      regulatory_agency: 'Arizona Health Care Cost Containment System (AHCCCS)',
      regulation_reference: 'AHCCCS Medical Policy Manual Chapter 1100',
      description: 'Monthly EVV service report for Arizona AHCCCS',
      required_fields: JSON.stringify(['member_id', 'provider_id', 'service_date', 'start_time', 'end_time', 'service_type', 'location_verified']),
      validation_rules: JSON.stringify({
        real_time_verification: true,
        six_required_elements: true
      }),
      export_formats: JSON.stringify(['CSV', 'PDF']),
      default_frequency: 'MONTHLY',
      default_day_of_month: 5
    }
  ];

  // Insert templates
  for (const template of defaultTemplates) {
    const exists = await knex('compliance_report_templates')
      .where('template_code', template.template_code)
      .first();

    if (!exists) {
      await knex('compliance_report_templates').insert({
        ...template,
        created_by: systemUserId,
        updated_by: systemUserId
      });
    }
  }
}

export async function down(knex: Knex): Promise<void> {
  // Drop tables in reverse order of dependencies
  await knex.schema.dropTableIfExists('compliance_report_audit_trail');
  await knex.schema.dropTableIfExists('compliance_report_submissions');
  await knex.schema.dropTableIfExists('generated_compliance_reports');
  await knex.schema.dropTableIfExists('scheduled_compliance_reports');
  await knex.schema.dropTableIfExists('compliance_report_templates');
}
