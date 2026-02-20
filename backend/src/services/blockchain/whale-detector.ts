import { polygonClient } from './polygon-client.js';
import { db } from '../../db/index.js';
import { whaleMovements } from '../../db/schema/index.js';
import { redis } from '../../lib/redis.js';
import { config } from '../../config.js';
import { logger } from '../../lib/logger.js';
import { knownWhalesService } from './known-whales.js';
import { ethers } from 'ethers';

const POLYMARKET_EXCHANGES = [
  '0x4bFb41d5B3570DeFd17c2199640522067306282E', // Legacy
  '0xC5d563A36AE78145C45a50134d48A1215220f80a', // NegRisk
  '0x4d97dcd9d9D3B2C650059e6634c03429eA0476045', // CTF
].map(a => a.toLowerCase());

const USDC_ADDRESS = '0x2791Bca491C6201736458c6746e1213d9FA2c9B1';
const USDC_DECIMALS = 6;

export class WhaleDetector {
  private lastProcessedBlock: number = 0;
  private isScanning: boolean = false;

  async getLatestBlockNumber(): Promise<number> {
    const provider = polygonClient.getProvider();
    return await provider.getBlockNumber();
  }

  // Exposed for the sync job
  async processBlock(blockNumber: number) {
    logger.debug({ blockNumber }, 'Processing block for whales');
    await this.scanLogsForWhales(blockNumber);
  }


  private async scanLogsForWhales(blockNumber: number) {
    const filter = {
      address: USDC_ADDRESS,
      fromBlock: blockNumber,
      toBlock: blockNumber,
      topics: [ethers.id('Transfer(address,address,uint256)')]
    };

    const logs = await polygonClient.getLogs(filter);
    
    for (const log of logs) {
      try {
        const parsed = this.parseUsdcLog(log);
        if (parsed) {
          const { from, to, amount } = parsed;
          const valueUsd = Number(amount) / Math.pow(10, USDC_DECIMALS);
          
          if (valueUsd >= config.WHALE_THRESHOLD_USD) {
            const isToPolymarket = POLYMARKET_EXCHANGES.includes(to.toLowerCase());
            const isFromPolymarket = POLYMARKET_EXCHANGES.includes(from.toLowerCase());

            if (isToPolymarket || isFromPolymarket) {
              const direction = isToPolymarket ? 'buy' : 'sell';
              const wallet = isToPolymarket ? from : to;
              const market = isToPolymarket ? to : from;

              await this.handleWhaleMovement({
                wallet,
                txHash: log.transactionHash,
                blockNumber,
                amount: amount.toString(),
                amountUsd: valueUsd,
                direction,
                marketAddress: market,
              });
            }
          }
        }
      } catch (err) {
        logger.error({ err, log }, 'Error parsing USDC log');
      }
    }
  }

  private parseUsdcLog(log: any) {
    try {
      const from = ethers.getAddress('0x' + log.topics[1].slice(26));
      const to = ethers.getAddress('0x' + log.topics[2].slice(26));
      const amount = BigInt(log.data);
      return { from, to, amount };
    } catch {
      return null;
    }
  }

  private async handleWhaleMovement(movement: any) {
    const isKnown = knownWhalesService.isKnownWhale(movement.wallet);
    const label = knownWhalesService.getWhaleLabel(movement.wallet);
    const level = isKnown ? 'alert' : 'info';

    const data = {
      ...movement,
      level,
      marketName: 'Polymarket',
    };

    logger.info({ 
      wallet: data.wallet, 
      amountUsd: data.amountUsd, 
      direction: data.direction,
      label 
    }, 'Whale movement detected');

    try {
      await db.insert(whaleMovements).values({
        walletAddress: data.wallet,
        txHash: data.txHash,
        blockNumber: data.blockNumber,
        amount: data.amount,
        amountUsd: data.amountUsd,
        direction: data.direction,
        marketAddress: data.marketAddress,
        marketName: data.marketName,
        level: data.level,
      }).onConflictDoNothing();

      await redis.publish('whale:movements', JSON.stringify({
        ...data,
        label,
        timestamp: new Date().toISOString()
      }));

      // Metrics
      await redis.incr('metrics:whale:whales_detected');
    } catch (err) {
      logger.error({ err, movement: data }, 'Error saving whale movement');
    }
  }
}

export const whaleDetector = new WhaleDetector();
