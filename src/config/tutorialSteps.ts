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
    title: 'Live Spreads — Click to Search',
    description: 'Real-time arbitrage ticker. Hover to pause and copy text. Click any market name (e.g. TRUMP-FED-NOMINEE) to instantly populate the search bar and begin intelligence analysis.',
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
    description: 'Live visualization of trade execution, PnL realization, and settlement confirmation on Polygon. Click any trade in Trade History to view its details here.',
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
    description: 'Transparency logs showing the decision-making process of the Fundamentalist, Sentiment, and Risk agents. Reflects the currently selected AI model.',
    position: 'left'
  },
  {
    targetId: 'model-settings-toggle',
    title: 'Model Command Console',
    description: 'Open the settings panel to switch AI models globally. See reasoning depth, latency, and cost for each model. The system defaults to Gemini 2.5 Flash for optimal speed-to-cost ratio.',
    position: 'bottom'
  },
  {
    targetId: 'layout-toggle',
    title: 'Customize Workspace',
    description: 'The entire dashboard is modular. Click here to enter "Edit Mode" to resize panels or swap widgets to fit your trading style.',
    position: 'bottom'
  },
  {
    targetId: 'header-search',
    title: 'Intelligence Deep-Dive',
    description: 'Try it now! Click a market in the ticker or search for one. This opens the Intelligence Report — walk through Overview, Analysis, Whale Activity, and Execute tabs. On the Execute tab, use "Back to Dashboard" to return here.',
    position: 'bottom'
  }
];
