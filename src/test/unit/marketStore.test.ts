import { describe, it, expect, beforeEach } from 'vitest';
import { useMarketStore } from '../../store';
import { resetAllStores } from '../mocks/storeMocks';

describe('Market Store', () => {
  beforeEach(() => {
    resetAllStores();
  });

  it('should update alpha metric', () => {
    const newMetric = { probability: 88, trend: 'bullish' as const };
    useMarketStore.getState().setAlphaMetric(newMetric);
    expect(useMarketStore.getState().alphaMetric).toEqual(newMetric);
  });

  it('should update market data for a specific symbol', () => {
    // Symbol from INITIAL_MARKET_DATA
    const symbol = 'BTC-100K-DEC';
    useMarketStore.getState().updateMarket({ symbol, polymarketPrice: 0.95 });
    
    const item = useMarketStore.getState().marketData.find(m => m.symbol === symbol);
    expect(item?.polymarketPrice).toBe(0.95);
  });

  it('should handle multiple updates correctly', () => {
    useMarketStore.getState().updateMarket({ symbol: 'BTC-100K-DEC', polymarketPrice: 0.95 });
    useMarketStore.getState().updateMarket({ symbol: 'FED-RATE-CUT', polymarketPrice: 0.75 });
    
    expect(useMarketStore.getState().marketData.find(m => m.symbol === 'BTC-100K-DEC')?.polymarketPrice).toBe(0.95);
    expect(useMarketStore.getState().marketData.find(m => m.symbol === 'FED-RATE-CUT')?.polymarketPrice).toBe(0.75);
  });

  it('setWhaleData replaces array', () => {
    const data = [{ id: '1', symbol: 'BTC', amount: 100, side: 'buy', timestamp: Date.now() }] as any;
    useMarketStore.getState().setWhaleData(data);
    expect(useMarketStore.getState().whaleData).toEqual(data);
  });
});
