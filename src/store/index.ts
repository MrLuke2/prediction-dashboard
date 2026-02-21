import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { UIState, LayoutState, MarketState, TradeState, LayoutSlots, WidgetType, NotificationState, Toast } from './types';
import { INITIAL_MARKET_DATA } from '../constants';
import { DEFAULT_AGENT_MODEL_CONFIG } from '../config/aiProviders';

const DEFAULT_LAYOUT: LayoutSlots = {
    leftTop: 'newsFeed',
    leftBottom: 'correlationHeatmap',
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
            aiProvider: { providerId: 'gemini', model: 'gemini-2.5-flash' },
            jwt: null,
            user: null,
            isAuthenticated: false,
            isSettingsOpen: false,
            agentModels: {
                fundamentalist: { providerId: 'gemini', modelId: 'gemini-2.5-flash' },
                sentiment: { providerId: 'gemini', modelId: 'gemini-2.5-flash' },
                risk: { providerId: 'gemini', modelId: 'gemini-2.5-flash' }
            },
            wsConnectionState: 'disconnected',
            setTutorialOpen: (open) => set({ isTutorialOpen: open }),
            setAuthOpen: (open) => set({ isAuthOpen: open }),
            setBooting: (booting) => set({ isBooting: booting }),
            setEditMode: (editMode) => set({ isEditMode: editMode }),
            setSwapSource: (source) => set({ swapSource: source }),
            setSearchQuery: (query) => set({ searchQuery: query }),
            setSearchFocused: (focused) => set({ isSearchFocused: focused }),
            setLogs: (logs) => set({ logs }),
            setMobileTab: (tab) => set({ mobileTab: tab }),
            setAIProvider: (selection) => {
                set((state) => ({ 
                    aiProvider: selection,
                    agentModels: {
                        fundamentalist: { providerId: selection.providerId, modelId: selection.model },
                        sentiment: { providerId: selection.providerId, modelId: selection.model },
                        risk: { providerId: selection.providerId, modelId: selection.model }
                    }
                }));
                
                // Prompt 6: AI Provider change toast
                useNotificationStore.getState().addToast({
                    type: 'agent',
                    title: 'AI Provider Switched',
                    message: `Now using ${selection.providerId.toUpperCase()} ${selection.model}`,
                    duration: 3000,
                    providerId: selection.providerId
                });
            },
            setAuth: (token, user) => set({ jwt: token, user, isAuthenticated: !!token }),
            clearAuth: () => set({ jwt: null, user: null, isAuthenticated: false }),
            setSettingsOpen: (open) => set({ isSettingsOpen: open }),
            setAgentModel: (role, assignment) => set((state) => ({
                agentModels: { ...state.agentModels, [role]: assignment }
            })),
            setWSConnectionState: (state) => set({ wsConnectionState: state }),
        }),
        {
            name: 'ui-storage',
            version: 3,
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({ 
                aiProvider: state.aiProvider,
                agentModels: state.agentModels,
                mobileTab: state.mobileTab,
                jwt: state.jwt,
                user: state.user,
                isAuthenticated: state.isAuthenticated
            }),
            migrate: (persistedState: any, version: number) => {
                if (version < 3) {
                    // Force upgrade to Gemini 2.5 Flash as the new system default
                    persistedState.aiProvider = { 
                        providerId: 'gemini', 
                        model: 'gemini-2.5-flash' 
                    };
                    persistedState.agentModels = {
                        fundamentalist: { providerId: 'gemini', modelId: 'gemini-2.5-flash' },
                        sentiment: { providerId: 'gemini', modelId: 'gemini-2.5-flash' },
                        risk: { providerId: 'gemini', modelId: 'gemini-2.5-flash' }
                    };
                }
                return persistedState;
            },
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
            version: 2,
            storage: createJSONStorage(() => localStorage),
            migrate: (persistedState: any, version: number) => {
                if (version < 2 && persistedState.slots) {
                    const oldSlots = persistedState.slots;
                    if (oldSlots.left && !oldSlots.leftTop) {
                        return {
                            ...persistedState,
                            slots: {
                                ...oldSlots,
                                leftTop: oldSlots.left,
                                leftBottom: 'correlationHeatmap'
                            }
                        };
                    }
                }
                return persistedState;
            }
        }
    )
);

export const useMarketStore = create<MarketState>((set) => ({
    marketData: INITIAL_MARKET_DATA,
    selectedMarket: null,
    alphaMetric: { probability: 50, trend: 'stable', history: [] },
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
    tradeStatus: 'ACTIVE',
    emergencyActive: false,
    setDisplayedPnL: (pnl) => set({ displayedPnL: pnl }),
    setTradeHistory: (history) => set({ tradeHistory: history }),
    setLastPnL: (pnl) => set({ lastPnL: pnl }),
    addWhaleMovement: (movement) => useMarketStore.setState((state) => ({
        whaleData: [movement, ...state.whaleData].slice(0, 50)
    })),
    addLog: (log) => useUIStore.getState().setLogs([log, ...useUIStore.getState().logs].slice(0, 100)),
    updateTrade: (update) => {
        set((state) => ({
            tradeHistory: state.tradeHistory.map(t => 
                t.tradeId === update.tradeId ? { ...t, ...update } : t
            )
        }));
    },
    submitTrade: (params) => {
        console.log('[Store] Submitting trade:', params);
        set({ pendingTrade: params });
    },
    reAnalyze: (marketId) => {
        console.log('[Store] Re-analyzing market:', marketId);
        const { aiProvider } = useUIStore.getState();
        useTradeStore.getState().addLog({
            id: Math.random().toString(36).substring(2, 9),
            timestamp: new Date().toISOString(),
            agent: 'ORCHESTRATOR' as any,
            message: `Initiating deep-dive re-analysis for ${marketId} using ${aiProvider.model}...`,
            level: 'INFO' as any
        });
    },
    setTradeStatus: (status) => set({ tradeStatus: status }),
    toggleEmergency: (active) => set({ emergencyActive: active }),
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
