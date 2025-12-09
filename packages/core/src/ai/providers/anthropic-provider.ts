/**
 * Anthropic Claude AI Provider
 *
 * Implementation of IAIProvider for Anthropic's Claude models.
 * Used for safety-critical features requiring high accuracy.
 */

import Anthropic from '@anthropic-ai/sdk';
import type {
  IAIProvider,
  AIProviderType,
  GenerateTextOptions,
  GenerateJSONOptions,
  TextGenerationResult,
  JSONGenerationResult,
  EmbeddingResult,
} from '../types.js';

export interface AnthropicProviderConfig {
  apiKey: string;
  model?: string;
  defaultMaxTokens?: number;
  defaultTemperature?: number;
}

export class AnthropicProvider implements IAIProvider {
  readonly name: AIProviderType = 'anthropic';
  private client: Anthropic;
  private model: string;
  private defaultMaxTokens: number;
  private defaultTemperature: number;

  constructor(config: AnthropicProviderConfig) {
    this.client = new Anthropic({ apiKey: config.apiKey });
    this.model = config.model ?? 'claude-3-5-haiku-20241022';
    this.defaultMaxTokens = config.defaultMaxTokens ?? 2048;
    this.defaultTemperature = config.defaultTemperature ?? 0.3;
  }

  get isAvailable(): boolean {
    return true; // If constructed, API key exists
  }

  async generateText(prompt: string, options?: GenerateTextOptions): Promise<TextGenerationResult> {
    const messages: Anthropic.MessageParam[] = [
      { role: 'user', content: prompt },
    ];

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: options?.maxTokens ?? this.defaultMaxTokens,
      temperature: options?.temperature ?? this.defaultTemperature,
      system: options?.systemPrompt,
      messages,
      stop_sequences: options?.stopSequences,
    });

    const firstBlock = response.content[0];
    const text = firstBlock?.type === 'text' ? firstBlock.text : '';

    return {
      text,
      finishReason: response.stop_reason === 'end_turn' ? 'stop' : 'max_tokens',
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
      provider: this.name,
      model: this.model,
    };
  }

  async generateJSON<T>(
    prompt: string,
    options: GenerateJSONOptions<T>
  ): Promise<JSONGenerationResult<T>> {
    const maxRetries = options.retryOnParseError === true ? (options.maxRetries ?? 2) : 1;
    let lastError: Error | null = null;
    let parseAttempts = 0;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      parseAttempts++;

      const jsonPrompt = `${prompt}

IMPORTANT: Return ONLY valid JSON that conforms to the expected schema. Do not include any markdown formatting, code blocks, or explanatory text. Return pure JSON only.`;

      const result = await this.generateText(jsonPrompt, options);

      try {
        // Clean up response - strip markdown code blocks if present
        let cleanText = result.text.trim();
        if (cleanText.startsWith('```json')) {
          cleanText = cleanText.slice(7);
        } else if (cleanText.startsWith('```')) {
          cleanText = cleanText.slice(3);
        }
        if (cleanText.endsWith('```')) {
          cleanText = cleanText.slice(0, -3);
        }
        cleanText = cleanText.trim();

        const parsed = JSON.parse(cleanText);
        const validated = options.schema.parse(parsed);

        return {
          ...result,
          data: validated,
          parseAttempts,
        };
      } catch (error) {
        lastError = error as Error;
        console.warn(`JSON parse attempt ${attempt + 1} failed:`, error);
      }
    }

    throw new Error(`Failed to generate valid JSON after ${parseAttempts} attempts: ${lastError?.message}`);
  }

  async generateEmbedding(_text: string): Promise<EmbeddingResult> {
    // Anthropic doesn't provide embeddings directly
    // This would need to use a different provider or model
    throw new Error('Anthropic does not support embeddings. Use a different provider for embeddings.');
  }

  async checkHealth(): Promise<boolean> {
    try {
      // Simple health check - minimal token request
      await this.client.messages.create({
        model: this.model,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Reply with OK' }],
      });
      return true;
    } catch (error) {
      console.error('Anthropic health check failed:', error);
      return false;
    }
  }
}

/**
 * Factory function to create Anthropic provider
 */
export function createAnthropicProvider(config: AnthropicProviderConfig): AnthropicProvider {
  return new AnthropicProvider(config);
}
