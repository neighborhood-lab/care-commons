/**
 * Revenue Forecasting Service
 *
 * AI-powered revenue forecasting based on:
 * - Historical billing and payment data
 * - Scheduled visits and authorizations
 * - Payer mix and payment patterns
 * - Seasonal trends and market factors
 *
 * Helps agencies with cash flow planning, staffing decisions,
 * and financial projections.
 */

import Anthropic from '@anthropic-ai/sdk';
import type { Knex } from 'knex';

export interface RevenueForecastRequest {
  organizationId: string;
  branchId?: string;
  forecastMonths: number; // 1-12 months ahead
  includeScenarios?: boolean; // Generate best/worst case scenarios
}

export type ForecastConfidence = 'HIGH' | 'MEDIUM' | 'LOW';
export type TrendDirection = 'INCREASING' | 'STABLE' | 'DECREASING';

export interface MonthlyForecast {
  month: string; // YYYY-MM format
  predictedRevenue: number;
  predictedCollections: number;
  confidenceRange: {
    low: number;
    high: number;
  };
}

export interface RevenueFactor {
  factor: string;
  impact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  magnitude: 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
}

export interface ForecastScenario {
  name: 'BEST_CASE' | 'EXPECTED' | 'WORST_CASE';
  description: string;
  totalRevenue: number;
  assumptions: string[];
}

export interface RevenueForecastResult {
  organizationId: string;
  forecastPeriod: {
    startMonth: string;
    endMonth: string;
    months: number;
  };
  monthlyForecasts: MonthlyForecast[];
  totalPredictedRevenue: number;
  totalPredictedCollections: number;
  overallConfidence: ForecastConfidence;
  trend: TrendDirection;
  growthRate: number; // Percentage year-over-year
  factors: RevenueFactor[];
  scenarios?: ForecastScenario[];
  recommendations: string[];
  basedOnHistoricalMonths: number;
  generatedAt: string;
  reasoning: string;
}

