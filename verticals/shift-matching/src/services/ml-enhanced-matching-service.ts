/**
 * ML-Enhanced Matching Service
 *
 * Integrates ML predictions with rule-based matching algorithm
 */

// Database type - using any for now as this vertical uses pg.Pool
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { type OpenShift, type MatchCandidate, type MatchingConfiguration } from '../types/shift-matching';
import { type CaregiverContext, MatchingAlgorithm } from '../utils/matching-algorithm';
import { MLFeatureEngineeringService } from './ml-feature-engineering-service';
import { MLInferenceService } from './ml-inference-service';
import { ABTestingService } from './ab-testing-service';

export interface MLMatchingOptions {
  useMLScoring?: boolean;
  mlWeight?: number; // 0-1, how much to weight ML vs rule-based
  enableABTest?: boolean;
  experimentId?: string;
}

export class MLEnhancedMatchingService {
  private featureService: MLFeatureEngineeringService;
  private inferenceService: MLInferenceService;
  private abTestService: ABTestingService;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(private _db: any) {
    this.featureService = new MLFeatureEngineeringService(db);
    this.inferenceService = new MLInferenceService(db);
    this.abTestService = new ABTestingService(db);
  }

  /**
   * Evaluate a match with ML enhancement
   */
  async evaluateMLMatch(
    shift: OpenShift,
    caregiverContext: CaregiverContext,
    config: MatchingConfiguration,
    options: MLMatchingOptions = {}
  ): Promise<MatchCandidate> {
    const {
      useMLScoring = true,
      mlWeight = 0.5, // 50/50 blend by default
      enableABTest = false,
      experimentId,
    } = options;

    // Get baseline rule-based match
    const ruleBasedMatch = MatchingAlgorithm.evaluateMatch(
      shift,
      caregiverContext,
      config
    );

    // If ML disabled or caregiver not eligible, return rule-based result
    if (!useMLScoring || !ruleBasedMatch.isEligible) {
      return ruleBasedMatch;
    }

    // Check A/B test assignment if enabled
    if (enableABTest && experimentId) {
      const assignment = await this.abTestService.getAssignment(
        experimentId,
        caregiverContext.caregiver.id,
        'CAREGIVER'
      );

      // Return rule-based if in control group
      if (assignment.variant === 'control') {
        return ruleBasedMatch;
      }
    }

    try {
      // Compute features
      const features = await this.featureService.computeFeatures({
        caregiverId: caregiverContext.caregiver.id,
        clientId: shift.clientId,
        shiftId: shift.id,
        shift,
        caregiverContext,
      });

      // Get ML prediction
      const prediction = await this.inferenceService.predict(features);

      // Combine ML score with rule-based score
      const mlScore = prediction.predictedScore * 100; // Convert to 0-100 scale
      const combinedScore = this.combineScores(
        ruleBasedMatch.overallScore,
        mlScore,
        mlWeight
      );

      // Update match with ML-enhanced data
      const enhancedMatch: MatchCandidate = {
        ...ruleBasedMatch,
        overallScore: combinedScore,
        mlPredictionScore: mlScore,
        mlConfidence: prediction.confidence,
        mlPredictionClass: prediction.predictionClass,
        mlFeatureImportance: prediction.featureImportance,
        matchQuality: this.determineMatchQuality(combinedScore),
        matchReasons: this.enrichMatchReasons(
          ruleBasedMatch.matchReasons,
          prediction
        ),
      };

      // Mark prediction as used
      await this.inferenceService.markPredictionUsed(
        prediction.id,
        combinedScore
      );

      return enhancedMatch;
    } catch (error) {
      console.error('ML prediction failed, falling back to rule-based:', error);
      return ruleBasedMatch;
    }
  }

  /**
   * Evaluate multiple matches in batch with ML enhancement
   */
  async evaluateMLMatches(
    shift: OpenShift,
    caregiverContexts: CaregiverContext[],
    config: MatchingConfiguration,
    options: MLMatchingOptions = {}
  ): Promise<MatchCandidate[]> {
    const matches: MatchCandidate[] = [];

    for (const context of caregiverContexts) {
      const match = await this.evaluateMLMatch(shift, context, config, options);
      matches.push(match);
    }

    // Sort by combined score
    return matches.sort((a, b) => b.overallScore - a.overallScore);
  }

