import { AIProviderId, AIProviderSelection } from '../../config/aiProviders';
import { MarketPair, WhaleMovement, LogEntry, AlphaMetric, PnLData } from '../../types';

export enum MessageType {
  // Server -> Client
  MARKET_UPDATE = 'MARKET_UPDATE',
  WHALE_ALERT = 'WHALE_ALERT',
  AGENT_LOG = 'AGENT_LOG',
  ALPHA_UPDATE = 'ALPHA_UPDATE',
  TRADE_UPDATE = 'TRADE_UPDATE',
  PONG = 'PONG',
  ERROR = 'ERROR',
  EMERGENCY_STOP = 'EMERGENCY_STOP',

  // Client -> Server
  SUBSCRIBE_MARKET = 'SUBSCRIBE_MARKET',
  UNSUBSCRIBE_MARKET = 'UNSUBSCRIBE_MARKET',
  PING = 'PING',
  SET_AI_PROVIDER = 'SET_AI_PROVIDER'
}

export interface BaseMessage {
  type: MessageType;
  payload: any;
  ts: number;
}

// Server -> Client Messages
export interface MarketUpdateMessage extends BaseMessage {
  type: MessageType.MARKET_UPDATE;
  payload: MarketPair;
}

export interface WhaleAlertMessage extends BaseMessage {
  type: MessageType.WHALE_ALERT;
  payload: WhaleMovement;
}

export interface AgentLogMessage extends BaseMessage {
  type: MessageType.AGENT_LOG;
  payload: LogEntry & { agentProvider: AIProviderId };
}

export interface AlphaUpdateMessage extends BaseMessage {
  type: MessageType.ALPHA_UPDATE;
  payload: AlphaMetric & { generatedBy: AIProviderId };
}

export interface TradeUpdateMessage extends BaseMessage {
  type: MessageType.TRADE_UPDATE;
  payload: PnLData;
}

export interface PongMessage extends BaseMessage {
  type: MessageType.PONG;
  payload: { ts: number };
}

export interface ErrorMessage extends BaseMessage {
  type: MessageType.ERROR;
  payload: { code: string; message: string };
}

export interface EmergencyStopMessage extends BaseMessage {
  type: MessageType.EMERGENCY_STOP;
  payload: { reason: string; tradesAffected: number; timestamp: string };
}

// Client -> Server Messages
export interface SubscribeMarketMessage extends BaseMessage {
  type: MessageType.SUBSCRIBE_MARKET | MessageType.UNSUBSCRIBE_MARKET;
  payload: { symbol: string };
}

export interface SetAIProviderMessage extends BaseMessage {
  type: MessageType.SET_AI_PROVIDER;
  payload: AIProviderSelection;
}

export interface PingMessage extends BaseMessage {
  type: MessageType.PING;
  payload: { ts: number };
}

export type ServerMessage = 
  | MarketUpdateMessage 
  | WhaleAlertMessage 
  | AgentLogMessage 
  | AlphaUpdateMessage 
  | TradeUpdateMessage 
  | PongMessage 
  | ErrorMessage
  | EmergencyStopMessage;

export type ClientMessage = 
  | SubscribeMarketMessage 
  | SetAIProviderMessage 
  | PingMessage;

// Manual Type Guards (In place of Zod)
export function isServerMessage(data: any): data is ServerMessage {
  return !!(data && typeof data.type === 'string' && data.type in MessageType);
}

export function isValidPayload(type: MessageType, payload: any): boolean {
  if (!payload) return false;
  switch (type) {
    case MessageType.MARKET_UPDATE:
      return typeof payload.symbol === 'string' && typeof payload.polymarketPrice === 'number';
    case MessageType.WHALE_ALERT:
      return typeof payload.id === 'string' && typeof payload.symbol === 'string';
    case MessageType.AGENT_LOG:
      return typeof payload.id === 'string' && typeof payload.message === 'string';
    case MessageType.ALPHA_UPDATE:
      return typeof payload.probability === 'number';
    case MessageType.TRADE_UPDATE:
      return typeof payload.tradeId === 'string';
    case MessageType.PONG:
    case MessageType.PING:
      return typeof payload.ts === 'number';
    case MessageType.ERROR:
      return typeof payload.code === 'string' && typeof payload.message === 'string';
    case MessageType.EMERGENCY_STOP:
      return typeof payload.reason === 'string' && typeof payload.tradesAffected === 'number';
    default:
      return true;
  }
}
