/**
 * Training Recommendation Service
 *
 * AI-powered training recommendations based on caregiver assignments:
 * - Gap analysis between caregiver skills and client needs
 * - Credential expiration tracking and renewal requirements
 * - Performance patterns from visit outcomes
 * - Industry best practices for specific conditions
 * - Regulatory compliance requirements
 *
 * This helps coordinators proactively develop their caregivers
 * and ensure quality care delivery.
 */

import Anthropic from '@anthropic-ai/sdk';
import type { Knex } from 'knex';

export interface TrainingRecommendationRequest {
  caregiverId: string;
  organizationId: string;
  includeUpcomingExpirations?: boolean;
  includePerformanceAnalysis?: boolean;
  lookAheadDays?: number; // For credential expirations, default 90
}

export type TrainingPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type TrainingCategory = 'CERTIFICATION' | 'SKILL_DEVELOPMENT' | 'COMPLIANCE' | 'CLIENT_SPECIFIC' | 'PERFORMANCE_IMPROVEMENT';
export type TrainingFormat = 'ONLINE' | 'IN_PERSON' | 'HANDS_ON' | 'SELF_STUDY' | 'MENTORSHIP';

export interface SkillGap {
  skill: string;
  currentLevel: 'NONE' | 'BASIC' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  requiredLevel: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  gapReason: string;
  affectedClients: number;
}

export interface CredentialStatus {
  credentialName: string;
  expirationDate: string | null;
  daysUntilExpiration: number | null;
  renewalRequired: boolean;
  renewalTrainingHours: number | null;
  status: 'CURRENT' | 'EXPIRING_SOON' | 'EXPIRED' | 'MISSING';
}

export interface PerformanceIndicator {
  metric: string;
  currentValue: number;
  benchmarkValue: number;
  trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
  trainingRelevance: string;
}

export interface TrainingRecommendation {
  id: string;
  title: string;
  description: string;
  category: TrainingCategory;
  priority: TrainingPriority;
  formats: TrainingFormat[];
  estimatedHours: number;
  deadline: string | null;
  rationale: string;
  expectedOutcome: string;
  relatedSkillGaps: string[];
  relatedCredentials: string[];
  suggestedProviders: string[];
}

export interface TrainingPlan {
  caregiverId: string;
  caregiverName: string;
  organizationId: string;
  currentCertifications: string[];
  skillGaps: SkillGap[];
  credentialStatus: CredentialStatus[];
  performanceIndicators: PerformanceIndicator[];
  recommendations: TrainingRecommendation[];
  totalRecommendedHours: number;
  immediateActions: string[];
  quarterlyGoals: string[];
  clinicalSummary: string;
  generatedAt: string;
}

