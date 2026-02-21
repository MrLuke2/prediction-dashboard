import { MarketPair, PnLData, LogEntry, AlphaMetric, WhaleMovement } from '../types';
import { AIProviderSelection, AgentModelConfig, AgentConfigRole, AgentModelAssignment } from '../config/aiProviders';

export type MobileTab = 'overview' | 'predictions' | 'news' | 'execution' | 'radar';

export type WidgetType = 'liveFeed' | 'alphaGauge' | 'btcTracker' | 'pnlCard' | 'tradeHistory' | 'whaleRadar' | 'newsFeed' | 'correlationHeatmap';

export interface LayoutSlots {
    leftTop: WidgetType;
    leftBottom: WidgetType;
    centerTopLeft: WidgetType;
    centerTopRight: WidgetType;
    centerBottomLeft: WidgetType;
    centerBottomRight: WidgetType;
    rightTop: WidgetType;
    rightBottom: WidgetType;
}

import { UserProfile } from '../services/api/authApi';

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
    jwt: string | null;
    user: UserProfile | null;
    isAuthenticated: boolean;
    isSettingsOpen: boolean;
    agentModels: AgentModelConfig;
    wsConnectionState: 'connecting' | 'connected' | 'disconnected' | 'error';
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
    setAuth: (token: string, user: UserProfile) => void;
    clearAuth: () => void;
    setSettingsOpen: (open: boolean) => void;
    setAgentModel: (role: AgentConfigRole, assignment: AgentModelAssignment) => void;
    setWSConnectionState: (state: 'connecting' | 'connected' | 'disconnected' | 'error') => void;
}

export interface LayoutState {
    slots: LayoutSlots;
    swapWidget: (from: keyof LayoutSlots, to: keyof LayoutSlots) => void;
    resetLayout: () => void;
}

export interface MarketState {
    marketData: MarketPair[];
    selectedMarket: MarketPair | null;
    alphaMetric: AlphaMetric | null;
    whaleData: WhaleMovement[];
    setSelectedMarket: (market: MarketPair | null) => void;
    setMarketData: (data: MarketPair[]) => void;
    setAlphaMetric: (metric: AlphaMetric | null) => void;
    setWhaleData: (data: WhaleMovement[]) => void;
    updateMarket: (update: MarketPair) => void;
}

export interface TradeParams {
    marketPairId: string;
    side: 'buy' | 'sell';
    size: number;
    venue: string;
    aiProvider: AIProviderSelection;
}

export interface TradeState {
    displayedPnL: PnLData | null;
    tradeHistory: PnLData[];
    lastPnL: PnLData | null;
    pendingTrade: TradeParams | null;
    tradeStatus: 'ACTIVE' | 'SUSPENDED';
    emergencyActive: boolean;
    setDisplayedPnL: (pnl: PnLData | null) => void;
    setTradeHistory: (history: PnLData[]) => void;
    setLastPnL: (pnl: PnLData | null) => void;
    addWhaleMovement: (movement: WhaleMovement) => void;
    addLog: (log: LogEntry) => void;
    updateTrade: (update: any) => void;
    submitTrade: (params: TradeParams) => void;
    reAnalyze: (marketId: string) => void;
    setTradeStatus: (status: 'ACTIVE' | 'SUSPENDED') => void;
    toggleEmergency: (active: boolean) => void;
}

export type ToastType = 'info' | 'success' | 'warning' | 'error' | 'trade' | 'agent';

export interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
    action?: {
        label: string;
        onClick: () => void;
    };
    providerId?: string; // For styling 'agent' toasts
}

export interface NotificationState {
    toasts: Toast[];
    addToast: (toast: Omit<Toast, 'id'>) => string;
    dismissToast: (id: string) => void;
    clearAll: () => void;
}
