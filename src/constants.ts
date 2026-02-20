import { MarketPair } from './types';

export const INITIAL_MARKET_DATA: MarketPair[] = [
  { symbol: 'TRUMP-FED-NOMINEE', pair: 'YES/USD', volume: '1.2M', polymarketPrice: 0.42, kalshiPrice: 0.38, spread: 0.04, trend: 'up' },
  { symbol: 'PRES-ELECTION-2024', pair: 'WIN/USD', volume: '450.8M', polymarketPrice: 0.52, kalshiPrice: 0.51, spread: 0.01, trend: 'neutral' },
  { symbol: 'FED-RATE-CUT', pair: 'CUT/USD', volume: '12.4M', polymarketPrice: 0.65, kalshiPrice: 0.60, spread: 0.05, trend: 'up' },
  { symbol: 'BTC-100K-DEC', pair: 'YES/USD', volume: '45.1M', polymarketPrice: 0.32, kalshiPrice: 0.30, spread: 0.02, trend: 'down' },
  { symbol: 'US-RECESSION', pair: 'YES/USD', volume: '5.2M', polymarketPrice: 0.15, kalshiPrice: 0.18, spread: -0.03, trend: 'neutral' },
  { symbol: 'ETH-ETF-FLOW', pair: 'IN/USD', volume: '32.1M', polymarketPrice: 0.45, kalshiPrice: 0.44, spread: 0.01, trend: 'up' },
  { symbol: 'SOL-ATH-2024', pair: 'YES/USD', volume: '8.4M', polymarketPrice: 0.22, kalshiPrice: 0.20, spread: 0.02, trend: 'up' },
  { symbol: 'GPT-5-RELEASE', pair: 'YES/USD', volume: '1.2M', polymarketPrice: 0.10, kalshiPrice: 0.12, spread: -0.02, trend: 'down' },
  { symbol: 'TIKTOK-BAN', pair: 'BAN/USD', volume: '18.3M', polymarketPrice: 0.40, kalshiPrice: 0.38, spread: 0.02, trend: 'neutral' },
  { symbol: 'TAY-SWIFT-ENGAGE', pair: 'YES/USD', volume: '800k', polymarketPrice: 0.25, kalshiPrice: 0.28, spread: -0.03, trend: 'up' },
  { symbol: 'GTA-6-TRAILER', pair: 'YES/USD', volume: '4.2M', polymarketPrice: 0.88, kalshiPrice: 0.85, spread: 0.03, trend: 'up' },
  { symbol: 'SUPERBOWL-LIX', pair: 'KC/USD', volume: '10.1M', polymarketPrice: 0.50, kalshiPrice: 0.50, spread: 0.00, trend: 'neutral' },
  { symbol: 'X-IPO-2025', pair: 'YES/USD', volume: '2.1M', polymarketPrice: 0.08, kalshiPrice: 0.05, spread: 0.03, trend: 'down' },
  { symbol: 'OIL-100-BBL', pair: 'YES/USD', volume: '10.4M', polymarketPrice: 0.33, kalshiPrice: 0.35, spread: -0.02, trend: 'up' },
  { symbol: 'GOLD-3K-OZ', pair: 'YES/USD', volume: '5.8M', polymarketPrice: 0.60, kalshiPrice: 0.58, spread: 0.02, trend: 'up' },
  { symbol: 'CHINA-GDP-5', pair: 'YES/USD', volume: '1.2M', polymarketPrice: 0.42, kalshiPrice: 0.40, spread: 0.02, trend: 'down' },
  { symbol: 'SPACEX-IPO', pair: 'YES/USD', volume: '1.2M', polymarketPrice: 0.18, kalshiPrice: 0.20, spread: -0.02, trend: 'neutral' },
  { symbol: 'GOOG-BREAKUP', pair: 'YES/USD', volume: '1.2M', polymarketPrice: 0.12, kalshiPrice: 0.10, spread: 0.02, trend: 'up' },
  { symbol: 'NVDA-3T-CAP', pair: 'YES/USD', volume: '15.4M', polymarketPrice: 0.75, kalshiPrice: 0.70, spread: 0.05, trend: 'up' },
  { symbol: 'TSLA-ROBOTAXI', pair: 'YES/USD', volume: '5.2M', polymarketPrice: 0.30, kalshiPrice: 0.32, spread: -0.02, trend: 'down' },
  { symbol: 'US-DEBT-36T', pair: 'YES/USD', volume: '1.2M', polymarketPrice: 0.98, kalshiPrice: 0.99, spread: -0.01, trend: 'up' },
  { symbol: 'EUR-USD-PARITY', pair: 'YES/USD', volume: '1.2M', polymarketPrice: 0.05, kalshiPrice: 0.04, spread: 0.01, trend: 'neutral' },
];

export const AGENT_AVATARS = {
  FUNDAMENTALIST: 'F',
  SENTIMENT: 'S',
  RISK: 'R',
  ORCHESTRATOR: 'O'
};

export const MOCK_WALLET_ADDRESSES = [
  '0x7a...3f', '0xb2...9c', '0x1d...aa', '0x88...11', '0x9f...e0'
];

export const COLORS = {
  neonGreen: '#39FF14',
  electricBlue: '#00FFFF',
  warningRed: '#FF0055',
  voidBlack: '#050505',
};