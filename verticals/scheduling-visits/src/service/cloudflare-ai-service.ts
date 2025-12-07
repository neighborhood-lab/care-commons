/**
 * Cloudflare Workers AI Service
 *
 * Provides FREE ML inference for scheduling optimization using Cloudflare's
 * Workers AI platform. This is ALWAYS FREE with generous limits:
 * - 10,000 neurons per day (more than enough for scheduling)
 * - No credit card required
 * - Production-ready infrastructure
 *
 * We use this for:
 * - Semantic similarity matching (caregiver-client compatibility)
 * - Natural language understanding of caregiver preferences
 * - Burnout risk prediction (coming in Phase 2)
 *
 * Why Cloudflare Workers AI?
 * - 100% FREE forever (not a trial, not a gimmick)
 * - Low latency (runs on Cloudflare's edge network)
 * - No vendor lock-in (standard REST API)
 * - Open models (Llama 2, BERT, etc.)
 */

// Use global fetch (available in Node 18+)
const globalFetch = global.fetch;

/**
 * Cloudflare AI response for text embeddings
 */
export interface TextEmbeddingResponse {
  shape: number[];
  data: number[][];
}

/**
 * Cloudflare AI response for text generation
 */
export interface TextGenerationResponse {
  response: string;
}

/**
 * Caregiver preference analysis result
 */
export interface PreferenceAnalysis {
  workLifeBalanceScore: number; // 0-1, higher = better work-life balance
  shiftPreferences: {
    morning: number;
    afternoon: number;
    evening: number;
    weekend: number;
  };
  burnoutRisk: number; // 0-1, higher = higher risk
  suggestedMaxHours: number;
}

export class CloudflareAIService {
  private accountId: string;
  private apiToken: string;
  private baseUrl: string;

  constructor(config: { accountId: string; apiToken: string }) {
    this.accountId = config.accountId;
    this.apiToken = config.apiToken;
    this.baseUrl = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/ai/run`;
  }

  /**
   * Generate text embeddings for semantic similarity matching
   *
   * This allows us to match caregivers to clients based on:
   * - Written preferences ("I prefer morning shifts near downtown")
   * - Client notes ("Needs patient caregiver who speaks Spanish")
   * - Historical feedback ("Great rapport with elderly clients")
   *
   * Uses: @cf/baai/bge-base-en-v1.5 (FREE, no limits)
   */
  async generateEmbedding(text: string): Promise<number[]> {
    const response = await globalFetch(`${this.baseUrl}/@cf/baai/bge-base-en-v1.5`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: [text],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(
        `Cloudflare AI embedding failed: ${response.status} ${error}`
      );
    }

    const result = await response.json() as TextEmbeddingResponse;
    return result.data[0] ?? [];
  }

  /**
   * Calculate cosine similarity between two embeddings
   *
   * Returns: -1 to 1, where 1 = identical, 0 = unrelated, -1 = opposite
   */
  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Embeddings must have same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += (a[i] ?? 0) * (b[i] ?? 0);
      normA += (a[i] ?? 0) * (a[i] ?? 0);
      normB += (b[i] ?? 0) * (b[i] ?? 0);
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Analyze caregiver preferences using Llama 2
   *
   * This uses natural language understanding to extract structured data
   * from caregiver notes, availability preferences, and historical patterns.
   *
   * Uses: @cf/meta/llama-2-7b-chat-int8 (FREE, 10k neurons/day)
   *
   * NOTE: For MVP, this is a placeholder that returns mock data.
   * Phase 2 will implement full NLU analysis.
   */
  async analyzeCaregiverPreferences(
    _caregiverNotes: string,
    historicalData: {
      totalHoursLast30Days: number;
      shiftsWorked: { date: string; hours: number }[];
    }
  ): Promise<PreferenceAnalysis> {
    // For MVP, use heuristic analysis instead of LLM
    // This avoids quota usage while we build out the feature
    const totalHours = historicalData.totalHoursLast30Days;
    const avgHoursPerWeek = (totalHours / 30) * 7;

    // Simple burnout risk calculation
    // >40 hours/week = moderate risk, >50 = high risk
    const burnoutRisk = Math.min((avgHoursPerWeek - 30) / 30, 1);

    // Suggested max hours based on current workload
    const suggestedMaxHours = avgHoursPerWeek < 35 ? 40 : Math.max(35, 50 - avgHoursPerWeek);

    // Analyze shift distribution
    const shiftCounts = { morning: 0, afternoon: 0, evening: 0, weekend: 0 };
    for (const shift of historicalData.shiftsWorked) {
      const date = new Date(shift.date);
      const hour = date.getHours();
      const dayOfWeek = date.getDay();

      if (hour < 12) shiftCounts.morning++;
      else if (hour < 17) shiftCounts.afternoon++;
      else shiftCounts.evening++;

      if (dayOfWeek === 0 || dayOfWeek === 6) shiftCounts.weekend++;
    }

    const totalShifts = historicalData.shiftsWorked.length;

    return {
      workLifeBalanceScore: Math.max(0, 1 - burnoutRisk),
      shiftPreferences: {
        morning: totalShifts > 0 ? shiftCounts.morning / totalShifts : 0.33,
        afternoon: totalShifts > 0 ? shiftCounts.afternoon / totalShifts : 0.33,
        evening: totalShifts > 0 ? shiftCounts.evening / totalShifts : 0.33,
        weekend: totalShifts > 0 ? shiftCounts.weekend / totalShifts : 0.2,
      },
      burnoutRisk,
      suggestedMaxHours,
    };

    // TODO Phase 2: Implement full LLM analysis
    // const prompt = this.buildPreferenceAnalysisPrompt(caregiverNotes, historicalData);
    // const response = await this.generateText(prompt);
    // return this.parsePreferenceAnalysis(response);
  }

  /**
   * Generate text using Llama 2 (for future features)
   *
   * Uses: @cf/meta/llama-2-7b-chat-int8 (FREE, 10k neurons/day)
   *
   * This is a helper method for future AI features like:
   * - Explaining scheduling decisions to users
   * - Generating personalized caregiver recommendations
   * - Analyzing incident reports for patterns
   *
   * NOTE: Commented out for MVP - will be used in Phase 2
   */
  /*
  private async generateText(prompt: string): Promise<string> {
    const response = await fetch(
      `${this.baseUrl}/@cf/meta/llama-2-7b-chat-int8`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          max_tokens: 512,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(
        `Cloudflare AI text generation failed: ${response.status} ${error}`
      );
    }

    const result = await response.json() as TextGenerationResponse;
    return result.response;
  }
  */

  /**
   * Batch embeddings for efficiency
   *
   * Cloudflare AI supports batch processing to reduce API calls.
   * This is useful for analyzing many caregivers at once.
   */
  async generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
    const response = await globalFetch(`${this.baseUrl}/@cf/baai/bge-base-en-v1.5`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: texts,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(
        `Cloudflare AI batch embedding failed: ${response.status} ${error}`
      );
    }

    const result = await response.json() as TextEmbeddingResponse;
    return result.data;
  }
}

/**
 * Factory function to create CloudflareAIService from environment variables
 */
export function createCloudflareAIService(): CloudflareAIService {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !apiToken) {
    throw new Error(
      'CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN must be set. ' +
      'Get your free account at https://dash.cloudflare.com/ (no credit card required)'
    );
  }

  return new CloudflareAIService({ accountId, apiToken });
}
