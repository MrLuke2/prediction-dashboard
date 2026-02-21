import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import argon2 from 'argon2';
import crypto from 'crypto';
import { z } from 'zod';
import zxcvbn from 'zxcvbn';
import { eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { users } from '../../db/schema/index.js';
import { redis } from '../../lib/redis.js';
import { signToken, JWTPayload } from '../../lib/jwt.js';
import { registerSchema, loginSchema, preferencesSchema, ALLOWED_MODELS } from '../../schemas/auth.js';
import { authenticate } from '../../middleware/authenticate.js';

// ─── Constants ──────────────────────────────────────────────────────────────

const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60; // 7 days in seconds
const REFRESH_COOKIE_PATH = '/';
const BLOCKLIST_PREFIX = 'refresh_blocklist:';
const RATE_LIMIT_PREFIX = 'rate_limit:login:';

// ─── Helpers ────────────────────────────────────────────────────────────────

function generateRefreshToken(): string {
  return crypto.randomBytes(40).toString('hex');
}

async function hashRefreshToken(token: string): Promise<string> {
  return argon2.hash(token, {
    type: argon2.argon2id,
    memoryCost: 4096,
    timeCost: 3,
    parallelism: 1,
  });
}

async function verifyRefreshHash(hash: string, token: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, token);
  } catch {
    return false;
  }
}

function setRefreshCookie(reply: FastifyReply, userId: string, token: string): void {
  reply.setCookie('refresh_token', `${userId}:${token}`, {
    path: REFRESH_COOKIE_PATH,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: REFRESH_TOKEN_TTL,
  });
}

function buildJwtPayload(user: {
  id: string;
  email: string;
  plan: string;
  preferredAiProvider: string;
  preferredModel: string;
}): JWTPayload {
  return {
    userId: user.id,
    email: user.email,
    plan: user.plan as JWTPayload['plan'],
    preferredAiProvider: user.preferredAiProvider as JWTPayload['preferredAiProvider'],
    preferredModel: user.preferredModel,
  };
}

function buildApiKeyStatus(apiKeys: Record<string, string | undefined> | null): Record<string, boolean> {
  const keys = apiKeys || {};
  return {
    anthropic: !!keys.anthropic,
    openai: !!keys.openai,
    gemini: !!keys.gemini,
  };
}

// ─── Routes ─────────────────────────────────────────────────────────────────

