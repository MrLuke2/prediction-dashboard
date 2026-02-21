import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import React from 'react';
import userEvent from '@testing-library/user-event';
import { AIProviderSelector } from '../../components/ui/AIProviderSelector';
import { useUIStore, useNotificationStore } from '../../store';
import { resetAllStores } from '../mocks/storeMocks';
import { ToastContainer } from '../../components/ui/Toast/ToastContainer';
import { AI_PROVIDERS } from '../../config/aiProviders';

describe('AIProviderSelector Integration', () => {
  beforeEach(() => {
    cleanup();
    resetAllStores();
    vi.clearAllMocks();
  });

  it('Renders in compact mode by default', () => {
    render(<AIProviderSelector mode="compact" />);
    // Current default from storeMocks is Anthropic
    expect(screen.getByText(/Claude/)).toBeInTheDocument();
  });

  it('Opens panel showing 3 providers', async () => {
    const user = userEvent.setup();
    render(<AIProviderSelector mode="compact" />);
    
    const trigger = screen.getByTestId('ai-provider-selector-trigger');
    await user.click(trigger);
    
    AI_PROVIDERS.forEach(provider => {
        expect(screen.getByTestId(`ai-provider-option-${provider.id}`)).toBeInTheDocument();
    });
  });

  it('Selecting Gemini -> store updates -> toast fires', async () => {
    const user = userEvent.setup();
    
    // We need both the selector and the container to see the toast
    render(
      <>
        <ToastContainer />
        <AIProviderSelector mode="compact" />
      </>
    );
    
    const trigger = screen.getByTestId('ai-provider-selector-trigger');
    await user.click(trigger);
    
    const geminiOption = screen.getByTestId('ai-provider-option-gemini');
    await user.click(geminiOption);
    
    expect(useUIStore.getState().aiProvider.providerId).toBe('gemini');
    
    // Check for toast title which is 'AI Provider Switched' (from useUIStore.setAIProvider)
    expect(screen.getByText('AI Provider Switched')).toBeInTheDocument();
  });

  it('Model sub-selector works per provider', async () => {
    const user = userEvent.setup();
    render(<AIProviderSelector mode="compact" />);
    
    const trigger = screen.getByTestId('ai-provider-selector-trigger');
    await user.click(trigger);
    
    // Select OpenAI provider
    const openaiOption = screen.getByTestId('ai-provider-option-openai');
    await user.click(openaiOption);
    
    // Select model 'gpt-4o'
    const modelOption = screen.getByTestId('ai-model-option-gpt-4o');
    await user.click(modelOption);
    
    expect(useUIStore.getState().aiProvider.model).toBe('gpt-4o');
  });

  it('Selection persists on page reload (localStorage)', async () => {
    const user = userEvent.setup();
    render(<AIProviderSelector mode="compact" />);
    
    const trigger = screen.getByTestId('ai-provider-selector-trigger');
    await user.click(trigger);
    
    const geminiOption = screen.getByTestId('ai-provider-option-gemini');
    await user.click(geminiOption);
    
    const stored = JSON.parse(localStorage.getItem('ui-storage') || '{}');
    expect(stored.state.aiProvider.providerId).toBe('gemini');
  });
});
