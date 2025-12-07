/**
 * Caregiver Burnout Prediction Service
 *
 * WORKER-FIRST AI: This service uses data to PROTECT caregivers from burnout,
 * not to surveil or punish them. Early detection enables proactive intervention.
 *
 * Key Principles:
 * - Privacy-first: Aggregate patterns, not individual surveillance
 * - Transparent: Caregivers can see their own risk score
 * - Actionable: Every alert includes intervention suggestions
 * - No punishment: Used for support, not discipline
 *
 * Why This Matters:
 * - Burnout → Turnover → Worse patient outcomes
 * - Competitors use AI for surveillance ("productivity monitoring")
 * - WE use AI to protect workers and improve retention
 *
 * Research-backed burnout indicators:
 * 1. Excessive hours (>40/week sustained)
 * 2. Schedule density (no breaks between visits)
 * 3. Lack of time off (>14 days without a day off)
 * 4. Geographic overload (excessive travel time)
 * 5. Late pattern (chronic tardiness = fatigue)
 * 6. Cancellation pattern (avoiding shifts = warning sign)
 */

import {
  UUID,
  UserContext,
  ValidationError,
} from '@folkcare/core';

/**
 * Burnout risk assessment result
 */
export interface BurnoutRiskAssessment {
  caregiverId: UUID;
  caregiverName: string;
  overallRiskScore: number; // 0-100, higher = more risk
  riskLevel: BurnoutRiskLevel;
  riskFactors: RiskFactor[];
  interventionSuggestions: InterventionSuggestion[];
  assessedAt: Date;
  nextAssessmentDue: Date;
  trendDirection: 'IMPROVING' | 'STABLE' | 'WORSENING';
}

export type BurnoutRiskLevel =
  | 'LOW' // 0-30: Healthy work-life balance
  | 'MODERATE' // 31-60: Some concerning patterns
  | 'HIGH' // 61-80: Intervention recommended
  | 'CRITICAL'; // 81-100: Immediate action required

/**
 * Individual risk factor with evidence
 */
export interface RiskFactor {
  category: RiskFactorCategory;
  severity: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  score: number; // Contribution to overall risk (0-100)
  description: string;
  evidence: string[]; // Specific data points supporting this factor
  detectedAt: Date;
}

export type RiskFactorCategory =
  | 'EXCESSIVE_HOURS' // Working too many hours
  | 'SCHEDULE_DENSITY' // Too many visits back-to-back
  | 'NO_TIME_OFF' // No days off in extended period
  | 'GEOGRAPHIC_OVERLOAD' // Excessive travel between visits
  | 'LATE_PATTERN' // Chronic tardiness (fatigue indicator)
  | 'CANCELLATION_PATTERN' // Avoiding shifts
  | 'WEEKEND_OVERLOAD' // Too many weekend shifts
  | 'NIGHT_SHIFT_BURDEN' // Too many evening/night shifts
  | 'CLIENT_COMPLEXITY' // High-needs clients only
  | 'LACK_OF_VARIETY'; // Same clients/tasks repeatedly

/**
 * Actionable intervention suggestion
 */
export interface InterventionSuggestion {
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  category: InterventionCategory;
  title: string;
  description: string;
  actionItems: string[];
  estimatedImpact: 'HIGH' | 'MEDIUM' | 'LOW'; // Expected risk reduction
  implementationDifficulty: 'EASY' | 'MODERATE' | 'DIFFICULT';
}

export type InterventionCategory =
  | 'REDUCE_HOURS' // Redistribute hours to other caregivers
  | 'SCHEDULE_TIME_OFF' // Mandate time off
  | 'ADD_BREAKS' // Add buffer time between visits
  | 'REDUCE_TRAVEL' // Cluster visits geographically
  | 'SHIFT_REDISTRIBUTION' // Balance weekends/nights
  | 'VARY_CLIENTS' // Rotate client assignments
  | 'CHECK_IN' // Manager 1:1 conversation
  | 'PEER_SUPPORT' // Connect with other caregivers
  | 'TRAINING' // Stress management/self-care training
  | 'WORKLOAD_ASSESSMENT'; // Formal workload review

/**
 * Caregiver work pattern data (from time-tracking)
 */
