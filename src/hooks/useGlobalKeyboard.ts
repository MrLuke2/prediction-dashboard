import { useEffect } from 'react';
import { useUIStore, useMarketStore } from '../store';

/**
 * Global keyboard shortcuts for the application.
 * / -> Focus market search
 * Esc -> Close any open modal or overlay
 */
export const useGlobalKeyboard = () => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Forward slash (/) to focus search
            if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
                e.preventDefault();
                const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
                if (searchInput) {
                    searchInput.focus();
                }
            }

            // Escape (Esc) to close modals/overlays in priority order
            if (e.key === 'Escape') {
                const ui = useUIStore.getState();
                const market = useMarketStore.getState();

                // 1. Insights Card
                if (market.selectedMarket) {
                    market.setSelectedMarket(null);
                    return;
                }

                // 2. Auth Modal
                if (ui.isAuthOpen) {
                    ui.setAuthOpen(false);
                    return;
                }

                // 3. Tutorial Overlay
                if (ui.isTutorialOpen) {
                    ui.setTutorialOpen(false);
                    return;
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);
};
