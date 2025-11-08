/**
 * Machine Learning Types for Shift Matching
 */

// ============================================================================
// ML Models
// ============================================================================

export type ModelType = 'gradient_boosting' | 'random_forest' | 'neural_network' | 'ensemble';
export type ModelFramework = 'xgboost' | 'lightgbm' | 'sklearn' | 'tensorflow' | 'onnx';
export type ModelFormat = 'onnx' | 'json' | 'pickle' | 'pmml';

export type ModelStatus =
  | 'TRAINING'
  | 'VALIDATING'
  | 'DEPLOYED'
  | 'SHADOW'      // Running but not affecting decisions
  | 'RETIRED'
  | 'FAILED';

export interface MLModel {
  id: string;
  organizationId: string;
  name: string;
  version: string;
  modelType: ModelType;
  framework: ModelFramework;
  description?: string;

  // Configuration
  hyperparameters: Record<string, unknown>;
  featureConfig: FeatureConfig;
  targetVariable: string;

  // Training metadata
  trainedAt: Date;
  trainedBy: string;
  trainingSamples: number;
  validationSamples?: number;
  trainingMetrics: TrainingMetrics;

  // Model artifact
  modelPath?: string;
  modelData?: Buffer;
  modelFormat: ModelFormat;

  // Status and deployment
  status: ModelStatus;
  deployedAt?: Date;
  retiredAt?: Date;

  // Performance tracking
  currentAccuracy?: number;
  baselineAccuracy?: number;
  predictionCount: number;

  // Audit
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string;
  version_number: number;
}

export interface FeatureConfig {
  version: string;
  features: FeatureDefinition[];
  scalingMethod?: 'standard' | 'minmax' | 'robust' | 'none';
  handleMissing?: 'mean' | 'median' | 'zero' | 'drop';
}

export interface FeatureDefinition {
  name: string;
  type: 'numeric' | 'categorical' | 'boolean' | 'temporal';
  importance?: number;
  scalingParams?: {
    mean?: number;
    std?: number;
    min?: number;
    max?: number;
  };
}

export interface TrainingMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  aucRoc: number;
  aucPr?: number;
  confusionMatrix?: ConfusionMatrix;
  crossValidationScores?: number[];
}

export interface ConfusionMatrix {
  truePositives: number;
  trueNegatives: number;
  falsePositives: number;
  falseNegatives: number;
}

// ============================================================================
// Match Outcomes
// ============================================================================

export type MatchOutcome =
  | 'COMPLETED'
  | 'NO_SHOW_CAREGIVER'
  | 'NO_SHOW_CLIENT'
  | 'CANCELLED_CAREGIVER'
  | 'CANCELLED_CLIENT'
  | 'CANCELLED_AGENCY'
  | 'IN_PROGRESS'
  | 'SCHEDULED';

export interface MatchOutcomeRecord {
  id: string;
  organizationId: string;
  branchId: string;

  // References
  visitId: string;
  openShiftId?: string;
  assignmentProposalId?: string;
  caregiverId: string;
  clientId: string;

  // Match quality at time of assignment
  matchScore?: number;
  matchQuality?: string;
  matchReasons?: Record<string, unknown>;

  // Outcome metrics
  outcome: MatchOutcome;
  wasSuccessful: boolean;
  scheduledStart: Date;
  scheduledEnd: Date;
  actualStart?: Date;
  actualEnd?: Date;

  // Quality metrics
  clientRating?: number;
  caregiverRating?: number;
  tasksCompleted?: boolean;
  incidentNotes?: string;
  hadIncident?: boolean;

  // Response metrics
  responseTimeMinutes?: number;
  assignmentAttemptNumber?: number;

  // Contextual data
  caregiverContext?: Record<string, unknown>;
  clientContext?: Record<string, unknown>;
  distanceMiles?: number;
  travelTimeMinutes?: number;

  // Audit
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string;
}

// ============================================================================
// ML Match Features
// ============================================================================

export interface MLMatchFeatures {
  id: string;
  organizationId: string;

  // References
  caregiverId: string;
  clientId: string;
  shiftId?: string;
  matchOutcomeId?: string;

  // Computed at
  computedAt: Date;

  // Compatibility features
  skillMatchScore?: number;
  experienceScore?: number;
  preferenceScore?: number;
  previousVisitsCount?: number;
  avgClientRating?: number;
  hasWorkedTogether?: boolean;
  daysSinceLastVisit?: number;

  // Temporal features
  dayOfWeek?: string;
  hourOfDay?: number;
  isWeekend?: boolean;
  isHoliday?: boolean;
  timeOfDayPreference?: 'morning' | 'afternoon' | 'evening' | 'night';

  // Spatial features
  distanceMiles?: number;
  travelTimeMinutes?: number;
  inPreferredArea?: boolean;
  shiftsInAreaLast30d?: number;

