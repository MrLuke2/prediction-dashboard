# Deep Dive: Crypto & Prediction Market Integration Learnings

This document summarizes the findings from researching the official documentation for Polymarket, Kalshi, and Gemini, with a focus on authentication and order execution.

## 1. Polymarket (Polygon/Matic Chain)

**Documentation**: [https://docs.polymarket.com/](https://docs.polymarket.com/)

### Authentication & Order Signing

- **Hybrid Model**: Polymarket uses a two-layer authentication system.
  - **L1 (Wallet)**: Used for _on-chain_ actions and _signing orders_. Orders must be signed using EIP-712 standard.
  - **L2 (API Key)**: Used for high-frequency _read_ access (e.g., fetching open orders, balances) and managing orders (cancelling). API Keys are derived from the L1 wallet signature.
- **Requirement for us**: Our `PolymarketExecutor` correctly implements `wallet.signTypedData` (EIP-712). This is critical because every order payload must be cryptographically signed by the `OPERATOR_PRIVATE_KEY` before submission to the CLOB (Central Limit Order Book).

### Execution Flow

1.  **Construct Order**: Define `token_id` (Outcome Token), `price`, `side` (BUY/SELL), and `size`.
2.  **Sign Order**: Use EIP-712 to sign the structured data.
3.  **Submit to CLOB**: POST the signed payload to `https://clob.polymarket.com/order`.
4.  **Allowances**: The wallet must have `setApprovalForAll` (or specific allowance) for the `CTF Exchange` contract to spend USDC/Collateral. **Deployment Note**: We must ensure the operator wallet has approved the exchange contract before attempting the first trade.

## 2. Kalshi (CFTC Regulated)

**Documentation**: [https://docs.kalshi.com/](https://docs.kalshi.com/)

### Authentication (RSA Signing)

- **Mechanism**: Kalshi uses RSA key-pair authentication for trading endpoints.
- **Headers Required**:
  - `KALSHI-ACCESS-KEY`: The Key ID (public identifier).
  - `KALSHI-ACCESS-TIMESTAMP`: Current timestamp (ms).
  - `KALSHI-ACCESS-SIGNATURE`: A base64-encoded signature of `timestamp + method + path` signed with the **Private Key**.
- **Gap Identified**: Our current `verify-keys.ts` script uses a simpler `X-Kalshi-API-KEY` header, which works for some public market data endpoints but **will fail for order placement**.
- **Action Item**: We must update `KalshiExecutor` to implement the full RSA request signing flow for `POST /portfolio/orders`.

### Execution Flow

1.  **Market Structure**: Markets have `ticker` symbols (e.g., `KXFEDDEC24`).
2.  **Order Placement**: `POST /portfolio/orders`. Requires `ticker`, `action` (buy/sell), `count` (contracts), and `side` (yes/no).
3.  **Settlement**: Contracts settle to $1.00 or $0.00.

## 3. Gemini (AI Model)

**Documentation**: [https://ai.google.dev/gemini-api/docs](https://ai.google.dev/gemini-api/docs)

### Integration Status

- **Type**: Generative AI API (used for our Agents).
- **Authentication**: Simple API Key (via `x-goog-api-key` header or Google AI SDK).
- **Status**: Correctly implemented in `AiService`.
- **Note**: Rate limits (RPM) are the main constraint. Our `AgentOrchestrator` intervals (30s) are well within the Free Tier limits (15 RPM), but we should monitor for `429` errors if we add more agents.

## Summary of Next Steps

1.  **Polymarket**: Verify USDC approvals on the operator wallet.
2.  **Kalshi**: Upgrade the `KalshiExecutor` to use RSA Request Signing instead of simple API keys.
3.  **Gemini**: No changes needed; current implementation is robust.
