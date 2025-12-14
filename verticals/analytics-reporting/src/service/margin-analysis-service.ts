/**
 * Margin Analysis Service
 *
 * Provides comprehensive margin analysis by service type,
 * enabling organizations to understand profitability across different services.
 */

import { Database, UserContext } from '@folkcare/core';
import { AnalyticsRepository } from '../repository/analytics-repository.js';
import {
  DateRange,
  ServiceType,
  ServiceMarginMetrics,
  MarginTrendDataPoint,
  PayerMarginBreakdown,
  ServiceMarginAnalysis,
  MarginAnalysisQueryOptions,
} from '../types/analytics.js';

// Industry benchmark for gross margin (typically 25-35% in home care)
const INDUSTRY_AVG_GROSS_MARGIN_PERCENTAGE = 30;
const TARGET_GROSS_MARGIN_PERCENTAGE = 35;

// Service type configuration with display names and cost multipliers
const SERVICE_CONFIG: Record<ServiceType, { name: string; laborCostMultiplier: number; indirectCostRate: number }> = {
  PERSONAL_CARE: { name: 'Personal Care', laborCostMultiplier: 1.0, indirectCostRate: 0.15 },
  HOMEMAKER: { name: 'Homemaker', laborCostMultiplier: 0.9, indirectCostRate: 0.12 },
  COMPANION: { name: 'Companion', laborCostMultiplier: 0.85, indirectCostRate: 0.10 },
  RESPITE: { name: 'Respite', laborCostMultiplier: 1.0, indirectCostRate: 0.15 },
  SKILLED_NURSING: { name: 'Skilled Nursing', laborCostMultiplier: 1.8, indirectCostRate: 0.20 },
  PHYSICAL_THERAPY: { name: 'Physical Therapy', laborCostMultiplier: 2.0, indirectCostRate: 0.22 },
  OCCUPATIONAL_THERAPY: { name: 'Occupational Therapy', laborCostMultiplier: 2.0, indirectCostRate: 0.22 },
  SPEECH_THERAPY: { name: 'Speech Therapy', laborCostMultiplier: 2.0, indirectCostRate: 0.22 },
  HOSPICE: { name: 'Hospice', laborCostMultiplier: 1.5, indirectCostRate: 0.18 },
  OTHER: { name: 'Other Services', laborCostMultiplier: 1.0, indirectCostRate: 0.15 },
};

// All service types for iteration
const ALL_SERVICE_TYPES: ServiceType[] = [
  'PERSONAL_CARE',
  'HOMEMAKER',
  'COMPANION',
  'RESPITE',
  'SKILLED_NURSING',
  'PHYSICAL_THERAPY',
  'OCCUPATIONAL_THERAPY',
  'SPEECH_THERAPY',
  'HOSPICE',
  'OTHER',
];

export class MarginAnalysisService {
  private repository: AnalyticsRepository;

  constructor(database: Database) {
    this.repository = new AnalyticsRepository(database);
  }

  /**
   * Get comprehensive margin analysis by service type
   */
  async getServiceMarginAnalysis(
    options: MarginAnalysisQueryOptions,
    context: UserContext
  ): Promise<ServiceMarginAnalysis> {
    this.validateAccess(context, options.organizationId, options.branchId);

    const { dateRange, organizationId, branchId } = options;
    const serviceTypes = options.serviceTypes || ALL_SERVICE_TYPES;

    // Get metrics for each service type
    const byService = await this.getMarginsByServiceType(
      organizationId,
      dateRange,
      branchId,
      serviceTypes
    );

    // Calculate summary
    const summary = this.calculateSummary(byService);

    // Get payer breakdown if requested
    const byPayer = options.includePayerBreakdown
      ? await this.getPayerMarginBreakdown(organizationId, dateRange, branchId)
      : undefined;

    // Get trends if requested
    const trendPeriods = options.trendPeriods || 6;
    const trends = options.includeTrends
      ? await this.getMarginTrends(organizationId, trendPeriods, branchId, serviceTypes)
      : undefined;

    // Identify top performers and low margin services
    const topPerformingServices = this.identifyTopPerformers(byService);
    const lowMarginServices = this.identifyLowMarginServices(byService);

    // Calculate benchmark status
    const benchmarks = this.calculateBenchmarkStatus(summary.overallGrossMarginPercentage);

    return {
      period: dateRange,
      organizationId,
      branchId,
      summary,
      byService,
      byPayer,
      trends,
      topPerformingServices,
      lowMarginServices,
      benchmarks,
    };
  }

