import { prisma } from '../../../infra/database/prisma';

/** Arte ainda não enviada ou concluída na gráfica (fora de impressão/impresso). */
const ART_EXCLUDED_FROM_GRAPHIC_DEMAND: Array<'printing' | 'printed'> = ['printing', 'printed'];

/**
 * Demanda por carta: pedidos comprometidos (exceto orçamento e entregue),
 * somando apenas linhas cuja arte ainda não está em impressão nem impressa.
 */
export async function sumDemandPendingPrintByCardIds(
  cardIds: number[]
): Promise<Map<number, number>> {
  if (cardIds.length === 0) {
    return new Map();
  }

  const rows = await prisma.orderItem.groupBy({
    by: ['card_id'],
    where: {
      is_deleted: false,
      card_id: { in: cardIds },
      art_status: { notIn: ART_EXCLUDED_FROM_GRAPHIC_DEMAND },
      order: {
        is_deleted: false,
        order_status: { notIn: ['quote', 'delivered'] },
      },
    },
    _sum: { quantity: true },
  });

  const map = new Map<number, number>();
  for (const row of rows) {
    map.set(row.card_id, row._sum?.quantity ?? 0);
  }
  return map;
}

/**
 * Demanda global por carta (mesmo filtro), para resumo da gráfica sem paginar cartas.
 */
export async function sumDemandPendingPrintGlobal(): Promise<Map<number, number>> {
  const rows = await prisma.orderItem.groupBy({
    by: ['card_id'],
    where: {
      is_deleted: false,
      art_status: { notIn: ART_EXCLUDED_FROM_GRAPHIC_DEMAND },
      order: {
        is_deleted: false,
        order_status: { notIn: ['quote', 'delivered'] },
      },
    },
    _sum: { quantity: true },
  });

  const map = new Map<number, number>();
  for (const row of rows) {
    map.set(row.card_id, row._sum?.quantity ?? 0);
  }
  return map;
}
