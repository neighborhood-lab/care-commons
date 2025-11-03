import { type Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('shift_requirements', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('client_id').notNullable().references('id').inTable('clients');
    table.uuid('visit_id').references('id').inTable('visits');
    table.string('service_type', 100).notNullable();
    table.timestamp('start_time').notNullable();
    table.timestamp('end_time').notNullable();
    table.specificType('required_skills', 'TEXT[]');
    table.specificType('required_certifications', 'TEXT[]');
    table.string('language_preference', 50);
    table.string('gender_preference', 20);
    table.decimal('max_distance_miles', 5, 2);
    table.string('state', 2).notNullable();
    table
      .string('status', 20)
      .notNullable()
      .defaultTo('OPEN')
      .checkIn(['OPEN', 'ASSIGNED', 'FULFILLED', 'CANCELLED']);
    table.uuid('assigned_caregiver_id').references('id').inTable('caregivers');

    // Audit fields
    table.uuid('created_by').notNullable().references('id').inTable('users');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').references('id').inTable('users');
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('deleted_at');
    table.integer('version').notNullable().defaultTo(1);
  });

  // Create indexes with WHERE clause for soft deletes
  await knex.raw(
    'CREATE INDEX idx_shift_requirements_client ON shift_requirements(client_id) WHERE deleted_at IS NULL'
  );
  await knex.raw(
    'CREATE INDEX idx_shift_requirements_visit ON shift_requirements(visit_id) WHERE deleted_at IS NULL'
  );
  await knex.raw(
    'CREATE INDEX idx_shift_requirements_status ON shift_requirements(status) WHERE deleted_at IS NULL'
  );
  await knex.raw(
    'CREATE INDEX idx_shift_requirements_state ON shift_requirements(state) WHERE deleted_at IS NULL'
  );
  await knex.raw(
    'CREATE INDEX idx_shift_requirements_start_time ON shift_requirements(start_time) WHERE deleted_at IS NULL'
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('shift_requirements');
}
