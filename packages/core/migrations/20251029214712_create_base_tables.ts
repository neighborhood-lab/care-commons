import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Enable UUID extensions
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

  // Organizations table
  await knex.schema.createTable('organizations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name', 255).notNullable();
    table.string('legal_name', 255);
    table.string('tax_id', 50);
    table.string('license_number', 100);
    table.string('phone', 20);
    table.string('email', 255);
    table.string('website', 255);
    table.jsonb('primary_address').notNullable();
    table.jsonb('billing_address');
    table.jsonb('settings').defaultTo('{}');
    table.string('status', 50).defaultTo('ACTIVE');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').notNullable();
    table.integer('version').notNullable().defaultTo(1);
    table.timestamp('deleted_at');
    table.uuid('deleted_by');
  });

  await knex.raw(
    'CREATE INDEX idx_organizations_status ON organizations(status) WHERE deleted_at IS NULL'
  );

  // Branches table
  await knex.schema.createTable('branches', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('organization_id').notNullable().references('id').inTable('organizations');
    table.string('name', 255).notNullable();
    table.string('code', 50);
    table.string('phone', 20);
    table.string('email', 255);
    table.jsonb('address').notNullable();
    table.jsonb('service_area');
    table.jsonb('settings').defaultTo('{}');
    table.string('status', 50).defaultTo('ACTIVE');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').notNullable();
    table.integer('version').notNullable().defaultTo(1);
    table.timestamp('deleted_at');
    table.uuid('deleted_by');
  });

  await knex.raw(
    'CREATE INDEX idx_branches_organization ON branches(organization_id) WHERE deleted_at IS NULL'
  );
  await knex.raw('CREATE INDEX idx_branches_status ON branches(status) WHERE deleted_at IS NULL');

  // Users table
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('organization_id').notNullable().references('id').inTable('organizations');
    table.string('username', 100).unique().notNullable();
    table.string('email', 255).unique().notNullable();
    table.string('password_hash', 255).notNullable();
    table.string('first_name', 100).notNullable();
    table.string('last_name', 100).notNullable();
    table.string('phone', 20);
    table.specificType('roles', 'VARCHAR(50)[]').defaultTo('{}');
    table.specificType('permissions', 'VARCHAR(100)[]').defaultTo('{}');
    table.specificType('branch_ids', 'UUID[]').defaultTo('{}');
    table.string('status', 50).defaultTo('ACTIVE');
    table.timestamp('last_login_at');
    table.timestamp('password_changed_at');
    table.integer('failed_login_attempts').defaultTo(0);
    table.timestamp('locked_until');
    table.jsonb('settings').defaultTo('{}');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').notNullable();
    table.integer('version').notNullable().defaultTo(1);
    table.timestamp('deleted_at');
    table.uuid('deleted_by');
  });

  await knex.raw(
    'CREATE INDEX idx_users_organization ON users(organization_id) WHERE deleted_at IS NULL'
  );
  await knex.raw('CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL');
  await knex.raw('CREATE INDEX idx_users_status ON users(status) WHERE deleted_at IS NULL');

  // Audit events table
  await knex.schema.createTable('audit_events', (table) => {
    table.uuid('event_id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.timestamp('timestamp').notNullable().defaultTo(knex.fn.now());
    table.uuid('user_id').notNullable().references('id').inTable('users');
    table.uuid('organization_id').notNullable().references('id').inTable('organizations');
    table.string('event_type', 50).notNullable();
    table.string('resource', 100).notNullable();
    table.string('resource_id', 100).notNullable();
    table.string('action', 50).notNullable();
    table.string('result', 20).notNullable();
    table.jsonb('metadata').defaultTo('{}');
    table.string('ip_address', 45);
    table.text('user_agent');
  });

  await knex.raw('CREATE INDEX idx_audit_events_user ON audit_events(user_id)');
  await knex.raw('CREATE INDEX idx_audit_events_resource ON audit_events(resource, resource_id)');
  await knex.raw('CREATE INDEX idx_audit_events_timestamp ON audit_events(timestamp DESC)');
  await knex.raw('CREATE INDEX idx_audit_events_organization ON audit_events(organization_id)');

  // Audit revisions table
  await knex.schema.createTable('audit_revisions', (table) => {
    table.uuid('revision_id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('entity_id').notNullable();
    table.string('entity_type', 100).notNullable();
    table.timestamp('timestamp').notNullable().defaultTo(knex.fn.now());
    table.uuid('user_id').notNullable().references('id').inTable('users');
    table.string('operation', 20).notNullable();
    table.jsonb('changes').notNullable();
    table.jsonb('snapshot').notNullable();
    table.text('reason');
    table.string('ip_address', 45);
    table.text('user_agent');
  });

  await knex.raw(
    'CREATE INDEX idx_audit_revisions_entity ON audit_revisions(entity_id, entity_type)'
  );
  await knex.raw('CREATE INDEX idx_audit_revisions_timestamp ON audit_revisions(timestamp DESC)');
  await knex.raw('CREATE INDEX idx_audit_revisions_user ON audit_revisions(user_id)');

  // Programs table
  await knex.schema.createTable('programs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('organization_id').notNullable().references('id').inTable('organizations');
    table.string('name', 255).notNullable();
    table.string('code', 50);
    table.text('description');
    table.string('program_type', 100);
    table.string('funding_source', 100);
    table.jsonb('eligibility_criteria');
    table.specificType('service_types', 'VARCHAR(100)[]');
    table.decimal('hourly_rate', 10, 2);
    table.jsonb('settings').defaultTo('{}');
    table.string('status', 50).defaultTo('ACTIVE');
    table.date('start_date');
    table.date('end_date');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').notNullable();
    table.integer('version').notNullable().defaultTo(1);
    table.timestamp('deleted_at');
    table.uuid('deleted_by');
  });

  await knex.raw(
    'CREATE INDEX idx_programs_organization ON programs(organization_id) WHERE deleted_at IS NULL'
  );
  await knex.raw('CREATE INDEX idx_programs_status ON programs(status) WHERE deleted_at IS NULL');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('programs');
  await knex.schema.dropTableIfExists('audit_revisions');
  await knex.schema.dropTableIfExists('audit_events');
  await knex.schema.dropTableIfExists('users');
  await knex.schema.dropTableIfExists('branches');
  await knex.schema.dropTableIfExists('organizations');
}
