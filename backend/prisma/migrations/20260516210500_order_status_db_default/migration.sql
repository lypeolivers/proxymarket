-- Restore DB column default to match `schema.prisma` `order_status @default(quote)`.
-- The pipeline migration temporarily dropped the default while remapping legacy columns; Prisma Client still expects a DB default for creates/omitted fields.
ALTER TABLE "order" ALTER COLUMN "order_status" SET DEFAULT 'quote'::"OrderPipelineStatus";
