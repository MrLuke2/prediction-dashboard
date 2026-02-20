import axios from 'axios';
import WebSocket from 'ws';
import { EventEmitter } from 'events';
import { logger } from '../../lib/logger.js';
import { config } from '../../config.js';

interface PolymarketMarket {
  ticker: string;
  slug: string;
  question: string;
  description: string;
  endDate: string;
  // Add other required fields from API response
}

export class PolymarketClient extends EventEmitter {
  private baseUrl = 'https://clob.polymarket.com'; // Using CLOB API base URL as example
  private wsUrl = 'wss://ws-gemini.polymarket.com'; // Example WS URL, verify documentation
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxRetries = 5;
  private subscriptions: Set<string> = new Set();
  
  constructor() {
    super();
    // this.connectWs(); // Connect on demand or init? Ideally explicit start.
  }

  // Fetch paginated active markets
  async fetchMarkets(limit = 20, cursor?: string): Promise<{ data: any[], nextCursor?: string }> {
    try {
      // NOTE: Using a simplified endpoint for demonstration. real endpoint: /markets?active=true
      const response = await axios.get(`${this.baseUrl}/markets`, {
        params: { limit, next_cursor: cursor, active: true },
        timeout: 5000
      });
      return response.data;
    } catch (error) {
      logger.error({ error }, 'Polymarket fetchMarkets failed');
      throw error;
    }
  }

  // Fetch single market price (yes/no)
  async fetchMarketPrice(slug: string): Promise<{ yes: number; no: number } | null> {
    try {
      // Typically getting by condition_id or token_id. Assuming slug lookup first or passed ID.
      // For this task, assuming slug maps to a fetchable entity.
      // Using a hypothetical endpoint or direct lookup if we had IDs.
      // Often requires resolving slug to conditionId via Gamma API (https://gamma-api.polymarket.com/markets?slug=...)
      // Switching to Gamma API for market data which is better for reading.
      const gammaUrl = 'https://gamma-api.polymarket.com/markets';
      const response = await axios.get(gammaUrl, {
        params: { slug },
        timeout: 5000
      });
      
      const market = response.data[0]; // array
      if (!market || !market.outcomePrices) return null;

      // JSON string usually: "[\"0.65\", \"0.35\"]"
      const prices = JSON.parse(market.outcomePrices);
      return {
        yes: parseFloat(prices[0]), 
        no: parseFloat(prices[1])
      };
    } catch (error) {
      logger.error({ error, slug }, 'Polymarket fetchMarketPrice failed');
      return null;
    }
  }

  connectWs() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return;

    this.ws = new WebSocket(this.wsUrl);

    this.ws.on('open', () => {
      logger.info('Polymarket WS Connected');
      this.reconnectAttempts = 0;
      this.resubscribe();
    });

    this.ws.on('message', (data: WebSocket.Data) => {
        // Parse CLOB message
        // Emit 'price_update'
        try {
            const msg = JSON.parse(data.toString());
            // Handle specific message types (orderbook, trade, etc.)
            // Assuming simplified emit for now
            this.emit('message', msg);
        } catch (err) {
            // ignore malformed
        }
    });

    this.ws.on('close', () => {
      logger.warn('Polymarket WS Closed');
      this.handleReconnect();
    });

    this.ws.on('error', (err) => {
      logger.error({ err }, 'Polymarket WS Error');
    });
  }

  subscribeToMarket(slug: string, callback: (data: any) => void) {
    this.subscriptions.add(slug);
    // In reality, we need asset_id or token_id to subscribe to CLOB channel
    // We would send: { type: "subscribe", channel: "price", market: slug }
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'subscribe', assets: [slug] })); // Example payload
    } else {
        this.connectWs();
    }
    
    // Bind callback to internal event emitter for this slug
    this.on('price_update', (update) => {
        if (update.slug === slug) callback(update);
    });
  }

  private resubscribe() {
      // Re-send all subscriptions
      if (this.subscriptions.size > 0 && this.ws?.readyState === WebSocket.OPEN) {
          const assets = Array.from(this.subscriptions);
          this.ws.send(JSON.stringify({ type: 'subscribe', assets }));
      }
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxRetries) {
      logger.error('Polymarket WS Max Retries Exceeded');
      return;
    }

    const delay = Math.pow(2, this.reconnectAttempts) * 1000;
    this.reconnectAttempts++;
    logger.info(`Reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
    setTimeout(() => this.connectWs(), delay);
  }
}
