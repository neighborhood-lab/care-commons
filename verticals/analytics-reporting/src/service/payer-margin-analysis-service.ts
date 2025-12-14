/**
 * Payer Margin Analysis Service
 *
 * Provides comprehensive profitability analysis by payer source,
 * enabling organizations to understand and optimize payer mix.
 */

import { Database, UserContext } from '@folkcare/core';
import { AnalyticsRepository } from '../repository/analytics-repository.js';
import {
  DateRange,
  PayerType,
  PayerMarginMetrics,
  PayerTrendDataPoint,
  PayerContractInfo,
  PayerComparison,
  PayerOptimizationOpportunity,
  PayerMarginAnalysis,
  PayerMarginAnalysisQueryOptions,
} from '../types/analytics.js';

// Industry benchmarks
const INDUSTRY_AVG_COLLECTION_RATE = 0.92; // 92%
const TARGET_COLLECTION_RATE = 0.95; // 95%
const INDUSTRY_AVG_DENIAL_RATE = 0.08; // 8%
const TARGET_DENIAL_RATE = 0.05; // 5%
const INDUSTRY_AVG_DAYS_IN_AR = 45;
const TARGET_DAYS_IN_AR = 30;

// Payer type characteristics (for estimation)
const PAYER_CHARACTERISTICS: Record<PayerType, {
  avgReimbursementRate: number;
  avgDaysInAR: number;
  avgDenialRate: number;
  billingComplexity: number;
}> = {
  MEDICARE: { avgReimbursementRate: 55, avgDaysInAR: 35, avgDenialRate: 0.06, billingComplexity: 1.2 },
  MEDICAID: { avgReimbursementRate: 45, avgDaysInAR: 50, avgDenialRate: 0.10, billingComplexity: 1.3 },
  PRIVATE_INSURANCE: { avgReimbursementRate: 65, avgDaysInAR: 40, avgDenialRate: 0.07, billingComplexity: 1.1 },
  PRIVATE_PAY: { avgReimbursementRate: 75, avgDaysInAR: 25, avgDenialRate: 0.02, billingComplexity: 1.0 },
  VA: { avgReimbursementRate: 58, avgDaysInAR: 45, avgDenialRate: 0.05, billingComplexity: 1.2 },
  WORKERS_COMP: { avgReimbursementRate: 70, avgDaysInAR: 55, avgDenialRate: 0.08, billingComplexity: 1.4 },
  MANAGED_CARE: { avgReimbursementRate: 52, avgDaysInAR: 38, avgDenialRate: 0.09, billingComplexity: 1.2 },
  OTHER: { avgReimbursementRate: 50, avgDaysInAR: 45, avgDenialRate: 0.08, billingComplexity: 1.1 },
};

export class PayerMarginAnalysisService {
  private repository: AnalyticsRepository;

  constructor(database: Database) {
    this.repository = new AnalyticsRepository(database);
  }

  /**
   * Get comprehensive payer margin analysis
   */
  async getPayerMarginAnalysis(
    options: PayerMarginAnalysisQueryOptions,
    context: UserContext
  ): Promise<PayerMarginAnalysis> {
    this.validateAccess(context, options.organizationId, options.branchId);

    const { dateRange, organizationId, branchId } = options;

    // Get metrics for each payer
    const byPayer = await this.getPayerMetrics(
      organizationId,
      dateRange,
      branchId,
      options.payerIds,
      options.payerTypes,
      options.minVisitThreshold
    );

    // Calculate summary
    const summary = this.calculateSummary(byPayer);

    // Generate payer rankings
    const payerRankings = this.generatePayerRankings(byPayer, summary);

    // Get trends if requested
    const trends = options.includeTrends
      ? await this.getPayerTrends(organizationId, options.trendPeriods || 6, branchId)
      : undefined;

    // Get contract info if requested
    const contracts = options.includeContracts
      ? this.generateContractInfo(byPayer)
      : undefined;

    // Identify top and underperforming payers
    const topPerformingPayers = this.identifyTopPerformers(byPayer);
    const underperformingPayers = this.identifyUnderperformers(byPayer);

    // Generate optimization opportunities
    const optimizationOpportunities = this.generateOptimizationOpportunities(byPayer, summary);

    // Calculate benchmark status
    const benchmarks = this.calculateBenchmarks(summary);

    return {
      period: dateRange,
      organizationId,
      branchId,
      summary,
      byPayer,
      payerRankings,
      trends,
      contracts,
      topPerformingPayers,
      underperformingPayers,
      optimizationOpportunities,
      benchmarks,
    };
  }

