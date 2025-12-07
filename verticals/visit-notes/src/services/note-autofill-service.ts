/**
 * Note Autofill Service
 *
 * AI-powered service that analyzes previous visit notes for a client/caregiver
 * combination and generates intelligent suggestions for note content.
 *
 * Uses Claude AI to provide context-aware autofill suggestions including:
 * - Common activities performed
 * - Client mood patterns
 * - Frequently used phrases
 * - Relevant care notes
 */

import Anthropic from '@anthropic-ai/sdk';
import { Pool } from 'pg';
import { UUID, NotFoundError } from '@folkcare/core';

/**
 * Configuration for autofill service
 */
export interface AutofillServiceConfig {
  anthropicApiKey: string;
  maxTokens?: number;
  temperature?: number;
  lookbackDays?: number; // How many days of history to analyze
  maxNotes?: number; // Maximum number of previous notes to analyze
}

/**
 * Autofill suggestions result
 */
export interface AutofillSuggestions {
  // Suggested activities (most common from history)
  suggestedActivities: string[];

  // Suggested client mood based on patterns
  suggestedMood?: string;

  // Common note phrases/templates
  commonPhrases: string[];

  // AI-generated note starter based on context
  noteStarter?: string;

  // Metadata about analysis
  analyzedNotesCount: number;
  dateRange: {
    from: string;
    to: string;
  };
  generatedAt: string;
}

/**
 * Request to get autofill suggestions
 */
export interface AutofillRequest {
  visitId: UUID;
  clientId?: UUID; // Optional - can be fetched from visit
  caregiverId?: UUID; // Optional - can be fetched from visit
}

/**
 * Visit details record
 */
interface VisitDetails {
  id: UUID;
  client_id: UUID;
  assigned_caregiver_id: UUID;
  scheduled_date: string;
  scheduled_start_time: string;
  scheduled_end_time: string;
  service_type_name: string;
  client_first_name: string;
  client_last_name: string;
}

/**
 * Visit note record from database
 */
interface VisitNoteRecord {
  id: UUID;
  note_text: string;
  note_type: string;
  activities_performed: string[];
  client_mood: string;
  client_condition_notes: string;
  created_at: string;
  service_type_name: string;
}

/**
 * Service for AI-powered note autofill
 */
export class NoteAutofillService {
  private client: Anthropic;
  private config: AutofillServiceConfig;

  constructor(
    private pool: Pool,
    config: AutofillServiceConfig
  ) {
    this.config = {
      maxTokens: 1024,
      temperature: 0.3,
      lookbackDays: 90,
      maxNotes: 20,
      ...config,
    };

    this.client = new Anthropic({
      apiKey: this.config.anthropicApiKey,
    });
  }

