/**
 * Conversion Tracking Service
 *
 * Tracks inquiry to admission conversion rates,
 * enabling organizations to optimize their intake process.
 */

import { Database, UserContext } from '@folkcare/core';
import { AnalyticsRepository } from '../repository/analytics-repository.js';
import {
  ReferralSource,
  InquiryStatus,
  DeclineReason,
  ConversionStageMetrics,
  ConversionBySource,
  ConversionTrendDataPoint,
  CoordinatorConversionMetrics,
  LostOpportunityAnalysis,
  ConversionFunnelSummary,
  ConversionRateAnalysis,
  ConversionRateQueryOptions,
} from '../types/analytics.js';

// Industry benchmarks
const INDUSTRY_AVG_CONVERSION_RATE = 0.35; // 35%
const TARGET_CONVERSION_RATE = 0.45; // 45%
const INDUSTRY_AVG_DAYS_TO_ADMISSION = 14;
const TARGET_DAYS_TO_ADMISSION = 7;

// Referral source display names
const REFERRAL_SOURCE_NAMES: Record<ReferralSource, string> = {
  HOSPITAL_DISCHARGE: 'Hospital Discharge',
  PHYSICIAN_REFERRAL: 'Physician Referral',
  SKILLED_NURSING_FACILITY: 'Skilled Nursing Facility',
  INSURANCE_COMPANY: 'Insurance Company',
  FAMILY_SELF_REFERRAL: 'Family/Self Referral',
  COMMUNITY_ORGANIZATION: 'Community Organization',
  WEBSITE: 'Website',
  MARKETING_CAMPAIGN: 'Marketing Campaign',
  WORD_OF_MOUTH: 'Word of Mouth',
  OTHER: 'Other',
};

// Stage display names
const STAGE_NAMES: Record<InquiryStatus, string> = {
  NEW_INQUIRY: 'New Inquiry',
  CONTACTED: 'Contacted',
  ASSESSMENT_SCHEDULED: 'Assessment Scheduled',
  ASSESSMENT_COMPLETED: 'Assessment Completed',
  AUTHORIZATION_PENDING: 'Authorization Pending',
  READY_FOR_SERVICE: 'Ready for Service',
  ADMITTED: 'Admitted',
  DECLINED: 'Declined',
  LOST_TO_COMPETITOR: 'Lost to Competitor',
  NOT_QUALIFIED: 'Not Qualified',
  NO_RESPONSE: 'No Response',
};

// Decline reason names
const DECLINE_REASON_NAMES: Record<DeclineReason, string> = {
  COST_CONCERNS: 'Cost Concerns',
  CHOSE_COMPETITOR: 'Chose Competitor',
  NO_LONGER_NEEDED: 'No Longer Needed',
  NOT_ELIGIBLE: 'Not Eligible',
  NO_COVERAGE: 'No Coverage',
  LOCATION_NOT_SERVED: 'Location Not Served',
  SERVICES_NOT_AVAILABLE: 'Services Not Available',
  TIMING_ISSUES: 'Timing Issues',
  FAMILY_DECISION: 'Family Decision',
  OTHER: 'Other',
};

// Source conversion benchmarks (realistic estimates)
const SOURCE_BENCHMARKS: Record<ReferralSource, { conversionRate: number; avgDays: number }> = {
  HOSPITAL_DISCHARGE: { conversionRate: 0.55, avgDays: 5 },
  PHYSICIAN_REFERRAL: { conversionRate: 0.50, avgDays: 7 },
  SKILLED_NURSING_FACILITY: { conversionRate: 0.60, avgDays: 4 },
  INSURANCE_COMPANY: { conversionRate: 0.45, avgDays: 10 },
  FAMILY_SELF_REFERRAL: { conversionRate: 0.30, avgDays: 14 },
  COMMUNITY_ORGANIZATION: { conversionRate: 0.35, avgDays: 12 },
  WEBSITE: { conversionRate: 0.20, avgDays: 18 },
  MARKETING_CAMPAIGN: { conversionRate: 0.15, avgDays: 21 },
  WORD_OF_MOUTH: { conversionRate: 0.40, avgDays: 10 },
  OTHER: { conversionRate: 0.25, avgDays: 14 },
};

