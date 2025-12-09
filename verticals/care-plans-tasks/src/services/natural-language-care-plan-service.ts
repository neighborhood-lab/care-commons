/**
 * Natural Language Care Plan Service
 *
 * AI-powered service that creates structured care plans from natural language descriptions.
 * Coordinators can describe client needs in plain text and the AI will generate:
 * - Appropriate goals with measurable outcomes
 * - Interventions to achieve each goal
 * - Task templates for caregivers
 * - Recommended service frequency
 *
 * Uses Claude AI to understand care needs and map them to structured care plan components.
 */

import Anthropic from '@anthropic-ai/sdk';
import type { Knex } from 'knex';
import { v4 as uuidv4 } from 'uuid';
import type {
  CarePlanType,
  CarePlanGoal,
  Intervention,
  TaskTemplate,
  ServiceFrequency,
  GoalCategory,
  InterventionCategory,
  TaskCategory,
  Priority,
  GoalStatus,
  FrequencyPattern,
} from '../types/care-plan';

export interface NaturalLanguageCarePlanRequest {
  organizationId: string;
  clientId: string;
  description: string; // Natural language description of care needs
  clientContext?: {
    name?: string;
    age?: number;
    diagnoses?: string[];
    currentMedications?: string[];
    allergies?: string[];
    mobilityLevel?: string;
    cognitiveStatus?: string;
    livingArrangement?: string;
  };
  preferredPlanType?: CarePlanType;
  estimatedHoursPerWeek?: number;
  focusAreas?: string[]; // e.g., "medication management", "fall prevention"
}

export interface GeneratedGoal extends Omit<CarePlanGoal, 'id'> {
  aiConfidence: number;
  rationale: string;
}

export interface GeneratedIntervention extends Omit<Intervention, 'id' | 'goalIds'> {
  aiConfidence: number;
  supportedGoalNames: string[];
}

export interface GeneratedTaskTemplate extends Omit<TaskTemplate, 'id' | 'interventionIds'> {
  aiConfidence: number;
  supportedInterventionNames: string[];
}

export interface NaturalLanguageCarePlanResult {
  organizationId: string;
  clientId: string;
  planName: string;
  planType: CarePlanType;
  assessmentSummary: string;
  goals: GeneratedGoal[];
  interventions: GeneratedIntervention[];
  taskTemplates: GeneratedTaskTemplate[];
  serviceFrequency: ServiceFrequency;
  estimatedHoursPerWeek: number;
  restrictions: string[];
  precautions: string[];
  recommendations: string[];
  reasoning: string;
  aiConfidence: number;
  generatedAt: string;
}

export class NaturalLanguageCarePlanService {
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
   * Generate a structured care plan from natural language description
   */
  async generateCarePlan(
    request: NaturalLanguageCarePlanRequest
  ): Promise<NaturalLanguageCarePlanResult> {
    const {
      organizationId,
      clientId,
      description,
      clientContext,
      preferredPlanType,
      estimatedHoursPerWeek,
      focusAreas,
    } = request;

    // Fetch additional client context from database if available
    const clientData = await this.getClientContext(clientId);

    // Build the prompt for Claude
    const prompt = this.buildGenerationPrompt(
      description,
      { ...clientData, ...clientContext },
      preferredPlanType,
      estimatedHoursPerWeek,
      focusAreas
    );

    // Call Claude AI
    const message = await this.anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 4000,
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

    let parsedResult: Partial<NaturalLanguageCarePlanResult>;
    try {
      parsedResult = JSON.parse(content.text);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content.text, parseError);
      throw new Error('Failed to parse care plan generation results');
    }

    // Enrich with IDs and proper typing
    const result = this.enrichResult(parsedResult, organizationId, clientId);

