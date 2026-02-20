import { describe, it, expect, beforeEach } from 'vitest';
import { useTradeStore, useMarketStore, useUIStore } from '../../store';
import { resetAllStores } from '../mocks/storeMocks';

describe('Trade Store', () => {
  beforeEach(() => {
    resetAllStores();
  });

  it('addWhaleMovement adds to MarketStore and limits to 50', () => {
    const movement = { id: 'w1', symbol: 'BTC', amount: 50, side: 'buy', timestamp: Date.now() } as any;
    
    useTradeStore.getState().addWhaleMovement(movement);
    
    expect(useMarketStore.getState().whaleData[0]).toEqual(movement);
    expect(useMarketStore.getState().whaleData).toHaveLength(1);
    
    // Test limit
    for (let i = 0; i < 60; i++) {
        useTradeStore.getState().addWhaleMovement({ ...movement, id: `w${i}` });
    }
    expect(useMarketStore.getState().whaleData).toHaveLength(50);
  });

  it('addLog adds to UIStore logs and limits to 100', () => {
    const log = { id: 'l1', message: 'test log', type: 'info', timestamp: Date.now() } as any;
    
    useTradeStore.getState().addLog(log);
    
    expect(useUIStore.getState().logs[0]).toEqual(log);
    
    for (let i = 0; i < 120; i++) {
        useTradeStore.getState().addLog({ ...log, id: `l${i}` });
    }
    expect(useUIStore.getState().logs).toHaveLength(100);
  });

  it('submitTrade updates pendingTrade state', () => {
    const params = { symbol: 'BTC/USD', amount: 1, side: 'buy' } as any;
    useTradeStore.getState().submitTrade(params);
    expect(useTradeStore.getState().pendingTrade).toEqual(params);
  });

  it('updates PnL states', () => {
    const pnl = { amount: 150, roi: 5, tradeId: 't1', timestamp: Date.now() };
    useTradeStore.getState().setLastPnL(pnl);
    useTradeStore.getState().setDisplayedPnL(pnl);
    
    expect(useTradeStore.getState().lastPnL).toEqual(pnl);
    expect(useTradeStore.getState().displayedPnL).toEqual(pnl);
  });
});
