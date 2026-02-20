export type AIProviderId = 'anthropic' | 'openai' | 'gemini';

export interface AIModelDetails {
  id: string;
  name: string;
  cost: 'Low' | 'Medium' | 'High';
  reasoning: 'Standard' | 'Advanced' | 'Elite';
  latency: 'Sub-second' | 'Fast' | 'Standard';
}

export interface AIProvider {
  id: AIProviderId;
  name: string;
  models: AIModelDetails[];
  defaultModelId: string;
  icon: string;
  color: string;
  description: string;
}

export interface AIProviderSelection {
  providerId: AIProviderId;
  model: string;
}

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
    models: [
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', cost: 'Low', reasoning: 'Advanced', latency: 'Sub-second' },
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', cost: 'Medium', reasoning: 'Elite', latency: 'Fast' },
      { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash-Lite', cost: 'Low', reasoning: 'Standard', latency: 'Sub-second' }
    ],
    defaultModelId: 'gemini-2.5-flash',
    icon: 'gemini',
    color: '#3B82F6',
    description: 'Google Gemini — Industry leading speed and efficiency'
  },
  {
    id: 'anthropic',
    name: 'Claude',
    models: [
      { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', cost: 'Medium', reasoning: 'Elite', latency: 'Fast' },
      { id: 'claude-3-5-haiku', name: 'Claude 3.5 Haiku', cost: 'Low', reasoning: 'Advanced', latency: 'Sub-second' },
      { id: 'claude-4-5-opus', name: 'Claude 4.5 Opus', cost: 'High', reasoning: 'Elite', latency: 'Standard' }
    ],
    defaultModelId: 'claude-3-5-sonnet',
    icon: 'anthropic',
    color: '#D97706',
    description: 'Anthropic Claude — Best for nuanced market analysis'
  },
  {
    id: 'openai',
    name: 'GPT',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', cost: 'Medium', reasoning: 'Elite', latency: 'Fast' },
      { id: 'gpt-4o-mini', name: 'GPT-4o-mini', cost: 'Low', reasoning: 'Advanced', latency: 'Sub-second' },
      { id: 'o1-preview', name: 'o1-preview', cost: 'High', reasoning: 'Elite', latency: 'Standard' }
    ],
    defaultModelId: 'gpt-4o',
    icon: 'openai',
    color: '#10B981',
    description: 'OpenAI GPT — Reliable performance and broad capability'
  }
];

