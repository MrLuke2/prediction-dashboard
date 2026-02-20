import React from 'react';
import { CheckCircle2, XCircle, ArrowUpRight, ArrowDownRight, CircleDashed, BarChart3 } from 'lucide-react';
import { useTradeStore } from '../../store';
import { measureRender } from '../../lib/perf';

export const PnLCardSkeleton: React.FC = React.memo(() => (
    <div className="h-full w-full flex flex-col items-center justify-center p-8 space-y-4 bg-zinc-950/30">
        <BarChart3 className="text-zinc-800 animate-pulse" size={32} />
        <div className="w-full h-32 bg-zinc-900/50 rounded-xl animate-pulse"></div>
        <div className="w-1/2 h-4 bg-zinc-800 rounded animate-pulse"></div>
    </div>
));

const PnLCardBase: React.FC = () => {
  const data = useTradeStore(state => state.displayedPnL);
  
  if (!data) {
    return (
        <div className="relative w-full h-full flex items-center justify-center p-6 bg-zinc-950/50">
             <div className="flex flex-col items-center text-zinc-600 animate-pulse">
                <CircleDashed size={48} className="mb-4 opacity-50" />
                <span className="text-xs font-mono font-bold tracking-widest uppercase">System Idle</span>
                <span className="text-[10px] mt-1">Waiting for execution...</span>
             </div>
        </div>
    );
  }

  const isProfit = data.amount >= 0;
  
  return (
    <div className="relative w-full h-full flex items-center justify-center p-4 bg-zinc-950/50">
      
      {/* Dynamic resizing card */}
      <div className="w-full h-full bg-white text-zinc-900 rounded-xl shadow-2xl overflow-hidden relative group transform transition-transform duration-500 hover:scale-[1.01] flex flex-col">
        
        {/* Header Strip */}
        <div className={`h-2 w-full shrink-0 ${isProfit ? 'bg-kalshi-green' : 'bg-kalshi-red'}`}></div>
        
        <div className="p-6 flex-1 flex flex-col items-center justify-center">
            <div className="mb-4">
                {isProfit ? (
                    <div className="w-12 h-12 rounded-full bg-kalshi-green/10 flex items-center justify-center text-kalshi-green">
                        <CheckCircle2 size={32} />
                    </div>
                ) : (
                    <div className="w-12 h-12 rounded-full bg-kalshi-red/10 flex items-center justify-center text-kalshi-red">
                        <XCircle size={32} />
                    </div>
                )}
            </div>

            <h3 className="text-zinc-500 font-sans text-xs font-semibold tracking-wider uppercase mb-1">
                Trade Executed
            </h3>
            <div className="text-zinc-900 font-bold text-3xl font-mono tracking-tight mb-4">
                {isProfit ? '+' : '-'}${Math.abs(data.amount).toLocaleString()}
            </div>
            
            <div className="w-full border-t border-dashed border-zinc-200 my-4"></div>

            <div className="flex justify-between w-full text-sm mb-2">
                <span className="text-zinc-500">ROI</span>
                <span className={`font-bold ${isProfit ? 'text-kalshi-green' : 'text-kalshi-red'} flex items-center`}>
                    {data.roi}%
                    {isProfit ? <ArrowUpRight size={14} className="ml-1"/> : <ArrowDownRight size={14} className="ml-1"/>}
                </span>
            </div>
            <div className="flex justify-between w-full text-sm">
                <span className="text-zinc-500">ID</span>
                <span className="font-mono text-zinc-900">{data.tradeId}</span>
            </div>
        </div>

        {/* Footer */}
        <div className="bg-zinc-50 p-3 text-center border-t border-zinc-100">
            <p className="text-[10px] text-zinc-400 font-mono">
                CONFIRMED ON POLYGON • {new Date(data.timestamp).toLocaleTimeString()}
            </p>
        </div>
      </div>
    </div>
  );
};

// Memoized to prevent re-renders when other widgets in the grid update
export const PnLCard = React.memo(measureRender(PnLCardBase, 'PnLCard'));
