import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { LogLevel } from '../../types';
import { Terminal, Circle, Activity } from 'lucide-react';
import { useUIStore } from '../../store';
import { useVirtualizer } from '@tanstack/react-virtual';
import { measureRender } from '../../lib/perf';

export const LiveFeedSkeleton: React.FC = React.memo(() => (
    <div className="h-full flex flex-col items-center justify-center p-8 space-y-4 bg-zinc-950/30">
        <Activity className="text-zinc-800 animate-pulse" size={32} />
        <div className="w-full space-y-2">
            {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-8 bg-zinc-900/50 rounded animate-pulse" style={{ opacity: 1 - i * 0.15 }}></div>
            ))}
        </div>
    </div>
));

// Extracted LogItem for cleaner virtualization and memoization
const LogItem = React.memo(({ log, idx, styles }: { log: any, idx: number, styles: any }) => {
    const isEven = idx % 2 === 0;
    
    // memoized derived values for performance
    const isKalshiAction = useMemo(() => 
        log.message.toLowerCase().includes('kalshi'),
        [log.message]
    );
    
    const messageColor = isKalshiAction ? 'text-kalshi-green' : styles.color;
    
    const timeString = useMemo(() => 
        new Date(log.timestamp).toLocaleTimeString([], { 
            hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' 
        }),
        [log.timestamp]
    );

    return (
        <div className={`flex flex-col py-3 px-4 border-b border-fin-border ${isEven ? 'bg-fin-card/30' : 'bg-transparent'} hover:bg-fin-hover/10 transition-colors h-full`}>
            <div className="flex justify-between items-center mb-1">
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${styles.badge}`}>
                    {log.agent}
                </span>
                <span className="text-text-muted text-[10px] font-mono">
                    {timeString}
                </span>
            </div>
            <span className={`${messageColor} font-medium leading-relaxed`}>
                {log.message}
            </span>
        </div>
    );
});

const LiveFeedBase: React.FC = () => {
  const logs = useUIStore(state => state.logs);
  const parentRef = useRef<HTMLDivElement>(null);

  // Virtualizer Pass: Hardening DOM nodes to ~20 visible rows
  const rowVirtualizer = useVirtualizer({
    count: logs.length,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(() => 85, []), // Stable callback for virtualizer
    overscan: 5,
  });

  // Handle auto-scroll to bottom on new logs
  useEffect(() => {
    if (logs.length > 0) {
      rowVirtualizer.scrollToIndex(logs.length - 1, { behavior: 'smooth' });
    }
  }, [logs.length, rowVirtualizer]);

  // Stable callback for log styles to prevent re-renders
  const getLogStyles = useCallback((level: LogLevel) => {
    switch (level) {
      case LogLevel.INFO: return { color: 'text-text-main', badge: 'bg-poly-blue/10 text-poly-blue border-poly-blue/20' };
      case LogLevel.WARN: return { color: 'text-amber-400', badge: 'bg-amber-500/10 text-amber-500 border-amber-500/20' };
      case LogLevel.ERROR: return { color: 'text-kalshi-red', badge: 'bg-kalshi-red/10 text-kalshi-red border-kalshi-red/20' };
      case LogLevel.SUCCESS: return { color: 'text-kalshi-green', badge: 'bg-kalshi-green/10 text-kalshi-green border-kalshi-green/20' };
      default: return { color: 'text-text-main', badge: 'bg-zinc-800 text-zinc-400 border-zinc-700' };
    }
  }, []);

  return (
    <div className="h-full flex flex-col font-sans text-xs overflow-hidden bg-zinc-950/30">
        <div 
            ref={parentRef}
            className="flex-1 overflow-y-auto min-h-0 p-0 z-10 custom-scrollbar"
        >
            {logs.length === 0 ? (
                <div className="p-4 text-text-muted italic flex items-center justify-center h-full">
                    <Activity className="mr-2 animate-spin" size={16}/> Connecting to Council...
                </div>
            ) : (
                <div
                    aria-live="polite"
                    aria-atomic="false"
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
                            <LogItem 
                                log={logs[virtualItem.index]} 
                                idx={virtualItem.index} 
                                styles={getLogStyles(logs[virtualItem.index].level)}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
  );
};

// Apply memo and measureRender HOC
export const LiveFeed = React.memo(measureRender(LiveFeedBase, 'LiveFeed'));
