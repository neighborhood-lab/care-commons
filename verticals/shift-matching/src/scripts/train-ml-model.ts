/**
 * ML Model Training Script
 *
 * This script trains and deploys a new ML model for shift matching.
 * In production, this would typically be a Python script using XGBoost/LightGBM.
 * This TypeScript version demonstrates the workflow and can be used as a template.
 */

import { getDatabase } from '@care-commons/core';
import { MLFeatureEngineeringService } from '../services/ml-feature-engineering-service';
import type { TrainingMetrics } from '../types/ml-types';

interface TrainingConfig {
  organizationId: string;
  modelName: string;
  trainingStartDate: Date;
  trainingEndDate: Date;
  validationSplit: number;
  hyperparameters: Record<string, unknown>;
}

class ModelTrainer {
  private featureService: MLFeatureEngineeringService;

  constructor(private db: any) {
    this.featureService = new MLFeatureEngineeringService(db);
  }

  /**
   * Train a new model
   */
  async train(config: TrainingConfig): Promise<string> {
    console.log('Starting model training...');
    console.log(`Organization: ${config.organizationId}`);
    console.log(`Training period: ${config.trainingStartDate} to ${config.trainingEndDate}`);

    // Step 1: Extract training data
    console.log('\n[1/5] Extracting training data...');
    const features = await this.featureService.extractTrainingData(
      config.organizationId,
      config.trainingStartDate,
      config.trainingEndDate
    );

    console.log(`Extracted ${features.length} training examples`);

    if (features.length < 100) {
      throw new Error('Insufficient training data. Need at least 100 examples.');
    }

    // Step 2: Save features to database
    console.log('\n[2/5] Saving features to database...');
    for (const featureSet of features) {
      await this.featureService.saveFeatures(featureSet);
    }

    // Step 3: Split into training and validation sets
    console.log('\n[3/5] Splitting data...');
    const shuffled = this.shuffleArray([...features]);
    const splitIndex = Math.floor(shuffled.length * (1 - config.validationSplit));
    const trainingSet = shuffled.slice(0, splitIndex);
    const validationSet = shuffled.slice(splitIndex);

    console.log(`Training samples: ${trainingSet.length}`);
    console.log(`Validation samples: ${validationSet.length}`);

    // Step 4: Train model (simulated)
    console.log('\n[4/5] Training model...');
    const trainingMetrics = await this.trainModel(trainingSet, config.hyperparameters);

    console.log('Training metrics:', trainingMetrics);

    // Step 5: Validate model
    console.log('\n[5/5] Validating model...');
    const validationMetrics = await this.validateModel(validationSet);

    console.log('Validation metrics:', validationMetrics);

    // Create model record
    const modelVersion = this.generateModelVersion();
    const modelId = await this.saveModel({
      organizationId: config.organizationId,
      name: config.modelName,
      version: modelVersion,
      trainingSamples: trainingSet.length,
      validationSamples: validationSet.length,
      trainingMetrics: validationMetrics, // Use validation metrics
      hyperparameters: config.hyperparameters,
    });

    console.log(`\n✓ Model trained successfully!`);
    console.log(`Model ID: ${modelId}`);
    console.log(`Version: ${modelVersion}`);

    return modelId;
  }

  /**
   * Deploy a model to production
   */
  async deploy(modelId: string): Promise<void> {
    console.log(`Deploying model ${modelId}...`);

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

    console.log('✓ Model deployed successfully!');
  }

  /**
   * Simulate model training
   * In production, this would call Python ML libraries
   */
  private async trainModel(
    _trainingData: any[],
    hyperparameters: Record<string, unknown>
  ): Promise<TrainingMetrics> {
    // This is a simulation - in production would use actual ML training
    console.log('Training with hyperparameters:', hyperparameters);

    // Simulate training time
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Return mock metrics (in production, these would be real)
    return {
      accuracy: 0.82,
      precision: 0.80,
      recall: 0.85,
      f1Score: 0.82,
      aucRoc: 0.88,
      aucPr: 0.85,
    };
  }

  /**
   * Validate model on validation set
   */
  private async validateModel(validationData: any[]): Promise<TrainingMetrics> {
    // This is a simulation
    console.log(`Validating on ${validationData.length} samples...`);

    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      accuracy: 0.80,
      precision: 0.78,
      recall: 0.83,
      f1Score: 0.80,
      aucRoc: 0.86,
      aucPr: 0.83,
      confusionMatrix: {
        truePositives: 120,
        trueNegatives: 80,
        falsePositives: 15,
        falseNegatives: 20,
      },
    };
  }

  /**
   * Save model to database
   */
  private async saveModel(modelData: {
    organizationId: string;
    name: string;
    version: string;
    trainingSamples: number;
    validationSamples: number;
    trainingMetrics: TrainingMetrics;
    hyperparameters: Record<string, unknown>;
  }): Promise<string> {
    const [result] = await this.db('ml_models')
      .insert({
        organization_id: modelData.organizationId,
        name: modelData.name,
        version: modelData.version,
        model_type: 'gradient_boosting',
        framework: 'xgboost',
        description: 'Shift matching success prediction model',
        hyperparameters: JSON.stringify(modelData.hyperparameters),
        feature_config: JSON.stringify({
          version: '1.0',
          features: [
            'skillMatchScore',
            'hasWorkedTogether',
            'distanceMiles',
            'reliabilityScore90d',
            'capacityUtilization',
          ],
        }),
        target_variable: 'match_success',
        trained_at: new Date(),
        trained_by: 'system',
        training_samples: modelData.trainingSamples,
        validation_samples: modelData.validationSamples,
        training_metrics: JSON.stringify(modelData.trainingMetrics),
        model_format: 'onnx',
        status: 'VALIDATING',
        baseline_accuracy: 0.70, // Baseline from rule-based system
        created_by: 'system',
        updated_by: 'system',
      })
      .returning('id');

    return result.id;
  }

  private generateModelVersion(): string {
    const date = new Date();
    return `v${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}_${String(date.getHours()).padStart(2, '0')}${String(date.getMinutes()).padStart(2, '0')}`;
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      // eslint-disable-next-line sonarjs/pseudo-random
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

/**
 * Main training function
 */
export async function trainModel(config: TrainingConfig): Promise<string> {
  const db = getDatabase();
  const trainer = new ModelTrainer(db);
  return trainer.train(config);
}

/**
 * Deploy a model
 */
export async function deployModel(modelId: string): Promise<void> {
  const db = getDatabase();
  const trainer = new ModelTrainer(db);
  return trainer.deploy(modelId);
}

// CLI script
if (import.meta.url === `file://${process.argv[1]}`) {
  const db = getDatabase();
  const trainer = new ModelTrainer(db);

  const config: TrainingConfig = {
    organizationId: process.env.ORGANIZATION_ID || '',
    modelName: 'shift_matching_v1',
    trainingStartDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
    trainingEndDate: new Date(),
    validationSplit: 0.2,
    hyperparameters: {
      maxDepth: 6,
      learningRate: 0.1,
      nEstimators: 100,
      minChildWeight: 1,
      subsample: 0.8,
      colsampleByTree: 0.8,
    },
  };

  trainer.train(config)
    .then((modelId) => {
      console.log('\nTrain another model or deploy with:');
      console.log(`  npm run ml:deploy -- --model-id=${modelId}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Training failed:', error);
      process.exit(1);
    });
}
