-- CreateEnum
CREATE TYPE "ProductionShipmentStatus" AS ENUM (
  'awaiting_print',
  'printing',
  'printed'
);

-- CreateTable
CREATE TABLE "production_shipment" (
    "id" SERIAL NOT NULL,
    "display_number" INTEGER NOT NULL,
    "status" "ProductionShipmentStatus" NOT NULL DEFAULT 'awaiting_print',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "production_shipment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "production_shipment_display_number_key" ON "production_shipment"("display_number");

-- CreateIndex
CREATE INDEX "production_shipment_status_idx" ON "production_shipment"("status");

-- CreateTable
CREATE TABLE "card_print_model" (
    "id" SERIAL NOT NULL,
    "card_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "card_print_model_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "card_print_model_card_id_idx" ON "card_print_model"("card_id");

-- AddForeignKey
ALTER TABLE "card_print_model" ADD CONSTRAINT "card_print_model_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "card"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "order_item" ADD COLUMN "card_print_model_id" INTEGER,
ADD COLUMN "production_shipment_id" INTEGER;

-- Backfill: primeira remessa (#1) em aguardando impressão
INSERT INTO "production_shipment" ("display_number", "status", "is_deleted")
VALUES (1, 'awaiting_print', false);

-- Backfill: modelo Legado por carta referenciada em itens de pedido
INSERT INTO "card_print_model" ("card_id", "name", "file_name", "is_deleted")
SELECT DISTINCT oi."card_id", 'Legado', 'legado', false
FROM "order_item" oi
INNER JOIN "card" cd ON cd.id = oi."card_id" AND cd.is_deleted = false;

-- Backfill: FKs nos itens existentes
UPDATE "order_item" oi
SET "card_print_model_id" = cpm."id"
FROM "card_print_model" cpm
WHERE cpm."card_id" = oi."card_id"
  AND cpm."name" = 'Legado'
  AND cpm."is_deleted" = false;

UPDATE "order_item"
SET "production_shipment_id" = (
  SELECT ps."id" FROM "production_shipment" ps WHERE ps."display_number" = 1 LIMIT 1
);

-- AlterTable
ALTER TABLE "order_item" ALTER COLUMN "card_print_model_id" SET NOT NULL;
ALTER TABLE "order_item" ALTER COLUMN "production_shipment_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_card_print_model_id_fkey" FOREIGN KEY ("card_print_model_id") REFERENCES "card_print_model"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_production_shipment_id_fkey" FOREIGN KEY ("production_shipment_id") REFERENCES "production_shipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "order_item_card_print_model_id_idx" ON "order_item"("card_print_model_id");

-- CreateIndex
CREATE INDEX "order_item_production_shipment_id_idx" ON "order_item"("production_shipment_id");
