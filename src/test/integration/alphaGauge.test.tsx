import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { AlphaGauge } from '../../components/widgets/AlphaGauge';
import { useMarketStore, useUIStore } from '../../store';
import { resetAllStores } from '../mocks/storeMocks';

describe('AlphaGauge Integration', () => {
  beforeEach(() => {
    cleanup();
    resetAllStores();
  });

  it('Shows skeleton when alphaMetric is null', () => {
    useMarketStore.setState({ alphaMetric: null });
    render(<AlphaGauge />);
    expect(screen.getByTestId('alpha-gauge-skeleton')).toBeInTheDocument();
  });

  it('Tooltip shows provider breakdown on hover', async () => {
    const user = userEvent.setup();
    useMarketStore.setState({ 
      alphaMetric: { 
        probability: 72, 
        trend: 'increasing', 
        history: [],
        breakdown: {
            fundamentals: { score: 72, providerId: 'anthropic' },
            sentiment: { score: 65, providerId: 'anthropic' },
            risk: { score: 80, providerId: 'anthropic' }
        }
      } 
    });
    
    render(<AlphaGauge />);
    
    const container = screen.getByTestId('alpha-gauge');
    await user.hover(container);
    
    // Check for "Claude" and "Fundamentals" and "72%"
    const claudeElements = await screen.findAllByText(/Claude/);
    expect(claudeElements.length).toBeGreaterThanOrEqual(1);
    
    expect(await screen.findByText(/Fundamentals/)).toBeInTheDocument();
    expect(await screen.findByText(/72%/)).toBeInTheDocument();
  });

  it('Reflects provider switch in breakdown', async () => {
    const user = userEvent.setup();
    useMarketStore.setState({ 
        alphaMetric: { 
          probability: 50, 
          trend: 'stable', 
          history: [],
          breakdown: {
              fundamentals: { score: 50, providerId: 'openai' },
              sentiment: { score: 50, providerId: 'openai' },
              risk: { score: 50, providerId: 'openai' }
          }
        } 
      });
      
    // Switch to OpenAI
    useUIStore.getState().setAIProvider({ providerId: 'openai', model: 'gpt-4o' });
    
    render(<AlphaGauge />);
    
    const container = screen.getByTestId('alpha-gauge');
    await user.hover(container);
    
    // Now should show GPT
    const gptElements = await screen.findAllByText(/GPT/);
    expect(gptElements.length).toBeGreaterThanOrEqual(1);
  });
});
