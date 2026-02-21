export const KNOWN_WHALES: Record<string, string> = {
  '0x71C7656EC7ab88b098defB751B7401B5f6d8976F': 'Smart Money Alpha',
  '0x4e60f0CC5D29881E94293f0b2401f11AFEB795F7': 'Market Maker Prime',
  '0xDB33023B06aB4C83D4F59A3D8197771746761A41': 'Institutional Flow 1',
  '0x3E525E7182243dF39cAd19D987a03001C8f8863A': 'High Conviction Bull',
};

// Fill up to 50 known addresses for demo purposes
const demoAddresses = [
  '0x1234567890123456789012345678901234567890',
  '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'
];

for (let i = 0; i < 50 - Object.keys(KNOWN_WHALES).length; i++) {
  const addr = `0x${(i + 100).toString(16).padStart(40, '0')}`;
  if (!KNOWN_WHALES[addr]) {
    KNOWN_WHALES[addr] = `Smart Money #${i + 5}`;
  }
}

export class KnownWhalesService {
  private whales: Map<string, string>;

  constructor() {
    this.whales = new Map(
      Object.entries(KNOWN_WHALES).map(([addr, label]) => [addr.toLowerCase(), label])
    );
  }

  isKnownWhale(address: string): boolean {
    if (!address) return false;
    return this.whales.has(address.toLowerCase());
  }

  getWhaleLabel(address: string): string | null {
    if (!address) return null;
    return this.whales.get(address.toLowerCase()) || null;
  }

  getAllWhales() {
    return Array.from(this.whales.entries());
  }
}

export const knownWhalesService = new KnownWhalesService();
