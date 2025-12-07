/**
 * Task Prioritization Service
 *
 * AI-powered service that analyzes care plan tasks and patient condition
 * to intelligently prioritize tasks for caregivers.
 *
 * Uses Claude AI to rank tasks based on:
 * - Patient medical condition and diagnosis
 * - Recent vital signs and health trends
 * - Task urgency and timing requirements
 * - Recent visit notes and observations
 * - Care plan goals and interventions
 */

import Anthropic from '@anthropic-ai/sdk';
import { Pool } from 'pg';
import { UUID, NotFoundError } from '@folkcare/core';

/**
 * Configuration for task prioritization service
 */
export interface TaskPrioritizationConfig {
  anthropicApiKey: string;
  maxTokens?: number;
  temperature?: number;
  lookbackDays?: number; // How many days of history to analyze
}

/**
 * Prioritized task with urgency score
 */
export interface PrioritizedTask {
  taskId: UUID;
  taskName: string;
  taskCategory: string;
  taskDescription: string;
  scheduledTime?: string;
  estimatedDuration?: number;

  // AI-generated prioritization
  urgencyLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  urgencyScore: number; // 0-100
  priorityReason: string;
  recommendedTimeframe: string;

  // Context
  relatedGoals?: string[];
  safetyConsiderations?: string[];
}

/**
 * Request to prioritize tasks
 */
export interface PrioritizeTasksRequest {
  caregiverId: UUID;
  clientId: UUID;
  date: string; // YYYY-MM-DD
  visitId?: UUID; // Optional - if prioritizing for specific visit
}

/**
 * Prioritization result
 */
export interface TaskPrioritizationResult {
  clientName: string;
  clientId: UUID;
  date: string;
  totalTasks: number;

  // Prioritized tasks (ordered by urgency)
  tasks: PrioritizedTask[];

  // Patient context summary
  patientConditionSummary: string;
  criticalAlerts?: string[];

  // Metadata
  analyzedAt: string;
  basedOnNotesCount: number;
  basedOnVitalsCount: number;
}

/**
 * Client details from database
 */
interface ClientRecord {
  id: UUID;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  medical_diagnoses?: string[];
  functional_limitations?: string[];
  allergies?: string[];
}

/**
 * Care plan record from database
 */
interface CarePlanGoalRecord {
  id: UUID;
  name: string;
  category: string;
  status: string;
}

interface CarePlanInterventionRecord {
  id: UUID;
  name: string;
}

interface CarePlanAllergyRecord {
  allergen: string;
  severity: string;
}

interface CarePlanRecord {
  id: UUID;
  name: string;
  assessment_summary?: string;
  medical_diagnosis?: string[];
  functional_limitations?: string[];
  goals: CarePlanGoalRecord[];
  interventions: CarePlanInterventionRecord[];
  allergies?: CarePlanAllergyRecord[];
  precautions?: string[];
  restrictions?: string[];
}

/**
 * Task instance record from database
 */
interface TaskInstanceRecord {
  id: UUID;
  name: string;
  description: string;
  category: string;
  instructions: string;
  scheduled_time?: string;
  estimated_duration?: number;
  status: string;
  required_signature: boolean;
  required_note: boolean;
}

/**
 * Recent visit note record
 */
interface RecentNoteRecord {
  id: UUID;
  note_text: string;
  client_mood?: string;
  activities_performed?: string[];
  client_condition_notes?: string;
  created_at: string;
  note_type: string;
}

/**
 * Recent vital signs record
 */
interface VitalSignsRecord {
  recorded_at: string;
  blood_pressure_systolic?: number;
  blood_pressure_diastolic?: number;
  heart_rate?: number;
  temperature?: number;
  oxygen_saturation?: number;
  blood_glucose?: number;
  pain_level?: number;
  notes?: string;
}

/**
 * Service for AI-powered task prioritization
 */
export class TaskPrioritizationService {
  private client: Anthropic;
  private config: TaskPrioritizationConfig;

  constructor(
    private pool: Pool,
    config: TaskPrioritizationConfig
  ) {
    this.config = {
      maxTokens: 2048,
      temperature: 0.3,
      lookbackDays: 30,
      ...config,
    };

    this.client = new Anthropic({
      apiKey: this.config.anthropicApiKey,
    });
  }

