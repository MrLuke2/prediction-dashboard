import React, { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { LogLevel, LogEntry } from '../../types';
import { ChevronDown, ArrowDown, Activity, Filter, Info, AlertTriangle, AlertCircle, MessageSquare, Swords } from 'lucide-react';
import { useUIStore } from '../../store';
import { useVirtualizer } from '@tanstack/react-virtual';
import { measureRender } from '../../lib/perf';
import { LoadingSpinner, EmptyState } from '../ui/DataStates';
import { cn } from '../../lib/utils';
import { AI_PROVIDERS } from '../../config/aiProviders';

type FilterType = 'ALL' | 'INFO' | 'WARN' | 'ERROR' | 'DEBATE';

// Extracted LogItem for cleaner virtualization and memoization
const LogItem = React.memo(({ log, idx }: { log: LogEntry, idx: number }) => {
    const provider = AI_PROVIDERS.find(p => p.id === log.providerId) || AI_PROVIDERS[0];
    
    const getLevelStyles = (level: LogLevel) => {
        switch (level) {
            case LogLevel.INFO: return { 
                badge: 'bg-zinc-900 border-zinc-800 text-zinc-400', 
                text: 'text-zinc-300',
                icon: <Info size={10} /> 
            };
            case LogLevel.WARN: return { 
                badge: 'bg-amber-500/10 border-amber-500/20 text-amber-500', 
                text: 'text-amber-200/90',
                icon: <AlertTriangle size={10} /> 
            };
            case LogLevel.ERROR: return { 
                badge: 'bg-kalshi-red/10 border-kalshi-red/20 text-kalshi-red animate-pulse', 
                text: 'text-kalshi-red font-bold',
                icon: <AlertCircle size={10} /> 
            };
            case LogLevel.DEBATE: return { 
                badge: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.2)]', 
                text: 'text-indigo-100/90 italic font-medium',
                icon: <MessageSquare size={10} /> 
            };
            default: return { 
                badge: 'bg-zinc-900 border-zinc-800 text-zinc-400', 
                text: 'text-zinc-400',
                icon: <Info size={10} /> 
            };
        }
    };

    const styles = getLevelStyles(log.level);
    
    const timeString = useMemo(() => 
        new Date(log.timestamp).toLocaleTimeString([], { 
            hour: '2-digit', minute:'2-digit', second:'2-digit', hour12: true
        }),
        [log.timestamp]
    );

    return (
        <div className={cn(
            "flex flex-col py-3 px-4 border-b border-white/5 transition-colors group",
            idx % 2 === 0 ? 'bg-white/[0.02]' : 'bg-transparent',
            "hover:bg-white/[0.05]"
        )}>
            <div className="flex justify-between items-center mb-1.5">
                <div className="flex items-center space-x-2">
                    <div className={cn("flex items-center space-x-1.5 px-2 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wider", styles.badge)}>
                        {styles.icon}
                        <span>{log.agent}</span>
                    </div>
                    <div className="flex items-center space-x-1 pl-1.5 border-l border-zinc-800">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: provider.color }} />
                        <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-tighter">{provider.name}</span>
                    </div>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-zinc-600 text-[9px] font-mono leading-none">
                        {timeString}
                    </span>
                    {log.level === LogLevel.DEBATE && (
                        <span className="text-indigo-500/80 uppercase text-[8px] font-black tracking-widest mt-1">
                            COUNCIL DEBATE
                        </span>
                    )}
                </div>
            </div>
            <span className={cn("text-[11px] leading-relaxed break-words", styles.text)}>
                {log.message}
            </span>
        </div>
    );
});

const LiveFeedBase: React.FC = () => {
  const allLogs = useUIStore(state => state.logs);
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [isAtBottom, setIsAtBottom] = useState(true);
  const parentRef = useRef<HTMLDivElement>(null);

  const filteredLogs = useMemo(() => {
    if (filter === 'ALL') return allLogs;
    return allLogs.filter(log => log.level === filter);
  }, [allLogs, filter]);

  const rowVirtualizer = useVirtualizer({
    count: filteredLogs.length,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(() => 65, []),
    overscan: 10,
  });

  const handleScroll = useCallback(() => {
    if (!parentRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = parentRef.current;
    const atBottom = scrollHeight - scrollTop - clientHeight < 50;
    setIsAtBottom(atBottom);
  }, []);

  useEffect(() => {
    if (isAtBottom && filteredLogs.length > 0) {
      rowVirtualizer.scrollToIndex(filteredLogs.length - 1, { behavior: 'smooth' });
    }
  }, [filteredLogs.length, isAtBottom, rowVirtualizer]);

  const scrollToBottom = () => {
    setIsAtBottom(true);
    rowVirtualizer.scrollToIndex(filteredLogs.length - 1, { behavior: 'smooth' });
  };

  return (
    <div className="h-full flex flex-col font-sans overflow-hidden bg-zinc-950/20" data-testid="live-feed">
        {/* Filters */}
        <div className="flex-none p-2 border-b border-fin-border bg-black/20 flex items-center justify-between">
            <div className="flex space-x-1">
                {(['ALL', 'INFO', 'WARN', 'ERROR', 'DEBATE'] as const).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={cn(
                            "px-2 py-1 rounded text-[9px] font-bold uppercase tracking-widest transition-all",
                            filter === f ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"
                        )}
                    >
                        {f}
                    </button>
                ))}
            </div>
            <div className="text-[9px] font-mono text-zinc-600 flex items-center">
                <Filter size={10} className="mr-1" />
                <span>ACTIVE FILTERS</span>
            </div>
        </div>

        <div 
            ref={parentRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto min-h-0 custom-scrollbar relative"
        >
            {filteredLogs.length === 0 ? (
                <EmptyState 
                    icon={<Activity size={32} className="text-zinc-800" />}
                    title="Circuit Silent"
                    message={filter === 'ALL' ? "Connecting to agent council sessions..." : `No ${filter.toLowerCase()} events in buffered memory.`}
                />
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
                                transform: `translateY(${virtualItem.start}px)`,
                            }}
                        >
                            <LogItem 
                                log={filteredLogs[virtualItem.index]} 
                                idx={virtualItem.index} 
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>

        {/* Scroll Indicator */}
        {!isAtBottom && filteredLogs.length > 0 && (
            <button 
                onClick={scrollToBottom}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-poly-blue text-white px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-tighter shadow-xl flex items-center space-x-1.5 animate-bounce z-50"
            >
                <ArrowDown size={12} />
                <span>New Activity</span>
            </button>
        )}
    </div>
  );
};

export const LiveFeed = React.memo(measureRender(LiveFeedBase, 'LiveFeed'));
