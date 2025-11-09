import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // ML Training Data - stores feature vectors and outcomes for training
  await knex.schema.createTable('ml_training_data', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('organization_id').notNullable();
    table.uuid('open_shift_id').references('id').inTable('open_shifts').onDelete('SET NULL');
    table.uuid('caregiver_id').references('id').inTable('caregivers').onDelete('SET NULL');
    table.uuid('visit_id').references('id').inTable('visits').onDelete('SET NULL');

    // Features used for prediction
    table.jsonb('features').notNullable().comment('Feature vector: skill_match, availability_match, proximity_match, preference_match, experience_match, reliability_match, compliance_match, capacity_match, plus derived features');

    // Outcome labels
    table.boolean('was_accepted').comment('Was the proposal accepted?');
    table.boolean('was_completed').comment('Was the visit completed successfully?');
    table.boolean('was_no_show').comment('Did caregiver not show up?');
    table.boolean('was_late').comment('Was caregiver late?');
    table.integer('client_satisfaction_rating').comment('Client satisfaction rating 1-5');
    table.decimal('response_time_minutes', 10, 2).comment('Time to respond to proposal');

    // Match quality at time of matching
    table.decimal('rule_based_score', 5, 2).comment('Original rule-based matching score');
    table.string('match_quality', 20).comment('EXCELLENT, GOOD, FAIR, POOR');

    // Metadata
    table.timestamp('matched_at').notNullable();
    table.timestamp('shift_completed_at');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('deleted_at');

    // Indexes
    table.index('organization_id');
    table.index('caregiver_id');
    table.index('created_at');
    table.index(['was_completed', 'was_no_show']);
  });

  // ML Models - stores trained models and metadata
  await knex.schema.createTable('ml_models', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('organization_id').comment('NULL = global model, UUID = org-specific');
    table.string('model_type', 50).notNullable().comment('GRADIENT_BOOSTING, LIGHTGBM, XGBOOST');
    table.string('model_version', 50).notNullable();
    table.string('target_variable', 50).notNullable().comment('match_success, completion_rate, no_show_probability');

    // Model artifacts (stored as base64 or reference to blob storage)
    table.text('model_artifact').notNullable().comment('Serialized model or storage reference');
    table.jsonb('feature_importance').comment('Feature importance scores');
    table.jsonb('hyperparameters').comment('Model hyperparameters');

    // Training metadata
    table.integer('training_samples').notNullable();
    table.timestamp('training_started_at').notNullable();
    table.timestamp('training_completed_at').notNullable();
    table.jsonb('training_metrics').notNullable().comment('Accuracy, precision, recall, F1, AUC-ROC');
    table.jsonb('validation_metrics').comment('Metrics on validation set');

    // Model status
    table.enum('status', ['TRAINING', 'TRAINED', 'DEPLOYED', 'ARCHIVED', 'FAILED']).notNullable().defaultTo('TRAINING');
    table.timestamp('deployed_at');
    table.timestamp('archived_at');

    // Version control
    table.boolean('is_active').notNullable().defaultTo(false);
    table.uuid('replaces_model_id').references('id').inTable('ml_models').onDelete('SET NULL');

    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    // Indexes
    table.index('organization_id');
    table.index(['status', 'is_active']);
    table.index('model_version');
  });

  // ML Predictions - stores predictions for monitoring and analysis
  await knex.schema.createTable('ml_predictions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('model_id').notNullable().references('id').inTable('ml_models').onDelete('CASCADE');
    table.uuid('open_shift_id').notNullable().references('id').inTable('open_shifts').onDelete('CASCADE');
    table.uuid('caregiver_id').notNullable().references('id').inTable('caregivers').onDelete('CASCADE');
    table.uuid('assignment_proposal_id').references('id').inTable('assignment_proposals').onDelete('SET NULL');

    // Prediction
    table.decimal('predicted_score', 5, 2).notNullable().comment('ML predicted match success probability 0-100');
    table.jsonb('prediction_details').comment('Confidence intervals, feature contributions');

    // Combined scoring
    table.decimal('rule_based_score', 5, 2).notNullable();
    table.decimal('hybrid_score', 5, 2).notNullable().comment('Combined rule-based + ML score');
    table.decimal('ml_weight', 3, 2).notNullable().comment('Weight of ML score in hybrid (0.0-1.0)');

    // Actual outcome (updated after shift completion)
    table.boolean('actual_accepted');
    table.boolean('actual_completed');
    table.boolean('actual_no_show');

    // Performance metrics
    table.decimal('prediction_error', 5, 2).comment('Absolute error between prediction and actual');
    table.integer('inference_time_ms').comment('Model inference time');

    table.timestamp('predicted_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('outcome_recorded_at');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    // Indexes
    table.index('model_id');
    table.index('open_shift_id');
    table.index('caregiver_id');
    table.index('predicted_at');
  });

  // A/B Testing Framework
  await knex.schema.createTable('ab_test_assignments', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('organization_id').notNullable();
    table.uuid('open_shift_id').notNullable().references('id').inTable('open_shifts').onDelete('CASCADE');

    // Test configuration
    table.string('test_name', 100).notNullable().comment('e.g., "rule_based_vs_ml_v1"');
    table.string('test_variant', 50).notNullable().comment('CONTROL (rule-based), TREATMENT_A (ML), TREATMENT_B (hybrid)');
    table.integer('test_version').notNullable().defaultTo(1);

    // Assignment
    table.timestamp('assigned_at').notNullable().defaultTo(knex.fn.now());
    table.string('assignment_method', 50).notNullable().comment('RANDOM, HASH, MANUAL');

    // Outcomes
    table.decimal('match_score', 5, 2);
    table.boolean('was_matched').notNullable().defaultTo(false);
    table.boolean('was_accepted');
    table.boolean('was_completed');
    table.decimal('response_time_minutes', 10, 2);
    table.integer('client_satisfaction_rating');

    // Metadata
    table.jsonb('metadata').comment('Additional test-specific data');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    // Indexes
    table.index('organization_id');
    table.index(['test_name', 'test_variant']);
    table.index('open_shift_id');
    table.index('assigned_at');
  });

  // Caregiver Performance Analytics - aggregated metrics per caregiver
  await knex.schema.createTable('caregiver_performance_metrics', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('caregiver_id').notNullable().references('id').inTable('caregivers').onDelete('CASCADE');
    table.uuid('organization_id').notNullable();

    // Time period for metrics
    table.date('period_start').notNullable();
    table.date('period_end').notNullable();
    table.string('period_type', 20).notNullable().comment('WEEKLY, MONTHLY, QUARTERLY, YEARLY');

    // Visit metrics
    table.integer('total_visits').notNullable().defaultTo(0);
    table.integer('completed_visits').notNullable().defaultTo(0);
    table.integer('no_show_count').notNullable().defaultTo(0);
    table.integer('late_arrivals').notNullable().defaultTo(0);
    table.integer('early_departures').notNullable().defaultTo(0);
    table.decimal('completion_rate', 5, 2).comment('Percentage 0-100');
    table.decimal('no_show_rate', 5, 2).comment('Percentage 0-100');

    // Proposal metrics
    table.integer('proposals_received').notNullable().defaultTo(0);
    table.integer('proposals_accepted').notNullable().defaultTo(0);
    table.integer('proposals_rejected').notNullable().defaultTo(0);
    table.decimal('acceptance_rate', 5, 2).comment('Percentage 0-100');
    table.decimal('avg_response_time_minutes', 10, 2);

    // Client satisfaction
    table.decimal('avg_client_rating', 3, 2).comment('Average 1-5');
    table.integer('total_ratings').notNullable().defaultTo(0);

    // Distance and travel
    table.decimal('avg_travel_distance_miles', 10, 2);
    table.decimal('total_miles_traveled', 10, 2);

    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    // Indexes
    table.unique(['caregiver_id', 'period_start', 'period_type']);
    table.index('organization_id');
    table.index(['period_start', 'period_end']);
  });

  // Client-Caregiver Pairing History - track continuity of care
  await knex.schema.createTable('client_caregiver_pairings', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('client_id').notNullable().references('id').inTable('clients').onDelete('CASCADE');
    table.uuid('caregiver_id').notNullable().references('id').inTable('caregivers').onDelete('CASCADE');
    table.uuid('organization_id').notNullable();

    // Pairing statistics
    table.integer('total_visits').notNullable().defaultTo(0);
    table.integer('completed_visits').notNullable().defaultTo(0);
    table.timestamp('first_visit_date');
    table.timestamp('last_visit_date');

    // Quality metrics
    table.decimal('avg_client_rating', 3, 2).comment('Average 1-5');
    table.integer('total_ratings').notNullable().defaultTo(0);
    table.integer('no_show_count').notNullable().defaultTo(0);
    table.integer('incident_count').notNullable().defaultTo(0);

    // Compatibility score
    table.decimal('compatibility_score', 5, 2).comment('ML-derived compatibility 0-100');
    table.timestamp('compatibility_last_updated');

    // Preferences
    table.boolean('client_preferred').notNullable().defaultTo(false);
    table.boolean('client_blocked').notNullable().defaultTo(false);
    table.boolean('caregiver_preferred').notNullable().defaultTo(false);
    table.boolean('caregiver_avoided').notNullable().defaultTo(false);

    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    // Indexes
    table.unique(['client_id', 'caregiver_id']);
    table.index('organization_id');
    table.index('caregiver_id');
    table.index('compatibility_score');
  });

  // Enhance visits table to track completion outcomes
  await knex.schema.table('visits', (table) => {
    table.boolean('was_no_show').defaultTo(false);
    table.boolean('was_late').defaultTo(false);
    table.boolean('was_early_departure').defaultTo(false);
    table.integer('client_satisfaction_rating').comment('1-5 rating');
    table.text('client_satisfaction_notes');
    table.timestamp('satisfaction_recorded_at');
  });

  // Enhance matching_configurations table for ML settings
  await knex.schema.table('matching_configurations', (table) => {
    table.boolean('ml_enabled').notNullable().defaultTo(false);
    table.decimal('ml_weight', 3, 2).defaultTo(0.5).comment('Weight of ML score vs rule-based (0.0-1.0)');
    table.string('ml_model_preference', 50).comment('GLOBAL, ORG_SPECIFIC, HYBRID');
    table.decimal('min_ml_confidence', 3, 2).defaultTo(0.5).comment('Minimum confidence to use ML prediction');
    table.boolean('ab_testing_enabled').notNullable().defaultTo(false);
    table.string('ab_test_variant', 50).comment('Which variant to use: CONTROL, TREATMENT_A, TREATMENT_B');
  });

  // Schedule Optimization Results
  await knex.schema.createTable('schedule_optimizations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('organization_id').notNullable();
    table.uuid('branch_id');

    // Optimization request
    table.date('schedule_date').notNullable();
    table.jsonb('shift_ids').notNullable().comment('Array of open_shift IDs to optimize');
    table.jsonb('caregiver_ids').comment('Array of caregiver IDs to consider');

    // Optimization goals
    table.enum('primary_goal', [
      'MINIMIZE_TRAVEL_TIME',
      'MAXIMIZE_CONTINUITY',
      'BALANCE_WORKLOAD',
      'MAXIMIZE_SATISFACTION',
      'MINIMIZE_COST'
    ]).notNullable();
    table.jsonb('constraints').comment('Max travel distance, required skills, etc.');

    // Results
    table.enum('status', ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED']).notNullable().defaultTo('PENDING');
    table.jsonb('assignments').comment('Optimized shift -> caregiver assignments');
    table.jsonb('metrics').comment('Total travel time, workload distribution, etc.');
    table.decimal('optimization_score', 10, 2).comment('Overall solution quality');

    // Performance
    table.integer('computation_time_ms');
    table.integer('iterations');
    table.string('algorithm_used', 50).comment('GREEDY, CONSTRAINT_PROGRAMMING, GENETIC_ALGORITHM');

    // Application
    table.boolean('applied').notNullable().defaultTo(false);
    table.timestamp('applied_at');
    table.uuid('applied_by_user_id');

    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('completed_at');

    // Indexes
    table.index('organization_id');
    table.index(['schedule_date', 'status']);
  });
}

export async function down(knex: Knex): Promise<void> {
  // Drop in reverse order due to foreign key constraints
  await knex.schema.dropTableIfExists('schedule_optimizations');

  await knex.schema.table('matching_configurations', (table) => {
    table.dropColumn('ml_enabled');
    table.dropColumn('ml_weight');
    table.dropColumn('ml_model_preference');
    table.dropColumn('min_ml_confidence');
    table.dropColumn('ab_testing_enabled');
    table.dropColumn('ab_test_variant');
  });

  await knex.schema.table('visits', (table) => {
    table.dropColumn('was_no_show');
    table.dropColumn('was_late');
    table.dropColumn('was_early_departure');
    table.dropColumn('client_satisfaction_rating');
    table.dropColumn('client_satisfaction_notes');
    table.dropColumn('satisfaction_recorded_at');
  });

  await knex.schema.dropTableIfExists('client_caregiver_pairings');
  await knex.schema.dropTableIfExists('caregiver_performance_metrics');
  await knex.schema.dropTableIfExists('ab_test_assignments');
  await knex.schema.dropTableIfExists('ml_predictions');
  await knex.schema.dropTableIfExists('ml_models');
  await knex.schema.dropTableIfExists('ml_training_data');
}
