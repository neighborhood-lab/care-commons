/**
 * API Handlers for ML-Enhanced Shift Matching
 *
 * HTTP request handlers for:
 * - ML model management
 * - A/B testing
 * - Match outcome tracking
 * - Performance monitoring
 */

import type { UserContext } from '@care-commons/core';
import { MLFeatureEngineeringService } from '../services/ml-feature-engineering-service';
import { MLInferenceService } from '../services/ml-inference-service';
import { ABTestingService } from '../services/ab-testing-service';
import { MatchOutcomeService } from '../services/match-outcome-service';
import { MLEnhancedMatchingService } from '../services/ml-enhanced-matching-service';
import type {
  MLModel,
  MLPrediction,
  ABTestExperiment,
  ABTestAssignment,
  MatchOutcomeInput,
  MatchOutcomeRecord,
  PredictMatchSuccessRequest,
  PredictMatchSuccessResponse,
  TrainModelRequest,
  TrainModelResponse,
} from '../types/ml-types';

export class MLHandlers {
  private featureService: MLFeatureEngineeringService;
  private inferenceService: MLInferenceService;
  private abTestService: ABTestingService;
  private outcomeService: MatchOutcomeService;
  private mlMatchingService: MLEnhancedMatchingService;

  constructor(private db: any) {
    this.featureService = new MLFeatureEngineeringService(db);
    this.inferenceService = new MLInferenceService(db);
    this.abTestService = new ABTestingService(db);
    this.outcomeService = new MatchOutcomeService(db);
    this.mlMatchingService = new MLEnhancedMatchingService(db);
  }

  /**
   * ==========================================================================
   * ML MODEL MANAGEMENT
   * ==========================================================================
   */

  /**
   * POST /ml/models/train
   * Trigger training of a new ML model
   */
  async trainModel(
    _request: TrainModelRequest,
    _context: UserContext
  ): Promise<TrainModelResponse> {
    // In production, this would queue a background job
    // For now, return a mock response
    return {
      modelId: 'model_' + Date.now(),
      version: 'v1.0',
      status: 'TRAINING',
      trainingMetrics: {
        accuracy: 0,
        precision: 0,
        recall: 0,
        f1Score: 0,
        aucRoc: 0,
      },
    };
  }

  /**
   * POST /ml/models/:modelId/deploy
   * Deploy a trained model to production
   */
  async deployModel(
    modelId: string,
    _context: UserContext
  ): Promise<{ success: boolean; message: string }> {
    // Retire existing deployed models
    await this.db('ml_models')
      .where('status', 'DEPLOYED')
      .update({
        status: 'RETIRED',
        retired_at: new Date(),
        updated_at: new Date(),
      });

    // Deploy new model
    await this.db('ml_models')
      .where('id', modelId)
      .update({
        status: 'DEPLOYED',
        deployed_at: new Date(),
        updated_at: new Date(),
      });

    return {
      success: true,
      message: 'Model deployed successfully',
    };
  }

  /**
   * GET /ml/models
   * List all ML models
   */
  async listModels(
    organizationId: string,
    _context: UserContext
  ): Promise<MLModel[]> {
    const models = await this.db('ml_models')
      .where('organization_id', organizationId)
      .orderBy('created_at', 'desc');

    return models.map(this.mapDbToModel);
  }

  /**
   * GET /ml/models/:modelId
   * Get details of a specific model
   */
  async getModel(
    modelId: string,
    _context: UserContext
  ): Promise<MLModel | null> {
    return this.inferenceService.getModel(modelId);
  }

  /**
   * GET /ml/models/active
   * Get the currently active model
   */
  async getActiveModel(
    organizationId: string,
    _context: UserContext
  ): Promise<MLModel | null> {
    return this.inferenceService.getActiveModel(organizationId);
  }

  /**
   * ==========================================================================
   * ML PREDICTIONS
   * ==========================================================================
   */

  /**
   * POST /ml/predict
   * Predict match success for a caregiver-client-shift combination
   */
  async predictMatchSuccess(
    request: PredictMatchSuccessRequest,
    _context: UserContext
  ): Promise<PredictMatchSuccessResponse> {
    // Compute features
    const features = await this.featureService.computeFeatures({
      caregiverId: request.caregiverId,
      clientId: request.clientId,
      shiftId: request.shiftId,
    });

    // Get prediction
    const prediction = await this.inferenceService.predict(features);

    return {
      predictedScore: prediction.predictedScore,
      confidence: prediction.confidence || 0,
      predictionClass: prediction.predictionClass || 'UNCERTAIN',
      featureImportance: prediction.featureImportance || {},
      modelVersion: prediction.modelVersion,
    };
  }

