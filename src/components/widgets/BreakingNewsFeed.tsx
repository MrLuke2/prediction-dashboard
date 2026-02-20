import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ExternalLink, TrendingUp, AlertTriangle, Clock, Zap, BrainCircuit, ShieldAlert, BarChart3, Activity, Newspaper } from 'lucide-react';
import { measureRender } from '../../lib/perf';

export const BreakingNewsFeedSkeleton: React.FC = React.memo(() => (
    <div className="h-full w-full flex flex-col bg-zinc-950/30">
        <div className="h-10 border-b border-fin-border animate-pulse"></div>
        <div className="flex-1 p-4 space-y-4">
            {[1, 2, 3].map(i => (
                <div key={i} className="space-y-2">
                    <div className="w-20 h-4 bg-zinc-900 rounded animate-pulse"></div>
                    <div className="w-full h-12 bg-zinc-900/50 rounded animate-pulse"></div>
                    <div className="w-1/2 h-3 bg-zinc-900/30 rounded animate-pulse"></div>
                </div>
            ))}
        </div>
    </div>
));

// ... interface definitions remain same ...
interface AnalysisData {
  fundamental: string;
  sentiment: string;
  risk: string;
  verdict: 'EXECUTE' | 'HOLD' | 'REJECT';
  confidence: number;
}

interface NewsItem {
  id: string;
  source: 'Polymarket' | 'Kalshi';
  title: string;
  probability: number;
  volume: string;
  time: string;
  category: 'Politics' | 'Crypto' | 'Economics' | 'Pop Culture';
  analysis: AnalysisData;
}

