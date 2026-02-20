import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import '@fastify/cookie'; // Load type augmentations
import argon2 from 'argon2';
import crypto from 'crypto';
import { db } from '../../db/index.js';
import { users } from '../../db/schema/index.js';
import { eq } from 'drizzle-orm';
import { redis } from '../../lib/redis.js'; // Ensure this exists and exports redis client
import { signToken, verifyToken } from '../../lib/jwt.js';
import { registerSchema, loginSchema } from '../../schemas/auth.js'; // Ensure schemas exist
import { authenticate } from '../../middleware/authenticate.js';
import { z } from 'zod';

const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

export default async function authRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  // POST /auth/register
  app.post('/register', {
    schema: {
      body: registerSchema,
    }
  }, async (req, reply) => {
    const { email, password } = req.body as z.infer<typeof registerSchema>;

    // Check existing
    const existing = await db.query.users.findFirst({
      where: eq(users.email, email)
    });

    if (existing) {
      return reply.code(409).send({ error: 'Conflict', message: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await argon2.hash(password);

    // Create user
    const [user] = await db.insert(users).values({
      email,
      passwordHash,
      plan: 'free',
    }).returning();

    // Generate tokens
    const accessToken = signToken({ userId: user.id, email: user.email, plan: user.plan });
    const refreshToken = crypto.randomBytes(40).toString('hex');
    const refreshHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    // Store refresh hash in Redis
    await redis.set(`refresh_token:${user.id}`, refreshHash, 'EX', REFRESH_TOKEN_TTL);

    // Set cookie
    reply.setCookie('refresh_token', `${user.id}:${refreshToken}`, {
      path: '/auth/refresh',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: REFRESH_TOKEN_TTL
    });

    // Stub email verification
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEV] Stub Verification Email sent to ${email}`);
    }

    return { 
      accessToken, 
      user: { id: user.id, email: user.email, plan: user.plan } 
    };
  });

  // POST /auth/login
  app.post('/login', {
    schema: {
      body: loginSchema,
    }
  }, async (req, reply) => {
    const { email, password } = req.body as z.infer<typeof loginSchema>;
    const ip = req.ip;

    // Rate Limit: 5 attempts per 15min per IP
    const rateKey = `rate_limit:login:${ip}`;
    const attempts = await redis.incr(rateKey);
    if (attempts === 1) {
      await redis.expire(rateKey, 15 * 60);
    }
    if (attempts > 5) {
      return reply.code(429).send({ error: 'Too Many Requests', message: 'Too many login attempts. Try again later.' });
    }

    // Find User
    const user = await db.query.users.findFirst({
      where: eq(users.email, email)
    });

    if (!user) {
      // Don't reveal user existence? Or generic error.
      // Standard practice: "Invalid credentials"
      return reply.code(401).send({ error: 'Unauthorized', message: 'Invalid credentials' });
    }

    // Verify Password
    const valid = await argon2.verify(user.passwordHash, password);
    if (!valid) {
      return reply.code(401).send({ error: 'Unauthorized', message: 'Invalid credentials' });
    }

    // Reset rate limit on success? Optional but good UX.
    await redis.del(rateKey);

    // Log login event (update last_login)
    await db.update(users).set({ lastLogin: new Date() }).where(eq(users.id, user.id));

    // Generate tokens
    const accessToken = signToken({ userId: user.id, email: user.email, plan: user.plan });
    const refreshToken = crypto.randomBytes(40).toString('hex');
    const refreshHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    // Store refresh hash in Redis (rotates any existing one)
    await redis.set(`refresh_token:${user.id}`, refreshHash, 'EX', REFRESH_TOKEN_TTL);

    // Set cookie
    reply.setCookie('refresh_token', `${user.id}:${refreshToken}`, {
      path: '/auth/refresh',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: REFRESH_TOKEN_TTL
    });

    return { 
      accessToken, 
      user: { id: user.id, email: user.email, plan: user.plan } 
    };
  });

  // POST /auth/refresh
  fastify.post('/refresh', async (req, reply) => {
    const refreshToken = req.cookies.refresh_token;

    if (!refreshToken) {
      return reply.code(401).send({ error: 'Unauthorized', message: 'Missing refresh token' });
    }

    // We decoded access token to get user ID? 
    // Usually refresh endpoint doesn't require auth header (expired).
    // So we need to look up userId associated with this refresh token?
    // Problem: Redis key is `refresh_token:${userId}`. We can't lookup key by value easily.
    // Solution: The refresh token stored in cookie should probably include userId or we store map `token -> userId`.
    // BUT constraint: "Refresh tokens stored as hashed values". 
    // This implies we can't reverse lookup.
    // So the cookie MUST contain userId? Or the refresh token payload must encode it.
    // Let's make refresh token a signed JWT (long lived) OR include userId in the opaque string?
    // "Refresh tokens stored as hashed values in Redis" usually implies opaque token.
    // To identify user, we can append userId to token? `userId.randomToken`?
    // Let's do `userId.randomToken`.
    
    // Correction: In login/register, I used `crypto.randomBytes(40)`. I should prepend ID.
    // But wait, the standard usually sends access token (expired) + refresh token. Access token has ID.
    // Fastify `req.user` might be available if we use `authenticate` but allow expired?
    // Handling expired explicitly in `authenticate` is tricky.
    // Better: Send userId in body? Or assume cookie is `refreshToken`.
    // I will change the logic to store `refresh_token:${refreshToken}` in Redis? No, that exposes token.
    // Valid pattern: Cookie = `userId:token`.
    // Let's modify login/register logic to cookie: `${user.id}:${refreshToken}`.
    // Then in refresh, split, get ID, hash token, compare.
    
    // Wait, let's fix login/register first if needed. 
    // I'll parse `req.cookies.refresh_token`.
    
    // Logic inside refresh endpoint:
    const parts = refreshToken.split(':');
    if (parts.length !== 2) {
       return reply.code(401).send({ error: 'Unauthorized', message: 'Invalid token format' });
    }
    const [userId, tokenVal] = parts;
    
    // Verify hash
    const storedHash = await redis.get(`refresh_token:${userId}`);
    if (!storedHash) {
       return reply.code(401).send({ error: 'Unauthorized', message: 'Token expired or invalid' });
    }
    
    const inputHash = crypto.createHash('sha256').update(tokenVal).digest('hex');
    if (inputHash !== storedHash) {
       // Potential reuse attack!
       await redis.del(`refresh_token:${userId}`);
       return reply.code(401).send({ error: 'Unauthorized', message: 'Invalid token' });
    }

    // Rotate
    // Find user to get current plan/email for new access token
    const user = await db.query.users.findFirst({
        where: eq(users.id, userId as string) // userId from split is string
    }); // Need uuid cast? Drizzle handles string for uuid usually.

    if (!user) return reply.code(401).send({ error: 'Unauthorized', message: 'User not found' });

    const newAccessToken = signToken({ userId: user.id, email: user.email, plan: user.plan });
    const newRefreshToken = crypto.randomBytes(40).toString('hex');
    const newRefreshHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');

    await redis.set(`refresh_token:${user.id}`, newRefreshHash, 'EX', REFRESH_TOKEN_TTL);

    reply.setCookie('refresh_token', `${user.id}:${newRefreshToken}`, {
      path: '/auth/refresh',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: REFRESH_TOKEN_TTL
    });

    return { accessToken: newAccessToken };
  });

  // POST /auth/logout
  fastify.post('/logout', async (req, reply) => {
    const refreshToken = req.cookies.refresh_token;
    if (refreshToken) {
        const parts = refreshToken.split(':');
        if (parts.length === 2) {
            const [userId] = parts;
            await redis.del(`refresh_token:${userId}`);
        }
    }
    reply.clearCookie('refresh_token', { path: '/auth/refresh' });
    return { message: 'Logged out' };
  });

  // GET /auth/me
  fastify.get('/me', {
    preHandler: [authenticate]
  }, async (req, reply) => {
     // req.user populated by authenticate
     const user = await db.query.users.findFirst({
         where: eq(users.id, req.user.userId)
     });
     
     if (!user) return reply.code(404).send({ error: 'User not found' });
     
     return {
         id: user.id,
         email: user.email,
         plan: user.plan,
         createdAt: user.createdAt
     };
  });
}
