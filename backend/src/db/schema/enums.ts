import { pgEnum } from 'drizzle-orm/pg-core';

export const userPlanEnum = pgEnum('user_plan', ['free', 'pro', 'enterprise']);

export const tradeSideEnum = pgEnum('trade_side', ['buy', 'sell']);
export const tradeVenueEnum = pgEnum('trade_venue', ['polymarket', 'kalshi']);
export const tradeStatusEnum = pgEnum('trade_status', ['open', 'closed', 'failed']);

export const orderStatusEnum = pgEnum('order_status', ['pending', 'submitted', 'filled', 'cancelled', 'failed', 'expired']);

export const agentLogLevelEnum = pgEnum('agent_log_level', ['info', 'warn', 'alert']);
