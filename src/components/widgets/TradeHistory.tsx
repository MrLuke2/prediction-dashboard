import React, { useRef, useCallback, useMemo, useState, useEffect } from 'react';
import { History, ShieldAlert, Zap, Lock, AlertTriangle, ShieldCheck, Cpu } from 'lucide-react';
import { useTradeStore, useUIStore } from '../../store';
import { useVirtualizer } from '@tanstack/react-virtual';
import { measureRender } from '../../lib/perf';
import { EmptyState, LoadingSpinner } from '../ui/DataStates';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { LogLevel, AgentRole } from '../../types';

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
    const handleSelect = useCallback(() => {
        onSelect(trade);
    }, [trade, onSelect]);

    const timestamp = useMemo(() => 
        new Date(trade.timestamp).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit', second: '2-digit' }),
        [trade.timestamp]
    );

    const isPositive = trade.amount >= 0;

    return (
        <button 
            onClick={handleSelect}
            className={`
                w-full grid grid-cols-5 gap-1 px-4 py-3 border-b border-fin-border/50 text-[10px] font-mono items-center cursor-pointer transition-colors h-full text-left
                ${isSelected ? 'bg-poly-blue/20 text-white border-l-2 border-l-poly-blue shadow-[inset_4px_0_12px_rgba(59,130,246,0.2)]' : 'text-text-muted hover:bg-white/5'}
            `}
        >
            <div className="truncate opacity-60">{timestamp}</div>
            <div className="truncate font-bold text-white group-hover:text-white">
                {trade.asset?.split('-')[0] || 'N/A'}
            </div>
            <div className={`text-[9px] truncate font-bold ${trade.venue === 'Polymarket' ? 'text-poly-blue' : trade.venue === 'Kalshi' ? 'text-kalshi-green' : 'text-purple-400'}`}>
                {trade.venue || 'MOCK'}
            </div>
            <div className={`text-right font-bold ${isPositive ? 'text-kalshi-green' : 'text-kalshi-red'}`}>
                {isPositive ? '+' : ''}{trade.amount.toLocaleString()}
            </div>
            <div className={`text-right ${isPositive ? 'text-kalshi-green' : 'text-kalshi-red'}`}>{trade.roi}%</div>
        </button>
    );
});

