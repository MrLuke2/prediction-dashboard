import { Redis } from 'ioredis';
import { WebSocket } from 'ws';
import { config } from '../../config.js';
import { registry } from '../clientState.js';
import { MessageType, buildServerMessage, WhaleAlertPayload } from '../protocol.js';
import { logger } from '../../lib/logger.js';

const subClient = new Redis(config.REDIS_URL, { maxRetriesPerRequest: null });

export async function initWhaleRadarChannel(): Promise<void> {
  await subClient.subscribe('whale:movements');

  subClient.on('message', (channel, message) => {
    if (channel !== 'whale:movements') return;

    try {
      const raw = JSON.parse(message);

      const payload = {
        id: raw.id ?? crypto.randomUUID(),
        wallet: raw.wallet ?? raw.from ?? 'unknown',
        action: raw.action ?? raw.type ?? 'transfer',
        amount: raw.amount ?? raw.valueUsd ?? 0,
        asset: raw.asset ?? raw.symbol ?? 'unknown',
        confidence: raw.confidence ?? 0.5,
        timestamp: raw.timestamp ?? Date.now(),
        providerId: raw.providerId ?? raw.flaggedBy ?? undefined,
      };

      const validationResult = WhaleAlertPayload.safeParse(payload);
      if (!validationResult.success) {
        logger.warn({ errors: validationResult.error.issues }, 'Invalid whale alert payload');
        return;
      }

      for (const state of registry.getAll()) {
        if (state.ws.readyState !== WebSocket.OPEN) continue;

        const outPayload = { ...validationResult.data };

        // Guest: receive movements but strip whale labels (providerId)
        if (state.plan === 'guest') {
          delete (outPayload as any).providerId;
        }

        // All connections (including guests) receive whale movements
        state.ws.send(buildServerMessage(MessageType.WHALE_ALERT, outPayload));
      }
    } catch (e) {
      logger.error({ e }, 'Failed to process whale movement');
    }
  });

  logger.info('Whale radar channel initialized');
}
