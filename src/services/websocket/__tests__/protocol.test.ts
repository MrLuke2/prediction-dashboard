import { describe, it, expect } from 'vitest';
import { createMessage, Schemas } from '../protocol';

describe('WebSocket Protocol', () => {
  describe('createMessage', () => {
    it('should create a valid message with timestamp', () => {
      const payload = { foo: 'bar' };
      const msg = createMessage('MARKET_UPDATE', payload);
      
      expect(msg.type).toBe('MARKET_UPDATE');
      expect(msg.payload).toEqual(payload);
      expect(typeof msg.ts).toBe('number');
      expect(msg.ts).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('Schemas', () => {
    it('WSMessage schema should validate correctly', () => {
      expect(Schemas.WSMessage({ type: 'PING', payload: {}, ts: 123 })).toBe(true);
      expect(Schemas.WSMessage(null)).toBe(null);
      expect(Schemas.WSMessage({})).toBe(false);
      expect(Schemas.WSMessage({ type: 123, payload: {}, ts: '123' })).toBe(false);
    });

    it('type guards should return true for correct types', () => {
      const msg = (type: any) => ({ type, payload: {}, ts: Date.now() });
      
      expect(Schemas.isMarketUpdate(msg('MARKET_UPDATE'))).toBe(true);
      expect(Schemas.isWhaleAlert(msg('WHALE_ALERT'))).toBe(true);
      expect(Schemas.isAgentLog(msg('AGENT_LOG'))).toBe(true);
      expect(Schemas.isAlphaUpdate(msg('ALPHA_UPDATE'))).toBe(true);
      expect(Schemas.isTradeUpdate(msg('TRADE_UPDATE'))).toBe(true);
      expect(Schemas.isPong(msg('PONG'))).toBe(true);
      expect(Schemas.isError(msg('ERROR'))).toBe(true);
      
      expect(Schemas.isMarketUpdate(msg('PING'))).toBe(false);
    });
  });
});
