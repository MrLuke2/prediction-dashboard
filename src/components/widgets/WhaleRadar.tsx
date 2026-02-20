import React, { useMemo, useState, useEffect } from 'react';
import { Radar, Waves, ExternalLink, ShieldAlert } from 'lucide-react';
import { useMarketStore } from '../../store';
import { measureRender } from '../../lib/perf';
import { EmptyState, LoadingSpinner } from '../ui/DataStates';
import { timeAgo, cn } from '../../lib/utils';
import { WhaleMovementRow } from '../ui/WhaleMovementRow';

export const WhaleRadarSkeleton: React.FC = React.memo(() => (
    <div className="p-4 space-y-3">
        {[1, 2, 3].map(i => (
            <div key={i} className="h-16 w-full bg-zinc-900 border border-zinc-800 rounded-xl animate-shimmer overflow-hidden">
                <div className="h-full w-full bg-gradient-to-r from-transparent via-zinc-800/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
            </div>
        ))}
    </div>
));

const WhaleRadarBase: React.FC = () => {
  const movements = useMarketStore(state => state.whaleData);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const sortedMovements = useMemo(() => {
    return [...movements].sort((a, b) => b.timestamp - a.timestamp);
  }, [movements]);

  if (!movements) return <WhaleRadarSkeleton />;
  
  if (movements.length === 0) {
    return (
      <EmptyState 
        icon={<Waves size={32} />}
        title="Whale Radar Quiet"
        message="No whale movements detected on the A2UI Protocol in the last 24h."
      />
    );
  }

  return (
    <div className="h-full w-full overflow-hidden flex flex-col pt-2" data-testid="whale-radar">
      <div className="flex-1 overflow-y-auto custom-scrollbar px-3 space-y-2 pb-4">
        {sortedMovements.map((m) => (
          <WhaleMovementRow key={m.id} movement={m} now={now} />
        ))}
      </div>
      
      <style>{`
        @keyframes shimmer { 100% { transform: translateX(100%); } }
        @keyframes flash-green {
          0% { background-color: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.3); }
          100% { background-color: rgba(9, 9, 11, 0.3); border-color: rgba(255, 255, 255, 0.05); }
        }
      `}</style>
    </div>
  );
};

export const WhaleRadar = React.memo(measureRender(WhaleRadarBase, 'WhaleRadar'));
