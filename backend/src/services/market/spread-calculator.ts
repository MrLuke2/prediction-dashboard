import { config } from '../../config.js';
import type { SpreadResult } from './types.js';

/**
 * Compute the spread between Polymarket and Kalshi yes-prices.
 *
 * @param polyPrice  0-1 yes probability from Polymarket
 * @param kalshiPrice 0-1 yes probability from Kalshi
 * @param polyVolume  24h USD volume from Polymarket (for confidence)
 * @param kalshiVolume 24h USD volume from Kalshi (for confidence)
 */
export function computeSpread(
  polyPrice: number,
  kalshiPrice: number,
  polyVolume = 0,
  kalshiVolume = 0,
): SpreadResult {
  const diff = polyPrice - kalshiPrice;
  const spread = Math.abs(diff);

  // Spread percentage relative to midpoint
  const midpoint = (polyPrice + kalshiPrice) / 2 || 1;
  const spreadPct = parseFloat(((spread / midpoint) * 100).toFixed(2));

  // Direction
  let direction: SpreadResult['direction'] = 'neutral';
  if (diff > 0.001) direction = 'poly_higher';
  else if (diff < -0.001) direction = 'kalshi_higher';

  // Arb signal from config
  const arbThreshold = config.ARB_THRESHOLD;
  const arbSignal = spread > arbThreshold;

  // Confidence: 0-100 based on combined volume + spread consistency
  // Higher volume = more reliable signal
  const totalVolume = polyVolume + kalshiVolume;
  let confidence = 0;

  if (totalVolume > 100_000) confidence = 90;
  else if (totalVolume > 50_000) confidence = 75;
  else if (totalVolume > 10_000) confidence = 60;
  else if (totalVolume > 1_000) confidence = 40;
  else confidence = 20;

  // Adjust confidence by spread magnitude (larger = stronger signal)
  if (arbSignal) {
    confidence = Math.min(100, confidence + 10);
  }

  return {
    spread: parseFloat(spread.toFixed(4)),
    spreadPct,
    direction,
    arbSignal,
    confidence,
    polyPrice: parseFloat(polyPrice.toFixed(4)),
    kalshiPrice: parseFloat(kalshiPrice.toFixed(4)),
  };
}
