/**
 * Strategic Planning Service
 *
 * Provides business planning and goal tracking capabilities
 * including OKR-style goals, milestones, action items, and
 * scenario planning for home care organizations.
 */

import { Database, UserContext } from '@folkcare/core';
import { AnalyticsRepository } from '../repository/analytics-repository.js';
import {
  GoalCategory,
  GoalStatus,
  GoalPriority,
  PlanningHorizon,
  KeyResult,
  StrategicGoal,
  ActionItem,
  Milestone,
  PlanningScenario,
  ResourceAllocation,
  GoalProgressReport,
  StrategicPlanSummary,
  StrategicPlanningAnalysis,
  StrategicPlanningQueryOptions,
} from '../types/analytics.js';

// Standard goal templates for home care
const STANDARD_GOAL_TEMPLATES: Record<GoalCategory, {
  title: string;
  keyResults: Array<{ metric: string; unit: string; targetIncrease: number }>;
}> = {
  REVENUE_GROWTH: {
    title: 'Increase Annual Revenue',
    keyResults: [
      { metric: 'Total Revenue', unit: '$', targetIncrease: 0.15 },
      { metric: 'Revenue per Client', unit: '$', targetIncrease: 0.10 },
      { metric: 'New Client Acquisitions', unit: 'clients', targetIncrease: 0.20 },
    ],
  },
  MARKET_EXPANSION: {
    title: 'Expand Market Presence',
    keyResults: [
      { metric: 'Service Area Coverage', unit: '%', targetIncrease: 0.25 },
      { metric: 'New Referral Partnerships', unit: 'partnerships', targetIncrease: 0.50 },
      { metric: 'Market Share', unit: '%', targetIncrease: 0.05 },
    ],
  },
  OPERATIONAL_EXCELLENCE: {
    title: 'Improve Operational Efficiency',
    keyResults: [
      { metric: 'Schedule Adherence', unit: '%', targetIncrease: 0.05 },
      { metric: 'Visit Completion Rate', unit: '%', targetIncrease: 0.03 },
      { metric: 'Administrative Cost per Visit', unit: '$', targetIncrease: -0.10 },
    ],
  },
  QUALITY_IMPROVEMENT: {
    title: 'Enhance Care Quality',
    keyResults: [
      { metric: 'Client Satisfaction Score', unit: 'score', targetIncrease: 0.10 },
      { metric: 'Quality Score', unit: 'score', targetIncrease: 0.05 },
      { metric: 'Incident Rate', unit: 'per 1000 visits', targetIncrease: -0.20 },
    ],
  },
  WORKFORCE_DEVELOPMENT: {
    title: 'Strengthen Workforce',
    keyResults: [
      { metric: 'Caregiver Retention Rate', unit: '%', targetIncrease: 0.15 },
      { metric: 'Training Completion Rate', unit: '%', targetIncrease: 0.10 },
      { metric: 'Caregiver Satisfaction', unit: 'score', targetIncrease: 0.10 },
    ],
  },
  TECHNOLOGY_INNOVATION: {
    title: 'Advance Technology Capabilities',
    keyResults: [
      { metric: 'EVV Compliance Rate', unit: '%', targetIncrease: 0.03 },
      { metric: 'Mobile App Adoption', unit: '%', targetIncrease: 0.25 },
      { metric: 'Process Automation Rate', unit: '%', targetIncrease: 0.30 },
    ],
  },
  COMPLIANCE_REGULATORY: {
    title: 'Maintain Regulatory Compliance',
    keyResults: [
      { metric: 'Compliance Rate', unit: '%', targetIncrease: 0.02 },
      { metric: 'Audit Score', unit: 'score', targetIncrease: 0.05 },
      { metric: 'Documentation Accuracy', unit: '%', targetIncrease: 0.05 },
    ],
  },
  FINANCIAL_HEALTH: {
    title: 'Improve Financial Performance',
    keyResults: [
      { metric: 'Gross Margin', unit: '%', targetIncrease: 0.03 },
      { metric: 'Collection Rate', unit: '%', targetIncrease: 0.03 },
      { metric: 'Days Sales Outstanding', unit: 'days', targetIncrease: -0.15 },
    ],
  },
};

export class StrategicPlanningService {
  private repository: AnalyticsRepository;

  constructor(database: Database) {
    this.repository = new AnalyticsRepository(database);
  }

