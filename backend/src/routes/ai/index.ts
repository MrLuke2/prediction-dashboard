import { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/authenticate.js';
import { getUsageSummary } from '../../services/ai/costTracker.js';

export default async function aiUsageRoutes(fastify: FastifyInstance) {
  // GET /ai/usage — daily cost summary
  fastify.get(
    '/usage',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['AI'],
        summary: 'Get daily AI usage and cost breakdown',
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: 'object',
            properties: {
              today: {
                type: 'object',
                properties: {
                  total: { type: 'number' },
                  byProvider: {
                    type: 'object',
                    properties: {
                      anthropic: { type: 'number' },
                      openai: { type: 'number' },
                      gemini: { type: 'number' },
                    },
                  },
                },
              },
              limit: { type: 'number' },
              percentUsed: { type: 'number' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const userId = request.user?.userId;
      const summary = await getUsageSummary(userId);
      return reply.send(summary);
    },
  );
}
