import { ethers } from 'ethers';
import { config } from '../../config.js';
import { logger } from '../../lib/logger.js';
import axios from 'axios';

export class PolymarketExecutor {
  private wallet: ethers.Wallet | null = null;
  private readonly baseUrl = 'https://clob.polymarket.com';

  constructor() {
    if (config.OPERATOR_PRIVATE_KEY) {
      this.wallet = new ethers.Wallet(config.OPERATOR_PRIVATE_KEY);
    }
  }

  async signOrder(order: any): Promise<string> {
    if (!this.wallet) throw new Error('Operator wallet not configured');
    
    // Poly CLOB EIP-712 Domain and Types (Simplified)
    const domain = {
      name: 'Polymarket CLOB',
      version: '1',
      chainId: 137, // Polygon
      verifyingContract: '0x4bFb41d5B3570DeFd17c2199640522067306282E', // Example CTF
    };

    const types = {
      Order: [
        { name: 'maker', type: 'address' },
        { name: 'taker', type: 'address' },
        { name: 'token', type: 'address' },
        { name: 'amount', type: 'uint256' },
        { name: 'price', type: 'uint256' },
        { name: 'side', type: 'uint8' },
        { name: 'expiration', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
      ],
    };

    return await this.wallet.signTypedData(domain, types, order);
  }

  async submitOrder(params: any): Promise<string> {
    if (config.PAPER_TRADING) {
      logger.info(params, 'PAPER TRADING: Simulating Polymarket order submission');
      return `paper-pm-${Math.random().toString(36).substring(7)}`;
    }

    try {
      const signedOrder = await this.signOrder(params);
      const response = await axios.post(`${this.baseUrl}/orders`, {
        ...params,
        signature: signedOrder
      });
      return response.data.orderId;
    } catch (err: any) {
      logger.error({ err: err.message }, 'Polymarket order submission failed');
      throw err;
    }
  }

  async pollOrderStatus(orderId: string): Promise<'filled' | 'cancelled' | 'expired'> {
    if (config.PAPER_TRADING) return 'filled';

    // In production, poll the CLOB API
    // for now, simulating partial fill then complete fill
    return new Promise((resolve) => {
      setTimeout(() => resolve('filled'), 1000);
    });
  }
}

export const polymarketExecutor = new PolymarketExecutor();
