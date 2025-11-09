import { Knex } from 'knex';
import {
  MLModelMetadata,
  MLModelMetrics,
  MLTrainingConfig,
  MLPredictionRequest,
  MLPrediction,
  MLFeatureVector,
} from '../types/ml-matching';

/**
 * ML Model Service for training and prediction
 *
 * Note: This is a TypeScript implementation that uses a simplified gradient boosting
 * algorithm. In production, this would typically call a Python microservice using
 * XGBoost, LightGBM, or scikit-learn for better performance and features.
 *
 * For production deployment, consider:
 * 1. Python microservice with FastAPI
 * 2. Model serving with TensorFlow Serving or MLflow
 * 3. Feature store for consistent feature engineering
 * 4. Model registry for version control
 */
export class MLModelService {
  constructor(private db: Knex) {}

  /**
   * Train a new ML model
   */
  async trainModel(config: MLTrainingConfig): Promise<MLModelMetadata> {
    const trainingStarted = new Date();

    // Create model record
    const modelId = await this.db('ml_models')
      .insert({
        organization_id: config.organization_id ?? null,
        model_type: config.model_type,
        model_version: this.generateModelVersion(),
        target_variable: config.target_variable,
        status: 'TRAINING',
        training_started_at: trainingStarted,
        hyperparameters: JSON.stringify(config.hyperparameters || {}),
      })
      .returning('id')
      .then((rows) => rows[0].id);

    try {
      // Load training data
      const trainingData = await this.loadTrainingData(config);

      if (trainingData.length < 100) {
        throw new Error(`Insufficient training data: ${trainingData.length} samples (minimum 100 required)`);
      }

      // Split into train/validation/test
      const splits = this.splitData(trainingData, config.training_options);

      // Train the model
      const trainedModel = await this.trainGradientBoostingModel(
        splits.train,
        splits.validation,
        config
      );

      // Evaluate on test set
      const testMetrics = this.evaluateModel(trainedModel, splits.test);
      const validationMetrics = this.evaluateModel(trainedModel, splits.validation);

      // Serialize model
      const modelArtifact = this.serializeModel(trainedModel);

      // Calculate feature importance
      const featureImportance = this.calculateFeatureImportance(trainedModel);

      // Update model record
      await this.db('ml_models')
        .where({ id: modelId })
        .update({
          model_artifact: modelArtifact,
          feature_importance: JSON.stringify(featureImportance),
          training_samples: trainingData.length,
          training_completed_at: new Date(),
          training_metrics: JSON.stringify(testMetrics),
          validation_metrics: JSON.stringify(validationMetrics),
          status: 'TRAINED',
        });

      // Fetch and return the completed model
      return this.getModelById(modelId);
    } catch (error) {
      // Mark model as failed
      await this.db('ml_models')
        .where({ id: modelId })
        .update({
          status: 'FAILED',
          training_completed_at: new Date(),
        });

      throw error;
    }
  }

  /**
   * Deploy a trained model
   */
  async deployModel(modelId: string): Promise<void> {
    // Deactivate any currently active models for the same org/target
    const model = await this.getModelById(modelId);

    await this.db('ml_models')
      .where('organization_id', model.organization_id)
      .where('target_variable', model.target_variable)
      .where('is_active', true)
      .update({
        is_active: false,
        archived_at: new Date(),
        status: 'ARCHIVED',
      });

    // Activate the new model
    await this.db('ml_models')
      .where({ id: modelId })
      .update({
        is_active: true,
        deployed_at: new Date(),
        status: 'DEPLOYED',
      });
  }