const NEWS_ITEMS: NewsItem[] = [
    // ... items same ...
  { 
    id: '1', 
    source: 'Polymarket', 
    title: 'Presidential Election Winner 2024', 
    probability: 52, 
    volume: '$450M', 
    time: '2m ago', 
    category: 'Politics',
    analysis: {
        fundamental: "Polling averages show tightening spread in key swing states. Historical data suggests volatility spike imminent.",
        sentiment: "Social volume +45% DoD. Narrative shift detected on X toward 'Undecided Voter' impact.",
        risk: "High variance event. Exposure limited to 5% of total liquidity due to regulatory uncertainty.",
        verdict: 'HOLD',
        confidence: 62
    }
  },
  { 
    id: '2', 
    source: 'Kalshi', 
    title: 'Fed Interest Rate Cut in September', 
    probability: 85, 
    volume: '$12M', 
    time: '5m ago', 
    category: 'Economics',
    analysis: {
        fundamental: "CPI data came in lower than expected (2.9%). Job growth cooling effectively.",
        sentiment: "Market consensus is effectively priced in. 'Soft landing' mentions at all-time high.",
        risk: "Low downside variance. Skew is favorable for short-term yield strategies.",
        verdict: 'EXECUTE',
        confidence: 94
    }
  },
  { 
    id: '3', 
    source: 'Polymarket', 
    title: 'Bitcoin to hit $100k in 2024', 
    probability: 32, 
    volume: '$45M', 
    time: '12m ago', 
    category: 'Crypto',
    analysis: {
        fundamental: "ETF inflows stabilizing. Miner capitulation phase nearing completion.",
        sentiment: "Extreme Greed index cooling off. Retail interest surprisingly low despite price action.",
        risk: "Macro correlation with Nasdaq remains high. Wait for decoupling confirmation.",
        verdict: 'REJECT',
        confidence: 45
    }
  },
  { 
    id: '4', 
    source: 'Kalshi', 
    title: 'Government Shutdown before Dec', 
    probability: 15, 
    volume: '$2.1M', 
    time: '15m ago', 
    category: 'Politics',
    analysis: {
        fundamental: "Budget reconciliation likely to pass. Bipartisan support for extension detected.",
        sentiment: "Media cycle ignoring this topic. Low priority signal.",
        risk: "Black swan potential exists but currently priced efficiently.",
        verdict: 'REJECT',
        confidence: 88
    }
  },
  { 
    id: '5', 
    source: 'Polymarket', 
    title: 'Taylor Swift announces engagement', 
    probability: 22, 
    volume: '$800k', 
    time: '1h ago', 
    category: 'Pop Culture',
    analysis: {
        fundamental: "Tour schedule gap in Q4 aligns with personal event probability window.",
        sentiment: "Fan theory algo detecting synchronized hashtag spikes.",
        risk: "Speculative asset. Liquidity too thin for institutional size entry.",
        verdict: 'HOLD',
        confidence: 33
    }
  },
  {
    id: '6',
    source: 'Kalshi',
    title: 'S&P 500 closes above 5,600',
    probability: 65,
    volume: '$15M',
    time: '1h ago',
    category: 'Economics',
    analysis: {
        fundamental: "Tech earnings beat expectations by 12% on average.",
        sentiment: "Bullish momentum strong on institutional desks.",
        risk: "VIX remains compressed; watchful for mean reversion.",
        verdict: 'EXECUTE',
        confidence: 78
    }
  },
  {
    id: '7',
    source: 'Polymarket',
    title: 'Ethereum ETF Approval in May',
    probability: 91,
    volume: '$32M',
    time: '2h ago',
    category: 'Crypto',
    analysis: {
        fundamental: "SEC filings indicate productive dialogue with issuers.",
        sentiment: "Market has largely front-run this news.",
        risk: "Sell-the-news event probable.",
        verdict: 'HOLD',
        confidence: 90
    }
  },
  {
    id: '8',
    source: 'Kalshi',
    title: 'US GDP Growth > 2.5% Q3',
    probability: 45,
    volume: '$5.5M',
    time: '2h ago',
    category: 'Economics',
    analysis: {
        fundamental: "Consumer spending data shows signs of fatigue.",
        sentiment: "Bearish macro narrative gaining traction.",
        risk: "Data revision risk is high.",
        verdict: 'REJECT',
        confidence: 55
    }
  },
  {
    id: '9',
    source: 'Polymarket',
    title: 'Next Bond Villain Actor',
    probability: 12,
    volume: '$150k',
    time: '3h ago',
    category: 'Pop Culture',
    analysis: {
        fundamental: "Casting rumors are purely speculative.",
        sentiment: "Low confidence signal from reliable leakers.",
        risk: "Illiquid market, high slippage.",
        verdict: 'REJECT',
        confidence: 20
    }
  },
  {
    id: '10',
    source: 'Kalshi',
    title: 'SpaceX Starship Successful Landing',
    probability: 70,
    volume: '$1.2M',
    time: '3h ago',
    category: 'Economics',
    analysis: {
        fundamental: "Engineering iteration speed suggests high success rate.",
        sentiment: "Public support at all-time high.",
        risk: "Weather conditions variable.",
        verdict: 'EXECUTE',
        confidence: 82
    }
  },
  {
    id: '11',
    source: 'Polymarket',
    title: 'Solana to flip BNB market cap',
    probability: 38,
    volume: '$8M',
    time: '4h ago',
    category: 'Crypto',
    analysis: {
        fundamental: "On-chain activity supports valuation growth.",
        sentiment: "Solana community extremely active.",
        risk: "Network outage risk priced in.",
        verdict: 'HOLD',
        confidence: 50
    }
  },
  {
    id: '12',
    source: 'Kalshi',
    title: 'NYT Best Seller: Non-Fiction #1',
    probability: 25,
    volume: '$500k',
    time: '4h ago',
    category: 'Pop Culture',
    analysis: {
        fundamental: "Competitor book release pushed to next week.",
        sentiment: "Pre-orders tracking slightly below target.",
        risk: "Unpredictable viral trends.",
        verdict: 'REJECT',
        confidence: 40
    }
  },
  {
    id: '13',
    source: 'Polymarket',
    title: 'OPEC cuts oil production',
    probability: 58,
    volume: '$10M',
    time: '5h ago',
    category: 'Economics',
    analysis: {
        fundamental: "Global demand softening requires supply adjustment.",
        sentiment: "Energy sector pricing in a cut.",
        risk: "Geopolitical instability adds noise.",
        verdict: 'EXECUTE',
        confidence: 72
    }
  },
  {
    id: '14',
    source: 'Kalshi',
    title: 'Heatwave in Texas > 105F',
    probability: 95,
    volume: '$600k',
    time: '5h ago',
    category: 'Economics',
    analysis: {
        fundamental: "Meteorological models converge on high heat.",
        sentiment: "N/A - Weather based.",
        risk: "Low risk, low reward trade.",
        verdict: 'HOLD',
        confidence: 98
    }
  },
  {
    id: '15',
    source: 'Polymarket',
    title: 'Twitter/X IPO in 2024',
    probability: 8,
    volume: '$2M',
    time: '6h ago',
    category: 'Economics',
    analysis: {
        fundamental: "Revenue metrics do not support public listing yet.",
        sentiment: "Elon comments suggest staying private.",
        risk: "Capital structure opacity.",
        verdict: 'REJECT',
        confidence: 95
    }
  },
  {
    id: '16',
    source: 'Kalshi',
    title: 'CPI > 3.0% next month',
    probability: 40,
    volume: '$9M',
    time: '6h ago',
    category: 'Economics',
    analysis: {
        fundamental: "Shelter costs remain sticky.",
        sentiment: "Bond market pricing in disinflation.",
        risk: "Energy price shock potential.",
        verdict: 'HOLD',
        confidence: 60
    }
  },
  {
    id: '17',
    source: 'Polymarket',
    title: 'GTA 6 Release Date Announced',
    probability: 88,
    volume: '$4M',
    time: '7h ago',
    category: 'Pop Culture',
    analysis: {
        fundamental: "Fiscal year earnings call implies Q4 reveal.",
        sentiment: "Leaks corroborating timeline.",
        risk: "Development delays common in sector.",
        verdict: 'EXECUTE',
        confidence: 85
    }
  },
  {
    id: '18',
    source: 'Kalshi',
    title: 'US National Debt > $36T',
    probability: 99,
    volume: '$1M',
    time: '8h ago',
    category: 'Economics',
    analysis: {
        fundamental: "Mathematical certainty based on current deficit.",
        sentiment: "Ignored by market participants.",
        risk: "None.",
        verdict: 'EXECUTE',
        confidence: 99
    }
  },
  {
    id: '19',
    source: 'Polymarket',
    title: 'LayerZero Airdrop Date',
    probability: 60,
    volume: '$5M',
    time: '8h ago',
    category: 'Crypto',
    analysis: {
        fundamental: "Snapshot rumors verified by on-chain analysis.",
        sentiment: "Farmer fatigue setting in.",
        risk: "Sybil detection criteria unknown.",
        verdict: 'HOLD',
        confidence: 65
    }
  },
  {
    id: '20',
    source: 'Kalshi',
    title: 'TikTok Ban in US enacted',
    probability: 28,
    volume: '$18M',
    time: '9h ago',
    category: 'Politics',
    analysis: {
        fundamental: "Legal challenges likely to delay implementation.",
        sentiment: "Youth voter backlash concern for admin.",
        risk: "Legislative gridlock.",
        verdict: 'REJECT',
        confidence: 70
    }
  }
];

