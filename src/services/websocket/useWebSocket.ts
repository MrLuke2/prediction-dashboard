import { useEffect, useRef, useState, useCallback } from 'react';
import { WebSocketClient, ConnectionState } from './WebSocketClient';
import { useUIStore, useMarketStore, useTradeStore } from '../../store';
import { AIProviderSelection } from '../../config/aiProviders';

let clientInstance: WebSocketClient | null = null;

export const useWebSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [lastPing, setLastPing] = useState<number | null>(null);

  const aiProvider = useUIStore(state => state.aiProvider);
  const updateMarket = useMarketStore(state => state.updateMarket);
  const addWhaleMovement = useTradeStore(state => state.addWhaleMovement);
  const addLog = useTradeStore(state => state.addLog);
  const setAlphaMetric = useMarketStore(state => state.setAlphaMetric);
  const updateTrade = useTradeStore(state => state.updateTrade);

  useEffect(() => {
    if (!clientInstance) {
      const url = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws';
      clientInstance = new WebSocketClient(
        url,
        () => null, // Placeholder for getToken
        (state) => {
          setConnectionState(state);
          setIsConnected(state === 'connected');
        }
      );

      // Routing
      clientInstance.on('MARKET_UPDATE', updateMarket);
      clientInstance.on('WHALE_ALERT', addWhaleMovement);
      clientInstance.on('AGENT_LOG', addLog);
      clientInstance.on('ALPHA_UPDATE', setAlphaMetric);
      clientInstance.on('TRADE_UPDATE', updateTrade);
      clientInstance.on('PONG', (payload) => setLastPing(payload.ts));

      clientInstance.connect();
    }

    return () => {
      // In a real singleton, we might not disconnect on unmount
      // but if the app unmounts completely we should.
    };
  }, []);

  // Sync AI Provider change
  useEffect(() => {
    if (isConnected && clientInstance) {
       clientInstance.send('SET_AI_PROVIDER', aiProvider);
    }
  }, [aiProvider, isConnected]);

  const subscribeToMarket = useCallback((symbol: string) => {
    clientInstance?.send('SUBSCRIBE_MARKET', { symbol });
  }, []);

  const unsubscribeFromMarket = useCallback((symbol: string) => {
    clientInstance?.send('UNSUBSCRIBE_MARKET', { symbol });
  }, []);

  return {
    isConnected,
    connectionState,
    subscribeToMarket,
    unsubscribeFromMarket,
    lastPing
  };
};