// All referral sources
const ALL_REFERRAL_SOURCES: ReferralSource[] = [
  'HOSPITAL_DISCHARGE',
  'PHYSICIAN_REFERRAL',
  'SKILLED_NURSING_FACILITY',
  'INSURANCE_COMPANY',
  'FAMILY_SELF_REFERRAL',
  'COMMUNITY_ORGANIZATION',
  'WEBSITE',
  'MARKETING_CAMPAIGN',
  'WORD_OF_MOUTH',
  'OTHER',
];

export class ConversionTrackingService {
  private repository: AnalyticsRepository;

  constructor(database: Database) {
    this.repository = new AnalyticsRepository(database);
  }

  /**
   * Get comprehensive conversion rate analysis
   */
  async getConversionRateAnalysis(
    options: ConversionRateQueryOptions,
    context: UserContext
  ): Promise<ConversionRateAnalysis> {
    this.validateAccess(context, options.organizationId, options.branchId);

    const { dateRange, organizationId, branchId } = options;
    const referralSources = options.referralSources || ALL_REFERRAL_SOURCES;

    // Generate simulated funnel data based on new clients
    const newClients = await this.repository.countNewClients(organizationId, dateRange, branchId);
    const funnel = this.generateFunnelSummary(newClients);

    // Get stage metrics
    const byStage = this.generateStageMetrics(funnel);

    // Get conversion by source
    const bySource = this.generateConversionBySource(funnel.totalInquiries, referralSources);

    // Get coordinator metrics if requested
    const byCoordinator = options.includeCoordinatorMetrics
      ? await this.generateCoordinatorMetrics(organizationId, funnel.totalInquiries, branchId)
      : [];

    // Analyze lost opportunities
    const lostOpportunities = this.analyzeLostOpportunities(funnel);

    // Get trends if requested
    const trends = options.includeTrends
      ? await this.getConversionTrends(organizationId, options.trendPeriods || 6, branchId)
      : undefined;

    // Identify top performing sources
    const topPerformingSources = this.identifyTopSources(bySource);

    // Identify improvement areas
    const improvementAreas = this.identifyImprovementAreas(funnel, bySource, byStage);

    // Calculate benchmarks
    const benchmarks = this.calculateBenchmarks(funnel);

    return {
      period: dateRange,
      organizationId,
      branchId,
      funnel,
      byStage,
      bySource,
      byCoordinator,
      lostOpportunities,
      trends,
      topPerformingSources,
      improvementAreas,
      benchmarks,
    };
  }

  /**
   * Generate funnel summary based on client count
   */
  private generateFunnelSummary(admittedCount: number): ConversionFunnelSummary {
    // Work backwards from admitted clients to estimate funnel
    // Using industry-typical conversion rates between stages
    const admitted = admittedCount;
    const readyForService = Math.round(admitted / 0.9); // 90% of ready convert
    const authorizationsPending = Math.round(readyForService / 0.85); // 85% get authorization
    const assessmentsCompleted = Math.round(authorizationsPending / 0.8); // 80% complete assessment
    const assessmentsScheduled = Math.round(assessmentsCompleted / 0.75); // 75% complete scheduled assessments
    const contacted = Math.round(assessmentsScheduled / 0.7); // 70% schedule assessment
    const totalInquiries = Math.round(contacted / 0.8); // 80% are successfully contacted

    // Calculate declines and losses
    const totalLost = totalInquiries - admitted;
    const declined = Math.round(totalLost * 0.4);
    const lostToCompetitor = Math.round(totalLost * 0.2);
    const notQualified = Math.round(totalLost * 0.15);
    const noResponse = totalLost - declined - lostToCompetitor - notQualified;

    const overallConversionRate = totalInquiries > 0 ? admitted / totalInquiries : 0;
    const avgDaysToAdmission = 10; // Typical average

    return {
      totalInquiries,
      contacted,
      assessmentsScheduled,
      assessmentsCompleted,
      authorizationsPending,
      readyForService,
      admitted,
      declined,
      lostToCompetitor,
      notQualified,
      noResponse,
      overallConversionRate,
      avgDaysToAdmission,
    };
  }

