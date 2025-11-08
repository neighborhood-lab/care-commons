import { type Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // ============================================================================
  // ML MODELS
  // ============================================================================

  await knex.schema.createTable('ml_models', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('organization_id').notNullable();

    // Model metadata
    table.string('name', 200).notNullable();
    table.string('version', 50).notNullable();
    table.string('model_type', 100).notNullable(); // 'gradient_boosting', 'random_forest', etc.
    table.string('framework', 100).notNullable(); // 'xgboost', 'lightgbm', 'sklearn'
    table.text('description');

    // Model configuration
    table.jsonb('hyperparameters').notNullable();
    table.jsonb('feature_config').notNullable(); // List of features used
    table.string('target_variable', 100).notNullable(); // What we're predicting

    // Training metadata
    table.timestamp('trained_at').notNullable();
    table.uuid('trained_by').notNullable();
    table.integer('training_samples').notNullable();
    table.integer('validation_samples');
    table.jsonb('training_metrics').notNullable(); // Accuracy, precision, recall, F1, AUC, etc.

    // Model artifact
    table.text('model_path'); // Path to serialized model file (ONNX, pickle, etc.)
    table.binary('model_data'); // Optionally store small models directly
    table.string('model_format', 50).notNullable(); // 'onnx', 'json', 'pickle'

    // Status and deployment
    table.string('status', 50).notNullable().defaultTo('TRAINING').checkIn([
      'TRAINING', 'VALIDATING', 'DEPLOYED', 'SHADOW', 'RETIRED', 'FAILED'
    ]);
    table.timestamp('deployed_at');
    table.timestamp('retired_at');

    // Performance tracking
    table.decimal('current_accuracy', 5, 4); // e.g., 0.8542
    table.decimal('baseline_accuracy', 5, 4); // Performance to beat
    table.integer('prediction_count').defaultTo(0);

    // Audit fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').notNullable();
    table.integer('version').notNullable().defaultTo(1);

    // Constraints
    table.unique(['organization_id', 'name', 'version']);
  });

  await knex.raw('CREATE INDEX idx_ml_models_org ON ml_models(organization_id)');
  await knex.raw('CREATE INDEX idx_ml_models_status ON ml_models(status)');
  await knex.raw('CREATE INDEX idx_ml_models_deployed ON ml_models(organization_id, status, deployed_at DESC) WHERE status = \'DEPLOYED\'');

  // ============================================================================
  // MATCH OUTCOMES - Track actual visit completion for training
  // ============================================================================

  await knex.schema.createTable('match_outcomes', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('organization_id').notNullable();
    table.uuid('branch_id').notNullable();

    // References
    table.uuid('visit_id').notNullable();
    table.uuid('open_shift_id');
    table.uuid('assignment_proposal_id');
    table.uuid('caregiver_id').notNullable();
    table.uuid('client_id').notNullable();

    // Match quality at time of assignment
    table.decimal('match_score', 5, 2); // The score from matching algorithm
    table.string('match_quality', 50); // EXCELLENT, GOOD, FAIR, POOR
    table.jsonb('match_reasons'); // Why this match was made

    // Outcome metrics
    table.string('outcome', 50).notNullable().checkIn([
      'COMPLETED', 'NO_SHOW_CAREGIVER', 'NO_SHOW_CLIENT',
      'CANCELLED_CAREGIVER', 'CANCELLED_CLIENT', 'CANCELLED_AGENCY',
      'IN_PROGRESS', 'SCHEDULED'
    ]);
    table.boolean('was_successful').notNullable().defaultTo(false);
    table.timestamp('scheduled_start').notNullable();
    table.timestamp('scheduled_end').notNullable();
    table.timestamp('actual_start');
    table.timestamp('actual_end');

    // Quality metrics
    table.decimal('client_rating', 3, 2); // 1.00 to 5.00
    table.decimal('caregiver_rating', 3, 2); // 1.00 to 5.00
    table.boolean('tasks_completed').defaultTo(true);
    table.text('incident_notes');
    table.boolean('had_incident').defaultTo(false);

    // Response metrics
    table.integer('response_time_minutes'); // Time to accept proposal
    table.integer('assignment_attempt_number'); // How many tries to fill this shift

    // Contextual data at time of match (for feature reconstruction)
    table.jsonb('caregiver_context'); // Weekly hours, recent performance, etc.
    table.jsonb('client_context'); // Preferences, history, etc.
    table.decimal('distance_miles', 6, 2);
    table.integer('travel_time_minutes');

    // Audit fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').notNullable();

    // Constraints
    table.foreign('visit_id').references('id').inTable('visits').onDelete('CASCADE');
    table.foreign('caregiver_id').references('id').inTable('caregivers').onDelete('CASCADE');
    table.foreign('client_id').references('id').inTable('clients').onDelete('CASCADE');
  });

  await knex.raw('CREATE INDEX idx_match_outcomes_org ON match_outcomes(organization_id)');
  await knex.raw('CREATE INDEX idx_match_outcomes_visit ON match_outcomes(visit_id)');
  await knex.raw('CREATE INDEX idx_match_outcomes_caregiver ON match_outcomes(caregiver_id)');
  await knex.raw('CREATE INDEX idx_match_outcomes_client ON match_outcomes(client_id)');
  await knex.raw('CREATE INDEX idx_match_outcomes_outcome ON match_outcomes(outcome)');
  await knex.raw('CREATE INDEX idx_match_outcomes_scheduled ON match_outcomes(scheduled_start)');
  await knex.raw('CREATE INDEX idx_match_outcomes_pair ON match_outcomes(caregiver_id, client_id)');
  await knex.raw('CREATE INDEX idx_match_outcomes_training ON match_outcomes(organization_id, was_successful, scheduled_start DESC)');

  // ============================================================================
  // ML MATCH FEATURES - Computed features for training/inference
  // ============================================================================

  await knex.schema.createTable('ml_match_features', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('organization_id').notNullable();

    // References
    table.uuid('caregiver_id').notNullable();
    table.uuid('client_id').notNullable();
    table.uuid('shift_id'); // For real-time scoring
    table.uuid('match_outcome_id'); // For training data

    // Computed at
    table.timestamp('computed_at').notNullable().defaultTo(knex.fn.now());

    // Compatibility features
    table.decimal('skill_match_score', 5, 2);
    table.decimal('experience_score', 5, 2);
    table.decimal('preference_score', 5, 2);
    table.integer('previous_visits_count');
    table.decimal('avg_client_rating', 3, 2);
    table.boolean('has_worked_together');
    table.integer('days_since_last_visit');

    // Temporal features
    table.string('day_of_week', 20);
    table.integer('hour_of_day');
    table.boolean('is_weekend');
    table.boolean('is_holiday');
    table.string('time_of_day_preference', 50); // 'morning', 'afternoon', 'evening', 'night'

    // Spatial features
    table.decimal('distance_miles', 6, 2);
    table.decimal('travel_time_minutes', 6, 2);
    table.boolean('in_preferred_area');
    table.integer('shifts_in_area_last_30d');

    // Caregiver state features
    table.decimal('current_week_hours', 5, 2);
    table.decimal('capacity_utilization', 5, 2); // 0-1
    table.integer('active_shifts_count');
    table.decimal('reliability_score_90d', 5, 2);
    table.integer('no_show_count_90d');
    table.integer('cancellation_count_90d');
    table.integer('rejection_count_30d');

    // Client features
    table.boolean('client_has_special_needs');
    table.jsonb('required_skills');
    table.jsonb('required_certifications');
    table.string('gender_preference', 50);
    table.string('language_preference', 100);

    // Historical performance features
    table.decimal('caregiver_avg_rating', 3, 2);
    table.integer('total_completed_visits');
    table.decimal('completion_rate', 5, 2);
    table.decimal('on_time_rate', 5, 2);

    // Interaction features
    table.boolean('is_preferred_caregiver');
    table.boolean('is_blocked_caregiver');
    table.integer('mutual_preference_score'); // -100 to 100

    // Target variable (for training data)
    table.boolean('target_success'); // Did this match succeed?

    // Feature version (for schema evolution)
    table.string('feature_version', 20).notNullable().defaultTo('1.0');

    // Constraints
    table.foreign('caregiver_id').references('id').inTable('caregivers').onDelete('CASCADE');
    table.foreign('client_id').references('id').inTable('clients').onDelete('CASCADE');
  });

  await knex.raw('CREATE INDEX idx_ml_features_org ON ml_match_features(organization_id)');
  await knex.raw('CREATE INDEX idx_ml_features_caregiver ON ml_match_features(caregiver_id)');
  await knex.raw('CREATE INDEX idx_ml_features_client ON ml_match_features(client_id)');
  await knex.raw('CREATE INDEX idx_ml_features_pair ON ml_match_features(caregiver_id, client_id)');
  await knex.raw('CREATE INDEX idx_ml_features_shift ON ml_match_features(shift_id) WHERE shift_id IS NOT NULL');
  await knex.raw('CREATE INDEX idx_ml_features_outcome ON ml_match_features(match_outcome_id) WHERE match_outcome_id IS NOT NULL');
  await knex.raw('CREATE INDEX idx_ml_features_training ON ml_match_features(organization_id, computed_at DESC) WHERE target_success IS NOT NULL');

  // ============================================================================
  // ML PREDICTIONS - Store predictions for monitoring
  // ============================================================================

  await knex.schema.createTable('ml_predictions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('organization_id').notNullable();

    // Model reference
    table.uuid('model_id').notNullable();
    table.string('model_version', 50).notNullable();

    // What we predicted for
    table.uuid('shift_id');
    table.uuid('caregiver_id').notNullable();
    table.uuid('client_id').notNullable();
    table.uuid('feature_set_id'); // Reference to ml_match_features

    // Prediction
    table.decimal('predicted_score', 5, 4).notNullable(); // Probability of success (0-1)
    table.decimal('confidence', 5, 4); // Model confidence
    table.string('prediction_class', 50); // 'LIKELY_SUCCESS', 'LIKELY_FAILURE'
    table.jsonb('class_probabilities'); // Full probability distribution

    // Feature importance for this prediction (SHAP values, etc.)
    table.jsonb('feature_importance');

    // Context
    table.timestamp('predicted_at').notNullable().defaultTo(knex.fn.now());
    table.boolean('was_used_in_matching').defaultTo(false);
    table.decimal('final_match_score', 5, 2); // Combined ML + rule-based score

    // Actual outcome (filled in later)
    table.uuid('match_outcome_id'); // Link to actual outcome
    table.boolean('actual_outcome');
    table.timestamp('outcome_recorded_at');
    table.boolean('prediction_correct');

    // Performance metrics
    table.integer('inference_time_ms');

    // Constraints
    table.foreign('model_id').references('id').inTable('ml_models').onDelete('CASCADE');
    table.foreign('caregiver_id').references('id').inTable('caregivers').onDelete('CASCADE');
    table.foreign('client_id').references('id').inTable('clients').onDelete('CASCADE');
  });

  await knex.raw('CREATE INDEX idx_ml_predictions_model ON ml_predictions(model_id)');
  await knex.raw('CREATE INDEX idx_ml_predictions_shift ON ml_predictions(shift_id) WHERE shift_id IS NOT NULL');
  await knex.raw('CREATE INDEX idx_ml_predictions_caregiver ON ml_predictions(caregiver_id)');
  await knex.raw('CREATE INDEX idx_ml_predictions_pair ON ml_predictions(caregiver_id, client_id)');
  await knex.raw('CREATE INDEX idx_ml_predictions_time ON ml_predictions(predicted_at DESC)');
  await knex.raw('CREATE INDEX idx_ml_predictions_outcome ON ml_predictions(match_outcome_id) WHERE match_outcome_id IS NOT NULL');
  await knex.raw('CREATE INDEX idx_ml_predictions_accuracy ON ml_predictions(model_id, prediction_correct) WHERE actual_outcome IS NOT NULL');

  // ============================================================================
  // ML MODEL PERFORMANCE - Track model metrics over time
  // ============================================================================

  await knex.schema.createTable('ml_model_performance', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('organization_id').notNullable();

    // Model reference
    table.uuid('model_id').notNullable();
    table.string('model_version', 50).notNullable();

    // Time window
    table.timestamp('period_start').notNullable();
    table.timestamp('period_end').notNullable();
    table.string('aggregation_level', 50).notNullable().checkIn(['HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY']);

    // Volume metrics
    table.integer('prediction_count').notNullable().defaultTo(0);
    table.integer('predictions_with_outcomes').notNullable().defaultTo(0);

    // Classification metrics
    table.decimal('accuracy', 5, 4);
    table.decimal('precision', 5, 4);
    table.decimal('recall', 5, 4);
    table.decimal('f1_score', 5, 4);
    table.decimal('auc_roc', 5, 4);
    table.decimal('auc_pr', 5, 4);

    // Confusion matrix
    table.integer('true_positives').defaultTo(0);
    table.integer('true_negatives').defaultTo(0);
    table.integer('false_positives').defaultTo(0);
    table.integer('false_negatives').defaultTo(0);

    // Calibration
    table.decimal('brier_score', 5, 4);
    table.decimal('log_loss', 6, 4);

    // Performance vs baseline
    table.decimal('baseline_accuracy', 5, 4);
    table.decimal('lift_over_baseline', 5, 4);

    // Operational metrics
    table.decimal('avg_inference_time_ms', 8, 2);
    table.decimal('p95_inference_time_ms', 8, 2);
    table.decimal('p99_inference_time_ms', 8, 2);

    // Distribution stats
    table.decimal('avg_predicted_score', 5, 4);
    table.decimal('std_predicted_score', 5, 4);
    table.jsonb('score_distribution'); // Histogram bins

    // Feature drift detection
    table.jsonb('feature_drift_scores'); // KL divergence or other metrics
    table.boolean('drift_detected').defaultTo(false);

    // Audit
    table.timestamp('computed_at').notNullable().defaultTo(knex.fn.now());

    // Constraints
    table.foreign('model_id').references('id').inTable('ml_models').onDelete('CASCADE');
    table.unique(['model_id', 'period_start', 'aggregation_level']);
  });

  await knex.raw('CREATE INDEX idx_ml_performance_model ON ml_model_performance(model_id)');
  await knex.raw('CREATE INDEX idx_ml_performance_period ON ml_model_performance(period_start DESC)');
  await knex.raw('CREATE INDEX idx_ml_performance_drift ON ml_model_performance(model_id, drift_detected) WHERE drift_detected = true');

  // ============================================================================
  // A/B TEST ASSIGNMENTS - Track experimental groups
  // ============================================================================

  await knex.schema.createTable('ab_test_assignments', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('organization_id').notNullable();

    // Experiment metadata
    table.string('experiment_name', 200).notNullable();
    table.string('experiment_id', 100).notNullable();
    table.text('description');

    // Assignment
    table.uuid('entity_id').notNullable(); // Caregiver, shift, or client ID
    table.string('entity_type', 50).notNullable().checkIn(['CAREGIVER', 'SHIFT', 'CLIENT', 'BRANCH']);
    table.string('variant', 100).notNullable(); // 'control', 'treatment_ml', 'treatment_hybrid'

    // Status
    table.string('status', 50).notNullable().defaultTo('ACTIVE').checkIn(['ACTIVE', 'COMPLETED', 'CANCELLED']);
    table.timestamp('assigned_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('completed_at');

    // Sticky assignment (same entity always gets same variant)
    table.string('assignment_hash', 64).notNullable(); // Hash of entity_id for consistent assignment

    // Results tracking
    table.integer('matches_attempted').defaultTo(0);
    table.integer('matches_successful').defaultTo(0);
    table.decimal('avg_match_score', 5, 2);
    table.decimal('avg_response_time_minutes', 8, 2);
    table.jsonb('metrics'); // Custom metrics for this experiment

    // Constraints
    table.unique(['experiment_id', 'entity_id', 'entity_type']);
  });

  await knex.raw('CREATE INDEX idx_ab_test_org ON ab_test_assignments(organization_id)');
  await knex.raw('CREATE INDEX idx_ab_test_experiment ON ab_test_assignments(experiment_id)');
  await knex.raw('CREATE INDEX idx_ab_test_entity ON ab_test_assignments(entity_type, entity_id)');
  await knex.raw('CREATE INDEX idx_ab_test_variant ON ab_test_assignments(experiment_id, variant)');
  await knex.raw('CREATE INDEX idx_ab_test_active ON ab_test_assignments(experiment_id, status) WHERE status = \'ACTIVE\'');

  // ============================================================================
  // AB TEST EXPERIMENTS - Track experiment definitions
  // ============================================================================

  await knex.schema.createTable('ab_test_experiments', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('organization_id').notNullable();

    // Experiment definition
    table.string('experiment_id', 100).notNullable().unique();
    table.string('name', 200).notNullable();
    table.text('description');
    table.text('hypothesis');

    // Configuration
    table.jsonb('variants').notNullable(); // [{name: 'control', weight: 0.5}, ...]
    table.string('entity_type', 50).notNullable(); // What we're assigning
    table.jsonb('targeting_rules'); // Who is eligible

    // Status and timeline
    table.string('status', 50).notNullable().defaultTo('DRAFT').checkIn([
      'DRAFT', 'RUNNING', 'PAUSED', 'COMPLETED', 'CANCELLED'
    ]);
    table.timestamp('start_date');
    table.timestamp('end_date');
    table.timestamp('actual_start_date');
    table.timestamp('actual_end_date');

    // Sample size and power
    table.integer('target_sample_size');
    table.integer('current_sample_size').defaultTo(0);
    table.decimal('minimum_detectable_effect', 5, 4);
    table.decimal('statistical_power', 5, 4).defaultTo(0.80);

    // Success metrics
    table.jsonb('primary_metrics').notNullable(); // What we're optimizing for
    table.jsonb('secondary_metrics');
    table.jsonb('guardrail_metrics'); // Metrics that shouldn't degrade

    // Results
    table.jsonb('results'); // Statistical test results
    table.string('winner'); // Which variant won
    table.boolean('is_significant');
    table.decimal('p_value', 6, 5);

    // Audit
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').notNullable();
  });

  await knex.raw('CREATE INDEX idx_ab_experiments_org ON ab_test_experiments(organization_id)');
  await knex.raw('CREATE INDEX idx_ab_experiments_status ON ab_test_experiments(status)');
  await knex.raw('CREATE INDEX idx_ab_experiments_running ON ab_test_experiments(organization_id, status) WHERE status = \'RUNNING\'');

  // ============================================================================
  // TRIGGERS
  // ============================================================================

  // Auto-update updated_at for ml_models
  await knex.raw(`
    CREATE OR REPLACE FUNCTION update_ml_models_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  await knex.raw(`
    CREATE TRIGGER trigger_ml_models_updated_at
        BEFORE UPDATE ON ml_models
        FOR EACH ROW
        EXECUTE FUNCTION update_ml_models_updated_at();
  `);

  // Auto-update updated_at for match_outcomes
  await knex.raw(`
    CREATE TRIGGER trigger_match_outcomes_updated_at
        BEFORE UPDATE ON match_outcomes
        FOR EACH ROW
        EXECUTE FUNCTION update_ml_models_updated_at();
  `);

  // Auto-update updated_at for ab_test_experiments
  await knex.raw(`
    CREATE TRIGGER trigger_ab_experiments_updated_at
        BEFORE UPDATE ON ab_test_experiments
        FOR EACH ROW
        EXECUTE FUNCTION update_ml_models_updated_at();
  `);
}

export async function down(knex: Knex): Promise<void> {
  // Drop triggers
  await knex.raw('DROP TRIGGER IF EXISTS trigger_ab_experiments_updated_at ON ab_test_experiments');
  await knex.raw('DROP TRIGGER IF EXISTS trigger_match_outcomes_updated_at ON match_outcomes');
  await knex.raw('DROP TRIGGER IF EXISTS trigger_ml_models_updated_at ON ml_models');
  await knex.raw('DROP FUNCTION IF EXISTS update_ml_models_updated_at()');

  // Drop tables in reverse order (respecting foreign keys)
  await knex.schema.dropTableIfExists('ab_test_experiments');
  await knex.schema.dropTableIfExists('ab_test_assignments');
  await knex.schema.dropTableIfExists('ml_model_performance');
  await knex.schema.dropTableIfExists('ml_predictions');
  await knex.schema.dropTableIfExists('ml_match_features');
  await knex.schema.dropTableIfExists('match_outcomes');
  await knex.schema.dropTableIfExists('ml_models');
}
