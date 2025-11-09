import { Knex } from 'knex';
import { MLFeatureExtractionService } from './ml-feature-extraction-service';
import { MLModelService } from './ml-model-service';
import { MLABTestingService } from './ml-ab-testing-service';
import { MatchCandidate, OpenShift } from '../types/shift-matching';
import { HybridScoringConfig } from '../types/ml-matching';

/**
 * ML-Enhanced Matching Service
 *
 * Integrates ML predictions with rule-based matching:
 * 1. Run traditional rule-based matching
 * 2. Extract features for each candidate
 * 3. Get ML predictions
 * 4. Combine scores using hybrid approach
 * 5. Support A/B testing
 */
export class MLEnhancedMatchingService {
  private featureExtractor: MLFeatureExtractionService;
  private mlModelService: MLModelService;
  private abTestingService: MLABTestingService;

  constructor(private db: Knex) {
    this.featureExtractor = new MLFeatureExtractionService(db);
    this.mlModelService = new MLModelService(db);
    this.abTestingService = new MLABTestingService(db);
  }

  /**
   * Enhance candidates with ML predictions
   */
  async enhanceMatchingWithML(
    candidates: MatchCandidate[],
    shift: OpenShift
  ): Promise<MatchCandidate[]> {

    // Check if ML is enabled
    const mlConfig = await this.getMLConfig(shift.organizationId, shift.branchId);

    if (!mlConfig.ml_enabled) {
      // ML not enabled, return original candidates
      return candidates;
    }

    // Check for A/B testing
    const abTestEnabled = await this.abTestingService.isABTestingEnabled(shift.organizationId);
    let testVariant = null;

    if (abTestEnabled) {
      const testConfig = await this.abTestingService.getActiveTestConfig(shift.organizationId);
      if (testConfig) {
        testVariant = await this.abTestingService.assignVariant(shift.id, testConfig);

        // Override ML config based on test variant
        const variantConfig = this.getVariantConfig(testConfig, testVariant.test_variant);
        if (variantConfig) {
          Object.assign(mlConfig, variantConfig);
        }
      }
    }

    // If ML not enabled after A/B test assignment, return original
    if (!mlConfig.ml_enabled) {
      return candidates;
    }

    // Extract features for all candidates
    const featuresMap = await this.featureExtractor.extractFeaturesForBatch(
      candidates,
      shift
    );

    // Get ML predictions for all candidates
    const predictions = await this.mlModelService.predictBatch(
      shift.id,
      Array.from(featuresMap.entries()).map(([caregiverId, features]) => ({
        caregiver_id: caregiverId,
        features,
        rule_based_score: candidates.find((c) => c.caregiverId === caregiverId)?.overallScore || 0,
      }))
    );

    // Enhance candidates with ML scores
    const enhancedCandidates = candidates.map((candidate) => {
      const prediction = predictions.find((p) => p.caregiver_id === candidate.caregiverId);

      if (!prediction) {
        return candidate;
      }

      // Use hybrid score if confidence is high enough
      const finalScore = prediction.hybrid_score;

      return {
        ...candidate,
        overallScore: finalScore,
        ml_prediction: {
          predicted_score: prediction.predicted_score,
          hybrid_score: prediction.hybrid_score,
          ml_weight: prediction.ml_weight,
          prediction_id: prediction.id,
        },
      };
    });

    // Re-sort by new scores
    enhancedCandidates.sort((a, b) => b.overallScore - a.overallScore);

    // Record for training data collection
    await this.recordMatchingAttempt(shift.id, enhancedCandidates, testVariant);

    return enhancedCandidates;
  }

  /**
   * Train a new ML model
   */
  async trainNewModel(organizationId?: string): Promise<string> {
    const modelMetadata = await this.mlModelService.trainModel({
      organization_id: organizationId,
      target_variable: 'match_success',
      model_type: 'GRADIENT_BOOSTING',
      hyperparameters: {
        learning_rate: 0.1,
        max_depth: 6,
        n_estimators: 100,
        subsample: 0.8,
        colsample_bytree: 0.8,
      },
      training_options: {
        test_split: 0.2,
        validation_split: 0.2,
        random_state: 42,
      },
      data_filters: {
        min_date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
      },
    });

    return modelMetadata.id;
  }

  /**
   * Auto-deploy model if it performs better
   */
  async autoDeployIfBetter(modelId: string): Promise<boolean> {
    const newModel = await this.db('ml_models')
      .where({ id: modelId })
      .first();

    if (!newModel) {
      throw new Error(`Model ${modelId} not found`);
    }

    // Get current active model
    const currentModel = await this.db('ml_models')
      .where('organization_id', newModel.organization_id)
      .where('target_variable', newModel.target_variable)
      .where('is_active', true)
      .where('status', 'DEPLOYED')
      .first();

    if (!currentModel) {
      // No existing model, deploy this one
      await this.mlModelService.deployModel(modelId);
      return true;
    }

    // Compare metrics
    const newMetrics = typeof newModel.validation_metrics === 'string'
      ? JSON.parse(newModel.validation_metrics)
      : newModel.validation_metrics;

    const currentMetrics = typeof currentModel.validation_metrics === 'string'
      ? JSON.parse(currentModel.validation_metrics)
      : currentModel.validation_metrics;

    // Deploy if new model has better F1 score
    const improvementThreshold = 0.02; // 2% improvement required
    const improvement = newMetrics.f1_score - currentMetrics.f1_score;

    if (improvement > improvementThreshold) {
      await this.mlModelService.deployModel(modelId);
      return true;
    }

    return false;
  }