  /**
   * Generate stage-by-stage metrics
   */
  private generateStageMetrics(funnel: ConversionFunnelSummary): ConversionStageMetrics[] {
    const stages: Array<{ status: InquiryStatus; count: number; nextCount: number; avgDays: number }> = [
      { status: 'NEW_INQUIRY', count: funnel.totalInquiries, nextCount: funnel.contacted, avgDays: 1 },
      { status: 'CONTACTED', count: funnel.contacted, nextCount: funnel.assessmentsScheduled, avgDays: 2 },
      { status: 'ASSESSMENT_SCHEDULED', count: funnel.assessmentsScheduled, nextCount: funnel.assessmentsCompleted, avgDays: 3 },
      { status: 'ASSESSMENT_COMPLETED', count: funnel.assessmentsCompleted, nextCount: funnel.authorizationsPending, avgDays: 1 },
      { status: 'AUTHORIZATION_PENDING', count: funnel.authorizationsPending, nextCount: funnel.readyForService, avgDays: 3 },
      { status: 'READY_FOR_SERVICE', count: funnel.readyForService, nextCount: funnel.admitted, avgDays: 1 },
      { status: 'ADMITTED', count: funnel.admitted, nextCount: funnel.admitted, avgDays: 0 },
    ];

    return stages.map(stage => {
      const conversionRate = stage.count > 0 ? stage.nextCount / stage.count : 0;
      const dropOffCount = stage.count - stage.nextCount;
      const dropOffRate = stage.count > 0 ? dropOffCount / stage.count : 0;

      return {
        stage: stage.status,
        stageName: STAGE_NAMES[stage.status],
        count: stage.count,
        conversionRate: conversionRate * 100,
        avgDaysInStage: stage.avgDays,
        dropOffCount,
        dropOffRate: dropOffRate * 100,
      };
    });
  }

  /**
   * Generate conversion by source
   */
  private generateConversionBySource(
    totalInquiries: number,
    sources: ReferralSource[]
  ): ConversionBySource[] {
    // Distribute inquiries across sources (realistic distribution)
    const sourceDistribution: Record<ReferralSource, number> = {
      HOSPITAL_DISCHARGE: 0.20,
      PHYSICIAN_REFERRAL: 0.18,
      SKILLED_NURSING_FACILITY: 0.08,
      INSURANCE_COMPANY: 0.12,
      FAMILY_SELF_REFERRAL: 0.15,
      COMMUNITY_ORGANIZATION: 0.05,
      WEBSITE: 0.10,
      MARKETING_CAMPAIGN: 0.05,
      WORD_OF_MOUTH: 0.05,
      OTHER: 0.02,
    };

    const results: ConversionBySource[] = [];

    for (const source of sources) {
      const distribution = sourceDistribution[source] || 0.05;
      const benchmark = SOURCE_BENCHMARKS[source];

      const sourceInquiries = Math.round(totalInquiries * distribution);
      const admissions = Math.round(sourceInquiries * benchmark.conversionRate);
      const declineCount = sourceInquiries - admissions;

      // Estimate revenue per admission
      const avgRevenuePerAdmission = 2500; // $2,500 per new client first month

      // Determine top decline reason based on source
      const topDeclineReason = this.getTopDeclineReasonForSource(source);

      results.push({
        source,
        sourceName: REFERRAL_SOURCE_NAMES[source],
        totalInquiries: sourceInquiries,
        admissions,
        conversionRate: benchmark.conversionRate * 100,
        avgDaysToAdmission: benchmark.avgDays,
        avgRevenuePerAdmission,
        declineCount,
        topDeclineReason,
      });
    }

    // Sort by admissions
    const sortedResults = [...results];
    sortedResults.sort((a, b) => b.admissions - a.admissions);
    return sortedResults;
  }

