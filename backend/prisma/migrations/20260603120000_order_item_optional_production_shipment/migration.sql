-- OrderItem: remessa de produção opcional até envio manual do pedido
ALTER TABLE "order_item" ALTER COLUMN "production_shipment_id" DROP NOT NULL;
