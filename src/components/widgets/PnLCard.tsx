import React from 'react';
import { CheckCircle2, XCircle, ArrowUpRight, ArrowDownRight, CircleDashed, BarChart3 } from 'lucide-react';
import { useTradeStore } from '../../store';
import { measureRender } from '../../lib/perf';
import { EmptyState } from '../ui/DataStates';
import { cn } from '../../lib/utils';

export const PnLCardSkeleton: React.FC = React.memo(() => (
    <div className="h-full w-full flex flex-col items-center justify-center p-8 space-y-4 bg-zinc-950/30">
        <BarChart3 className="text-zinc-800 animate-pulse" size={32} />
        <div className="w-full h-32 bg-zinc-900/50 rounded-xl animate-pulse"></div>
        <div className="w-1/2 h-4 bg-zinc-800 rounded animate-pulse"></div>
    </div>
));

const PnLCardBase: React.FC = () => {
  const [view, setView] = React.useState<'LAST' | 'PORTFOLIO'>('LAST');
  const lastPnL = useTradeStore(state => state.displayedPnL);
  const tradeHistory = useTradeStore(state => state.tradeHistory);
  
  const analytics = React.useMemo(() => {
    if (tradeHistory.length === 0) return null;
    const totalProfit = tradeHistory.reduce((acc, t) => acc + t.amount, 0);
    const winRate = (tradeHistory.filter(t => t.amount > 0).length / tradeHistory.length) * 100;
    const totalROI = tradeHistory.reduce((acc, t) => acc + t.roi, 0) / tradeHistory.length;
    return { totalProfit, winRate, totalROI };
  }, [tradeHistory]);

  if (!lastPnL && !analytics) {
    return (
        <div className="relative w-full h-full flex items-center justify-center p-6 bg-zinc-950/50" data-testid="pnl-card">
             <EmptyState 
                icon={<CircleDashed size={32} className="opacity-50" />}
                title="System Idle"
                message="Waiting for execution telemetry..."
             />
        </div>
    );
  }

  const isProfit = view === 'LAST' ? lastPnL?.amount! >= 0 : analytics?.totalProfit! >= 0;
  
  return (
    <div className="relative w-full h-full flex flex-col p-4 bg-zinc-950/50 overflow-hidden" data-testid="pnl-card">
      
      {/* Analytics Toggle */}
      <div className="flex p-1 bg-zinc-900 rounded-lg mb-4 self-center border border-white/5 z-10">
        <button 
           onClick={() => setView('LAST')}
           className={cn(
             "px-4 py-1 rounded-md text-[9px] font-black uppercase tracking-widest transition-all",
             view === 'LAST' ? "bg-white text-black shadow-lg" : "text-zinc-500 hover:text-zinc-300"
           )}
        >
          Last Trade
        </button>
        <button 
           onClick={() => setView('PORTFOLIO')}
           className={cn(
             "px-4 py-1 rounded-md text-[9px] font-black uppercase tracking-widest transition-all",
             view === 'PORTFOLIO' ? "bg-white text-black shadow-lg" : "text-zinc-500 hover:text-zinc-300"
           )}
        >
          Portfolio
        </button>
      </div>

      <div className="flex-1 w-full bg-white text-zinc-900 rounded-2xl shadow-2xl overflow-hidden relative group transform transition-transform duration-500 hover:scale-[1.01] flex flex-col">
        {/* Header Strip */}
        <div className={`h-1.5 w-full shrink-0 ${isProfit ? 'bg-kalshi-green' : 'bg-kalshi-red'}`}></div>
        
        <div className="p-6 flex-1 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Background Glow for Premium Feel */}
            <div className={cn(
                "absolute inset-0 opacity-5 pointer-events-none transition-colors duration-700",
                isProfit ? "bg-kalshi-green" : "bg-kalshi-red"
            )} />

            <div className="mb-3 relative z-10">
                {view === 'LAST' ? (
                   isProfit ? (
                        <div className="w-10 h-10 rounded-full bg-kalshi-green/10 flex items-center justify-center text-kalshi-green">
                            <CheckCircle2 size={24} />
                        </div>
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-kalshi-red/10 flex items-center justify-center text-kalshi-red">
                            <XCircle size={24} />
                        </div>
                    )
                ) : (
                    <div className="w-10 h-10 rounded-full bg-poly-blue/10 flex items-center justify-center text-poly-blue">
                        <BarChart3 size={24} />
                    </div>
                )}
            </div>

            <h3 className="text-zinc-400 font-sans text-[10px] font-black tracking-[0.2em] uppercase mb-1 relative z-10">
                {view === 'LAST' ? 'Execution Result' : 'Strategic Analytics'}
            </h3>
            
            <div className="text-zinc-900 font-black text-4xl font-mono tracking-tighter mb-4 relative z-10 flex items-baseline">
                <span className="text-lg mr-1 opacity-50">$</span>
                {view === 'LAST' 
                   ? Math.abs(lastPnL?.amount || 0).toLocaleString() 
                   : Math.abs(analytics?.totalProfit || 0).toLocaleString()}
                <span className={cn(
                    "ml-2 text-xs font-black uppercase px-2 py-0.5 rounded-full",
                    isProfit ? "bg-kalshi-green/10 text-kalshi-green" : "bg-kalshi-red/10 text-kalshi-red"
                )}>
                   {isProfit ? 'PROFIT' : 'LOSS'}
                </span>
            </div>
            
            <div className="w-full border-t border-dashed border-zinc-200 my-4"></div>

            <div className="grid grid-cols-2 gap-8 w-full relative z-10">
                <div className="space-y-1">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">ROI Index</span>
                    <span className={`text-lg font-mono font-black ${isProfit ? 'text-kalshi-green' : 'text-kalshi-red'} flex items-center`}>
                        {view === 'LAST' ? lastPnL?.roi : analytics?.totalROI.toFixed(1)}%
                        {isProfit ? <ArrowUpRight size={16} className="ml-1"/> : <ArrowDownRight size={16} className="ml-1"/>}
                    </span>
                </div>
                <div className="space-y-1 text-right">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
                        {view === 'LAST' ? 'Trade ID' : 'Win Rate'}
                    </span>
                    <span className="text-lg font-mono font-black text-zinc-800">
                        {view === 'LAST' ? lastPnL?.tradeId : `${analytics?.winRate.toFixed(1)}%`}
                    </span>
                </div>
            </div>
        </div>

        {/* Dynamic Footer */}
        <div className="bg-zinc-50 px-6 py-4 flex items-center justify-between border-t border-zinc-100">
            <div className="flex items-center space-x-2">
                <div className={cn("w-1.5 h-1.5 rounded-full", isProfit ? "bg-kalshi-green" : "bg-kalshi-red")} />
                <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">
                    {view === 'LAST' ? 'On-Chain Verified' : `${tradeHistory.length} Sessions Active`}
                </span>
            </div>
            <span className="text-[9px] font-mono text-zinc-400">
                {view === 'LAST' ? new Date(lastPnL?.timestamp!).toLocaleTimeString() : 'GLOBAL AGGREGATE'}
            </span>
        </div>
      </div>
    </div>
  );
};

// Memoized to prevent re-renders when other widgets in the grid update
export const PnLCard = React.memo(measureRender(PnLCardBase, 'PnLCard'));
