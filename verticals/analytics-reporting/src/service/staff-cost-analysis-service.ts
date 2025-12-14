/**
 * Staff Cost Analysis Service
 *
 * Provides comprehensive analysis of labor costs as a percentage of revenue,
 * enabling organizations to understand and optimize their staffing expenses.
 */

import { Database, UserContext } from '@folkcare/core';
import { AnalyticsRepository } from '../repository/analytics-repository.js';
import {
  DateRange,
  StaffCategory,
  StaffCostByCategory,
  LaborCostMetrics,
  StaffCostTrendDataPoint,
  StaffCostAnalysis,
  StaffCostQueryOptions,
} from '../types/analytics.js';

// Industry benchmark for labor cost percentage (typically 60-70% in home care)
const INDUSTRY_AVG_LABOR_COST_PERCENTAGE = 65;
const TARGET_LABOR_COST_PERCENTAGE = 60;

// Staff category configuration
const STAFF_CATEGORIES: StaffCategory[] = [
  'CAREGIVER',
  'COORDINATOR',
  'ADMINISTRATOR',
  'NURSING',
  'THERAPIST',
  'OTHER',
];

export class StaffCostAnalysisService {
  private repository: AnalyticsRepository;

  constructor(database: Database) {
    this.repository = new AnalyticsRepository(database);
  }

  /**
   * Get comprehensive staff cost analysis
   */
  async getStaffCostAnalysis(
    options: StaffCostQueryOptions,
    context: UserContext
  ): Promise<StaffCostAnalysis> {
    this.validateAccess(context, options.organizationId, options.branchId);

    const { dateRange, organizationId, branchId } = options;

    // Get summary metrics
    const summary = await this.getLaborCostMetrics(organizationId, dateRange, branchId);

    // Get breakdown by category
    const categories = options.categories || STAFF_CATEGORIES;
    const byCategory = await this.getCostByCategory(
      organizationId,
      dateRange,
      branchId,
      categories
    );

    // Get trends if requested
    const trendPeriods = options.trendPeriods || 6;
    const trends = options.includeTrends !== false
      ? await this.getCostTrends(organizationId, trendPeriods, branchId)
      : [];

    // Calculate benchmark status
    const benchmarks = this.calculateBenchmarkStatus(summary.laborCostPercentage);

    // Identify top cost drivers
    const topCostDrivers = this.identifyCostDrivers(summary, byCategory);

    // Generate optimization opportunities
    const optimizationOpportunities = this.generateOptimizationOpportunities(
      summary,
      byCategory,
      benchmarks
    );

    return {
      period: dateRange,
      organizationId,
      branchId,
      summary,
      byCategory,
      trends,
      benchmarks,
      topCostDrivers,
      optimizationOpportunities,
    };
  }

  /**
   * Get labor cost metrics for a period
   */
  async getLaborCostMetrics(
    organizationId: string,
    dateRange: DateRange,
    branchId?: string
  ): Promise<LaborCostMetrics> {
    // Get revenue data
    const [billedAmount, paidAmount] = await Promise.all([
      this.repository.sumBilledAmount(organizationId, dateRange, branchId),
      this.repository.sumPaidAmount(organizationId, dateRange, branchId),
    ]);
    const totalRevenue = paidAmount || billedAmount; // Use paid if available, otherwise billed

    // Get billable hours for productive time calculation
    const billableHours = await this.repository.sumBillableHours(organizationId, dateRange, branchId);

    // Get overtime hours
    const overtimeHours = await this.repository.sumOvertimeHours(organizationId, dateRange, branchId);

    // Calculate labor costs (using estimates based on hours worked)
    // In a real implementation, this would come from payroll data
    const averageHourlyRate = 18; // Average caregiver rate
    const overtimeMultiplier = 1.5;
    const benefitsRate = 0.25; // 25% of wages for benefits

    const regularHours = billableHours - overtimeHours;
    const totalWages = regularHours * averageHourlyRate;
    const totalOvertime = overtimeHours * averageHourlyRate * overtimeMultiplier;
    const totalBenefits = (totalWages + totalOvertime) * benefitsRate;
    const totalLaborCost = totalWages + totalOvertime + totalBenefits;

    // Calculate labor cost percentage
    const laborCostPercentage = totalRevenue > 0
      ? (totalLaborCost / totalRevenue) * 100
      : 0;

    // Calculate cost per billable hour
    const costPerBillableHour = billableHours > 0
      ? totalLaborCost / billableHours
      : 0;

    // Estimate nonproductive hours (training, admin, travel)
    const nonproductiveRate = 0.15; // 15% of total hours
    const totalHours = billableHours / (1 - nonproductiveRate);
    const nonproductiveHours = totalHours - billableHours;

    return {
      totalWages,
      totalOvertime,
      totalBenefits,
      totalLaborCost,
      totalRevenue,
      laborCostPercentage,
      productiveHours: billableHours,
      nonproductiveHours,
      costPerBillableHour,
    };
  }

