export enum AgentRole {
  FUNDAMENTALIST = 'Fundamentalist',
  SENTIMENT = 'Sentiment Analyst',
  RISK = 'Risk Manager',
  ORCHESTRATOR = 'Interface Controller'
}

export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  SUCCESS = 'SUCCESS',
  DEBATE = 'DEBATE'
}

export interface LogEntry {
  id: string;
  timestamp: string;
  agent: AgentRole;
  message: string;
  level: LogLevel;
  providerId?: string;
}

export interface MarketPair {
  symbol: string;
  pair?: string;
  volume?: string;
  polymarketPrice: number;
  kalshiPrice: number;
  spread: number;
  trend: 'up' | 'down' | 'neutral';
}

export interface WhaleMovement {
  id: string;
  wallet: string;
  action: string;
  amount: number;
  asset: string;
  confidence: number; // 0-1
  timestamp: number;
  providerId?: string;
}

export interface AlphaHistoryPoint {
  probability: number;
  timestamp: number;
}

export interface AlphaMetric {
  probability: number; // 0-100
  trend: 'increasing' | 'decreasing' | 'stable';
  history: AlphaHistoryPoint[];
  breakdown?: {
    fundamentals: { score: number; providerId: string };
    sentiment: { score: number; providerId: string };
    risk: { score: number; providerId: string };
  };
}

export interface PnLData {
  amount: number;
  roi: number;
  tradeId: string;
  timestamp: number;
  venue?: 'Polymarket' | 'Kalshi' | 'Cross-Venue';
  asset?: string;
  side?: 'Buy' | 'Sell';
  status?: 'open' | 'closed';
  executionTime?: string; // ms
}