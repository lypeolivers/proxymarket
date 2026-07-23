-- CreateTable
CREATE TABLE "customer_gift" (
    "id" SERIAL NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "quantity_granted" INTEGER NOT NULL,
    "quantity_used" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "customer_gift_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "order_item" ADD COLUMN "customer_gift_id" INTEGER;

-- CreateIndex
CREATE INDEX "customer_gift_customer_id_idx" ON "customer_gift"("customer_id");

-- CreateIndex
CREATE INDEX "order_item_customer_gift_id_idx" ON "order_item"("customer_gift_id");

-- AddForeignKey
ALTER TABLE "customer_gift" ADD CONSTRAINT "customer_gift_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_customer_gift_id_fkey" FOREIGN KEY ("customer_gift_id") REFERENCES "customer_gift"("id") ON DELETE SET NULL ON UPDATE CASCADE;