  /**
   * Record training data when proposal is created
   */
  async recordProposalForTraining(
    openShiftId: string,
    caregiverId: string,
    matchScore: number,
    matchQuality: string,
    features: any
  ): Promise<void> {
    // This will be updated when proposal is accepted/rejected
    await this.featureExtractor.createTrainingDataPoint(
      openShiftId,
      caregiverId,
      '', // visit_id will be filled later
      features,
      matchScore,
      matchQuality,
      {
        was_accepted: false, // Will be updated
      }
    );
  }

  /**
   * Update training data when proposal is accepted/rejected
   */
  async updateTrainingDataForProposal(
    proposalId: string,
    wasAccepted: boolean,
    responseTimeMinutes: number
  ): Promise<void> {
    const proposal = await this.db('assignment_proposals')
      .where({ id: proposalId })
      .first();

    if (!proposal) {
      return;
    }

    await this.db('ml_training_data')
      .where('open_shift_id', proposal.open_shift_id)
      .where('caregiver_id', proposal.caregiver_id)
      .whereNull('was_accepted') // Only update unset records
      .update({
        was_accepted: wasAccepted,
        response_time_minutes: responseTimeMinutes,
        updated_at: new Date(),
      });
  }

  /**
   * Update training data when visit is completed
   */
  async updateTrainingDataForVisit(
    visitId: string,
    wasCompleted: boolean,
    wasNoShow: boolean,
    wasLate: boolean,
    clientSatisfactionRating?: number
  ): Promise<void> {
    await this.featureExtractor.updateTrainingDataWithOutcome(visitId, {
      was_completed: wasCompleted,
      was_no_show: wasNoShow,
      was_late: wasLate,
      client_satisfaction_rating: clientSatisfactionRating,
    });

    // Update ML prediction outcome if exists
    const visit = await this.db('visits')
      .where({ id: visitId })
      .first('assigned_caregiver_id');

    if (!visit) {
      return;
    }

    // Find related prediction
    const prediction = await this.db('ml_predictions as p')
      .join('assignment_proposals as ap', function() {
        this.on('p.open_shift_id', '=', 'ap.open_shift_id')
          .andOn('p.caregiver_id', '=', 'ap.caregiver_id');
      })
      .join('visits as v', 'ap.open_shift_id', '=', 'v.id')
      .where('v.id', visitId)
      .select('p.id')
      .first();

    if (prediction) {
      await this.mlModelService.updatePredictionOutcome(prediction.id, {
        actual_accepted: true, // If visit exists, it was accepted
        actual_completed: wasCompleted,
        actual_no_show: wasNoShow,
      });
    }
  }

  // ========== Helper Methods ==========

  /**
   * Get ML configuration for organization/branch
   */
  private async getMLConfig(
    organizationId: string,
    branchId?: string
  ): Promise<HybridScoringConfig> {
    const config = await this.db('matching_configurations')
      .where('organization_id', organizationId)
      .where((builder) => {
        if (branchId) {
          builder.where('branch_id', branchId).orWhereNull('branch_id');
        } else {
          builder.whereNull('branch_id');
        }
      })
      .orderBy('branch_id', 'desc') // Prefer branch-specific
      .first(
        'ml_enabled',
        'ml_weight',
        'ml_model_preference',
        'min_ml_confidence'
      );

    return {
      ml_enabled: config?.ml_enabled ?? false,
      ml_weight: config?.ml_weight ?? 0.5,
      ml_model_preference: config?.ml_model_preference ?? 'GLOBAL',
      min_ml_confidence: config?.min_ml_confidence ?? 0.5,
      fallback_to_rule_based: true,
    };
  }

  /**
   * Get variant config from A/B test
   */
  private getVariantConfig(testConfig: any, variantName: string): HybridScoringConfig | null {
    const variant = testConfig.variants.find((v: any) => v.name === variantName);
    return variant?.config ?? null;
  }

  /**
   * Record matching attempt for analytics
   */
  private async recordMatchingAttempt(
    _shiftId: string,
    candidates: MatchCandidate[],
    testVariant: any
  ): Promise<void> {
    // Update A/B test if active
    if (testVariant) {
      const topCandidate = candidates[0];
      await this.abTestingService.updateOutcome(testVariant.id, {
        was_matched: candidates.length > 0,
        match_score: topCandidate?.overallScore,
      });
    }
  }
}