export interface CaregiverWorkPattern {
  caregiverId: UUID;
  periodStart: Date;
  periodEnd: Date;
  totalHoursWorked: number;
  totalVisits: number;
  averageHoursPerWeek: number;
  averageVisitsPerDay: number;
  daysWorkedInPeriod: number;
  consecutiveDaysWorked: number;
  daysSinceLastDayOff: number;
  weekendShifts: number;
  nightShifts: number;
  earlyMorningShifts: number;
  averageTravelTimeMinutes: number;
  lateClockIns: number; // Tardiness count
  visitCancellations: number; // Last-minute cancellations
  averageVisitDuration: number;
  longestConsecutiveHours: number; // Longest stretch without break
}

/**
 * Provider interface for fetching caregiver work patterns
 * Decouples from time-tracking-evv vertical
 */
export interface IWorkPatternProvider {
  getCaregiverWorkPattern(
    caregiverId: UUID,
    periodDays: number,
    context: UserContext
  ): Promise<CaregiverWorkPattern>;
}

/**
 * Burnout Prediction Service
 */
export class BurnoutPredictionService {
  private workPatternProvider?: IWorkPatternProvider;

  /**
   * Set work pattern provider for fetching caregiver time-tracking data
   */
  setWorkPatternProvider(provider: IWorkPatternProvider): void {
    this.workPatternProvider = provider;
  }

  /**
   * Assess burnout risk for a single caregiver
   */
  async assessCaregiverRisk(
    caregiverId: UUID,
    caregiverName: string,
    context: UserContext
  ): Promise<BurnoutRiskAssessment> {
    // FAIL FAST: Require work pattern provider
    if (!this.workPatternProvider) {
      throw new ValidationError(
        'WorkPatternProvider not configured. Cannot assess burnout risk.',
        {
          hint: 'Inject an IWorkPatternProvider implementation when instantiating BurnoutPredictionService',
        }
      );
    }

    // Get work pattern for last 30 days
    const workPattern = await this.workPatternProvider.getCaregiverWorkPattern(
      caregiverId,
      30,
      context
    );

    // Analyze risk factors
    const riskFactors = this.analyzeRiskFactors(workPattern);

    // Calculate overall risk score
    const overallRiskScore = this.calculateOverallRisk(riskFactors);
    const riskLevel = this.determineRiskLevel(overallRiskScore);

    // Generate intervention suggestions
    const interventionSuggestions = this.generateInterventions(
      riskFactors,
      riskLevel
    );

    // Determine trend (requires historical data - placeholder for now)
    const trendDirection = 'STABLE'; // TODO: Compare with previous assessment

    return {
      caregiverId,
      caregiverName,
      overallRiskScore,
      riskLevel,
      riskFactors,
      interventionSuggestions,
      assessedAt: new Date(),
      nextAssessmentDue: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      trendDirection,
    };
  }

  /**
   * Batch assessment for multiple caregivers
   * Returns only those above a risk threshold
   */
  async assessOrganizationRisks(
    organizationId: UUID,
    minRiskLevel: BurnoutRiskLevel,
    context: UserContext
  ): Promise<BurnoutRiskAssessment[]> {
    // TODO: Implement batch assessment
    // This would fetch all caregivers in organization and assess each
    // For MVP, throwing NotImplementedError to fail fast
    throw new Error(
      `NOT IMPLEMENTED: Batch organization assessment coming in Phase 2. ` +
      `Organization: ${organizationId}, Context: ${context.userId}, MinRisk: ${minRiskLevel}`
    );
  }

