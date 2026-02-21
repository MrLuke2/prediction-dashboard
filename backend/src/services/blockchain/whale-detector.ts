import { polygonClient } from './polygon-client.js';
import { db } from '../../db/index.js';
import { whaleMovements } from '../../db/schema/index.js';
import { redis } from '../../lib/redis.js';
import { config } from '../../config.js';
import { logger } from '../../lib/logger.js';
import { knownWhalesService } from './known-whales.js';
import { aiRouter } from '../ai/router.js';
import { ethers } from 'ethers';
import { z } from 'zod';

const POLYMARKET_CONTRACTS = [
  '0x4bFb41d5B3570DeFd17c2199640522067306282E', // Proxy
  '0xC5d563A36AE78145C45a50134d48A1215220f80a', // CTF
  '0x2791Bca491C6201736458c6746e1213d9FA2c9B1', // USDC on Polygon (common for trades)
].map(a => a.toLowerCase());

const USDC_DECIMALS = 6;

const WhaleClassifySchema = z.object({
  intent: z.enum(['accumulating', 'distributing', 'neutral']),
  confidence: z.number(),
  reasoning: z.string(),
});

export class WhaleDetector {
  private lastProcessedBlock: number = 0;
  private isRunning: boolean = false;

  async start() {
    if (this.isRunning) return;
    this.isRunning = true;
    logger.info('Whale Detector started');
    
    // Initial block number
    this.lastProcessedBlock = await polygonClient.getBlockNumber();

    this.subscribeToBlocks();
  }

  private subscribeToBlocks() {
    setInterval(async () => {
      try {
        const latestBlock = await polygonClient.getBlockNumber();
        if (latestBlock > this.lastProcessedBlock) {
          for (let i = this.lastProcessedBlock + 1; i <= latestBlock; i++) {
            await this.scanBlock(i);
          }
          this.lastProcessedBlock = latestBlock;
        }
      } catch (err) {
        logger.error({ err }, 'Error in whale detector block interval');
      }
    }, 2000); // Poll every 2s
  }

  private async scanBlock(blockNumber: number) {
    logger.debug({ blockNumber }, 'Scanning block for whales');
    const block = await polygonClient.getBlock(blockNumber);
    if (!block) return;

    // In a production environment with high tx volume, we'd use logs/events.
    // For this prompt, we scan txs to known Polymarket contracts as requested.
    const txs = await Promise.all(
      block.transactions.map((txHash: string) => polygonClient.getTransaction(txHash))
    );

    const whaleTxs = this.filterWhaleTransactions(txs.filter(Boolean) as any[]);
    
    for (const tx of whaleTxs) {
      await this.processWhaleTx(tx);
    }
  }

  private filterWhaleTransactions(txs: ethers.TransactionResponse[]) {
    return txs.filter((tx: ethers.TransactionResponse) => {
      const isToPolymarket = tx.to && POLYMARKET_CONTRACTS.includes(tx.to.toLowerCase());
      // Estimate USD value from tx value (if native) or data length (heuristic for demo)
      // Real implementation would parse USDC transfer logs.
      // We assume tx.value is native MATIC, simplified mapping to USD.
      const valueMatic = parseFloat(ethers.formatEther(tx.value || 0));
      const valueUsd = valueMatic * 1.0; // Simplified 1 MATIC = $1 for demo
      
      // Also check for common USDC transfer patterns in tx data (simplified)
      const isUSDCWhale = tx.data?.length > 100 && valueUsd > config.WHALE_THRESHOLD_USD;
      
      return isToPolymarket && (valueUsd >= config.WHALE_THRESHOLD_USD || isUSDCWhale);
    });
  }

  private async processWhaleTx(tx: ethers.TransactionResponse) {
    const movement = this.parseWhaleMovement(tx);
    const intent = await this.classifyWhaleIntent(movement);
    
    const isKnown = knownWhalesService.isKnownWhale(movement.wallet);
    const label = knownWhalesService.getWhaleLabel(movement.wallet);
    const level = isKnown ? 'alert' : 'info';

    try {
      const [newMovement] = await db.insert(whaleMovements).values({
        walletAddress: movement.wallet,
        amountUsd: movement.amountUsd.toString(),
        direction: movement.direction as 'in' | 'out',
        venue: 'polymarket',
        txHash: tx.hash,
        flaggedByProvider: intent.provider,
        label: label || intent.reasoning.substring(0, 255),
        isKnownWhale: isKnown,
      }).returning();

      const wsPayload = {
        id: newMovement.id,
        wallet: movement.wallet,
        amountUsd: movement.amountUsd,
        direction: movement.direction,
        intent: intent.intent,
        confidence: intent.confidence,
        label,
        level,
        txHash: tx.hash,
        timestamp: new Date().toISOString(),
      };

      await redis.publish('whale:movements', JSON.stringify(wsPayload));
      logger.info({ wallet: movement.wallet, amountUsd: movement.amountUsd }, 'Whale movement processed');
    } catch (err) {
      logger.error({ err }, 'Error saving whale movement');
    }
  }

  private parseWhaleMovement(tx: ethers.TransactionResponse) {
    // Simplified parsing
    const valueMatic = parseFloat(ethers.formatEther(tx.value || 0));
    return {
      wallet: tx.from,
      amountUsd: valueMatic > 0 ? valueMatic : config.WHALE_THRESHOLD_USD + 500, // Mocked for data txs
      direction: 'in', // To Polymarket
      market: tx.to,
    };
  }

  private async classifyWhaleIntent(movement: any) {
    const prompt = `Classify the intent of this whale movement on Polymarket:
    Wallet: ${movement.wallet}
    Amount: $${movement.amountUsd}
    Direction: ${movement.direction}
    Market: ${movement.market}

    Is this whale accumulating or distributing? Confidence?`;

    try {
      const response = await aiRouter.complete(
        { providerId: 'openai', model: 'gpt-4o-mini' }, // Cheapest model
        {
          systemPrompt: 'You are a crypto whale behavior analyst. Respond ONLY with valid JSON matching the schema.',
          userPrompt: prompt,
          responseSchema: WhaleClassifySchema,
          agentName: 'WhaleDetector',
        }
      );

      const parsed = typeof response.content === 'string' ? JSON.parse(response.content) : response.content;
      return {
        ...parsed,
        provider: response.provider,
      };
    } catch (err) {
      logger.error({ err }, 'Error classifying whale intent');
      return { intent: 'neutral', confidence: 0, reasoning: 'Classification failed', provider: 'openai' };
    }
  }
}

export const whaleDetector = new WhaleDetector();
