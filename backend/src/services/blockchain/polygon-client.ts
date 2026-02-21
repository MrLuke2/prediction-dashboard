import { ethers, Block, TransactionResponse, Log } from 'ethers';
import { config } from '../../config.js';
import { logger } from '../../lib/logger.js';

export class PolygonClient {
  private provider!: ethers.JsonRpcProvider;
  private retryCount = 0;
  private readonly MAX_RETRIES = 3;

  constructor() {
    this.connect();
  }

  private connect() {
    try {
      const rpcUrl = config.POLYGON_RPC_URL || 'https://polygon-rpc.com';
      this.provider = new ethers.JsonRpcProvider(rpcUrl);
      this.retryCount = 0;
      logger.info({ rpcUrl }, 'Polygon RPC connected');
    } catch (error) {
      this.handleError(error);
    }
  }

  private handleError(error: any) {
    logger.error({ error }, 'Polygon RPC provider error');
    if (this.retryCount < this.MAX_RETRIES) {
      this.retryCount++;
      const delay = Math.pow(2, this.retryCount) * 1000;
      logger.info({ retryCount: this.retryCount, delay }, 'Retrying connection...');
      setTimeout(() => this.connect(), delay);
    } else {
      logger.error('Max retries reached for Polygon RPC connection');
    }
  }

  async getBlock(blockNumber: number | string): Promise<Block | null> {
    return this.callWithRetry(() => this.provider.getBlock(blockNumber));
  }

  async getTransaction(txHash: string): Promise<TransactionResponse | null> {
    return this.callWithRetry(() => this.provider.getTransaction(txHash));
  }

  async getLogs(filter: ethers.Filter): Promise<Log[]> {
    return this.callWithRetry(() => this.provider.getLogs(filter));
  }

  async getBlockNumber(): Promise<number> {
    return this.callWithRetry(() => this.provider.getBlockNumber());
  }

  private async callWithRetry<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      logger.warn({ error }, 'Polygon RPC call failed, retrying once...');
      // Simple one-shot retry for transient network issues
      try {
        return await fn();
      } catch (secondError) {
        logger.error({ error: secondError }, 'Polygon RPC call failed after retry');
        throw secondError;
      }
    }
  }

  getProvider() {
    return this.provider;
  }
}

export const polygonClient = new PolygonClient();
