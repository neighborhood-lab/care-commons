/**
 * Churn Prediction Service
 *
 * AI-powered churn prediction for patients and caregivers:
 * - Client churn: Predicts likelihood of clients discontinuing services
 * - Caregiver churn: Predicts likelihood of caregivers leaving
 *
 * Analyzes engagement patterns, service utilization, satisfaction signals,
 * and historical churn data to identify at-risk individuals.
 */

import Anthropic from '@anthropic-ai/sdk';
import type { Knex } from 'knex';

export interface ChurnPredictionRequest {
  organizationId: string;
  branchId?: string;
  entityType: 'CLIENT' | 'CAREGIVER' | 'BOTH';
  entityId?: string; // Optional: specific client or caregiver ID
  lookbackDays?: number;
}

export type ChurnRiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type ChurnConfidence = 'HIGH' | 'MEDIUM' | 'LOW';

export interface RiskFactor {
  factor: string;
  impact: 'MAJOR' | 'MODERATE' | 'MINOR';
  description: string;
  mitigationAction?: string;
}

export interface ClientChurnPrediction {
  clientId: string;
  clientName: string;
  riskLevel: ChurnRiskLevel;
  churnProbability: number; // 0-100
  confidence: ChurnConfidence;
  riskFactors: RiskFactor[];
  lastVisitDate: string | null;
  daysSinceLastVisit: number;
  totalVisits30Days: number;
  recommendedActions: string[];
}

export interface CaregiverChurnPrediction {
  caregiverId: string;
  caregiverName: string;
  riskLevel: ChurnRiskLevel;
  churnProbability: number; // 0-100
  confidence: ChurnConfidence;
  riskFactors: RiskFactor[];
  employmentDays: number;
  averageHoursPerWeek: number;
  recentTrend: 'INCREASING' | 'STABLE' | 'DECREASING';
  recommendedActions: string[];
}

export interface ChurnPredictionResult {
  organizationId: string;
  predictionDate: string;
  lookbackDays: number;
  clientChurn: {
    totalAnalyzed: number;
    atRisk: number;
    predictions: ClientChurnPrediction[];
  };
  caregiverChurn: {
    totalAnalyzed: number;
    atRisk: number;
    predictions: CaregiverChurnPrediction[];
  };
  summary: {
    overallClientChurnRisk: ChurnRiskLevel;
    overallCaregiverChurnRisk: ChurnRiskLevel;
    topRiskFactors: string[];
    recommendations: string[];
  };
  reasoning: string;
  generatedAt: string;
}

export class ChurnPredictionService {
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
   * Predict churn for clients and/or caregivers
   */
  async predictChurn(
    request: ChurnPredictionRequest
  ): Promise<ChurnPredictionResult> {
    const { organizationId, branchId, entityType, entityId, lookbackDays = 90 } = request;

    // Fetch client engagement data
    const clientData = entityType !== 'CAREGIVER'
      ? await this.getClientEngagementData(organizationId, branchId, entityId, lookbackDays)
      : { clients: [], metrics: {} };

    // Fetch caregiver engagement data
    const caregiverData = entityType !== 'CLIENT'
      ? await this.getCaregiverEngagementData(organizationId, branchId, entityId, lookbackDays)
      : { caregivers: [], metrics: {} };

    // Fetch historical churn data for pattern matching
    const historicalChurn = await this.getHistoricalChurn(organizationId, lookbackDays);

    // Build analysis prompt
    const prompt = this.buildChurnPrompt(
      clientData,
      caregiverData,
      historicalChurn,
      entityType,
      lookbackDays
    );

    // Call Claude AI
    const message = await this.anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 3000,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Parse AI response
    const content = message.content[0];
    if (content?.type !== 'text') {
      throw new Error('Unexpected response type from AI');
    }

    let predictionResult: Partial<ChurnPredictionResult>;
    try {
      predictionResult = JSON.parse(content.text);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content.text, parseError);
      throw new Error('Failed to parse churn prediction');
    }

    // Build result
    const result: ChurnPredictionResult = {
      organizationId,
      predictionDate: new Date().toISOString().split('T')[0] ?? '',
      lookbackDays,
      clientChurn: {
        totalAnalyzed: clientData.clients.length,
        atRisk: predictionResult.clientChurn?.atRisk ?? 0,
        predictions: predictionResult.clientChurn?.predictions ?? [],
      },
      caregiverChurn: {
        totalAnalyzed: caregiverData.caregivers.length,
        atRisk: predictionResult.caregiverChurn?.atRisk ?? 0,
        predictions: predictionResult.caregiverChurn?.predictions ?? [],
      },
      summary: predictionResult.summary ?? {
        overallClientChurnRisk: 'LOW',
        overallCaregiverChurnRisk: 'LOW',
        topRiskFactors: [],
        recommendations: [],
      },
      reasoning: predictionResult.reasoning ?? 'No reasoning available.',
      generatedAt: new Date().toISOString(),
    };

