/**
 * Vitals Anomaly Detection Service
 *
 * AI-powered detection of anomalies in vital sign patterns using Claude AI.
 * Identifies concerning trends, sudden changes, and clinical red flags.
 */

import Anthropic from '@anthropic-ai/sdk';
import type { Knex } from 'knex';

export interface VitalsAnomalyRequest {
  clientId: string;
  lookbackDays?: number; // Default 30 days
}

export type AnomalySeverity = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';

export interface VitalAnomaly {
  vitalType: 'BLOOD_PRESSURE' | 'HEART_RATE' | 'OXYGEN_SATURATION' | 'TEMPERATURE' | 'PAIN_LEVEL' | 'WEIGHT';
  anomalyType: 'SUDDEN_CHANGE' | 'TRENDING_UP' | 'TRENDING_DOWN' | 'OUT_OF_RANGE' | 'HIGH_VARIABILITY';
  severity: AnomalySeverity;
  description: string;
  evidence: Array<{
    date: string;
    value: string;
    context?: string;
  }>;
  clinicalSignificance: string;
  recommendations: string[];
}

export interface VitalsAnomalyResult {
  clientId: string;
  clientName: string;
  analyzedAt: string;
  lookbackPeriod: {
    startDate: string;
    endDate: string;
    daysAnalyzed: number;
  };
  anomaliesDetected: VitalAnomaly[];
  overallRiskLevel: AnomalySeverity;
  normalVitals: string[];
  trendSummary: string;
  interventionPriorities: Array<{
    priority: number;
    action: string;
    rationale: string;
    urgency: 'IMMEDIATE' | 'SOON' | 'ROUTINE';
  }>;
  clinicalSummary: string;
  dataQuality: {
    totalReadings: number;
    daysWithData: number;
    coverage: number; // Percentage
    gaps: string[];
  };
}

export class VitalsAnomalyService {
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
   * Detect vitals anomalies using Claude AI
   */
  async detectVitalsAnomalies(request: VitalsAnomalyRequest): Promise<VitalsAnomalyResult> {
    const lookbackDays = request.lookbackDays || 30;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - lookbackDays);

    // Fetch client details
    const client = await this.db('clients')
      .select('id', 'first_name', 'last_name', 'date_of_birth', 'medical_history')
      .where({ id: request.clientId, is_deleted: false })
      .first();

    if (!client) {
      throw new Error('Client not found');
    }

    // Fetch vital signs in lookback period
    const vitals = await this.db('vital_signs')
      .select('*')
      .where({
        client_id: request.clientId,
        is_deleted: false,
      })
      .where('recorded_at', '>=', startDate.toISOString())
      .where('recorded_at', '<=', endDate.toISOString())
      .orderBy('recorded_at', 'asc');

