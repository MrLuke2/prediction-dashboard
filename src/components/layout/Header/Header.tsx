import React from 'react';
import { LogoMark } from './LogoMark';
import { MarketSearch } from './MarketSearch';
import { AgentStatusBar } from './AgentStatusBar';
import { HeaderActions } from './HeaderActions';
import { MarketTicker } from '../../widgets/MarketTicker';
import { useMarketStore } from '../../../store';

export const Header: React.FC = () => {
  const { marketData } = useMarketStore();

  return (
    <header className="flex-none z-50 bg-fin-card border-b border-fin-border" role="banner">
      {/* Primary Nav */}
      <div className="h-14 flex items-center px-6 justify-between" role="navigation" aria-label="Main Header">
        <LogoMark />
        
        <div className="flex items-center space-x-2 md:space-x-4 flex-1 justify-end">
          <MarketSearch />
          <AgentStatusBar />
          
          <div className="h-6 w-px bg-fin-border mx-2 hidden md:block" aria-hidden="true"></div>
          
          <HeaderActions />
        </div>
      </div>
      
      {/* Market Ticker Sub-header */}
      <div id="market-ticker" className="bg-zinc-950/50 border-t border-fin-border/30">
        <MarketTicker data={marketData} />
      </div>
    </header>
  );
};
