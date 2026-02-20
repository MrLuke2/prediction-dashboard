/**
 * Design Tokens for Alpha Mode Predict
 * Centralized source of truth for branding, typography, and accessibility styles.
 */

export const TOKENS = {
  colors: {
    polyBlue: '#2563eb',
    kalshiGreen: '#10b981',
    kalshiRed: '#f43f5e',
    finBg: '#09090b',
    finCard: '#18181b',
    finBorder: '#27272a',
    finHover: '#3f3f46',
    textMain: '#f4f4f5',
    textMuted: '#a1a1aa',
  },
  
  // Accessibility Focus Ring Style
  // Usage: "ring-2 ring-poly-blue ring-offset-2 ring-offset-fin-bg outline-none"
  focusRing: "focus:outline-none focus:ring-2 focus:ring-poly-blue focus:ring-offset-2 focus:ring-offset-fin-bg transition-shadow",
  
  breakpoints: {
    mobile: '768px',
    tablet: '1024px',
    desktop: '1280px',
    wide: '1900px',
  }
};
