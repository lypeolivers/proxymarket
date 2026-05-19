import type { PrismaTransactionalClient } from '../../../infra/database/prisma';

/**
 * Ao marcar pedido como entregue: reduz saldo físico por carta (agregado por linha).
 * `nova_quantidade = max(0, atual - qtd)` por carta.
 */
export async function applyStockDecrementForDeliveredOrder(
  transaction: PrismaTransactionalClient,
  orderId: number
): Promise<void> {
  const items = await transaction.orderItem.findMany({
    where: { order_id: orderId, is_deleted: false },
    select: { card_id: true, quantity: true },
  });

  const byCard = new Map<number, number>();
  for (const item of items) {
    byCard.set(item.card_id, (byCard.get(item.card_id) ?? 0) + item.quantity);
  }

  for (const [cardId, qty] of byCard) {
    const row = await transaction.cardStock.findFirst({
      where: { card_id: cardId, is_deleted: false },
    });
    const current = row?.quantity ?? 0;
    const next = Math.max(0, current - qty);

    await transaction.cardStock.upsert({
      where: { card_id: cardId },
      create: {
        card_id: cardId,
        quantity: next,
      },
      update: {
        quantity: next,
        is_deleted: false,
      },
    });
  }
}
