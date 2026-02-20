import React, { useState, useEffect, useMemo } from 'react';
import { ArrowUp, ArrowDown, Bitcoin } from 'lucide-react';
import { measureRender } from '../../lib/perf';

export const BitcoinTrackerSkeleton: React.FC = React.memo(() => (
    <div className="h-full w-full flex flex-col items-center justify-center p-8 space-y-4 bg-zinc-950/20">
        <Bitcoin className="text-zinc-800 animate-pulse" size={32} />
        <div className="w-32 h-10 bg-zinc-900/50 rounded animate-pulse"></div>
        <div className="w-24 h-4 bg-zinc-800/30 rounded animate-pulse"></div>
    </div>
));

const BitcoinTrackerBase: React.FC = () => {
  const [price, setPrice] = useState(98245.50);
  const [trend, setTrend] = useState<'up' | 'down'>('up');
  const [lastDiff, setLastDiff] = useState(0);

  // Sub-second updates simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setPrice((prev) => {
        // Random walk with slight volatility
        const volatility = 25; 
        const change = (Math.random() - 0.45) * volatility; 
        const newPrice = prev + change;
        
        setLastDiff(change);
        setTrend(change >= 0 ? 'up' : 'down');
        
        return newPrice;
      });
    }, 150); // 150ms updates for sub-second feel

    return () => clearInterval(interval);
  }, []);

  // Format helper
  const formatVal = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Memoize bar indices to prevent array allocation on 150ms interval re-renders
  const barData = useMemo(() => Array.from({ length: 30 }).map(() => ({
    height: 20 + Math.random() * 60,
    isBlue: Math.random() > 0.5
  })), []); // Intentional empty deps: static visual noise

  return (
    <div className="h-full flex flex-col relative bg-zinc-950/20">
      
      {/* Background Grid Effect */}
      <div className="absolute inset-0 grid-bg-subtle opacity-50 pointer-events-none"></div>

      <div className="flex-1 flex flex-col items-center justify-center relative z-10 p-4">
        
        {/* Status Indicator */}
        <div className="absolute top-2 right-4 flex items-center space-x-1">
            <div className="w-1.5 h-1.5 rounded-full bg-kalshi-green animate-pulse"></div>
            <span className="text-[9px] text-zinc-500 font-mono">LIVE FEED</span>
        </div>

        <div className="text-center mb-1">
            <span className="text-zinc-500 text-[10px] font-mono tracking-[0.2em] uppercase">BTC / USD</span>
        </div>
        
        {/* Main Price Display */}
        <div className={`text-4xl lg:text-5xl font-mono font-bold tracking-tighter transition-colors duration-75 ${trend === 'up' ? 'text-white' : 'text-zinc-200'}`}>
            <span className="text-zinc-600 text-2xl align-top mr-1">$</span>
            {formatVal(price).split('.')[0]}
            <span className="text-2xl text-zinc-500">.{formatVal(price).split('.')[1]}</span>
        </div>

        {/* Delta Indicator */}
        <div className={`flex items-center mt-2 px-2 py-1 rounded bg-zinc-900 border border-fin-border ${trend === 'up' ? 'text-kalshi-green border-kalshi-green/20' : 'text-kalshi-red border-kalshi-red/20'}`}>
            {trend === 'up' ? <ArrowUp size={12} className="mr-1" /> : <ArrowDown size={12} className="mr-1" />}
            <span className="font-mono text-xs font-bold">{Math.abs(lastDiff).toFixed(2)}</span>
        </div>

      </div>

      {/* Footer / Mini Chart Simulation - Use memoized barData */}
      <div className="h-12 w-full flex items-end justify-between space-x-0.5 px-4 pb-0 opacity-40 overflow-hidden">
        {barData.map((bar, i) => (
            <div 
                key={i} 
                className={`flex-1 rounded-t-sm transition-all duration-300 ${bar.isBlue ? 'bg-poly-blue' : 'bg-zinc-700'}`}
                style={{ height: `${bar.height}%` }}
            ></div>
        ))}
      </div>
    </div>
  );
};

// Memoized to localize high-frequency local state updates
export const BitcoinTracker = React.memo(measureRender(BitcoinTrackerBase, 'BitcoinTracker'));