const EmergencyKillSwitch: React.FC = () => {
    const { toggleEmergency, setTradeStatus, emergencyActive, tradeStatus, addLog } = useTradeStore();
    const [holdProgress, setHoldProgress] = useState(0);
    const holdIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const isSuspended = tradeStatus === 'SUSPENDED';

    const startHold = () => {
        if (isSuspended) {
            setTradeStatus('ACTIVE');
            toggleEmergency(false);
            addLog({
                id: Math.random().toString(36),
                timestamp: new Date().toISOString(),
                agent: AgentRole.ORCHESTRATOR,
                message: "SYSTEM RESTORED. Trading protocols online.",
                level: LogLevel.INFO
            });
            return;
        }

        holdIntervalRef.current = setInterval(() => {
            setHoldProgress(prev => {
                if (prev >= 100) {
                    executeEmergency();
                    return 100;
                }
                return prev + 5;
            });
        }, 100);
    };

    const stopHold = () => {
        if (holdIntervalRef.current) {
            clearInterval(holdIntervalRef.current);
            holdIntervalRef.current = null;
        }
        if (holdProgress < 100) setHoldProgress(0);
    };

    const executeEmergency = () => {
        setTradeStatus('SUSPENDED');
        toggleEmergency(true);
        setHoldProgress(0);
        
        addLog({
            id: Math.random().toString(36),
            timestamp: new Date().toISOString(),
            agent: AgentRole.ORCHESTRATOR,
            message: "EMERGENCY KILLS-WITCH ENGAGED. All systems neutralized.",
            level: LogLevel.ERROR
        });

        // Trigger visual shake/feedback
        document.body.classList.add('emergency-flash');
        setTimeout(() => document.body.classList.remove('emergency-flash'), 1000);
    };

    return (
        <div className="p-3 bg-zinc-950 border-t border-fin-border">
            <button
                id="emergency-override-btn"
                onMouseDown={startHold}
                onMouseUp={stopHold}
                onMouseLeave={stopHold}
                onTouchStart={startHold}
                onTouchEnd={stopHold}
                className={cn(
                    "w-full relative overflow-hidden rounded-lg py-3 px-4 flex items-center justify-between group transition-all duration-300 select-none",
                    isSuspended 
                        ? "bg-kalshi-green/20 border border-kalshi-green/50 restore-pulse" 
                        : "bg-kalshi-red/10 border border-kalshi-red/30 active:scale-[0.98]"
                )}
            >
                {/* Progress Bar Background */}
                <div 
                    className="absolute inset-y-0 left-0 bg-kalshi-red/20 transition-all duration-100 ease-linear pointer-events-none"
                    style={{ width: `${holdProgress}%` }}
                />

                <div className="flex items-center space-x-3 relative z-10">
                    <div className={cn(
                        "p-1.5 rounded-full transition-all duration-500",
                        isSuspended ? "bg-kalshi-green text-black" : "bg-kalshi-red text-white animate-pulse"
                    )}>
                        {isSuspended ? <Zap size={14} className="fill-current" /> : <AlertTriangle size={14} />}
                    </div>
                    <div className="flex flex-col text-left">
                        <span className={cn(
                            "text-[10px] font-black tracking-widest uppercase transition-colors duration-500",
                            isSuspended ? "text-kalshi-green" : "text-white"
                        )}>
                            {isSuspended ? "RESTORE FLIGHT OPS" : "EMERGENCY OVERRIDE"}
                        </span>
                        <span className="text-[8px] text-zinc-500 font-mono">
                            {isSuspended ? "TAP TO RE-ENGAGE PIPELINE" : "HOLD TO NEUTRALIZE PIPELINE"}
                        </span>
                    </div>
                </div>

                <div className="relative z-10">
                    {isSuspended ? (
                        <div className="flex items-center space-x-2">
                             <span className="text-[8px] font-bold text-kalshi-green/60 animate-pulse">READY</span>
                             <Zap size={14} className="text-kalshi-green" />
                        </div>
                    ) : (
                        <div className="flex items-center space-x-1">
                             <div className="w-1 h-3 bg-kalshi-red/30 rounded-full" />
                             <div className="w-1 h-3 bg-kalshi-red/50 rounded-full" />
                             <div className="w-1 h-3 bg-kalshi-red rounded-full" />
                        </div>
                    )}
                </div>
            </button>
        </div>
    );
};

const TradeHistoryBase: React.FC = () => {
  const { tradeHistory: history, setDisplayedPnL: onSelect, displayedPnL, tradeStatus } = useTradeStore();
  const selectedTradeId = displayedPnL?.tradeId;
  const parentRef = useRef<HTMLDivElement>(null);

  const isSuspended = tradeStatus === 'SUSPENDED';

  // Virtualization hardening: limit DOM complexity for long trade histories
  const rowVirtualizer = useVirtualizer({
    count: history.length,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(() => 45, []), // Fixed row height for trades
    overscan: 5,
  });

  return (
    <div className={cn(
        "flex flex-col h-full bg-fin-card/30 transition-all duration-700",
        isSuspended && "bg-kalshi-red/5 shadow-[inset_0_0_50px_rgba(239,68,68,0.1)]"
    )}>
        <div id="trade-history-container" className="flex flex-col flex-1 min-h-0">
            <div className="grid grid-cols-5 gap-1 px-4 py-3 border-b border-fin-border text-[9px] text-text-muted font-bold uppercase tracking-wider bg-zinc-900/50 shrink-0">
                <div>Timestamp</div>
                <div>Asset</div>
                <div>Venue</div>
                <div className="text-right">PnL</div>
                <div className="text-right">ROI</div>
            </div>
        
            <div 
                ref={parentRef}
                className="flex-1 overflow-y-auto min-h-0 overflow-x-hidden custom-scrollbar p-0"
            >
            {history.length === 0 ? (
                 <div className="h-full flex items-center justify-center p-8" data-testid="trade-history">
                    <EmptyState 
                        icon={<History size={32} className="text-zinc-800" />}
                        title="No history found"
                        message="Your trading vault is currently empty."
                    />
                 </div>
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
        
        {/* Phase B: Tactical Emergency Kill-Switch */}
        <EmergencyKillSwitch />
    </div>
  );
};

export const TradeHistory = React.memo(measureRender(TradeHistoryBase, 'TradeHistory'));

