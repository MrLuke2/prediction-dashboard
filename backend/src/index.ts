import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import websocket from '@fastify/websocket';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import { config } from './config.js';
import { logger } from './lib/logger.js';
import crypto from 'crypto';
import type { FastifyBaseLogger } from 'fastify';

// Route imports
import authRoutes from './routes/auth/index.js';
import apiKeyRoutes from './routes/user/api-keys.js';
import aiUsageRoutes from './routes/ai/index.js';
import marketRoutes from './routes/markets/index.js';
import wsRoutes from './ws/index.js';
import { initMarketSync } from './jobs/market-sync.job.js';

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

    await fastify.register(websocket);

    // 5. Request Logging with Correlation
    fastify.addHook('onRequest', async (request) => {
      request.log.info({
        msg: 'incoming request',
        method: request.method,
        url: request.url,
        requestId: request.id,
      });
    });

    fastify.addHook('onResponse', async (request, reply) => {
      request.log.info({
        msg: 'request completed',
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode,
        responseTime: reply.elapsedTime,
        requestId: request.id,
      });
    });

    // 6. Health Check
    fastify.get('/health', async () => {
      return {
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      };
    });

    // 7. Register Routes
    await fastify.register(authRoutes, { prefix: '/auth' });
    await fastify.register(apiKeyRoutes, { prefix: '/user/api-keys' });
    await fastify.register(aiUsageRoutes, { prefix: '/ai' });
    await fastify.register(marketRoutes, { prefix: '/markets' });
    await fastify.register(wsRoutes);

    // 8. Start Server
    await fastify.listen({ port: config.PORT, host: '0.0.0.0' });

    // 9. Start Background Jobs
    await initMarketSync();

    console.log(`🚀 Server ready at http://0.0.0.0:${config.PORT}`);
    console.log(`📖 Documentation at http://0.0.0.0:${config.PORT}/docs`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
