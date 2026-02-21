import { renderHook, act, waitFor } from '@testing-library/react';
import { MessageType } from '../protocol';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockClient = {
    on: vi.fn(() => vi.fn()),
    connect: vi.fn(),
    disconnect: vi.fn(),
    send: vi.fn(),
    getState: vi.fn(() => 'disconnected'),
};

// Mock the WebSocketClient
vi.mock('../WebSocketClient', () => {
    return {
        WebSocketClient: vi.fn().mockImplementation(function() {
            return mockClient;
        })
    };
});

describe('useWebSocket hook', () => {
    let useWebSocket: any;
    let WebSocketClient: any;
    let useUIStore: any;
    let useMarketStore: any;
    let useTradeStore: any;
    let useNotificationStore: any;
    const handlers: Record<string, Function> = {};

    beforeEach(async () => {
        vi.resetModules();
        
        // Dynamic imports after reset
        const storeModule = await import('../../../store');
        useUIStore = storeModule.useUIStore;
        useMarketStore = storeModule.useMarketStore;
        useTradeStore = storeModule.useTradeStore;
        useNotificationStore = storeModule.useNotificationStore;
        
        const mocksModule = await import('../../../test/mocks/storeDefaults');
        mocksModule.resetStores();

        vi.clearAllMocks();
        
        for (const key in handlers) delete handlers[key];

        mockClient.on.mockImplementation((event: string | MessageType, handler: Function) => {
            handlers[event.toString()] = handler;
            return vi.fn();
        });

        const wsModule = await import('../useWebSocket');
        useWebSocket = wsModule.useWebSocket;
        
        const clientModule = await import('../WebSocketClient');
        WebSocketClient = clientModule.WebSocketClient;
    });

    it('should initialize WebSocketClient and connect on mount', () => {
        renderHook(() => useWebSocket());

        expect(WebSocketClient).toHaveBeenCalled();
        expect(mockClient.connect).toHaveBeenCalled();
    });

    it('should subscribe to events on mount and unsubscribe on unmount', () => {
        const { unmount } = renderHook(() => useWebSocket());

        expect(mockClient.on).toHaveBeenCalledWith('connected', expect.any(Function));
        expect(mockClient.on).toHaveBeenCalledWith(MessageType.MARKET_UPDATE, expect.any(Function));
        
        const unsubFunctions = (mockClient.on as any).mock.results.map((r: any) => r.value);
        unmount();

        expect(mockClient.disconnect).toHaveBeenCalled();
        unsubFunctions.forEach((unsub: any) => expect(unsub).toHaveBeenCalled());
    });

    it('should handle connected event', async () => {
        const { result } = renderHook(() => useWebSocket());

        await waitFor(() => expect(handlers['connected']).toBeDefined());

        act(() => {
            handlers['connected']();
        });

        expect(result.current.isConnected).toBe(true);
        expect(result.current.connectionState).toBe('connected');
        expect(mockClient.send).toHaveBeenCalledWith(MessageType.SET_AI_PROVIDER, expect.anything());
    });

    it('should handle market updates', async () => {
        renderHook(() => useWebSocket());

        await waitFor(() => expect(handlers[MessageType.MARKET_UPDATE]).toBeDefined());

        const mockPayload = { symbol: 'TRUMP-FED-NOMINEE', polymarketPrice: 0.99 };
        act(() => {
            handlers[MessageType.MARKET_UPDATE]!(mockPayload);
        });

        const market = useMarketStore.getState().marketData.find(m => m.symbol === 'TRUMP-FED-NOMINEE');
        expect(market!.polymarketPrice).toBe(0.99);
    });

    it('should handle whale alerts and show toasts', async () => {
        const addToastSpy = vi.spyOn(useNotificationStore.getState(), 'addToast');
        renderHook(() => useWebSocket());

        await waitFor(() => expect(handlers[MessageType.WHALE_ALERT]).toBeDefined());

        const mockPayload = { symbol: 'BTC/USD', amount: 1000000, confidence: 0.9, action: 'BUY', asset: 'BTC' };
        act(() => {
            handlers[MessageType.WHALE_ALERT]!(mockPayload);
        });

        expect(useMarketStore.getState().whaleData[0]).toMatchObject({ symbol: 'BTC/USD', amount: 1000000 });
        expect(addToastSpy).toHaveBeenCalled();
    });

    it('should handle agent logs and show agent toasts', async () => {
        const addToastSpy = vi.spyOn(useNotificationStore.getState(), 'addToast');
        renderHook(() => useWebSocket());

        await waitFor(() => expect(handlers[MessageType.AGENT_LOG]).toBeDefined());

        const mockPayload = { id: 'log-1', agent: 'FUNDAMENTALIST', level: 'alert', message: 'Critical sentiment shift', providerId: 'anthropic' };
        act(() => {
            handlers[MessageType.AGENT_LOG]!(mockPayload);
        });

        expect(useUIStore.getState().logs[0]).toMatchObject({ message: 'Critical sentiment shift' });
        expect(addToastSpy).toHaveBeenCalled();
    });

    it('should handle alpha updates', async () => {
        renderHook(() => useWebSocket());

        await waitFor(() => expect(handlers[MessageType.ALPHA_UPDATE]).toBeDefined());

        const mockPayload = { score: 0.88, probability: 88, history: [] };
        act(() => {
            handlers[MessageType.ALPHA_UPDATE]!(mockPayload);
        });

        expect(useMarketStore.getState().alphaMetric!.probability).toBe(88);
    });

    it('should handle trade updates and show trade toasts', async () => {
        const addToastSpy = vi.spyOn(useNotificationStore.getState(), 'addToast');
        const initialTrade = { tradeId: 't1', status: 'open', amount: 0, roi: 0 };
        useTradeStore.setState({ tradeHistory: [initialTrade as any] });
        
        renderHook(() => useWebSocket());

        await waitFor(() => expect(handlers[MessageType.TRADE_UPDATE]).toBeDefined());

        const mockPayload = { tradeId: 't1', status: 'closed', amount: 500, roi: 5 };
        act(() => {
            handlers[MessageType.TRADE_UPDATE]!(mockPayload);
        });

        expect(useTradeStore.getState().tradeHistory[0].status).toBe('closed');
        expect(addToastSpy).toHaveBeenCalled();
    });

    it('should update lastPing on PONG', async () => {
        const { result } = renderHook(() => useWebSocket());
        
        await waitFor(() => expect(handlers[MessageType.PONG]).toBeDefined());

        const timestamp = Date.now();
        act(() => {
            handlers[MessageType.PONG]!({ ts: timestamp });
        });

        expect(result.current.lastPing).toBe(timestamp);
    });
});