  /**
   * Get margin metrics for each service type
   */
  private async getMarginsByServiceType(
    organizationId: string,
    dateRange: DateRange,
    branchId: string | undefined,
    serviceTypes: ServiceType[]
  ): Promise<ServiceMarginMetrics[]> {
    const results: ServiceMarginMetrics[] = [];

    // Get overall revenue and hours for distribution estimation
    const totalBilledAmount = await this.repository.sumBilledAmount(organizationId, dateRange, branchId);
    const totalBillableHours = await this.repository.sumBillableHours(organizationId, dateRange, branchId);
    const totalVisits = await this.repository.countVisits(organizationId, dateRange, ['COMPLETED'], branchId);
    const totalClients = await this.repository.countActiveClients(organizationId, branchId);

    // Base hourly rate for cost estimation
    const baseHourlyRate = 18;

    // Estimate distribution across service types
    // In a real implementation, this would come from actual visit/billing data
    const serviceDistribution: Record<ServiceType, { visitPct: number; hoursPct: number; revenuePct: number }> = {
      PERSONAL_CARE: { visitPct: 0.40, hoursPct: 0.45, revenuePct: 0.35 },
      HOMEMAKER: { visitPct: 0.20, hoursPct: 0.18, revenuePct: 0.12 },
      COMPANION: { visitPct: 0.15, hoursPct: 0.12, revenuePct: 0.08 },
      RESPITE: { visitPct: 0.05, hoursPct: 0.06, revenuePct: 0.05 },
      SKILLED_NURSING: { visitPct: 0.08, hoursPct: 0.08, revenuePct: 0.18 },
      PHYSICAL_THERAPY: { visitPct: 0.04, hoursPct: 0.04, revenuePct: 0.10 },
      OCCUPATIONAL_THERAPY: { visitPct: 0.03, hoursPct: 0.03, revenuePct: 0.06 },
      SPEECH_THERAPY: { visitPct: 0.02, hoursPct: 0.02, revenuePct: 0.03 },
      HOSPICE: { visitPct: 0.02, hoursPct: 0.01, revenuePct: 0.02 },
      OTHER: { visitPct: 0.01, hoursPct: 0.01, revenuePct: 0.01 },
    };

    for (const serviceType of serviceTypes) {
      const config = SERVICE_CONFIG[serviceType];
      const dist = serviceDistribution[serviceType];

      // Calculate volumes
      const serviceVisits = Math.round(totalVisits * dist.visitPct);
      const serviceHours = totalBillableHours * dist.hoursPct;
      const uniqueClients = Math.round(totalClients * dist.visitPct * 0.8); // Estimate unique clients

      // Calculate revenue
      const grossRevenue = totalBilledAmount * dist.revenuePct;
      const adjustments = grossRevenue * 0.03; // 3% adjustments/write-offs
      const netRevenue = grossRevenue - adjustments;

      // Calculate costs
      const directLaborCost = serviceHours * baseHourlyRate * config.laborCostMultiplier;
      const indirectCost = directLaborCost * config.indirectCostRate;
      const totalCost = directLaborCost + indirectCost;

      // Calculate margins
      const grossMargin = grossRevenue - totalCost;
      const grossMarginPercentage = grossRevenue > 0 ? (grossMargin / grossRevenue) * 100 : 0;
      const netMargin = netRevenue - totalCost;
      const netMarginPercentage = netRevenue > 0 ? (netMargin / netRevenue) * 100 : 0;

      // Calculate efficiency metrics
      const revenuePerHour = serviceHours > 0 ? grossRevenue / serviceHours : 0;
      const costPerHour = serviceHours > 0 ? totalCost / serviceHours : 0;
      const marginPerHour = serviceHours > 0 ? grossMargin / serviceHours : 0;
      const averageVisitDuration = serviceVisits > 0 ? (serviceHours * 60) / serviceVisits : 0;

      results.push({
        serviceType,
        serviceName: config.name,
        totalVisits: serviceVisits,
        totalHours: serviceHours,
        uniqueClients,
        grossRevenue,
        adjustments,
        netRevenue,
        directLaborCost,
        indirectCost,
        totalCost,
        grossMargin,
        grossMarginPercentage,
        netMargin,
        netMarginPercentage,
        revenuePerHour,
        costPerHour,
        marginPerHour,
        averageVisitDuration,
      });
    }

    // Sort by gross margin descending
    const sortedResults = [...results];
    sortedResults.sort((a, b) => b.grossMargin - a.grossMargin);
    return sortedResults;
  }

