/**
 * Migration: Create visit_note_templates table
 *
 * Templates for common visit note scenarios to improve consistency,
 * save time, and ensure compliance requirements are met.
 *
 * FEATURES:
 * - Pre-defined templates for common scenarios (fall incident, medication refusal, etc.)
 * - Rich text content with placeholders
 * - Organization and branch-level templates
 * - Version tracking for template evolution
 * - Category-based organization
 */

import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('visit_note_templates', (table) => {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    // Organization scope
    table.uuid('organization_id').notNullable().references('id').inTable('organizations').onDelete('CASCADE');
    table.uuid('branch_id').nullable().references('id').inTable('branches').onDelete('CASCADE'); // Null = org-wide

    // Template identity
    table.string('name', 200).notNullable();
    table.text('description').nullable();
    table.enum('category', [
      'GENERAL',           // General visit notes
      'INCIDENT',          // Incident reports (falls, injuries, etc.)
      'MEDICATION',        // Medication-related notes
      'BEHAVIORAL',        // Behavioral observations
      'SAFETY',            // Safety concerns
      'REFUSAL',           // Service refusal
      'EMERGENCY',         // Emergency situations
      'ASSESSMENT',        // Client assessment
      'ADL',               // Activities of Daily Living
      'COMMUNICATION',     // Communication with family/physicians
      'OTHER'
    ]).notNullable().defaultTo('GENERAL');

    // Content (with placeholders like {{client_name}}, {{caregiver_name}}, etc.)
    table.text('template_text').notNullable();
    table.text('template_html').nullable(); // Rich text version with formatting

    // Structured prompts (JSONB array of prompt objects)
    // Example: [{ "label": "What activities were performed?", "type": "textarea", "required": true }]
    table.jsonb('prompts').nullable().defaultTo('[]');

    // Pre-filled activities and checkboxes
    table.jsonb('default_activities').nullable().defaultTo('[]'); // Array of activity strings

    // Requirements
    table.boolean('requires_signature').notNullable().defaultTo(false);
    table.boolean('requires_incident_flag').notNullable().defaultTo(false);
    table.boolean('requires_supervisor_review').notNullable().defaultTo(false);

    // Usage tracking
    table.integer('usage_count').notNullable().defaultTo(0);
    table.timestamp('last_used_at').nullable();

    // Status
    table.boolean('is_active').notNullable().defaultTo(true);
    table.boolean('is_system_template').notNullable().defaultTo(false); // System vs custom templates
    table.integer('sort_order').notNullable().defaultTo(0); // Display order

    // Version tracking
    table.integer('version').notNullable().defaultTo(1);
    table.uuid('previous_version_id').nullable().references('id').inTable('visit_note_templates').onDelete('SET NULL');

    // Soft delete
    table.timestamp('deleted_at').nullable();
    table.uuid('deleted_by').nullable();

    // Timestamps
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();
    table.uuid('created_by').notNullable().references('id').inTable('users').onDelete('RESTRICT');
    table.uuid('updated_by').notNullable().references('id').inTable('users').onDelete('RESTRICT');

    // Indexes
    table.index('organization_id');
    table.index('branch_id');
    table.index('category');
    table.index(['is_active', 'organization_id']); // Active templates for org
    table.index('sort_order');
    table.index('deleted_at');
  });

  // Create updated_at trigger
  await knex.raw(`
    CREATE TRIGGER update_visit_note_templates_updated_at
    BEFORE UPDATE ON visit_note_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  `);

  // Add foreign key constraint from visit_notes to visit_note_templates
  await knex.raw(`
    ALTER TABLE visit_notes
    ADD CONSTRAINT fk_visit_notes_template
    FOREIGN KEY (template_id)
    REFERENCES visit_note_templates(id)
    ON DELETE SET NULL;
  `);

  // Add comments for documentation
  await knex.raw(`
    COMMENT ON TABLE visit_note_templates IS
    'Templates for common visit note scenarios. Improves consistency and saves time for caregivers.';
  `);

  await knex.raw(`
    COMMENT ON COLUMN visit_note_templates.template_text IS
    'Template content with placeholders like {{client_name}}, {{caregiver_name}}, {{date}}, {{time}}.';
  `);

  await knex.raw(`
    COMMENT ON COLUMN visit_note_templates.prompts IS
    'Structured prompts to guide caregiver input. Each prompt has label, type (text/textarea/select), and required flag.';
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('ALTER TABLE visit_notes DROP CONSTRAINT IF EXISTS fk_visit_notes_template');
  await knex.raw('DROP TRIGGER IF EXISTS update_visit_note_templates_updated_at ON visit_note_templates');
  await knex.schema.dropTableIfExists('visit_note_templates');
}
