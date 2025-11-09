import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Audits table
  await knex.schema.createTable('audits', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

    // Identification
    table.string('audit_number', 50).unique().notNullable();
    table.string('title', 255).notNullable();
    table.text('description').notNullable();

    // Audit metadata
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
    table.jsonb('auditor_ids').defaultTo('[]');

    // Standards & criteria
    table.string('standards_reference', 500);
    table.jsonb('audit_criteria');
    table.uuid('template_id');

    // Results summary
    table.integer('total_findings').defaultTo(0);
    table.integer('critical_findings').defaultTo(0);
    table.integer('major_findings').defaultTo(0);
    table.integer('minor_findings').defaultTo(0);
    table.decimal('compliance_score', 5, 2);
    table.string('overall_rating', 50);

    // Documentation
    table.text('executive_summary');
    table.text('recommendations');
    table.jsonb('attachment_urls');

    // Approval & sign-off
    table.uuid('reviewed_by');
    table.timestamp('reviewed_at');
    table.uuid('approved_by');
    table.timestamp('approved_at');

    // Follow-up
    table.boolean('requires_follow_up').defaultTo(false);
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

    // Constraints
    table.check(`audit_type IN ('COMPLIANCE', 'QUALITY', 'SAFETY', 'DOCUMENTATION', 'FINANCIAL', 'MEDICATION', 'INFECTION_CONTROL', 'TRAINING', 'INTERNAL', 'EXTERNAL')`);
    table.check(`status IN ('DRAFT', 'SCHEDULED', 'IN_PROGRESS', 'FINDINGS_REVIEW', 'CORRECTIVE_ACTIONS', 'COMPLETED', 'APPROVED', 'ARCHIVED')`);
    table.check(`priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')`);
    table.check(`scope IN ('ORGANIZATION', 'BRANCH', 'DEPARTMENT', 'CAREGIVER', 'CLIENT', 'PROCESS')`);
    table.check(`overall_rating IS NULL OR overall_rating IN ('EXCELLENT', 'GOOD', 'SATISFACTORY', 'NEEDS_IMPROVEMENT', 'UNSATISFACTORY')`);
    table.check(`scheduled_end_date >= scheduled_start_date`);
    table.check(`actual_end_date IS NULL OR actual_start_date IS NULL OR actual_end_date >= actual_start_date`);

    // Foreign keys
    table.foreign('organization_id').references('id').inTable('organizations');
    table.foreign('branch_id').references('id').inTable('branches');
    table.foreign('lead_auditor_id').references('id').inTable('users');
    table.foreign('reviewed_by').references('id').inTable('users');
    table.foreign('approved_by').references('id').inTable('users');
    table.foreign('created_by').references('id').inTable('users');
    table.foreign('updated_by').references('id').inTable('users');
  });

  // Indexes for audits
  await knex.raw('CREATE INDEX idx_audits_organization ON audits(organization_id)');
  await knex.raw('CREATE INDEX idx_audits_branch ON audits(branch_id)');
  await knex.raw('CREATE INDEX idx_audits_status ON audits(status)');
  await knex.raw('CREATE INDEX idx_audits_audit_type ON audits(audit_type)');
  await knex.raw('CREATE INDEX idx_audits_priority ON audits(priority)');
  await knex.raw('CREATE INDEX idx_audits_lead_auditor ON audits(lead_auditor_id)');
  await knex.raw('CREATE INDEX idx_audits_scheduled_start ON audits(scheduled_start_date DESC)');
  await knex.raw('CREATE INDEX idx_audits_created_at ON audits(created_at DESC)');
  await knex.raw('CREATE INDEX idx_audits_scope ON audits(scope, scope_entity_id)');

  // GIN indexes for JSONB columns
  await knex.raw('CREATE INDEX idx_audits_criteria_gin ON audits USING gin(audit_criteria)');
  await knex.raw('CREATE INDEX idx_audits_auditor_ids_gin ON audits USING gin(auditor_ids)');

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
    table.string('standard_reference', 500);
    table.text('regulatory_requirement');

    // Evidence
    table.text('evidence_description');
    table.jsonb('evidence_urls');
    table.uuid('observed_by').notNullable();
    table.string('observed_by_name', 255).notNullable();
    table.timestamp('observed_at').notNullable();

    // Location/context
    table.string('location_description', 500);
    table.string('affected_entity', 50);
    table.uuid('affected_entity_id');
    table.string('affected_entity_name', 255);

    // Impact
    table.text('potential_impact');
    table.text('actual_impact');

    // Resolution
    table.text('required_corrective_action').notNullable();
    table.string('recommended_timeframe', 255);
    table.timestamp('target_resolution_date');
    table.timestamp('actual_resolution_date');
    table.text('resolution_description');
    table.uuid('verified_by');
    table.timestamp('verified_at');

    // Follow-up
    table.boolean('requires_follow_up').defaultTo(false);
    table.text('follow_up_notes');

    table.uuid('organization_id').notNullable();
    table.uuid('branch_id');

    // Audit fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').notNullable();
    table.integer('version').notNullable().defaultTo(1);

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
  });

  // Indexes for audit_findings
  await knex.raw('CREATE INDEX idx_audit_findings_audit ON audit_findings(audit_id)');
  await knex.raw('CREATE INDEX idx_audit_findings_organization ON audit_findings(organization_id)');
  await knex.raw('CREATE INDEX idx_audit_findings_severity ON audit_findings(severity)');
  await knex.raw('CREATE INDEX idx_audit_findings_status ON audit_findings(status)');
  await knex.raw('CREATE INDEX idx_audit_findings_category ON audit_findings(category)');
  await knex.raw('CREATE INDEX idx_audit_findings_observed_at ON audit_findings(observed_at DESC)');
  await knex.raw('CREATE INDEX idx_audit_findings_critical ON audit_findings(organization_id, severity, status) WHERE severity = \'CRITICAL\' AND status IN (\'OPEN\', \'IN_PROGRESS\')');

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
    table.jsonb('contributing_factors');

    // Implementation plan
    table.jsonb('specific_actions').notNullable();
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
    table.jsonb('success_criteria');
    table.string('verification_method', 500);

    // Progress tracking
    table.jsonb('progress_updates').defaultTo('[]');
    table.integer('completion_percentage').defaultTo(0);

    // Verification
    table.uuid('verified_by');
    table.timestamp('verified_at');
    table.text('verification_notes');
    table.string('effectiveness_rating', 50);

    // Documentation
    table.jsonb('attachment_urls');

    table.uuid('organization_id').notNullable();
    table.uuid('branch_id');

    // Audit fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').notNullable();
    table.integer('version').notNullable().defaultTo(1);

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
  });

  // Indexes for corrective_actions
  await knex.raw('CREATE INDEX idx_corrective_actions_finding ON corrective_actions(finding_id)');
  await knex.raw('CREATE INDEX idx_corrective_actions_audit ON corrective_actions(audit_id)');
  await knex.raw('CREATE INDEX idx_corrective_actions_organization ON corrective_actions(organization_id)');
  await knex.raw('CREATE INDEX idx_corrective_actions_status ON corrective_actions(status)');
  await knex.raw('CREATE INDEX idx_corrective_actions_responsible ON corrective_actions(responsible_person_id)');
  await knex.raw('CREATE INDEX idx_corrective_actions_target_date ON corrective_actions(target_completion_date)');
  await knex.raw('CREATE INDEX idx_corrective_actions_overdue ON corrective_actions(organization_id, status, target_completion_date) WHERE status IN (\'PLANNED\', \'IN_PROGRESS\') AND target_completion_date < NOW()');

  // GIN indexes for JSONB columns
  await knex.raw('CREATE INDEX idx_corrective_actions_specific_actions_gin ON corrective_actions USING gin(specific_actions)');
  await knex.raw('CREATE INDEX idx_corrective_actions_progress_gin ON corrective_actions USING gin(progress_updates)');

  // Audit Templates table
  await knex.schema.createTable('audit_templates', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

    // Template details
    table.string('template_name', 255).notNullable();
    table.text('description').notNullable();
    table.string('audit_type', 50).notNullable();
    table.jsonb('applicable_scope').notNullable();

    // Standards & criteria
    table.string('standards_reference', 500);
    table.string('template_version', 50).notNullable();
    table.timestamp('effective_date').notNullable();
    table.timestamp('expiry_date');

    // Checklist items
    table.jsonb('checklist_sections').notNullable();

    // Metadata
    table.boolean('is_active').defaultTo(true);
    table.integer('usage_count').defaultTo(0);
    table.timestamp('last_used_at');

    table.uuid('organization_id').notNullable();

    // Audit fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').notNullable();
    table.integer('version').notNullable().defaultTo(1);

    // Constraints
    table.check(`audit_type IN ('COMPLIANCE', 'QUALITY', 'SAFETY', 'DOCUMENTATION', 'FINANCIAL', 'MEDICATION', 'INFECTION_CONTROL', 'TRAINING', 'INTERNAL', 'EXTERNAL')`);
    table.check(`expiry_date IS NULL OR expiry_date > effective_date`);

    // Foreign keys
    table.foreign('organization_id').references('id').inTable('organizations');
    table.foreign('created_by').references('id').inTable('users');
    table.foreign('updated_by').references('id').inTable('users');
  });

  // Indexes for audit_templates
  await knex.raw('CREATE INDEX idx_audit_templates_organization ON audit_templates(organization_id)');
  await knex.raw('CREATE INDEX idx_audit_templates_audit_type ON audit_templates(audit_type)');
  await knex.raw('CREATE INDEX idx_audit_templates_is_active ON audit_templates(is_active) WHERE is_active = true');

  // GIN indexes for JSONB columns
  await knex.raw('CREATE INDEX idx_audit_templates_checklist_gin ON audit_templates USING gin(checklist_sections)');

  // Audit Checklist Responses table
  await knex.schema.createTable('audit_checklist_responses', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

    table.uuid('audit_id').notNullable();
    table.uuid('template_id').notNullable();
    table.string('section_id', 100).notNullable();
    table.string('item_id', 100).notNullable();

    // Response
    table.string('response', 255).notNullable();
    table.text('notes');
    table.jsonb('evidence_urls');

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

    // Foreign keys
    table.foreign('audit_id').references('id').inTable('audits').onDelete('CASCADE');
    table.foreign('template_id').references('id').inTable('audit_templates');
    table.foreign('finding_id').references('id').inTable('audit_findings');
    table.foreign('organization_id').references('id').inTable('organizations');
    table.foreign('responded_by').references('id').inTable('users');
    table.foreign('created_by').references('id').inTable('users');
    table.foreign('updated_by').references('id').inTable('users');
  });

  // Indexes for audit_checklist_responses
  await knex.raw('CREATE INDEX idx_audit_checklist_responses_audit ON audit_checklist_responses(audit_id)');
  await knex.raw('CREATE INDEX idx_audit_checklist_responses_template ON audit_checklist_responses(template_id)');
  await knex.raw('CREATE INDEX idx_audit_checklist_responses_finding ON audit_checklist_responses(finding_id)');

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

  // Comments for documentation
  await knex.raw("COMMENT ON TABLE audits IS 'Quality assurance audits for compliance, quality, and safety monitoring'");
  await knex.raw("COMMENT ON TABLE audit_findings IS 'Individual findings or deficiencies identified during audits'");
  await knex.raw("COMMENT ON TABLE corrective_actions IS 'Action plans to address audit findings and prevent recurrence'");
  await knex.raw("COMMENT ON TABLE audit_templates IS 'Reusable audit templates with standardized checklists'");
  await knex.raw("COMMENT ON TABLE audit_checklist_responses IS 'Responses to checklist items during audit completion'");

  await knex.raw("COMMENT ON COLUMN audits.audit_number IS 'Unique audit reference number (e.g., AUD-2024-001)'");
  await knex.raw("COMMENT ON COLUMN audits.compliance_score IS 'Overall compliance score as percentage (0-100)'");
  await knex.raw("COMMENT ON COLUMN audit_findings.severity IS 'Severity level: CRITICAL, MAJOR, MINOR, or OBSERVATION'");
  await knex.raw("COMMENT ON COLUMN corrective_actions.effectiveness_rating IS 'Rating of action effectiveness after verification'");
  await knex.raw("COMMENT ON COLUMN audit_templates.checklist_sections IS 'Structured checklist sections with items and scoring criteria'");
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP TRIGGER IF EXISTS audit_checklist_responses_updated_at ON audit_checklist_responses');
  await knex.raw('DROP TRIGGER IF EXISTS audit_templates_updated_at ON audit_templates');
  await knex.raw('DROP TRIGGER IF EXISTS corrective_actions_updated_at ON corrective_actions');
  await knex.raw('DROP TRIGGER IF EXISTS audit_findings_updated_at ON audit_findings');
  await knex.raw('DROP TRIGGER IF EXISTS audits_updated_at ON audits');
  await knex.raw('DROP FUNCTION IF EXISTS update_audit_checklist_responses_updated_at()');
  await knex.raw('DROP FUNCTION IF EXISTS update_audit_templates_updated_at()');
  await knex.raw('DROP FUNCTION IF EXISTS update_corrective_actions_updated_at()');
  await knex.raw('DROP FUNCTION IF EXISTS update_audit_findings_updated_at()');
  await knex.raw('DROP FUNCTION IF EXISTS update_audits_updated_at()');
  await knex.schema.dropTableIfExists('audit_checklist_responses');
  await knex.schema.dropTableIfExists('audit_templates');
  await knex.schema.dropTableIfExists('corrective_actions');
  await knex.schema.dropTableIfExists('audit_findings');
  await knex.schema.dropTableIfExists('audits');
}
