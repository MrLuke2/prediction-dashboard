import Anthropic from '@anthropic-ai/sdk';
import { IAIProvider, AIRequest, AIResponse, AIProviderError } from '../types.js';
import { calculateCost } from '../modelCatalog.js';
import { logger } from '../../../lib/logger.js';

const TIMEOUT_MS = 10_000;
const RETRY_DELAY_MS = 2_000;

export class AnthropicProvider implements IAIProvider {
  readonly providerId = 'anthropic' as const;

  async complete(request: AIRequest, model: string, apiKey: string): Promise<AIResponse> {
    const client = new Anthropic({ apiKey });
    const start = performance.now();

    const messages: Anthropic.MessageParam[] = [
      { role: 'user', content: request.userPrompt },
    ];

    // Build request config
    const requestConfig: Anthropic.MessageCreateParams = {
      model,
      max_tokens: request.maxTokens ?? 1000,
      system: request.systemPrompt,
      messages,
    };

    // If structured output requested, use tool_use pattern
    if (request.responseSchema) {
      requestConfig.tools = [
        {
          name: 'structured_response',
          description: 'Return the analysis result in structured JSON format.',
          input_schema: {
            type: 'object' as const,
            properties: {
              result: { type: 'string', description: 'The structured JSON result' },
            },
            required: ['result'],
          },
        },
      ];
      requestConfig.tool_choice = { type: 'tool', name: 'structured_response' };
    }

    try {
      const response = await this.callWithRetry(client, requestConfig);
      const latencyMs = Math.round(performance.now() - start);

      // Extract content
      let content = '';
      let parsedContent: unknown = undefined;

      for (const block of response.content) {
        if (block.type === 'text') {
          content += block.text;
        } else if (block.type === 'tool_use' && block.name === 'structured_response') {
          const raw = typeof block.input === 'string' ? block.input : JSON.stringify(block.input);
          content = raw;
          if (request.responseSchema) {
            try {
              const parsed = typeof block.input === 'string' ? JSON.parse(block.input) : block.input;
              parsedContent = request.responseSchema.parse(parsed);
            } catch {
              // Schema validation failed — return raw content, caller decides
              parsedContent = typeof block.input === 'string' ? JSON.parse(block.input) : block.input;
            }
          }
        }
      }

      const tokensInput = response.usage?.input_tokens ?? 0;
      const tokensOutput = response.usage?.output_tokens ?? 0;
      const costUsd = calculateCost('anthropic', model, tokensInput, tokensOutput);

      return {
        content,
        parsedContent,
        provider: 'anthropic',
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
    client: Anthropic,
    params: Anthropic.MessageCreateParams,
    retried = false,
  ): Promise<Anthropic.Message> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

      try {
        const response = await client.messages.create({
          ...params,
          stream: false,
        }, {
          signal: controller.signal,
        });
        return response;
      } finally {
        clearTimeout(timeout);
      }
    } catch (err: any) {
      if (!retried && err?.status === 429) {
        logger.warn({ provider: 'anthropic' }, 'Rate limited (429), retrying in 2s…');
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
        return this.callWithRetry(client, params, true);
      }
      throw err;
    }
  }

  private mapError(err: unknown): AIProviderError {
    const e = err as any;
    const status = e?.status ?? e?.statusCode;
    const message = e?.message ?? 'Unknown Anthropic error';

    if (e?.name === 'AbortError' || message.includes('abort')) {
      return new AIProviderError({ provider: 'anthropic', code: 'TIMEOUT', message: `Request timed out after ${TIMEOUT_MS}ms`, retryable: true });
    }
    if (status === 401 || status === 403) {
      return new AIProviderError({ provider: 'anthropic', code: 'AUTHENTICATION_ERROR', message: 'Invalid API key', retryable: false });
    }
    if (status === 429) {
      return new AIProviderError({ provider: 'anthropic', code: 'RATE_LIMIT', message, retryable: true });
    }
    if (status === 400) {
      return new AIProviderError({ provider: 'anthropic', code: 'INVALID_REQUEST', message, retryable: false });
    }
    if (status === 404) {
      return new AIProviderError({ provider: 'anthropic', code: 'MODEL_NOT_FOUND', message, retryable: false });
    }
    if (status >= 500) {
      return new AIProviderError({ provider: 'anthropic', code: 'SERVER_ERROR', message, retryable: true });
    }
    return new AIProviderError({ provider: 'anthropic', code: 'UNKNOWN', message, retryable: false });
  }
}
