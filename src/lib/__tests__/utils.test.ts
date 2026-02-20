import { describe, it, expect } from 'vitest';
import { cn } from '../utils';

describe('cn utility', () => {
    it('should merge tailwind classes correctly', () => {
        expect(cn('px-2 py-2', 'p-4')).toBe('p-4');
    });

    it('should handle conditional classes', () => {
        expect(cn('base', true && 'active', false && 'hidden')).toBe('base active');
    });

    it('should resolve conflicts (tailwind-merge)', () => {
        // bg-red-500 and bg-blue-500 conflict, last one should win
        expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
    });

    it('should handle arrays and objects', () => {
        expect(cn(['class1', 'class2'], { 'dynamic': true, 'static': false })).toBe('class1 class2 dynamic');
    });
});
