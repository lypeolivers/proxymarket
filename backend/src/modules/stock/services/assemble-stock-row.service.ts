import { ApiError } from '../../../common/errors/api-error';
import { prisma } from '../../../infra/database/prisma';
import { CardEntity } from '../../card/entities/card.entity';
import { StockRowEntity, type TStockRowEntity } from '../entities/stock-row.entity';
import { computeGraphicNeed, computeStockMetrics } from './stock-metrics';
import { sumDemandByCardIds } from './sum-demand-by-card-ids';
import { sumDemandPendingPrintByCardIds } from './sum-demand-pending-print';

export async function assembleStockRowForCardId(cardId: number): Promise<TStockRowEntity> {
  const card = await prisma.card.findFirst({
    where: { id: cardId, is_deleted: false },
  });

  if (!card) {
    throw ApiError('CARD_NOT_FOUND', 'Carta não encontrada.', undefined, 404);
  }

  const [stockRow, demandOpenMap, demandQuoteMap, demandPendingPrintMap] = await Promise.all([
    prisma.cardStock.findFirst({
      where: { card_id: cardId, is_deleted: false },
    }),
    sumDemandByCardIds([cardId], 'committed'),
    sumDemandByCardIds([cardId], 'quote_only'),
    sumDemandPendingPrintByCardIds([cardId]),
  ]);

  const on_hand = stockRow?.quantity ?? 0;
  const demand_open = demandOpenMap.get(cardId) ?? 0;
  const demand_quote = demandQuoteMap.get(cardId) ?? 0;
  const demand_pending_print = demandPendingPrintMap.get(cardId) ?? 0;
  const metrics = computeStockMetrics({ on_hand, demand_open, demand_quote });
  const need_for_graphic = computeGraphicNeed(on_hand, demand_pending_print);

  return StockRowEntity.parse({
    card: CardEntity.parse(card),
    on_hand,
    demand_open,
    demand_quote,
    demand_pending_print,
    need_for_graphic,
    ...metrics,
  });
}
