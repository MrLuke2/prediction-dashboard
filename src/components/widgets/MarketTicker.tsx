import React, { useMemo, useEffect, useState } from 'react';
import { MarketPair } from '../../types';
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import { measureRender } from '../../lib/perf';
import { EmptyState, StaleDataBadge } from '../ui/DataStates';
import { STALE_DATA_THRESHOLD_MS } from '../../config/constants';
import { useUIStore } from '../../store';
import { cn } from '../../lib/utils';

interface MarketTickerProps {
  data: MarketPair[];
  lastUpdate?: number;
}

const MarketTickerBase: React.FC<MarketTickerProps> = ({ data, lastUpdate }) => {
  const [isStale, setIsStale] = useState(false);

  useEffect(() => {
    if (!lastUpdate) return;
    
    const checkStale = () => {
      const now = Date.now();
      setIsStale(now - lastUpdate > STALE_DATA_THRESHOLD_MS);
    };

    const interval = setInterval(checkStale, 1000);
    checkStale();

    return () => clearInterval(interval);
  }, [lastUpdate]);

  const displayData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return [...data, ...data];
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="w-full bg-fin-card border-b border-fin-border h-12 flex items-center justify-center relative z-40" data-testid="market-ticker">
         <div className="flex items-center space-x-2 text-zinc-500 text-[10px] uppercase font-bold tracking-widest">
            <Info size={12} />
            <span>Awaiting market data...</span>
         </div>
      </div>
    );
  }

  return (
    <div 
      className="w-full bg-fin-card border-b border-fin-border overflow-hidden h-12 flex items-center relative shadow-sm z-40" 
      data-testid="market-ticker"
    >
      {isStale && <StaleDataBadge className="top-auto bottom-1 scale-75 origin-bottom-right" />}
      
      <div className="absolute top-0 left-0 h-full w-24 bg-gradient-to-r from-fin-card to-transparent z-10 pointer-events-none"></div>
      <div className="absolute top-0 right-0 h-full w-24 bg-gradient-to-l from-fin-card to-transparent z-10 pointer-events-none"></div>
      
      <div className={cn(
        "flex animate-ticker-scroll whitespace-nowrap hover:[animation-play-state:paused] will-change-transform motion-reduce:animate-none motion-reduce:overflow-x-auto",
        "custom-scrollbar select-text"
      )}>
        {displayData.map((pair, idx) => (
          <div 
            key={`${pair.symbol}-${idx}`} 
            onClick={(e) => {
              e.preventDefault();
              useUIStore.getState().setSearchQuery(pair.symbol);
            }}
            className="flex items-center space-x-6 mx-6 text-sm group cursor-pointer hover:scale-[1.02] transition-transform active:scale-95"
          >
            <div className="flex flex-col">
                <span className="text-text-muted font-bold text-xs font-mono tracking-tighter group-hover:text-white transition-colors">{pair.symbol}</span>
                <div className="flex items-center space-x-2">
                    <span className="text-white font-medium">P: {(pair.polymarketPrice * 100).toFixed(0)}¢</span>
                    <span className="text-text-muted text-[10px]">|</span>
                    <span className="text-white font-medium">K: {(pair.kalshiPrice * 100).toFixed(0)}¢</span>
                </div>
            </div>
            
            <div className={cn(
              "flex items-center px-1.5 py-0.5 rounded bg-zinc-900 border border-fin-border transition-colors group-hover:border-zinc-700",
              pair.spread > 0.03 ? 'text-kalshi-green' : pair.spread < 0 ? 'text-kalshi-red' : 'text-poly-blue'
            )}>
              <span className="font-mono font-bold text-xs mr-1">{(pair.spread * 100).toFixed(1)}%</span>
              {pair.trend === 'up' && <TrendingUp size={12} />}
              {pair.trend === 'down' && <TrendingDown size={12} />}
              {pair.trend === 'neutral' && <Minus size={12} />}
            </div>
            
            <div className="h-4 w-px bg-fin-border mx-2"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const MarketTicker = React.memo(measureRender(MarketTickerBase, 'MarketTicker'));
