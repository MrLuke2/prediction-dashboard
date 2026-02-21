import { FastifyInstance, FastifyRequest } from 'fastify';
import { WebSocket } from 'ws';
import crypto from 'crypto';
import { verifyToken, JWTPayload } from '../lib/jwt.js';
import { connections, ClientState } from './client-state.js';
import { WS_CLIENT_MESSAGES, SubscribeMarketPayload, UnsubscribeMarketPayload } from './protocol.js';
import { logger } from '../lib/logger.js';
import { initMarketPricesChannel } from './channels/market-prices.channel.js';
import { initWhaleRadarChannel } from './channels/whale-radar.channel.js';
import { initAgentFeedChannel } from './channels/agent-feed.channel.js';
import { initAlphaMetricChannel } from './channels/alpha-metric.channel.js';

// Init Channels once
let channelsInitialized = false;

export default async function wsRoutes(fastify: FastifyInstance) {

  if (!channelsInitialized) {
    await initMarketPricesChannel();
    await initWhaleRadarChannel();
    await initAgentFeedChannel();
    await initAlphaMetricChannel();
    channelsInitialized = true;
  }

  fastify.get('/ws', { websocket: true }, (connection, req: FastifyRequest) => {
    const ws = connection.socket;
    
    // Auth Check
    // Query param `?token=...` or Cookie `access_token`?
    // User task says "Authenticate on upgrade via JWT query param or cookie".
    // We can check `req.query.token` or `req.cookies.access_token` (if we had one, usually only refresh in cookie).
    // Let's assume `?token=ACCESS_TOKEN`.
    
    const query = req.query as { token?: string };
    let user: JWTPayload | null = null;
    
    if (query.token) {
        user = verifyToken(query.token);
    }
    
    if (!user) {
        ws.close(1008, 'Unauthorized');
        return;
    }

    const connectionId = crypto.randomUUID();
    
    const state: ClientState = {
        ws,
        userId: user.userId,
        email: user.email,
        plan: user.plan as any,
        subscribedSymbols: new Set(),
        lastPing: Date.now(),
        messageCount: 0,
        windowStart: Date.now()
    };
    
    connections.set(connectionId, state);
    logger.info({ userId: user.userId, connectionId }, 'WS Client Connected');

    // Keepalive Ping
    const pingInterval = setInterval(() => {
        if (ws.readyState === ws.OPEN) {
            ws.ping();
            // Check last Pong? Simplified: client sends PING, we send PONG. 
            // Or we send PING, client PONGs. `ws` handles standard ping/pong frames often.
            // Requirement: "Handle ping/pong keepalive (30s interval)".
            // We can send protocol PING to keep app level alive too.
        }
    }, 30000);

    ws.on('message', (data: string) => { // Buffer or String
        try {
            // Rate Limit Check
            const now = Date.now();
            if (now - state.windowStart > 60000) {
                state.messageCount = 0;
                state.windowStart = now;
            }
            state.messageCount++;
            if (state.messageCount > 50) {
               // Limit exceeded
               ws.send(JSON.stringify({ type: 'ERROR', payload: { message: 'Rate limit exceeded' } }));
               return;
            }

            const msg = JSON.parse(data.toString());
            
            switch (msg.type) {
                case WS_CLIENT_MESSAGES.SUBSCRIBE_MARKET: {
                    // Start Zod
                    const payload = SubscribeMarketPayload.parse(msg.payload);
                    // Check limit
                    if (state.plan === 'free' && state.subscribedSymbols.size >= 10) {
                        if (!state.subscribedSymbols.has(payload.symbol)) {
                             ws.send(JSON.stringify({ type: 'ERROR', payload: { message: 'Free plan limit: 10 symbols' } }));
                             return;
                        }
                    }
                    state.subscribedSymbols.add(payload.symbol);
                    // Ack?
                    break;
                }
                case WS_CLIENT_MESSAGES.UNSUBSCRIBE_MARKET: {
                    const payload = UnsubscribeMarketPayload.parse(msg.payload);
                    state.subscribedSymbols.delete(payload.symbol);
                    break;
                }
                case WS_CLIENT_MESSAGES.PING: {
                    ws.send(JSON.stringify({ type: 'PONG', ts: Date.now() }));
                    state.lastPing = Date.now();
                    break;
                }
                default:
                    // log unknown
            }
        } catch (err) {
            // Zod error or JSON error
            ws.send(JSON.stringify({ type: 'ERROR', payload: { message: 'Invalid message format' } }));
        }
    });

    ws.on('close', () => {
        clearInterval(pingInterval);
        connections.delete(connectionId);
        logger.info({ userId: state.userId }, 'WS Client Disconnected');
    });
    
    ws.on('error', (err) => {
        logger.error({ err }, 'WS Connection Error');
    });
  });
}
