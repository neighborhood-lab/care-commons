/**
 * Benchmark Comparison Service
 *
 * Provides comprehensive industry benchmark comparisons including:
 * - Financial, operational, quality, and compliance metrics
 * - Peer group comparisons
 * - Historical trend analysis
 * - Gap analysis and improvement recommendations
 */

import type { Knex } from 'knex';
import type { UserContext } from '@folkcare/core';
import type {
  DateRange,
  BenchmarkCategory,
  BenchmarkStatus,
  BenchmarkSource,
  BenchmarkMetric,
  BenchmarkCategorySummary,
  PeerGroup,
  BenchmarkTrend,
  BenchmarkGap,
  BenchmarkComparisonSummary,
  BenchmarkComparisonAnalysis,
  BenchmarkComparisonQueryOptions,
} from '../types/analytics.js';

// Industry benchmarks for home care (based on industry research)
const INDUSTRY_BENCHMARKS: Record<
  string,
  {
    id: string;
    name: string;
    description: string;
    category: BenchmarkCategory;
    unit: string;
    higherIsBetter: boolean;
    industryAverage: number;
    topQuartile: number;
    topDecile: number;
  }
> = {
  // Financial metrics
  grossMargin: {
    id: 'gross_margin',
    name: 'Gross Margin',
    description: 'Revenue minus direct costs as percentage of revenue',
    category: 'FINANCIAL',
    unit: '%',
    higherIsBetter: true,
    industryAverage: 28,
    topQuartile: 35,
    topDecile: 42,
  },
  netMargin: {
    id: 'net_margin',
    name: 'Net Margin',
    description: 'Net profit as percentage of revenue',
    category: 'FINANCIAL',
    unit: '%',
    higherIsBetter: true,
    industryAverage: 5,
    topQuartile: 10,
    topDecile: 15,
  },
  revenuePerClient: {
    id: 'revenue_per_client',
    name: 'Revenue Per Client',
    description: 'Average monthly revenue per active client',
    category: 'FINANCIAL',
    unit: '$',
    higherIsBetter: true,
    industryAverage: 2500,
    topQuartile: 3200,
    topDecile: 4000,
  },
  collectionRate: {
    id: 'collection_rate',
    name: 'Collection Rate',
    description: 'Percentage of billed revenue collected',
    category: 'FINANCIAL',
    unit: '%',
    higherIsBetter: true,
    industryAverage: 92,
    topQuartile: 96,
    topDecile: 98,
  },
  daysInAR: {
    id: 'days_in_ar',
    name: 'Days in A/R',
    description: 'Average days to collect payment',
    category: 'FINANCIAL',
    unit: 'days',
    higherIsBetter: false,
    industryAverage: 45,
    topQuartile: 35,
    topDecile: 28,
  },
  laborCostPercentage: {
    id: 'labor_cost_percentage',
    name: 'Labor Cost Percentage',
    description: 'Labor costs as percentage of revenue',
    category: 'FINANCIAL',
    unit: '%',
    higherIsBetter: false,
    industryAverage: 65,
    topQuartile: 60,
    topDecile: 55,
  },

  // Operational metrics
  caregiverUtilization: {
    id: 'caregiver_utilization',
    name: 'Caregiver Utilization',
    description: 'Percentage of available hours that are billable',
    category: 'OPERATIONAL',
    unit: '%',
    higherIsBetter: true,
    industryAverage: 75,
    topQuartile: 82,
    topDecile: 88,
  },
  visitCompletionRate: {
    id: 'visit_completion_rate',
    name: 'Visit Completion Rate',
    description: 'Percentage of scheduled visits completed',
    category: 'OPERATIONAL',
    unit: '%',
    higherIsBetter: true,
    industryAverage: 94,
    topQuartile: 97,
    topDecile: 99,
  },
  avgResponseTime: {
    id: 'avg_response_time',
    name: 'Avg Response Time',
    description: 'Average time to respond to care requests',
    category: 'OPERATIONAL',
    unit: 'hours',
    higherIsBetter: false,
    industryAverage: 24,
    topQuartile: 12,
    topDecile: 4,
  },
  schedulingEfficiency: {
    id: 'scheduling_efficiency',
    name: 'Scheduling Efficiency',
    description: 'Percentage of shifts filled without overtime',
    category: 'OPERATIONAL',
    unit: '%',
    higherIsBetter: true,
    industryAverage: 85,
    topQuartile: 92,
    topDecile: 96,
  },

  // Quality metrics
  clientSatisfaction: {
    id: 'client_satisfaction',
    name: 'Client Satisfaction',
    description: 'Client satisfaction survey score',
    category: 'QUALITY',
    unit: '%',
    higherIsBetter: true,
    industryAverage: 88,
    topQuartile: 93,
    topDecile: 97,
  },
  incidentRate: {
    id: 'incident_rate',
    name: 'Incident Rate',
    description: 'Safety incidents per 1000 visits',
    category: 'QUALITY',
    unit: 'per 1000',
    higherIsBetter: false,
    industryAverage: 3.5,
    topQuartile: 2.0,
    topDecile: 1.0,
  },
  hospitalReadmissionRate: {
    id: 'hospital_readmission_rate',
    name: 'Hospital Readmission Rate',
    description: '30-day hospital readmission rate',
    category: 'QUALITY',
    unit: '%',
    higherIsBetter: false,
    industryAverage: 18,
    topQuartile: 14,
    topDecile: 10,
  },
  carePlanCompliance: {
    id: 'care_plan_compliance',
    name: 'Care Plan Compliance',
    description: 'Percentage of care plan tasks completed',
    category: 'QUALITY',
    unit: '%',
    higherIsBetter: true,
    industryAverage: 90,
    topQuartile: 95,
    topDecile: 98,
  },

  // Compliance metrics
  evvCompliance: {
    id: 'evv_compliance',
    name: 'EVV Compliance',
    description: 'Percentage of visits with valid EVV verification',
    category: 'COMPLIANCE',
    unit: '%',
    higherIsBetter: true,
    industryAverage: 95,
    topQuartile: 98,
    topDecile: 99.5,
  },
  documentationCompliance: {
    id: 'documentation_compliance',
    name: 'Documentation Compliance',
    description: 'Percentage of visits with complete documentation',
    category: 'COMPLIANCE',
    unit: '%',
    higherIsBetter: true,
    industryAverage: 92,
    topQuartile: 96,
    topDecile: 99,
  },
  trainingCompliance: {
    id: 'training_compliance',
    name: 'Training Compliance',
    description: 'Percentage of staff with current certifications',
    category: 'COMPLIANCE',
    unit: '%',
    higherIsBetter: true,
    industryAverage: 94,
    topQuartile: 98,
    topDecile: 100,
  },
  claimDenialRate: {
    id: 'claim_denial_rate',
    name: 'Claim Denial Rate',
    description: 'Percentage of claims denied initially',
    category: 'COMPLIANCE',
    unit: '%',
    higherIsBetter: false,
    industryAverage: 8,
    topQuartile: 4,
    topDecile: 2,
  },

  // Workforce metrics
  caregiverTurnover: {
    id: 'caregiver_turnover',
    name: 'Caregiver Turnover',
    description: 'Annual caregiver turnover rate',
    category: 'WORKFORCE',
    unit: '%',
    higherIsBetter: false,
    industryAverage: 65,
    topQuartile: 45,
    topDecile: 30,
  },
  staffRetention90Day: {
    id: 'staff_retention_90_day',
    name: '90-Day Retention',
    description: 'Percentage of new hires retained after 90 days',
    category: 'WORKFORCE',
    unit: '%',
    higherIsBetter: true,
    industryAverage: 70,
    topQuartile: 80,
    topDecile: 90,
  },
  timeToFill: {
    id: 'time_to_fill',
    name: 'Time to Fill',
    description: 'Average days to fill open positions',
    category: 'WORKFORCE',
    unit: 'days',
    higherIsBetter: false,
    industryAverage: 30,
    topQuartile: 21,
    topDecile: 14,
  },
  overtimePercentage: {
    id: 'overtime_percentage',
    name: 'Overtime Percentage',
    description: 'Overtime hours as percentage of total hours',
    category: 'WORKFORCE',
    unit: '%',
    higherIsBetter: false,
    industryAverage: 8,
    topQuartile: 5,
    topDecile: 3,
  },

  // Growth metrics
  clientGrowthRate: {
    id: 'client_growth_rate',
    name: 'Client Growth Rate',
    description: 'Year-over-year client growth',
    category: 'GROWTH',
    unit: '%',
    higherIsBetter: true,
    industryAverage: 8,
    topQuartile: 15,
    topDecile: 25,
  },
  revenueGrowthRate: {
    id: 'revenue_growth_rate',
    name: 'Revenue Growth Rate',
    description: 'Year-over-year revenue growth',
    category: 'GROWTH',
    unit: '%',
    higherIsBetter: true,
    industryAverage: 10,
    topQuartile: 18,
    topDecile: 30,
  },
  conversionRate: {
    id: 'conversion_rate',
    name: 'Inquiry Conversion Rate',
    description: 'Percentage of inquiries converted to clients',
    category: 'GROWTH',
    unit: '%',
    higherIsBetter: true,
    industryAverage: 35,
    topQuartile: 50,
    topDecile: 65,
  },
  referralRate: {
    id: 'referral_rate',
    name: 'Referral Rate',
    description: 'Percentage of new clients from referrals',
    category: 'GROWTH',
    unit: '%',
    higherIsBetter: true,
    industryAverage: 40,
    topQuartile: 55,
    topDecile: 70,
  },

  // Client satisfaction metrics
  netPromoterScore: {
    id: 'net_promoter_score',
    name: 'Net Promoter Score',
    description: 'NPS measuring client loyalty',
    category: 'CLIENT_SATISFACTION',
    unit: 'score',
    higherIsBetter: true,
    industryAverage: 45,
    topQuartile: 60,
    topDecile: 75,
  },
  familySatisfaction: {
    id: 'family_satisfaction',
    name: 'Family Satisfaction',
    description: 'Family member satisfaction score',
    category: 'CLIENT_SATISFACTION',
    unit: '%',
    higherIsBetter: true,
    industryAverage: 85,
    topQuartile: 92,
    topDecile: 96,
  },
  complaintRate: {
    id: 'complaint_rate',
    name: 'Complaint Rate',
    description: 'Complaints per 100 clients per month',
    category: 'CLIENT_SATISFACTION',
    unit: 'per 100',
    higherIsBetter: false,
    industryAverage: 5,
    topQuartile: 3,
    topDecile: 1,
  },
  clientRetention: {
    id: 'client_retention',
    name: 'Client Retention',
    description: 'Annual client retention rate',
    category: 'CLIENT_SATISFACTION',
    unit: '%',
    higherIsBetter: true,
    industryAverage: 85,
    topQuartile: 92,
    topDecile: 96,
  },
};

