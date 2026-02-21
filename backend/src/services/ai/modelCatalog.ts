import type { AIProviderId, AIProviderSelection } from './types.js';

// ─── Pricing (per 1K tokens, USD) ───────────────────────────────────────────

interface ModelPricing {
  inputPer1k: number;
  outputPer1k: number;
}

const MODEL_PRICING: Record<string, ModelPricing> = {
  // Anthropic
  'claude-opus-4-5':   { inputPer1k: 0.015, outputPer1k: 0.075 },
  'claude-sonnet-4-5': { inputPer1k: 0.003, outputPer1k: 0.015 },
  'claude-haiku-4-5':  { inputPer1k: 0.001, outputPer1k: 0.005 },

  // OpenAI
  'gpt-4o':       { inputPer1k: 0.005,   outputPer1k: 0.015 },
  'gpt-4o-mini':  { inputPer1k: 0.00015, outputPer1k: 0.0006 },
  'o1-mini':      { inputPer1k: 0.003,   outputPer1k: 0.012 },

  // Gemini
  'gemini-2.5-flash': { inputPer1k: 0.00015, outputPer1k: 0.0006 },
  'gemini-2.0-flash': { inputPer1k: 0.0001,  outputPer1k: 0.0004 },
  'gemini-1.5-pro':   { inputPer1k: 0.00125, outputPer1k: 0.005 },
};

// ─── Allowed Models ─────────────────────────────────────────────────────────

/** Matches frontend AI_PROVIDERS config — single source of truth */
export const ALLOWED_MODELS: Record<AIProviderId, string[]> = {
  anthropic: ['claude-opus-4-5', 'claude-sonnet-4-5', 'claude-haiku-4-5'],
  openai: ['gpt-4o', 'gpt-4o-mini', 'o1-mini'],
  gemini: ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'],
};

/** Cheapest models per provider (sorted by cost) */
const CHEAPEST_MODELS: Record<AIProviderId, string> = {
  anthropic: 'claude-haiku-4-5',
  openai: 'gpt-4o-mini',
  gemini: 'gemini-2.0-flash',
};

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Validate that a provider+model selection is allowed.
 */
export function validateSelection(selection: AIProviderSelection): boolean {
  const models = ALLOWED_MODELS[selection.providerId];
  if (!models) return false;
  return models.includes(selection.model);
}

/**
 * Get the cheapest available model for a given provider.
 */
export function getCheapestModel(providerId: AIProviderId): string {
  return CHEAPEST_MODELS[providerId];
}

/**
 * Get pricing for a specific model.
 * Falls back to a conservative default if the model isn't catalogued.
 */
export function getModelPricing(provider: AIProviderId, model: string): ModelPricing {
  return MODEL_PRICING[model] ?? { inputPer1k: 0.01, outputPer1k: 0.03 };
}

/**
 * Calculate the cost of a single AI call.
 */
export function calculateCost(
  provider: AIProviderId,
  model: string,
  tokensInput: number,
  tokensOutput: number,
): number {
  const pricing = getModelPricing(provider, model);
  return (tokensInput / 1000) * pricing.inputPer1k + (tokensOutput / 1000) * pricing.outputPer1k;
}

/** Fallback order when a provider fails */
export const FALLBACK_ORDER: AIProviderId[] = ['anthropic', 'openai', 'gemini'];
