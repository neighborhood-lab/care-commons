import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Add state_code column to organizations table
  await knex.schema.alterTable('organizations', (table) => {
    table.string('state_code', 2).notNullable().defaultTo('TX');
    table.index('state_code', 'idx_organizations_state_code');
  });

  // Add check constraint to ensure valid US state codes
  await knex.raw(`
    ALTER TABLE organizations
    ADD CONSTRAINT chk_organizations_state_code
    CHECK (state_code IN (
      'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
      'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
      'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
      'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
      'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
      'DC', 'PR', 'VI', 'GU', 'AS', 'MP'
    ))
  `);

  // Add comment for documentation
  await knex.raw(`
    COMMENT ON COLUMN organizations.state_code IS 
    'Two-letter US state code for regulatory compliance and state-specific features'
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('organizations', (table) => {
    table.dropColumn('state_code');
  });
}
