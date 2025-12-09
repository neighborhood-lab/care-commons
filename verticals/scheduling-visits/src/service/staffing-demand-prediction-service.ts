/**
 * Staffing Demand Prediction Service
 *
 * AI-powered staffing demand forecasting based on:
 * - Current client census and acuity levels
 * - Historical visit patterns and seasonality
 * - Authorized hours and utilization rates
 * - Caregiver availability and capacity
 *
 * Helps agencies with workforce planning, recruitment decisions,
 * and scheduling optimization.
 */

import Anthropic from '@anthropic-ai/sdk';
import type { Knex } from 'knex';

export interface StaffingDemandRequest {
  organizationId: string;
  branchId?: string;
  forecastWeeks: number; // 1-12 weeks ahead
  serviceType?: string; // Filter by service type (e.g., 'PERSONAL_CARE', 'SKILLED_NURSING')
}

export type DemandConfidence = 'HIGH' | 'MEDIUM' | 'LOW';
export type DemandTrend = 'INCREASING' | 'STABLE' | 'DECREASING';
export type UrgencyLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface WeeklyDemand {
  weekStarting: string; // YYYY-MM-DD format
  hoursNeeded: number;
  fteRequired: number; // Full-time equivalents
  confidenceRange: {
    low: number;
    high: number;
  };
}

export interface ServiceTypeDemand {
  serviceType: string;
  currentHoursPerWeek: number;
  projectedHoursPerWeek: number;
  currentFTE: number;
  projectedFTE: number;
  gap: number; // Positive = understaffed, Negative = overstaffed
}

export interface StaffingGap {
  category: string;
  currentCapacity: number;
  projectedDemand: number;
  gap: number;
  urgency: UrgencyLevel;
  recommendation: string;
}

export interface StaffingDemandResult {
  organizationId: string;
  forecastPeriod: {
    startWeek: string;
    endWeek: string;
    weeks: number;
  };
  currentState: {
    activeCaregivers: number;
    totalCapacityHours: number;
    currentUtilization: number; // Percentage
    activeClients: number;
    averageAcuity: number;
  };
  weeklyDemand: WeeklyDemand[];
  byServiceType: ServiceTypeDemand[];
  overallDemandTrend: DemandTrend;
  overallConfidence: DemandConfidence;
  staffingGaps: StaffingGap[];
  recommendations: string[];
  reasoning: string;
  generatedAt: string;
}

export class StaffingDemandPredictionService {
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
   * Predict staffing demand using Claude AI
   */
  async predictStaffingDemand(
    request: StaffingDemandRequest
  ): Promise<StaffingDemandResult> {
    const { organizationId, branchId, forecastWeeks, serviceType } = request;

    // Fetch current census data
    const census = await this.getCurrentCensus(organizationId, branchId);

    // Fetch caregiver capacity
    const capacity = await this.getCaregiverCapacity(organizationId, branchId);

    // Fetch historical visit patterns (last 12 weeks)
    const visitHistory = await this.getVisitHistory(organizationId, branchId, 12);

    // Fetch authorized hours pipeline
    const authorizedHours = await this.getAuthorizedHours(organizationId, branchId);

    // Fetch client acuity distribution
    const acuityDistribution = await this.getAcuityDistribution(organizationId, branchId);

    // Build analysis prompt
    const prompt = this.buildPredictionPrompt(
      census,
      capacity,
      visitHistory,
      authorizedHours,
      acuityDistribution,
      forecastWeeks,
      serviceType
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

    let predictionResult: Partial<StaffingDemandResult>;
    try {
      predictionResult = JSON.parse(content.text);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content.text, parseError);
      throw new Error('Failed to parse staffing demand prediction');
    }

    // Calculate forecast period
    const now = new Date();
    const startWeek = this.getWeekStart(now);
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + forecastWeeks * 7);
    const endWeek = this.getWeekStart(endDate);

    // Build result
    const result: StaffingDemandResult = {
      organizationId,
      forecastPeriod: {
        startWeek,
        endWeek,
        weeks: forecastWeeks,
      },
      currentState: {
        activeCaregivers: capacity.activeCaregivers,
        totalCapacityHours: capacity.totalCapacityHours,
        currentUtilization: capacity.utilization,
        activeClients: census.activeClients,
        averageAcuity: census.averageAcuity,
      },
      weeklyDemand: predictionResult.weeklyDemand ?? [],
      byServiceType: predictionResult.byServiceType ?? [],
      overallDemandTrend: predictionResult.overallDemandTrend ?? 'STABLE',
      overallConfidence: predictionResult.overallConfidence ?? 'LOW',
      staffingGaps: predictionResult.staffingGaps ?? [],
      recommendations: predictionResult.recommendations ?? [],
      reasoning: predictionResult.reasoning ?? 'No reasoning available.',
      generatedAt: new Date().toISOString(),
    };