// Extract NewsItem to its own memoized component to prevent re-rendering all items when activeIndex changes
const LateNewsItem = React.memo(({ item, isActive, onMouseEnter, onMouseLeave }: { 
    item: NewsItem, 
    isActive: boolean, 
    onMouseEnter: (e: React.MouseEvent, id: string) => void,
    onMouseLeave: () => void
}) => {
    return (
        <div 
            onMouseEnter={(e) => onMouseEnter(e, item.id)}
            onMouseLeave={onMouseLeave}
            className={`
                relative p-4 border-b border-fin-border transition-all duration-300 cursor-crosshair
                ${isActive ? 'bg-fin-hover/10 border-l-2 border-l-poly-blue' : 'border-l-2 border-l-transparent opacity-70 hover:opacity-100 hover:bg-fin-hover/20'}
            `}
        >
            <div className="flex justify-between items-start mb-2">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                    item.source === 'Polymarket' 
                    ? 'bg-poly-blue/10 text-poly-blue border-poly-blue/20' 
                    : 'bg-kalshi-green/10 text-kalshi-green border-kalshi-green/20'
                }`}>
                    {item.source}
                </span>
                <span className="text-[10px] text-text-muted flex items-center">
                    <Clock size={10} className="mr-1" /> {item.time}
                </span>
            </div>
            
            <h4 className="text-sm font-medium text-white mb-3 leading-snug">
                {item.title}
            </h4>

            <div className="flex items-center justify-between text-xs font-mono">
                <div className="flex items-center space-x-3">
                    <span className="text-text-muted">Vol: <span className="text-white">{item.volume}</span></span>
                </div>
                <div className="flex items-center font-bold">
                    <span className={item.probability > 50 ? 'text-kalshi-green' : 'text-kalshi-red'}>
                        {item.probability}%
                    </span>
                    <TrendingUp size={12} className="ml-1 text-zinc-500" />
                </div>
            </div>
        </div>
    );
});

const AnalysisPopup = React.memo(({ data, style, onMouseEnter, onMouseLeave }: { 
    data: NewsItem, 
    style: React.CSSProperties,
    onMouseEnter: () => void,
    onMouseLeave: () => void
}) => {
    return createPortal(
        <div 
            className="fixed z-[9999] w-[320px] bg-zinc-950 border border-fin-border rounded-xl shadow-2xl p-0 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            style={style}
        >
            <div className="bg-zinc-900 px-4 py-3 border-b border-fin-border flex justify-between items-center">
                <div className="flex items-center space-x-2 text-poly-blue">
                    <BrainCircuit size={16} />
                    <span className="font-bold text-xs uppercase tracking-wider">Council Analysis</span>
                </div>
                <div className="text-[10px] text-zinc-500 font-mono">ID: {data.id}</div>
            </div>
            
            <div className="p-4 space-y-4">
                <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                        <div className="mt-0.5"><BarChart3 size={14} className="text-poly-blue" /></div>
                        <div>
                            <span className="text-[10px] font-bold text-poly-blue uppercase block mb-0.5">Fundamentalist</span>
                            <p className="text-[11px] text-zinc-400 leading-tight">{data.analysis.fundamental}</p>
                        </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                        <div className="mt-0.5"><Zap size={14} className="text-amber-400" /></div>
                        <div>
                            <span className="text-[10px] font-bold text-amber-400 uppercase block mb-0.5">Sentiment</span>
                            <p className="text-[11px] text-zinc-400 leading-tight">{data.analysis.sentiment}</p>
                        </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                        <div className="mt-0.5"><ShieldAlert size={14} className="text-kalshi-red" /></div>
                        <div>
                            <span className="text-[10px] font-bold text-kalshi-red uppercase block mb-0.5">Risk Manager</span>
                            <p className="text-[11px] text-zinc-400 leading-tight">{data.analysis.risk}</p>
                        </div>
                    </div>
                </div>

                <div className="h-px w-full bg-fin-border"></div>

                <div className="flex items-center justify-between">
                    <div>
                        <span className="text-[10px] text-zinc-500 uppercase block mb-1">Final Verdict</span>
                        <div className={`
                            text-sm font-bold px-2 py-1 rounded inline-block cursor-pointer hover:scale-105 transition-transform
                            ${data.analysis.verdict === 'EXECUTE' ? 'bg-kalshi-green/20 text-kalshi-green border border-kalshi-green/30' : 
                              data.analysis.verdict === 'REJECT' ? 'bg-kalshi-red/20 text-kalshi-red border border-kalshi-red/30' : 
                              'bg-zinc-800 text-zinc-300 border border-zinc-700'}
                        `}>
                            {data.analysis.verdict}
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="text-[10px] text-zinc-500 uppercase block mb-1">Alpha Confidence</span>
                        <div className="text-xl font-bold font-mono text-white flex items-center justify-end">
                            {data.analysis.confidence}%
                            <Activity size={14} className="ml-1 text-poly-blue" />
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
});

const BreakingNewsFeedBase: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoveredItem, setHoveredItem] = useState<{ id: string, rect: DOMRect } | null>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % NEWS_ITEMS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const clearHoverTimeout = useCallback(() => {
    if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = null;
    }
  }, []);

  const handleMouseEnter = useCallback((e: React.MouseEvent, id: string) => {
    clearHoverTimeout();
    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredItem({ id, rect });
  }, [clearHoverTimeout]);

  const handleMouseLeave = useCallback(() => {
    hoverTimeoutRef.current = setTimeout(() => {
        setHoveredItem(null);
    }, 300);
  }, []);

  const handlePopupMouseEnter = useCallback(() => {
      clearHoverTimeout();
  }, [clearHoverTimeout]);
  
  const handlePopupMouseLeave = useCallback(() => {
      handleMouseLeave();
  }, [handleMouseLeave]);

  const activeData = useMemo(() => 
    NEWS_ITEMS.find(item => item.id === hoveredItem?.id),
    [hoveredItem?.id]
  );

  const popupStyle = useMemo(() => {
    if (!hoveredItem) return {};
    const isLeftSide = hoveredItem.rect.left < (window.innerWidth / 2);
    const style: React.CSSProperties = {
        top: Math.max(10, Math.min(window.innerHeight - 340, hoveredItem.rect.top)),
    };
    if (isLeftSide) {
        style.left = hoveredItem.rect.right + 10;
    } else {
        style.left = hoveredItem.rect.left - 330;
    }
    return style;
  }, [hoveredItem]);

  return (
    <div className="h-full w-full flex flex-col bg-zinc-950/30 relative">
      <div className="flex items-center space-x-4 px-4 py-2 border-b border-fin-border shrink-0">
         <div className="flex items-center space-x-2 text-kalshi-red animate-pulse">
            <AlertTriangle size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Breaking Alpha ({NEWS_ITEMS.length})</span>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 p-0 relative z-10 custom-scrollbar">
        <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-fin-card/80 to-transparent z-10 pointer-events-none"></div>
        
        <div className="flex flex-col pb-4">
            {NEWS_ITEMS.map((item, index) => (
                <LateNewsItem 
                    key={item.id}
                    item={item}
                    isActive={index === activeIndex}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                />
            ))}
        </div>
      </div>
      
      <div className="p-2 border-t border-fin-border bg-fin-card/50 text-[10px] text-zinc-500 font-mono flex justify-between items-center shrink-0">
        <span>SCANNING MARKETS...</span>
        <span>UPDATED: LIVE</span>
      </div>

      {activeData && hoveredItem && (
        <AnalysisPopup 
            data={activeData}
            style={popupStyle}
            onMouseEnter={handlePopupMouseEnter}
            onMouseLeave={handlePopupMouseLeave}
        />
      )}
    </div>
  );
};

export const BreakingNewsFeed = React.memo(measureRender(BreakingNewsFeedBase, 'BreakingNewsFeed'));