  /**
   * Prioritize tasks for a caregiver's visit
   */
  async prioritizeTasks(request: PrioritizeTasksRequest): Promise<TaskPrioritizationResult> {
    // 1. Get client details
    const client = await this.getClientDetails(request.clientId);
    if (!client) {
      throw new NotFoundError('Client not found', { clientId: request.clientId });
    }

    // 2. Get active care plan
    const carePlan = await this.getActiveCarePlan(request.clientId);
    if (!carePlan) {
      throw new NotFoundError('No active care plan found for client', { clientId: request.clientId });
    }

    // 3. Get tasks for the specified date
    const tasks = await this.getTasksForDate(request.clientId, request.caregiverId, request.date);

    // If no tasks, return empty result
    if (tasks.length === 0) {
      return {
        clientName: `${client.first_name} ${client.last_name}`,
        clientId: request.clientId,
        date: request.date,
        totalTasks: 0,
        tasks: [],
        patientConditionSummary: 'No tasks scheduled for this date.',
        analyzedAt: new Date().toISOString(),
        basedOnNotesCount: 0,
        basedOnVitalsCount: 0,
      };
    }

    // 4. Get recent visit notes
    const recentNotes = await this.getRecentNotes(request.clientId);

    // 5. Get recent vital signs
    const recentVitals = await this.getRecentVitals(request.clientId);

    // 6. Analyze with Claude AI
    const prioritization = await this.analyzeWithAI(
      client,
      carePlan,
      tasks,
      recentNotes,
      recentVitals
    );

    return {
      clientName: `${client.first_name} ${client.last_name}`,
      clientId: request.clientId,
      date: request.date,
      totalTasks: tasks.length,
      tasks: prioritization.tasks,
      patientConditionSummary: prioritization.patientConditionSummary,
      criticalAlerts: prioritization.criticalAlerts,
      analyzedAt: new Date().toISOString(),
      basedOnNotesCount: recentNotes.length,
      basedOnVitalsCount: recentVitals.length,
    };
  }

  /**
   * Get client details from database
   */
  private async getClientDetails(clientId: UUID): Promise<ClientRecord | null> {
    const query = `
      SELECT
        id,
        first_name,
        last_name,
        date_of_birth,
        medical_diagnoses,
        functional_limitations,
        allergies
      FROM clients
      WHERE id = $1 AND deleted_at IS NULL
    `;

    const result = await this.pool.query(query, [clientId]);
    return result.rows[0] || null;
  }

  /**
   * Get active care plan for client
   */
  private async getActiveCarePlan(clientId: UUID): Promise<CarePlanRecord | null> {
    const query = `
      SELECT
        id,
        name,
        assessment_summary,
        medical_diagnosis,
        functional_limitations,
        goals,
        interventions,
        allergies,
        precautions,
        restrictions
      FROM care_plans
      WHERE client_id = $1
        AND status = 'ACTIVE'
        AND deleted_at IS NULL
        AND (expiration_date IS NULL OR expiration_date >= CURRENT_DATE)
      ORDER BY effective_date DESC
      LIMIT 1
    `;

    const result = await this.pool.query(query, [clientId]);
    return result.rows[0] || null;
  }

  /**
   * Get tasks scheduled for a specific date
   */
  private async getTasksForDate(
    clientId: UUID,
    caregiverId: UUID,
    date: string
  ): Promise<TaskInstanceRecord[]> {
    const query = `
      SELECT
        id,
        name,
        description,
        category,
        instructions,
        scheduled_time,
        estimated_duration,
        status,
        required_signature,
        required_note
      FROM task_instances
      WHERE client_id = $1
        AND (assigned_caregiver_id = $2 OR assigned_caregiver_id IS NULL)
        AND scheduled_date = $3
        AND status IN ('SCHEDULED', 'IN_PROGRESS')
      ORDER BY scheduled_time NULLS LAST
    `;

    const result = await this.pool.query(query, [clientId, caregiverId, date]);
    return result.rows;
  }

  /**
   * Get recent visit notes for client
   */
  private async getRecentNotes(clientId: UUID): Promise<RecentNoteRecord[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - (this.config.lookbackDays ?? 30));

    const query = `
      SELECT
        vn.id,
        vn.note_text,
        vn.client_mood,
        vn.activities_performed,
        vn.client_condition_notes,
        vn.created_at,
        vn.note_type
      FROM visit_notes vn
      INNER JOIN visits v ON vn.visit_id = v.id
      WHERE v.client_id = $1
        AND vn.deleted_at IS NULL
        AND vn.created_at >= $2
      ORDER BY vn.created_at DESC
      LIMIT 10
    `;

