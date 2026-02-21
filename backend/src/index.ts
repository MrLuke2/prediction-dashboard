import { initTracing, shutdownTracing } from './lib/tracing.js';
// Initialize tracing before anything else
initTracing();

import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import websocket from '@fastify/websocket';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import csrf from '@fastify/csrf-protection';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import { config } from './config.js';
import { logger } from './lib/logger.js';
import { db, client } from './db/index.js';
import crypto from 'crypto';
import type { FastifyBaseLogger } from 'fastify';
import { setupMetrics, http_request_duration_ms } from './lib/metrics.js';
import { sanitizeObject } from './lib/sanitizer.js';

// Route imports
import authRoutes from './routes/auth/index.js';
import apiKeyRoutes from './routes/user/api-keys.js';
import aiUsageRoutes from './routes/ai/index.js';
import marketRoutes from './routes/markets/index.js';
import agentRoutes from './routes/agents/index.js';
import whaleRoutes from './routes/whales/index.js';
import tradeRoutes from './routes/trades/index.js';
import healthRoutes from './routes/health.js';
import wsRoutes from './ws/index.js';
import { initMarketSync } from './jobs/market-sync.job.js';
import { initAgentOrchestrator, orchestrator } from './jobs/agent-orchestrator.job.js';
import { initCleanupJob } from './jobs/cleanup.job.js';
import { whaleDetector } from './services/blockchain/whale-detector.js';
import { registry } from './ws/clientState.js';
import { MessageType, buildServerMessage } from './ws/protocol.js';

const fastify = Fastify({
  logger: logger as unknown as FastifyBaseLogger,
  disableRequestLogging: true, // We'll handle it via correlation
  genReqId: (req) => (req.headers['x-request-id'] as string) || crypto.randomUUID(),
});

// Zod Type Provider
fastify.setValidatorCompiler(validatorCompiler);
fastify.setSerializerCompiler(serializerCompiler);

const start = async () => {
  try {
    // 1. Swagger (Must be registered before routes)
    await fastify.register(swagger, {
      openapi: {
        info: {
          title: 'Alpha Mode Predict API',
          description: 'AI-powered prediction market trading terminal backend',
          version: '1.0.0',
        },
        servers: [{ url: `http://localhost:${config.PORT}` }],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
            },
          },
        },
      },
    });

    await fastify.register(swaggerUi, {
      routePrefix: '/docs',
    });

    // 2. Security Plugins
    await fastify.register(cors, {
      origin: process.env.NODE_ENV === 'production'
        ? ['https://alphamodepredict.com']
        : true,
      credentials: true, // Allow cookies
    });

    await fastify.register(helmet);

    await fastify.register(rateLimit, {
      max: (req) => (req.user ? 1000 : 100),
      timeWindow: '1 minute',
    });

    // 3. Cookie Plugin (for httpOnly refresh tokens)
    await fastify.register(cookie, {
      secret: config.REFRESH_SECRET, // Signs cookies
      parseOptions: {},
    });

    // 4. Functional Plugins
    await fastify.register(jwt, {
      secret: config.JWT_SECRET,
    });

    await fastify.register(csrf, {
      cookieOpts: { signed: true },
      sessionPlugin: '@fastify/cookie'
    });

    await fastify.register(websocket);
    await setupMetrics(fastify);

    // 5. Hooks
    fastify.addHook('preValidation', async (request) => {
      if (request.body) {
        request.body = sanitizeObject(request.body);
      }
    });

    fastify.addHook('onRequest', async (request) => {
      (request as any).startTime = Date.now();
      request.log.info({
        msg: 'incoming request',
        method: request.method,
        url: request.url,
        requestId: request.id,
      });
    });

    fastify.addHook('onResponse', async (request, reply) => {
      const duration = Date.now() - (request as any).startTime;
      
      // Track HTTP metrics
      http_request_duration_ms.labels(
        request.routerPath || 'unknown',
        reply.statusCode.toString(),
        request.method
      ).observe(duration);

      request.log.info({
        msg: 'request completed',
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode,
        responseTime: reply.elapsedTime,
        requestId: request.id,
      });
    });

    // 7. Register Routes
    await fastify.register(healthRoutes, { prefix: '/health' });
    await fastify.register(authRoutes, { prefix: '/auth' });
    await fastify.register(apiKeyRoutes, { prefix: '/user/api-keys' });
    await fastify.register(aiUsageRoutes, { prefix: '/ai' });
    await fastify.register(marketRoutes, { prefix: '/markets' });
    await fastify.register(agentRoutes, { prefix: '/agents' });
    await fastify.register(whaleRoutes, { prefix: '/whales' });
    await fastify.register(tradeRoutes, { prefix: '/trades' });
    await fastify.register(wsRoutes);

    // 8. Start Server
    await fastify.listen({ port: config.PORT, host: '0.0.0.0' });

    // 9. Start Background Jobs
    await initMarketSync();
    await initAgentOrchestrator();
    await initCleanupJob();
    await whaleDetector.start();

    console.log(`🚀 Server ready at http://0.0.0.0:${config.PORT}`);
    console.log(`📖 Documentation at http://0.0.0.0:${config.PORT}/docs`);

    // 10. Graceful Shutdown Handler
    const shutdown = async (signal: string) => {
      logger.info({ signal }, 'Graceful shutdown initiated');
      
      // Notify WS clients
      registry.broadcast(buildServerMessage(MessageType.ERROR, { 
        code: 'SERVER_SHUTDOWN',
        message: 'Server enters maintenance mode, reconnecting soon...' 
      }));

      // Stop all background activities
      orchestrator.stop();
      
      try {
        await fastify.close();
        logger.info('Fastify server closed');
        await client.end();
        logger.info('Database connections closed');
        await shutdownTracing();
        logger.info('Tracing shutdown complete');
        process.exit(0);
      } catch (err) {
        logger.error({ err }, 'Error during graceful shutdown');
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
