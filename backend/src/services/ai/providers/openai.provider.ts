import OpenAI from 'openai';
import { IAIProvider, AIRequest, AIResponse, AIProviderError } from '../types.js';
import { calculateCost } from '../modelCatalog.js';
import { logger } from '../../../lib/logger.js';

const TIMEOUT_MS = 10_000;
const RETRY_DELAY_MS = 2_000;

export class OpenAIProvider implements IAIProvider {
  readonly providerId = 'openai' as const;

  async complete(request: AIRequest, model: string, apiKey: string): Promise<AIResponse> {
    const client = new OpenAI({ apiKey });
    const start = performance.now();

    const messages: OpenAI.ChatCompletionMessageParam[] = [];

    if (request.systemPrompt) {
      messages.push({ role: 'system', content: request.systemPrompt });
    }

    // If structured output requested, add JSON instruction to user prompt
    let userContent = request.userPrompt;
    if (request.responseSchema) {
      userContent += '\n\nRespond with valid JSON only. No markdown, no code blocks.';
    }

    messages.push({ role: 'user', content: userContent });

    const requestParams: OpenAI.ChatCompletionCreateParams = {
      model,
      messages,
      max_tokens: request.maxTokens ?? 1000,
      temperature: request.temperature ?? 0.3,
    };

    // Structured output via response_format
    if (request.responseSchema) {
      requestParams.response_format = { type: 'json_object' };
    }

    try {
      const completion = await this.callWithRetry(client, requestParams);
      const latencyMs = Math.round(performance.now() - start);

      const rawContent = completion.choices[0]?.message?.content ?? '';

      let content = rawContent;
      let parsedContent: unknown = undefined;

      if (request.responseSchema && rawContent) {
        try {
          const parsed = JSON.parse(rawContent);
          parsedContent = request.responseSchema.parse(parsed);
          content = rawContent;
        } catch {
          parsedContent = undefined;
        }
      }

      const tokensInput = completion.usage?.prompt_tokens ?? 0;
      const tokensOutput = completion.usage?.completion_tokens ?? 0;
      const costUsd = calculateCost('openai', model, tokensInput, tokensOutput);

      return {
        content,
        parsedContent,
        provider: 'openai',
        model,
        tokensInput,
        tokensOutput,
        latencyMs,
        costUsd,
      };
    } catch (err: unknown) {
      throw this.mapError(err);
    }
  }

  private async callWithRetry(
    client: OpenAI,
    params: OpenAI.ChatCompletionCreateParams,
    retried = false,
  ): Promise<OpenAI.ChatCompletion> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

      try {
        const response = await client.chat.completions.create(params, {
          signal: controller.signal,
        });
        return response as OpenAI.ChatCompletion;
      } finally {
        clearTimeout(timeout);
      }
    } catch (err: any) {
      if (!retried && err?.status === 429) {
        logger.warn({ provider: 'openai' }, 'Rate limited (429), retrying in 2s…');
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
        return this.callWithRetry(client, params, true);
      }
      throw err;
    }
  }

  private mapError(err: unknown): AIProviderError {
    const e = err as any;
    const status = e?.status ?? e?.statusCode;
    const message = e?.message ?? 'Unknown OpenAI error';

    if (e?.name === 'AbortError' || message.includes('abort')) {
      return new AIProviderError({ provider: 'openai', code: 'TIMEOUT', message: `Request timed out after ${TIMEOUT_MS}ms`, retryable: true });
    }
    if (status === 401) {
      return new AIProviderError({ provider: 'openai', code: 'AUTHENTICATION_ERROR', message: 'Invalid API key', retryable: false });
    }
    if (status === 429) {
      return new AIProviderError({ provider: 'openai', code: 'RATE_LIMIT', message, retryable: true });
    }
    if (status === 400) {
      return new AIProviderError({ provider: 'openai', code: 'INVALID_REQUEST', message, retryable: false });
    }
    if (status === 404) {
      return new AIProviderError({ provider: 'openai', code: 'MODEL_NOT_FOUND', message, retryable: false });
    }
    if (status >= 500) {
      return new AIProviderError({ provider: 'openai', code: 'SERVER_ERROR', message, retryable: true });
    }
    return new AIProviderError({ provider: 'openai', code: 'UNKNOWN', message, retryable: false });
  }
}
