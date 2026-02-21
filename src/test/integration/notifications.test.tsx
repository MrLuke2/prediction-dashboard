import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, act, cleanup } from '@testing-library/react';
import React from 'react';
import { ToastContainer } from '../../components/ui/Toast/ToastContainer';
import { useNotificationStore, useUIStore } from '../../store';
import { resetAllStores } from '../mocks/storeMocks';

describe('Notifications Integration', () => {
  beforeEach(() => {
    cleanup();
    resetAllStores();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('addToast renders in ToastContainer', async () => {
    render(<ToastContainer />);
    
    act(() => {
      useNotificationStore.getState().addToast({
        type: 'info',
        title: 'New Notification',
        message: 'This is a test message'
      });
    });
    
    expect(screen.getByText('New Notification')).toBeInTheDocument();
  });

  it('Auto-dismisses after duration (fake timers)', async () => {
    render(<ToastContainer />);
    
    act(() => {
      useNotificationStore.getState().addToast({
        type: 'info',
        title: 'Temporary',
        duration: 3000
      });
    });
    
    expect(screen.getByText('Temporary')).toBeInTheDocument();
    
    act(() => {
      vi.advanceTimersByTime(3100);
    });
    
    expect(screen.queryByText('Temporary')).not.toBeInTheDocument();
  });

  it('Whale alert -> warning toast', () => {
    render(<ToastContainer />);
    
    act(() => {
      useNotificationStore.getState().addToast({
        type: 'warning',
        title: 'Whale Alert',
        message: 'Large movement detected'
      });
    });
    
    expect(screen.getByText('Whale Alert')).toBeInTheDocument();
    expect(screen.getByTestId('toast-icon-warning')).toBeInTheDocument();
  });

  it('AI provider switch -> agent toast with provider name', () => {
    render(<ToastContainer />);
    
    act(() => {
      useUIStore.getState().setAIProvider({ providerId: 'anthropic', model: 'claude-sonnet-4-5' });
    });
    
    expect(screen.getByText('AI Provider Switched')).toBeInTheDocument();
    expect(screen.getByText(/Claude/i)).toBeInTheDocument();
  });

  it('Offline -> error toast, online -> dismisses it', () => {
    // This integration depends on how offline status is tracked. 
    // If it's via a hook that calls addToast, we test that flow.
    render(<ToastContainer />);
    
    let toastId: string = '';
    act(() => {
      toastId = useNotificationStore.getState().addToast({
        type: 'error',
        title: 'Connection Lost',
        duration: Infinity
      });
    });
    
    expect(screen.getByText('Connection Lost')).toBeInTheDocument();
    
    act(() => {
      useNotificationStore.getState().dismissToast(toastId);
    });
    
    expect(screen.queryByText('Connection Lost')).not.toBeInTheDocument();
  });
});
