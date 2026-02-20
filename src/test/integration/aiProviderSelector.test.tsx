import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import React from 'react';
import userEvent from '@testing-library/user-event';
import { AIProviderSelector } from '../../components/ui/AIProviderSelector';
import { useUIStore } from '../../store';
import { resetAllStores } from '../mocks/storeMocks';
import { ToastContainer } from '../../components/ui/Toast/ToastContainer';

describe('AIProviderSelector Integration', () => {
  beforeEach(() => {
    cleanup();
    resetAllStores();
    vi.clearAllMocks();
  });

  it('renders in compact mode by default', () => {
    render(<AIProviderSelector mode="compact" />);
    // Initial provider name is 'Claude'
    expect(screen.getByText(/Claude/)).toBeInTheDocument();
  });

  it('opens panel and shows all 3 providers', async () => {
    const user = userEvent.setup();
    render(<AIProviderSelector mode="compact" />);
    
    const trigger = screen.getByTestId('ai-provider-selector-trigger');
    await user.click(trigger);
    
    // Check for options by test ID
    expect(screen.getByTestId('ai-provider-option-anthropic')).toBeInTheDocument();
    expect(screen.getByTestId('ai-provider-option-openai')).toBeInTheDocument();
    expect(screen.getByTestId('ai-provider-option-gemini')).toBeInTheDocument();
  });

  it('updates store and fires toast when selecting Gemini', async () => {
    const user = userEvent.setup();
    
    render(
      <>
        <ToastContainer />
        <AIProviderSelector mode="compact" />
      </>
    );
    
    const trigger = screen.getByTestId('ai-provider-selector-trigger');
    await user.click(trigger);
    
    // Select Gemini option
    const geminiOption = screen.getByTestId('ai-provider-option-gemini');
    await user.click(geminiOption);
    
    expect(useUIStore.getState().aiProvider.providerId).toBe('gemini');
    
    // Check if toast appeared in UI
    expect(screen.getByText('Agent Synchronized')).toBeInTheDocument();
    expect(screen.getByText(/Gemini agents active/i)).toBeInTheDocument();
  });

  it('allows model selection per provider', async () => {
    const user = userEvent.setup();
    render(<AIProviderSelector mode="compact" />);
    
    const trigger = screen.getByTestId('ai-provider-selector-trigger');
    await user.click(trigger);
    
    // Select Gemini provider
    await user.click(screen.getByTestId('ai-provider-option-gemini'));
    
    // Select model
    const select = screen.getByTestId('ai-model-select');
    await user.selectOptions(select, 'gemini-1.5-pro');
    
    expect(useUIStore.getState().aiProvider.model).toBe('gemini-1.5-pro');
  });

  it('persists selection to localStorage', async () => {
    const user = userEvent.setup();
    render(<AIProviderSelector mode="compact" />);
    
    const trigger = screen.getByTestId('ai-provider-selector-trigger');
    await user.click(trigger);
    await user.click(screen.getByTestId('ai-provider-option-openai'));
    
    const stored = JSON.parse(localStorage.getItem('ui-storage') || '{}');
    expect(stored.state.aiProvider.providerId).toBe('openai');
  });
});