  /**
   * Get metrics for each payer
   */
  private async getPayerMetrics(
    organizationId: string,
    dateRange: DateRange,
    branchId: string | undefined,
    payerIds: string[] | undefined,
    payerTypes: PayerType[] | undefined,
    minVisitThreshold: number | undefined
  ): Promise<PayerMarginMetrics[]> {
    // Get revenue by payer from repository
    const revenueByPayer = await this.repository.getRevenueByPayer(organizationId, dateRange, branchId);

    // Get total clients for distribution
    const totalClients = await this.repository.countActiveClients(organizationId, branchId);

    const results: PayerMarginMetrics[] = [];
    const baseHourlyRate = 18;

    for (const payer of revenueByPayer) {
      // Determine payer type
      const payerType = this.classifyPayerType(payer.payerName);

      // Filter by payer IDs if specified
      if (payerIds && !payerIds.includes(payer.payerId)) {
        continue;
      }

      // Filter by payer types if specified
      if (payerTypes && !payerTypes.includes(payerType)) {
        continue;
      }

      // Filter by minimum visit threshold
      if (minVisitThreshold && payer.visitCount < minVisitThreshold) {
        continue;
      }

      const characteristics = PAYER_CHARACTERISTICS[payerType];

      // Estimate metrics based on payer characteristics
      const totalVisits = payer.visitCount;
      const hoursPerVisit = 2.5; // Average visit duration
      const payerHours = totalVisits * hoursPerVisit;
      const uniqueClients = Math.round(totalClients * (totalVisits / (revenueByPayer.reduce((sum, p) => sum + p.visitCount, 0) || 1)));

      // Revenue metrics
      const grossCharges = payer.billedAmount * 1.2; // Charges before contractual adjustments
      const contractualAdjustments = grossCharges - payer.billedAmount;
      const billedAmount = payer.billedAmount;
      const paidAmount = payer.paidAmount;
      const writeOffs = billedAmount * 0.02; // Estimate 2% write-offs
      const patientResponsibility = billedAmount * 0.05; // Estimate 5% patient responsibility
      const outstandingAR = payer.outstandingAmount;

      // Collection metrics
      const collectionRate = billedAmount > 0 ? paidAmount / billedAmount : 0;
      const daysInAR = characteristics.avgDaysInAR;
      const cleanClaimRate = 1 - characteristics.avgDenialRate - 0.03; // Clean claims = not denied, not requiring corrections

      // Denial metrics
      const denialRate = characteristics.avgDenialRate;
      const denialCount = Math.round(totalVisits * denialRate);
      const denialAmount = billedAmount * denialRate;
      const appealRate = 0.6; // 60% of denials appealed
      const appealSuccessRate = 0.4; // 40% of appeals successful
      const resubmissionCount = Math.round(denialCount * appealRate);

      // Cost metrics
      const directLaborCost = payerHours * baseHourlyRate;
      const indirectCost = directLaborCost * 0.15;
      const billingAdminCost = billedAmount * 0.05 * characteristics.billingComplexity; // 5% billing admin adjusted for complexity
      const totalCost = directLaborCost + indirectCost + billingAdminCost;

      // Margin calculations
      const grossMargin = paidAmount - totalCost;
      const grossMarginPercentage = paidAmount > 0 ? (grossMargin / paidAmount) * 100 : 0;
      const netMargin = paidAmount - totalCost - writeOffs;
      const netMarginPercentage = paidAmount > 0 ? (netMargin / paidAmount) * 100 : 0;

      // Efficiency metrics
      const revenuePerHour = payerHours > 0 ? paidAmount / payerHours : 0;
      const costPerHour = payerHours > 0 ? totalCost / payerHours : 0;
      const marginPerHour = payerHours > 0 ? grossMargin / payerHours : 0;
      const averageReimbursementRate = totalVisits > 0 ? paidAmount / totalVisits : 0;
      const reimbursementVariance = averageReimbursementRate - characteristics.avgReimbursementRate;

      results.push({
        payerId: payer.payerId,
        payerName: payer.payerName,
        payerType,
        totalVisits,
        totalHours: payerHours,
        uniqueClients,
        grossCharges,
        contractualAdjustments,
        billedAmount,
        paidAmount,
        writeOffs,
        patientResponsibility,
        outstandingAR,
        collectionRate,
        daysInAR,
        cleanClaimRate,
        denialCount,
        denialAmount,
        denialRate,
        appealRate,
        appealSuccessRate,
        resubmissionCount,
        directLaborCost,
        indirectCost,
        billingAdminCost,
        totalCost,
        grossMargin,
        grossMarginPercentage,
        netMargin,
        netMarginPercentage,
        revenuePerHour,
        costPerHour,
        marginPerHour,
        averageReimbursementRate,
        reimbursementVariance,
      });
    }

    // Sort by paid amount descending
    const sortedResults = [...results];
    sortedResults.sort((a, b) => b.paidAmount - a.paidAmount);
    return sortedResults;
  }

