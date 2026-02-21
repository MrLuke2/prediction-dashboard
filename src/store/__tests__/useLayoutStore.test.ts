import { describe, it, expect, beforeEach } from 'vitest';
import { useLayoutStore } from '../index';
import { resetStores } from '../../test/mocks/storeDefaults';

describe('useLayoutStore', () => {
    beforeEach(() => {
        resetStores();
    });

    it('should have default layout slots', () => {
        const slots = useLayoutStore.getState().slots;
        expect(slots.leftTop).toBe('newsFeed');
        expect(slots.rightBottom).toBe('liveFeed');
    });

    it('should swap widgets between slots', () => {
        const { swapWidget } = useLayoutStore.getState();
        
        swapWidget('leftTop', 'rightBottom');
        
        const slots = useLayoutStore.getState().slots;
        expect(slots.leftTop).toBe('liveFeed');
        expect(slots.rightBottom).toBe('newsFeed');
    });

    it('should reset layout to default', () => {
        const { swapWidget, resetLayout } = useLayoutStore.getState();
        
        swapWidget('leftTop', 'rightBottom');
        resetLayout();
        
        const slots = useLayoutStore.getState().slots;
        expect(slots.leftTop).toBe('newsFeed');
        expect(slots.rightBottom).toBe('liveFeed');
    });

    it('should persist layout to localStorage', () => {
        const { swapWidget } = useLayoutStore.getState();
        swapWidget('leftTop', 'rightBottom');
        
        const stored = JSON.parse(localStorage.getItem('dashboard-layout-storage') || '{}');
        expect(stored.state.slots.leftTop).toBe('liveFeed');
    });
});
