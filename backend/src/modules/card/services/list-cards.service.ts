import { Prisma } from '../../../../prisma/generated/prisma/client.js';
import { prisma } from '../../../infra/database/prisma';
import {
  ListCardsResponse,
  TListCardsQuery,
  TListCardsResponse,
} from '../schemas/list-cards.schema';

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

export class ListCardsService {
  async execute(query: TListCardsQuery): Promise<TListCardsResponse> {
    const limit = Math.min(query.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
    const offset = query.offset ?? 0;

    const where: Prisma.CardWhereInput = { is_deleted: false };

    if (query.tcg) {
      where.tcg = query.tcg;
    }

    if (query.q && query.q.trim() !== '') {
      const term = query.q.trim();
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { edition: { contains: term, mode: 'insensitive' } },
      ];
    }

    const sortField =
      query.sort_by && ALLOWED_SORT_FIELDS.has(query.sort_by)
        ? query.sort_by
        : 'created_at';
    const sortDir = query.sort ?? 'desc';

    const [items, total] = await Promise.all([
      prisma.card.findMany({
        where,
        orderBy: { [sortField]: sortDir },
        skip: offset,
        take: limit,
      }),
      prisma.card.count({ where }),
    ]);

    const pages = limit > 0 ? Math.ceil(total / limit) : 0;

    return ListCardsResponse.parse({
      items,
      pagination: { total, pages },
    });
  }
}

export const listCardsService = new ListCardsService();
