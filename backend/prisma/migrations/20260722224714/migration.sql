-- DropForeignKey
ALTER TABLE "order_item" DROP CONSTRAINT "order_item_card_print_model_id_fkey";

-- DropForeignKey
ALTER TABLE "order_item" DROP CONSTRAINT "order_item_production_shipment_id_fkey";

-- AddForeignKey
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_card_print_model_id_fkey" FOREIGN KEY ("card_print_model_id") REFERENCES "card_print_model"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_production_shipment_id_fkey" FOREIGN KEY ("production_shipment_id") REFERENCES "production_shipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
