import type { Knex } from 'knex';

/**
 * Migration: Goal Progress Tracking
 *
 * Adds tables for tracking goal progress over time:
 * - goal_measurements: Individual progress measurements for goals
 * - care_plan_revisions: Version control for care plan changes
 *
 * Closes #659: Implement complete Care Plans feature
 */
export async function up(knex: Knex): Promise<void> {
  // Goal Measurements table - tracks progress data points over time
  await knex.schema.createTable('goal_measurements', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

    // References
    table.uuid('care_plan_id').notNullable();
    table.uuid('goal_id').notNullable(); // UUID of goal within care_plan's goals JSONB
    table.uuid('client_id').notNullable();
    table.uuid('organization_id').notNullable();

    // Measurement data
    table.timestamp('measured_at').notNullable().defaultTo(knex.fn.now());
    table.decimal('value', 10, 4); // Numeric measurement (e.g., 80 for 80%)
    table.string('value_unit', 50); // e.g., 'percent', 'steps', 'minutes', 'pounds'
    table.text('value_text'); // For non-numeric measurements

    // Progress tracking
    table.decimal('progress_percentage', 5, 2); // 0-100
    table.string('goal_status', 30).notNullable(); // ON_TRACK, AT_RISK, ACHIEVED, etc.

    // Context
    table.text('notes');
    table.uuid('visit_id'); // If measured during a visit
    table.uuid('task_instance_id'); // If related to a task

    // Verification
    table.string('measurement_method', 50); // SELF_REPORT, OBSERVATION, DEVICE, ASSESSMENT
    table.uuid('measured_by').notNullable();
    table.uuid('verified_by');
    table.timestamp('verified_at');

    // Audit fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();
    table.boolean('is_deleted').notNullable().defaultTo(false);

    // Constraints
    table.check(`goal_status IN ('NOT_STARTED', 'IN_PROGRESS', 'ON_TRACK', 'AT_RISK', 'ACHIEVED', 'DISCONTINUED', 'MODIFIED')`);
    table.check(`progress_percentage >= 0 AND progress_percentage <= 100`);
    table.check(`measurement_method IN ('SELF_REPORT', 'OBSERVATION', 'DEVICE', 'ASSESSMENT', 'CAREGIVER_REPORT', 'FAMILY_REPORT')`);

    // Foreign keys
    table.foreign('care_plan_id').references('id').inTable('care_plans');
    table.foreign('client_id').references('id').inTable('clients');
    table.foreign('organization_id').references('id').inTable('organizations');
    table.foreign('visit_id').references('id').inTable('visits');
    table.foreign('task_instance_id').references('id').inTable('task_instances');
    table.foreign('measured_by').references('id').inTable('users');
    table.foreign('verified_by').references('id').inTable('users');
    table.foreign('created_by').references('id').inTable('users');
  });

  // Indexes for goal_measurements
  await knex.raw('CREATE INDEX idx_goal_measurements_care_plan ON goal_measurements(care_plan_id) WHERE is_deleted = false');
  await knex.raw('CREATE INDEX idx_goal_measurements_goal ON goal_measurements(goal_id) WHERE is_deleted = false');
  await knex.raw('CREATE INDEX idx_goal_measurements_client ON goal_measurements(client_id) WHERE is_deleted = false');
  await knex.raw('CREATE INDEX idx_goal_measurements_measured_at ON goal_measurements(measured_at DESC) WHERE is_deleted = false');
  await knex.raw('CREATE INDEX idx_goal_measurements_status ON goal_measurements(goal_status) WHERE is_deleted = false');
  await knex.raw('CREATE INDEX idx_goal_measurements_care_plan_goal ON goal_measurements(care_plan_id, goal_id, measured_at DESC) WHERE is_deleted = false');

  // Care Plan Revisions table - version control for care plans
  await knex.schema.createTable('care_plan_revisions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

    // References
    table.uuid('care_plan_id').notNullable();
    table.uuid('organization_id').notNullable();

    // Revision tracking
    table.integer('revision_number').notNullable();
    table.string('revision_type', 50).notNullable(); // GOAL_ADDED, GOAL_MODIFIED, INTERVENTION_CHANGED, etc.

    // Snapshot (immutable record of state at time of change)
    table.jsonb('previous_state').notNullable(); // Full previous state
    table.jsonb('new_state').notNullable(); // Full new state
    table.jsonb('changes_summary').notNullable(); // Summary of what changed

    // Change details
    table.string('change_reason', 500).notNullable();
    table.text('change_notes');

    // Approval workflow
    table.string('approval_status', 30).notNullable().defaultTo('PENDING');
    table.uuid('requested_by').notNullable();
    table.timestamp('requested_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('approved_by');
    table.timestamp('approved_at');
    table.text('approval_notes');

    // Effective date (when this revision takes effect)
    table.timestamp('effective_at');

    // Audit fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();

    // Constraints
    table.check(`revision_type IN ('INITIAL', 'GOAL_ADDED', 'GOAL_MODIFIED', 'GOAL_REMOVED', 'INTERVENTION_ADDED', 'INTERVENTION_MODIFIED', 'INTERVENTION_REMOVED', 'TASK_MODIFIED', 'STATUS_CHANGE', 'SCHEDULE_CHANGE', 'AUTHORIZATION_UPDATE', 'GENERAL_UPDATE')`);
    table.check(`approval_status IN ('PENDING', 'APPROVED', 'REJECTED', 'AUTO_APPROVED')`);

    // Foreign keys
    table.foreign('care_plan_id').references('id').inTable('care_plans');
    table.foreign('organization_id').references('id').inTable('organizations');
    table.foreign('requested_by').references('id').inTable('users');
    table.foreign('approved_by').references('id').inTable('users');
    table.foreign('created_by').references('id').inTable('users');

    // Unique constraint on care_plan + revision_number
    table.unique(['care_plan_id', 'revision_number']);
  });

  // Indexes for care_plan_revisions
  await knex.raw('CREATE INDEX idx_care_plan_revisions_care_plan ON care_plan_revisions(care_plan_id, revision_number DESC)');
  await knex.raw('CREATE INDEX idx_care_plan_revisions_approval ON care_plan_revisions(approval_status) WHERE approval_status = \'PENDING\'');
  await knex.raw('CREATE INDEX idx_care_plan_revisions_requested_by ON care_plan_revisions(requested_by)');
  await knex.raw('CREATE INDEX idx_care_plan_revisions_effective ON care_plan_revisions(effective_at) WHERE effective_at IS NOT NULL');

  // Add goal_id column to progress_notes for direct goal linkage
  await knex.schema.alterTable('progress_notes', (table) => {
    table.uuid('goal_id'); // Optional link to specific goal
    table.decimal('goal_progress_value', 10, 4); // Progress value if applicable
    table.string('goal_progress_status', 30); // Status update for goal
  });

  // Add intervention tracking columns to task_instances
  await knex.schema.alterTable('task_instances', (table) => {
    table.uuid('intervention_id'); // Link task to specific intervention
    table.boolean('intervention_completed').defaultTo(false);
  });

  // Create index for intervention tracking
  await knex.raw('CREATE INDEX idx_task_instances_intervention ON task_instances(intervention_id) WHERE intervention_id IS NOT NULL');
}

export async function down(knex: Knex): Promise<void> {
  // Remove columns from task_instances
  await knex.schema.alterTable('task_instances', (table) => {
    table.dropColumn('intervention_id');
    table.dropColumn('intervention_completed');
  });

  // Remove columns from progress_notes
  await knex.schema.alterTable('progress_notes', (table) => {
    table.dropColumn('goal_id');
    table.dropColumn('goal_progress_value');
    table.dropColumn('goal_progress_status');
  });

  // Drop tables
  await knex.schema.dropTableIfExists('care_plan_revisions');
  await knex.schema.dropTableIfExists('goal_measurements');
}