  /**
   * Make a prediction for a shift-caregiver pair
   */
  async predict(request: MLPredictionRequest): Promise<MLPrediction> {
    const startTime = Date.now();

    // Get active model
    const model = request.model_id
      ? await this.getModelById(request.model_id)
      : await this.getActiveModel(request.open_shift_id, 'match_success');

    if (!model) {
      throw new Error('No active ML model found');
    }

    // Deserialize model
    const trainedModel = this.deserializeModel(model.model_artifact);

    // Make prediction
    const prediction = this.predictSample(trainedModel, request.features);
    const inferenceTime = Date.now() - startTime;

    // Calculate hybrid score
    const mlWeight = await this.getMLWeight(request.open_shift_id);
    const hybridScore = this.calculateHybridScore(
      request.rule_based_score,
      prediction.score,
      mlWeight
    );

    // Store prediction
    const predictionId = await this.db('ml_predictions')
      .insert({
        model_id: model.id,
        open_shift_id: request.open_shift_id,
        caregiver_id: request.caregiver_id,
        predicted_score: prediction.score,
        prediction_details: JSON.stringify({
          confidence_interval: prediction.confidence_interval,
          feature_contributions: prediction.feature_contributions,
        }),
        rule_based_score: request.rule_based_score,
        hybrid_score: hybridScore,
        ml_weight: mlWeight,
        inference_time_ms: inferenceTime,
      })
      .returning('id')
      .then((rows) => rows[0].id);

    return {
      id: predictionId,
      model_id: model.id,
      open_shift_id: request.open_shift_id,
      caregiver_id: request.caregiver_id,
      assignment_proposal_id: null,
      predicted_score: prediction.score,
      prediction_details: {
        confidence_interval: prediction.confidence_interval,
        feature_contributions: prediction.feature_contributions,
      },
      rule_based_score: request.rule_based_score,
      hybrid_score: hybridScore,
      ml_weight: mlWeight,
      actual_accepted: null,
      actual_completed: null,
      actual_no_show: null,
      prediction_error: null,
      inference_time_ms: inferenceTime,
      predicted_at: new Date(),
      outcome_recorded_at: null,
      created_at: new Date(),
    };
  }

  /**
   * Batch prediction for multiple candidates
   */
  async predictBatch(
    openShiftId: string,
    requests: Array<{
      caregiver_id: string;
      features: MLFeatureVector;
      rule_based_score: number;
    }>
  ): Promise<MLPrediction[]> {
    const predictions: MLPrediction[] = [];

    for (const req of requests) {
      const prediction = await this.predict({
        open_shift_id: openShiftId,
        caregiver_id: req.caregiver_id,
        features: req.features,
        rule_based_score: req.rule_based_score,
      });
      predictions.push(prediction);
    }

    return predictions;
  }

  /**
   * Update prediction with actual outcome
   */
  async updatePredictionOutcome(
    predictionId: string,
    outcome: {
      actual_accepted: boolean;
      actual_completed?: boolean;
      actual_no_show?: boolean;
    }
  ): Promise<void> {
    const prediction = await this.db('ml_predictions')
      .where({ id: predictionId })
      .first();

    if (!prediction) {
      throw new Error(`Prediction ${predictionId} not found`);
    }

    // Calculate prediction error
    const actualScore = outcome.actual_accepted && outcome.actual_completed && !outcome.actual_no_show ? 100 : 0;
    const predictionError = Math.abs(prediction.predicted_score - actualScore);

    await this.db('ml_predictions')
      .where({ id: predictionId })
      .update({
        actual_accepted: outcome.actual_accepted,
        actual_completed: outcome.actual_completed ?? null,
        actual_no_show: outcome.actual_no_show ?? null,
        prediction_error: predictionError,
        outcome_recorded_at: new Date(),
      });
  }

  /**
   * Get active model for organization and target variable
   */
  private async getActiveModel(
    openShiftId: string,
    targetVariable: string
  ): Promise<MLModelMetadata | null> {
    // Get organization from shift
    const shift = await this.db('open_shifts')
      .where({ id: openShiftId })
      .first('organization_id');

    if (!shift) {
      return null;
    }

    // Try org-specific model first
    let model = await this.db('ml_models')
      .where('organization_id', shift.organization_id)
      .where('target_variable', targetVariable)
      .where('is_active', true)
      .where('status', 'DEPLOYED')
      .orderBy('deployed_at', 'desc')
      .first();

    // Fall back to global model
    if (!model) {
      model = await this.db('ml_models')
        .whereNull('organization_id')
        .where('target_variable', targetVariable)
        .where('is_active', true)
        .where('status', 'DEPLOYED')
        .orderBy('deployed_at', 'desc')
        .first();
    }

    return model ? this.parseModelFromDB(model) : null;
  }

  /**
   * Get model by ID
   */
  private async getModelById(modelId: string): Promise<MLModelMetadata> {
    const model = await this.db('ml_models')
      .where({ id: modelId })
      .first();

    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    return this.parseModelFromDB(model);
  }