  /**
   * GET /ml/predictions/:predictionId
   * Get details of a specific prediction
   */
  async getPrediction(
    predictionId: string,
    _context: UserContext
  ): Promise<MLPrediction | null> {
    const prediction = await this.db('ml_predictions')
      .where('id', predictionId)
      .first();

    return prediction || null;
  }

  /**
   * POST /ml/predictions/:predictionId/outcome
   * Record the actual outcome for a prediction
   */
  async recordPredictionOutcome(
    predictionId: string,
    outcome: boolean,
    matchOutcomeId: string | undefined,
    _context: UserContext
  ): Promise<{ success: boolean }> {
    await this.inferenceService.recordPredictionOutcome(
      predictionId,
      outcome,
      matchOutcomeId
    );

    return { success: true };
  }

  /**
   * ==========================================================================
   * MATCH OUTCOMES
   * ==========================================================================
   */

  /**
   * POST /ml/outcomes
   * Record a match outcome
   */
  async recordMatchOutcome(
    input: MatchOutcomeInput,
    _context: UserContext
  ): Promise<{ id: string }> {
    const outcomeId = await this.outcomeService.recordOutcome(input);
    return { id: outcomeId };
  }

  /**
   * GET /ml/outcomes/caregiver/:caregiverId/client/:clientId
   * Get match outcomes for a caregiver-client pair
   */
  async getOutcomes(
    caregiverId: string,
    clientId: string,
    _context: UserContext
  ): Promise<MatchOutcomeRecord[]> {
    return this.outcomeService.getOutcomes(caregiverId, clientId);
  }

  /**
   * GET /ml/outcomes/caregiver/:caregiverId/metrics
   * Get performance metrics for a caregiver
   */
  async getCaregiverMetrics(
    caregiverId: string,
    days: number = 90,
    _context: UserContext
  ): Promise<{
    successRate: number;
    noShowRate: number;
    completionRate: number;
  }> {
    const [successRate, noShowRate, completionRate] = await Promise.all([
      this.outcomeService.getSuccessRate(caregiverId, caregiverId),
      this.outcomeService.getNoShowRate(caregiverId, days),
      this.outcomeService.getCompletionRate(caregiverId, days),
    ]);

    return {
      successRate,
      noShowRate,
      completionRate,
    };
  }

  /**
   * ==========================================================================
   * A/B TESTING
   * ==========================================================================
   */

  /**
   * POST /ml/experiments
   * Create a new A/B test experiment
   */
  async createExperiment(
    experiment: Partial<ABTestExperiment>,
    _context: UserContext
  ): Promise<ABTestExperiment> {
    return this.abTestService.createExperiment(experiment);
  }

  /**
   * POST /ml/experiments/:experimentId/start
   * Start an experiment
   */
  async startExperiment(
    experimentId: string,
    _context: UserContext
  ): Promise<{ success: boolean }> {
    await this.abTestService.startExperiment(experimentId);
    return { success: true };
  }

  /**
   * POST /ml/experiments/:experimentId/stop
   * Stop an experiment
   */
  async stopExperiment(
    experimentId: string,
    _context: UserContext
  ): Promise<{ success: boolean }> {
    await this.abTestService.stopExperiment(experimentId);
    return { success: true };
  }

  /**
   * GET /ml/experiments/:experimentId/analyze
   * Analyze experiment results
   */
  async analyzeExperiment(
    experimentId: string,
    _context: UserContext
  ): Promise<any> {
    return this.abTestService.analyzeExperiment(experimentId);
  }

  /**
   * GET /ml/experiments/:experimentId
   * Get experiment details
   */
  async getExperiment(
    experimentId: string,
    _context: UserContext
  ): Promise<ABTestExperiment | null> {
    return this.abTestService.getExperiment(experimentId);
  }

  /**
   * GET /ml/experiments
   * List all experiments
   */
  async listExperiments(
    organizationId: string,
    status: string | undefined,
    _context: UserContext
  ): Promise<ABTestExperiment[]> {
    return this.abTestService.listExperiments(organizationId, status);
  }

