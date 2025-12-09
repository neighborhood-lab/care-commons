/**
 * Optimal Visit Frequency Service
 *
 * AI-powered recommendation of optimal visit frequency per client based on:
 * - Current health status and acuity level
 * - Care plan requirements and goals
 * - Historical visit patterns and outcomes
 * - Risk indicators (hospitalizations, falls, declining vitals)
 * - Regulatory requirements by payer/program
 *
 * This helps care coordinators optimize care delivery while balancing
 * client needs, caregiver availability, and cost efficiency.
 */

import Anthropic from '@anthropic-ai/sdk';
import type { Knex } from 'knex';

export interface FrequencyRecommendationRequest {
  clientId: string;
  organizationId: string;
  includeHistoricalAnalysis?: boolean;
  includeRiskFactors?: boolean;
}

export type UrgencyLevel = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'ROUTINE' | 'MAINTENANCE';

export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface VisitTypeFrequency {
  visitType: string;
  currentWeeklyVisits: number;
  recommendedWeeklyVisits: number;
  minimumWeeklyVisits: number;
  maximumWeeklyVisits: number;
  rationale: string;
  changeDirection: 'INCREASE' | 'DECREASE' | 'MAINTAIN';
  changeUrgency: UrgencyLevel;
}

export interface RiskFactor {
  category: string;
  indicator: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  impactOnFrequency: 'INCREASES' | 'DECREASES' | 'NEUTRAL';
  recommendation: string;
}

export interface CostImpact {
  currentWeeklyCost: number;
  recommendedWeeklyCost: number;
  annualDifference: number;
  costJustification: string;
}

export interface OptimalFrequencyRecommendation {
  clientId: string;
  organizationId: string;
  overallUrgency: UrgencyLevel;
  confidence: ConfidenceLevel;
  visitTypeRecommendations: VisitTypeFrequency[];
  riskFactors: RiskFactor[];
  costImpact: CostImpact;
  clinicalRationale: string;
  regulatoryConsiderations: string[];
  reviewRecommendedDate: string;
  generatedAt: string;
}

export class OptimalVisitFrequencyService {
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
   * Generate optimal visit frequency recommendation using Claude AI
   */
  async recommendFrequency(
    request: FrequencyRecommendationRequest
  ): Promise<OptimalFrequencyRecommendation> {
    // Fetch client data
    const client = await this.db('clients')
      .select('*')
      .where({
        id: request.clientId,
        organization_id: request.organizationId,
        is_deleted: false
      })
      .first();

    if (!client) {
      throw new Error('Client not found');
    }

    // Fetch active care plan
    const carePlan = await this.db('care_plans')
      .select('*')
      .where({
        client_id: request.clientId,
        status: 'ACTIVE',
        is_deleted: false
      })
      .first();

    // Fetch care plan tasks
    const carePlanTasks = await this.db('care_plan_tasks')
      .select('*')
      .where({ client_id: request.clientId, is_deleted: false });

    // Fetch recent visits (last 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const ninetyDaysAgoStr = ninetyDaysAgo.toISOString().split('T')[0] ?? '';

    const recentVisits = await this.db('visits')
      .select('visit_type', 'scheduled_date', 'status', 'actual_start_time', 'actual_end_time')
      .where({ client_id: request.clientId, is_deleted: false })
      .andWhere('scheduled_date', '>=', ninetyDaysAgoStr)
      .orderBy('scheduled_date', 'desc');

    // Fetch incident reports (falls, hospitalizations, etc.)
    const incidents = await this.db('incidents')
      .select('incident_type', 'severity', 'occurred_at', 'description')
      .where({ client_id: request.clientId, is_deleted: false })
      .andWhere('occurred_at', '>=', ninetyDaysAgo.toISOString())
      .orderBy('occurred_at', 'desc')
      .limit(20);

    // Fetch recent clinical notes for context
    const clinicalNotes = await this.db('visit_notes')
      .select('note_text', 'note_type', 'created_at')
      .where({ client_id: request.clientId, is_deleted: false })
      .orderBy('created_at', 'desc')
      .limit(10);

    // Fetch service authorization if exists
    const serviceAuth = await this.db('service_authorizations')
      .select('*')
      .where({
        client_id: request.clientId,
        status: 'ACTIVE',
        is_deleted: false
      })
      .first();

    // Build analysis prompt
    const prompt = this.buildFrequencyPrompt(
      client,
      carePlan,
      carePlanTasks,
      recentVisits,
      incidents,
      clinicalNotes,
      serviceAuth,
      request.includeHistoricalAnalysis ?? true,
      request.includeRiskFactors ?? true
    );

    // Call Claude AI
    const message = await this.anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 2500,
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

    let recommendationResult: Partial<OptimalFrequencyRecommendation>;
    try {
      const textContent = content as { type: 'text'; text: string };
      recommendationResult = JSON.parse(textContent.text);
    } catch (parseError) {
      const textContent = content as { type: 'text'; text: string };
      console.error('Failed to parse AI response:', textContent.text, parseError);
      throw new Error('Failed to parse optimal frequency recommendation');
    }

    // Build result
    const result: OptimalFrequencyRecommendation = {
      clientId: request.clientId,
      organizationId: request.organizationId,
      overallUrgency: recommendationResult.overallUrgency ?? 'ROUTINE',
      confidence: recommendationResult.confidence ?? 'MEDIUM',
      visitTypeRecommendations: recommendationResult.visitTypeRecommendations ?? [],
      riskFactors: recommendationResult.riskFactors ?? [],
      costImpact: recommendationResult.costImpact ?? {
        currentWeeklyCost: 0,
        recommendedWeeklyCost: 0,
        annualDifference: 0,
        costJustification: 'Cost analysis not available',
      },
      clinicalRationale: recommendationResult.clinicalRationale ?? 'No clinical rationale available.',
      regulatoryConsiderations: recommendationResult.regulatoryConsiderations ?? [],
      reviewRecommendedDate: recommendationResult.reviewRecommendedDate ?? this.getDefaultReviewDate(),
      generatedAt: new Date().toISOString(),
    };

    return result;
  }

