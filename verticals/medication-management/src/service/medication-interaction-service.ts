/**
 * Medication Interaction Service
 *
 * AI-powered medication interaction checking using Claude AI.
 * Analyzes drug-drug, drug-allergy, and drug-condition interactions.
 * Provides real-time safety alerts to prevent adverse events.
 */

import Anthropic from '@anthropic-ai/sdk';
import type { Knex } from 'knex';

export interface MedicationInteractionRequest {
  clientId: string;
  newMedicationName?: string; // Check interactions for a new medication
  newMedicationDosage?: string;
  newMedicationRoute?: string;
  medicationIds?: string[]; // Or check interactions among existing medications
}

export type InteractionSeverity = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';

export interface DrugInteraction {
  medication1: string;
  medication2: string;
  severity: InteractionSeverity;
  description: string;
  clinicalEffect: string;
  recommendation: string;
  references?: string[];
}

export interface AllergyAlert {
  medication: string;
  allergen: string;
  severity: InteractionSeverity;
  description: string;
  recommendation: string;
}

export interface ConditionAlert {
  medication: string;
  condition: string;
  severity: InteractionSeverity;
  description: string;
  recommendation: string;
}

export interface MedicationInteractionResult {
  clientId: string;
  clientName: string;
  analyzedAt: string;
  currentMedications: Array<{
    id: string;
    name: string;
    dosage: string;
    route: string;
  }>;
  newMedication?: {
    name: string;
    dosage?: string;
    route?: string;
  };
  drugInteractions: DrugInteraction[];
  allergyAlerts: AllergyAlert[];
  conditionAlerts: ConditionAlert[];
  overallRiskLevel: InteractionSeverity;
  safeToAdminister: boolean;
  requiresPhysicianReview: boolean;
  clinicalSummary: string;
}

export class MedicationInteractionService {
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
   * Check medication interactions using Claude AI
   */
  async checkMedicationInteractions(
    request: MedicationInteractionRequest,
  ): Promise<MedicationInteractionResult> {
    // Fetch client details
    const client = await this.db('clients')
      .select('id', 'first_name', 'last_name', 'date_of_birth', 'medical_history', 'allergies')
      .where({ id: request.clientId, is_deleted: false })
      .first();

    if (!client) {
      throw new Error('Client not found');
    }

    // Fetch current active medications
    const currentMedications = await this.db('medications')
      .select('id', 'medication_name', 'generic_name', 'dosage', 'route', 'frequency', 'warnings')
      .where({
        client_id: request.clientId,
        status: 'ACTIVE',
        is_deleted: false,
      })
      .orderBy('created_at', 'desc');

    // Build comprehensive prompt for Claude
    const prompt = this.buildInteractionCheckPrompt(
      client,
      currentMedications,
      request.newMedicationName,
      request.newMedicationDosage,
      request.newMedicationRoute,
    );

    // Call Claude AI
    const message = await this.anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 4096,
      temperature: 0.1, // Very low temperature for medical accuracy
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

    let analysisResult: Partial<MedicationInteractionResult>;
    try {
      const textContent = content as { type: 'text'; text: string };
      analysisResult = JSON.parse(textContent.text);
    } catch (error) {
      const textContent = content as { type: 'text'; text: string };
      console.error('Failed to parse AI response:', textContent.text);
      throw new Error('Failed to parse medication interaction analysis');
    }

    // Build result
    const result: MedicationInteractionResult = {
      clientId: client.id,
      clientName: `${client.first_name} ${client.last_name}`,
      analyzedAt: new Date().toISOString(),
      currentMedications: currentMedications.map((med) => ({
        id: med.id,
        name: med.medication_name,
        dosage: med.dosage,
        route: med.route,
      })),
      newMedication: request.newMedicationName
        ? {
            name: request.newMedicationName,
            dosage: request.newMedicationDosage,
            route: request.newMedicationRoute,
          }
        : undefined,
      drugInteractions: analysisResult.drugInteractions || [],
      allergyAlerts: analysisResult.allergyAlerts || [],
      conditionAlerts: analysisResult.conditionAlerts || [],
      overallRiskLevel: analysisResult.overallRiskLevel || 'LOW',
      safeToAdminister: analysisResult.safeToAdminister ?? true,
      requiresPhysicianReview: analysisResult.requiresPhysicianReview ?? false,
      clinicalSummary: analysisResult.clinicalSummary || 'No significant interactions detected.',
    };

    return result;
  }

