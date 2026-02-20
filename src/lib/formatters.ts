/**
 * Utility functions for formatting monetary and numeric values.
 */

/**
 * Formats a number as USD currency.
 * Example: 1234.56 -> "$1,234.56"
 */
export const formatUSD = (n: number | string): string => {
  const value = typeof n === 'string' ? parseFloat(n) : n;
  if (isNaN(value)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};

/**
 * Formats a number as a percentage.
 * Example: 12.3 -> "12.3%"
 */
export const formatPct = (n: number | string): string => {
  const value = typeof n === 'string' ? parseFloat(n) : n;
  if (isNaN(value)) return '0.0%';
  return `${value.toFixed(1)}%`;
};

/**
 * Formats a spread value in cents.
 * Example: 0.032 -> "+3.2¢"
 */
export const formatSpread = (n: number | string): string => {
  const value = typeof n === 'string' ? parseFloat(n) : n;
  if (isNaN(value)) return '0.0¢';
  const cents = value * 100;
  return `${cents >= 0 ? '+' : ''}${cents.toFixed(1)}¢`;
};
