export const KNOWN_WHALES: Record<string, string> = {
  '0x0000000000000000000000000000000000000000': 'Null Address',
  '0x71C7656EC7ab88b098defB751B7401B5f6d8976F': 'Smart Money Alpha',
};

// Add placeholders safely
for (let i = 0; i < 48; i++) {
  const addr = `0x${(i + 10).toString(16).padStart(40, '0')}`;
  KNOWN_WHALES[addr] = `Smart Money #${i + 2}`;
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
}

export const knownWhalesService = new KnownWhalesService();
