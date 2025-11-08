/**
 * ML Inference Service
 *
 * Handles ML model loading and prediction inference
 */

// Database type - using any for now as this vertical uses pg.Pool
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import {
  type MLModel,
  type MLPrediction,
  type MLMatchFeatures,
  type PredictionClass,
} from '../types/ml-types';

export interface PredictionInput {
  features: MLMatchFeatures;
  modelId?: string; // If not provided, uses active model
}

export class MLInferenceService {
  private modelCache: Map<string, MLModel> = new Map();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(private db: any) {}

  /**
   * Make a prediction for a single feature set
   */
  async predict(
    features: MLMatchFeatures,
    modelId?: string
  ): Promise<MLPrediction> {
    const startTime = Date.now();

    // Get active model
    const model = modelId
      ? await this.getModel(modelId)
      : await this.getActiveModel(features.organizationId);

    if (!model) {
      throw new Error('No active ML model found for organization');
    }

    // Run inference
    const predictionResult = await this.runInference(model, features);

    const inferenceTimeMs = Date.now() - startTime;

    // Create prediction record
    const prediction: Partial<MLPrediction> = {
      organizationId: features.organizationId,
      modelId: model.id,
      modelVersion: model.version,
      shiftId: features.shiftId,
      caregiverId: features.caregiverId,
      clientId: features.clientId,
      featureSetId: features.id,
      predictedScore: predictionResult.score,
      confidence: predictionResult.confidence,
      predictionClass: predictionResult.class,
      classProbabilities: predictionResult.classProbabilities,
      featureImportance: predictionResult.featureImportance,
      predictedAt: new Date(),
      wasUsedInMatching: false,
      inferenceTimeMs,
    };

    // Save prediction to database
    const predictionId = await this.savePrediction(prediction as MLPrediction);

    return {
      ...prediction,
      id: predictionId,
    } as MLPrediction;
  }

  /**
   * Make predictions for multiple feature sets in batch
   */
  async predictBatch(
    featureSets: MLMatchFeatures[],
    modelId?: string
  ): Promise<MLPrediction[]> {
    // For now, process sequentially - could be optimized with batch inference
    const predictions: MLPrediction[] = [];

    for (const features of featureSets) {
      try {
        const prediction = await this.predict(features, modelId);
        predictions.push(prediction);
      } catch (error) {
        console.error(`Failed to predict for features ${features.id}:`, error);
      }
    }

    return predictions;
  }

  /**
   * Get the active model for an organization
   */
  async getActiveModel(organizationId: string): Promise<MLModel | null> {
    const model = await this.db('ml_models')
      .where('organization_id', organizationId)
      .where('status', 'DEPLOYED')
      .orderBy('deployed_at', 'desc')
      .first();

    if (!model) {
      return null;
    }

    return this.mapDbModelToModel(model);
  }

  /**
   * Get a specific model by ID
   */
  async getModel(modelId: string): Promise<MLModel | null> {
    // Check cache first
    if (this.modelCache.has(modelId)) {
      return this.modelCache.get(modelId)!;
    }

    const model = await this.db('ml_models')
      .where('id', modelId)
      .first();

    if (!model) {
      return null;
    }

    const mappedModel = this.mapDbModelToModel(model);
    this.modelCache.set(modelId, mappedModel);

    return mappedModel;
  }

  /**
   * Record the actual outcome for a prediction
   */
  async recordPredictionOutcome(
    predictionId: string,
    outcome: boolean,
    matchOutcomeId?: string
  ): Promise<void> {
    const prediction = await this.db('ml_predictions')
      .where('id', predictionId)
      .first();

    if (!prediction) {
      throw new Error(`Prediction ${predictionId} not found`);
    }

    const predictionCorrect = (prediction.predicted_score >= 0.5) === outcome;

    await this.db('ml_predictions')
      .where('id', predictionId)
      .update({
        actual_outcome: outcome,
        match_outcome_id: matchOutcomeId,
        outcome_recorded_at: new Date(),
        prediction_correct: predictionCorrect,
      });
  }

  /**
   * Mark prediction as used in matching decision
   */
  async markPredictionUsed(
    predictionId: string,
    finalMatchScore: number
  ): Promise<void> {
    await this.db('ml_predictions')
      .where('id', predictionId)
      .update({
        was_used_in_matching: true,
        final_match_score: finalMatchScore,
      });
  }

  // ============================================================================
  // Private methods
  // ============================================================================

