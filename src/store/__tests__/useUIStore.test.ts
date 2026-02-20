import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from '../index';
import { resetStores } from '../../test/mocks/storeDefaults';

describe('useUIStore', () => {
    beforeEach(() => {
        resetStores();
    });

    it('should update booting state', () => {
        const { setBooting } = useUIStore.getState();
        setBooting(false);
        expect(useUIStore.getState().isBooting).toBe(false);
    });

    it('should update search query and focus', () => {
        const { setSearchQuery, setSearchFocused } = useUIStore.getState();
        setSearchQuery('test');
        setSearchFocused(true);
        expect(useUIStore.getState().searchQuery).toBe('test');
        expect(useUIStore.getState().isSearchFocused).toBe(true);
    });

    it('should handle logs', () => {
        const { setLogs } = useUIStore.getState();
        const logs = [{ msg: 'test', type: 'info' }];
        setLogs(logs as any);
        expect(useUIStore.getState().logs).toEqual(logs);
    });
});
