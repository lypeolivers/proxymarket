import { Prisma } from '../../../../prisma/generated/prisma/client.js';
import { prisma } from '../../../infra/database/prisma';
import {
  ListCustomersResponse,
  TListCustomersQuery,
  TListCustomersResponse,
} from '../schemas/list-customers.schema';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 500;

const ALLOWED_SORT_FIELDS = new Set<string>([
  'id',
  'name',
  'email',
  'phone',
  'city',
  'state',
  'created_at',
  'updated_at',
]);

export class ListCustomersService {
  async execute(query: TListCustomersQuery): Promise<TListCustomersResponse> {
    const limit = Math.min(query.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
    const offset = query.offset ?? 0;

    const where: Prisma.CustomerWhereInput = { is_deleted: false };

    if (query.q && query.q.trim() !== '') {
      const term = query.q.trim();
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
        { phone: { contains: term, mode: 'insensitive' } },
        { city: { contains: term, mode: 'insensitive' } },
        { state: { contains: term, mode: 'insensitive' } },
      ];
    }

    const sortField =
      query.sort_by && ALLOWED_SORT_FIELDS.has(query.sort_by) ? query.sort_by : 'created_at';
    const sortDir = query.sort ?? 'desc';

    const [items, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy: { [sortField]: sortDir },
        skip: offset,
        take: limit,
      }),
      prisma.customer.count({ where }),
    ]);

    const pages = limit > 0 ? Math.ceil(total / limit) : 0;

    return ListCustomersResponse.parse({
      items,
      pagination: { total, pages },
    });
  }
}

export const listCustomersService = new ListCustomersService();
