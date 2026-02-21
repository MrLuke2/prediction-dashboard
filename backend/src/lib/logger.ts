import { pino } from 'pino';
import { config } from '../config.js';

export const logger = pino({
  level: config.NODE_ENV === 'development' ? 'debug' : 'info',
  base: {
    env: config.NODE_ENV,
  },
  transport: config.NODE_ENV === 'development' 
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          ignore: 'pid,hostname',
          translateTime: 'HH:MM:ss Z',
        },
      }
    : undefined,
});

// Helper to get request-specific logger
export const reqLogger = (requestId: string) => logger.child({ requestId });
