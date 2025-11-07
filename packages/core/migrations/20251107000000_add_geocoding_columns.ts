import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('clients', (table) => {
    // Geocoding data
    table.jsonb('coordinates').nullable(); // { lat: number, lng: number }
    table.enum('geocoding_confidence', ['high', 'medium', 'low']).nullable();
    table.timestamp('geocoded_at').nullable();
    table.boolean('geocoding_failed').defaultTo(false);
  });

  // Add index for spatial queries
  // Note: We're using a GiST index on the JSONB coordinates field
  await knex.raw(`
    CREATE INDEX idx_clients_coordinates
    ON clients USING gist ((coordinates));
  `);

  // Add index for finding clients that need geocoding
  await knex.raw(`
    CREATE INDEX idx_clients_needs_geocoding
    ON clients (geocoding_failed)
    WHERE coordinates IS NULL AND deleted_at IS NULL;
  `);

  // Comments for documentation
  await knex.raw("COMMENT ON COLUMN clients.coordinates IS 'Geocoded coordinates (JSONB: {lat, lng})'");
  await knex.raw("COMMENT ON COLUMN clients.geocoding_confidence IS 'Geocoding accuracy: high (rooftop), medium (interpolated), low (approximate)'");
  await knex.raw("COMMENT ON COLUMN clients.geocoded_at IS 'Timestamp when address was geocoded'");
  await knex.raw("COMMENT ON COLUMN clients.geocoding_failed IS 'Flag indicating geocoding failed for this address'");
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP INDEX IF EXISTS idx_clients_needs_geocoding');
  await knex.raw('DROP INDEX IF EXISTS idx_clients_coordinates');

  await knex.schema.alterTable('clients', (table) => {
    table.dropColumn('geocoding_failed');
    table.dropColumn('geocoded_at');
    table.dropColumn('geocoding_confidence');
    table.dropColumn('coordinates');
  });
}
