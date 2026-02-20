import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useUIStore, useLayoutStore, useNotificationStore } from '../../store';
import { resetAllStores } from '../mocks/storeMocks';

describe('Layout Store', () => {
  beforeEach(() => {
    resetAllStores();
  });

  it('should swap widgets correctly', () => {
    const { swapWidget } = useLayoutStore.getState();
    const initialSlots = { ...useLayoutStore.getState().slots };
    
    swapWidget('left', 'rightTop');
    
    const newSlots = useLayoutStore.getState().slots;
    expect(newSlots.left).toBe(initialSlots.rightTop);
    expect(newSlots.rightTop).toBe(initialSlots.left);
  });

  it('should reset layout to default', () => {
    const { swapWidget, resetLayout } = useLayoutStore.getState();
    swapWidget('left', 'rightTop');
    resetLayout();
    
    const slots = useLayoutStore.getState().slots;
    expect(slots.left).toBe('newsFeed');
  });
});

describe('Notification Store', () => {
  beforeEach(() => {
    resetAllStores();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should add toast and assign an id', () => {
    const id = useNotificationStore.getState().addToast({
      type: 'info',
      title: 'Test Toast',
    });
    
    expect(id).toBeDefined();
    expect(useNotificationStore.getState().toasts).toHaveLength(1);
    expect(useNotificationStore.getState().toasts[0].id).toBe(id);
  });

  it('should auto-dismiss toast after duration', () => {
    useNotificationStore.getState().addToast({
      type: 'info',
      title: 'Test Toast',
      duration: 1000,
    });
    
    expect(useNotificationStore.getState().toasts).toHaveLength(1);
    
    vi.advanceTimersByTime(1100);
    
    expect(useNotificationStore.getState().toasts).toHaveLength(0);
  });

  it('should dismiss correct item', () => {
    const id1 = useNotificationStore.getState().addToast({ type: 'info', title: 'Toast 1' });
    const id2 = useNotificationStore.getState().addToast({ type: 'info', title: 'Toast 2' });
    
    useNotificationStore.getState().dismissToast(id1);
    
    expect(useNotificationStore.getState().toasts).toHaveLength(1);
    expect(useNotificationStore.getState().toasts[0].id).toBe(id2);
  });

  it('clearAll empties array', () => {
    useNotificationStore.getState().addToast({ type: 'info', title: 'Toast 1' });
    useNotificationStore.getState().addToast({ type: 'info', title: 'Toast 2' });
    
    useNotificationStore.getState().clearAll();
    
    expect(useNotificationStore.getState().toasts).toHaveLength(0);
  });

  it('limits to 5 toasts and cleans up timeouts', () => {
    for (let i = 0; i < 6; i++) {
        useNotificationStore.getState().addToast({ type: 'info', title: `Toast ${i}` });
    }
    
    expect(useNotificationStore.getState().toasts).toHaveLength(5);
    expect(useNotificationStore.getState().toasts.map(t => t.title)).not.toContain('Toast 0');
  });
});

describe('UI Store', () => {
  beforeEach(() => {
    resetAllStores();
  });

  it('should update mobile tab', () => {
    useUIStore.getState().setMobileTab('execution');
    expect(useUIStore.getState().mobileTab).toBe('execution');
  });

  it('should update AI provider', () => {
    const newProvider = { providerId: 'openai' as const, model: 'gpt-4o' };
    useUIStore.getState().setAIProvider(newProvider);
    expect(useUIStore.getState().aiProvider).toEqual(newProvider);
  });

  it('aiProvider persists to localStorage', () => {
    const newProvider = { providerId: 'gemini' as const, model: 'gemini-1.5-pro' };
    useUIStore.getState().setAIProvider(newProvider);
    
    const stored = localStorage.getItem('ui-storage');
    expect(stored).toContain('gemini-1.5-pro');
  });
});
