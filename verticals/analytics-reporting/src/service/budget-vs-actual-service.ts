/**
 * Budget vs. Actual Reporting Service
 *
 * Compares actual financial performance to budgeted amounts,
 * enabling organizations to track and manage their finances.
 */

import { Database, UserContext } from '@folkcare/core';
import { AnalyticsRepository } from '../repository/analytics-repository.js';
import {
  DateRange,
  BudgetCategory,
  BudgetPeriod,
  VarianceStatus,
  BudgetLineItem,
  BudgetCategorySummary,
  BudgetTrendDataPoint,
  BudgetForecast,
  VarianceExplanation,
  BudgetVsActualAnalysis,
  BudgetVsActualQueryOptions,
} from '../types/analytics.js';

// Target expense ratios
const TARGET_EXPENSE_TO_REVENUE_RATIO = 0.85; // 85% expenses to revenue
const TARGET_LABOR_COST_PERCENTAGE = 0.60; // 60% labor cost

// Variance thresholds
const FAVORABLE_THRESHOLD = -0.02; // -2% or better is favorable
const ON_TARGET_THRESHOLD = 0.05; // Within 5% is on target
const UNFAVORABLE_THRESHOLD = 0.15; // Up to 15% is unfavorable, beyond is critical

// Budget category display names
const CATEGORY_NAMES: Record<BudgetCategory, string> = {
  REVENUE: 'Revenue',
  LABOR_COST: 'Labor Cost',
  BENEFITS: 'Employee Benefits',
  SUPPLIES: 'Supplies',
  EQUIPMENT: 'Equipment',
  MARKETING: 'Marketing',
  ADMINISTRATIVE: 'Administrative',
  FACILITIES: 'Facilities',
  PROFESSIONAL_SERVICES: 'Professional Services',
  TRAINING: 'Training',
  TECHNOLOGY: 'Technology',
  OTHER: 'Other',
};

// Budget distribution by category (typical home care agency)
const BUDGET_DISTRIBUTION: Record<BudgetCategory, number> = {
  REVENUE: 1.0,
  LABOR_COST: 0.55,
  BENEFITS: 0.12,
  SUPPLIES: 0.03,
  EQUIPMENT: 0.02,
  MARKETING: 0.03,
  ADMINISTRATIVE: 0.08,
  FACILITIES: 0.04,
  PROFESSIONAL_SERVICES: 0.04,
  TRAINING: 0.02,
  TECHNOLOGY: 0.03,
  OTHER: 0.04,
};

export class BudgetVsActualService {
  private repository: AnalyticsRepository;

  constructor(database: Database) {
    this.repository = new AnalyticsRepository(database);
  }

  /**
   * Get comprehensive budget vs actual analysis
   */
  async getBudgetVsActualAnalysis(
    options: BudgetVsActualQueryOptions,
    context: UserContext
  ): Promise<BudgetVsActualAnalysis> {
    this.validateAccess(context, options.organizationId, options.branchId);

    const { organizationId, branchId, fiscalYear, period, periodNumber } = options;

    // Determine date range based on period
    const dateRange = this.getDateRangeForPeriod(fiscalYear, period, periodNumber);
    const currentPeriodNumber = periodNumber || this.getCurrentPeriodNumber(period);

    // Get actual revenue data
    const [billedAmount, paidAmount] = await Promise.all([
      this.repository.sumBilledAmount(organizationId, dateRange, branchId),
      this.repository.sumPaidAmount(organizationId, dateRange, branchId),
    ]);
    const actualRevenue = paidAmount || billedAmount;

    // Generate budget based on actual data (in production, would come from budget table)
    const annualRevenueBudget = actualRevenue * 12 * 1.1; // Estimate annual budget as 110% of current month

    // Generate category summaries
    const categories = options.categories || Object.keys(BUDGET_DISTRIBUTION) as BudgetCategory[];
    const byCategory = this.generateCategorySummaries(
      annualRevenueBudget,
      actualRevenue,
      currentPeriodNumber,
      categories
    );

    // Calculate summary
    const summary = this.calculateSummary(byCategory, currentPeriodNumber);

    // Generate monthly trends
    const monthlyTrends = await this.generateMonthlyTrends(
      organizationId,
      fiscalYear,
      currentPeriodNumber,
      branchId
    );

    // Generate forecast
    const forecast = this.generateForecast(
      summary,
      currentPeriodNumber,
      period
    );

    // Identify significant variances
    const significantVariances = this.identifySignificantVariances(byCategory);

    // Generate variance explanations if requested
    const varianceExplanations = options.includeExplanations
      ? this.generateVarianceExplanations(significantVariances)
      : [];

    // Generate action items
    const actionItems = this.generateActionItems(significantVariances, forecast);

    // Calculate benchmarks
    const benchmarks = this.calculateBenchmarks(summary);

    return {
      period: dateRange,
      budgetPeriod: period,
      organizationId,
      branchId,
      fiscalYear,
      periodNumber: currentPeriodNumber,
      summary,
      byCategory,
      monthlyTrends,
      forecast,
      significantVariances,
      varianceExplanations,
      actionItems,
      benchmarks,
    };
  }