  /**
   * Build frequency recommendation prompt for Claude
   */
  private buildFrequencyPrompt(
    client: Record<string, unknown>,
    carePlan: Record<string, unknown> | null,
    carePlanTasks: Array<Record<string, unknown>>,
    recentVisits: Array<Record<string, unknown>>,
    incidents: Array<Record<string, unknown>>,
    clinicalNotes: Array<Record<string, unknown>>,
    serviceAuth: Record<string, unknown> | null,
    includeHistoricalAnalysis: boolean,
    includeRiskFactors: boolean
  ): string {
    const clientName = `${client.first_name} ${client.last_name}`;

    // Calculate current visit frequency by type
    const visitFrequency = this.calculateVisitFrequency(recentVisits);

    // Summarize incidents
    const incidentSummary = incidents.length > 0
      ? incidents.map((i: Record<string, unknown>) =>
          `- ${i.incident_type} (${i.severity}) on ${new Date(i.occurred_at as string).toLocaleDateString()}: ${(i.description as string || '').substring(0, 100)}`
        ).join('\n')
      : 'No incidents reported in the last 90 days';

    // Summarize clinical notes (brief)
    const notesSummary = clinicalNotes.length > 0
      ? clinicalNotes.slice(0, 5).map((n: Record<string, unknown>) =>
          `- ${n.note_type} (${new Date(n.created_at as string).toLocaleDateString()}): ${(n.note_text as string || '').substring(0, 150)}...`
        ).join('\n')
      : 'No recent clinical notes';

    // Format care plan tasks
    const taskList = carePlanTasks.length > 0
      ? carePlanTasks.map((t: Record<string, unknown>) =>
          `- ${t.task_name} (${t.frequency || 'unspecified frequency'}, priority: ${t.priority || 'normal'})`
        ).join('\n')
      : 'No care plan tasks defined';

    // Service authorization limits
    const authLimits = serviceAuth
      ? `Authorized: ${serviceAuth.authorized_hours_per_week || 'N/A'} hours/week, ${serviceAuth.authorized_visits_per_week || 'N/A'} visits/week, valid until ${serviceAuth.end_date || 'N/A'}`
      : 'No active service authorization found';

    return `You are a home health care coordinator expert analyzing client data to recommend optimal visit frequency. Your goal is to ensure adequate care while optimizing resource utilization.

**CLIENT PROFILE:**
- Name: ${clientName}
- Age: ${this.calculateAge(client.date_of_birth as string) || 'Unknown'}
- Acuity Level: ${client.acuity_level || 'Not specified'}
- Primary Diagnosis: ${client.primary_diagnosis || 'Not specified'}
- Mobility Status: ${client.mobility_status || 'Not specified'}
- Cognitive Status: ${client.cognitive_status || 'Not specified'}
- Living Situation: ${client.living_situation || 'Not specified'}
- Emergency Contact: ${client.emergency_contact ? 'Yes' : 'No'}

**CURRENT CARE PLAN:**
${carePlan ? `
- Status: ${carePlan.status}
- Start Date: ${carePlan.start_date}
- Goals: ${carePlan.goals || 'Not specified'}
- Review Date: ${carePlan.next_review_date || 'Not scheduled'}
` : 'No active care plan'}

**CARE PLAN TASKS:**
${taskList}

**CURRENT VISIT FREQUENCY (Last 90 Days):**
${visitFrequency}

**SERVICE AUTHORIZATION:**
${authLimits}

${includeRiskFactors ? `
**INCIDENT HISTORY (Last 90 Days):**
${incidentSummary}
` : ''}

${includeHistoricalAnalysis ? `
**RECENT CLINICAL NOTES:**
${notesSummary}
` : ''}

**FREQUENCY GUIDELINES BY ACUITY:**

1. **Critical Acuity (Hospice/Complex Medical):**
   - Skilled Nursing: 3-7 visits/week
   - Personal Care: Daily
   - Total: 10-14 visits/week

2. **High Acuity (Post-Hospital, Chronic Unstable):**
   - Skilled Nursing: 2-3 visits/week
   - Personal Care: 5-7 visits/week
   - Total: 7-10 visits/week

3. **Moderate Acuity (Chronic Stable, ADL Dependent):**
   - Skilled Nursing: 1-2 visits/week
   - Personal Care: 3-5 visits/week
   - Total: 4-7 visits/week

4. **Low Acuity (Supervision, Light Assistance):**
   - Skilled Nursing: PRN or monthly
   - Personal Care: 1-3 visits/week
   - Total: 1-4 visits/week

5. **Maintenance (Monitoring Only):**
   - Skilled Nursing: Monthly or PRN
   - Companion/Check-in: 1-2 visits/week
   - Total: 1-2 visits/week

**RISK FACTORS TO CONSIDER:**
- Recent hospitalization → Increase frequency for 2-4 weeks
- Falls in last 90 days → Increase supervision visits
- Declining vitals/weight → Increase skilled nursing
- Cognitive decline → Add companion/supervision visits
- Caregiver burnout risk → Consider respite visits
- Social isolation → Add companion visits

**RESPONSE FORMAT (JSON):**
Return ONLY valid JSON with this exact structure:
{
  "overallUrgency": "MODERATE",
  "confidence": "MEDIUM",
  "visitTypeRecommendations": [
    {
      "visitType": "PERSONAL_CARE",
      "currentWeeklyVisits": 3,
      "recommendedWeeklyVisits": 5,
      "minimumWeeklyVisits": 4,
      "maximumWeeklyVisits": 7,
      "rationale": "Client's declining mobility and recent fall indicate need for increased ADL support",
      "changeDirection": "INCREASE",
      "changeUrgency": "HIGH"
    },
    {
      "visitType": "SKILLED_NURSING",
      "currentWeeklyVisits": 1,
      "recommendedWeeklyVisits": 2,
      "minimumWeeklyVisits": 1,
      "maximumWeeklyVisits": 3,
      "rationale": "Blood pressure monitoring needed twice weekly given recent readings",
      "changeDirection": "INCREASE",
      "changeUrgency": "MODERATE"
    }
  ],
  "riskFactors": [
    {
      "category": "Falls",
      "indicator": "One fall reported in last 30 days",
      "severity": "MEDIUM",
      "impactOnFrequency": "INCREASES",
      "recommendation": "Add daily check-in visits for 2 weeks"
    }
  ],
  "costImpact": {
    "currentWeeklyCost": 450,
    "recommendedWeeklyCost": 650,
    "annualDifference": 10400,
    "costJustification": "Increased visits justified by fall prevention - potential hospital admission costs far exceed care increase"
  },
  "clinicalRationale": "Based on the recent fall, declining mobility assessment scores, and elevated blood pressure readings, this client requires increased visit frequency. The current schedule of 4 weekly visits is insufficient to address safety concerns and manage chronic conditions effectively.",
  "regulatoryConsiderations": [
    "Medicare requires face-to-face encounter documentation for homebound status",
    "Service authorization allows up to 20 hours/week - recommend requesting increase"
  ],
  "reviewRecommendedDate": "2025-01-15"
}

Analyze the client data and provide your optimal visit frequency recommendation:`;
  }

