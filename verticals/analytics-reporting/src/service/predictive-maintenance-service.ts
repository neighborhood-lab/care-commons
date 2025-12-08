/**
 * Predictive Maintenance Alerts Service
 *
 * AI-powered prediction of operational issues before they become problems.
 * Monitors caregiver burnout risk, client health trends, scheduling conflicts,
 * and compliance issues to enable proactive intervention.
 */

import Anthropic from '@anthropic-ai/sdk';
import type { Knex } from 'knex';

export type AlertCategory =
  | 'CAREGIVER_BURNOUT'
  | 'CLIENT_HEALTH_DECLINE'
  | 'SCHEDULING_CONFLICT'
  | 'COMPLIANCE_RISK'
  | 'STAFFING_SHORTAGE'
  | 'CREDENTIAL_EXPIRATION'
  | 'CARE_PLAN_GAP';

export type AlertSeverity = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
export type AlertUrgency = 'IMMEDIATE' | 'THIS_WEEK' | 'THIS_MONTH' | 'ROUTINE';

export interface PredictiveAlert {
  id: string;
  category: AlertCategory;
  severity: AlertSeverity;
  urgency: AlertUrgency;
  title: string;
  description: string;
  predictedImpact: string;
  confidenceScore: number;
  affectedEntities: Array<{
    type: 'CAREGIVER' | 'CLIENT' | 'VISIT' | 'ORGANIZATION';
    id: string;
    name: string;
  }>;
  recommendedActions: string[];
  dataPoints: Array<{
    metric: string;
    value: string | number;
    trend: 'INCREASING' | 'DECREASING' | 'STABLE';
  }>;
  predictedTimeframe: string;
  createdAt: string;
}

export interface PredictiveMaintenanceRequest {
  organizationId?: string;
  categories?: AlertCategory[];
  lookbackDays?: number;
  minSeverity?: AlertSeverity;
}

export interface PredictiveMaintenanceResult {
  analyzedAt: string;
  organizationId?: string;
  lookbackPeriod: {
    startDate: string;
    endDate: string;
    days: number;
  };
  alerts: PredictiveAlert[];
  summary: {
    totalAlerts: number;
    criticalCount: number;
    highCount: number;
    moderateCount: number;
    lowCount: number;
    byCategory: Record<AlertCategory, number>;
  };
  overallHealthScore: number;
  recommendations: string[];
}

export class PredictiveMaintenanceService {
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
   * Generate predictive maintenance alerts for an organization
   */
  async generateAlerts(request: PredictiveMaintenanceRequest): Promise<PredictiveMaintenanceResult> {
    const lookbackDays = request.lookbackDays ?? 30;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - lookbackDays);

    // Gather data for analysis
    const data = await this.gatherAnalysisData(request.organizationId, startDate, endDate);

    // Use AI to identify patterns and predict issues
    const alerts = await this.analyzeWithAI(data, request.categories, request.minSeverity);

    // Calculate summary
    const summary = this.calculateSummary(alerts);

    // Calculate overall health score
    const overallHealthScore = this.calculateHealthScore(alerts, data);

    // Generate high-level recommendations
    const recommendations = await this.generateRecommendations(alerts, data);

