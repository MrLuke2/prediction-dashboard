import React, { useMemo } from 'react';
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { Zap } from 'lucide-react';
import { useMarketStore } from '../../store';
import { measureRender } from '../../lib/perf';

export const AlphaGaugeSkeleton: React.FC = React.memo(() => (
    <div className="h-full w-full flex flex-col items-center justify-center p-8 space-y-4 bg-zinc-950/30 font-sans">
        <Zap className="text-zinc-800 animate-pulse" size={32} />
        <div className="w-16 h-16 rounded-full border-4 border-zinc-800 border-t-transparent animate-spin"></div>
        <div className="w-24 h-4 bg-zinc-800 rounded animate-pulse"></div>
    </div>
));

const AlphaGaugeBase: React.FC = () => {
  const data = useMarketStore(state => state.alphaMetric);

  // Memoize chart data to avoid Recharts re-calculation on ogni parent render
  const chartData = useMemo(() => [
    {
      name: 'Alpha',
      value: data.probability,
      fill: data.probability > 75 ? '#10b981' : data.probability > 40 ? '#2563eb' : '#f43f5e',
    },
  ], [data.probability]);

  return (
    <div className="h-full w-full flex flex-col items-center justify-center relative p-4 bg-zinc-950/30 min-h-0">
      <div className="w-full flex-1 min-h-0 relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart 
            innerRadius="75%" 
            outerRadius="100%" 
            barSize={12} 
            data={chartData} 
            startAngle={180} 
            endAngle={0}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <RadialBar
              background={{ fill: '#27272a' }}
              dataKey="value"
              cornerRadius={6}
            />
          </RadialBarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="absolute top-2/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
        <div className="flex items-center justify-center text-text-muted mb-1">
             <Zap size={14} className={data.probability > 60 ? "text-poly-blue fill-poly-blue" : "text-zinc-600"} aria-hidden="true" />
        </div>
        <div 
          className="text-3xl font-bold text-white tracking-tight font-mono"
          aria-live="polite"
          aria-atomic="true"
        >
          {data.probability.toFixed(0)}%
        </div>
        <div className="text-[10px] font-sans text-text-muted uppercase tracking-wide mt-1">
          Confidence
        </div>
      </div>
    </div>
  );
};

// Memoized to prevent re-renders unless store state actually changes
export const AlphaGauge = React.memo(measureRender(AlphaGaugeBase, 'AlphaGauge'));