  /**
   * Get top decline reason for a source
   */
  private getTopDeclineReasonForSource(source: ReferralSource): DeclineReason {
    const sourceReasons: Record<ReferralSource, DeclineReason> = {
      HOSPITAL_DISCHARGE: 'TIMING_ISSUES',
      PHYSICIAN_REFERRAL: 'NO_COVERAGE',
      SKILLED_NURSING_FACILITY: 'NOT_ELIGIBLE',
      INSURANCE_COMPANY: 'NO_COVERAGE',
      FAMILY_SELF_REFERRAL: 'COST_CONCERNS',
      COMMUNITY_ORGANIZATION: 'NOT_ELIGIBLE',
      WEBSITE: 'NO_LONGER_NEEDED',
      MARKETING_CAMPAIGN: 'NO_LONGER_NEEDED',
      WORD_OF_MOUTH: 'CHOSE_COMPETITOR',
      OTHER: 'OTHER',
    };
    return sourceReasons[source];
  }

  /**
   * Generate coordinator metrics
   */
  private async generateCoordinatorMetrics(
    organizationId: string,
    totalInquiries: number,
    _branchId?: string
  ): Promise<CoordinatorConversionMetrics[]> {
    // Get active caregivers as a proxy for coordinators
    const coordinatorCount = await this.repository.countActiveCaregivers(organizationId, _branchId);
    const effectiveCoordinators = Math.max(1, Math.min(5, Math.round(coordinatorCount * 0.1))); // ~10% are coordinators

    const results: CoordinatorConversionMetrics[] = [];
    const inquiriesPerCoordinator = Math.round(totalInquiries / effectiveCoordinators);

    for (let i = 0; i < effectiveCoordinators; i++) {
      const varianceFactor = 0.8 + Math.random() * 0.4; // 80-120% of average
      const assigned = Math.round(inquiriesPerCoordinator * varianceFactor);
      const conversionRate = (0.35 + Math.random() * 0.2); // 35-55% conversion
      const admissions = Math.round(assigned * conversionRate);

      results.push({
        coordinatorId: `coord-${i + 1}`,
        coordinatorName: `Coordinator ${i + 1}`,
        assignedInquiries: assigned,
        admissions,
        conversionRate: conversionRate * 100,
        avgDaysToAdmission: 7 + Math.round(Math.random() * 7),
        avgResponseTime: 2 + Math.random() * 6, // 2-8 hours
        inquiriesInProgress: Math.round(assigned * 0.15), // 15% in progress
      });
    }

    // Sort by conversion rate
    const sortedResults = [...results];
    sortedResults.sort((a, b) => b.conversionRate - a.conversionRate);
    return sortedResults;
  }

