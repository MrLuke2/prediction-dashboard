import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MarketSearch } from '../MarketSearch';
import { resetStores } from '../../../../test/mocks/storeDefaults';
import { useMarketStore } from '../../../../store';

describe.skip('MarketSearch', () => {
    beforeEach(() => {
        resetStores();
        vi.useFakeTimers();
    });

    it('should display search results when typing', async () => {
        const mockMarkets = [
            { symbol: 'BTC-USD', polymarketPrice: 0.5, kalshiPrice: 0.4, spread: 0.1 },
            { symbol: 'ETH-USD', polymarketPrice: 0.6, kalshiPrice: 0.5, spread: 0.1 }
        ];
        useMarketStore.setState({ marketData: mockMarkets as any });

        render(<MarketSearch />);
        
        const input = screen.getByPlaceholderText(/Search Markets/i);
        await act(async () => {
            fireEvent.focus(input);
            fireEvent.change(input, { target: { value: 'BTC' } });
           // Wait for debounce
        });
        await act(async () => {
            vi.advanceTimersByTime(200);
        });

        screen.debug();
        expect(await screen.findByText('BTC-USD')).toBeInTheDocument();
        expect(screen.queryByText('ETH-USD')).not.toBeInTheDocument();
    });

    it('should handle keyboard navigation', async () => {
        const mockMarkets = [
            { symbol: 'MARKET-1', spread: 0.1 },
            { symbol: 'MARKET-2', spread: 0.1 }
        ];
        useMarketStore.setState({ marketData: mockMarkets as any });

        render(<MarketSearch />);
        
        const input = screen.getByPlaceholderText(/Search Markets/i);
        await act(async () => {
            fireEvent.focus(input);
            fireEvent.change(input, { target: { value: 'MARKET' } });
            vi.advanceTimersByTime(200);
        });

        // Initially first item is selected
        const options = await screen.findAllByRole('option');
        expect(options[0]).toHaveAttribute('aria-selected', 'true');

        // Press ArrowDown
        await act(async () => {
            fireEvent.keyDown(input, { key: 'ArrowDown' });
        });
        
        expect(options[0]).toHaveAttribute('aria-selected', 'false');
        expect(options[1]).toHaveAttribute('aria-selected', 'true');

        // Press Enter to select
        const setSelectedMarketSpy = vi.spyOn(useMarketStore.getState(), 'setSelectedMarket');
        await act(async () => {
            fireEvent.keyDown(input, { key: 'Enter' });
        });
        
        expect(setSelectedMarketSpy).toHaveBeenCalledWith(mockMarkets[1]);
    });

    it('should persist and show recent searches', async () => {
        const mockMarket = { symbol: 'RECENT-1', spread: 0.1 };
        useMarketStore.setState({ marketData: [mockMarket] as any });

        const { unmount } = render(<MarketSearch />);
        
        const input = screen.getByPlaceholderText(/Search Markets/i);
        await act(async () => {
            fireEvent.focus(input);
            fireEvent.change(input, { target: { value: 'RECENT' } });
            vi.advanceTimersByTime(200);
        });

        fireEvent.click(await screen.findByText('RECENT-1'));

        // Re-render to check persistence
        unmount();
        render(<MarketSearch />);
        
        const newInput = screen.getByPlaceholderText(/Search Markets/i);
        await act(async () => {
            fireEvent.focus(newInput);
        });
        
        expect(await screen.findByText('RECENT-1')).toBeInTheDocument();
        expect(screen.getByText(/Recent Intel/i)).toBeInTheDocument();
    });
});
