import { lazy, ComponentType } from 'react';
import { Activity, Zap, Bitcoin, Radar, BarChart3, History, Newspaper, LucideIcon, Binary } from 'lucide-react';
import { WidgetType } from '../../store/types';

export interface WidgetRegistryItem {
  component: ComponentType<any>;
  defaultTitle: string;
  icon: LucideIcon;
  description: string;
  noPadding?: boolean;
}

export const WIDGET_REGISTRY: Record<WidgetType, WidgetRegistryItem> = {
  liveFeed: {
    component: lazy(() => import('./LiveFeed').then(m => ({ default: m.LiveFeed }))),
    defaultTitle: 'Agent Activity Feed',
    icon: Activity,
    description: 'Real-time decision logs from the Council of Agents.',
    noPadding: true
  },
  alphaGauge: {
    component: lazy(() => import('./AlphaGauge').then(m => ({ default: m.AlphaGauge }))),
    defaultTitle: 'Alpha Probability Model',
    icon: Zap,
    description: 'Dynamic confidence gauge aggregating market predictions.'
  },
  btcTracker: {
    component: lazy(() => import('./BitcoinTracker').then(m => ({ default: m.BitcoinTracker }))),
    defaultTitle: 'BTC/USD Oracle [Sub-Sec]',
    icon: Bitcoin,
    description: 'Sub-second latency price feed correlation baseline.'
  },
  whaleRadar: {
    component: lazy(() => import('./WhaleRadar').then(m => ({ default: m.WhaleRadar }))),
    defaultTitle: 'Whale Monitor [Polygon]',
    icon: Radar,
    description: 'Tracks high-value wallet movements and insider flow.'
  },
  newsFeed: {
    component: lazy(() => import('./BreakingNewsFeed').then(m => ({ default: m.BreakingNewsFeed }))),
    defaultTitle: 'Event Detection Engine',
    icon: Newspaper,
    description: 'AI-curated news feed with deep analysis.',
    noPadding: true
  },
  pnlCard: {
    component: lazy(() => import('./PnLCard').then(m => ({ default: m.PnLCard }))),
    defaultTitle: 'Execution Monitor',
    icon: BarChart3,
    description: 'Live visualization of trade execution and PnL.',
    noPadding: true
  },
  tradeHistory: {
    component: lazy(() => import('./TradeHistory').then(m => ({ default: m.TradeHistory }))),
    defaultTitle: 'Trade History',
    icon: History,
    description: 'Historical log of executed arbitrage trades.',
    noPadding: true
  },
  correlationHeatmap: {
    component: lazy(() => import('./TacticalCorrelationHeatmap').then(m => ({ default: m.TacticalCorrelationHeatmap }))),
    defaultTitle: 'Tactical Correlation Heatmap',
    icon: Binary,
    description: 'Real-time cross-asset coupling and contagion tracking.',
    noPadding: true
  }
};
