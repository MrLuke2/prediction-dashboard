import { describe, it, expect } from 'vitest';
import { WIDGET_REGISTRY } from '../registry';
import { WidgetType } from '../../../store/types';

describe('WidgetRegistry', () => {
    const requiredTypes: WidgetType[] = [
        'liveFeed',
        'alphaGauge',
        'btcTracker',
        'whaleRadar',
        'newsFeed',
        'pnlCard',
        'tradeHistory',
        'correlationHeatmap'
    ];

    it('should contain all 8 required widget types', () => {
        const registeredKeys = Object.keys(WIDGET_REGISTRY);
        expect(registeredKeys.length).toBe(8);
        requiredTypes.forEach(type => {
            expect(registeredKeys).toContain(type);
        });
    });

    it('should have valid metadata for each widget', () => {
        Object.entries(WIDGET_REGISTRY).forEach(([key, item]) => {
            expect(item.defaultTitle).toBeDefined();
            expect(typeof item.defaultTitle).toBe('string');
            expect(item.icon).toBeDefined();
            expect(item.component).toBeDefined();
            // Lazy components are functions or objects with $$typeof: Symbol(react.lazy)
            expect(typeof item.component === 'function' || typeof item.component === 'object').toBe(true);
        });
    });
});
