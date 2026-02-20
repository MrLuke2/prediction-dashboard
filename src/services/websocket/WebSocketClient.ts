import { MessageType, WSMessage, createMessage } from './protocol';

export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';
type MessageHandler = (payload: any) => void;

export class WebSocketClient {
  private socket: WebSocket | null = null;
  private url: string;
  private getToken: () => string | null;
  private state: ConnectionState = 'disconnected';
  private handlers: Map<MessageType, Set<MessageHandler>> = new Map();
  private messageQueue: WSMessage[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = Infinity;
  private baseReconnectDelay = 1000;
  private maxReconnectDelay = 30000;
  private pingInterval: number | null = null;
  private pongTimeout: number | null = null;
  private onStateChange: (state: ConnectionState) => void;

  constructor(
    url: string, 
    getToken: () => string | null,
    onStateChange: (state: ConnectionState) => void
  ) {
    this.url = url;
    this.getToken = getToken;
    this.onStateChange = onStateChange;
  }

  public connect() {
    if (this.socket || this.state === 'connecting') return;

    this.setState('connecting');
    
    try {
      const token = this.getToken();
      const connectionUrl = token ? `${this.url}?token=${token}` : this.url;
      
      this.socket = new WebSocket(connectionUrl);
      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onerror = this.handleError.bind(this);
    } catch (error) {
      console.error('[WS] Connection error:', error);
      this.setState('error');
      this.scheduleReconnect();
    }
  }

  public disconnect() {
    this.stopHeartbeat();
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.setState('disconnected');
  }

  public send(type: MessageType, payload: any) {
    const message = createMessage(type, payload);
    
    if (this.state === 'connected' && this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      this.messageQueue.push(message);
    }
  }

  public on(type: MessageType, handler: MessageHandler) {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);
    
    return () => {
      this.handlers.get(type)?.delete(handler);
    };
  }

  public getState() {
    return this.state;
  }

  private setState(state: ConnectionState) {
    this.state = state;
    this.onStateChange(state);
  }

  private handleOpen() {
    console.log('[WS] Connected');
    this.setState('connected');
    this.reconnectAttempts = 0;
    this.startHeartbeat();
    this.flushQueue();
  }

  private handleMessage(event: MessageEvent) {
    try {
      const message: WSMessage = JSON.parse(event.data);
      
      if (message.type === 'PONG') {
        this.handlePong();
        return;
      }

      this.handlers.get(message.type)?.forEach(handler => handler(message.payload));
    } catch (error) {
      console.error('[WS] Message parsing error:', error);
    }
  }

  private handleClose() {
    console.log('[WS] Closed');
    this.socket = null;
    this.setState('disconnected');
    this.stopHeartbeat();
    this.scheduleReconnect();
  }

  private handleError(error: Event) {
    console.error('[WS] Error:', error);
    this.setState('error');
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;

    const delay = Math.min(
      this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts),
      this.maxReconnectDelay
    );

    console.log(`[WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);
    
    setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }

  private flushQueue() {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;

    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      this.socket.send(JSON.stringify(message));
    }
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    
    this.pingInterval = window.setInterval(() => {
      this.send('PING', { ts: Date.now() });
      
      this.pongTimeout = window.setTimeout(() => {
        console.warn('[WS] Pong timeout, disconnecting...');
        this.disconnect();
        this.scheduleReconnect();
      }, 10000);
    }, 30000);
  }

  private stopHeartbeat() {
    if (this.pingInterval) clearInterval(this.pingInterval);
    if (this.pongTimeout) clearTimeout(this.pongTimeout);
  }

  private handlePong() {
    if (this.pongTimeout) {
      clearTimeout(this.pongTimeout);
      this.pongTimeout = null;
    }
  }
}
