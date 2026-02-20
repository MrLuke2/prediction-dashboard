import { useEffect } from 'react';
import { useA2UISimulator } from '../services/a2uiSimulator';
import { useUIStore, useMarketStore, useTradeStore } from '../store';
import { useWebSocket } from '../services/websocket/useWebSocket';

export const useSimulatorSync = () => {
    const useRealData = import.meta.env.VITE_USE_REAL_DATA === 'true';
    
    // Initialize WebSocket if real data is enabled
    const ws = useRealData ? useWebSocket() : null;

    const { logs, marketData, whaleData, alphaMetric, lastPnL, tradeHistory } = useA2UISimulator();
    
    const setLogs = useUIStore(state => state.setLogs);
    const { setMarketData, setAlphaMetric, setWhaleData } = useMarketStore();
    const { displayedPnL, setDisplayedPnL, setTradeHistory, setLastPnL } = useTradeStore();

    useEffect(() => {
        // Only sync simulator data if real data is disabled
        if (useRealData) return;

        setMarketData(marketData);
        setLogs(logs);
        setAlphaMetric(alphaMetric);
        setWhaleData(whaleData);
        setTradeHistory(tradeHistory);
        if (!displayedPnL && tradeHistory.length > 0) setDisplayedPnL(tradeHistory[0]);
        
        if (lastPnL) {
            setLastPnL(lastPnL);
            setDisplayedPnL(lastPnL);
        }
    }, [
        useRealData, marketData, logs, alphaMetric, whaleData, 
        tradeHistory, lastPnL, setMarketData, setLogs, 
        setAlphaMetric, setWhaleData, setTradeHistory, 
        displayedPnL, setDisplayedPnL, setLastPnL
    ]);

    return { 
        logs, 
        marketData, 
        whaleData, 
        alphaMetric, 
        lastPnL, 
        tradeHistory,
        wsState: ws?.connectionState || 'offline'
    };
};
