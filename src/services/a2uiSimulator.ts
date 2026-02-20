import { useState, useEffect, useCallback } from 'react';
import { LogEntry, LogLevel, AgentRole, MarketPair, WhaleMovement, AlphaMetric, PnLData } from '../types';
import { INITIAL_MARKET_DATA, MOCK_WALLET_ADDRESSES } from '../constants';
import { useUIStore } from '../store';

const SYMBOLS = ['TRUMP-FED-NOMINEE', 'PRES-ELECTION-2024', 'FED-RATE-CUT', 'BTC-100K-DEC', 'ETH-ETF-FLOW'];
const VENUES = ['Polymarket', 'Kalshi', 'Cross-Venue'] as const;

// Helper to generate a mock trade for history initialization
const generateMockTrade = (timeOffset: number): PnLData => {
    const isProfit = Math.random() > 0.4;
    return {
        amount: (isProfit ? 1 : -1) * Math.floor(Math.random() * 4000 + 500),
        roi: Math.floor(Math.random() * 30 + 5),
        tradeId: Math.random().toString(36).substr(2, 6).toUpperCase(),
        timestamp: Date.now() - timeOffset,
        venue: VENUES[Math.floor(Math.random() * VENUES.length)],
        asset: SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        executionTime: `${Math.floor(Math.random() * 150 + 20)}ms`
    };
};

// This hook simulates the "A2UI" Protocol connection
export const useA2UISimulator = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [marketData, setMarketData] = useState<MarketPair[]>(INITIAL_MARKET_DATA);
  const [whaleData, setWhaleData] = useState<WhaleMovement[]>([]);
  const [alphaMetric, setAlphaMetric] = useState<AlphaMetric>({ 
    probability: 55, 
    trend: 'stable',
    history: Array.from({ length: 30 }, (_, i) => ({
      probability: 50 + Math.sin(i / 5) * 10 + (Math.random() * 5),
      timestamp: Date.now() - (30 - i) * 5000
    }))
  });
  const [lastPnL, setLastPnL] = useState<PnLData | null>(null);
  const [tradeHistory, setTradeHistory] = useState<PnLData[]>([
      generateMockTrade(1000 * 60 * 2),
      generateMockTrade(1000 * 60 * 15),
      generateMockTrade(1000 * 60 * 45),
      generateMockTrade(1000 * 60 * 120),
  ]);

  const addLog = useCallback((agent: AgentRole, message: string, level: LogLevel = LogLevel.INFO) => {
    const { agentModels, aiProvider } = useUIStore.getState();
    
    let providerId = aiProvider.providerId;
    const agentName = agent.toLowerCase();
    if (agentModels) {
      if (agentName.includes('fundamental')) providerId = agentModels.fundamentalist?.providerId || providerId;
      else if (agentName.includes('sentiment')) providerId = agentModels.sentiment?.providerId || providerId;
      else if (agentName.includes('risk')) providerId = agentModels.risk?.providerId || providerId;
    }

    const newLog: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      agent,
      message,
      level,
      providerId
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
        setAlphaMetric(prev => {
            const newProb = Math.min(99, prev.probability + 5);
            return {
                probability: newProb,
                trend: 'increasing',
                history: [...prev.history, { probability: newProb, timestamp: Date.now() }].slice(-50)
            };
        });
      }

      // 4. Alpha Decay
      if (rand < 0.1) {
        setAlphaMetric(prev => {
            const newProb = Math.max(10, prev.probability - 1);
            return {
                probability: newProb,
                trend: 'decreasing',
                history: [...prev.history, { probability: newProb, timestamp: Date.now() }].slice(-50)
            };
        });
      }
      
      // 5. Simulate PnL Event (Very Rare)
      if (rand > 0.99) {
          const newPnL = generateMockTrade(0);
          setLastPnL(newPnL);
          setTradeHistory(prev => [newPnL, ...prev].slice(0, 19)); // Maintain max 20 items (19 + 1 new)
          addLog(AgentRole.RISK, `Position Closed. PnL: $${newPnL.amount}`, newPnL.amount > 0 ? LogLevel.SUCCESS : LogLevel.ERROR);
      }

      // 6. AI Council Debate Generation (Occasional)
      if (rand < 0.05) {
          const debates = [
              {
                  agent1: AgentRole.FUNDAMENTALIST,
                  msg1: "Yield curve inversion deepening. High conviction on 'YES' for Recession market.",
                  agent2: AgentRole.RISK,
                  msg2: "Premature. OBI variance remains > 12%. Recommend 0.5x leverage cap."
              },
              {
                  agent1: AgentRole.SENTIMENT,
                  msg1: "Extreme social volume spike on $BTC ETF news. Sentiment index: 88 (Greed).",
                  agent2: AgentRole.FUNDAMENTALIST,
                  msg2: "Whale flows actually show distribution to retail. This is a bull trap."
              },
              {
                  agent1: AgentRole.RISK,
                  msg1: "Kalshi-Polymarket spread hit 4%. Arbitrage opportunity confirmed.",
                  agent2: AgentRole.ORCHESTRATOR,
                  msg2: "Routing liquidity now. Latency check: 45ms. Protocol status: NOMINAL."
              }
          ];

          const debate = debates[Math.floor(Math.random() * debates.length)];
          
          // Delayed injection for realism
          addLog(debate.agent1, debate.msg1, LogLevel.DEBATE);
          setTimeout(() => {
            addLog(debate.agent2, debate.msg2, LogLevel.DEBATE);
          }, 1200);
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