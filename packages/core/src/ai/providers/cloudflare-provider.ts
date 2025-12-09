/**
 * Cloudflare Workers AI Provider
 *
 * Implementation of AIProvider for Cloudflare's Workers AI platform.
 * Uses Meta's Llama models which are free/low-cost and suitable for
 * self-hosters who want to minimize AI costs.
 *
 * Benefits:
 * - Very low cost (free tier available)
 * - No data retention concerns (runs on Cloudflare's edge)
 * - Good for non-safety-critical features
 * - Excellent for self-hosters
 *
 * @module @folkcare/core/ai/providers
 */

import { z } from 'zod';
import type {
  AIProvider,
  AIProviderType,
  GenerateTextOptions,
  GenerateTextResult,
  GenerateJSONOptions,
  GenerateJSONResult,
  GenerateEmbeddingResult,
  ModelTier,
} from '../types.js';

/**
 * Model mapping for Cloudflare Workers AI (Llama models)
 */
const CLOUDFLARE_MODELS: Record<ModelTier, string> = {
  fast: '@cf/meta/llama-3.2-1b-instruct',
  balanced: '@cf/meta/llama-3.2-3b-instruct',
  powerful: '@cf/meta/llama-3.1-70b-instruct',
};

/**
 * Embedding model for Cloudflare
 */
const EMBEDDING_MODEL = '@cf/baai/bge-base-en-v1.5';

/**
 * Default options for text generation
 */
const DEFAULT_OPTIONS: Required<Omit<GenerateTextOptions, 'systemPrompt' | 'stopSequences'>> = {
  modelTier: 'balanced',
  maxTokens: 2048,
  temperature: 0.7,
};

/**
 * Cloudflare Workers AI response structure
 */
interface CloudflareTextResponse {
  result: {
    response: string;
  };
  success: boolean;
  errors: Array<{ message: string }>;
}

interface CloudflareEmbeddingResponse {
  result: {
    data: Array<number[]>;
  };
  success: boolean;
  errors: Array<{ message: string }>;
}

/**
 * Cloudflare Workers AI Provider
 *
 * Provides access to Llama and other models through Cloudflare's Workers AI.
 * Best used for:
 * - Cost-sensitive deployments
 * - Self-hosted installations
 * - Non-safety-critical features (sentiment analysis, summaries, etc.)
 */
export class CloudflareProvider implements AIProvider {
  readonly type: AIProviderType = 'cloudflare';
  readonly name = 'Cloudflare Workers AI';

  private accountId: string | undefined;
  private apiToken: string | undefined;

  constructor(accountId?: string, apiToken?: string) {
    this.accountId = accountId ?? process.env.CLOUDFLARE_ACCOUNT_ID;
    this.apiToken = apiToken ?? process.env.CLOUDFLARE_API_TOKEN;
  }

  /**
   * Check if the provider is available
   */
  isAvailable(): boolean {
    return (
      this.accountId !== undefined &&
      this.accountId !== '' &&
      this.apiToken !== undefined &&
      this.apiToken !== ''
    );
  }

  /**
   * Get available models for each tier
   */
  getAvailableModels(): Record<ModelTier, string> {
    return { ...CLOUDFLARE_MODELS };
  }