  /**
   * Determine optimal matching strategy based on A/B test results
   */
  async getOptimalMatchingStrategy(
    organizationId: string
  ): Promise<MLMatchingOptions> {
    // Check for completed A/B tests
    const experiments = await this.abTestService.listExperiments(
      organizationId,
      'COMPLETED'
    );

    // Find the most recent successful experiment
    const successfulExperiment = experiments.find(
      (exp) => exp.isSignificant && exp.winner !== 'control'
    );

    if (successfulExperiment) {
      // Parse winner configuration
      const winnerVariant = successfulExperiment.variants.find(
        (v: any) => v.name === successfulExperiment.winner
      );

      return {
        useMLScoring: true,
        mlWeight: winnerVariant?.config?.mlWeight || 0.5,
        enableABTest: false,
      };
    }

    // Default to conservative ML usage
    return {
      useMLScoring: true,
      mlWeight: 0.3, // 30% ML, 70% rule-based
      enableABTest: false,
    };
  }

  // ============================================================================
  // Private methods
  // ============================================================================

  /**
   * Combine rule-based and ML scores
   */
  private combineScores(
    ruleBasedScore: number,
    mlScore: number,
    mlWeight: number
  ): number {
    // Weighted average
    const combined = (ruleBasedScore * (1 - mlWeight)) + (mlScore * mlWeight);

    // Ensure result is in 0-100 range
    return Math.max(0, Math.min(100, combined));
  }

  /**
   * Determine match quality from combined score
   */
  private determineMatchQuality(score: number): string {
    if (score >= 85) return 'EXCELLENT';
    if (score >= 70) return 'GOOD';
    if (score >= 50) return 'FAIR';
    return 'POOR';
  }

  /**
   * Enrich match reasons with ML insights
   */
  private enrichMatchReasons(
    baseReasons: any[],
    prediction: any
  ): any[] {
    const mlReasons = [...baseReasons];

    // Add ML-based reasons if confidence is high
    if (prediction.confidence >= 0.8) {
      if (prediction.predictedScore >= 0.7) {
        mlReasons.push({
          factor: 'ML_PREDICTION',
          impact: 'POSITIVE',
          message: `ML model predicts high success probability (${Math.round(prediction.predictedScore * 100)}%)`,
          importance: prediction.confidence,
        });
      } else if (prediction.predictedScore < 0.4) {
        mlReasons.push({
          factor: 'ML_PREDICTION',
          impact: 'NEGATIVE',
          message: `ML model predicts low success probability (${Math.round(prediction.predictedScore * 100)}%)`,
          importance: prediction.confidence,
        });
      }

      // Add top feature importances
      if (prediction.featureImportance) {
        const topFeatures = Object.entries(prediction.featureImportance)
          .sort(([, a], [, b]) => (b as number) - (a as number))
          .slice(0, 3);

        for (const [feature, importance] of topFeatures) {
          if ((importance as number) > 0.15) {
            mlReasons.push({
              factor: 'ML_FEATURE',
              impact: 'INFO',
              message: `Key factor: ${this.humanizeFeatureName(feature)}`,
              importance: importance as number,
            });
          }
        }
      }
    }

    return mlReasons;
  }

  /**
   * Convert feature names to human-readable labels
   */
  private humanizeFeatureName(featureName: string): string {
    const nameMap: Record<string, string> = {
      skillMatchScore: 'Skill match',
      hasWorkedTogether: 'Previous work history',
      distanceMiles: 'Travel distance',
      reliabilityScore90d: 'Reliability record',
      capacityUtilization: 'Current workload',
      avgClientRating: 'Client rating',
      isPreferredCaregiver: 'Client preference',
      completionRate: 'Visit completion rate',
    };

    return nameMap[featureName] || featureName;
  }
}
