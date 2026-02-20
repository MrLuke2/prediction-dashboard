import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WebSocketClient } from '../../services/websocket/WebSocketClient';

describe('WebSocketClient', () => {
  let client: WebSocketClient;
  let mockSockets: any[] = [];
  const url = 'ws://localhost:8080';
  const getToken = vi.fn(() => 'test-token');
  const onStateChange = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mockSockets = [];
    
    // Mock class for WebSocket
    class MockWebSocket {
      static OPEN = 1;
      static CLOSED = 3;
      readyState = 1;
      onopen: any = null;
      onmessage: any = null;
      onclose: any = null;
      onerror: any = null;
      send = vi.fn();
      close = vi.fn().mockImplementation(() => {
          this.readyState = 3;
          if (this.onclose) this.onclose();
      });

      constructor(public url: string) {
        mockSockets.push(this);
      }
    }
    
    vi.stubGlobal('WebSocket', MockWebSocket);
    
    client = new WebSocketClient(url, getToken, onStateChange);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('should connect and update state to connecting', () => {
    client.connect();
    expect(onStateChange).toHaveBeenCalledWith('connecting');
    expect(mockSockets.length).toBe(1);
    expect(mockSockets[0].url).toContain(url);
  });

  it('should transition to connected state on open', () => {
    client.connect();
    const socket = mockSockets[0];
    if (socket.onopen) socket.onopen();
    expect(onStateChange).toHaveBeenCalledWith('connected');
  });

  it('should send PING every 30s', () => {
    client.connect();
    const socket = mockSockets[0];
    if (socket.onopen) socket.onopen();
    
    vi.advanceTimersByTime(30000);
    expect(socket.send).toHaveBeenCalledWith(expect.stringContaining('"type":"PING"'));
  });

  it('should disconnect on pong timeout', () => {
    client.connect();
    const socket = mockSockets[0];
    if (socket.onopen) socket.onopen();
    
    vi.advanceTimersByTime(30000); // Trigger PING
    vi.advanceTimersByTime(11000); // Wait for PONG timeout (10s)
    
    expect(onStateChange).toHaveBeenCalledWith('disconnected');
    expect(socket.close).toHaveBeenCalled();
  });

  it('should not throw on malformed message', () => {
    client.connect();
    const socket = mockSockets[0];
    if (socket.onopen) socket.onopen();
    
    expect(() => {
        if (socket.onmessage) socket.onmessage({ data: 'invalid-json' } as any);
    }).not.toThrow();
  });

  it('should queue and flush messages', () => {
    // 1. Send while disconnected
    client.send('SUBSCRIBE_MARKET', { pair: 'BTC/USD' });
    
    // 2. Connect
    client.connect();
    const socket = mockSockets[0];
    
    // Should NOT have sent yet (since not OPEN)
    expect(socket.send).not.toHaveBeenCalled();
    
    // 3. Open
    if (socket.onopen) socket.onopen();
    
    // Should have flushed queue
    expect(socket.send).toHaveBeenCalledWith(expect.stringContaining('SUBSCRIBE_MARKET'));
  });

  it('should reconnect after close', () => {
    client.connect();
    const socket1 = mockSockets[0];
    if (socket1.onopen) socket1.onopen();
    
    // Simulate close
    if (socket1.onclose) socket1.onclose();
    expect(onStateChange).toHaveBeenCalledWith('disconnected');
    
    // Advance time for first reconnect (1s)
    vi.advanceTimersByTime(1000);
    expect(mockSockets.length).toBe(2);
    expect(onStateChange).toHaveBeenCalledWith('connecting');
  });

  it('should handle errors', () => {
    client.connect();
    const socket = mockSockets[0];
    if (socket.onerror) socket.onerror(new Event('error'));
    
    // Should transition to error state
    expect(onStateChange).toHaveBeenCalledWith('error');
  });

  it('should handle PONG messages', () => {
    client.connect();
    const socket = mockSockets[0];
    if (socket.onopen) socket.onopen();
    
    // Trigger PING to set pongTimeout
    vi.advanceTimersByTime(30000);
    
    // Send PONG
    if (socket.onmessage) socket.onmessage({ data: JSON.stringify({ type: 'PONG' }) } as any);
    
    // Advance time - should NOT disconnect because timeout was cleared
    vi.advanceTimersByTime(11000);
    expect(onStateChange).not.toHaveBeenCalledWith('disconnected');
  });
});
