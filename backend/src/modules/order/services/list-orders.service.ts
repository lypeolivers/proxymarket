import { Prisma } from '../../../../prisma/generated/prisma/client.js';
import {
  countLinesWithoutPrintModel,
  countMissingPrintModelItems,
  countPendingProductionItems,
} from '../../../common/schemas/order.schema';
import { prisma } from '../../../infra/database/prisma';
import {
  ListOrdersResponse,
  TListOrdersQuery,
  TListOrdersResponse,
} from '../schemas/list-orders.schema';
import { computePaymentSummary } from './order-payment-helpers';
import { computeLineTotal, computeOrderTotal, toUnitPrice } from './order-helpers';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

const ALLOWED_SORT_FIELDS = new Set<string>([
  'id',
  'customer_id',
  'order_status',
  'order_date',
  'created_at',
  'updated_at',
  'item_count',
  'total_amount',
]);

const orderInclude = {
  customer: { select: { name: true, state: true } },
  items: {
    where: { is_deleted: false },
    orderBy: { id: 'asc' as const },
    select: {
      id: true,
      card_id: true,
      card_print_model_id: true,
      fulfill_from_stock: true,
      quantity: true,
      unit_price: true,
      art_status: true,
      production_shipment_id: true,
      card: {
        select: {
          id: true,
          tcg: true,
          card_type: true,
          name: true,
          edition: true,
          colors: true,
        },
      },
      card_print_model: {
        select: {
          id: true,
          name: true,
          file_name: true,
        },
      },
    },
  },
} satisfies Prisma.OrderInclude;

function listWhereClause(query: TListOrdersQuery): Prisma.OrderWhereInput {
  const where: Prisma.OrderWhereInput = { is_deleted: false };

  if (query.order_status) {
    where.order_status = query.order_status;
  }

  if (query.customer_id) {
    where.customer_id = query.customer_id;
  }

  if (query.customer_state) {
    where.customer = {
      is_deleted: false,
      state: query.customer_state,
    };
  }

  if (query.q && query.q.trim() !== '') {
    const term = query.q.trim();
    where.OR = [
      {
        customer: {
          is_deleted: false,
          name: { contains: term, mode: 'insensitive' },
        },
      },
      {
        items: {
          some: {
            is_deleted: false,
            card: {
              is_deleted: false,
              OR: [
                { name: { contains: term, mode: 'insensitive' } },
                { edition: { contains: term, mode: 'insensitive' } },
              ],
            },
          },
        },
      },
    ];
  }

  return where;
}

/** WHERE em SQL bruto alinhado a `listWhereClause` (para ORDER BY em agregados). */
function listWhereSql(query: TListOrdersQuery): { join: Prisma.Sql; whereAnd: Prisma.Sql } {
  const parts: Prisma.Sql[] = [Prisma.sql`o.is_deleted = false`];

  if (query.order_status) {
    parts.push(Prisma.sql`o.order_status = ${query.order_status}`);
  }

  if (query.customer_id) {
    parts.push(Prisma.sql`o.customer_id = ${query.customer_id}`);
  }

  if (query.customer_state) {
    parts.push(Prisma.sql`c.state = ${query.customer_state}`);
  }

  const needsCustomerJoin = Boolean(query.customer_state) || Boolean(query.q?.trim());

  if (query.q && query.q.trim() !== '') {
    const term = `%${query.q.trim()}%`;
    parts.push(
      Prisma.sql`(c.name ILIKE ${term} OR EXISTS (
        SELECT 1 FROM order_item oi
        INNER JOIN card cd ON cd.id = oi.card_id AND cd.is_deleted = false
        WHERE oi.order_id = o.id AND oi.is_deleted = false
          AND (cd.name ILIKE ${term} OR cd.edition ILIKE ${term})
      ))`
    );
    return {
      join: Prisma.sql`INNER JOIN customer c ON c.id = o.customer_id AND c.is_deleted = false`,
      whereAnd: Prisma.join(parts, ' AND '),
    };
  }

  if (needsCustomerJoin) {
    return {
      join: Prisma.sql`INNER JOIN customer c ON c.id = o.customer_id AND c.is_deleted = false`,
      whereAnd: Prisma.join(parts, ' AND '),
    };
  }

  return {
    join: Prisma.empty,
    whereAnd: Prisma.join(parts, ' AND '),
  };
}

function sortDirSql(dir: 'asc' | 'desc'): Prisma.Sql {
  return dir === 'asc' ? Prisma.sql`ASC` : Prisma.sql`DESC`;
}