    if (vitals.length === 0) {
      // No vitals data
      return {
        clientId: client.id,
        clientName: `${client.first_name} ${client.last_name}`,
        analyzedAt: new Date().toISOString(),
        lookbackPeriod: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          daysAnalyzed: lookbackDays,
        },
        anomaliesDetected: [],
        overallRiskLevel: 'LOW',
        normalVitals: [],
        trendSummary: 'No vital signs data available for analysis.',
        interventionPriorities: [
          {
            priority: 1,
            action: 'Begin regular vital signs monitoring',
            rationale: 'No baseline vitals data exists for this client',
            urgency: 'SOON',
          },
        ],
        clinicalSummary: 'No vital signs data available for analysis. Recommend establishing baseline vital signs monitoring.',
        dataQuality: {
          totalReadings: 0,
          daysWithData: 0,
          coverage: 0,
          gaps: ['No vital signs recorded in analysis period'],
        },
      };
    }

    // Build comprehensive prompt for Claude
    const prompt = this.buildAnomalyDetectionPrompt(client, vitals, lookbackDays);

    // Call Claude AI
    const message = await this.anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 4096,
      temperature: 0.15, // Low temperature for medical accuracy
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Parse AI response
    const content = message.content[0];
    if (!content || content.type !== 'text') {
      throw new Error('Unexpected response type from AI');
    }

    let analysisResult: Partial<VitalsAnomalyResult>;
    try {
      const textContent = content as { type: 'text'; text: string };
      analysisResult = JSON.parse(textContent.text);
    } catch (error) {
      const textContent = content as { type: 'text'; text: string };
      console.error('Failed to parse AI response:', textContent.text);
      throw new Error('Failed to parse vitals anomaly analysis');
    }

    // Calculate data quality metrics
    const uniqueDays = new Set(vitals.map((v) => v.recorded_at.split('T')[0])).size;
    const coverage = Math.round((uniqueDays / lookbackDays) * 100);

    // Build result
    const result: VitalsAnomalyResult = {
      clientId: client.id,
      clientName: `${client.first_name} ${client.last_name}`,
      analyzedAt: new Date().toISOString(),
      lookbackPeriod: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        daysAnalyzed: lookbackDays,
      },
      anomaliesDetected: analysisResult.anomaliesDetected || [],
      overallRiskLevel: analysisResult.overallRiskLevel || 'LOW',
      normalVitals: analysisResult.normalVitals || [],
      trendSummary: analysisResult.trendSummary || 'No summary available.',
      interventionPriorities: analysisResult.interventionPriorities || [],
      clinicalSummary: analysisResult.clinicalSummary || 'No summary available.',
      dataQuality: {
        totalReadings: vitals.length,
        daysWithData: uniqueDays,
        coverage,
        gaps: analysisResult.dataQuality?.gaps || [],
      },
    };

    return result;
  }

  /**
   * Build anomaly detection prompt for Claude
   */
  private buildAnomalyDetectionPrompt(client: any, vitals: any[], lookbackDays: number): string {
    const clientAge = this.calculateAge(client.date_of_birth);
    const medicalHistoryList = client.medical_history
      ? Array.isArray(client.medical_history)
        ? client.medical_history.join(', ')
        : client.medical_history
      : 'None documented';

    const vitalsTimeline = vitals
      .map(
        (v, index) =>
          `${index + 1}. ${v.recorded_at} - BP: ${v.blood_pressure_systolic || 'N/A'}/${v.blood_pressure_diastolic || 'N/A'}, HR: ${v.heart_rate || 'N/A'} bpm, SpO2: ${v.oxygen_saturation || 'N/A'}%, Temp: ${v.temperature || 'N/A'}°F, Pain: ${v.pain_level || 'N/A'}/10, Weight: ${v.weight || 'N/A'} lbs`,
      )
      .join('\n');

    return `You are a clinical AI assistant analyzing vital signs patterns to detect anomalies that may indicate health deterioration or clinical concerns. Your goal is to identify concerning trends, sudden changes, and out-of-range values.

**PATIENT INFORMATION:**
- Name: ${client.first_name} ${client.last_name}
- Age: ${clientAge} years
- Medical History: ${medicalHistoryList}
- Analysis Period: Last ${lookbackDays} days
- Total Readings: ${vitals.length}

**VITAL SIGNS TIMELINE:**
${vitalsTimeline}

**NORMAL RANGES (Adult):**
- Blood Pressure: 90/60 to 120/80 mmHg (systolic/diastolic)
- Heart Rate: 60-100 bpm (at rest)
- Oxygen Saturation (SpO2): ≥95%
- Temperature: 97.0-99.0°F (oral)
- Pain Level: 0-3/10 (managed)
- Weight: Stable (±5 lbs is normal fluctuation)

**ANOMALY DETECTION CRITERIA:**

1. **CRITICAL Anomalies (Immediate intervention needed):**
   - BP Systolic >180 or <90 mmHg
   - BP Diastolic >120 or <60 mmHg
   - Heart Rate >120 or <50 bpm
   - SpO2 <90%
   - Temperature >102°F or <95°F
   - Pain Level >7/10 persistent
   - Weight loss >10 lbs in 30 days

2. **HIGH Severity (Urgent attention):**
   - BP 140-179/90-119 persistent
   - Heart Rate 100-120 or 50-60 bpm
   - SpO2 90-94%
   - Temperature 100-102°F or 95-96°F
   - Pain Level 5-7/10 persistent
   - Weight change 5-10 lbs in 30 days
   - Sudden changes (>20% from baseline)

3. **MODERATE Severity (Monitor closely):**
   - BP 130-139/85-89 trending up
   - Heart Rate 90-100 bpm
   - SpO2 95-96% declining trend
   - Temperature 99-100°F persistent
   - Pain Level 3-5/10 persistent
   - High variability in any vital

4. **Anomaly Types:**
   - SUDDEN_CHANGE: Abrupt shift from baseline (>20% change)
   - TRENDING_UP: Gradual increase over time
   - TRENDING_DOWN: Gradual decrease over time
   - OUT_OF_RANGE: Values outside normal range
   - HIGH_VARIABILITY: Unstable readings

**CLINICAL CONTEXT:**
Consider patient's medical history when assessing anomalies:
- Hypertension: BP patterns critical
- Heart disease: HR and BP patterns critical
- COPD/Asthma: SpO2 critical
- Diabetes: Weight and BP important
- Chronic pain: Pain trends matter

**RESPONSE FORMAT (JSON):**
Return ONLY valid JSON with this exact structure:
{
  "anomaliesDetected": [
    {
      "vitalType": "BLOOD_PRESSURE|HEART_RATE|OXYGEN_SATURATION|TEMPERATURE|PAIN_LEVEL|WEIGHT",
      "anomalyType": "SUDDEN_CHANGE|TRENDING_UP|TRENDING_DOWN|OUT_OF_RANGE|HIGH_VARIABILITY",
      "severity": "CRITICAL|HIGH|MODERATE|LOW",
      "description": "Brief description of the anomaly",
      "evidence": [
        {
          "date": "2025-01-15T10:30:00Z",
          "value": "165/95 mmHg",
          "context": "Spike from baseline 130/80"
        }
      ],
      "clinicalSignificance": "Why this matters clinically",
      "recommendations": ["Specific action 1", "Specific action 2"]
    }
  ],
  "overallRiskLevel": "CRITICAL|HIGH|MODERATE|LOW",
  "normalVitals": ["Heart Rate", "Oxygen Saturation"],
  "trendSummary": "Brief overview of overall vital signs trends",
  "interventionPriorities": [
    {
      "priority": 1,
      "action": "Specific intervention needed",
      "rationale": "Why this is the top priority",
      "urgency": "IMMEDIATE|SOON|ROUTINE"
    }
  ],
  "clinicalSummary": "One-paragraph summary of key findings and clinical recommendations",
  "dataQuality": {
    "gaps": ["Missing temperature readings", "No weight data"]
  }
}

**CRITICAL RULES:**
- Base all findings on EVIDENCE from the data
- Be conservative - err on side of caution for patient safety
- Compare current values to patient's own baseline (if available)
- Consider trends over time, not just single readings
- If data is sparse, note it in dataQuality.gaps
- Prioritize actionable, specific recommendations
- Mark as CRITICAL if any life-threatening values
- Always provide clinical rationale

Provide your anomaly detection analysis now:`;
  }

  /**
   * Calculate age from date of birth
   */
  private calculateAge(dateOfBirth: string): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }
}
