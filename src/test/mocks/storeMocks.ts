import { useUIStore, useLayoutStore, useMarketStore, useTradeStore, useNotificationStore } from '../../store';
import { UIState, LayoutState, MarketState, TradeState, NotificationState } from '../../store/types';
import { INITIAL_MARKET_DATA } from '../../constants';

export const mockAIProvider = { 
  providerId: 'gemini' as const, 
  model: 'gemini-2.5-flash' 
};

export const createUIState = (overrides?: Partial<UIState>): UIState => ({
  isTutorialOpen: false,
  isAuthOpen: false,
  isBooting: false,
  isEditMode: false,
  swapSource: null,
  searchQuery: '',
  isSearchFocused: false,
  logs: [],
  mobileTab: 'overview',
  aiProvider: { providerId: 'gemini', model: 'gemini-2.5-flash' },
  jwt: null,
  user: null,
  isSettingsOpen: false,
  setTutorialOpen: () => {},
  setAuthOpen: () => {},
  setBooting: () => {},
  setEditMode: () => {},
  setSwapSource: () => {},
  setSearchQuery: () => {},
  setSearchFocused: () => {},
  setLogs: () => {},
  setMobileTab: () => {},
  setAIProvider: () => {},
  setAuth: () => {},
  clearAuth: () => {},
  setSettingsOpen: () => {},
  ...overrides,
});

export const createLayoutState = (overrides?: Partial<LayoutState>): LayoutState => ({
  slots: {
    left: 'newsFeed',
    centerTopLeft: 'alphaGauge',
    centerTopRight: 'btcTracker',
    centerBottomLeft: 'pnlCard',
    centerBottomRight: 'tradeHistory',
    rightTop: 'whaleRadar',
    rightBottom: 'liveFeed'
  },
  swapWidget: () => {},
  resetLayout: () => {},
  ...overrides,
});

export const createMarketState = (overrides?: Partial<MarketState>): MarketState => ({
  marketData: [],
  selectedMarket: null,
  alphaMetric: { probability: 50, trend: 'stable' },
  whaleData: [],
  setSelectedMarket: () => {},
  setMarketData: () => {},
  setAlphaMetric: () => {},
  setWhaleData: () => {},
  updateMarket: () => {},
  ...overrides,
});

export const createTradeState = (overrides?: Partial<TradeState>): TradeState => ({
  displayedPnL: null,
  tradeHistory: [],
  lastPnL: null,
  pendingTrade: null,
  setDisplayedPnL: () => {},
  setTradeHistory: () => {},
  setLastPnL: () => {},
  addWhaleMovement: () => {},
  addLog: () => {},
  updateTrade: () => {},
  submitTrade: () => {},
  ...overrides,
});

export const createNotificationState = (overrides?: Partial<NotificationState>): NotificationState => ({
  toasts: [],
  addToast: () => '',
  dismissToast: () => {},
  clearAll: () => {},
  ...overrides,
});

export const resetAllStores = () => {
  useUIStore.setState({
    isTutorialOpen: false,
    isAuthOpen: false,
    isBooting: false,
    isEditMode: false,
    swapSource: null,
    searchQuery: '',
    isSearchFocused: false,
    logs: [],
    mobileTab: 'overview',
    aiProvider: { providerId: 'gemini', model: 'gemini-2.5-flash' },
    jwt: null,
    user: null,
    isSettingsOpen: false,
  });

  useLayoutStore.setState({
    slots: {
        left: 'newsFeed',
        centerTopLeft: 'alphaGauge',
        centerTopRight: 'btcTracker',
        centerBottomLeft: 'pnlCard',
        centerBottomRight: 'tradeHistory',
        rightTop: 'whaleRadar',
        rightBottom: 'liveFeed'
    }
  });

  useMarketStore.setState({
    marketData: INITIAL_MARKET_DATA,
    selectedMarket: null,
    alphaMetric: { probability: 50, trend: 'stable' },
    whaleData: [],
  });

  useTradeStore.setState({
    displayedPnL: null,
    tradeHistory: [],
    lastPnL: null,
    pendingTrade: null,
  });

  useNotificationStore.getState().clearAll();
};
