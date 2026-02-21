import { WebSocket } from 'ws';
import type { AIProviderSelection, AIProviderId } from './protocol.js';
import { logger } from '../lib/logger.js';

// ─── Per-Connection State ───────────────────────────────────────────────────

export interface ClientState {
  ws: WebSocket;
  userId: string | null;
  plan: 'free' | 'pro' | 'enterprise' | 'guest';
  subscribedSymbols: Set<string>;
  aiProvider: AIProviderSelection;
  lastPing: number;
  messageCount: number;
  windowStart: number;
  connectionId: string;
  connectedAt: Date;
  /** Per-symbol throttle timestamps for market price fan-out */
  throttles: Map<string, number>;
}

// ─── ConnectionRegistry (singleton) ─────────────────────────────────────────

const GUEST_INACTIVITY_MS = 30 * 60 * 1000; // 30min

class ConnectionRegistry {
  private connections = new Map<string, ClientState>();

  register(ws: WebSocket, state: ClientState): void {
    this.connections.set(state.connectionId, state);
    logger.info({ connectionId: state.connectionId, userId: state.userId, plan: state.plan }, 'WS client registered');
  }

  unregister(connectionId: string): void {
    const state = this.connections.get(connectionId);
    if (state) {
      state.subscribedSymbols.clear();
      state.throttles.clear();
      this.connections.delete(connectionId);
      logger.info({ connectionId, userId: state.userId }, 'WS client unregistered');
    }
  }

  getByConnectionId(connectionId: string): ClientState | undefined {
    return this.connections.get(connectionId);
  }

  getByUserId(userId: string): ClientState | null {
    for (const state of this.connections.values()) {
      if (state.userId === userId) return state;
    }
    return null;
  }

  getAllByUserId(userId: string): ClientState[] {
    const results: ClientState[] = [];
    for (const state of this.connections.values()) {
      if (state.userId === userId) results.push(state);
    }
    return results;
  }

  getAll(): ClientState[] {
    return Array.from(this.connections.values());
  }

  get size(): number {
    return this.connections.size;
  }

  broadcast(message: string, filter?: (state: ClientState) => boolean): void {
    for (const state of this.connections.values()) {
      if (filter && !filter(state)) continue;
      if (state.ws.readyState === WebSocket.OPEN) {
        state.ws.send(message);
      }
    }
  }

  broadcastToUser(userId: string, message: string): void {
    for (const state of this.connections.values()) {
      if (state.userId === userId && state.ws.readyState === WebSocket.OPEN) {
        state.ws.send(message);
      }
    }
  }

  /** Evict guest connections inactive for 30min */
  evictStaleGuests(): number {
    const now = Date.now();
    let evicted = 0;
    for (const [id, state] of this.connections) {
      if (state.plan === 'guest' && now - state.lastPing > GUEST_INACTIVITY_MS) {
        state.ws.close(4008, 'Guest session expired');
        this.unregister(id);
        evicted++;
      }
    }
    return evicted;
  }
}

export const registry = new ConnectionRegistry();
