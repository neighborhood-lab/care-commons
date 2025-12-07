/**
 * Sentiment Analysis Service
 *
 * AI-powered sentiment detection in caregiver notes to identify burnout,
 * stress, patient distress, and other emotional indicators that may require
 * intervention.
 */

import Anthropic from '@anthropic-ai/sdk';
import type { Knex } from 'knex';

export interface SentimentAnalysisRequest {
  clientId?: string; // Analyze notes for a specific client
  caregiverId?: string; // Analyze notes by a specific caregiver
  lookbackDays?: number; // Default 30 days
}

export type SentimentCategory = 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | 'CONCERNING';
export type ConcernType =
  | 'CAREGIVER_BURNOUT'
  | 'CAREGIVER_STRESS'
  | 'PATIENT_DISTRESS'
  | 'PATIENT_PAIN'
  | 'SAFETY_CONCERN'
  | 'RELATIONSHIP_STRAIN'
  | 'DECLINING_HEALTH';

export interface SentimentTrend {
  period: string; // e.g., "2025-01-01 to 2025-01-07"
  averageSentiment: SentimentCategory;
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
  concerningCount: number;
}

export interface ConcernAlert {
  type: ConcernType;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  description: string;
  evidence: Array<{
    date: string;
    noteExcerpt: string;
    sentiment: SentimentCategory;
  }>;
  recommendations: string[];
}

export interface SentimentAnalysisResult {
  analyzedFor: {
    clientId?: string;
    clientName?: string;
    caregiverId?: string;
    caregiverName?: string;
  };
  analyzedAt: string;
  lookbackPeriod: {
    startDate: string;
    endDate: string;
    daysAnalyzed: number;
  };
  overallSentiment: SentimentCategory;
  sentimentTrends: SentimentTrend[];
  concernsDetected: ConcernAlert[];
  positiveIndicators: string[];
  interventionPriorities: Array<{
    priority: number;
    action: string;
    rationale: string;
    urgency: 'IMMEDIATE' | 'SOON' | 'ROUTINE';
  }>;
  summary: string;
  dataQuality: {
    notesAnalyzed: number;
    daysWithNotes: number;
    averageNotesPerDay: number;
    gaps: string[];
  };
}

export class SentimentAnalysisService {
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
   * Analyze sentiment in visit notes using Claude AI
   */
  async analyzeSentiment(request: SentimentAnalysisRequest): Promise<SentimentAnalysisResult> {
    const lookbackDays = request.lookbackDays || 30;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - lookbackDays);

    // Fetch entity details (client or caregiver)
    let clientName: string | undefined;
    let caregiverName: string | undefined;

    if (request.clientId) {
      const client = await this.db('clients')
        .select('first_name', 'last_name')
        .where({ id: request.clientId, is_deleted: false })
        .first();

      if (!client) {
        throw new Error('Client not found');
      }
      clientName = `${client.first_name} ${client.last_name}`;
    }

    if (request.caregiverId) {
      const caregiver = await this.db('caregivers')
        .select('first_name', 'last_name')
        .where({ id: request.caregiverId, is_deleted: false })
        .first();

      if (!caregiver) {
        throw new Error('Caregiver not found');
      }
      caregiverName = `${caregiver.first_name} ${caregiver.last_name}`;
    }

    // Fetch visit notes
    let notesQuery = this.db('visit_notes')
      .select('*')
      .where('is_deleted', false)
      .where('visit_date', '>=', startDate.toISOString())
      .where('visit_date', '<=', endDate.toISOString())
      .orderBy('visit_date', 'asc');

    if (request.clientId) {
      notesQuery = notesQuery.where('client_id', request.clientId);
    }

    if (request.caregiverId) {
      notesQuery = notesQuery.where('caregiver_id', request.caregiverId);
    }

    const notes = await notesQuery;