    return {
      analyzedAt: new Date().toISOString(),
      organizationId: request.organizationId,
      lookbackPeriod: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        days: lookbackDays,
      },
      alerts,
      summary,
      overallHealthScore,
      recommendations,
    };
  }

  private async gatherAnalysisData(
    organizationId: string | undefined,
    startDate: Date,
    endDate: Date,
  ): Promise<Record<string, unknown>> {
    const data: Record<string, unknown> = {};

    // Query builder helper
    const orgFilter = (query: Knex.QueryBuilder) => {
      if (organizationId) {
        return query.where('organization_id', organizationId);
      }
      return query;
    };

    // Caregiver metrics
    const caregiverQuery = this.db('users')
      .where('role', 'caregiver')
      .where('is_deleted', false);
    const caregivers = await orgFilter(caregiverQuery);
    data.caregiverCount = caregivers.length;

    // Visit metrics
    const visitsQuery = this.db('visits')
      .where('is_deleted', false)
      .whereBetween('scheduled_start', [startDate, endDate]);
    const visits = await orgFilter(visitsQuery);
    data.totalVisits = visits.length;
    data.completedVisits = visits.filter((v: Record<string, unknown>) => v.status === 'completed').length;
    data.missedVisits = visits.filter((v: Record<string, unknown>) => v.status === 'missed').length;
    data.cancelledVisits = visits.filter((v: Record<string, unknown>) => v.status === 'cancelled').length;

    // Calculate caregiver workload distribution
    const caregiverVisitCounts: Record<string, number> = {};
    for (const visit of visits) {
      const cid = String((visit as Record<string, unknown>).assigned_caregiver_id ?? 'unassigned');
      caregiverVisitCounts[cid] = (caregiverVisitCounts[cid] ?? 0) + 1;
    }
    data.caregiverVisitCounts = caregiverVisitCounts;

    // Calculate average visits per caregiver
    const assignedVisits = Object.values(caregiverVisitCounts);
    if (assignedVisits.length > 0) {
      const avgVisits = assignedVisits.reduce((a, b) => a + b, 0) / assignedVisits.length;
      const maxVisits = Math.max(...assignedVisits);
      const minVisits = Math.min(...assignedVisits);
      data.avgVisitsPerCaregiver = avgVisits;
      data.maxVisitsPerCaregiver = maxVisits;
      data.minVisitsPerCaregiver = minVisits;
      data.workloadVariance = maxVisits - minVisits;
    }

    // Client health indicators
    const clientsQuery = this.db('clients').where('is_deleted', false);
    const clients = await orgFilter(clientsQuery);
    data.activeClients = clients.filter((c: Record<string, unknown>) => c.status === 'active').length;

    // Check for credential expirations (next 30 days)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const expiringCredentialsQuery = this.db('caregiver_credentials')
      .where('is_deleted', false)
      .where('expiration_date', '<=', futureDate)
      .where('expiration_date', '>=', new Date());
    const expiringCredentials = await expiringCredentialsQuery;
    data.expiringCredentials = expiringCredentials.length;

    // Visit notes for sentiment patterns
    const notesQuery = this.db('visit_notes')
      .where('is_deleted', false)
      .whereBetween('created_at', [startDate, endDate])
      .orderBy('created_at', 'desc')
      .limit(100);
    const notes = await notesQuery;
    data.recentNotesCount = notes.length;
    data.recentNotesSample = notes.slice(0, 10).map((n: Record<string, unknown>) => ({
      date: n.created_at,
      content: String(n.content ?? '').slice(0, 200),
    }));

    // EVV compliance metrics
    const evvCompliantVisits = visits.filter(
      (v: Record<string, unknown>) =>
        v.status === 'completed' && v.check_in_time !== null && v.check_out_time !== null,
    ).length;
    const completedVisitCount = Number(data.completedVisits ?? 0);
    data.evvComplianceRate = completedVisitCount > 0 ? (evvCompliantVisits / completedVisitCount) * 100 : 0;

    return data;
  }

  private async analyzeWithAI(
    data: Record<string, unknown>,
    categories?: AlertCategory[],
    minSeverity?: AlertSeverity,
  ): Promise<PredictiveAlert[]> {
    const categoryFilter = categories && categories.length > 0 ? categories.join(', ') : 'ALL';
    const severityOrder = ['CRITICAL', 'HIGH', 'MODERATE', 'LOW'];
    const minSeverityIndex = minSeverity ? severityOrder.indexOf(minSeverity) : severityOrder.length - 1;

    const prompt = `You are an AI analyst for a home care agency. Analyze the following operational data and predict potential issues before they become problems.

OPERATIONAL DATA:
${JSON.stringify(data, null, 2)}

ALERT CATEGORIES TO CONSIDER: ${categoryFilter}

ANALYSIS FRAMEWORK:

1. **CAREGIVER_BURNOUT**: Look for:
   - High workload variance (some caregivers overloaded)
   - Declining visit quality patterns
   - High overtime or consecutive work days
   - Negative sentiment in notes

2. **CLIENT_HEALTH_DECLINE**: Look for:
   - Patterns in visit notes indicating decline
   - Increased care needs
   - Missed visits affecting vulnerable clients
   - Vital signs trends (if available)

3. **SCHEDULING_CONFLICT**: Look for:
   - Uneven caregiver distribution
   - Gap in coverage
   - High cancellation rates
   - Upcoming staffing shortages

4. **COMPLIANCE_RISK**: Look for:
   - EVV compliance rates below 95%
   - Documentation gaps
   - Credential expiration risks
   - Care plan adherence issues

5. **STAFFING_SHORTAGE**: Look for:
   - Caregiver to client ratio issues
   - High visit volumes per caregiver
   - Credential expirations affecting availability

6. **CREDENTIAL_EXPIRATION**: Look for:
   - Credentials expiring in next 30 days
   - Critical certifications at risk

7. **CARE_PLAN_GAP**: Look for:
   - Clients without recent assessments
   - Care plan tasks not being completed
   - Documentation missing

For each predicted issue, assess:
- Severity: CRITICAL (immediate action required), HIGH (action within 24h), MODERATE (action this week), LOW (monitor)
- Confidence: 0-100% based on data strength
- Impact: What will happen if not addressed
- Timeframe: When the issue will likely manifest

Return ONLY valid JSON array of alerts:
[
  {
    "id": "unique-id",
    "category": "CAREGIVER_BURNOUT|CLIENT_HEALTH_DECLINE|SCHEDULING_CONFLICT|COMPLIANCE_RISK|STAFFING_SHORTAGE|CREDENTIAL_EXPIRATION|CARE_PLAN_GAP",
    "severity": "CRITICAL|HIGH|MODERATE|LOW",
    "urgency": "IMMEDIATE|THIS_WEEK|THIS_MONTH|ROUTINE",
    "title": "Brief alert title",
    "description": "Detailed description of the predicted issue",
    "predictedImpact": "What will happen if not addressed",
    "confidenceScore": 0-100,
    "affectedEntities": [
      {"type": "CAREGIVER|CLIENT|VISIT|ORGANIZATION", "id": "entity-id", "name": "Entity Name"}
    ],
    "recommendedActions": ["Action 1", "Action 2"],
    "dataPoints": [
      {"metric": "Metric name", "value": "value", "trend": "INCREASING|DECREASING|STABLE"}
    ],
    "predictedTimeframe": "When the issue will manifest (e.g., 'Next 7 days')"
  }
]

Only include alerts with severity at or above: ${severityOrder[minSeverityIndex]}
Be specific and actionable. Focus on predictive insights, not just current problems.`;

    const message = await this.anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 4096,
      temperature: 0.2,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = message.content[0];
    if (!content || content.type !== 'text') {
      return [];
    }

    try {
      const alerts = JSON.parse(content.text) as PredictiveAlert[];
      // Add createdAt timestamp to each alert
      return alerts.map((alert) => ({
        ...alert,
        createdAt: new Date().toISOString(),
      }));
    } catch {
      console.error('Failed to parse AI response:', content.text);
      return [];
    }
  }

  private calculateSummary(alerts: PredictiveAlert[]): PredictiveMaintenanceResult['summary'] {
    const byCategory: Record<AlertCategory, number> = {
      CAREGIVER_BURNOUT: 0,
      CLIENT_HEALTH_DECLINE: 0,
      SCHEDULING_CONFLICT: 0,
      COMPLIANCE_RISK: 0,
      STAFFING_SHORTAGE: 0,
      CREDENTIAL_EXPIRATION: 0,
      CARE_PLAN_GAP: 0,
    };

    let criticalCount = 0;
    let highCount = 0;
    let moderateCount = 0;
    let lowCount = 0;

    for (const alert of alerts) {
      byCategory[alert.category] = (byCategory[alert.category] ?? 0) + 1;
      switch (alert.severity) {
        case 'CRITICAL':
          criticalCount++;
          break;
        case 'HIGH':
          highCount++;
          break;
        case 'MODERATE':
          moderateCount++;
          break;
        case 'LOW':
          lowCount++;
          break;
      }
    }

    return {
      totalAlerts: alerts.length,
      criticalCount,
      highCount,
      moderateCount,
      lowCount,
      byCategory,
    };
  }

  private calculateHealthScore(alerts: PredictiveAlert[], data: Record<string, unknown>): number {
    // Start with perfect score
    let score = 100;

    // Deduct based on alert severity
    for (const alert of alerts) {
      switch (alert.severity) {
        case 'CRITICAL':
          score -= 15;
          break;
        case 'HIGH':
          score -= 10;
          break;
        case 'MODERATE':
          score -= 5;
          break;
        case 'LOW':
          score -= 2;
          break;
      }
    }

    // Deduct based on operational metrics
    const evvRate = Number(data.evvComplianceRate ?? 100);
    if (evvRate < 95) score -= 10;
    if (evvRate < 90) score -= 10;

    const missedRate =
      Number(data.totalVisits) > 0
        ? (Number(data.missedVisits ?? 0) / Number(data.totalVisits)) * 100
        : 0;
    if (missedRate > 5) score -= 10;
    if (missedRate > 10) score -= 10;

    const expiringCreds = Number(data.expiringCredentials ?? 0);
    if (expiringCreds > 0) score -= 5;
    if (expiringCreds > 5) score -= 5;

    // Ensure score is between 0-100
    return Math.max(0, Math.min(100, score));
  }

  private async generateRecommendations(
    alerts: PredictiveAlert[],
    _data: Record<string, unknown>,
  ): Promise<string[]> {
    if (alerts.length === 0) {
      return ['Continue monitoring key metrics', 'Maintain current operational practices'];
    }

    // Group alerts by category
    const categories = [...new Set(alerts.map((a) => a.category))];

    const recommendations: string[] = [];

    for (const category of categories) {
      const categoryAlerts = alerts.filter((a) => a.category === category);
      const highPriorityCount = categoryAlerts.filter(
        (a) => a.severity === 'CRITICAL' || a.severity === 'HIGH',
      ).length;

      switch (category) {
        case 'CAREGIVER_BURNOUT':
          if (highPriorityCount > 0) {
            recommendations.push('Schedule immediate check-ins with at-risk caregivers');
            recommendations.push('Review and redistribute workload to prevent burnout');
          }
          break;
        case 'CLIENT_HEALTH_DECLINE':
          if (highPriorityCount > 0) {
            recommendations.push('Prioritize care coordination for flagged clients');
            recommendations.push('Schedule family conferences to discuss care plan updates');
          }
          break;
        case 'SCHEDULING_CONFLICT':
          recommendations.push('Review scheduling algorithms and coverage gaps');
          break;
        case 'COMPLIANCE_RISK':
          recommendations.push('Audit EVV compliance and address documentation gaps');
          break;
        case 'STAFFING_SHORTAGE':
          recommendations.push('Begin recruitment for additional caregivers');
          break;
        case 'CREDENTIAL_EXPIRATION':
          recommendations.push('Send renewal reminders to affected staff');
          break;
        case 'CARE_PLAN_GAP':
          recommendations.push('Schedule care plan reviews for flagged clients');
          break;
      }
    }

    // Add general recommendations based on alert count
    if (alerts.filter((a) => a.severity === 'CRITICAL').length > 0) {
      recommendations.unshift('URGENT: Address critical alerts within 24 hours');
    }

    return recommendations.slice(0, 5);
  }
}
