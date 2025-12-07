/**
 * Hospitalization Risk Service
 *
 * AI-powered prediction of patient hospitalization risk based on visit data,
 * vitals, incidents, and care patterns. Helps prevent hospitalizations through
 * early intervention.
 */

import Anthropic from '@anthropic-ai/sdk';
import type { Knex } from 'knex';

export interface HospitalizationRiskRequest {
  clientId: string;
  lookbackDays?: number; // Default 30 days
}

export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';

export interface RiskFactor {
  category: string;
  description: string;
  severity: RiskLevel;
  evidence: string[];
  recommendations: string[];
}

export interface HospitalizationRiskResult {
  clientId: string;
  clientName: string;
  analyzedAt: string;
  lookbackPeriod: {
    startDate: string;
    endDate: string;
    daysAnalyzed: number;
  };
  overallRiskScore: number; // 0-100
  riskLevel: RiskLevel;
  riskFactors: RiskFactor[];
  protectiveFactors: string[];
  interventionPriorities: Array<{
    priority: number;
    action: string;
    rationale: string;
    urgency: 'IMMEDIATE' | 'SOON' | 'ROUTINE';
  }>;
  clinicalSummary: string;
  confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  dataQuality: {
    visitDataCompleteness: number; // 0-100
    vitalSignsCoverage: number; // 0-100
    recentDataAvailable: boolean;
    gaps: string[];
  };
}

export class HospitalizationRiskService {
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
   * Predict hospitalization risk using Claude AI
   */
  async predictHospitalizationRisk(
    request: HospitalizationRiskRequest,
  ): Promise<HospitalizationRiskResult> {
    const lookbackDays = request.lookbackDays || 30;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - lookbackDays);

    // Fetch client details
    const client = await this.db('clients')
      .select('id', 'first_name', 'last_name', 'date_of_birth', 'medical_history', 'allergies')
      .where({ id: request.clientId, is_deleted: false })
      .first();

    if (!client) {
      throw new Error('Client not found');
    }

    // Fetch recent visit notes
    const visitNotes = await this.db('visit_notes')
      .select('*')
      .where({
        client_id: request.clientId,
        is_deleted: false,
      })
      .where('visit_date', '>=', startDate.toISOString())
      .where('visit_date', '<=', endDate.toISOString())
      .orderBy('visit_date', 'desc')
      .limit(20);

    // Fetch recent vitals
    const vitals = await this.db('vital_signs')
      .select('*')
      .where({
        client_id: request.clientId,
        is_deleted: false,
      })
      .where('recorded_at', '>=', startDate.toISOString())
      .where('recorded_at', '<=', endDate.toISOString())
      .orderBy('recorded_at', 'desc')
      .limit(50);

    // Fetch recent incidents
    const incidents = await this.db('incidents')
      .select('*')
      .where({
        client_id: request.clientId,
        is_deleted: false,
      })
      .where('incident_date', '>=', startDate.toISOString())
      .where('incident_date', '<=', endDate.toISOString())
      .orderBy('incident_date', 'desc');

    // Fetch current medications
    const medications = await this.db('medications')
      .select('id', 'medication_name', 'dosage', 'route', 'frequency', 'status')
      .where({
        client_id: request.clientId,
        is_deleted: false,
      })
      .where('status', 'ACTIVE')
      .orderBy('created_at', 'desc');

    // Fetch recent hospitalizations (if tracked)
    const hospitalizations = await this.db('hospitalizations')
      .select('*')
      .where({
        client_id: request.clientId,
        is_deleted: false,
      })
      .where('admission_date', '>=', new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString()) // Last 6 months
      .orderBy('admission_date', 'desc')
      .catch(() => []); // Table might not exist

    // Build comprehensive prompt for Claude
    const prompt = this.buildRiskAssessmentPrompt(
      client,
      visitNotes,
      vitals,
      incidents,
      medications,
      hospitalizations,
      lookbackDays,
    );

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

    let analysisResult: Partial<HospitalizationRiskResult>;
    try {
      const textContent = content as { type: 'text'; text: string };
      analysisResult = JSON.parse(textContent.text);
    } catch (error) {
      const textContent = content as { type: 'text'; text: string };
      console.error('Failed to parse AI response:', textContent.text);
      throw new Error('Failed to parse hospitalization risk analysis');
    }

