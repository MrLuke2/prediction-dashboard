import { useState, useEffect, useCallback } from 'react';
import { LogEntry, LogLevel, AgentRole, MarketPair, WhaleMovement, AlphaMetric, PnLData } from '../types';
import { INITIAL_MARKET_DATA, MOCK_WALLET_ADDRESSES } from '../constants';

// Helper to generate a mock trade for history initialization
const generateMockTrade = (timeOffset: number): PnLData => {
    const isProfit = Math.random() > 0.4;
    return {
        amount: (isProfit ? 1 : -1) * Math.floor(Math.random() * 4000 + 500),
        roi: Math.floor(Math.random() * 30 + 5),
        tradeId: Math.random().toString(36).substr(2, 6).toUpperCase(),
        timestamp: Date.now() - timeOffset
    };
};

// This hook simulates the "A2UI" Protocol connection
export const useA2UISimulator = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [marketData, setMarketData] = useState<MarketPair[]>(INITIAL_MARKET_DATA);
  const [whaleData, setWhaleData] = useState<WhaleMovement[]>([]);
  const [alphaMetric, setAlphaMetric] = useState<AlphaMetric>({ probability: 55, trend: 'stable' });
  const [lastPnL, setLastPnL] = useState<PnLData | null>(null);
  const [tradeHistory, setTradeHistory] = useState<PnLData[]>([
      generateMockTrade(1000 * 60 * 2),
      generateMockTrade(1000 * 60 * 15),
      generateMockTrade(1000 * 60 * 45),
      generateMockTrade(1000 * 60 * 120),
  ]);

  const addLog = useCallback((agent: AgentRole, message: string, level: LogLevel = LogLevel.INFO) => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      agent,
      message,
      level
    };
    setLogs(prev => [...prev.slice(-49), newLog]); // Keep last 50
  }, []);

  // Simulate incoming messages
  useEffect(() => {
    const interval = setInterval(() => {
      const rand = Math.random();

      // 1. Random Log Generation
      if (rand > 0.7) {
        const agents = Object.values(AgentRole);
        const agent = agents[Math.floor(Math.random() * agents.length)];
        const messages = [
            "Scanning Polygon chain for large transfers...",
            "Analyzing sentiment on Twitter ($BTC)...",
            "Kalshi order book depth updated.",
            "Calculating Kelly Criterion for potential entry.",
            "Re-calibrating OBI weights.",
            "Cross-referencing Fed speak with bond yields.",
            "Heartbeat signal active."
        ];
        addLog(agent, messages[Math.floor(Math.random() * messages.length)]);
      }

      // 2. Market Data Fluctuation
      if (rand > 0.5) {
        setMarketData(prev => prev.map(p => {
          const change = (Math.random() - 0.5) * 0.01;
          return {
            ...p,
            polymarketPrice: Math.max(0, Math.min(1, p.polymarketPrice + change)),
            spread: p.polymarketPrice - p.kalshiPrice,
            trend: change > 0 ? 'up' : 'down'
          };
        }));
      }

      // 3. Whale Movement Detection (Rare)
      if (rand > 0.95) {
        const newWhale: WhaleMovement = {
            id: Math.random().toString(36),
            wallet: MOCK_WALLET_ADDRESSES[Math.floor(Math.random() * MOCK_WALLET_ADDRESSES.length)],
            action: Math.random() > 0.5 ? 'Bought' : 'Sold',
            amount: Math.floor(Math.random() * 50000) + 10000,
            asset: 'NO on Rate Cut',
            confidence: 0.8 + (Math.random() * 0.2),
            timestamp: Date.now()
        };
        setWhaleData(prev => [...prev.slice(-19), newWhale]); // Keep last 20
        addLog(AgentRole.ORCHESTRATOR, `WHALE DETECTED: ${newWhale.wallet} moved $${newWhale.amount}`, LogLevel.WARN);
        
        // Spike Alpha
        setAlphaMetric(prev => ({
            probability: Math.min(99, prev.probability + 5),
            trend: 'increasing'
        }));
      }

      // 4. Alpha Decay
      if (rand < 0.1) {
        setAlphaMetric(prev => ({
            probability: Math.max(10, prev.probability - 1),
            trend: 'decreasing'
        }));
      }
      
      // 5. Simulate PnL Event (Very Rare)
      if (rand > 0.99) {
          const amount = (Math.random() > 0.3 ? 1 : -1) * Math.floor(Math.random() * 5000);
          const newPnL = {
              amount,
              roi: Math.floor(Math.random() * 40),
              tradeId: Math.random().toString(36).substr(2, 6).toUpperCase(),
              timestamp: Date.now()
          };
          setLastPnL(newPnL);
          setTradeHistory(prev => [newPnL, ...prev].slice(0, 19)); // Maintain max 20 items (19 + 1 new)
          addLog(AgentRole.RISK, `Position Closed. PnL: $${amount}`, amount > 0 ? LogLevel.SUCCESS : LogLevel.ERROR);
      }

    }, 1000);

    return () => clearInterval(interval);
  }, [addLog]);

  return {
    logs,
    marketData,
    whaleData,
    alphaMetric,
    lastPnL,
    tradeHistory
  };
};