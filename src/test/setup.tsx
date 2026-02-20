import '@testing-library/jest-dom';
import { vi } from 'vitest';
import React from 'react';

// Mock MatchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), 
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
vi.stubGlobal('IntersectionObserver', vi.fn(() => ({
  disconnect: vi.fn(),
  observe: vi.fn(),
  takeRecords: vi.fn(),
  unobserve: vi.fn(),
})));

// Mock ResizeObserver
vi.stubGlobal('ResizeObserver', vi.fn(() => ({
  disconnect: vi.fn(),
  observe: vi.fn(),
  unobserve: vi.fn(),
})));

// Minimal Framer Motion Mock
const mockComponent = (tag: string) => React.forwardRef(({ children, whileHover, whileTap, initial, animate, exit, transition, variants, ...props }: any, ref: any) => 
  React.createElement(tag, { ...props, ref }, children)
);

vi.mock('framer-motion', () => ({
  motion: {
    div: mockComponent('div'),
    button: mockComponent('button'),
    span: mockComponent('span'),
    h1: mockComponent('h1'),
    h3: mockComponent('h3'),
    header: mockComponent('header'),
    nav: mockComponent('nav'),
  },
  AnimatePresence: ({ children }: any) => children,
  useAnimation: () => ({ start: vi.fn(), stop: vi.fn() }),
  useInView: () => [vi.fn(), false],
}));
