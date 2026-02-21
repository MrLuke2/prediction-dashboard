import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config.js';
import { logger } from '../lib/logger.js';

export interface AiRequestOptions {
  model?: string;
  systemPrompt?: string;
  prompt: string;
  responseFormat?: 'json_object' | 'text';
}

export class AiService {
  private openai: OpenAI | null = null;
  private gemini: GoogleGenerativeAI | null = null;
  private claude: Anthropic | null = null;

  constructor() {
    if (config.OPENAI_API_KEY) {
      this.openai = new OpenAI({ apiKey: config.OPENAI_API_KEY });
    }
    if (config.GEMINI_API_KEY) {
      this.gemini = new GoogleGenerativeAI(config.GEMINI_API_KEY);
    }
    if (config.ANTHROPIC_API_KEY) {
      this.claude = new Anthropic({ apiKey: config.ANTHROPIC_API_KEY });
    }

    if (!this.openai && !this.gemini && !this.claude) {
      logger.warn('No AI providers configured (OpenAI, Gemini, or Claude). Agents will fail.');
    }
  }

  async chat(options: AiRequestOptions): Promise<string> {
    const modelStr = options.model?.toLowerCase() || '';
    const isOpenAiModel = modelStr.startsWith('gpt-');
    const isClaudeModel = modelStr.startsWith('claude-');
    const isGeminiModel = modelStr.startsWith('gemini-');

    // 1. Precise Provider Match
    if (this.openai && isOpenAiModel) return this.callOpenAI(options);
    if (this.claude && isClaudeModel) return this.callClaude(options);
    if (this.gemini && isGeminiModel) return this.callGemini(options);

    // 2. Default/Dynamic Routing (Priority: Gemini 2.5 -> Claude 3.5 -> OpenAI 4o)
    if (this.gemini) {
      const geminiOptions = { ...options, model: isGeminiModel ? options.model : 'gemini-2.5-flash' };
      return this.callGemini(geminiOptions);
    }

    if (this.claude) {
      const claudeOptions = { ...options, model: isClaudeModel ? options.model : 'claude-3-5-sonnet-20240620' };
      return this.callClaude(claudeOptions);
    }

    if (this.openai) {
      const openAiOptions = { ...options, model: isOpenAiModel ? options.model : 'gpt-4o-mini' };
      return this.callOpenAI(openAiOptions);
    }

    throw new Error('No compatible AI service available.');
  }

  private async callOpenAI(options: AiRequestOptions, retryCount = 1): Promise<string> {
    if (!this.openai) throw new Error('OpenAI not initialized');
    
    try {
      const model = options.model || 'gpt-4o-mini';
      const completion = await this.openai.chat.completions.create({
        model: model,
        messages: [
          ...(options.systemPrompt ? [{ role: 'system', content: options.systemPrompt } as const] : []),
          { role: 'user', content: options.prompt }
        ],
        response_format: options.responseFormat === 'json_object' ? { type: 'json_object' } : undefined,
      }, { timeout: 15000 });

      return completion.choices[0].message.content || '';
    } catch (error: any) {
      if (retryCount > 0 && error?.status === 429) {
        logger.warn('OpenAI 429 hit. Retrying...');
        await new Promise(r => setTimeout(r, 2000));
        return this.callOpenAI(options, retryCount - 1);
      }
      throw error;
    }
  }

  private async callGemini(options: AiRequestOptions): Promise<string> {
    if (!this.gemini) throw new Error('Gemini not initialized');

    try {
      const modelName = options.model || 'gemini-2.5-flash';
      const model = this.gemini.getGenerativeModel({ 
        model: modelName, 
        systemInstruction: options.systemPrompt 
      });

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: options.prompt }] }],
        generationConfig: {
          responseMimeType: options.responseFormat === 'json_object' ? 'application/json' : 'text/plain',
        }
      });

      const response = await result.response;
      return response.text();
    } catch (error) {
      logger.error({ error, model: options.model }, 'Gemini API call failed');
      throw error;
    }
  }

  private async callClaude(options: AiRequestOptions): Promise<string> {
    if (!this.claude) throw new Error('Claude not initialized');

    try {
      const model = options.model || 'claude-3-5-sonnet-20240620';
      const response = await this.claude.messages.create({
        model: model,
        max_tokens: 4096,
        system: options.systemPrompt,
        messages: [
          { role: 'user', content: options.prompt }
        ],
      });

      const text = response.content.find(c => c.type === 'text');
      return (text as any)?.text || '';
    } catch (error) {
      logger.error({ error, model: options.model }, 'Claude API call failed');
      throw error;
    }
  }
}

export const aiService = new AiService();
