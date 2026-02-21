import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Info, CheckCircle, AlertTriangle, XCircle, TrendingUp, Brain, Cpu, Zap } from 'lucide-react';
import { Toast as ToastType } from '../../../store/types';
import { AI_PROVIDERS } from '../../../config/aiProviders';
import { cn } from '../../../lib/utils';

interface ToastProps {
  toast: ToastType;
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  const provider = toast.providerId ? AI_PROVIDERS.find(p => p.id === toast.providerId) : null;
  
  const getIcon = () => {
    switch (toast.type) {
      case 'success': return <CheckCircle size={18} className="text-kalshi-green" />;
      case 'error': return <XCircle size={18} className="text-kalshi-red" />;
      case 'warning': return <AlertTriangle size={18} className="text-amber-500" />;
      case 'trade': return <TrendingUp size={18} className="text-kalshi-green shadow-[0_0_8px_currentColor]" />;
      case 'agent': return provider ? <Brain size={18} style={{ color: provider.color }} /> : <Cpu size={18} className="text-poly-blue" />;
      default: return <Info size={18} className="text-poly-blue" />;
    }
  };

  const getAriaLive = () => {
     if (toast.type === 'error' || toast.type === 'warning') return 'assertive';
     return 'polite';
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 50, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.95 }}
      transition={{ type: 'spring', damping: 25, stiffness: 350 }}
      className={cn(
        "pointer-events-auto relative w-full sm:max-w-sm overflow-hidden rounded-xl border bg-zinc-950/90 backdrop-blur-xl shadow-2xl",
        "flex items-start p-4 group",
        toast.type === 'trade' ? "border-kalshi-green/30 bg-kalshi-green/5" : "border-white/10",
        toast.type === 'agent' && provider && `border-l-4`,
      )}
      style={toast.type === 'agent' && provider ? { borderLeftColor: provider.color } : {}}
      role="status"
      aria-live={getAriaLive()}
    >
      <div className="flex-shrink-0 pt-0.5">
        {getIcon()}
      </div>
      
      <div className="ml-3 flex-1 min-w-0">
        <p className="text-xs font-black uppercase tracking-widest text-white leading-none mb-1">
          {toast.title}
        </p>
        {toast.message && (
          <p className="text-[10px] text-zinc-400 font-medium leading-relaxed line-clamp-2">
            {toast.message}
          </p>
        )}
        
        {toast.action && (
          <button
            onClick={() => {
              toast.action?.onClick();
              onDismiss(toast.id);
            }}
            className="mt-2 text-[10px] font-black uppercase tracking-tighter text-poly-blue hover:text-white transition-colors"
          >
            {toast.action.label}
          </button>
        )}
      </div>

      <button
        onClick={() => onDismiss(toast.id)}
        className="ml-4 flex-shrink-0 rounded-full p-1 text-zinc-600 hover:text-white hover:bg-white/5 transition-all"
      >
        <X size={14} />
      </button>

      {/* Progress Bar for non-infinity toasts */}
      {toast.duration !== Infinity && (
        <motion.div 
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: (toast.duration || 4000) / 1000, ease: 'linear' }}
          className={cn(
            "absolute bottom-0 left-0 h-[2px] bg-white/20",
            toast.type === 'trade' && "bg-kalshi-green",
            toast.type === 'agent' && provider && "bg-[currentColor]"
          )}
          style={toast.type === 'agent' && provider ? { backgroundColor: provider.color } : {}}
        />
      )}
    </motion.div>
  );
};