  /**
   * Get cost breakdown by staff category
   */
  private async getCostByCategory(
    organizationId: string,
    dateRange: DateRange,
    branchId: string | undefined,
    categories: StaffCategory[]
  ): Promise<StaffCostByCategory[]> {
    // Get active caregiver count
    const totalCaregivers = await this.repository.countActiveCaregivers(organizationId, branchId);
    const billableHours = await this.repository.sumBillableHours(organizationId, dateRange, branchId);
    const overtimeHours = await this.repository.sumOvertimeHours(organizationId, dateRange, branchId);

    // Estimate distribution across categories
    const categoryDistribution: Record<StaffCategory, { headcountPct: number; hoursPct: number; rate: number }> = {
      CAREGIVER: { headcountPct: 0.70, hoursPct: 0.80, rate: 16 },
      COORDINATOR: { headcountPct: 0.10, hoursPct: 0.08, rate: 22 },
      ADMINISTRATOR: { headcountPct: 0.08, hoursPct: 0.05, rate: 20 },
      NURSING: { headcountPct: 0.05, hoursPct: 0.04, rate: 35 },
      THERAPIST: { headcountPct: 0.04, hoursPct: 0.02, rate: 45 },
      OTHER: { headcountPct: 0.03, hoursPct: 0.01, rate: 15 },
    };

    const results: StaffCostByCategory[] = [];
    let totalLaborCost = 0;

    // First pass: calculate costs
    for (const category of categories) {
      const dist = categoryDistribution[category];
      const headcount = Math.round(totalCaregivers * dist.headcountPct);
      const hoursWorked = billableHours * dist.hoursPct;
      const categoryOvertimeHours = overtimeHours * dist.hoursPct;

      const regularWages = (hoursWorked - categoryOvertimeHours) * dist.rate;
      const overtimeWages = categoryOvertimeHours * dist.rate * 1.5;
      const totalWages = regularWages + overtimeWages;
      const benefitsCost = totalWages * 0.25;
      const totalCost = totalWages + benefitsCost;

      totalLaborCost += totalCost;

      results.push({
        category,
        headcount,
        totalWages,
        overtimeWages,
        benefitsCost,
        totalCost,
        costPercentage: 0, // Will calculate in second pass
        hoursWorked,
        averageHourlyRate: dist.rate,
      });
    }

    // Second pass: calculate percentages
    for (const result of results) {
      result.costPercentage = totalLaborCost > 0
        ? (result.totalCost / totalLaborCost) * 100
        : 0;
    }

    const sortedResults = [...results];
    sortedResults.sort((a, b) => b.totalCost - a.totalCost);
    return sortedResults;
  }

  /**
   * Get cost trends over time
   */
  async getCostTrends(
    organizationId: string,
    months: number,
    branchId?: string
  ): Promise<StaffCostTrendDataPoint[]> {
    const trends: StaffCostTrendDataPoint[] = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const startDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const period = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;

      const metrics = await this.getLaborCostMetrics(
        organizationId,
        { startDate, endDate },
        branchId
      );

      const headcount = await this.repository.countActiveCaregivers(organizationId, branchId);

      trends.push({
        period,
        totalLaborCost: metrics.totalLaborCost,
        totalRevenue: metrics.totalRevenue,
        laborCostPercentage: metrics.laborCostPercentage,
        headcount,
      });
    }

