import type { Prisma } from '../../../../prisma/generated/prisma/client.js';
import { prisma } from '../../../infra/database/prisma';

export type DemandAggregationKind = 'committed' | 'quote_only';

/**
 * Demanda comprometida: todos os pedidos exceto orçamento (`quote`) e entregue (`delivered`).
 * Demanda em orçamento: apenas pedidos em `quote` (referência / previsão).
 */
export async function sumDemandByCardIds(
  cardIds: number[],
  kind: DemandAggregationKind
): Promise<Map<number, number>> {
  if (cardIds.length === 0) {
    return new Map();
  }

  const orderWhere: Prisma.OrderWhereInput =
    kind === 'quote_only'
      ? { is_deleted: false, order_status: 'quote' }
      : {
          is_deleted: false,
          order_status: { notIn: ['quote', 'delivered'] },
        };

  const rows = await prisma.orderItem.groupBy({
    by: ['card_id'],
    where: {
      is_deleted: false,
      card_id: { in: cardIds },
      order: orderWhere,
    },
    _sum: { quantity: true },
  });

  const map = new Map<number, number>();
  for (const row of rows) {
    map.set(row.card_id, row._sum.quantity ?? 0);
  }
  return map;
}