  /**
   * Analyze work pattern to identify risk factors
   */
  private analyzeRiskFactors(workPattern: CaregiverWorkPattern): RiskFactor[] {
    const factors: RiskFactor[] = [];

    // 1. Excessive Hours
    if (workPattern.averageHoursPerWeek > 40) {
      const severity = this.getSeverity(workPattern.averageHoursPerWeek, {
        low: 40,
        moderate: 45,
        high: 50,
        critical: 55,
      });

      factors.push({
        category: 'EXCESSIVE_HOURS',
        severity,
        score: Math.min((workPattern.averageHoursPerWeek - 35) * 2, 25),
        description: `Working ${workPattern.averageHoursPerWeek.toFixed(1)} hours/week on average`,
        evidence: [
          `${workPattern.totalHoursWorked} hours in ${Math.floor((workPattern.periodEnd.getTime() - workPattern.periodStart.getTime()) / (24 * 60 * 60 * 1000))} days`,
          `Above sustainable 40-hour threshold`,
        ],
        detectedAt: new Date(),
      });
    }

    // 2. No Time Off
    if (workPattern.daysSinceLastDayOff > 14) {
      const severity = this.getSeverity(workPattern.daysSinceLastDayOff, {
        low: 14,
        moderate: 21,
        high: 30,
        critical: 45,
      });

      factors.push({
        category: 'NO_TIME_OFF',
        severity,
        score: Math.min(workPattern.daysSinceLastDayOff, 30),
        description: `${workPattern.daysSinceLastDayOff} days since last day off`,
        evidence: [
          `${workPattern.consecutiveDaysWorked} consecutive days worked`,
          `Recommend at least 1 day off per week`,
        ],
        detectedAt: new Date(),
      });
    }

    // 3. Schedule Density (back-to-back visits)
    if (workPattern.longestConsecutiveHours > 10) {
      const severity = this.getSeverity(workPattern.longestConsecutiveHours, {
        low: 10,
        moderate: 12,
        high: 14,
        critical: 16,
      });

      factors.push({
        category: 'SCHEDULE_DENSITY',
        severity,
        score: Math.min((workPattern.longestConsecutiveHours - 8) * 2, 20),
        description: `Working ${workPattern.longestConsecutiveHours} hours straight without adequate breaks`,
        evidence: [
          `Longest continuous shift: ${workPattern.longestConsecutiveHours} hours`,
          `Recommend max 8-hour shifts with breaks`,
        ],
        detectedAt: new Date(),
      });
    }

    // 4. Geographic Overload
    if (workPattern.averageTravelTimeMinutes > 60) {
      const severity = this.getSeverity(workPattern.averageTravelTimeMinutes, {
        low: 60,
        moderate: 90,
        high: 120,
        critical: 150,
      });

      factors.push({
        category: 'GEOGRAPHIC_OVERLOAD',
        severity,
        score: Math.min((workPattern.averageTravelTimeMinutes - 30) / 5, 15),
        description: `Averaging ${workPattern.averageTravelTimeMinutes} minutes travel between visits`,
        evidence: [
          `Excessive unpaid drive time`,
          `Consider geographic clustering of visits`,
        ],
        detectedAt: new Date(),
      });
    }

    // 5. Late Pattern (fatigue indicator)
    if (workPattern.lateClockIns > 3) {
      const severity = this.getSeverity(workPattern.lateClockIns, {
        low: 3,
        moderate: 5,
        high: 8,
        critical: 12,
      });

      factors.push({
        category: 'LATE_PATTERN',
        severity,
        score: workPattern.lateClockIns * 1.5,
        description: `${workPattern.lateClockIns} late clock-ins in past 30 days`,
        evidence: [
          `Pattern may indicate fatigue or burnout`,
          `Check in with caregiver about schedule sustainability`,
        ],
        detectedAt: new Date(),
      });
    }

    // 6. Cancellation Pattern
    if (workPattern.visitCancellations > 2) {
      const severity = this.getSeverity(workPattern.visitCancellations, {
        low: 2,
        moderate: 4,
        high: 6,
        critical: 10,
      });

      factors.push({
        category: 'CANCELLATION_PATTERN',
        severity,
        score: workPattern.visitCancellations * 2,
        description: `${workPattern.visitCancellations} visit cancellations in past 30 days`,
        evidence: [
          `Above normal cancellation rate`,
          `May indicate work avoidance or stress`,
        ],
        detectedAt: new Date(),
      });
    }

    // 7. Weekend Overload
    if (workPattern.weekendShifts > 6) {
      const severity = this.getSeverity(workPattern.weekendShifts, {
        low: 6,
        moderate: 8,
        high: 10,
        critical: 12,
      });

      factors.push({
        category: 'WEEKEND_OVERLOAD',
        severity,
        score: (workPattern.weekendShifts - 4) * 1.5,
        description: `${workPattern.weekendShifts} weekend shifts in past 30 days`,
        evidence: [
          `Insufficient work-life balance`,
          `Consider rotating weekend coverage`,
        ],
        detectedAt: new Date(),
      });
    }

    return factors;
  }