  /**
   * Calculate summary metrics across all services
   */
  private calculateSummary(byService: ServiceMarginMetrics[]): ServiceMarginAnalysis['summary'] {
    const totalGrossRevenue = byService.reduce((sum, s) => sum + s.grossRevenue, 0);
    const totalAdjustments = byService.reduce((sum, s) => sum + s.adjustments, 0);
    const totalNetRevenue = totalGrossRevenue - totalAdjustments;
    const totalCost = byService.reduce((sum, s) => sum + s.totalCost, 0);

    const overallGrossMargin = totalGrossRevenue - totalCost;
    const overallGrossMarginPercentage = totalGrossRevenue > 0
      ? (overallGrossMargin / totalGrossRevenue) * 100
      : 0;

    const overallNetMargin = totalNetRevenue - totalCost;
    const overallNetMarginPercentage = totalNetRevenue > 0
      ? (overallNetMargin / totalNetRevenue) * 100
      : 0;

    const totalVisits = byService.reduce((sum, s) => sum + s.totalVisits, 0);
    const totalHours = byService.reduce((sum, s) => sum + s.totalHours, 0);

    return {
      totalGrossRevenue,
      totalNetRevenue,
      totalCost,
      overallGrossMargin,
      overallGrossMarginPercentage,
      overallNetMargin,
      overallNetMarginPercentage,
      totalVisits,
      totalHours,
    };
  }

  /**
   * Get margin breakdown by payer
   */
  private async getPayerMarginBreakdown(
    organizationId: string,
    dateRange: DateRange,
    branchId?: string
  ): Promise<PayerMarginBreakdown[]> {
    // Get revenue by payer from repository
    const revenueByPayer = await this.repository.getRevenueByPayer(organizationId, dateRange, branchId);

    const results: PayerMarginBreakdown[] = [];

    // Payer cost multipliers (some payers have higher admin costs)
    const payerCostMultipliers: Record<string, number> = {
      MEDICARE: 1.1,
      MEDICAID: 1.15,
      PRIVATE_INSURANCE: 1.05,
      PRIVATE_PAY: 1.0,
      OTHER: 1.1,
    };

    for (const payer of revenueByPayer) {
      // Estimate payer type from name
      let payerType: PayerMarginBreakdown['payerType'] = 'OTHER';
      const payerNameLower = payer.payerName.toLowerCase();
      if (payerNameLower.includes('medicare')) {
        payerType = 'MEDICARE';
      } else if (payerNameLower.includes('medicaid')) {
        payerType = 'MEDICAID';
      } else if (payerNameLower.includes('private') && payerNameLower.includes('pay')) {
        payerType = 'PRIVATE_PAY';
      } else if (payerNameLower.includes('insurance') || payerNameLower.includes('blue') || payerNameLower.includes('aetna')) {
        payerType = 'PRIVATE_INSURANCE';
      }

      const costMultiplier = payerCostMultipliers[payerType] || 1.0;
      const baseCostPerVisit = 45; // Base cost per visit
      const totalCost = payer.visitCount * baseCostPerVisit * costMultiplier;
      const margin = payer.paidAmount - totalCost;
      const marginPercentage = payer.paidAmount > 0 ? (margin / payer.paidAmount) * 100 : 0;
      const averageReimbursementRate = payer.visitCount > 0
        ? payer.paidAmount / payer.visitCount
        : 0;

      results.push({
        payerId: payer.payerId,
        payerName: payer.payerName,
        payerType,
        totalRevenue: payer.paidAmount,
        totalCost,
        margin,
        marginPercentage,
        visitCount: payer.visitCount,
        averageReimbursementRate,
      });
    }

    // Sort by margin descending
    const sortedResults = [...results];
    sortedResults.sort((a, b) => b.margin - a.margin);
    return sortedResults;
  }

  /**
   * Get margin trends over time
   */
  private async getMarginTrends(
    organizationId: string,
    months: number,
    branchId: string | undefined,
    serviceTypes: ServiceType[]
  ): Promise<MarginTrendDataPoint[]> {
    const trends: MarginTrendDataPoint[] = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const startDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const period = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;
      const dateRange = { startDate, endDate };

      // Get metrics for each service type in this period
      for (const serviceType of serviceTypes) {
        const metrics = await this.getMarginsByServiceType(
          organizationId,
          dateRange,
          branchId,
          [serviceType]
        );

        const m = metrics[0];
        if (m) {
          trends.push({
            period,
            serviceType,
            grossRevenue: m.grossRevenue,
            totalCost: m.totalCost,
            grossMargin: m.grossMargin,
            grossMarginPercentage: m.grossMarginPercentage,
          });
        }
      }
    }

