import { WebSocket } from 'ws';

export interface ClientState {
  ws: WebSocket;
  userId: string;
  email: string;
  plan: 'free' | 'pro' | 'enterprise';
  subscribedSymbols: Set<string>;
  lastPing: number;
  messageCount: number; // For rate limiting
  windowStart: number;
}

export const activeClients = new Map<string, ClientState>(); // userId -> State
// Or connectionId -> State if one user multiple tabs.
// Ideally usage: connectionId (uuid).
export const connections = new Map<string, ClientState>(); // connectionId -> State
