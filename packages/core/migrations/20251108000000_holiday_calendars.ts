import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Holiday calendar definitions
  await knex.schema.createTable('holiday_calendars', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name', 100).notNullable();
    table.text('description');
    table.string('calendar_type', 20).notNullable(); // 'national', 'state', 'agency'
    table.string('state_code', 2); // For state-specific calendars (TX, FL, etc.)
    table.uuid('organization_id').references('id').inTable('organizations');
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });

  await knex.raw('CREATE INDEX idx_holiday_calendars_type ON holiday_calendars(calendar_type)');
  await knex.raw('CREATE INDEX idx_holiday_calendars_state ON holiday_calendars(state_code) WHERE state_code IS NOT NULL');
  await knex.raw('CREATE INDEX idx_holiday_calendars_org ON holiday_calendars(organization_id) WHERE organization_id IS NOT NULL');

  // Individual holidays
  await knex.schema.createTable('holidays', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('calendar_id').notNullable().references('id').inTable('holiday_calendars').onDelete('CASCADE');
    table.string('name', 100).notNullable();
    table.date('holiday_date').notNullable();
    table.boolean('is_recurring').defaultTo(false); // If true, repeats annually
    table.jsonb('recurrence_pattern'); // For complex patterns (e.g., "4th Thursday of November")
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });

  await knex.raw('CREATE INDEX idx_holidays_calendar ON holidays(calendar_id)');
  await knex.raw('CREATE INDEX idx_holidays_date ON holidays(holiday_date)');
  await knex.raw('CREATE INDEX idx_holidays_calendar_date ON holidays(calendar_id, holiday_date)');

  // Link calendars to branches
  await knex.schema.createTable('branch_holiday_calendars', (table) => {
    table.uuid('branch_id').notNullable().references('id').inTable('branches').onDelete('CASCADE');
    table.uuid('calendar_id').notNullable().references('id').inTable('holiday_calendars').onDelete('CASCADE');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.primary(['branch_id', 'calendar_id']);
  });

  await knex.raw('CREATE INDEX idx_branch_holiday_calendars_branch ON branch_holiday_calendars(branch_id)');
  await knex.raw('CREATE INDEX idx_branch_holiday_calendars_calendar ON branch_holiday_calendars(calendar_id)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('branch_holiday_calendars');
  await knex.schema.dropTableIfExists('holidays');
  await knex.schema.dropTableIfExists('holiday_calendars');
}
