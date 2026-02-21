import { z } from 'zod';

// ─── Provider & Model Validation ────────────────────────────────────────────

export const AI_PROVIDER_IDS = ['anthropic', 'openai', 'gemini'] as const;
export type AIProviderId = (typeof AI_PROVIDER_IDS)[number];

/** Allowed models per provider — single source of truth */
export const ALLOWED_MODELS: Record<AIProviderId, string[]> = {
  anthropic: ['claude-opus-4-5', 'claude-sonnet-4-5', 'claude-haiku-4-5'],
  openai: ['gpt-4o', 'gpt-4o-mini', 'o1-mini'],
  gemini: ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'],
};

export const aiProviderIdSchema = z.enum(AI_PROVIDER_IDS);

// ─── Auth Schemas ───────────────────────────────────────────────────────────

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(12, 'Password must be at least 12 characters'),
    // zxcvbn check is done in the route handler (score >= 2)
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const preferencesSchema = z.object({
  preferredAiProvider: aiProviderIdSchema,
  preferredModel: z.string().min(1),
}).refine(
  (data) => {
    const allowed = ALLOWED_MODELS[data.preferredAiProvider];
    return allowed.includes(data.preferredModel);
  },
  {
    message: 'Model is not available for the selected provider',
    path: ['preferredModel'],
  }
);

// ─── API Key Schemas ────────────────────────────────────────────────────────

export const apiKeyCreateSchema = z.object({
  provider: aiProviderIdSchema,
  apiKey: z.string().min(10, 'API key seems too short'),
});

export const apiKeyDeleteParamsSchema = z.object({
  provider: aiProviderIdSchema,
});
