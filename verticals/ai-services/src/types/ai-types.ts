/**
 * AI Services Types
 *
 * Type definitions for AI-powered features including note summarization,
 * sentiment analysis, and other ML/AI capabilities.
 */

export type UUID = string;

/**
 * Supported note types for summarization
 */
export type NoteType =
  | 'PROGRESS_NOTE'
  | 'VISIT_NOTE'
  | 'INCIDENT_REPORT'
  | 'CARE_PLAN_UPDATE'
  | 'ASSESSMENT'
  | 'GENERAL';

/**
 * Summarization strategies
 */
export type SummarizationStrategy =
  | 'BRIEF'        // 1-2 sentences, key highlights only
  | 'STANDARD'     // 1 paragraph, balanced detail
  | 'DETAILED'     // 2-3 paragraphs, comprehensive
  | 'BULLET_POINTS'; // Structured bullet-point format

/**
 * Sentiment classification for note content
 */
export type SentimentCategory =
  | 'POSITIVE'    // Client doing well, good progress
  | 'NEUTRAL'     // Routine care, no concerns
  | 'CONCERNING'  // Issues noted, needs attention
  | 'CRITICAL';   // Urgent issues, immediate action needed

/**
 * Request to summarize a single note
 */
export interface SummarizeNoteRequest {
  noteId: UUID;
  noteType: NoteType;
  content: string;
  strategy?: SummarizationStrategy;
  includeSentiment?: boolean;
  includeKeywords?: boolean;
}

/**
 * Result of note summarization
 */
export interface SummarizedNote {
  noteId: UUID;
  noteType: NoteType;
  originalLength: number;
  summary: string;
  summaryLength: number;
  strategy: SummarizationStrategy;

  // Optional analysis
  sentiment?: SentimentCategory;
  sentimentScore?: number; // 0-100, higher = more positive
  keywords?: string[];

  // Metadata
  summarizedAt: string;
  summarizedBy: 'CLAUDE_SONNET_4' | 'CLAUDE_HAIKU' | 'MANUAL';
  processingTimeMs: number;
}

/**
 * Request to summarize multiple notes (batch)
 */
export interface BatchSummarizeRequest {
  notes: Array<{
    noteId: UUID;
    noteType: NoteType;
    content: string;
  }>;
  strategy?: SummarizationStrategy;
  includeSentiment?: boolean;
  includeKeywords?: boolean;
}

/**
 * Result of batch summarization
 */
export interface BatchSummarizeResult {
  summaries: SummarizedNote[];
  totalProcessed: number;
  totalFailed: number;
  processingTimeMs: number;
}

/**
 * Request to generate a daily summary for a client
 */
export interface DailySummaryRequest {
  clientId: UUID;
  date: string; // YYYY-MM-DD
  includeVisits: boolean;
  includeMedications: boolean;
  includeVitals: boolean;
  includeIncidents: boolean;
}

/**
 * Daily summary for a client (all activities for one day)
 */
export interface DailySummary {
  clientId: UUID;
  date: string;
  summary: string;
  sentiment: SentimentCategory;

  // Component summaries
  visitSummary?: string;
  medicationSummary?: string;
  vitalsSummary?: string;
  incidentSummary?: string;

  // Highlights
  keyActivities: string[];
  concerns: string[];
  improvements: string[];

  generatedAt: string;
}

/**
 * Keyword extraction result
 */
export interface KeywordExtractionResult {
  keywords: string[];
  topics: string[];
  entities: {
    name: string;
    type: 'PERSON' | 'MEDICATION' | 'CONDITION' | 'ACTIVITY' | 'OTHER';
  }[];
}

/**
 * Configuration for AI services
 */
export interface AIServiceConfig {
  anthropicApiKey: string;
  defaultModel: 'claude-sonnet-4' | 'claude-haiku';
  maxTokens: number;
  temperature: number;
  enableCaching: boolean;
  cacheTTLSeconds: number;
}
