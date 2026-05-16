-- CreateEnum
CREATE TYPE "Tcg" AS ENUM ('one_piece', 'magic', 'pokemon');

-- CreateEnum
CREATE TYPE "CardColor" AS ENUM ('blue', 'yellow', 'green', 'black', 'red', 'purple');

-- CreateEnum
CREATE TYPE "CardType" AS ENUM ('leader', 'don', 'token', 'commander', 'pokemon', 'supporter', 'item', 'stadium', 'tool');

-- CreateTable
CREATE TABLE "card" (
    "id" SERIAL NOT NULL,
    "tcg" "Tcg" NOT NULL,
    "card_type" "CardType" NOT NULL,
    "name" TEXT,
    "edition" TEXT,
    "colors" "CardColor"[],
    "status" "Status" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "card_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "card_id_idx" ON "card"("id");

-- CreateIndex
CREATE INDEX "card_tcg_idx" ON "card"("tcg");
