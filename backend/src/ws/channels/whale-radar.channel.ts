import { Redis } from 'ioredis';
import { config } from '../../config.js';
import { connections } from '../client-state.js';
import { logger } from '../../lib/logger.js';
import { WS_SERVER_MESSAGES } from '../protocol.js';

const subClient = new Redis(config.REDIS_URL, { maxRetriesPerRequest: null });

export async function initWhaleRadarChannel() {
  await subClient.subscribe('whale:movements');
  
  subClient.on('message', (channel, message) => {
    if (channel !== 'whale:movements') return;
     
    try {
      const payload = JSON.parse(message);
      const msg = JSON.stringify({
        type: WS_SERVER_MESSAGES.WHALE_ALERT,
        payload,
        ts: Date.now()
      });

      // Broadcast to ALL authenticated clients
      for (const [id, client] of connections) {
        if (client.userId) { // Check authenticated
           if (client.ws.readyState === client.ws.OPEN) {
             client.ws.send(msg);
           }
        }
      }
    } catch (e) {
      logger.error('Failed to process whale movement');
    }
  });
}