export class ListOrdersService {
  async execute(query: TListOrdersQuery): Promise<TListOrdersResponse> {
    const limit = Math.min(query.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
    const offset = query.offset ?? 0;

    const where = listWhereClause(query);
    const sortField =
      query.sort_by && ALLOWED_SORT_FIELDS.has(query.sort_by) ? query.sort_by : 'created_at';
    const sortDir = query.sort ?? 'desc';

    if (sortField === 'item_count' || sortField === 'total_amount') {
      return this.executeWithComputedSort(query, where, sortField, sortDir, limit, offset);
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: orderInclude,
        orderBy: { [sortField]: sortDir },
        skip: offset,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return this.buildResponse(orders, total, limit);
  }

  private async executeWithComputedSort(
    query: TListOrdersQuery,
    where: Prisma.OrderWhereInput,
    sortField: 'item_count' | 'total_amount',
    sortDir: 'asc' | 'desc',
    limit: number,
    offset: number
  ): Promise<TListOrdersResponse> {
    const { join, whereAnd } = listWhereSql(query);

    const orderExpr =
      sortField === 'item_count'
        ? Prisma.sql`(
            SELECT COALESCE(SUM(oi.quantity), 0)::bigint
            FROM order_item oi
            WHERE oi.order_id = o.id AND oi.is_deleted = false
          )`
        : Prisma.sql`COALESCE((
            SELECT SUM((oi.quantity * oi.unit_price)::numeric)
            FROM order_item oi
            WHERE oi.order_id = o.id AND oi.is_deleted = false
          ), 0)`;

    const [countRow, idRows] = await Promise.all([
      prisma.$queryRaw<[{ count: bigint }]>(
        Prisma.sql`
        SELECT COUNT(*)::bigint AS count
        FROM "order" o
        ${join}
        WHERE ${whereAnd}
      `
      ),
      prisma.$queryRaw<{ id: number }[]>(
        Prisma.sql`
        SELECT o.id
        FROM "order" o
        ${join}
        WHERE ${whereAnd}
        ORDER BY ${orderExpr} ${sortDirSql(sortDir)}, o.id ASC
        LIMIT ${limit} OFFSET ${offset}
      `
      ),
    ]);

    const total = Number(countRow[0]?.count ?? 0);
    const ids = idRows.map((r) => r.id);

    if (ids.length === 0) {
      const pages = limit > 0 ? Math.ceil(total / limit) : 0;
      return ListOrdersResponse.parse({
        items: [],
        pagination: { total, pages },
      });
    }

    const ordersUnordered = await prisma.order.findMany({
      where: { ...where, id: { in: ids } },
      include: orderInclude,
    });

    const byId = new Map(ordersUnordered.map((o) => [o.id, o]));
    const orders = ids.map((id) => byId.get(id)).filter((o): o is NonNullable<typeof o> => o != null);

    return this.buildResponse(orders, total, limit);
  }

  private async buildResponse(
    orders: Awaited<ReturnType<typeof prisma.order.findMany<{ include: typeof orderInclude }>>>,
    total: number,
    limit: number
  ): Promise<TListOrdersResponse> {
    const pages = limit > 0 ? Math.ceil(total / limit) : 0;
    const orderIds = orders.map((o) => o.id);

    const paymentRows =
      orderIds.length > 0
        ? await prisma.orderPayment.groupBy({
            by: ['order_id'],
            where: { order_id: { in: orderIds }, is_deleted: false },
            _sum: { amount: true },
          })
        : [];

    const paidByOrderId = new Map(
      paymentRows.map((row) => [row.order_id, toUnitPrice(row._sum.amount ?? 0)])
    );

    const items = orders.map((order) => {
      const lineItems = order.items.map((item) => ({
        quantity: item.quantity,
        unit_price: toUnitPrice(item.unit_price),
      }));

      const lines = order.items.map((item) => {
        const unit_price = toUnitPrice(item.unit_price);
        return {
          id: item.id,
          card_print_model_id: item.card_print_model_id,
          fulfill_from_stock: item.fulfill_from_stock,
          quantity: item.quantity,
          unit_price,
          line_total: computeLineTotal(item.quantity, unit_price),
          art_status: item.art_status,
          card: item.card,
          card_print_model: item.card_print_model,
        };
      });

      const total_amount = computeOrderTotal(lineItems);
      const amount_paid = paidByOrderId.get(order.id) ?? 0;
      const paymentSummary = computePaymentSummary(total_amount, amount_paid);

      return {
        id: order.id,
        customer_id: order.customer_id,
        customer_name: order.customer.name,
        customer_state: order.customer.state,
        order_status: order.order_status,
        delivery_method: order.delivery_method,
        notes: order.notes,
        order_date: order.order_date,
        total_amount,
        ...paymentSummary,
        item_count: order.items.reduce((sum, item) => sum + item.quantity, 0),
        pending_production_count: countPendingProductionItems(
          order.order_status,
          order.items
        ),
        missing_print_model_count: countMissingPrintModelItems(
          order.order_status,
          order.items
        ),
        lines_without_model_count: countLinesWithoutPrintModel(order.items),
        lines,
        created_at: order.created_at,
        updated_at: order.updated_at,
      };
    });

    return ListOrdersResponse.parse({
      items,
      pagination: { total, pages },
    });
  }
}

export const listOrdersService = new ListOrdersService();