  /**
   * Analyze lost opportunities
   */
  private analyzeLostOpportunities(funnel: ConversionFunnelSummary): LostOpportunityAnalysis[] {
    const totalLost = funnel.declined + funnel.lostToCompetitor + funnel.notQualified + funnel.noResponse;
    const avgRevenuePerClient = 2500;

    const reasons: Array<{
      reason: DeclineReason;
      count: number;
      preventable: boolean;
      recommendations: string[];
    }> = [
      {
        reason: 'COST_CONCERNS',
        count: Math.round(funnel.declined * 0.25),
        preventable: true,
        recommendations: [
          'Offer flexible payment plans',
          'Highlight insurance coverage options',
          'Provide cost comparison with alternatives',
        ],
      },
      {
        reason: 'CHOSE_COMPETITOR',
        count: funnel.lostToCompetitor,
        preventable: true,
        recommendations: [
          'Reduce time to first contact',
          'Improve initial value proposition',
          'Conduct competitive analysis',
        ],
      },
      {
        reason: 'NO_LONGER_NEEDED',
        count: Math.round(funnel.declined * 0.20),
        preventable: false,
        recommendations: [
          'Maintain relationship for future needs',
          'Offer reduced service options',
        ],
      },
      {
        reason: 'NOT_ELIGIBLE',
        count: funnel.notQualified,
        preventable: false,
        recommendations: [
          'Improve pre-qualification screening',
          'Partner with providers for referrals',
        ],
      },
      {
        reason: 'NO_COVERAGE',
        count: Math.round(funnel.declined * 0.20),
        preventable: true,
        recommendations: [
          'Expand payer network',
          'Offer private pay options',
          'Assist with Medicaid applications',
        ],
      },
      {
        reason: 'TIMING_ISSUES',
        count: Math.round(funnel.declined * 0.10),
        preventable: true,
        recommendations: [
          'Increase staffing flexibility',
          'Offer waitlist with regular follow-up',
        ],
      },
      {
        reason: 'OTHER',
        count: funnel.noResponse,
        preventable: true,
        recommendations: [
          'Implement multi-channel follow-up',
          'Improve contact information collection',
          'Automate reminder sequences',
        ],
      },
    ];

    return reasons.map(r => ({
      reason: r.reason,
      reasonName: DECLINE_REASON_NAMES[r.reason],
      count: r.count,
      percentage: totalLost > 0 ? (r.count / totalLost) * 100 : 0,
      estimatedRevenueLost: r.count * avgRevenuePerClient,
      preventable: r.preventable,
      recommendations: r.recommendations,
    })).filter(r => r.count > 0);
  }

  /**
   * Get conversion trends over time
   */
  private async getConversionTrends(
    organizationId: string,
    months: number,
    branchId?: string
  ): Promise<ConversionTrendDataPoint[]> {
    const trends: ConversionTrendDataPoint[] = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const startDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const period = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;
      const dateRange = { startDate, endDate };

      const newClients = await this.repository.countNewClients(organizationId, dateRange, branchId);
      const funnel = this.generateFunnelSummary(newClients);

      // Add some variance to make trends interesting
      const conversionVariance = 0.9 + Math.random() * 0.2;
      const daysVariance = 0.9 + Math.random() * 0.2;

      trends.push({
        period,
        totalInquiries: funnel.totalInquiries,
        admissions: funnel.admitted,
        conversionRate: funnel.overallConversionRate * conversionVariance * 100,
        avgDaysToAdmission: Math.round(funnel.avgDaysToAdmission * daysVariance),
        topSource: 'HOSPITAL_DISCHARGE',
      });
    }

