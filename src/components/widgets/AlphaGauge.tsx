import React, { useMemo } from 'react';
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer, AreaChart, Area, XAxis, YAxis } from 'recharts';
import { Zap, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMarketStore } from '../../store';
import { measureRender } from '../../lib/perf';
import { AI_PROVIDERS } from '../../config/aiProviders';
import { cn } from '../../lib/utils';

export const AlphaGaugeSkeleton: React.FC = React.memo(() => (
    <div className="h-full w-full flex flex-col items-center justify-center p-8 space-y-4 bg-zinc-950/30" data-testid="alpha-gauge-skeleton">
        <div className="w-48 h-32 rounded-t-full border-t-4 border-r-4 border-l-4 border-zinc-900 border-dashed animate-pulse" />
        <div className="w-24 h-4 bg-zinc-900 rounded animate-pulse" />
    </div>
));

const AlphaGaugeBase: React.FC = () => {
  const data = useMarketStore(state => state.alphaMetric);
  const [isHovered, setIsHovered] = React.useState(false);

  const regime = useMemo(() => {
    if (!data) return { label: 'N/A', color: 'text-zinc-500', bg: 'bg-zinc-500/10 border-zinc-500/20' };
    const p = data.probability;
    if (p < 30) return { label: 'LOW', color: 'text-kalshi-red', bg: 'bg-kalshi-red/10 border-kalshi-red/20' };
    if (p < 60) return { label: 'MEDIUM', color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20' };
    if (p < 85) return { label: 'HIGH', color: 'text-poly-blue', bg: 'bg-poly-blue/10 border-poly-blue/20' };
    return { label: 'CRITICAL', color: 'text-kalshi-green', bg: 'bg-kalshi-green/10 border-kalshi-green/20' };
  }, [data?.probability]);

  const chartData = useMemo(() => {
    if (!data) return [{ name: 'Alpha', value: 0, fill: '#18181b' }];
    return [
      {
        name: 'Alpha',
        value: data.probability,
        fill: data.probability > 85 ? '#10b981' : data.probability > 60 ? '#2563eb' : data.probability > 30 ? '#f59e0b' : '#f43f5e',
      },
    ];
  }, [data]);

  const breakdownItems = useMemo(() => {
    if (!data) return [];
    if (!data.breakdown) {
      // Defer to default provider if breakdown is missing
      const defaultProvider = AI_PROVIDERS[0];
      return [
        { label: 'Fundamentals', score: data.probability, provider: defaultProvider },
        { label: 'Sentiment', score: data.probability, provider: defaultProvider },
        { label: 'Risk', score: data.probability, provider: defaultProvider },
      ];
    }
    return [
      { label: 'Fundamentals', ...data.breakdown.fundamentals, provider: AI_PROVIDERS.find(p => p.id === data.breakdown?.fundamentals.providerId) || AI_PROVIDERS[0] },
      { label: 'Sentiment', ...data.breakdown.sentiment, provider: AI_PROVIDERS.find(p => p.id === data.breakdown?.sentiment.providerId) || AI_PROVIDERS[0] },
      { label: 'Risk', ...data.breakdown.risk, provider: AI_PROVIDERS.find(p => p.id === data.breakdown?.risk.providerId) || AI_PROVIDERS[0] },
    ];
  }, [data]);

  if (!data) return <AlphaGaugeSkeleton />;

  return (
    <div 
      className="h-full w-full flex flex-col items-center justify-center relative p-4 bg-zinc-950/10 select-none group" 
      data-testid="alpha-gauge"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Historical Alpha Frontier Sparkline */}
      <div className="absolute inset-x-2 top-2 bottom-8 opacity-40 overflow-hidden pointer-events-none">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data.history}>
            <defs>
              <linearGradient id="alphaFrontier" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Area 
                type="monotone" 
                dataKey="probability" 
                stroke="#06b6d4" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#alphaFrontier)" 
                isAnimationActive={false}
            />
            <YAxis domain={[0, 100]} hide />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="w-full flex-1 min-h-0 relative z-20 transition-transform duration-500 group-hover:scale-105">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart 
            innerRadius="85%" 
            outerRadius="100%" 
            barSize={12} 
            data={chartData} 
            startAngle={180} 
            endAngle={0}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <RadialBar
              background={{ fill: 'rgba(24, 24, 27, 0.4)' }}
              dataKey="value"
              cornerRadius={10}
              isAnimationActive={true}
              animationDuration={1500}
              animationEasing="ease-out"
            />
          </RadialBarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="absolute bottom-[20%] left-1/2 transform -translate-x-1/2 text-center pointer-events-none z-30">
        <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center"
        >
            <div className={cn("px-2 py-0.5 rounded-full border text-[8px] font-black tracking-[0.2em] mb-2", regime.bg, regime.color)}>
              {regime.label}
            </div>
            <div className="text-5xl font-bold text-white tracking-tighter font-mono flex items-baseline leading-none">
              {data?.probability?.toFixed(0) ?? '0'}
              <span className="text-xl text-zinc-600 ml-0.5">%</span>
            </div>
            <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-2 flex items-center space-x-1">
              <span>Alpha Entropy</span>
              <Zap size={8} className="text-cyan-400 fill-cyan-400" />
            </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {isHovered && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            className="absolute top-0 inset-x-4 bg-zinc-950/95 border border-fin-border rounded-xl p-3 shadow-2xl z-50 backdrop-blur-md"
          >
            <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 border-b border-white/5 pb-2">Agent Breakdown</h4>
            <div className="space-y-3">
              {breakdownItems.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between items-center text-[10px]">
                    <div className="flex items-center space-x-2">
                       <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.provider.color }} />
                       <span className="text-white font-bold">{item.provider.name} <span className="text-zinc-500 font-normal">({item.label})</span></span>
                    </div>
                    <span className="font-mono text-zinc-400">{item.score}%</span>
                  </div>
                  <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${item.score}%` }}
                        transition={{ duration: 1, delay: idx * 0.1 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: item.provider.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const AlphaGauge = React.memo(measureRender(AlphaGaugeBase, 'AlphaGauge'));
