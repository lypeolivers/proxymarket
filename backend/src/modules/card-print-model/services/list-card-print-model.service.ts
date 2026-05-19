import { Prisma } from '../../../../prisma/generated/prisma/client.js';
import { prisma } from '../../../infra/database/prisma';
import {
  ListCardPrintModelResponse,
  type TListCardPrintModelQuery,
  type TListCardPrintModelResponse,
} from '../schemas/list-card-print-model.schema';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 500;

const ALLOWED_SORT_FIELDS = new Set<string>([
  'id',
  'card_id',
  'name',
  'file_name',
  'created_at',
  'updated_at',
]);

const cardSelect = {
  id: true,
  tcg: true,
  card_type: true,
  name: true,
  edition: true,
} satisfies Prisma.CardSelect;

export class ListCardPrintModelService {
  async execute(query: TListCardPrintModelQuery): Promise<TListCardPrintModelResponse> {
    const limit = Math.min(query.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
    const offset = query.offset ?? 0;

    const where: Prisma.CardPrintModelWhereInput = { is_deleted: false };

    if (query.card_id) {
      where.card_id = query.card_id;
    }

    if (query.tcg) {
      where.card = {
        is_deleted: false,
        tcg: query.tcg,
      };
    }

    if (query.q && query.q.trim() !== '') {
      const term = query.q.trim();
      const qClause: Prisma.CardPrintModelWhereInput = {
        OR: [
          { name: { contains: term, mode: 'insensitive' } },
          { file_name: { contains: term, mode: 'insensitive' } },
          {
            card: {
              is_deleted: false,
              name: { contains: term, mode: 'insensitive' },
            },
          },
        ],
      };

      const existingAnd = where.AND;
      where.AND = [
        ...(Array.isArray(existingAnd) ? existingAnd : existingAnd != null ? [existingAnd] : []),
        qClause,
      ];
    }

    const sortField =
      query.sort_by && ALLOWED_SORT_FIELDS.has(query.sort_by) ? query.sort_by : 'created_at';
    const sortDir = query.sort ?? 'desc';

    const [rows, total] = await Promise.all([
      prisma.cardPrintModel.findMany({
        where,
        include: { card: { select: cardSelect } },
        orderBy: { [sortField]: sortDir },
        skip: offset,
        take: limit,
      }),
      prisma.cardPrintModel.count({ where }),
    ]);

    const pages = limit > 0 ? Math.ceil(total / limit) : 0;

    const items = rows.map((row) => ({
      id: row.id,
      card_id: row.card_id,
      name: row.name,
      file_name: row.file_name,
      created_at: row.created_at,
      updated_at: row.updated_at,
      card: row.card,
    }));

    return ListCardPrintModelResponse.parse({
      items,
      pagination: { total, pages },
    });
  }
}

export const listCardPrintModelService = new ListCardPrintModelService();