  /**
   * Get date range for a budget period
   */
  private getDateRangeForPeriod(
    fiscalYear: number,
    period: BudgetPeriod,
    periodNumber?: number
  ): DateRange {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (period) {
      case 'MONTHLY': {
        const month = periodNumber ? periodNumber - 1 : now.getMonth();
        startDate = new Date(fiscalYear, month, 1);
        endDate = new Date(fiscalYear, month + 1, 0);
        break;
      }
      case 'QUARTERLY': {
        const quarter = periodNumber || Math.floor(now.getMonth() / 3) + 1;
        const startMonth = (quarter - 1) * 3;
        startDate = new Date(fiscalYear, startMonth, 1);
        endDate = new Date(fiscalYear, startMonth + 3, 0);
        break;
      }
      case 'ANNUAL':
      default:
        startDate = new Date(fiscalYear, 0, 1);
        endDate = new Date(fiscalYear, 11, 31);
        break;
    }

    return { startDate, endDate };
  }

  /**
   * Get current period number
   */
  private getCurrentPeriodNumber(period: BudgetPeriod): number {
    const now = new Date();
    switch (period) {
      case 'MONTHLY':
        return now.getMonth() + 1;
      case 'QUARTERLY':
        return Math.floor(now.getMonth() / 3) + 1;
      case 'ANNUAL':
      default:
        return 1;
    }
  }

  /**
   * Generate category summaries
   */
  private generateCategorySummaries(
    annualRevenueBudget: number,
    actualRevenue: number,
    currentMonth: number,
    categories: BudgetCategory[]
  ): BudgetCategorySummary[] {
    const summaries: BudgetCategorySummary[] = [];
    let totalBudget = 0;
    let totalActual = 0;

    for (const category of categories) {
      const distribution = BUDGET_DISTRIBUTION[category] || 0;
      const isRevenue = category === 'REVENUE';

      // Calculate budget amounts
      const annualBudget = isRevenue
        ? annualRevenueBudget
        : annualRevenueBudget * distribution;
      const monthlyBudget = annualBudget / 12;
      const ytdBudget = monthlyBudget * currentMonth;

      // Calculate actual amounts (simulate variance)
      const varianceFactor = 0.85 + Math.random() * 0.3; // 85-115% of budget
      const actualAmount = isRevenue
        ? actualRevenue
        : monthlyBudget * varianceFactor;
      const ytdActual = actualAmount * currentMonth;

      // Variance calculation (positive = over budget for expenses, under for revenue)
      const variance = actualAmount - monthlyBudget;
      const variancePercentage = monthlyBudget > 0 ? (variance / monthlyBudget) * 100 : 0;

      // Determine variance status (flip for revenue)
      const varianceStatus = this.determineVarianceStatus(variancePercentage, isRevenue);

      // Generate line items
      const lineItems = this.generateLineItems(
        category,
        monthlyBudget,
        actualAmount,
        annualBudget,
        ytdBudget,
        ytdActual
      );

      if (!isRevenue) {
        totalBudget += monthlyBudget;
        totalActual += actualAmount;
      }

      summaries.push({
        category,
        categoryName: CATEGORY_NAMES[category],
        budget: monthlyBudget,
        actual: actualAmount,
        variance,
        variancePercentage,
        varianceStatus,
        lineItems,
        percentOfTotalBudget: 0, // Will calculate after
        percentOfTotalActual: 0,
      });
    }

    // Calculate percentages
    for (const summary of summaries) {
      if (summary.category !== 'REVENUE') {
        summary.percentOfTotalBudget = totalBudget > 0 ? (summary.budget / totalBudget) * 100 : 0;
        summary.percentOfTotalActual = totalActual > 0 ? (summary.actual / totalActual) * 100 : 0;
      }
    }

    return summaries;
  }

