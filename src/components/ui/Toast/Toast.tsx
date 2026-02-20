import React, { useEffect, useState } from 'react';
import { X, Info, CheckCircle2, AlertTriangle, AlertOctagon, TrendingUp, Cpu } from 'lucide-react';
import { Toast as ToastType } from '../../../store/types';
import { AI_PROVIDERS } from '../../../config/aiProviders';
import { cn } from '../../../lib/utils';

interface ToastProps {
    toast: ToastType;
    onClose: (id: string) => void;
    index: number;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose, index }) => {
    const [isExiting, setIsExiting] = useState(false);
    
    const provider = toast.providerId 
        ? AI_PROVIDERS.find(p => p.id === toast.providerId) || AI_PROVIDERS[0]
        : null;

    const Icon = {
        info: Info,
        success: CheckCircle2,
        warning: AlertTriangle,
        error: AlertOctagon,
        trade: TrendingUp,
        agent: Cpu
    }[toast.type];

    const typeStyles = {
        info: "border-poly-blue/20 bg-zinc-900/90 text-poly-blue",
        success: "border-kalshi-green/20 bg-zinc-900/90 text-kalshi-green",
        warning: "border-amber-500/20 bg-zinc-900/90 text-amber-500",
        error: "border-kalshi-red/20 bg-zinc-900/90 text-kalshi-red",
        trade: "border-kalshi-green/40 bg-zinc-900/95 text-kalshi-green shadow-[0_0_15px_rgba(16,185,129,0.1)]",
        agent: "border-fin-border bg-zinc-900/95 text-white"
    }[toast.type];

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => onClose(toast.id), 300);
    };

    const isImportant = toast.type === 'error' || toast.type === 'warning';

    return (
        <div 
            role="alert"
            aria-live={isImportant ? "assertive" : "polite"}
            className={cn(
                "pointer-events-auto w-full max-w-sm overflow-hidden rounded-xl border shadow-2xl transition-all duration-300 ease-out",
                typeStyles,
                isExiting ? "translate-x-full opacity-0" : "translate-x-0 opacity-100",
                "animate-in slide-in-from-right-8 fade-in"
            )}
            style={{ 
                transform: `translateY(${index * 8}px) scale(${1 - index * 0.03})`,
                zIndex: 100 - index,
                borderLeft: toast.type === 'agent' && provider ? `4px solid ${provider.color}` : undefined
            }}
        >
            <div className="p-4 flex items-start gap-4">
                <div className={cn(
                    "p-2 rounded-lg shrink-0",
                    toast.type === 'agent' ? "bg-zinc-800" : "bg-white/5"
                )}>
                    <Icon size={18} />
                </div>
                
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold tracking-tight">{toast.title}</p>
                    {toast.message && (
                        <p className="mt-1 text-xs text-zinc-400 leading-relaxed line-clamp-2">
                            {toast.message}
                        </p>
                    )}
                    {toast.action && (
                        <button 
                            onClick={toast.action.onClick}
                            className="mt-2 text-[10px] font-black uppercase tracking-widest text-poly-blue hover:text-white transition-colors"
                        >
                            {toast.action.label}
                        </button>
                    )}
                </div>

                <button 
                    onClick={handleClose}
                    className="p-1 rounded-full hover:bg-white/5 text-zinc-600 hover:text-white transition-colors"
                >
                    <X size={14} />
                </button>
            </div>
            
            {/* Progress Bar for Auto-dismiss */}
            {toast.duration !== Infinity && (
                <div className="h-0.5 bg-white/5 w-full">
                    <div 
                        className="h-full bg-current opacity-20 animate-[toast-progress_linear_forwards]"
                        style={{ animationDuration: `${toast.duration || 4000}ms` }}
                    />
                </div>
            )}

            <style>{`
                @keyframes toast-progress {
                    from { width: 100%; }
                    to { width: 0%; }
                }
                @media (prefers-reduced-motion: reduce) {
                    .animate-in { animation: none !important; transition: opacity 0.3s ease-out !important; }
                    .translate-x-full { transform: none !important; }
                }
            `}</style>
        </div>
    );
};
