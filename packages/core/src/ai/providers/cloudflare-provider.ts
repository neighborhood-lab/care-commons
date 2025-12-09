/**
 * Cloudflare Workers AI Provider
 *
 * Implementation of IAIProvider for Cloudflare's Workers AI (Llama models).
 * FREE tier - suitable for non-safety-critical features.
 */

import type {
  IAIProvider,
  AIProviderType,
  GenerateTextOptions,
  GenerateJSONOptions,
  TextGenerationResult,
  JSONGenerationResult,
  EmbeddingResult,
} from '../types.js';

export interface CloudflareProviderConfig {
  accountId: string;
  apiToken: string;
  model?: string; // e.g., '@cf/meta/llama-3.2-3b-instruct'
}

interface CloudflareTextResponse {
  result: {
    response: string;
  };
  success: boolean;
  errors: Array<{ message: string }>;
}

interface CloudflareEmbeddingResponse {
  result: {
    data: Array<{ values: number[] }>;
  };
  success: boolean;
  errors: Array<{ message: string }>;
}

export class CloudflareProvider implements IAIProvider {
  readonly name: AIProviderType = 'cloudflare';
  private accountId: string;
  private apiToken: string;
  private model: string;
  private embeddingModel: string;

  constructor(config: CloudflareProviderConfig) {
    this.accountId = config.accountId;
    this.apiToken = config.apiToken;
    // Default to Llama 3.2 3B - good balance of speed and capability
    this.model = config.model ?? '@cf/meta/llama-3.2-3b-instruct';
    this.embeddingModel = '@cf/baai/bge-base-en-v1.5';
  }

  get isAvailable(): boolean {
    return this.accountId !== '' && this.apiToken !== '';
  }

  private get baseUrl(): string {
    return `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/ai/run`;
  }

  async generateText(prompt: string, options?: GenerateTextOptions): Promise<TextGenerationResult> {
    const systemPrompt = options?.systemPrompt;
    const messages = systemPrompt !== undefined && systemPrompt !== ''
      ? [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ]
      : [{ role: 'user', content: prompt }];

    const response = await fetch(`${this.baseUrl}/${this.model}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        max_tokens: options?.maxTokens ?? 2048,
        temperature: options?.temperature ?? 0.3,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Cloudflare AI request failed: ${response.status} ${errorText}`);
    }

    const data = (await response.json()) as CloudflareTextResponse;

    if (!data.success) {
      throw new Error(`Cloudflare AI error: ${data.errors.map(e => e.message).join(', ')}`);
    }

    // Cloudflare doesn't provide token counts in the same way
    // Estimate based on response length (rough approximation)
    const estimatedOutputTokens = Math.ceil(data.result.response.length / 4);
    const estimatedInputTokens = Math.ceil(prompt.length / 4);

    return {
      text: data.result.response,
      finishReason: 'stop',
      usage: {
        inputTokens: estimatedInputTokens,
        outputTokens: estimatedOutputTokens,
      },
      provider: this.name,
      model: this.model,
    };
  }

  async generateJSON<T>(
    prompt: string,
    options: GenerateJSONOptions<T>
  ): Promise<JSONGenerationResult<T>> {
    const maxRetries = options.retryOnParseError === true ? (options.maxRetries ?? 3) : 1;
    let lastError: Error | null = null;
    let parseAttempts = 0;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      parseAttempts++;

      // More explicit JSON instruction for smaller models
      const jsonPrompt = `${prompt}

CRITICAL INSTRUCTIONS:
1. Return ONLY valid JSON
2. Do NOT include any text before or after the JSON
3. Do NOT use markdown code blocks
4. Start your response with { and end with }
5. Ensure all strings are properly quoted
6. Ensure all arrays and objects are properly closed`;

      const result = await this.generateText(jsonPrompt, {
        ...options,
        temperature: Math.max(0.1, (options.temperature ?? 0.3) - 0.1 * attempt), // Lower temp on retries
      });

      try {
        // Clean up response - strip markdown code blocks if present
        let cleanText = result.text.trim();

        // Find JSON start
        const jsonStart = cleanText.indexOf('{');
        const arrayStart = cleanText.indexOf('[');
        let start: number;
        if (jsonStart === -1) {
          start = arrayStart;
        } else if (arrayStart === -1) {
          start = jsonStart;
        } else {
          start = Math.min(jsonStart, arrayStart);
        }

        if (start > 0) {
          cleanText = cleanText.slice(start);
        }

        // Find JSON end
        const lastBrace = cleanText.lastIndexOf('}');
        const lastBracket = cleanText.lastIndexOf(']');
        const end = Math.max(lastBrace, lastBracket);

        if (end > 0 && end < cleanText.length - 1) {
          cleanText = cleanText.slice(0, end + 1);
        }

        const parsed = JSON.parse(cleanText);
        const validated = options.schema.parse(parsed);

        return {
          ...result,
          data: validated,
          parseAttempts,
        };
      } catch (error) {
        lastError = error as Error;
        console.warn(`Cloudflare JSON parse attempt ${attempt + 1} failed:`, error);
      }
    }

    throw new Error(`Failed to generate valid JSON after ${parseAttempts} attempts: ${lastError?.message}`);
  }

  async generateEmbedding(text: string): Promise<EmbeddingResult> {
    const response = await fetch(`${this.baseUrl}/${this.embeddingModel}`, {
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
      const errorText = await response.text();
      throw new Error(`Cloudflare embedding request failed: ${response.status} ${errorText}`);
    }

    const data = (await response.json()) as CloudflareEmbeddingResponse;

    if (!data.success) {
      throw new Error(`Cloudflare embedding error: ${data.errors.map(e => e.message).join(', ')}`);
    }

    const embedding = data.result.data[0]?.values ?? [];

    return {
      embedding,
      dimensions: embedding.length,
      provider: this.name,
      model: this.embeddingModel,
    };
  }

  async checkHealth(): Promise<boolean> {
    try {
      await this.generateText('Reply with OK', { maxTokens: 10 });
      return true;
    } catch (error) {
      console.error('Cloudflare health check failed:', error);
      return false;
    }
  }
}

/**
 * Factory function to create Cloudflare provider
 */
export function createCloudflareProvider(config: CloudflareProviderConfig): CloudflareProvider {
  return new CloudflareProvider(config);
}
