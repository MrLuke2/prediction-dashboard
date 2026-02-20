import { useEffect } from 'react';
import { useA2UISimulator } from '../services/a2uiSimulator';
import { useUIStore, useMarketStore, useTradeStore } from '../store';

export const useSimulatorSync = () => {
    const { logs, marketData, whaleData, alphaMetric, lastPnL, tradeHistory } = useA2UISimulator();
    
    const setLogs = useUIStore(state => state.setLogs);
    const { setMarketData, setAlphaMetric, setWhaleData } = useMarketStore();
    const { displayedPnL, setDisplayedPnL, setTradeHistory, setLastPnL } = useTradeStore();

    useEffect(() => {
        setMarketData(marketData);
    }, [marketData, setMarketData]);

    useEffect(() => {
        setLogs(logs);
    }, [logs, setLogs]);

    useEffect(() => {
        setAlphaMetric(alphaMetric);
    }, [alphaMetric, setAlphaMetric]);

    useEffect(() => {
        setWhaleData(whaleData);
    }, [whaleData, setWhaleData]);

    useEffect(() => {
        setTradeHistory(tradeHistory);
        if (!displayedPnL && tradeHistory.length > 0) setDisplayedPnL(tradeHistory[0]);
    }, [tradeHistory, setTradeHistory, displayedPnL, setDisplayedPnL]);

    useEffect(() => {
        if (lastPnL) {
            setLastPnL(lastPnL);
            setDisplayedPnL(lastPnL);
        }
    }, [lastPnL, setLastPnL, setDisplayedPnL]);

    return { logs, marketData, whaleData, alphaMetric, lastPnL, tradeHistory };
};