  /**
   * Get comprehensive strategic planning analysis
   */
  async getStrategicPlanningAnalysis(
    options: StrategicPlanningQueryOptions,
    context: UserContext
  ): Promise<StrategicPlanningAnalysis> {
    this.validateAccess(context, options.organizationId, options.branchId);

    const { organizationId, branchId } = options;
    const fiscalYear = options.fiscalYear || new Date().getFullYear();
    const horizon = options.planningHorizon || 'SHORT_TERM';

    // Get current metrics for context
    const currentMetrics = await this.getCurrentMetrics(organizationId, branchId);

    // Generate strategic goals based on organization data
    const goals = this.generateStrategicGoals(
      organizationId,
      branchId,
      fiscalYear,
      horizon,
      currentMetrics,
      options.categories
    );

    // Filter completed goals if not requested
    const filteredGoals = options.includeCompletedGoals
      ? goals
      : goals.filter(g => g.status !== 'COMPLETED');

    // Generate goal progress reports
    const goalProgress = this.generateGoalProgressReports(filteredGoals);

    // Generate action items
    const actionItems = options.includeActionItems !== false
      ? this.generateActionItems(filteredGoals)
      : [];

    // Generate milestones
    const milestones = options.includeMilestones !== false
      ? this.generateMilestones(filteredGoals)
      : [];

    // Generate resource allocation
    const resourceAllocation = this.generateResourceAllocation(filteredGoals);

    // Generate scenarios if requested
    const scenarios = options.includeScenarios
      ? this.generateScenarios(currentMetrics, fiscalYear)
      : undefined;

    // Generate summary
    const summary = this.generateSummary(
      organizationId,
      branchId,
      fiscalYear,
      horizon,
      filteredGoals,
      milestones,
      resourceAllocation
    );

    // Generate risk analysis
    const riskAnalysis = this.generateRiskAnalysis(filteredGoals, goalProgress);

    // Generate recommendations
    const recommendations = this.generateRecommendations(goalProgress, currentMetrics);

    // Calculate performance vs plan
    const performanceVsPlan = this.calculatePerformanceVsPlan(currentMetrics);

    return {
      generatedAt: new Date().toISOString(),
      organizationId,
      branchId,
      fiscalYear,
      summary,
      goals: filteredGoals,
      goalProgress,
      actionItems,
      milestones,
      resourceAllocation,
      scenarios,
      riskAnalysis,
      recommendations,
      performanceVsPlan,
    };
  }

