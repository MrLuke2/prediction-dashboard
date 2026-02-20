import React, { useMemo, useState, useEffect } from 'react';
import { Radar, Waves, ExternalLink, ShieldAlert } from 'lucide-react';
import { useMarketStore } from '../../store';
import { measureRender } from '../../lib/perf';
import { EmptyState, LoadingSpinner } from '../ui/DataStates';
import { timeAgo, cn } from '../../lib/utils';
import { AI_PROVIDERS } from '../../config/aiProviders';

export const WhaleRadarSkeleton: React.FC = React.memo(() => (
    <div className="p-4 space-y-3">
        {[1, 2, 3].map(i => (
            <div key={i} className="h-16 w-full bg-zinc-900 border border-zinc-800 rounded-xl animate-shimmer overflow-hidden">
                <div className="h-full w-full bg-gradient-to-r from-transparent via-zinc-800/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
            </div>
        ))}
    </div>
));

const WhaleRadarBase: React.FC = () => {
  const movements = useMarketStore(state => state.whaleData);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const sortedMovements = useMemo(() => {
    return [...movements].sort((a, b) => b.timestamp - a.timestamp);
  }, [movements]);

  if (!movements) return <WhaleRadarSkeleton />;
  
  if (movements.length === 0) {
    return (
      <EmptyState 
        icon={<Waves size={32} />}
        title="Whale Radar Quiet"
        message="No whale movements detected on the A2UI Protocol in the last 24h."
      />
    );
  }

  return (
    <div className="h-full w-full overflow-hidden flex flex-col pt-2" data-testid="whale-radar">
      <div className="flex-1 overflow-y-auto custom-scrollbar px-3 space-y-2 pb-4">
        {sortedMovements.map((m) => {
          const isNew = now - m.timestamp < 30000;
          const provider = AI_PROVIDERS.find(p => p.id === m.providerId) || AI_PROVIDERS[0];
          
          return (
            <div 
              key={m.id}
              className={cn(
                "group relative p-3 rounded-xl border border-fin-border bg-zinc-900/30 transition-all hover:bg-zinc-900/50 hover:border-zinc-700",
                isNew && "animate-[flash-green_2s_ease-out]"
              )}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono text-zinc-500 truncate max-w-[120px]">{m.wallet}</span>
                    {m.confidence > 0.9 && (
                      <div className="px-1.5 py-0.5 rounded-full bg-poly-blue/10 border border-poly-blue/20 flex items-center">
                        <ShieldAlert size={8} className="text-poly-blue mr-1" />
                        <span className="text-[8px] font-bold text-poly-blue uppercase tracking-tighter">Verified Whale</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className={cn(
                      "text-xs font-bold uppercase tracking-tight",
                      m.action.includes('Bought') ? "text-kalshi-green" : "text-kalshi-red"
                    )}>
                      {m.action}
                    </span>
                    <span className="text-xs text-white font-medium">{m.amount.toLocaleString()} {m.asset}</span>
                  </div>
                </div>

                <div className="text-right flex flex-col items-end">
                  <div className="flex items-center space-x-1.5 mb-1">
                    <div 
                        className="w-1.5 h-1.5 rounded-full shadow-[0_0_4px_rgba(255,255,255,0.2)]" 
                        style={{ backgroundColor: provider.color }}
                        title={`Flagged by ${provider.name}`}
                    />
                    <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">{timeAgo(m.timestamp)}</span>
                  </div>
                  <div className="px-1.5 py-0.5 rounded-md bg-zinc-950 border border-zinc-800 text-[9px] font-mono text-poly-blue">
                    CONF: {(m.confidence * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
              
              <button className="absolute top-2 right-12 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-600 hover:text-white">
                <ExternalLink size={10} />
              </button>
            </div>
          );
        })}
      </div>
      
      <style>{`
        @keyframes shimmer { 100% { transform: translateX(100%); } }
        @keyframes flash-green {
          0% { background-color: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.3); }
          100% { background-color: rgba(9, 9, 11, 0.3); border-color: rgba(255, 255, 255, 0.05); }
        }
      `}</style>
    </div>
  );
};

export const WhaleRadar = React.memo(measureRender(WhaleRadarBase, 'WhaleRadar'));
