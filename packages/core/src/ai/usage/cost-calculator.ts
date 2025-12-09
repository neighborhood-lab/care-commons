/**
 * AI Cost Calculator
 *
 * Calculates estimated costs for AI API calls based on token usage
 * and provider pricing.
 *
 * @module @folkcare/core/ai/usage
 */

import type { AIProviderType } from '../types.js';
import type { ModelCostConfig } from './types.js';

/**
 * Model cost configurations (costs in cents per 1K tokens)
 * Updated December 2024 pricing
 */
const MODEL_COSTS: ModelCostConfig[] = [
  // Anthropic Claude models
  {
    provider: 'anthropic',
    model: 'claude-3-5-haiku-latest',
    inputCostPer1kTokens: 0.08, // $0.0008/1K
    outputCostPer1kTokens: 0.4, // $0.004/1K
  },
  {
    provider: 'anthropic',
    model: 'claude-sonnet-4-20250514',
    inputCostPer1kTokens: 0.3, // $0.003/1K
    outputCostPer1kTokens: 1.5, // $0.015/1K
  },
  {
    provider: 'anthropic',
    model: 'claude-opus-4-20250514',
    inputCostPer1kTokens: 1.5, // $0.015/1K
    outputCostPer1kTokens: 7.5, // $0.075/1K
  },
  // Cloudflare Workers AI (Llama models) - FREE tier then very low cost
  {
    provider: 'cloudflare',
    model: '@cf/meta/llama-3.2-1b-instruct',
    inputCostPer1kTokens: 0.001, // Essentially free
    outputCostPer1kTokens: 0.001,
  },
  {
    provider: 'cloudflare',
    model: '@cf/meta/llama-3.2-3b-instruct',
    inputCostPer1kTokens: 0.002,
    outputCostPer1kTokens: 0.002,
  },
  {
    provider: 'cloudflare',
    model: '@cf/meta/llama-3.1-70b-instruct',
    inputCostPer1kTokens: 0.01,
    outputCostPer1kTokens: 0.01,
  },
  // OpenAI models (for future support)
  {
    provider: 'openai',
    model: 'gpt-4o-mini',
    inputCostPer1kTokens: 0.015, // $0.00015/1K
    outputCostPer1kTokens: 0.06, // $0.0006/1K
  },
  {
    provider: 'openai',
    model: 'gpt-4o',
    inputCostPer1kTokens: 0.25, // $0.0025/1K
    outputCostPer1kTokens: 1.0, // $0.01/1K
  },
  // Ollama (self-hosted) - no API cost
  {
    provider: 'ollama',
    model: 'llama3.2',
    inputCostPer1kTokens: 0,
    outputCostPer1kTokens: 0,
  },
];

/**
 * Default cost for unknown models (conservative estimate)
 */
const DEFAULT_COST: ModelCostConfig = {
  provider: 'anthropic',
  model: 'unknown',
  inputCostPer1kTokens: 0.3,
  outputCostPer1kTokens: 1.5,
};

/**
 * Estimated hours saved per AI feature (for value metrics)
 * These are rough estimates of manual equivalent time
 */
export const FEATURE_TIME_SAVINGS: Record<string, number> = {
  // Minutes saved per call
  'visit-note-summary': 5,
  'visit-note-autofill': 10,
  'clinical-note-generation': 15,
  'medication-interaction-check': 8,
  'hospitalization-risk': 10,
  'vitals-anomaly-detection': 5,
  'sentiment-analysis': 3,
  'documentation-quality': 5,
  'compliance-checking': 10,
  'churn-prediction': 15,
  'revenue-forecasting': 20,
  'caregiver-matching': 12,
  'task-prioritization': 5,
  'staffing-demand-prediction': 15,
  'natural-language-care-plan': 30,
  'care-plan-effectiveness': 20,
  'training-recommendation': 10,
  'optimal-visit-frequency': 15,
};

/**
 * Get cost configuration for a model
 */
export function getModelCost(provider: AIProviderType, model: string): ModelCostConfig {
  // Try exact match first
  const exactMatch = MODEL_COSTS.find(
    (c) => c.provider === provider && c.model === model
  );
  if (exactMatch !== undefined) {
    return exactMatch;
  }

  // Try partial match (for model variants)
  const partialMatch = MODEL_COSTS.find(
    (c) => c.provider === provider && model.includes(c.model.replace('@cf/meta/', ''))
  );
  if (partialMatch !== undefined) {
    return partialMatch;
  }

  // Return default
  return DEFAULT_COST;
}

/**
 * Calculate estimated cost in cents for a given usage
 */
export function calculateCostCents(
  provider: AIProviderType,
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const config = getModelCost(provider, model);

  const inputCost = (inputTokens / 1000) * config.inputCostPer1kTokens;
  const outputCost = (outputTokens / 1000) * config.outputCostPer1kTokens;

  // Round to nearest cent (minimum 0)
  return Math.max(0, Math.round(inputCost + outputCost));
}

/**
 * Calculate estimated manual cost for a feature
 * Based on average hourly rate for healthcare admin ($25-35/hour)
 */
export function calculateManualCostCents(
  featureName: string,
  requestCount: number,
  hourlyRateCents: number = 3000 // $30/hour default
): number {
  const minutesSaved = FEATURE_TIME_SAVINGS[featureName] ?? 5; // Default 5 min
  const hoursSaved = (minutesSaved * requestCount) / 60;
  return Math.round(hoursSaved * hourlyRateCents);
}

/**
 * Calculate hours automated for a feature
 */
export function calculateHoursAutomated(
  featureName: string,
  requestCount: number
): number {
  const minutesSaved = FEATURE_TIME_SAVINGS[featureName] ?? 5;
  return Number(((minutesSaved * requestCount) / 60).toFixed(1));
}
