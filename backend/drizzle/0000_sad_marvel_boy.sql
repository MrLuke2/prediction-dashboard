DO $$ BEGIN
 CREATE TYPE "user_plan" AS ENUM('free', 'pro', 'enterprise');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "trade_side" AS ENUM('buy', 'sell');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "trade_status" AS ENUM('open', 'closed', 'failed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "trade_venue" AS ENUM('polymarket', 'kalshi');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "whale_direction" AS ENUM('in', 'out');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "agent_log_level" AS ENUM('info', 'warn', 'alert');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_login" timestamp with time zone,
	"plan" "user_plan" DEFAULT 'free' NOT NULL,
	"api_key_hash" varchar(255),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "market_pairs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"symbol" varchar(50) NOT NULL,
	"polymarket_slug" varchar(255),
	"kalshi_ticker" varchar(255),
	"category" varchar(100),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "market_pairs_symbol_unique" UNIQUE("symbol")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "price_snapshots" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"market_pair_id" uuid NOT NULL,
	"polymarket_price" numeric(10, 4) NOT NULL,
	"kalshi_price" numeric(10, 4) NOT NULL,
	"spread" numeric(10, 4) NOT NULL,
	"volume_24h" numeric(20, 2) NOT NULL,
	"captured_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "trades" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"market_pair_id" uuid NOT NULL,
	"side" "trade_side" NOT NULL,
	"venue" "trade_venue" NOT NULL,
	"size" numeric(20, 6) NOT NULL,
	"entry_price" numeric(10, 4) NOT NULL,
	"exit_price" numeric(10, 4),
	"pnl" numeric(20, 6),
	"status" "trade_status" DEFAULT 'open' NOT NULL,
	"tx_hash" varchar(255),
	"opened_at" timestamp with time zone DEFAULT now() NOT NULL,
	"closed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "whale_movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wallet_address" varchar(255) NOT NULL,
	"market_pair_id" uuid,
	"amount_usd" numeric(20, 2) NOT NULL,
	"direction" "whale_direction" NOT NULL,
	"venue" varchar(100) NOT NULL,
	"tx_hash" varchar(255) NOT NULL,
	"detected_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "agent_logs" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"agent_name" varchar(100) NOT NULL,
	"level" "agent_log_level" NOT NULL,
	"message" varchar(1024) NOT NULL,
	"metadata" jsonb,
	"market_pair_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "alpha_metrics" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"confidence" numeric(5, 2) NOT NULL,
	"regime" varchar(50) NOT NULL,
	"contributing_agents" jsonb NOT NULL,
	"top_opportunity" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "price_snapshots_market_pair_id_idx" ON "price_snapshots" ("market_pair_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "price_snapshots_captured_at_idx" ON "price_snapshots" ("captured_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "trades_user_id_idx" ON "trades" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "trades_market_pair_id_idx" ON "trades" ("market_pair_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "trades_status_idx" ON "trades" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "trades_opened_at_idx" ON "trades" ("opened_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "whale_movements_market_pair_id_idx" ON "whale_movements" ("market_pair_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "whale_movements_detected_at_idx" ON "whale_movements" ("detected_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agent_logs_market_pair_id_idx" ON "agent_logs" ("market_pair_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agent_logs_created_at_idx" ON "agent_logs" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "alpha_metrics_created_at_idx" ON "alpha_metrics" ("created_at");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "price_snapshots" ADD CONSTRAINT "price_snapshots_market_pair_id_market_pairs_id_fk" FOREIGN KEY ("market_pair_id") REFERENCES "market_pairs"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "trades" ADD CONSTRAINT "trades_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "trades" ADD CONSTRAINT "trades_market_pair_id_market_pairs_id_fk" FOREIGN KEY ("market_pair_id") REFERENCES "market_pairs"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "whale_movements" ADD CONSTRAINT "whale_movements_market_pair_id_market_pairs_id_fk" FOREIGN KEY ("market_pair_id") REFERENCES "market_pairs"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "agent_logs" ADD CONSTRAINT "agent_logs_market_pair_id_market_pairs_id_fk" FOREIGN KEY ("market_pair_id") REFERENCES "market_pairs"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
