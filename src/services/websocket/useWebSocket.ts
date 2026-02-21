import { useEffect, useRef, useState, useCallback } from 'react';
import { useUIStore, useMarketStore, useTradeStore, useNotificationStore } from '../../store';
import { WebSocketClient } from './WebSocketClient';
import { MessageType } from './protocol';
import { formatUSD } from '../../lib/formatters';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws';

let clientInstance: WebSocketClient | null = null;

export const useWebSocket = () => {
    const { aiProvider, jwt } = useUIStore();
    const { addToast } = useNotificationStore();
    const [isConnected, setIsConnected] = useState(false);
    const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
    const [lastPing, setLastPing] = useState<number>(0);

    if (!clientInstance) {
        clientInstance = new WebSocketClient(WS_URL, () => useUIStore.getState().jwt);
    }

    useEffect(() => {
        const client = clientInstance!;
        
        const unsubConnect = client.on('connected', () => {
            setIsConnected(true);
            setConnectionState('connected');
            // Send initial selection
            client.send(MessageType.SET_AI_PROVIDER, useUIStore.getState().aiProvider);
        });

        const unsubDisconnect = client.on('disconnected', () => {
            setIsConnected(false);
            setConnectionState('disconnected');
        });

        // Market Updates
        const unsubMarket = client.on(MessageType.MARKET_UPDATE, (payload) => {
            useMarketStore.getState().updateMarket(payload);
        });

        // Whale Alerts
        const unsubWhale = client.on(MessageType.WHALE_ALERT, (payload) => {
            useTradeStore.getState().addWhaleMovement(payload);
            if (payload.confidence > 0.8) {
                addToast({ 
                    type: 'warning', 
                    title: 'Whale Alert', 
                    message: `${payload.action}: ${formatUSD(payload.amount)} ${payload.asset}` 
                });
            }
        });

        // Agent Logs
        const unsubLog = client.on(MessageType.AGENT_LOG, (payload) => {
            useTradeStore.getState().addLog(payload);
            if (payload.level === 'alert' || payload.level === 'DEBATE') {
                addToast({
                    type: 'agent',
                    title: `${payload.agent} Alert`,
                    message: payload.message.slice(0, 80) + '...',
                    providerId: payload.providerId,
                    duration: 6000
                });
            }
        });

        // Alpha Updates
        const unsubAlpha = client.on(MessageType.ALPHA_UPDATE, (payload) => {
            useMarketStore.getState().setAlphaMetric(payload);
        });

        // Trade Updates
        const unsubTrade = client.on(MessageType.TRADE_UPDATE, (payload) => {
            useTradeStore.getState().updateTrade(payload);
            if (payload.status === 'closed') {
                addToast({
                    type: 'trade',
                    title: 'Trade Settled',
                    message: `PnL: ${formatUSD(payload.amount)} | ROI: ${payload.roi}%`,
                    duration: 8000
                });
            }
        });

        // PONG for lastPing
        const unsubPong = client.on(MessageType.PONG, (payload) => {
            setLastPing(payload.ts);
        });

        client.connect();

        return () => {
            client.disconnect();
            unsubConnect();
            unsubDisconnect();
            unsubMarket();
            unsubWhale();
            unsubLog();
            unsubAlpha();
            unsubTrade();
            unsubPong();
        };
    }, [jwt]);

    // Watch aiProvider change
    const isFirstMount = useRef(true);
    useEffect(() => {
        if (isFirstMount.current) {
            isFirstMount.current = false;
            return;
        }
        if (clientInstance?.getState() === 'connected') {
            clientInstance.send(MessageType.SET_AI_PROVIDER, aiProvider);
        }
    }, [aiProvider]);

    const subscribeToMarket = useCallback((symbol: string) => {
        clientInstance?.send(MessageType.SUBSCRIBE_MARKET, { symbol });
    }, []);

    const unsubscribeFromMarket = useCallback((symbol: string) => {
        clientInstance?.send(MessageType.UNSUBSCRIBE_MARKET, { symbol });
    }, []);

    return {
        isConnected,
        connectionState,
        subscribeToMarket,
        unsubscribeFromMarket,
        lastPing
    };
};
