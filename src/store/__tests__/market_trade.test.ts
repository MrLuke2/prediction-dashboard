import { describe, it, expect, beforeEach } from 'vitest';
import { useMarketStore, useTradeStore } from '../index';
import { resetStores } from '../../test/mocks/storeDefaults';

describe('Market and Trade Stores', () => {
    beforeEach(() => {
        resetStores();
    });

    it('should update alpha metric', () => {
        const { setAlphaMetric } = useMarketStore.getState();
        setAlphaMetric({ probability: 75, trend: 'increasing' });
        expect(useMarketStore.getState().alphaMetric.probability).toBe(75);
    });

    it('should update whale data', () => {
        const { setWhaleData } = useMarketStore.getState();
        const data = [{ id: '1', amount: 100 }];
        setWhaleData(data as any);
        expect(useMarketStore.getState().whaleData).toEqual(data);
    });

    it('should update PnL and trade history', () => {
        const { setDisplayedPnL, setTradeHistory } = useTradeStore.getState();
        const mockPnL = { amount: 100.5, roi: 5.2, tradeId: 't1', timestamp: Date.now() };
        setDisplayedPnL(mockPnL);
        setTradeHistory([mockPnL]);
        
        expect(useTradeStore.getState().displayedPnL?.amount).toBe(100.5);
        expect(useTradeStore.getState().tradeHistory.length).toBe(1);
    });
});
