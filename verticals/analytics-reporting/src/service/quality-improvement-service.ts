/**
 * Quality Improvement Suggestions Service
 *
 * AI-powered service that analyzes care quality metrics and suggests
 * specific, actionable improvement initiatives. Uses AI to identify
 * patterns in data that indicate opportunities for quality improvement.
 */

import Anthropic from '@anthropic-ai/sdk';
import type { Knex } from 'knex';

export type QualityDomain =
  | 'CARE_DELIVERY'
  | 'DOCUMENTATION'
  | 'COMPLIANCE'
  | 'CLIENT_OUTCOMES'
  | 'CAREGIVER_PERFORMANCE'
  | 'SCHEDULING_EFFICIENCY'
  | 'COMMUNICATION'
  | 'SAFETY';

export type ImprovementPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type ImprovementEffort = 'QUICK_WIN' | 'SHORT_TERM' | 'MEDIUM_TERM' | 'LONG_TERM';
export type ImprovementStatus = 'SUGGESTED' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'DISMISSED';

export interface QualityMetric {
  name: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  trend: 'IMPROVING' | 'DECLINING' | 'STABLE';
  percentageFromTarget: number;
}

export interface ImprovementInitiative {
  id: string;
  domain: QualityDomain;
  title: string;
  description: string;
  rationale: string;
  priority: ImprovementPriority;
  effort: ImprovementEffort;
  estimatedImpact: string;
  relatedMetrics: QualityMetric[];
  actionSteps: Array<{
    step: number;
    action: string;
    responsible: string;
    timeline: string;
  }>;
  expectedOutcomes: string[];
  potentialChallenges: string[];
  successIndicators: string[];
  resourcesNeeded: string[];
  confidenceScore: number;
  createdAt: string;
}

export interface QualityImprovementRequest {
  organizationId?: string;
  branchId?: string;
  domains?: QualityDomain[];
  lookbackDays?: number;
  maxSuggestions?: number;
  focusAreas?: string[];
}

export interface QualityImprovementResult {
  analyzedAt: string;
  organizationId?: string;
  lookbackPeriod: {
    startDate: string;
    endDate: string;
    days: number;
  };
  currentQualityScore: number;
  domainScores: Record<QualityDomain, number>;
  initiatives: ImprovementInitiative[];
  priorityDistribution: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  topOpportunities: string[];
  executiveSummary: string;
}

export class QualityImprovementService {
  private anthropic: Anthropic;

  constructor(private db: Knex) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  /**
   * Generate quality improvement suggestions for an organization
   */
  async generateSuggestions(request: QualityImprovementRequest): Promise<QualityImprovementResult> {
    const lookbackDays = request.lookbackDays ?? 30;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - lookbackDays);

    // Gather quality metrics data
    const data = await this.gatherQualityData(request.organizationId, request.branchId, startDate, endDate);

    // Calculate domain scores
    const domainScores = this.calculateDomainScores(data);

    // Use AI to generate improvement suggestions
    const initiatives = await this.analyzeWithAI(
      data,
      request.domains,
      request.maxSuggestions ?? 10,
      request.focusAreas,
    );

    // Calculate priority distribution
    const priorityDistribution = this.calculatePriorityDistribution(initiatives);

    // Calculate overall quality score
    const currentQualityScore = this.calculateOverallScore(domainScores);

    // Generate executive summary
    const executiveSummary = await this.generateExecutiveSummary(data, initiatives, currentQualityScore);

    // Extract top opportunities
    const topOpportunities = initiatives
      .filter((i) => i.priority === 'CRITICAL' || i.priority === 'HIGH')
      .slice(0, 5)
      .map((i) => i.title);

