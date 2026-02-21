import { db } from '../../db/index.js';
import { aiUsageMetrics, agentLogs, users } from '../../db/schema/index.js';
import { eq } from 'drizzle-orm';
import { config } from '../../config.js';
import { logger } from '../../lib/logger.js';
import { decrypt } from '../../lib/encryption.js';
import * as metrics from '../../lib/metrics.js';
import { trace, SpanStatusCode } from '@opentelemetry/api';

import type { AIProviderId, AIProviderSelection, AIRequest, AIResponse, IAIProvider } from './types.js';
import { AIProviderError, AIBudgetExceededError } from './types.js';
import { AnthropicProvider } from './providers/anthropic.provider.js';
import { OpenAIProvider } from './providers/openai.provider.js';
import { GeminiProvider } from './providers/gemini.provider.js';
import { validateSelection, FALLBACK_ORDER, getCheapestModel } from './modelCatalog.js';
import { enforceBudgetLimit } from './costTracker.js';

// ─── Singleton Router ───────────────────────────────────────────────────────

export class AIProviderRouter {
  private static instance: AIProviderRouter;

  private providers: Map<AIProviderId, IAIProvider>;

  private constructor() {
    this.providers = new Map();
    this.providers.set('anthropic', new AnthropicProvider());
    this.providers.set('openai', new OpenAIProvider());
    this.providers.set('gemini', new GeminiProvider());
  }

  static getInstance(): AIProviderRouter {
    if (!AIProviderRouter.instance) {
      AIProviderRouter.instance = new AIProviderRouter();
    }
    return AIProviderRouter.instance;
  }

  // ─── Main Entry Point ──────────────────────────────────────────────────

  /**
   * Route an AI request to the correct provider.
   *
   * 1. Enforces daily budget limit
   * 2. Resolves API key (BYOK → platform default)
   * 3. Calls the selected provider
   * 4. If provider fails and ENABLE_AI_FALLBACK is true, tries the next one
   * 5. Records usage in ai_usage_metrics (always, no exceptions)
   */
  async complete(
    selection: AIProviderSelection,
    request: AIRequest,
    userId?: string,
  ): Promise<AIResponse> {
    // 1. Budget check (before making any call)
    try {
      await enforceBudgetLimit(userId);
    } catch (err) {
      if (err instanceof AIBudgetExceededError) {
        metrics.ai_budget_exceeded_total.inc();
        // Switch to cheapest model automatically
        logger.warn(
          { userId, originalModel: selection.model },
          'Budget exceeded — switching to cheapest model'
        );
        selection = {
          providerId: selection.providerId,
          model: getCheapestModel(selection.providerId),
        };
        // Re-check with cheapest model — if still over, throw
        await enforceBudgetLimit(userId);
      } else {
        throw err;
      }
    }

    // 2. Validate selection
    if (!validateSelection(selection)) {
      throw new AIProviderError({
        provider: selection.providerId,
        code: 'INVALID_REQUEST',
        message: `Invalid model "${selection.model}" for provider "${selection.providerId}"`,
        retryable: false,
      });
    }

    // 3. Build fallback chain
    const fallbackEnabled = config.ENABLE_AI_FALLBACK;
    const providersToTry: AIProviderId[] = [selection.providerId];

    if (fallbackEnabled) {
      for (const p of FALLBACK_ORDER) {
        if (p !== selection.providerId) {
          providersToTry.push(p);
        }
      }
    }

    // 4. Attempt each provider in order
    let lastError: Error | null = null;

    for (let i = 0; i < providersToTry.length; i++) {
      const currentProviderId = providersToTry[i];
      const isFallback = i > 0;
      const provider = this.providers.get(currentProviderId);

      if (!provider) continue;

      // Resolve API key
      const apiKey = await this.resolveApiKey(currentProviderId, userId);
      if (!apiKey) {
        logger.debug({ provider: currentProviderId, userId }, 'No API key available, skipping');
        continue;
      }

      // Determine model (use cheapest if falling back to a different provider)
      const model = isFallback ? getCheapestModel(currentProviderId) : selection.model;

      try {
        const tracer = trace.getTracer('alpha-mode-predict');
        const startTime = Date.now();
        const response = await tracer.startActiveSpan(`ai_complete_${currentProviderId}`, async (span) => {
          span.setAttributes({
            'ai.provider': currentProviderId,
            'ai.model': model,
            'ai.agent': request.agentName ?? 'unknown',
            'ai.userId': userId ?? 'system',
          });

          try {
            const res = await provider.complete(request, model, apiKey);
            
            span.setAttributes({
              'ai.tokens_input': res.tokensInput,
              'ai.tokens_output': res.tokensOutput,
              'ai.cost_usd': res.costUsd,
              'ai.latency_ms': Date.now() - startTime,
            });
            
            return res;
          } catch (err: any) {
            span.recordException(err);
            span.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
            throw err;
          } finally {
            span.end();
          }
        });

        // Log fallback event
        if (isFallback) {
          logger.info(
            { from: selection.providerId, to: currentProviderId, model },
            'AI provider fallback succeeded'
          );
          await this.logFallbackEvent(
            selection.providerId,
            currentProviderId,
            model,
            request.agentName ?? 'unknown',
          );
        }

        // 5. Record usage (always, no exceptions)
        await this.recordUsage(response, userId, request.agentName ?? 'unknown', true);

        // Update metrics
        metrics.ai_requests_total.labels(currentProviderId, model, request.agentName ?? 'unknown').inc();
        metrics.ai_latency_ms.labels(currentProviderId, model).observe(Date.now() - startTime);
        metrics.ai_tokens_used_total.labels(currentProviderId, model, 'input').inc(response.tokensInput);
        metrics.ai_tokens_used_total.labels(currentProviderId, model, 'output').inc(response.tokensOutput);
        metrics.ai_cost_usd_total.labels(currentProviderId).inc(response.costUsd);

        return response;
      } catch (err) {
        lastError = err as Error;
        const isAIError = err instanceof AIProviderError;

        logger.warn(
          {
            provider: currentProviderId,
            model,
            error: isAIError ? err.code : 'UNKNOWN',
            retryable: isAIError ? err.retryable : false,
            isFallback,
          },
          `AI provider call failed${isFallback ? ' (fallback)' : ''}`
        );

        // Record failed usage
        await this.recordUsage(
          {
            content: '',
            provider: currentProviderId,
            model,
            tokensInput: 0,
            tokensOutput: 0,
            latencyMs: Date.now() - Date.now(),
            costUsd: 0,
          },
          userId,
          request.agentName ?? 'unknown',
          false,
          isAIError ? err.code : 'UNKNOWN',
        );

        // If error is not retryable, skip fallback
        if (isAIError && !err.retryable && !isFallback) {
          throw err;
        }

        // Continue to next provider in fallback chain
      }
    }

    // All providers failed
    throw lastError ?? new AIProviderError({
      provider: selection.providerId,
      code: 'UNKNOWN',
      message: 'All AI providers failed',
      retryable: false,
    });
  }

