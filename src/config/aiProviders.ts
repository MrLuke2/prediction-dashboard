export type AIProviderId = 'anthropic' | 'openai' | 'gemini';

export interface AIProvider {
  id: AIProviderId;
  name: string;
  models: string[];
  defaultModel: string;
  icon: string;
  color: string;
  description: string;
}

export interface AIProviderSelection {
  providerId: AIProviderId;
  model: string;
}

export const AI_PROVIDERS: AIProvider[] = [
  {
    id: 'anthropic',
    name: 'Claude',
    models: ['claude-opus-4-5', 'claude-sonnet-4-5', 'claude-haiku-4-5'],
    defaultModel: 'claude-sonnet-4-5',
    icon: 'anthropic',
    color: '#D97706',
    description: 'Anthropic Claude — Best for nuanced analysis'
  },
  {
    id: 'openai',
    name: 'GPT',
    models: ['gpt-4o', 'gpt-4o-mini', 'o1-mini'],
    defaultModel: 'gpt-4o-mini',
    icon: 'openai',
    color: '#10B981',
    description: 'OpenAI GPT — Best for speed'
  },
  {
    id: 'gemini',
    name: 'Gemini',
    models: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'],
    defaultModel: 'gemini-2.0-flash',
    icon: 'gemini',
    color: '#3B82F6',
    description: 'Google Gemini — Best for multimodal'
  }
];
