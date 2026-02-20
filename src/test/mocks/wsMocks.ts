import { vi } from 'vitest';

export const mockWebSocket = {
  send: vi.fn(),
  close: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  readyState: 1, // OPEN
  onopen: null as any,
  onmessage: null as any,
  onclose: null as any,
  onerror: null as any,
};

export class MockWebSocketClient {
  connect = vi.fn();
  disconnect = vi.fn();
  sendMessage = vi.fn();
  subscribe = vi.fn(() => vi.fn());
  unsubscribe = vi.fn();
  getState = vi.fn(() => 'connected');
  on = vi.fn(() => vi.fn());
  
  static simulateMessage(type: string, payload: any) {
    // This helper would typically be used to trigger handlers in tests
    // Implementing it depends on how the actual client is structured
  }
}

// Helper to simulate a message coming from the global WebSocket mock
export const simulateWSMessage = (data: any) => {
  if (mockWebSocket.onmessage) {
    mockWebSocket.onmessage({ data: JSON.stringify(data) } as MessageEvent);
  }
};

// Replace global WebSocket with a mock that sets the properties correctly
vi.stubGlobal('WebSocket', vi.fn(() => mockWebSocket));
// Add WebSocket constants
(globalThis as any).WebSocket.OPEN = 1;
(globalThis as any).WebSocket.CLOSED = 3;
(globalThis as any).WebSocket.CONNECTING = 0;
(globalThis as any).WebSocket.CLOSING = 2;