  /**
   * Make a request to Cloudflare Workers AI
   */
  private async makeRequest<T>(model: string, body: object): Promise<T> {
    if (
      this.accountId === undefined ||
      this.accountId === '' ||
      this.apiToken === undefined ||
      this.apiToken === ''
    ) {
      throw new Error('Cloudflare provider not configured - missing account ID or API token');
    }

    const url = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/ai/run/${model}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Cloudflare API error (${response.status.toString()}): ${errorText}`);
    }

    const data = (await response.json()) as T;
    return data;
  }

  /**
   * Generate text from a prompt
   */
  async generateText(
    prompt: string,
    options?: GenerateTextOptions
  ): Promise<GenerateTextResult> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const model = CLOUDFLARE_MODELS[opts.modelTier];
    const startTime = Date.now();

    // Build messages array
    const messages: Array<{ role: string; content: string }> = [];

    if (opts.systemPrompt !== undefined && opts.systemPrompt !== '') {
      messages.push({ role: 'system', content: opts.systemPrompt });
    }

    messages.push({ role: 'user', content: prompt });

    const response = await this.makeRequest<CloudflareTextResponse>(model, {
      messages,
      max_tokens: opts.maxTokens,
      temperature: opts.temperature,
    });

    const latencyMs = Date.now() - startTime;

    if (!response.success) {
      const errorMsg = response.errors.map((e) => e.message).join(', ');
      throw new Error(`Cloudflare generation failed: ${errorMsg}`);
    }

    // Cloudflare doesn't provide token counts, so we estimate
    const estimatedInputTokens = Math.ceil(prompt.length / 4);
    const estimatedOutputTokens = Math.ceil(response.result.response.length / 4);

    return {
      text: response.result.response,
      usage: {
        inputTokens: estimatedInputTokens,
        outputTokens: estimatedOutputTokens,
        totalTokens: estimatedInputTokens + estimatedOutputTokens,
      },
      model,
      provider: this.type,
      latencyMs,
    };
  }

  /**
   * Generate structured JSON from a prompt
   */
  async generateJSON<T>(
    prompt: string,
    schema: z.ZodSchema<T>,
    options?: GenerateJSONOptions
  ): Promise<GenerateJSONResult<T>> {
    const retryAttempts = options?.retryAttempts ?? 2;
    let currentPrompt = prompt;

    // Add JSON instruction to system prompt
    const systemPrompt = [
      options?.systemPrompt,
      'You must respond with valid JSON only. No markdown code blocks, no explanations, just the raw JSON object.',
      'Start your response with { or [ and end with } or ].',
    ]
      .filter(Boolean)
      .join('\n\n');

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retryAttempts; attempt++) {
      const result = await this.generateText(currentPrompt, {
        ...options,
        systemPrompt,
        // Lower temperature for JSON to improve consistency
        temperature: options?.temperature ?? 0.2,
      });

      try {
        // Try to extract JSON from the response
        const jsonText = this.extractJSON(result.text);
        const parsed = JSON.parse(jsonText) as unknown;
        const validated = schema.parse(parsed);

        return {
          data: validated,
          rawText: result.text,
          usage: result.usage,
          model: result.model,
          provider: result.provider,
          latencyMs: result.latencyMs,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // If we have retries left, try again with error feedback
        if (attempt < retryAttempts) {
          currentPrompt = `${prompt}\n\nYour previous response was not valid JSON. Error: ${lastError.message}\nPlease respond with ONLY valid JSON, no other text.`;
        }
      }
    }

    throw new Error(`Failed to generate valid JSON after ${retryAttempts + 1} attempts: ${lastError?.message}`);
  }

  /**
   * Generate embedding vector for text
   */
  async generateEmbedding(text: string): Promise<GenerateEmbeddingResult> {
    const response = await this.makeRequest<CloudflareEmbeddingResponse>(EMBEDDING_MODEL, {
      text: [text],
    });

    if (!response.success) {
      const errorMsg = response.errors.map((e) => e.message).join(', ');
      throw new Error(`Cloudflare embedding failed: ${errorMsg}`);
    }

    const embedding = response.result.data[0];
    if (embedding === undefined) {
      throw new Error('Cloudflare embedding failed: No embedding data returned');
    }

    return {
      embedding,
      model: EMBEDDING_MODEL,
      provider: this.type,
      dimensions: embedding.length,
    };
  }

  /**
   * Extract JSON from a response that may contain extra text
   * Uses string manipulation instead of regex to avoid ReDoS vulnerabilities
   */
  private extractJSON(text: string): string {
    const trimmed = text.trim();

    // Try to find JSON in code blocks first (```json ... ``` or ``` ... ```)
    const codeBlockStart = trimmed.indexOf('```');
    if (codeBlockStart !== -1) {
      const afterStart = trimmed.indexOf('\n', codeBlockStart);
      if (afterStart !== -1) {
        const codeBlockEnd = trimmed.indexOf('```', afterStart);
        if (codeBlockEnd !== -1) {
          const content = trimmed.slice(afterStart + 1, codeBlockEnd).trim();
          if (content !== '') {
            return content;
          }
        }
      }
    }

    // Try to find JSON object directly (first { to last })
    const objectStart = trimmed.indexOf('{');
    const objectEnd = trimmed.lastIndexOf('}');
    if (objectStart !== -1 && objectEnd > objectStart) {
      return trimmed.slice(objectStart, objectEnd + 1);
    }

    // Try to find JSON array directly (first [ to last ])
    const arrayStart = trimmed.indexOf('[');
    const arrayEnd = trimmed.lastIndexOf(']');
    if (arrayStart !== -1 && arrayEnd > arrayStart) {
      return trimmed.slice(arrayStart, arrayEnd + 1);
    }

    // Return as-is and let JSON.parse fail with a clear error
    return trimmed;
  }
}

/**
 * Create a Cloudflare provider instance
 */
export function createCloudflareProvider(
  accountId?: string,
  apiToken?: string
): CloudflareProvider {
  return new CloudflareProvider(accountId, apiToken);
}
