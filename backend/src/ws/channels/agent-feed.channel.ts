import { Redis } from 'ioredis';
import { WebSocket } from 'ws';
import { config } from '../../config.js';
import { registry } from '../clientState.js';
import { MessageType, buildServerMessage, AgentLogPayload } from '../protocol.js';
import { logger } from '../../lib/logger.js';

const subClient = new Redis(config.REDIS_URL, { maxRetriesPerRequest: null });

const PRO_LEVELS = new Set(['WARN', 'ERROR', 'DEBATE']);

export async function initAgentFeedChannel(): Promise<void> {
  await subClient.subscribe('agents:logs');

  subClient.on('message', (channel, message) => {
    if (channel !== 'agents:logs') return;

    try {
      const raw = JSON.parse(message);

      const payload = {
        id: raw.id ?? crypto.randomUUID(),
        timestamp: raw.timestamp ?? new Date().toISOString(),
        agent: raw.agent ?? 'Unknown',
        message: raw.message ?? '',
        level: raw.level ?? 'INFO',
        providerId: raw.providerId,
        agentProvider: raw.agentProvider ?? raw.providerId ?? 'gemini',
        model: raw.model,
        latency_ms: raw.latency_ms ?? raw.latencyMs,
      };

      const validationResult = AgentLogPayload.safeParse(payload);
      if (!validationResult.success) {
        logger.warn({ errors: validationResult.error.issues }, 'Invalid agent log payload');
        return;
      }

      const isProLevel = PRO_LEVELS.has(validationResult.data.level);
      const msg = buildServerMessage(MessageType.AGENT_LOG, validationResult.data);

      for (const state of registry.getAll()) {
        if (state.ws.readyState !== WebSocket.OPEN) continue;

        // Guest: no access
        if (state.plan === 'guest') {
          // Don't send upgrade error on every log — too noisy
          continue;
        }

        // Free: info + SUCCESS only
        if (state.plan === 'free' && isProLevel) continue;

        state.ws.send(msg);
      }
    } catch (e) {
      logger.error({ e }, 'Failed to process agent log');
    }
  });

  logger.info('Agent feed channel initialized');
}
