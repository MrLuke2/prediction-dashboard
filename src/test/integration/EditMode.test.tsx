import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import App from '../../App';
import { resetStores } from '../mocks/storeDefaults';
import { useUIStore, useLayoutStore } from '../../store';

vi.mock('../../components/layout/DraggableWidgetGrid', () => ({
    DraggableWidgetGrid: ({ isEditMode }: any) => (
        <div data-testid="widget-grid">
            {isEditMode ? 'EDIT_MODE_ACTIVE' : 'EDIT_MODE_INACTIVE'}
        </div>
    )
}));

describe('Edit Mode Integration', () => {
    beforeEach(() => {
        resetStores();
        vi.useFakeTimers();
    });

    it('should toggle edit mode via HeaderActions', async () => {
        render(<App />);
        
        // Skip boot
        act(() => {
            vi.advanceTimersByTime(10000);
        });

        const editBtn = screen.getByLabelText(/Enter layout editing mode/i);
        fireEvent.click(editBtn);

        expect(useUIStore.getState().isEditMode).toBe(true);
        expect(screen.getByLabelText(/Exit layout editing mode/i)).toBeInTheDocument();

        fireEvent.click(screen.getByLabelText(/Exit layout editing mode/i));
        expect(useUIStore.getState().isEditMode).toBe(false);
    });

    it('should show reset button only in edit mode', async () => {
        render(<App />);
        act(() => vi.advanceTimersByTime(10000));

        expect(screen.queryByLabelText(/Reset dashboard layout/i)).not.toBeInTheDocument();

        fireEvent.click(screen.getByLabelText(/Enter layout editing mode/i));
        expect(screen.getByLabelText(/Reset dashboard layout/i)).toBeInTheDocument();
    });
});
