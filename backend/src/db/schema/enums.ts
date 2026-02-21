import { pgEnum } from 'drizzle-orm/pg-core';

export const userPlanEnum = pgEnum('user_plan', ['free', 'pro', 'enterprise']);

export const aiProviderEnum = pgEnum('ai_provider', ['anthropic', 'openai', 'gemini', 'system']);

export const tradeSideEnum = pgEnum('trade_side', ['buy', 'sell']);
export const tradeVenueEnum = pgEnum('trade_venue', ['polymarket', 'kalshi']);
export const tradeStatusEnum = pgEnum('trade_status', ['pending', 'open', 'closed', 'failed', 'emergency_closed']);

export const agentLogLevelEnum = pgEnum('agent_log_level', ['info', 'warn', 'alert']);

export const whaleDirectionEnum = pgEnum('whale_direction', ['in', 'out']);

export const alphaRegimeEnum = pgEnum('alpha_regime', ['low', 'medium', 'high', 'critical']);

export const orderStatusEnum = pgEnum('order_status', ['pending', 'submitted', 'filled', 'partially_filled', 'cancelled', 'failed']);