  // Caregiver state features
  currentWeekHours?: number;
  capacityUtilization?: number;
  activeShiftsCount?: number;
  reliabilityScore90d?: number;
  noShowCount90d?: number;
  cancellationCount90d?: number;
  rejectionCount30d?: number;

  // Client features
  clientHasSpecialNeeds?: boolean;
  requiredSkills?: string[];
  requiredCertifications?: string[];
  genderPreference?: string;
  languagePreference?: string;

  // Historical performance features
  caregiverAvgRating?: number;
  totalCompletedVisits?: number;
  completionRate?: number;
  onTimeRate?: number;

  // Interaction features
  isPreferredCaregiver?: boolean;
  isBlockedCaregiver?: boolean;
  mutualPreferenceScore?: number;

  // Target variable (for training data)
  targetSuccess?: boolean;

  // Feature version
  featureVersion: string;
}

// ============================================================================
// ML Predictions
// ============================================================================

export type PredictionClass = 'LIKELY_SUCCESS' | 'LIKELY_FAILURE' | 'UNCERTAIN';

export interface MLPrediction {
  id: string;
  organizationId: string;

  // Model reference
  modelId: string;
  modelVersion: string;

  // What we predicted for
  shiftId?: string;
  caregiverId: string;
  clientId: string;
  featureSetId?: string;

  // Prediction
  predictedScore: number; // 0-1 probability
  confidence?: number;
  predictionClass?: PredictionClass;
  classProbabilities?: Record<string, number>;

  // Feature importance
  featureImportance?: Record<string, number>;

  // Context
  predictedAt: Date;
  wasUsedInMatching: boolean;
  finalMatchScore?: number;

  // Actual outcome
  matchOutcomeId?: string;
  actualOutcome?: boolean;
  outcomeRecordedAt?: Date;
  predictionCorrect?: boolean;

  // Performance
  inferenceTimeMs?: number;
}

// ============================================================================
// ML Model Performance
// ============================================================================

export type AggregationLevel = 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY';

export interface MLModelPerformance {
  id: string;
  organizationId: string;

  // Model reference
  modelId: string;
  modelVersion: string;

  // Time window
  periodStart: Date;
  periodEnd: Date;
  aggregationLevel: AggregationLevel;

  // Volume metrics
  predictionCount: number;
  predictionsWithOutcomes: number;

  // Classification metrics
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1Score?: number;
  aucRoc?: number;
  aucPr?: number;

  // Confusion matrix
  truePositives: number;
  trueNegatives: number;
  falsePositives: number;
  falseNegatives: number;

  // Calibration
  brierScore?: number;
  logLoss?: number;

  // Performance vs baseline
  baselineAccuracy?: number;
  liftOverBaseline?: number;

  // Operational metrics
  avgInferenceTimeMs?: number;
  p95InferenceTimeMs?: number;
  p99InferenceTimeMs?: number;

  // Distribution stats
  avgPredictedScore?: number;
  stdPredictedScore?: number;
  scoreDistribution?: Record<string, number>;

  // Feature drift
  featureDriftScores?: Record<string, number>;
  driftDetected: boolean;

  // Audit
  computedAt: Date;
}

// ============================================================================
// A/B Testing
// ============================================================================

export type ExperimentStatus = 'DRAFT' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
export type EntityType = 'CAREGIVER' | 'SHIFT' | 'CLIENT' | 'BRANCH';
export type AssignmentStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface ABTestExperiment {
  id: string;
  organizationId: string;

  // Experiment definition
  experimentId: string;
  name: string;
  description?: string;
  hypothesis?: string;

  // Configuration
  variants: ExperimentVariant[];
  entityType: EntityType;
  targetingRules?: Record<string, unknown>;

  // Status and timeline
  status: ExperimentStatus;
  startDate?: Date;
  endDate?: Date;
  actualStartDate?: Date;
  actualEndDate?: Date;

  // Sample size and power
  targetSampleSize?: number;
  currentSampleSize: number;
  minimumDetectableEffect?: number;
  statisticalPower?: number;

  // Success metrics
  primaryMetrics: MetricDefinition[];
  secondaryMetrics?: MetricDefinition[];
  guardrailMetrics?: MetricDefinition[];

  // Results
  results?: ExperimentResults;
  winner?: string;
  isSignificant?: boolean;
  pValue?: number;

  // Audit
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string;
}

export interface ExperimentVariant {
  name: string;
  weight: number; // 0-1
  description?: string;
  config?: Record<string, unknown>;
}

export interface MetricDefinition {
  name: string;
  type: 'conversion' | 'numeric' | 'duration';
  goal: 'maximize' | 'minimize';
  description?: string;
}

