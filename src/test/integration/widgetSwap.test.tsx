import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HeaderActions } from '../../components/layout/Header/HeaderActions';
import { useUIStore, useLayoutStore } from '../../store';
import { resetAllStores } from '../mocks/storeMocks';

describe('Widget Layout Integration', () => {
  beforeEach(() => {
    resetAllStores();
  });

  it('updates store when swapping slots (manual trigger)', () => {
    const { swapWidget } = useLayoutStore.getState();
    const initialLeft = useLayoutStore.getState().slots.left;
    const initialRightTop = useLayoutStore.getState().slots.rightTop;
    
    act(() => {
      swapWidget('left', 'rightTop');
    });
    
    expect(useLayoutStore.getState().slots.left).toBe(initialRightTop);
    expect(useLayoutStore.getState().slots.rightTop).toBe(initialLeft);
  });

  it('restores DEFAULT_LAYOUT when clicking reset', async () => {
    const user = userEvent.setup();
    const { swapWidget } = useLayoutStore.getState();
    
    // Enter edit mode
    act(() => {
      useUIStore.getState().setEditMode(true);
    });
    
    // Mess up layout
    act(() => {
      swapWidget('left', 'rightTop');
    });
    
    render(<HeaderActions />);
    
    const resetButton = screen.getByLabelText(/Reset dashboard layout/i);
    await user.click(resetButton);
    
    expect(useLayoutStore.getState().slots.left).toBe('newsFeed');
  });
});
