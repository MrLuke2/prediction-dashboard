import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WebSocketClient } from '../../services/websocket/WebSocketClient';
import { MessageType } from '../../services/websocket/protocol';

describe('WebSocketClient', () => {
  let client: WebSocketClient;
  let mockSockets: any[] = [];
  const url = 'ws://localhost:8080';
  const getToken = vi.fn(() => 'test-token');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mockSockets = [];
    
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
    
    client = new WebSocketClient(url, getToken);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('Connects with correct URL', () => {
    client.connect();
    expect(mockSockets.length).toBe(1);
    expect(mockSockets[0].url).toBe(url);
  });

  it('Reconnects after disconnect with exponential backoff up to 30s', () => {
    client.connect();
    const socket = mockSockets[0];
    if (socket.onclose) socket.onclose();
    
    // Attempt 1: 1s (2^0 * 1000)
    vi.advanceTimersByTime(1100);
    expect(mockSockets.length).toBe(2);
    
    // Attempt 2: 2s
    if (mockSockets[1].onclose) mockSockets[1].onclose();
    vi.advanceTimersByTime(2100);
    expect(mockSockets.length).toBe(3);
    
    // Skip many attempts
    for (let i = 0; i < 5; i++) {
        const s = mockSockets[mockSockets.length - 1];
        if (s.onclose) s.onclose();
        vi.advanceTimersByTime(40000); // More than 30s
    }
    
    // The delay should have stayed at 30s
    // (This is implicitly tested by the fact that it reconnects eventually)
    // We can check if the next socket was created after exactly 30s if we want to be precise
    const currentCount = mockSockets.length;
    const lastSocket = mockSockets[currentCount - 1];
    if (lastSocket.onclose) lastSocket.onclose();
    
    vi.advanceTimersByTime(29000);
    expect(mockSockets.length).toBe(currentCount); // Not yet
    
    vi.advanceTimersByTime(2000);
    expect(mockSockets.length).toBe(currentCount + 1); // Now
  });

  it('Malformed message discarded without throw', () => {
    client.connect();
    const socket = mockSockets[0];
    if (socket.onopen) socket.onopen();
    
    expect(() => {
        if (socket.onmessage) socket.onmessage({ data: 'invalid json' } as any);
    }).not.toThrow();
  });

  it('PING every 30s, disconnect on missing PONG', () => {
    client.connect();
    const socket = mockSockets[0];
    if (socket.onopen) socket.onopen();
    
    vi.advanceTimersByTime(30000);
    expect(socket.send).toHaveBeenCalledWith(expect.stringContaining('"type":"PING"'));
    
    // 10s wait for PONG
    vi.advanceTimersByTime(11000);
    expect(socket.close).toHaveBeenCalled();
  });

  it('Processes PONG and resets heartbeat', () => {
    client.connect();
    const socket = mockSockets[0];
    if (socket.onopen) socket.onopen();
    
    vi.advanceTimersByTime(30000); // Trigger PING
    
    // Send PONG
    if (socket.onmessage) {
        socket.onmessage({ data: JSON.stringify({ type: 'PONG', payload: { ts: Date.now() } }) } as any);
    }
    
    vi.advanceTimersByTime(11000); // Wait past timeout period
    expect(socket.close).not.toHaveBeenCalled(); // Should NOT be closed
  });
});
