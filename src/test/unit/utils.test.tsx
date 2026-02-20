import { describe, it, expect, vi } from 'vitest';
import { cn, timeAgo } from '../../lib/utils';
import { formatUSD, formatPct, formatSpread } from '../../lib/formatters';
import { measureRender } from '../../lib/perf';
import React from 'react';
import { render } from '@testing-library/react';

describe('Utility Functions', () => {
  describe('cn', () => {
    it('should merge classes correctly', () => {
      expect(cn('a', 'b')).toBe('a b');
      expect(cn('a', { b: true, c: false })).toBe('a b');
    });

    it('should resolve tailwind conflicts', () => {
      expect(cn('px-2 py-2', 'px-4')).toBe('py-2 px-4');
    });
  });

  describe('timeAgo', () => {
    it('should format relative time correctly', () => {
      const now = new Date('2024-01-01T12:00:00Z').getTime();
      vi.setSystemTime(now);

      expect(timeAgo(now - 1000)).toBe('just now');
      expect(timeAgo(now - 10000)).toBe('10s ago');
      expect(timeAgo(now - 60000)).toBe('1m ago');
      expect(timeAgo(now - 3600000)).toBe('1h ago');
      expect(timeAgo(now - 86400000)).toBe('1d ago');
    });
  });

  describe('Formatters', () => {
    it('should format USD', () => {
      expect(formatUSD(1234.56)).toBe('$1,234.56');
      expect(formatUSD(1234)).toBe('$1,234.00');
      expect(formatUSD(0)).toBe('$0.00');
      expect(formatUSD('invalid')).toBe('$0.00');
    });

    it('should format percentage', () => {
      expect(formatPct(12.3)).toBe('12.3%');
      expect(formatPct(0)).toBe('0.0%');
      expect(formatPct('invalid')).toBe('0.0%');
    });

    it('should format spread', () => {
      expect(formatSpread(0.032)).toBe('+3.2¢');
      expect(formatSpread(-0.015)).toBe('-1.5¢');
      expect(formatSpread(0)).toBe('+0.0¢');
    });
  });

  describe('Performance Monitoring', () => {
    it('should wrap component with measureRender', () => {
      const TestComponent: React.FC = () => <div>Test</div>;
      const Measured = measureRender(TestComponent, 'TestComponent');
      
      const { getByText } = render(<Measured />);
      expect(getByText('Test')).toBeInTheDocument();
    });
  });
});
