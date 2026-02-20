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
  SUCCESS = 'SUCCESS'
}

export interface LogEntry {
  id: string;
  timestamp: string;
  agent: AgentRole;
  message: string;
  level: LogLevel;
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
}

export interface AlphaMetric {
  probability: number; // 0-100
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface PnLData {
  amount: number;
  roi: number;
  tradeId: string;
  timestamp: number;
}