  /**
   * Classify payer type from name
   */
  private classifyPayerType(payerName: string): PayerType {
    const nameLower = payerName.toLowerCase();

    if (nameLower.includes('medicare')) return 'MEDICARE';
    if (nameLower.includes('medicaid')) return 'MEDICAID';
    if (nameLower.includes('va') || nameLower.includes('veteran')) return 'VA';
    if (nameLower.includes('workers') || nameLower.includes('comp')) return 'WORKERS_COMP';
    if (nameLower.includes('managed') || nameLower.includes('hmo') || nameLower.includes('ppo')) return 'MANAGED_CARE';
    if (nameLower.includes('private pay') || nameLower.includes('self-pay') || nameLower.includes('selfpay')) return 'PRIVATE_PAY';
    if (nameLower.includes('insurance') || nameLower.includes('blue') || nameLower.includes('aetna') ||
        nameLower.includes('cigna') || nameLower.includes('united') || nameLower.includes('humana')) return 'PRIVATE_INSURANCE';

    return 'OTHER';
  }

  /**
   * Calculate summary metrics
   */
  private calculateSummary(byPayer: PayerMarginMetrics[]): PayerMarginAnalysis['summary'] {
    const totalBilledAmount = byPayer.reduce((sum, p) => sum + p.billedAmount, 0);
    const totalPaidAmount = byPayer.reduce((sum, p) => sum + p.paidAmount, 0);
    const totalOutstandingAR = byPayer.reduce((sum, p) => sum + p.outstandingAR, 0);
    const totalCost = byPayer.reduce((sum, p) => sum + p.totalCost, 0);
    const totalVisits = byPayer.reduce((sum, p) => sum + p.totalVisits, 0);
    const totalHours = byPayer.reduce((sum, p) => sum + p.totalHours, 0);
    const totalDenials = byPayer.reduce((sum, p) => sum + p.denialCount, 0);

    const overallCollectionRate = totalBilledAmount > 0 ? totalPaidAmount / totalBilledAmount : 0;
    const overallMargin = totalPaidAmount - totalCost;
    const overallMarginPercentage = totalPaidAmount > 0 ? (overallMargin / totalPaidAmount) * 100 : 0;

    // Weighted average days in AR
    const weightedDaysInAR = byPayer.reduce((sum, p) => sum + (p.daysInAR * p.outstandingAR), 0);
    const averageDaysInAR = totalOutstandingAR > 0 ? weightedDaysInAR / totalOutstandingAR : 0;

    const overallDenialRate = totalVisits > 0 ? totalDenials / totalVisits : 0;

    return {
      totalBilledAmount,
      totalPaidAmount,
      totalOutstandingAR,
      overallCollectionRate,
      overallMargin,
      overallMarginPercentage,
      averageDaysInAR,
      overallDenialRate,
      totalPayerCount: byPayer.length,
      totalVisits,
      totalHours,
    };
  }

