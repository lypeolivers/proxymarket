-- Align PostgreSQL with migration 20260516120000_order_pipeline_status (line 24: DROP DEFAULT).
-- Prisma reports drift if DB still has DEFAULT 'quote' while replaying migrations yields no default.
-- Safe: does not delete rows; only removes column default (Prisma @default(quote) still applies on create).
ALTER TABLE "order" ALTER COLUMN "order_status" DROP DEFAULT;
