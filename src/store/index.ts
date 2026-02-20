import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { UIState, LayoutState, MarketState, TradeState, LayoutSlots, WidgetType } from './types';
import { INITIAL_MARKET_DATA } from '../constants';

const DEFAULT_LAYOUT: LayoutSlots = {
    left: 'newsFeed',
    centerTopLeft: 'alphaGauge',
    centerTopRight: 'btcTracker',
    centerBottomLeft: 'pnlCard',
    centerBottomRight: 'tradeHistory',
    rightTop: 'whaleRadar',
    rightBottom: 'liveFeed'
};

export const useUIStore = create<UIState>((set) => ({
    isTutorialOpen: false,
    isAuthOpen: false,
    isBooting: true,
    isEditMode: false,
    swapSource: null,
    searchQuery: '',
    isSearchFocused: false,
    logs: [],
    mobileTab: 'overview',
    setTutorialOpen: (open) => set({ isTutorialOpen: open }),
    setAuthOpen: (open) => set({ isAuthOpen: open }),
    setBooting: (booting) => set({ isBooting: booting }),
    setEditMode: (editMode) => set({ isEditMode: editMode }),
    setSwapSource: (source) => set({ swapSource: source }),
    setSearchQuery: (query) => set({ searchQuery: query }),
    setSearchFocused: (focused) => set({ isSearchFocused: focused }),
    setLogs: (logs) => set({ logs }),
    setMobileTab: (tab) => set({ mobileTab: tab }),
}));

export const useLayoutStore = create<LayoutState>()(
    persist(
        (set) => ({
            slots: DEFAULT_LAYOUT,
            swapWidget: (from, to) => set((state) => {
                const newSlots = { ...state.slots };
                const temp = newSlots[from];
                newSlots[from] = newSlots[to];
                newSlots[to] = temp;
                return { slots: newSlots };
            }),
            resetLayout: () => set({ slots: DEFAULT_LAYOUT }),
        }),
        {
            name: 'dashboard-layout-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);

export const useMarketStore = create<MarketState>((set) => ({
    marketData: INITIAL_MARKET_DATA,
    selectedMarket: null,
    alphaMetric: { probability: 50, trend: 'stable' },
    whaleData: [],
    setSelectedMarket: (market) => set({ selectedMarket: market }),
    setMarketData: (data) => set({ marketData: data }),
    setAlphaMetric: (metric) => set({ alphaMetric: metric }),
    setWhaleData: (data) => set({ whaleData: data }),
}));

export const useTradeStore = create<TradeState>((set) => ({
    displayedPnL: null,
    tradeHistory: [],
    lastPnL: null,
    setDisplayedPnL: (pnl) => set({ displayedPnL: pnl }),
    setTradeHistory: (history) => set({ tradeHistory: history }),
    setLastPnL: (pnl) => set({ lastPnL: pnl }),
}));