  /**
   * Calculate current visit frequency by type
   */
  private calculateVisitFrequency(visits: Array<Record<string, unknown>>): string {
    if (visits.length === 0) {
      return 'No visits in the last 90 days';
    }

    const frequencyByType: Record<string, number> = {};
    for (const visit of visits) {
      const visitType = visit.visit_type as string || 'UNKNOWN';
      frequencyByType[visitType] = (frequencyByType[visitType] || 0) + 1;
    }

    // Convert to weekly average (90 days ≈ 13 weeks)
    const weeks = 13;
    const lines = Object.entries(frequencyByType).map(([type, count]) => {
      const weeklyAvg = (count / weeks).toFixed(1);
      return `- ${type}: ${count} total (${weeklyAvg}/week avg)`;
    });

    lines.push(`- Total visits: ${visits.length} (${(visits.length / weeks).toFixed(1)}/week avg)`);

    return lines.join('\n');
  }

  /**
   * Calculate age from date of birth
   */
  private calculateAge(dateOfBirth: string): number | null {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birth = new Date(dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }

  /**
   * Get default review date (30 days from now)
   */
  private getDefaultReviewDate(): string {
    const reviewDate = new Date();
    reviewDate.setDate(reviewDate.getDate() + 30);
    return reviewDate.toISOString().split('T')[0] ?? '';
  }
}
