-- CreateTable
CREATE TABLE "card_stock" (
    "id" SERIAL NOT NULL,
    "card_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "card_stock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "card_stock_card_id_key" ON "card_stock"("card_id");

-- CreateIndex
CREATE INDEX "card_stock_card_id_idx" ON "card_stock"("card_id");

-- AddForeignKey
ALTER TABLE "card_stock" ADD CONSTRAINT "card_stock_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "card"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
