import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AppErrorBoundary } from '../AppErrorBoundary';
import { reportError } from '../../../lib/errorReporting';

// Mock errorReporting
vi.mock('../../../lib/errorReporting', () => ({
    reportError: vi.fn(),
}));

const ThrowError = ({ message = 'Test Error' }: { message?: string }) => {
    throw new Error(message);
};

describe('AppErrorBoundary', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Prevent console.error from cluttering the output during expected errors
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('renders children when no error occurs', () => {
        render(
            <AppErrorBoundary>
                <div data-testid="child">Safety First</div>
            </AppErrorBoundary>
        );
        expect(screen.getByTestId('child')).toHaveTextContent('Safety First');
    });

    it('renders fallback UI when an error is caught', () => {
        render(
            <AppErrorBoundary>
                <ThrowError message="Neural Link Failure" />
            </AppErrorBoundary>
        );

        expect(screen.getByText(/System Critical/i)).toBeInTheDocument();
        expect(screen.getAllByText(/Neural Link Failure/i)[0]).toBeInTheDocument();
        expect(reportError).toHaveBeenCalled();
    });

    it('reloads the page when "Re-Initialize Terminal" is clicked', () => {
        // Mock window.location.reload
        const reloadSpy = vi.fn();
        Object.defineProperty(window, 'location', {
            configurable: true,
            value: { reload: reloadSpy },
        });

        render(
            <AppErrorBoundary>
                <ThrowError />
            </AppErrorBoundary>
        );

        fireEvent.click(screen.getByText(/Re-Initialize Terminal/i));
        expect(reloadSpy).toHaveBeenCalled();
    });
});
