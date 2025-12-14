/**
 * Create patient education tables
 *
 * Tracks patient/family education provided during home health visits.
 * Supports documentation of teaching topics, methods, learner response, and follow-up needs.
 */

import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Education topic categories
  await knex.schema.createTable('education_topics', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('organization_id').notNullable().references('id').inTable('organizations');

    table.string('name', 200).notNullable();
    table.text('description');
    table
      .enum('category', [
        'DISEASE_MANAGEMENT',
        'MEDICATION',
        'SAFETY',
        'NUTRITION',
        'EXERCISE',
        'WOUND_CARE',
        'DME_EQUIPMENT',
        'FALL_PREVENTION',
        'INFECTION_CONTROL',
        'PAIN_MANAGEMENT',
        'RESPIRATORY',
        'CARDIAC',
        'DIABETES',
        'MENTAL_HEALTH',
        'END_OF_LIFE',
        'CAREGIVER_TRAINING',
        'EMERGENCY_PROCEDURES',
        'COMMUNITY_RESOURCES',
        'OTHER',
      ])
      .notNullable();
    table.text('learning_objectives'); // What the learner should understand/do
    table.text('key_points'); // Main teaching points
    table.string('suggested_materials', 500); // Recommended handouts/resources

    table.boolean('is_active').notNullable().defaultTo(true);
    table.integer('display_order').defaultTo(0);

    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    table.index(['organization_id', 'category']);
    table.index(['organization_id', 'is_active']);
  });

  // Educational materials library
  await knex.schema.createTable('education_materials', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('organization_id').notNullable().references('id').inTable('organizations');
    table.uuid('topic_id').references('id').inTable('education_topics');

    table.string('name', 200).notNullable();
    table.text('description');
    table
      .enum('material_type', [
        'HANDOUT',
        'BROCHURE',
        'BOOKLET',
        'POSTER',
        'VIDEO',
        'AUDIO',
        'WEBSITE',
        'APP',
        'DEMONSTRATION_GUIDE',
        'CHECKLIST',
        'OTHER',
      ])
      .notNullable();
    table.string('language', 50).defaultTo('English');
    table.string('reading_level', 50); // e.g., "6th grade", "Low literacy"
    table.string('file_url', 500); // Link to digital material
    table.string('source', 200); // Publisher or source organization

    table.boolean('is_active').notNullable().defaultTo(true);
    table.integer('display_order').defaultTo(0);

    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    table.index(['organization_id', 'topic_id']);
    table.index(['organization_id', 'material_type']);
  });

  // Patient education records
  await knex.schema.createTable('patient_education', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('organization_id').notNullable().references('id').inTable('organizations');
    table.uuid('branch_id').references('id').inTable('branches');
    table.uuid('client_id').notNullable().references('id').inTable('clients');
    table.uuid('visit_id').references('id').inTable('visits');

    // Education content
    table.uuid('topic_id').references('id').inTable('education_topics');
    table.string('topic_name', 200).notNullable(); // Denormalized for history
    table
      .enum('category', [
        'DISEASE_MANAGEMENT',
        'MEDICATION',
        'SAFETY',
        'NUTRITION',
        'EXERCISE',
        'WOUND_CARE',
        'DME_EQUIPMENT',
        'FALL_PREVENTION',
        'INFECTION_CONTROL',
        'PAIN_MANAGEMENT',
        'RESPIRATORY',
        'CARDIAC',
        'DIABETES',
        'MENTAL_HEALTH',
        'END_OF_LIFE',
        'CAREGIVER_TRAINING',
        'EMERGENCY_PROCEDURES',
        'COMMUNITY_RESOURCES',
        'OTHER',
      ])
      .notNullable();
    table.text('specific_content'); // Specific content taught
    table.text('learning_objectives'); // What was expected to learn

    // Who was taught
    table
      .enum('learner_type', ['PATIENT', 'FAMILY_MEMBER', 'CAREGIVER', 'MULTIPLE', 'OTHER'])
      .notNullable();
    table.string('learner_name', 200); // Name if not patient
    table.string('learner_relationship', 100); // Relationship to patient

    // Teaching method
    table
      .enum('teaching_method', [
        'VERBAL_INSTRUCTION',
        'DEMONSTRATION',
        'RETURN_DEMONSTRATION',
        'WRITTEN_MATERIALS',
        'VIDEO',
        'HANDS_ON_PRACTICE',
        'DISCUSSION',
        'COMBINATION',
        'OTHER',
      ])
      .notNullable();
    table.text('method_details'); // Additional details about teaching method

    // Materials provided
    table.jsonb('materials_provided'); // Array of material IDs or names
    table.text('materials_notes');

    // Learner response/comprehension
    table
      .enum('comprehension_level', [
        'FULLY_UNDERSTOOD',
        'MOSTLY_UNDERSTOOD',
        'PARTIALLY_UNDERSTOOD',
        'NEEDS_REINFORCEMENT',
        'UNABLE_TO_LEARN',
        'NOT_ASSESSED',
      ])
      .notNullable();
    table.text('comprehension_notes');

    // Barriers to learning
    table.jsonb('learning_barriers'); // Array: language, cognitive, vision, hearing, emotional, etc.
    table.text('barrier_notes');

    // Return demonstration (if applicable)
    table.boolean('return_demo_performed').defaultTo(false);
    table
      .enum('return_demo_result', ['SUCCESSFUL', 'PARTIALLY_SUCCESSFUL', 'NEEDS_MORE_PRACTICE', 'UNSUCCESSFUL'])
      .nullable();
    table.text('return_demo_notes');

    // Follow-up
    table.boolean('follow_up_needed').notNullable().defaultTo(false);
    table.text('follow_up_plan');
    table.date('follow_up_date');

    // Documentation
    table.uuid('documented_by').notNullable().references('id').inTable('users');
    table.string('documented_by_name', 200).notNullable();
    table.string('documented_by_credentials', 50);
    table.timestamp('education_date').notNullable();
    table.integer('time_spent_minutes'); // Duration of education

    // Notes
    table.text('clinical_notes');
    table.text('patient_response'); // How the patient responded to teaching

    // Metadata
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.boolean('is_deleted').notNullable().defaultTo(false);

    // Indexes
    table.index(['organization_id', 'client_id']);
    table.index(['client_id', 'category']);
    table.index(['client_id', 'education_date']);
    table.index(['visit_id']);
    table.index(['documented_by']);
    table.index(['follow_up_needed', 'follow_up_date']);
  });

  // Seed common education topics
  await knex('education_topics').insert([
    // Disease Management
    {
      id: knex.raw('gen_random_uuid()'),
      organization_id: knex.raw("(SELECT id FROM organizations LIMIT 1)"),
      name: 'Disease Process Overview',
      description: 'Understanding the disease, its progression, and expected outcomes',
      category: 'DISEASE_MANAGEMENT',
      learning_objectives: 'Patient/family will verbalize understanding of diagnosis and expected course',
      key_points: 'Explain diagnosis in simple terms, discuss progression, signs to watch for',
    },
    {
      id: knex.raw('gen_random_uuid()'),
      organization_id: knex.raw("(SELECT id FROM organizations LIMIT 1)"),
      name: 'Signs and Symptoms to Report',
      description: 'When to call the nurse, doctor, or seek emergency care',
      category: 'DISEASE_MANAGEMENT',
      learning_objectives: 'Patient/family will identify warning signs requiring medical attention',
      key_points: 'Specific symptoms to watch, when to call office vs ER, emergency numbers',
    },
    // Medication
    {
      id: knex.raw('gen_random_uuid()'),
      organization_id: knex.raw("(SELECT id FROM organizations LIMIT 1)"),
      name: 'Medication Management',
      description: 'Safe and effective use of prescribed medications',
      category: 'MEDICATION',
      learning_objectives: 'Patient will demonstrate proper medication administration and storage',
      key_points: 'Name, purpose, dose, timing, side effects, storage, refills',
    },
    {
      id: knex.raw('gen_random_uuid()'),
      organization_id: knex.raw("(SELECT id FROM organizations LIMIT 1)"),
      name: 'Insulin Administration',
      description: 'Safe insulin injection technique and glucose monitoring',
      category: 'MEDICATION',
      learning_objectives: 'Patient will demonstrate proper insulin drawing, injection, and site rotation',
      key_points: 'Drawing up insulin, injection technique, site rotation, sharps disposal',
    },
    // Safety
    {
      id: knex.raw('gen_random_uuid()'),
      organization_id: knex.raw("(SELECT id FROM organizations LIMIT 1)"),
      name: 'Home Safety Assessment',
      description: 'Identifying and addressing safety hazards in the home',
      category: 'SAFETY',
      learning_objectives: 'Patient/family will identify and correct safety hazards',
      key_points: 'Rugs, lighting, bathroom safety, fire safety, emergency exit',
    },
    {
      id: knex.raw('gen_random_uuid()'),
      organization_id: knex.raw("(SELECT id FROM organizations LIMIT 1)"),
      name: 'Fall Prevention',
      description: 'Strategies to prevent falls at home',
      category: 'FALL_PREVENTION',
      learning_objectives: 'Patient will verbalize fall prevention strategies and demonstrate safe mobility',
      key_points: 'Remove hazards, proper footwear, use assistive devices, night lights',
    },
    // Wound Care
    {
      id: knex.raw('gen_random_uuid()'),
      organization_id: knex.raw("(SELECT id FROM organizations LIMIT 1)"),
      name: 'Wound Care Technique',
      description: 'Proper wound cleaning and dressing changes',
      category: 'WOUND_CARE',
      learning_objectives: 'Caregiver will demonstrate sterile wound care technique',
      key_points: 'Hand hygiene, supplies, cleaning technique, dressing application, signs of infection',
    },
    // Cardiac
    {
      id: knex.raw('gen_random_uuid()'),
      organization_id: knex.raw("(SELECT id FROM organizations LIMIT 1)"),
      name: 'Heart Failure Management',
      description: 'Daily management of heart failure symptoms',
      category: 'CARDIAC',
      learning_objectives: 'Patient will verbalize daily weight monitoring and fluid restriction',
      key_points: 'Daily weights, low sodium diet, fluid limits, activity, when to call',
    },
    // Diabetes
    {
      id: knex.raw('gen_random_uuid()'),
      organization_id: knex.raw("(SELECT id FROM organizations LIMIT 1)"),
      name: 'Diabetes Self-Management',
      description: 'Blood sugar monitoring, diet, and sick day rules',
      category: 'DIABETES',
      learning_objectives: 'Patient will demonstrate glucose monitoring and verbalize target ranges',
      key_points: 'Testing technique, target ranges, diet basics, hypoglycemia treatment, sick day rules',
    },
    // Respiratory
    {
      id: knex.raw('gen_random_uuid()'),
      organization_id: knex.raw("(SELECT id FROM organizations LIMIT 1)"),
      name: 'Oxygen Safety',
      description: 'Safe use of supplemental oxygen at home',
      category: 'RESPIRATORY',
      learning_objectives: 'Patient/caregiver will verbalize oxygen safety precautions',
      key_points: 'No smoking, keep away from flames, equipment care, backup supplies',
    },
    // Caregiver Training
    {
      id: knex.raw('gen_random_uuid()'),
      organization_id: knex.raw("(SELECT id FROM organizations LIMIT 1)"),
      name: 'Safe Patient Transfers',
      description: 'Proper body mechanics for patient transfers',
      category: 'CAREGIVER_TRAINING',
      learning_objectives: 'Caregiver will demonstrate safe transfer technique',
      key_points: 'Body mechanics, gait belt use, bed to chair, wheelchair safety',
    },
  ]);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('patient_education');
  await knex.schema.dropTableIfExists('education_materials');
  await knex.schema.dropTableIfExists('education_topics');
}