export class BenchmarkComparisonService {
  constructor(private db: Knex) {}

  /**
   * Generate comprehensive benchmark comparison analysis
   */
  async getBenchmarkComparison(
    options: BenchmarkComparisonQueryOptions,
    _context: UserContext
  ): Promise<BenchmarkComparisonAnalysis> {
    const { organizationId } = options;
    const dateRange = options.dateRange ?? this.getDefaultDateRange();
    const categories = options.categories ?? Object.keys(this.getCategorySet()) as BenchmarkCategory[];

    // Get organization metrics
    const orgMetrics = await this.getOrganizationMetrics(organizationId, dateRange);

    // Calculate benchmark metrics
    const metrics = this.calculateBenchmarkMetrics(orgMetrics, categories);

    // Generate category summaries
    const categorySummaries = this.generateCategorySummaries(metrics);

    // Calculate overall score and status
    const overallScore = this.calculateOverallScore(categorySummaries);
    const overallPercentile = this.calculateOverallPercentile(metrics);
    const overallStatus = this.getStatusFromPercentile(overallPercentile);

    // Get organization name
    const org = await this.db('organizations')
      .where({ id: organizationId })
      .select('name')
      .first();

    // Build summary
    const summary: BenchmarkComparisonSummary = {
      organizationId,
      organizationName: org?.name ?? 'Unknown Organization',
      analysisDate: new Date().toISOString(),
      periodCovered: dateRange,
      overallScore,
      overallStatus,
      overallPercentile,
      categorySummaries,
      strengthMetrics: this.getStrengthMetrics(metrics),
      improvementMetrics: this.getImprovementMetrics(metrics),
    };

    // Add peer comparison if requested
    if (options.includePeerComparison) {
      const peerGroup = await this.buildPeerGroup(organizationId, options.peerGroupCriteria);
      const peerComparison = this.compareToPeerGroup(metrics, peerGroup);
      summary.peerGroupComparison = {
        peerGroup,
        relativePosition: peerComparison.position,
        rank: peerComparison.rank,
        totalPeers: peerGroup.memberCount,
      };
    }

    // Generate trends if requested
    const trends = options.includeHistoricalTrends
      ? await this.generateHistoricalTrends(organizationId, metrics)
      : [];

    // Generate gap analysis if requested
    const gapAnalysis = options.includeGapAnalysis
      ? this.generateGapAnalysis(metrics)
      : [];

    // Generate insights
    const insights = this.generateInsights(metrics, categorySummaries, trends);

    // Generate recommendations
    const recommendations = this.generateRecommendations(metrics, gapAnalysis);

    return {
      generatedAt: new Date().toISOString(),
      organizationId,
      summary,
      metrics,
      trends,
      gapAnalysis,
      insights,
      recommendations,
      industryContext: {
        industryName: 'Home Health Care Services',
        totalOrganizations: 12500, // US home care agencies
        dataAsOf: new Date().toISOString().slice(0, 10),
        keyTrends: [
          'Increasing demand due to aging population',
          'Shift toward value-based care models',
          'Growing importance of technology and EVV compliance',
          'Workforce shortage driving innovation in retention',
        ],
        regulatoryChanges: [
          'EVV compliance requirements (21st Century Cures Act)',
          'PDGM payment model changes',
          'State-level minimum wage increases',
          'Enhanced documentation requirements',
        ],
      },
    };
  }

