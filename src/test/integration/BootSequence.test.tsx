import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { BootSequence } from '../../components/layout/BootSequence';

describe('BootSequence Integration', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    it('should complete all steps and call onComplete', async () => {
        const onComplete = vi.fn();
        render(<BootSequence onComplete={onComplete} />);

        // Initial step
        expect(screen.getByText(/INITIALIZING KERNEL/i)).toBeInTheDocument();

        // Advance through all 6 steps + final timeout
        for (let i = 0; i < 7; i++) {
            await act(async () => {
                vi.advanceTimersByTime(1000);
            });
        }

        expect(onComplete).toHaveBeenCalled();
    });

    it('should show success indicators for completed steps', async () => {
        render(<BootSequence onComplete={() => {}} />);

        await act(async () => {
            vi.advanceTimersByTime(500); // Complete first step
        });

        const okMarkers = screen.getAllByText('[OK]');
        expect(okMarkers.length).toBeGreaterThan(0);
    });
});
