import { Redis } from 'ioredis';
import { config } from '../../config.js';
import { registry } from '../clientState.js';
import { MessageType, buildServerMessage, EmergencyStopPayload } from '../protocol.js';
import { logger } from '../../lib/logger.js';

const subClient = new Redis(config.REDIS_URL, { maxRetriesPerRequest: null, enableReadyCheck: false });

export async function initEmergencyChannel(): Promise<void> {
  // Per-user emergency stop
  await subClient.psubscribe('emergency:stop:*');
  // System-wide admin emergency
  await subClient.subscribe('emergency:stop:broadcast');

  subClient.on('pmessage', (_pattern, channel, message) => {
    try {
      const raw = JSON.parse(message);

      const payload = {
        reason: raw.reason ?? 'Emergency stop triggered',
        tradesAffected: raw.tradesAffected ?? 0,
        timestamp: raw.timestamp ?? new Date().toISOString(),
      };

      const validationResult = EmergencyStopPayload.safeParse(payload);
      if (!validationResult.success) {
        logger.warn({ errors: validationResult.error.issues }, 'Invalid emergency stop payload');
        return;
      }

      const msg = buildServerMessage(MessageType.EMERGENCY_STOP, validationResult.data);

      // Extract userId from channel: emergency:stop:{userId}
      const parts = channel.split(':');
      const userId = parts[2];

      if (userId && userId !== 'broadcast') {
        registry.broadcastToUser(userId, msg);
        logger.warn({ userId, reason: payload.reason }, 'Emergency stop sent to user');
      }
    } catch (e) {
      logger.error({ e }, 'Failed to process emergency stop');
    }
  });

  // System-wide broadcast handler
  subClient.on('message', (channel, message) => {
    if (channel !== 'emergency:stop:broadcast') return;

    try {
      const raw = JSON.parse(message);

      const payload = {
        reason: raw.reason ?? 'System-wide emergency stop',
        tradesAffected: raw.tradesAffected ?? 0,
        timestamp: raw.timestamp ?? new Date().toISOString(),
      };

      const validationResult = EmergencyStopPayload.safeParse(payload);
      if (!validationResult.success) return;

      const msg = buildServerMessage(MessageType.EMERGENCY_STOP, validationResult.data);
      registry.broadcast(msg);
      logger.warn({ reason: payload.reason }, 'System-wide emergency stop broadcast');
    } catch (e) {
      logger.error({ e }, 'Failed to process broadcast emergency stop');
    }
  });

  logger.info('Emergency channel initialized');
}
