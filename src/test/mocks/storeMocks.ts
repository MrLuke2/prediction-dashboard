import { useUIStore, useLayoutStore, useMarketStore, useTradeStore, useNotificationStore } from '../../store';
import { UIState, LayoutState, MarketState, TradeState, NotificationState } from '../../store/types';
import { INITIAL_MARKET_DATA } from '../../constants';
import { AIProviderSelection } from '../../config/aiProviders';

// anthropic/claude-sonnet-4-5 as requested
export const mockAIProvider: AIProviderSelection = { 
  providerId: 'anthropic', 
  model: 'claude-sonnet-4-5' 
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
  aiProvider: mockAIProvider,
  jwt: null,
  user: null,
  isAuthenticated: false,
  isSettingsOpen: false,
  agentModels: {
    fundamentalist: { providerId: 'anthropic', modelId: 'claude-sonnet-4-5' },
    sentiment: { providerId: 'anthropic', modelId: 'claude-sonnet-4-5' },
    risk: { providerId: 'anthropic', modelId: 'claude-sonnet-4-5' }
  },
  wsConnectionState: 'disconnected',
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
  setAgentModel: () => {},
  setWSConnectionState: () => {},
  ...overrides,
});

export const createLayoutState = (overrides?: Partial<LayoutState>): LayoutState => ({
  slots: {
    leftTop: 'newsFeed',
    leftBottom: 'correlationHeatmap',
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
  marketData: INITIAL_MARKET_DATA,
  selectedMarket: null,
  alphaMetric: { probability: 50, trend: 'stable', history: [] },
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
  tradeStatus: 'ACTIVE',
  emergencyActive: false,
  setDisplayedPnL: () => {},
  setTradeHistory: () => {},
  setLastPnL: () => {},
  addWhaleMovement: () => {},
  addLog: () => {},
  updateTrade: () => {},
  submitTrade: () => {},
  reAnalyze: () => {},
  setTradeStatus: () => {},
  toggleEmergency: () => {},
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
      aiProvider: mockAIProvider,
      jwt: null,
      user: null,
      isAuthenticated: false,
      isSettingsOpen: false,
      agentModels: {
        fundamentalist: { providerId: 'anthropic', modelId: 'claude-sonnet-4-5' },
        sentiment: { providerId: 'anthropic', modelId: 'claude-sonnet-4-5' },
        risk: { providerId: 'anthropic', modelId: 'claude-sonnet-4-5' }
      },
      wsConnectionState: 'disconnected'
    });

    useLayoutStore.setState({
      slots: {
        leftTop: 'newsFeed',
        leftBottom: 'correlationHeatmap',
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
      alphaMetric: { probability: 50, trend: 'stable', history: [] },
      whaleData: [],
    });

    useTradeStore.setState({
      displayedPnL: null,
      tradeHistory: [],
      lastPnL: null,
      pendingTrade: null,
      tradeStatus: 'ACTIVE',
      emergencyActive: false
    });

    useNotificationStore.getState().clearAll();
};
