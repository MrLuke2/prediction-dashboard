import React, { useRef, useCallback, useMemo } from 'react';
import { History } from 'lucide-react';
import { useTradeStore } from '../../store';
import { useVirtualizer } from '@tanstack/react-virtual';
import { measureRender } from '../../lib/perf';

export const TradeHistorySkeleton: React.FC = React.memo(() => (
    <div className="h-full w-full flex flex-col bg-fin-card/30">
        <div className="h-10 bg-zinc-900/50 border-b border-fin-border animate-pulse"></div>
        <div className="flex-1 p-4 space-y-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-12 bg-zinc-900/30 rounded animate-pulse"></div>
            ))}
        </div>
    </div>
));

const TradeItem = React.memo(({ trade, isSelected, onSelect }: { trade: any, isSelected: boolean, onSelect: (t: any) => void }) => {
    const handleSelect = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onSelect(trade);
    }, [trade, onSelect]);

    const timestamp = useMemo(() => 
        new Date(trade.timestamp).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' }),
        [trade.timestamp]
    );

    const isPositive = trade.amount >= 0;

    return (
        <div 
            onClick={handleSelect}
            className={`
                grid grid-cols-3 gap-2 px-4 py-3 border-b border-fin-border/50 text-[10px] font-mono items-center cursor-pointer hover:bg-white/5 transition-colors h-full
                ${isSelected ? 'bg-white/10 text-white' : 'text-text-muted'}
            `}
        >
            <div>{timestamp}</div>
            <div className={`text-right font-bold ${isPositive ? 'text-kalshi-green' : 'text-kalshi-red'}`}>
                {isPositive ? '+' : ''}{trade.amount.toLocaleString()}
            </div>
            <div className={`text-right ${isPositive ? 'text-kalshi-green' : 'text-kalshi-red'}`}>{trade.roi}%</div>
        </div>
    );
});

const TradeHistoryBase: React.FC = () => {
  const { tradeHistory: history, setDisplayedPnL: onSelect, displayedPnL } = useTradeStore();
  const selectedTradeId = displayedPnL?.tradeId;
  const parentRef = useRef<HTMLDivElement>(null);

  // Virtualization hardening: limit DOM complexity for long trade histories
  const rowVirtualizer = useVirtualizer({
    count: history.length,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(() => 45, []), // Fixed row height for trades
    overscan: 5,
  });

  return (
    <div className="flex flex-col h-full bg-fin-card/30">
        <div className="grid grid-cols-3 gap-2 px-4 py-3 border-b border-fin-border text-[9px] text-text-muted font-bold uppercase tracking-wider bg-zinc-900/50 shrink-0">
            <div>Time</div>
            <div className="text-right">PnL</div>
            <div className="text-right">ROI</div>
        </div>
        <div 
            ref={parentRef}
            className="flex-1 overflow-y-auto min-h-0 overflow-x-hidden custom-scrollbar p-0"
        >
            {history.length === 0 ? (
                 <div className="p-4 text-center text-xs text-zinc-600 font-mono">NO TRADES RECORDED</div>
            ) : (
                <div
                    style={{
                        height: `${rowVirtualizer.getTotalSize()}px`,
                        width: '100%',
                        position: 'relative',
                    }}
                >
                    {rowVirtualizer.getVirtualItems().map((virtualItem) => (
                        <div
                            key={virtualItem.key}
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: `${virtualItem.size}px`,
                                transform: `translateY(${virtualItem.start}px)`,
                            }}
                        >
                            <TradeItem 
                                trade={history[virtualItem.index]}
                                isSelected={selectedTradeId === history[virtualItem.index].tradeId}
                                onSelect={onSelect}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
  );
};

export const TradeHistory = React.memo(measureRender(TradeHistoryBase, 'TradeHistory'));