    const result = await this.pool.query(query, [clientId, cutoffDate]);
    return result.rows;
  }

  /**
   * Get recent vital signs for client
   */
  private async getRecentVitals(clientId: UUID): Promise<VitalSignsRecord[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 14); // Last 2 weeks

    const query = `
      SELECT
        recorded_at,
        blood_pressure_systolic,
        blood_pressure_diastolic,
        heart_rate,
        temperature,
        oxygen_saturation,
        blood_glucose,
        pain_level,
        notes
      FROM vital_signs
      WHERE client_id = $1
        AND recorded_at >= $2
      ORDER BY recorded_at DESC
      LIMIT 10
    `;

    const result = await this.pool.query(query, [clientId, cutoffDate]);
    return result.rows;
  }

  /**
   * Analyze with Claude AI to prioritize tasks
   */
  private async analyzeWithAI(
    client: ClientRecord,
    carePlan: CarePlanRecord,
    tasks: TaskInstanceRecord[],
    recentNotes: RecentNoteRecord[],
    recentVitals: VitalSignsRecord[]
  ): Promise<{
    tasks: PrioritizedTask[];
    patientConditionSummary: string;
    criticalAlerts?: string[];
  }> {
    // Build context about patient
    const patientContext = this.buildPatientContext(client, carePlan, recentNotes, recentVitals);

    // Build tasks list
    const tasksContext = tasks
      .map((task, idx) => {
        return `
Task ${idx + 1}:
- ID: ${task.id}
- Name: ${task.name}
- Category: ${task.category}
- Description: ${task.description}
- Instructions: ${task.instructions}
- Scheduled Time: ${task.scheduled_time || 'Not specified'}
- Estimated Duration: ${task.estimated_duration ? `${task.estimated_duration} minutes` : 'Not specified'}
- Requires Signature: ${task.required_signature ? 'Yes' : 'No'}
- Requires Note: ${task.required_note ? 'Yes' : 'No'}
`;
      })
      .join('\n');

    const prompt = `You are a healthcare task prioritization AI assistant. Analyze the patient's condition and scheduled tasks to intelligently prioritize them for the caregiver.

PATIENT INFORMATION:
${patientContext}

SCHEDULED TASKS (${tasks.length} total):
${tasksContext}

Based on the patient's current condition, medical history, recent vital signs, and recent notes, prioritize these tasks.

For each task, assign:
1. urgencyLevel: "CRITICAL", "HIGH", "MEDIUM", or "LOW"
2. urgencyScore: 0-100 (100 = most urgent)
3. priorityReason: Brief explanation (1-2 sentences) of why this task has this priority
4. recommendedTimeframe: When the task should ideally be completed (e.g., "Within first 30 minutes", "Mid-visit", "Before departure")
5. relatedGoals: Array of care plan goals this task supports (if any)
6. safetyConsiderations: Array of safety considerations (if any critical concerns)

Also provide:
- patientConditionSummary: A 2-3 sentence summary of the patient's current condition and any trends
- criticalAlerts: Array of any critical alerts or urgent concerns (empty array if none)

Return ONLY valid JSON in this exact format:
{
  "patientConditionSummary": "string",
  "criticalAlerts": ["string", ...] or [],
  "tasks": [
    {
      "taskId": "uuid",
      "taskName": "string",
      "taskCategory": "string",
      "taskDescription": "string",
      "scheduledTime": "string or null",
      "estimatedDuration": number or null,
      "urgencyLevel": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
      "urgencyScore": number (0-100),
      "priorityReason": "string",
      "recommendedTimeframe": "string",
      "relatedGoals": ["string", ...] or [],
      "safetyConsiderations": ["string", ...] or []
    }
  ]
}

Order tasks by urgency (highest urgency first). Consider:
- Patient safety and health status
- Task dependencies and timing
- Care plan goals and interventions
- Recent health trends and observations
- Time-sensitive activities (medications, meals, etc.)`;

    const message = await this.client.messages.create({
      model: 'claude-3-5-haiku-20241022', // Fast, cost-effective model
      max_tokens: this.config.maxTokens ?? 2048,
      temperature: this.config.temperature ?? 0.3,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Parse AI response
    const firstBlock = message.content[0];
    const responseText = firstBlock && firstBlock.type === 'text' ? firstBlock.text : '{}';

    try {
      const parsed = JSON.parse(responseText);
      return {
        tasks: parsed.tasks || [],
        patientConditionSummary: parsed.patientConditionSummary || 'Unable to generate summary.',
        criticalAlerts: parsed.criticalAlerts || [],
      };
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      console.error('Response text:', responseText);

      // Return tasks in original order with default prioritization on error
      return {
        tasks: tasks.map((task) => ({
          taskId: task.id,
          taskName: task.name,
          taskCategory: task.category,
          taskDescription: task.description,
          scheduledTime: task.scheduled_time || undefined,
          estimatedDuration: task.estimated_duration || undefined,
          urgencyLevel: 'MEDIUM' as const,
          urgencyScore: 50,
          priorityReason: 'Default prioritization (AI analysis unavailable)',
          recommendedTimeframe: task.scheduled_time || 'As scheduled',
          relatedGoals: [],
          safetyConsiderations: [],
        })),
        patientConditionSummary: 'AI analysis unavailable. Please use clinical judgment.',
        criticalAlerts: [],
      };
    }
  }

  /**
   * Build patient context for AI analysis
   */
  private buildPatientContext(
    client: ClientRecord,
    carePlan: CarePlanRecord,
    recentNotes: RecentNoteRecord[],
    recentVitals: VitalSignsRecord[]
  ): string {
    const sections: string[] = [];

    // Basic demographics
    sections.push(`Patient: ${client.first_name} ${client.last_name}`);
    sections.push(`Date of Birth: ${client.date_of_birth}`);

    // Medical diagnoses
    if (carePlan.medical_diagnosis && carePlan.medical_diagnosis.length > 0) {
      sections.push(`\nMedical Diagnoses: ${carePlan.medical_diagnosis.join(', ')}`);
    }

    // Functional limitations
    if (carePlan.functional_limitations && carePlan.functional_limitations.length > 0) {
      sections.push(`Functional Limitations: ${carePlan.functional_limitations.join(', ')}`);
    }

    // Allergies
    if (carePlan.allergies && Array.isArray(carePlan.allergies) && carePlan.allergies.length > 0) {
      const allergyList = carePlan.allergies.map((a) => `${a.allergen} (${a.severity})`).join(', ');
      sections.push(`Allergies: ${allergyList}`);
    }

    // Precautions and restrictions
    if (carePlan.precautions && carePlan.precautions.length > 0) {
      sections.push(`Precautions: ${carePlan.precautions.join(', ')}`);
    }
    if (carePlan.restrictions && carePlan.restrictions.length > 0) {
      sections.push(`Restrictions: ${carePlan.restrictions.join(', ')}`);
    }

    // Assessment summary
    if (carePlan.assessment_summary) {
      sections.push(`\nAssessment Summary:\n${carePlan.assessment_summary}`);
    }

    // Care plan goals
    if (carePlan.goals && carePlan.goals.length > 0) {
      sections.push('\nCare Plan Goals:');
      carePlan.goals.forEach((goal, idx) => {
        sections.push(`${idx + 1}. ${goal.name} (${goal.category}) - Status: ${goal.status}`);
      });
    }

    // Recent vital signs
    if (recentVitals.length > 0) {
      sections.push('\nRecent Vital Signs (last 2 weeks):');
      recentVitals.slice(0, 5).forEach((vital) => {
        const vitalParts: string[] = [];
        vitalParts.push(`  - ${new Date(vital.recorded_at).toLocaleDateString()}`);
        if (vital.blood_pressure_systolic && vital.blood_pressure_diastolic) {
          vitalParts.push(`BP: ${vital.blood_pressure_systolic}/${vital.blood_pressure_diastolic}`);
        }
        if (vital.heart_rate) vitalParts.push(`HR: ${vital.heart_rate}`);
        if (vital.temperature) vitalParts.push(`Temp: ${vital.temperature}°F`);
        if (vital.oxygen_saturation) vitalParts.push(`O2: ${vital.oxygen_saturation}%`);
        if (vital.pain_level !== undefined && vital.pain_level !== null) {
          vitalParts.push(`Pain: ${vital.pain_level}/10`);
        }
        if (vital.notes) vitalParts.push(`Notes: ${vital.notes}`);
        sections.push(vitalParts.join(', '));
      });
    }

    // Recent visit notes
    if (recentNotes.length > 0) {
      sections.push('\nRecent Visit Notes (last 30 days):');
      recentNotes.slice(0, 3).forEach((note, idx) => {
        sections.push(`\nNote ${idx + 1} (${new Date(note.created_at).toLocaleDateString()}):`);
        if (note.client_mood) sections.push(`  Mood: ${note.client_mood}`);
        if (note.activities_performed && note.activities_performed.length > 0) {
          sections.push(`  Activities: ${note.activities_performed.join(', ')}`);
        }
        if (note.client_condition_notes) {
          sections.push(`  Condition Notes: ${note.client_condition_notes}`);
        }
        sections.push(`  Note: ${note.note_text.substring(0, 200)}${note.note_text.length > 200 ? '...' : ''}`);
      });
    }

    return sections.join('\n');
  }
}

/**
 * Factory function to create task prioritization service
 */
export function createTaskPrioritizationService(
  pool: Pool,
  config: TaskPrioritizationConfig
): TaskPrioritizationService {
  return new TaskPrioritizationService(pool, config);
}