    return result;
  }

  /**
   * Get client engagement data for churn analysis
   */
  private async getClientEngagementData(
    organizationId: string,
    branchId: string | undefined,
    specificClientId: string | undefined,
    lookbackDays: number
  ): Promise<{
    clients: Array<{
      id: string;
      name: string;
      status: string;
      startDate: string;
      lastVisitDate: string | null;
      totalVisits: number;
      recentVisits: number;
      missedVisits: number;
      avgVisitDuration: number;
    }>;
    metrics: Record<string, unknown>;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - lookbackDays);
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 30);

    let clientQuery = this.db('clients')
      .select(
        'clients.id',
        'clients.first_name',
        'clients.last_name',
        'clients.status',
        'clients.created_at as start_date',
        this.db.raw('MAX(v.scheduled_date) as last_visit_date'),
        this.db.raw('COUNT(DISTINCT v.id) as total_visits'),
        this.db.raw(`COUNT(DISTINCT CASE WHEN v.scheduled_date >= ? THEN v.id END) as recent_visits`, [recentDate]),
        this.db.raw(`COUNT(DISTINCT CASE WHEN v.status IN ('NO_SHOW_CLIENT', 'CANCELLED_CLIENT') THEN v.id END) as missed_visits`),
        this.db.raw('AVG(v.actual_duration_minutes) as avg_duration')
      )
      .leftJoin('visits as v', (join) => {
        join.on('clients.id', '=', 'v.client_id')
          .andOnVal('v.is_deleted', '=', false)
          .andOn('v.scheduled_date', '>=', this.db.raw('?', [startDate]));
      })
      .where('clients.organization_id', organizationId)
      .where('clients.is_deleted', false)
      .groupBy('clients.id');

    if (branchId) {
      clientQuery = clientQuery.where('clients.branch_id', branchId);
    }

    if (specificClientId) {
      clientQuery = clientQuery.where('clients.id', specificClientId);
    }

    const rows = await clientQuery;

    const clients = rows.map((row: Record<string, unknown>) => ({
      id: String(row.id),
      name: `${String(row.first_name)} ${String(row.last_name)}`,
      status: String(row.status),
      startDate: String(row.start_date).split('T')[0] ?? '',
      lastVisitDate: row.last_visit_date ? String(row.last_visit_date).split('T')[0] ?? null : null,
      totalVisits: Number(row.total_visits) || 0,
      recentVisits: Number(row.recent_visits) || 0,
      missedVisits: Number(row.missed_visits) || 0,
      avgVisitDuration: Number(row.avg_duration) || 0,
    }));

    return {
      clients,
      metrics: {
        totalClients: clients.length,
        activeWithRecent: clients.filter(c => c.recentVisits > 0).length,
        noRecentVisits: clients.filter(c => c.recentVisits === 0 && c.totalVisits > 0).length,
      },
    };
  }

  /**
   * Get caregiver engagement data for churn analysis
   */
  private async getCaregiverEngagementData(
    organizationId: string,
    branchId: string | undefined,
    specificCaregiverId: string | undefined,
    lookbackDays: number
  ): Promise<{
    caregivers: Array<{
      id: string;
      name: string;
      status: string;
      hireDate: string;
      lastVisitDate: string | null;
      totalVisits: number;
      recentVisits: number;
      avgHoursPerWeek: number;
      cancelledVisits: number;
    }>;
    metrics: Record<string, unknown>;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - lookbackDays);
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 30);

    let caregiverQuery = this.db('caregivers')
      .select(
        'caregivers.id',
        'caregivers.first_name',
        'caregivers.last_name',
        'caregivers.status',
        'caregivers.hire_date',
        this.db.raw('MAX(v.scheduled_date) as last_visit_date'),
        this.db.raw('COUNT(DISTINCT v.id) as total_visits'),
        this.db.raw(`COUNT(DISTINCT CASE WHEN v.scheduled_date >= ? THEN v.id END) as recent_visits`, [recentDate]),
        this.db.raw('AVG(v.actual_duration_minutes) / 60.0 * 5.0 as avg_hours_per_week'),
        this.db.raw(`COUNT(DISTINCT CASE WHEN v.status = 'CANCELLED_CAREGIVER' OR v.status = 'NO_SHOW_CAREGIVER' THEN v.id END) as cancelled_visits`)
      )
      .leftJoin('visits as v', (join) => {
        join.on('caregivers.id', '=', 'v.assigned_caregiver_id')
          .andOnVal('v.is_deleted', '=', false)
          .andOn('v.scheduled_date', '>=', this.db.raw('?', [startDate]));
      })
      .where('caregivers.organization_id', organizationId)
      .where('caregivers.deleted_at', null)
      .groupBy('caregivers.id');

    if (branchId) {
      caregiverQuery = caregiverQuery.whereRaw('? = ANY(caregivers.branch_ids)', [branchId]);
    }

    if (specificCaregiverId) {
      caregiverQuery = caregiverQuery.where('caregivers.id', specificCaregiverId);
    }

    const rows = await caregiverQuery;

    const caregivers = rows.map((row: Record<string, unknown>) => ({
      id: String(row.id),
      name: `${String(row.first_name)} ${String(row.last_name)}`,
      status: String(row.status),
      hireDate: row.hire_date ? String(row.hire_date).split('T')[0] ?? '' : '',
      lastVisitDate: row.last_visit_date ? String(row.last_visit_date).split('T')[0] ?? null : null,
      totalVisits: Number(row.total_visits) || 0,
      recentVisits: Number(row.recent_visits) || 0,
      avgHoursPerWeek: Number(row.avg_hours_per_week) || 0,
      cancelledVisits: Number(row.cancelled_visits) || 0,
    }));

    return {
      caregivers,
      metrics: {
        totalCaregivers: caregivers.length,
        activeWithRecent: caregivers.filter(c => c.recentVisits > 0).length,
        noRecentVisits: caregivers.filter(c => c.recentVisits === 0).length,
      },
    };
  }

  /**
   * Get historical churn data
   */
  private async getHistoricalChurn(
    organizationId: string,
    lookbackDays: number
  ): Promise<{
    clientsChurned: number;
    caregiversChurned: number;
    avgClientTenure: number;
    avgCaregiverTenure: number;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - lookbackDays);

    // Count clients who became inactive
    const clientChurnResult = await this.db('clients')
      .where('organization_id', organizationId)
      .where('status', 'INACTIVE')
      .where('updated_at', '>=', startDate)
      .count('id as count');

    // Count caregivers who left
    const caregiverChurnResult = await this.db('caregivers')
      .where('organization_id', organizationId)
      .whereIn('status', ['TERMINATED', 'RESIGNED', 'INACTIVE'])
      .where('updated_at', '>=', startDate)
      .count('id as count');

    // Get average tenure for churned clients
    const clientTenureResult = await this.db('clients')
      .where('organization_id', organizationId)
      .where('status', 'INACTIVE')
      .select(this.db.raw('AVG(EXTRACT(DAY FROM (updated_at - created_at))) as avg_tenure'));

    // Get average tenure for churned caregivers
    const caregiverTenureResult = await this.db('caregivers')
      .where('organization_id', organizationId)
      .whereIn('status', ['TERMINATED', 'RESIGNED', 'INACTIVE'])
      .whereNotNull('hire_date')
      .select(this.db.raw('AVG(EXTRACT(DAY FROM (updated_at - hire_date))) as avg_tenure'));

    return {
      clientsChurned: Number(clientChurnResult[0]?.count) || 0,
      caregiversChurned: Number(caregiverChurnResult[0]?.count) || 0,
      avgClientTenure: Number(clientTenureResult[0]?.avg_tenure) || 0,
      avgCaregiverTenure: Number(caregiverTenureResult[0]?.avg_tenure) || 0,
    };
  }

  /**
   * Build churn prediction prompt for Claude
   */
  private buildChurnPrompt(
    clientData: {
      clients: Array<{
        id: string;
        name: string;
        status: string;
        startDate: string;
        lastVisitDate: string | null;
        totalVisits: number;
        recentVisits: number;
        missedVisits: number;
        avgVisitDuration: number;
      }>;
      metrics: Record<string, unknown>;
    },
    caregiverData: {
      caregivers: Array<{
        id: string;
        name: string;
        status: string;
        hireDate: string;
        lastVisitDate: string | null;
        totalVisits: number;
        recentVisits: number;
        avgHoursPerWeek: number;
        cancelledVisits: number;
      }>;
      metrics: Record<string, unknown>;
    },
    historicalChurn: {
      clientsChurned: number;
      caregiversChurned: number;
      avgClientTenure: number;
      avgCaregiverTenure: number;
    },
    entityType: 'CLIENT' | 'CAREGIVER' | 'BOTH',
    lookbackDays: number
  ): string {
    const now = new Date();

    // Format client data
    const clientSummary = clientData.clients.length > 0
      ? clientData.clients.slice(0, 20).map(c => {
          const daysSinceVisit = c.lastVisitDate
            ? Math.floor((now.getTime() - new Date(c.lastVisitDate).getTime()) / (1000 * 60 * 60 * 24))
            : 999;
          return `${c.name} (ID: ${c.id}): Status ${c.status}, ${c.recentVisits} recent visits, ${c.missedVisits} missed, last visit ${daysSinceVisit} days ago`;
        }).join('\n')
      : 'No client data';

    // Format caregiver data
    const caregiverSummary = caregiverData.caregivers.length > 0
      ? caregiverData.caregivers.slice(0, 20).map(c => {
          const daysEmployed = c.hireDate
            ? Math.floor((now.getTime() - new Date(c.hireDate).getTime()) / (1000 * 60 * 60 * 24))
            : 0;
          return `${c.name} (ID: ${c.id}): Status ${c.status}, ${daysEmployed} days employed, ${c.avgHoursPerWeek.toFixed(1)} hrs/week avg, ${c.cancelledVisits} cancellations`;
        }).join('\n')
      : 'No caregiver data';

    return `You are a healthcare analytics expert specializing in churn prediction for home health agencies. Analyze the following data to identify clients and caregivers at risk of churning (discontinuing services or leaving employment).

**ANALYSIS PARAMETERS:**
- Lookback Period: ${lookbackDays} days
- Entity Type: ${entityType}

**HISTORICAL CHURN PATTERNS:**
- Clients Churned (last ${lookbackDays} days): ${historicalChurn.clientsChurned}
- Caregivers Churned (last ${lookbackDays} days): ${historicalChurn.caregiversChurned}
- Average Client Tenure Before Churn: ${historicalChurn.avgClientTenure.toFixed(0)} days
- Average Caregiver Tenure Before Churn: ${historicalChurn.avgCaregiverTenure.toFixed(0)} days

**CLIENT DATA (${clientData.clients.length} total):**
${clientSummary}

**CAREGIVER DATA (${caregiverData.caregivers.length} total):**
${caregiverSummary}

**CHURN RISK INDICATORS:**

For Clients:
- Declining visit frequency
- Increased missed/cancelled visits
- Long gap since last visit
- Short tenure with low engagement
- Service satisfaction signals

For Caregivers:
- Declining work hours
- Increased cancellations/no-shows
- Long gap since last assignment
- Short tenure (<6 months)
- Scheduling pattern changes

**RISK LEVELS:**
- CRITICAL: >80% churn probability, immediate action needed
- HIGH: 60-80% probability, action within 2 weeks
- MEDIUM: 40-60% probability, monitor closely
- LOW: <40% probability, normal engagement

**RESPONSE FORMAT (JSON):**
Return ONLY valid JSON with this structure:
{
  "clientChurn": {
    "atRisk": 3,
    "predictions": [
      {
        "clientId": "uuid",
        "clientName": "John Doe",
        "riskLevel": "HIGH",
        "churnProbability": 72,
        "confidence": "MEDIUM",
        "riskFactors": [
          {
            "factor": "Declining Visits",
            "impact": "MAJOR",
            "description": "Visit frequency dropped 50% in last 30 days",
            "mitigationAction": "Schedule care coordinator call"
          }
        ],
        "lastVisitDate": "2025-01-01",
        "daysSinceLastVisit": 45,
        "totalVisits30Days": 2,
        "recommendedActions": ["Schedule welfare check", "Review care plan needs"]
      }
    ]
  },
  "caregiverChurn": {
    "atRisk": 2,
    "predictions": [
      {
        "caregiverId": "uuid",
        "caregiverName": "Jane Smith",
        "riskLevel": "MEDIUM",
        "churnProbability": 55,
        "confidence": "MEDIUM",
        "riskFactors": [
          {
            "factor": "Hours Decline",
            "impact": "MODERATE",
            "description": "Weekly hours dropped from 30 to 20",
            "mitigationAction": "Discuss schedule preferences"
          }
        ],
        "employmentDays": 180,
        "averageHoursPerWeek": 20,
        "recentTrend": "DECREASING",
        "recommendedActions": ["One-on-one meeting", "Review compensation"]
      }
    ]
  },
  "summary": {
    "overallClientChurnRisk": "MEDIUM",
    "overallCaregiverChurnRisk": "LOW",
    "topRiskFactors": ["Declining engagement", "Scheduling gaps"],
    "recommendations": ["Implement monthly check-ins", "Review scheduling efficiency"]
  },
  "reasoning": "Analysis of ${clientData.clients.length} clients and ${caregiverData.caregivers.length} caregivers shows..."
}

Analyze the data and generate churn predictions now:`;
  }
}
