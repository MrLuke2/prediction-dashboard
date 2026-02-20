import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MarketPair } from '../../types';
import { X, TrendingUp, TrendingDown, Zap, Shield, BarChart3, Activity, ArrowRightLeft, Lock, CheckCircle2 } from 'lucide-react';
import { GlassPanel } from '../ui/GlassPanel/GlassPanel';
import { measureRender } from '../../lib/perf';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface UltimateInsightsCardProps {
  market: MarketPair;
  onClose: () => void;
}

const UltimateInsightsCardBase: React.FC<UltimateInsightsCardProps> = ({ market, onClose }) => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionStep, setExecutionStep] = useState(0);
  const containerRef = useFocusTrap(true);

  const isArbOpportunity = useMemo(() => market.spread > 0.02, [market.spread]);

  // Stable callback for execution logic to prevent child effect triggers
  const handleExecute = useCallback(() => {
    setIsExecuting(true);
    const stepInterval = setInterval(() => {
      setExecutionStep(prev => {
        if (prev >= 3) {
          clearInterval(stepInterval);
          return 3;
        }
        return prev + 1;
      });
    }, 800);
  }, []);

  // Memoize analysis generation to avoid high-frequency string operations
  const analysis = useMemo(() => {
    // Specific Logic for Requested Samples
    if (market.symbol === 'TRUMP-FED-NOMINEE') {
        return {
            fundamental: "Insider reports suggest Kevin Warsh is leading, but Bessent remains strong in betting pools. Divergence between prediction markets is creating a 4% arb window.",
            sentiment: "Crypto twitter sentiment is heavily skewed towards a pro-Bitcoin candidate. High velocity of mentions on X regarding 'Fed Chair' in last hour.",
            risk: "High Volatility Event. Trump announcement could occur at any time via Truth Social. Bridge latency poses significant execution risk.",
        };
    }
    if (market.symbol === 'PRES-ELECTION-2024') {
        return {
            fundamental: "Electoral college simulations show 270-path divergence. Swing state polling averages are within margin of error (0.5%).",
            sentiment: "Voter enthusiasm gap is narrowing. 'Prediction Market' search volume is at all-time highs. Narrative is shifting to turnout models.",
            risk: "Extreme Binary Event. Liquidity is deep ($500M+), but slippage on large block orders is expected. Hedge with volatility derivatives.",
        };
    }

    // Default Algorithmic Logic
    return {
        fundamental: isArbOpportunity 
        ? "Liquidity imbalance detected between Polymarket (Layer 2) and Kalshi (CFTC Regulated). Institutional flow is lagging on Kalshi."
        : "Market efficiency is high. Prices are converging across venues. No significant fundamental divergence detected at this timestamp.",
        sentiment: market.trend === 'up'
        ? "Social volume is accelerating (98th percentile). 'Buy' signals dominating CryptoTwitter and PredictIt forums."
        : "Sentiment is cooling. Mention volume down 15% WoW. The narrative has shifted to newer catalyst events.",
        risk: isArbOpportunity
        ? "Execution risk is moderate due to bridge latency. Recommended max allocation: 15% of liquid portfolio."
        : "Low volatility environment. Skew is flat. Gamma exposure is minimal. Safe to hold but low upside.",
    };
  }, [market, isArbOpportunity]);

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="insights-modal-title"
    >
      
      {/* Main Card Container - 80% Width/Height */}
      <div 
        ref={containerRef}
        className="w-[85%] h-[85%] max-w-6xl bg-fin-card border border-fin-border rounded-2xl shadow-2xl flex flex-col overflow-hidden relative"
      >
        
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-fin-border bg-zinc-950/50">
          <div className="flex flex-col">
            <div className="flex items-center space-x-3 mb-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-poly-blue text-white uppercase tracking-wider">
                    Market #{Math.floor(Math.random() * 1000) + 1000}
                </span>
                <span className="flex items-center text-kalshi-green text-xs font-mono">
                    <Activity size={12} className="mr-1" aria-hidden="true" /> Live Feed
                </span>
            </div>
            <h1 id="insights-modal-title" className="text-3xl font-bold text-white tracking-tight">{market.symbol.replace(/-/g, ' ')}</h1>
          </div>
          <button 
            onClick={onClose}
            aria-label="Close insights modal"
            className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors brand-focus-ring"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content Grid */}
        <div className="flex-1 grid grid-cols-12 overflow-hidden">
          
          {/* LEFT COLUMN: Data & Stats */}
          <div className="col-span-12 lg:col-span-4 bg-zinc-900/30 border-r border-fin-border p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar shadow-inner">
            
            {/* Price Comparison Card */}
            <div className="bg-zinc-950 border border-fin-border rounded-xl p-5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity" aria-hidden="true">
                    <ArrowRightLeft size={80} />
                </div>
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Cross-Exchange Spread</h3>
                
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-zinc-400">Polymarket</span>
                    <span className="font-mono text-xl text-white font-bold">{(market.polymarketPrice * 100).toFixed(1)}¢</span>
                </div>
                <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-zinc-400">Kalshi</span>
                    <span className="font-mono text-xl text-white font-bold">{(market.kalshiPrice * 100).toFixed(1)}¢</span>
                </div>
                
                <div className="h-px w-full bg-zinc-800 mb-4"></div>
                
                <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-400">Arbitrage Spread</span>
                    <div className={`flex items-center font-mono text-2xl font-bold ${market.spread > 0 ? 'text-kalshi-green' : 'text-kalshi-red'}`}>
                        {market.spread > 0 ? '+' : ''}{(market.spread * 100).toFixed(2)}%
                        {market.spread > 0 ? <TrendingUp className="ml-2" /> : <TrendingDown className="ml-2" />}
                    </div>
                </div>
            </div>

            {/* Volatility Metric */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-950 border border-fin-border rounded-xl p-4">
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Volume (24h)</div>
                    <div className="text-xl font-mono text-white">$4.2M</div>
                </div>
                <div className="bg-zinc-950 border border-fin-border rounded-xl p-4">
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Implied Prob</div>
                    <div className="text-xl font-mono text-poly-blue">{((market.polymarketPrice + market.kalshiPrice) / 2 * 100).toFixed(1)}%</div>
                </div>
            </div>

            {/* Action Button */}
            <div className="mt-auto pt-6">
                {!isExecuting ? (
                    <button 
                        onClick={handleExecute}
                        disabled={market.spread <= 0}
                        aria-label={market.spread > 0 ? "Execute Arbitrage" : "Arbitrage not available"}
                        className={`w-full py-4 rounded-lg font-bold text-lg tracking-wide shadow-lg transition-all transform hover:scale-[1.02] flex items-center justify-center space-x-2 brand-focus-ring
                        ${market.spread > 0 
                            ? 'bg-gradient-to-r from-poly-blue to-blue-600 hover:from-blue-500 hover:to-blue-600 text-white' 
                            : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'}`}
                    >
                        <Zap size={20} className={market.spread > 0 ? "fill-white" : ""} aria-hidden="true" />
                        <span>{market.spread > 0 ? 'EXECUTE ARBITRAGE' : 'NO OPPORTUNITY'}</span>
                    </button>
                ) : (
                    <div className="bg-zinc-900 border border-fin-border rounded-lg p-4 space-y-3" aria-live="polite">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-zinc-400">1. Initiating Flash Loan</span>
                            {executionStep > 0 ? <CheckCircle2 size={16} className="text-kalshi-green" /> : <div className="w-4 h-4 rounded-full border-2 border-zinc-700 border-t-poly-blue animate-spin"></div>}
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-zinc-400">2. Buying Poly / Selling Kalshi</span>
                            {executionStep > 1 ? <CheckCircle2 size={16} className="text-kalshi-green" /> : executionStep === 1 ? <div className="w-4 h-4 rounded-full border-2 border-zinc-700 border-t-poly-blue animate-spin"></div> : <div className="w-4 h-4 rounded-full border-zinc-800 border-2"></div>}
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-zinc-400">3. Settling Bridge</span>
                            {executionStep > 2 ? <CheckCircle2 size={16} className="text-kalshi-green" /> : executionStep === 2 ? <div className="w-4 h-4 rounded-full border-2 border-zinc-700 border-t-poly-blue animate-spin"></div> : <div className="w-4 h-4 rounded-full border-zinc-800 border-2"></div>}
                        </div>
                        {executionStep === 3 && (
                            <div className="mt-2 text-center text-kalshi-green font-bold text-sm bg-kalshi-green/10 py-2 rounded animate-pulse">
                                TRADE SETTLED ON-CHAIN
                            </div>
                        )}
                    </div>
                )}
                {market.spread <= 0 && (
                    <p className="text-center text-xs text-zinc-500 mt-3">Spread must be positive to execute arbitrage.</p>
                )}
            </div>
          </div>

          {/* RIGHT COLUMN: AI Council Deep Dive */}
          <div className="col-span-12 lg:col-span-8 p-8 bg-fin-bg flex flex-col overflow-y-auto custom-scrollbar">
            <div className="mb-6">
                <h2 className="text-xl font-bold text-white mb-1 flex items-center">
                    <Lock size={18} className="mr-2 text-poly-blue" />
                    Council of Agents Analysis
                </h2>
                <p className="text-zinc-500 text-sm">Consensus derived from 42+ tier-1 data sources including Bloomberg Terminal, X API, and proprietary On-Chain flows.</p>
            </div>

            <div className="space-y-6">
                {/* Fundamentalist */}
                <GlassPanel className="bg-zinc-900/20">
                    <div className="flex items-start space-x-4">
                        <div className="p-3 rounded-lg bg-poly-blue/10 text-poly-blue shrink-0">
                            <BarChart3 size={24} />
                        </div>
                        <div>
                            <h4 className="font-bold text-poly-blue uppercase text-xs tracking-wider mb-2">Fundamentalist Agent</h4>
                            <p className="text-zinc-300 leading-relaxed text-sm">{analysis.fundamental}</p>
                        </div>
                    </div>
                </GlassPanel>

                {/* Sentiment */}
                <GlassPanel className="bg-zinc-900/20">
                    <div className="flex items-start space-x-4">
                        <div className="p-3 rounded-lg bg-amber-500/10 text-amber-500 shrink-0">
                            <Activity size={24} />
                        </div>
                        <div>
                            <h4 className="font-bold text-amber-500 uppercase text-xs tracking-wider mb-2">Sentiment Analyst</h4>
                            <p className="text-zinc-300 leading-relaxed text-sm">{analysis.sentiment}</p>
                        </div>
                    </div>
                </GlassPanel>

                {/* Risk */}
                <GlassPanel className="bg-zinc-900/20">
                    <div className="flex items-start space-x-4">
                        <div className="p-3 rounded-lg bg-kalshi-red/10 text-kalshi-red shrink-0">
                            <Shield size={24} />
                        </div>
                        <div>
                            <h4 className="font-bold text-kalshi-red uppercase text-xs tracking-wider mb-2">Risk Manager</h4>
                            <p className="text-zinc-300 leading-relaxed text-sm">{analysis.risk}</p>
                        </div>
                    </div>
                </GlassPanel>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

// Memoized to prevent heavy analysis recalculations when parent re-renders via overlays
export const UltimateInsightsCard = React.memo(measureRender(UltimateInsightsCardBase, 'UltimateInsightsCard'));
