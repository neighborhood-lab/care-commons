/**
 * AI-Powered Note Summarization Service
 *
 * Uses Anthropic Claude API to generate intelligent summaries of caregiver notes,
 * progress reports, and other clinical documentation.
 */

import Anthropic from '@anthropic-ai/sdk';
import type {
  UUID,
  NoteType,
  SummarizationStrategy,
  SentimentCategory,
  SummarizeNoteRequest,
  SummarizedNote,
  BatchSummarizeRequest,
  BatchSummarizeResult,
  DailySummaryRequest,
  DailySummary,
  KeywordExtractionResult,
  AIServiceConfig,
} from '../types/ai-types.js';

/**
 * Service for AI-powered note summarization
 */
export class NoteSummarizationService {
  private client: Anthropic;
  private config: AIServiceConfig;
  private summaryCache: Map<string, SummarizedNote>;

  constructor(config: AIServiceConfig) {
    this.config = config;
    this.client = new Anthropic({
      apiKey: config.anthropicApiKey,
    });
    this.summaryCache = new Map();
  }

  /**
   * Summarize a single note using Claude API
   */
  async summarizeNote(request: SummarizeNoteRequest): Promise<SummarizedNote> {
    const startTime = Date.now();
    const strategy = request.strategy || 'STANDARD';

    // Check cache first
    if (this.config.enableCaching) {
      const cacheKey = this.getCacheKey(request.noteId, strategy);
      const cached = this.summaryCache.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Build prompt based on strategy
    const prompt = this.buildSummarizationPrompt(
      request.content,
      request.noteType,
      strategy,
      request.includeSentiment,
      request.includeKeywords
    );

    // Call Claude API
    const message = await this.client.messages.create({
      model: this.config.defaultModel === 'claude-haiku' ? 'claude-3-5-haiku-20241022' : 'claude-sonnet-4-20250514',
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Parse response
    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    const parsed = this.parseAIResponse(responseText, request.includeSentiment, request.includeKeywords);

    const summarized: SummarizedNote = {
      noteId: request.noteId,
      noteType: request.noteType,
      originalLength: request.content.length,
      summary: parsed.summary,
      summaryLength: parsed.summary.length,
      strategy,
      sentiment: parsed.sentiment,
      sentimentScore: parsed.sentimentScore,
      keywords: parsed.keywords,
      summarizedAt: new Date().toISOString(),
      summarizedBy: this.config.defaultModel === 'claude-haiku' ? 'CLAUDE_HAIKU' : 'CLAUDE_SONNET_4',
      processingTimeMs: Date.now() - startTime,
    };

    // Cache result
    if (this.config.enableCaching) {
      const cacheKey = this.getCacheKey(request.noteId, strategy);
      this.summaryCache.set(cacheKey, summarized);

      // Auto-expire cache
      setTimeout(() => {
        this.summaryCache.delete(cacheKey);
      }, this.config.cacheTTLSeconds * 1000);
    }

    return summarized;
  }

  /**
   * Summarize multiple notes in batch
   */
  async batchSummarize(request: BatchSummarizeRequest): Promise<BatchSummarizeResult> {
    const startTime = Date.now();
    const results: SummarizedNote[] = [];
    let failed = 0;

    // Process notes in parallel (with concurrency limit)
    const CONCURRENCY_LIMIT = 5;
    for (let i = 0; i < request.notes.length; i += CONCURRENCY_LIMIT) {
      const batch = request.notes.slice(i, i + CONCURRENCY_LIMIT);
      const promises = batch.map(async (note) => {
        try {
          return await this.summarizeNote({
            noteId: note.noteId,
            noteType: note.noteType,
            content: note.content,
            strategy: request.strategy,
            includeSentiment: request.includeSentiment,
            includeKeywords: request.includeKeywords,
          });
        } catch (error) {
          console.error(`Failed to summarize note ${note.noteId}:`, error);
          failed++;
          return null;
        }
      });

      const batchResults = await Promise.all(promises);
      results.push(...batchResults.filter((r): r is SummarizedNote => r !== null));
    }

    return {
      summaries: results,
      totalProcessed: results.length,
      totalFailed: failed,
      processingTimeMs: Date.now() - startTime,
    };
  }

  /**
   * Generate a daily summary for a client
   */
  async generateDailySummary(request: DailySummaryRequest): Promise<DailySummary> {
    // This would fetch all notes/activities for the client on the given date
    // For now, returning a structured response that shows the pattern
    throw new Error('Not implemented: generateDailySummary requires database integration');
  }

  /**
   * Extract keywords from a note
   */
  async extractKeywords(content: string): Promise<KeywordExtractionResult> {
    const prompt = `Extract key medical terms, activities, and entities from this care note. Return a JSON object with:
- keywords: array of important terms
- topics: array of main topics discussed
- entities: array of {name, type} where type is PERSON, MEDICATION, CONDITION, ACTIVITY, or OTHER

Note content:
${content}

Return ONLY the JSON object, no additional text.`;

    const message = await this.client.messages.create({
      model: 'claude-3-5-haiku-20241022', // Use fast model for extraction
      max_tokens: 1024,
      temperature: 0.0, // Deterministic
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '{}';
    try {
      return JSON.parse(responseText) as KeywordExtractionResult;
    } catch {
      return {
        keywords: [],
        topics: [],
        entities: [],
      };
    }
  }

  /**
   * Build prompt for Claude based on summarization strategy
   */
  private buildSummarizationPrompt(
    content: string,
    noteType: NoteType,
    strategy: SummarizationStrategy,
    includeSentiment: boolean = false,
    includeKeywords: boolean = false
  ): string {
    let lengthGuidance: string;
    switch (strategy) {
      case 'BRIEF':
        lengthGuidance = '1-2 sentences highlighting only the most critical information';
        break;
      case 'DETAILED':
        lengthGuidance = '2-3 paragraphs with comprehensive details';
        break;
      case 'BULLET_POINTS':
        lengthGuidance = 'a structured bullet-point list of key points';
        break;
      case 'STANDARD':
      default:
        lengthGuidance = '1 paragraph (3-5 sentences) with balanced detail';
    }

    let prompt = `You are a healthcare documentation assistant helping caregivers and coordinators quickly understand care notes.

Summarize the following ${noteType.toLowerCase().replace('_', ' ')} in ${lengthGuidance}. Focus on:
- Key activities performed
- Client status and observations
- Any concerns or issues noted
- Important changes or updates

Note content:
${content}

`;

    if (includeSentiment || includeKeywords) {
      prompt += `\nReturn your response as a JSON object with these fields:
- summary: string (the summary text)`;

      if (includeSentiment) {
        prompt += `
- sentiment: "POSITIVE" | "NEUTRAL" | "CONCERNING" | "CRITICAL"
- sentimentScore: number (0-100, where 100 is most positive)`;
      }

      if (includeKeywords) {
        prompt += `
- keywords: string[] (5-10 key terms from the note)`;
      }

      prompt += `\n\nReturn ONLY the JSON object, no additional text.`;
    } else {
      prompt += `\nReturn ONLY the summary text, no JSON or formatting.`;
    }

    return prompt;
  }

  /**
   * Parse AI response into structured data
   */
  private parseAIResponse(
    responseText: string,
    includeSentiment: boolean = false,
    includeKeywords: boolean = false
  ): {
    summary: string;
    sentiment?: SentimentCategory;
    sentimentScore?: number;
    keywords?: string[];
  } {
    // If JSON requested, parse it
    if (includeSentiment || includeKeywords) {
      try {
        const parsed = JSON.parse(responseText);
        return {
          summary: parsed.summary || responseText,
          sentiment: parsed.sentiment as SentimentCategory | undefined,
          sentimentScore: parsed.sentimentScore,
          keywords: parsed.keywords,
        };
      } catch {
        // JSON parsing failed, treat as plain text
        return { summary: responseText };
      }
    }

    // Plain text response
    return { summary: responseText.trim() };
  }

  /**
   * Generate cache key for a summarization request
   */
  private getCacheKey(noteId: UUID, strategy: SummarizationStrategy): string {
    return `${noteId}:${strategy}`;
  }

  /**
   * Clear the summary cache
   */
  clearCache(): void {
    this.summaryCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; maxAge: number } {
    return {
      size: this.summaryCache.size,
      maxAge: this.config.cacheTTLSeconds,
    };
  }
}
