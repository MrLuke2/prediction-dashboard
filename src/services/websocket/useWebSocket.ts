import { useEffect, useRef, useState, useCallback } from 'react';
import { WebSocketClient, ConnectionState } from './WebSocketClient';
import { useUIStore, useMarketStore, useTradeStore, useNotificationStore } from '../../store';
import { AIProviderSelection } from '../../config/aiProviders';
import { formatUSD } from '../../lib/formatters';

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
  const addToast = useNotificationStore(state => state.addToast);

  useEffect(() => {
    if (!clientInstance) {
      const url = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws';
      clientInstance = new WebSocketClient(
        url,
        () => useUIStore.getState().jwt,
        (state) => {
          setConnectionState(state);
          setIsConnected(state === 'connected');
        }
      );

      // Routing
      clientInstance.on('MARKET_UPDATE', updateMarket);

      clientInstance.on('WHALE_ALERT', (payload) => {
        addWhaleMovement(payload);
        // Prompt 6: Whale alert notification
        addToast({ 
          type: 'warning', 
          title: 'Whale Alert', 
          message: `${payload.amount.toLocaleString()} ${payload.asset} detected on ${payload.symbol}` 
        });
      });

      clientInstance.on('AGENT_LOG', (payload) => {
        addLog(payload);
        // Prompt 6: Agent alert notification
        if (payload.level === 'alert' || payload.level === 'ERROR') {
          addToast({ 
            type: 'agent', 
            title: `${payload.agent} Signal`, 
            message: payload.message.slice(0, 80) + '...',
            duration: 6000,
            providerId: payload.providerId
          });
        }
      });

      clientInstance.on('ALPHA_UPDATE', setAlphaMetric);

      clientInstance.on('TRADE_UPDATE', (payload) => {
        updateTrade(payload);
        // Prompt 6: Trade settled notification
        if (payload.status === 'closed') {
          addToast({ 
            type: 'trade', 
            title: 'Trade Settled', 
            message: `PnL: ${formatUSD(payload.pnl)}`, 
            duration: 8000 
          });
        }
      });

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

  // Reconnect on JWT change
  const jwt = useUIStore(state => state.jwt);
  useEffect(() => {
    if (clientInstance) {
      clientInstance.disconnect();
      clientInstance.connect();
    }
  }, [jwt]);

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
