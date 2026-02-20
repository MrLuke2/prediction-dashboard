import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, renderHook } from '@testing-library/react';
import React from 'react';
import { useFocusTrap } from '../useFocusTrap';
import { useMediaQuery } from '../useMediaQuery';

describe('useFocusTrap', () => {
  it('traps focus between first and last element', () => {
    const TestComponent = () => {
      const ref = useFocusTrap(true);
      return (
        <div ref={ref}>
          <button data-testid="first">First</button>
          <button data-testid="second">Second</button>
          <button data-testid="last">Last</button>
        </div>
      );
    };

    render(<TestComponent />);
    const first = screen.getByTestId('first');
    const second = screen.getByTestId('second');
    const last = screen.getByTestId('last');

    // Initial focus
    expect(document.activeElement).toBe(first);

    // Tab on last element should go to first
    last.focus();
    fireEvent.keyDown(last, { key: 'Tab' });
    expect(document.activeElement).toBe(first);

    // Shift+Tab on first element should go to last
    first.focus();
    fireEvent.keyDown(first, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(last);
    
    // Normal tab on second should NOT trap manually (browser does it)
    second.focus();
    fireEvent.keyDown(second, { key: 'Tab' });
    expect(document.activeElement).toBe(second); // Actually fireEvent doesn't move focus, our hook only prevents and moves if matched
  });
});

describe('useMediaQuery', () => {
  it('returns true if media query matches', () => {
    // Mock matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: query === '(min-width: 1024px)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });

    const { result } = renderHook(() => useMediaQuery('(min-width: 1024px)'));
    expect(result.current).toBe(true);

    const { result: resultFalse } = renderHook(() => useMediaQuery('(min-width: 2000px)'));
    expect(resultFalse.current).toBe(false);
  });
});
