import React, { useMemo } from 'react';
import { useMarketStore } from '../../store';
import { motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/Tooltip';
import { cn } from '../../lib/utils';
import { Info, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const ASSETS = [
  'BTC', 'ETH', 'SOL', 'TRUMP', 'FED', 'OIL', 'GOLD', 'SPX'
];

interface CorrelationCellProps {
  val: number;
  row: string;
  col: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
}

const CorrelationCell: React.FC<CorrelationCellProps> = ({ val, row, col, side = 'top' }) => {
  const isSelf = row === col;
  
  // Color scale: Red (-1) -> Black (0) -> Green (1)
  const getBackgroundColor = (v: number) => {
    if (isSelf) return 'rgba(255, 255, 255, 0.05)';
    if (v > 0) return `rgba(16, 185, 129, ${Math.abs(v) * 0.8})`; // Green
    return `rgba(239, 68, 68, ${Math.abs(v) * 0.8})`; // Red
  };

  const getIntensity = (v: number) => {
    const abs = Math.abs(v);
    if (abs > 0.8) return 'High';
    if (abs > 0.4) return 'Moderate';
    return 'Low';
  };

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05, zIndex: 10 }}
            className={cn(
                "w-full h-full rounded-[2px] cursor-help flex items-center justify-center transition-all border border-black/20",
                isSelf && "border-white/5"
            )}
            style={{ backgroundColor: getBackgroundColor(val) }}
          >
            {Math.abs(val) > 0.6 && !isSelf && (
              <span className="text-[7px] font-black text-white/40 uppercase">
                {val > 0 ? <TrendingUp size={8} /> : <TrendingDown size={8} />}
              </span>
            )}
            {isSelf && <div className="w-1 h-1 rounded-full bg-white/20" />}
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side={side} className="bg-zinc-950 border-fin-border p-2">
            <div className="flex flex-col space-y-1">
                <div className="flex justify-between items-center space-x-6">
                    <span className="text-[9px] font-black text-text-muted uppercase tracking-tighter">Pairing</span>
                    <span className="text-[10px] font-bold text-white">{row} / {col}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black text-text-muted uppercase tracking-tighter">Correlation</span>
                    <span className={cn(
                        "text-[10px] font-mono font-bold",
                        val > 0 ? "text-kalshi-green" : val < 0 ? "text-kalshi-red" : "text-zinc-500"
                    )}>{val.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black text-text-muted uppercase tracking-tighter">Impact</span>
                    <span className="text-[10px] font-bold text-white">{getIntensity(val)}</span>
                </div>
            </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export const TacticalCorrelationHeatmap: React.FC = () => {
    // Generate mock correlation matrix
    // In a real app, this would come from a specialized 'correlation' service
    const correlationMatrix = useMemo(() => {
        const matrix: Record<string, Record<string, number>> = {};
        ASSETS.forEach(row => {
            matrix[row] = {};
            ASSETS.forEach(col => {
                if (row === col) {
                    matrix[row][col] = 1;
                } else {
                    // Seeded random for stability within a render cycle
                    const seed = row.length + col.length;
                    matrix[row][col] = Math.sin(seed * (Date.now() / 1000000)) * 0.95;
                }
            });
        });
        return matrix;
    }, []);

    return (
        <div className="h-full w-full flex flex-col bg-fin-card/30 p-2 select-none">
            {/* Legend */}
            <div className="flex justify-between items-center mb-3 px-1">
                <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-kalshi-red" />
                        <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Inverted</span>
                    </div>
                    <div className="flex items-center space-x-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
                        <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Neutral</span>
                    </div>
                    <div className="flex items-center space-x-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-kalshi-green" />
                        <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Coupled</span>
                    </div>
                </div>
                <span className="text-[8px] font-mono text-poly-blue/60 flex items-center">
                    <Info size={10} className="mr-1" />
                    BETA CALC ACTIVE
                </span>
            </div>

            {/* Matrix Grid */}
            <div className="flex-1 min-h-0 flex flex-col">
                {/* Header Row */}
                <div className="flex h-5 items-end mb-1">
                    <div className="w-10 overflow-hidden" />
                    <div className="flex-1 grid grid-cols-8 gap-1">
                        {ASSETS.map(asset => (
                            <div key={asset} className="text-[9px] font-black text-zinc-500 text-center uppercase tracking-tighter truncate px-0.5">
                                {asset}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Rows */}
                <div className="flex-1 grid grid-rows-8 gap-1">
                    {ASSETS.map(row => (
                        <div key={row} className="flex gap-1 items-center h-full">
                            <div className="w-10 text-[9px] font-black text-zinc-500 uppercase tracking-tighter truncate text-right pr-1.5">
                                {row}
                            </div>
                            <div className="flex-1 grid grid-cols-8 gap-1 h-full">
                                {ASSETS.map((col, colIdx) => (
                                    <CorrelationCell 
                                        key={`${row}-${col}`} 
                                        row={row} 
                                        col={col} 
                                        val={correlationMatrix[row][col]} 
                                        side={colIdx > 4 ? 'left' : 'top'}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Tactical Footer */}
            <div className="mt-3 pt-2 border-t border-fin-border/30 flex justify-between items-center">
                <div className="flex flex-col">
                    <span className="text-[7px] font-bold text-zinc-600 uppercase">Signal Strength</span>
                    <div className="flex items-center space-x-1 mt-0.5">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className={cn("w-1 h-2 rounded-[1px]", i <= 4 ? "bg-poly-blue" : "bg-zinc-800")} />
                        ))}
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-[7px] font-bold text-zinc-600 uppercase">Detection Confidence</span>
                    <div className="text-[10px] font-mono text-white/50">0.9942 <span className="text-kalshi-green">NOMINAL</span></div>
                </div>
            </div>
        </div>
    );
};
