import { config } from '../../config.js';
import { logger } from '../../lib/logger.js';
import type { MarketPrice } from './types.js';

const GAMMA_API = 'https://gamma-api.polymarket.com';
const CLOB_API = 'https://clob.polymarket.com';
const CLOB_WS = 'wss://ws-subscriptions-clob.polymarket.com/ws/market';

const REQUEST_TIMEOUT = 8_000;
const MAX_RETRIES = 5;

export class PolymarketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private subscriptions = new Map<string, (price: MarketPrice) => void>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  /** Fetch paginated active markets from Gamma API */
  async fetchMarkets(limit = 50, offset = 0): Promise<any[]> {
    try {
      const url = `${GAMMA_API}/markets?limit=${limit}&offset=${offset}&active=true&closed=false`;
      const res = await fetch(url, {
        headers: this.headers(),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT),
      });

      if (!res.ok) {
        logger.warn({ status: res.status }, 'Polymarket fetchMarkets non-OK');
        return [];
      }

      return await res.json() as any[];
    } catch (err) {
      logger.error({ err }, 'Polymarket fetchMarkets failed');
      return [];
    }
  }

  /** Fetch price for a single market by slug */
  async fetchMarketPrice(slug: string): Promise<MarketPrice | null> {
    if (!slug) return null;

    try {
      const url = `${GAMMA_API}/markets?slug=${encodeURIComponent(slug)}`;
      const res = await fetch(url, {
        headers: this.headers(),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT),
      });

      if (!res.ok) return null;

      const markets = await res.json() as any[];
      const market = markets[0];
      if (!market?.outcomePrices) return null;

      const prices = JSON.parse(market.outcomePrices);
      const volume = parseFloat(market.volume24hr ?? market.volume ?? '0');

      return {
        yes: parseFloat(prices[0]),
        no: parseFloat(prices[1]),
        volume24h: volume,
        source: 'polymarket',
        timestamp: Date.now(),
      };
    } catch (err) {
      logger.error({ err, slug }, 'Polymarket fetchMarketPrice failed');
      return null;
    }
  }

  /** Subscribe to real-time price updates via CLOB WebSocket */
  subscribeToMarket(slug: string, cb: (price: MarketPrice) => void): void {
    this.subscriptions.set(slug, cb);

    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.connectWs();
    } else {
      this.sendSubscribe(slug);
    }
  }

  /** Unsubscribe from a market */
  unsubscribe(slug: string): void {
    this.subscriptions.delete(slug);
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'unsubscribe', assets: [slug] }));
    }
  }

  /** Disconnect WebSocket cleanly */
  disconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectAttempts = MAX_RETRIES; // prevent reconnect
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  // ── Internal ──────────────────────────────────────────────────────────

  private connectWs(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return;

    try {
      this.ws = new WebSocket(CLOB_WS);
    } catch (err) {
      logger.error({ err }, 'Polymarket WS construction failed');
      this.scheduleReconnect();
      return;
    }

    this.ws.addEventListener('open', () => {
      logger.info('Polymarket WS connected');
      this.reconnectAttempts = 0;
      for (const slug of this.subscriptions.keys()) {
        this.sendSubscribe(slug);
      }
    });

    this.ws.addEventListener('message', (event) => {
      try {
        const msg = JSON.parse(typeof event.data === 'string' ? event.data : event.data.toString());
        // Translate CLOB message to MarketPrice — structure varies by channel
        if (msg.market || msg.asset_id) {
          const slug = msg.market ?? msg.asset_id;
          const cb = this.subscriptions.get(slug);
          if (cb && msg.price !== undefined) {
            cb({
              yes: parseFloat(msg.price),
              no: 1 - parseFloat(msg.price),
              volume24h: parseFloat(msg.size ?? '0'),
              source: 'polymarket',
              timestamp: Date.now(),
            });
          }
        }
      } catch {
        // Ignore malformed WS messages
      }
    });

    this.ws.addEventListener('close', () => {
      logger.warn('Polymarket WS closed');
      this.scheduleReconnect();
    });

    this.ws.addEventListener('error', () => {
      logger.warn('Polymarket WS error');
    });
  }

  private sendSubscribe(slug: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'subscribe', assets: [slug] }));
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= MAX_RETRIES) {
      logger.error('Polymarket WS max retries exceeded');
      return;
    }
    const delay = Math.pow(2, this.reconnectAttempts) * 1000; // 1s, 2s, 4s, 8s, 16s
    this.reconnectAttempts++;
    logger.info({ attempt: this.reconnectAttempts, delay }, 'Polymarket WS reconnecting…');
    this.reconnectTimer = setTimeout(() => this.connectWs(), delay);
  }

  private headers(): Record<string, string> {
    const h: Record<string, string> = { 'Accept': 'application/json' };
    if (config.POLYMARKET_API_KEY) {
      h['Authorization'] = `Bearer ${config.POLYMARKET_API_KEY}`;
    }
    return h;
  }
}
