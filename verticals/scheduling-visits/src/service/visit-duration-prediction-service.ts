/**
 * Visit Duration Prediction Service
 *
 * AI-powered prediction of visit duration based on:
 * - Patient acuity and care needs
 * - Visit type and required tasks
 * - Historical visit duration patterns
 * - Caregiver efficiency patterns
 *
 * This helps schedulers create more accurate schedules and avoid
 * under/over-booking caregivers.
 */

import Anthropic from '@anthropic-ai/sdk';
import type { Knex } from 'knex';

export interface DurationPredictionRequest {
  clientId: string;
  visitType: string;
  caregiverId?: string;
  scheduledDate?: string;
  tasksPlanned?: string[];
}

export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface DurationRange {
  minimum: number; // minutes
  expected: number; // minutes
  maximum: number; // minutes
}

export interface DurationFactor {
  factor: string;
  impact: 'INCREASES' | 'DECREASES' | 'NEUTRAL';
  description: string;
  adjustmentMinutes: number;
}

export interface VisitDurationPrediction {
  clientId: string;
  visitType: string;
  durationRange: DurationRange;
  confidence: ConfidenceLevel;
  factors: DurationFactor[];
  recommendations: string[];
  basedOnHistoricalVisits: number;
  predictedAt: string;
  reasoning: string;
}

export class VisitDurationPredictionService {
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
   * Predict visit duration using Claude AI
   */
  async predictDuration(
    request: DurationPredictionRequest
  ): Promise<VisitDurationPrediction> {
    // Fetch client data
    const client = await this.db('clients')
      .select('*')
      .where({ id: request.clientId, is_deleted: false })
      .first();

    if (!client) {
      throw new Error('Client not found');
    }

    // Fetch historical visits for this client
    const historicalVisits = await this.db('visits')
      .select('visit_type', 'scheduled_start_time', 'scheduled_end_time', 'actual_start_time', 'actual_end_time', 'status')
      .where({ client_id: request.clientId, is_deleted: false })
      .whereIn('status', ['COMPLETED', 'VERIFIED'])
      .orderBy('scheduled_date', 'desc')
      .limit(20);

    // Fetch caregiver data if provided
    let caregiver: Record<string, unknown> | null = null;
    if (request.caregiverId) {
      caregiver = await this.db('caregivers')
        .select('first_name', 'last_name', 'experience_years')
        .where({ id: request.caregiverId, is_deleted: false })
        .first();
    }

    // Fetch care plan tasks if available
    const carePlanTasks = await this.db('care_plan_tasks')
      .select('task_name', 'estimated_duration_minutes', 'frequency')
      .where({ client_id: request.clientId, is_deleted: false })
      .limit(50);

    // Build analysis prompt
    const prompt = this.buildPredictionPrompt(
      client,
      request.visitType,
      historicalVisits,
      caregiver,
      carePlanTasks,
      request.tasksPlanned
    );

    // Call Claude AI
    const message = await this.anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 1500,
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

    let predictionResult: Partial<VisitDurationPrediction>;
    try {
      const textContent = content as { type: 'text'; text: string };
      predictionResult = JSON.parse(textContent.text);
    } catch (parseError) {
      const textContent = content as { type: 'text'; text: string };
      console.error('Failed to parse AI response:', textContent.text, parseError);
      throw new Error('Failed to parse visit duration prediction');
    }

    // Build result
    const result: VisitDurationPrediction = {
      clientId: request.clientId,
      visitType: request.visitType,
      durationRange: predictionResult.durationRange ?? { minimum: 30, expected: 60, maximum: 90 },
      confidence: predictionResult.confidence ?? 'LOW',
      factors: predictionResult.factors ?? [],
      recommendations: predictionResult.recommendations ?? [],
      basedOnHistoricalVisits: historicalVisits.length,
      predictedAt: new Date().toISOString(),
      reasoning: predictionResult.reasoning ?? 'No reasoning available.',
    };

    return result;
  }

