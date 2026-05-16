-- CreateEnum
CREATE TYPE "OrderPipelineStatus" AS ENUM (
  'quote',
  'partial_payment',
  'paid',
  'awaiting_payment',
  'ready_for_delivery',
  'delivered'
);

-- AlterTable
ALTER TABLE "order" ADD COLUMN "order_status" "OrderPipelineStatus" NOT NULL DEFAULT 'quote';

-- Data migration: old payment + fulfillment -> single pipeline status
UPDATE "order" SET "order_status" = CASE
  WHEN "payment_status" = 'unpaid' THEN 'quote'::"OrderPipelineStatus"
  WHEN "payment_status" = 'partial' THEN 'partial_payment'::"OrderPipelineStatus"
  WHEN "fulfillment_status" = 'delivered' THEN 'delivered'::"OrderPipelineStatus"
  WHEN "payment_status" = 'paid' AND "fulfillment_status" = 'in_shipping' THEN 'ready_for_delivery'::"OrderPipelineStatus"
  WHEN "payment_status" = 'paid' THEN 'paid'::"OrderPipelineStatus"
  ELSE 'paid'::"OrderPipelineStatus"
END;

ALTER TABLE "order" ALTER COLUMN "order_status" DROP DEFAULT;

DROP INDEX IF EXISTS "order_payment_status_idx";

DROP INDEX IF EXISTS "order_fulfillment_status_idx";

ALTER TABLE "order" DROP COLUMN "payment_status";

ALTER TABLE "order" DROP COLUMN "fulfillment_status";

CREATE INDEX "order_order_status_idx" ON "order"("order_status");

DROP TYPE "OrderPaymentStatus";

DROP TYPE "OrderFulfillmentStatus";
