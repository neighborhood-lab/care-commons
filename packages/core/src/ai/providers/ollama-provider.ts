/**
 * Ollama Local AI Provider
 *
 * Implementation of IAIProvider for locally-hosted Ollama models.
 * Suitable for self-hosted deployments without external API dependencies.
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

export interface OllamaProviderConfig {
  baseUrl?: string; // Default: http://localhost:11434
  model?: string;   // Default: llama3.2:3b
}

interface OllamaGenerateResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  done_reason?: string;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

interface OllamaEmbeddingResponse {
  model: string;
  embedding: number[];
}

export class OllamaProvider implements IAIProvider {
  readonly name: AIProviderType = 'ollama';
  private baseUrl: string;
  private model: string;
  private _isAvailable: boolean | null = null;

  constructor(config: OllamaProviderConfig = {}) {
    this.baseUrl = config.baseUrl ?? 'http://localhost:11434';
    this.model = config.model ?? 'llama3.2:3b';
  }

  get isAvailable(): boolean {
    // Return cached value if we've checked
    return this._isAvailable ?? true;
  }

  async generateText(prompt: string, options?: GenerateTextOptions): Promise<TextGenerationResult> {
    const systemPrompt = options?.systemPrompt;
    const fullPrompt = systemPrompt !== undefined && systemPrompt !== ''
      ? `${systemPrompt}\n\nUser: ${prompt}`
      : prompt;

    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        prompt: fullPrompt,
        stream: false,
        options: {
          num_predict: options?.maxTokens ?? 2048,
          temperature: options?.temperature ?? 0.3,
          stop: options?.stopSequences,
        },
      }),
    });

    if (!response.ok) {
      this._isAvailable = false;
      const errorText = await response.text();
      throw new Error(`Ollama request failed: ${response.status} ${errorText}`);
    }

    this._isAvailable = true;
    const data = (await response.json()) as OllamaGenerateResponse;

    return {
      text: data.response,
      finishReason: data.done_reason === 'stop' ? 'stop' : 'max_tokens',
      usage: {
        inputTokens: data.prompt_eval_count ?? 0,
        outputTokens: data.eval_count ?? 0,
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

      const jsonPrompt = `${prompt}

CRITICAL: Return ONLY valid JSON. No explanation, no markdown, no code blocks.
Start directly with { or [ and end with } or ].`;

      const result = await this.generateText(jsonPrompt, {
        ...options,
        temperature: Math.max(0.1, (options.temperature ?? 0.3) - 0.1 * attempt),
      });

      try {
        let cleanText = result.text.trim();

        // Find JSON boundaries
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
        console.warn(`Ollama JSON parse attempt ${attempt + 1} failed:`, error);
      }
    }

    throw new Error(`Failed to generate valid JSON after ${parseAttempts} attempts: ${lastError?.message}`);
  }

  async generateEmbedding(text: string): Promise<EmbeddingResult> {
    const response = await fetch(`${this.baseUrl}/api/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        prompt: text,
      }),
    });

    if (!response.ok) {
      this._isAvailable = false;
      const errorText = await response.text();
      throw new Error(`Ollama embedding request failed: ${response.status} ${errorText}`);
    }

    this._isAvailable = true;
    const data = (await response.json()) as OllamaEmbeddingResponse;

    return {
      embedding: data.embedding,
      dimensions: data.embedding.length,
      provider: this.name,
      model: this.model,
    };
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
      });
      this._isAvailable = response.ok;
      return response.ok;
    } catch (error) {
      this._isAvailable = false;
      console.error('Ollama health check failed:', error);
      return false;
    }
  }
}

/**
 * Factory function to create Ollama provider
 */
export function createOllamaProvider(config?: OllamaProviderConfig): OllamaProvider {
  return new OllamaProvider(config);
}
