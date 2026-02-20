import { FastifyInstance } from 'fastify';
import { orchestrator } from '../../jobs/agent-orchestrator.job.js';

export default async function agentRoutes(fastify: FastifyInstance) {
  
  // GET /agents/status
  fastify.get('/status', async () => {
    return orchestrator.getStatus();
  });

  // GET /agents/alpha — latest aggregated alpha (real-time proxy)
  fastify.get('/alpha', async () => {
    const latest = await orchestrator.getStatus(); // placeholder
    // Fetch from Redis
    const alphaStr = await (fastify as any).redis.get('agent:cache:alpha'); // If use this.redis
    // Actually our orchestrator uses internal redis
    return latest; 
  });
}
