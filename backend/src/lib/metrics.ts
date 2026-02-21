import { Registry, Counter, Gauge, Histogram, collectDefaultMetrics } from 'prom-client';
import { FastifyInstance, FastifyRequest } from 'fastify';

const register = new Registry();
collectDefaultMetrics({ register });

// --- Core Metrics ---
export const http_request_duration_ms = new Histogram({
  name: 'http_request_duration_ms',
  help: 'HTTP request duration in ms',
  labelNames: ['route', 'status', 'method'],
  buckets: [10, 50, 100, 250, 500, 1000, 2500, 5000],
  registers: [register],
});

export const ws_connections_active = new Gauge({
  name: 'ws_connections_active',
  help: 'Number of active WebSocket connections',
  registers: [register],
});

export const ws_messages_total = new Counter({
  name: 'ws_messages_total',
  help: 'Total number of WebSocket messages processed',
  labelNames: ['direction', 'type'],
  registers: [register],
});

// --- AI Metrics ---
export const ai_requests_total = new Counter({
  name: 'ai_requests_total',
  help: 'Total number of AI requests',
  labelNames: ['provider', 'model', 'agent'],
  registers: [register],
});

export const ai_latency_ms = new Histogram({
  name: 'ai_latency_ms',
  help: 'AI request latency in ms',
  labelNames: ['provider', 'model'],
  registers: [register],
});

export const ai_tokens_used_total = new Counter({
  name: 'ai_tokens_used_total',
  help: 'Total AI tokens used',
  labelNames: ['provider', 'model', 'type'], // type: input | output
  registers: [register],
});

export const ai_cost_usd_total = new Counter({
  name: 'ai_cost_usd_total',
  help: 'Total AI cost in USD',
  labelNames: ['provider'],
  registers: [register],
});

export const ai_fallback_total = new Counter({
  name: 'ai_fallback_total',
  help: 'Total AI provider fallbacks',
  labelNames: ['from_provider', 'to_provider'],
  registers: [register],
});

export const ai_budget_exceeded_total = new Counter({
  name: 'ai_budget_exceeded_total',
  help: 'Total number of AI budget exceed events',
  registers: [register],
});

// --- Market Metrics ---
export const arb_opportunities_detected_total = new Counter({
  name: 'arb_opportunities_detected_total',
  help: 'Total arbitrage opportunities detected',
  labelNames: ['symbol'],
  registers: [register],
});

export const avg_spread_pct = new Gauge({
  name: 'avg_spread_pct',
  help: 'Average spread percentage',
  labelNames: ['symbol'],
  registers: [register],
});

export const price_sync_latency_ms = new Histogram({
  name: 'price_sync_latency_ms',
  help: 'Market price sync latency in ms',
  registers: [register],
});

// --- Execution Metrics ---
export const trades_executed_total = new Counter({
  name: 'trades_executed_total',
  help: 'Total trades executed',
  labelNames: ['venue', 'provider'],
  registers: [register],
});

export const emergency_stops_total = new Counter({
  name: 'emergency_stops_total',
  help: 'Total emergency stops triggered',
  registers: [register],
});

export const active_positions_gauge = new Gauge({
  name: 'active_positions',
  help: 'Current number of active trading positions',
  registers: [register],
});

// --- Whale Metrics ---
export const whale_movements_detected_total = new Counter({
  name: 'whale_movements_detected_total',
  help: 'Total whale movements detected',
  registers: [register],
});

export const blocks_scanned_total = new Counter({
  name: 'blocks_scanned_total',
  help: 'Total blocks scanned by whale detector',
  registers: [register],
});

// --- Fastify Plugin ---
export async function setupMetrics(fastify: FastifyInstance) {
  fastify.get('/metrics', async (request, reply) => {
    // Basic IP allowlist for internal access
    const ip = request.ip;
    const isInternal = ip === '127.0.0.1' || ip === '::1' || ip.startsWith('10.');
    
    if (process.env.NODE_ENV === 'production' && !isInternal) {
      return reply.code(403).send({ error: 'Internal access only' });
    }

    reply.header('Content-Type', register.contentType);
    return register.metrics();
  });
}
