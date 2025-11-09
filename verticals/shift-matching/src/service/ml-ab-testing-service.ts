import { Knex } from 'knex';
import { ABTestAssignment, ABTestConfig, ABTestVariant } from '../types/ml-matching';
import * as crypto from 'crypto';

/**
 * A/B Testing Service for ML-based shift matching
 *
 * Enables controlled experiments to compare:
 * - Rule-based vs ML-based matching
 * - Different ML model versions
 * - Different hybrid scoring weights
 */
export class MLABTestingService {
  constructor(private db: Knex) {}

  /**
   * Assign a shift to a test variant
   */
  async assignVariant(
    openShiftId: string,
    testConfig: ABTestConfig
  ): Promise<ABTestAssignment> {
    if (!testConfig.enabled) {
      throw new Error('A/B test is not enabled');
    }

    // Get shift info
    const shift = await this.db('open_shifts')
      .where({ id: openShiftId })
      .first('organization_id');

    if (!shift) {
      throw new Error(`Shift ${openShiftId} not found`);
    }

    // Check if already assigned
    const existing = await this.db('ab_test_assignments')
      .where('open_shift_id', openShiftId)
      .where('test_name', testConfig.test_name)
      .where('test_version', testConfig.test_version)
      .first();

    if (existing) {
      return this.parseAssignmentFromDB(existing);
    }

    // Determine variant based on strategy
    let variant: ABTestVariant;
    let assignmentMethod: 'RANDOM' | 'HASH' | 'MANUAL';

    if (testConfig.assignment_strategy === 'RANDOM') {
      variant = this.randomAssignment(testConfig.variants);
      assignmentMethod = 'RANDOM';
    } else if (testConfig.assignment_strategy === 'HASH') {
      variant = this.hashAssignment(openShiftId, testConfig.variants);
      assignmentMethod = 'HASH';
    } else if (testConfig.assignment_strategy === 'PERCENTAGE') {
      variant = this.percentageAssignment(testConfig.variants, testConfig.percentage_split);
      assignmentMethod = 'RANDOM';
    } else {
      throw new Error(`Unknown assignment strategy: ${testConfig.assignment_strategy}`);
    }

    // Create assignment
    const assignmentId = await this.db('ab_test_assignments')
      .insert({
        organization_id: shift.organization_id,
        open_shift_id: openShiftId,
        test_name: testConfig.test_name,
        test_variant: variant.name,
        test_version: testConfig.test_version,
        assignment_method: assignmentMethod,
        was_matched: false,
        metadata: JSON.stringify({
          variant_description: variant.description,
          variant_config: variant.config,
        }),
      })
      .returning('id')
      .then((rows) => rows[0].id);

    const assignment = await this.db('ab_test_assignments')
      .where({ id: assignmentId })
      .first();

    return this.parseAssignmentFromDB(assignment);
  }

  /**
   * Get variant assignment for a shift
   */
  async getVariant(
    openShiftId: string,
    testName: string,
    testVersion: number
  ): Promise<ABTestAssignment | null> {
    const assignment = await this.db('ab_test_assignments')
      .where('open_shift_id', openShiftId)
      .where('test_name', testName)
      .where('test_version', testVersion)
      .first();

    return assignment ? this.parseAssignmentFromDB(assignment) : null;
  }

  /**
   * Update assignment with matching outcome
   */
  async updateOutcome(
    assignmentId: string,
    outcome: {
      match_score?: number;
      was_matched?: boolean;
      was_accepted?: boolean;
      was_completed?: boolean;
      response_time_minutes?: number;
      client_satisfaction_rating?: number;
    }
  ): Promise<void> {
    await this.db('ab_test_assignments')
      .where({ id: assignmentId })
      .update({
        match_score: outcome.match_score ?? this.db.raw('match_score'),
        was_matched: outcome.was_matched ?? this.db.raw('was_matched'),
        was_accepted: outcome.was_accepted ?? this.db.raw('was_accepted'),
        was_completed: outcome.was_completed ?? this.db.raw('was_completed'),
        response_time_minutes: outcome.response_time_minutes ?? this.db.raw('response_time_minutes'),
        client_satisfaction_rating: outcome.client_satisfaction_rating ?? this.db.raw('client_satisfaction_rating'),
        updated_at: new Date(),
      });
  }