  /**
   * Generate payer rankings
   */
  private generatePayerRankings(
    byPayer: PayerMarginMetrics[],
    summary: PayerMarginAnalysis['summary']
  ): PayerComparison[] {
    const rankings: PayerComparison[] = byPayer.map(p => {
      // Calculate performance score (0-100)
      // Weight: Margin (40%), Collection Rate (25%), Denial Rate (20%), Days in AR (15%)
      const marginScore = Math.min(100, Math.max(0, (p.grossMarginPercentage / 40) * 100)); // 40% margin = 100 score
      const collectionScore = Math.min(100, (p.collectionRate / TARGET_COLLECTION_RATE) * 100);
      const denialScore = Math.min(100, ((TARGET_DENIAL_RATE * 2 - p.denialRate) / TARGET_DENIAL_RATE) * 50);
      const arScore = Math.min(100, ((TARGET_DAYS_IN_AR * 2 - p.daysInAR) / TARGET_DAYS_IN_AR) * 50);

      const performanceScore = (marginScore * 0.4) + (collectionScore * 0.25) + (denialScore * 0.2) + (arScore * 0.15);

      const volumePercentage = summary.totalVisits > 0 ? (p.totalVisits / summary.totalVisits) * 100 : 0;
      const revenuePercentage = summary.totalPaidAmount > 0 ? (p.paidAmount / summary.totalPaidAmount) * 100 : 0;

      return {
        payerId: p.payerId,
        payerName: p.payerName,
        payerType: p.payerType,
        marginPercentage: p.grossMarginPercentage,
        collectionRate: p.collectionRate,
        denialRate: p.denialRate,
        daysInAR: p.daysInAR,
        volumePercentage,
        revenuePercentage,
        performanceScore,
        rank: 0, // Will be set after sorting
      };
    });

    // Sort by performance score and assign ranks
    const sortedRankings = [...rankings];
    sortedRankings.sort((a, b) => b.performanceScore - a.performanceScore);
    sortedRankings.forEach((r, index) => {
      r.rank = index + 1;
    });

    return sortedRankings;
  }

  /**
   * Get payer trends over time
   */
  private async getPayerTrends(
    organizationId: string,
    months: number,
    branchId?: string
  ): Promise<PayerTrendDataPoint[]> {
    const trends: PayerTrendDataPoint[] = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const startDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const period = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;
      const dateRange = { startDate, endDate };

      const revenueByPayer = await this.repository.getRevenueByPayer(organizationId, dateRange, branchId);

      for (const payer of revenueByPayer) {
        const payerType = this.classifyPayerType(payer.payerName);
        const characteristics = PAYER_CHARACTERISTICS[payerType];
        const denialRate = characteristics.avgDenialRate;

        const collectionRate = payer.billedAmount > 0 ? payer.paidAmount / payer.billedAmount : 0;
        const cost = payer.visitCount * 45; // Estimate cost per visit
        const margin = payer.paidAmount - cost;
        const marginPercentage = payer.paidAmount > 0 ? (margin / payer.paidAmount) * 100 : 0;

        trends.push({
          period,
          payerId: payer.payerId,
          payerName: payer.payerName,
          billedAmount: payer.billedAmount,
          paidAmount: payer.paidAmount,
          margin,
          marginPercentage,
          collectionRate,
          denialRate,
        });
      }
    }

