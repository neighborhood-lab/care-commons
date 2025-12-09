/**
 * AI-Powered Caregiver-Patient Matching Service
 *
 * Provides intelligent matching of caregivers to patients based on:
 * - Skills and certifications required vs available
 * - Schedule availability and preferences
 * - Geographic proximity and travel time
 * - Language preferences
 * - Past care history and client preferences
 * - Personality and care style compatibility
 *
 * Uses Claude AI to analyze multiple factors and provide ranked recommendations.
 */

import Anthropic from '@anthropic-ai/sdk';
import type { Knex } from 'knex';

export interface MatchingRequest {
  organizationId: string;
  clientId: string;
  serviceType?: string;
  requiredCertifications?: string[];
  preferredSchedule?: {
    dayOfWeek: number; // 0-6, Sunday = 0
    startTime: string; // HH:mm
    endTime: string; // HH:mm
  }[];
  maxDistanceMiles?: number;
  preferredLanguages?: string[];
  excludeCaregiverIds?: string[];
  maxResults?: number;
}

export type MatchConfidence = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
export type MatchFactor =
  | 'SKILLS_MATCH'
  | 'SCHEDULE_COMPATIBILITY'
  | 'GEOGRAPHIC_PROXIMITY'
  | 'LANGUAGE_MATCH'
  | 'CLIENT_PREFERENCE'
  | 'CARE_CONTINUITY'
  | 'WORKLOAD_BALANCE';

export interface MatchScore {
  factor: MatchFactor;
  score: number; // 0-100
  weight: number; // Factor importance weight
  explanation: string;
}

export interface CaregiverMatch {
  caregiverId: string;
  caregiverName: string;
  overallScore: number; // 0-100 composite score
  confidence: MatchConfidence;
  matchScores: MatchScore[];
  strengths: string[];
  considerations: string[];
  estimatedTravelMinutes?: number;
  currentWeeklyHours: number;
  maxWeeklyHours: number;
  availableHoursThisWeek: number;
}

export interface MatchingResult {
  organizationId: string;
  clientId: string;
  clientName: string;
  serviceType: string;
  matchedCaregivers: CaregiverMatch[];
  totalCandidatesEvaluated: number;
  matchingCriteria: {
    requiredCertifications: string[];
    preferredLanguages: string[];
    maxDistanceMiles: number;
    schedulePreferences: string[];
  };
  recommendations: string[];
  reasoning: string;
  generatedAt: string;
}

export class CaregiverMatchingService {
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
   * Find optimal caregiver matches for a client using AI analysis
   */
  async findMatches(request: MatchingRequest): Promise<MatchingResult> {
    const {
      organizationId,
      clientId,
      serviceType,
      requiredCertifications = [],
      preferredSchedule = [],
      maxDistanceMiles = 25,
      preferredLanguages = [],
      excludeCaregiverIds = [],
      maxResults = 5,
    } = request;

    // Fetch client information
    const client = await this.getClientDetails(clientId);
    if (!client) {
      throw new Error(`Client not found: ${clientId}`);
    }

    // Fetch available caregivers
    const caregivers = await this.getAvailableCaregivers(
      organizationId,
      serviceType,
      excludeCaregiverIds
    );

    if (caregivers.length === 0) {
      return this.emptyResult(organizationId, clientId, client.name, serviceType ?? 'GENERAL');
    }

    // Fetch caregiver workloads
    const workloads = await this.getCaregiverWorkloads(
      organizationId,
      caregivers.map((c) => c.id)
    );

    // Fetch past care assignments for this client
    const pastAssignments = await this.getPastAssignments(clientId);

    // Build matching prompt
    const prompt = this.buildMatchingPrompt(
      client,
      caregivers,
      workloads,
      pastAssignments,
      {
        serviceType: serviceType ?? 'GENERAL',
        requiredCertifications,
        preferredSchedule,
        maxDistanceMiles,
        preferredLanguages,
        maxResults,
      }
    );

    // Call Claude AI
    const message = await this.anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 3000,
      temperature: 0.2,
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

    let matchingResult: Partial<MatchingResult>;
    try {
      matchingResult = JSON.parse(content.text);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content.text, parseError);
      throw new Error('Failed to parse caregiver matching results');
    }

    // Enrich results with database data
    const enrichedMatches = this.enrichMatchResults(
      matchingResult.matchedCaregivers ?? [],
      caregivers,
      workloads
    );