  /**
   * Get A/B test results
   */
  async getTestResults(
    testName: string,
    testVersion: number,
    organizationId?: string
  ): Promise<{
    test_name: string;
    test_version: number;
    total_assignments: number;
    variants: Record<string, {
      count: number;
      match_rate: number;
      acceptance_rate: number;
      completion_rate: number;
      avg_match_score: number;
      avg_response_time_minutes: number;
      avg_client_satisfaction: number;
    }>;
    statistical_significance: {
      variant_comparison: string;
      p_value: number;
      is_significant: boolean;
      confidence_level: number;
    } | null;
  }> {
    let query = this.db('ab_test_assignments')
      .where('test_name', testName)
      .where('test_version', testVersion);

    if (organizationId) {
      query = query.where('organization_id', organizationId);
    }

    const assignments = await query;

    const totalAssignments = assignments.length;
    const variants: Record<string, any> = {};

    // Group by variant
    const variantGroups = this.groupBy(assignments, 'test_variant');

    for (const [variantName, variantAssignments] of Object.entries(variantGroups)) {
      const count = variantAssignments.length;
      const matched = variantAssignments.filter((a: any) => a.was_matched).length;
      const accepted = variantAssignments.filter((a: any) => a.was_accepted).length;
      const completed = variantAssignments.filter((a: any) => a.was_completed).length;

      const scores = variantAssignments
        .filter((a: any) => a.match_score !== null)
        .map((a: any) => a.match_score);
      const avgMatchScore = scores.length > 0
        ? scores.reduce((sum: number, s: number) => sum + s, 0) / scores.length
        : 0;

      const responseTimes = variantAssignments
        .filter((a: any) => a.response_time_minutes !== null)
        .map((a: any) => a.response_time_minutes);
      const avgResponseTime = responseTimes.length > 0
        ? responseTimes.reduce((sum: number, t: number) => sum + t, 0) / responseTimes.length
        : 0;

      const ratings = variantAssignments
        .filter((a: any) => a.client_satisfaction_rating !== null)
        .map((a: any) => a.client_satisfaction_rating);
      const avgRating = ratings.length > 0
        ? ratings.reduce((sum: number, r: number) => sum + r, 0) / ratings.length
        : 0;

      variants[variantName] = {
        count,
        match_rate: (matched / count) * 100,
        acceptance_rate: (accepted / count) * 100,
        completion_rate: (completed / count) * 100,
        avg_match_score: avgMatchScore,
        avg_response_time_minutes: avgResponseTime,
        avg_client_satisfaction: avgRating,
      };
    }

    // Calculate statistical significance (simplified)
    let statisticalSignificance = null;
    const variantNames = Object.keys(variants);

    if (variantNames.length === 2 && variantNames[0] && variantNames[1]) {
      const control = variants[variantNames[0]];
      const treatment = variants[variantNames[1]];

      // Simple two-proportion z-test for match rate
      const p1 = control.match_rate / 100;
      const n1 = control.count;
      const p2 = treatment.match_rate / 100;
      const n2 = treatment.count;

      const pooled = (p1 * n1 + p2 * n2) / (n1 + n2);
      const se = Math.sqrt(pooled * (1 - pooled) * (1 / n1 + 1 / n2));
      const z = Math.abs(p1 - p2) / se;

      // Approximate p-value from z-score
      const pValue = 2 * (1 - this.normalCDF(z));
      const isSignificant = pValue < 0.05;
      const confidenceLevel = (1 - pValue) * 100;

      statisticalSignificance = {
        variant_comparison: `${variantNames[0]} vs ${variantNames[1]}`,
        p_value: pValue,
        is_significant: isSignificant,
        confidence_level: confidenceLevel,
      };
    }

    return {
      test_name: testName,
      test_version: testVersion,
      total_assignments: totalAssignments,
      variants,
      statistical_significance: statisticalSignificance,
    };
  }

  /**
   * Check if organization has A/B testing enabled
   */
  async isABTestingEnabled(organizationId: string, branchId?: string): Promise<boolean> {
    const config = await this.db('matching_configurations')
      .where('organization_id', organizationId)
      .where((builder) => {
        if (branchId) {
          builder.where('branch_id', branchId).orWhereNull('branch_id');
        } else {
          builder.whereNull('branch_id');
        }
      })
      .orderBy('branch_id', 'desc')
      .first('ab_testing_enabled');

    return config?.ab_testing_enabled ?? false;
  }