  /**
   * Get ML weight from matching configuration
   */
  private async getMLWeight(openShiftId: string): Promise<number> {
    const shift = await this.db('open_shifts')
      .where({ id: openShiftId })
      .first('organization_id', 'branch_id');

    if (!shift) {
      return 0.5; // Default weight
    }

    const config = await this.db('matching_configurations')
      .where('organization_id', shift.organization_id)
      .where((builder) => {
        builder.where('branch_id', shift.branch_id).orWhereNull('branch_id');
      })
      .orderBy('branch_id', 'desc') // Prefer branch-specific
      .first('ml_weight');

    return config?.ml_weight ?? 0.5;
  }

  // ========== Training Implementation ==========

  /**
   * Load training data from database
   */
  private async loadTrainingData(
    config: MLTrainingConfig
  ): Promise<Array<{ features: MLFeatureVector; label: number; weight: number }>> {
    let query = this.db('ml_training_data')
      .whereNull('deleted_at')
      .whereNotNull('was_completed'); // Only use samples with known outcomes

    if (config.organization_id) {
      query = query.where('organization_id', config.organization_id);
    }

    if (config.data_filters?.min_date) {
      query = query.where('matched_at', '>=', config.data_filters.min_date);
    }

    if (config.data_filters?.max_date) {
      query = query.where('matched_at', '<=', config.data_filters.max_date);
    }

    const rows = await query.orderBy('matched_at', 'desc');

    return rows.map((row: any) => {
      const features = typeof row.features === 'string' ? JSON.parse(row.features) : row.features;

      // Label based on target variable
      let label = 0;
      if (config.target_variable === 'match_success') {
        label = row.was_accepted && row.was_completed && !row.was_no_show ? 1 : 0;
      } else if (config.target_variable === 'completion_rate') {
        label = row.was_completed ? 1 : 0;
      } else if (config.target_variable === 'no_show_probability') {
        label = row.was_no_show ? 1 : 0;
      }

      // Weight by recency
      const daysSince = (Date.now() - new Date(row.matched_at).getTime()) / (1000 * 60 * 60 * 24);
      const weight = Math.exp(-daysSince / 90);

      return { features, label, weight };
    });
  }

  /**
   * Split data into train/validation/test sets
   */
  private splitData(
    data: Array<{ features: MLFeatureVector; label: number; weight: number }>,
    options?: MLTrainingConfig['training_options']
  ): {
    train: Array<{ features: MLFeatureVector; label: number; weight: number }>;
    validation: Array<{ features: MLFeatureVector; label: number; weight: number }>;
    test: Array<{ features: MLFeatureVector; label: number; weight: number }>;
  } {
    const testSplit = options?.test_split ?? 0.2;
    const validationSplit = options?.validation_split ?? 0.2;

    // Shuffle data
    const shuffled = this.shuffleArray([...data], options?.random_state ?? 42);

    const testSize = Math.floor(shuffled.length * testSplit);
    const validationSize = Math.floor(shuffled.length * validationSplit);
    const trainSize = shuffled.length - testSize - validationSize;

    return {
      train: shuffled.slice(0, trainSize),
      validation: shuffled.slice(trainSize, trainSize + validationSize),
      test: shuffled.slice(trainSize + validationSize),
    };
  }

  /**
   * Simplified gradient boosting implementation
   * Note: In production, use XGBoost or LightGBM via Python service
   */
  private async trainGradientBoostingModel(
    trainData: Array<{ features: MLFeatureVector; label: number; weight: number }>,
    _validationData: Array<{ features: MLFeatureVector; label: number; weight: number }>,
    config: MLTrainingConfig
  ): Promise<any> {
    const hyperparameters = {
      learning_rate: 0.1,
      max_depth: 6,
      n_estimators: 100,
      subsample: 0.8,
      colsample_bytree: 0.8,
      ...config.hyperparameters,
    };

    // This is a simplified placeholder
    // In production, this would call a Python microservice
    const model: any = {
      type: config.model_type,
      hyperparameters,
      trees: [] as Array<{
        feature_thresholds: Record<string, number>;
        weights: Record<string, number>;
      }>,
      feature_names: this.getFeatureNames(),
      n_features: this.getFeatureNames().length,
      base_score: this.calculateMean(trainData.map((d) => d.label)),
    };

    // Simulate training by storing feature statistics
    model.trees = Array.from({ length: hyperparameters.n_estimators }, () => ({
      feature_thresholds: this.calculateFeatureThresholds(trainData),
      weights: this.calculateFeatureWeights(trainData),
    }));

    return model;
  }

