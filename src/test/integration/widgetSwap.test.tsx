import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { HeaderActions } from '../../components/layout/Header/HeaderActions';
import { useUIStore, useLayoutStore } from '../../store';
import { resetAllStores } from '../mocks/storeMocks';

describe('Widget Layout Integration', () => {
  beforeEach(() => {
    resetAllStores();
  });

  it('Edit mode -> swap two slots -> store updated', () => {
    const { swapWidget } = useLayoutStore.getState();
    const initialLeftTop = useLayoutStore.getState().slots.leftTop;
    const initialRightTop = useLayoutStore.getState().slots.rightTop;
    
    act(() => {
      swapWidget('leftTop', 'rightTop');
    });
    
    expect(useLayoutStore.getState().slots.leftTop).toBe(initialRightTop);
    expect(useLayoutStore.getState().slots.rightTop).toBe(initialLeftTop);
  });

  it('Reset layout -> DEFAULT_LAYOUT restored', async () => {
    const user = userEvent.setup();
    const { swapWidget } = useLayoutStore.getState();
    
    // Enter edit mode
    act(() => {
      useUIStore.getState().setEditMode(true);
    });
    
    // Mess up layout
    act(() => {
      swapWidget('leftTop', 'rightTop');
    });
    
    render(<HeaderActions />);
    
    // We can use aria-label to find the reset button
    const resetButton = screen.getByLabelText(/Reset dashboard layout/i);
    await user.click(resetButton);
    
    // 'leftTop' should be 'newsFeed' by default
    expect(useLayoutStore.getState().slots.leftTop).toBe('newsFeed');
  });
});