    if (notes.length === 0) {
      return {
        analyzedFor: {
          clientId: request.clientId,
          clientName,
          caregiverId: request.caregiverId,
          caregiverName,
        },
        analyzedAt: new Date().toISOString(),
        lookbackPeriod: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          daysAnalyzed: lookbackDays,
        },
        overallSentiment: 'NEUTRAL',
        sentimentTrends: [],
        concernsDetected: [],
        positiveIndicators: [],
        interventionPriorities: [
          {
            priority: 1,
            action: 'Increase documentation frequency',
            rationale: 'No visit notes available for sentiment analysis',
            urgency: 'ROUTINE',
          },
        ],
        summary: 'No visit notes available for sentiment analysis in the specified period.',
        dataQuality: {
          notesAnalyzed: 0,
          daysWithNotes: 0,
          averageNotesPerDay: 0,
          gaps: ['No notes in analysis period'],
        },
      };
    }

    // Build comprehensive prompt for Claude
    const prompt = this.buildSentimentAnalysisPrompt(notes, lookbackDays, clientName, caregiverName);

    // Call Claude AI
    const message = await this.anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 4096,
      temperature: 0.15, // Low temperature for consistency
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

    let analysisResult: Partial<SentimentAnalysisResult>;
    try {
      const textContent = content as { type: 'text'; text: string };
      analysisResult = JSON.parse(textContent.text);
    } catch (error) {
      const textContent = content as { type: 'text'; text: string };
      console.error('Failed to parse AI response:', textContent.text);
      throw new Error('Failed to parse sentiment analysis');
    }

    // Calculate data quality metrics
    const uniqueDays = new Set(notes.map((n) => n.visit_date.split('T')[0])).size;
    const averageNotesPerDay = notes.length / uniqueDays;

    // Build result
    const result: SentimentAnalysisResult = {
      analyzedFor: {
        clientId: request.clientId,
        clientName,
        caregiverId: request.caregiverId,
        caregiverName,
      },
      analyzedAt: new Date().toISOString(),
      lookbackPeriod: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        daysAnalyzed: lookbackDays,
      },
      overallSentiment: analysisResult.overallSentiment || 'NEUTRAL',
      sentimentTrends: analysisResult.sentimentTrends || [],
      concernsDetected: analysisResult.concernsDetected || [],
      positiveIndicators: analysisResult.positiveIndicators || [],
      interventionPriorities: analysisResult.interventionPriorities || [],
      summary: analysisResult.summary || 'No summary available.',
      dataQuality: {
        notesAnalyzed: notes.length,
        daysWithNotes: uniqueDays,
        averageNotesPerDay: Math.round(averageNotesPerDay * 10) / 10,
        gaps: analysisResult.dataQuality?.gaps || [],
      },
    };

    return result;
  }

  /**
   * Build sentiment analysis prompt for Claude
   */
  private buildSentimentAnalysisPrompt(
    notes: any[],
    lookbackDays: number,
    clientName?: string,
    caregiverName?: string,
  ): string {
    const notesTimeline = notes
      .map(
        (note, index) =>
          `${index + 1}. [${note.visit_date}]
Note Type: ${note.note_type || 'General'}
Subjective: ${note.subjective_notes || 'N/A'}
Objective: ${note.objective_notes || 'N/A'}
Assessment: ${note.assessment || 'N/A'}
Plan: ${note.plan || 'N/A'}
Narrative: ${note.narrative_note || 'N/A'}
Patient Response: ${note.patient_response || 'N/A'}
Safety Incidents: ${note.safety_incidents ? `YES - ${note.incident_description}` : 'No'}
---`,
      )
      .join('\n\n');

    const analysisTarget = clientName
      ? `Client: ${clientName}`
      : caregiverName
        ? `Caregiver: ${caregiverName}`
        : 'General';

    return `You are an AI assistant analyzing visit note sentiment to detect emotional patterns, caregiver burnout, patient distress, and other concerns that may require intervention.

**ANALYSIS TARGET:** ${analysisTarget}
**PERIOD:** Last ${lookbackDays} days
**NOTES TO ANALYZE:** ${notes.length}

**VISIT NOTES TIMELINE:**
${notesTimeline}

**SENTIMENT ANALYSIS FRAMEWORK:**

**Sentiment Categories:**
- **POSITIVE:** Upbeat tone, optimistic language, improvement noted, engagement, satisfaction
- **NEUTRAL:** Matter-of-fact documentation, routine care, stable status
- **NEGATIVE:** Frustration, difficulty, decline, pain, challenges
- **CONCERNING:** Signs of burnout, distress, safety issues, severe problems

**Concern Types to Detect:**

1. **CAREGIVER_BURNOUT:**
   - Exhaustion language ("overwhelmed", "drained", "can't cope")
   - Decreased empathy or engagement
   - Negativity toward patient or role
   - Mentions of stress or inability to continue

2. **CAREGIVER_STRESS:**
   - Difficulty managing workload
   - Multiple challenges mentioned
   - Time pressure noted
   - Frustration with resources or support

3. **PATIENT_DISTRESS:**
   - Emotional suffering noted
   - Anxiety, depression, fear expressed
   - Social isolation
   - Refusing care

4. **PATIENT_PAIN:**
   - Uncontrolled pain reported
   - Pain interfering with activities
   - Medication not effective
   - Grimacing, guarding, distress behaviors

5. **SAFETY_CONCERN:**
   - Fall risks, actual falls
   - Unsafe environment
   - Medication errors
   - Wandering, elopement risk

6. **RELATIONSHIP_STRAIN:**
   - Family conflict noted
   - Patient-caregiver tension
   - Communication breakdowns
   - Boundary issues

7. **DECLINING_HEALTH:**
   - Progressive deterioration
   - New symptoms
   - Worsening conditions
   - Functional decline

**RESPONSE FORMAT (JSON):**
Return ONLY valid JSON with this exact structure:
{
  "overallSentiment": "POSITIVE|NEUTRAL|NEGATIVE|CONCERNING",
  "sentimentTrends": [
    {
      "period": "2025-01-01 to 2025-01-07",
      "averageSentiment": "NEUTRAL",
      "positiveCount": 5,
      "neutralCount": 10,
      "negativeCount": 2,
      "concerningCount": 0
    }
  ],
  "concernsDetected": [
    {
      "type": "CAREGIVER_BURNOUT|CAREGIVER_STRESS|PATIENT_DISTRESS|PATIENT_PAIN|SAFETY_CONCERN|RELATIONSHIP_STRAIN|DECLINING_HEALTH",
      "severity": "CRITICAL|HIGH|MODERATE|LOW",
      "description": "Brief description of the concern",
      "evidence": [
        {
          "date": "2025-01-15T10:00:00Z",
          "noteExcerpt": "Relevant quote from note",
          "sentiment": "CONCERNING"
        }
      ],
      "recommendations": ["Specific action 1", "Specific action 2"]
    }
  ],
  "positiveIndicators": [
    "Patient engaged and cooperative",
    "Caregiver reports good rapport",
    "Consistent improvement noted"
  ],
  "interventionPriorities": [
    {
      "priority": 1,
      "action": "Specific intervention needed",
      "rationale": "Why this is the top priority",
      "urgency": "IMMEDIATE|SOON|ROUTINE"
    }
  ],
  "summary": "One-paragraph summary of sentiment patterns and key concerns",
  "dataQuality": {
    "gaps": ["Missing weekend notes", "Limited detail in some entries"]
  }
}

**CRITICAL RULES:**
- Be empathetic and worker-first - caregivers are doing hard work
- Detect EARLY signs of burnout to protect workers
- Patient distress is a priority for intervention
- Use actual quotes as evidence (brief excerpts)
- Provide actionable, supportive recommendations
- Consider trends over time, not just isolated statements
- Mark as CRITICAL if immediate risk to patient or caregiver wellbeing
- Balance concern detection with recognizing positive aspects
- Be conservative but not alarmist

Provide your sentiment analysis now:`;
  }
}
