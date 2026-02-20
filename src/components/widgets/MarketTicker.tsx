import React, { useMemo } from 'react';
import { MarketPair } from '../../types';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { measureRender } from '../../lib/perf';

interface MarketTickerProps {
  data: MarketPair[];
}

const MarketTickerBase: React.FC<MarketTickerProps> = ({ data }) => {
  // Memoize duplicate data to prevent unnecessary array operations on re-render
  const displayData = useMemo(() => [...data, ...data], [data]);

  return (
    <div className="w-full bg-fin-card border-b border-fin-border overflow-hidden h-12 flex items-center relative shadow-sm z-40">
      {/* Edge gradients for smooth entry/exit */}
      <div className="absolute top-0 left-0 h-full w-24 bg-gradient-to-r from-fin-card to-transparent z-10 pointer-events-none"></div>
      <div className="absolute top-0 right-0 h-full w-24 bg-gradient-to-l from-fin-card to-transparent z-10 pointer-events-none"></div>
      
      {/* 
        CSS-only infinite scroll: 
        1. Duplicate items in JSX
        2. Translate from 0% to -50%
        3. Hardware accelerated with translate3d
        4. Pause on hover via CSS utility
      */}
      <div className="flex animate-ticker-scroll whitespace-nowrap hover:[animation-play-state:paused] will-change-transform motion-reduce:animate-none motion-reduce:overflow-x-auto custom-scrollbar">
        {displayData.map((pair, idx) => (
          <div key={`${pair.symbol}-${idx}`} className="flex items-center space-x-6 mx-6 text-sm group cursor-pointer">
            <div className="flex flex-col">
                <span className="text-text-muted font-bold text-xs font-mono">{pair.symbol}</span>
                <div className="flex items-center space-x-2">
                    <span className="text-white font-medium">P: {(pair.polymarketPrice * 100).toFixed(0)}¢</span>
                    <span className="text-text-muted text-xs">|</span>
                    <span className="text-white font-medium">K: {(pair.kalshiPrice * 100).toFixed(0)}¢</span>
                </div>
            </div>
            
            <div className={`flex items-center px-2 py-1 rounded-md bg-zinc-900 border border-fin-border ${
              pair.spread > 0.03 ? 'text-kalshi-green' : pair.spread < 0 ? 'text-kalshi-red' : 'text-poly-blue'
            }`}>
              <span className="font-mono font-bold mr-1">{(pair.spread * 100).toFixed(1)}%</span>
              {pair.trend === 'up' && <TrendingUp size={14} />}
              {pair.trend === 'down' && <TrendingDown size={14} />}
              {pair.trend === 'neutral' && <Minus size={14} />}
            </div>
            
            <div className="h-6 w-px bg-fin-border mx-2"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Memoized to prevent re-renders when parent layout updates but market data is stable
export const MarketTicker = React.memo(measureRender(MarketTickerBase, 'MarketTicker'));
