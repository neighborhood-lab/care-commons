import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Audits table
  await knex.schema.createTable('audits', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

    // Basic information
    table.string('audit_number', 50).unique().notNullable();
    table.string('title', 255).notNullable();
    table.text('description').notNullable();
    table.string('audit_type', 50).notNullable();
    table.string('status', 50).notNullable().defaultTo('DRAFT');
    table.string('priority', 20).notNullable().defaultTo('MEDIUM');

    // Scope
    table.string('scope', 50).notNullable();
    table.uuid('scope_entity_id');
    table.string('scope_entity_name', 255);

    // Scheduling
    table.timestamp('scheduled_start_date').notNullable();
    table.timestamp('scheduled_end_date').notNullable();
    table.timestamp('actual_start_date');
    table.timestamp('actual_end_date');

    // Audit team
    table.uuid('lead_auditor_id').notNullable();
    table.string('lead_auditor_name', 255).notNullable();
    table.specificType('auditor_ids', 'UUID[]').defaultTo('{}');

    // Standards & criteria
    table.text('standards_reference');
    table.specificType('audit_criteria', 'TEXT[]');
    table.uuid('template_id');

    // Results summary
    table.integer('total_findings').notNullable().defaultTo(0);
    table.integer('critical_findings').notNullable().defaultTo(0);
    table.integer('major_findings').notNullable().defaultTo(0);
    table.integer('minor_findings').notNullable().defaultTo(0);
    table.decimal('compliance_score', 5, 2); // 0-100
    table.string('overall_rating', 50);

    // Documentation
    table.text('executive_summary');
    table.text('recommendations');
    table.specificType('attachment_urls', 'TEXT[]');

    // Approval & sign-off
    table.uuid('reviewed_by');
    table.timestamp('reviewed_at');
    table.uuid('approved_by');
    table.timestamp('approved_at');

    // Follow-up
    table.boolean('requires_follow_up').notNullable().defaultTo(false);
    table.timestamp('follow_up_date');
    table.uuid('follow_up_audit_id');

    // Context
    table.uuid('organization_id').notNullable();
    table.uuid('branch_id');

    // Audit fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').notNullable();
    table.integer('version').notNullable().defaultTo(1);
    table.timestamp('deleted_at');
    table.uuid('deleted_by');

    // Constraints
    table.check(`audit_type IN ('COMPLIANCE', 'QUALITY', 'SAFETY', 'DOCUMENTATION', 'FINANCIAL', 'MEDICATION', 'INFECTION_CONTROL', 'TRAINING', 'INTERNAL', 'EXTERNAL')`);
    table.check(`status IN ('DRAFT', 'SCHEDULED', 'IN_PROGRESS', 'FINDINGS_REVIEW', 'CORRECTIVE_ACTIONS', 'COMPLETED', 'APPROVED', 'ARCHIVED')`);
    table.check(`priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')`);
    table.check(`scope IN ('ORGANIZATION', 'BRANCH', 'DEPARTMENT', 'CAREGIVER', 'CLIENT', 'PROCESS')`);
    table.check(`overall_rating IS NULL OR overall_rating IN ('EXCELLENT', 'GOOD', 'SATISFACTORY', 'NEEDS_IMPROVEMENT', 'UNSATISFACTORY')`);
    table.check(`scheduled_end_date >= scheduled_start_date`);
    table.check(`compliance_score IS NULL OR (compliance_score >= 0 AND compliance_score <= 100)`);

    // Foreign keys
    table.foreign('organization_id').references('id').inTable('organizations');
    table.foreign('branch_id').references('id').inTable('branches');
    table.foreign('lead_auditor_id').references('id').inTable('users');
    table.foreign('template_id').references('id').inTable('audit_templates');
    table.foreign('reviewed_by').references('id').inTable('users');
    table.foreign('approved_by').references('id').inTable('users');
    table.foreign('follow_up_audit_id').references('id').inTable('audits');
    table.foreign('created_by').references('id').inTable('users');
    table.foreign('updated_by').references('id').inTable('users');
    table.foreign('deleted_by').references('id').inTable('users');
  });

  // Indexes for audits
  await knex.raw('CREATE INDEX idx_audits_organization ON audits(organization_id) WHERE deleted_at IS NULL');
  await knex.raw('CREATE INDEX idx_audits_branch ON audits(branch_id) WHERE deleted_at IS NULL');
  await knex.raw('CREATE INDEX idx_audits_status ON audits(status) WHERE deleted_at IS NULL');
  await knex.raw('CREATE INDEX idx_audits_audit_type ON audits(audit_type) WHERE deleted_at IS NULL');
  await knex.raw('CREATE INDEX idx_audits_priority ON audits(priority) WHERE deleted_at IS NULL');
  await knex.raw('CREATE INDEX idx_audits_lead_auditor ON audits(lead_auditor_id) WHERE deleted_at IS NULL');
  await knex.raw('CREATE INDEX idx_audits_scheduled_start ON audits(scheduled_start_date DESC) WHERE deleted_at IS NULL');
  await knex.raw('CREATE INDEX idx_audits_scheduled_end ON audits(scheduled_end_date DESC) WHERE deleted_at IS NULL');
  await knex.raw('CREATE INDEX idx_audits_template ON audits(template_id) WHERE deleted_at IS NULL AND template_id IS NOT NULL');
  await knex.raw('CREATE INDEX idx_audits_follow_up ON audits(follow_up_date) WHERE deleted_at IS NULL AND requires_follow_up = true');

  // Audit Findings table
  await knex.schema.createTable('audit_findings', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

    table.uuid('audit_id').notNullable();

    // Finding details
    table.string('finding_number', 50).notNullable();
    table.string('title', 255).notNullable();
    table.text('description').notNullable();
    table.string('category', 50).notNullable();
    table.string('severity', 20).notNullable();
    table.string('status', 50).notNullable().defaultTo('OPEN');

    // Compliance reference
    table.text('standard_reference');
    table.text('regulatory_requirement');

    // Evidence
    table.text('evidence_description');
    table.specificType('evidence_urls', 'TEXT[]');
    table.uuid('observed_by').notNullable();
    table.string('observed_by_name', 255).notNullable();
    table.timestamp('observed_at').notNullable();

    // Location/context
    table.text('location_description');
    table.string('affected_entity', 50);
    table.uuid('affected_entity_id');
    table.string('affected_entity_name', 255);

    // Impact
    table.text('potential_impact');
    table.text('actual_impact');

    // Resolution
    table.text('required_corrective_action').notNullable();
    table.string('recommended_timeframe', 100);
    table.timestamp('target_resolution_date');
    table.timestamp('actual_resolution_date');
    table.text('resolution_description');
    table.uuid('verified_by');
    table.timestamp('verified_at');

    // Follow-up
    table.boolean('requires_follow_up').notNullable().defaultTo(false);
    table.text('follow_up_notes');

    table.uuid('organization_id').notNullable();
    table.uuid('branch_id');

    // Audit fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').notNullable();
    table.integer('version').notNullable().defaultTo(1);
    table.timestamp('deleted_at');
    table.uuid('deleted_by');

    // Constraints
    table.check(`category IN ('DOCUMENTATION', 'TRAINING', 'POLICY_PROCEDURE', 'SAFETY', 'QUALITY_OF_CARE', 'INFECTION_CONTROL', 'MEDICATION', 'EQUIPMENT', 'STAFFING', 'COMMUNICATION', 'FINANCIAL', 'REGULATORY', 'OTHER')`);
    table.check(`severity IN ('CRITICAL', 'MAJOR', 'MINOR', 'OBSERVATION')`);
    table.check(`status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'VERIFIED', 'CLOSED', 'DEFERRED')`);
    table.check(`affected_entity IS NULL OR affected_entity IN ('CAREGIVER', 'CLIENT', 'PROCESS', 'DOCUMENTATION', 'EQUIPMENT')`);

    // Foreign keys
    table.foreign('audit_id').references('id').inTable('audits').onDelete('CASCADE');
    table.foreign('organization_id').references('id').inTable('organizations');
    table.foreign('branch_id').references('id').inTable('branches');
    table.foreign('observed_by').references('id').inTable('users');
    table.foreign('verified_by').references('id').inTable('users');
    table.foreign('created_by').references('id').inTable('users');
    table.foreign('updated_by').references('id').inTable('users');
    table.foreign('deleted_by').references('id').inTable('users');

    // Unique constraint for finding_number within audit
    table.unique(['audit_id', 'finding_number']);
  });

  // Indexes for audit_findings
  await knex.raw('CREATE INDEX idx_audit_findings_audit ON audit_findings(audit_id) WHERE deleted_at IS NULL');
  await knex.raw('CREATE INDEX idx_audit_findings_organization ON audit_findings(organization_id) WHERE deleted_at IS NULL');
  await knex.raw('CREATE INDEX idx_audit_findings_branch ON audit_findings(branch_id) WHERE deleted_at IS NULL');
  await knex.raw('CREATE INDEX idx_audit_findings_status ON audit_findings(status) WHERE deleted_at IS NULL');
  await knex.raw('CREATE INDEX idx_audit_findings_severity ON audit_findings(severity) WHERE deleted_at IS NULL');
  await knex.raw('CREATE INDEX idx_audit_findings_category ON audit_findings(category) WHERE deleted_at IS NULL');
  await knex.raw('CREATE INDEX idx_audit_findings_observed ON audit_findings(observed_by, observed_at DESC) WHERE deleted_at IS NULL');
  await knex.raw('CREATE INDEX idx_audit_findings_verified ON audit_findings(verified_by, verified_at DESC) WHERE deleted_at IS NULL AND verified_at IS NOT NULL');
  await knex.raw('CREATE INDEX idx_audit_findings_critical ON audit_findings(audit_id, severity) WHERE deleted_at IS NULL AND severity = \'CRITICAL\'');
  await knex.raw('CREATE INDEX idx_audit_findings_open ON audit_findings(status, target_resolution_date) WHERE deleted_at IS NULL AND status IN (\'OPEN\', \'IN_PROGRESS\')');

  // Corrective Actions table
  await knex.schema.createTable('corrective_actions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

    table.uuid('finding_id').notNullable();
    table.uuid('audit_id').notNullable();

    // Action details
    table.string('action_number', 50).notNullable();
    table.string('title', 255).notNullable();
    table.text('description').notNullable();
    table.string('action_type', 50).notNullable();
    table.string('status', 50).notNullable().defaultTo('PLANNED');

    // Root cause analysis
    table.text('root_cause');
    table.specificType('contributing_factors', 'TEXT[]');

    // Implementation plan
    table.specificType('specific_actions', 'TEXT[]').notNullable();
    table.uuid('responsible_person_id').notNullable();
    table.string('responsible_person_name', 255).notNullable();
    table.timestamp('target_completion_date').notNullable();
    table.timestamp('actual_completion_date');

    // Resources required
    table.text('resources_required');
    table.decimal('estimated_cost', 10, 2);
    table.decimal('actual_cost', 10, 2);

    // Monitoring
    table.text('monitoring_plan');
    table.specificType('success_criteria', 'TEXT[]');
    table.text('verification_method');

    // Progress tracking
    table.jsonb('progress_updates').defaultTo('[]');
    table.integer('completion_percentage').notNullable().defaultTo(0);

    // Verification
    table.uuid('verified_by');
    table.timestamp('verified_at');
    table.text('verification_notes');
    table.string('effectiveness_rating', 50);

    // Documentation
    table.specificType('attachment_urls', 'TEXT[]');

    table.uuid('organization_id').notNullable();
    table.uuid('branch_id');

    // Audit fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').notNullable();
    table.integer('version').notNullable().defaultTo(1);
    table.timestamp('deleted_at');
    table.uuid('deleted_by');

    // Constraints
    table.check(`action_type IN ('IMMEDIATE', 'SHORT_TERM', 'LONG_TERM', 'PREVENTIVE')`);
    table.check(`status IN ('PLANNED', 'IN_PROGRESS', 'IMPLEMENTED', 'VERIFIED', 'CLOSED', 'INEFFECTIVE', 'CANCELLED')`);
    table.check(`effectiveness_rating IS NULL OR effectiveness_rating IN ('EFFECTIVE', 'PARTIALLY_EFFECTIVE', 'INEFFECTIVE')`);
    table.check(`completion_percentage >= 0 AND completion_percentage <= 100`);

    // Foreign keys
    table.foreign('finding_id').references('id').inTable('audit_findings').onDelete('CASCADE');
    table.foreign('audit_id').references('id').inTable('audits').onDelete('CASCADE');
    table.foreign('organization_id').references('id').inTable('organizations');
    table.foreign('branch_id').references('id').inTable('branches');
    table.foreign('responsible_person_id').references('id').inTable('users');
    table.foreign('verified_by').references('id').inTable('users');
    table.foreign('created_by').references('id').inTable('users');
    table.foreign('updated_by').references('id').inTable('users');
    table.foreign('deleted_by').references('id').inTable('users');

    // Unique constraint for action_number within finding
    table.unique(['finding_id', 'action_number']);
  });

  // Indexes for corrective_actions
  await knex.raw('CREATE INDEX idx_corrective_actions_finding ON corrective_actions(finding_id) WHERE deleted_at IS NULL');
  await knex.raw('CREATE INDEX idx_corrective_actions_audit ON corrective_actions(audit_id) WHERE deleted_at IS NULL');
  await knex.raw('CREATE INDEX idx_corrective_actions_organization ON corrective_actions(organization_id) WHERE deleted_at IS NULL');
  await knex.raw('CREATE INDEX idx_corrective_actions_branch ON corrective_actions(branch_id) WHERE deleted_at IS NULL');
  await knex.raw('CREATE INDEX idx_corrective_actions_status ON corrective_actions(status) WHERE deleted_at IS NULL');
  await knex.raw('CREATE INDEX idx_corrective_actions_responsible ON corrective_actions(responsible_person_id) WHERE deleted_at IS NULL');
  await knex.raw('CREATE INDEX idx_corrective_actions_target_date ON corrective_actions(target_completion_date) WHERE deleted_at IS NULL');
  await knex.raw('CREATE INDEX idx_corrective_actions_overdue ON corrective_actions(target_completion_date, status) WHERE deleted_at IS NULL AND status IN (\'PLANNED\', \'IN_PROGRESS\') AND target_completion_date < NOW()');
  await knex.raw('CREATE INDEX idx_corrective_actions_verified ON corrective_actions(verified_by, verified_at DESC) WHERE deleted_at IS NULL AND verified_at IS NOT NULL');

  // GIN index for progress_updates JSONB
  await knex.raw('CREATE INDEX idx_corrective_actions_progress_gin ON corrective_actions USING gin(progress_updates)');

  // Audit Templates table
  await knex.schema.createTable('audit_templates', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

    // Template details
    table.string('template_name', 255).notNullable();
    table.text('description').notNullable();
    table.string('audit_type', 50).notNullable();
    table.specificType('applicable_scope', 'TEXT[]').notNullable();

    // Standards & criteria
    table.text('standards_reference');
    table.string('template_version', 50).notNullable();
    table.timestamp('effective_date').notNullable();
    table.timestamp('expiry_date');

    // Checklist items (stored as JSONB)
    table.jsonb('checklist_sections').notNullable().defaultTo('[]');

    // Metadata
    table.boolean('is_active').notNullable().defaultTo(true);
    table.integer('usage_count').notNullable().defaultTo(0);
    table.timestamp('last_used_at');

    table.uuid('organization_id').notNullable();

    // Audit fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').notNullable();
    table.integer('version').notNullable().defaultTo(1);
    table.timestamp('deleted_at');
    table.uuid('deleted_by');

    // Constraints
    table.check(`audit_type IN ('COMPLIANCE', 'QUALITY', 'SAFETY', 'DOCUMENTATION', 'FINANCIAL', 'MEDICATION', 'INFECTION_CONTROL', 'TRAINING', 'INTERNAL', 'EXTERNAL')`);

    // Foreign keys
    table.foreign('organization_id').references('id').inTable('organizations');
    table.foreign('created_by').references('id').inTable('users');
    table.foreign('updated_by').references('id').inTable('users');
    table.foreign('deleted_by').references('id').inTable('users');
  });

  // Indexes for audit_templates
  await knex.raw('CREATE INDEX idx_audit_templates_organization ON audit_templates(organization_id) WHERE deleted_at IS NULL');
  await knex.raw('CREATE INDEX idx_audit_templates_audit_type ON audit_templates(audit_type) WHERE deleted_at IS NULL');
  await knex.raw('CREATE INDEX idx_audit_templates_active ON audit_templates(is_active) WHERE deleted_at IS NULL AND is_active = true');
  await knex.raw('CREATE INDEX idx_audit_templates_effective ON audit_templates(effective_date DESC) WHERE deleted_at IS NULL');

  // GIN index for checklist_sections JSONB
  await knex.raw('CREATE INDEX idx_audit_templates_checklist_gin ON audit_templates USING gin(checklist_sections)');

  // Audit Checklist Responses table
  await knex.schema.createTable('audit_checklist_responses', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

    table.uuid('audit_id').notNullable();
    table.uuid('template_id').notNullable();
    table.string('section_id', 100).notNullable();
    table.string('item_id', 100).notNullable();

    // Response
    table.string('response', 100).notNullable();
    table.text('notes');
    table.specificType('evidence_urls', 'TEXT[]');

    // Metadata
    table.uuid('responded_by').notNullable();
    table.string('responded_by_name', 255).notNullable();
    table.timestamp('responded_at').notNullable();

    // Related finding
    table.uuid('finding_id');

    table.uuid('organization_id').notNullable();

    // Audit fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').notNullable();
    table.integer('version').notNullable().defaultTo(1);
    table.timestamp('deleted_at');
    table.uuid('deleted_by');

    // Foreign keys
    table.foreign('audit_id').references('id').inTable('audits').onDelete('CASCADE');
    table.foreign('template_id').references('id').inTable('audit_templates');
    table.foreign('finding_id').references('id').inTable('audit_findings');
    table.foreign('organization_id').references('id').inTable('organizations');
    table.foreign('responded_by').references('id').inTable('users');
    table.foreign('created_by').references('id').inTable('users');
    table.foreign('updated_by').references('id').inTable('users');
    table.foreign('deleted_by').references('id').inTable('users');

    // Unique constraint for one response per item per audit
    table.unique(['audit_id', 'section_id', 'item_id']);
  });

  // Indexes for audit_checklist_responses
  await knex.raw('CREATE INDEX idx_audit_checklist_responses_audit ON audit_checklist_responses(audit_id) WHERE deleted_at IS NULL');
  await knex.raw('CREATE INDEX idx_audit_checklist_responses_template ON audit_checklist_responses(template_id) WHERE deleted_at IS NULL');
  await knex.raw('CREATE INDEX idx_audit_checklist_responses_finding ON audit_checklist_responses(finding_id) WHERE deleted_at IS NULL AND finding_id IS NOT NULL');
  await knex.raw('CREATE INDEX idx_audit_checklist_responses_organization ON audit_checklist_responses(organization_id) WHERE deleted_at IS NULL');
  await knex.raw('CREATE INDEX idx_audit_checklist_responses_responded ON audit_checklist_responses(responded_by, responded_at DESC) WHERE deleted_at IS NULL');

  // Triggers for updated_at
  await knex.raw(`
    CREATE OR REPLACE FUNCTION update_audits_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      NEW.version = OLD.version + 1;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `);

  await knex.raw(`
    CREATE TRIGGER audits_updated_at
      BEFORE UPDATE ON audits
      FOR EACH ROW
      EXECUTE FUNCTION update_audits_updated_at()
  `);

  await knex.raw(`
    CREATE OR REPLACE FUNCTION update_audit_findings_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      NEW.version = OLD.version + 1;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `);

  await knex.raw(`
    CREATE TRIGGER audit_findings_updated_at
      BEFORE UPDATE ON audit_findings
      FOR EACH ROW
      EXECUTE FUNCTION update_audit_findings_updated_at()
  `);

  await knex.raw(`
    CREATE OR REPLACE FUNCTION update_corrective_actions_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      NEW.version = OLD.version + 1;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `);

  await knex.raw(`
    CREATE TRIGGER corrective_actions_updated_at
      BEFORE UPDATE ON corrective_actions
      FOR EACH ROW
      EXECUTE FUNCTION update_corrective_actions_updated_at()
  `);

  await knex.raw(`
    CREATE OR REPLACE FUNCTION update_audit_templates_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      NEW.version = OLD.version + 1;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `);

  await knex.raw(`
    CREATE TRIGGER audit_templates_updated_at
      BEFORE UPDATE ON audit_templates
      FOR EACH ROW
      EXECUTE FUNCTION update_audit_templates_updated_at()
  `);

  await knex.raw(`
    CREATE OR REPLACE FUNCTION update_audit_checklist_responses_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      NEW.version = OLD.version + 1;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `);

  await knex.raw(`
    CREATE TRIGGER audit_checklist_responses_updated_at
      BEFORE UPDATE ON audit_checklist_responses
      FOR EACH ROW
      EXECUTE FUNCTION update_audit_checklist_responses_updated_at()
  `);

  // Trigger to update findings counts on audits table
  await knex.raw(`
    CREATE OR REPLACE FUNCTION update_audit_findings_count()
    RETURNS TRIGGER AS $$
    BEGIN
      UPDATE audits
      SET
        total_findings = (
          SELECT COUNT(*)
          FROM audit_findings
          WHERE audit_id = COALESCE(NEW.audit_id, OLD.audit_id)
            AND deleted_at IS NULL
        ),
        critical_findings = (
          SELECT COUNT(*)
          FROM audit_findings
          WHERE audit_id = COALESCE(NEW.audit_id, OLD.audit_id)
            AND severity = 'CRITICAL'
            AND deleted_at IS NULL
        ),
        major_findings = (
          SELECT COUNT(*)
          FROM audit_findings
          WHERE audit_id = COALESCE(NEW.audit_id, OLD.audit_id)
            AND severity = 'MAJOR'
            AND deleted_at IS NULL
        ),
        minor_findings = (
          SELECT COUNT(*)
          FROM audit_findings
          WHERE audit_id = COALESCE(NEW.audit_id, OLD.audit_id)
            AND severity = 'MINOR'
            AND deleted_at IS NULL
        )
      WHERE id = COALESCE(NEW.audit_id, OLD.audit_id);
      RETURN COALESCE(NEW, OLD);
    END;
    $$ LANGUAGE plpgsql
  `);

  await knex.raw(`
    CREATE TRIGGER audit_findings_count_insert
      AFTER INSERT ON audit_findings
      FOR EACH ROW
      EXECUTE FUNCTION update_audit_findings_count()
  `);

  await knex.raw(`
    CREATE TRIGGER audit_findings_count_update
      AFTER UPDATE ON audit_findings
      FOR EACH ROW
      WHEN (OLD.severity IS DISTINCT FROM NEW.severity OR OLD.deleted_at IS DISTINCT FROM NEW.deleted_at)
      EXECUTE FUNCTION update_audit_findings_count()
  `);

  await knex.raw(`
    CREATE TRIGGER audit_findings_count_delete
      AFTER UPDATE ON audit_findings
      FOR EACH ROW
      WHEN (NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL)
      EXECUTE FUNCTION update_audit_findings_count()
  `);

  // Trigger to update template usage count
  await knex.raw(`
    CREATE OR REPLACE FUNCTION update_template_usage_count()
    RETURNS TRIGGER AS $$
    BEGIN
      IF NEW.template_id IS NOT NULL THEN
        UPDATE audit_templates
        SET
          usage_count = usage_count + 1,
          last_used_at = NOW()
        WHERE id = NEW.template_id;
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `);

  await knex.raw(`
    CREATE TRIGGER template_usage_count
      AFTER INSERT ON audits
      FOR EACH ROW
      WHEN (NEW.template_id IS NOT NULL)
      EXECUTE FUNCTION update_template_usage_count()
  `);

  // Comments for documentation
  await knex.raw("COMMENT ON TABLE audits IS 'Quality assurance audits for compliance, quality, and safety'");
  await knex.raw("COMMENT ON TABLE audit_findings IS 'Individual findings or deficiencies identified during audits'");
  await knex.raw("COMMENT ON TABLE corrective_actions IS 'Corrective action plans for addressing audit findings'");
  await knex.raw("COMMENT ON TABLE audit_templates IS 'Reusable audit templates with standardized checklists'");
  await knex.raw("COMMENT ON TABLE audit_checklist_responses IS 'Responses to checklist items during audits'");

  await knex.raw("COMMENT ON COLUMN audits.compliance_score IS 'Overall compliance score as percentage (0-100)'");
  await knex.raw("COMMENT ON COLUMN audit_findings.severity IS 'Severity level: CRITICAL, MAJOR, MINOR, or OBSERVATION'");
  await knex.raw("COMMENT ON COLUMN corrective_actions.progress_updates IS 'Array of progress update objects tracking implementation'");
  await knex.raw("COMMENT ON COLUMN audit_templates.checklist_sections IS 'Array of checklist sections with items and scoring weights'");
}

