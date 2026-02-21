import { Redis } from 'ioredis';
import { config } from '../config.js';
import { logger } from './logger.js';

// Connection options for BullMQ (it creates its own Redis instance)
export const redisConnection = {
  host: new URL(config.REDIS_URL).hostname,
  port: parseInt(new URL(config.REDIS_URL).port || '6379'),
  password: new URL(config.REDIS_URL).password || undefined,
  maxRetriesPerRequest: null,
};

// Main Redis instance for direct usage
export const redis = new Redis(config.REDIS_URL, {
  maxRetriesPerRequest: null,
});

redis.on('error', (err) => {
  logger.error(err, 'Redis connection error');
});

redis.on('connect', () => {
  logger.info('Connected to Redis');
});
