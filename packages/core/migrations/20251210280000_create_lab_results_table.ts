/**
 * Create lab results table
 *
 * Tracks lab results for clients over time, supporting trend analysis
 * and clinical decision making during home health visits.
 */

import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Lab result categories for organization
  await knex.schema.createTable('lab_result_types', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('organization_id').notNullable().references('id').inTable('organizations');

    table.string('code', 50).notNullable(); // LOINC code or internal code
    table.string('name', 200).notNullable(); // e.g., "Hemoglobin A1C"
    table.string('short_name', 50); // e.g., "A1C"
    table.string('category', 100).notNullable(); // e.g., "Diabetes", "Kidney Function", "Cardiac"
    table.string('unit', 50); // e.g., "%", "mg/dL", "mL/min"

    // Reference ranges
    table.decimal('normal_min', 10, 4);
    table.decimal('normal_max', 10, 4);
    table.decimal('critical_low', 10, 4);
    table.decimal('critical_high', 10, 4);

    // Display settings
    table.integer('display_order').defaultTo(0);
    table.boolean('is_active').notNullable().defaultTo(true);

    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    // Unique code per organization
    table.unique(['organization_id', 'code']);
    table.index(['organization_id', 'category']);
  });

  // Actual lab results for clients
  await knex.schema.createTable('lab_results', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('organization_id').notNullable().references('id').inTable('organizations');
    table.uuid('branch_id').references('id').inTable('branches');
    table.uuid('client_id').notNullable().references('id').inTable('clients');

    // Lab result details
    table.uuid('lab_type_id').references('id').inTable('lab_result_types');
    table.string('lab_name', 200).notNullable(); // Name of the test
    table.string('lab_code', 50); // LOINC or internal code

    // Result value
    table.decimal('numeric_value', 12, 4); // For numeric results
    table.string('text_value', 500); // For text results (positive/negative, etc.)
    table.string('unit', 50);

    // Reference ranges at time of result
    table.decimal('reference_low', 10, 4);
    table.decimal('reference_high', 10, 4);

    // Interpretation
    table
      .enum('interpretation', ['NORMAL', 'LOW', 'HIGH', 'CRITICAL_LOW', 'CRITICAL_HIGH', 'ABNORMAL', 'UNKNOWN'])
      .notNullable()
      .defaultTo('UNKNOWN');
    table.text('interpretation_notes');

    // Source information
    table.date('collection_date').notNullable();
    table.date('result_date');
    table
      .enum('source', ['HOSPITAL', 'LAB', 'PHYSICIAN_OFFICE', 'HOME_TEST', 'OTHER'])
      .notNullable()
      .defaultTo('LAB');
    table.string('source_name', 200); // Name of lab/facility
    table.string('ordering_physician', 200);
    table.text('specimen_type'); // Blood, urine, etc.

    // Document tracking
    table.uuid('entered_by').notNullable().references('id').inTable('users');
    table.string('entered_by_name', 200).notNullable();
    table.timestamp('entered_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('visit_id').references('id').inTable('visits'); // If entered during visit

    // Review/verification
    table.boolean('is_verified').notNullable().defaultTo(false);
    table.uuid('verified_by').references('id').inTable('users');
    table.string('verified_by_name', 200);
    table.timestamp('verified_at');

    // Alerts and notifications
    table.boolean('requires_notification').notNullable().defaultTo(false);
    table.boolean('physician_notified').defaultTo(false);
    table.timestamp('physician_notified_at');
    table.text('notification_notes');

    // Clinical notes
    table.text('clinical_notes');

    // Metadata
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.boolean('is_deleted').notNullable().defaultTo(false);

    // Indexes
    table.index(['organization_id', 'client_id']);
    table.index(['client_id', 'lab_name', 'collection_date']);
    table.index(['client_id', 'collection_date']);
    table.index(['interpretation', 'organization_id']);
    table.index(['requires_notification', 'physician_notified']);
  });

  // Seed common lab result types
  await knex('lab_result_types').insert([
    // Diabetes
    { code: 'HBA1C', name: 'Hemoglobin A1C', short_name: 'A1C', category: 'Diabetes', unit: '%', normal_min: 4.0, normal_max: 5.6, critical_high: 10.0, organization_id: knex.raw("(SELECT id FROM organizations LIMIT 1)"), display_order: 1 },
    { code: 'GLU_FASTING', name: 'Fasting Glucose', short_name: 'FBG', category: 'Diabetes', unit: 'mg/dL', normal_min: 70, normal_max: 100, critical_low: 50, critical_high: 400, organization_id: knex.raw("(SELECT id FROM organizations LIMIT 1)"), display_order: 2 },
    // Kidney Function
    { code: 'BUN', name: 'Blood Urea Nitrogen', short_name: 'BUN', category: 'Kidney Function', unit: 'mg/dL', normal_min: 7, normal_max: 20, critical_high: 100, organization_id: knex.raw("(SELECT id FROM organizations LIMIT 1)"), display_order: 10 },
    { code: 'CREATININE', name: 'Creatinine', short_name: 'Cr', category: 'Kidney Function', unit: 'mg/dL', normal_min: 0.7, normal_max: 1.3, critical_high: 10, organization_id: knex.raw("(SELECT id FROM organizations LIMIT 1)"), display_order: 11 },
    { code: 'EGFR', name: 'Estimated GFR', short_name: 'eGFR', category: 'Kidney Function', unit: 'mL/min/1.73m2', normal_min: 90, normal_max: 120, critical_low: 15, organization_id: knex.raw("(SELECT id FROM organizations LIMIT 1)"), display_order: 12 },
    // Cardiac
    { code: 'BNP', name: 'B-type Natriuretic Peptide', short_name: 'BNP', category: 'Cardiac', unit: 'pg/mL', normal_min: 0, normal_max: 100, critical_high: 900, organization_id: knex.raw("(SELECT id FROM organizations LIMIT 1)"), display_order: 20 },
    { code: 'TROPONIN', name: 'Troponin I', short_name: 'TnI', category: 'Cardiac', unit: 'ng/mL', normal_min: 0, normal_max: 0.04, critical_high: 0.5, organization_id: knex.raw("(SELECT id FROM organizations LIMIT 1)"), display_order: 21 },
    // Hematology
    { code: 'HGB', name: 'Hemoglobin', short_name: 'Hgb', category: 'Hematology', unit: 'g/dL', normal_min: 12, normal_max: 17.5, critical_low: 7, critical_high: 20, organization_id: knex.raw("(SELECT id FROM organizations LIMIT 1)"), display_order: 30 },
    { code: 'WBC', name: 'White Blood Cell Count', short_name: 'WBC', category: 'Hematology', unit: 'K/uL', normal_min: 4.5, normal_max: 11, critical_low: 2, critical_high: 30, organization_id: knex.raw("(SELECT id FROM organizations LIMIT 1)"), display_order: 31 },
    { code: 'PLT', name: 'Platelet Count', short_name: 'Plt', category: 'Hematology', unit: 'K/uL', normal_min: 150, normal_max: 400, critical_low: 50, critical_high: 1000, organization_id: knex.raw("(SELECT id FROM organizations LIMIT 1)"), display_order: 32 },
    // Coagulation
    { code: 'INR', name: 'International Normalized Ratio', short_name: 'INR', category: 'Coagulation', unit: '', normal_min: 0.8, normal_max: 1.2, critical_high: 5, organization_id: knex.raw("(SELECT id FROM organizations LIMIT 1)"), display_order: 40 },
    { code: 'PT', name: 'Prothrombin Time', short_name: 'PT', category: 'Coagulation', unit: 'seconds', normal_min: 11, normal_max: 13.5, critical_high: 30, organization_id: knex.raw("(SELECT id FROM organizations LIMIT 1)"), display_order: 41 },
    // Electrolytes
    { code: 'NA', name: 'Sodium', short_name: 'Na', category: 'Electrolytes', unit: 'mEq/L', normal_min: 136, normal_max: 145, critical_low: 120, critical_high: 160, organization_id: knex.raw("(SELECT id FROM organizations LIMIT 1)"), display_order: 50 },
    { code: 'K', name: 'Potassium', short_name: 'K', category: 'Electrolytes', unit: 'mEq/L', normal_min: 3.5, normal_max: 5.0, critical_low: 2.5, critical_high: 6.5, organization_id: knex.raw("(SELECT id FROM organizations LIMIT 1)"), display_order: 51 },
  ]);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('lab_results');
  await knex.schema.dropTableIfExists('lab_result_types');
}