export class RevenueForecastingService {
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
   * Generate revenue forecast using Claude AI
   */
  async forecastRevenue(
    request: RevenueForecastRequest
  ): Promise<RevenueForecastResult> {
    const { organizationId, branchId, forecastMonths, includeScenarios = false } = request;

    // Fetch historical billing data (last 12 months)
    const historicalBilling = await this.getHistoricalBilling(organizationId, branchId, 12);

    // Fetch payer mix data
    const payerMix = await this.getPayerMix(organizationId, branchId);

    // Fetch scheduled visits for next 3 months
    const scheduledRevenue = await this.getScheduledRevenue(organizationId, branchId);

    // Fetch active authorizations
    const authorizations = await this.getActiveAuthorizations(organizationId, branchId);

    // Build analysis prompt
    const prompt = this.buildForecastPrompt(
      historicalBilling,
      payerMix,
      scheduledRevenue,
      authorizations,
      forecastMonths,
      includeScenarios
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

    let forecastResult: Partial<RevenueForecastResult>;
    try {
      forecastResult = JSON.parse(content.text);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content.text, parseError);
      throw new Error('Failed to parse revenue forecast');
    }

    // Calculate forecast period
    const now = new Date();
    const startMonth = `${now.getFullYear()}-${String(now.getMonth() + 2).padStart(2, '0')}`;
    const endDate = new Date(now.getFullYear(), now.getMonth() + forecastMonths + 1, 1);
    const endMonth = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}`;

    // Build result
    const result: RevenueForecastResult = {
      organizationId,
      forecastPeriod: {
        startMonth,
        endMonth,
        months: forecastMonths,
      },
      monthlyForecasts: forecastResult.monthlyForecasts ?? [],
      totalPredictedRevenue: forecastResult.totalPredictedRevenue ?? 0,
      totalPredictedCollections: forecastResult.totalPredictedCollections ?? 0,
      overallConfidence: forecastResult.overallConfidence ?? 'LOW',
      trend: forecastResult.trend ?? 'STABLE',
      growthRate: forecastResult.growthRate ?? 0,
      factors: forecastResult.factors ?? [],
      scenarios: includeScenarios ? forecastResult.scenarios : undefined,
      recommendations: forecastResult.recommendations ?? [],
      basedOnHistoricalMonths: historicalBilling.length,
      generatedAt: new Date().toISOString(),
      reasoning: forecastResult.reasoning ?? 'No reasoning available.',
    };

    return result;
  }

  /**
   * Get historical billing data for the past N months
   */
  private async getHistoricalBilling(
    organizationId: string,
    branchId: string | undefined,
    months: number
  ): Promise<Array<{ month: string; billed: number; collected: number; denials: number }>> {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    let query = this.db('billable_items')
      .select(
        this.db.raw("to_char(service_date, 'YYYY-MM') as month"),
        this.db.raw('SUM(final_amount) as billed'),
        this.db.raw('SUM(CASE WHEN is_paid THEN paid_amount ELSE 0 END) as collected'),
        this.db.raw('SUM(CASE WHEN is_denied THEN final_amount ELSE 0 END) as denials')
      )
      .where('organization_id', organizationId)
      .where('service_date', '>=', startDate)
      .where('is_deleted', false)
      .groupByRaw("to_char(service_date, 'YYYY-MM')")
      .orderBy('month', 'asc');

    if (branchId) {
      query = query.where('branch_id', branchId);
    }

    const rows = await query;
    return rows.map((row: Record<string, unknown>) => ({
      month: String(row.month),
      billed: Number(row.billed) || 0,
      collected: Number(row.collected) || 0,
      denials: Number(row.denials) || 0,
    }));
  }

  /**
   * Get payer mix breakdown
   */
  private async getPayerMix(
    organizationId: string,
    branchId: string | undefined
  ): Promise<Array<{ payerType: string; percentage: number; avgPaymentDays: number }>> {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    let query = this.db('billable_items')
      .select(
        'payer_type',
        this.db.raw('COUNT(*) as count'),
        this.db.raw('SUM(final_amount) as total')
      )
      .where('organization_id', organizationId)
      .where('service_date', '>=', threeMonthsAgo)
      .where('is_deleted', false)
      .groupBy('payer_type');

    if (branchId) {
      query = query.where('branch_id', branchId);
    }

    const rows = await query;
    const grandTotal = rows.reduce((sum: number, row: Record<string, unknown>) => sum + (Number(row.total) || 0), 0);

    return rows.map((row: Record<string, unknown>) => ({
      payerType: String(row.payer_type),
      percentage: grandTotal > 0 ? ((Number(row.total) || 0) / grandTotal) * 100 : 0,
      avgPaymentDays: 30, // Default, would need payment data to calculate
    }));
  }

  /**
   * Get scheduled revenue from upcoming visits
   */
  private async getScheduledRevenue(
    organizationId: string,
    branchId: string | undefined
  ): Promise<Array<{ month: string; scheduledAmount: number; visitCount: number }>> {
    const now = new Date();
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

    let query = this.db('visits')
      .select(
        this.db.raw("to_char(scheduled_date, 'YYYY-MM') as month"),
        this.db.raw('COUNT(*) as visit_count')
      )
      .where('organization_id', organizationId)
      .where('scheduled_date', '>=', now)
      .where('scheduled_date', '<=', threeMonthsFromNow)
      .whereNotIn('status', ['CANCELLED', 'NO_SHOW_CAREGIVER', 'NO_SHOW_CLIENT'])
      .where('is_deleted', false)
      .groupByRaw("to_char(scheduled_date, 'YYYY-MM')")
      .orderBy('month', 'asc');

    if (branchId) {
      query = query.where('branch_id', branchId);
    }

    const rows = await query;

    // Estimate revenue based on average visit value
    const avgVisitValue = 75; // Default estimate, would need rate data

    return rows.map((row: Record<string, unknown>) => ({
      month: String(row.month),
      scheduledAmount: (Number(row.visit_count) || 0) * avgVisitValue,
      visitCount: Number(row.visit_count) || 0,
    }));
  }

  /**
   * Get active authorizations and their remaining value
   */
  private async getActiveAuthorizations(
    organizationId: string,
    branchId: string | undefined
  ): Promise<{ totalAuthorizedAmount: number; expiringIn30Days: number; expiringIn60Days: number }> {
    const now = new Date();
    const thirtyDays = new Date();
    thirtyDays.setDate(thirtyDays.getDate() + 30);
    const sixtyDays = new Date();
    sixtyDays.setDate(sixtyDays.getDate() + 60);

    let baseQuery = this.db('service_authorizations')
      .where('organization_id', organizationId)
      .where('status', 'ACTIVE')
      .where('effective_to', '>=', now)
      .where('is_deleted', false);

    if (branchId) {
      baseQuery = baseQuery.where('branch_id', branchId);
    }

    // Get total remaining authorized value
    const totalResult = await baseQuery.clone()
      .select(this.db.raw('SUM(remaining_units * COALESCE(unit_rate, 50)) as total'));

    // Get authorizations expiring in 30 days
    const expiring30Result = await baseQuery.clone()
      .where('effective_to', '<=', thirtyDays)
      .select(this.db.raw('SUM(remaining_units * COALESCE(unit_rate, 50)) as total'));

    // Get authorizations expiring in 60 days
    const expiring60Result = await baseQuery.clone()
      .where('effective_to', '<=', sixtyDays)
      .select(this.db.raw('SUM(remaining_units * COALESCE(unit_rate, 50)) as total'));

    return {
      totalAuthorizedAmount: Number(totalResult[0]?.total) || 0,
      expiringIn30Days: Number(expiring30Result[0]?.total) || 0,
      expiringIn60Days: Number(expiring60Result[0]?.total) || 0,
    };
  }

  /**
   * Build forecast prompt for Claude
   */
  private buildForecastPrompt(
    historicalBilling: Array<{ month: string; billed: number; collected: number; denials: number }>,
    payerMix: Array<{ payerType: string; percentage: number; avgPaymentDays: number }>,
    scheduledRevenue: Array<{ month: string; scheduledAmount: number; visitCount: number }>,
    authorizations: { totalAuthorizedAmount: number; expiringIn30Days: number; expiringIn60Days: number },
    forecastMonths: number,
    includeScenarios: boolean
  ): string {
    // Format historical data
    const historicalSummary = historicalBilling.length > 0
      ? historicalBilling.map(h => `${h.month}: Billed $${h.billed.toLocaleString()}, Collected $${h.collected.toLocaleString()}, Denials $${h.denials.toLocaleString()}`).join('\n')
      : 'No historical data available';

    // Calculate trends
    const totalBilled = historicalBilling.reduce((sum, h) => sum + h.billed, 0);
    const totalCollected = historicalBilling.reduce((sum, h) => sum + h.collected, 0);
    const avgMonthlyBilled = historicalBilling.length > 0 ? totalBilled / historicalBilling.length : 0;
    const collectionRate = totalBilled > 0 ? (totalCollected / totalBilled) * 100 : 0;

    // Format payer mix
    const payerMixSummary = payerMix.length > 0
      ? payerMix.map(p => `${p.payerType}: ${p.percentage.toFixed(1)}%`).join(', ')
      : 'No payer data available';

    // Format scheduled revenue
    const scheduledSummary = scheduledRevenue.length > 0
      ? scheduledRevenue.map(s => `${s.month}: ${s.visitCount} visits (~$${s.scheduledAmount.toLocaleString()})`).join('\n')
      : 'No scheduled visits';

    return `You are a healthcare finance expert analyzing billing data to forecast revenue for a home health agency. Your role is to provide accurate revenue predictions to help with financial planning.

**HISTORICAL BILLING DATA (Last 12 months):**
${historicalSummary}

**SUMMARY METRICS:**
- Total Billed: $${totalBilled.toLocaleString()}
- Total Collected: $${totalCollected.toLocaleString()}
- Average Monthly Billing: $${avgMonthlyBilled.toLocaleString()}
- Collection Rate: ${collectionRate.toFixed(1)}%
- Historical Months Available: ${historicalBilling.length}

**PAYER MIX:**
${payerMixSummary}

**SCHEDULED VISITS (Next 3 months):**
${scheduledSummary}

**ACTIVE AUTHORIZATIONS:**
- Total Authorized Value: $${authorizations.totalAuthorizedAmount.toLocaleString()}
- Expiring in 30 days: $${authorizations.expiringIn30Days.toLocaleString()}
- Expiring in 60 days: $${authorizations.expiringIn60Days.toLocaleString()}

**FORECAST PARAMETERS:**
- Forecast Horizon: ${forecastMonths} months
- Include Scenarios: ${includeScenarios ? 'Yes' : 'No'}

**FORECASTING GUIDELINES:**

1. **Revenue Prediction:**
   - Use historical trends as baseline
   - Factor in payer mix and collection rates
   - Account for scheduled visits and authorizations
   - Consider seasonal patterns (if visible in data)

2. **Collection Prediction:**
   - Apply historical collection rate
   - Account for payer-specific payment timelines
   - Factor in typical lag between billing and collection

3. **Confidence Levels:**
   - HIGH: 6+ months of consistent historical data
   - MEDIUM: 3-5 months of data or moderate variability
   - LOW: Limited data or high variability

4. **Key Factors to Consider:**
   - Authorization expiration risks
   - Payer mix stability
   - Seasonal variations
   - Growth/decline trends

**RESPONSE FORMAT (JSON):**
Return ONLY valid JSON with this exact structure:
{
  "monthlyForecasts": [
    {
      "month": "2025-02",
      "predictedRevenue": 125000,
      "predictedCollections": 100000,
      "confidenceRange": { "low": 110000, "high": 140000 }
    }
  ],
  "totalPredictedRevenue": 375000,
  "totalPredictedCollections": 300000,
  "overallConfidence": "MEDIUM",
  "trend": "INCREASING",
  "growthRate": 5.2,
  "factors": [
    {
      "factor": "Authorization Renewals",
      "impact": "NEGATIVE",
      "magnitude": "MEDIUM",
      "description": "$50,000 in authorizations expiring within 60 days needs renewal"
    }
  ],${includeScenarios ? `
  "scenarios": [
    {
      "name": "BEST_CASE",
      "description": "All authorizations renewed, improved collection rate",
      "totalRevenue": 425000,
      "assumptions": ["100% auth renewal", "85% collection rate"]
    },
    {
      "name": "EXPECTED",
      "description": "Normal operations with typical renewal rates",
      "totalRevenue": 375000,
      "assumptions": ["80% auth renewal", "75% collection rate"]
    },
    {
      "name": "WORST_CASE",
      "description": "Authorization losses, increased denials",
      "totalRevenue": 300000,
      "assumptions": ["60% auth renewal", "65% collection rate"]
    }
  ],` : ''}
  "recommendations": [
    "Focus on authorization renewals for expiring clients",
    "Follow up on outstanding claims over 45 days"
  ],
  "reasoning": "Based on 8 months of historical data showing steady growth of 3% monthly, with a collection rate of 78%, the forecast projects continued growth. The main risk is $50,000 in expiring authorizations that need renewal to maintain revenue levels."
}

Generate the ${forecastMonths}-month revenue forecast now:`;
  }
}
