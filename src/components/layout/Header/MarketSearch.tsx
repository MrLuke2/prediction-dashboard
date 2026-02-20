import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, History, X, CornerDownLeft, SearchCode } from 'lucide-react';
import { useMarketStore, useUIStore } from '../../../store';
import { MarketPair } from '../../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../lib/utils';

const RECENT_SEARCHES_KEY = 'agent-predict-recent-searches';
const MAX_RECENT = 5;

export const MarketSearch: React.FC = () => {
  const { marketData, setSelectedMarket } = useMarketStore();
  const globalSearchQuery = useUIStore(state => state.searchQuery);
  const setSearchQuery = useUIStore(state => state.setSearchQuery);
  
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync with global store
  useEffect(() => {
    if (globalSearchQuery !== undefined) {
      setQuery(globalSearchQuery);
      if (globalSearchQuery) {
        setIsFocused(true);
        inputRef.current?.focus();
      }
    }
  }, [globalSearchQuery]);

  // Load recent searches
  useEffect(() => {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch (e) {
        setRecentSearches([]);
      }
    }
  }, []);

  // Debounce logic
  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setDebouncedQuery(query);
      setSelectedIndex(0);
    }, 150);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [query]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const results = useMemo(() => {
    if (!debouncedQuery) return [];
    return marketData.filter(m => 
      m.symbol.toLowerCase().includes(debouncedQuery.toLowerCase())
    ).slice(0, 8);
  }, [debouncedQuery, marketData]);

  const handleSelectMarket = (market: MarketPair) => {
    setSelectedMarket(market);
    setIsFocused(false);
    setQuery('');
    
    // Save to recent
    const newRecent = [market.symbol, ...recentSearches.filter(s => s !== market.symbol)].slice(0, MAX_RECENT);
    setRecentSearches(newRecent);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(newRecent));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isFocused) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const max = results.length > 0 ? results.length : recentSearches.length;
      if (max > 0) setSelectedIndex(prev => (prev + 1) % max);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const max = results.length > 0 ? results.length : recentSearches.length;
      if (max > 0) setSelectedIndex(prev => (prev - 1 + max) % max);
    } else if (e.key === 'Enter') {
      if (results.length > 0) {
        handleSelectMarket(results[selectedIndex]);
      } else if (recentSearches.length > 0 && !debouncedQuery) {
        setQuery(recentSearches[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsFocused(false);
    }
  };

  const HighlightMatch = ({ text, match }: { text: string; match: string }) => {
    if (!match) return <>{text}</>;
    // Escape regex characters
    const safeMatch = match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${safeMatch})`, 'gi'));
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === match.toLowerCase() 
            ? <span key={i} className="text-poly-blue font-bold">{part}</span> 
            : <span key={i}>{part}</span>
        )}
      </>
    );
  };

  return (
    <div id="header-search" className="relative flex-1 max-w-md mx-4" ref={containerRef}>
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={14} className={cn("transition-colors", isFocused ? "text-poly-blue" : "text-zinc-500")} />
        </div>
        <input 
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSearchQuery(e.target.value);
          }}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search Markets..." 
          className="block w-full pl-9 pr-10 py-1.5 border border-fin-border rounded-md leading-5 bg-zinc-950 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-poly-blue focus:border-poly-blue sm:text-xs transition-all"
          aria-expanded={isFocused}
          aria-haspopup="listbox"
          aria-controls="search-results"
        />
        {query && (
          <button 
            type="button"
            onClick={() => setQuery('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-600 hover:text-white transition-colors"
          >
            <X size={12} />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isFocused && (
          <motion.div 
            id="search-results"
            role="listbox"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="absolute top-full left-0 w-full mt-1 bg-zinc-950 border border-fin-border rounded-md shadow-2xl overflow-hidden z-[60]"
          >
            {/* Recent Searches */}
            {!debouncedQuery && recentSearches.length > 0 && (
              <div className="p-2 border-b border-fin-border/50">
                <span className="text-[9px] font-bold text-zinc-500 px-2 uppercase tracking-widest">Recent Intel</span>
                <div className="mt-1">
                  {recentSearches.map((term, i) => (
                    <div 
                      key={term}
                      onClick={() => setQuery(term)}
                      className={cn(
                        "flex items-center justify-between px-2 py-1.5 rounded text-xs cursor-pointer transition-colors",
                        selectedIndex === i ? "bg-white/5 text-white" : "text-zinc-400 hover:text-zinc-200"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <History size={12} className="opacity-40" />
                        <span>{term}</span>
                      </div>
                      <CornerDownLeft size={10} className="opacity-0 group-hover:opacity-20" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Results */}
            {debouncedQuery && results.length > 0 && (
              <div className="max-h-80 overflow-y-auto custom-scrollbar">
                {results.map((market, i) => (
                  <div 
                    key={market.symbol}
                    role="option"
                    aria-selected={selectedIndex === i}
                    onClick={() => handleSelectMarket(market)}
                    className={cn(
                      "px-4 py-2.5 flex items-center justify-between border-b border-fin-border/30 last:border-0 cursor-pointer transition-colors",
                      selectedIndex === i ? "bg-poly-blue/10 border-l-2 border-l-poly-blue" : "hover:bg-white/5 border-l-2 border-l-transparent"
                    )}
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-white">
                        <HighlightMatch text={market.symbol} match={debouncedQuery} />
                      </span>
                      <span className="text-[10px] text-zinc-500 uppercase font-bold">{market.pair?.split('/')[1] || 'USD'} Settlement</span>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-bold text-kalshi-green font-mono">
                        {(market.spread * 100).toFixed(1)}% ARB
                      </div>
                      <div className="text-[9px] text-zinc-600 font-mono">VOL: ${market.volume || '0'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {debouncedQuery && results.length === 0 && (
              <div className="p-8 text-center flex flex-col items-center space-y-3">
                <SearchCode size={32} className="text-zinc-800" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-zinc-400">No Alpha Detected</p>
                  <p className="text-[10px] text-zinc-600 max-w-[200px] leading-relaxed">
                    Agent search failed to locate "{debouncedQuery}" across connected exchanges.
                  </p>
                </div>
              </div>
            )}

            {/* Hotkey Hint */}
            <div className="p-2 border-t border-fin-border bg-black/40 text-[9px] text-zinc-600 flex justify-between items-center font-mono">
              <span>USE ↑↓ TO NAVIGATE</span>
              <span>ESC TO ABORT</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