export default async function authRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  // ── POST /auth/register ─────────────────────────────────────────────────
  app.post('/register', {
    schema: { body: registerSchema },
  }, async (req, reply) => {
    const { email, password } = req.body as z.infer<typeof registerSchema>;

    // zxcvbn strength check (score >= 2 required)
    const strength = zxcvbn(password);
    if (strength.score < 2) {
      return reply.code(400).send({
        error: 'Weak Password',
        message: 'Password is too weak. Please choose a stronger password.',
        score: strength.score,
        feedback: strength.feedback,
      });
    }

    // Check if email already exists
    const existing = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existing) {
      return reply.code(409).send({
        error: 'Conflict',
        message: 'Email already registered',
      });
    }

    // Hash password with argon2id
    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    // Create user with default provider: anthropic / claude-sonnet-4-5
    const [user] = await db.insert(users).values({
      email,
      passwordHash,
      plan: 'free',
      preferredAiProvider: 'anthropic',
      preferredModel: 'claude-sonnet-4-5',
      apiKeys: {},
    }).returning();

    // Generate tokens
    const jwtPayload = buildJwtPayload(user);
    const accessToken = signToken(jwtPayload, '15m');

    const refreshToken = generateRefreshToken();
    const refreshHash = await hashRefreshToken(refreshToken);

    // Store refresh hash in Redis (argon2id hash, not raw token)
    await redis.set(`refresh_token:${user.id}`, refreshHash, 'EX', REFRESH_TOKEN_TTL);

    // Set httpOnly cookie
    setRefreshCookie(reply, user.id, refreshToken);

    return {
      token: accessToken,
      user: {
        id: user.id,
        email: user.email,
        plan: user.plan,
        preferredAiProvider: user.preferredAiProvider,
        preferredModel: user.preferredModel,
      },
    };
  });

  // ── POST /auth/login ────────────────────────────────────────────────────
  app.post('/login', {
    schema: { body: loginSchema },
  }, async (req, reply) => {
    const { email, password } = req.body as z.infer<typeof loginSchema>;
    const ip = req.ip;

    // Rate limit: 5 attempts / 15min / IP (Redis)
    const rateKey = `${RATE_LIMIT_PREFIX}${ip}`;
    const attempts = await redis.incr(rateKey);
    if (attempts === 1) {
      await redis.expire(rateKey, 15 * 60);
    }
    if (attempts > 5) {
      return reply.code(429).send({
        error: 'Too Many Requests',
        message: 'Too many login attempts. Please try again later.',
        retryAfter: await redis.ttl(rateKey),
      });
    }

    // Find user
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'Invalid credentials',
      });
    }

    // Verify password (argon2id)
    const valid = await argon2.verify(user.passwordHash, password);
    if (!valid) {
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'Invalid credentials',
      });
    }

    // Reset rate limit on success
    await redis.del(rateKey);

    // Update last_login
    await db.update(users).set({ lastLogin: new Date() }).where(eq(users.id, user.id));

    // Generate tokens
    const jwtPayload = buildJwtPayload(user);
    const accessToken = signToken(jwtPayload, '15m');

    const refreshToken = generateRefreshToken();
    const refreshHash = await hashRefreshToken(refreshToken);

    // Store refresh hash (rotates any existing one)
    await redis.set(`refresh_token:${user.id}`, refreshHash, 'EX', REFRESH_TOKEN_TTL);

    // Set httpOnly cookie
    setRefreshCookie(reply, user.id, refreshToken);

    return {
      token: accessToken,
      user: {
        id: user.id,
        email: user.email,
        plan: user.plan,
        preferredAiProvider: user.preferredAiProvider,
        preferredModel: user.preferredModel,
      },
    };
  });

  // ── POST /auth/refresh ──────────────────────────────────────────────────
  fastify.post('/refresh', async (req, reply) => {
    const cookieValue = req.cookies?.refresh_token;

    if (!cookieValue) {
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'Missing refresh token',
      });
    }

    // Cookie format: userId:opaqueToken
    const colonIndex = cookieValue.indexOf(':');
    if (colonIndex === -1) {
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'Invalid token format',
      });
    }

    const userId = cookieValue.substring(0, colonIndex);
    const tokenVal = cookieValue.substring(colonIndex + 1);

    // Check blocklist (token reuse detection)
    const isBlocked = await redis.get(`${BLOCKLIST_PREFIX}${userId}:${tokenVal.substring(0, 16)}`);
    if (isBlocked) {
      // Potential token reuse attack — invalidate all sessions
      await redis.del(`refresh_token:${userId}`);
      reply.clearCookie('refresh_token', { path: REFRESH_COOKIE_PATH });
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'Token has been revoked. Please log in again.',
      });
    }

    // Verify against stored hash
    const storedHash = await redis.get(`refresh_token:${userId}`);
    if (!storedHash) {
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'Token expired or invalid',
      });
    }

    const isValid = await verifyRefreshHash(storedHash, tokenVal);
    if (!isValid) {
      // Potential reuse — invalidate all
      await redis.del(`refresh_token:${userId}`);
      reply.clearCookie('refresh_token', { path: REFRESH_COOKIE_PATH });
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'Invalid token',
      });
    }

    // Fetch user for fresh JWT payload
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'User not found',
      });
    }

    // Rotate: generate new tokens, blocklist old
    const newRefreshToken = generateRefreshToken();
    const newRefreshHash = await hashRefreshToken(newRefreshToken);

    // Blocklist the old token fingerprint (first 16 chars) to detect reuse
    await redis.set(
      `${BLOCKLIST_PREFIX}${userId}:${tokenVal.substring(0, 16)}`,
      '1',
      'EX',
      REFRESH_TOKEN_TTL
    );

    // Store new refresh hash
    await redis.set(`refresh_token:${user.id}`, newRefreshHash, 'EX', REFRESH_TOKEN_TTL);

    // Issue new access token
    const jwtPayload = buildJwtPayload(user);
    const newAccessToken = signToken(jwtPayload, '15m');

    // Set new cookie
    setRefreshCookie(reply, user.id, newRefreshToken);

    return { token: newAccessToken };
  });

  // ── POST /auth/logout ───────────────────────────────────────────────────
  fastify.post('/logout', async (req, reply) => {
    const cookieValue = req.cookies?.refresh_token;

    if (cookieValue) {
      const colonIndex = cookieValue.indexOf(':');
      if (colonIndex !== -1) {
        const userId = cookieValue.substring(0, colonIndex);
        const tokenVal = cookieValue.substring(colonIndex + 1);

        // Blocklist refresh token in Redis (TTL 7d)
        await redis.set(
          `${BLOCKLIST_PREFIX}${userId}:${tokenVal.substring(0, 16)}`,
          '1',
          'EX',
          REFRESH_TOKEN_TTL
        );

        // Remove stored refresh hash
        await redis.del(`refresh_token:${userId}`);
      }
    }

    // Clear cookie
    reply.clearCookie('refresh_token', { path: REFRESH_COOKIE_PATH });

    return reply.code(200).send({ message: 'Logged out' });
  });

  // ── GET /auth/me ────────────────────────────────────────────────────────
  fastify.get('/me', {
    preHandler: [authenticate],
  }, async (req, reply) => {
    const user = await db.query.users.findFirst({
      where: eq(users.id, req.user.userId),
    });

    if (!user) {
      return reply.code(404).send({ error: 'User not found' });
    }

    return {
      id: user.id,
      email: user.email,
      plan: user.plan,
      preferredAiProvider: user.preferredAiProvider,
      preferredModel: user.preferredModel,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
      isActive: user.isActive,
      hasApiKey: buildApiKeyStatus(user.apiKeys as Record<string, string | undefined>),
    };
  });

  // ── PATCH /auth/preferences ─────────────────────────────────────────────
  app.patch('/preferences', {
    preHandler: [authenticate],
    schema: { body: preferencesSchema },
  }, async (req, reply) => {
    const { preferredAiProvider, preferredModel } = req.body as z.infer<typeof preferencesSchema>;

    // Double-check model is valid for provider
    const allowed = ALLOWED_MODELS[preferredAiProvider];
    if (!allowed.includes(preferredModel)) {
      return reply.code(400).send({
        error: 'Invalid Model',
        message: `Model "${preferredModel}" is not available for provider "${preferredAiProvider}".`,
        allowedModels: allowed,
      });
    }

    // Update user preferences
    await db.update(users).set({
      preferredAiProvider,
      preferredModel,
    }).where(eq(users.id, req.user.userId));

    // Broadcast to user's active WS connections
    // We publish a Redis message that the WS handler picks up
    await redis.publish(`user:${req.user.userId}:events`, JSON.stringify({
      type: 'SET_AI_PROVIDER',
      payload: { preferredAiProvider, preferredModel },
    }));

    return {
      preferredAiProvider,
      preferredModel,
      message: 'Preferences updated',
    };
  });
}
