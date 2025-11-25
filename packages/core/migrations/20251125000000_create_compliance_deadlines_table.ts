import type { Knex } from 'knex';

/**
 * Migration: Create compliance_deadlines table
 * 
 * Stores compliance deadlines for proactive tracking and alerting.
 * Used by the Compliance Autopilot service to track credentials,
 * authorizations, care plan reviews, and other regulatory deadlines.
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('compliance_deadlines', (table) => {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    
    // Organization
    table.uuid('organization_id').notNullable().references('id').inTable('organizations');
    
    // Entity reference (caregiver, client, care plan, etc.)
    table.string('entity_type', 50).notNullable();
    table.uuid('entity_id').notNullable();
    table.string('entity_name', 255).notNullable();
    
    // Deadline details
    table.string('category', 50).notNullable();
    table.string('title', 255).notNullable();
    table.text('description').notNullable();
    
    // Dates
    table.timestamp('deadline_date').notNullable();
    table.timestamp('warning_date').notNullable();
    table.timestamp('urgent_date').notNullable();
    
    // Status and priority
    table.string('status', 50).notNullable().defaultTo('CURRENT');
    table.string('priority', 50).notNullable().defaultTo('MEDIUM');
    
    // State-specific
    table.string('state_code', 2);
    table.text('regulation');
    
    // Resolution
    table.timestamp('resolved_at');
    table.uuid('resolved_by').references('id').inTable('users');
    table.text('resolution_note');
    
    // Actions
    table.string('action_url', 500);
    table.string('action_label', 100);
    
    // Blocking behavior
    table.boolean('blocks_scheduling').notNullable().defaultTo(false);
    table.boolean('blocks_assignment').notNullable().defaultTo(false);
    
    // Notification tracking
    table.timestamp('last_notified_at');
    table.integer('notification_count').notNullable().defaultTo(0);
    
    // Metadata
    table.jsonb('metadata');
    
    // Audit fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    
    // Constraints
    table.check(`entity_type IN ('CAREGIVER', 'CLIENT', 'CARE_PLAN', 'VISIT', 'ORGANIZATION')`);
    table.check(`category IN (
      'CAREGIVER_CREDENTIAL', 'CAREGIVER_TRAINING', 'CAREGIVER_BACKGROUND_CHECK',
      'CAREGIVER_HEALTH_SCREENING', 'CLIENT_AUTHORIZATION', 'CLIENT_CARE_PLAN',
      'CLIENT_PHYSICIAN_ORDERS', 'CLIENT_ASSESSMENT', 'EVV_SUBMISSION',
      'INCIDENT_REPORT', 'RN_SUPERVISION', 'HIPAA_TRAINING', 'OTHER'
    )`);
    table.check(`status IN ('CURRENT', 'UPCOMING', 'DUE_SOON', 'OVERDUE', 'BLOCKED')`);
    table.check(`priority IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO')`);
  });

  // Indexes for performance
  await knex.raw('CREATE INDEX idx_compliance_deadlines_org ON compliance_deadlines(organization_id)');
  await knex.raw('CREATE INDEX idx_compliance_deadlines_entity ON compliance_deadlines(entity_type, entity_id)');
  await knex.raw('CREATE INDEX idx_compliance_deadlines_category ON compliance_deadlines(category)');
  await knex.raw('CREATE INDEX idx_compliance_deadlines_status ON compliance_deadlines(status)');
  await knex.raw('CREATE INDEX idx_compliance_deadlines_priority ON compliance_deadlines(priority)');
  await knex.raw('CREATE INDEX idx_compliance_deadlines_deadline ON compliance_deadlines(deadline_date)');
  
  // Partial indexes for common queries
  await knex.raw(`
    CREATE INDEX idx_compliance_deadlines_active ON compliance_deadlines(organization_id, deadline_date)
    WHERE resolved_at IS NULL
  `);
  await knex.raw(`
    CREATE INDEX idx_compliance_deadlines_overdue ON compliance_deadlines(organization_id)
    WHERE resolved_at IS NULL AND status IN ('OVERDUE', 'BLOCKED')
  `);
  await knex.raw(`
    CREATE INDEX idx_compliance_deadlines_blocking ON compliance_deadlines(entity_type, entity_id)
    WHERE resolved_at IS NULL AND (blocks_scheduling = true OR blocks_assignment = true)
  `);
  
  // Trigger to update updated_at
  await knex.raw(`
    CREATE TRIGGER update_compliance_deadlines_updated_at
      BEFORE UPDATE ON compliance_deadlines
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column()
  `);

  // Comments
  await knex.raw("COMMENT ON TABLE compliance_deadlines IS 'Tracks compliance deadlines for proactive monitoring and alerting'");
  await knex.raw("COMMENT ON COLUMN compliance_deadlines.entity_type IS 'Type of entity (CAREGIVER, CLIENT, CARE_PLAN, etc.)'");
  await knex.raw("COMMENT ON COLUMN compliance_deadlines.entity_id IS 'UUID of the related entity'");
  await knex.raw("COMMENT ON COLUMN compliance_deadlines.category IS 'Category of compliance requirement'");
  await knex.raw("COMMENT ON COLUMN compliance_deadlines.warning_date IS 'Date to start showing warnings (e.g., 30 days before)'");
  await knex.raw("COMMENT ON COLUMN compliance_deadlines.urgent_date IS 'Date for urgent alerts (e.g., 7 days before)'");
  await knex.raw("COMMENT ON COLUMN compliance_deadlines.blocks_scheduling IS 'If true, prevents scheduling when overdue'");
  await knex.raw("COMMENT ON COLUMN compliance_deadlines.blocks_assignment IS 'If true, prevents caregiver assignment when overdue'");
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP TRIGGER IF EXISTS update_compliance_deadlines_updated_at ON compliance_deadlines');
  await knex.schema.dropTableIfExists('compliance_deadlines');
}
