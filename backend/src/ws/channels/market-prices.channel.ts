import { Redis } from 'ioredis';
import { config } from '../../config.js';
import { connections } from '../client-state.js';
import { logger } from '../../lib/logger.js';
import { WS_SERVER_MESSAGES } from '../protocol.js';

// Dedicated Redis subscriber
const subClient = new Redis(config.REDIS_URL, { maxRetriesPerRequest: null });

export async function initMarketPricesChannel() {
  await subClient.psubscribe('market:prices:*');
  
  subClient.on('pmessage', (pattern, channel, message) => {
    if (pattern !== 'market:prices:*') return;
    
    // channel format: market:prices:SYMBOL
    const symbol = channel.split(':')[2];
    if (!symbol) return;

    try {
      const payload = JSON.parse(message);
      const msg = JSON.stringify({
        type: WS_SERVER_MESSAGES.MARKET_UPDATE,
        payload: {
          symbol,
          ...payload
        },
        ts: Date.now()
      });

      // Fan-out
      for (const [id, client] of connections) {
        if (client.subscribedSymbols.has(symbol)) {
           // Basic throttling: 1msg/500ms per client+symbol?
           // Complex per-client-symbol throttle state needed.
           // Simplified: Just broadcast for now or implement global throttle?
           // Requirement: "Throttle per-client to 1 message/500ms (prevent flood)"
           // To implement per-client-per-symbol throttle, we need state map in client.
           // Let's assume we can attach throttle map to client state.
           if (shouldSend(client, symbol)) {
             if (client.ws.readyState === client.ws.OPEN) {
                client.ws.send(msg);
             }
           }
        }
      }
    } catch (e) {
      logger.error({ e, channel }, 'Failed to process market price update');
    }
  });
}

// Ideally add `throttles: Map<string, number>` to ClientState
function shouldSend(client: any, symbol: string): boolean {
  // Hacky dynamic attach if not in interface
  if (!client.throttles) client.throttles = new Map<string, number>();
  
  const last = client.throttles.get(symbol) || 0;
  const now = Date.now();
  if (now - last > 500) {
    client.throttles.set(symbol, now);
    return true;
  }
  return false;
}
