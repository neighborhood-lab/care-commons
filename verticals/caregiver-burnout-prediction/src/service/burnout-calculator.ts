/**
 * Burnout Risk Calculator - Scoring Algorithm
 *
 * Implements the ML-like risk scoring algorithm that converts burnout indicators
 * into a normalized risk score (0-100) and identifies contributing factors.
 *
 * This is NOT surveillance - this is worker support. The algorithm identifies
 * caregivers who need help before they burn out and quit.
 */

import type {
  BurnoutIndicators,
  BurnoutRiskLevel,
  BurnoutFactor,
  BurnoutCalculationConfig,
} from '../types/burnout.js';

/**
 * Default configuration for burnout risk calculation
 */
export const DEFAULT_BURNOUT_CONFIG: BurnoutCalculationConfig = {
  // Component weights (must sum to 100)
  workloadWeight: 20,
  reliabilityWeight: 30,
  complianceWeight: 20,
  performanceWeight: 20,
  externalWeight: 10,

  // Thresholds
  lateClockInThreshold: 10,         // Minutes
  excessiveHoursMultiplier: 1.1,    // 110% of max_hours

  // Risk level boundaries
  atRiskThreshold: 40,
  highRiskThreshold: 70,
  criticalRiskThreshold: 90,
};

export class BurnoutCalculator {
  constructor(private config: BurnoutCalculationConfig = DEFAULT_BURNOUT_CONFIG) {}

  /**
   * Calculate burnout risk score from indicators
   * Returns score (0-100) and contributing factors
   */
  calculateRiskScore(
    indicators: BurnoutIndicators,
    maxHoursPerWeek: number
  ): {
    riskScore: number;
    contributingFactors: BurnoutFactor[];
  } {
    const factors: BurnoutFactor[] = [];

    // 1. Workload component (20%)
    const workloadScore = this.calculateWorkloadScore(indicators, maxHoursPerWeek, factors);

    // 2. Reliability component (30%)
    const reliabilityScore = this.calculateReliabilityScore(indicators, factors);

    // 3. Compliance component (20%)
    const complianceScore = this.calculateComplianceScore(indicators, factors);

    // 4. Performance component (20%)
    const performanceScore = this.calculatePerformanceScore(indicators, factors);

    // 5. External factors component (10%)
    const externalScore = this.calculateExternalScore(indicators, factors);

    // Weighted sum
    const riskScore = Math.min(
      100,
      workloadScore * (this.config.workloadWeight / 100) +
        reliabilityScore * (this.config.reliabilityWeight / 100) +
        complianceScore * (this.config.complianceWeight / 100) +
        performanceScore * (this.config.performanceWeight / 100) +
        externalScore * (this.config.externalWeight / 100)
    );

    // Sort factors by impact (highest first)
    factors.sort((a, b) => b.impact - a.impact);

    return {
      riskScore: Math.round(riskScore * 100) / 100, // Round to 2 decimals
      contributingFactors: factors,
    };
  }

  /**
   * Determine risk level from score
   */
  determineRiskLevel(score: number): BurnoutRiskLevel {
    if (score >= this.config.criticalRiskThreshold) return 'CRITICAL';
    if (score >= this.config.highRiskThreshold) return 'HIGH_RISK';
    if (score >= this.config.atRiskThreshold) return 'AT_RISK';
    return 'HEALTHY';
  }

  /**
   * Determine trend from current and prior scores
   */
  determineTrend(currentScore: number, priorScore: number | null): 'IMPROVING' | 'STABLE' | 'DECLINING' {
    if (priorScore === null) return 'STABLE';

    const change = currentScore - priorScore;
    if (change > 10) return 'DECLINING';      // Risk increased >10 points
    if (change < -10) return 'IMPROVING';     // Risk decreased >10 points
    return 'STABLE';
  }

  // ============================================================================
  // Component Scoring Methods (Private)
  // ============================================================================

