import { MarketPair, PnLData, LogEntry, AlphaMetric, WhaleMovement } from '../types';
import { AIProviderSelection } from '../config/aiProviders';

export type MobileTab = 'overview' | 'predictions' | 'news' | 'execution' | 'radar';

export type WidgetType = 'liveFeed' | 'alphaGauge' | 'btcTracker' | 'pnlCard' | 'tradeHistory' | 'whaleRadar' | 'newsFeed';

export interface LayoutSlots {
    left: WidgetType;
    centerTopLeft: WidgetType;
    centerTopRight: WidgetType;
    centerBottomLeft: WidgetType;
    centerBottomRight: WidgetType;
    rightTop: WidgetType;
    rightBottom: WidgetType;
}

export interface UIState {
    isTutorialOpen: boolean;
    isAuthOpen: boolean;
    isBooting: boolean;
    isEditMode: boolean;
    swapSource: keyof LayoutSlots | null;
    searchQuery: string;
    isSearchFocused: boolean;
    logs: LogEntry[];
    mobileTab: MobileTab;
    aiProvider: AIProviderSelection;
    setTutorialOpen: (open: boolean) => void;
    setAuthOpen: (open: boolean) => void;
    setBooting: (booting: boolean) => void;
    setEditMode: (editMode: boolean) => void;
    setSwapSource: (source: keyof LayoutSlots | null) => void;
    setSearchQuery: (query: string) => void;
    setSearchFocused: (focused: boolean) => void;
    setLogs: (logs: LogEntry[]) => void;
    setMobileTab: (tab: MobileTab) => void;
    setAIProvider: (selection: AIProviderSelection) => void;
}

export interface LayoutState {
    slots: LayoutSlots;
    swapWidget: (from: keyof LayoutSlots, to: keyof LayoutSlots) => void;
    resetLayout: () => void;
}

export interface MarketState {
    marketData: MarketPair[];
    selectedMarket: MarketPair | null;
    alphaMetric: AlphaMetric;
    whaleData: WhaleMovement[];
    setSelectedMarket: (market: MarketPair | null) => void;
    setMarketData: (data: MarketPair[]) => void;
    setAlphaMetric: (metric: AlphaMetric) => void;
    setWhaleData: (data: WhaleMovement[]) => void;
    updateMarket: (update: MarketPair) => void;
}

export interface TradeState {
    displayedPnL: PnLData | null;
    tradeHistory: PnLData[];
    lastPnL: PnLData | null;
    setDisplayedPnL: (pnl: PnLData | null) => void;
    setTradeHistory: (history: PnLData[]) => void;
    setLastPnL: (pnl: PnLData | null) => void;
    addWhaleMovement: (movement: WhaleMovement) => void;
    addLog: (log: LogEntry) => void;
    updateTrade: (update: any) => void;
}
