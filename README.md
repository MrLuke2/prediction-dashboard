# AgentPredict — Alpha Terminal

> AI-powered prediction market arbitrage terminal with multi-model intelligence, real-time whale tracking, and automated execution across Polymarket and Kalshi.

![Version](https://img.shields.io/badge/version-0.2.0--beta-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-20.x-brightgreen)
![TypeScript](https://img.shields.io/badge/typescript-5.x-blue)
![Build](https://img.shields.io/badge/build-passing-brightgreen)

---

## Overview

AgentPredict is a full-stack prediction market trading terminal that identifies and executes arbitrage opportunities between Polymarket and Kalshi using a Council of AI Agents. The system supports dynamic model selection across **Google Gemini**, **Anthropic Claude**, and **OpenAI GPT** — switchable per session without any code changes.

```
┌─────────────────────────────────────────────────────────┐
│                    ALPHA TERMINAL                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ Fundamen-│  │Sentiment │  │  Risk    │  AI Council  │
│  │  talist  │  │  Reader  │  │ Manager  │              │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘              │
│       └──────────────┴──────────────┘                    │
│                      │                                   │
│              ┌───────▼───────┐                          │
│              │ Alpha Aggre-  │                          │
│              │    gator      │                          │
│              └───────┬───────┘                          │
│                      │                                   │
│         ┌────────────▼────────────┐                     │
│         │   WebSocket Feed        │                     │
│         │  (Real-time to UI)      │                     │
│         └─────────────────────────┘                     │
└─────────────────────────────────────────────────────────┘
```

---

## Features

- **Multi-Model AI Council** — Dynamically route between Gemini 2.5 Flash, Claude Sonnet, and GPT-4o per session
- **Real-Time Arbitrage Detection** — Live spread computation between Polymarket and Kalshi at sub-second latency
- **Whale Radar** — On-chain tracking of high-value wallets on Polygon with AI-powered intent classification
- **Emergency Stop System** — Risk agent triggers automatic position halt with full audit trail
- **BYOK Support** — Bring your own API keys per provider; platform keys used as fallback
- **Paper Trading Mode** — Full simulation without real execution for strategy validation
- **Resizable Dashboard** — Drag-and-drop widget layout with persistent configuration
- **Mobile Responsive** — Full terminal experience on tablet and mobile

---

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.x | UI framework |
| TypeScript | 5.x | Type safety |
| Vite | 6.x | Build tooling |
| Zustand | 4.x | State management |
| Framer Motion | 11.x | Animations |
| @dnd-kit | 6.x | Drag and drop |
| TailwindCSS | 3.x | Styling |
| Zod | 3.x | Runtime validation |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Fastify | 4.x | HTTP server |
| TypeScript | 5.x | Type safety |
| Drizzle ORM | latest | Database ORM |
| PostgreSQL | 16 | Primary database |
| Redis | 7 | Cache + pub/sub |
| BullMQ | 5.x | Job queues |
| ethers.js | 6.x | Polygon RPC |

### AI Providers
| Provider | Models Supported |
|----------|-----------------|
| Google Gemini | gemini-2.5-flash, gemini-2.0-flash, gemini-1.5-pro |
| Anthropic Claude | claude-opus-4-5, claude-sonnet-4-5, claude-haiku-4-5 |
| OpenAI GPT | gpt-4o, gpt-4o-mini, o1-mini |

---

## Project Structure

```
agent-predict-war-room/
├── src/                          # Frontend (React + Vite)
│   ├── components/
│   │   ├── layout/               # Header, MobileNav, DraggableGrid
│   │   ├── ui/                   # GlassPanel, AuthModal, Toast
│   │   └── widgets/              # AlphaGauge, WhaleRadar, LiveFeed...
│   ├── config/                   # AI providers, tutorial steps, constants
│   ├── hooks/                    # useConnectionStatus, useGlobalKeyboard...
│   ├── lib/                      # Utils, formatters, perf monitoring
│   ├── services/
│   │   ├── api/                  # httpClient, authApi
│   │   └── websocket/            # WebSocketClient, protocol, useWebSocket
│   ├── store/                    # Zustand stores (UI, Market, Trade, Notification)
│   └── test/                     # Vitest unit + integration tests
│
├── backend/                      # Backend (Fastify + Node.js)
│   └── src/
│       ├── agents/               # Fundamentalist, Sentiment, Risk agents
│       ├── db/
│       │   └── schema/           # Drizzle ORM table definitions
│       ├── jobs/                 # BullMQ scheduled jobs
│       ├── lib/                  # JWT, Redis, logger, metrics
│       ├── middleware/           # Auth, authorization
│       ├── routes/               # auth, markets, trades, whales, agents
│       ├── services/
│       │   ├── ai/               # Multi-model provider router
│       │   ├── blockchain/       # Polygon whale detector
│       │   ├── execution/        # Arb coordinator, order manager
│       │   └── market/           # Polymarket + Kalshi clients
│       └── ws/                   # WebSocket server + channels
│
├── docker-compose.yml            # Development stack
├── docker-compose.prod.yml       # Production stack
└── .github/workflows/            # CI/CD pipelines
```

---

## Getting Started

### Prerequisites

- Node.js 20.x
- Docker Desktop
- Git

### 1. Clone and Install

```bash
git clone https://github.com/YOUR_USERNAME/alpha-mode-predict.git
cd alpha-mode-predict

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend && npm install && cd ..
```

### 2. Environment Setup

**Frontend** — create `.env.local` in root:
```bash
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001/ws
VITE_USE_REAL_DATA=false
VITE_PAPER_TRADING=true
```

**Backend** — create `.env` in `/backend`:
```bash
PORT=3001
NODE_ENV=development
DATABASE_URL=postgresql://postgres:password@localhost:5432/alpha_predict
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-min-32-char-secret-here
REFRESH_SECRET=another-min-32-char-secret-here
ENCRYPTION_KEY=exactly-32-characters-right-here
DEFAULT_AI_PROVIDER=gemini
DEFAULT_AI_MODEL=gemini-2.5-flash
GEMINI_API_KEY=your-key
ANTHROPIC_API_KEY=your-key
OPENAI_API_KEY=your-key
PAPER_TRADING=true
MAX_POSITION_USD=1000
```

### 3. Start the Stack

```bash
# Start infrastructure (Postgres + Redis)
docker-compose up -d

# Run database migrations
cd backend && npm run db:push && npm run db:seed && cd ..

# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
npm run dev
```

Open `http://localhost:5173`

---

## Environment Variables

### Frontend (VITE_ prefix required)

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:3001` | Backend REST API URL |
| `VITE_WS_URL` | `ws://localhost:3001/ws` | WebSocket server URL |
| `VITE_USE_REAL_DATA` | `false` | `true` connects to live backend |
| `VITE_PAPER_TRADING` | `true` | Disables real trade execution |

### Backend

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `REDIS_URL` | ✅ | Redis connection string |
| `JWT_SECRET` | ✅ | Min 32 chars |
| `ENCRYPTION_KEY` | ✅ | Exactly 32 chars (API key encryption) |
| `GEMINI_API_KEY` | ⬜ | Google Gemini |
| `ANTHROPIC_API_KEY` | ⬜ | Anthropic Claude |
| `OPENAI_API_KEY` | ⬜ | OpenAI GPT |
| `PAPER_TRADING` | ⬜ | Default `true` |

---

## AI Provider System

The platform dynamically routes AI calls based on user selection. Each agent (Fundamentalist, Sentiment, Risk) can be assigned independently.

**Switching providers** — click the provider selector in the Header. The backend receives `SET_AI_PROVIDER` via WebSocket and routes all subsequent agent calls through the selected model.

**BYOK** — Pro and Enterprise users can supply their own API keys per provider via `POST /user/api-keys`. User keys always take priority over platform defaults.

**Cost tracking** — all AI usage is tracked in `ai_usage_metrics` table with per-provider daily limits configurable via `DAILY_COST_LIMIT_USD`.

---

## Available Scripts

### Frontend
```bash
npm run dev          # Start development server
npm run build        # Production build
npm run test         # Run Vitest test suite
npm run test:coverage # Coverage report
```

### Backend
```bash
npm run dev          # Start with hot reload (tsx watch)
npm run build        # Compile TypeScript
npm run db:push      # Push schema to database
npm run db:seed      # Seed with development data
npm run test         # Run test suite
```

### Docker
```bash
docker-compose up -d           # Start dev stack
docker-compose stop            # Stop all containers
docker-compose up -d --build   # Rebuild after changes
docker-compose -f docker-compose.prod.yml up --build  # Production
```

---

## WebSocket Protocol

Connect to `ws://localhost:3001/ws?token=YOUR_JWT`

### Server → Client Events
| Type | Payload | Description |
|------|---------|-------------|
| `MARKET_UPDATE` | `MarketPair` | Live spread update |
| `WHALE_ALERT` | `WhaleMovement` | On-chain whale detected |
| `AGENT_LOG` | `AgentLog` | AI agent activity |
| `ALPHA_UPDATE` | `AlphaMetric` | Aggregated confidence score |
| `TRADE_UPDATE` | `TradeUpdate` | Execution status |
| `EMERGENCY_STOP` | `{ reason, tradesAffected }` | Risk halt triggered |

### Client → Server Events
| Type | Payload | Description |
|------|---------|-------------|
| `SUBSCRIBE_MARKET` | `{ symbol }` | Subscribe to market feed |
| `SET_AI_PROVIDER` | `{ providerId, model }` | Switch AI model |
| `PING` | `{ ts }` | Heartbeat |

---

## API Reference

Full interactive docs available at `http://localhost:3001/docs` (Swagger UI)

### Auth
```
POST /auth/register
POST /auth/login
POST /auth/refresh
POST /auth/logout
GET  /auth/me
PATCH /auth/preferences
```

### Markets
```
GET /markets
GET /markets/:symbol
GET /markets/:symbol/spread
GET /markets/top-arb
```

### Trades
```
POST /trades/arb
GET  /trades
GET  /trades/:id
POST /trades/emergency-stop
```

### Health
```
GET /health
GET /health/deep
```

---

## Database Schema

| Table | Description |
|-------|-------------|
| `users` | Auth + plan + per-provider API keys (encrypted) |
| `market_pairs` | Polymarket/Kalshi market registry |
| `price_snapshots` | Time-series price data (monthly partitioned) |
| `trades` | Full execution history with AI attribution |
| `whale_movements` | On-chain whale activity |
| `agent_logs` | AI agent decision logs (weekly partitioned) |
| `alpha_metrics` | Aggregated confidence scores |
| `emergency_events` | Emergency stop audit trail |
| `ai_usage_metrics` | Per-provider cost and latency tracking |

---

## Branch Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Production-ready code |
| `dev` | Active development |
| `release/v1.0` | Release candidate |

---

## Roadmap

- [ ] Integration prompt — flip `VITE_USE_REAL_DATA=true`
- [ ] Live Polymarket + Kalshi API keys
- [ ] Polygon RPC whale detection live
- [ ] Production deployment (Railway / Fly.io)
- [ ] Prometheus + Grafana dashboard
- [ ] Mobile app (React Native)

---

## Security

- All API keys encrypted at rest (AES-256-GCM)
- JWT + httpOnly refresh cookie rotation
- Rate limiting: 100 req/min unauthenticated, 1000 authenticated
- BYOK keys never logged or exposed in responses
- `PAPER_TRADING=true` by default — real execution requires explicit opt-in

**Found a vulnerability?** Please open a private GitHub issue.

---

## License

MIT © 2026 Luke & Cole LLC / Hodge Luke LLC

---

*Built with the Alpha Mode Predict production roadmap — frontend prompts F1–F9, backend prompts B1–B9.*