  // ─── API Key Resolution ────────────────────────────────────────────────

  /**
   * Resolve API key: BYOK first, platform default fallback.
   * Never returns raw key in logs.
   */
  private async resolveApiKey(
    providerId: AIProviderId,
    userId?: string,
  ): Promise<string | null> {
    // 1. Try user's BYOK key
    if (userId) {
      try {
        const user = await db.query.users.findFirst({
          where: eq(users.id, userId),
          columns: { apiKeys: true },
        });

        if (user?.apiKeys) {
          const keys = user.apiKeys as Record<string, string | undefined>;
          const encryptedKey = keys[providerId];
          if (encryptedKey) {
            try {
              return decrypt(encryptedKey);
            } catch {
              logger.warn({ userId, provider: providerId }, 'Failed to decrypt BYOK key');
            }
          }
        }
      } catch {
        // DB error — fall through to platform key
      }
    }

    // 2. Platform default key
    switch (providerId) {
      case 'anthropic':
        return config.ANTHROPIC_API_KEY ?? null;
      case 'openai':
        return config.OPENAI_API_KEY ?? null;
      case 'gemini':
        return config.GEMINI_API_KEY ?? null;
      default:
        return null;
    }
  }

  // ─── Usage Recording ───────────────────────────────────────────────────

  /**
   * Record every AI call in ai_usage_metrics.
   * This runs after every call — success or failure — no exceptions.
   */
  private async recordUsage(
    response: AIResponse,
    userId: string | undefined,
    agentName: string,
    success: boolean,
    errorCode?: string,
  ): Promise<void> {
    try {
      await db.insert(aiUsageMetrics).values({
        provider: response.provider,
        model: response.model,
        userId: userId ?? null,
        agentName,
        tokensInput: response.tokensInput,
        tokensOutput: response.tokensOutput,
        latencyMs: response.latencyMs,
        costUsd: response.costUsd.toFixed(6),
        success,
        errorCode: errorCode ?? null,
      });
    } catch (err) {
      // Never let metric recording break the main flow
      logger.error({ err, provider: response.provider }, 'Failed to record AI usage metric');
    }
  }

  // ─── Fallback Logging ──────────────────────────────────────────────────

  private async logFallbackEvent(
    fromProvider: AIProviderId,
    toProvider: AIProviderId,
    model: string,
    agentName: string,
  ): Promise<void> {
    metrics.ai_fallback_total.labels(fromProvider, toProvider).inc();
    try {
      await db.insert(agentLogs).values({
        agentName,
        level: 'warn',
        message: `AI provider fallback: ${fromProvider} → ${toProvider} (${model})`,
        metadata: { fromProvider, toProvider, model },
        provider: toProvider,
        model,
      });
    } catch (err) {
      logger.error({ err }, 'Failed to log fallback event');
    }
  }
}

// ─── Convenience Export ─────────────────────────────────────────────────────

export const aiRouter = AIProviderRouter.getInstance();
