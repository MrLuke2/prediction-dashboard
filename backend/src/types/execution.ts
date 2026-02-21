import { AIProviderSelection } from '../services/ai/types.js';

export type OrderSide = 'buy' | 'sell';
export type OrderVenue = 'polymarket' | 'kalshi';

export interface OrderParams {
  userId: string;
  marketPairId: string;
  venue: OrderVenue;
  side: OrderSide;
  size: number;
  maxSlippage: number;
  price?: number;
  aiProvider: AIProviderSelection;
  aiConfidence: number;
}

export interface OrderResult {
  orderId: string;
  externalOrderId?: string;
  status: 'pending' | 'submitted' | 'filled' | 'failed';
  error?: string;
}

export interface ArbOpportunity {
  marketPairId: string;
  polymarketPrice: number;
  kalshiPrice: number;
  spread: number;
  expectedProfit: number;
  aiProvider: AIProviderSelection;
  aiConfidence: number;
}