  /**
   * Calculate workload component score (0-100)
   */
  private calculateWorkloadScore(
    indicators: BurnoutIndicators,
    maxHoursPerWeek: number,
    factors: BurnoutFactor[]
  ): number {
    let score = 0;

    // Excessive hours (40% of workload component)
    const excessiveHoursThreshold = maxHoursPerWeek * this.config.excessiveHoursMultiplier;
    if (indicators.avgHoursPerWeek > excessiveHoursThreshold) {
      const excessRatio = indicators.avgHoursPerWeek / maxHoursPerWeek;
      const hoursScore = Math.min(40, (excessRatio - 1) * 200); // Cap at 40

      score += hoursScore;
      factors.push({
        factor: 'Excessive Hours',
        impact: hoursScore,
        severity: hoursScore > 30 ? 'CRITICAL' : hoursScore > 20 ? 'HIGH' : 'MEDIUM',
        description: `Working ${indicators.avgHoursPerWeek.toFixed(1)} hours/week (${
          ((excessRatio - 1) * 100).toFixed(0)
        }% over limit)`,
        recommendation: 'Reduce scheduled hours to sustainable level. Consider adding backup caregivers.',
      });
    }

    // Weeks exceeding maximum (30% of workload component)
    if (indicators.weeksExceedingMax > 0) {
      const weeksScore = Math.min(30, indicators.weeksExceedingMax * 10); // Cap at 30
      score += weeksScore;

      factors.push({
        factor: 'Frequent Overtime',
        impact: weeksScore,
        severity: weeksScore > 20 ? 'HIGH' : weeksScore > 10 ? 'MEDIUM' : 'LOW',
        description: `Exceeded max hours in ${indicators.weeksExceedingMax} weeks`,
        recommendation: 'Review scheduling patterns. Ensure adequate rest between shifts.',
      });
    }

    // Consecutive days worked (30% of workload component)
    if (indicators.consecutiveDaysWorked > 6) {
      const streakScore = Math.min(30, (indicators.consecutiveDaysWorked - 6) * 5);
      score += streakScore;

      factors.push({
        factor: 'Extended Work Streak',
        impact: streakScore,
        severity: indicators.consecutiveDaysWorked > 10 ? 'HIGH' : 'MEDIUM',
        description: `Worked ${indicators.consecutiveDaysWorked} consecutive days without break`,
        recommendation: 'Mandate at least one day off per week. Consider mandatory rest periods.',
      });
    }

    return Math.min(100, score);
  }

  /**
   * Calculate reliability component score (0-100)
   */
  private calculateReliabilityScore(indicators: BurnoutIndicators, factors: BurnoutFactor[]): number {
    let score = 0;

    // No-shows (40% of reliability component)
    if (indicators.noShowRate > 0.02) {
      // Concern starts at 2%
      const noShowScore = Math.min(40, indicators.noShowRate * 400);
      score += noShowScore;

      factors.push({
        factor: 'No-Show Pattern',
        impact: noShowScore,
        severity: indicators.noShowRate > 0.05 ? 'CRITICAL' : indicators.noShowRate > 0.03 ? 'HIGH' : 'MEDIUM',
        description: `${(indicators.noShowRate * 100).toFixed(1)}% no-show rate`,
        recommendation: 'Immediate check-in needed. Discuss barriers to attendance.',
      });
    }

    // Cancellations (30% of reliability component)
    if (indicators.cancellationRate > 0.03) {
      // Concern starts at 3%
      const cancelScore = Math.min(30, indicators.cancellationRate * 300);
      score += cancelScore;

      factors.push({
        factor: 'High Cancellation Rate',
        impact: cancelScore,
        severity: indicators.cancellationRate > 0.07 ? 'HIGH' : 'MEDIUM',
        description: `${(indicators.cancellationRate * 100).toFixed(1)}% of visits cancelled`,
        recommendation: 'Discuss reasons for cancellations. May indicate scheduling issues or burnout.',
      });
    }

    // Late clock-ins (30% of reliability component)
    if (indicators.lateClockInRate > 0.10) {
      // Concern starts at 10%
      const lateScore = Math.min(30, indicators.lateClockInRate * 150);
      score += lateScore;

      factors.push({
        factor: 'Frequent Late Arrivals',
        impact: lateScore,
        severity: indicators.lateClockInRate > 0.20 ? 'HIGH' : 'MEDIUM',
        description: `Late to ${(indicators.lateClockInRate * 100).toFixed(0)}% of visits`,
        recommendation: 'Review route planning. Check for scheduling conflicts or transportation issues.',
      });
    }

    return Math.min(100, score);
  }

