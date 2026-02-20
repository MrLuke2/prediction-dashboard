import React, { useMemo, useCallback } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { Radar } from 'lucide-react';
import { useMarketStore } from '../../store';
import { measureRender } from '../../lib/perf';

export const WhaleRadarSkeleton: React.FC = React.memo(() => (
    <div className="h-full w-full flex flex-col items-center justify-center p-8 space-y-4 bg-zinc-950/30">
        <Radar className="text-zinc-800 animate-pulse" size={32} />
        <div className="w-full h-full max-h-[200px] border border-zinc-900 rounded-full border-dashed animate-pulse flex items-center justify-center">
            <div className="w-1/2 h-1/2 border border-zinc-900 rounded-full border-dashed"></div>
        </div>
    </div>
));

// Extracted for stability and memoization
const CustomTooltip = React.memo(({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div className="bg-fin-card border border-fin-border p-3 rounded shadow-lg z-50 min-w-[150px]">
        <p className="text-white font-mono text-xs mb-1">{d.wallet}</p>
        <div className="flex items-center justify-between mb-1">
          <span className={d.action === 'Bought' ? "text-kalshi-green font-bold text-xs" : "text-kalshi-red font-bold text-xs"}>
              {d.action.toUpperCase()}
          </span>
          <span className="text-text-muted text-[10px]">{d.asset}</span>
        </div>
        <div className="border-t border-fin-border my-1"></div>
        <p className="text-text-main text-xs">Amt: ${d.amount.toLocaleString()}</p>
        <p className="text-poly-blue text-xs">Conf: {(d.confidence * 100).toFixed(0)}%</p>
      </div>
    );
  }
  return null;
});

const WhaleRadarBase: React.FC = () => {
  const movements = useMarketStore(state => state.whaleData);
  
  // Memoize complex data transformation to prevent O(n) work on every render
  const data = useMemo(() => {
    return movements.map(m => ({
      x: Math.log(m.amount), // Log scale for clearer view of amounts
      y: m.confidence * 100,
      z: m.amount, // Bubble size
      ...m
    }));
  }, [movements]);

  return (
    <div className="h-full w-full relative p-2 bg-zinc-950/30">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
          <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
          <XAxis type="number" dataKey="x" name="Amount" hide />
          <YAxis type="number" dataKey="y" name="Confidence" domain={[0, 100]} hide />
          <ZAxis type="number" dataKey="z" range={[20, 300]} />
          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: '#52525b' }} />
          <Scatter name="Whales" data={data}>
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${entry.wallet}-${index}`} 
                fill={entry.action.includes('Bought') ? '#10b981' : '#f43f5e'} 
                fillOpacity={0.6}
                stroke={entry.action.includes('Bought') ? '#10b981' : '#f43f5e'}
                strokeWidth={1}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
      <div className="absolute bottom-2 left-2 text-[10px] text-zinc-600 font-mono">X: Volume / Y: Confidence</div>
    </div>
  );
};

// Apply memo and performance tracking
export const WhaleRadar = React.memo(measureRender(WhaleRadarBase, 'WhaleRadar'));
