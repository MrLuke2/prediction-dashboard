import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import websocket from '@fastify/websocket';
import jwt from '@fastify/jwt';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import { config } from './config.js';
import { logger } from './lib/logger.js';
import crypto from 'crypto';

const fastify = Fastify({
  logger,
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
      },
    });

    await fastify.register(swaggerUi, {
      routePrefix: '/docs',
    });

    // 2. Security Plugins
    await fastify.register(cors, {
      origin: '*', // Whitelist frontend origin in production
    });

    await fastify.register(helmet);

    await fastify.register(rateLimit, {
      max: (req) => (req.user ? 1000 : 100),
      timeWindow: '1 minute',
    });

    // 3. Functional Plugins
    await fastify.register(jwt, {
      secret: config.JWT_SECRET,
    });

    await fastify.register(websocket);

    // 4. Request Logging with Correlation
    fastify.addHook('onRequest', async (request) => {
      request.log.info({ 
        msg: 'incoming request',
        method: request.method,
        url: request.url,
        requestId: request.id 
      });
    });

    fastify.addHook('onResponse', async (request, reply) => {
      request.log.info({ 
        msg: 'request completed',
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode,
        responseTime: reply.elapsedTime,
        requestId: request.id
      });
    });

    // 5. Health Check
    fastify.get('/health', async () => {
      return { 
        status: 'ok', 
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      };
    });

    // 6. Start Server
    await fastify.listen({ port: config.PORT, host: '0.0.0.0' });
    
    console.log(`🚀 Server ready at http://0.0.0.0:${config.PORT}`);
    console.log(`📖 Documentation at http://0.0.0.0:${config.PORT}/docs`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