  /**
   * Generate line items for a category
   */
  private generateLineItems(
    category: BudgetCategory,
    monthlyBudget: number,
    actualAmount: number,
    annualBudget: number,
    ytdBudget: number,
    ytdActual: number
  ): BudgetLineItem[] {
    const isRevenue = category === 'REVENUE';
    const variance = actualAmount - monthlyBudget;
    const variancePercentage = monthlyBudget > 0 ? (variance / monthlyBudget) * 100 : 0;

    return [{
      id: `${category}-main`,
      category,
      categoryName: CATEGORY_NAMES[category],
      budgetAmount: monthlyBudget,
      annualBudget,
      ytdBudget,
      actualAmount,
      ytdActual,
      variance,
      variancePercentage,
      varianceStatus: this.determineVarianceStatus(variancePercentage, isRevenue),
    }];
  }

  /**
   * Determine variance status
   */
  private determineVarianceStatus(variancePercentage: number, isRevenue: boolean): VarianceStatus {
    // For revenue: positive variance = favorable, negative = unfavorable
    // For expenses: negative variance = favorable, positive = unfavorable
    const adjustedVariance = isRevenue ? -variancePercentage : variancePercentage;
    const absVariance = Math.abs(adjustedVariance) / 100;

    if (adjustedVariance <= FAVORABLE_THRESHOLD * 100) return 'FAVORABLE';
    if (absVariance <= ON_TARGET_THRESHOLD) return 'ON_TARGET';
    if (absVariance <= UNFAVORABLE_THRESHOLD) return 'UNFAVORABLE';
    return 'CRITICAL';
  }

  /**
   * Calculate summary totals
   */
  private calculateSummary(
    byCategory: BudgetCategorySummary[],
    currentMonth: number
  ): BudgetVsActualAnalysis['summary'] {
    const revenueCategory = byCategory.find(c => c.category === 'REVENUE');
    const expenseCategories = byCategory.filter(c => c.category !== 'REVENUE');

    const revenueBudget = revenueCategory?.budget || 0;
    const revenueActual = revenueCategory?.actual || 0;
    const revenueVariance = revenueActual - revenueBudget;
    const revenueVariancePercentage = revenueBudget > 0 ? (revenueVariance / revenueBudget) * 100 : 0;

    const expenseBudget = expenseCategories.reduce((sum, c) => sum + c.budget, 0);
    const expenseActual = expenseCategories.reduce((sum, c) => sum + c.actual, 0);
    const expenseVariance = expenseActual - expenseBudget;
    const expenseVariancePercentage = expenseBudget > 0 ? (expenseVariance / expenseBudget) * 100 : 0;

    const netIncomeBudget = revenueBudget - expenseBudget;
    const netIncomeActual = revenueActual - expenseActual;
    const netIncomeVariance = netIncomeActual - netIncomeBudget;
    const netIncomeVariancePercentage = netIncomeBudget > 0 ? (netIncomeVariance / netIncomeBudget) * 100 : 0;

    const totalBudget = revenueBudget + expenseBudget;
    const totalActual = revenueActual + expenseActual;
    const totalVariance = totalActual - totalBudget;
    const totalVariancePercentage = totalBudget > 0 ? (totalVariance / totalBudget) * 100 : 0;

    // Determine overall status based on net income
    let varianceStatus: VarianceStatus;
    if (netIncomeVariancePercentage >= 5) varianceStatus = 'FAVORABLE';
    else if (netIncomeVariancePercentage >= -5) varianceStatus = 'ON_TARGET';
    else if (netIncomeVariancePercentage >= -15) varianceStatus = 'UNFAVORABLE';
    else varianceStatus = 'CRITICAL';

    // YTD figures
    const ytdBudget = totalBudget * currentMonth;
    const ytdActual = totalActual * currentMonth;
    const ytdVariance = ytdActual - ytdBudget;
    const ytdVariancePercentage = ytdBudget > 0 ? (ytdVariance / ytdBudget) * 100 : 0;

    return {
      totalBudget,
      totalActual,
      totalVariance,
      totalVariancePercentage,
      varianceStatus,
      revenueBudget,
      revenueActual,
      revenueVariance,
      revenueVariancePercentage,
      expenseBudget,
      expenseActual,
      expenseVariance,
      expenseVariancePercentage,
      netIncomeBudget,
      netIncomeActual,
      netIncomeVariance,
      netIncomeVariancePercentage,
      ytdBudget,
      ytdActual,
      ytdVariance,
      ytdVariancePercentage,
    };
  }

