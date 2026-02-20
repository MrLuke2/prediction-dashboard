import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import App from '../../App';
import { resetStores } from '../mocks/storeDefaults';
import { useMarketStore } from '../../store';

// Mock large widgets to avoid rendering complexity
vi.mock('../../components/layout/DraggableWidgetGrid', () => ({
    DraggableWidgetGrid: () => <div data-testid="widget-grid" />
}));

describe.skip('Search Flow Integration', () => {
    beforeEach(() => {
        resetStores();
        vi.useFakeTimers();
    });

    it('should open UltimateInsightsCard when a market is selected from search', async () => {
        const mockMarket = { 
            symbol: 'LINK-USD', 
            polymarketPrice: 0.15, 
            kalshiPrice: 0.14, 
            spread: 0.01,
            trend: 'stable'
        };
        useMarketStore.setState({ marketData: [mockMarket] as any });

        render(<App />);
        
        // Skip boot sequence
        act(() => {
            vi.advanceTimersByTime(10000);
        });

        const input = screen.getByPlaceholderText(/Search Markets/i);
        await act(async () => {
            fireEvent.focus(input);
            fireEvent.change(input, { target: { value: 'LINK' } });
            vi.advanceTimersByTime(200);
        });

        const option = await screen.findByText('LINK-USD');
        fireEvent.click(option);

        // Check if insights card is visible
        expect(screen.getByText(/LINK-USD/)).toBeInTheDocument();
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText(/Cross-Exchange Spread/i)).toBeInTheDocument();
    });
});
