import Fastify, { FastifyRequest } from 'fastify';
import crypto from 'crypto';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import websocket from '@fastify/websocket';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { config } from './config.js';
import { logger } from './lib/logger.js';
import authRoutes from './routes/auth/index.js';
import marketRoutes from './routes/markets/index.js';
import agentRoutes from './routes/agents/index.js';
import whaleRoutes from './routes/whales/index.js';
import tradeRoutes from './routes/trades/index.js';
import wsRoutes from './ws/index.js';

import { initMarketSync } from './jobs/market-sync.job.js';
import { initAgentOrchestrator } from './jobs/agent-orchestrator.job.js';
import { initWhaleSync } from './jobs/whale-sync.job.js';


import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';

const fastify = Fastify({
  logger: logger as any,
  requestIdHeader: 'x-request-id',
  genReqId: (req) => (req.headers['x-request-id'] as string) || crypto.randomUUID(),
});

fastify.setValidatorCompiler(validatorCompiler);
fastify.setSerializerCompiler(serializerCompiler);

const start = async () => {
  try {
    // 1. Swagger Setup
    await fastify.register(swagger, {
      openapi: {
        info: {
          title: 'Alpha Mode Predict API',
          description: 'Production API for AI-powered prediction market trading',
          version: '1.0.0',
        },
        servers: [{ url: `http://localhost:${config.PORT}` }],
      },
    });

    await fastify.register(swaggerUi, {
      routePrefix: '/docs',
    });

    // 2. Security Plugins
    await fastify.register(cors, {
      origin: '*', // Whitelist properly in production
    });

    await fastify.register(helmet);

    await fastify.register(rateLimit, {
      max: 100,
      timeWindow: '1 minute',
    });

    await fastify.register(cookie, {
        secret: config.JWT_SECRET,
        hook: 'onRequest',
    });

    // 3. Functional Plugins
    await fastify.register(websocket);
    await fastify.register(wsRoutes);
    
    // Kept @fastify/jwt in case needed, though we use custom middleware
    await fastify.register(jwt, {
      secret: config.JWT_SECRET,
    });

    // 4. Routes
    await fastify.register(authRoutes, { prefix: '/auth' });
    await fastify.register(marketRoutes, { prefix: '/markets' });
    await fastify.register(agentRoutes, { prefix: '/agents' });
    await fastify.register(whaleRoutes, { prefix: '/whales' });
    await fastify.register(tradeRoutes, { prefix: '/trades' });

    // 5. Jobs

    await initMarketSync();
    await initAgentOrchestrator();
    await initWhaleSync();


    fastify.get('/health', async () => {
      return { status: 'ok', uptime: process.uptime() };
    });

    // 5. Start Server
    await fastify.listen({ port: config.PORT, host: '0.0.0.0' });
    
    fastify.log.info(`Server listening on http://localhost:${config.PORT}`);
    fastify.log.info(`Documentation available at http://localhost:${config.PORT}/docs`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
