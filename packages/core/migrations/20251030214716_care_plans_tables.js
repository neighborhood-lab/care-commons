"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    await knex.schema.createTable('care_plans', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.string('plan_number', 50).unique().notNullable();
        table.string('name', 255).notNullable();
        table.uuid('client_id').notNullable();
        table.uuid('organization_id').notNullable();
        table.uuid('branch_id');
        table.string('plan_type', 50).notNullable();
        table.string('status', 50).notNullable().defaultTo('DRAFT');
        table.string('priority', 20).notNullable().defaultTo('MEDIUM');
        table.date('effective_date').notNullable();
        table.date('expiration_date');
        table.date('review_date');
        table.date('last_reviewed_date');
        table.uuid('primary_caregiver_id');
        table.uuid('coordinator_id');
        table.uuid('supervisor_id');
        table.uuid('physician_id');
        table.text('assessment_summary');
        table.specificType('medical_diagnosis', 'TEXT[]');
        table.specificType('functional_limitations', 'TEXT[]');
        table.jsonb('goals').notNullable().defaultTo('[]');
        table.jsonb('interventions').notNullable().defaultTo('[]');
        table.jsonb('task_templates').notNullable().defaultTo('[]');
        table.jsonb('service_frequency');
        table.decimal('estimated_hours_per_week', 5, 2);
        table.uuid('authorized_by');
        table.date('authorized_date');
        table.string('authorization_number', 100);
        table.jsonb('payer_source');
        table.decimal('authorization_hours', 7, 2);
        table.date('authorization_start_date');
        table.date('authorization_end_date');
        table.jsonb('required_documentation');
        table.jsonb('signature_requirements');
        table.specificType('restrictions', 'TEXT[]');
        table.specificType('precautions', 'TEXT[]');
        table.jsonb('allergies');
        table.specificType('contraindications', 'TEXT[]');
        table.jsonb('progress_notes');
        table.jsonb('outcomes_measured');
        table.specificType('regulatory_requirements', 'TEXT[]');
        table.string('compliance_status', 50).defaultTo('PENDING_REVIEW');
        table.timestamp('last_compliance_check');
        table.jsonb('modification_history');
        table.text('notes');
        table.specificType('tags', 'TEXT[]');
        table.jsonb('custom_fields');
        table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
        table.uuid('created_by').notNullable();
        table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
        table.uuid('updated_by').notNullable();
        table.integer('version').notNullable().defaultTo(1);
        table.timestamp('deleted_at');
        table.uuid('deleted_by');
        table.check(`plan_type IN ('PERSONAL_CARE', 'COMPANION', 'SKILLED_NURSING', 'THERAPY', 'HOSPICE', 'RESPITE', 'LIVE_IN', 'CUSTOM')`);
        table.check(`status IN ('DRAFT', 'PENDING_APPROVAL', 'ACTIVE', 'ON_HOLD', 'EXPIRED', 'DISCONTINUED', 'COMPLETED')`);
        table.check(`priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')`);
        table.check(`compliance_status IN ('COMPLIANT', 'PENDING_REVIEW', 'EXPIRED', 'NON_COMPLIANT')`);
        table.check(`expiration_date IS NULL OR expiration_date > effective_date`);
        table.check(`authorization_end_date IS NULL OR authorization_start_date IS NULL OR authorization_end_date >= authorization_start_date`);
        table.foreign('client_id').references('id').inTable('clients');
        table.foreign('organization_id').references('id').inTable('organizations');
        table.foreign('branch_id').references('id').inTable('branches');
        table.foreign('primary_caregiver_id').references('id').inTable('caregivers');
        table.foreign('coordinator_id').references('id').inTable('users');
        table.foreign('supervisor_id').references('id').inTable('users');
        table.foreign('authorized_by').references('id').inTable('users');
        table.foreign('created_by').references('id').inTable('users');
        table.foreign('updated_by').references('id').inTable('users');
        table.foreign('deleted_by').references('id').inTable('users');
    });
    await knex.raw('CREATE INDEX idx_care_plans_client ON care_plans(client_id) WHERE deleted_at IS NULL');
    await knex.raw('CREATE INDEX idx_care_plans_organization ON care_plans(organization_id) WHERE deleted_at IS NULL');
    await knex.raw('CREATE INDEX idx_care_plans_branch ON care_plans(branch_id) WHERE deleted_at IS NULL');
    await knex.raw('CREATE INDEX idx_care_plans_status ON care_plans(status) WHERE deleted_at IS NULL');
    await knex.raw('CREATE INDEX idx_care_plans_coordinator ON care_plans(coordinator_id) WHERE deleted_at IS NULL');
    await knex.raw('CREATE INDEX idx_care_plans_plan_type ON care_plans(plan_type) WHERE deleted_at IS NULL');
    await knex.raw('CREATE INDEX idx_care_plans_compliance ON care_plans(compliance_status) WHERE deleted_at IS NULL');
    await knex.raw('CREATE INDEX idx_care_plans_effective_date ON care_plans(effective_date DESC) WHERE deleted_at IS NULL');
    await knex.raw('CREATE INDEX idx_care_plans_expiration_date ON care_plans(expiration_date) WHERE deleted_at IS NULL AND expiration_date IS NOT NULL');
    await knex.raw('CREATE INDEX idx_care_plans_active ON care_plans(client_id, status) WHERE deleted_at IS NULL AND status = \'ACTIVE\'');
    await knex.raw('CREATE INDEX idx_care_plans_goals_gin ON care_plans USING gin(goals)');
    await knex.raw('CREATE INDEX idx_care_plans_interventions_gin ON care_plans USING gin(interventions)');
    await knex.raw('CREATE INDEX idx_care_plans_task_templates_gin ON care_plans USING gin(task_templates)');
    await knex.raw('CREATE INDEX idx_care_plans_custom_fields_gin ON care_plans USING gin(custom_fields)');
    await knex.schema.createTable('task_instances', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.uuid('care_plan_id').notNullable();
        table.uuid('template_id');
        table.uuid('visit_id');
        table.uuid('client_id').notNullable();
        table.uuid('assigned_caregiver_id');
        table.string('name', 255).notNullable();
        table.text('description').notNullable();
        table.string('category', 50).notNullable();
        table.text('instructions').notNullable();
        table.date('scheduled_date').notNullable();
        table.time('scheduled_time');
        table.string('time_of_day', 20);
        table.integer('estimated_duration');
        table.string('status', 50).notNullable().defaultTo('SCHEDULED');
        table.timestamp('completed_at');
        table.uuid('completed_by');
        table.text('completion_note');
        table.jsonb('completion_signature');
        table.specificType('completion_photo', 'TEXT[]');
        table.jsonb('verification_data');
        table.jsonb('quality_check_responses');
        table.timestamp('skipped_at');
        table.uuid('skipped_by');
        table.string('skip_reason', 255);
        table.text('skip_note');
        table.boolean('issue_reported').defaultTo(false);
        table.text('issue_description');
        table.timestamp('issue_reported_at');
        table.uuid('issue_reported_by');
        table.boolean('required_signature').defaultTo(false);
        table.boolean('required_note').defaultTo(false);
        table.jsonb('custom_field_values');
        table.text('notes');
        table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
        table.uuid('created_by').notNullable();
        table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
        table.uuid('updated_by').notNullable();
        table.integer('version').notNullable().defaultTo(1);
        table.check(`category IN ('PERSONAL_HYGIENE', 'BATHING', 'DRESSING', 'GROOMING', 'TOILETING', 'MOBILITY', 'TRANSFERRING', 'AMBULATION', 'MEDICATION', 'MEAL_PREPARATION', 'FEEDING', 'HOUSEKEEPING', 'LAUNDRY', 'SHOPPING', 'TRANSPORTATION', 'COMPANIONSHIP', 'MONITORING', 'DOCUMENTATION', 'OTHER')`);
        table.check(`time_of_day IN ('EARLY_MORNING', 'MORNING', 'AFTERNOON', 'EVENING', 'NIGHT', 'OVERNIGHT', 'ANY')`);
        table.check(`status IN ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'MISSED', 'CANCELLED', 'ISSUE_REPORTED')`);
        table.foreign('care_plan_id').references('id').inTable('care_plans').onDelete('CASCADE');
        table.foreign('visit_id').references('id').inTable('visits');
        table.foreign('client_id').references('id').inTable('clients');
        table.foreign('assigned_caregiver_id').references('id').inTable('caregivers');
        table.foreign('completed_by').references('id').inTable('users');
        table.foreign('skipped_by').references('id').inTable('users');
        table.foreign('issue_reported_by').references('id').inTable('users');
        table.foreign('created_by').references('id').inTable('users');
        table.foreign('updated_by').references('id').inTable('users');
    });
    await knex.raw('CREATE INDEX idx_task_instances_care_plan ON task_instances(care_plan_id)');
    await knex.raw('CREATE INDEX idx_task_instances_client ON task_instances(client_id)');
    await knex.raw('CREATE INDEX idx_task_instances_caregiver ON task_instances(assigned_caregiver_id)');
    await knex.raw('CREATE INDEX idx_task_instances_visit ON task_instances(visit_id)');
    await knex.raw('CREATE INDEX idx_task_instances_status ON task_instances(status)');
    await knex.raw('CREATE INDEX idx_task_instances_category ON task_instances(category)');
    await knex.raw('CREATE INDEX idx_task_instances_scheduled_date ON task_instances(scheduled_date DESC)');
    await knex.raw('CREATE INDEX idx_task_instances_completed_at ON task_instances(completed_at DESC) WHERE completed_at IS NOT NULL');
    await knex.raw('CREATE INDEX idx_task_instances_overdue ON task_instances(scheduled_date, status) WHERE status IN (\'SCHEDULED\', \'IN_PROGRESS\')');
    await knex.raw('CREATE INDEX idx_task_instances_issues ON task_instances(issue_reported) WHERE issue_reported = true');
    await knex.raw('CREATE INDEX idx_task_instances_verification_gin ON task_instances USING gin(verification_data)');
    await knex.raw('CREATE INDEX idx_task_instances_custom_fields_gin ON task_instances USING gin(custom_field_values)');
    await knex.schema.createTable('progress_notes', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.uuid('care_plan_id').notNullable();
        table.uuid('client_id').notNullable();
        table.uuid('visit_id');
        table.string('note_type', 50).notNullable();
        table.date('note_date').notNullable();
        table.uuid('author_id').notNullable();
        table.string('author_name', 255).notNullable();
        table.string('author_role', 100).notNullable();
        table.text('content').notNullable();
        table.jsonb('goal_progress');
        table.jsonb('observations');
        table.specificType('concerns', 'TEXT[]');
        table.specificType('recommendations', 'TEXT[]');
        table.uuid('reviewed_by');
        table.timestamp('reviewed_at');
        table.boolean('approved').defaultTo(false);
        table.specificType('attachments', 'TEXT[]');
        table.jsonb('signature');
        table.specificType('tags', 'TEXT[]');
        table.boolean('is_private').defaultTo(false);
        table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
        table.uuid('created_by').notNullable();
        table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
        table.uuid('updated_by').notNullable();
        table.integer('version').notNullable().defaultTo(1);
        table.check(`note_type IN ('VISIT_NOTE', 'WEEKLY_SUMMARY', 'MONTHLY_SUMMARY', 'CARE_PLAN_REVIEW', 'INCIDENT', 'CHANGE_IN_CONDITION', 'COMMUNICATION', 'OTHER')`);
        table.foreign('care_plan_id').references('id').inTable('care_plans').onDelete('CASCADE');
        table.foreign('client_id').references('id').inTable('clients');
        table.foreign('visit_id').references('id').inTable('visits');
        table.foreign('author_id').references('id').inTable('users');
        table.foreign('reviewed_by').references('id').inTable('users');
        table.foreign('created_by').references('id').inTable('users');
        table.foreign('updated_by').references('id').inTable('users');
    });
    await knex.raw('CREATE INDEX idx_progress_notes_care_plan ON progress_notes(care_plan_id)');
    await knex.raw('CREATE INDEX idx_progress_notes_client ON progress_notes(client_id)');
    await knex.raw('CREATE INDEX idx_progress_notes_visit ON progress_notes(visit_id)');
    await knex.raw('CREATE INDEX idx_progress_notes_author ON progress_notes(author_id)');
    await knex.raw('CREATE INDEX idx_progress_notes_note_type ON progress_notes(note_type)');
    await knex.raw('CREATE INDEX idx_progress_notes_note_date ON progress_notes(note_date DESC)');
    await knex.raw('CREATE INDEX idx_progress_notes_created_at ON progress_notes(created_at DESC)');
    await knex.raw('CREATE INDEX idx_progress_notes_reviewed ON progress_notes(reviewed_by, reviewed_at) WHERE reviewed_at IS NOT NULL');
    await knex.raw('CREATE INDEX idx_progress_notes_goal_progress_gin ON progress_notes USING gin(goal_progress)');
    await knex.raw('CREATE INDEX idx_progress_notes_observations_gin ON progress_notes USING gin(observations)');
    await knex.raw(`
    CREATE OR REPLACE FUNCTION update_care_plans_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      NEW.version = OLD.version + 1;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `);
    await knex.raw(`
    CREATE TRIGGER care_plans_updated_at
      BEFORE UPDATE ON care_plans
      FOR EACH ROW
      EXECUTE FUNCTION update_care_plans_updated_at()
  `);
    await knex.raw(`
    CREATE OR REPLACE FUNCTION update_task_instances_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      NEW.version = OLD.version + 1;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `);
    await knex.raw(`
    CREATE TRIGGER task_instances_updated_at
      BEFORE UPDATE ON task_instances
      FOR EACH ROW
      EXECUTE FUNCTION update_task_instances_updated_at()
  `);
    await knex.raw(`
    CREATE OR REPLACE FUNCTION update_progress_notes_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      NEW.version = OLD.version + 1;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `);
    await knex.raw(`
    CREATE TRIGGER progress_notes_updated_at
      BEFORE UPDATE ON progress_notes
      FOR EACH ROW
      EXECUTE FUNCTION update_progress_notes_updated_at()
  `);
    await knex.raw("COMMENT ON TABLE care_plans IS 'Comprehensive care plans defining goals, interventions, and task templates'");
    await knex.raw("COMMENT ON TABLE task_instances IS 'Individual task instances created from templates or ad-hoc for specific visits'");
    await knex.raw("COMMENT ON TABLE progress_notes IS 'Clinical notes documenting client progress, observations, and care outcomes'");
    await knex.raw("COMMENT ON COLUMN care_plans.goals IS 'Array of care plan goals with targets, milestones, and progress tracking'");
    await knex.raw("COMMENT ON COLUMN care_plans.interventions IS 'Array of interventions detailing specific actions to achieve goals'");
    await knex.raw("COMMENT ON COLUMN care_plans.task_templates IS 'Array of reusable task templates for generating visit-specific tasks'");
    await knex.raw("COMMENT ON COLUMN task_instances.verification_data IS 'GPS location, photos, vital signs, or other verification data'");
    await knex.raw("COMMENT ON COLUMN task_instances.quality_check_responses IS 'Responses to quality check questions for task'");
    await knex.raw("COMMENT ON COLUMN progress_notes.goal_progress IS 'Structured progress updates for each goal'");
    await knex.raw("COMMENT ON COLUMN progress_notes.observations IS 'Structured clinical observations categorized by type'");
}
async function down(knex) {
    await knex.raw('DROP TRIGGER IF EXISTS progress_notes_updated_at ON progress_notes');
    await knex.raw('DROP TRIGGER IF EXISTS task_instances_updated_at ON task_instances');
    await knex.raw('DROP TRIGGER IF EXISTS care_plans_updated_at ON care_plans');
    await knex.raw('DROP FUNCTION IF EXISTS update_progress_notes_updated_at()');
    await knex.raw('DROP FUNCTION IF EXISTS update_task_instances_updated_at()');
    await knex.raw('DROP FUNCTION IF EXISTS update_care_plans_updated_at()');
    await knex.schema.dropTableIfExists('progress_notes');
    await knex.schema.dropTableIfExists('task_instances');
    await knex.schema.dropTableIfExists('care_plans');
}
//# sourceMappingURL=20251030214716_care_plans_tables.js.map