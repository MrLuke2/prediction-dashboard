import { describe, it, expect } from 'vitest';
import { MessageType, isServerMessage, isValidPayload } from '../protocol';

describe('WebSocket Protocol', () => {
  describe('isServerMessage', () => {
    it('should validate correctly', () => {
      expect(isServerMessage({ type: 'MARKET_UPDATE', payload: {}, ts: 123 })).toBe(true);
      expect(isServerMessage(null)).toBe(false);
      expect(isServerMessage({})).toBe(false);
      expect(isServerMessage({ type: 'INVALID', payload: {} })).toBe(false);
    });
  });

  describe('isValidPayload', () => {
    it('should validate MARKET_UPDATE correctly', () => {
      expect(isValidPayload(MessageType.MARKET_UPDATE, { symbol: 'BTC', polymarketPrice: 50000 })).toBe(true);
      expect(isValidPayload(MessageType.MARKET_UPDATE, { symbol: 'BTC' })).toBe(false);
      expect(isValidPayload(MessageType.MARKET_UPDATE, null)).toBe(false);
    });

    it('should validate WHALE_ALERT correctly', () => {
      expect(isValidPayload(MessageType.WHALE_ALERT, { id: '1', symbol: 'BTC' })).toBe(true);
      expect(isValidPayload(MessageType.WHALE_ALERT, { id: '1' })).toBe(false);
    });

    it('should validate PING/PONG correctly', () => {
      expect(isValidPayload(MessageType.PING, { ts: 123 })).toBe(true);
      expect(isValidPayload(MessageType.PONG, { ts: 123 })).toBe(true);
      expect(isValidPayload(MessageType.PING, {})).toBe(false);
    });
  });
});