  /**
   * Build comprehensive interaction check prompt for Claude
   */
  private buildInteractionCheckPrompt(
    client: any,
    currentMedications: any[],
    newMedicationName?: string,
    newMedicationDosage?: string,
    newMedicationRoute?: string,
  ): string {
    const allergiesList = client.allergies
      ? Array.isArray(client.allergies)
        ? client.allergies.join(', ')
        : client.allergies
      : 'None documented';

    const medicalHistoryList = client.medical_history
      ? Array.isArray(client.medical_history)
        ? client.medical_history.join(', ')
        : client.medical_history
      : 'None documented';

    const currentMedsList = currentMedications
      .map(
        (med, index) =>
          `${index + 1}. ${med.medication_name}${med.generic_name ? ` (${med.generic_name})` : ''} - ${med.dosage} ${med.route} ${med.frequency}`,
      )
      .join('\n');

    return `You are a clinical pharmacist AI assistant analyzing medication interactions. Your role is to identify potential drug-drug interactions, drug-allergy contraindications, and drug-condition contraindications.

**PATIENT INFORMATION:**
- Name: ${client.first_name} ${client.last_name}
- Date of Birth: ${client.date_of_birth}
- Known Allergies: ${allergiesList}
- Medical Conditions: ${medicalHistoryList}

**CURRENT MEDICATIONS:**
${currentMedsList || 'None'}

${
  newMedicationName
    ? `**NEW MEDICATION BEING ADDED:**
- Name: ${newMedicationName}
- Dosage: ${newMedicationDosage || 'Not specified'}
- Route: ${newMedicationRoute || 'Not specified'}

Please analyze potential interactions between this new medication and the patient's current medications, allergies, and medical conditions.`
    : 'Please analyze potential interactions among the patient\'s current medications, allergies, and medical conditions.'
}

**INSTRUCTIONS:**
1. Identify all drug-drug interactions (including severity level)
2. Check for drug-allergy contraindications
3. Check for drug-condition contraindications
4. Assess overall risk level (CRITICAL, HIGH, MODERATE, LOW)
5. Determine if the medication is safe to administer
6. Determine if physician review is required
7. Provide clear clinical recommendations

**RESPONSE FORMAT (JSON):**
Return ONLY valid JSON with this exact structure:
{
  "drugInteractions": [
    {
      "medication1": "Drug A",
      "medication2": "Drug B",
      "severity": "CRITICAL|HIGH|MODERATE|LOW",
      "description": "Brief description of the interaction",
      "clinicalEffect": "What happens when these drugs interact",
      "recommendation": "Clinical action to take",
      "references": ["Source 1", "Source 2"]
    }
  ],
  "allergyAlerts": [
    {
      "medication": "Drug name",
      "allergen": "Allergen name",
      "severity": "CRITICAL|HIGH|MODERATE|LOW",
      "description": "Cross-reactivity or allergy concern",
      "recommendation": "Clinical action to take"
    }
  ],
  "conditionAlerts": [
    {
      "medication": "Drug name",
      "condition": "Medical condition",
      "severity": "CRITICAL|HIGH|MODERATE|LOW",
      "description": "Why this medication is contraindicated",
      "recommendation": "Clinical action to take"
    }
  ],
  "overallRiskLevel": "CRITICAL|HIGH|MODERATE|LOW",
  "safeToAdminister": true|false,
  "requiresPhysicianReview": true|false,
  "clinicalSummary": "One-paragraph summary of key findings and recommendations"
}

**CRITICAL SAFETY RULES:**
- Always err on the side of caution
- Mark as "requiresPhysicianReview: true" if ANY critical or high-severity interactions exist
- Mark as "safeToAdminister: false" if CRITICAL interactions exist
- Include evidence-based references when possible
- Use standard clinical terminology

Provide your analysis now:`;
  }
}
