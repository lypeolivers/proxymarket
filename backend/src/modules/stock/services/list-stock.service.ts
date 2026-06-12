import { Prisma } from '../../../../prisma/generated/prisma/client.js';
import { prisma } from '../../../infra/database/prisma';
import { CardEntity } from '../../card/entities/card.entity';
import { StockRowEntity, type TStockRowEntity } from '../entities/stock-row.entity';
import {
  ListStockResponse,
  type TListStockQuery,
  type TListStockResponse,
} from '../schemas/list-stock.schema';
import { computeStockMetrics, computeGraphicNeed } from './stock-metrics';
import { sumDemandByCardIds } from './sum-demand-by-card-ids';
import { sumDemandPendingPrintByCardIds } from './sum-demand-pending-print';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 500;

const ALLOWED_SORT_FIELDS = new Set<string>([
  'id',
  'tcg',
  'card_type',
  'name',
  'edition',
  'status',
  'created_at',
  'updated_at',
]);

export class ListStockService {
  async execute(query: TListStockQuery): Promise<TListStockResponse> {
    const limit = Math.min(query.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
    const offset = query.offset ?? 0;

    const where: Prisma.CardWhereInput = { is_deleted: false };

    if (query.tcg) {
      where.tcg = query.tcg;
    }

    if (query.in_stock_only) {
      where.stock = {
        is: {
          is_deleted: false,
          quantity: { gt: 0 },
        },
      };
    }

    if (query.q && query.q.trim() !== '') {
      const term = query.q.trim();
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { edition: { contains: term, mode: 'insensitive' } },
      ];
    }

    const sortField =
      query.sort_by && ALLOWED_SORT_FIELDS.has(query.sort_by) ? query.sort_by : 'created_at';
    const sortDir = query.sort ?? 'desc';

    const [cards, total] = await Promise.all([
      prisma.card.findMany({
        where,
        orderBy: { [sortField]: sortDir },
        skip: offset,
        take: limit,
      }),
      prisma.card.count({ where }),
    ]);

    const ids = cards.map((c) => c.id);

    const [stockRows, demandOpenMap, demandQuoteMap, demandPendingPrintMap] = await Promise.all([
      prisma.cardStock.findMany({
        where: { card_id: { in: ids }, is_deleted: false },
      }),
      sumDemandByCardIds(ids, 'committed'),
      sumDemandByCardIds(ids, 'quote_only'),
      sumDemandPendingPrintByCardIds(ids),
    ]);

    const stockQtyMap = new Map(stockRows.map((s) => [s.card_id, s.quantity]));

    const items: TStockRowEntity[] = cards.map((card) => {
      const on_hand = stockQtyMap.get(card.id) ?? 0;
      const demand_open = demandOpenMap.get(card.id) ?? 0;
      const demand_quote = demandQuoteMap.get(card.id) ?? 0;
      const demand_pending_print = demandPendingPrintMap.get(card.id) ?? 0;
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
    });

    const pages = limit > 0 ? Math.ceil(total / limit) : 0;

    return ListStockResponse.parse({
      items,
      pagination: { total, pages },
    });
  }
}

export const listStockService = new ListStockService();