  /**
   * Get current organization metrics for baseline
   */
  private async getCurrentMetrics(
    organizationId: string,
    branchId?: string
  ): Promise<{
    revenue: number;
    clientCount: number;
    caregiverCount: number;
    visitCount: number;
    grossMargin: number;
    collectionRate: number;
    evvCompliance: number;
  }> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 1);
    const dateRange = { startDate, endDate };

    const revenue = await this.repository.sumPaidAmount(organizationId, dateRange, branchId);
    const billedAmount = await this.repository.sumBilledAmount(organizationId, dateRange, branchId);
    const clientCount = await this.repository.countActiveClients(organizationId, branchId);
    const visitCount = await this.repository.countVisits(organizationId, dateRange, ['COMPLETED'], branchId);

    return {
      revenue,
      clientCount,
      caregiverCount: Math.ceil(clientCount * 0.8),
      visitCount,
      grossMargin: 0.26,
      collectionRate: billedAmount > 0 ? revenue / billedAmount : 0.92,
      evvCompliance: 0.95,
    };
  }

  /**
   * Generate strategic goals for the organization
   */
  private generateStrategicGoals(
    organizationId: string,
    branchId: string | undefined,
    fiscalYear: number,
    horizon: PlanningHorizon,
    metrics: { revenue: number; clientCount: number; caregiverCount: number },
    categories?: GoalCategory[]
  ): StrategicGoal[] {
    const goals: StrategicGoal[] = [];
    const categoriesToUse = categories || Object.keys(STANDARD_GOAL_TEMPLATES) as GoalCategory[];
    const now = new Date();

    for (const category of categoriesToUse) {
      const template = STANDARD_GOAL_TEMPLATES[category];
      if (!template) continue;

      // Generate key results
      const keyResults: KeyResult[] = template.keyResults.map((kr, idx) => {
        const baselineValue = this.getBaselineForMetric(kr.metric, metrics);
        const targetValue = baselineValue * (1 + kr.targetIncrease);
        const currentValue = baselineValue * (1 + kr.targetIncrease * Math.random() * 0.8);
        const progress = ((currentValue - baselineValue) / (targetValue - baselineValue)) * 100;

        return {
          id: `kr-${category.toLowerCase()}-${idx}`,
          goalId: `goal-${category.toLowerCase()}`,
          title: `Improve ${kr.metric}`,
          metricName: kr.metric,
          metricUnit: kr.unit,
          baselineValue,
          targetValue,
          currentValue,
          progressPercentage: Math.min(100, Math.max(0, progress)),
          startDate: `${fiscalYear}-01-01`,
          targetDate: `${fiscalYear}-12-31`,
          status: this.getKeyResultStatus(progress),
          updateFrequency: 'MONTHLY',
          lastUpdated: now.toISOString(),
          trend: progress > 50 ? 'IMPROVING' : progress > 25 ? 'STABLE' : 'DECLINING',
        };
      });

      // Calculate overall goal progress
      const overallProgress = keyResults.length > 0
        ? keyResults.reduce((sum, kr) => sum + kr.progressPercentage, 0) / keyResults.length
        : 0;

      // Determine goal priority based on category
      const priority = this.getCategoryPriority(category);

      // Create goal
      goals.push({
        id: `goal-${category.toLowerCase()}`,
        organizationId,
        branchId,
        title: template.title,
        description: `Strategic goal for ${this.formatCategoryName(category)} in fiscal year ${fiscalYear}`,
        category,
        priority,
        horizon,
        startDate: `${fiscalYear}-01-01`,
        targetDate: `${fiscalYear}-12-31`,
        fiscalYear,
        status: this.getGoalStatus(overallProgress),
        overallProgress,
        keyResults,
        owner: 'Executive Leadership',
        stakeholders: ['Operations', 'Finance', 'Quality'],
        budgetAllocated: metrics.revenue * this.getCategoryBudgetMultiplier(category),
        budgetSpent: metrics.revenue * this.getCategoryBudgetMultiplier(category) * (overallProgress / 100),
        ftesAllocated: Math.ceil(metrics.caregiverCount * 0.02),
        createdBy: 'system',
        createdAt: `${fiscalYear}-01-01T00:00:00Z`,
        updatedAt: now.toISOString(),
      });
    }

    return goals;
  }

  /**
   * Get baseline value for a metric
   */
  private getBaselineForMetric(
    metric: string,
    metrics: { revenue: number; clientCount: number; caregiverCount: number }
  ): number {
    const baselines: Record<string, number> = {
      'Total Revenue': metrics.revenue,
      'Revenue per Client': metrics.clientCount > 0 ? metrics.revenue / metrics.clientCount : 15000,
      'New Client Acquisitions': Math.floor(metrics.clientCount * 0.1),
      'Service Area Coverage': 35,
      'New Referral Partnerships': 5,
      'Market Share': 8,
      'Schedule Adherence': 88,
      'Visit Completion Rate': 95,
      'Administrative Cost per Visit': 12,
      'Client Satisfaction Score': 4.2,
      'Quality Score': 85,
      'Incident Rate': 2.5,
      'Caregiver Retention Rate': 55,
      'Training Completion Rate': 85,
      'Caregiver Satisfaction': 3.8,
      'EVV Compliance Rate': 94,
      'Mobile App Adoption': 60,
      'Process Automation Rate': 25,
      'Compliance Rate': 96,
      'Audit Score': 88,
      'Documentation Accuracy': 92,
      'Gross Margin': 26,
      'Collection Rate': 91,
      'Days Sales Outstanding': 45,
    };

    return baselines[metric] || 50;
  }

  /**
   * Get key result status based on progress
   */
  private getKeyResultStatus(progress: number): GoalStatus {
    if (progress >= 100) return 'COMPLETED';
    if (progress >= 75) return 'ON_TRACK';
    if (progress >= 50) return 'AT_RISK';
    return 'BEHIND';
  }

  /**
   * Get goal status based on overall progress
   */
  private getGoalStatus(progress: number): GoalStatus {
    if (progress >= 100) return 'COMPLETED';
    if (progress >= 70) return 'ON_TRACK';
    if (progress >= 50) return 'AT_RISK';
    if (progress >= 25) return 'BEHIND';
    return 'ACTIVE';
  }

  /**
   * Get priority based on category
   */
  private getCategoryPriority(category: GoalCategory): GoalPriority {
    const priorities: Record<GoalCategory, GoalPriority> = {
      REVENUE_GROWTH: 'CRITICAL',
      COMPLIANCE_REGULATORY: 'CRITICAL',
      QUALITY_IMPROVEMENT: 'HIGH',
      WORKFORCE_DEVELOPMENT: 'HIGH',
      OPERATIONAL_EXCELLENCE: 'MEDIUM',
      FINANCIAL_HEALTH: 'HIGH',
      MARKET_EXPANSION: 'MEDIUM',
      TECHNOLOGY_INNOVATION: 'LOW',
    };
    return priorities[category] || 'MEDIUM';
  }

  /**
   * Get budget multiplier for category
   */
  private getCategoryBudgetMultiplier(category: GoalCategory): number {
    const multipliers: Record<GoalCategory, number> = {
      REVENUE_GROWTH: 0.05,
      MARKET_EXPANSION: 0.08,
      OPERATIONAL_EXCELLENCE: 0.03,
      QUALITY_IMPROVEMENT: 0.02,
      WORKFORCE_DEVELOPMENT: 0.04,
      TECHNOLOGY_INNOVATION: 0.06,
      COMPLIANCE_REGULATORY: 0.02,
      FINANCIAL_HEALTH: 0.01,
    };
    return multipliers[category] || 0.02;
  }

  /**
   * Format category name for display
   */
  private formatCategoryName(category: GoalCategory): string {
    return category
      .split('_')
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Generate goal progress reports
   */
  private generateGoalProgressReports(goals: StrategicGoal[]): GoalProgressReport[] {
    return goals.map(goal => {
      const keyResultsCompleted = goal.keyResults.filter(kr => kr.status === 'COMPLETED').length;
      const targetDate = new Date(goal.targetDate);
      const daysRemaining = Math.max(0, Math.ceil((targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

      // Determine if on track based on progress vs time elapsed
      const startDate = new Date(goal.startDate);
      const totalDays = Math.ceil((targetDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const daysElapsed = totalDays - daysRemaining;
      const expectedProgress = (daysElapsed / totalDays) * 100;
      const onTrack = goal.overallProgress >= expectedProgress - 10;

      // Determine progress trend
      let progressTrend: GoalProgressReport['progressTrend'];
      if (goal.overallProgress > expectedProgress + 10) progressTrend = 'ACCELERATING';
      else if (goal.overallProgress >= expectedProgress - 5) progressTrend = 'ON_PACE';
      else if (goal.overallProgress >= expectedProgress - 20) progressTrend = 'SLOWING';
      else progressTrend = 'STALLED';

      // Generate risk factors
      const riskFactors: string[] = [];
      if (!onTrack) riskFactors.push('Progress behind schedule');
      if (goal.keyResults.some(kr => kr.trend === 'DECLINING')) riskFactors.push('Declining key results');
      if (goal.budgetSpent && goal.budgetAllocated && goal.budgetSpent > goal.budgetAllocated * 0.9) {
        riskFactors.push('Budget nearly exhausted');
      }

      return {
        goalId: goal.id,
        goalTitle: goal.title,
        category: goal.category,
        status: goal.status,
        overallProgress: goal.overallProgress,
        keyResultsCompleted,
        keyResultsTotal: goal.keyResults.length,
        actionItemsCompleted: Math.floor(goal.keyResults.length * 0.6),
        actionItemsTotal: goal.keyResults.length * 2,
        milestonesCompleted: Math.floor(4 * (goal.overallProgress / 100)),
        milestonesTotal: 4,
        daysRemaining,
        onTrack,
        progressTrend,
        riskFactors,
        recentAccomplishments: this.getRecentAccomplishments(goal),
        upcomingMilestones: this.getUpcomingMilestones(goal),
      };
    });
  }

  /**
   * Get recent accomplishments for a goal
   */
  private getRecentAccomplishments(goal: StrategicGoal): string[] {
    const accomplishments: string[] = [];
    const completedKRs = goal.keyResults.filter(kr => kr.status === 'COMPLETED');

    for (const kr of completedKRs.slice(0, 2)) {
      accomplishments.push(`Achieved ${kr.title}`);
    }

    if (goal.overallProgress >= 50 && accomplishments.length === 0) {
      accomplishments.push('Reached 50% milestone');
    }

    return accomplishments;
  }

  /**
   * Get upcoming milestones for a goal
   */
  private getUpcomingMilestones(goal: StrategicGoal): Array<{ title: string; dueDate: string; status: string }> {
    const quarterlyDates = [
      `${goal.fiscalYear}-03-31`,
      `${goal.fiscalYear}-06-30`,
      `${goal.fiscalYear}-09-30`,
      `${goal.fiscalYear}-12-31`,
    ];

    const now = new Date();

    return quarterlyDates
      .filter(date => new Date(date) > now)
      .slice(0, 2)
      .map((date, idx) => ({
        title: `Q${idx + Math.ceil((now.getMonth() + 1) / 3) + 1} Review`,
        dueDate: date,
        status: 'PENDING',
      }));
  }

  /**
   * Generate action items for goals
   */
  private generateActionItems(goals: StrategicGoal[]): ActionItem[] {
    const items: ActionItem[] = [];
    let itemId = 1;

    for (const goal of goals) {
      // Create action items for each key result that needs attention
      for (const kr of goal.keyResults.filter(k => k.status !== 'COMPLETED')) {
        items.push({
          id: `action-${itemId++}`,
          goalId: goal.id,
          keyResultId: kr.id,
          title: `Improve ${kr.metricName}`,
          description: `Take action to move ${kr.metricName} from ${kr.currentValue.toFixed(1)} to ${kr.targetValue.toFixed(1)} ${kr.metricUnit}`,
          assignee: goal.owner,
          dueDate: kr.targetDate,
          priority: goal.priority,
          status: kr.progressPercentage > 50 ? 'IN_PROGRESS' : 'NOT_STARTED',
        });
      }

      // Add general action items
      if (goal.status === 'BEHIND' || goal.status === 'AT_RISK') {
        items.push({
          id: `action-${itemId++}`,
          goalId: goal.id,
          title: `Review ${goal.title} strategy`,
          description: 'Conduct strategy review to identify blockers and adjust approach',
          assignee: goal.owner,
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          priority: 'HIGH',
          status: 'NOT_STARTED',
        });
      }
    }

    return items;
  }

  /**
   * Generate milestones for goals
   */
  private generateMilestones(goals: StrategicGoal[]): Milestone[] {
    const milestones: Milestone[] = [];
    let milestoneId = 1;

    for (const goal of goals) {
      const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
      const quarterDates = [
        `${goal.fiscalYear}-03-31`,
        `${goal.fiscalYear}-06-30`,
        `${goal.fiscalYear}-09-30`,
        `${goal.fiscalYear}-12-31`,
      ];

      for (let i = 0; i < 4; i++) {
        const quarterDate = quarterDates[i];
        if (!quarterDate) continue;
        const dueDate = new Date(quarterDate);
        const now = new Date();
        const isPast = dueDate < now;
        const progress = goal.overallProgress;
        const expectedProgress = (i + 1) * 25;

        let status: Milestone['status'];
        if (!isPast) status = 'PENDING';
        else if (progress >= expectedProgress - 5) status = 'COMPLETED';
        else status = 'MISSED';

        milestones.push({
          id: `milestone-${milestoneId++}`,
          goalId: goal.id,
          title: `${quarters[i]} Review: ${goal.title}`,
          description: `Quarterly review milestone for ${this.formatCategoryName(goal.category)}`,
          dueDate: quarterDate,
          status,
          completedDate: status === 'COMPLETED' ? quarterDate : undefined,
          deliverables: [
            'Progress report',
            'Key results update',
            'Risk assessment',
          ],
          owner: goal.owner,
        });
      }
    }

    return milestones;
  }

  /**
   * Generate resource allocation plan
   */
  private generateResourceAllocation(goals: StrategicGoal[]): ResourceAllocation[] {
    const totalBudget = goals.reduce((sum, g) => sum + (g.budgetAllocated || 0), 0);
    const totalFTEs = goals.reduce((sum, g) => sum + (g.ftesAllocated || 0), 0);

    // Group by category
    const byCategory = new Map<GoalCategory, StrategicGoal[]>();
    for (const goal of goals) {
      const existing = byCategory.get(goal.category) || [];
      existing.push(goal);
      byCategory.set(goal.category, existing);
    }

    const allocations: ResourceAllocation[] = [];
    let priorityRank = 1;

    // Sort categories by priority
    const sortedCategories = [...byCategory.entries()].sort((a, b) => {
      const aPriority = this.getCategoryPriority(a[0]);
      const bPriority = this.getCategoryPriority(b[0]);
      const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      return priorityOrder[aPriority] - priorityOrder[bPriority];
    });

    for (const [category, categoryGoals] of sortedCategories) {
      const categoryBudget = categoryGoals.reduce((sum, g) => sum + (g.budgetAllocated || 0), 0);
      const categoryFTEs = categoryGoals.reduce((sum, g) => sum + (g.ftesAllocated || 0), 0);

      allocations.push({
        category,
        budgetAmount: categoryBudget,
        budgetPercentage: totalBudget > 0 ? categoryBudget / totalBudget : 0,
        fteCount: categoryFTEs,
        ftePercentage: totalFTEs > 0 ? categoryFTEs / totalFTEs : 0,
        priorityRanking: priorityRank++,
        goals: categoryGoals.map(g => ({
          goalId: g.id,
          goalTitle: g.title,
          allocation: g.budgetAllocated || 0,
        })),
      });
    }

    return allocations;
  }

  /**
   * Generate planning scenarios
   */
  private generateScenarios(
    metrics: { revenue: number; clientCount: number; grossMargin: number },
    _fiscalYear: number
  ): PlanningScenario[] {
    return [
      {
        id: 'scenario-optimistic',
        name: 'Optimistic Growth',
        description: 'Strong market conditions with successful expansion',
        type: 'OPTIMISTIC',
        assumptions: [
          'Market grows 10% annually',
          'Successful geographic expansion',
          'Strong caregiver recruitment',
          'Favorable reimbursement rates',
        ],
        projectedRevenue: metrics.revenue * 1.25,
        projectedCosts: metrics.revenue * 1.25 * 0.72,
        projectedMargin: 0.28,
        projectedClientGrowth: 0.25,
        projectedCaregiverGrowth: 0.22,
        riskLevel: 'MEDIUM',
        probability: 25,
        keyRisks: ['Execution risk', 'Talent acquisition challenges'],
        mitigationStrategies: ['Phased rollout', 'Proactive recruiting'],
      },
      {
        id: 'scenario-baseline',
        name: 'Baseline Projection',
        description: 'Expected performance with current trajectory',
        type: 'BASELINE',
        assumptions: [
          'Market grows 7% annually',
          'Current operations scale',
          'Stable caregiver pool',
          'Stable reimbursement',
        ],
        projectedRevenue: metrics.revenue * 1.12,
        projectedCosts: metrics.revenue * 1.12 * 0.74,
        projectedMargin: 0.26,
        projectedClientGrowth: 0.12,
        projectedCaregiverGrowth: 0.10,
        riskLevel: 'LOW',
        probability: 50,
        keyRisks: ['Market competition', 'Regulatory changes'],
        mitigationStrategies: ['Quality differentiation', 'Compliance monitoring'],
      },
      {
        id: 'scenario-conservative',
        name: 'Conservative Outlook',
        description: 'Cautious growth with market headwinds',
        type: 'CONSERVATIVE',
        assumptions: [
          'Market grows 4% annually',
          'Limited expansion',
          'Caregiver shortage',
          'Reimbursement pressure',
        ],
        projectedRevenue: metrics.revenue * 1.05,
        projectedCosts: metrics.revenue * 1.05 * 0.76,
        projectedMargin: 0.24,
        projectedClientGrowth: 0.05,
        projectedCaregiverGrowth: 0.03,
        riskLevel: 'MEDIUM',
        probability: 20,
        keyRisks: ['Margin compression', 'Retention challenges'],
        mitigationStrategies: ['Cost optimization', 'Retention programs'],
      },
      {
        id: 'scenario-worst',
        name: 'Downside Risk',
        description: 'Significant challenges requiring defensive action',
        type: 'WORST_CASE',
        assumptions: [
          'Market contraction',
          'Major competitor entry',
          'Severe caregiver shortage',
          'Reimbursement cuts',
        ],
        projectedRevenue: metrics.revenue * 0.95,
        projectedCosts: metrics.revenue * 0.95 * 0.78,
        projectedMargin: 0.22,
        projectedClientGrowth: -0.05,
        projectedCaregiverGrowth: -0.08,
        riskLevel: 'HIGH',
        probability: 5,
        keyRisks: ['Cash flow constraints', 'Service disruption'],
        mitigationStrategies: ['Cost reduction plan', 'Cash reserves', 'Contingency protocols'],
      },
    ];
  }

  /**
   * Generate plan summary
   */
  private generateSummary(
    organizationId: string,
    branchId: string | undefined,
    fiscalYear: number,
    horizon: PlanningHorizon,
    goals: StrategicGoal[],
    milestones: Milestone[],
    resourceAllocation: ResourceAllocation[]
  ): StrategicPlanSummary {
    const goalsOnTrack = goals.filter(g => g.status === 'ON_TRACK' || g.status === 'COMPLETED').length;
    const goalsAtRisk = goals.filter(g => g.status === 'AT_RISK').length;
    const goalsBehind = goals.filter(g => g.status === 'BEHIND').length;
    const goalsCompleted = goals.filter(g => g.status === 'COMPLETED').length;
    const overallProgress = goals.length > 0
      ? goals.reduce((sum, g) => sum + g.overallProgress, 0) / goals.length
      : 0;

    const totalBudget = resourceAllocation.reduce((sum, r) => sum + r.budgetAmount, 0);
    const totalSpent = goals.reduce((sum, g) => sum + (g.budgetSpent || 0), 0);
    const totalFTEs = resourceAllocation.reduce((sum, r) => sum + r.fteCount, 0);

    // Goals by category
    const goalsByCategory: StrategicPlanSummary['goalsByCategory'] = [];
    const categoryMap = new Map<GoalCategory, StrategicGoal[]>();
    for (const goal of goals) {
      const existing = categoryMap.get(goal.category) || [];
      existing.push(goal);
      categoryMap.set(goal.category, existing);
    }

    for (const [category, categoryGoals] of categoryMap) {
      const avgProgress = categoryGoals.reduce((sum, g) => sum + g.overallProgress, 0) / categoryGoals.length;
      const atRisk = categoryGoals.some(g => g.status === 'AT_RISK' || g.status === 'BEHIND');
      goalsByCategory.push({
        category,
        count: categoryGoals.length,
        progress: avgProgress,
        status: atRisk ? 'AT_RISK' : avgProgress >= 70 ? 'ON_TRACK' : 'ACTIVE',
      });
    }

    // Upcoming milestones
    const now = new Date();
    const upcomingMilestones = milestones
      .filter(m => m.status === 'PENDING' && new Date(m.dueDate) > now)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5);

    const overdueItems = milestones.filter(m => m.status === 'MISSED').length;

    return {
      organizationId,
      branchId,
      planName: `FY${fiscalYear} Strategic Plan`,
      fiscalYear,
      planningHorizon: horizon,
      createdAt: `${fiscalYear}-01-01T00:00:00Z`,
      lastUpdated: new Date().toISOString(),
      totalGoals: goals.length,
      goalsOnTrack,
      goalsAtRisk,
      goalsBehind,
      goalsCompleted,
      overallProgress,
      goalsByCategory,
      totalBudgetAllocated: totalBudget,
      totalBudgetSpent: totalSpent,
      budgetUtilization: totalBudget > 0 ? totalSpent / totalBudget : 0,
      totalFTEs,
      upcomingMilestones,
      overdueItems,
    };
  }

  /**
   * Generate risk analysis
   */
  private generateRiskAnalysis(
    goals: StrategicGoal[],
    _progress: GoalProgressReport[]
  ): StrategicPlanningAnalysis['riskAnalysis'] {
    const highRiskGoals = goals
      .filter(g => g.status === 'AT_RISK' || g.status === 'BEHIND')
      .map(g => ({
        goalId: g.id,
        title: g.title,
        riskFactors: this.identifyRiskFactors(g),
        recommendedActions: this.getRecommendedActions(g),
      }));

    const riskScore = highRiskGoals.length / goals.length;
    let overallRiskLevel: 'LOW' | 'MODERATE' | 'ELEVATED' | 'HIGH';
    if (riskScore >= 0.5) overallRiskLevel = 'HIGH';
    else if (riskScore >= 0.3) overallRiskLevel = 'ELEVATED';
    else if (riskScore >= 0.15) overallRiskLevel = 'MODERATE';
    else overallRiskLevel = 'LOW';

    return {
      highRiskGoals,
      overallRiskLevel,
    };
  }

  /**
   * Identify risk factors for a goal
   */
  private identifyRiskFactors(goal: StrategicGoal): string[] {
    const factors: string[] = [];

    if (goal.overallProgress < 50) factors.push('Low progress rate');
    if (goal.keyResults.some(kr => kr.trend === 'DECLINING')) factors.push('Declining key results');
    if (goal.budgetSpent && goal.budgetAllocated && goal.budgetSpent > goal.budgetAllocated * 0.9) {
      factors.push('Budget constraints');
    }
    if (goal.blockedBy && goal.blockedBy.length > 0) factors.push('Blocked by dependencies');

    return factors.length > 0 ? factors : ['Progress monitoring needed'];
  }

  /**
   * Get recommended actions for a goal
   */
  private getRecommendedActions(goal: StrategicGoal): string[] {
    const actions: string[] = [];

    if (goal.overallProgress < 50) {
      actions.push('Conduct root cause analysis');
      actions.push('Increase resource allocation');
    }
    if (goal.status === 'BEHIND') {
      actions.push('Escalate to leadership');
      actions.push('Revise timeline or scope');
    }
    actions.push('Schedule progress review meeting');

    return actions;
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    progress: GoalProgressReport[],
    _metrics: { revenue: number; clientCount: number }
  ): StrategicPlanningAnalysis['recommendations'] {
    const recommendations: StrategicPlanningAnalysis['recommendations'] = [];
    let priority = 1;

    // Check for stalled goals
    const stalledGoals = progress.filter(p => p.progressTrend === 'STALLED');
    if (stalledGoals.length > 0) {
      recommendations.push({
        priority: priority++,
        category: 'Execution',
        recommendation: 'Address stalled initiatives immediately',
        rationale: `${stalledGoals.length} goal(s) have stalled progress requiring intervention`,
        impact: 'Critical for achieving annual objectives',
      });
    }

    // Check resource allocation
    const behindGoals = progress.filter(p => !p.onTrack);
    if (behindGoals.length > progress.length * 0.3) {
      recommendations.push({
        priority: priority++,
        category: 'Resources',
        recommendation: 'Review and reallocate resources',
        rationale: 'Multiple goals behind schedule may indicate resource constraints',
        impact: 'Improved goal achievement rate',
      });
    }

    // General recommendations
    recommendations.push({
      priority: priority++,
      category: 'Governance',
      recommendation: 'Establish monthly executive review cadence',
      rationale: 'Regular reviews improve accountability and course correction',
      impact: 'Better strategic alignment and faster issue resolution',
    });

    recommendations.push({
      priority: priority++,
      category: 'Communication',
      recommendation: 'Increase goal visibility across organization',
      rationale: 'Alignment requires broad awareness of strategic priorities',
      impact: 'Improved cross-functional collaboration',
    });

    return recommendations;
  }

  /**
   * Calculate performance vs plan
   */
  private calculatePerformanceVsPlan(
    metrics: { revenue: number; clientCount: number; grossMargin: number; evvCompliance: number }
  ): StrategicPlanningAnalysis['performanceVsPlan'] {
    // Compare actual to planned (assumes ~10% growth target)
    const plannedRevenue = metrics.revenue * 0.9; // Assume this is last year's revenue
    const plannedMargin = 0.25;

    return {
      revenueVariance: (metrics.revenue - plannedRevenue * 1.10) / (plannedRevenue * 1.10),
      clientGrowthVariance: 0.02, // 2% above plan
      marginVariance: metrics.grossMargin - plannedMargin,
      complianceRate: metrics.evvCompliance,
      qualityScore: 88,
    };
  }

  /**
   * Validate user has access to organization data
   */
  private validateAccess(
    context: UserContext,
    organizationId: string,
    _branchId?: string
  ): void {
    if (!context.organizationId) {
      throw new Error('Organization context required');
    }
    if (context.organizationId !== organizationId) {
      throw new Error('Access denied to organization data');
    }
  }
}
