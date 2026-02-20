import { z } from 'zod';

// Client -> Server Types
export const WS_CLIENT_MESSAGES = {
  SUBSCRIBE_MARKET: 'SUBSCRIBE_MARKET',
  UNSUBSCRIBE_MARKET: 'UNSUBSCRIBE_MARKET',
  PING: 'PING',
} as const;

export const SubscribeMarketPayload = z.object({
  symbol: z.string(),
});

export const UnsubscribeMarketPayload = z.object({
  symbol: z.string(),
});

// Server -> Client Types
export const WS_SERVER_MESSAGES = {
  MARKET_UPDATE: 'MARKET_UPDATE',
  WHALE_ALERT: 'WHALE_ALERT',
  AGENT_LOG: 'AGENT_LOG',
  ALPHA_UPDATE: 'ALPHA_UPDATE',
  TRADE_UPDATE: 'TRADE_UPDATE',
  ERROR: 'ERROR',
  PONG: 'PONG',
} as const;


// Payload Definitions (Stubbed to match requirements)
export interface WsMessage<T = any> {
  type: string;
  payload: T;
  ts: number;
}
