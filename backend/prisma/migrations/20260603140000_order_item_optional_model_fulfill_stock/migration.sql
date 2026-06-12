-- AlterTable: modelo de impressão opcional + flag atender do estoque
ALTER TABLE "order_item" ADD COLUMN "fulfill_from_stock" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "order_item" ALTER COLUMN "card_print_model_id" DROP NOT NULL;

ALTER TABLE "order_item" DROP CONSTRAINT IF EXISTS "order_item_card_print_model_id_fkey";

ALTER TABLE "order_item" ADD CONSTRAINT "order_item_card_print_model_id_fkey"
  FOREIGN KEY ("card_print_model_id") REFERENCES "card_print_model"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
