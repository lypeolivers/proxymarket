import { Prisma } from '../../../../prisma/generated/prisma/client.js';
import { ApiError } from '../../../common/errors/api-error';
import { TOrderItemInput } from '../../../common/schemas/order.schema';
import { PrismaTransactionalClient } from '../../../infra/database/prisma';

export async function assertOrderGiftLines(
  customerId: number,
  items: TOrderItemInput[],
  orderId: number | null,
  transaction: PrismaTransactionalClient
): Promise<number[]> {
  const giftItems = items.filter((item) => item.customer_gift_id != null);
  if (giftItems.length === 0) return [];

  for (const item of giftItems) {
    if (item.unit_price !== 0) {
      throw ApiError(
        'invalid-gift-line',
        'Linhas de brinde devem ter preço unitário zero.',
        undefined,
        400
      );
    }
  }

  const giftIds = [...new Set(giftItems.map((item) => item.customer_gift_id!))];
  const gifts = await transaction.customerGift.findMany({
    where: {
      id: { in: giftIds },
      customer_id: customerId,
      is_deleted: false,
    },
  });

  if (gifts.length !== giftIds.length) {
    throw ApiError('not-found', 'Brinde não encontrado para este cliente.', undefined, 404);
  }

  for (const giftId of giftIds) {
    const gift = gifts.find((row) => row.id === giftId)!;
    const proposedQty = giftItems
      .filter((item) => item.customer_gift_id === giftId)
      .reduce((sum, item) => sum + item.quantity, 0);

    const usedElsewhereRows = await transaction.$queryRaw<[{ total: bigint | number }]>(
      orderId != null
        ? Prisma.sql`
            SELECT COALESCE(SUM(oi.quantity), 0)::bigint AS total
            FROM order_item oi
            INNER JOIN "order" o ON o.id = oi.order_id
            WHERE oi.customer_gift_id = ${giftId}
              AND oi.is_deleted = false
              AND o.is_deleted = false
              AND o.id <> ${orderId}
          `
        : Prisma.sql`
            SELECT COALESCE(SUM(oi.quantity), 0)::bigint AS total
            FROM order_item oi
            INNER JOIN "order" o ON o.id = oi.order_id
            WHERE oi.customer_gift_id = ${giftId}
              AND oi.is_deleted = false
              AND o.is_deleted = false
          `
    );

    const usedElsewhere = Number(usedElsewhereRows[0]?.total ?? 0);

    if (usedElsewhere + proposedQty > gift.quantity_granted) {
      throw ApiError('insufficient-gift-balance', 'Saldo de brinde insuficiente.', undefined, 400);
    }
  }

  return giftIds;
}