    return {
      analyzedAt: new Date().toISOString(),
      organizationId: request.organizationId,
      lookbackPeriod: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        days: lookbackDays,
      },
      currentQualityScore,
      domainScores,
      initiatives,
      priorityDistribution,
      topOpportunities,
      executiveSummary,
    };
  }

  private async gatherQualityData(
    organizationId: string | undefined,
    branchId: string | undefined,
    startDate: Date,
    endDate: Date,
  ): Promise<Record<string, unknown>> {
    const data: Record<string, unknown> = {};

    // Organization filter helper
    const applyFilters = (query: Knex.QueryBuilder) => {
      if (organizationId) {
        query.where('organization_id', organizationId);
      }
      if (branchId) {
        query.where('branch_id', branchId);
      }
      return query;
    };

    // Visit metrics
    const visitsQuery = this.db('visits')
      .where('is_deleted', false)
      .whereBetween('scheduled_start', [startDate, endDate]);
    const visits = await applyFilters(visitsQuery);
    data.totalVisits = visits.length;
    data.completedVisits = visits.filter((v: Record<string, unknown>) => v.status === 'completed').length;
    data.missedVisits = visits.filter((v: Record<string, unknown>) => v.status === 'missed').length;
    data.cancelledVisits = visits.filter((v: Record<string, unknown>) => v.status === 'cancelled').length;
    data.visitCompletionRate =
      visits.length > 0 ? (Number(data.completedVisits) / visits.length) * 100 : 0;

    // EVV compliance
    const evvCompliant = visits.filter(
      (v: Record<string, unknown>) =>
        v.status === 'completed' && v.check_in_time !== null && v.check_out_time !== null,
    ).length;
    const completedCount = Number(data.completedVisits ?? 0);
    data.evvComplianceRate = completedCount > 0 ? (evvCompliant / completedCount) * 100 : 0;

    // On-time arrival
    const onTimeVisits = visits.filter((v: Record<string, unknown>) => {
      if (!v.check_in_time || !v.scheduled_start) return false;
      const checkIn = new Date(v.check_in_time as string);
      const scheduled = new Date(v.scheduled_start as string);
      const diffMinutes = (checkIn.getTime() - scheduled.getTime()) / (1000 * 60);
      return diffMinutes >= -15 && diffMinutes <= 15;
    }).length;
    data.onTimeArrivalRate = completedCount > 0 ? (onTimeVisits / completedCount) * 100 : 0;

    // Caregiver metrics
    const caregiversQuery = this.db('users')
      .where('role', 'caregiver')
      .where('is_deleted', false);
    const caregivers = await applyFilters(caregiversQuery);
    data.totalCaregivers = caregivers.length;

    // Active caregivers (those with visits in period)
    const caregiverIds = [...new Set(visits.map((v: Record<string, unknown>) => v.assigned_caregiver_id))];
    data.activeCaregivers = caregiverIds.filter((id) => id != null).length;

    // Client metrics
    const clientsQuery = this.db('clients').where('is_deleted', false);
    const clients = await applyFilters(clientsQuery);
    data.totalClients = clients.length;
    data.activeClients = clients.filter((c: Record<string, unknown>) => c.status === 'active').length;

    // Documentation completeness (visit notes)
    const notesQuery = this.db('visit_notes')
      .where('is_deleted', false)
      .whereBetween('created_at', [startDate, endDate]);
    const visitNotes = await notesQuery;
    data.visitsWithNotes = visitNotes.length;
    data.documentationRate = completedCount > 0 ? (visitNotes.length / completedCount) * 100 : 0;

    // Care plan metrics
    const carePlansQuery = this.db('care_plans').where('is_deleted', false);
    const carePlans = await applyFilters(carePlansQuery);
    data.totalCarePlans = carePlans.length;
    data.activeCarePlans = carePlans.filter((cp: Record<string, unknown>) => cp.status === 'active').length;

    // Task completion (care plan tasks)
    const tasksQuery = this.db('care_plan_tasks')
      .where('is_deleted', false)
      .whereBetween('updated_at', [startDate, endDate]);
    const tasks = await tasksQuery;
    data.totalTasks = tasks.length;
    data.completedTasks = tasks.filter((t: Record<string, unknown>) => t.status === 'completed').length;
    const taskCount = Number(data.totalTasks ?? 0);
    data.taskCompletionRate = taskCount > 0 ? (Number(data.completedTasks) / taskCount) * 100 : 0;

    // Incident reports
    const incidentsQuery = this.db('incidents')
      .where('is_deleted', false)
      .whereBetween('created_at', [startDate, endDate]);
    const incidents = await applyFilters(incidentsQuery);
    data.totalIncidents = incidents.length;
    data.resolvedIncidents = incidents.filter((i: Record<string, unknown>) => i.status === 'resolved').length;

    // Credential status
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const expiringCredsQuery = this.db('caregiver_credentials')
      .where('is_deleted', false)
      .where('expiration_date', '<=', futureDate)
      .where('expiration_date', '>=', new Date());
    const expiringCreds = await expiringCredsQuery;
    data.expiringCredentials = expiringCreds.length;

    // Recent feedback/complaints sample
    const feedbackQuery = this.db('visit_notes')
      .where('is_deleted', false)
      .whereBetween('created_at', [startDate, endDate])
      .orderBy('created_at', 'desc')
      .limit(20);
    const recentNotes = await feedbackQuery;
    data.recentNotesSample = recentNotes.slice(0, 10).map((n: Record<string, unknown>) => ({
      date: n.created_at,
      content: String(n.content ?? '').slice(0, 300),
    }));

    return data;
  }

  private calculateDomainScores(data: Record<string, unknown>): Record<QualityDomain, number> {
    // Calculate score for each domain (0-100)
    const scores: Record<QualityDomain, number> = {
      CARE_DELIVERY: 0,
      DOCUMENTATION: 0,
      COMPLIANCE: 0,
      CLIENT_OUTCOMES: 0,
      CAREGIVER_PERFORMANCE: 0,
      SCHEDULING_EFFICIENCY: 0,
      COMMUNICATION: 0,
      SAFETY: 0,
    };

    // Care Delivery: visit completion, task completion
    const visitCompletion = Number(data.visitCompletionRate ?? 0);
    const taskCompletion = Number(data.taskCompletionRate ?? 0);
    scores.CARE_DELIVERY = (visitCompletion + taskCompletion) / 2;

    // Documentation: documentation rate
    scores.DOCUMENTATION = Number(data.documentationRate ?? 0);

    // Compliance: EVV compliance, credential status
    const evvCompliance = Number(data.evvComplianceRate ?? 0);
    const totalCaregivers = Number(data.totalCaregivers ?? 1);
    const expiringCreds = Number(data.expiringCredentials ?? 0);
    const credentialHealth = Math.max(0, 100 - (expiringCreds / totalCaregivers) * 100);
    scores.COMPLIANCE = (evvCompliance + credentialHealth) / 2;

    // Client Outcomes: based on care plan status and incidents
    const activeClients = Number(data.activeClients ?? 0);
    const incidents = Number(data.totalIncidents ?? 0);
    const incidentRate = activeClients > 0 ? (incidents / activeClients) * 100 : 0;
    scores.CLIENT_OUTCOMES = Math.max(0, 100 - incidentRate * 5);

    // Caregiver Performance: on-time arrival, visit completion
    const onTimeRate = Number(data.onTimeArrivalRate ?? 0);
    scores.CAREGIVER_PERFORMANCE = (onTimeRate + visitCompletion) / 2;

    // Scheduling Efficiency: missed/cancelled vs total
    const totalVisits = Number(data.totalVisits ?? 1);
    const missed = Number(data.missedVisits ?? 0);
    const cancelled = Number(data.cancelledVisits ?? 0);
    const inefficiencyRate = ((missed + cancelled) / totalVisits) * 100;
    scores.SCHEDULING_EFFICIENCY = Math.max(0, 100 - inefficiencyRate * 2);

    // Communication: documentation + care plan coverage
    const activeClientsCount = Number(data.activeClients ?? 1);
    const activeCarePlans = Number(data.activeCarePlans ?? 0);
    const carePlanCoverage = (activeCarePlans / activeClientsCount) * 100;
    scores.COMMUNICATION = (Number(data.documentationRate ?? 0) + Math.min(100, carePlanCoverage)) / 2;

    // Safety: inverse of incident rate
    scores.SAFETY = scores.CLIENT_OUTCOMES;

    return scores;
  }

  private async analyzeWithAI(
    data: Record<string, unknown>,
    domains: QualityDomain[] | undefined,
    maxSuggestions: number,
    focusAreas: string[] | undefined,
  ): Promise<ImprovementInitiative[]> {
    const domainFilter = domains && domains.length > 0 ? domains.join(', ') : 'ALL';
    const focusFilter = focusAreas && focusAreas.length > 0 ? focusAreas.join(', ') : 'GENERAL';

    const prompt = `You are a healthcare quality improvement consultant analyzing a home care agency's operational data.

OPERATIONAL DATA:
${JSON.stringify(data, null, 2)}

FOCUS DOMAINS: ${domainFilter}
FOCUS AREAS: ${focusFilter}
MAXIMUM SUGGESTIONS: ${maxSuggestions}

QUALITY DOMAINS TO CONSIDER:
1. CARE_DELIVERY - Visit completion, service quality, care plan adherence
2. DOCUMENTATION - Notes, records, compliance documentation
3. COMPLIANCE - EVV, regulations, credential management
4. CLIENT_OUTCOMES - Health outcomes, satisfaction, safety
5. CAREGIVER_PERFORMANCE - Punctuality, skill, consistency
6. SCHEDULING_EFFICIENCY - Resource utilization, gap minimization
7. COMMUNICATION - Client/family engagement, care coordination
8. SAFETY - Incident prevention, risk management

For each quality improvement initiative, consider:
- Current performance gaps
- Root causes
- Actionable steps
- Expected outcomes
- Resource requirements
- Implementation timeline

Return ONLY valid JSON array of improvement initiatives:
[
  {
    "id": "unique-id",
    "domain": "CARE_DELIVERY|DOCUMENTATION|COMPLIANCE|CLIENT_OUTCOMES|CAREGIVER_PERFORMANCE|SCHEDULING_EFFICIENCY|COMMUNICATION|SAFETY",
    "title": "Concise initiative title",
    "description": "Detailed description of the improvement initiative",
    "rationale": "Why this improvement is needed based on the data",
    "priority": "CRITICAL|HIGH|MEDIUM|LOW",
    "effort": "QUICK_WIN|SHORT_TERM|MEDIUM_TERM|LONG_TERM",
    "estimatedImpact": "Expected impact description",
    "relatedMetrics": [
      {"name": "Metric name", "currentValue": 85, "targetValue": 95, "unit": "%", "trend": "IMPROVING|DECLINING|STABLE", "percentageFromTarget": -10}
    ],
    "actionSteps": [
      {"step": 1, "action": "Action description", "responsible": "Role responsible", "timeline": "Timeline"}
    ],
    "expectedOutcomes": ["Outcome 1", "Outcome 2"],
    "potentialChallenges": ["Challenge 1"],
    "successIndicators": ["Indicator 1"],
    "resourcesNeeded": ["Resource 1"],
    "confidenceScore": 0.0-1.0
  }
]

Prioritize initiatives that:
1. Address critical compliance or safety gaps
2. Have high impact with reasonable effort
3. Are data-driven and measurable
4. Can show quick wins to build momentum

Be specific, actionable, and realistic in your recommendations.`;

    const message = await this.anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 4096,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = message.content[0];
    if (content?.type !== 'text') {
      return [];
    }

    try {
      const initiatives = JSON.parse(content.text) as ImprovementInitiative[];
      return initiatives.map((initiative) => ({
        ...initiative,
        createdAt: new Date().toISOString(),
      }));
    } catch {
      console.error('Failed to parse AI response:', content.text);
      return [];
    }
  }

  private calculatePriorityDistribution(initiatives: ImprovementInitiative[]): {
    critical: number;
    high: number;
    medium: number;
    low: number;
  } {
    const distribution = { critical: 0, high: 0, medium: 0, low: 0 };

    for (const initiative of initiatives) {
      switch (initiative.priority) {
        case 'CRITICAL':
          distribution.critical++;
          break;
        case 'HIGH':
          distribution.high++;
          break;
        case 'MEDIUM':
          distribution.medium++;
          break;
        case 'LOW':
          distribution.low++;
          break;
      }
    }

    return distribution;
  }

  private calculateOverallScore(domainScores: Record<QualityDomain, number>): number {
    const scores = Object.values(domainScores);
    if (scores.length === 0) return 0;
    const average = scores.reduce((a, b) => a + b, 0) / scores.length;
    return Math.round(average * 10) / 10;
  }

  private async generateExecutiveSummary(
    data: Record<string, unknown>,
    initiatives: ImprovementInitiative[],
    qualityScore: number,
  ): Promise<string> {
    const criticalCount = initiatives.filter((i) => i.priority === 'CRITICAL').length;
    const highCount = initiatives.filter((i) => i.priority === 'HIGH').length;
    const quickWins = initiatives.filter((i) => i.effort === 'QUICK_WIN').length;

    const prompt = `Generate a brief executive summary (2-3 sentences) for a quality improvement report.

KEY DATA POINTS:
- Overall Quality Score: ${qualityScore}/100
- Total Improvement Initiatives: ${initiatives.length}
- Critical Priority Items: ${criticalCount}
- High Priority Items: ${highCount}
- Quick Win Opportunities: ${quickWins}
- Visit Completion Rate: ${data.visitCompletionRate}%
- EVV Compliance: ${data.evvComplianceRate}%
- Documentation Rate: ${data.documentationRate}%

Write a professional, actionable summary that highlights key strengths and areas needing attention.
Return only the summary text, no formatting or quotes.`;

    const message = await this.anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 256,
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    if (content?.type !== 'text') {
      return `Quality score of ${qualityScore}/100 with ${initiatives.length} improvement opportunities identified.`;
    }

    return content.text;
  }
}
