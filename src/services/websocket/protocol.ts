import { AIProviderId, AIProviderSelection } from '../../config/aiProviders';
import { MarketPair, WhaleMovement, AlphaMetric, PnLData, LogEntry } from '../../types';

export type MessageType = 
  | 'MARKET_UPDATE' 
  | 'WHALE_ALERT' 
  | 'AGENT_LOG' 
  | 'ALPHA_UPDATE' 
  | 'TRADE_UPDATE' 
  | 'PONG' 
  | 'ERROR'
  | 'SUBSCRIBE_MARKET'
  | 'UNSUBSCRIBE_MARKET'
  | 'PING'
  | 'SET_AI_PROVIDER';

export interface WSMessage<T = any> {
  type: MessageType;
  payload: T;
  ts: number;
}

// --- Payload Types ---

export interface TradeUpdate {
  symbol: string;
  price: number;
  size: number;
  side: 'buy' | 'sell';
  pnl?: number;
}

export interface AgentLog extends LogEntry {
  agentProvider: AIProviderId;
}

export interface AlphaMetricUpdate extends AlphaMetric {
  generatedBy: AIProviderId;
}

// --- Protocol Definitions ---

export const createMessage = <T>(type: MessageType, payload: T): WSMessage<T> => ({
  type,
  payload,
  ts: Date.now()
});

/**
 * Basic validation schemas (mimicking Zod intent without the dependency)
 */
export const Schemas = {
  WSMessage: (data: any): data is WSMessage => {
    return (
      data &&
      typeof data.type === 'string' &&
      data.payload !== undefined &&
      typeof data.ts === 'number'
    );
  },
  
  isMarketUpdate: (msg: WSMessage): msg is WSMessage<MarketPair> => 
    msg.type === 'MARKET_UPDATE',
  
  isWhaleAlert: (msg: WSMessage): msg is WSMessage<WhaleMovement> => 
    msg.type === 'WHALE_ALERT',
    
  isAgentLog: (msg: WSMessage): msg is WSMessage<AgentLog> => 
    msg.type === 'AGENT_LOG',
    
  isAlphaUpdate: (msg: WSMessage): msg is WSMessage<AlphaMetricUpdate> => 
    msg.type === 'ALPHA_UPDATE',
    
  isTradeUpdate: (msg: WSMessage): msg is WSMessage<TradeUpdate> => 
    msg.type === 'TRADE_UPDATE',
    
  isPong: (msg: WSMessage): msg is WSMessage<{ ts: number }> => 
    msg.type === 'PONG',
    
  isError: (msg: WSMessage): msg is WSMessage<{ code: string, message: string }> => 
    msg.type === 'ERROR'
};
