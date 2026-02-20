import React from 'react';
import { LayoutGrid, Activity, History, Newspaper, PieChart, Shield } from 'lucide-react';
import { cn } from '../../lib/utils';

export type MobileTab = 'overview' | 'predictions' | 'news' | 'execution' | 'radar';

interface MobileNavProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
}

const TABS = [
  { id: 'overview' as const, label: 'Hub', icon: Shield },
  { id: 'predictions' as const, label: 'Live', icon: Activity },
  { id: 'execution' as const, label: 'PnL', icon: History },
  { id: 'news' as const, label: 'Intel', icon: Newspaper },
  { id: 'radar' as const, label: 'Radar', icon: PieChart },
];

export const MobileNav: React.FC<MobileNavProps> = ({ activeTab, onTabChange }) => {
  return (
    <nav 
      className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-brand-fin-card border-t border-brand-fin-border grid grid-cols-5 z-[60] backdrop-blur-xl bg-opacity-90 px-2 pb-safe"
      role="navigation"
      aria-label="Mobile Navigation"
    >
      {TABS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onTabChange(id)}
          className={cn(
            "flex flex-col items-center justify-center space-y-1 transition-all brand-focus-ring relative",
            activeTab === id ? "text-brand-poly-blue" : "text-zinc-500 hover:text-zinc-300"
          )}
          aria-selected={activeTab === id}
          role="tab"
          aria-label={`Show ${label} section`}
        >
          <Icon size={20} className={cn("transition-transform", activeTab === id && "scale-110")} />
          <span className="text-[10px] font-bold uppercase tracking-tight">{label}</span>
          
          {activeTab === id && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-brand-poly-blue rounded-full" />
          )}
        </button>
      ))}
    </nav>
  );
};
