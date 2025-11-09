import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create organization_branding table for white-label customization
  await knex.schema.createTable('organization_branding', (table) => {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

    // Organization reference (one-to-one relationship)
    table.uuid('organization_id').notNullable().unique().references('id').inTable('organizations').onDelete('CASCADE');

    // Logo assets
    table.text('logo_url'); // Main logo
    table.text('logo_dark_url'); // Dark mode logo
    table.text('favicon_url'); // Browser favicon
    table.text('logo_square_url'); // Square logo for mobile apps

    // Brand colors (hex format)
    table.string('primary_color', 7).defaultTo('#0ea5e9'); // Default sky-500
    table.string('secondary_color', 7);
    table.string('accent_color', 7);
    table.string('success_color', 7).defaultTo('#10b981');
    table.string('warning_color', 7).defaultTo('#f59e0b');
    table.string('error_color', 7).defaultTo('#ef4444');
    table.string('info_color', 7).defaultTo('#3b82f6');

    // Typography
    table.string('font_family', 100).defaultTo('Inter, system-ui, sans-serif');
    table.string('heading_font_family', 100);

    // Custom branding
    table.string('brand_name', 200); // Display name (can differ from legal name)
    table.text('tagline'); // Brand tagline/slogan
    table.text('custom_css'); // Additional CSS overrides

    // Application customization
    table.jsonb('theme_overrides'); // Additional theme customization as JSON
    table.jsonb('component_overrides'); // Component-specific overrides

    // Legal and support
    table.text('terms_of_service_url');
    table.text('privacy_policy_url');
    table.text('support_email');
    table.text('support_phone');
    table.text('support_url');

    // Email branding
    table.text('email_header_html'); // Custom email header
    table.text('email_footer_html'); // Custom email footer
    table.string('email_from_name', 200);

    // Status
    table.boolean('is_active').notNullable().defaultTo(true);

    // Audit fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable().references('id').inTable('users');
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').notNullable().references('id').inTable('users');
    table.integer('version').notNullable().defaultTo(1);
  });

  // Indexes for performance
  await knex.raw('CREATE INDEX idx_organization_branding_org_id ON organization_branding(organization_id)');
  await knex.raw('CREATE INDEX idx_organization_branding_is_active ON organization_branding(is_active) WHERE is_active = true');

  // Trigger to automatically update updated_at and version
  await knex.raw(`
    CREATE TRIGGER update_organization_branding_updated_at
      BEFORE UPDATE ON organization_branding
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column()
  `);

  // Comments for documentation
  await knex.raw("COMMENT ON TABLE organization_branding IS 'White-label branding configuration for organizations'");
  await knex.raw("COMMENT ON COLUMN organization_branding.primary_color IS 'Primary brand color in hex format (e.g., #0ea5e9)'");
  await knex.raw("COMMENT ON COLUMN organization_branding.custom_css IS 'Custom CSS for additional styling overrides'");
  await knex.raw("COMMENT ON COLUMN organization_branding.theme_overrides IS 'JSON object with additional theme customization'");
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP TRIGGER IF EXISTS update_organization_branding_updated_at ON organization_branding');
  await knex.schema.dropTableIfExists('organization_branding');
}
