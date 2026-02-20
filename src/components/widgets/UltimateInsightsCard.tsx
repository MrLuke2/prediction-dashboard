import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MarketPair, AgentRole } from '../../types';
import { X, TrendingUp, TrendingDown, Zap, Shield, BarChart3, Activity, ArrowRightLeft, Lock, CheckCircle2, Info, ChevronRight, User, AlertTriangle } from 'lucide-react';
import { GlassPanel } from '../ui/GlassPanel/GlassPanel';
import { measureRender } from '../../lib/perf';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useUIStore, useMarketStore, useTradeStore } from '../../store';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { AI_PROVIDERS } from '../../config/aiProviders';
import { formatUSD, formatPct, formatSpread } from '../../lib/formatters';
import { WhaleMovementRow } from '../ui/WhaleMovementRow';
import { timeAgo, cn } from '../../lib/utils';

interface UltimateInsightsCardProps {
  market: MarketPair;
  onClose: () => void;
}

type TabType = 'OVERVIEW' | 'ANALYSIS' | 'WHALE' | 'EXECUTE';

const POLYMARKET_LOGO = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="inline-block mr-1">
        <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#3B82F6"/>
        <path d="M2 17L12 22L22 17M2 12L12 17L22 12" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const KALSHI_LOGO = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="inline-block mr-1">
        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#10B981" strokeWidth="2"/>
        <path d="M8 12L11 15L16 10" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const UltimateInsightsCardBase: React.FC<UltimateInsightsCardProps> = ({ market, onClose }: UltimateInsightsCardProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('OVERVIEW');
  
  // Auto-switch to EXECUTE if market has high spread/probability (simulating alpha discovery)
  useEffect(() => {
    if (market.spread > 0.03 && activeTab === 'OVERVIEW') {
        setActiveTab('EXECUTE');
    }
  }, [market.symbol]);

  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [size, setSize] = useState<string>('100');
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionStep, setExecutionStep] = useState(0);
  
  const containerRef = useFocusTrap(true);
  const { requireAuth, user, isAuthenticated } = useAuthGuard();
  const currentAISelection = useUIStore(state => state.aiProvider);
  const setAIProvider = useUIStore(state => state.setAIProvider);
  const logs = useUIStore(state => state.logs);
  const alphaMetric = useMarketStore(state => state.alphaMetric);
  const whaleData = useMarketStore(state => state.whaleData);
  const submitTrade = useTradeStore(state => state.submitTrade);

  const isPaperTrading = import.meta.env.VITE_PAPER_TRADING === 'true' || true; // Defaulting to true for demo if not set

  const currentProvider = useMemo(() => 
    AI_PROVIDERS.find(p => p.id === currentAISelection.providerId) || AI_PROVIDERS[0]
  , [currentAISelection.providerId]);

  const handleExecute = useCallback(() => {
    if (!requireAuth()) return;
    
    const isPro = user?.plan === 'pro' || user?.plan === 'enterprise';
    
    if (!isPro) {
        // Overlay for upgrade prompt would be shown via state or another way
        // For now, let's just log and maybe show a local alert if needed
        return;
    }

    setIsExecuting(true);
    setExecutionStep(1);

    const params = {
        marketPairId: market.symbol,
        side,
        size: parseFloat(size),
        venue: market.polymarketPrice > market.kalshiPrice ? 'Kalshi' : 'Polymarket',
        aiProvider: currentAISelection
    };

    submitTrade(params);

    const stepInterval = setInterval(() => {
        setExecutionStep(prev => {
            if (prev >= 3) {
                clearInterval(stepInterval);
                return 3;
            }
            return prev + 1;
        });
    }, 800);
  }, [requireAuth, user?.plan, market, side, size, currentAISelection, submitTrade]);

  const marketLogs = useMemo(() => {
    // In a real app, logs would be filtered by marketId/symbol
    // For now we just take the last 3 logs
    return logs.slice(0, 3);
  }, [logs]);

  const estimatedPnL = useMemo(() => {
    const s = parseFloat(size) || 0;
    return s * market.spread;
  }, [size, market.spread]);

  const renderOverview = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="grid grid-cols-2 gap-4">
            <GlassPanel className="p-4 bg-zinc-900/40">
                <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Exchange Spread</div>
                <div className="text-2xl font-mono font-bold text-kalshi-green">{formatSpread(market.spread)}</div>
            </GlassPanel>
            <GlassPanel className="p-4 bg-zinc-900/40">
                <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">24h Volume</div>
                <div className="text-2xl font-mono font-bold text-white">${market.volume || '4.2M'}</div>
            </GlassPanel>
        </div>

        <div className="space-y-4">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Connected Venues</h3>
            <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/50 border border-fin-border">
                    <div className="flex items-center">
                        {POLYMARKET_LOGO}
                        <span className="text-sm font-medium text-white">Polymarket</span>
                    </div>
                    <div className="flex items-center space-x-3">
                        <span className="font-mono text-sm text-zinc-400">{(market.polymarketPrice * 100).toFixed(1)}¢</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-poly-blue/10 text-poly-blue border border-poly-blue/20">ACTIVE</span>
                    </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/50 border border-fin-border">
                    <div className="flex items-center">
                        {KALSHI_LOGO}
                        <span className="text-sm font-medium text-white">Kalshi</span>
                    </div>
                    <div className="flex items-center space-x-3">
                        <span className="font-mono text-sm text-zinc-400">{(market.kalshiPrice * 100).toFixed(1)}¢</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-kalshi-green/10 text-kalshi-green border border-kalshi-green/20">SYNCED</span>
                    </div>
                </div>
            </div>
        </div>

        <div className="p-4 rounded-xl bg-poly-blue/5 border border-poly-blue/20 flex items-center justify-between">
            <div className="flex items-center text-poly-blue">
                <Info size={16} className="mr-2" />
                <span className="text-xs font-medium">Analysis by {currentProvider.name} {currentAISelection.model}</span>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono uppercase">Last Update: Just now</span>
        </div>
    </div>
  );

  const renderAnalysis = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        {/* Alpha Metric Gauge (Simplified) */}
        <GlassPanel className="p-5 bg-zinc-900/40 relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Latest Alpha Metric</h3>
                <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${
                    alphaMetric?.trend === 'increasing' ? 'text-kalshi-green bg-kalshi-green/10' :
                    alphaMetric?.trend === 'decreasing' ? 'text-kalshi-red bg-kalshi-red/10' : 'text-zinc-500 bg-zinc-500/10'
                }`}>
                    {alphaMetric?.trend ?? 'stable'}
                </span>
            </div>
            
             <div className="flex items-end justify-between">
                <div className="text-5xl font-mono font-black text-white">{alphaMetric?.probability ?? 0}%</div>
                <div className="flex-1 max-w-[200px] h-2 bg-zinc-800 rounded-full overflow-hidden ml-4 mb-2">
                    <div 
                        className="h-full bg-gradient-to-r from-poly-blue to-purple-500" 
                        style={{ width: `${alphaMetric?.probability ?? 0}%` }}
                    />
                </div>
            </div>
        </GlassPanel>

        {/* AI Provider Breakdown Chart */}
        <div className="space-y-2">
            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Confidence Contribution</h3>
            <div className="h-6 w-full flex rounded-md overflow-hidden border border-zinc-800 bg-zinc-950">
                {(() => {
                    const agentModels = useUIStore.getState().agentModels;
                    const providers = Object.values(agentModels).map(a => a.providerId);
                    const counts = providers.reduce((acc, p) => ({ ...acc, [p]: (acc[p] || 0) + 1 }), {} as Record<string, number>);
                    const total = providers.length;

                    return AI_PROVIDERS.filter(p => counts[p.id]).map(provider => {
                        const percent = (counts[provider.id] / total) * 100;
                        return (
                            <div 
                                key={provider.id}
                                className="h-full transition-all duration-500 border-r border-black last:border-r-0" 
                                style={{ 
                                    width: `${percent}%`, 
                                    backgroundColor: provider.color 
                                }} 
                                title={`${provider.name}: ${percent.toFixed(0)}% contribution`} 
                            />
                        );
                    });
                })()}
            </div>
            <div className="flex justify-between text-[9px] text-zinc-600 font-mono">
                <div className="flex space-x-3">
                    {(() => {
                        const agentModels = useUIStore.getState().agentModels;
                        const providers = Array.from(new Set(Object.values(agentModels).map(a => a.providerId)));
                        return providers.map(pid => {
                            const p = AI_PROVIDERS.find(p => p.id === pid);
                            const count = Object.values(agentModels).filter(a => a.providerId === pid).length;
                            return (
                                <span key={pid} className="flex items-center space-x-1">
                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p?.color }} />
                                    <span className="text-white font-bold">{p?.name.toUpperCase()} ({(count/3 * 100).toFixed(0)}%)</span>
                                </span>
                            );
                        });
                    })()}
                </div>
                <span>DYNAMIC AGENT COUNCIL PIPELINE</span>
            </div>
        </div>

        {/* Agent Logs */}
        <div className="space-y-3">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Intelligence Feed</h3>
            {marketLogs.length > 0 ? (
                <div className="space-y-2">
                    {marketLogs.map((log) => {
                        const provider = AI_PROVIDERS.find(p => p.id === log.providerId) || AI_PROVIDERS[0];
                        return (
                            <div key={log.id} className="p-3 rounded-xl bg-zinc-950/30 border border-fin-border group transition-all hover:bg-zinc-950/50">
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: provider.color }} />
                                        <span className="text-[10px] font-bold text-white uppercase">{log.agent}</span>
                                    </div>
                                    <span className="text-[9px] text-zinc-600 font-mono">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                </div>
                                <p className="text-xs text-zinc-400 leading-relaxed">{log.message}</p>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="p-8 text-center bg-zinc-950/20 border border-dashed border-zinc-800 rounded-xl">
                    <p className="text-xs text-zinc-500">No active deep-dive analysis found for this market.</p>
                </div>
            )}
        </div>

        <button 
            className="w-full py-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition-all flex items-center justify-center space-x-2"
            onClick={() => console.log('Re-analyzing...')}
        >
            <Activity size={14} className="animate-pulse" />
            <span>RE-ANALYZE WITH {currentProvider.name.toUpperCase()}</span>
        </button>
    </div>
  );

  const renderWhale = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Market Movement Radar</h3>
        {whaleData.length > 0 ? (
            <div className="space-y-2">
                {whaleData.slice(0, 5).map((m) => (
                    <WhaleMovementRow key={m.id} movement={m} />
                ))}
            </div>
        ) : (
            <div className="p-12 text-center">
                <Activity size={48} className="mx-auto text-zinc-800 mb-4 opacity-20" />
                <p className="text-xs text-zinc-500">No significant whale activity detected in this sector.</p>
            </div>
        )}
    </div>
  );

  const renderExecute = () => {
    if (!isAuthenticated) {
        return (
            <div className="h-full flex flex-col items-center justify-center space-y-4 p-8 relative">
                <div className="absolute inset-0 bg-black/40 backdrop-blur-md z-10 rounded-2xl flex flex-col items-center justify-center space-y-6">
                    <Lock size={48} className="text-zinc-600" />
                    <div className="text-center space-y-2">
                        <h3 className="text-xl font-bold text-white">Execution Vault Locked</h3>
                        <p className="text-sm text-zinc-400 max-w-xs">Sign in to access alpha execution and automated cross-venue arbitrage.</p>
                    </div>
                    <button 
                        onClick={() => useUIStore.getState().setAuthOpen(true)}
                        className="px-8 py-3 bg-poly-blue rounded-full font-bold text-white hover:bg-blue-600 transition-all shadow-lg"
                    >
                        Sign in to trade
                    </button>
                </div>
                {/* Blurred content in background */}
                <div className="w-full h-full opacity-20 blur-sm pointer-events-none">
                    {renderExecuteContent()}
                </div>
            </div>
        );
    }

    const isUpgradeRequired = user?.plan === 'free';

    return (
        <div className="relative h-full flex flex-col">
            {isUpgradeRequired && (
                <div className="absolute inset-0 z-20 bg-zinc-950/80 backdrop-blur-[2px] rounded-2xl flex flex-col items-center justify-center p-8">
                    <GlassPanel className="max-w-xs p-6 text-center space-y-4 border-amber-500/30">
                        <div className="p-3 bg-amber-500/10 rounded-full w-fit mx-auto">
                            <Zap size={24} className="text-amber-500" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-lg font-bold text-white">Pro Mode Required</h3>
                            <p className="text-xs text-zinc-400">Arb execution is limited to Pro and Enterprise tiers. Upgrade to unlock 1-click execution.</p>
                        </div>
                        <button className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 rounded-lg text-white font-bold text-sm shadow-lg hover:from-amber-400 hover:to-orange-500 transition-all">
                            UPGRADE NOW
                        </button>
                    </GlassPanel>
                </div>
            )}
            {renderExecuteContent()}
        </div>
    );
  };

  const renderExecuteContent = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
        <div className="flex items-center justify-between mb-2">
             <div className="flex p-1 bg-zinc-950 rounded-lg border border-fin-border">
                <button 
                    onClick={() => setSide('buy')}
                    className={`px-6 py-1.5 rounded-md text-xs font-bold transition-all ${side === 'buy' ? 'bg-kalshi-green text-black shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                    BUY
                </button>
                <button 
                    onClick={() => setSide('sell')}
                    className={`px-6 py-1.5 rounded-md text-xs font-bold transition-all ${side === 'sell' ? 'bg-kalshi-red text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                    SELL
                </button>
            </div>

            {isPaperTrading && (
                <div className="px-2 py-0.5 rounded border border-amber-500/20 bg-amber-500/10 text-amber-500 font-mono text-[10px] font-black uppercase tracking-widest animate-pulse">
                    PAPER TRADING
                </div>
            )}
        </div>

        <div className="space-y-4">
            <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Capital Allocation ($)</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-zinc-500 font-mono">$</span>
                    </div>
                    <input 
                        type="number"
                        min="1"
                        value={size}
                        onChange={(e) => setSize(e.target.value)}
                        className="w-full bg-zinc-950 border border-fin-border rounded-xl py-3 pl-8 pr-4 text-white font-mono text-xl focus:ring-1 focus:ring-poly-blue outline-none transition-all"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Execution Provider</label>
                <div className="grid grid-cols-3 gap-2">
                    {AI_PROVIDERS.map(p => (
                        <button 
                            key={p.id}
                            onClick={() => setAIProvider({ providerId: p.id, model: p.defaultModel })}
                            className={`p-2 rounded-lg border flex flex-col items-center justify-center transition-all ${
                                currentAISelection.providerId === p.id 
                                ? 'bg-zinc-800 border-white/20' 
                                : 'bg-zinc-950 border-fin-border opacity-50 hover:opacity-100'
                            }`}
                        >
                            <div className="w-2 h-2 rounded-full mb-1" style={{ backgroundColor: p.color }} />
                            <span className="text-[9px] font-bold text-white uppercase">{p.name}</span>
                        </button>
                    ))}
                </div>
                <div className="text-[9px] text-zinc-500 italic mt-1">
                    Executing with {currentProvider.name} {currentAISelection.model}...
                </div>
            </div>
        </div>

        <GlassPanel className="p-4 bg-zinc-900/20 border-blue-500/10">
            <div className="flex items-center justify-between">
                <div className="flex items-center text-zinc-400 text-xs">
                    <TrendingUp size={14} className="mr-2" />
                    Est. Profit (Arb)
                </div>
                <div className="text-xl font-mono font-bold text-kalshi-green">+{formatUSD(estimatedPnL)}</div>
            </div>
            <div className="mt-2 h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-kalshi-green" style={{ width: '10%' }} />
            </div>
        </GlassPanel>

        {!isExecuting ? (
            <button 
                onClick={handleExecute}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-poly-blue to-blue-600 hover:from-blue-500 hover:to-blue-700 text-white font-black text-lg shadow-2xl shadow-blue-500/20 transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center space-x-3"
            >
                <Zap size={20} className="fill-white" />
                <span>EXECUTE ARB</span>
            </button>
        ) : (
            <div className="bg-zinc-900 border border-fin-border rounded-xl p-4 space-y-3" aria-live="polite">
                <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">1. Routing Liquidity</span>
                    {executionStep > 0 ? <CheckCircle2 size={16} className="text-kalshi-green" /> : <div className="w-4 h-4 rounded-full border-2 border-zinc-700 border-t-poly-blue animate-spin"></div>}
                </div>
                <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">2. Concurrent Order Placement</span>
                    {executionStep > 1 ? <CheckCircle2 size={16} className="text-kalshi-green" /> : executionStep === 1 ? <div className="w-4 h-4 rounded-full border-2 border-zinc-700 border-t-poly-blue animate-spin"></div> : <div className="w-4 h-4 rounded-full border-zinc-800 border-2"></div>}
                </div>
                <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">3. Bridge Settlement</span>
                    {executionStep > 2 ? <CheckCircle2 size={16} className="text-kalshi-green" /> : executionStep === 2 ? <div className="w-4 h-4 rounded-full border-2 border-zinc-700 border-t-poly-blue animate-spin"></div> : <div className="w-4 h-4 rounded-full border-zinc-800 border-2"></div>}
                </div>
                {executionStep === 3 && (
                    <div className="mt-2 text-center text-kalshi-green font-bold text-xs bg-kalshi-green/10 py-3 rounded-lg animate-pulse border border-kalshi-green/20">
                        ARBITRAGE SECURED ON-CHAIN
                    </div>
                )}
            </div>
        )}

        <div className="pt-4 flex justify-center">
            <button 
                onClick={onClose}
                className="text-zinc-500 hover:text-zinc-300 text-[10px] font-black tracking-[0.2em] uppercase transition-all bg-transparent border-none p-2 flex items-center space-x-2 group"
            >
                <span>Back to Dashboard</span>
                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
        </div>
    </div>
  );

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-300"
      role="dialog"
      aria-modal="true"
      aria-labelledby="insights-modal-title"
    >
      <div 
        ref={containerRef}
        className="w-[90%] h-[85%] max-w-6xl bg-zinc-950 border border-fin-border rounded-3xl shadow-[0_0_100px_rgba(59,130,246,0.15)] flex flex-col overflow-hidden relative"
      >
        {/* Header Section */}
        <div className="px-8 py-6 border-b border-fin-border bg-zinc-950 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-poly-blue/5 blur-[100px] pointer-events-none" />
            
            <div className="flex items-center justify-between relative z-10">
                <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded text-[9px] font-black bg-zinc-800 text-zinc-400 uppercase tracking-[0.2em]">INTELLIGENCE REPORT</span>
                        <div className="flex items-center text-kalshi-green text-[9px] font-mono animate-pulse">
                            <Activity size={10} className="mr-1" /> LIVE ALPHA SCANNING
                        </div>
                    </div>
                    <h1 id="insights-modal-title" className="text-4xl font-black text-white tracking-tighter uppercase italic">
                        {market.symbol.replace(/-/g, ' ')}
                    </h1>
                </div>

                <div className="flex items-center space-x-4">
                    <div className="text-right">
                        <div className="text-[10px] text-zinc-500 font-mono uppercase">Current Spread</div>
                        <div className="text-2xl font-mono font-bold text-kalshi-green">{formatSpread(market.spread)}</div>
                    </div>
                    <div className="h-10 w-px bg-zinc-800" />
                    <button 
                        onClick={onClose}
                        autoFocus
                        className="p-3 rounded-full hover:bg-zinc-900 text-zinc-500 hover:text-white transition-all brand-focus-ring group"
                        aria-label="Close insights modal"
                    >
                        <X size={28} className="group-hover:rotate-90 transition-transform duration-300" />
                    </button>
                </div>
            </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-fin-border bg-zinc-950/50">
            {(['OVERVIEW', 'ANALYSIS', 'WHALE', 'EXECUTE'] as TabType[]).map(tab => (
                <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                        "flex-1 py-4 text-[10px] font-black tracking-[0.2em] transition-all relative uppercase",
                        activeTab === tab ? "text-poly-blue" : "text-zinc-500 hover:text-zinc-300"
                    )}
                >
                    {tab === 'WHALE' ? 'WHALE ACTIVITY' : tab}
                    {activeTab === tab && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-poly-blue shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                    )}
                </button>
            ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 grid grid-cols-12 overflow-hidden bg-brand-fin-bg">
            
            {/* Main Content Column */}
            <div className="col-span-12 lg:col-span-12 p-8 overflow-y-auto custom-scrollbar">
                <div className="max-w-4xl mx-auto h-full">
                    {activeTab === 'OVERVIEW' && renderOverview()}
                    {activeTab === 'ANALYSIS' && renderAnalysis()}
                    {activeTab === 'WHALE' && renderWhale()}
                    {activeTab === 'EXECUTE' && renderExecute()}
                </div>
            </div>

        </div>

        {/* Footer Info Bar */}
        <div className="px-8 py-3 border-t border-fin-border bg-zinc-950 flex items-center justify-between text-[9px] font-mono text-zinc-600">
            <div className="flex items-center space-x-6">
                <span className="flex items-center italic"><ChevronRight size={10} className="mr-1" /> SYSTEM VERSION: ALPHA-4.5</span>
                <span className="flex items-center"><User size={10} className="mr-1" /> SESSION: {user ? user.email.toUpperCase() : 'GUEST'}</span>
            </div>
            <div className="flex items-center space-x-4">
                <span className="text-poly-blue flex items-center"><Shield size={10} className="mr-1" /> ENCRYPTED PIPELINE</span>
                <span className="flex items-center text-zinc-400"><Activity size={10} className="mr-1" /> LATENCY: 14ms</span>
            </div>
        </div>
      </div>
    </div>
  );
};

// Memoized to prevent heavy analysis recalculations
export const UltimateInsightsCard = React.memo(measureRender(UltimateInsightsCardBase, 'UltimateInsightsCard'));