    return trends;
  }

  /**
   * Calculate benchmark status
   */
  private calculateBenchmarkStatus(laborCostPercentage: number): {
    targetLaborCostPercentage: number;
    industryAverageLaborCostPercentage: number;
    status: 'ABOVE_TARGET' | 'AT_TARGET' | 'BELOW_TARGET' | 'CRITICAL';
  } {
    let status: 'ABOVE_TARGET' | 'AT_TARGET' | 'BELOW_TARGET' | 'CRITICAL';

    if (laborCostPercentage <= TARGET_LABOR_COST_PERCENTAGE) {
      status = 'ABOVE_TARGET';
    } else if (laborCostPercentage <= TARGET_LABOR_COST_PERCENTAGE * 1.05) {
      status = 'AT_TARGET';
    } else if (laborCostPercentage <= INDUSTRY_AVG_LABOR_COST_PERCENTAGE) {
      status = 'BELOW_TARGET';
    } else {
      status = 'CRITICAL';
    }

    return {
      targetLaborCostPercentage: TARGET_LABOR_COST_PERCENTAGE,
      industryAverageLaborCostPercentage: INDUSTRY_AVG_LABOR_COST_PERCENTAGE,
      status,
    };
  }

  /**
   * Identify top cost drivers
   */
  private identifyCostDrivers(
    summary: LaborCostMetrics,
    byCategory: StaffCostByCategory[]
  ): Array<{ driver: string; impact: number; description: string }> {
    const drivers: Array<{ driver: string; impact: number; description: string }> = [];

    // Check overtime impact
    if (summary.totalOvertime > summary.totalWages * 0.1) {
      drivers.push({
        driver: 'Overtime',
        impact: summary.totalOvertime,
        description: `Overtime wages are ${((summary.totalOvertime / summary.totalWages) * 100).toFixed(1)}% of regular wages`,
      });
    }

    // Check benefits impact
    if (summary.totalBenefits > summary.totalWages * 0.3) {
      drivers.push({
        driver: 'Benefits',
        impact: summary.totalBenefits,
        description: 'Benefits costs are higher than industry average',
      });
    }

    // Check high-cost categories
    for (const category of byCategory.slice(0, 3)) {
      if (category.costPercentage > 20) {
        drivers.push({
          driver: `${category.category} wages`,
          impact: category.totalCost,
          description: `${category.category} staff accounts for ${category.costPercentage.toFixed(1)}% of total labor cost`,
        });
      }
    }

    // Check nonproductive time
    const nonproductiveCost = (summary.nonproductiveHours / summary.productiveHours) *
      (summary.totalWages + summary.totalOvertime);
    if (summary.nonproductiveHours > summary.productiveHours * 0.2) {
      drivers.push({
        driver: 'Nonproductive time',
        impact: nonproductiveCost,
        description: `${((summary.nonproductiveHours / (summary.productiveHours + summary.nonproductiveHours)) * 100).toFixed(1)}% of time is nonproductive`,
      });
    }

    const sortedDrivers = [...drivers];
    sortedDrivers.sort((a, b) => b.impact - a.impact);
    return sortedDrivers.slice(0, 5);
  }

  /**
   * Generate optimization opportunities
   */
  private generateOptimizationOpportunities(
    summary: LaborCostMetrics,
    byCategory: StaffCostByCategory[],
    benchmarks: { status: string }
  ): Array<{ opportunity: string; potentialSavings: number; effort: 'LOW' | 'MEDIUM' | 'HIGH'; description: string }> {
    const opportunities: Array<{
      opportunity: string;
      potentialSavings: number;
      effort: 'LOW' | 'MEDIUM' | 'HIGH';
      description: string;
    }> = [];

    // Overtime reduction
    if (summary.totalOvertime > summary.totalWages * 0.05) {
      const potentialSavings = summary.totalOvertime * 0.5; // Assume 50% can be reduced
      opportunities.push({
        opportunity: 'Reduce overtime hours',
        potentialSavings,
        effort: 'MEDIUM',
        description: 'Optimize scheduling to reduce overtime. Consider adding part-time staff for peak periods.',
      });
    }

    // Utilization improvement
    if (summary.nonproductiveHours > summary.productiveHours * 0.15) {
      const wasteCost = (summary.nonproductiveHours * 0.1) * (summary.totalLaborCost / (summary.productiveHours + summary.nonproductiveHours));
      opportunities.push({
        opportunity: 'Improve staff utilization',
        potentialSavings: wasteCost,
        effort: 'HIGH',
        description: 'Reduce travel time with better route optimization and cluster scheduling.',
      });
    }

    // Check if above benchmark
    if (benchmarks.status === 'CRITICAL' || benchmarks.status === 'BELOW_TARGET') {
      const targetCost = summary.totalRevenue * (TARGET_LABOR_COST_PERCENTAGE / 100);
      const currentOverTarget = summary.totalLaborCost - targetCost;
      if (currentOverTarget > 0) {
        opportunities.push({
          opportunity: 'Bring labor cost to target',
          potentialSavings: currentOverTarget,
          effort: 'HIGH',
          description: `Labor costs are ${((summary.laborCostPercentage - TARGET_LABOR_COST_PERCENTAGE)).toFixed(1)}% above target. Review staffing ratios and billing rates.`,
        });
      }
    }

    // Benefits optimization
    const benefitsRate = summary.totalBenefits / summary.totalWages;
    if (benefitsRate > 0.28) {
      const potentialSavings = summary.totalBenefits * 0.1;
      opportunities.push({
        opportunity: 'Review benefits package',
        potentialSavings,
        effort: 'HIGH',
        description: 'Benefits costs are above industry average. Consider plan alternatives or employee cost sharing.',
      });
    }

    // Skill mix optimization
    const caregiverCategory = byCategory.find(c => c.category === 'CAREGIVER');
    const nursingCategory = byCategory.find(c => c.category === 'NURSING');
    if (caregiverCategory && nursingCategory && nursingCategory.hoursWorked > caregiverCategory.hoursWorked * 0.1) {
      const potentialSavings = nursingCategory.hoursWorked * 0.2 * (nursingCategory.averageHourlyRate - (caregiverCategory?.averageHourlyRate || 16));
      if (potentialSavings > 0) {
        opportunities.push({
          opportunity: 'Optimize skill mix',
          potentialSavings,
          effort: 'MEDIUM',
          description: 'Review if some nursing tasks can be delegated to trained caregivers.',
        });
      }
    }

    const sortedOpportunities = [...opportunities];
    sortedOpportunities.sort((a, b) => b.potentialSavings - a.potentialSavings);
    return sortedOpportunities;
  }

  /**
   * Get labor cost percentage comparison across branches
   */
  async compareBranches(
    organizationId: string,
    dateRange: DateRange,
    context: UserContext
  ): Promise<Array<{
    branchId: string;
    branchName: string;
    laborCostPercentage: number;
    totalLaborCost: number;
    totalRevenue: number;
    status: 'ABOVE_TARGET' | 'AT_TARGET' | 'BELOW_TARGET' | 'CRITICAL';
  }>> {
    this.validateAccess(context, organizationId);

    // Get organization-wide metrics first
    const orgMetrics = await this.getLaborCostMetrics(organizationId, dateRange);

    // Return organization-level data as single "branch"
    return [{
      branchId: 'org-level',
      branchName: 'Organization Total',
      laborCostPercentage: orgMetrics.laborCostPercentage,
      totalLaborCost: orgMetrics.totalLaborCost,
      totalRevenue: orgMetrics.totalRevenue,
      status: this.calculateBenchmarkStatus(orgMetrics.laborCostPercentage).status,
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
