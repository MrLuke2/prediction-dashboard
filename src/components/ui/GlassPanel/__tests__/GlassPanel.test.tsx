import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { GlassPanel } from '../GlassPanel';

describe('GlassPanel', () => {
  it('renders children correctly', () => {
    render(
      <GlassPanel>
        <div data-testid="child">Content</div>
      </GlassPanel>
    );
    expect(screen.getByTestId('child')).toHaveTextContent('Content');
  });

  it('renders title and subtitle when provided', () => {
    render(<GlassPanel title="Main Title" subtitle="Small Sub" />);
    expect(screen.getByText('Main Title')).toBeInTheDocument();
    expect(screen.getByText('Small Sub')).toBeInTheDocument();
  });

  it('shows skeleton when isLoading is true', () => {
    const { container } = render(<GlassPanel isLoading={true}>Children</GlassPanel>);
    // GlassSkeleton has animate-pulse class
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows edit mode overlay when isEditMode is true', () => {
    render(<GlassPanel isEditMode={true} />);
    expect(screen.getByText(/Drag to Swap/i)).toBeInTheDocument();
  });

  it('renders with different variants', () => {
    const { container: defaultPanel } = render(<GlassPanel variant="default" />);
    const { container: alertPanel } = render(<GlassPanel variant="alert" />);
    
    expect(defaultPanel.firstChild).toHaveClass('border-brand-fin-border');
    expect(alertPanel.firstChild).toHaveClass('border-brand-kalshi-red/50');
  });

  it('renders footer correctly', () => {
    render(
      <GlassPanel>
        <GlassPanel.Footer>Footer Content</GlassPanel.Footer>
      </GlassPanel>
    );
    expect(screen.getByText('Footer Content')).toBeInTheDocument();
  });
});

describe('GlassPanel.ErrorBoundary', () => {
  const Thrower = () => {
    throw new Error('Test break');
  };

  it('catches errors and shows fallback UI', () => {
    // Suppress console.error for this test
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    render(
      <GlassPanel>
        <Thrower />
      </GlassPanel>
    );
    
    expect(screen.getByText('Component Error')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /RETRY/i })).toBeInTheDocument();
    
    spy.mockRestore();
  });

  it('retries when clicking retry button', () => {
    const onRetry = vi.fn();
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const { rerender } = render(
      <GlassPanel.ErrorBoundary onRetry={onRetry}>
        <Thrower />
      </GlassPanel.ErrorBoundary>
    );
    
    fireEvent.click(screen.getByText('RETRY'));
    
    expect(onRetry).toHaveBeenCalled();
    
    spy.mockRestore();
  });
});
