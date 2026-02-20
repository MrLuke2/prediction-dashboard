import { ethers, Block, TransactionResponse, Log } from 'ethers';
import { config } from '../../config.js';
import { logger } from '../../lib/logger.js';

export class PolygonClient {
  private provider: ethers.JsonRpcProvider;

  constructor() {
    const rpcUrl = config.POLYGON_RPC_URL || 'https://polygon-rpc.com';
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    
    // In ethers v6, there isn't a direct 'error' event on provider the same way as v5
    // But we can monitor connection or handle errors in calls.
    // However, some providers might emit errors.
  }

  async getBlock(blockNumber: number | string): Promise<Block | null> {
    try {
      return await this.provider.getBlock(blockNumber);
    } catch (error) {
      logger.error({ blockNumber, error }, 'Error fetching block');
      throw error;
    }
  }

  async getTransaction(txHash: string): Promise<TransactionResponse | null> {
    try {
      return await this.provider.getTransaction(txHash);
    } catch (error) {
      logger.error({ txHash, error }, 'Error fetching transaction');
      throw error;
    }
  }

  async getLogs(filter: ethers.Filter): Promise<Log[]> {
    try {
      const logs = await this.provider.getLogs(filter);
      return logs as Log[];
    } catch (error) {
      logger.error({ filter, error }, 'Error fetching logs');
      throw error;
    }
  }

  getProvider() {
    return this.provider;
  }
}

export const polygonClient = new PolygonClient();
