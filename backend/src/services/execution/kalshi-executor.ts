import axios from 'axios';
import { config } from '../../config.js';
import { logger } from '../../lib/logger.js';

export class KalshiExecutor {
  private readonly baseUrl = 'https://api.kalshi.com/trade-api/v2';

  async placeOrder(params: any): Promise<string> {
    if (config.PAPER_TRADING) {
      logger.info(params, 'PAPER TRADING: Simulating Kalshi order submission');
      return `paper-ks-${Math.random().toString(36).substring(7)}`;
    }

    try {
      // Kalshi requires specific headers for auth (e.g., API-KEY and dynamic signature)
      // Implementation omitted for brevity but following standard REST
      const response = await axios.post(`${this.baseUrl}/orders`, params, {
        headers: {
          'X-Kalshi-API-KEY': config.KALSHI_API_KEY
        }
      });
      return response.data.order_id;
    } catch (err: any) {
      logger.error({ err: err.message }, 'Kalshi order submission failed');
      throw err;
    }
  }

  async getOrderStatus(orderId: string): Promise<string> {
    if (config.PAPER_TRADING) return 'filled';
    
    try {
       const response = await axios.get(`${this.baseUrl}/orders/${orderId}`, {
         headers: { 'X-Kalshi-API-KEY': config.KALSHI_API_KEY }
       });
       return this.mapKalshiStatus(response.data.status);
    } catch (err) {
       return 'failed';
    }
  }

  private mapKalshiStatus(status: string): string {
    const map: Record<string, string> = {
      'resting': 'submitted',
      'executed': 'filled',
      'canceled': 'cancelled',
      'pending': 'pending'
    };
    return map[status] || 'failed';
  }
}

export const kalshiExecutor = new KalshiExecutor();
