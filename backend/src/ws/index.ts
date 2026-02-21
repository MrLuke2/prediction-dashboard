import { FastifyInstance, FastifyRequest } from 'fastify';
import { WebSocket } from 'ws';
import crypto from 'crypto';
import { verifyToken, JWTPayload } from '../lib/jwt.js';
import { registry, ClientState } from './clientState.js';
import { MessageType, buildServerMessage } from './protocol.js';
import { handleClientMessage } from './messageHandlers.js';
import { logger } from '../lib/logger.js';
import { initMarketPricesChannel } from './channels/market-prices.channel.js';
import { initWhaleRadarChannel } from './channels/whale-radar.channel.js';
import { initAgentFeedChannel } from './channels/agent-feed.channel.js';
import { initAlphaMetricChannel } from './channels/alpha-metric.channel.js';
import { initEmergencyChannel } from './channels/emergency.channel.js';

const KEEPALIVE_INTERVAL_MS = 30_000;
const PONG_TIMEOUT_MS = 10_000;
const GUEST_EVICT_INTERVAL_MS = 60_000;

let channelsInitialized = false;
let guestEvictTimer: ReturnType<typeof setInterval> | null = null;

export default async function wsRoutes(fastify: FastifyInstance) {
  // Initialize Redis subscription channels once
  if (!channelsInitialized) {
    await initMarketPricesChannel();
    await initWhaleRadarChannel();
    await initAgentFeedChannel();
    await initAlphaMetricChannel();
    await initEmergencyChannel();
    channelsInitialized = true;
    logger.info('All WS channels initialized');
  }

  // Periodic guest eviction
  if (!guestEvictTimer) {
    guestEvictTimer = setInterval(() => {
      const evicted = registry.evictStaleGuests();
      if (evicted > 0) logger.info({ evicted }, 'Evicted stale guest connections');
    }, GUEST_EVICT_INTERVAL_MS);
  }

  fastify.get('/ws', { websocket: true }, (connection, req: FastifyRequest) => {
    const ws = connection.socket;

    // ── Auth: JWT from ?token= query param or Authorization header ──
    const query = req.query as { token?: string };
    let token = query.token || null;

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.slice(7);
      }
    }

    let user: JWTPayload | null = null;
    let plan: ClientState['plan'] = 'guest';

    if (token) {
      user = verifyToken(token);
      if (user) {
        plan = user.plan as ClientState['plan'];
      }
    }

    // Guest connections allowed (limited data)

    const connectionId = crypto.randomUUID();

    const state: ClientState = {
      ws,
      userId: user?.userId ?? null,
      plan,
      subscribedSymbols: new Set(),
      aiProvider: {
        providerId: user?.preferredAiProvider ?? 'gemini',
        model: user?.preferredModel ?? 'gemini-2.5-flash',
      },
      lastPing: Date.now(),
      messageCount: 0,
      windowStart: Date.now(),
      connectionId,
      connectedAt: new Date(),
      throttles: new Map(),
    };

    registry.register(ws, state);

    // ── Keepalive: 30s ping, 10s pong timeout ──
    let pongReceived = true;

    const keepaliveInterval = setInterval(() => {
      if (!pongReceived) {
        logger.warn({ connectionId, userId: state.userId }, 'Pong timeout, closing connection');
        ws.terminate();
        return;
      }
      pongReceived = false;
      ws.ping();
    }, KEEPALIVE_INTERVAL_MS);

    ws.on('pong', () => {
      pongReceived = true;
    });

    // ── Message handling ──
    ws.on('message', (data: Buffer | string) => {
      handleClientMessage(ws, data.toString(), state);
    });

    // ── Cleanup on disconnect ──
    ws.on('close', () => {
      clearInterval(keepaliveInterval);
      registry.unregister(connectionId);
    });

    ws.on('error', (err) => {
      logger.error({ err, connectionId }, 'WS connection error');
    });

    // Send guest notice if unauthenticated
    if (plan === 'guest') {
      ws.send(buildServerMessage(MessageType.AGENT_LOG, {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        agent: 'Interface Controller',
        message: 'Connected as guest. Some features require authentication.',
        level: 'INFO',
        agentProvider: 'gemini',
      }));
    }
  });
}

export { registry } from './clientState.js';