    return result;
  }

  /**
   * Get current client census
   */
  private async getCurrentCensus(
    organizationId: string,
    branchId: string | undefined
  ): Promise<{ activeClients: number; averageAcuity: number; newAdmissionsLast30Days: number }> {
    let query = this.db('clients')
      .where('organization_id', organizationId)
      .where('status', 'ACTIVE')
      .where('is_deleted', false);

    if (branchId) {
      query = query.where('branch_id', branchId);
    }

    const clients = await query.select('id', 'acuity_level');

    const acuityMap: Record<string, number> = {
      'LOW': 1,
      'MEDIUM': 2,
      'HIGH': 3,
      'CRITICAL': 4,
    };

    const totalAcuity = clients.reduce((sum: number, c: Record<string, unknown>) => {
      const level = String(c.acuity_level ?? 'MEDIUM');
      return sum + (acuityMap[level] ?? 2);
    }, 0);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let admissionsQuery = this.db('clients')
      .where('organization_id', organizationId)
      .where('created_at', '>=', thirtyDaysAgo)
      .where('is_deleted', false)
      .count('id as count');

    if (branchId) {
      admissionsQuery = admissionsQuery.where('branch_id', branchId);
    }

    const admissionsResult = await admissionsQuery;

    return {
      activeClients: clients.length,
      averageAcuity: clients.length > 0 ? totalAcuity / clients.length : 0,
      newAdmissionsLast30Days: Number(admissionsResult[0]?.count) || 0,
    };
  }

  /**
   * Get caregiver capacity
   */
  private async getCaregiverCapacity(
    organizationId: string,
    branchId: string | undefined
  ): Promise<{
    activeCaregivers: number;
    totalCapacityHours: number;
    utilization: number;
    byServiceType: Array<{ serviceType: string; caregivers: number; capacityHours: number }>;
  }> {
    // Get active caregivers
    let caregiverQuery = this.db('caregivers')
      .where('organization_id', organizationId)
      .where('status', 'ACTIVE')
      .where('is_deleted', false);

    if (branchId) {
      caregiverQuery = caregiverQuery.where('branch_id', branchId);
    }

    const caregivers = await caregiverQuery.select('id', 'max_hours_per_week', 'service_types');

    const activeCaregivers = caregivers.length;
    const totalCapacityHours = caregivers.reduce(
      (sum: number, c: Record<string, unknown>) => sum + (Number(c.max_hours_per_week) || 40),
      0
    );

    // Get current scheduled hours for this week
    const weekStart = this.getWeekStart(new Date());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    let scheduledQuery = this.db('visits')
      .where('organization_id', organizationId)
      .where('scheduled_date', '>=', weekStart)
      .where('scheduled_date', '<', weekEnd)
      .whereNotIn('status', ['CANCELLED', 'NO_SHOW_CAREGIVER', 'NO_SHOW_CLIENT'])
      .where('is_deleted', false)
      .sum('planned_duration_minutes as total');

    if (branchId) {
      scheduledQuery = scheduledQuery.where('branch_id', branchId);
    }

    const scheduledResult = await scheduledQuery;
    const scheduledHours = (Number(scheduledResult[0]?.total) || 0) / 60;

    const utilization = totalCapacityHours > 0 ? (scheduledHours / totalCapacityHours) * 100 : 0;

    // Group by service type
    const serviceTypeMap = new Map<string, { caregivers: number; capacityHours: number }>();
    for (const caregiver of caregivers) {
      const types = Array.isArray(caregiver.service_types) ? caregiver.service_types : ['GENERAL'];
      const hoursPerType = (Number(caregiver.max_hours_per_week) || 40) / types.length;

      for (const type of types) {
        const existing = serviceTypeMap.get(String(type)) ?? { caregivers: 0, capacityHours: 0 };
        serviceTypeMap.set(String(type), {
          caregivers: existing.caregivers + 1,
          capacityHours: existing.capacityHours + hoursPerType,
        });
      }
    }

    const byServiceType = Array.from(serviceTypeMap.entries()).map(([serviceType, data]) => ({
      serviceType,
      caregivers: data.caregivers,
      capacityHours: data.capacityHours,
    }));

    return {
      activeCaregivers,
      totalCapacityHours,
      utilization,
      byServiceType,
    };
  }

  /**
   * Get historical visit patterns
   */
  private async getVisitHistory(
    organizationId: string,
    branchId: string | undefined,
    weeks: number
  ): Promise<Array<{ week: string; hoursDelivered: number; visitCount: number }>> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - weeks * 7);

    let query = this.db('visits')
      .select(
        this.db.raw("date_trunc('week', scheduled_date)::date as week"),
        this.db.raw('SUM(actual_duration_minutes) / 60.0 as hours_delivered'),
        this.db.raw('COUNT(*) as visit_count')
      )
      .where('organization_id', organizationId)
      .where('scheduled_date', '>=', startDate)
      .where('status', 'COMPLETED')
      .where('is_deleted', false)
      .groupByRaw("date_trunc('week', scheduled_date)")
      .orderBy('week', 'asc');

    if (branchId) {
      query = query.where('branch_id', branchId);
    }

    const rows = await query;
    return rows.map((row: Record<string, unknown>) => {
      const weekStr = String(row.week);
      const weekDate = weekStr.includes('T') ? weekStr.split('T')[0] ?? weekStr : weekStr;
      return {
        week: weekDate,
        hoursDelivered: Number(row.hours_delivered) || 0,
        visitCount: Number(row.visit_count) || 0,
      };
    });
  }

  /**
   * Get authorized hours pipeline
   */
  private async getAuthorizedHours(
    organizationId: string,
    branchId: string | undefined
  ): Promise<{ totalAuthorizedHoursPerWeek: number; expiringIn30Days: number }> {
    const now = new Date();
    const thirtyDays = new Date();
    thirtyDays.setDate(thirtyDays.getDate() + 30);

    let baseQuery = this.db('service_authorizations')
      .where('organization_id', organizationId)
      .where('status', 'ACTIVE')
      .where('effective_to', '>=', now)
      .where('is_deleted', false);

    if (branchId) {
      baseQuery = baseQuery.where('branch_id', branchId);
    }

    // Get total authorized hours per week
    const totalResult = await baseQuery.clone()
      .select(this.db.raw('SUM(authorized_hours_per_week) as total'));

    // Get authorizations expiring in 30 days
    const expiringResult = await baseQuery.clone()
      .where('effective_to', '<=', thirtyDays)
      .select(this.db.raw('SUM(authorized_hours_per_week) as total'));

    return {
      totalAuthorizedHoursPerWeek: Number(totalResult[0]?.total) || 0,
      expiringIn30Days: Number(expiringResult[0]?.total) || 0,
    };
  }

  /**
   * Get client acuity distribution
   */
  private async getAcuityDistribution(
    organizationId: string,
    branchId: string | undefined
  ): Promise<Array<{ acuityLevel: string; clientCount: number; avgHoursPerWeek: number }>> {
    let query = this.db('clients')
      .select(
        'acuity_level',
        this.db.raw('COUNT(*) as client_count')
      )
      .where('organization_id', organizationId)
      .where('status', 'ACTIVE')
      .where('is_deleted', false)
      .groupBy('acuity_level');

    if (branchId) {
      query = query.where('branch_id', branchId);
    }

    const rows = await query;

    // Estimate hours by acuity level
    const hoursMap: Record<string, number> = {
      'LOW': 4,
      'MEDIUM': 8,
      'HIGH': 15,
      'CRITICAL': 25,
    };

    return rows.map((row: Record<string, unknown>) => ({
      acuityLevel: String(row.acuity_level ?? 'MEDIUM'),
      clientCount: Number(row.client_count) || 0,
      avgHoursPerWeek: hoursMap[String(row.acuity_level ?? 'MEDIUM')] ?? 8,
    }));
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

  /**
   * Build prediction prompt for Claude
   */
  private buildPredictionPrompt(
    census: { activeClients: number; averageAcuity: number; newAdmissionsLast30Days: number },
    capacity: {
      activeCaregivers: number;
      totalCapacityHours: number;
      utilization: number;
      byServiceType: Array<{ serviceType: string; caregivers: number; capacityHours: number }>;
    },
    visitHistory: Array<{ week: string; hoursDelivered: number; visitCount: number }>,
    authorizedHours: { totalAuthorizedHoursPerWeek: number; expiringIn30Days: number },
    acuityDistribution: Array<{ acuityLevel: string; clientCount: number; avgHoursPerWeek: number }>,
    forecastWeeks: number,
    serviceType?: string
  ): string {
    // Format visit history
    const historyText = visitHistory.length > 0
      ? visitHistory.map(h => `${h.week}: ${h.hoursDelivered.toFixed(1)} hours (${h.visitCount} visits)`).join('\n')
      : 'No historical data available';

    // Calculate trends
    const recentWeeks = visitHistory.slice(-4);
    const avgRecentHours = recentWeeks.length > 0
      ? recentWeeks.reduce((sum, w) => sum + w.hoursDelivered, 0) / recentWeeks.length
      : 0;

    // Format acuity distribution
    const acuityText = acuityDistribution.length > 0
      ? acuityDistribution.map(a => `${a.acuityLevel}: ${a.clientCount} clients (~${a.avgHoursPerWeek} hrs/week each)`).join('\n')
      : 'No acuity data available';

    // Format capacity by service type
    const capacityByTypeText = capacity.byServiceType.length > 0
      ? capacity.byServiceType.map(s => `${s.serviceType}: ${s.caregivers} caregivers, ${s.capacityHours.toFixed(0)} hrs capacity`).join('\n')
      : 'No service type breakdown available';

    // Calculate projected demand from acuity
    const projectedDemandFromAcuity = acuityDistribution.reduce(
      (sum, a) => sum + a.clientCount * a.avgHoursPerWeek,
      0
    );

    return `You are a healthcare workforce planning expert analyzing staffing data to predict demand for a home health agency. Your role is to provide accurate staffing forecasts to help with recruitment and scheduling.

**CURRENT CENSUS:**
- Active Clients: ${census.activeClients}
- Average Acuity: ${census.averageAcuity.toFixed(2)} (scale 1-4)
- New Admissions (last 30 days): ${census.newAdmissionsLast30Days}

**CURRENT CAPACITY:**
- Active Caregivers: ${capacity.activeCaregivers}
- Total Capacity: ${capacity.totalCapacityHours.toFixed(0)} hours/week
- Current Utilization: ${capacity.utilization.toFixed(1)}%

**CAPACITY BY SERVICE TYPE:**
${capacityByTypeText}

**CLIENT ACUITY DISTRIBUTION:**
${acuityText}

**PROJECTED DEMAND FROM ACUITY:**
${projectedDemandFromAcuity.toFixed(0)} hours/week

**AUTHORIZED HOURS:**
- Total Authorized: ${authorizedHours.totalAuthorizedHoursPerWeek.toFixed(0)} hours/week
- Expiring in 30 days: ${authorizedHours.expiringIn30Days.toFixed(0)} hours/week

**HISTORICAL VISIT DATA (Last 12 weeks):**
${historyText}

**RECENT AVERAGE:** ${avgRecentHours.toFixed(1)} hours/week

**FORECAST PARAMETERS:**
- Forecast Horizon: ${forecastWeeks} weeks
${serviceType ? `- Filter by Service Type: ${serviceType}` : '- All service types'}

**ANALYSIS GUIDELINES:**

1. **Demand Forecasting:**
   - Use historical patterns as baseline
   - Factor in census trends and new admissions
   - Account for acuity-based care needs
   - Consider authorization levels as demand ceiling

2. **Staffing Gap Analysis:**
   - Compare projected demand vs current capacity
   - Identify service type specific gaps
   - Flag critical shortages requiring urgent action

3. **Confidence Levels:**
   - HIGH: Stable patterns, consistent utilization
   - MEDIUM: Some variability, moderate growth
   - LOW: High variability, rapid changes

4. **Urgency Levels:**
   - CRITICAL: Immediate hiring needed (<2 weeks buffer)
   - HIGH: Hiring needed within 30 days
   - MEDIUM: Hiring needed within 60 days
   - LOW: Monitor, no immediate action

**RESPONSE FORMAT (JSON):**
Return ONLY valid JSON with this exact structure:
{
  "weeklyDemand": [
    {
      "weekStarting": "2025-01-06",
      "hoursNeeded": 450,
      "fteRequired": 11.25,
      "confidenceRange": { "low": 400, "high": 500 }
    }
  ],
  "byServiceType": [
    {
      "serviceType": "PERSONAL_CARE",
      "currentHoursPerWeek": 300,
      "projectedHoursPerWeek": 350,
      "currentFTE": 7.5,
      "projectedFTE": 8.75,
      "gap": 1.25
    }
  ],
  "overallDemandTrend": "INCREASING",
  "overallConfidence": "MEDIUM",
  "staffingGaps": [
    {
      "category": "Personal Care Aides",
      "currentCapacity": 300,
      "projectedDemand": 350,
      "gap": 50,
      "urgency": "HIGH",
      "recommendation": "Hire 2 additional PCAs within 30 days"
    }
  ],
  "recommendations": [
    "Prioritize hiring Personal Care Aides to meet growing demand",
    "Cross-train existing staff for flexible scheduling"
  ],
  "reasoning": "Based on 12 weeks of historical data showing 5% weekly growth and current utilization at 85%, demand will exceed capacity within 3 weeks. The main gap is in Personal Care services where 50 additional hours/week are needed."
}

Generate the ${forecastWeeks}-week staffing demand forecast now:`;
  }
}
