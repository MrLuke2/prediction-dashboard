interface SpreadResult {
  polyPrice: number;
  kalshiPrice: number;
  spread: number;
  spreadPct: number;
  direction: 'poly_premium' | 'kalshi_premium' | 'neutral';
  arbSignal: boolean;
}

export const computeSpread = (polyPrice: number, kalshiPrice: number): SpreadResult => {
  const diff = polyPrice - kalshiPrice;
  const spread = Math.abs(diff);
  const avg = (polyPrice + kalshiPrice) / 2 || 1; 
  const spreadPct = (spread / avg) * 100;
  
  let direction: SpreadResult['direction'] = 'neutral';
  if (diff > 0) direction = 'poly_premium';
  else if (diff < 0) direction = 'kalshi_premium';

  // Arb signal if spread > 3 cents (0.03)
  const arbSignal = spread > 0.03;

  return {
    polyPrice,
    kalshiPrice,
    spread: parseFloat(spread.toFixed(4)),
    spreadPct: parseFloat(spreadPct.toFixed(2)),
    direction,
    arbSignal
  };
};
