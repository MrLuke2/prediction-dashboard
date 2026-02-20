export type AIProviderId = 'gemini' | 'anthropic' | 'openai';

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

// Keeping Agent types as they might be used elsewhere
export type AgentConfigRole = 'fundamentalist' | 'sentiment' | 'risk';
export interface AgentModelAssignment {
  providerId: AIProviderId;
  modelId: string;
}
export type AgentModelConfig = Record<AgentConfigRole, AgentModelAssignment>;

export const DEFAULT_AGENT_MODEL_CONFIG: AgentModelConfig = {
  fundamentalist: { providerId: 'gemini', modelId: 'gemini-2.5-flash' },
  sentiment: { providerId: 'gemini', modelId: 'gemini-2.5-flash' },
  risk: { providerId: 'gemini', modelId: 'gemini-2.5-flash' },
};

export const AI_PROVIDERS: AIProvider[] = [
  {
    id: 'gemini',
    name: 'Gemini',
    models: ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'],
    defaultModel: 'gemini-2.5-flash',
    icon: 'gemini',
    color: '#3B82F6',
    description: 'Google Gemini — Industry leading speed and efficiency'
  },
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
  }
];
