import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { users } from '../../db/schema/index.js';
import { authenticate } from '../../middleware/authenticate.js';
import { requirePlan } from '../../middleware/authorize.js';
import { encrypt, decrypt, maskApiKey } from '../../lib/encryption.js';
import { apiKeyCreateSchema, apiKeyDeleteParamsSchema, AIProviderId } from '../../schemas/auth.js';
import { config } from '../../config.js';
import { logger } from '../../lib/logger.js';

// ─── Provider Test Endpoints ────────────────────────────────────────────────

interface ProviderTestResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate an API key by making a lightweight test call to the provider.
 * Each provider has a different validation approach.
 */
async function testProviderKey(provider: AIProviderId, apiKey: string): Promise<ProviderTestResult> {
  try {
    switch (provider) {
      case 'anthropic': {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            model: 'claude-haiku-4-5',
            max_tokens: 1,
            messages: [{ role: 'user', content: 'ping' }],
          }),
        });
        // 401/403 = bad key; 200 or 429 (rate limited) = key is valid
        if (res.status === 401 || res.status === 403) {
          return { valid: false, error: 'Invalid API key' };
        }
        return { valid: true };
      }

      case 'openai': {
        const res = await fetch('https://api.openai.com/v1/models', {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        if (res.status === 401) {
          return { valid: false, error: 'Invalid API key' };
        }
        return { valid: true };
      }

      case 'gemini': {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
        );
        if (res.status === 400 || res.status === 403) {
          return { valid: false, error: 'Invalid API key' };
        }
        return { valid: true };
      }

      default:
        return { valid: false, error: 'Unknown provider' };
    }
  } catch (err) {
    // Network error — don't reject key, but warn
    logger.warn({ provider, err }, 'API key validation network error');
    return { valid: true }; // Allow key storage, validation was inconclusive
  }
}

// ─── Routes ─────────────────────────────────────────────────────────────────

export default async function apiKeyRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  // All routes require authentication + Pro/Enterprise plan
  const preHandler = [authenticate, requirePlan('pro')];

  // ── POST /user/api-keys ─────────────────────────────────────────────────
  app.post('/', {
    preHandler,
    schema: { body: apiKeyCreateSchema },
  }, async (req, reply) => {
    const { provider, apiKey } = req.body as z.infer<typeof apiKeyCreateSchema>;
    const userId = req.user.userId;

    // Validate key works by making a test call
    const testResult = await testProviderKey(provider, apiKey);
    if (!testResult.valid) {
      return reply.code(400).send({
        error: 'Invalid API Key',
        message: testResult.error || `The ${provider} API key is invalid.`,
        provider,
      });
    }

    // Encrypt key with AES-256-GCM before storing
    const encryptedKey = encrypt(apiKey);

    // Fetch current user to merge api_keys
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return reply.code(404).send({ error: 'User not found' });
    }

    const currentKeys = (user.apiKeys as Record<string, string | undefined>) || {};
    const updatedKeys = { ...currentKeys, [provider]: encryptedKey };

    await db.update(users).set({ apiKeys: updatedKeys }).where(eq(users.id, userId));

    // Never log the raw API key
    logger.info({ userId, provider }, 'API key stored');

    return {
      provider,
      valid: true,
      maskedKey: maskApiKey(apiKey),
    };
  });

  // ── DELETE /user/api-keys/:provider ─────────────────────────────────────
  app.delete('/:provider', {
    preHandler,
    schema: { params: apiKeyDeleteParamsSchema },
  }, async (req, reply) => {
    const { provider } = req.params as z.infer<typeof apiKeyDeleteParamsSchema>;
    const userId = req.user.userId;

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return reply.code(404).send({ error: 'User not found' });
    }

    const currentKeys = (user.apiKeys as Record<string, string | undefined>) || {};
    delete currentKeys[provider];

    await db.update(users).set({ apiKeys: currentKeys }).where(eq(users.id, userId));

    logger.info({ userId, provider }, 'API key removed');

    return reply.code(204).send();
  });

  // ── GET /user/api-keys ──────────────────────────────────────────────────
  fastify.get('/', {
    preHandler: [authenticate],
  }, async (req, reply) => {
    const userId = req.user.userId;

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return reply.code(404).send({ error: 'User not found' });
    }

    const currentKeys = (user.apiKeys as Record<string, string | undefined>) || {};

    // Build response: never return raw keys
    const result: Record<string, { hasKey: boolean; maskedKey: string | null; valid: boolean }> = {};

    for (const provider of ['anthropic', 'openai', 'gemini'] as const) {
      const encrypted = currentKeys[provider];
      if (encrypted) {
        try {
          const decrypted = decrypt(encrypted);
          result[provider] = {
            hasKey: true,
            maskedKey: maskApiKey(decrypted),
            valid: true, // Key exists and decrypts successfully
          };
        } catch {
          result[provider] = {
            hasKey: true,
            maskedKey: null,
            valid: false, // Key exists but can't be decrypted (encryption key changed?)
          };
        }
      } else {
        result[provider] = {
          hasKey: false,
          maskedKey: null,
          valid: false,
        };
      }
    }

    return result;
  });
}
