-- Data comercial do pedido (backfill a partir da auditoria created_at)

ALTER TABLE "order" ADD COLUMN "order_date" DATE;

UPDATE "order"
SET "order_date" = (created_at AT TIME ZONE 'UTC')::date;

ALTER TABLE "order" ALTER COLUMN "order_date" SET NOT NULL;

CREATE INDEX "order_order_date_idx" ON "order"("order_date");
