import React from 'react';
import { ShieldAlert, ExternalLink } from 'lucide-react';
import { WhaleMovement } from '../../types';
import { AI_PROVIDERS } from '../../config/aiProviders';
import { timeAgo, cn } from '../../lib/utils';

interface WhaleMovementRowProps {
  movement: WhaleMovement;
  now?: number;
}

export const WhaleMovementRow: React.FC<WhaleMovementRowProps> = ({ movement, now = Date.now() }) => {
  const isNew = now - movement.timestamp < 30000;
  const provider = AI_PROVIDERS.find(p => p.id === movement.providerId) || AI_PROVIDERS[0];
  
  return (
    <div 
      className={cn(
        "group relative p-3 rounded-xl border border-fin-border bg-zinc-900/30 transition-all hover:bg-zinc-900/50 hover:border-zinc-700",
        isNew && "animate-[flash-green_2s_ease-out]"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono text-zinc-500 truncate max-w-[120px]">{movement.wallet}</span>
            {movement.confidence > 0.9 && (
              <div className="px-1.5 py-0.5 rounded-full bg-poly-blue/10 border border-poly-blue/20 flex items-center">
                <ShieldAlert size={8} className="text-poly-blue mr-1" />
                <span className="text-[8px] font-bold text-poly-blue uppercase tracking-tighter">Verified Whale</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <span className={cn(
              "text-xs font-bold uppercase tracking-tight",
              movement.action.includes('Bought') ? "text-kalshi-green" : "text-kalshi-red"
            )}>
              {movement.action}
            </span>
            <span className="text-xs text-white font-medium">{movement.amount.toLocaleString()} {movement.asset}</span>
          </div>
        </div>

        <div className="text-right flex flex-col items-end">
          <div className="flex items-center space-x-1.5 mb-1">
            <div 
                className="w-1.5 h-1.5 rounded-full shadow-[0_0_4px_rgba(255,255,255,0.2)]" 
                style={{ backgroundColor: provider.color }}
                title={`Flagged by ${provider.name}`}
            />
            <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">{timeAgo(movement.timestamp)}</span>
          </div>
          <div className="px-1.5 py-0.5 rounded-md bg-zinc-950 border border-zinc-800 text-[9px] font-mono text-poly-blue">
            CONF: {(movement.confidence * 100).toFixed(0)}%
          </div>
        </div>
      </div>
      
      <button className="absolute top-2 right-12 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-600 hover:text-white">
        <ExternalLink size={10} />
      </button>
    </div>
  );
};
