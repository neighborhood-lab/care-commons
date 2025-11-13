import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create incidents table for incident reporting
  await knex.schema.createTable('incidents', (table) => {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

    // Organization and client references
    table.uuid('organization_id').notNullable().references('id').inTable('organizations').onDelete('CASCADE');
    table.uuid('client_id').notNullable().references('id').inTable('clients').onDelete('CASCADE');
    table.uuid('reported_by').notNullable().references('id').inTable('users');

    // Incident classification
    table.enum('incident_type', [
      'FALL',
      'MEDICATION_ERROR',
      'INJURY',
      'ABUSE_ALLEGATION',
      'NEGLECT_ALLEGATION',
      'EXPLOITATION_ALLEGATION',
      'EQUIPMENT_FAILURE',
      'EMERGENCY_HOSPITALIZATION',
      'DEATH',
      'ELOPEMENT',
      'BEHAVIORAL_INCIDENT',
      'INFECTION',
      'PRESSURE_INJURY',
      'CLIENT_REFUSAL',
      'OTHER'
    ]).notNullable();
    table.enum('severity', ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).notNullable();
    table.enum('status', ['REPORTED', 'UNDER_REVIEW', 'INVESTIGATION_REQUIRED', 'RESOLVED', 'CLOSED']).notNullable().defaultTo('REPORTED');

    // When and where
    table.timestamp('occurred_at').notNullable();
    table.timestamp('discovered_at').notNullable();
    table.string('location', 200).notNullable();

    // What happened
    table.text('description').notNullable();
    table.text('immediate_action').notNullable();

    // People involved
    table.specificType('witness_ids', 'UUID[]').defaultTo('{}');
    table.specificType('involved_staff_ids', 'UUID[]').defaultTo('{}');

    // Injury details
    table.enum('injury_severity', ['NONE', 'MINOR', 'MODERATE', 'SEVERE', 'FATAL']);
    table.text('injury_description');
    table.boolean('medical_attention_required');
    table.text('medical_attention_provided');

    // Emergency services
    table.boolean('emergency_services_contacted');
    table.text('emergency_services_details');

    // Family notification
    table.boolean('family_notified');
    table.timestamp('family_notified_at');
    table.uuid('family_notified_by').references('id').inTable('users');
    table.text('family_notification_notes');

    // Physician notification
    table.boolean('physician_notified');
    table.timestamp('physician_notified_at');
    table.uuid('physician_notified_by').references('id').inTable('users');
    table.text('physician_orders');

    // State/regulatory reporting
    table.boolean('state_reporting_required');
    table.timestamp('state_reported_at');
    table.uuid('state_reported_by').references('id').inTable('users');
    table.string('state_report_number', 100);
    table.string('state_agency', 200);

    // Investigation
    table.boolean('investigation_required');
    table.timestamp('investigation_started_at');
    table.timestamp('investigation_completed_at');
    table.text('investigation_findings');

    // Prevention
    table.text('preventative_measures');
    table.text('policy_changes_recommended');

    // Follow-up
    table.boolean('follow_up_required');
    table.timestamp('follow_up_completed_at');
    table.text('follow_up_notes');

    // Attachments
    table.specificType('attachment_urls', 'TEXT[]').defaultTo('{}');

    // Resolution
    table.text('resolution_notes');
    table.timestamp('resolved_at');
    table.uuid('resolved_by').references('id').inTable('users');
    table.timestamp('closed_at');
    table.uuid('closed_by').references('id').inTable('users');

    // Audit fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable().references('id').inTable('users');
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').notNullable().references('id').inTable('users');
    table.integer('version').notNullable().defaultTo(1);
  });

  // Indexes for performance
  await knex.raw('CREATE INDEX idx_incidents_org_id ON incidents(organization_id)');
  await knex.raw('CREATE INDEX idx_incidents_client_id ON incidents(client_id)');
  await knex.raw('CREATE INDEX idx_incidents_type ON incidents(incident_type)');
  await knex.raw('CREATE INDEX idx_incidents_severity ON incidents(severity)');
  await knex.raw('CREATE INDEX idx_incidents_status ON incidents(status)');
  await knex.raw('CREATE INDEX idx_incidents_occurred_at ON incidents(occurred_at DESC)');
  await knex.raw('CREATE INDEX idx_incidents_state_reporting ON incidents(state_reporting_required) WHERE state_reporting_required = true');
  await knex.raw('CREATE INDEX idx_incidents_investigation ON incidents(investigation_required) WHERE investigation_required = true');
  await knex.raw('CREATE INDEX idx_incidents_reported_by ON incidents(reported_by)');

  // Trigger to automatically update updated_at
  await knex.raw(`
    CREATE TRIGGER update_incidents_updated_at
      BEFORE UPDATE ON incidents
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column()
  `);

  // Comments for documentation
  await knex.raw("COMMENT ON TABLE incidents IS 'Incident reports for home healthcare compliance and safety tracking'");
  await knex.raw("COMMENT ON COLUMN incidents.occurred_at IS 'Timestamp when the incident actually occurred'");
  await knex.raw("COMMENT ON COLUMN incidents.discovered_at IS 'Timestamp when the incident was discovered (may differ from occurrence)'");
  await knex.raw("COMMENT ON COLUMN incidents.state_reporting_required IS 'Whether this incident must be reported to state regulatory agency'");
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP TRIGGER IF EXISTS update_incidents_updated_at ON incidents');
  await knex.schema.dropTableIfExists('incidents');
}
