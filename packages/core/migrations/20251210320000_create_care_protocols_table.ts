/**
 * Create care protocols tables
 *
 * Library of evidence-based care protocols for home health.
 * Includes infection control, wound care, cardiac, respiratory, and other clinical protocols.
 * Supports protocol compliance tracking and documentation during visits.
 */

import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Protocol categories
  await knex.schema.createTable('protocol_categories', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('organization_id').notNullable().references('id').inTable('organizations');

    table.string('name', 200).notNullable();
    table.text('description');
    table.string('icon', 50); // Icon identifier for UI
    table.string('color', 20); // Color code for UI

    table.boolean('is_active').notNullable().defaultTo(true);
    table.integer('display_order').defaultTo(0);

    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    table.index(['organization_id', 'is_active']);
  });

  // Care protocols library
  await knex.schema.createTable('care_protocols', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('organization_id').notNullable().references('id').inTable('organizations');
    table.uuid('category_id').references('id').inTable('protocol_categories');

    table.string('name', 200).notNullable();
    table.string('code', 50); // Short code like "IC-001", "WC-001"
    table.text('description');
    table
      .enum('protocol_type', [
        'INFECTION_CONTROL',
        'WOUND_CARE',
        'FALL_PREVENTION',
        'MEDICATION_SAFETY',
        'CARDIAC',
        'RESPIRATORY',
        'DIABETES',
        'PAIN_MANAGEMENT',
        'SKIN_CARE',
        'NUTRITION',
        'MOBILITY',
        'COGNITIVE',
        'SAFETY',
        'EMERGENCY',
        'END_OF_LIFE',
        'GENERAL',
        'OTHER',
      ])
      .notNullable();

    // Protocol content
    table.text('purpose'); // Why this protocol exists
    table.text('scope'); // When/where it applies
    table.text('indications'); // When to use this protocol
    table.text('contraindications'); // When NOT to use
    table.jsonb('steps'); // Array of step objects with instructions
    table.jsonb('equipment_needed'); // Array of supplies/equipment
    table.text('precautions'); // Safety precautions
    table.text('expected_outcomes'); // What success looks like
    table.jsonb('documentation_requirements'); // What must be documented

    // References
    table.text('evidence_base'); // Research/evidence supporting protocol
    table.jsonb('references'); // Array of reference citations
    table.string('source_organization', 200); // e.g., "CDC", "AHRQ", "CMS"
    table.string('external_url', 500); // Link to external resource

    // Version control
    table.string('version', 20).defaultTo('1.0');
    table.date('effective_date');
    table.date('review_date'); // When protocol should be reviewed
    table.date('expiration_date');
    table.uuid('supersedes_id').references('id').inTable('care_protocols');

    // Approval
    table.boolean('is_approved').notNullable().defaultTo(false);
    table.uuid('approved_by').references('id').inTable('users');
    table.string('approved_by_name', 200);
    table.timestamp('approved_at');

    // Metadata
    table.boolean('is_mandatory').notNullable().defaultTo(false); // Required for certain conditions
    table
      .enum('priority', ['HIGH', 'MEDIUM', 'LOW'])
      .notNullable()
      .defaultTo('MEDIUM');
    table.jsonb('applicable_conditions'); // ICD-10 codes or conditions
    table.jsonb('tags'); // Search tags

    table.uuid('created_by').references('id').inTable('users');
    table.string('created_by_name', 200);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.boolean('is_active').notNullable().defaultTo(true);
    table.boolean('is_deleted').notNullable().defaultTo(false);

    // Indexes
    table.index(['organization_id', 'protocol_type']);
    table.index(['organization_id', 'category_id']);
    table.index(['organization_id', 'is_active']);
    table.index(['code']);
  });

  // Protocol compliance tracking
  await knex.schema.createTable('protocol_compliance', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('organization_id').notNullable().references('id').inTable('organizations');
    table.uuid('protocol_id').notNullable().references('id').inTable('care_protocols');
    table.uuid('client_id').notNullable().references('id').inTable('clients');
    table.uuid('visit_id').references('id').inTable('visits');

    // Compliance details
    table
      .enum('compliance_status', [
        'FULLY_COMPLIANT',
        'PARTIALLY_COMPLIANT',
        'NON_COMPLIANT',
        'NOT_APPLICABLE',
        'DEVIATION_DOCUMENTED',
      ])
      .notNullable();
    table.jsonb('steps_completed'); // Which steps were completed
    table.text('compliance_notes');

    // Deviation tracking
    table.boolean('has_deviation').notNullable().defaultTo(false);
    table.text('deviation_reason'); // Why protocol wasn't followed exactly
    table.text('deviation_outcome'); // Result of deviation
    table.boolean('deviation_approved').defaultTo(false);
    table.uuid('deviation_approved_by').references('id').inTable('users');
    table.string('deviation_approved_by_name', 200);

    // Documentation
    table.uuid('documented_by').notNullable().references('id').inTable('users');
    table.string('documented_by_name', 200).notNullable();
    table.string('documented_by_credentials', 50);
    table.timestamp('documented_at').notNullable();

    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.boolean('is_deleted').notNullable().defaultTo(false);

    // Indexes
    table.index(['organization_id', 'protocol_id']);
    table.index(['client_id', 'protocol_id']);
    table.index(['visit_id']);
    table.index(['compliance_status']);
    table.index(['documented_at']);
  });

  // Seed default protocol categories
  await knex('protocol_categories').insert([
    {
      id: knex.raw('gen_random_uuid()'),
      organization_id: knex.raw("(SELECT id FROM organizations LIMIT 1)"),
      name: 'Infection Control',
      description: 'Protocols for preventing and managing infections',
      icon: 'shield',
      color: '#dc2626',
      display_order: 1,
    },
    {
      id: knex.raw('gen_random_uuid()'),
      organization_id: knex.raw("(SELECT id FROM organizations LIMIT 1)"),
      name: 'Wound Care',
      description: 'Protocols for wound assessment and management',
      icon: 'bandage',
      color: '#ea580c',
      display_order: 2,
    },
    {
      id: knex.raw('gen_random_uuid()'),
      organization_id: knex.raw("(SELECT id FROM organizations LIMIT 1)"),
      name: 'Fall Prevention',
      description: 'Protocols for preventing patient falls',
      icon: 'alert-triangle',
      color: '#ca8a04',
      display_order: 3,
    },
    {
      id: knex.raw('gen_random_uuid()'),
      organization_id: knex.raw("(SELECT id FROM organizations LIMIT 1)"),
      name: 'Cardiac Care',
      description: 'Protocols for cardiac patients',
      icon: 'heart',
      color: '#dc2626',
      display_order: 4,
    },
    {
      id: knex.raw('gen_random_uuid()'),
      organization_id: knex.raw("(SELECT id FROM organizations LIMIT 1)"),
      name: 'Respiratory Care',
      description: 'Protocols for respiratory conditions',
      icon: 'wind',
      color: '#0284c7',
      display_order: 5,
    },
    {
      id: knex.raw('gen_random_uuid()'),
      organization_id: knex.raw("(SELECT id FROM organizations LIMIT 1)"),
      name: 'Diabetes Management',
      description: 'Protocols for diabetic patients',
      icon: 'droplet',
      color: '#7c3aed',
      display_order: 6,
    },
    {
      id: knex.raw('gen_random_uuid()'),
      organization_id: knex.raw("(SELECT id FROM organizations LIMIT 1)"),
      name: 'Medication Safety',
      description: 'Protocols for safe medication administration',
      icon: 'pill',
      color: '#059669',
      display_order: 7,
    },
    {
      id: knex.raw('gen_random_uuid()'),
      organization_id: knex.raw("(SELECT id FROM organizations LIMIT 1)"),
      name: 'Emergency Procedures',
      description: 'Emergency response protocols',
      icon: 'siren',
      color: '#dc2626',
      display_order: 8,
    },
  ]);

  // Seed infection control protocols
  await knex('care_protocols').insert([
    {
      id: knex.raw('gen_random_uuid()'),
      organization_id: knex.raw("(SELECT id FROM organizations LIMIT 1)"),
      name: 'Hand Hygiene Protocol',
      code: 'IC-001',
      description: 'Standard hand hygiene procedures for infection prevention',
      protocol_type: 'INFECTION_CONTROL',
      purpose: 'To prevent transmission of infectious agents through proper hand hygiene',
      scope: 'All patient care activities and interactions',
      indications: 'Before and after patient contact, before aseptic procedures, after body fluid exposure, after touching patient surroundings',
      steps: JSON.stringify([
        { step: 1, title: 'Wet hands', instruction: 'Wet hands with clean, running water', duration: '5 seconds' },
        { step: 2, title: 'Apply soap', instruction: 'Apply enough soap to cover all hand surfaces', duration: '2 seconds' },
        { step: 3, title: 'Rub hands', instruction: 'Rub hands palm to palm, then interlace fingers', duration: '20 seconds' },
        { step: 4, title: 'Clean backs', instruction: 'Rub backs of hands and between fingers', duration: '10 seconds' },
        { step: 5, title: 'Clean thumbs', instruction: 'Clasp thumbs and rotate', duration: '5 seconds' },
        { step: 6, title: 'Rinse', instruction: 'Rinse hands thoroughly under running water', duration: '10 seconds' },
        { step: 7, title: 'Dry', instruction: 'Dry hands with single-use towel', duration: '5 seconds' },
      ]),
      equipment_needed: JSON.stringify(['Soap', 'Clean running water', 'Single-use towels', 'Hand sanitizer (60%+ alcohol)']),
      precautions: 'Use hand sanitizer when soap and water unavailable. Wash with soap if hands visibly soiled.',
      expected_outcomes: 'Clean hands free of transient microorganisms',
      evidence_base: 'WHO Guidelines on Hand Hygiene in Health Care, CDC Guidelines',
      source_organization: 'CDC',
      version: '1.0',
      is_approved: true,
      is_mandatory: true,
      priority: 'HIGH',
      tags: JSON.stringify(['hand hygiene', 'infection control', 'prevention']),
    },
    {
      id: knex.raw('gen_random_uuid()'),
      organization_id: knex.raw("(SELECT id FROM organizations LIMIT 1)"),
      name: 'Standard Precautions Protocol',
      code: 'IC-002',
      description: 'Universal precautions for all patient care',
      protocol_type: 'INFECTION_CONTROL',
      purpose: 'To prevent transmission of infectious agents during patient care',
      scope: 'All patient interactions regardless of diagnosis',
      indications: 'All patient care activities',
      steps: JSON.stringify([
        { step: 1, title: 'Hand Hygiene', instruction: 'Perform hand hygiene before patient contact' },
        { step: 2, title: 'PPE Assessment', instruction: 'Assess need for PPE based on anticipated exposure' },
        { step: 3, title: 'Don PPE', instruction: 'Apply appropriate PPE in correct order: gown, mask, goggles, gloves' },
        { step: 4, title: 'Patient Care', instruction: 'Provide care using proper techniques' },
        { step: 5, title: 'Doff PPE', instruction: 'Remove PPE in reverse order, performing hand hygiene between steps' },
        { step: 6, title: 'Final Hand Hygiene', instruction: 'Perform thorough hand hygiene after removing all PPE' },
      ]),
      equipment_needed: JSON.stringify(['Gloves', 'Gowns', 'Masks', 'Eye protection', 'Hand sanitizer']),
      precautions: 'Consider all blood and body fluids potentially infectious',
      expected_outcomes: 'Prevention of disease transmission between patients and caregivers',
      evidence_base: 'CDC Standard Precautions Guidelines',
      source_organization: 'CDC',
      version: '1.0',
      is_approved: true,
      is_mandatory: true,
      priority: 'HIGH',
      tags: JSON.stringify(['standard precautions', 'PPE', 'infection control']),
    },
    {
      id: knex.raw('gen_random_uuid()'),
      organization_id: knex.raw("(SELECT id FROM organizations LIMIT 1)"),
      name: 'MRSA Precautions Protocol',
      code: 'IC-003',
      description: 'Contact precautions for MRSA-positive patients',
      protocol_type: 'INFECTION_CONTROL',
      purpose: 'To prevent transmission of MRSA to other patients and caregivers',
      scope: 'Patients with known or suspected MRSA colonization or infection',
      indications: 'MRSA-positive culture, history of MRSA, contact with MRSA-positive patient',
      contraindications: 'None',
      steps: JSON.stringify([
        { step: 1, title: 'Review patient status', instruction: 'Confirm MRSA status and location of colonization/infection' },
        { step: 2, title: 'Hand Hygiene', instruction: 'Perform thorough hand hygiene before entering patient area' },
        { step: 3, title: 'Don PPE', instruction: 'Put on gown and gloves before patient contact' },
        { step: 4, title: 'Dedicated equipment', instruction: 'Use dedicated or disposable equipment when possible' },
        { step: 5, title: 'Patient care', instruction: 'Limit movement and transport of patient' },
        { step: 6, title: 'Remove PPE', instruction: 'Remove gown and gloves before leaving patient area' },
        { step: 7, title: 'Hand Hygiene', instruction: 'Perform hand hygiene immediately after removing PPE' },
        { step: 8, title: 'Clean equipment', instruction: 'Clean and disinfect any shared equipment' },
      ]),
      equipment_needed: JSON.stringify(['Isolation gowns', 'Gloves', 'Hand sanitizer', 'EPA-registered disinfectant']),
      precautions: 'Do not share equipment between patients. Clean high-touch surfaces frequently.',
      expected_outcomes: 'Prevention of MRSA transmission',
      evidence_base: 'CDC MRSA Prevention Guidelines',
      source_organization: 'CDC',
      version: '1.0',
      is_approved: true,
      is_mandatory: false,
      priority: 'HIGH',
      tags: JSON.stringify(['MRSA', 'contact precautions', 'infection control', 'multidrug resistant']),
    },
    {
      id: knex.raw('gen_random_uuid()'),
      organization_id: knex.raw("(SELECT id FROM organizations LIMIT 1)"),
      name: 'Wound Care Sterile Technique',
      code: 'WC-001',
      description: 'Sterile wound care procedure protocol',
      protocol_type: 'WOUND_CARE',
      purpose: 'To promote wound healing and prevent infection during wound care',
      scope: 'Surgical wounds, chronic wounds, pressure injuries',
      indications: 'Open wounds requiring dressing changes',
      steps: JSON.stringify([
        { step: 1, title: 'Prepare environment', instruction: 'Create clean work area, gather supplies' },
        { step: 2, title: 'Hand Hygiene', instruction: 'Perform thorough hand hygiene' },
        { step: 3, title: 'Don clean gloves', instruction: 'Put on clean gloves to remove old dressing' },
        { step: 4, title: 'Remove old dressing', instruction: 'Carefully remove and dispose of old dressing' },
        { step: 5, title: 'Assess wound', instruction: 'Document wound appearance, size, drainage' },
        { step: 6, title: 'Change gloves', instruction: 'Remove dirty gloves, perform hand hygiene, don sterile gloves' },
        { step: 7, title: 'Clean wound', instruction: 'Clean wound per physician orders using sterile technique' },
        { step: 8, title: 'Apply dressing', instruction: 'Apply appropriate dressing using sterile technique' },
        { step: 9, title: 'Secure dressing', instruction: 'Secure dressing appropriately' },
        { step: 10, title: 'Documentation', instruction: 'Document wound status and care provided' },
      ]),
      equipment_needed: JSON.stringify(['Sterile gloves', 'Clean gloves', 'Wound cleanser', 'Sterile dressings', 'Tape', 'Wound measurement tool']),
      precautions: 'Maintain sterile field. Do not contaminate sterile supplies.',
      expected_outcomes: 'Wound healing progression without signs of infection',
      evidence_base: 'WOCN Guidelines, AHRQ Pressure Ulcer Prevention',
      source_organization: 'WOCN',
      version: '1.0',
      is_approved: true,
      is_mandatory: false,
      priority: 'HIGH',
      tags: JSON.stringify(['wound care', 'sterile technique', 'dressing change']),
    },
    {
      id: knex.raw('gen_random_uuid()'),
      organization_id: knex.raw("(SELECT id FROM organizations LIMIT 1)"),
      name: 'Fall Prevention Assessment',
      code: 'FP-001',
      description: 'Comprehensive fall risk assessment and prevention protocol',
      protocol_type: 'FALL_PREVENTION',
      purpose: 'To identify patients at risk for falls and implement prevention strategies',
      scope: 'All home health patients',
      indications: 'All patient admissions and reassessments',
      steps: JSON.stringify([
        { step: 1, title: 'Review history', instruction: 'Review fall history and risk factors' },
        { step: 2, title: 'Medication review', instruction: 'Identify medications that increase fall risk' },
        { step: 3, title: 'Physical assessment', instruction: 'Assess gait, balance, strength, vision' },
        { step: 4, title: 'Environmental assessment', instruction: 'Evaluate home for hazards' },
        { step: 5, title: 'Calculate risk score', instruction: 'Complete standardized fall risk assessment' },
        { step: 6, title: 'Develop plan', instruction: 'Create individualized fall prevention plan' },
        { step: 7, title: 'Educate patient/family', instruction: 'Provide fall prevention education' },
        { step: 8, title: 'Document', instruction: 'Document assessment and interventions' },
      ]),
      equipment_needed: JSON.stringify(['Fall risk assessment tool', 'Gait belt', 'Blood pressure cuff']),
      precautions: 'Ensure patient safety during mobility assessment',
      expected_outcomes: 'Identification of fall risk and implementation of prevention strategies',
      evidence_base: 'CDC STEADI Initiative, AGS/BGS Guidelines',
      source_organization: 'CDC',
      version: '1.0',
      is_approved: true,
      is_mandatory: true,
      priority: 'HIGH',
      tags: JSON.stringify(['fall prevention', 'safety', 'assessment']),
    },
  ]);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('protocol_compliance');
  await knex.schema.dropTableIfExists('care_protocols');
  await knex.schema.dropTableIfExists('protocol_categories');
}
