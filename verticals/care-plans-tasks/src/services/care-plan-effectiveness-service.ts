/**
 * Care Plan Effectiveness Scoring Service
 *
 * AI-powered scoring of care plan effectiveness based on outcomes:
 * - Goal achievement rates
 * - Task completion patterns
 * - Client health trends (vitals, weight, mobility)
 * - Incident rates (falls, hospitalizations)
 * - Visit attendance and consistency
 * - Caregiver feedback and notes sentiment
 *
 * This helps care coordinators identify which care plans are working
 * and which may need adjustment.
 */

import Anthropic from '@anthropic-ai/sdk';
import type { Knex } from 'knex';

export interface EffectivenessScoreRequest {
  carePlanId: string;
  organizationId: string;
  evaluationPeriodDays?: number; // Default 90 days
  includeRecommendations?: boolean;
}

export type EffectivenessRating = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'NEEDS_IMPROVEMENT' | 'CRITICAL';

export type TrendDirection = 'IMPROVING' | 'STABLE' | 'DECLINING';

export interface GoalProgress {
  goalId: string;
  goalDescription: string;
  targetDate: string | null;
  progressPercentage: number;
  status: 'ON_TRACK' | 'AT_RISK' | 'BEHIND' | 'COMPLETED' | 'NOT_STARTED';
  contributingFactors: string[];
}

export interface TaskMetrics {
  totalTasks: number;
  completedTasks: number;
  skippedTasks: number;
  completionRate: number;
  averageCompletionTime: number | null; // minutes
  commonSkipReasons: string[];
}

export interface HealthTrend {
  category: string;
  trend: TrendDirection;
  details: string;
  dataPoints: number;
  concernLevel: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
}

export interface IncidentSummary {
  category: string;
  count: number;
  trend: TrendDirection;
  lastOccurrence: string | null;
  impactOnEffectiveness: string;
}

export interface DimensionScore {
  dimension: string;
  score: number; // 0-100
  weight: number; // 0-1
  rating: EffectivenessRating;
  details: string;
}

export interface EffectivenessRecommendation {
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  category: string;
  recommendation: string;
  expectedImpact: string;
  implementationSteps: string[];
}

export interface CarePlanEffectivenessScore {
  carePlanId: string;
  clientId: string;
  organizationId: string;
  overallScore: number; // 0-100
  overallRating: EffectivenessRating;
  overallTrend: TrendDirection;
  dimensionScores: DimensionScore[];
  goalProgress: GoalProgress[];
  taskMetrics: TaskMetrics;
  healthTrends: HealthTrend[];
  incidentSummary: IncidentSummary[];
  recommendations: EffectivenessRecommendation[];
  evaluationPeriodDays: number;
  dataQualityScore: number; // 0-100 - how complete is the data
  clinicalSummary: string;
  evaluatedAt: string;
}

