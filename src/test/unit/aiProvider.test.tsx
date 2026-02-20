import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import React from 'react';
import { AI_PROVIDERS } from '../../config/aiProviders';
import { AIProviderSelector } from '../../components/ui/AIProviderSelector';
import { useUIStore } from '../../store';
import { resetAllStores } from '../mocks/storeMocks';

describe('AI Providers Config', () => {
  it('should have all 3 providers', () => {
    expect(AI_PROVIDERS).toHaveLength(3);
    const ids = AI_PROVIDERS.map(p => p.id);
    expect(ids).toContain('anthropic');
    expect(ids).toContain('openai');
    expect(ids).toContain('gemini');
  });

  it('should have valid models array for each provider', () => {
    AI_PROVIDERS.forEach(provider => {
      expect(provider.models.length).toBeGreaterThan(0);
      const modelIds = provider.models.map(m => m.id);
      expect(modelIds).toContain(provider.defaultModelId);
    });
  });
});

describe('AIProviderSelector Component', () => {
  beforeEach(() => {
    cleanup();
    resetAllStores();
  });

  it('renders all 3 providers', () => {
    render(<AIProviderSelector />);
    
    // Open the selector
    const trigger = screen.getByTestId('ai-provider-selector-trigger');
    fireEvent.click(trigger);
    
    AI_PROVIDERS.forEach(provider => {
      expect(screen.getByTestId(`ai-provider-option-${provider.id}`)).toBeInTheDocument();
    });
  });

  it('selecting provider updates store', () => {
    render(<AIProviderSelector />);
    
    const trigger = screen.getByTestId('ai-provider-selector-trigger');
    fireEvent.click(trigger);
    
    const geminiOption = screen.getByTestId('ai-provider-option-gemini');
    fireEvent.click(geminiOption);
    
    expect(useUIStore.getState().aiProvider.providerId).toBe('gemini');
  });

  it('provider name rendered in selector UI', () => {
    render(<AIProviderSelector />);
    
    const currentProviderId = useUIStore.getState().aiProvider.providerId;
    const currentProvider = AI_PROVIDERS.find(p => p.id === currentProviderId);
    
    // Use getAllByText as it might appear in hidden elements or similar
    const elements = screen.getAllByText(new RegExp(currentProvider!.name, 'i'));
    expect(elements.length).toBeGreaterThanOrEqual(1);
  });
});
