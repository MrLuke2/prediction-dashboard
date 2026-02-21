import { WebSocket } from 'ws';
import { ZodError } from 'zod';
import { ClientState, registry } from './clientState.js';
import {
  MessageType,
  ClientMessageSchema,
  SubscribeMarketPayload,
  UnsubscribeMarketPayload,
  SetAIProviderPayload,
  buildServerMessage,
} from './protocol.js';
import { validateSelection } from '../services/ai/modelCatalog.js';
import { db } from '../db/index.js';
import { marketPairs } from '../db/schema/index.js';
import { eq } from 'drizzle-orm';
import { logger } from '../lib/logger.js';

const FREE_SYMBOL_LIMIT = 10;
const RATE_LIMIT_PER_MIN = 50;

export function handleClientMessage(ws: WebSocket, raw: string, state: ClientState): void {
  // Rate limiting
  const now = Date.now();
  if (now - state.windowStart > 60_000) {
    state.messageCount = 0;
    state.windowStart = now;
  }
  state.messageCount++;
  if (state.messageCount > RATE_LIMIT_PER_MIN) {
    ws.send(buildServerMessage(MessageType.ERROR, {
      code: 'RATE_LIMIT',
      message: 'Rate limit exceeded: 50 messages/minute',
    }));
    return;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    ws.send(buildServerMessage(MessageType.ERROR, { code: 'INVALID_JSON', message: 'Malformed JSON' }));
    return;
  }

  let msg: ReturnType<typeof ClientMessageSchema.parse>;
  try {
    msg = ClientMessageSchema.parse(parsed);
  } catch (err) {
    const message = err instanceof ZodError
      ? `Invalid message: ${err.issues.map(i => i.message).join(', ')}`
      : 'Invalid message format';
    ws.send(buildServerMessage(MessageType.ERROR, { code: 'INVALID_MESSAGE', message }));
    return;
  }

  switch (msg.type) {
    case MessageType.SUBSCRIBE_MARKET:
      handleSubscribe(ws, state, msg.payload);
      break;
    case MessageType.UNSUBSCRIBE_MARKET:
      handleUnsubscribe(ws, state, msg.payload);
      break;
    case MessageType.PING:
      handlePing(ws, state);
      break;
    case MessageType.SET_AI_PROVIDER:
      handleSetAIProvider(ws, state, msg.payload);
      break;
  }
}

// ─── SUBSCRIBE_MARKET ───────────────────────────────────────────────────────

async function handleSubscribe(
  ws: WebSocket,
  state: ClientState,
  payload: { symbol: string },
): Promise<void> {
  const { symbol } = payload;

  // Free/guest: max 10 symbols
  if ((state.plan === 'free' || state.plan === 'guest') && state.subscribedSymbols.size >= FREE_SYMBOL_LIMIT) {
    if (!state.subscribedSymbols.has(symbol)) {
      ws.send(buildServerMessage(MessageType.ERROR, {
        code: 'SUBSCRIBE_LIMIT',
        message: `Free plan limit: max ${FREE_SYMBOL_LIMIT} symbols`,
      }));
      return;
    }
  }

  // Validate symbol exists in DB
  try {
    const pair = await db.query.marketPairs.findFirst({
      where: eq(marketPairs.symbol, symbol),
    });
    if (!pair) {
      ws.send(buildServerMessage(MessageType.ERROR, {
        code: 'SYMBOL_NOT_FOUND',
        message: `Symbol "${symbol}" not found`,
      }));
      return;
    }
  } catch (err) {
    logger.error({ err, symbol }, 'DB lookup failed for symbol');
    ws.send(buildServerMessage(MessageType.ERROR, {
      code: 'INTERNAL_ERROR',
      message: 'Failed to validate symbol',
    }));
    return;
  }

  state.subscribedSymbols.add(symbol);
  logger.debug({ connectionId: state.connectionId, symbol }, 'Client subscribed to market');
}

// ─── UNSUBSCRIBE_MARKET ─────────────────────────────────────────────────────

function handleUnsubscribe(
  ws: WebSocket,
  state: ClientState,
  payload: { symbol: string },
): void {
  state.subscribedSymbols.delete(payload.symbol);
  logger.debug({ connectionId: state.connectionId, symbol: payload.symbol }, 'Client unsubscribed from market');
}

// ─── PING ───────────────────────────────────────────────────────────────────

function handlePing(ws: WebSocket, state: ClientState): void {
  state.lastPing = Date.now();
  ws.send(buildServerMessage(MessageType.PONG, { ts: Date.now() }));
}

// ─── SET_AI_PROVIDER ────────────────────────────────────────────────────────

function handleSetAIProvider(
  ws: WebSocket,
  state: ClientState,
  payload: { providerId: string; model: string },
): void {
  if (state.plan === 'guest') {
    ws.send(buildServerMessage(MessageType.ERROR, {
      code: 'UPGRADE_REQUIRED',
      message: 'Guests cannot change AI provider',
    }));
    return;
  }

  const selection = { providerId: payload.providerId as any, model: payload.model };
  if (!validateSelection(selection)) {
    ws.send(buildServerMessage(MessageType.ERROR, {
      code: 'INVALID_PROVIDER',
      message: `Invalid provider/model: ${payload.providerId}/${payload.model}`,
    }));
    return;
  }

  state.aiProvider = selection;

  ws.send(buildServerMessage(MessageType.AGENT_LOG, {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    agent: 'Interface Controller',
    message: `Provider switched to ${payload.providerId}/${payload.model}`,
    level: 'INFO',
    agentProvider: payload.providerId,
    model: payload.model,
  }));

  logger.info({ connectionId: state.connectionId, provider: payload.providerId, model: payload.model }, 'AI provider switched');
}
