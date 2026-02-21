import { FastifyInstance } from 'fastify';
import { orchestrator } from '../../jobs/agent-orchestrator.job.js';
import { redis } from '../../lib/redis.js';

export default async function agentRoutes(fastify: FastifyInstance) {

  // GET /agents/status
  fastify.get('/status', async () => {
    return orchestrator.getStatus();
  });

  // GET /agents/alpha
  fastify.get('/alpha', async () => {
    const alphaStr = await redis.get('agent:cache:alpha');
    return alphaStr ? JSON.parse(alphaStr) : { confidence: 0, trend: 'stable', history: [] };
  });
}
