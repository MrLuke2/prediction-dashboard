import { Redis } from 'ioredis';
import { WebSocket } from 'ws';
import { config } from '../../config.js';
import { registry } from '../clientState.js';
import { MessageType, buildServerMessage, AlphaUpdatePayload } from '../protocol.js';
import { logger } from '../../lib/logger.js';

const subClient = new Redis(config.REDIS_URL, { maxRetriesPerRequest: null, enableReadyCheck: false });

export async function initAlphaMetricChannel(): Promise<void> {
  await subClient.subscribe('agents:alpha');

  subClient.on('message', (channel, message) => {
    if (channel !== 'agents:alpha') return;

    try {
      const raw = JSON.parse(message);

      const payload = {
        probability: raw.probability ?? 50,
        trend: raw.trend ?? 'stable',
        history: raw.history ?? [],
        breakdown: raw.breakdown,
        generatedBy: raw.generatedBy ?? raw.providerId ?? 'gemini',
        contributing_agents: raw.contributing_agents ?? raw.contributingAgents,
      };

      const validationResult = AlphaUpdatePayload.safeParse(payload);
      if (!validationResult.success) {
        logger.warn({ errors: validationResult.error.issues }, 'Invalid alpha update payload');
        return;
      }

      const msg = buildServerMessage(MessageType.ALPHA_UPDATE, validationResult.data);

      // Broadcast to all authenticated clients (not guests)
      registry.broadcast(msg, (state) => state.userId !== null);
    } catch (e) {
      logger.error({ e }, 'Failed to process alpha metric');
    }
  });

  logger.info('Alpha metric channel initialized');
}