  /**
   * Get autofill suggestions for a visit
   */
  async getAutofillSuggestions(request: AutofillRequest): Promise<AutofillSuggestions> {
    // 1. Get visit details
    const visit = await this.getVisitDetails(request.visitId);
    if (!visit) {
      throw new NotFoundError('Visit not found', { visitId: request.visitId });
    }

    const clientId = request.clientId ?? visit.client_id;
    const caregiverId = request.caregiverId ?? visit.assigned_caregiver_id;

    if (!caregiverId) {
      throw new NotFoundError('Visit has no assigned caregiver', { visitId: request.visitId });
    }

    // 2. Get previous notes for this client/caregiver combination
    const previousNotes = await this.getPreviousNotes(clientId, caregiverId);

    // 3. If no previous notes, return empty suggestions
    if (previousNotes.length === 0) {
      return {
        suggestedActivities: [],
        commonPhrases: [],
        analyzedNotesCount: 0,
        dateRange: {
          from: new Date().toISOString(),
          to: new Date().toISOString(),
        },
        generatedAt: new Date().toISOString(),
      };
    }

    // 4. Analyze notes with Claude AI
    const suggestions = await this.analyzeNotesWithAI(previousNotes, visit);

    // 5. Return suggestions
    const firstNote = previousNotes[0];
    const lastNote = previousNotes[previousNotes.length - 1];

    return {
      ...suggestions,
      analyzedNotesCount: previousNotes.length,
      dateRange: {
        from: lastNote?.created_at ?? new Date().toISOString(),
        to: firstNote?.created_at ?? new Date().toISOString(),
      },
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Get visit details
   */
  private async getVisitDetails(visitId: UUID): Promise<VisitDetails | null> {
    const query = `
      SELECT
        v.id,
        v.client_id,
        v.assigned_caregiver_id,
        v.scheduled_date,
        v.scheduled_start_time,
        v.scheduled_end_time,
        v.service_type_name,
        c.first_name as client_first_name,
        c.last_name as client_last_name
      FROM visits v
      LEFT JOIN clients c ON v.client_id = c.id
      WHERE v.id = $1 AND v.deleted_at IS NULL
    `;

    const result = await this.pool.query(query, [visitId]);
    return result.rows[0] || null;
  }

  /**
   * Get previous notes for client/caregiver combination
   */
  private async getPreviousNotes(clientId: UUID, caregiverId: UUID): Promise<VisitNoteRecord[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - (this.config.lookbackDays ?? 90));

    const query = `
      SELECT
        vn.id,
        vn.note_text,
        vn.note_type,
        vn.activities_performed,
        vn.client_mood,
        vn.client_condition_notes,
        vn.created_at,
        v.service_type_name
      FROM visit_notes vn
      INNER JOIN visits v ON vn.visit_id = v.id
      WHERE v.client_id = $1
        AND vn.caregiver_id = $2
        AND vn.deleted_at IS NULL
        AND vn.created_at >= $3
      ORDER BY vn.created_at DESC
      LIMIT $4
    `;

    const result = await this.pool.query(query, [
      clientId,
      caregiverId,
      cutoffDate,
      this.config.maxNotes ?? 20,
    ]);

    return result.rows;
  }

  /**
   * Analyze notes with Claude AI to generate suggestions
   */
  private async analyzeNotesWithAI(
    previousNotes: VisitNoteRecord[],
    visit: VisitDetails
  ): Promise<Omit<AutofillSuggestions, 'analyzedNotesCount' | 'dateRange' | 'generatedAt'>> {
    // Build context from previous notes
    const notesContext = previousNotes
      .map((note, idx) => {
        return `
Note ${idx + 1} (${new Date(note.created_at).toLocaleDateString()}):
- Service: ${note.service_type_name || 'Unknown'}
- Mood: ${note.client_mood || 'Not recorded'}
- Activities: ${Array.isArray(note.activities_performed) ? note.activities_performed.join(', ') : 'None'}
- Note: ${note.note_text.substring(0, 300)}${note.note_text.length > 300 ? '...' : ''}
`;
      })
      .join('\n');

    const prompt = `You are a healthcare documentation assistant helping caregivers write visit notes. Analyze the previous notes below for this client and provide autofill suggestions.

Client: ${visit.client_first_name} ${visit.client_last_name}
Today's Visit: ${visit.service_type_name} on ${new Date(visit.scheduled_date).toLocaleDateString()}

Previous Notes (most recent first):
${notesContext}

Based on these previous notes, provide autofill suggestions as a JSON object with:

1. suggestedActivities: Array of 5-8 most common activities performed (strings, ordered by frequency)
2. suggestedMood: Most common client mood (one of: EXCELLENT, GOOD, FAIR, POOR, DISTRESSED, UNRESPONSIVE, or null)
3. commonPhrases: Array of 3-5 frequently used phrases from the notes (actual phrases, not summaries)
4. noteStarter: A brief 1-2 sentence starter for today's note based on patterns (personalized to this client)

Return ONLY the JSON object, no additional text or markdown.`;

    const message = await this.client.messages.create({
      model: 'claude-3-5-haiku-20241022', // Fast, cost-effective model
      max_tokens: this.config.maxTokens ?? 1024,
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
        suggestedActivities: parsed.suggestedActivities || [],
        suggestedMood: parsed.suggestedMood || undefined,
        commonPhrases: parsed.commonPhrases || [],
        noteStarter: parsed.noteStarter || undefined,
      };
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      // Return empty suggestions on parse error
      return {
        suggestedActivities: [],
        commonPhrases: [],
      };
    }
  }
}

/**
 * Factory function to create autofill service
 */
export function createNoteAutofillService(
  pool: Pool,
  config: AutofillServiceConfig
): NoteAutofillService {
  return new NoteAutofillService(pool, config);
}