    return trends;
  }

  /**
   * Generate contract information
   */
  private generateContractInfo(byPayer: PayerMarginMetrics[]): PayerContractInfo[] {
    const now = new Date();
    return byPayer.map(p => {
      // Simulate contract dates based on payer type
      const contractLengthMonths = p.payerType === 'MEDICARE' || p.payerType === 'MEDICAID' ? 12 : 24;
      const randomOffset = Math.floor(Math.random() * 12); // Random month offset
      const contractEnd = new Date(now.getFullYear(), now.getMonth() + contractLengthMonths - randomOffset, 1);
      const contractStart = new Date(contractEnd.getFullYear() - (contractLengthMonths / 12), contractEnd.getMonth(), 1);

      const daysTillExpiration = Math.round((contractEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const isRenegotiationDue = daysTillExpiration <= 90;

      return {
        payerId: p.payerId,
        payerName: p.payerName,
        contractStartDate: contractStart.toISOString().split('T')[0],
        contractEndDate: contractEnd.toISOString().split('T')[0],
        isRenegotiationDue,
        daysTillExpiration: Math.max(0, daysTillExpiration),
        lastRateIncrease: new Date(now.getFullYear() - 1, 0, 1).toISOString().split('T')[0],
        rateIncreasePercentage: 2.5, // 2.5% annual increase
      };
    });
  }

  /**
   * Identify top performing payers
   */
  private identifyTopPerformers(byPayer: PayerMarginMetrics[]): PayerMarginAnalysis['topPerformingPayers'] {
    const sortedByMargin = [...byPayer];
    sortedByMargin.sort((a, b) => b.grossMarginPercentage - a.grossMarginPercentage);

    return sortedByMargin.slice(0, 3).map(p => {
      let reason: string;
      if (p.collectionRate > TARGET_COLLECTION_RATE && p.denialRate < TARGET_DENIAL_RATE) {
        reason = 'High collection rate with low denials';
      } else if (p.averageReimbursementRate > 60) {
        reason = 'Above-average reimbursement rates';
      } else if (p.daysInAR < TARGET_DAYS_IN_AR) {
        reason = 'Fast payment turnaround';
      } else {
        reason = 'Strong overall margin performance';
      }

      return {
        payerId: p.payerId,
        payerName: p.payerName,
        marginPercentage: p.grossMarginPercentage,
        reason,
      };
    });
  }

  /**
   * Identify underperforming payers
   */
  private identifyUnderperformers(byPayer: PayerMarginMetrics[]): PayerMarginAnalysis['underperformingPayers'] {
    const sortedByMargin = [...byPayer];
    sortedByMargin.sort((a, b) => a.grossMarginPercentage - b.grossMarginPercentage);

    return sortedByMargin.slice(0, 3).map(p => {
      let primaryIssue: string;
      let recommendation: string;

      if (p.grossMarginPercentage < 0) {
        primaryIssue = 'Operating at a loss';
        recommendation = 'Consider renegotiating rates or discontinuing contract';
      } else if (p.denialRate > INDUSTRY_AVG_DENIAL_RATE * 1.5) {
        primaryIssue = 'High denial rate';
        recommendation = 'Review denial reasons and improve documentation/coding';
      } else if (p.collectionRate < INDUSTRY_AVG_COLLECTION_RATE * 0.9) {
        primaryIssue = 'Low collection rate';
        recommendation = 'Implement more aggressive follow-up on unpaid claims';
      } else if (p.daysInAR > INDUSTRY_AVG_DAYS_IN_AR * 1.5) {
        primaryIssue = 'Extended days in A/R';
        recommendation = 'Review payment terms and escalate aging claims';
      } else {
        primaryIssue = 'Below-target margin';
        recommendation = 'Analyze cost structure and consider rate renegotiation';
      }

      return {
        payerId: p.payerId,
        payerName: p.payerName,
        marginPercentage: p.grossMarginPercentage,
        primaryIssue,
        recommendation,
      };
    });
  }

  /**
   * Generate optimization opportunities
   */
  private generateOptimizationOpportunities(
    byPayer: PayerMarginMetrics[],
    _summary: PayerMarginAnalysis['summary']
  ): PayerOptimizationOpportunity[] {
    const opportunities: PayerOptimizationOpportunity[] = [];
    let priorityCounter = 1;

    for (const payer of byPayer) {
      // Rate increase opportunity
      if (payer.reimbursementVariance < -5) {
        const potentialIncrease = Math.abs(payer.reimbursementVariance) * payer.totalVisits;
        opportunities.push({
          payerId: payer.payerId,
          payerName: payer.payerName,
          opportunity: 'Negotiate rate increase',
          category: 'RATE_INCREASE',
          potentialImpact: potentialIncrease,
          effort: 'HIGH',
          priority: priorityCounter++,
          description: `Reimbursement is $${Math.abs(payer.reimbursementVariance).toFixed(2)} below benchmark per visit`,
          actionItems: [
            'Gather market rate data for similar services',
            'Document quality metrics and outcomes',
            'Schedule contract negotiation meeting',
            'Prepare rate increase proposal',
          ],
        });
      }

      // Denial reduction opportunity
      if (payer.denialRate > TARGET_DENIAL_RATE) {
        const potentialSavings = payer.denialAmount * 0.5; // Assume 50% can be recovered
        opportunities.push({
          payerId: payer.payerId,
          payerName: payer.payerName,
          opportunity: 'Reduce claim denials',
          category: 'DENIAL_REDUCTION',
          potentialImpact: potentialSavings,
          effort: 'MEDIUM',
          priority: priorityCounter++,
          description: `Denial rate of ${(payer.denialRate * 100).toFixed(1)}% exceeds target of ${(TARGET_DENIAL_RATE * 100).toFixed(1)}%`,
          actionItems: [
            'Analyze top denial reasons',
            'Implement pre-claim scrubbing',
            'Train staff on documentation requirements',
            'Establish denial appeal process',
          ],
        });
      }

      // Collection improvement opportunity
      if (payer.collectionRate < TARGET_COLLECTION_RATE) {
        const uncollected = payer.billedAmount - payer.paidAmount;
        const potentialCollection = uncollected * 0.3; // Assume 30% more can be collected
        opportunities.push({
          payerId: payer.payerId,
          payerName: payer.payerName,
          opportunity: 'Improve collection rate',
          category: 'COLLECTION_IMPROVEMENT',
          potentialImpact: potentialCollection,
          effort: 'MEDIUM',
          priority: priorityCounter++,
          description: `Collection rate of ${(payer.collectionRate * 100).toFixed(1)}% is below target of ${(TARGET_COLLECTION_RATE * 100).toFixed(1)}%`,
          actionItems: [
            'Implement automated claim follow-up',
            'Review and clean up claim submission errors',
            'Escalate aged claims to collections',
            'Verify patient eligibility before service',
          ],
        });
      }
    }

    // Sort by potential impact
    const sortedOpportunities = [...opportunities];
    sortedOpportunities.sort((a, b) => b.potentialImpact - a.potentialImpact);

    // Re-assign priorities based on sorted order
    sortedOpportunities.forEach((opp, index) => {
      opp.priority = index + 1;
    });

    return sortedOpportunities.slice(0, 10); // Return top 10 opportunities
  }

  /**
   * Calculate benchmark status
   */
  private calculateBenchmarks(summary: PayerMarginAnalysis['summary']): PayerMarginAnalysis['benchmarks'] {
    // Determine overall status based on key metrics
    let score = 0;

    if (summary.overallCollectionRate >= TARGET_COLLECTION_RATE) score += 2;
    else if (summary.overallCollectionRate >= INDUSTRY_AVG_COLLECTION_RATE) score += 1;

    if (summary.overallDenialRate <= TARGET_DENIAL_RATE) score += 2;
    else if (summary.overallDenialRate <= INDUSTRY_AVG_DENIAL_RATE) score += 1;

    if (summary.averageDaysInAR <= TARGET_DAYS_IN_AR) score += 2;
    else if (summary.averageDaysInAR <= INDUSTRY_AVG_DAYS_IN_AR) score += 1;

    let status: 'ABOVE_TARGET' | 'AT_TARGET' | 'BELOW_TARGET' | 'CRITICAL';
    if (score >= 5) status = 'ABOVE_TARGET';
    else if (score >= 3) status = 'AT_TARGET';
    else if (score >= 1) status = 'BELOW_TARGET';
    else status = 'CRITICAL';

    return {
      targetCollectionRate: TARGET_COLLECTION_RATE,
      industryAverageCollectionRate: INDUSTRY_AVG_COLLECTION_RATE,
      targetDenialRate: TARGET_DENIAL_RATE,
      industryAverageDenialRate: INDUSTRY_AVG_DENIAL_RATE,
      targetDaysInAR: TARGET_DAYS_IN_AR,
      industryAverageDaysInAR: INDUSTRY_AVG_DAYS_IN_AR,
      status,
    };
  }

  /**
   * Compare payers by type
   */
  async getPayerTypeComparison(
    organizationId: string,
    dateRange: DateRange,
    context: UserContext
  ): Promise<Array<{
    payerType: PayerType;
    payerCount: number;
    totalRevenue: number;
    averageMarginPercentage: number;
    averageCollectionRate: number;
    averageDenialRate: number;
  }>> {
    this.validateAccess(context, organizationId);

    const byPayer = await this.getPayerMetrics(organizationId, dateRange, undefined, undefined, undefined, undefined);

    // Group by payer type
    const byType = new Map<PayerType, PayerMarginMetrics[]>();
    for (const payer of byPayer) {
      const existing = byType.get(payer.payerType) || [];
      existing.push(payer);
      byType.set(payer.payerType, existing);
    }

    const results: Array<{
      payerType: PayerType;
      payerCount: number;
      totalRevenue: number;
      averageMarginPercentage: number;
      averageCollectionRate: number;
      averageDenialRate: number;
    }> = [];

    for (const [payerType, payers] of byType) {
      const totalRevenue = payers.reduce((sum, p) => sum + p.paidAmount, 0);
      const avgMargin = payers.reduce((sum, p) => sum + p.grossMarginPercentage, 0) / payers.length;
      const avgCollection = payers.reduce((sum, p) => sum + p.collectionRate, 0) / payers.length;
      const avgDenial = payers.reduce((sum, p) => sum + p.denialRate, 0) / payers.length;

      results.push({
        payerType,
        payerCount: payers.length,
        totalRevenue,
        averageMarginPercentage: avgMargin,
        averageCollectionRate: avgCollection,
        averageDenialRate: avgDenial,
      });
    }

    // Sort by total revenue
    const sortedResults = [...results];
    sortedResults.sort((a, b) => b.totalRevenue - a.totalRevenue);
    return sortedResults;
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