    return result;
  }

  /**
   * Get client context from database
   */
  private async getClientContext(clientId: string): Promise<{
    name?: string;
    age?: number;
    diagnoses?: string[];
    allergies?: string[];
    mobilityLevel?: string;
    cognitiveStatus?: string;
  }> {
    const client = await this.db('clients')
      .where('id', clientId)
      .where('is_deleted', false)
      .first();

    if (!client) {
      return {};
    }

    // Calculate age
    let age: number | undefined;
    if (client.date_of_birth) {
      const birthDate = new Date(client.date_of_birth);
      const today = new Date();
      age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
    }

    return {
      name: `${client.first_name ?? ''} ${client.last_name ?? ''}`.trim() || undefined,
      age,
      diagnoses: Array.isArray(client.diagnoses) ? client.diagnoses : undefined,
      allergies: Array.isArray(client.allergies)
        ? client.allergies.map((a: { allergen?: string }) => a.allergen ?? String(a))
        : undefined,
      mobilityLevel: client.mobility_level ?? undefined,
      cognitiveStatus: client.cognitive_status ?? undefined,
    };
  }

  /**
   * Build the generation prompt for Claude
   */
  private buildGenerationPrompt(
    description: string,
    clientContext: NaturalLanguageCarePlanRequest['clientContext'],
    preferredPlanType?: CarePlanType,
    estimatedHours?: number,
    focusAreas?: string[]
  ): string {
    const contextParts: string[] = [];

    if (clientContext?.name) contextParts.push(`Client Name: ${clientContext.name}`);
    if (clientContext?.age) contextParts.push(`Age: ${clientContext.age} years`);
    if (clientContext?.diagnoses?.length)
      contextParts.push(`Diagnoses: ${clientContext.diagnoses.join(', ')}`);
    if (clientContext?.currentMedications?.length)
      contextParts.push(`Medications: ${clientContext.currentMedications.join(', ')}`);
    if (clientContext?.allergies?.length)
      contextParts.push(`Allergies: ${clientContext.allergies.join(', ')}`);
    if (clientContext?.mobilityLevel)
      contextParts.push(`Mobility: ${clientContext.mobilityLevel}`);
    if (clientContext?.cognitiveStatus)
      contextParts.push(`Cognitive Status: ${clientContext.cognitiveStatus}`);
    if (clientContext?.livingArrangement)
      contextParts.push(`Living Arrangement: ${clientContext.livingArrangement}`);

    const contextSection =
      contextParts.length > 0
        ? `**CLIENT CONTEXT:**\n${contextParts.join('\n')}\n\n`
        : '';

    const focusSection =
      focusAreas && focusAreas.length > 0
        ? `**FOCUS AREAS:**\n${focusAreas.join(', ')}\n\n`
        : '';

    const planTypeSection = preferredPlanType
      ? `**PREFERRED PLAN TYPE:** ${preferredPlanType}\n\n`
      : '';

    const hoursSection = estimatedHours
      ? `**TARGET HOURS:** ${estimatedHours} hours per week\n\n`
      : '';

    return `You are an expert home healthcare care plan designer. Your task is to create a comprehensive, structured care plan from a natural language description of client needs.

**CARE NEEDS DESCRIPTION:**
${description}

${contextSection}${focusSection}${planTypeSection}${hoursSection}

**CARE PLAN STRUCTURE:**

Create a care plan with the following components:

1. **Goals**: Specific, measurable, achievable, relevant, time-bound (SMART) objectives
   - Categories: MOBILITY, ADL, IADL, NUTRITION, MEDICATION_MANAGEMENT, SAFETY, SOCIAL_ENGAGEMENT, COGNITIVE, EMOTIONAL_WELLBEING, PAIN_MANAGEMENT, WOUND_CARE, CHRONIC_DISEASE_MANAGEMENT, OTHER
   - Priorities: LOW, MEDIUM, HIGH, URGENT
   - Include measurement criteria when possible

2. **Interventions**: Specific actions to achieve each goal
   - Categories: ASSISTANCE_WITH_ADL, ASSISTANCE_WITH_IADL, MEDICATION_ADMINISTRATION, MEDICATION_REMINDER, VITAL_SIGNS_MONITORING, WOUND_CARE, RANGE_OF_MOTION, AMBULATION_ASSISTANCE, TRANSFER_ASSISTANCE, FALL_PREVENTION, NUTRITION_MEAL_PREP, FEEDING_ASSISTANCE, HYDRATION_MONITORING, INCONTINENCE_CARE, SKIN_CARE, COGNITIVE_STIMULATION, COMPANIONSHIP, SAFETY_MONITORING, TRANSPORTATION, RESPITE_CARE, OTHER
   - Link each intervention to specific goals

3. **Task Templates**: Concrete tasks for caregivers during visits
   - Categories: PERSONAL_HYGIENE, BATHING, DRESSING, GROOMING, TOILETING, MOBILITY, TRANSFERRING, AMBULATION, MEDICATION, MEAL_PREPARATION, FEEDING, HOUSEKEEPING, LAUNDRY, SHOPPING, TRANSPORTATION, COMPANIONSHIP, MONITORING, DOCUMENTATION, OTHER
   - Include clear instructions and estimated duration

4. **Service Frequency**: How often visits should occur
   - Patterns: DAILY, WEEKLY, BI_WEEKLY, MONTHLY, AS_NEEDED, CUSTOM

5. **Restrictions and Precautions**: Safety considerations

**RESPONSE FORMAT (JSON only):**
{
  "planName": "Brief descriptive name for the care plan",
  "planType": "PERSONAL_CARE|COMPANION|SKILLED_NURSING|THERAPY|HOSPICE|RESPITE|LIVE_IN|CUSTOM",
  "assessmentSummary": "Brief summary of assessed needs (2-3 sentences)",
  "goals": [
    {
      "name": "Goal name",
      "description": "Detailed description",
      "category": "MOBILITY|ADL|IADL|...",
      "priority": "LOW|MEDIUM|HIGH|URGENT",
      "status": "NOT_STARTED",
      "measurementType": "QUANTITATIVE|QUALITATIVE|BINARY",
      "targetValue": 100,
      "currentValue": 0,
      "unit": "percent|steps|etc",
      "aiConfidence": 0.85,
      "rationale": "Why this goal was identified"
    }
  ],
  "interventions": [
    {
      "name": "Intervention name",
      "description": "What this intervention involves",
      "category": "ASSISTANCE_WITH_ADL|...",
      "supportedGoalNames": ["Goal 1", "Goal 2"],
      "frequency": {
        "pattern": "DAILY|WEEKLY|...",
        "timesPerDay": 2,
        "timesPerWeek": 7
      },
      "duration": 30,
      "instructions": "Step-by-step instructions",
      "precautions": ["Safety precaution 1"],
      "performedBy": ["CAREGIVER", "HHA"],
      "requiresDocumentation": true,
      "status": "ACTIVE",
      "startDate": "2025-01-01",
      "aiConfidence": 0.9
    }
  ],
  "taskTemplates": [
    {
      "name": "Task name",
      "description": "Brief description",
      "category": "BATHING|MEDICATION|...",
      "supportedInterventionNames": ["Intervention 1"],
      "frequency": {
        "pattern": "DAILY",
        "timesPerDay": 1
      },
      "estimatedDuration": 15,
      "timeOfDay": ["MORNING"],
      "instructions": "Clear instructions for caregiver",
      "steps": [
        {
          "stepNumber": 1,
          "description": "Step description",
          "isRequired": true,
          "estimatedDuration": 5
        }
      ],
      "requiresSignature": false,
      "requiresNote": true,
      "isOptional": false,
      "allowSkip": true,
      "skipReasons": ["Client refused", "Not needed today"],
      "status": "ACTIVE",
      "aiConfidence": 0.88
    }
  ],
  "serviceFrequency": {
    "pattern": "DAILY|WEEKLY|...",
    "timesPerWeek": 5,
    "specificDays": ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"]
  },
  "estimatedHoursPerWeek": 20,
  "restrictions": ["Client should not lift more than 10 lbs"],
  "precautions": ["Fall risk - ensure clear pathways"],
  "recommendations": [
    "Recommendation for care team"
  ],
  "reasoning": "Explanation of care plan design decisions",
  "aiConfidence": 0.85
}

Generate a comprehensive care plan based on the description provided:`;
  }

  /**
   * Enrich the AI result with proper IDs and typing
   */
  private enrichResult(
    parsed: Partial<NaturalLanguageCarePlanResult>,
    organizationId: string,
    clientId: string
  ): NaturalLanguageCarePlanResult {
    // Generate consistent IDs for goals, interventions, tasks
    const goals: GeneratedGoal[] = (parsed.goals ?? []).map((goal) => ({
      ...goal,
      id: uuidv4(),
      name: goal.name ?? 'Unnamed Goal',
      description: goal.description ?? '',
      category: (goal.category as GoalCategory) ?? 'OTHER',
      priority: (goal.priority as Priority) ?? 'MEDIUM',
      status: (goal.status as GoalStatus) ?? 'NOT_STARTED',
      aiConfidence: goal.aiConfidence ?? 0.7,
      rationale: goal.rationale ?? 'Generated from natural language description',
    }));

    const interventions: GeneratedIntervention[] = (parsed.interventions ?? []).map((interv) => ({
      ...interv,
      id: uuidv4(),
      name: interv.name ?? 'Unnamed Intervention',
      description: interv.description ?? '',
      category: (interv.category as InterventionCategory) ?? 'OTHER',
      supportedGoalNames: interv.supportedGoalNames ?? [],
      frequency: interv.frequency ?? { pattern: 'DAILY' as FrequencyPattern },
      instructions: interv.instructions ?? '',
      performedBy: interv.performedBy ?? ['CAREGIVER'],
      requiresDocumentation: interv.requiresDocumentation ?? true,
      status: (interv.status as 'ACTIVE' | 'SUSPENDED' | 'DISCONTINUED') ?? 'ACTIVE',
      startDate: interv.startDate ? new Date(interv.startDate) : new Date(),
      aiConfidence: interv.aiConfidence ?? 0.7,
    }));

    const taskTemplates: GeneratedTaskTemplate[] = (parsed.taskTemplates ?? []).map((task) => ({
      ...task,
      id: uuidv4(),
      name: task.name ?? 'Unnamed Task',
      description: task.description ?? '',
      category: (task.category as TaskCategory) ?? 'OTHER',
      supportedInterventionNames: task.supportedInterventionNames ?? [],
      frequency: task.frequency ?? { pattern: 'DAILY' as FrequencyPattern },
      instructions: task.instructions ?? '',
      requiresSignature: task.requiresSignature ?? false,
      requiresNote: task.requiresNote ?? true,
      isOptional: task.isOptional ?? false,
      allowSkip: task.allowSkip ?? true,
      status: (task.status as 'ACTIVE' | 'INACTIVE' | 'ARCHIVED') ?? 'ACTIVE',
      aiConfidence: task.aiConfidence ?? 0.7,
    }));

    return {
      organizationId,
      clientId,
      planName: parsed.planName ?? 'Generated Care Plan',
      planType: parsed.planType ?? 'PERSONAL_CARE',
      assessmentSummary: parsed.assessmentSummary ?? '',
      goals,
      interventions,
      taskTemplates,
      serviceFrequency: parsed.serviceFrequency ?? {
        pattern: 'WEEKLY' as FrequencyPattern,
        timesPerWeek: 3,
      },
      estimatedHoursPerWeek: parsed.estimatedHoursPerWeek ?? 10,
      restrictions: parsed.restrictions ?? [],
      precautions: parsed.precautions ?? [],
      recommendations: parsed.recommendations ?? [],
      reasoning: parsed.reasoning ?? 'Generated from natural language description',
      aiConfidence: parsed.aiConfidence ?? 0.75,
      generatedAt: new Date().toISOString(),
    };
  }
}

/**
 * Factory function for creating the service
 */
export function createNaturalLanguageCarePlanService(
  db: Knex
): NaturalLanguageCarePlanService {
  return new NaturalLanguageCarePlanService(db);
}
