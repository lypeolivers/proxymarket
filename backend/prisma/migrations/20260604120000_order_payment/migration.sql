-- CreateTable
CREATE TABLE "order_payment" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "collected_at" DATE NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "order_payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "order_payment_order_id_idx" ON "order_payment"("order_id");

-- CreateIndex
CREATE INDEX "order_payment_collected_at_idx" ON "order_payment"("collected_at");

-- AddForeignKey
ALTER TABLE "order_payment" ADD CONSTRAINT "order_payment_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