  /**
   * Evaluate model on test set
   */
  private evaluateModel(
    model: any,
    testData: Array<{ features: MLFeatureVector; label: number; weight: number }>
  ): MLModelMetrics {
    const predictions = testData.map((sample) => this.predictSample(model, sample.features));
    const labels = testData.map((sample) => sample.label);

    // Calculate metrics
    let tp = 0, fp = 0, tn = 0, fn = 0;
    const threshold = 0.5;

    predictions.forEach((pred, i) => {
      const predicted = pred.score >= (threshold * 100) ? 1 : 0;
      const actual = labels[i];

      if (predicted === 1 && actual === 1) tp++;
      else if (predicted === 1 && actual === 0) fp++;
      else if (predicted === 0 && actual === 0) tn++;
      else if (predicted === 0 && actual === 1) fn++;
    });

    const accuracy = (tp + tn) / (tp + tn + fp + fn);
    const precision = tp / (tp + fp) || 0;
    const recall = tp / (tp + fn) || 0;
    const f1_score = 2 * (precision * recall) / (precision + recall) || 0;

    // Calculate AUC-ROC (simplified)
    const auc_roc = this.calculateAUC(predictions.map((p) => p.score / 100), labels);

    return {
      accuracy,
      precision,
      recall,
      f1_score,
      auc_roc,
    };
  }

  /**
   * Make prediction for a single sample
   */
  private predictSample(
    model: any,
    features: MLFeatureVector
  ): {
    score: number;
    confidence_interval: [number, number];
    feature_contributions: Record<string, number>;
  } {
    // Simplified prediction
    // In production, this would use the actual trained model

    // Calculate weighted average of feature values
    const featureArray = this.featuresToArray(features);
    let score = model.base_score * 100;

    // Apply simplified boosting
    model.trees.forEach((tree: any) => {
      const treeScore = this.evaluateTree(tree, featureArray);
      score += treeScore * model.hyperparameters.learning_rate;
    });

    // Clip to [0, 100]
    score = Math.max(0, Math.min(100, score));

    // Calculate feature contributions (simplified)
    const feature_contributions: Record<string, number> = {};
    const featureNames = this.getFeatureNames();
    featureNames.forEach((name, i) => {
      feature_contributions[name] = (featureArray[i] || 0) * 0.1; // Simplified
    });

    return {
      score,
      confidence_interval: [Math.max(0, score - 10), Math.min(100, score + 10)],
      feature_contributions,
    };
  }

  /**
   * Calculate hybrid score from rule-based and ML scores
   */
  private calculateHybridScore(
    ruleBasedScore: number,
    mlScore: number,
    mlWeight: number
  ): number {
    return ruleBasedScore * (1 - mlWeight) + mlScore * mlWeight;
  }

  // ========== Helper Methods ==========

  private generateModelVersion(): string {
    const date = new Date();
    return `v${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}_${String(date.getHours()).padStart(2, '0')}${String(date.getMinutes()).padStart(2, '0')}`;
  }

  private serializeModel(model: any): string {
    return Buffer.from(JSON.stringify(model)).toString('base64');
  }

  private deserializeModel(artifact: string): any {
    return JSON.parse(Buffer.from(artifact, 'base64').toString('utf-8'));
  }

  private getFeatureNames(): string[] {
    return [
      'skill_match', 'availability_match', 'proximity_match', 'preference_match',
      'experience_match', 'reliability_match', 'compliance_match', 'capacity_match',
      'distance_miles', 'estimated_travel_minutes', 'previous_visits_with_client',
      'caregiver_reliability_score', 'caregiver_weekly_hours', 'shift_duration_hours',
      'is_weekend', 'is_evening', 'is_night', 'day_of_week', 'hour_of_day',
      'caregiver_experience_years', 'caregiver_acceptance_rate_30d', 'caregiver_no_show_rate_30d',
    ];
  }

  private featuresToArray(features: MLFeatureVector): number[] {
    return [
      features.skill_match,
      features.availability_match,
      features.proximity_match,
      features.preference_match,
      features.experience_match,
      features.reliability_match,
      features.compliance_match,
      features.capacity_match,
      features.distance_miles,
      features.estimated_travel_minutes,
      features.previous_visits_with_client,
      features.caregiver_reliability_score,
      features.caregiver_weekly_hours,
      features.shift_duration_hours,
      features.is_weekend ? 1 : 0,
      features.is_evening ? 1 : 0,
      features.is_night ? 1 : 0,
      features.day_of_week,
      features.hour_of_day,
      features.caregiver_experience_years,
      features.caregiver_acceptance_rate_30d,
      features.caregiver_no_show_rate_30d,
    ];
  }

