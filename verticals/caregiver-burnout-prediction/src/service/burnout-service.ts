/**
 * Burnout Service - Business Logic Layer
 *
 * Orchestrates burnout risk calculation for caregivers using repository data
 * and scoring algorithms. Handles permission checking, caching, and result formatting.
 *
 * Uses Database class (pg Pool-based) from @folkcare/core.
 */

import type { Database } from '@folkcare/core';
import type {
  AnalysisPeriod,
  CaregiverBurnoutRisk,
  OrganizationBurnoutReport,
  DateRange,
  BurnoutTrend,
  CalculateBurnoutRiskRequest,
  GenerateBurnoutReportRequest,
} from '../types/burnout.js';
import { BurnoutRepository } from '../repository/burnout-repository.js';
import { BurnoutCalculator, DEFAULT_BURNOUT_CONFIG } from './burnout-calculator.js';

export interface UserContext {
  userId: string;
  organizationId: string;
  role: string;
}

export class BurnoutService {
  private repository: BurnoutRepository;
  private calculator: BurnoutCalculator;

  constructor(private db: Database) {
    this.repository = new BurnoutRepository(db);
    this.calculator = new BurnoutCalculator(DEFAULT_BURNOUT_CONFIG);
  }

  /**
   * Calculate burnout risk for a single caregiver
   */
  async calculateCaregiverBurnoutRisk(
    request: CalculateBurnoutRiskRequest,
    context: UserContext
  ): Promise<CaregiverBurnoutRisk> {
    const { caregiverId, analysisPeriod = 'LAST_4_WEEKS', config } = request;

    // Get date ranges for current and prior analysis periods
    const { currentRange, priorRange } = this.getDateRanges(analysisPeriod);

    // Apply custom config if provided
    if (config) {
      this.calculator = new BurnoutCalculator({ ...DEFAULT_BURNOUT_CONFIG, ...config });
    }

    // Fetch caregiver info and verify org access
    const caregiverResult = await this.db.query<{
      id: string;
      first_name: string;
      last_name: string;
      organization_id: string;
      max_hours_per_week: number | null;
    }>(
      `SELECT id, first_name, last_name, organization_id, max_hours_per_week
       FROM caregivers WHERE id = $1 LIMIT 1`,
      [caregiverId]
    );

    const caregiver = caregiverResult.rows[0];
    if (!caregiver) {
      throw new Error(`Caregiver ${caregiverId} not found`);
    }

    // Permission check - must be in same organization
    if (caregiver.organization_id !== context.organizationId) {
      throw new Error('Permission denied: caregiver not in your organization');
    }

    // Gather burnout indicators from repository
    const indicators = await this.repository.getCaregiverBurnoutIndicators(
      caregiverId,
      currentRange,
      priorRange
    );

    // Calculate risk score and contributing factors
    const { riskScore, contributingFactors } = this.calculator.calculateRiskScore(
      indicators,
      caregiver.max_hours_per_week || 40
    );

    // Determine risk level
    const riskLevel = this.calculator.determineRiskLevel(riskScore);

    // Get prior score for trending (if exists)
    const snapshots = await this.repository.getBurnoutSnapshots(caregiverId, 1);
    const priorRiskScore = snapshots.length > 0 ? (snapshots[0]?.riskScore ?? null) : null;
    const trend = this.calculator.determineTrend(riskScore, priorRiskScore);

    // Save snapshot for future trending
    await this.repository.saveBurnoutSnapshot(
      caregiverId,
      caregiver.organization_id,
      riskScore,
      riskLevel,
      indicators
    );

    // Build result
    const result: CaregiverBurnoutRisk = {
      caregiverId,
      caregiverName: `${caregiver.first_name} ${caregiver.last_name}`,
      organizationId: caregiver.organization_id,
      riskScore,
      riskLevel,
      trend,
      indicators,
      contributingFactors,
      calculatedAt: new Date(),
      analysisPeriod,
      priorRiskScore,
    };

    return result;
  }

