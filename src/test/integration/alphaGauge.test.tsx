import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { AlphaGauge } from '../../components/widgets/AlphaGauge';
import { useMarketStore } from '../../store';
import { resetAllStores } from '../mocks/storeMocks';

// Mock recharts
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  RadialBarChart: ({ children }: any) => <div data-testid="radial-bar-chart">{children}</div>,
  RadialBar: () => <div data-testid="radial-bar" />,
  PolarAngleAxis: () => <div data-testid="polar-angle-axis" />,
  Cell: () => <div data-testid="cell" />,
}));

describe('AlphaGauge Integration', () => {
  beforeEach(() => {
    resetAllStores();
  });

  it('shows skeleton when alphaMetric is null', () => {
    useMarketStore.setState({ alphaMetric: null });
    
    render(<AlphaGauge />);
    
    // Check for skeleton elements
    const skeleton = screen.getByTestId('alpha-gauge-skeleton');
    expect(skeleton).toBeInTheDocument();
  });

  it('shows value and regime label when data is present', () => {
    useMarketStore.setState({
      alphaMetric: { probability: 72, trend: 'stable' }
    });
    
    render(<AlphaGauge />);
    
    expect(screen.getByText('72')).toBeInTheDocument();
    expect(screen.getByText('HIGH')).toBeInTheDocument();
  });

  it('tooltip shows provider breakdown on hover', () => {
    useMarketStore.setState({
      alphaMetric: { 
        probability: 72, 
        trend: 'up',
        breakdown: {
          fundamentals: { score: 72, providerId: 'anthropic' },
          sentiment: { score: 65, providerId: 'openai' },
          risk: { score: 80, providerId: 'gemini' }
        }
      } as any
    });
    
    render(<AlphaGauge />);
    
    const gauge = screen.getByTestId('alpha-gauge');
    fireEvent.mouseEnter(gauge);
    
    expect(screen.getByText('Agent Breakdown')).toBeInTheDocument();
    expect(screen.getByText(/Claude/)).toBeInTheDocument();
    expect(screen.getByText(/(Fundamentals)/)).toBeInTheDocument();
    expect(screen.getByText('72%')).toBeInTheDocument();
  });
});