  /**
   * Calculate overall risk score from individual factors
   */
  private calculateOverallRisk(factors: RiskFactor[]): number {
    if (factors.length === 0) return 0;

    // Sum all factor scores
    const totalScore = factors.reduce((sum, factor) => sum + factor.score, 0);

    // Cap at 100
    return Math.min(totalScore, 100);
  }

  /**
   * Determine risk level from overall score
   */
  private determineRiskLevel(score: number): BurnoutRiskLevel {
    if (score <= 30) return 'LOW';
    if (score <= 60) return 'MODERATE';
    if (score <= 80) return 'HIGH';
    return 'CRITICAL';
  }

  /**
   * Generate intervention suggestions based on risk factors
   */
  private generateInterventions(
    factors: RiskFactor[],
    riskLevel: BurnoutRiskLevel
  ): InterventionSuggestion[] {
    const interventions: InterventionSuggestion[] = [];

    // Group factors by category
    const factorsByCategory = new Map<RiskFactorCategory, RiskFactor>();
    for (const factor of factors) {
      if (!factorsByCategory.has(factor.category) ||
          factor.severity > (factorsByCategory.get(factor.category)?.severity ?? 'LOW')) {
        factorsByCategory.set(factor.category, factor);
      }
    }

    // Generate interventions for each factor
    for (const [category, factor] of factorsByCategory) {
      const intervention = this.getInterventionForFactor(category, factor);
      if (intervention) {
        interventions.push(intervention);
      }
    }

    // Add general check-in for moderate+ risk
    if (riskLevel !== 'LOW') {
      interventions.push({
        priority: riskLevel === 'CRITICAL' ? 'URGENT' : 'HIGH',
        category: 'CHECK_IN',
        title: '1:1 Manager Check-in',
        description: 'Schedule a supportive conversation to understand challenges and needs',
        actionItems: [
          'Schedule 30-minute 1:1 with caregiver',
          'Ask about workload, stress levels, and support needs',
          'Listen without judgment - this is support, not discipline',
          'Collaborate on solutions together',
        ],
        estimatedImpact: 'HIGH',
        implementationDifficulty: 'EASY',
      });
    }

    // Sort by priority
    const priorityOrder = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    interventions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return interventions;
  }

