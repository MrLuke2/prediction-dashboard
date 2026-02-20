import { aiService } from './src/services/ai.service.js';
import axios from 'axios';
import { config } from './src/config.js';
import { logger } from './src/lib/logger.js';

async function verifyKeys() {
  console.log('🚀 Starting API Key Verification...\n');

  // 1. Gemini Verification
  console.log('--- 🤖 Gemini Verification ---');
  if (config.GEMINI_API_KEY) {
    try {
      const response = await aiService.chat({
        prompt: 'Say "Gemini is online" in exactly 3 words.',
        model: 'gemini-2.5-flash'
      });
      console.log(`✅ Gemini Response: ${response}`);
    } catch (err: any) {
      console.error(`❌ Gemini Error: ${err.message}`);
    }
  } else {
    console.log('⚠️ Gemini API Key not configured.');
  }

  // 2. Kalshi Verification (Basic Check)
  console.log('\n--- 🎰 Kalshi Verification ---');
  if (config.KALSHI_API_KEY) {
    try {
      // Production URL: https://api.elections.kalshi.com/trade-api/v2
      const response = await axios.get('https://api.elections.kalshi.com/trade-api/v2/markets', {
        headers: { 'X-Kalshi-API-KEY': config.KALSHI_API_KEY },
        params: { limit: 1 },
        timeout: 5000
      });
      console.log(`✅ Kalshi Status: Reachable (Found ${response.data.markets?.length || 0} markets)`);
    } catch (err: any) {
      console.error(`❌ Kalshi Error: ${err.response?.data?.error || err.message}`);
    }
  } else {
    console.log('⚠️ Kalshi API Key not configured.');
  }

  // 3. Polymarket Verification (Basic Check)
  console.log('\n--- 📈 Polymarket Verification ---');
  try {
     const gamma = await axios.get('https://gamma-api.polymarket.com/markets', { params: { limit: 1 }, timeout: 5000 });
     console.log(`✅ Polymarket Gamma API: Reachable`);
     
     if (config.POLYMARKET_API_KEY) {
       // CLOB check - Getting the server time is a good unauthenticated check that verifies base URL
       const clobTime = await axios.get('https://clob.polymarket.com/time', { timeout: 5000 });
       console.log(`✅ Polymarket CLOB Time: ${clobTime.data}`);
       
       // Note: To verify the API KEY itself, a signed request is usually needed on Polymarket.
       // We'll assume if /time is up and config has the key, it's ready for use.
     }
  } catch (err: any) {
    console.error(`❌ Polymarket Error: ${err.message}`);
  }

  console.log('\n✨ Verification Finished.');
  process.exit(0);
}

verifyKeys();
