import { Prisma } from '../../../../prisma/generated/prisma/client.js';
import { PrismaTransactionalClient } from '../../../infra/database/prisma';

export async function reconcileCustomerGiftUsage(
  giftIds: number[],
  transaction: PrismaTransactionalClient
): Promise<void> {
  const uniqueIds = [...new Set(giftIds.filter((id) => id > 0))];
  if (uniqueIds.length === 0) return;

  for (const giftId of uniqueIds) {
    const rows = await transaction.$queryRaw<[{ total: bigint | number }]>(Prisma.sql`
      SELECT COALESCE(SUM(oi.quantity), 0)::bigint AS total
      FROM order_item oi
      INNER JOIN "order" o ON o.id = oi.order_id
      WHERE oi.customer_gift_id = ${giftId}
        AND oi.is_deleted = false
        AND o.is_deleted = false
    `);

    const quantityUsed = Number(rows[0]?.total ?? 0);

    await transaction.customerGift.update({
      where: { id: giftId },
      data: { quantity_used: quantityUsed },
    });
  }
}

export function sumGiftUnitsRemaining(
  gifts: Array<{ quantity_granted: number; quantity_used: number }>
): number {
  return gifts.reduce(
    (sum, gift) => sum + Math.max(0, gift.quantity_granted - gift.quantity_used),
    0
  );
}
