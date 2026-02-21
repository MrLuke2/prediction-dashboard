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
    
    swapWidget('leftTop', 'rightTop');
    
    const newSlots = useLayoutStore.getState().slots;
    expect(newSlots.leftTop).toBe(initialSlots.rightTop);
    expect(newSlots.rightTop).toBe(initialSlots.leftTop);
  });

  it('should reset layout to default', () => {
    const { swapWidget, resetLayout } = useLayoutStore.getState();
    swapWidget('leftTop', 'rightTop');
    resetLayout();
    
    const slots = useLayoutStore.getState().slots;
    expect(slots.leftTop).toBe('newsFeed');
  });

  it('localStorage persist/rehydrate works', () => {
    const { swapWidget } = useLayoutStore.getState();
    swapWidget('leftTop', 'rightTop');
    
    const stored = localStorage.getItem('dashboard-layout-storage');
    expect(stored).toBeDefined();
    expect(JSON.parse(stored!).state.slots.leftTop).toBe('whaleRadar');
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
});

describe('UI Store', () => {
  beforeEach(() => {
    resetAllStores();
  });

  it('should update mobile tab', () => {
    useUIStore.getState().setMobileTab('execution');
    expect(useUIStore.getState().mobileTab).toBe('execution');
  });

  it('should update wsConnectionState', () => {
    useUIStore.getState().setWSConnectionState('connected');
    expect(useUIStore.getState().wsConnectionState).toBe('connected');
  });

  it('should update AI provider and persist to localStorage', () => {
    const newProvider = { providerId: 'openai' as const, model: 'gpt-4o' };
    useUIStore.getState().setAIProvider(newProvider);
    expect(useUIStore.getState().aiProvider).toEqual(newProvider);
    
    const stored = localStorage.getItem('ui-storage');
    expect(stored).toContain('gpt-4o');
  });

  it('Switching AI provider updates store + triggers toast', () => {
    const addToastSpy = vi.spyOn(useNotificationStore.getState(), 'addToast');
    const newProvider = { providerId: 'openai' as const, model: 'gpt-4o' };
    
    useUIStore.getState().setAIProvider(newProvider);
    
    expect(useUIStore.getState().aiProvider).toEqual(newProvider);
    expect(addToastSpy).toHaveBeenCalledWith(expect.objectContaining({
        type: 'agent',
        title: 'AI Provider Switched'
    }));
  });
});
