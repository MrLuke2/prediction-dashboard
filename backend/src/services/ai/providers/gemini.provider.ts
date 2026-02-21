import { GoogleGenerativeAI, GenerativeModel, GenerateContentResult } from '@google/generative-ai';
import { IAIProvider, AIRequest, AIResponse, AIProviderError } from '../types.js';
import { calculateCost } from '../modelCatalog.js';
import { logger } from '../../../lib/logger.js';

const TIMEOUT_MS = 10_000;
const RETRY_DELAY_MS = 2_000;

export class GeminiProvider implements IAIProvider {
  readonly providerId = 'gemini' as const;

  async complete(request: AIRequest, model: string, apiKey: string): Promise<AIResponse> {
    const genAI = new GoogleGenerativeAI(apiKey);
    const start = performance.now();

    const generativeModel: GenerativeModel = genAI.getGenerativeModel({
      model,
      systemInstruction: request.systemPrompt,
    });

    // Build user prompt — add JSON instruction if structured output requested
    let userContent = request.userPrompt;
    if (request.responseSchema) {
      userContent += '\n\nRespond with valid JSON only. No markdown, no code blocks.';
    }

    try {
      const result = await this.callWithRetry(generativeModel, userContent, request);
      const latencyMs = Math.round(performance.now() - start);

      const response = result.response;
      const rawContent = response.text();

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

      // Gemini usage metadata
      const usageMetadata = response.usageMetadata;
      const tokensInput = usageMetadata?.promptTokenCount ?? 0;
      const tokensOutput = usageMetadata?.candidatesTokenCount ?? 0;
      const costUsd = calculateCost('gemini', model, tokensInput, tokensOutput);

      return {
        content,
        parsedContent,
        provider: 'gemini',
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
    model: GenerativeModel,
    userContent: string,
    request: AIRequest,
    retried = false,
  ): Promise<GenerateContentResult> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

      try {
        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: userContent }] }],
          generationConfig: {
            maxOutputTokens: request.maxTokens ?? 1000,
            temperature: request.temperature ?? 0.3,
            responseMimeType: request.responseSchema ? 'application/json' : 'text/plain',
          },
        });
        return result;
      } finally {
        clearTimeout(timeout);
      }
    } catch (err: any) {
      if (!retried && (err?.status === 429 || err?.message?.includes('429'))) {
        logger.warn({ provider: 'gemini' }, 'Rate limited (429), retrying in 2s…');
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
        return this.callWithRetry(model, userContent, request, true);
      }
      throw err;
    }
  }

  private mapError(err: unknown): AIProviderError {
    const e = err as any;
    const status = e?.status ?? e?.statusCode;
    const message = e?.message ?? 'Unknown Gemini error';

    if (e?.name === 'AbortError' || message.includes('abort')) {
      return new AIProviderError({ provider: 'gemini', code: 'TIMEOUT', message: `Request timed out after ${TIMEOUT_MS}ms`, retryable: true });
    }
    if (status === 400 || status === 403) {
      if (message.includes('API key')) {
        return new AIProviderError({ provider: 'gemini', code: 'AUTHENTICATION_ERROR', message: 'Invalid API key', retryable: false });
      }
      return new AIProviderError({ provider: 'gemini', code: 'INVALID_REQUEST', message, retryable: false });
    }
    if (status === 429) {
      return new AIProviderError({ provider: 'gemini', code: 'RATE_LIMIT', message, retryable: true });
    }
    if (status === 404) {
      return new AIProviderError({ provider: 'gemini', code: 'MODEL_NOT_FOUND', message, retryable: false });
    }
    if (status >= 500) {
      return new AIProviderError({ provider: 'gemini', code: 'SERVER_ERROR', message, retryable: true });
    }
    return new AIProviderError({ provider: 'gemini', code: 'UNKNOWN', message, retryable: false });
  }
}
