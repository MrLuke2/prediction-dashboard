import { useUIStore, useLayoutStore, useMarketStore, useTradeStore, useNotificationStore } from '../../store';
import { INITIAL_MARKET_DATA } from '../../constants';
import { LayoutSlots } from '../../store/types';

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

export const resetStores = () => {
    // UI Store Reset
    useUIStore.setState({
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
        wsConnectionState: 'disconnected'
    });

    // Layout Store Reset
    useLayoutStore.setState({
        slots: DEFAULT_LAYOUT,
    });
    localStorage.clear();

    // Market Store Reset
    useMarketStore.setState({
        marketData: INITIAL_MARKET_DATA,
        selectedMarket: null,
        alphaMetric: { probability: 50, trend: 'stable', history: [] },
        whaleData: [],
    });

    // Trade Store Reset
    useTradeStore.setState({
        displayedPnL: null,
        tradeHistory: [],
        lastPnL: null,
        pendingTrade: null,
        tradeStatus: 'ACTIVE',
        emergencyActive: false
    });

    // Notification Store Reset
    useNotificationStore.getState().clearAll();
};