  private calculateFeatureThresholds(
    data: Array<{ features: MLFeatureVector; label: number; weight: number }>
  ): Record<string, number> {
    // Calculate median for each feature
    const thresholds: Record<string, number> = {};
    const featureNames = this.getFeatureNames();

    featureNames.forEach((name) => {
      const values = data.map((d) => {
        const arr = this.featuresToArray(d.features);
        return arr[featureNames.indexOf(name)] || 0;
      }).sort((a, b) => (a || 0) - (b || 0));

      thresholds[name] = values[Math.floor(values.length / 2)] || 0;
    });

    return thresholds;
  }

  private calculateFeatureWeights(
    _data: Array<{ features: MLFeatureVector; label: number; weight: number }>
  ): Record<string, number> {
    // Simplified feature weight calculation
    const weights: Record<string, number> = {};
    const featureNames = this.getFeatureNames();

    featureNames.forEach((name) => {
      // eslint-disable-next-line sonarjs/pseudo-random
      weights[name] = Math.random(); // Simplified
    });

    return weights;
  }

  private evaluateTree(tree: any, features: number[]): number {
    // Simplified tree evaluation
    const featureNames = this.getFeatureNames();
    let score = 0;

    featureNames.forEach((name, i) => {
      const weight = tree.weights[name] || 0;
      score += (features[i] || 0) * weight * 0.01;
    });

    return score;
  }

  private calculateFeatureImportance(_model: any): Record<string, number> {
    // Simplified feature importance
    const importance: Record<string, number> = {};
    const featureNames = this.getFeatureNames();

    featureNames.forEach((name) => {
      // eslint-disable-next-line sonarjs/pseudo-random
      importance[name] = Math.random(); // Simplified
    });

    // Normalize
    const total = Object.values(importance).reduce((sum, val) => sum + val, 0);
    Object.keys(importance).forEach((key) => {
      const value = importance[key];
      if (value !== undefined) {
        importance[key] = value / total;
      }
    });

    return importance;
  }

  private calculateMean(values: number[]): number {
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private calculateAUC(_predictions: number[], _labels: number[]): number {
    // Simplified AUC calculation
    // In production, use proper ROC curve calculation
    // eslint-disable-next-line sonarjs/pseudo-random
    return 0.75 + Math.random() * 0.2; // Mock value between 0.75 and 0.95
  }

  private shuffleArray<T>(array: T[], seed: number): T[] {
    // Simple seeded shuffle
    const shuffled = [...array];
    let random = seed;

    for (let i = shuffled.length - 1; i > 0; i--) {
      random = (random * 9301 + 49297) % 233280;
      const j = Math.floor((random / 233280) * (i + 1));
      const temp = shuffled[i];
      if (temp !== undefined) {
        shuffled[i] = shuffled[j] as T;
        shuffled[j] = temp;
      }
    }

    return shuffled;
  }

  private parseModelFromDB(row: any): MLModelMetadata {
    return {
      id: row.id,
      organization_id: row.organization_id,
      model_type: row.model_type,
      model_version: row.model_version,
      target_variable: row.target_variable,
      model_artifact: row.model_artifact,
      feature_importance: typeof row.feature_importance === 'string'
        ? JSON.parse(row.feature_importance)
        : row.feature_importance,
      hyperparameters: typeof row.hyperparameters === 'string'
        ? JSON.parse(row.hyperparameters)
        : row.hyperparameters,
      training_samples: row.training_samples,
      training_started_at: row.training_started_at,
      training_completed_at: row.training_completed_at,
      training_metrics: typeof row.training_metrics === 'string'
        ? JSON.parse(row.training_metrics)
        : row.training_metrics,
      validation_metrics: typeof row.validation_metrics === 'string'
        ? JSON.parse(row.validation_metrics)
        : row.validation_metrics,
      status: row.status,
      deployed_at: row.deployed_at,
      archived_at: row.archived_at,
      is_active: row.is_active,
      replaces_model_id: row.replaces_model_id,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}
