/**
 * Types for ML-based shift matching system
 */

export interface MLFeatureVector {
  // Original rule-based scores
  skill_match: number;
  availability_match: number;
  proximity_match: number;
  preference_match: number;
  experience_match: number;
  reliability_match: number;
  compliance_match: number;
  capacity_match: number;

  // Derived features
  distance_miles: number;
  estimated_travel_minutes: number;
  previous_visits_with_client: number;
  caregiver_reliability_score: number;
  caregiver_weekly_hours: number;
  caregiver_weekly_utilization: number;
  shift_duration_hours: number;
  is_weekend: boolean;
  is_evening: boolean;
  is_night: boolean;
  day_of_week: number; // 0-6
  hour_of_day: number; // 0-23

  // Caregiver characteristics
  caregiver_experience_years: number;
  caregiver_total_clients: number;
  caregiver_acceptance_rate_30d: number;
  caregiver_no_show_rate_30d: number;
  caregiver_avg_rating: number;

  // Client characteristics
  client_total_visits: number;
  client_avg_caregiver_rating: number;
  requires_specialized_skills: boolean;
  has_gender_preference: boolean;
  has_language_preference: boolean;

  // Contextual features
  time_to_shift_hours: number; // How far in future
  competing_caregivers_count: number;
  shift_priority: number; // 1-5
  is_recurring_visit: boolean;
  recent_rejection_count: number; // Caregiver rejections in last 30 days
}

export interface MLTrainingDataPoint {
  id: string;
  organization_id: string;
  open_shift_id: string | null;
  caregiver_id: string | null;
  visit_id: string | null;
  features: MLFeatureVector;

  // Outcome labels
  was_accepted: boolean | null;
  was_completed: boolean | null;
  was_no_show: boolean | null;
  was_late: boolean | null;
  client_satisfaction_rating: number | null;
  response_time_minutes: number | null;

  // Metadata
  rule_based_score: number;
  match_quality: string;
  matched_at: Date;
  shift_completed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface MLModelMetadata {
  id: string;
  organization_id: string | null;
  model_type: 'GRADIENT_BOOSTING' | 'LIGHTGBM' | 'XGBOOST';
  model_version: string;
  target_variable: 'match_success' | 'completion_rate' | 'no_show_probability';

  model_artifact: string; // Base64 encoded or storage reference
  feature_importance: Record<string, number>;
  hyperparameters: Record<string, string | number | boolean>;

  training_samples: number;
  training_started_at: Date;
  training_completed_at: Date;
  training_metrics: MLModelMetrics;
  validation_metrics: MLModelMetrics;

  status: 'TRAINING' | 'TRAINED' | 'DEPLOYED' | 'ARCHIVED' | 'FAILED';
  deployed_at: Date | null;
  archived_at: Date | null;

  is_active: boolean;
  replaces_model_id: string | null;

  created_at: Date;
  updated_at: Date;
}

export interface MLModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  auc_roc: number;
  confusion_matrix?: number[][];
  log_loss?: number;
  mean_squared_error?: number;
  mean_absolute_error?: number;
}

export interface MLPrediction {
  id: string;
  model_id: string;
  open_shift_id: string;
  caregiver_id: string;
  assignment_proposal_id: string | null;

  predicted_score: number; // 0-100
  prediction_details: {
    confidence_interval?: [number, number];
    feature_contributions?: Record<string, number>;
    probability_distribution?: Record<string, number>;
  };

  rule_based_score: number;
  hybrid_score: number;
  ml_weight: number;

  actual_accepted: boolean | null;
  actual_completed: boolean | null;
  actual_no_show: boolean | null;

  prediction_error: number | null;
  inference_time_ms: number | null;

  predicted_at: Date;
  outcome_recorded_at: Date | null;
  created_at: Date;
}

export interface ABTestAssignment {
  id: string;
  organization_id: string;
  open_shift_id: string;

  test_name: string;
  test_variant: 'CONTROL' | 'TREATMENT_A' | 'TREATMENT_B';
  test_version: number;

  assigned_at: Date;
  assignment_method: 'RANDOM' | 'HASH' | 'MANUAL';

  match_score: number | null;
  was_matched: boolean;
  was_accepted: boolean | null;
  was_completed: boolean | null;
  response_time_minutes: number | null;
  client_satisfaction_rating: number | null;

  metadata: Record<string, string | number | boolean>;
  created_at: Date;
  updated_at: Date;
}

export interface CaregiverPerformanceMetrics {
  id: string;
  caregiver_id: string;
  organization_id: string;

  period_start: Date;
  period_end: Date;
  period_type: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';

  total_visits: number;
  completed_visits: number;
  no_show_count: number;
  late_arrivals: number;
  early_departures: number;
  completion_rate: number;
  no_show_rate: number;

  proposals_received: number;
  proposals_accepted: number;
  proposals_rejected: number;
  acceptance_rate: number;
  avg_response_time_minutes: number;

  avg_client_rating: number;
  total_ratings: number;

  avg_travel_distance_miles: number;
  total_miles_traveled: number;

  created_at: Date;
  updated_at: Date;
}

export interface ClientCaregiverPairing {
  id: string;
  client_id: string;
  caregiver_id: string;
  organization_id: string;

  total_visits: number;
  completed_visits: number;
  first_visit_date: Date | null;
  last_visit_date: Date | null;

  avg_client_rating: number;
  total_ratings: number;
  no_show_count: number;
  incident_count: number;

  compatibility_score: number | null;
  compatibility_last_updated: Date | null;

  client_preferred: boolean;
  client_blocked: boolean;
  caregiver_preferred: boolean;
  caregiver_avoided: boolean;

  created_at: Date;
  updated_at: Date;
}

