import { TutorialStep } from '../components/ui/TutorialOverlay';

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    targetId: 'header-logo',
    title: 'Welcome to Agent Predict',
    description: 'This is your centralized command center for AI-driven prediction market arbitrage. The system aggregates 42+ data sources to find edge.',
    position: 'bottom'
  },
  {
    targetId: 'header-search',
    title: '1. Discovery',
    description: 'Instantly search across Polymarket, Kalshi, and other venues. Filter by event tags or specific contract tickers to begin your intelligence cycle.',
    position: 'bottom'
  },
  {
    targetId: 'market-ticker',
    title: '2. Real-Time Arbitrage',
    description: 'The Ticker highlights live spreads. Click any market name (e.g. TRUMP-FED-NOMINEE) to instantly populate the search bar and analyze the gap.',
    position: 'bottom'
  },
  {
    targetId: 'left-top-panel',
    title: '3. Fundamental Scan',
    description: 'The Event Detection Engine analyzes breaking news and sentiment factors via the Council of Agents.',
    position: 'right'
  },
  {
    targetId: 'left-bottom-panel',
    title: '4. Tactical Correlation',
    description: 'Monitor cross-asset coupling. Tracks how Bitcoin volatility infects prediction markets. Emerald = Coupled, Crimson = Inverted.',
    position: 'right'
  },
  {
    targetId: 'center-top-left-panel',
    title: '5. Alpha Probability',
    description: 'Validated Signal: This gauge indicates the aggregate confidence (0-100%) of current market predictions being accurate.',
    position: 'bottom'
  },
  {
    targetId: 'center-top-right-panel',
    title: '6. Oracle Baseline',
    description: 'The BTC/USD sub-second tracker provides the correlation baseline for all crypto-linked prediction events.',
    position: 'bottom'
  },
  {
    targetId: 'right-top-panel',
    title: '7. Whale Monitor',
    description: 'Verify smart money positioning. High-value wallet movements indicate where elite capital is flowing.',
    position: 'left'
  },
  {
    targetId: 'right-bottom-panel',
    title: '8. Agent Transparency',
    description: 'The Activity Feed reveals the reasoning depth of your Fundamentalist, Sentiment, and Risk agents.',
    position: 'left'
  },
  {
    targetId: 'center-bottom-left-panel',
    title: '9. Execution Monitor',
    description: 'Watch your trades go live. Visualizes order placement, PnL realization, and settlement confirmation on Polygon.',
    position: 'top'
  },
  {
    targetId: 'trade-history-container',
    title: '10. Trade Ledger',
    description: 'The persistent record of all captured arbitrage. Every win and loss is logged here in sub-second detail.',
    position: 'top'
  },
  {
    targetId: 'emergency-override-btn',
    title: '11. Risk Management',
    description: 'Hold to neutralize all trading operations. If the system is STANDBY, tap to Restore Flight Ops and re-engage the pipeline.',
    position: 'top'
  },
  {
    targetId: 'model-settings-toggle',
    title: '12. Neural Calibration',
    description: 'Assign specific AI models to each agent. Use Gemini for speed, Claude for nuance, or GPT for logic. The Header status dots reflect your choices.',
    position: 'bottom'
  },
  {
    targetId: 'layout-toggle',
    title: '13. Cockpit Layout',
    description: 'Enter Edit Mode to resize panels or swap widgets. Tailor the intelligence stack to your specific trading style.',
    position: 'bottom'
  },
  {
    targetId: 'header-search',
    title: '14. Intelligence Deep-Dive',
    description: 'Complete the loop! Search for any market to open the Intelligence Report — walk through Overview, Analysis, and Execute tabs.',
    position: 'bottom'
  }
];
