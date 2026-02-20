import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MarketSearch } from '../MarketSearch';
import { resetStores } from '../../../../test/mocks/storeDefaults';

describe('MarketSearch Basic', () => {
    beforeEach(() => {
        resetStores();
    });

    it('should render the input field', () => {
        render(<MarketSearch />);
        expect(screen.getByPlaceholderText(/Search Markets/i)).toBeInTheDocument();
    });

    it('should show placeholder text', () => {
        render(<MarketSearch />);
        expect(screen.getByPlaceholderText('Search Markets...')).toBeInTheDocument();
    });
});
