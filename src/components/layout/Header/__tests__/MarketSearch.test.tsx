import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MarketSearch } from '../MarketSearch';
import { resetStores } from '../../../../test/mocks/storeDefaults';
import { useMarketStore } from '../../../../store';

describe('MarketSearch', () => {
    beforeEach(() => {
        resetStores();
    });

    const matchText = (text: string) => (_: string, node: Element | null) => {
        const hasText = (n: Element | null) => n?.textContent?.trim() === text;
        const nodeHasText = hasText(node);
        const childrenDontHaveText = Array.from(node?.children || []).every(
          child => !hasText(child as Element)
        );
        return nodeHasText && childrenDontHaveText;
    };

    it('should display search results when typing', async () => {
        const user = userEvent.setup();
        const mockMarkets = [
            { symbol: 'BTC-USD', polymarketPrice: 0.5, kalshiPrice: 0.4, spread: 0.1 },
            { symbol: 'ETH-USD', polymarketPrice: 0.6, kalshiPrice: 0.5, spread: 0.1 }
        ];
        useMarketStore.setState({ marketData: mockMarkets as any });

        render(<MarketSearch />);
        
        const input = screen.getByPlaceholderText(/Search Markets/i);
        await user.click(input);
        await user.type(input, 'BTC');
        
        expect(await screen.findByText(matchText('BTC-USD'))).toBeInTheDocument();
        expect(screen.queryByText(matchText('ETH-USD'))).not.toBeInTheDocument();
    });

    it('should handle keyboard navigation', async () => {
        const user = userEvent.setup();
        const mockMarkets = [
            { symbol: 'MARKET-1', spread: 0.1 },
            { symbol: 'MARKET-2', spread: 0.1 }
        ];
        const setSelectedMarketSpy = vi.fn();
        useMarketStore.setState({ 
            marketData: mockMarkets as any,
            setSelectedMarket: setSelectedMarketSpy
        });

        render(<MarketSearch />);
        
        const input = screen.getByPlaceholderText(/Search Markets/i);
        await user.click(input);
        await user.type(input, 'MARKET');

        // Wait for results
        const options = await screen.findAllByRole('option');
        expect(options[0]).toHaveAttribute('aria-selected', 'true');

        // Press ArrowDown
        await user.keyboard('{ArrowDown}');
        
        await waitFor(async () => {
            const currentOptions = await screen.findAllByRole('option');
            expect(currentOptions[1]).toHaveAttribute('aria-selected', 'true');
        });

        // Press Enter to select
        fireEvent.keyDown(input, { key: 'Enter' });
        
        await waitFor(() => {
            expect(setSelectedMarketSpy).toHaveBeenCalled();
        }, { timeout: 2000 });
        
        expect(setSelectedMarketSpy).toHaveBeenCalledWith(expect.objectContaining({ symbol: 'MARKET-2' }));
    });

    it('should persist and show recent searches', async () => {
        const user = userEvent.setup();
        const mockMarket = { symbol: 'RECENT-1', spread: 0.1 };
        useMarketStore.setState({ marketData: [mockMarket] as any });

        const { unmount } = render(<MarketSearch />);
        
        const input = screen.getByPlaceholderText(/Search Markets/i);
        await user.click(input);
        await user.type(input, 'RECENT');

        const item = await screen.findByText(matchText('RECENT-1'));
        await user.click(item);

        // Re-render to check persistence
        unmount();
        render(<MarketSearch />);
        
        const newInput = screen.getByPlaceholderText(/Search Markets/i);
        fireEvent.focus(newInput);
        
        // Use flexible matching for "Recent Intel" and "RECENT-1"
        expect(await screen.findByText(/Recent Intel/i)).toBeInTheDocument();
        expect(await screen.findByText(/RECENT-1/i)).toBeInTheDocument();
    });
});
