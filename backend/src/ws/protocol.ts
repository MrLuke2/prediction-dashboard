import { z } from 'zod';

// ─── Message Types (mirrors frontend MessageType enum) ──────────────────────

export const MessageType = {
  // Server → Client
  MARKET_UPDATE: 'MARKET_UPDATE',
  WHALE_ALERT: 'WHALE_ALERT',
  AGENT_LOG: 'AGENT_LOG',
  ALPHA_UPDATE: 'ALPHA_UPDATE',
  TRADE_UPDATE: 'TRADE_UPDATE',
  PONG: 'PONG',
  ERROR: 'ERROR',
  EMERGENCY_STOP: 'EMERGENCY_STOP',

  // Client → Server
  SUBSCRIBE_MARKET: 'SUBSCRIBE_MARKET',
  UNSUBSCRIBE_MARKET: 'UNSUBSCRIBE_MARKET',
  PING: 'PING',
  SET_AI_PROVIDER: 'SET_AI_PROVIDER',
} as const;

export type MessageTypeValue = (typeof MessageType)[keyof typeof MessageType];

// ─── AI Provider (matches frontend aiProviders.ts) ──────────────────────────

const AIProviderIdSchema = z.enum(['gemini', 'anthropic', 'openai']);
export type AIProviderId = z.infer<typeof AIProviderIdSchema>;

const AIProviderSelectionSchema = z.object({
  providerId: AIProviderIdSchema,
  model: z.string().min(1),
});
export type AIProviderSelection = z.infer<typeof AIProviderSelectionSchema>;

// ─── Base Envelope ──────────────────────────────────────────────────────────

export const BaseMessageSchema = z.object({
  type: z.string(),
  payload: z.any(),
  ts: z.number(),
});

// ─── Client → Server Payloads ───────────────────────────────────────────────

export const SubscribeMarketPayload = z.object({
  symbol: z.string().min(1).max(50),
});

export const UnsubscribeMarketPayload = z.object({
  symbol: z.string().min(1).max(50),
});

export const PingPayload = z.object({
  ts: z.number(),
});

export const SetAIProviderPayload = AIProviderSelectionSchema;

// Discriminated union for inbound messages
export const ClientMessageSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal(MessageType.SUBSCRIBE_MARKET), payload: SubscribeMarketPayload, ts: z.number() }),
  z.object({ type: z.literal(MessageType.UNSUBSCRIBE_MARKET), payload: UnsubscribeMarketPayload, ts: z.number() }),
  z.object({ type: z.literal(MessageType.PING), payload: PingPayload, ts: z.number() }),
  z.object({ type: z.literal(MessageType.SET_AI_PROVIDER), payload: SetAIProviderPayload, ts: z.number() }),
]);

export type ClientMessage = z.infer<typeof ClientMessageSchema>;

// ─── Server → Client Payloads ───────────────────────────────────────────────

export const MarketUpdatePayload = z.object({
  symbol: z.string(),
  pair: z.string().optional(),
  volume: z.string().optional(),
  polymarketPrice: z.number(),
  kalshiPrice: z.number(),
  spread: z.number(),
  trend: z.enum(['up', 'down', 'neutral']),
});

export const WhaleAlertPayload = z.object({
  id: z.string(),
  wallet: z.string(),
  action: z.string(),
  amount: z.number(),
  asset: z.string(),
  confidence: z.number(),
  timestamp: z.number(),
  providerId: z.string().optional(),
});

export const AgentLogPayload = z.object({
  id: z.string(),
  timestamp: z.string(),
  agent: z.string(),
  message: z.string(),
  level: z.enum(['INFO', 'WARN', 'ERROR', 'SUCCESS', 'DEBATE']),
  providerId: z.string().optional(),
  agentProvider: AIProviderIdSchema,
  model: z.string().optional(),
  latency_ms: z.number().optional(),
});

export const AlphaUpdatePayload = z.object({
  probability: z.number(),
  trend: z.enum(['increasing', 'decreasing', 'stable']),
  history: z.array(z.object({ probability: z.number(), timestamp: z.number() })),
  breakdown: z.object({
    fundamentals: z.object({ score: z.number(), providerId: z.string() }),
    sentiment: z.object({ score: z.number(), providerId: z.string() }),
    risk: z.object({ score: z.number(), providerId: z.string() }),
  }).optional(),
  generatedBy: AIProviderIdSchema,
  contributing_agents: z.array(z.object({
    agent: z.string(),
    provider: AIProviderIdSchema,
    model: z.string(),
    score: z.number(),
  })).optional(),
});

export const TradeUpdatePayload = z.object({
  amount: z.number().optional(),
  roi: z.number().optional(),
  tradeId: z.string(),
  timestamp: z.number(),
  venue: z.enum(['Polymarket', 'Kalshi', 'Cross-Venue']).optional(),
  asset: z.string().optional(),
  side: z.enum(['Buy', 'Sell']).optional(),
  status: z.enum(['open', 'closed', 'failed', 'emergency_closed']).optional(),
  executionTime: z.string().optional(),
  pnl: z.number().optional(),
  aiProvider: AIProviderIdSchema.optional(),
});

export const PongPayload = z.object({
  ts: z.number(),
});

export const ErrorPayload = z.object({
  code: z.string(),
  message: z.string(),
});

export const EmergencyStopPayload = z.object({
  reason: z.string(),
  tradesAffected: z.number(),
  timestamp: z.string(),
});

// ─── Server Message Builder ─────────────────────────────────────────────────

export interface WsMessage<T = unknown> {
  type: MessageTypeValue;
  payload: T;
  ts: number;
}

export function buildServerMessage<T>(type: MessageTypeValue, payload: T): string {
  const msg: WsMessage<T> = { type, payload, ts: Date.now() };
  return JSON.stringify(msg);
}