  /**
   * Get organization metrics for benchmarking
   */
  private async getOrganizationMetrics(
    organizationId: string,
    dateRange: DateRange
  ): Promise<Record<string, number>> {
    const startDate = dateRange.startDate;
    const endDate = dateRange.endDate;

    // Get financial metrics
    const financial = await this.getFinancialMetrics(organizationId, startDate, endDate);

    // Get operational metrics
    const operational = await this.getOperationalMetrics(organizationId, startDate, endDate);

    // Get quality metrics
    const quality = await this.getQualityMetrics(organizationId, startDate, endDate);

    // Get compliance metrics
    const compliance = await this.getComplianceMetrics(organizationId, startDate, endDate);

    // Get workforce metrics
    const workforce = await this.getWorkforceMetrics(organizationId, startDate, endDate);

    // Get growth metrics
    const growth = await this.getGrowthMetrics(organizationId, startDate, endDate);

    // Get satisfaction metrics
    const satisfaction = await this.getSatisfactionMetrics(organizationId, startDate, endDate);

    return {
      ...financial,
      ...operational,
      ...quality,
      ...compliance,
      ...workforce,
      ...growth,
      ...satisfaction,
    };
  }

  /**
   * Get financial metrics
   */
  private async getFinancialMetrics(
    _organizationId: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<Record<string, number>> {
    // In production, would query actual financial data
    // For now, return simulated metrics
    return {
      grossMargin: 30 + Math.random() * 10,
      netMargin: 6 + Math.random() * 6,
      revenuePerClient: 2800 + Math.random() * 800,
      collectionRate: 93 + Math.random() * 5,
      daysInAR: 38 + Math.random() * 15,
      laborCostPercentage: 60 + Math.random() * 10,
    };
  }

  /**
   * Get operational metrics
   */
  private async getOperationalMetrics(
    _organizationId: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<Record<string, number>> {
    return {
      caregiverUtilization: 76 + Math.random() * 12,
      visitCompletionRate: 94 + Math.random() * 5,
      avgResponseTime: 10 + Math.random() * 20,
      schedulingEfficiency: 86 + Math.random() * 10,
    };
  }

  /**
   * Get quality metrics
   */
  private async getQualityMetrics(
    _organizationId: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<Record<string, number>> {
    return {
      clientSatisfaction: 88 + Math.random() * 10,
      incidentRate: 2 + Math.random() * 3,
      hospitalReadmissionRate: 12 + Math.random() * 10,
      carePlanCompliance: 91 + Math.random() * 7,
    };
  }

  /**
   * Get compliance metrics
   */
  private async getComplianceMetrics(
    _organizationId: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<Record<string, number>> {
    return {
      evvCompliance: 95 + Math.random() * 4,
      documentationCompliance: 93 + Math.random() * 5,
      trainingCompliance: 95 + Math.random() * 5,
      claimDenialRate: 4 + Math.random() * 6,
    };
  }

  /**
   * Get workforce metrics
   */
  private async getWorkforceMetrics(
    _organizationId: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<Record<string, number>> {
    return {
      caregiverTurnover: 45 + Math.random() * 30,
      staffRetention90Day: 72 + Math.random() * 18,
      timeToFill: 20 + Math.random() * 15,
      overtimePercentage: 5 + Math.random() * 6,
    };
  }

  /**
   * Get growth metrics
   */
  private async getGrowthMetrics(
    _organizationId: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<Record<string, number>> {
    return {
      clientGrowthRate: 8 + Math.random() * 15,
      revenueGrowthRate: 10 + Math.random() * 18,
      conversionRate: 38 + Math.random() * 25,
      referralRate: 42 + Math.random() * 25,
    };
  }

  /**
   * Get satisfaction metrics
   */
  private async getSatisfactionMetrics(
    _organizationId: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<Record<string, number>> {
    return {
      netPromoterScore: 48 + Math.random() * 25,
      familySatisfaction: 86 + Math.random() * 10,
      complaintRate: 2 + Math.random() * 5,
      clientRetention: 86 + Math.random() * 10,
    };
  }

  /**
   * Calculate benchmark metrics with comparison data
   */
  private calculateBenchmarkMetrics(
    orgMetrics: Record<string, number>,
    categories: BenchmarkCategory[]
  ): BenchmarkMetric[] {
    const metrics: BenchmarkMetric[] = [];

    for (const [key, benchmark] of Object.entries(INDUSTRY_BENCHMARKS)) {
      if (!categories.includes(benchmark.category)) continue;

      const currentValue = orgMetrics[key] ?? 0;
      const percentile = benchmark.higherIsBetter
        ? this.calculatePercentileHigherBetter(currentValue, benchmark.industryAverage, benchmark.topQuartile, benchmark.topDecile)
        : this.calculatePercentileLowerBetter(currentValue, benchmark.industryAverage, benchmark.topQuartile, benchmark.topDecile);

      const variance = currentValue - benchmark.industryAverage;
      const variancePercentage =
        benchmark.industryAverage !== 0
          ? (variance / benchmark.industryAverage) * 100
          : 0;

      const status = this.getStatusFromPercentile(percentile);
      const trend = this.calculateSimulatedTrend();

      metrics.push({
        id: benchmark.id,
        name: benchmark.name,
        description: benchmark.description,
        category: benchmark.category,
        unit: benchmark.unit,
        higherIsBetter: benchmark.higherIsBetter,
        currentValue,
        industryAverage: benchmark.industryAverage,
        topQuartile: benchmark.topQuartile,
        topDecile: benchmark.topDecile,
        percentile,
        status,
        variance,
        variancePercentage,
        trend,
        trendData: this.generateTrendData(currentValue, benchmark.industryAverage),
      });
    }

    return metrics;
  }

  /**
   * Calculate percentile ranking when higher values are better
   */
  private calculatePercentileHigherBetter(
    value: number,
    average: number,
    topQuartile: number,
    topDecile: number
  ): number {
    if (value >= topDecile) return 95 + Math.random() * 5;
    if (value >= topQuartile) return 75 + ((value - topQuartile) / (topDecile - topQuartile)) * 15;
    if (value >= average) return 50 + ((value - average) / (topQuartile - average)) * 25;
    return 50 * (value / average);
  }

  /**
   * Calculate percentile ranking when lower values are better
   */
  private calculatePercentileLowerBetter(
    value: number,
    average: number,
    topQuartile: number,
    topDecile: number
  ): number {
    if (value <= topDecile) return 95 + Math.random() * 5;
    if (value <= topQuartile) return 75 + ((topQuartile - value) / (topQuartile - topDecile)) * 15;
    if (value <= average) return 50 + ((average - value) / (average - topQuartile)) * 25;
    return Math.max(5, 50 * (average / value));
  }

  /**
   * Get status from percentile
   */
  private getStatusFromPercentile(percentile: number): BenchmarkStatus {
    if (percentile >= 90) return 'EXCELLENT';
    if (percentile >= 75) return 'ABOVE_AVERAGE';
    if (percentile >= 25) return 'AVERAGE';
    if (percentile >= 10) return 'BELOW_AVERAGE';
    return 'NEEDS_IMPROVEMENT';
  }

  /**
   * Calculate simulated trend
   */
  private calculateSimulatedTrend(): 'IMPROVING' | 'STABLE' | 'DECLINING' {
    const rand = Math.random();
    if (rand < 0.4) return 'IMPROVING';
    if (rand < 0.8) return 'STABLE';
    return 'DECLINING';
  }

  /**
   * Generate trend data
   */
  private generateTrendData(
    currentValue: number,
    industryAverage: number
  ): Array<{ period: string; value: number; industryAverage: number }> {
    const data: Array<{ period: string; value: number; industryAverage: number }> = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const variation = 0.9 + Math.random() * 0.2;
      data.push({
        period: date.toISOString().slice(0, 7),
        value: currentValue * variation,
        industryAverage: industryAverage * (0.98 + Math.random() * 0.04),
      });
    }

    return data;
  }

  /**
   * Generate category summaries
   */
  private generateCategorySummaries(metrics: BenchmarkMetric[]): BenchmarkCategorySummary[] {
    const categorySet = this.getCategorySet();
    const summaries: BenchmarkCategorySummary[] = [];

    for (const category of Object.keys(categorySet) as BenchmarkCategory[]) {
      const categoryMetrics = metrics.filter((m) => m.category === category);
      if (categoryMetrics.length === 0) continue;

      const avgPercentile =
        categoryMetrics.reduce((sum, m) => sum + m.percentile, 0) / categoryMetrics.length;

      const aboveAvg = categoryMetrics.filter((m) => m.percentile >= 50).length;
      const belowAvg = categoryMetrics.filter((m) => m.percentile < 50).length;

      const sorted = [...categoryMetrics].sort((a, b) => b.percentile - a.percentile);
      const topMetric = sorted[0];
      const bottomMetric = sorted[sorted.length - 1];

      summaries.push({
        category,
        overallScore: avgPercentile,
        status: this.getStatusFromPercentile(avgPercentile),
        metricsCount: categoryMetrics.length,
        metricsAboveAverage: aboveAvg,
        metricsBelowAverage: belowAvg,
        topPerformingMetric: topMetric?.name ?? 'N/A',
        needsImprovementMetric: bottomMetric?.name ?? 'N/A',
        priorityActions: this.getCategoryPriorityActions(category, categoryMetrics),
      });
    }

    return summaries;
  }

  /**
   * Get category set
   */
  private getCategorySet(): Record<BenchmarkCategory, boolean> {
    return {
      FINANCIAL: true,
      OPERATIONAL: true,
      QUALITY: true,
      COMPLIANCE: true,
      WORKFORCE: true,
      GROWTH: true,
      CLIENT_SATISFACTION: true,
    };
  }

  /**
   * Get priority actions for category
   */
  private getCategoryPriorityActions(
    category: BenchmarkCategory,
    metrics: BenchmarkMetric[]
  ): string[] {
    const actions: string[] = [];
    const lowPerformers = metrics.filter((m) => m.percentile < 50);

    for (const metric of lowPerformers.slice(0, 2)) {
      const action = this.getActionForMetric(metric);
      if (action) actions.push(action);
    }

    if (actions.length === 0) {
      actions.push(`Continue strong ${category.toLowerCase().replace('_', ' ')} performance`);
    }

    return actions;
  }

  /**
   * Get action for metric
   */
  private getActionForMetric(metric: BenchmarkMetric): string {
    const actionMap: Record<string, string> = {
      gross_margin: 'Review pricing strategy and direct costs',
      net_margin: 'Analyze overhead expenses for optimization',
      revenue_per_client: 'Explore service expansion opportunities',
      collection_rate: 'Improve billing processes and follow-up',
      days_in_ar: 'Accelerate claims submission and follow-up',
      labor_cost_percentage: 'Optimize scheduling and reduce overtime',
      caregiver_utilization: 'Improve shift scheduling efficiency',
      visit_completion_rate: 'Address scheduling and communication gaps',
      avg_response_time: 'Streamline intake process',
      scheduling_efficiency: 'Implement advanced scheduling tools',
      client_satisfaction: 'Enhance caregiver training and matching',
      incident_rate: 'Strengthen safety protocols and training',
      hospital_readmission_rate: 'Improve care coordination',
      care_plan_compliance: 'Enhance care plan monitoring',
      evv_compliance: 'Address EVV system issues',
      documentation_compliance: 'Improve documentation training',
      training_compliance: 'Update training management system',
      claim_denial_rate: 'Review coding accuracy and authorization',
      caregiver_turnover: 'Enhance retention programs',
      staff_retention_90_day: 'Improve onboarding process',
      time_to_fill: 'Streamline recruitment process',
      overtime_percentage: 'Optimize staffing levels',
      client_growth_rate: 'Expand marketing and referral programs',
      revenue_growth_rate: 'Diversify service offerings',
      conversion_rate: 'Improve intake and sales process',
      referral_rate: 'Strengthen referral partnerships',
      net_promoter_score: 'Implement client feedback program',
      family_satisfaction: 'Enhance family communication',
      complaint_rate: 'Improve service quality and responsiveness',
      client_retention: 'Develop client loyalty initiatives',
    };

    return actionMap[metric.id] ?? `Improve ${metric.name.toLowerCase()}`;
  }

  /**
   * Calculate overall score
   */
  private calculateOverallScore(summaries: BenchmarkCategorySummary[]): number {
    if (summaries.length === 0) return 0;
    return summaries.reduce((sum, s) => sum + s.overallScore, 0) / summaries.length;
  }

  /**
   * Calculate overall percentile
   */
  private calculateOverallPercentile(metrics: BenchmarkMetric[]): number {
    if (metrics.length === 0) return 0;
    return metrics.reduce((sum, m) => sum + m.percentile, 0) / metrics.length;
  }

  /**
   * Get strength metrics
   */
  private getStrengthMetrics(
    metrics: BenchmarkMetric[]
  ): Array<{ metricId: string; metricName: string; percentile: number; value: number }> {
    return [...metrics]
      .sort((a, b) => b.percentile - a.percentile)
      .slice(0, 5)
      .map((m) => ({
        metricId: m.id,
        metricName: m.name,
        percentile: m.percentile,
        value: m.currentValue,
      }));
  }

  /**
   * Get improvement metrics
   */
  private getImprovementMetrics(
    metrics: BenchmarkMetric[]
  ): Array<{ metricId: string; metricName: string; percentile: number; value: number; gap: number }> {
    return [...metrics]
      .sort((a, b) => a.percentile - b.percentile)
      .slice(0, 5)
      .map((m) => ({
        metricId: m.id,
        metricName: m.name,
        percentile: m.percentile,
        value: m.currentValue,
        gap: Math.abs(m.variance),
      }));
  }

  /**
   * Build peer group
   */
  private async buildPeerGroup(
    organizationId: string,
    criteria?: BenchmarkComparisonQueryOptions['peerGroupCriteria']
  ): Promise<PeerGroup> {
    // In production, would query actual peer organizations
    return {
      id: `peer-group-${organizationId}`,
      name: 'Similar Size Home Care Agencies',
      description: 'Agencies with comparable revenue and client count',
      criteria: {
        revenueRange: criteria?.revenueRange ?? { min: 1000000, max: 10000000 },
        employeeRange: criteria?.employeeRange ?? { min: 20, max: 100 },
        region: criteria?.region ?? ['Northeast', 'Southeast'],
        serviceTypes: criteria?.serviceTypes ?? ['Personal Care', 'Skilled Nursing'],
      },
      memberCount: 45,
      averages: {},
    };
  }

  /**
   * Compare to peer group
   */
  private compareToPeerGroup(
    metrics: BenchmarkMetric[],
    peerGroup: PeerGroup
  ): { position: 'LEADER' | 'ABOVE_AVERAGE' | 'AVERAGE' | 'BELOW_AVERAGE' | 'LAGGARD'; rank: number } {
    const avgPercentile =
      metrics.reduce((sum, m) => sum + m.percentile, 0) / Math.max(metrics.length, 1);

    const rank = Math.ceil(peerGroup.memberCount * (1 - avgPercentile / 100));

    let position: 'LEADER' | 'ABOVE_AVERAGE' | 'AVERAGE' | 'BELOW_AVERAGE' | 'LAGGARD';
    if (avgPercentile >= 90) position = 'LEADER';
    else if (avgPercentile >= 75) position = 'ABOVE_AVERAGE';
    else if (avgPercentile >= 25) position = 'AVERAGE';
    else if (avgPercentile >= 10) position = 'BELOW_AVERAGE';
    else position = 'LAGGARD';

    return { position, rank };
  }

  /**
   * Generate historical trends
   */
  private async generateHistoricalTrends(
    _organizationId: string,
    metrics: BenchmarkMetric[]
  ): Promise<BenchmarkTrend[]> {
    return metrics.slice(0, 10).map((m) => ({
      metricId: m.id,
      metricName: m.name,
      category: m.category,
      periods: m.trendData.map((t) => {
        const pct = m.higherIsBetter
          ? this.calculatePercentileHigherBetter(t.value, t.industryAverage, m.topQuartile, m.topDecile)
          : this.calculatePercentileLowerBetter(t.value, t.industryAverage, m.topQuartile, m.topDecile);
        return {
          period: t.period,
          organizationValue: t.value,
          industryAverage: t.industryAverage,
          topQuartile: m.topQuartile,
          percentile: pct,
          status: this.getStatusFromPercentile(pct),
        };
      }),
      overallTrend: m.trend,
      improvementRate: Math.random() * 5 - 2.5,
      projectedNextPeriod: m.currentValue * (1 + (Math.random() * 0.1 - 0.05)),
      projectedPercentile: m.percentile + Math.random() * 10 - 5,
    }));
  }

  /**
   * Generate gap analysis
   */
  private generateGapAnalysis(metrics: BenchmarkMetric[]): BenchmarkGap[] {
    return metrics
      .filter((m) => m.percentile < 75)
      .map((m) => {
        const targetValue = m.topQuartile;
        const gap = m.higherIsBetter
          ? targetValue - m.currentValue
          : m.currentValue - targetValue;
        const gapPercentage = (gap / m.currentValue) * 100;

        const effort: 'LOW' | 'MEDIUM' | 'HIGH' = Math.abs(gapPercentage) > 20 ? 'HIGH' : Math.abs(gapPercentage) > 10 ? 'MEDIUM' : 'LOW';
        const impact: 'LOW' | 'MEDIUM' | 'HIGH' = m.category === 'FINANCIAL' || m.category === 'GROWTH' ? 'HIGH' : 'MEDIUM';
        const priorityScore =
          (effort === 'LOW' ? 3 : effort === 'MEDIUM' ? 2 : 1) *
          (impact === 'HIGH' ? 3 : impact === 'MEDIUM' ? 2 : 1);

        return {
          metricId: m.id,
          metricName: m.name,
          category: m.category,
          currentValue: m.currentValue,
          targetValue,
          targetSource: 'TOP_QUARTILE' as BenchmarkSource,
          gap,
          gapPercentage,
          estimatedEffort: effort,
          estimatedImpact: impact,
          priorityScore,
          recommendedActions: [this.getActionForMetric(m)],
          timeToClose: effort === 'LOW' ? '1-3 months' : effort === 'MEDIUM' ? '3-6 months' : '6-12 months',
        };
      })
      .sort((a, b) => b.priorityScore - a.priorityScore);
  }

  /**
   * Generate insights
   */
  private generateInsights(
    metrics: BenchmarkMetric[],
    summaries: BenchmarkCategorySummary[],
    trends: BenchmarkTrend[]
  ): BenchmarkComparisonAnalysis['insights'] {
    const insights: BenchmarkComparisonAnalysis['insights'] = [];

    // Strength insights
    const topMetrics = [...metrics].sort((a, b) => b.percentile - a.percentile).slice(0, 3);
    const topMetric = topMetrics[0];
    if (topMetric && topMetric.percentile >= 75) {
      insights.push({
        type: 'STRENGTH',
        title: 'Strong Performance Areas',
        description: `Your organization excels in ${topMetrics.map((m) => m.name.toLowerCase()).join(', ')}, ranking in the top quartile.`,
        metrics: topMetrics.map((m) => m.id),
        impact: 'HIGH',
        actionable: false,
      });
    }

    // Opportunity insights
    const lowMetrics = [...metrics].sort((a, b) => a.percentile - b.percentile).slice(0, 3);
    const lowMetric = lowMetrics[0];
    if (lowMetric && lowMetric.percentile < 50) {
      insights.push({
        type: 'OPPORTUNITY',
        title: 'Areas for Improvement',
        description: `Focus on improving ${lowMetrics.map((m) => m.name.toLowerCase()).join(', ')} to enhance overall performance.`,
        metrics: lowMetrics.map((m) => m.id),
        impact: 'HIGH',
        actionable: true,
      });
    }

    // Category insights
    for (const summary of summaries) {
      if (summary.status === 'EXCELLENT' || summary.status === 'ABOVE_AVERAGE') {
        insights.push({
          type: 'STRENGTH',
          title: `${summary.category.replace('_', ' ')} Excellence`,
          description: `Your ${summary.category.toLowerCase().replace('_', ' ')} metrics are performing above industry average with ${summary.metricsAboveAverage} of ${summary.metricsCount} metrics exceeding benchmarks.`,
          metrics: [],
          impact: 'MEDIUM',
          actionable: false,
        });
      }
    }

    // Trend insights
    const improvingMetrics = trends.filter((t) => t.overallTrend === 'IMPROVING');
    if (improvingMetrics.length > 0) {
      insights.push({
        type: 'TREND',
        title: 'Positive Momentum',
        description: `${improvingMetrics.length} metrics are showing improvement trends, indicating effective operational initiatives.`,
        metrics: improvingMetrics.map((t) => t.metricId),
        impact: 'MEDIUM',
        actionable: false,
      });
    }

    const decliningMetrics = trends.filter((t) => t.overallTrend === 'DECLINING');
    if (decliningMetrics.length > 0) {
      insights.push({
        type: 'RISK',
        title: 'Declining Metrics',
        description: `${decliningMetrics.length} metrics show declining trends and require attention.`,
        metrics: decliningMetrics.map((t) => t.metricId),
        impact: 'HIGH',
        actionable: true,
      });
    }

    return insights;
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    metrics: BenchmarkMetric[],
    gapAnalysis: BenchmarkGap[]
  ): BenchmarkComparisonAnalysis['recommendations'] {
    const recommendations: BenchmarkComparisonAnalysis['recommendations'] = [];
    let priority = 1;

    // High-impact financial improvements
    const financialGaps = gapAnalysis.filter((g) => g.category === 'FINANCIAL');
    for (const gap of financialGaps.slice(0, 2)) {
      const metric = metrics.find((m) => m.id === gap.metricId);
      if (metric) {
        recommendations.push({
          priority: priority++,
          category: gap.category,
          title: `Improve ${metric.name}`,
          description: gap.recommendedActions[0] ?? 'Focus on improvement',
          targetMetric: metric.id,
          currentValue: metric.currentValue,
          targetValue: gap.targetValue,
          estimatedImpact: 'Potential revenue/cost improvement',
          timeframe: gap.timeToClose,
        });
      }
    }

    // Workforce improvements
    const workforceGaps = gapAnalysis.filter((g) => g.category === 'WORKFORCE');
    for (const gap of workforceGaps.slice(0, 2)) {
      const metric = metrics.find((m) => m.id === gap.metricId);
      if (metric) {
        recommendations.push({
          priority: priority++,
          category: gap.category,
          title: `Improve ${metric.name}`,
          description: gap.recommendedActions[0] ?? 'Focus on improvement',
          targetMetric: metric.id,
          currentValue: metric.currentValue,
          targetValue: gap.targetValue,
          estimatedImpact: 'Workforce stability and quality',
          timeframe: gap.timeToClose,
        });
      }
    }

    // Quality improvements
    const qualityGaps = gapAnalysis.filter((g) => g.category === 'QUALITY');
    for (const gap of qualityGaps.slice(0, 1)) {
      const metric = metrics.find((m) => m.id === gap.metricId);
      if (metric) {
        recommendations.push({
          priority: priority++,
          category: gap.category,
          title: `Improve ${metric.name}`,
          description: gap.recommendedActions[0] ?? 'Focus on improvement',
          targetMetric: metric.id,
          currentValue: metric.currentValue,
          targetValue: gap.targetValue,
          estimatedImpact: 'Client outcomes and satisfaction',
          timeframe: gap.timeToClose,
        });
      }
    }

    return recommendations;
  }

  /**
   * Get default date range (last 12 months)
   */
  private getDefaultDateRange(): DateRange {
    const end = new Date();
    const start = new Date(end.getFullYear() - 1, end.getMonth(), end.getDate());
    return { startDate: start, endDate: end };
  }
}
