import { Prisma } from '../../../../prisma/generated/prisma/client.js';
import { ApiError } from '../../../common/errors/api-error';
import { ORDER_STATUSES_EXCLUDED_FROM_COMMERCIAL_METRICS } from '../../../common/schemas/order.schema';
import { prisma } from '../../../infra/database/prisma';
import { computeLineTotal } from '../../order/services/order-helpers';
import {
  GetCustomerPurchaseInfoResponse,
  TGetCustomerPurchaseInfoQuery,
  TGetCustomerPurchaseInfoResponse,
} from '../schemas/get-customer-purchase-info.schema';

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

type ItemTotalsRow = { total_units: bigint | number | null; total_order_value: unknown };
type PaidTotalRow = { total_paid: unknown };
type UnitsByTcgRow = { tcg: string; total_units: bigint | number };

const PURCHASE_INFO_ORDER_STATUS_EXCLUDE = [...ORDER_STATUSES_EXCLUDED_FROM_COMMERCIAL_METRICS];

const PURCHASE_INFO_ORDER_STATUS_EXCLUDE_SQL = Prisma.join(
  PURCHASE_INFO_ORDER_STATUS_EXCLUDE.map(
    (status) => Prisma.sql`${status}::"OrderPipelineStatus"`
  )
);

function confirmedOrderItemWhere(customerId: number): Prisma.OrderItemWhereInput {
  return {
    is_deleted: false,
    order: {
      customer_id: customerId,
      is_deleted: false,
      order_status: { notIn: PURCHASE_INFO_ORDER_STATUS_EXCLUDE },
    },
  };
}

function toNumber(value: unknown): number {
  if (value == null) return 0;
  return Number(value);
}

export function computePaginationPages(total: number, limit: number): number {
  return limit > 0 ? Math.ceil(total / limit) : 0;
}

export class GetCustomerPurchaseInfoService {
  async execute(
    customerId: number,
    query: TGetCustomerPurchaseInfoQuery
  ): Promise<TGetCustomerPurchaseInfoResponse> {
    const limit = Math.min(query.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
    const offset = query.offset ?? 0;

    const customer = await prisma.customer.findFirst({
      where: { id: customerId, is_deleted: false },
      select: { id: true, name: true, city: true, state: true },
    });

    if (!customer) {
      throw ApiError('not-found', 'Cliente não encontrado', undefined, 404);
    }

    const orderWhere: Prisma.OrderWhereInput = {
      customer_id: customerId,
      is_deleted: false,
      order_status: { notIn: PURCHASE_INFO_ORDER_STATUS_EXCLUDE },
    };

    const itemWhere = confirmedOrderItemWhere(customerId);

    const [
      orderCount,
      itemTotalsRows,
      paidTotalRows,
      tcgRows,
      recentItems,
      recentTotal,
    ] = await Promise.all([
      prisma.order.count({ where: orderWhere }),
      prisma.$queryRaw<ItemTotalsRow[]>(Prisma.sql`
        SELECT
          COALESCE(SUM(oi.quantity), 0) AS total_units,
          COALESCE(SUM((oi.quantity * oi.unit_price)::numeric), 0) AS total_order_value
        FROM order_item oi
        INNER JOIN "order" o ON o.id = oi.order_id
        WHERE oi.is_deleted = false
          AND o.is_deleted = false
          AND o.customer_id = ${customerId}
          AND o.order_status NOT IN (${PURCHASE_INFO_ORDER_STATUS_EXCLUDE_SQL})
      `),
      prisma.$queryRaw<PaidTotalRow[]>(Prisma.sql`
        SELECT COALESCE(SUM(op.amount), 0)::float AS total_paid
        FROM order_payment op
        INNER JOIN "order" o ON o.id = op.order_id
        WHERE op.is_deleted = false
          AND o.is_deleted = false
          AND o.customer_id = ${customerId}
          AND o.order_status NOT IN (${PURCHASE_INFO_ORDER_STATUS_EXCLUDE_SQL})
      `),
      prisma.$queryRaw<UnitsByTcgRow[]>(Prisma.sql`
        SELECT card.tcg::text AS tcg, SUM(oi.quantity) AS total_units
        FROM order_item oi
        INNER JOIN "order" o ON o.id = oi.order_id
        INNER JOIN card ON card.id = oi.card_id
        WHERE oi.is_deleted = false
          AND o.is_deleted = false
          AND card.is_deleted = false
          AND o.customer_id = ${customerId}
          AND o.order_status NOT IN (${PURCHASE_INFO_ORDER_STATUS_EXCLUDE_SQL})
        GROUP BY card.tcg
        ORDER BY SUM(oi.quantity) DESC, card.tcg ASC
      `),
      prisma.orderItem.findMany({
        where: itemWhere,
        orderBy: [{ order: { order_date: 'desc' } }, { id: 'desc' }],
        skip: offset,
        take: limit,
        select: {
          quantity: true,
          unit_price: true,
          order: {
            select: {
              id: true,
              order_date: true,
              order_status: true,
            },
          },
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
      }),
      prisma.orderItem.count({ where: itemWhere }),
    ]);

    const itemTotals = itemTotalsRows[0];
    const paidTotal = paidTotalRows[0];

    const response = {
      customer,
      stats: {
        order_count: orderCount,
        total_units: Number(itemTotals?.total_units ?? 0),
        total_order_value: toNumber(itemTotals?.total_order_value),
        total_paid: toNumber(paidTotal?.total_paid),
      },
      units_by_tcg: tcgRows.map((row) => ({
        tcg: row.tcg,
        total_units: Number(row.total_units),
      })),
      recent_lines: {
        items: recentItems.map((item) => {
          const unitPrice = Number(item.unit_price);
          return {
            order_id: item.order.id,
            order_date: item.order.order_date,
            order_status: item.order.order_status,
            quantity: item.quantity,
            unit_price: unitPrice,
            line_total: computeLineTotal(item.quantity, unitPrice),
            card: item.card,
            card_print_model: item.card_print_model,
          };
        }),
        pagination: {
          total: recentTotal,
          pages: computePaginationPages(recentTotal, limit),
        },
      },
    };

    return GetCustomerPurchaseInfoResponse.parse(response);
  }
}

export const getCustomerPurchaseInfoService = new GetCustomerPurchaseInfoService();
