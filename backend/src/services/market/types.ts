/** Shared market data types used across market services */

export interface MarketPrice {
  yes: number;       // 0-1 probability
  no: number;        // 0-1 probability
  volume24h: number; // USD volume
  source: 'polymarket' | 'kalshi';
  timestamp: number; // epoch ms
}

export interface SpreadResult {
  spread: number;                                       // absolute cents
  spreadPct: number;                                    // percentage
  direction: 'poly_higher' | 'kalshi_higher' | 'neutral';
  arbSignal: boolean;                                   // true when > ARB_THRESHOLD
  confidence: number;                                   // 0-100
  polyPrice: number;
  kalshiPrice: number;
}

export interface MarketSnapshot {
  marketPairId: string;
  symbol: string;
  polymarketPrice: number | null;
  kalshiPrice: number | null;
  spread: SpreadResult | null;
  volume24h: number;
  timestamp: number;
}
