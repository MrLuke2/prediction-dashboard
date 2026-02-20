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
    title: 'Market Intelligence',
    description: 'Instantly search across Polymarket, Kalshi, and other venues. Filter by event tags or specific contract tickers.',
    position: 'bottom'
  },
  {
    targetId: 'market-ticker',
    title: 'Live Spreads',
    description: 'Real-time arbitrage ticker monitoring price discrepancies between regulated (Kalshi) and unregulated (Polymarket) exchanges.',
    position: 'bottom'
  },
  {
    targetId: 'left-panel-container',
    title: 'Event Detection Engine',
    description: 'AI-curated news feed analyzing fundamental, sentiment, and risk factors. Hover over items to see the Council of Agents analysis.',
    position: 'right'
  },
  {
    targetId: 'center-top-left-panel',
    title: 'Alpha Probability Model',
    description: 'Dynamic confidence gauge indicating the aggregate probability of current market predictions being accurate.',
    position: 'bottom'
  },
  {
    targetId: 'center-top-right-panel',
    title: 'BTC/USD Oracle',
    description: 'Sub-second latency price feed serving as the correlation baseline for crypto-correlated prediction markets.',
    position: 'bottom'
  },
  {
    targetId: 'center-bottom-left-panel',
    title: 'Execution Monitor',
    description: 'Live visualization of trade execution, PnL realization, and settlement confirmation on Polygon.',
    position: 'top'
  },
  {
    targetId: 'right-top-panel',
    title: 'Whale Monitor',
    description: 'Tracks high-value wallet movements and "smart money" positioning in real-time to detect insider flow.',
    position: 'left'
  },
  {
    targetId: 'right-bottom-panel',
    title: 'Agent Activity Feed',
    description: 'Transparency logs showing the decision-making process of the Fundamentalist, Sentiment, and Risk agents.',
    position: 'left'
  },
  {
    targetId: 'layout-toggle',
    title: 'Customize Workspace',
    description: 'The entire dashboard is modular. Click here to enter "Edit Mode" to resize panels or swap widgets to fit your trading style.',
    position: 'bottom'
  }
];
