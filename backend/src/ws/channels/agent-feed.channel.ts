import { Redis } from 'ioredis';
import { config } from '../../config.js';
import { connections } from '../client-state.js';
import { logger } from '../../lib/logger.js';
import { WS_SERVER_MESSAGES } from '../protocol.js';

const subClient = new Redis(config.REDIS_URL, { maxRetriesPerRequest: null });

export async function initAgentFeedChannel() {
  await subClient.subscribe('agents:logs');
  
  subClient.on('message', (channel, message) => {
    if (channel !== 'agents:logs') return;
     
    try {
      const payload = JSON.parse(message);
      // Expected Log Structure: { level: 'info' | 'warn' | 'alert', message: string, ... }
      
      const isProLevel = payload.level === 'warn' || payload.level === 'alert';
      
      const payloadStr = JSON.stringify({
        type: WS_SERVER_MESSAGES.AGENT_LOG,
        payload,
        ts: Date.now()
      });

      for (const [id, client] of connections) {
        if (!client.userId) continue;

        // Filter: Free users only get INFO
        // Pro users get everything
        if (client.plan === 'free' && isProLevel) {
          continue;
        }

        if (client.ws.readyState === client.ws.OPEN) {
          client.ws.send(payloadStr);
        }
      }
    } catch (e) {
      logger.error('Failed to process agent log');
    }
  });
}
