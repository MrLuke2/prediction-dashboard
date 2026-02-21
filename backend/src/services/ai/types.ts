import { z } from 'zod';

// ─── Provider Identity ──────────────────────────────────────────────────────

export type AIProviderId = 'anthropic' | 'openai' | 'gemini';

export interface AIProviderSelection {
  providerId: AIProviderId;
  model: string;
}

// ─── Request / Response ─────────────────────────────────────────────────────

export interface AIRequest {
  /** System-level instructions for the model */
  systemPrompt: string;
  /** User-level prompt / query */
  userPrompt: string;
  /** Optional Zod schema — if provided, response is parsed to structured JSON */
  responseSchema?: z.ZodSchema;
  /** Max tokens to generate (default: 1000) */
  maxTokens?: number;
  /** Temperature for generation (default: 0.3 — low for deterministic analysis) */
  temperature?: number;
  /** Agent name for tracking purposes */
  agentName?: string;
}

export interface AIResponse {
  /** Raw text content from the model */
  content: string;
  /** Parsed structured content (if responseSchema was provided) */
  parsedContent?: unknown;
  /** Provider that handled the request */
  provider: AIProviderId;
  /** Model used */
  model: string;
  /** Input tokens consumed */
  tokensInput: number;
  /** Output tokens generated */
  tokensOutput: number;
  /** End-to-end latency in milliseconds */
  latencyMs: number;
  /** Estimated cost in USD */
  costUsd: number;
}

// ─── Errors ─────────────────────────────────────────────────────────────────

export type AIProviderErrorCode =
  | 'AUTHENTICATION_ERROR'
  | 'RATE_LIMIT'
  | 'TIMEOUT'
  | 'INVALID_REQUEST'
  | 'MODEL_NOT_FOUND'
  | 'CONTENT_FILTER'
  | 'SERVER_ERROR'
  | 'NETWORK_ERROR'
  | 'BUDGET_EXCEEDED'
  | 'UNKNOWN';

export class AIProviderError extends Error {
  public readonly provider: AIProviderId;
  public readonly code: AIProviderErrorCode;
  public readonly retryable: boolean;

  constructor(opts: {
    provider: AIProviderId;
    code: AIProviderErrorCode;
    message: string;
    retryable: boolean;
  }) {
    super(opts.message);
    this.name = 'AIProviderError';
    this.provider = opts.provider;
    this.code = opts.code;
    this.retryable = opts.retryable;
  }
}

export class AIBudgetExceededError extends Error {
  public readonly dailyCost: number;
  public readonly limit: number;

  constructor(dailyCost: number, limit: number) {
    super(`Daily AI budget exceeded: $${dailyCost.toFixed(4)} / $${limit.toFixed(2)}`);
    this.name = 'AIBudgetExceededError';
    this.dailyCost = dailyCost;
    this.limit = limit;
  }
}

// ─── Provider Interface ─────────────────────────────────────────────────────

export interface IAIProvider {
  readonly providerId: AIProviderId;
  complete(request: AIRequest, model: string, apiKey: string): Promise<AIResponse>;
}
