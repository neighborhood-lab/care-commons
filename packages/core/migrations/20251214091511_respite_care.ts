import type { Knex } from 'knex';

/**
 * Family Respite Care Coordination
 *
 * Creates tables for:
 * - Respite care requests from family caregivers
 * - Request approval workflow and caregiver assignment
 * - Integration with visit scheduling
 *
 * Enables family members who provide care to request professional
 * caregiver coverage for breaks/respite.
 *
 * Compliance:
 * - HIPAA audit trails on all tables
 * - Organization-scoped data access
 * - Family member authorization verification
 */
export async function up(knex: Knex): Promise<void> {
  // ============================================================================
  // Respite Requests Table
  // ============================================================================

  const hasRespiteRequestsTable = await knex.schema.hasTable('respite_requests');
  if (!hasRespiteRequestsTable) {
    await knex.schema.createTable('respite_requests', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

      // Client & family context
      table.uuid('client_id').notNullable().references('id').inTable('clients').onDelete('CASCADE');
      table.uuid('family_member_id').notNullable().references('id').inTable('family_members').onDelete('CASCADE');

      // Request details
      table.string('status', 20).notNullable().defaultTo('DRAFT');
      table.string('priority', 20).notNullable().defaultTo('ROUTINE');
      table.string('reason_category', 30).notNullable();
      table.text('reason_description');

      // Requested time window
      table.date('requested_start_date').notNullable();
      table.string('requested_start_time', 5).notNullable(); // HH:MM
      table.date('requested_end_date').notNullable();
      table.string('requested_end_time', 5).notNullable(); // HH:MM
      table.integer('requested_duration_minutes').notNullable();
      table.boolean('flexible_timing').notNullable().defaultTo(true);

      // Caregiver preferences
      table.uuid('preferred_caregiver_id').references('id').inTable('caregivers');
      table.boolean('accept_any_caregiver').notNullable().defaultTo(true);
      table.string('gender_preference', 20);
      table.jsonb('required_skills').defaultTo('[]');

      // Care instructions
      table.text('special_instructions');
      table.jsonb('emergency_contact').notNullable();

      // Approval workflow
      table.timestamp('submitted_at');
      table.uuid('reviewed_by').references('id').inTable('users');
      table.timestamp('reviewed_at');
      table.text('approval_notes');
      table.text('decline_reason');

      // Assignment
      table.uuid('assigned_caregiver_id').references('id').inTable('caregivers');
      table.timestamp('assigned_at');
      table.uuid('scheduled_visit_id').references('id').inTable('visits');

      // Completion
      table.timestamp('completed_at');
      table.text('completion_notes');
      table.integer('family_rating');
      table.text('family_feedback');

      // Organization context
      table.uuid('organization_id').notNullable().references('id').inTable('organizations').onDelete('CASCADE');
      table.uuid('branch_id').notNullable().references('id').inTable('branches').onDelete('CASCADE');

      // Audit fields
      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      table.uuid('created_by').notNullable().references('id').inTable('users');
      table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
      table.uuid('updated_by').notNullable().references('id').inTable('users');
      table.integer('version').notNullable().defaultTo(1);
      table.boolean('is_deleted').notNullable().defaultTo(false);
      table.boolean('is_demo_data').notNullable().defaultTo(false);

      // Constraints
      table.check(`status IN ('DRAFT', 'SUBMITTED', 'APPROVED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DECLINED')`);
      table.check(`priority IN ('ROUTINE', 'PREFERRED', 'URGENT')`);
      table.check(`reason_category IN ('APPOINTMENT', 'WORK', 'FAMILY_EVENT', 'SELF_CARE', 'VACATION', 'EMERGENCY', 'OTHER')`);
      table.check(`gender_preference IN ('MALE', 'FEMALE', 'NO_PREFERENCE') OR gender_preference IS NULL`);
      table.check(`family_rating >= 1 AND family_rating <= 5 OR family_rating IS NULL`);
    });

    // Indexes for common queries
    await knex.schema.raw(`
      CREATE INDEX idx_respite_requests_client ON respite_requests(client_id);
      CREATE INDEX idx_respite_requests_family_member ON respite_requests(family_member_id);
      CREATE INDEX idx_respite_requests_status ON respite_requests(status);
      CREATE INDEX idx_respite_requests_org ON respite_requests(organization_id);
      CREATE INDEX idx_respite_requests_dates ON respite_requests(requested_start_date, requested_end_date);
      CREATE INDEX idx_respite_requests_assigned ON respite_requests(assigned_caregiver_id) WHERE assigned_caregiver_id IS NOT NULL;
    `);
  }

  // ============================================================================
  // Respite Requests Revisions (Audit Trail)
  // ============================================================================

  const hasRespiteRevisionsTable = await knex.schema.hasTable('respite_requests_revisions');
  if (!hasRespiteRevisionsTable) {
    await knex.schema.createTable('respite_requests_revisions', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.uuid('respite_request_id').notNullable().references('id').inTable('respite_requests').onDelete('CASCADE');
      table.integer('revision_number').notNullable();
      table.string('action', 20).notNullable(); // CREATE, UPDATE, STATUS_CHANGE
      table.jsonb('previous_data');
      table.jsonb('new_data').notNullable();
      table.jsonb('changed_fields').notNullable();
      table.text('change_reason');

      // Audit fields
      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      table.uuid('created_by').notNullable().references('id').inTable('users');

      table.unique(['respite_request_id', 'revision_number']);
    });

    await knex.schema.raw(`
      CREATE INDEX idx_respite_revisions_request ON respite_requests_revisions(respite_request_id);
    `);
  }
}

export async function down(knex: Knex): Promise<void> {
  // Drop in reverse order due to foreign key constraints
  await knex.schema.dropTableIfExists('respite_requests_revisions');
  await knex.schema.dropTableIfExists('respite_requests');
}
