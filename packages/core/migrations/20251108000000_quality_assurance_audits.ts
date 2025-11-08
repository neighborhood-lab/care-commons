/**
 * Migration: Quality Assurance & Audits Module
 *
 * Creates tables for:
 * - Audits (main audit records)
 * - Audit findings (issues discovered during audits)
 * - Corrective actions (remediation plans)
 * - Audit templates (reusable audit checklists)
 * - Audit checklist responses (completed checklist items)
 */

import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  console.log('Creating quality assurance audits tables...');

  // ============================================================================
  // Audits Table
  // ============================================================================
  await knex.schema.createTable('audits', (table) => {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    // Basic information
    table.string('audit_number', 50).notNullable().unique();
    table.string('title', 255).notNullable();
    table.text('description').notNullable();
    table.string('audit_type', 50).notNullable(); // COMPLIANCE, QUALITY, SAFETY, etc.
    table.string('status', 50).notNullable(); // DRAFT, SCHEDULED, IN_PROGRESS, etc.
    table.string('priority', 20).notNullable(); // LOW, MEDIUM, HIGH, CRITICAL

    // Scope
    table.string('scope', 50).notNullable(); // ORGANIZATION, BRANCH, DEPARTMENT, etc.
    table.uuid('scope_entity_id').nullable();
    table.string('scope_entity_name', 255).nullable();

    // Scheduling
    table.timestamp('scheduled_start_date').notNullable();
    table.timestamp('scheduled_end_date').notNullable();
    table.timestamp('actual_start_date').nullable();
    table.timestamp('actual_end_date').nullable();

    // Audit team
    table.uuid('lead_auditor_id').notNullable();
    table.string('lead_auditor_name', 255).notNullable();
    table.jsonb('auditor_ids').defaultTo('[]');

    // Standards & criteria
    table.string('standards_reference', 500).nullable();
    table.jsonb('audit_criteria').nullable();
    table.uuid('template_id').nullable();

    // Results summary
    table.integer('total_findings').defaultTo(0);
    table.integer('critical_findings').defaultTo(0);
    table.integer('major_findings').defaultTo(0);
    table.integer('minor_findings').defaultTo(0);
    table.decimal('compliance_score', 5, 2).nullable();
    table.string('overall_rating', 50).nullable();

    // Documentation
    table.text('executive_summary').nullable();
    table.text('recommendations').nullable();
    table.jsonb('attachment_urls').nullable();

    // Approval & sign-off
    table.uuid('reviewed_by').nullable();
    table.timestamp('reviewed_at').nullable();
    table.uuid('approved_by').nullable();
    table.timestamp('approved_at').nullable();

    // Follow-up
    table.boolean('requires_follow_up').defaultTo(false);
    table.timestamp('follow_up_date').nullable();
    table.uuid('follow_up_audit_id').nullable();

    // Context
    table.uuid('organization_id').notNullable();
    table.uuid('branch_id').nullable();

    // Audit trail
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').notNullable();
    table.integer('version').notNullable().defaultTo(1);

    // Indexes
    table.index('organization_id');
    table.index('branch_id');
    table.index('status');
    table.index('audit_type');
    table.index('lead_auditor_id');
    table.index(['scheduled_start_date', 'scheduled_end_date']);
    table.index('created_at');
  });

  // ============================================================================
  // Audit Findings Table
  // ============================================================================
  await knex.schema.createTable('audit_findings', (table) => {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    // References
    table.uuid('audit_id').notNullable().references('id').inTable('audits').onDelete('CASCADE');

    // Finding details
    table.string('finding_number', 50).notNullable();
    table.string('title', 255).notNullable();
    table.text('description').notNullable();
    table.string('category', 50).notNullable(); // DOCUMENTATION, TRAINING, POLICY_PROCEDURE, etc.
    table.string('severity', 20).notNullable(); // CRITICAL, MAJOR, MINOR, OBSERVATION
    table.string('status', 50).notNullable(); // OPEN, IN_PROGRESS, RESOLVED, VERIFIED, CLOSED, DEFERRED

    // Compliance reference
    table.string('standard_reference', 500).nullable();
    table.text('regulatory_requirement').nullable();

    // Evidence
    table.text('evidence_description').nullable();
    table.jsonb('evidence_urls').nullable();
    table.uuid('observed_by').notNullable();
    table.string('observed_by_name', 255).notNullable();
    table.timestamp('observed_at').notNullable().defaultTo(knex.fn.now());

    // Location/context
    table.string('location_description', 500).nullable();
    table.string('affected_entity', 50).nullable(); // CAREGIVER, CLIENT, PROCESS, etc.
    table.uuid('affected_entity_id').nullable();
    table.string('affected_entity_name', 255).nullable();

    // Impact
    table.text('potential_impact').nullable();
    table.text('actual_impact').nullable();

    // Resolution
    table.text('required_corrective_action').notNullable();
    table.string('recommended_timeframe', 100).nullable();
    table.timestamp('target_resolution_date').nullable();
    table.timestamp('actual_resolution_date').nullable();
    table.text('resolution_description').nullable();
    table.uuid('verified_by').nullable();
    table.timestamp('verified_at').nullable();

    // Follow-up
    table.boolean('requires_follow_up').defaultTo(false);
    table.text('follow_up_notes').nullable();

    // Context
    table.uuid('organization_id').notNullable();
    table.uuid('branch_id').nullable();

    // Audit trail
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').notNullable();
    table.integer('version').notNullable().defaultTo(1);

    // Indexes
    table.index('audit_id');
    table.index('organization_id');
    table.index('status');
    table.index('severity');
    table.index(['severity', 'status']);
    table.index('observed_at');
    table.index('target_resolution_date');
  });

  // ============================================================================
  // Corrective Actions Table
  // ============================================================================
  await knex.schema.createTable('corrective_actions', (table) => {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    // References
    table.uuid('finding_id').notNullable().references('id').inTable('audit_findings').onDelete('CASCADE');
    table.uuid('audit_id').notNullable().references('id').inTable('audits').onDelete('CASCADE');

    // Action details
    table.string('action_number', 50).notNullable();
    table.string('title', 255).notNullable();
    table.text('description').notNullable();
    table.string('action_type', 50).notNullable(); // IMMEDIATE, SHORT_TERM, LONG_TERM, PREVENTIVE
    table.string('status', 50).notNullable(); // PLANNED, IN_PROGRESS, IMPLEMENTED, VERIFIED, CLOSED, etc.

    // Root cause analysis
    table.text('root_cause').nullable();
    table.jsonb('contributing_factors').nullable();

    // Implementation plan
    table.jsonb('specific_actions').notNullable();
    table.uuid('responsible_person_id').notNullable();
    table.string('responsible_person_name', 255).notNullable();
    table.timestamp('target_completion_date').notNullable();
    table.timestamp('actual_completion_date').nullable();

    // Resources required
    table.text('resources_required').nullable();
    table.decimal('estimated_cost', 12, 2).nullable();
    table.decimal('actual_cost', 12, 2).nullable();

    // Monitoring
    table.text('monitoring_plan').nullable();
    table.jsonb('success_criteria').nullable();
    table.text('verification_method').nullable();

    // Progress tracking
    table.jsonb('progress_updates').defaultTo('[]');
    table.integer('completion_percentage').defaultTo(0);

    // Verification
    table.uuid('verified_by').nullable();
    table.timestamp('verified_at').nullable();
    table.text('verification_notes').nullable();
    table.string('effectiveness_rating', 50).nullable(); // EFFECTIVE, PARTIALLY_EFFECTIVE, INEFFECTIVE

    // Documentation
    table.jsonb('attachment_urls').nullable();

    // Context
    table.uuid('organization_id').notNullable();
    table.uuid('branch_id').nullable();

    // Audit trail
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').notNullable();
    table.integer('version').notNullable().defaultTo(1);

    // Indexes
    table.index('finding_id');
    table.index('audit_id');
    table.index('organization_id');
    table.index('status');
    table.index('responsible_person_id');
    table.index('target_completion_date');
    table.index(['status', 'target_completion_date']);
  });

  // ============================================================================
  // Audit Templates Table
  // ============================================================================
  await knex.schema.createTable('audit_templates', (table) => {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    // Template details
    table.string('template_name', 255).notNullable();
    table.text('description').notNullable();
    table.string('audit_type', 50).notNullable();
    table.jsonb('applicable_scope').notNullable();

    // Standards & criteria
    table.string('standards_reference', 500).nullable();
    table.string('template_version', 20).notNullable();
    table.timestamp('effective_date').notNullable();
    table.timestamp('expiry_date').nullable();

    // Checklist sections
    table.jsonb('checklist_sections').notNullable();

    // Metadata
    table.boolean('is_active').defaultTo(true);
    table.integer('usage_count').defaultTo(0);
    table.timestamp('last_used_at').nullable();

    // Context
    table.uuid('organization_id').notNullable();

    // Audit trail
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').notNullable();
    table.integer('version').notNullable().defaultTo(1);

    // Indexes
    table.index('organization_id');
    table.index('audit_type');
    table.index('is_active');
    table.index(['organization_id', 'is_active']);
  });

  // ============================================================================
  // Audit Checklist Responses Table
  // ============================================================================
  await knex.schema.createTable('audit_checklist_responses', (table) => {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    // References
    table.uuid('audit_id').notNullable().references('id').inTable('audits').onDelete('CASCADE');
    table.uuid('template_id').notNullable();
    table.string('section_id', 100).notNullable();
    table.string('item_id', 100).notNullable();

    // Response
    table.string('response', 100).notNullable(); // YES, NO, NA, COMPLIANT, NON_COMPLIANT, or numeric rating
    table.text('notes').nullable();
    table.jsonb('evidence_urls').nullable();

    // Metadata
    table.uuid('responded_by').notNullable();
    table.string('responded_by_name', 255).notNullable();
    table.timestamp('responded_at').notNullable().defaultTo(knex.fn.now());

    // Related finding
    table.uuid('finding_id').nullable().references('id').inTable('audit_findings').onDelete('SET NULL');

    // Context
    table.uuid('organization_id').notNullable();

    // Audit trail
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').notNullable();
    table.integer('version').notNullable().defaultTo(1);

    // Indexes
    table.index('audit_id');
    table.index('template_id');
    table.index(['audit_id', 'section_id']);
    table.index('organization_id');
  });

  console.log('✅ Quality assurance audits tables created successfully');
}

export async function down(knex: Knex): Promise<void> {
  console.log('Dropping quality assurance audits tables...');

  await knex.schema.dropTableIfExists('audit_checklist_responses');
  await knex.schema.dropTableIfExists('audit_templates');
  await knex.schema.dropTableIfExists('corrective_actions');
  await knex.schema.dropTableIfExists('audit_findings');
  await knex.schema.dropTableIfExists('audits');

  console.log('✅ Quality assurance audits tables dropped successfully');
}
