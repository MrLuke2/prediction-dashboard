import { MessageType, ClientMessage, ServerMessage } from './protocol';

type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';
type MessageHandler = (payload: any) => void;

export class WebSocketClient {
  private socket: WebSocket | null = null;
  private url: string;
  private getToken: () => string | null;
  private state: ConnectionState = 'disconnected';
  private handlers: Map<MessageType, Set<MessageHandler>> = new Map();
  private messageQueue: string[] = [];
  private reconnectAttempts = 0;
  private maxBackoff = 30000;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private pongTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(url: string, getToken: () => string | null) {
    this.url = url;
    this.getToken = getToken;
  }

  public connect() {
    if (this.socket || this.state === 'connecting') return;

    this.state = 'connecting';
    this.socket = new WebSocket(this.url);

    this.socket.onopen = () => {
      console.log('[WS] Connected');
      this.state = 'connected';
      this.reconnectAttempts = 0;
      this.processQueue();
      this.startHeartbeat();
      this.emit('connected', null);
    };

    this.socket.onclose = () => {
      console.log('[WS] Disconnected');
      this.socket = null;
      this.state = 'disconnected';
      this.stopHeartbeat();
      this.scheduleReconnect();
      this.emit('disconnected', null);
    };

    this.socket.onerror = (error) => {
      console.error('[WS] Error:', error);
      this.state = 'error';
      this.emit('error', error);
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const { type, payload } = data;
        
        if (type === MessageType.PONG) {
          if (this.pongTimeout) clearTimeout(this.pongTimeout);
        } else if (type in MessageType) {
          this.notifyHandlers(type as MessageType, payload);
        } else {
          console.warn('[WS] Received unknown message type:', type);
        }
      } catch (e) {
        console.error('[WS] Failed to parse message:', e);
      }
    };
  }

  public disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.stopHeartbeat();
  }

  public send(type: MessageType, payload: any) {
    const message: ClientMessage = {
      type: type as any,
      payload,
      ts: Date.now()
    };
    const json = JSON.stringify(message);

    if (this.state === 'connected' && this.socket) {
      this.socket.send(json);
    } else {
      this.messageQueue.push(json);
    }
  }

  public on(type: MessageType | string, handler: MessageHandler) {
    const t = type as MessageType;
    if (!this.handlers.has(t)) {
      this.handlers.set(t, new Set());
    }
    this.handlers.get(t)!.add(handler);

    return () => {
      this.handlers.get(t)?.delete(handler);
    };
  }

  private notifyHandlers(type: MessageType, payload: any) {
    this.handlers.get(type)?.forEach(handler => handler(payload));
  }

  private emit(event: string, data: any) {
    // Custom internal events like 'connected'
    (this.handlers.get(event as any) || []).forEach((handler: any) => handler(data));
  }

  private processQueue() {
    while (this.messageQueue.length > 0 && this.state === 'connected' && this.socket) {
      const msg = this.messageQueue.shift();
      if (msg) this.socket.send(msg);
    }
  }

  private scheduleReconnect() {
    const backoff = Math.min(1000 * Math.pow(2, this.reconnectAttempts), this.maxBackoff);
    this.reconnectAttempts++;
    console.log(`[WS] Reconnecting in ${backoff}ms...`);
    setTimeout(() => this.connect(), backoff);
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      this.send(MessageType.PING, { ts: Date.now() });
      this.pongTimeout = setTimeout(() => {
        console.warn('[WS] Heartbeat timeout, reconnecting...');
        this.disconnect();
        this.connect();
      }, 10000);
    }, 30000);
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    if (this.pongTimeout) clearTimeout(this.pongTimeout);
    this.heartbeatInterval = null;
    this.pongTimeout = null;
  }

  public getState() {
    return this.state;
  }
}
