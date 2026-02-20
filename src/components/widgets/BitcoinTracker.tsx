import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ArrowUp, ArrowDown, Bitcoin, Activity } from 'lucide-react';
import { measureRender } from '../../lib/perf';
import { createChart, IChartApi, ISeriesApi, CandlestickData, ColorType, Time, CandlestickSeries } from 'lightweight-charts';

export const BitcoinTrackerSkeleton: React.FC = React.memo(() => (
    <div className="h-full w-full flex flex-col items-center justify-center p-8 space-y-4 bg-zinc-950/20">
        <Bitcoin className="text-zinc-800 animate-pulse" size={32} />
        <div className="w-32 h-10 bg-zinc-900/50 rounded animate-pulse"></div>
        <div className="w-24 h-4 bg-zinc-800/30 rounded animate-pulse"></div>
    </div>
));

// Generate realistic historical candle data
function generateHistoricalCandles(count: number): CandlestickData<Time>[] {
  const candles: CandlestickData<Time>[] = [];
  let baseTime = Math.floor(Date.now() / 1000) - count * 60;
  let price = 97800 + Math.random() * 600;

  for (let i = 0; i < count; i++) {
    const open = price;
    const volatility = 15 + Math.random() * 35;
    const close = open + (Math.random() - 0.48) * volatility;
    const high = Math.max(open, close) + Math.random() * volatility * 0.4;
    const low = Math.min(open, close) - Math.random() * volatility * 0.4;

    candles.push({
      time: (baseTime + i * 60) as Time,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
    });

    price = close;
  }

  return candles;
}

const BitcoinTrackerBase: React.FC = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);

  const [price, setPrice] = useState(98245.50);
  const [trend, setTrend] = useState<'up' | 'down'>('up');
  const [lastDiff, setLastDiff] = useState(0);
  const [isChartReady, setIsChartReady] = useState(false);

  // Format helper
  const formatVal = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#71717a',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSize: 9,
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.03)' },
        horzLines: { color: 'rgba(255,255,255,0.03)' },
      },
      timeScale: {
        borderColor: 'rgba(255,255,255,0.05)',
        timeVisible: true,
        secondsVisible: false,
        fixLeftEdge: true,
        fixRightEdge: true,
      },
      rightPriceScale: {
        borderColor: 'rgba(255,255,255,0.05)',
        scaleMargins: { top: 0.1, bottom: 0.05 },
      },
      crosshair: {
        mode: 0,
        vertLine: { color: 'rgba(59, 130, 246, 0.3)', width: 1, style: 2 },
        horzLine: { color: 'rgba(59, 130, 246, 0.3)', width: 1, style: 2 },
      },
      handleScale: false,
      handleScroll: false,
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: '#10B981',
      downColor: '#EF4444',
      borderDownColor: '#EF4444',
      borderUpColor: '#10B981',
      wickDownColor: '#EF444488',
      wickUpColor: '#10B98188',
    });

    const historicalData = generateHistoricalCandles(80);
    series.setData(historicalData);

    const lastCandle = historicalData[historicalData.length - 1];
    setPrice(lastCandle.close);

    chart.timeScale().fitContent();

    chartRef.current = chart;
    seriesRef.current = series;
    setIsChartReady(true);

    // Handle resize
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        chart.applyOptions({ width, height });
      }
    });

    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  // Add new candles at interval
  useEffect(() => {
    if (!isChartReady) return;

    const interval = setInterval(() => {
      if (!seriesRef.current) return;

      const volatility = 25;
      const change = (Math.random() - 0.45) * volatility;
      const newPrice = price + change;

      const now = Math.floor(Date.now() / 1000) as Time;
      const open = price;
      const close = parseFloat(newPrice.toFixed(2));
      const high = parseFloat((Math.max(open, close) + Math.random() * volatility * 0.3).toFixed(2));
      const low = parseFloat((Math.min(open, close) - Math.random() * volatility * 0.3).toFixed(2));

      seriesRef.current.update({
        time: now,
        open: parseFloat(open.toFixed(2)),
        high,
        low,
        close,
      });

      setPrice(close);
      setLastDiff(change);
      setTrend(change >= 0 ? 'up' : 'down');
    }, 2000);

    return () => clearInterval(interval);
  }, [isChartReady, price]);

  return (
    <div className="h-full flex flex-col relative bg-zinc-950/20 overflow-hidden">

      {/* Background Grid Effect */}
      <div className="absolute inset-0 grid-bg-subtle opacity-50 pointer-events-none"></div>

      {/* Header Row */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1 relative z-10 shrink-0">
        <div className="flex items-center space-x-2">
          <span className="text-zinc-500 text-[10px] font-mono tracking-[0.2em] uppercase">BTC / USD</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-1.5 h-1.5 rounded-full bg-kalshi-green animate-pulse"></div>
          <span className="text-[9px] text-zinc-500 font-mono">LIVE ORACLE</span>
        </div>
      </div>

      {/* Price Row */}
      <div className="flex items-center justify-between px-4 pb-2 relative z-10 shrink-0">
        <div className={`text-2xl font-mono font-bold tracking-tighter transition-colors duration-75 ${trend === 'up' ? 'text-white' : 'text-zinc-200'}`}>
          <span className="text-zinc-600 text-base align-top mr-0.5">$</span>
          {formatVal(price).split('.')[0]}
          <span className="text-base text-zinc-500">.{formatVal(price).split('.')[1]}</span>
        </div>

        {/* Delta Indicator */}
        <div className={`flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${trend === 'up' ? 'text-kalshi-green bg-kalshi-green/5 border-kalshi-green/20' : 'text-kalshi-red bg-kalshi-red/5 border-kalshi-red/20'}`}>
          {trend === 'up' ? <ArrowUp size={10} className="mr-1" /> : <ArrowDown size={10} className="mr-1" />}
          {Math.abs(lastDiff).toFixed(2)}
        </div>
      </div>

      {/* Candlestick Chart */}
      <div
        ref={chartContainerRef}
        className="flex-1 min-h-0 relative z-10"
      />

      {/* Footer Status */}
      <div className="flex items-center justify-between px-4 py-1.5 border-t border-fin-border/50 shrink-0 relative z-10">
        <div className="flex items-center space-x-1.5 text-[8px] font-mono text-zinc-600">
          <Activity size={8} className="text-kalshi-green" />
          <span>FEED: 2s CANDLES</span>
        </div>
        <span className="text-[8px] font-mono text-zinc-600">1M TIMEFRAME</span>
      </div>
    </div>
  );
};

// Memoized to localize high-frequency local state updates
export const BitcoinTracker = React.memo(measureRender(BitcoinTrackerBase, 'BitcoinTracker'));