    // Build result
    const result: HospitalizationRiskResult = {
      clientId: client.id,
      clientName: `${client.first_name} ${client.last_name}`,
      analyzedAt: new Date().toISOString(),
      lookbackPeriod: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        daysAnalyzed: lookbackDays,
      },
      overallRiskScore: analysisResult.overallRiskScore || 0,
      riskLevel: analysisResult.riskLevel || 'LOW',
      riskFactors: analysisResult.riskFactors || [],
      protectiveFactors: analysisResult.protectiveFactors || [],
      interventionPriorities: analysisResult.interventionPriorities || [],
      clinicalSummary: analysisResult.clinicalSummary || 'No summary available.',
      confidenceLevel: analysisResult.confidenceLevel || 'LOW',
      dataQuality: analysisResult.dataQuality || {
        visitDataCompleteness: 0,
        vitalSignsCoverage: 0,
        recentDataAvailable: false,
        gaps: ['Insufficient data'],
      },
    };

    return result;
  }

  /**
   * Build comprehensive risk assessment prompt for Claude
   */
  private buildRiskAssessmentPrompt(
    client: any,
    visitNotes: any[],
    vitals: any[],
    incidents: any[],
    medications: any[],
    hospitalizations: any[],
    lookbackDays: number,
  ): string {
    const clientAge = this.calculateAge(client.date_of_birth);
    const medicalHistoryList = client.medical_history
      ? Array.isArray(client.medical_history)
        ? client.medical_history.join(', ')
        : client.medical_history
      : 'None documented';

    const visitSummary = visitNotes
      .map(
        (note, index) =>
          `${index + 1}. ${note.visit_date} - ${note.note_type || 'General'}
   Subjective: ${note.subjective_notes || 'Not documented'}
   Objective: ${note.objective_notes || 'Not documented'}
   Assessment: ${note.assessment || 'Not documented'}
   Safety Incidents: ${note.safety_incidents ? 'YES' : 'No'}`,
      )
      .join('\n\n');

    const vitalsTrends = this.summarizeVitals(vitals);
    const incidentSummary = incidents
      .map(
        (inc, index) =>
          `${index + 1}. ${inc.incident_date} - ${inc.incident_type}: ${inc.description}`,
      )
      .join('\n');

    const medicationList = medications
      .map((med, index) => `${index + 1}. ${med.medication_name} ${med.dosage} ${med.route} ${med.frequency}`)
      .join('\n');

    const hospitalizationHistory = hospitalizations
      .map(
        (hosp, index) =>
          `${index + 1}. ${hosp.admission_date} - ${hosp.discharge_date || 'Ongoing'}: ${hosp.diagnosis}`,
      )
      .join('\n');

    return `You are a clinical risk assessment AI analyzing patient data to predict hospitalization risk. Your goal is to identify patients who may be at risk of hospitalization and recommend preventive interventions.

**PATIENT INFORMATION:**
- Name: ${client.first_name} ${client.last_name}
- Age: ${clientAge} years
- Medical History: ${medicalHistoryList}
- Analysis Period: Last ${lookbackDays} days

**RECENT VISIT NOTES (${visitNotes.length} visits):**
${visitSummary || 'No visit notes in this period'}

**VITAL SIGNS TRENDS (${vitals.length} readings):**
${vitalsTrends}

**SAFETY INCIDENTS (${incidents.length} incidents):**
${incidentSummary || 'No incidents reported'}

**CURRENT MEDICATIONS (${medications.length} active):**
${medicationList || 'None documented'}

**RECENT HOSPITALIZATION HISTORY (Last 6 months):**
${hospitalizationHistory || 'No hospitalizations'}

**HOSPITALIZATION RISK FACTORS TO ASSESS:**

1. **Deteriorating Health Indicators:**
   - Declining functional status
   - Worsening vital signs (BP, HR, SpO2, temp)
   - Increased pain or symptoms
   - Weight loss or gain
   - New or worsening chronic conditions

2. **Falls & Safety Incidents:**
   - Recent falls (especially multiple)
   - Near-miss incidents
   - Environmental hazards
   - Mobility decline

3. **Medication Issues:**
   - Non-adherence
   - Polypharmacy (5+ medications)
   - High-risk medications
   - Recent medication changes
   - Side effects

4. **Cognitive/Behavioral Changes:**
   - Confusion or disorientation
   - Depression or anxiety
   - Agitation
   - Memory problems

5. **Social/Support Factors:**
   - Inadequate caregiver support
   - Social isolation
   - Financial barriers to care
   - Missed appointments

6. **Clinical Red Flags:**
   - ER visits
   - Hospital readmissions
   - Uncontrolled chronic conditions (diabetes, CHF, COPD)
   - Infections
   - Dehydration

**PROTECTIVE FACTORS:**
- Strong family/caregiver support
- Good medication adherence
- Regular visit attendance
- Stable vitals
- Active engagement in care

**RESPONSE FORMAT (JSON):**
Return ONLY valid JSON with this exact structure:
{
  "overallRiskScore": 75,
  "riskLevel": "CRITICAL|HIGH|MODERATE|LOW",
  "riskFactors": [
    {
      "category": "Deteriorating Health",
      "description": "Brief description of the risk factor",
      "severity": "CRITICAL|HIGH|MODERATE|LOW",
      "evidence": ["Specific data point 1", "Specific data point 2"],
      "recommendations": ["Specific action to take"]
    }
  ],
  "protectiveFactors": [
    "Strong family support",
    "Good medication adherence"
  ],
  "interventionPriorities": [
    {
      "priority": 1,
      "action": "Specific intervention to perform",
      "rationale": "Why this intervention is needed",
      "urgency": "IMMEDIATE|SOON|ROUTINE"
    }
  ],
  "clinicalSummary": "One-paragraph summary of overall risk assessment and key findings",
  "confidenceLevel": "HIGH|MEDIUM|LOW",
  "dataQuality": {
    "visitDataCompleteness": 85,
    "vitalSignsCoverage": 70,
    "recentDataAvailable": true,
    "gaps": ["No medication adherence data", "Limited cognitive assessment"]
  }
}

**CRITICAL RULES:**
- Base assessment on EVIDENCE from the data provided
- Be conservative - err on the side of caution
- If data is limited, note it in dataQuality.gaps and confidenceLevel
- Prioritize actionable interventions
- Consider the whole patient, not just one risk factor
- Mark as CRITICAL or HIGH risk if multiple concerning factors present
- Always provide specific, evidence-based recommendations

Provide your risk assessment now:`;
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

  /**
   * Summarize vitals trends
   */
  private summarizeVitals(vitals: any[]): string {
    if (vitals.length === 0) {
      return 'No vital signs recorded in this period';
    }

    const summary = vitals
      .map(
        (v, index) =>
          `${index + 1}. ${v.recorded_at} - BP: ${v.blood_pressure_systolic || 'N/A'}/${v.blood_pressure_diastolic || 'N/A'}, HR: ${v.heart_rate || 'N/A'}, SpO2: ${v.oxygen_saturation || 'N/A'}%, Temp: ${v.temperature || 'N/A'}°F, Pain: ${v.pain_level || 'N/A'}/10`,
      )
      .join('\n');

    return summary;
  }
}