  /**
   * Get intervention suggestion for specific risk factor
   */
  private getInterventionForFactor(
    category: RiskFactorCategory,
    factor: RiskFactor
  ): InterventionSuggestion | null {
    const interventionMap: Record<RiskFactorCategory, Omit<InterventionSuggestion, 'priority'>> = {
      EXCESSIVE_HOURS: {
        category: 'REDUCE_HOURS',
        title: 'Reduce Weekly Hours',
        description: 'Redistribute visits to bring hours back to sustainable levels',
        actionItems: [
          'Identify visits that can be reassigned to other caregivers',
          `Target: Reduce to 40 hours/week maximum`,
          'Ensure pay remains stable during transition',
          'Monitor for 2 weeks and reassess',
        ],
        estimatedImpact: 'HIGH',
        implementationDifficulty: 'MODERATE',
      },
      NO_TIME_OFF: {
        category: 'SCHEDULE_TIME_OFF',
        title: 'Schedule Mandatory Time Off',
        description: 'Ensure regular days off for rest and recovery',
        actionItems: [
          'Schedule at least 1-2 days off per week',
          'Block future schedule to prevent overbooking',
          'Communicate upcoming time off to clients',
          'Ensure emergency coverage is arranged',
        ],
        estimatedImpact: 'HIGH',
        implementationDifficulty: 'MODERATE',
      },
      SCHEDULE_DENSITY: {
        category: 'ADD_BREAKS',
        title: 'Add Break Time Between Visits',
        description: 'Build in buffer time to prevent burnout from back-to-back visits',
        actionItems: [
          'Add 30-minute buffer between visits',
          'Ensure time for meals and rest',
          'Reduce total daily visits if needed',
          'Consider splitting long shifts into shorter ones',
        ],
        estimatedImpact: 'MEDIUM',
        implementationDifficulty: 'MODERATE',
      },
      GEOGRAPHIC_OVERLOAD: {
        category: 'REDUCE_TRAVEL',
        title: 'Cluster Visits Geographically',
        description: 'Reduce drive time by grouping nearby clients',
        actionItems: [
          'Use AI scheduling to cluster visits by location',
          'Reassign distant clients to caregivers closer by',
          'Consider mileage reimbursement for excessive travel',
          'Review route optimization',
        ],
        estimatedImpact: 'MEDIUM',
        implementationDifficulty: 'MODERATE',
      },
      LATE_PATTERN: {
        category: 'CHECK_IN',
        title: 'Address Tardiness Pattern',
        description: 'Understand root cause of lateness (often fatigue or schedule issues)',
        actionItems: [
          'Have supportive conversation (not punitive)',
          'Identify if schedule is unrealistic',
          'Check for personal/family issues needing accommodation',
          'Adjust schedule if needed',
        ],
        estimatedImpact: 'MEDIUM',
        implementationDifficulty: 'EASY',
      },
      CANCELLATION_PATTERN: {
        category: 'CHECK_IN',
        title: 'Investigate Cancellation Pattern',
        description: 'Frequent cancellations may indicate burnout or dissatisfaction',
        actionItems: [
          'Review reasons for each cancellation',
          'Identify if specific clients/shifts are problem',
          'Check for unmet support needs',
          'Consider workload reduction',
        ],
        estimatedImpact: 'HIGH',
        implementationDifficulty: 'EASY',
      },
      WEEKEND_OVERLOAD: {
        category: 'SHIFT_REDISTRIBUTION',
        title: 'Balance Weekend Coverage',
        description: 'Rotate weekend shifts fairly across team',
        actionItems: [
          'Limit to 2 weekend shifts per month maximum',
          'Implement fair rotation system',
          'Offer weekend premium pay if needed',
          'Ensure adequate weekend coverage across team',
        ],
        estimatedImpact: 'MEDIUM',
        implementationDifficulty: 'MODERATE',
      },
      NIGHT_SHIFT_BURDEN: {
        category: 'SHIFT_REDISTRIBUTION',
        title: 'Balance Night Shift Load',
        description: 'Rotate evening/night shifts to prevent sleep disruption',
        actionItems: [
          'Limit consecutive night shifts',
          'Ensure recovery time after night shifts',
          'Consider night shift differential pay',
          'Rotate fairly across willing team members',
        ],
        estimatedImpact: 'MEDIUM',
        implementationDifficulty: 'MODERATE',
      },
      CLIENT_COMPLEXITY: {
        category: 'VARY_CLIENTS',
        title: 'Balance Client Complexity',
        description: 'Mix high-needs and lower-needs clients for sustainable workload',
        actionItems: [
          'Identify most demanding clients on caseload',
          'Redistribute some high-needs clients',
          'Ensure adequate training and support',
          'Regular check-ins on emotional impact',
        ],
        estimatedImpact: 'MEDIUM',
        implementationDifficulty: 'MODERATE',
      },
      LACK_OF_VARIETY: {
        category: 'VARY_CLIENTS',
        title: 'Rotate Client Assignments',
        description: 'Provide variety to prevent monotony and compassion fatigue',
        actionItems: [
          'Introduce new client assignments periodically',
          'Maintain some continuity while adding variety',
          'Consider caregiver preferences',
          'Ensure proper introductions and transitions',
        ],
        estimatedImpact: 'LOW',
        implementationDifficulty: 'MODERATE',
      },
    };

    const baseIntervention = interventionMap[category];
    if (!baseIntervention) return null;

    // Determine priority based on severity
    const priority =
      factor.severity === 'CRITICAL' ? 'URGENT' :
      factor.severity === 'HIGH' ? 'HIGH' :
      factor.severity === 'MODERATE' ? 'MEDIUM' : 'LOW';

    return {
      ...baseIntervention,
      priority,
    };
  }

  /**
   * Helper to determine severity level from a numeric value
   */
  private getSeverity(
    value: number,
    thresholds: { low: number; moderate: number; high: number; critical: number }
  ): 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' {
    if (value >= thresholds.critical) return 'CRITICAL';
    if (value >= thresholds.high) return 'HIGH';
    if (value >= thresholds.moderate) return 'MODERATE';
    return 'LOW';
  }
}