  /**
   * Get active A/B test configuration for organization
   */
  async getActiveTestConfig(organizationId: string): Promise<ABTestConfig | null> {
    const config = await this.db('matching_configurations')
      .where('organization_id', organizationId)
      .where('ab_testing_enabled', true)
      .first('ab_test_variant');

    if (!config?.ab_test_variant) {
      return null;
    }

    // Default test config
    return {
      test_name: 'rule_based_vs_ml',
      test_version: 1,
      enabled: true,
      variants: [
        {
          name: 'CONTROL',
          description: 'Rule-based matching only',
          config: {
            ml_enabled: false,
            ml_weight: 0.0,
            ml_model_preference: 'GLOBAL',
            min_ml_confidence: 0.5,
            fallback_to_rule_based: true,
          },
        },
        {
          name: 'TREATMENT_A',
          description: 'ML-only matching',
          config: {
            ml_enabled: true,
            ml_weight: 1.0,
            ml_model_preference: 'ORG_SPECIFIC',
            min_ml_confidence: 0.5,
            fallback_to_rule_based: true,
          },
        },
        {
          name: 'TREATMENT_B',
          description: 'Hybrid 50/50 matching',
          config: {
            ml_enabled: true,
            ml_weight: 0.5,
            ml_model_preference: 'HYBRID',
            min_ml_confidence: 0.5,
            fallback_to_rule_based: true,
          },
        },
      ],
      assignment_strategy: 'RANDOM',
    };
  }

  // ========== Assignment Strategies ==========

  /**
   * Random assignment to variants
   */
  private randomAssignment(variants: ABTestVariant[]): ABTestVariant {
    if (variants.length === 0) {
      throw new Error('No variants available for assignment');
    }
    // eslint-disable-next-line sonarjs/pseudo-random
    const randomIndex = Math.floor(Math.random() * variants.length);
    const variant = variants[randomIndex];
    if (!variant) {
      throw new Error('Failed to assign variant');
    }
    return variant;
  }

  /**
   * Hash-based assignment (consistent for same shift ID)
   */
  private hashAssignment(shiftId: string, variants: ABTestVariant[]): ABTestVariant {
    if (variants.length === 0) {
      throw new Error('No variants available for assignment');
    }
    // eslint-disable-next-line sonarjs/hashing
    const hash = crypto.createHash('md5').update(shiftId).digest('hex');
    const hashInt = parseInt(hash.substring(0, 8), 16);
    const index = hashInt % variants.length;
    const variant = variants[index];
    if (!variant) {
      throw new Error('Failed to assign variant');
    }
    return variant;
  }

  /**
   * Percentage-based assignment
   */
  private percentageAssignment(
    variants: ABTestVariant[],
    percentageSplit?: Record<string, number>
  ): ABTestVariant {
    if (variants.length === 0) {
      throw new Error('No variants available for assignment');
    }

    if (!percentageSplit) {
      return this.randomAssignment(variants);
    }

    // eslint-disable-next-line sonarjs/pseudo-random
    const random = Math.random() * 100;
    let cumulative = 0;

    for (const variant of variants) {
      const percentage = percentageSplit[variant.name] || (100 / variants.length);
      cumulative += percentage;

      if (random <= cumulative) {
        return variant;
      }
    }

    const lastVariant = variants[variants.length - 1];
    if (!lastVariant) {
      throw new Error('Failed to assign variant');
    }
    return lastVariant;
  }

  // ========== Helper Methods ==========

  private groupBy<T>(array: T[], key: string): Record<string, T[]> {
    return array.reduce((result: Record<string, T[]>, item: any) => {
      const groupKey = item[key];
      if (!result[groupKey]) {
        result[groupKey] = [];
      }
      result[groupKey].push(item);
      return result;
    }, {});
  }

  /**
   * Normal cumulative distribution function (for p-value calculation)
   */
  private normalCDF(x: number): number {
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp(-x * x / 2);
    const probability =
      d *
      t *
      (0.3193815 +
        t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));

    return x > 0 ? 1 - probability : probability;
  }

  private parseAssignmentFromDB(row: any): ABTestAssignment {
    return {
      id: row.id,
      organization_id: row.organization_id,
      open_shift_id: row.open_shift_id,
      test_name: row.test_name,
      test_variant: row.test_variant,
      test_version: row.test_version,
      assigned_at: row.assigned_at,
      assignment_method: row.assignment_method,
      match_score: row.match_score,
      was_matched: row.was_matched,
      was_accepted: row.was_accepted,
      was_completed: row.was_completed,
      response_time_minutes: row.response_time_minutes,
      client_satisfaction_rating: row.client_satisfaction_rating,
      metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}