export async function down(knex: Knex): Promise<void> {
  // Drop triggers
  await knex.raw('DROP TRIGGER IF EXISTS template_usage_count ON audits');
  await knex.raw('DROP TRIGGER IF EXISTS audit_findings_count_delete ON audit_findings');
  await knex.raw('DROP TRIGGER IF EXISTS audit_findings_count_update ON audit_findings');
  await knex.raw('DROP TRIGGER IF EXISTS audit_findings_count_insert ON audit_findings');
  await knex.raw('DROP TRIGGER IF EXISTS audit_checklist_responses_updated_at ON audit_checklist_responses');
  await knex.raw('DROP TRIGGER IF EXISTS audit_templates_updated_at ON audit_templates');
  await knex.raw('DROP TRIGGER IF EXISTS corrective_actions_updated_at ON corrective_actions');
  await knex.raw('DROP TRIGGER IF EXISTS audit_findings_updated_at ON audit_findings');
  await knex.raw('DROP TRIGGER IF EXISTS audits_updated_at ON audits');

  // Drop functions
  await knex.raw('DROP FUNCTION IF EXISTS update_template_usage_count()');
  await knex.raw('DROP FUNCTION IF EXISTS update_audit_findings_count()');
  await knex.raw('DROP FUNCTION IF EXISTS update_audit_checklist_responses_updated_at()');
  await knex.raw('DROP FUNCTION IF EXISTS update_audit_templates_updated_at()');
  await knex.raw('DROP FUNCTION IF EXISTS update_corrective_actions_updated_at()');
  await knex.raw('DROP FUNCTION IF EXISTS update_audit_findings_updated_at()');
  await knex.raw('DROP FUNCTION IF EXISTS update_audits_updated_at()');

  // Drop tables (in reverse order due to foreign keys)
  await knex.schema.dropTableIfExists('audit_checklist_responses');
  await knex.schema.dropTableIfExists('corrective_actions');
  await knex.schema.dropTableIfExists('audit_findings');
  await knex.schema.dropTableIfExists('audits');
  await knex.schema.dropTableIfExists('audit_templates');
}
