import { describe, it, expect, vi } from 'vitest';
import { cn, timeAgo } from '../../lib/utils';
import { formatUSD, formatPct, formatSpread } from '../../lib/formatters';
import { measureRender } from '../../lib/perf';
import React from 'react';
import { render } from '@testing-library/react';

describe('Utility Functions', () => {
  describe('cn()', () => {
    it('merges tailwind classes and resolves conflicts', () => {
      expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
      expect(cn('px-2', 'p-4')).toBe('p-4');
      expect(cn('text-white', 'text-black')).toBe('text-black');
    });

    it('handles conditional classes', () => {
      expect(cn('base', true && 'active', false && 'inactive')).toBe('base active');
    });
  });

  describe('Formatters', () => {
    it('formatUSD() formats correctly', () => {
      expect(formatUSD(1234.56)).toBe('$1,234.56');
      expect(formatUSD('1234.56')).toBe('$1,234.56');
      expect(formatUSD(0)).toBe('$0.00');
      expect(formatUSD('invalid')).toBe('$0.00');
    });

    it('formatPct() formats correctly', () => {
      expect(formatPct(12.34)).toBe('12.3%');
      expect(formatPct(0)).toBe('0.0%');
    });

    it('formatSpread() formats correctly', () => {
      expect(formatSpread(0.032)).toBe('+3.2¢');
      expect(formatSpread(-0.015)).toBe('-1.5¢');
    });
  });

  describe('timeAgo()', () => {
    it('returns "just now" for recent times', () => {
      const now = Date.now();
      expect(timeAgo(now - 2000)).toBe('just now');
    });

    it('returns seconds ago', () => {
      const now = Date.now();
      expect(timeAgo(now - 30000)).toBe('30s ago');
    });

    it('returns minutes ago', () => {
      const now = Date.now();
      expect(timeAgo(now - 120000)).toBe('2m ago');
    });
  });

  describe('measureRender()', () => {
    it('wraps component correctly', () => {
      const MockComponent = () => <div>Test</div>;
      const Measured = measureRender(MockComponent, 'MockComponent');
      
      expect(Measured.displayName).toBe('Measured(MockComponent)');
      
      const { getByText } = render(<Measured />);
      expect(getByText('Test')).toBeInTheDocument();
    });
  });
});