  /**
   * Run inference using the model
   * This is a placeholder - in production would use actual ML framework
   */
  private async runInference(
    _model: MLModel,
    features: MLMatchFeatures
  ): Promise<{
    score: number;
    confidence: number;
    class: PredictionClass;
    classProbabilities: Record<string, number>;
    featureImportance: Record<string, number>;
  }> {
    // For now, use a simple heuristic-based scoring
    // In production, this would use ONNX Runtime, TensorFlow.js, or similar

    const score = this.computeHeuristicScore(features);
    const confidence = this.computeConfidence(features);

    let predictionClass: PredictionClass = 'UNCERTAIN';
    if (score >= 0.7 && confidence >= 0.8) {
      predictionClass = 'LIKELY_SUCCESS';
    } else if (score < 0.4) {
      predictionClass = 'LIKELY_FAILURE';
    }

    const classProbabilities = {
      success: score,
      failure: 1 - score,
    };

    const featureImportance = this.computeFeatureImportance(features);

    return {
      score,
      confidence,
      class: predictionClass,
      classProbabilities,
      featureImportance,
    };
  }

  /**
   * Heuristic scoring function
   * This simulates ML model predictions until real model is trained
   */
  private computeHeuristicScore(features: MLMatchFeatures): number {
    let score = 0.5; // Start neutral

    // Skill match heavily weighted
    if (features.skillMatchScore !== undefined) {
      score += (features.skillMatchScore / 100) * 0.3;
    }

    // Historical success with client
    if (features.hasWorkedTogether && features.avgClientRating) {
      score += (features.avgClientRating / 5.0) * 0.2;
    }

    // Distance penalty
    if (features.distanceMiles !== undefined) {
      const distancePenalty = Math.max(0, (20 - features.distanceMiles) / 20) * 0.15;
      score += distancePenalty;
    }

    // Reliability
    if (features.reliabilityScore90d !== undefined) {
      score += (features.reliabilityScore90d / 100) * 0.2;
    }

    // Preference match
    if (features.isPreferredCaregiver) {
      score += 0.15;
    }
    if (features.isBlockedCaregiver) {
      score -= 0.5; // Strong penalty
    }

    // Capacity utilization - prefer 60-80% utilization
    if (features.capacityUtilization !== undefined) {
      if (features.capacityUtilization >= 0.6 && features.capacityUtilization <= 0.8) {
        score += 0.1;
      } else if (features.capacityUtilization > 0.9) {
        score -= 0.1; // Overloaded
      }
    }

    // Normalize to 0-1 range
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Compute confidence in the prediction
   */
  private computeConfidence(features: MLMatchFeatures): number {
    let confidence = 0.5;

    // More historical data = more confidence
    if (features.totalCompletedVisits !== undefined) {
      confidence += Math.min(0.3, features.totalCompletedVisits / 100);
    }

    // Worked together before = higher confidence
    if (features.hasWorkedTogether) {
      confidence += 0.2;
    }

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Compute feature importance (SHAP-like values)
   */
  private computeFeatureImportance(_features: MLMatchFeatures): Record<string, number> {
    // In production, this would come from the ML model
    return {
      skillMatchScore: 0.25,
      hasWorkedTogether: 0.15,
      distanceMiles: 0.15,
      reliabilityScore90d: 0.15,
      capacityUtilization: 0.10,
      avgClientRating: 0.10,
      isPreferredCaregiver: 0.05,
      completionRate: 0.05,
    };
  }

  /**
   * Save prediction to database
   */
  private async savePrediction(prediction: MLPrediction): Promise<string> {
    const [result] = await this.db('ml_predictions')
      .insert({
        organization_id: prediction.organizationId,
        model_id: prediction.modelId,
        model_version: prediction.modelVersion,
        shift_id: prediction.shiftId,
        caregiver_id: prediction.caregiverId,
        client_id: prediction.clientId,
        feature_set_id: prediction.featureSetId,
        predicted_score: prediction.predictedScore,
        confidence: prediction.confidence,
        prediction_class: prediction.predictionClass,
        class_probabilities: JSON.stringify(prediction.classProbabilities),
        feature_importance: JSON.stringify(prediction.featureImportance),
        predicted_at: prediction.predictedAt,
        was_used_in_matching: prediction.wasUsedInMatching,
        final_match_score: prediction.finalMatchScore,
        inference_time_ms: prediction.inferenceTimeMs,
      })
      .returning('id');

    return result.id;
  }

  /**
   * Map database model to domain model
   */
  private mapDbModelToModel(dbModel: any): MLModel {
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