export interface ExperimentResults {
  variantResults: Record<string, VariantResults>;
  statisticalTests: Record<string, StatisticalTest>;
  recommendedDecision?: 'deploy_winner' | 'continue_test' | 'stop_inconclusive';
}

export interface VariantResults {
  variantName: string;
  sampleSize: number;
  metrics: Record<string, number>;
  confidenceIntervals: Record<string, ConfidenceInterval>;
}

export interface ConfidenceInterval {
  lower: number;
  upper: number;
  level: number; // 0.95, 0.99, etc.
}

export interface StatisticalTest {
  metricName: string;
  testType: 'ttest' | 'chi_square' | 'mann_whitney';
  pValue: number;
  effectSize: number;
  isSignificant: boolean;
  confidenceLevel: number;
}

export interface ABTestAssignment {
  id: string;
  organizationId: string;

  // Experiment metadata
  experimentName: string;
  experimentId: string;
  description?: string;

  // Assignment
  entityId: string;
  entityType: EntityType;
  variant: string;

  // Status
  status: AssignmentStatus;
  assignedAt: Date;
  completedAt?: Date;

  // Sticky assignment
  assignmentHash: string;

  // Results tracking
  matchesAttempted: number;
  matchesSuccessful: number;
  avgMatchScore?: number;
  avgResponseTimeMinutes?: number;
  metrics?: Record<string, unknown>;
}

// ============================================================================
// Service Interfaces
// ============================================================================

export interface FeatureEngineeringService {
  computeFeatures(caregiverId: string, clientId: string, shiftId?: string): Promise<MLMatchFeatures>;
  computeBatchFeatures(pairs: Array<{ caregiverId: string; clientId: string; shiftId?: string }>): Promise<MLMatchFeatures[]>;
  extractTrainingData(startDate: Date, endDate: Date): Promise<MLMatchFeatures[]>;
}

export interface MLInferenceService {
  predict(features: MLMatchFeatures): Promise<MLPrediction>;
  predictBatch(featureSets: MLMatchFeatures[]): Promise<MLPrediction[]>;
  getActiveModel(organizationId: string): Promise<MLModel | null>;
  recordPredictionOutcome(predictionId: string, outcome: boolean): Promise<void>;
}

export interface ABTestingService {
  getAssignment(experimentId: string, entityId: string, entityType: EntityType): Promise<ABTestAssignment>;
  createExperiment(experiment: Partial<ABTestExperiment>): Promise<ABTestExperiment>;
  startExperiment(experimentId: string): Promise<void>;
  stopExperiment(experimentId: string): Promise<void>;
  analyzeExperiment(experimentId: string): Promise<ExperimentResults>;
}

export interface ModelPerformanceService {
  recordPrediction(prediction: MLPrediction): Promise<void>;
  computePerformanceMetrics(modelId: string, periodStart: Date, periodEnd: Date): Promise<MLModelPerformance>;
  detectDrift(modelId: string): Promise<boolean>;
  generatePerformanceReport(modelId: string): Promise<PerformanceReport>;
}

export interface PerformanceReport {
  modelId: string;
  modelVersion: string;
  reportPeriod: {
    start: Date;
    end: Date;
  };
  overallMetrics: TrainingMetrics;
  timeSeriesMetrics: MLModelPerformance[];
  driftAnalysis: DriftAnalysis;
  recommendations: string[];
}

export interface DriftAnalysis {
  hasDrift: boolean;
  driftedFeatures: string[];
  driftScores: Record<string, number>;
  referenceDistribution: Record<string, unknown>;
  currentDistribution: Record<string, unknown>;
}

// ============================================================================
// Request/Response Types
// ============================================================================

export interface TrainModelRequest {
  organizationId: string;
  modelName: string;
  modelType: ModelType;
  framework: ModelFramework;
  hyperparameters?: Record<string, unknown>;
  trainingDataStart: Date;
  trainingDataEnd: Date;
  validationSplit?: number;
}

export interface TrainModelResponse {
  modelId: string;
  version: string;
  trainingMetrics: TrainingMetrics;
  status: ModelStatus;
}

export interface PredictMatchSuccessRequest {
  caregiverId: string;
  clientId: string;
  shiftId?: string;
  useMLModel?: boolean;
}

export interface PredictMatchSuccessResponse {
  predictedScore: number;
  confidence: number;
  predictionClass: PredictionClass;
  featureImportance: Record<string, number>;
  modelVersion: string;
}

export interface MatchOutcomeInput {
  visitId: string;
  caregiverId: string;
  clientId: string;
  outcome: MatchOutcome;
  scheduledStart: Date;
  scheduledEnd: Date;
  actualStart?: Date;
  actualEnd?: Date;
  clientRating?: number;
  caregiverRating?: number;
  matchScore?: number;
}