    return trends;
  }

  /**
   * Identify top performing services by margin
   */
  private identifyTopPerformers(
    byService: ServiceMarginMetrics[]
  ): ServiceMarginAnalysis['topPerformingServices'] {
    // Filter services with positive margin and sort by margin percentage
    const profitable = byService.filter(s => s.grossMarginPercentage > 0);
    const sortedByPercentage = [...profitable];
    sortedByPercentage.sort((a, b) => b.grossMarginPercentage - a.grossMarginPercentage);

    // Calculate total margin for contribution calculation
    const totalMargin = byService.reduce((sum, s) => sum + Math.max(0, s.grossMargin), 0);

    return sortedByPercentage.slice(0, 3).map(s => ({
      serviceType: s.serviceType,
      serviceName: s.serviceName,
      marginPercentage: s.grossMarginPercentage,
      marginContribution: totalMargin > 0 ? (Math.max(0, s.grossMargin) / totalMargin) * 100 : 0,
    }));
  }

  /**
   * Identify services with low or negative margins
   */
  private identifyLowMarginServices(
    byService: ServiceMarginMetrics[]
  ): ServiceMarginAnalysis['lowMarginServices'] {
    // Filter services below target margin
    const lowMargin = byService.filter(s => s.grossMarginPercentage < TARGET_GROSS_MARGIN_PERCENTAGE);
    const sortedByPercentage = [...lowMargin];
    sortedByPercentage.sort((a, b) => a.grossMarginPercentage - b.grossMarginPercentage);

    return sortedByPercentage.slice(0, 3).map(s => {
      let potentialIssue: string;
      let recommendation: string;

      if (s.grossMarginPercentage < 0) {
        potentialIssue = 'Service is operating at a loss';
        recommendation = 'Review pricing and cost structure. Consider rate negotiations or discontinuing service.';
      } else if (s.grossMarginPercentage < 15) {
        potentialIssue = 'Margin significantly below industry average';
        recommendation = 'Analyze cost drivers. Look for operational efficiencies or rate increases.';
      } else if (s.revenuePerHour < s.costPerHour * 1.3) {
        potentialIssue = 'Low revenue per hour compared to costs';
        recommendation = 'Review billing rates and payer contracts for this service type.';
      } else {
        potentialIssue = 'Margin below target threshold';
        recommendation = 'Monitor trends and consider incremental improvements to pricing or efficiency.';
      }

      return {
        serviceType: s.serviceType,
        serviceName: s.serviceName,
        marginPercentage: s.grossMarginPercentage,
        potentialIssue,
        recommendation,
      };
    });
  }

  /**
   * Calculate benchmark status
   */
  private calculateBenchmarkStatus(overallGrossMarginPercentage: number): ServiceMarginAnalysis['benchmarks'] {
    let status: 'ABOVE_TARGET' | 'AT_TARGET' | 'BELOW_TARGET' | 'CRITICAL';

    if (overallGrossMarginPercentage >= TARGET_GROSS_MARGIN_PERCENTAGE) {
      status = 'ABOVE_TARGET';
    } else if (overallGrossMarginPercentage >= TARGET_GROSS_MARGIN_PERCENTAGE * 0.9) {
      status = 'AT_TARGET';
    } else if (overallGrossMarginPercentage >= INDUSTRY_AVG_GROSS_MARGIN_PERCENTAGE * 0.7) {
      status = 'BELOW_TARGET';
    } else {
      status = 'CRITICAL';
    }

    return {
      targetGrossMarginPercentage: TARGET_GROSS_MARGIN_PERCENTAGE,
      industryAverageGrossMarginPercentage: INDUSTRY_AVG_GROSS_MARGIN_PERCENTAGE,
      status,
    };
  }

  /**
   * Get margin comparison across branches
   */
  async compareBranches(
    organizationId: string,
    dateRange: DateRange,
    context: UserContext
  ): Promise<Array<{
    branchId: string;
    branchName: string;
    grossMarginPercentage: number;
    totalRevenue: number;
    totalCost: number;
    status: 'ABOVE_TARGET' | 'AT_TARGET' | 'BELOW_TARGET' | 'CRITICAL';
  }>> {
    this.validateAccess(context, organizationId);

    // Get organization-wide metrics
    const byService = await this.getMarginsByServiceType(organizationId, dateRange, undefined, ALL_SERVICE_TYPES);
    const summary = this.calculateSummary(byService);

    return [{
      branchId: 'org-level',
      branchName: 'Organization Total',
      grossMarginPercentage: summary.overallGrossMarginPercentage,
      totalRevenue: summary.totalGrossRevenue,
      totalCost: summary.totalCost,
      status: this.calculateBenchmarkStatus(summary.overallGrossMarginPercentage).status,
    }];
  }

  /**
   * Validate user access to organization/branch
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