  /**
   * Build duration prediction prompt for Claude
   */
  private buildPredictionPrompt(
    client: Record<string, unknown>,
    visitType: string,
    historicalVisits: Array<Record<string, unknown>>,
    caregiver: Record<string, unknown> | null,
    carePlanTasks: Array<Record<string, unknown>>,
    tasksPlanned?: string[]
  ): string {
    const clientName = `${client.first_name} ${client.last_name}`;
    const caregiverName = caregiver ? `${caregiver.first_name} ${caregiver.last_name}` : 'Not assigned';

    // Calculate historical averages
    let avgDuration = 0;
    let totalDuration = 0;
    let completedCount = 0;

    for (const visit of historicalVisits) {
      if (visit.actual_start_time && visit.actual_end_time) {
        const start = new Date(`2000-01-01T${visit.actual_start_time}`);
        const end = new Date(`2000-01-01T${visit.actual_end_time}`);
        const duration = (end.getTime() - start.getTime()) / (1000 * 60); // minutes
        if (duration > 0 && duration < 480) { // Sanity check: less than 8 hours
          totalDuration += duration;
          completedCount++;
        }
      }
    }

    if (completedCount > 0) {
      avgDuration = Math.round(totalDuration / completedCount);
    }

    // Format historical visit summary
    const visitSummary = historicalVisits.length > 0
      ? `${historicalVisits.length} visits found, ${completedCount} with timing data, average duration: ${avgDuration || 'N/A'} minutes`
      : 'No historical visits found';

    // Format care plan tasks
    const taskList = carePlanTasks.length > 0
      ? carePlanTasks.map((t: Record<string, unknown>) => `- ${t.task_name} (${t.estimated_duration_minutes || '?'} min)`).join('\n')
      : 'No care plan tasks defined';

    // Format planned tasks
    const plannedTaskList = tasksPlanned && tasksPlanned.length > 0
      ? tasksPlanned.map(t => `- ${t}`).join('\n')
      : 'No specific tasks planned';

    return `You are a home health scheduling expert analyzing visit data to predict visit duration. Your role is to provide accurate duration predictions to help schedulers create realistic schedules.

**CLIENT CONTEXT:**
- Client: ${clientName}
- Acuity Level: ${client.acuity_level || 'Not specified'}
- Mobility: ${client.mobility_status || 'Not specified'}
- Medical Conditions: ${Array.isArray(client.medical_conditions) ? client.medical_conditions.join(', ') : 'Not specified'}
- Special Notes: ${client.special_notes || 'None'}

**VISIT CONTEXT:**
- Visit Type: ${visitType}
- Assigned Caregiver: ${caregiverName}${caregiver?.experience_years ? ` (${caregiver.experience_years} years experience)` : ''}

**HISTORICAL DATA:**
${visitSummary}

**CARE PLAN TASKS:**
${taskList}

**PLANNED TASKS FOR THIS VISIT:**
${plannedTaskList}

**PREDICTION GUIDELINES:**

1. **Base Duration by Visit Type:**
   - Personal Care: 45-90 minutes
   - Skilled Nursing: 30-60 minutes
   - Companion/Respite: 2-4 hours
   - Therapy (PT/OT/ST): 45-60 minutes
   - Assessment: 60-90 minutes

2. **Adjustment Factors:**
   - Higher acuity = longer visits (+10-30%)
   - Limited mobility = longer transfers/positioning (+15-25%)
   - Multiple tasks = cumulative time
   - New caregiver = orientation time (+10-15%)
   - Experienced caregiver = efficiency (-5-10%)

3. **Confidence Levels:**
   - HIGH: 5+ historical visits with timing data, consistent patterns
   - MEDIUM: 2-4 historical visits or moderate variation
   - LOW: New client or highly variable history

**RESPONSE FORMAT (JSON):**
Return ONLY valid JSON with this exact structure:
{
  "durationRange": {
    "minimum": 45,
    "expected": 60,
    "maximum": 75
  },
  "confidence": "MEDIUM",
  "factors": [
    {
      "factor": "Client Mobility",
      "impact": "INCREASES",
      "description": "Limited mobility requires additional transfer assistance",
      "adjustmentMinutes": 10
    },
    {
      "factor": "Experienced Caregiver",
      "impact": "DECREASES",
      "description": "Caregiver has 5+ years experience, efficient workflow",
      "adjustmentMinutes": -5
    }
  ],
  "recommendations": [
    "Allow 15-minute buffer before next visit for documentation",
    "Consider scheduling 75 minutes if wound care is needed"
  ],
  "reasoning": "Based on 8 historical visits averaging 58 minutes, this personal care visit is predicted at 60 minutes. The client's limited mobility adds time for transfers, but the experienced caregiver offsets some of this. Confidence is medium due to consistent historical patterns."
}

Provide your duration prediction now:`;
  }
}