export class TrainingRecommendationService {
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
   * Generate training recommendations using Claude AI
   */
  async recommendTraining(
    request: TrainingRecommendationRequest
  ): Promise<TrainingPlan> {
    const lookAheadDays = request.lookAheadDays ?? 90;

    // Fetch caregiver data
    const caregiver = await this.db('caregivers')
      .select('*')
      .where({
        id: request.caregiverId,
        organization_id: request.organizationId,
        is_deleted: false
      })
      .first();

    if (!caregiver) {
      throw new Error('Caregiver not found');
    }

    // Fetch caregiver credentials
    const credentials = await this.db('caregiver_credentials')
      .select('*')
      .where({ caregiver_id: request.caregiverId, is_deleted: false });

    // Fetch assigned clients
    const assignments = await this.db('caregiver_client_assignments')
      .select('client_id')
      .where({ caregiver_id: request.caregiverId, is_active: true, is_deleted: false });

    const clientIds = assignments.map((a: Record<string, unknown>) => a.client_id as string);

    // Fetch client details for skill matching
    const clients = clientIds.length > 0
      ? await this.db('clients')
          .select('id', 'first_name', 'last_name', 'primary_diagnosis', 'medical_conditions', 'acuity_level', 'mobility_status', 'cognitive_status')
          .whereIn('id', clientIds)
          .andWhere({ is_deleted: false })
      : [];

    // Fetch recent visit performance (last 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const ninetyDaysAgoStr = ninetyDaysAgo.toISOString().split('T')[0] ?? '';

    const recentVisits = await this.db('visits')
      .select('status', 'scheduled_date', 'actual_start_time', 'actual_end_time')
      .where({ caregiver_id: request.caregiverId, is_deleted: false })
      .andWhere('scheduled_date', '>=', ninetyDaysAgoStr);

    // Fetch task completion data
    const taskInstances = await this.db('task_instances')
      .select('status', 'completed_at', 'skip_reason')
      .where({ caregiver_id: request.caregiverId, is_deleted: false })
      .andWhere('created_at', '>=', ninetyDaysAgo.toISOString());

    // Fetch incident involvement
    const incidents = await this.db('incidents')
      .select('incident_type', 'severity', 'description')
      .where({ reporter_id: request.caregiverId, is_deleted: false })
      .andWhere('occurred_at', '>=', ninetyDaysAgo.toISOString());

    // Fetch training history
    const trainingHistory = await this.db('caregiver_training')
      .select('*')
      .where({ caregiver_id: request.caregiverId, is_deleted: false })
      .orderBy('completed_at', 'desc')
      .limit(20);

    // Build analysis prompt
    const prompt = this.buildTrainingPrompt(
      caregiver,
      credentials,
      clients,
      recentVisits,
      taskInstances,
      incidents,
      trainingHistory,
      lookAheadDays,
      request.includeUpcomingExpirations ?? true,
      request.includePerformanceAnalysis ?? true
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

    let analysisResult: Partial<TrainingPlan>;
    try {
      const textContent = content as { type: 'text'; text: string };
      analysisResult = JSON.parse(textContent.text);
    } catch (parseError) {
      const textContent = content as { type: 'text'; text: string };
      console.error('Failed to parse AI response:', textContent.text, parseError);
      throw new Error('Failed to parse training recommendations');
    }

    // Build result
    const result: TrainingPlan = {
      caregiverId: request.caregiverId,
      caregiverName: `${caregiver.first_name} ${caregiver.last_name}`,
      organizationId: request.organizationId,
      currentCertifications: credentials.map((c: Record<string, unknown>) => c.credential_name as string),
      skillGaps: analysisResult.skillGaps ?? [],
      credentialStatus: analysisResult.credentialStatus ?? [],
      performanceIndicators: analysisResult.performanceIndicators ?? [],
      recommendations: analysisResult.recommendations ?? [],
      totalRecommendedHours: analysisResult.totalRecommendedHours ?? 0,
      immediateActions: analysisResult.immediateActions ?? [],
      quarterlyGoals: analysisResult.quarterlyGoals ?? [],
      clinicalSummary: analysisResult.clinicalSummary ?? 'Analysis completed.',
      generatedAt: new Date().toISOString(),
    };

    return result;
  }

  /**
   * Build training recommendation prompt for Claude
   */
  private buildTrainingPrompt(
    caregiver: Record<string, unknown>,
    credentials: Array<Record<string, unknown>>,
    clients: Array<Record<string, unknown>>,
    recentVisits: Array<Record<string, unknown>>,
    taskInstances: Array<Record<string, unknown>>,
    incidents: Array<Record<string, unknown>>,
    trainingHistory: Array<Record<string, unknown>>,
    lookAheadDays: number,
    includeExpirations: boolean,
    includePerformance: boolean
  ): string {
    const caregiverName = `${caregiver.first_name} ${caregiver.last_name}`;

    // Format credentials
    const today = new Date();
    const credentialList = credentials.length > 0
      ? credentials.map((c: Record<string, unknown>) => {
          const expDate = c.expiration_date ? new Date(c.expiration_date as string) : null;
          const daysUntil = expDate ? Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null;
          let status = 'CURRENT';
          if (daysUntil !== null) {
            if (daysUntil < 0) status = 'EXPIRED';
            else if (daysUntil < lookAheadDays) status = 'EXPIRING_SOON';
          }
          const daysInfo = daysUntil !== null ? `, ${daysUntil} days` : '';
          return `- ${c.credential_name} (Expires: ${c.expiration_date || 'N/A'}, Status: ${status}${daysInfo})`;
        }).join('\n')
      : 'No credentials on file';

    // Format assigned clients
    const clientList = clients.length > 0
      ? clients.map((c: Record<string, unknown>) => {
          const conditions = Array.isArray(c.medical_conditions) ? c.medical_conditions.join(', ') : 'None listed';
          return `- ${c.first_name} ${c.last_name}: ${c.primary_diagnosis || 'No diagnosis'}, Acuity: ${c.acuity_level || 'N/A'}, Mobility: ${c.mobility_status || 'N/A'}, Cognitive: ${c.cognitive_status || 'N/A'}, Conditions: ${conditions}`;
        }).join('\n')
      : 'No active client assignments';

    // Calculate performance metrics
    const completedVisits = recentVisits.filter((v: Record<string, unknown>) => v.status === 'COMPLETED').length;
    const visitCompletionRate = recentVisits.length > 0 ? Math.round((completedVisits / recentVisits.length) * 100) : 0;

    const completedTasks = taskInstances.filter((t: Record<string, unknown>) => t.status === 'COMPLETED').length;
    const taskCompletionRate = taskInstances.length > 0 ? Math.round((completedTasks / taskInstances.length) * 100) : 0;

    // Format training history
    const trainingList = trainingHistory.length > 0
      ? trainingHistory.slice(0, 10).map((t: Record<string, unknown>) =>
          `- ${t.training_name} (${t.completed_at ? new Date(t.completed_at as string).toLocaleDateString() : 'Incomplete'}, ${t.hours || '?'} hours)`
        ).join('\n')
      : 'No training history';

    // Format incidents
    const incidentList = incidents.length > 0
      ? incidents.map((i: Record<string, unknown>) =>
          `- ${i.incident_type} (${i.severity}): ${(i.description as string || '').substring(0, 100)}`
        ).join('\n')
      : 'No incidents reported';

    return `You are a home health workforce development specialist analyzing caregiver training needs. Your goal is to recommend personalized training to improve care quality and caregiver professional development.

**CAREGIVER PROFILE:**
- Name: ${caregiverName}
- Experience: ${caregiver.experience_years || 'Not specified'} years
- Hire Date: ${caregiver.hire_date || 'Not specified'}
- Employment Type: ${caregiver.employment_type || 'Not specified'}
- Specializations: ${Array.isArray(caregiver.specializations) ? caregiver.specializations.join(', ') : 'None specified'}

**CURRENT CREDENTIALS:**
${credentialList}

**ASSIGNED CLIENTS (${clients.length} total):**
${clientList}

${includePerformance ? `
**PERFORMANCE METRICS (Last 90 Days):**
- Total Visits: ${recentVisits.length}
- Completed Visits: ${completedVisits} (${visitCompletionRate}%)
- Task Completion Rate: ${taskCompletionRate}%
- Incident Reports: ${incidents.length}

**INCIDENTS INVOLVED:**
${incidentList}
` : ''}

**TRAINING HISTORY:**
${trainingList}

**ANALYSIS GUIDELINES:**

1. **Skill Gap Categories:**
   - CERTIFICATION: Required licenses/certifications for client care
   - SKILL_DEVELOPMENT: Clinical or soft skills improvement
   - COMPLIANCE: Mandatory regulatory training
   - CLIENT_SPECIFIC: Training for specific client conditions
   - PERFORMANCE_IMPROVEMENT: Address identified gaps

2. **Priority Levels:**
   - CRITICAL: Required immediately (expired credentials, safety concerns)
   - HIGH: Needed within 30 days (expiring credentials, client needs)
   - MEDIUM: Recommended within 90 days (skill enhancement)
   - LOW: Nice to have (career development)

3. **Common Training Needs by Condition:**
   - Dementia/Alzheimer's: Memory care, behavior management, communication
   - Diabetes: Blood glucose monitoring, insulin administration, nutrition
   - CHF: Fluid management, weight monitoring, medication management
   - Post-Stroke: Transfer techniques, speech therapy support, mobility
   - Wound Care: Dressing changes, infection prevention, documentation
   - Fall Risk: Transfer safety, environmental assessment, prevention

${includeExpirations ? `
4. **Credential Renewal Requirements:**
   - CNA renewal: Typically 8-16 hours CEUs depending on state
   - CPR/BLS: Renewal every 2 years
   - Home Health Aide: Annual in-service training (12+ hours)
   - State-specific certifications: Check expiration dates
` : ''}

**RESPONSE FORMAT (JSON):**
Return ONLY valid JSON with this exact structure:
{
  "skillGaps": [
    {
      "skill": "Dementia Care",
      "currentLevel": "BASIC",
      "requiredLevel": "ADVANCED",
      "gapReason": "3 clients have Alzheimer's diagnosis requiring specialized care",
      "affectedClients": 3
    }
  ],
  "credentialStatus": [
    {
      "credentialName": "CNA License",
      "expirationDate": "2025-02-15",
      "daysUntilExpiration": 67,
      "renewalRequired": true,
      "renewalTrainingHours": 12,
      "status": "EXPIRING_SOON"
    }
  ],
  "performanceIndicators": [
    {
      "metric": "Task Completion Rate",
      "currentValue": 85,
      "benchmarkValue": 95,
      "trend": "STABLE",
      "trainingRelevance": "Time management and prioritization training may help"
    }
  ],
  "recommendations": [
    {
      "id": "rec-1",
      "title": "Advanced Dementia Care Certification",
      "description": "Comprehensive training on caring for clients with Alzheimer's and other dementias",
      "category": "SKILL_DEVELOPMENT",
      "priority": "HIGH",
      "formats": ["ONLINE", "IN_PERSON"],
      "estimatedHours": 8,
      "deadline": "2025-01-31",
      "rationale": "Caregiver has 3 clients with dementia but only basic training level",
      "expectedOutcome": "Improved care quality and reduced behavioral incidents",
      "relatedSkillGaps": ["Dementia Care"],
      "relatedCredentials": [],
      "suggestedProviders": ["Alzheimer's Association", "NAHC", "Local Community College"]
    },
    {
      "id": "rec-2",
      "title": "CNA License Renewal CEUs",
      "description": "Complete 12 hours of continuing education for license renewal",
      "category": "CERTIFICATION",
      "priority": "CRITICAL",
      "formats": ["ONLINE", "IN_PERSON"],
      "estimatedHours": 12,
      "deadline": "2025-02-01",
      "rationale": "CNA license expires in 67 days - must complete CEUs before expiration",
      "expectedOutcome": "Maintain active CNA certification",
      "relatedSkillGaps": [],
      "relatedCredentials": ["CNA License"],
      "suggestedProviders": ["State Nursing Board", "CEU providers"]
    }
  ],
  "totalRecommendedHours": 20,
  "immediateActions": [
    "Register for CNA renewal CEU course immediately",
    "Enroll in dementia care certification program"
  ],
  "quarterlyGoals": [
    "Complete CNA license renewal",
    "Achieve Advanced Dementia Care certification",
    "Improve task completion rate to 95%"
  ],
  "clinicalSummary": "This caregiver has solid foundational skills but has significant training gaps in dementia care given their current client assignments. The CNA license renewal is urgent. Recommend prioritizing credential renewal followed by specialized dementia training to better serve assigned clients."
}

Analyze the caregiver data and provide training recommendations:`;
  }
}
