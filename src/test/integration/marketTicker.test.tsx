import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MarketTicker } from '../../components/widgets/MarketTicker';
import { resetStores } from '../mocks/storeDefaults';
import { useUIStore } from '../../store';
import { MarketPair } from '../../types';

describe('MarketTicker Integration', () => {
    beforeEach(() => {
        resetStores();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('shows empty state when no data', () => {
        render(<MarketTicker data={[]} />);
        expect(screen.getByText(/Awaiting market data/i)).toBeInTheDocument();
    });

    it('renders ticker items and clones them for seamless scrolling', () => {
        const mockData: MarketPair[] = [
            { symbol: 'BTC/USD', polymarketPrice: 0.5, kalshiPrice: 0.52, spread: 0.04, trend: 'up' },
            { symbol: 'ETH/USD', polymarketPrice: 0.6, kalshiPrice: 0.58, spread: -0.02, trend: 'down' }
        ];

        render(<MarketTicker data={mockData} />);

        // Ticker clones data to ensure seamless scroll, so we expect 2 of each
        expect(screen.getAllByText('BTC/USD')).toHaveLength(2);
        expect(screen.getAllByText('ETH/USD')).toHaveLength(2);
        
        // Check prices (50c and 52c)
        expect(screen.getAllByText(/P: 50¢/)).toHaveLength(2);
        expect(screen.getAllByText(/K: 52¢/)).toHaveLength(2);
    });

    it('updates UIStore search query when clicking a pair', () => {
        const mockData: MarketPair[] = [
            { symbol: 'BTC/USD', polymarketPrice: 0.5, kalshiPrice: 0.5, spread: 0, trend: 'neutral' }
        ];

        render(<MarketTicker data={mockData} />);
        
        const tickerItem = screen.getAllByText('BTC/USD')[0];
        fireEvent.click(tickerItem);

        expect(useUIStore.getState().searchQuery).toBe('BTC/USD');
    });

    it('shows stale data badge after threshold', () => {
        const mockData: MarketPair[] = [
            { symbol: 'BTC/USD', polymarketPrice: 0.5, kalshiPrice: 0.5, spread: 0, trend: 'neutral' }
        ];
        const now = Date.now();

        render(<MarketTicker data={mockData} lastUpdate={now} />);
        
        expect(screen.queryByText(/STALE/i)).not.toBeInTheDocument();

        // Advance time past threshold (30s default)
        act(() => {
            vi.advanceTimersByTime(31000);
        });

        expect(screen.getByText(/STALE/i)).toBeInTheDocument();
    });
});