  /**
   * Generate burnout report for all caregivers in an organization
   */
  async generateOrganizationBurnoutReport(
    request: GenerateBurnoutReportRequest,
    context: UserContext
  ): Promise<OrganizationBurnoutReport> {
    const { organizationId, analysisPeriod = 'LAST_4_WEEKS', includeHealthy = false } = request;

    // Permission check
    if (organizationId !== context.organizationId) {
      throw new Error('Permission denied: cannot access this organization');
    }

    // Get all active caregivers in organization
    const caregivers = await this.repository.getOrganizationCaregivers(organizationId);

    // Calculate burnout risk for each caregiver (in parallel for performance)
    const riskPromises = caregivers.map((cg) =>
      this.calculateCaregiverBurnoutRisk(
        { caregiverId: cg.caregiverId, analysisPeriod },
        context
      ).catch((err) => {
        console.error(`Error calculating burnout for ${cg.caregiverId}:`, err);
        return null; // Continue processing others on error
      })
    );

    const risks = (await Promise.all(riskPromises)).filter((r) => r !== null) as CaregiverBurnoutRisk[];

    // Filter out healthy caregivers if requested
    const filteredRisks = includeHealthy
      ? risks
      : risks.filter((r) => r.riskLevel !== 'HEALTHY');

    // Calculate summary stats
    const healthyCount = risks.filter((r) => r.riskLevel === 'HEALTHY').length;
    const atRiskCount = risks.filter((r) => r.riskLevel === 'AT_RISK').length;
    const highRiskCount = risks.filter((r) => r.riskLevel === 'HIGH_RISK').length;
    const criticalCount = risks.filter((r) => r.riskLevel === 'CRITICAL').length;

    const avgRiskScore = risks.length > 0
      ? risks.reduce((sum, r) => sum + r.riskScore, 0) / risks.length
      : 0;

    // Calculate overall trend
    const decliningCount = risks.filter((r) => r.trend === 'DECLINING').length;
    const improvingCount = risks.filter((r) => r.trend === 'IMPROVING').length;
    const trendDirection: BurnoutTrend =
      decliningCount > improvingCount ? 'DECLINING' :
      improvingCount > decliningCount ? 'IMPROVING' : 'STABLE';

    // Calculate percentage change
    const risksWithPrior = risks.filter((r) => r.priorRiskScore !== null);
    const percentageChange = risksWithPrior.length > 0
      ? risksWithPrior.reduce((sum, r) => {
          const change = ((r.riskScore - r.priorRiskScore!) / r.priorRiskScore!) * 100;
          return sum + change;
        }, 0) / risksWithPrior.length
      : 0;

    return {
      organizationId,
      reportDate: new Date(),
      analysisPeriod,
      totalCaregivers: risks.length,
      healthyCount,
      atRiskCount,
      highRiskCount,
      criticalCount,
      caregivers: filteredRisks,
      avgRiskScore: Math.round(avgRiskScore * 100) / 100,
      trendDirection,
      percentageChange: Math.round(percentageChange * 100) / 100,
    };
  }

  /**
   * Get caregivers at risk in an organization (for dashboard alerts)
   */
  async getAtRiskCaregivers(
    organizationId: string,
    context: UserContext,
    analysisPeriod: AnalysisPeriod = 'LAST_4_WEEKS'
  ): Promise<CaregiverBurnoutRisk[]> {
    const report = await this.generateOrganizationBurnoutReport(
      { organizationId, analysisPeriod, includeHealthy: false },
      context
    );

    // Sort by risk score (highest first)
    return report.caregivers.sort((a, b) => b.riskScore - a.riskScore);
  }

  /**
   * Get burnout trend history for a caregiver
   */
  async getCaregiverBurnoutTrend(
    caregiverId: string,
    context: UserContext,
    weeksBack: number = 12
  ): Promise<Array<{ date: Date; riskScore: number; riskLevel: string }>> {
    // Verify caregiver access
    const caregiverResult = await this.db.query<{
      organization_id: string;
    }>(
      'SELECT organization_id FROM caregivers WHERE id = $1 LIMIT 1',
      [caregiverId]
    );

    const caregiver = caregiverResult.rows[0];
    if (!caregiver) {
      throw new Error(`Caregiver ${caregiverId} not found`);
    }

    if (caregiver.organization_id !== context.organizationId) {
      throw new Error('Permission denied');
    }

    // Get historical snapshots
    const snapshots = await this.repository.getBurnoutSnapshots(caregiverId, weeksBack);

    return snapshots.map((s) => ({
      date: s.snapshotDate,
      riskScore: s.riskScore,
      riskLevel: s.riskLevel,
    }));
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Get current and prior date ranges based on analysis period
   */
  private getDateRanges(period: AnalysisPeriod): {
    currentRange: DateRange;
    priorRange: DateRange;
  } {
    const now = new Date();
    const weeksMap = {
      LAST_2_WEEKS: 2,
      LAST_4_WEEKS: 4,
      LAST_8_WEEKS: 8,
      LAST_12_WEEKS: 12,
    };

    const weeks = weeksMap[period];
    const daysInPeriod = weeks * 7;

    // Current period: last N weeks from now
    const currentEnd = now;
    const currentStart = new Date(now.getTime() - daysInPeriod * 24 * 60 * 60 * 1000);

    // Prior period: N weeks before current period
    const priorEnd = currentStart;
    const priorStart = new Date(currentStart.getTime() - daysInPeriod * 24 * 60 * 60 * 1000);

    return {
      currentRange: { startDate: currentStart, endDate: currentEnd },
      priorRange: { startDate: priorStart, endDate: priorEnd },
    };
  }
}
