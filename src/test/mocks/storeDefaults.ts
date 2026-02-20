import { useUIStore, useLayoutStore, useMarketStore, useTradeStore } from '../../store';
import { INITIAL_MARKET_DATA } from '../../constants';
import { LayoutSlots } from '../../store/types';

const DEFAULT_LAYOUT: LayoutSlots = {
    left: 'newsFeed',
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
        alphaMetric: { probability: 50, trend: 'stable' },
        whaleData: [],
    });

    // Trade Store Reset
    useTradeStore.setState({
        displayedPnL: null,
        tradeHistory: [],
        lastPnL: null,
    });
};