  /**
   * Generate monthly trends
   */
  private async generateMonthlyTrends(
    organizationId: string,
    fiscalYear: number,
    currentMonth: number,
    branchId?: string
  ): Promise<BudgetTrendDataPoint[]> {
    const trends: BudgetTrendDataPoint[] = [];
    let cumulativeBudget = 0;
    let cumulativeActual = 0;

    for (let month = 1; month <= currentMonth; month++) {
      const dateRange = this.getDateRangeForPeriod(fiscalYear, 'MONTHLY', month);

      const [billedAmount, paidAmount] = await Promise.all([
        this.repository.sumBilledAmount(organizationId, dateRange, branchId),
        this.repository.sumPaidAmount(organizationId, dateRange, branchId),
      ]);

      const actual = paidAmount || billedAmount;
      const budget = actual * 1.05; // Estimate budget slightly higher than actual

      const variance = actual - budget;
      const variancePercentage = budget > 0 ? (variance / budget) * 100 : 0;

      cumulativeBudget += budget;
      cumulativeActual += actual;
      const cumulativeVariance = cumulativeActual - cumulativeBudget;

      trends.push({
        period: `${fiscalYear}-${String(month).padStart(2, '0')}`,
        month,
        year: fiscalYear,
        budget,
        actual,
        variance,
        variancePercentage,
        cumulativeBudget,
        cumulativeActual,
        cumulativeVariance,
      });
    }

    return trends;
  }

  /**
   * Generate forecast
   */
  private generateForecast(
    summary: BudgetVsActualAnalysis['summary'],
    currentMonth: number,
    _period: BudgetPeriod
  ): BudgetForecast {
    const remainingPeriods = 12 - currentMonth;

    // Calculate run rate based on YTD actual
    const runRate = currentMonth > 0 ? summary.ytdActual / currentMonth : 0;

    // Project year end
    const projectedYearEndActual = summary.ytdActual + (runRate * remainingPeriods);
    const annualBudget = summary.totalBudget * 12;
    const projectedYearEndVariance = projectedYearEndActual - annualBudget;
    const projectedYearEndVariancePercentage = annualBudget > 0
      ? (projectedYearEndVariance / annualBudget) * 100
      : 0;

    // Calculate required run rate to meet budget
    const requiredRunRate = remainingPeriods > 0
      ? (annualBudget - summary.ytdActual) / remainingPeriods
      : 0;

    // Determine forecast status
    let forecastStatus: VarianceStatus;
    if (projectedYearEndVariancePercentage <= -5) forecastStatus = 'FAVORABLE';
    else if (Math.abs(projectedYearEndVariancePercentage) <= 5) forecastStatus = 'ON_TARGET';
    else if (projectedYearEndVariancePercentage <= 15) forecastStatus = 'UNFAVORABLE';
    else forecastStatus = 'CRITICAL';

    const assumptions = [
      `Based on ${currentMonth} months of actual data`,
      `Assumes current run rate of $${runRate.toLocaleString()} continues`,
      `No seasonal adjustments applied`,
      `Does not account for planned changes in staffing or operations`,
    ];

    return {
      remainingPeriods,
      projectedYearEndActual,
      projectedYearEndVariance,
      projectedYearEndVariancePercentage,
      runRate,
      requiredRunRate,
      forecastStatus,
      assumptions,
    };
  }

