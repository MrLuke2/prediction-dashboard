import axios from 'axios';
import { logger } from '../../lib/logger.js';
import { EventEmitter } from 'events';

export class KalshiClient extends EventEmitter {
  private baseUrl = 'https://api.elections.kalshi.com/v1'; // Example API URL
  private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
  private pollRate = 500; // 500ms

  async fetchMarkets(limit = 20): Promise<any[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/events`, {
        params: { limit, status: 'open' },
        timeout: 5000
      });
      return response.data.events;
    } catch (error) {
      logger.error({ error }, 'Kalshi fetchMarkets failed');
      return [];
    }
  }

  async fetchMarketPrice(ticker: string): Promise<{ yes: number; no: number } | null> {
    try {
      // ticker often maps to 'market_ticker' or 'series_ticker'
      const response = await axios.get(`${this.baseUrl}/markets/${ticker}`, {
        timeout: 5000
      });
      
      const market = response.data.market;
      if (!market) return null;

      // Kalshi yes_price is 0-99 usually or 0.00-0.99
      return {
        yes: market.yes_ask / 100, // Normalize to 0-1
        no: market.no_ask / 100
      };
    } catch (error) {
      logger.error({ error, ticker }, 'Kalshi fetchMarketPrice failed');
      return null;
    }
  }

  subscribeToMarket(ticker: string, callback: (price: object) => void) {
    if (this.pollingIntervals.has(ticker)) {
      // Already polling, add callback listener? 
      // Simplified: Just emit event for this ticker centrally
      this.on(`price_update:${ticker}`, callback);
      return; 
    }

    const interval = setInterval(async () => {
      const price = await this.fetchMarketPrice(ticker);
      if (price) {
        callback(price);
        this.emit(`price_update:${ticker}`, price);
      }
    }, this.pollRate);

    this.pollingIntervals.set(ticker, interval);
    this.on(`price_update:${ticker}`, callback);
  }

  unsubscribe(ticker: string) {
    const interval = this.pollingIntervals.get(ticker);
    if (interval) {
      clearInterval(interval);
      this.pollingIntervals.delete(ticker);
      this.removeAllListeners(`price_update:${ticker}`);
    }
  }
}