export interface ScheduleOptimization {
  id: string;
  organization_id: string;
  branch_id: string | null;

  schedule_date: Date;
  shift_ids: string[];
  caregiver_ids: string[] | null;

  primary_goal: 'MINIMIZE_TRAVEL_TIME' | 'MAXIMIZE_CONTINUITY' | 'BALANCE_WORKLOAD' | 'MAXIMIZE_SATISFACTION' | 'MINIMIZE_COST';
  constraints: ScheduleOptimizationConstraints;

  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  assignments: ScheduleAssignment[] | null;
  metrics: ScheduleOptimizationMetrics | null;
  optimization_score: number | null;

  computation_time_ms: number | null;
  iterations: number | null;
  algorithm_used: 'GREEDY' | 'CONSTRAINT_PROGRAMMING' | 'GENETIC_ALGORITHM' | null;

  applied: boolean;
  applied_at: Date | null;
  applied_by_user_id: string | null;

  created_at: Date;
  completed_at: Date | null;
}

export interface ScheduleOptimizationConstraints {
  max_travel_distance_miles?: number;
  max_shift_duration_hours?: number;
  max_consecutive_shifts?: number;
  required_break_hours?: number;
  respect_caregiver_preferences?: boolean;
  respect_client_preferences?: boolean;
  maintain_continuity?: boolean;
  balance_workload?: boolean;
}

export interface ScheduleAssignment {
  shift_id: string;
  caregiver_id: string;
  match_score: number;
  travel_distance_miles: number;
  travel_time_minutes: number;
  is_continuation: boolean; // Same caregiver as previous visit
  rationale: string[];
}

export interface ScheduleOptimizationMetrics {
  total_shifts: number;
  assigned_shifts: number;
  unassigned_shifts: number;

  total_travel_time_minutes: number;
  avg_travel_time_minutes: number;
  total_travel_distance_miles: number;

  continuity_rate: number; // % of visits with same caregiver
  avg_match_score: number;

  caregiver_utilization: Record<string, number>; // caregiver_id -> utilization %
  workload_balance_score: number; // 0-100, higher = more balanced

  constraints_satisfied: string[];
  constraints_violated: string[];
}

// Training configuration
export interface MLTrainingConfig {
  organization_id?: string; // Null = train global model
  target_variable: 'match_success' | 'completion_rate' | 'no_show_probability';
  model_type: 'GRADIENT_BOOSTING' | 'LIGHTGBM' | 'XGBOOST';

  hyperparameters?: {
    learning_rate?: number;
    max_depth?: number;
    n_estimators?: number;
    subsample?: number;
    colsample_bytree?: number;
    min_child_weight?: number;
    gamma?: number;
    [key: string]: string | number | boolean | undefined;
  };

  training_options?: {
    test_split?: number; // Default 0.2
    validation_split?: number; // Default 0.2
    random_state?: number;
    early_stopping_rounds?: number;
    verbose?: boolean;
  };

  feature_selection?: {
    enabled?: boolean;
    method?: 'correlation' | 'mutual_info' | 'feature_importance';
    threshold?: number;
  };

  data_filters?: {
    min_date?: Date;
    max_date?: Date;
    min_samples_per_caregiver?: number;
    min_samples_per_client?: number;
    exclude_outliers?: boolean;
  };
}

// Prediction request
export interface MLPredictionRequest {
  open_shift_id: string;
  caregiver_id: string;
  features: MLFeatureVector;
  rule_based_score: number;
  model_id?: string; // If not specified, use active model
}

// Hybrid scoring configuration
export interface HybridScoringConfig {
  ml_enabled: boolean;
  ml_weight: number; // 0.0 - 1.0
  ml_model_preference: 'GLOBAL' | 'ORG_SPECIFIC' | 'HYBRID';
  min_ml_confidence: number; // 0.0 - 1.0
  fallback_to_rule_based: boolean; // If ML fails or confidence too low
}

// A/B testing configuration
export interface ABTestConfig {
  test_name: string;
  test_version: number;
  enabled: boolean;
  variants: ABTestVariant[];
  assignment_strategy: 'RANDOM' | 'HASH' | 'PERCENTAGE';
  percentage_split?: Record<string, number>; // variant -> percentage
}

export interface ABTestVariant {
  name: 'CONTROL' | 'TREATMENT_A' | 'TREATMENT_B';
  description: string;
  config: HybridScoringConfig;
}

// Model retraining schedule
export interface ModelRetrainingSchedule {
  enabled: boolean;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  day_of_week?: number; // For weekly
  day_of_month?: number; // For monthly
  time_of_day?: string; // HH:MM format
  min_new_samples?: number; // Minimum new training samples before retraining
  auto_deploy?: boolean; // Automatically deploy if metrics improve
  performance_threshold?: number; // Only deploy if improvement > threshold
}

// Performance monitoring
export interface MLPerformanceReport {
  model_id: string;
  model_version: string;
  report_period_start: Date;
  report_period_end: Date;

  total_predictions: number;
  predictions_with_outcomes: number;

  online_metrics: MLModelMetrics;
  model_drift_score: number; // 0-100, higher = more drift
  feature_drift: Record<string, number>; // feature -> drift score

  prediction_distribution: {
    mean: number;
    median: number;
    std: number;
    quantiles: Record<string, number>;
  };

  error_analysis: {
    mean_absolute_error: number;
    mean_squared_error: number;
    error_by_score_range: Record<string, number>;
    worst_predictions: Array<{
      prediction_id: string;
      predicted_score: number;
      actual_outcome: boolean;
      error: number;
    }>;
  };

  recommendations: string[];
  requires_retraining: boolean;

  generated_at: Date;
}