  /**
   * Calculate compliance component score (0-100)
   */
  private calculateComplianceScore(indicators: BurnoutIndicators, factors: BurnoutFactor[]): number {
    let score = 0;

    // Geofence violations (30% of compliance component)
    if (indicators.geofenceViolationCount > 1) {
      const geoScore = Math.min(30, indicators.geofenceViolationCount * 7);
      score += geoScore;

      factors.push({
        factor: 'EVV Geofence Issues',
        impact: geoScore,
        severity: indicators.geofenceViolationCount > 4 ? 'HIGH' : 'MEDIUM',
        description: `${indicators.geofenceViolationCount} geofence violations`,
        recommendation: 'Discuss EVV compliance. May indicate rushing or stress.',
      });
    }

    // Manual overrides (25% of compliance component)
    if (indicators.manualOverrideCount > 2) {
      const overrideScore = Math.min(25, indicators.manualOverrideCount * 6);
      score += overrideScore;

      factors.push({
        factor: 'EVV System Issues',
        impact: overrideScore,
        severity: indicators.manualOverrideCount > 5 ? 'HIGH' : 'MEDIUM',
        description: `${indicators.manualOverrideCount} manual overrides needed`,
        recommendation: 'Check for EVV app issues. Provide training if needed.',
      });
    }

    // Missed clock-outs (25% of compliance component)
    if (indicators.missedClockOutCount > 2) {
      const missedScore = Math.min(25, indicators.missedClockOutCount * 6);
      score += missedScore;

      factors.push({
        factor: 'Incomplete EVV Records',
        impact: missedScore,
        severity: indicators.missedClockOutCount > 5 ? 'HIGH' : 'MEDIUM',
        description: `${indicators.missedClockOutCount} missed clock-outs`,
        recommendation: 'Remind about EVV completion. Check for mobile app issues.',
      });
    }

    // Late submissions (20% of compliance component)
    if (indicators.lateSubmissionRate > 0.15) {
      const lateSubScore = Math.min(20, indicators.lateSubmissionRate * 80);
      score += lateSubScore;

      factors.push({
        factor: 'Late EVV Submissions',
        impact: lateSubScore,
        severity: indicators.lateSubmissionRate > 0.30 ? 'HIGH' : 'MEDIUM',
        description: `${(indicators.lateSubmissionRate * 100).toFixed(0)}% submitted late`,
        recommendation: 'Discuss documentation workflow. Simplify if possible.',
      });
    }

    return Math.min(100, score);
  }

  /**
   * Calculate performance component score (0-100)
   */
  private calculatePerformanceScore(indicators: BurnoutIndicators, factors: BurnoutFactor[]): number {
    let score = 0;

    // Performance rating decline (40% of performance component)
    if (indicators.currentPerformanceRating < 3) {
      const ratingScore = (3 - indicators.currentPerformanceRating) * 20;
      score += ratingScore;

      factors.push({
        factor: 'Low Performance Rating',
        impact: ratingScore,
        severity: indicators.currentPerformanceRating < 2 ? 'CRITICAL' : 'HIGH',
        description: `Performance rating: ${indicators.currentPerformanceRating}/5`,
        recommendation: 'Performance review needed. Provide support and development plan.',
      });
    }

    // Performance trend (30% of performance component)
    if (indicators.performanceTrendPercentage < -10) {
      // Declining performance
      const trendScore = Math.min(30, Math.abs(indicators.performanceTrendPercentage) / 2);
      score += trendScore;

      factors.push({
        factor: 'Declining Performance',
        impact: trendScore,
        severity: indicators.performanceTrendPercentage < -25 ? 'HIGH' : 'MEDIUM',
        description: `Performance down ${Math.abs(indicators.performanceTrendPercentage).toFixed(0)}%`,
        recommendation: 'Investigate causes. Offer additional training or mentorship.',
      });
    }

    // Compliance trend (30% of performance component)
    if (indicators.complianceTrendPercentage < -10) {
      // Declining compliance
      const compTrendScore = Math.min(30, Math.abs(indicators.complianceTrendPercentage) / 2);
      score += compTrendScore;

      factors.push({
        factor: 'Declining Compliance',
        impact: compTrendScore,
        severity: indicators.complianceTrendPercentage < -25 ? 'HIGH' : 'MEDIUM',
        description: `Compliance down ${Math.abs(indicators.complianceTrendPercentage).toFixed(0)}%`,
        recommendation: 'Review compliance requirements. Check for understanding gaps.',
      });
    }

    return Math.min(100, score);
  }

  /**
   * Calculate external factors score (0-100)
   */
  private calculateExternalScore(indicators: BurnoutIndicators, factors: BurnoutFactor[]): number {
    let score = 0;

    // Expiring credentials (50% of external component)
    if (indicators.credentialsExpiringCount > 0) {
      const credScore = Math.min(50, indicators.credentialsExpiringCount * 15);
      score += credScore;

      factors.push({
        factor: 'Expiring Credentials',
        impact: credScore,
        severity: indicators.credentialsExpiringCount > 2 ? 'HIGH' : 'MEDIUM',
        description: `${indicators.credentialsExpiringCount} credential(s) expiring soon`,
        recommendation: 'Support credential renewal. Reduce scheduling burden during renewal period.',
      });
    }

    // Overdue training (50% of external component)
    if (indicators.trainingOverdueCount > 0) {
      const trainingScore = Math.min(50, indicators.trainingOverdueCount * 15);
      score += trainingScore;

      factors.push({
        factor: 'Overdue Training',
        impact: trainingScore,
        severity: indicators.trainingOverdueCount > 2 ? 'HIGH' : 'MEDIUM',
        description: `${indicators.trainingOverdueCount} training(s) overdue`,
        recommendation: 'Provide time for training completion. May need to reduce visit load.',
      });
    }

    return Math.min(100, score);
  }
}