export class CarePlanEffectivenessService {
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
   * Score care plan effectiveness using Claude AI
   */
  async scoreEffectiveness(
    request: EffectivenessScoreRequest
  ): Promise<CarePlanEffectivenessScore> {
    const evaluationPeriodDays = request.evaluationPeriodDays ?? 90;
    const evaluationStartDate = new Date();
    evaluationStartDate.setDate(evaluationStartDate.getDate() - evaluationPeriodDays);
    const startDateStr = evaluationStartDate.toISOString().split('T')[0] ?? '';

    // Fetch care plan
    const carePlan = await this.db('care_plans')
      .select('*')
      .where({
        id: request.carePlanId,
        organization_id: request.organizationId,
        is_deleted: false
      })
      .first();

    if (!carePlan) {
      throw new Error('Care plan not found');
    }

    // Fetch client
    const client = await this.db('clients')
      .select('*')
      .where({ id: carePlan.client_id, is_deleted: false })
      .first();

    if (!client) {
      throw new Error('Client not found');
    }

    // Fetch care plan goals
    const goals = await this.db('care_plan_goals')
      .select('*')
      .where({ care_plan_id: request.carePlanId, is_deleted: false });

    // Fetch care plan tasks
    const tasks = await this.db('care_plan_tasks')
      .select('*')
      .where({ care_plan_id: request.carePlanId, is_deleted: false });

    // Fetch task instances with completion data
    const taskInstances = await this.db('task_instances')
      .select('*')
      .where({ care_plan_id: request.carePlanId, is_deleted: false })
      .andWhere('created_at', '>=', startDateStr);

    // Fetch visits
    const visits = await this.db('visits')
      .select('*')
      .where({ client_id: carePlan.client_id, is_deleted: false })
      .andWhere('scheduled_date', '>=', startDateStr);

    // Fetch incidents
    const incidents = await this.db('incidents')
      .select('*')
      .where({ client_id: carePlan.client_id, is_deleted: false })
      .andWhere('occurred_at', '>=', evaluationStartDate.toISOString());

    // Fetch visit notes for sentiment analysis
    const visitNotes = await this.db('visit_notes')
      .select('note_text', 'note_type', 'created_at')
      .where({ client_id: carePlan.client_id, is_deleted: false })
      .andWhere('created_at', '>=', evaluationStartDate.toISOString())
      .limit(30);

    // Fetch progress notes
    const progressNotes = await this.db('progress_notes')
      .select('*')
      .where({ care_plan_id: request.carePlanId, is_deleted: false })
      .andWhere('created_at', '>=', evaluationStartDate.toISOString());

    // Calculate data quality score
    const dataQualityScore = this.calculateDataQualityScore(
      visits.length,
      taskInstances.length,
      visitNotes.length,
      progressNotes.length,
      evaluationPeriodDays
    );

    // Build analysis prompt
    const prompt = this.buildEffectivenessPrompt(
      client,
      carePlan,
      goals,
      tasks,
      taskInstances,
      visits,
      incidents,
      visitNotes,
      progressNotes,
      evaluationPeriodDays,
      dataQualityScore,
      request.includeRecommendations ?? true
    );

    // Call Claude AI
    const message = await this.anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 3000,
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

    let analysisResult: Partial<CarePlanEffectivenessScore>;
    try {
      const textContent = content as { type: 'text'; text: string };
      analysisResult = JSON.parse(textContent.text);
    } catch (parseError) {
      const textContent = content as { type: 'text'; text: string };
      console.error('Failed to parse AI response:', textContent.text, parseError);
      throw new Error('Failed to parse care plan effectiveness analysis');
    }

    // Build result
    const result: CarePlanEffectivenessScore = {
      carePlanId: request.carePlanId,
      clientId: carePlan.client_id,
      organizationId: request.organizationId,
      overallScore: analysisResult.overallScore ?? 50,
      overallRating: analysisResult.overallRating ?? 'FAIR',
      overallTrend: analysisResult.overallTrend ?? 'STABLE',
      dimensionScores: analysisResult.dimensionScores ?? [],
      goalProgress: analysisResult.goalProgress ?? [],
      taskMetrics: analysisResult.taskMetrics ?? {
        totalTasks: taskInstances.length,
        completedTasks: taskInstances.filter((t: Record<string, unknown>) => t.status === 'COMPLETED').length,
        skippedTasks: taskInstances.filter((t: Record<string, unknown>) => t.status === 'SKIPPED').length,
        completionRate: 0,
        averageCompletionTime: null,
        commonSkipReasons: [],
      },
      healthTrends: analysisResult.healthTrends ?? [],
      incidentSummary: analysisResult.incidentSummary ?? [],
      recommendations: request.includeRecommendations ? (analysisResult.recommendations ?? []) : [],
      evaluationPeriodDays,
      dataQualityScore,
      clinicalSummary: analysisResult.clinicalSummary ?? 'Analysis completed with limited data.',
      evaluatedAt: new Date().toISOString(),
    };

    return result;
  }

  /**
   * Calculate data quality score based on available data
   */
  private calculateDataQualityScore(
    visitCount: number,
    taskInstanceCount: number,
    noteCount: number,
    progressNoteCount: number,
    periodDays: number
  ): number {
    // Expected data points per period
    const expectedWeeklyVisits = Math.ceil(periodDays / 7) * 3; // ~3 visits/week
    const expectedWeeklyTasks = Math.ceil(periodDays / 7) * 15; // ~15 tasks/week
    const expectedNotes = Math.ceil(periodDays / 7) * 3; // ~3 notes/week

    const visitScore = Math.min(visitCount / expectedWeeklyVisits, 1) * 25;
    const taskScore = Math.min(taskInstanceCount / expectedWeeklyTasks, 1) * 25;
    const noteScore = Math.min(noteCount / expectedNotes, 1) * 25;
    const progressScore = Math.min(progressNoteCount / (periodDays / 14), 1) * 25; // ~1 progress note/2 weeks

    return Math.round(visitScore + taskScore + noteScore + progressScore);
  }

