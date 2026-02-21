import { Redis } from 'ioredis';
import { WebSocket } from 'ws';
import { config } from '../../config.js';
import { registry, ClientState } from '../clientState.js';
import { MessageType, buildServerMessage, MarketUpdatePayload } from '../protocol.js';
import { logger } from '../../lib/logger.js';

const subClient = new Redis(config.REDIS_URL, { maxRetriesPerRequest: null });

const GUEST_THROTTLE_MS = 2000;
const PRO_THROTTLE_MS = 500;

function getThrottleMs(plan: ClientState['plan']): number {
  return plan === 'guest' || plan === 'free' ? GUEST_THROTTLE_MS : PRO_THROTTLE_MS;
}

function shouldSend(state: ClientState, symbol: string): boolean {
  const last = state.throttles.get(symbol) || 0;
  const now = Date.now();
  const interval = getThrottleMs(state.plan);
  if (now - last >= interval) {
    state.throttles.set(symbol, now);
    return true;
  }
  return false;
}

export async function initMarketPricesChannel(): Promise<void> {
  await subClient.psubscribe('market:prices:*');

  subClient.on('pmessage', (_pattern, channel, message) => {
    const symbol = channel.split(':')[2];
    if (!symbol) return;

    try {
      const raw = JSON.parse(message);

      // Build payload matching frontend MarketPair shape
      const payload = {
        symbol,
        polymarketPrice: raw.polyPrice ?? 0,
        kalshiPrice: raw.kalshiPrice ?? 0,
        spread: raw.spread?.spread ?? Math.abs((raw.polyPrice ?? 0) - (raw.kalshiPrice ?? 0)),
        trend: raw.spread?.direction === 'poly_higher' ? 'up'
             : raw.spread?.direction === 'kalshi_higher' ? 'down'
             : 'neutral',
        volume: String(raw.volume24h ?? '0'),
      };

      const validationResult = MarketUpdatePayload.safeParse(payload);
      if (!validationResult.success) {
        logger.warn({ symbol, errors: validationResult.error.issues }, 'Invalid market update payload');
        return;
      }

      const msg = buildServerMessage(MessageType.MARKET_UPDATE, validationResult.data);

      for (const state of registry.getAll()) {
        if (!state.subscribedSymbols.has(symbol)) continue;
        if (state.ws.readyState !== WebSocket.OPEN) continue;
        if (!shouldSend(state, symbol)) continue;
        state.ws.send(msg);
      }
    } catch (e) {
      logger.error({ e, channel }, 'Failed to process market price update');
    }
  });

  logger.info('Market prices channel initialized');
}