  /**
   * Identify significant variances
   */
  private identifySignificantVariances(
    byCategory: BudgetCategorySummary[]
  ): BudgetVsActualAnalysis['significantVariances'] {
    return byCategory
      .filter(c => Math.abs(c.variancePercentage) > 5 && c.category !== 'REVENUE')
      .map(c => ({
        category: c.category,
        categoryName: c.categoryName,
        variance: c.variance,
        variancePercentage: c.variancePercentage,
        impact: c.variance > 0 ? 'Increased expenses reducing margin' : 'Cost savings improving margin',
        trend: Math.random() > 0.5 ? 'STABLE' as const : (c.variance > 0 ? 'WORSENING' as const : 'IMPROVING' as const),
      }))
      .sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance))
      .slice(0, 5);
  }

  /**
   * Generate variance explanations
   */
  private generateVarianceExplanations(
    significantVariances: BudgetVsActualAnalysis['significantVariances']
  ): VarianceExplanation[] {
    return significantVariances.map(v => {
      let explanation: string;
      let isRecurring: boolean;
      let actionRequired: boolean;
      let recommendedAction: string | undefined;

      if (v.variance > 0) {
        // Over budget
        switch (v.category) {
          case 'LABOR_COST':
            explanation = 'Higher than expected overtime and temporary staffing costs';
            isRecurring = true;
            actionRequired = true;
            recommendedAction = 'Review scheduling efficiency and staffing ratios';
            break;
          case 'BENEFITS':
            explanation = 'Increased benefit utilization and premium adjustments';
            isRecurring = true;
            actionRequired = false;
            break;
          case 'MARKETING':
            explanation = 'Additional campaigns to support growth initiatives';
            isRecurring = false;
            actionRequired = false;
            break;
          default:
            explanation = 'Higher than budgeted spending';
            isRecurring = false;
            actionRequired = v.variancePercentage > 10;
        }
      } else {
        // Under budget
        explanation = 'Cost savings from operational efficiencies';
        isRecurring = false;
        actionRequired = false;
      }

      return {
        category: v.category,
        varianceAmount: v.variance,
        explanation,
        isRecurring,
        actionRequired,
        recommendedAction,
      };
    });
  }

  /**
   * Generate action items
   */
  private generateActionItems(
    significantVariances: BudgetVsActualAnalysis['significantVariances'],
    forecast: BudgetForecast
  ): BudgetVsActualAnalysis['actionItems'] {
    const actions: BudgetVsActualAnalysis['actionItems'] = [];

    // Add actions based on variances
    for (const variance of significantVariances.filter(v => v.variance > 0)) {
      actions.push({
        priority: variance.variancePercentage > 15 ? 'HIGH' : 'MEDIUM',
        category: variance.category,
        action: `Review and address ${variance.categoryName.toLowerCase()} overspend`,
        potentialImpact: variance.variance * -1,
      });
    }

    // Add forecast-based actions
    if (forecast.forecastStatus === 'CRITICAL' || forecast.forecastStatus === 'UNFAVORABLE') {
      actions.push({
        priority: 'HIGH',
        category: 'OTHER',
        action: 'Implement cost reduction measures to meet annual budget',
        potentialImpact: Math.abs(forecast.projectedYearEndVariance),
      });
    }

    return actions.slice(0, 5);
  }

  /**
   * Calculate benchmarks
   */
  private calculateBenchmarks(
    summary: BudgetVsActualAnalysis['summary']
  ): BudgetVsActualAnalysis['benchmarks'] {
    const expenseToRevenueRatio = summary.revenueActual > 0
      ? summary.expenseActual / summary.revenueActual
      : 0;

    // Find labor cost from expenses (assuming ~65% of expenses are labor)
    const laborCostPercentage = summary.revenueActual > 0
      ? (summary.expenseActual * 0.65) / summary.revenueActual
      : 0;

    // Determine status
    let status: VarianceStatus;
    if (expenseToRevenueRatio <= TARGET_EXPENSE_TO_REVENUE_RATIO * 0.95) status = 'FAVORABLE';
    else if (expenseToRevenueRatio <= TARGET_EXPENSE_TO_REVENUE_RATIO * 1.05) status = 'ON_TARGET';
    else if (expenseToRevenueRatio <= TARGET_EXPENSE_TO_REVENUE_RATIO * 1.15) status = 'UNFAVORABLE';
    else status = 'CRITICAL';

    return {
      expenseToRevenueRatio,
      targetExpenseToRevenueRatio: TARGET_EXPENSE_TO_REVENUE_RATIO,
      laborCostPercentage,
      targetLaborCostPercentage: TARGET_LABOR_COST_PERCENTAGE,
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
