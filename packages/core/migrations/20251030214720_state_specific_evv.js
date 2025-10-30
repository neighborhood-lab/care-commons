"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    await knex.schema.createTable('evv_state_config', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.uuid('organization_id').notNullable();
        table.uuid('branch_id').nullable();
        table.string('state_code', 2).notNullable();
        table.string('aggregator_type', 50).notNullable();
        table.string('aggregator_entity_id', 100).notNullable();
        table.text('aggregator_endpoint').notNullable();
        table.text('aggregator_api_key_encrypted');
        table.string('program_type', 50).notNullable();
        table.jsonb('allowed_clock_methods').notNullable();
        table.boolean('requires_gps_for_mobile').defaultTo(true);
        table.integer('geo_perimeter_tolerance').defaultTo(100);
        table.integer('clock_in_grace_period').defaultTo(10);
        table.integer('clock_out_grace_period').defaultTo(10);
        table.integer('late_clock_in_threshold').defaultTo(15);
        table.boolean('vmur_enabled').defaultTo(false);
        table.boolean('vmur_approval_required').defaultTo(true);
        table.boolean('vmur_reason_codes_required').defaultTo(true);
        table.jsonb('additional_aggregators');
        table.jsonb('mco_requirements');
        table.boolean('is_active').defaultTo(true);
        table.date('effective_from').notNullable();
        table.date('effective_to');
        table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
        table.uuid('created_by').notNullable();
        table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
        table.uuid('updated_by').notNullable();
        table.integer('version').notNullable().defaultTo(1);
    });
    await knex.raw(`
    ALTER TABLE evv_state_config
    ADD CONSTRAINT chk_state_code CHECK (state_code IN ('TX', 'FL'))
  `);
    await knex.raw(`
    ALTER TABLE evv_state_config
    ADD CONSTRAINT chk_geo_perimeter_tolerance CHECK (geo_perimeter_tolerance BETWEEN 0 AND 500)
  `);
    await knex.raw(`
    ALTER TABLE evv_state_config
    ADD CONSTRAINT chk_clock_in_grace_period CHECK (clock_in_grace_period BETWEEN 0 AND 60)
  `);
    await knex.raw(`
    ALTER TABLE evv_state_config
    ADD CONSTRAINT chk_clock_out_grace_period CHECK (clock_out_grace_period BETWEEN 0 AND 60)
  `);
    await knex.raw(`
    ALTER TABLE evv_state_config
    ADD CONSTRAINT chk_late_clock_in_threshold CHECK (late_clock_in_threshold BETWEEN 0 AND 120)
  `);
    await knex.raw(`
    ALTER TABLE evv_state_config
    ADD CONSTRAINT chk_effective_dates CHECK (effective_to IS NULL OR effective_from <= effective_to)
  `);
    await knex.raw(`
    ALTER TABLE evv_state_config
    ADD CONSTRAINT fk_evv_config_organization FOREIGN KEY (organization_id) 
        REFERENCES organizations(id) ON DELETE RESTRICT
  `);
    await knex.raw(`
    ALTER TABLE evv_state_config
    ADD CONSTRAINT fk_evv_config_branch FOREIGN KEY (branch_id) 
        REFERENCES branches(id) ON DELETE RESTRICT
  `);
    await knex.schema.alterTable('evv_state_config', (table) => {
        table.index(['organization_id', 'state_code'], 'idx_evv_state_config_org');
        table.index(['branch_id'], 'idx_evv_state_config_branch');
        table.index(['organization_id'], 'idx_evv_state_config_active');
    });
    await knex.schema.createTable('evv_revisions', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.uuid('evv_record_id').notNullable();
        table.uuid('visit_id').notNullable();
        table.uuid('organization_id').notNullable();
        table.integer('revision_number').notNullable();
        table.string('revision_type', 50).notNullable();
        table.text('revision_reason').notNullable();
        table.string('revision_reason_code', 50);
        table.uuid('revised_by').notNullable();
        table.string('revised_by_name', 200).notNullable();
        table.string('revised_by_role', 50).notNullable();
        table.timestamp('revised_at').notNullable().defaultTo(knex.fn.now());
        table.string('field_path', 200).notNullable();
        table.jsonb('original_value').notNullable();
        table.jsonb('new_value').notNullable();
        table.text('justification').notNullable();
        table.jsonb('supporting_documents');
        table.boolean('requires_approval').defaultTo(false);
        table.string('approval_status', 20);
        table.uuid('approved_by');
        table.string('approved_by_name', 200);
        table.timestamp('approved_at');
        table.text('denial_reason');
        table.boolean('aggregator_notified').defaultTo(false);
        table.timestamp('aggregator_notified_at');
        table.string('aggregator_confirmation', 200);
        table.boolean('resubmission_required').defaultTo(false);
        table.timestamp('resubmitted_at');
        table.string('revision_hash', 64).notNullable();
        table.string('previous_revision_hash', 64);
        table.text('compliance_notes');
        table.boolean('compliance_reviewed').defaultTo(false);
        table.uuid('compliance_reviewed_by');
        table.timestamp('compliance_reviewed_at');
        table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    });
    await knex.raw(`
    ALTER TABLE evv_revisions
    ADD CONSTRAINT chk_revision_number CHECK (revision_number > 0)
  `);
    await knex.raw(`
    ALTER TABLE evv_revisions
    ADD CONSTRAINT chk_approval_status CHECK (approval_status IN ('PENDING', 'APPROVED', 'DENIED'))
  `);
    await knex.raw(`
    ALTER TABLE evv_revisions
    ADD CONSTRAINT fk_revision_evv_record FOREIGN KEY (evv_record_id) 
        REFERENCES evv_records(id) ON DELETE CASCADE
  `);
    await knex.raw(`
    ALTER TABLE evv_revisions
    ADD CONSTRAINT fk_revision_visit FOREIGN KEY (visit_id) 
        REFERENCES visits(id) ON DELETE CASCADE
  `);
    await knex.raw(`
    ALTER TABLE evv_revisions
    ADD CONSTRAINT fk_revision_organization FOREIGN KEY (organization_id) 
        REFERENCES organizations(id) ON DELETE RESTRICT
  `);
    await knex.raw(`
    ALTER TABLE evv_revisions
    ADD CONSTRAINT uq_revision_number UNIQUE (evv_record_id, revision_number)
  `);
    await knex.schema.alterTable('evv_revisions', (table) => {
        table.index(['evv_record_id', 'revision_number'], 'idx_evv_revisions_record');
        table.index(['visit_id'], 'idx_evv_revisions_visit');
        table.index(['organization_id', 'revised_at'], 'idx_evv_revisions_org');
        table.index(['revision_type', 'revised_at'], 'idx_evv_revisions_type');
        table.index(['revised_by', 'revised_at'], 'idx_evv_revisions_revised_by');
    });
    await knex.raw(`
    CREATE INDEX idx_evv_revisions_pending ON evv_revisions(organization_id, approval_status) 
    WHERE requires_approval = true AND approval_status = 'PENDING'
  `);
    await knex.schema.createTable('evv_original_data', (table) => {
        table.uuid('evv_record_id').primary();
        table.timestamp('original_clock_in_time').notNullable();
        table.timestamp('original_clock_out_time');
        table.integer('original_duration');
        table.jsonb('original_clock_in_location').notNullable();
        table.jsonb('original_clock_out_location');
        table.string('original_clock_in_device', 100).notNullable();
        table.string('original_clock_out_device', 100);
        table.string('original_verification_method', 50).notNullable();
        table.timestamp('captured_at').notNullable().defaultTo(knex.fn.now());
        table.uuid('captured_by').notNullable();
        table.string('captured_via_device', 100).notNullable();
        table.string('captured_via_app', 100).notNullable();
        table.string('original_integrity_hash', 64).notNullable();
        table.string('original_checksum', 64).notNullable();
        table.boolean('locked_for_editing').defaultTo(false);
        table.string('lock_reason', 200);
        table.timestamp('locked_at');
        table.uuid('locked_by');
    });
    await knex.raw(`
    ALTER TABLE evv_original_data
    ADD CONSTRAINT fk_original_data_evv FOREIGN KEY (evv_record_id) 
        REFERENCES evv_records(id) ON DELETE CASCADE
  `);
    await knex.schema.alterTable('evv_original_data', (table) => {
        table.index(['captured_at'], 'idx_evv_original_data_captured_at');
        table.index(['locked_for_editing'], 'idx_evv_original_data_locked');
    });
    await knex.schema.createTable('evv_access_log', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.uuid('evv_record_id').notNullable();
        table.timestamp('accessed_at').notNullable().defaultTo(knex.fn.now());
        table.uuid('accessed_by').notNullable();
        table.string('accessed_by_name', 200).notNullable();
        table.string('accessed_by_role', 50).notNullable();
        table.specificType('accessed_by_ip', 'inet');
        table.string('access_type', 50).notNullable();
        table.text('access_reason');
        table.jsonb('fields_accessed');
        table.jsonb('search_filters');
        table.string('export_format', 20);
        table.text('export_destination');
    });
    await knex.raw(`
    ALTER TABLE evv_access_log
    ADD CONSTRAINT chk_access_type CHECK (access_type IN (
        'VIEW', 'EDIT', 'EXPORT', 'PRINT', 'AUDIT_REVIEW', 
        'AGGREGATOR_SUBMISSION', 'SUPERVISOR_REVIEW', 'COMPLIANCE_CHECK'
    ))
  `);
    await knex.raw(`
    ALTER TABLE evv_access_log
    ADD CONSTRAINT chk_export_format CHECK (export_format IN ('PDF', 'CSV', 'JSON', 'HL7', 'STATE_FORMAT'))
  `);
    await knex.raw(`
    ALTER TABLE evv_access_log
    ADD CONSTRAINT fk_access_log_evv FOREIGN KEY (evv_record_id) 
        REFERENCES evv_records(id) ON DELETE CASCADE
  `);
    await knex.schema.alterTable('evv_access_log', (table) => {
        table.index(['evv_record_id', 'accessed_at'], 'idx_evv_access_log_record');
        table.index(['accessed_by', 'accessed_at'], 'idx_evv_access_log_user');
        table.index(['access_type', 'accessed_at'], 'idx_evv_access_log_type');
    });
    await knex.raw(`
    CREATE INDEX idx_evv_access_log_export ON evv_access_log(export_format, accessed_at) 
    WHERE export_format IS NOT NULL
  `);
    await knex.schema.createTable('texas_vmur', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.uuid('evv_record_id').notNullable();
        table.uuid('visit_id').notNullable();
        table.uuid('requested_by').notNullable();
        table.string('requested_by_name', 200).notNullable();
        table.timestamp('requested_at').notNullable().defaultTo(knex.fn.now());
        table.string('request_reason', 50).notNullable();
        table.text('request_reason_details').notNullable();
        table.string('approval_status', 20).notNullable().defaultTo('PENDING');
        table.uuid('approved_by');
        table.string('approved_by_name', 200);
        table.timestamp('approved_at');
        table.text('denial_reason');
        table.jsonb('original_data').notNullable();
        table.jsonb('corrected_data').notNullable();
        table.jsonb('changes_summary').notNullable();
        table.boolean('submitted_to_aggregator').defaultTo(false);
        table.string('aggregator_confirmation', 200);
        table.timestamp('submitted_at');
        table.timestamp('expires_at').notNullable();
        table.text('compliance_notes');
        table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
        table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    });
    await knex.raw(`
    ALTER TABLE texas_vmur
    ADD CONSTRAINT chk_approval_status CHECK (approval_status IN (
        'PENDING', 'APPROVED', 'DENIED', 'EXPIRED'
    ))
  `);
    await knex.raw(`
    ALTER TABLE texas_vmur
    ADD CONSTRAINT fk_vmur_evv_record FOREIGN KEY (evv_record_id) 
        REFERENCES evv_records(id) ON DELETE CASCADE
  `);
    await knex.raw(`
    ALTER TABLE texas_vmur
    ADD CONSTRAINT fk_vmur_visit FOREIGN KEY (visit_id) 
        REFERENCES visits(id) ON DELETE CASCADE
  `);
    await knex.schema.alterTable('texas_vmur', (table) => {
        table.index(['evv_record_id'], 'idx_texas_vmur_record');
        table.index(['visit_id'], 'idx_texas_vmur_visit');
        table.index(['approval_status', 'requested_at'], 'idx_texas_vmur_status');
        table.index(['requested_by', 'requested_at'], 'idx_texas_vmur_requested_by');
    });
    await knex.raw(`
    CREATE INDEX idx_texas_vmur_pending ON texas_vmur(expires_at) 
    WHERE approval_status = 'PENDING'
  `);
    await knex.schema.createTable('state_aggregator_submissions', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.string('state_code', 2).notNullable();
        table.uuid('evv_record_id').notNullable();
        table.string('aggregator_id', 100).notNullable();
        table.string('aggregator_type', 50).notNullable();
        table.jsonb('submission_payload').notNullable();
        table.string('submission_format', 20).notNullable();
        table.timestamp('submitted_at').notNullable().defaultTo(knex.fn.now());
        table.uuid('submitted_by').notNullable();
        table.string('submission_status', 20).notNullable().defaultTo('PENDING');
        table.jsonb('aggregator_response');
        table.string('aggregator_confirmation_id', 200);
        table.timestamp('aggregator_received_at');
        table.string('error_code', 50);
        table.text('error_message');
        table.jsonb('error_details');
        table.integer('retry_count').defaultTo(0);
        table.integer('max_retries').defaultTo(3);
        table.timestamp('next_retry_at');
        table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
        table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    });
    await knex.raw(`
    ALTER TABLE state_aggregator_submissions
    ADD CONSTRAINT chk_state_code CHECK (state_code IN ('TX', 'FL'))
  `);
    await knex.raw(`
    ALTER TABLE state_aggregator_submissions
    ADD CONSTRAINT chk_submission_format CHECK (submission_format IN ('JSON', 'XML', 'HL7', 'PROPRIETARY'))
  `);
    await knex.raw(`
    ALTER TABLE state_aggregator_submissions
    ADD CONSTRAINT chk_submission_status CHECK (submission_status IN (
        'PENDING', 'ACCEPTED', 'REJECTED', 'PARTIAL', 'RETRY'
    ))
  `);
    await knex.raw(`
    ALTER TABLE state_aggregator_submissions
    ADD CONSTRAINT chk_retry_count CHECK (retry_count >= 0)
  `);
    await knex.raw(`
    ALTER TABLE state_aggregator_submissions
    ADD CONSTRAINT chk_max_retries CHECK (max_retries >= 0)
  `);
    await knex.raw(`
    ALTER TABLE state_aggregator_submissions
    ADD CONSTRAINT fk_submission_evv_record FOREIGN KEY (evv_record_id) 
        REFERENCES evv_records(id) ON DELETE CASCADE
  `);
    await knex.schema.alterTable('state_aggregator_submissions', (table) => {
        table.index(['evv_record_id'], 'idx_aggregator_submissions_record');
        table.index(['state_code', 'submitted_at'], 'idx_aggregator_submissions_state');
        table.index(['submission_status', 'submitted_at'], 'idx_aggregator_submissions_status');
        table.index(['aggregator_id', 'submitted_at'], 'idx_aggregator_submissions_aggregator');
    });
    await knex.raw(`
    CREATE INDEX idx_aggregator_submissions_retry ON state_aggregator_submissions(next_retry_at) 
    WHERE submission_status = 'RETRY' AND next_retry_at IS NOT NULL
  `);
    await knex.schema.createTable('evv_exception_queue', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.uuid('evv_record_id').notNullable();
        table.uuid('visit_id').notNullable();
        table.uuid('organization_id').notNullable();
        table.uuid('branch_id').notNullable();
        table.string('exception_type', 50).notNullable();
        table.string('exception_code', 50).notNullable();
        table.string('exception_severity', 20).notNullable();
        table.text('exception_description').notNullable();
        table.jsonb('issues').notNullable();
        table.integer('issue_count').notNullable();
        table.timestamp('detected_at').notNullable().defaultTo(knex.fn.now());
        table.string('detected_by', 20).notNullable();
        table.string('detection_method', 100);
        table.uuid('assigned_to');
        table.string('assigned_to_role', 50);
        table.timestamp('assigned_at');
        table.string('status', 20).notNullable().defaultTo('OPEN');
        table.string('priority', 20).notNullable().defaultTo('MEDIUM');
        table.timestamp('due_date');
        table.timestamp('sla_deadline');
        table.string('resolution_method', 50);
        table.timestamp('resolved_at');
        table.uuid('resolved_by');
        table.text('resolution_notes');
        table.timestamp('escalated_at');
        table.uuid('escalated_to');
        table.text('escalation_reason');
        table.timestamp('viewed_at');
        table.uuid('viewed_by');
        table.boolean('notification_sent').defaultTo(false);
        table.timestamp('notification_sent_at');
        table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
        table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    });
    await knex.raw(`
    ALTER TABLE evv_exception_queue
    ADD CONSTRAINT chk_exception_severity CHECK (exception_severity IN ('INFO', 'WARNING', 'ERROR', 'CRITICAL'))
  `);
    await knex.raw(`
    ALTER TABLE evv_exception_queue
    ADD CONSTRAINT chk_issue_count CHECK (issue_count > 0)
  `);
    await knex.raw(`
    ALTER TABLE evv_exception_queue
    ADD CONSTRAINT chk_detected_by CHECK (detected_by IN ('SYSTEM', 'AGGREGATOR', 'SUPERVISOR', 'AUDIT'))
  `);
    await knex.raw(`
    ALTER TABLE evv_exception_queue
    ADD CONSTRAINT chk_status CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'ESCALATED', 'CLOSED'))
  `);
    await knex.raw(`
    ALTER TABLE evv_exception_queue
    ADD CONSTRAINT chk_priority CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT'))
  `);
    await knex.raw(`
    ALTER TABLE evv_exception_queue
    ADD CONSTRAINT chk_resolution_method CHECK (resolution_method IN ('REVISION', 'OVERRIDE', 'RESUBMISSION', 'WAIVER', 'NO_ACTION'))
  `);
    await knex.raw(`
    ALTER TABLE evv_exception_queue
    ADD CONSTRAINT fk_exception_evv_record FOREIGN KEY (evv_record_id) 
        REFERENCES evv_records(id) ON DELETE CASCADE
  `);
    await knex.raw(`
    ALTER TABLE evv_exception_queue
    ADD CONSTRAINT fk_exception_visit FOREIGN KEY (visit_id) 
        REFERENCES visits(id) ON DELETE CASCADE
  `);
    await knex.raw(`
    ALTER TABLE evv_exception_queue
    ADD CONSTRAINT fk_exception_organization FOREIGN KEY (organization_id) 
        REFERENCES organizations(id) ON DELETE RESTRICT
  `);
    await knex.raw(`
    ALTER TABLE evv_exception_queue
    ADD CONSTRAINT fk_exception_branch FOREIGN KEY (branch_id) 
        REFERENCES branches(id) ON DELETE RESTRICT
  `);
    await knex.schema.alterTable('evv_exception_queue', (table) => {
        table.index(['evv_record_id'], 'idx_exception_queue_record');
        table.index(['visit_id'], 'idx_exception_queue_visit');
        table.index(['organization_id', 'status', 'detected_at'], 'idx_exception_queue_org');
        table.index(['branch_id', 'status'], 'idx_exception_queue_branch');
        table.index(['assigned_to', 'status'], 'idx_exception_queue_assigned');
        table.index(['status', 'priority', 'detected_at'], 'idx_exception_queue_status');
    });
    await knex.raw(`
    CREATE INDEX idx_exception_queue_severity ON evv_exception_queue(exception_severity, status) 
    WHERE status != 'RESOLVED'
  `);
    await knex.raw(`
    CREATE INDEX idx_exception_queue_overdue ON evv_exception_queue(due_date, status) 
    WHERE status IN ('OPEN', 'IN_PROGRESS')
  `);
    await knex.raw(`
    CREATE INDEX idx_exception_queue_sla ON evv_exception_queue(sla_deadline, status) 
    WHERE status IN ('OPEN', 'IN_PROGRESS')
  `);
    await knex.raw(`
    CREATE INDEX idx_exception_queue_unassigned ON evv_exception_queue(organization_id, detected_at) 
    WHERE assigned_to IS NULL AND status = 'OPEN'
  `);
    await knex.raw(`
    CREATE OR REPLACE FUNCTION set_revision_number()
    RETURNS TRIGGER AS $$
    BEGIN
        SELECT COALESCE(MAX(revision_number), 0) + 1
        INTO NEW.revision_number
        FROM evv_revisions
        WHERE evv_record_id = NEW.evv_record_id;
        
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `);
    await knex.raw(`
    CREATE TRIGGER trigger_set_revision_number
        BEFORE INSERT ON evv_revisions
        FOR EACH ROW
        WHEN (NEW.revision_number IS NULL)
        EXECUTE FUNCTION set_revision_number()
  `);
    await knex.raw(`
    CREATE OR REPLACE FUNCTION update_evv_state_config_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        NEW.version = OLD.version + 1;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `);
    await knex.raw(`
    CREATE TRIGGER trigger_evv_state_config_updated_at
        BEFORE UPDATE ON evv_state_config
        FOR EACH ROW
        EXECUTE FUNCTION update_evv_state_config_updated_at()
  `);
    await knex.raw(`
    CREATE OR REPLACE FUNCTION update_texas_vmur_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `);
    await knex.raw(`
    CREATE TRIGGER trigger_texas_vmur_updated_at
        BEFORE UPDATE ON texas_vmur
        FOR EACH ROW
        EXECUTE FUNCTION update_texas_vmur_updated_at()
  `);
    await knex.raw(`
    CREATE OR REPLACE FUNCTION update_exception_queue_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `);
    await knex.raw(`
    CREATE TRIGGER trigger_exception_queue_updated_at
        BEFORE UPDATE ON evv_exception_queue
        FOR EACH ROW
        EXECUTE FUNCTION update_exception_queue_updated_at()
  `);
}
async function down(knex) {
    await knex.raw('DROP TRIGGER IF EXISTS trigger_exception_queue_updated_at ON evv_exception_queue');
    await knex.raw('DROP FUNCTION IF EXISTS update_exception_queue_updated_at()');
    await knex.raw('DROP TRIGGER IF EXISTS trigger_texas_vmur_updated_at ON texas_vmur');
    await knex.raw('DROP FUNCTION IF EXISTS update_texas_vmur_updated_at()');
    await knex.raw('DROP TRIGGER IF EXISTS trigger_evv_state_config_updated_at ON evv_state_config');
    await knex.raw('DROP FUNCTION IF EXISTS update_evv_state_config_updated_at()');
    await knex.raw('DROP TRIGGER IF EXISTS trigger_set_revision_number ON evv_revisions');
    await knex.raw('DROP FUNCTION IF EXISTS set_revision_number()');
    await knex.schema.dropTableIfExists('evv_exception_queue');
    await knex.schema.dropTableIfExists('state_aggregator_submissions');
    await knex.schema.dropTableIfExists('texas_vmur');
    await knex.schema.dropTableIfExists('evv_access_log');
    await knex.schema.dropTableIfExists('evv_original_data');
    await knex.schema.dropTableIfExists('evv_revisions');
    await knex.schema.dropTableIfExists('evv_state_config');
}
//# sourceMappingURL=20251030214720_state_specific_evv.js.map