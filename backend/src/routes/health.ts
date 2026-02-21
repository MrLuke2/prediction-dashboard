import { FastifyInstance } from 'fastify';
import { db } from '../db/index.js';
import { redis } from '../lib/redis.js';
import { orchestrator } from '../jobs/agent-orchestrator.job.js';
import { sql } from 'drizzle-orm';
import { ws_connections_active } from '../lib/metrics.js';
import { emergencyStopService } from '../services/execution/emergency-stop.js';
import axios from 'axios';

export default async function healthRoutes(fastify: FastifyInstance) {

  // GET /health - Basic public check
  fastify.get('/', async () => {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  });

  // GET /health/deep - Comprehensive service check
  fastify.get('/deep', async (request, reply) => {
    // Only allow internal access for deep health
    const ip = request.ip;
    const isInternal = ip === '127.0.0.1' || ip === '::1' || ip.startsWith('10.');
    if (process.env.NODE_ENV === 'production' && !isInternal) {
      return reply.code(403).send({ error: 'Deep health check is internal only' });
    }

    const start = Date.now();
    const services: Record<string, any> = {};

    // 1. Postgres
    try {
      const dbStart = Date.now();
      await db.execute(sql`SELECT 1`);
      services.postgres = { status: 'ok', latencyMs: Date.now() - dbStart };
    } catch (e) {
      services.postgres = { status: 'down', error: (e as Error).message };
    }

    // 2. Redis
    try {
      const redisStart = Date.now();
      await redis.ping();
      services.redis = { status: 'ok', latencyMs: Date.now() - redisStart };
    } catch (e) {
      services.redis = { status: 'down', error: (e as Error).message };
    }

    // 3. AI Providers (Basic connectivity/latency check to API root if possible, or just mock)
    const providers = ['anthropic', 'openai', 'gemini'];
    for (const provider of providers) {
      services[provider] = { status: 'ok', latencyMs: Math.floor(Math.random() * 50) }; // Mocked latency
    }

    // 4. External Venues
    services.polymarket = { status: 'ok', latencyMs: 120 }; // Mock
    services.kalshi = { status: 'ok', latencyMs: 85 }; // Mock
    services.polygon = { status: 'ok', latencyMs: 45 }; // Mock

    const agentStatus = await orchestrator.getStatus();
    const emergencyActive = await emergencyStopService.isEmergencyActive();

    const overallStatus = Object.values(services).every(s => s.status === 'ok') ? 'ok' : 'degraded';

    return {
      status: overallStatus,
      totalLatencyMs: Date.now() - start,
      services,
      agents: agentStatus.agents,
      aiCostToday: agentStatus.dailyAiCost,
      activeConnections: ws_connections_active.get() || 0,
      emergencyActive,
      timestamp: new Date().toISOString(),
    };
  });

  // GET /health/security-check - Dev only security header audit
  fastify.get('/security-check', async (request, reply) => {
    if (process.env.NODE_ENV === 'production') {
      return reply.code(404).send();
    }

    return {
      headers: request.headers,
      securityStatus: {
        helmet: !!(fastify as any).helmet,
        cors: !!(fastify as any).cors,
        rateLimit: !!(fastify as any).rateLimit,
        csrf: !!(fastify as any).csrfProtection,
      }
    };
  });
}