  /**
   * GET /ml/experiments/:experimentId/assignment
   * Get A/B test assignment for an entity
   */
  async getAssignment(
    experimentId: string,
    entityId: string,
    entityType: 'CAREGIVER' | 'SHIFT' | 'CLIENT' | 'BRANCH',
    _context: UserContext
  ): Promise<ABTestAssignment> {
    return this.abTestService.getAssignment(experimentId, entityId, entityType);
  }

  /**
   * ==========================================================================
   * PERFORMANCE MONITORING
   * ==========================================================================
   */

  /**
   * GET /ml/models/:modelId/performance
   * Get performance metrics for a model
   */
  async getModelPerformance(
    modelId: string,
    startDate: Date,
    endDate: Date,
    _context: UserContext
  ): Promise<any> {
    const performance = await this.db('ml_model_performance')
      .where('model_id', modelId)
      .whereBetween('period_start', [startDate, endDate])
      .orderBy('period_start', 'asc');

    return performance;
  }

  /**
   * GET /ml/models/:modelId/accuracy
   * Get current accuracy of a deployed model
   */
  async getModelAccuracy(
    modelId: string,
    _context: UserContext
  ): Promise<{
    accuracy: number;
    sampleSize: number;
    period: { start: Date; end: Date };
  }> {
    const predictions = await this.db('ml_predictions')
      .where('model_id', modelId)
      .whereNotNull('actual_outcome')
      .select(
        this.db.raw('COUNT(*) as sample_size'),
        this.db.raw('SUM(CASE WHEN prediction_correct THEN 1 ELSE 0 END)::float / COUNT(*) as accuracy'),
        this.db.raw('MIN(predicted_at) as start_date'),
        this.db.raw('MAX(predicted_at) as end_date')
      )
      .first();

    return {
      accuracy: predictions?.accuracy || 0,
      sampleSize: Number.parseInt(predictions?.sample_size || '0'),
      period: {
        start: predictions?.start_date || new Date(),
        end: predictions?.end_date || new Date(),
      },
    };
  }

  /**
   * ==========================================================================
   * MATCHING STRATEGY
   * ==========================================================================
   */

  /**
   * GET /ml/matching/strategy
   * Get the optimal matching strategy based on A/B test results
   */
  async getOptimalStrategy(
    organizationId: string,
    _context: UserContext
  ): Promise<{
    useMLScoring: boolean;
    mlWeight: number;
    reason: string;
  }> {
    const strategy = await this.mlMatchingService.getOptimalMatchingStrategy(organizationId);

    return {
      useMLScoring: strategy.useMLScoring || false,
      mlWeight: strategy.mlWeight || 0,
      reason: strategy.useMLScoring
        ? `ML model has proven effective (weight: ${strategy.mlWeight})`
        : 'Using rule-based matching (no successful ML experiments)',
    };
  }

  // ============================================================================
  // Private helper methods
  // ============================================================================

  private mapDbToModel(dbModel: any): MLModel {
    return {
      id: dbModel.id,
      organizationId: dbModel.organization_id,
      name: dbModel.name,
      version: dbModel.version,
      modelType: dbModel.model_type,
      framework: dbModel.framework,
      description: dbModel.description,
      hyperparameters: dbModel.hyperparameters,
      featureConfig: dbModel.feature_config,
      targetVariable: dbModel.target_variable,
      trainedAt: dbModel.trained_at,
      trainedBy: dbModel.trained_by,
      trainingSamples: dbModel.training_samples,
      validationSamples: dbModel.validation_samples,
      trainingMetrics: dbModel.training_metrics,
      modelPath: dbModel.model_path,
      modelData: dbModel.model_data,
      modelFormat: dbModel.model_format,
      status: dbModel.status,
      deployedAt: dbModel.deployed_at,
      retiredAt: dbModel.retired_at,
      currentAccuracy: dbModel.current_accuracy,
      baselineAccuracy: dbModel.baseline_accuracy,
      predictionCount: dbModel.prediction_count,
      createdAt: dbModel.created_at,
      createdBy: dbModel.created_by,
      updatedAt: dbModel.updated_at,
      updatedBy: dbModel.updated_by,
      version_number: dbModel.version,
    };
  }
}