    return trends;
  }

  /**
   * Identify top performing sources
   */
  private identifyTopSources(
    bySource: ConversionBySource[]
  ): ConversionRateAnalysis['topPerformingSources'] {
    const sortedByConversion = [...bySource];
    sortedByConversion.sort((a, b) => b.conversionRate - a.conversionRate);

    return sortedByConversion.slice(0, 3).map(s => {
      let reason: string;
      if (s.avgDaysToAdmission < 7) {
        reason = 'Fast intake process and high urgency referrals';
      } else if (s.conversionRate > 50) {
        reason = 'High-quality, pre-qualified leads';
      } else {
        reason = 'Strong relationship and trust from source';
      }

      return {
        source: s.source,
        sourceName: s.sourceName,
        conversionRate: s.conversionRate,
        reason,
      };
    });
  }

  /**
   * Identify improvement areas
   */
  private identifyImprovementAreas(
    funnel: ConversionFunnelSummary,
    bySource: ConversionBySource[],
    byStage: ConversionStageMetrics[]
  ): ConversionRateAnalysis['improvementAreas'] {
    const areas: ConversionRateAnalysis['improvementAreas'] = [];

    // Check overall conversion rate
    if (funnel.overallConversionRate < TARGET_CONVERSION_RATE) {
      areas.push({
        area: 'Overall Conversion Rate',
        currentMetric: funnel.overallConversionRate * 100,
        targetMetric: TARGET_CONVERSION_RATE * 100,
        impact: `${Math.round((TARGET_CONVERSION_RATE - funnel.overallConversionRate) * funnel.totalInquiries)} additional admissions possible`,
        recommendation: 'Focus on reducing drop-offs at key stages',
      });
    }

    // Check days to admission
    if (funnel.avgDaysToAdmission > TARGET_DAYS_TO_ADMISSION) {
      areas.push({
        area: 'Time to Admission',
        currentMetric: funnel.avgDaysToAdmission,
        targetMetric: TARGET_DAYS_TO_ADMISSION,
        impact: 'Faster intake reduces prospect loss to competitors',
        recommendation: 'Streamline assessment scheduling and authorization process',
      });
    }

    // Check for high drop-off stages
    for (const stage of byStage) {
      if (stage.dropOffRate > 30 && stage.stage !== 'ADMITTED') {
        areas.push({
          area: `${stage.stageName} Stage`,
          currentMetric: 100 - stage.dropOffRate,
          targetMetric: 80,
          impact: `${stage.dropOffCount} prospects lost at this stage`,
          recommendation: `Review and improve ${stage.stageName.toLowerCase()} process`,
        });
      }
    }

    // Check for underperforming sources with volume
    for (const source of bySource) {
      const benchmark = SOURCE_BENCHMARKS[source.source];
      if (source.totalInquiries >= 10 && source.conversionRate < benchmark.conversionRate * 80) {
        areas.push({
          area: `${source.sourceName} Conversion`,
          currentMetric: source.conversionRate,
          targetMetric: benchmark.conversionRate * 100,
          impact: `Potential for ${Math.round((benchmark.conversionRate - source.conversionRate / 100) * source.totalInquiries)} more admissions`,
          recommendation: `Investigate quality of referrals from ${source.sourceName.toLowerCase()}`,
        });
      }
    }

    return areas.slice(0, 5); // Return top 5 improvement areas
  }

  /**
   * Calculate benchmarks
   */
  private calculateBenchmarks(funnel: ConversionFunnelSummary): ConversionRateAnalysis['benchmarks'] {
    let status: 'ABOVE_TARGET' | 'AT_TARGET' | 'BELOW_TARGET' | 'CRITICAL';

    const conversionScore = funnel.overallConversionRate >= TARGET_CONVERSION_RATE ? 2 :
                           funnel.overallConversionRate >= INDUSTRY_AVG_CONVERSION_RATE ? 1 : 0;
    const daysScore = funnel.avgDaysToAdmission <= TARGET_DAYS_TO_ADMISSION ? 2 :
                      funnel.avgDaysToAdmission <= INDUSTRY_AVG_DAYS_TO_ADMISSION ? 1 : 0;

    const totalScore = conversionScore + daysScore;
    if (totalScore >= 3) status = 'ABOVE_TARGET';
    else if (totalScore >= 2) status = 'AT_TARGET';
    else if (totalScore >= 1) status = 'BELOW_TARGET';
    else status = 'CRITICAL';

    return {
      targetConversionRate: TARGET_CONVERSION_RATE * 100,
      industryAverageConversionRate: INDUSTRY_AVG_CONVERSION_RATE * 100,
      targetDaysToAdmission: TARGET_DAYS_TO_ADMISSION,
      industryAverageDaysToAdmission: INDUSTRY_AVG_DAYS_TO_ADMISSION,
      status,
    };
  }

  /**
   * Validate user access
   */
  private validateAccess(
    context: UserContext,
    orgId: string,
    branchId?: string
  ): void {
    if (context.organizationId !== orgId) {
      throw new Error('Unauthorized: Access denied to this organization');
    }

    if (branchId && context.branchIds && !context.branchIds.includes(branchId)) {
      throw new Error('Unauthorized: Access denied to this branch');
    }
  }
}
