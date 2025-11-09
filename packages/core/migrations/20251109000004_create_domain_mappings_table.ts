import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create domain_mappings table for custom domain support
  await knex.schema.createTable('domain_mappings', (table) => {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

    // Organization reference
    table.uuid('organization_id').notNullable().references('id').inTable('organizations').onDelete('CASCADE');

    // Domain information
    table.string('domain', 255).notNullable().unique(); // e.g., 'care.acme.com' or 'acmecare.com'
    table.string('domain_type', 50).notNullable().defaultTo('SUBDOMAIN'); // SUBDOMAIN, CUSTOM_DOMAIN
    table.boolean('is_primary').notNullable().defaultTo(false); // One primary domain per org

    // SSL/TLS configuration
    table.string('ssl_status', 50).notNullable().defaultTo('PENDING'); // PENDING, ACTIVE, EXPIRED, ERROR
    table.text('ssl_certificate'); // PEM-encoded certificate (optional)
    table.text('ssl_private_key'); // PEM-encoded private key (optional, encrypted)
    table.timestamp('ssl_expires_at');
    table.boolean('auto_renew_ssl').notNullable().defaultTo(true);

    // DNS configuration
    table.string('dns_status', 50).notNullable().defaultTo('PENDING'); // PENDING, VERIFIED, ERROR
    table.jsonb('dns_records'); // Expected DNS records for setup instructions
    table.timestamp('dns_verified_at');
    table.timestamp('last_dns_check_at');

    // Routing configuration
    table.string('redirect_to_domain', 255); // Optional redirect to another domain
    table.boolean('force_https').notNullable().defaultTo(true);
    table.boolean('include_www').notNullable().defaultTo(false);

    // Status and metadata
    table.string('status', 50).notNullable().defaultTo('PENDING'); // PENDING, ACTIVE, ERROR, SUSPENDED
    table.text('error_message'); // Error details if setup failed
    table.jsonb('metadata'); // Additional configuration

    // Activation tracking
    table.timestamp('activated_at');
    table.uuid('activated_by').references('id').inTable('users');
    table.timestamp('suspended_at');
    table.uuid('suspended_by').references('id').inTable('users');
    table.text('suspension_reason');

    // Audit fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable().references('id').inTable('users');
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').notNullable().references('id').inTable('users');
    table.integer('version').notNullable().defaultTo(1);

    // Constraints
    table.check(`domain_type IN ('SUBDOMAIN', 'CUSTOM_DOMAIN')`);
    table.check(`ssl_status IN ('PENDING', 'ACTIVE', 'EXPIRED', 'ERROR')`);
    table.check(`dns_status IN ('PENDING', 'VERIFIED', 'ERROR')`);
    table.check(`status IN ('PENDING', 'ACTIVE', 'ERROR', 'SUSPENDED')`);
  });

  // Indexes for performance
  await knex.raw('CREATE INDEX idx_domain_mappings_org_id ON domain_mappings(organization_id)');
  await knex.raw('CREATE INDEX idx_domain_mappings_domain ON domain_mappings(domain)');
  await knex.raw('CREATE INDEX idx_domain_mappings_primary ON domain_mappings(organization_id, is_primary) WHERE is_primary = true');
  await knex.raw('CREATE INDEX idx_domain_mappings_status ON domain_mappings(status) WHERE status = \'ACTIVE\'');
  await knex.raw('CREATE INDEX idx_domain_mappings_ssl_expires ON domain_mappings(ssl_expires_at) WHERE ssl_status = \'ACTIVE\' AND auto_renew_ssl = true');

  // Trigger to automatically update updated_at
  await knex.raw(`
    CREATE TRIGGER update_domain_mappings_updated_at
      BEFORE UPDATE ON domain_mappings
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column()
  `);

  // Trigger to ensure only one primary domain per organization
  await knex.raw(`
    CREATE OR REPLACE FUNCTION check_single_primary_domain()
    RETURNS TRIGGER AS $$
    BEGIN
      IF NEW.is_primary = true THEN
        UPDATE domain_mappings
        SET is_primary = false, updated_at = NOW()
        WHERE organization_id = NEW.organization_id
          AND id != NEW.id
          AND is_primary = true;
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  await knex.raw(`
    CREATE TRIGGER enforce_single_primary_domain
      BEFORE INSERT OR UPDATE ON domain_mappings
      FOR EACH ROW
      EXECUTE FUNCTION check_single_primary_domain()
  `);

  // Comments for documentation
  await knex.raw("COMMENT ON TABLE domain_mappings IS 'Custom domain mappings for white-label multi-tenancy'");
  await knex.raw("COMMENT ON COLUMN domain_mappings.domain IS 'Fully qualified domain name (e.g., care.acme.com)'");
  await knex.raw("COMMENT ON COLUMN domain_mappings.is_primary IS 'Primary domain for this organization (only one allowed)'");
  await knex.raw("COMMENT ON COLUMN domain_mappings.ssl_status IS 'SSL certificate status: PENDING, ACTIVE, EXPIRED, ERROR'");
  await knex.raw("COMMENT ON COLUMN domain_mappings.dns_status IS 'DNS verification status: PENDING, VERIFIED, ERROR'");
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP TRIGGER IF EXISTS enforce_single_primary_domain ON domain_mappings');
  await knex.raw('DROP FUNCTION IF EXISTS check_single_primary_domain()');
  await knex.raw('DROP TRIGGER IF EXISTS update_domain_mappings_updated_at ON domain_mappings');
  await knex.schema.dropTableIfExists('domain_mappings');
}
