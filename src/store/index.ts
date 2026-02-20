import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { UIState, LayoutState, MarketState, TradeState, LayoutSlots, WidgetType, NotificationState, Toast } from './types';
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

export const useUIStore = create<UIState>()(
    persist(
        (set) => ({
            isTutorialOpen: false,
            isAuthOpen: false,
            isBooting: true,
            isEditMode: false,
            swapSource: null,
            searchQuery: '',
            isSearchFocused: false,
            logs: [],
            mobileTab: 'overview',
            aiProvider: { providerId: 'anthropic', model: 'claude-sonnet-4-5' },
            jwt: null,
            user: null,
            setTutorialOpen: (open) => set({ isTutorialOpen: open }),
            setAuthOpen: (open) => set({ isAuthOpen: open }),
            setBooting: (booting) => set({ isBooting: booting }),
            setEditMode: (editMode) => set({ isEditMode: editMode }),
            setSwapSource: (source) => set({ swapSource: source }),
            setSearchQuery: (query) => set({ searchQuery: query }),
            setSearchFocused: (focused) => set({ isSearchFocused: focused }),
            setLogs: (logs) => set({ logs }),
            setMobileTab: (tab) => set({ mobileTab: tab }),
            setAIProvider: (selection) => set({ aiProvider: selection }),
            setAuth: (token, user) => set({ jwt: token, user }),
            clearAuth: () => set({ jwt: null, user: null }),
        }),
        {
            name: 'ui-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({ 
                aiProvider: state.aiProvider,
                mobileTab: state.mobileTab,
                jwt: state.jwt,
                user: state.user
            }),
        }
    )
);

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
    updateMarket: (update) => set((state) => ({
        marketData: state.marketData.map((m) => 
            m.symbol === update.symbol ? { ...m, ...update } : m
        )
    })),
}));

export const useTradeStore = create<TradeState>((set) => ({
    displayedPnL: null,
    tradeHistory: [],
    lastPnL: null,
    pendingTrade: null,
    setDisplayedPnL: (pnl) => set({ displayedPnL: pnl }),
    setTradeHistory: (history) => set({ tradeHistory: history }),
    setLastPnL: (pnl) => set({ lastPnL: pnl }),
    addWhaleMovement: (movement) => set((state) => ({
        whaleData: [movement, ...(useMarketStore.getState().whaleData)].slice(0, 50)
    })),
    addLog: (log) => useUIStore.getState().setLogs([log, ...useUIStore.getState().logs].slice(0, 100)),
    updateTrade: (update) => {
        // Logic for trade updates
        console.log('[Store] Trade updated:', update);
    },
    submitTrade: (params) => {
        console.log('[Store] Submitting trade:', params);
        set({ pendingTrade: params });
        // In a real app, this would be an API call
    }
}));

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

export const useNotificationStore = create<NotificationState>((set, get) => ({
    toasts: [],
    addToast: (toast) => {
        const id = Math.random().toString(36).substring(2, 9);
        const duration = toast.duration ?? 4000;

        set((state) => {
            const newToasts = [{ ...toast, id } as Toast, ...state.toasts].slice(0, 5);
            
            // Cleanup timeouts for any toast that was sliced off
            const currentIds = new Set(newToasts.map(t => t.id));
            state.toasts.forEach(t => {
                if (!currentIds.has(t.id)) {
                    const timeout = toastTimeouts.get(t.id);
                    if (timeout) clearTimeout(timeout);
                    toastTimeouts.delete(t.id);
                }
            });

            return { toasts: newToasts };
        });

        if (duration !== Infinity) {
            const timeout = setTimeout(() => {
                get().dismissToast(id);
            }, duration);
            toastTimeouts.set(id, timeout);
        }

        return id;
    },
    dismissToast: (id) => {
        const timeout = toastTimeouts.get(id);
        if (timeout) clearTimeout(timeout);
        toastTimeouts.delete(id);

        set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id),
        }));
    },
    clearAll: () => {
        toastTimeouts.forEach((t) => clearTimeout(t));
        toastTimeouts.clear();
        set({ toasts: [] });
    },
}));
