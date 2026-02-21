import { config } from '../../config.js';
import { logger } from '../../lib/logger.js';
import type { MarketPrice } from './types.js';

const KALSHI_API = 'https://api.elections.kalshi.com/trade-api/v2';

const REQUEST_TIMEOUT = 8_000;

export class KalshiClient {
  private pollingIntervals = new Map<string, ReturnType<typeof setInterval>>();
  private pollRate = 500; // 500ms per prompt spec

  /** Fetch paginated active markets */
  async fetchMarkets(limit = 50, cursor?: string): Promise<any[]> {
    try {
      const params = new URLSearchParams({ limit: String(limit), status: 'open' });
      if (cursor) params.set('cursor', cursor);

      const res = await fetch(`${KALSHI_API}/markets?${params}`, {
        headers: this.headers(),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT),
      });

      if (!res.ok) {
        logger.warn({ status: res.status }, 'Kalshi fetchMarkets non-OK');
        return [];
      }

      const data = await res.json() as any;
      return data.markets ?? data.events ?? [];
    } catch (err) {
      logger.error({ err }, 'Kalshi fetchMarkets failed');
      return [];
    }
  }

  /** Fetch price for a single market by ticker */
  async fetchMarketPrice(ticker: string): Promise<MarketPrice | null> {
    if (!ticker) return null;

    try {
      const res = await fetch(`${KALSHI_API}/markets/${encodeURIComponent(ticker)}`, {
        headers: this.headers(),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT),
      });

      if (!res.ok) return null;

      const data = await res.json() as any;
      const market = data.market ?? data;
      if (!market) return null;

      // Kalshi prices: yes_ask is 0-100 cents → normalize to 0-1
      const yesCents = market.yes_ask ?? market.yes_price ?? market.last_price ?? 0;
      const yesNorm = yesCents > 1 ? yesCents / 100 : yesCents;
      const volume = parseFloat(market.volume_24h ?? market.volume ?? '0');

      return {
        yes: yesNorm,
        no: 1 - yesNorm,
        volume24h: volume,
        source: 'kalshi',
        timestamp: Date.now(),
      };
    } catch (err) {
      logger.error({ err, ticker }, 'Kalshi fetchMarketPrice failed');
      return null;
    }
  }

  /** Poll a market at 500ms intervals (Kalshi has no public WebSocket) */
  subscribeToMarket(ticker: string, callback: (price: MarketPrice) => void): void {
    if (this.pollingIntervals.has(ticker)) return;

    const interval = setInterval(async () => {
      try {
        const price = await this.fetchMarketPrice(ticker);
        if (price) callback(price);
      } catch {
        // Swallow — don't crash the interval
      }
    }, this.pollRate);

    this.pollingIntervals.set(ticker, interval);
  }

  /** Stop polling a market */
  unsubscribe(ticker: string): void {
    const interval = this.pollingIntervals.get(ticker);
    if (interval) {
      clearInterval(interval);
      this.pollingIntervals.delete(ticker);
    }
  }

  /** Stop all polling */
  disconnectAll(): void {
    for (const [ticker] of this.pollingIntervals) {
      this.unsubscribe(ticker);
    }
  }

  // ── Internal ──────────────────────────────────────────────────────────

  private headers(): Record<string, string> {
    const h: Record<string, string> = { 'Accept': 'application/json' };
    if (config.KALSHI_API_KEY) {
      h['Authorization'] = `Bearer ${config.KALSHI_API_KEY}`;
    }
    return h;
  }
}
