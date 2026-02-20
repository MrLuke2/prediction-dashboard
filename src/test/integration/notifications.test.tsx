import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';
import { ToastContainer } from '../../components/ui/Toast/ToastContainer';
import { useNotificationStore, useUIStore } from '../../store';
import { resetAllStores } from '../mocks/storeMocks';

describe('Notifications Integration', () => {
  beforeEach(() => {
    resetAllStores();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders a toast when addToast is called', async () => {
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

  it('auto-dismisses toast after duration', async () => {
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

  it('whale alert shows warning toast', () => {
    render(<ToastContainer />);
    
    act(() => {
      useNotificationStore.getState().addToast({
        type: 'warning',
        title: 'Whale Alert',
        message: 'Large movement detected'
      });
    });
    
    expect(screen.getByText('Whale Alert')).toBeInTheDocument();
    const icon = screen.getByTestId('toast-icon-warning');
    expect(icon).toBeInTheDocument();
  });

  it('AI provider switch shows agent toast with provider name', () => {
    render(<ToastContainer />);
    
    act(() => {
      useNotificationStore.getState().addToast({
        type: 'agent',
        title: 'Agent Synchronized',
        message: 'Claude agents active',
        providerId: 'anthropic'
      });
    });
    
    expect(screen.getByText('Agent Synchronized')).toBeInTheDocument();
    expect(screen.getByText(/Claude/)).toBeInTheDocument();
  });

  it('offline/online transitions show/dismiss error toast', () => {
    render(<ToastContainer />);
    
    // Simulate offline
    let toastId: string = '';
    act(() => {
      toastId = useNotificationStore.getState().addToast({
        type: 'error',
        title: 'Connection Lost',
        message: 'Real-time feed suspended',
        duration: Infinity
      });
    });
    
    expect(screen.getByText('Connection Lost')).toBeInTheDocument();
    
    // Simulate online
    act(() => {
      useNotificationStore.getState().dismissToast(toastId);
    });
    
    expect(screen.queryByText('Connection Lost')).not.toBeInTheDocument();
  });
});
