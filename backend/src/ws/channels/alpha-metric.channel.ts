import { Redis } from 'ioredis';
import { config } from '../../config.js';
import { connections } from '../client-state.js';
import { logger } from '../../lib/logger.js';
import { WS_SERVER_MESSAGES } from '../protocol.js';

const subClient = new Redis(config.REDIS_URL, { maxRetriesPerRequest: null });

export async function initAlphaMetricChannel() {
  await subClient.subscribe('agents:alpha');
  
  subClient.on('message', (channel, message) => {
    if (channel !== 'agents:alpha') return;
     
    try {
      const payload = JSON.parse(message);
      const msg = JSON.stringify({
        type: WS_SERVER_MESSAGES.ALPHA_UPDATE,
        payload,
        ts: Date.now()
      });

      for (const [id, client] of connections) {
        if (client.userId && client.ws.readyState === client.ws.OPEN) {
          client.ws.send(msg);
        }
      }
    } catch (e) {
      logger.error('Failed to process alpha metric');
    }
  });
}