    return {
      organizationId,
      clientId,
      clientName: client.name,
      serviceType: serviceType ?? 'GENERAL',
      matchedCaregivers: enrichedMatches.slice(0, maxResults),
      totalCandidatesEvaluated: caregivers.length,
      matchingCriteria: {
        requiredCertifications,
        preferredLanguages,
        maxDistanceMiles,
        schedulePreferences: preferredSchedule.map(
          (s) => `Day ${s.dayOfWeek}: ${s.startTime}-${s.endTime}`
        ),
      },
      recommendations: matchingResult.recommendations ?? [],
      reasoning: matchingResult.reasoning ?? 'No reasoning provided.',
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Get client details
   */
  private async getClientDetails(clientId: string): Promise<{
    id: string;
    name: string;
    address: string;
    latitude?: number;
    longitude?: number;
    languages: string[];
    preferredCaregivers: string[];
    careNotes: string;
    acuityLevel: string;
  } | null> {
    const client = await this.db('clients')
      .where('id', clientId)
      .where('is_deleted', false)
      .first();

    if (!client) {
      return null;
    }

    return {
      id: client.id,
      name: `${client.first_name} ${client.last_name}`.trim(),
      address: this.formatAddress(client),
      latitude: client.latitude ?? undefined,
      longitude: client.longitude ?? undefined,
      languages: Array.isArray(client.languages) ? client.languages : [],
      preferredCaregivers: Array.isArray(client.preferred_caregiver_ids)
        ? client.preferred_caregiver_ids
        : [],
      careNotes: client.care_notes ?? '',
      acuityLevel: client.acuity_level ?? 'MEDIUM',
    };
  }

  /**
   * Get available caregivers
   */
  private async getAvailableCaregivers(
    organizationId: string,
    serviceType: string | undefined,
    excludeIds: string[]
  ): Promise<
    Array<{
      id: string;
      name: string;
      certifications: string[];
      serviceTypes: string[];
      languages: string[];
      latitude?: number;
      longitude?: number;
      maxHoursPerWeek: number;
      experienceYears: number;
      rating: number;
    }>
  > {
    let query = this.db('caregivers')
      .where('organization_id', organizationId)
      .where('status', 'ACTIVE')
      .where('is_deleted', false);

    if (excludeIds.length > 0) {
      query = query.whereNotIn('id', excludeIds);
    }

    const caregivers = await query.select('*');

    return caregivers
      .filter((c: Record<string, unknown>) => {
        if (!serviceType) return true;
        const types = Array.isArray(c.service_types) ? c.service_types : [];
        return types.includes(serviceType) || types.includes('GENERAL');
      })
      .map((c: Record<string, unknown>) => ({
        id: String(c.id),
        name: `${c.first_name} ${c.last_name}`.trim(),
        certifications: Array.isArray(c.certifications) ? c.certifications : [],
        serviceTypes: Array.isArray(c.service_types) ? c.service_types : [],
        languages: Array.isArray(c.languages) ? c.languages : [],
        latitude: c.latitude as number | undefined,
        longitude: c.longitude as number | undefined,
        maxHoursPerWeek: Number(c.max_hours_per_week) || 40,
        experienceYears: Number(c.experience_years) || 0,
        rating: Number(c.rating) || 4.0,
      }));
  }

  /**
   * Get caregiver workloads for current week
   */
  private async getCaregiverWorkloads(
    organizationId: string,
    caregiverIds: string[]
  ): Promise<Map<string, { scheduledHours: number; visitCount: number }>> {
    const workloadMap = new Map<string, { scheduledHours: number; visitCount: number }>();

    if (caregiverIds.length === 0) {
      return workloadMap;
    }

    const weekStart = this.getWeekStart(new Date());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const workloads = await this.db('visits')
      .select('assigned_caregiver_id')
      .select(this.db.raw('SUM(planned_duration_minutes) / 60.0 as scheduled_hours'))
      .select(this.db.raw('COUNT(*) as visit_count'))
      .where('organization_id', organizationId)
      .whereIn('assigned_caregiver_id', caregiverIds)
      .where('scheduled_date', '>=', weekStart)
      .where('scheduled_date', '<', weekEnd)
      .whereNotIn('status', ['CANCELLED', 'NO_SHOW_CAREGIVER', 'NO_SHOW_CLIENT'])
      .where('is_deleted', false)
      .groupBy('assigned_caregiver_id');

    for (const row of workloads) {
      workloadMap.set(String(row.assigned_caregiver_id), {
        scheduledHours: Number(row.scheduled_hours) || 0,
        visitCount: Number(row.visit_count) || 0,
      });
    }

    // Initialize missing caregivers with zero workload
    for (const id of caregiverIds) {
      if (!workloadMap.has(id)) {
        workloadMap.set(id, { scheduledHours: 0, visitCount: 0 });
      }
    }

    return workloadMap;
  }

  /**
   * Get past care assignments for client
   */
  private async getPastAssignments(
    clientId: string
  ): Promise<Array<{ caregiverId: string; visitCount: number; avgRating: number }>> {
    const assignments = await this.db('visits')
      .select('assigned_caregiver_id')
      .select(this.db.raw('COUNT(*) as visit_count'))
      .select(this.db.raw('AVG(client_rating) as avg_rating'))
      .where('client_id', clientId)
      .where('status', 'COMPLETED')
      .where('is_deleted', false)
      .whereNotNull('assigned_caregiver_id')
      .groupBy('assigned_caregiver_id')
      .orderBy('visit_count', 'desc')
      .limit(10);

    return assignments.map((a: Record<string, unknown>) => ({
      caregiverId: String(a.assigned_caregiver_id),
      visitCount: Number(a.visit_count) || 0,
      avgRating: Number(a.avg_rating) || 0,
    }));
  }

  /**
   * Build matching prompt for Claude AI
   */
  private buildMatchingPrompt(
    client: NonNullable<Awaited<ReturnType<typeof this.getClientDetails>>>,
    caregivers: Array<{
      id: string;
      name: string;
      certifications: string[];
      serviceTypes: string[];
      languages: string[];
      latitude?: number;
      longitude?: number;
      maxHoursPerWeek: number;
      experienceYears: number;
      rating: number;
    }>,
    workloads: Map<string, { scheduledHours: number; visitCount: number }>,
    pastAssignments: Array<{ caregiverId: string; visitCount: number; avgRating: number }>,
    criteria: {
      serviceType: string;
      requiredCertifications: string[];
      preferredSchedule: { dayOfWeek: number; startTime: string; endTime: string }[];
      maxDistanceMiles: number;
      preferredLanguages: string[];
      maxResults: number;
    }
  ): string {
    // Format caregiver data
    const caregiversText = caregivers
      .map((c) => {
        const workload = workloads.get(c.id) ?? { scheduledHours: 0, visitCount: 0 };
        const pastVisits =
          pastAssignments.find((p) => p.caregiverId === c.id)?.visitCount ?? 0;
        const pastRating = pastAssignments.find((p) => p.caregiverId === c.id)?.avgRating ?? 0;

        return `
ID: ${c.id}
Name: ${c.name}
Certifications: ${c.certifications.length > 0 ? c.certifications.join(', ') : 'None listed'}
Service Types: ${c.serviceTypes.join(', ')}
Languages: ${c.languages.length > 0 ? c.languages.join(', ') : 'English'}
Experience: ${c.experienceYears} years
Rating: ${c.rating.toFixed(1)}/5
Current Week: ${workload.scheduledHours.toFixed(1)}hrs scheduled (${workload.visitCount} visits)
Max Hours/Week: ${c.maxHoursPerWeek}
Available Hours: ${Math.max(0, c.maxHoursPerWeek - workload.scheduledHours).toFixed(1)}
Past Care with this Client: ${pastVisits} visits${pastRating > 0 ? ' (avg rating: ' + pastRating.toFixed(1) + ')' : ''}
Location: ${c.latitude && c.longitude ? c.latitude + ', ' + c.longitude : 'Not specified'}`;
      })
      .join('\n---');

    // Format past assignments
    const pastText =
      pastAssignments.length > 0
        ? pastAssignments
            .slice(0, 5)
            .map((p) => `Caregiver ${p.caregiverId}: ${p.visitCount} visits, avg rating ${p.avgRating.toFixed(1)}`)
            .join('\n')
        : 'No previous care history';

    // Format schedule preferences
    const scheduleText =
      criteria.preferredSchedule.length > 0
        ? criteria.preferredSchedule
            .map(
              (s) =>
                `${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][s.dayOfWeek]}: ${s.startTime}-${s.endTime}`
            )
            .join(', ')
        : 'Flexible schedule';

    return `You are a home healthcare scheduling expert. Your task is to match the best caregivers to a client based on multiple factors.

**CLIENT INFORMATION:**
- Name: ${client.name}
- Acuity Level: ${client.acuityLevel}
- Languages Spoken: ${client.languages.length > 0 ? client.languages.join(', ') : 'English'}
- Address: ${client.address}
- Location: ${client.latitude && client.longitude ? `${client.latitude}, ${client.longitude}` : 'Not specified'}
- Care Notes: ${client.careNotes || 'None'}
- Preferred Caregivers: ${client.preferredCaregivers.length > 0 ? client.preferredCaregivers.join(', ') : 'None specified'}

**MATCHING CRITERIA:**
- Service Type: ${criteria.serviceType}
- Required Certifications: ${criteria.requiredCertifications.length > 0 ? criteria.requiredCertifications.join(', ') : 'None required'}
- Preferred Languages: ${criteria.preferredLanguages.length > 0 ? criteria.preferredLanguages.join(', ') : 'No preference'}
- Max Distance: ${criteria.maxDistanceMiles} miles
- Schedule Preferences: ${scheduleText}

**PAST CARE HISTORY WITH THIS CLIENT:**
${pastText}

**AVAILABLE CAREGIVERS (${caregivers.length} total):**
${caregiversText}

**MATCHING FACTORS (in order of importance):**
1. **Skills Match (25%)**: Required certifications and service type capabilities
2. **Care Continuity (20%)**: Previous experience with this specific client
3. **Schedule Compatibility (20%)**: Available hours and workload balance
4. **Language Match (15%)**: Common languages between client and caregiver
5. **Geographic Proximity (10%)**: Travel time and distance considerations
6. **Client Preference (10%)**: Client's preferred caregivers if specified

**INSTRUCTIONS:**
1. Evaluate each caregiver against all matching factors
2. Calculate a composite score (0-100) for each caregiver
3. Rank caregivers by composite score
4. Provide detailed scoring breakdown for top ${criteria.maxResults} matches
5. Flag any concerns or considerations
6. Prioritize care continuity for clients with established caregiver relationships

**RESPONSE FORMAT (JSON only):**
{
  "matchedCaregivers": [
    {
      "caregiverId": "uuid",
      "caregiverName": "Name",
      "overallScore": 85,
      "confidence": "EXCELLENT|GOOD|FAIR|POOR",
      "matchScores": [
        {
          "factor": "SKILLS_MATCH",
          "score": 90,
          "weight": 0.25,
          "explanation": "Has all required certifications"
        }
      ],
      "strengths": ["Has worked with client before", "Language match"],
      "considerations": ["Near max capacity this week"]
    }
  ],
  "recommendations": [
    "Recommendation 1",
    "Recommendation 2"
  ],
  "reasoning": "Summary of matching analysis and key factors"
}

Provide the top ${criteria.maxResults} caregiver matches:`;
  }

  /**
   * Enrich match results with database data
   */
  private enrichMatchResults(
    aiMatches: CaregiverMatch[],
    caregivers: Array<{
      id: string;
      name: string;
      maxHoursPerWeek: number;
    }>,
    workloads: Map<string, { scheduledHours: number; visitCount: number }>
  ): CaregiverMatch[] {
    return aiMatches.map((match) => {
      const caregiver = caregivers.find((c) => c.id === match.caregiverId);
      const workload = workloads.get(match.caregiverId) ?? { scheduledHours: 0 };

      return {
        ...match,
        currentWeeklyHours: workload.scheduledHours,
        maxWeeklyHours: caregiver?.maxHoursPerWeek ?? 40,
        availableHoursThisWeek: Math.max(
          0,
          (caregiver?.maxHoursPerWeek ?? 40) - workload.scheduledHours
        ),
      };
    });
  }

  /**
   * Return empty result when no caregivers available
   */
  private emptyResult(
    organizationId: string,
    clientId: string,
    clientName: string,
    serviceType: string
  ): MatchingResult {
    return {
      organizationId,
      clientId,
      clientName,
      serviceType,
      matchedCaregivers: [],
      totalCandidatesEvaluated: 0,
      matchingCriteria: {
        requiredCertifications: [],
        preferredLanguages: [],
        maxDistanceMiles: 25,
        schedulePreferences: [],
      },
      recommendations: ['No caregivers available. Consider recruiting for this service type.'],
      reasoning: 'No active caregivers found matching the specified criteria.',
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Format address from client record
   */
  private formatAddress(client: Record<string, unknown>): string {
    const parts = [
      client.address_line_1,
      client.address_line_2,
      client.city,
      client.state,
      client.zip_code,
    ].filter(Boolean);
    return parts.join(', ');
  }

  /**
   * Get start of week (Monday)
   */
  private getWeekStart(date: Date): string {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    const isoStr = d.toISOString();
    return isoStr.split('T')[0] ?? isoStr.slice(0, 10);
  }
}
