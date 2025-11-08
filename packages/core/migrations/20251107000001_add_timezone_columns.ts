import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Clients table - store client's timezone
  await knex.schema.alterTable('clients', (table) => {
    table.string('timezone', 100).defaultTo('America/Chicago');
  });

  await knex.raw(`
    COMMENT ON COLUMN clients.timezone IS
    'Client timezone in IANA format (e.g., America/New_York, America/Chicago). Used for scheduling visits and displaying times in client context.'
  `);

  // Caregivers table - store caregiver's home timezone
  await knex.schema.alterTable('caregivers', (table) => {
    table.string('timezone', 100).defaultTo('America/Chicago');
  });

  await knex.raw(`
    COMMENT ON COLUMN caregivers.timezone IS
    'Caregiver home timezone in IANA format. Used for displaying schedules in caregiver context and handling multi-timezone operations.'
  `);

  // Organizations table - store organization's primary timezone
  await knex.schema.alterTable('organizations', (table) => {
    table.string('timezone', 100).defaultTo('America/Chicago');
  });

  await knex.raw(`
    COMMENT ON COLUMN organizations.timezone IS
    'Organization primary timezone in IANA format. Default timezone for coordinators and administrative operations.'
  `);

  // Update existing visits that don't have timezone set to use client's timezone
  // Note: visits table already has timezone column from previous migration
  await knex.raw(`
    UPDATE visits v
    SET timezone = COALESCE(c.timezone, 'America/Chicago')
    FROM clients c
    WHERE v.client_id = c.id
    AND v.timezone = 'America/New_York'
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('clients', (table) => {
    table.dropColumn('timezone');
  });

  await knex.schema.alterTable('caregivers', (table) => {
    table.dropColumn('timezone');
  });

  await knex.schema.alterTable('organizations', (table) => {
    table.dropColumn('timezone');
  });
}