  /**
   * Build effectiveness analysis prompt for Claude
   */
  private buildEffectivenessPrompt(
    client: Record<string, unknown>,
    carePlan: Record<string, unknown>,
    goals: Array<Record<string, unknown>>,
    tasks: Array<Record<string, unknown>>,
    taskInstances: Array<Record<string, unknown>>,
    visits: Array<Record<string, unknown>>,
    incidents: Array<Record<string, unknown>>,
    visitNotes: Array<Record<string, unknown>>,
    progressNotes: Array<Record<string, unknown>>,
    evaluationPeriodDays: number,
    dataQualityScore: number,
    includeRecommendations: boolean
  ): string {
    const clientName = `${client.first_name} ${client.last_name}`;

    // Calculate basic metrics
    const completedTasks = taskInstances.filter((t: Record<string, unknown>) => t.status === 'COMPLETED').length;
    const skippedTasks = taskInstances.filter((t: Record<string, unknown>) => t.status === 'SKIPPED').length;
    const taskCompletionRate = taskInstances.length > 0
      ? Math.round((completedTasks / taskInstances.length) * 100)
      : 0;

    const completedVisits = visits.filter((v: Record<string, unknown>) => v.status === 'COMPLETED').length;
    const missedVisits = visits.filter((v: Record<string, unknown>) => v.status === 'MISSED' || v.status === 'CANCELLED').length;
    const visitAttendanceRate = visits.length > 0
      ? Math.round((completedVisits / visits.length) * 100)
      : 0;

    // Format goals
    const goalList = goals.length > 0
      ? goals.map((g: Record<string, unknown>) =>
          `- ${g.description} (Target: ${g.target_date || 'Ongoing'}, Status: ${g.status || 'Active'})`
        ).join('\n')
      : 'No goals defined';

    // Format task summary
    const taskSummary = tasks.length > 0
      ? tasks.slice(0, 10).map((t: Record<string, unknown>) =>
          `- ${t.task_name} (Frequency: ${t.frequency || 'N/A'})`
        ).join('\n')
      : 'No tasks defined';

    // Format incidents
    const incidentList = incidents.length > 0
      ? incidents.map((i: Record<string, unknown>) =>
          `- ${i.incident_type} (${i.severity}) on ${new Date(i.occurred_at as string).toLocaleDateString()}`
        ).join('\n')
      : 'No incidents reported';

    // Format recent notes (brief)
    const recentNotes = visitNotes.length > 0
      ? visitNotes.slice(0, 5).map((n: Record<string, unknown>) =>
          `- ${(n.note_text as string || '').substring(0, 200)}...`
        ).join('\n')
      : 'No recent visit notes';

    // Format progress notes summary
    const progressSummary = progressNotes.length > 0
      ? progressNotes.slice(0, 3).map((n: Record<string, unknown>) =>
          `- ${new Date(n.created_at as string).toLocaleDateString()}: ${(n.summary as string || n.note_text as string || '').substring(0, 150)}...`
        ).join('\n')
      : 'No progress notes';

    return `You are a home health quality assurance specialist analyzing care plan effectiveness. Your goal is to objectively score how well a care plan is achieving its intended outcomes.

**CLIENT PROFILE:**
- Name: ${clientName}
- Age: ${this.calculateAge(client.date_of_birth as string) || 'Unknown'}
- Acuity Level: ${client.acuity_level || 'Not specified'}
- Primary Diagnosis: ${client.primary_diagnosis || 'Not specified'}
- Mobility Status: ${client.mobility_status || 'Not specified'}

**CARE PLAN DETAILS:**
- Plan ID: ${carePlan.id}
- Status: ${carePlan.status}
- Start Date: ${carePlan.start_date}
- Plan Type: ${carePlan.plan_type || 'Standard'}
- Primary Focus: ${carePlan.primary_focus || 'Not specified'}

**EVALUATION PERIOD:** ${evaluationPeriodDays} days
**DATA QUALITY SCORE:** ${dataQualityScore}/100 (${dataQualityScore < 50 ? 'Limited data available' : dataQualityScore < 75 ? 'Moderate data available' : 'Good data available'})

**CARE PLAN GOALS:**
${goalList}

**TASK TEMPLATE (Sample):**
${taskSummary}

**TASK COMPLETION METRICS:**
- Total task instances: ${taskInstances.length}
- Completed: ${completedTasks} (${taskCompletionRate}%)
- Skipped: ${skippedTasks}

**VISIT METRICS:**
- Total scheduled visits: ${visits.length}
- Completed: ${completedVisits} (${visitAttendanceRate}%)
- Missed/Cancelled: ${missedVisits}

**INCIDENT HISTORY:**
${incidentList}

**RECENT VISIT NOTES:**
${recentNotes}

**PROGRESS NOTES:**
${progressSummary}

**SCORING GUIDELINES:**

**Overall Score (0-100):**
- 90-100: EXCELLENT - Goals being met/exceeded, high task completion, positive health trends
- 75-89: GOOD - Most goals on track, good task completion, stable health
- 60-74: FAIR - Some goals at risk, moderate task completion, mixed health trends
- 40-59: NEEDS_IMPROVEMENT - Multiple goals behind, low task completion, concerning trends
- 0-39: CRITICAL - Goals not being met, very low engagement, negative health trends

**Dimension Weights:**
- Goal Progress: 30%
- Task Completion: 20%
- Visit Attendance: 15%
- Health Trends: 20%
- Safety (Incidents): 15%

**RESPONSE FORMAT (JSON):**
Return ONLY valid JSON with this exact structure:
{
  "overallScore": 72,
  "overallRating": "FAIR",
  "overallTrend": "STABLE",
  "dimensionScores": [
    {
      "dimension": "Goal Progress",
      "score": 65,
      "weight": 0.30,
      "rating": "FAIR",
      "details": "2 of 4 goals on track, 1 at risk, 1 behind schedule"
    },
    {
      "dimension": "Task Completion",
      "score": 78,
      "weight": 0.20,
      "rating": "GOOD",
      "details": "78% task completion rate, consistent with care needs"
    },
    {
      "dimension": "Visit Attendance",
      "score": 85,
      "weight": 0.15,
      "rating": "GOOD",
      "details": "85% visit attendance, only 2 missed visits in period"
    },
    {
      "dimension": "Health Trends",
      "score": 60,
      "weight": 0.20,
      "rating": "FAIR",
      "details": "Mobility stable, weight slightly declining"
    },
    {
      "dimension": "Safety",
      "score": 70,
      "weight": 0.15,
      "rating": "FAIR",
      "details": "1 fall incident, no hospitalizations"
    }
  ],
  "goalProgress": [
    {
      "goalId": "goal-uuid-1",
      "goalDescription": "Improve mobility from wheelchair to walker",
      "targetDate": "2025-03-01",
      "progressPercentage": 40,
      "status": "AT_RISK",
      "contributingFactors": ["PT visits reduced due to authorization", "Weather limiting outdoor practice"]
    }
  ],
  "taskMetrics": {
    "totalTasks": ${taskInstances.length},
    "completedTasks": ${completedTasks},
    "skippedTasks": ${skippedTasks},
    "completionRate": ${taskCompletionRate},
    "averageCompletionTime": 45,
    "commonSkipReasons": ["Client refused", "Not enough time", "Equipment unavailable"]
  },
  "healthTrends": [
    {
      "category": "Mobility",
      "trend": "STABLE",
      "details": "Transfer assistance needs unchanged over period",
      "dataPoints": 12,
      "concernLevel": "LOW"
    },
    {
      "category": "Nutrition",
      "trend": "DECLINING",
      "details": "Weight down 3 lbs, appetite noted as poor in recent notes",
      "dataPoints": 6,
      "concernLevel": "MEDIUM"
    }
  ],
  "incidentSummary": [
    {
      "category": "Falls",
      "count": 1,
      "trend": "STABLE",
      "lastOccurrence": "2025-01-15",
      "impactOnEffectiveness": "May indicate need for additional supervision or equipment"
    }
  ],
  ${includeRecommendations ? `"recommendations": [
    {
      "priority": "HIGH",
      "category": "Care Plan Adjustment",
      "recommendation": "Increase PT frequency to address mobility goal",
      "expectedImpact": "Could improve mobility goal progress by 20-30%",
      "implementationSteps": [
        "Request service authorization increase",
        "Coordinate with PT to increase from 2x to 3x weekly",
        "Update care plan goals with revised timeline"
      ]
    },
    {
      "priority": "MEDIUM",
      "category": "Nutrition",
      "recommendation": "Add nutrition monitoring tasks and consult dietitian",
      "expectedImpact": "Address weight loss trend before it becomes critical",
      "implementationSteps": [
        "Add weekly weight monitoring task",
        "Request dietitian consult",
        "Update meal assistance tasks with appetite observations"
      ]
    }
  ],` : `"recommendations": [],`}
  "clinicalSummary": "This care plan is showing fair effectiveness with room for improvement. Task completion and visit attendance are good, but goal progress is lagging, particularly the mobility improvement goal. The recent weight loss trend warrants attention. Recommend focusing on PT frequency and nutrition monitoring to improve outcomes."
}

Analyze the care plan data and provide your effectiveness score:`;
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
}
