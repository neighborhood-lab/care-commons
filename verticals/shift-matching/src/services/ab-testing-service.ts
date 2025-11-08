/**
 * A/B Testing Service
 *
 * Manages experiments for comparing ML vs rule-based matching
 */

// Database type - using any for now as this vertical uses pg.Pool
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import {
  type ABTestExperiment,
  type ABTestAssignment,
  type EntityType,
  type ExperimentResults,
  type VariantResults,
  type StatisticalTest,
} from '../types/ml-types';
import { createHash } from 'crypto';

export class ABTestingService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(private db: any) {}

  /**
   * Create a new A/B test experiment
   */
  async createExperiment(
    experiment: Partial<ABTestExperiment>
  ): Promise<ABTestExperiment> {
    const experimentId = experiment.experimentId || this.generateExperimentId();

    const [result] = await this.db('ab_test_experiments')
      .insert({
        organization_id: experiment.organizationId,
        experiment_id: experimentId,
        name: experiment.name,
        description: experiment.description,
        hypothesis: experiment.hypothesis,
        variants: JSON.stringify(experiment.variants),
        entity_type: experiment.entityType,
        targeting_rules: JSON.stringify(experiment.targetingRules || {}),
        status: 'DRAFT',
        primary_metrics: JSON.stringify(experiment.primaryMetrics),
        secondary_metrics: JSON.stringify(experiment.secondaryMetrics || []),
        guardrail_metrics: JSON.stringify(experiment.guardrailMetrics || []),
        target_sample_size: experiment.targetSampleSize,
        minimum_detectable_effect: experiment.minimumDetectableEffect || 0.05,
        statistical_power: experiment.statisticalPower || 0.80,
        current_sample_size: 0,
        created_by: 'system',
        updated_by: 'system',
      })
      .returning('*');

    return this.mapDbToExperiment(result);
  }

  /**
   * Start an experiment
   */
  async startExperiment(experimentId: string): Promise<void> {
    await this.db('ab_test_experiments')
      .where('experiment_id', experimentId)
      .update({
        status: 'RUNNING',
        actual_start_date: new Date(),
        updated_at: new Date(),
      });
  }

  /**
   * Stop an experiment
   */
  async stopExperiment(experimentId: string): Promise<void> {
    await this.db('ab_test_experiments')
      .where('experiment_id', experimentId)
      .update({
        status: 'COMPLETED',
        actual_end_date: new Date(),
        updated_at: new Date(),
      });
  }

  /**
   * Get or create an assignment for an entity
   */
  async getAssignment(
    experimentId: string,
    entityId: string,
    entityType: EntityType
  ): Promise<ABTestAssignment> {
    // Check for existing assignment (sticky assignment)
    const existing = await this.db('ab_test_assignments')
      .where('experiment_id', experimentId)
      .where('entity_id', entityId)
      .where('entity_type', entityType)
      .where('status', 'ACTIVE')
      .first();

    if (existing) {
      return this.mapDbToAssignment(existing);
    }

    // Get experiment details
    const experiment = await this.db('ab_test_experiments')
      .where('experiment_id', experimentId)
      .first();

    // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
    if (!experiment || experiment.status !== 'RUNNING') {
      throw new Error(`Experiment ${experimentId} is not running`);
    }

    // Assign to variant using consistent hashing
    const variant = this.assignVariant(
      entityId,
      experiment.variants
    );

    const assignmentHash = this.hashEntity(entityId, experimentId);

    // Create assignment
    const [result] = await this.db('ab_test_assignments')
      .insert({
        organization_id: experiment.organization_id,
        experiment_name: experiment.name,
        experiment_id: experimentId,
        description: experiment.description,
        entity_id: entityId,
        entity_type: entityType,
        variant: variant.name,
        status: 'ACTIVE',
        assignment_hash: assignmentHash,
        matches_attempted: 0,
        matches_successful: 0,
      })
      .returning('*');

    // Increment experiment sample size
    await this.db('ab_test_experiments')
      .where('experiment_id', experimentId)
      .increment('current_sample_size', 1);

    return this.mapDbToAssignment(result);
  }

  /**
   * Record a match attempt for an assignment
   */
  async recordMatchAttempt(
    experimentId: string,
    entityId: string,
    success: boolean,
    matchScore?: number,
    responseTimeMinutes?: number
  ): Promise<void> {
    const assignment = await this.db('ab_test_assignments')
      .where('experiment_id', experimentId)
      .where('entity_id', entityId)
      .first();

    if (!assignment) {
      console.error(`No assignment found for entity ${entityId} in experiment ${experimentId}`);
      return;
    }

    const updates: any = {
      matches_attempted: assignment.matches_attempted + 1,
    };

    if (success) {
      updates.matches_successful = assignment.matches_successful + 1;
    }

    if (matchScore !== undefined) {
      // Update rolling average
      const currentSum = (assignment.avg_match_score || 0) * assignment.matches_attempted;
      updates.avg_match_score = (currentSum + matchScore) / (assignment.matches_attempted + 1);
    }

    if (responseTimeMinutes !== undefined) {
      const currentSum = (assignment.avg_response_time_minutes || 0) * assignment.matches_attempted;
      updates.avg_response_time_minutes = (currentSum + responseTimeMinutes) / (assignment.matches_attempted + 1);
    }

    await this.db('ab_test_assignments')
      .where('id', assignment.id)
      .update(updates);
  }

  /**
   * Analyze experiment results
   */
  async analyzeExperiment(experimentId: string): Promise<ExperimentResults> {
    const experiment = await this.db('ab_test_experiments')
      .where('experiment_id', experimentId)
      .first();

    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`);
    }

    // Get all assignments grouped by variant
    const assignments = await this.db('ab_test_assignments')
      .where('experiment_id', experimentId)
      .select('variant')
      .select(this.db.raw('COUNT(*) as sample_size'))
      .select(this.db.raw('AVG(avg_match_score) as avg_match_score'))
      .select(this.db.raw('AVG(avg_response_time_minutes) as avg_response_time'))
      .select(this.db.raw('SUM(matches_successful)::float / NULLIF(SUM(matches_attempted), 0) as success_rate'))
      .groupBy('variant');

    const variantResults: Record<string, VariantResults> = {};

    for (const assignment of assignments) {
      variantResults[assignment.variant] = {
        variantName: assignment.variant,
        sampleSize: Number.parseInt(assignment.sample_size),
        metrics: {
          successRate: assignment.success_rate || 0,
          avgMatchScore: assignment.avg_match_score || 0,
          avgResponseTime: assignment.avg_response_time || 0,
        },
        confidenceIntervals: {
          successRate: this.computeConfidenceInterval(
            assignment.success_rate || 0,
            Number.parseInt(assignment.sample_size)
          ),
        },
      };
    }

    // Perform statistical tests
    const statisticalTests = this.performStatisticalTests(variantResults);

    // Determine recommended decision
    const recommendedDecision = this.determineRecommendation(
      variantResults,
      statisticalTests,
      experiment.target_sample_size
    );

    // Update experiment with results
    const results: ExperimentResults = {
      variantResults,
      statisticalTests,
      recommendedDecision,
    };

    await this.db('ab_test_experiments')
      .where('experiment_id', experimentId)
      .update({
        results: JSON.stringify(results),
        updated_at: new Date(),
      });

    return results;
  }

  /**
   * Get experiment by ID
   */
  async getExperiment(experimentId: string): Promise<ABTestExperiment | null> {
    const experiment = await this.db('ab_test_experiments')
      .where('experiment_id', experimentId)
      .first();

    return experiment ? this.mapDbToExperiment(experiment) : null;
  }

  /**
   * List all experiments for an organization
   */
  async listExperiments(
    organizationId: string,
    status?: string
  ): Promise<ABTestExperiment[]> {
    let query = this.db('ab_test_experiments')
      .where('organization_id', organizationId);

    if (status) {
      query = query.where('status', status);
    }

    const experiments = await query.orderBy('created_at', 'desc');

    return experiments.map(this.mapDbToExperiment);
  }

  // ============================================================================
  // Private methods
  // ============================================================================

  private generateExperimentId(): string {
    // eslint-disable-next-line sonarjs/pseudo-random
    return `exp_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  private assignVariant(
    entityId: string,
    variants: any[]
  ): any {
    // Use consistent hashing to assign variant
    const hash = this.hashEntity(entityId, 'variant');
    const hashValue = Number.parseInt(hash.slice(0, 8), 16);
    const normalizedHash = hashValue / 0xffffffff;

    let cumulativeWeight = 0;
    for (const variant of variants) {
      cumulativeWeight += variant.weight;
      if (normalizedHash <= cumulativeWeight) {
        return variant;
      }
    }

    // Fallback to first variant
    return variants[0];
  }

  private hashEntity(entityId: string, salt: string): string {
    return createHash('sha256')
      .update(`${entityId}:${salt}`)
      .digest('hex');
  }

  private computeConfidenceInterval(
    proportion: number,
    sampleSize: number,
    confidenceLevel: number = 0.95
  ): { lower: number; upper: number; level: number } {
    // Wilson score interval
    const z = 1.96; // 95% confidence
    const p = proportion;
    const n = sampleSize;

    if (n === 0) {
      return { lower: 0, upper: 0, level: confidenceLevel };
    }

    const denominator = 1 + (z * z) / n;
    const centre = (p + (z * z) / (2 * n)) / denominator;
    const adjustment = (z / denominator) * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n));

    return {
      lower: Math.max(0, centre - adjustment),
      upper: Math.min(1, centre + adjustment),
      level: confidenceLevel,
    };
  }

  private performStatisticalTests(
    variantResults: Record<string, VariantResults>
  ): Record<string, StatisticalTest> {
    const tests: Record<string, StatisticalTest> = {};
    const variants = Object.values(variantResults);

    if (variants.length < 2) {
      return tests;
    }

    // Compare each treatment to control (assume first variant is control)
    const control = variants[0];

    for (let i = 1; i < variants.length; i++) {
      const treatment = variants[i];

      // Two-proportion z-test for success rate
      const p1 = control.metrics.successRate || 0;
      const p2 = treatment.metrics.successRate || 0;
      const n1 = control.sampleSize;
      const n2 = treatment.sampleSize;

      const pooledP = ((p1 * n1) + (p2 * n2)) / (n1 + n2);
      const standardError = Math.sqrt(pooledP * (1 - pooledP) * (1 / n1 + 1 / n2));

      const zScore = standardError > 0 ? (p2 - p1) / standardError : 0;
      const pValue = 2 * (1 - this.normalCDF(Math.abs(zScore)));

      tests[`${control.variantName}_vs_${treatment.variantName}`] = {
        metricName: 'successRate',
        testType: 'ttest',
        pValue,
        effectSize: p2 - p1,
        isSignificant: pValue < 0.05,
        confidenceLevel: 0.95,
      };
    }

    return tests;
  }

  private normalCDF(x: number): number {
    // Approximation of the cumulative distribution function for standard normal
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp(-x * x / 2);
    const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return x > 0 ? 1 - prob : prob;
  }

  private determineRecommendation(
    variantResults: Record<string, VariantResults>,
    tests: Record<string, StatisticalTest>,
    targetSampleSize?: number
  ): 'deploy_winner' | 'continue_test' | 'stop_inconclusive' {
    const totalSampleSize = Object.values(variantResults).reduce(
      (sum, v) => sum + v.sampleSize,
      0
    );

    // Check if we have enough samples
    if (targetSampleSize && totalSampleSize < targetSampleSize) {
      return 'continue_test';
    }

    // Check if any test is significant
    const hasSignificantResult = Object.values(tests).some((test) => test.isSignificant);

    if (hasSignificantResult) {
      return 'deploy_winner';
    }

    // If we've reached target sample size but no significant result
    if (targetSampleSize && totalSampleSize >= targetSampleSize) {
      return 'stop_inconclusive';
    }

    return 'continue_test';
  }

  private mapDbToExperiment(db: any): ABTestExperiment {
    return {
      id: db.id,
      organizationId: db.organization_id,
      experimentId: db.experiment_id,
      name: db.name,
      description: db.description,
      hypothesis: db.hypothesis,
      variants: db.variants,
      entityType: db.entity_type,
      targetingRules: db.targeting_rules,
      status: db.status,
      startDate: db.start_date,
      endDate: db.end_date,
      actualStartDate: db.actual_start_date,
      actualEndDate: db.actual_end_date,
      targetSampleSize: db.target_sample_size,
      currentSampleSize: db.current_sample_size,
      minimumDetectableEffect: db.minimum_detectable_effect,
      statisticalPower: db.statistical_power,
      primaryMetrics: db.primary_metrics,
      secondaryMetrics: db.secondary_metrics,
      guardrailMetrics: db.guardrail_metrics,
      results: db.results,
      winner: db.winner,
      isSignificant: db.is_significant,
      pValue: db.p_value,
      createdAt: db.created_at,
      createdBy: db.created_by,
      updatedAt: db.updated_at,
      updatedBy: db.updated_by,
    };
  }

  private mapDbToAssignment(db: any): ABTestAssignment {
    return {
      id: db.id,
      organizationId: db.organization_id,
      experimentName: db.experiment_name,
      experimentId: db.experiment_id,
      description: db.description,
      entityId: db.entity_id,
      entityType: db.entity_type,
      variant: db.variant,
      status: db.status,
      assignedAt: db.assigned_at,
      completedAt: db.completed_at,
      assignmentHash: db.assignment_hash,
      matchesAttempted: db.matches_attempted,
      matchesSuccessful: db.matches_successful,
      avgMatchScore: db.avg_match_score,
      avgResponseTimeMinutes: db.avg_response_time_minutes,
      metrics: db.metrics,
    };
  }
}
