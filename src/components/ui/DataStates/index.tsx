import React from 'react';
import { cn } from '../../../lib/utils';

export const LoadingSpinner: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn("flex items-center justify-center p-4", className)}>
    <div className="w-8 h-8 border-2 border-poly-blue/20 border-t-poly-blue rounded-full animate-spin" />
  </div>
);

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  message: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, message, action }) => (
  <div className="flex flex-col items-center justify-center p-8 text-center h-full">
    {icon && <div className="text-zinc-600 mb-4">{icon}</div>}
    <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">{title}</h3>
    <p className="text-xs text-zinc-500 max-w-[200px] mb-6">{message}</p>
    {action}
  </div>
);

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ message, onRetry }) => (
  <div className="flex flex-col items-center justify-center p-8 text-center h-full">
    <div className="w-10 h-10 bg-kalshi-red/10 border border-kalshi-red/20 rounded-full flex items-center justify-center mb-4">
      <span className="text-kalshi-red text-lg font-bold">!</span>
    </div>
    <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">System Error</h3>
    <p className="text-[10px] text-kalshi-red/80 font-mono mb-6">{message}</p>
    {onRetry && (
      <button 
        onClick={onRetry}
        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-[10px] font-bold uppercase rounded-lg transition-colors"
      >
        Retry Operation
      </button>
    )}
  </div>
);

export const StaleDataBadge: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn(
    "absolute top-2 right-2 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center space-x-1.5 animate-pulse z-10",
    className
  )}>
    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
    <span className="text-[8px] font-bold text-amber-500 uppercase tracking-widest">Stale Data</span>
  </div>
);
