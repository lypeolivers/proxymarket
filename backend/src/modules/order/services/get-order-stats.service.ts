import { Prisma } from '../../../../prisma/generated/prisma/client.js';
import { prisma } from '../../../infra/database/prisma';
import { OrderLineArtStatus } from '../../../common/schemas/order.schema';
import {
  OrderStatsResponse,
  TOrderStatsResponse,
} from '../schemas/get-order-stats.schema';
import { computeOrderTotal, toUnitPrice } from './order-helpers';
import {
  buildLastNUtcMonthKeys,
  mergeMonthlyRevenueIntoSeries,
  startOfOldestMonthUtc,
} from './stats-month-series';

const ART_STATUS_VALUES = OrderLineArtStatus.options;

const PRODUCTION_STATUSES = ['partial_payment', 'paid', 'awaiting_payment'] as const;

const MONTH_COUNT = 12;

/** Receita do mês e série mensal usam `order_date` em UTC, alinhado a `buildLastNUtcMonthKeys`. */
function utcCurrentMonthRange(): { gte: Date; lt: Date } {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  return {
    gte: new Date(Date.UTC(y, m, 1)),
    lt: new Date(Date.UTC(y, m + 1, 1)),
  };
}

async function sumOrderTotals(where: Prisma.OrderWhereInput) {
  const orders = await prisma.order.findMany({
    where,
    select: {
      items: {
        where: { is_deleted: false },
        select: { quantity: true, unit_price: true },
      },
    },
  });

  return orders.reduce((sum, order) => {
    const total = computeOrderTotal(
      order.items.map((item) => ({
        quantity: item.quantity,
        unit_price: toUnitPrice(item.unit_price),
      }))
    );
    return sum + total;
  }, 0);
}

type TopCustomerRevenueRow = { customer_id: number; name: string; total_revenue: unknown };

type TopCardRow = {
  card_id: number;
  tcg: string;
  card_type: string;
  name: string | null;
  edition: string | null;
  total_quantity: bigint | number;
};

type TopCustomerUnitsRow = { customer_id: number; name: string; total_units: bigint | number };

type MonthlyRow = { month_key: string; revenue: unknown };

export class GetOrderStatsService {
  async execute(): Promise<TOrderStatsResponse> {
    const currentMonth = utcCurrentMonthRange();
    const monthKeys = buildLastNUtcMonthKeys(MONTH_COUNT);
    const revenueSince = startOfOldestMonthUtc(MONTH_COUNT);

    const [
      quotes_count,
      in_progress_count,
      ready_for_delivery_count,
      delivered_count,
      active_cards_count,
      revenue_month,
      pipeline_value,
      groupedItems,
      topCustomerRevenue,
      topCard,
      topCustomerUnits,
      monthlyRows,
    ] = await Promise.all([
      prisma.order.count({
        where: { is_deleted: false, order_status: 'quote' },
      }),
      prisma.order.count({
        where: { is_deleted: false, order_status: { in: [...PRODUCTION_STATUSES] } },
      }),
      prisma.order.count({
        where: { is_deleted: false, order_status: 'ready_for_delivery' },
      }),
      prisma.order.count({
        where: { is_deleted: false, order_status: 'delivered' },
      }),
      prisma.card.count({
        where: { is_deleted: false, status: 'active' },
      }),
      sumOrderTotals({
        is_deleted: false,
        order_status: { in: ['partial_payment', 'paid'] },
        order_date: { gte: currentMonth.gte, lt: currentMonth.lt },
      }),
      sumOrderTotals({
        is_deleted: false,
        order_status: 'quote',
      }),
      prisma.orderItem.groupBy({
        by: ['art_status'],
        where: {
          is_deleted: false,
          order: { is_deleted: false },
        },
        _count: { _all: true },
      }),
      prisma.$queryRaw<TopCustomerRevenueRow[]>(Prisma.sql`
        SELECT o.customer_id AS customer_id, c.name AS name,
          SUM(oi.quantity * oi.unit_price)::float AS total_revenue
        FROM order_item oi
        INNER JOIN "order" o ON o.id = oi.order_id
        INNER JOIN customer c ON c.id = o.customer_id
        WHERE oi.is_deleted = false
          AND o.is_deleted = false
          AND c.is_deleted = false
          AND o.order_status::text <> 'quote'
        GROUP BY o.customer_id, c.name
        ORDER BY total_revenue DESC NULLS LAST, o.customer_id ASC
        LIMIT 1
      `),
      prisma.$queryRaw<TopCardRow[]>(Prisma.sql`
        SELECT oi.card_id AS card_id,
          card.tcg::text AS tcg,
          card.card_type::text AS card_type,
          card.name AS name,
          card.edition AS edition,
          SUM(oi.quantity) AS total_quantity
        FROM order_item oi
        INNER JOIN "order" o ON o.id = oi.order_id
        INNER JOIN card ON card.id = oi.card_id
        WHERE oi.is_deleted = false
          AND o.is_deleted = false
          AND card.is_deleted = false
          AND o.order_status::text <> 'quote'
        GROUP BY oi.card_id, card.tcg, card.card_type, card.name, card.edition
        ORDER BY SUM(oi.quantity) DESC, oi.card_id ASC
        LIMIT 1
      `),
      prisma.$queryRaw<TopCustomerUnitsRow[]>(Prisma.sql`
        SELECT o.customer_id AS customer_id, c.name AS name,
          SUM(oi.quantity) AS total_units
        FROM order_item oi
        INNER JOIN "order" o ON o.id = oi.order_id
        INNER JOIN customer c ON c.id = o.customer_id
        WHERE oi.is_deleted = false
          AND o.is_deleted = false
          AND c.is_deleted = false
          AND o.order_status::text <> 'quote'
        GROUP BY o.customer_id, c.name
        ORDER BY total_units DESC NULLS LAST, o.customer_id ASC
        LIMIT 1
      `),
      prisma.$queryRaw<MonthlyRow[]>(Prisma.sql`
        SELECT
          to_char(o.order_date, 'YYYY-MM') AS month_key,
          SUM((oi.quantity * oi.unit_price)::numeric) AS revenue
        FROM order_item oi
        INNER JOIN "order" o ON o.id = oi.order_id
        WHERE oi.is_deleted = false
          AND o.is_deleted = false
          AND o.order_status::text <> 'quote'
          AND o.order_date >= ${revenueSince}
        GROUP BY to_char(o.order_date, 'YYYY-MM')
        ORDER BY month_key ASC
      `),
    ]);

    const items_by_art_status = ART_STATUS_VALUES.reduce(
      (acc, status) => {
        acc[status] = 0;
        return acc;
      },
      {} as Record<(typeof ART_STATUS_VALUES)[number], number>
    );

    for (const row of groupedItems) {
      items_by_art_status[row.art_status] = row._count._all;
    }

    const cr = topCustomerRevenue[0];
    const tc = topCard[0];
    const cu = topCustomerUnits[0];

    const insights = {
      top_customer_by_revenue: cr
        ? {
            customer_id: cr.customer_id,
            name: cr.name,
            total_revenue: Math.round(Number(cr.total_revenue) * 100) / 100,
          }
        : null,
      top_card_by_quantity: tc
        ? {
            card_id: tc.card_id,
            tcg: tc.tcg,
            card_type: tc.card_type,
            name: tc.name,
            edition: tc.edition,
            total_quantity: Number(tc.total_quantity),
          }
        : null,
      top_customer_by_units: cu
        ? {
            customer_id: cu.customer_id,
            name: cu.name,
            total_units: Number(cu.total_units),
          }
        : null,
    };

    const revenue_by_month = mergeMonthlyRevenueIntoSeries(monthKeys, monthlyRows);

    return OrderStatsResponse.parse({
      quotes_count,
      in_progress_count,
      ready_for_delivery_count,
      delivered_count,
      revenue_month: Math.round(revenue_month * 100) / 100,
      pipeline_value: Math.round(pipeline_value * 100) / 100,
      items_by_art_status,
      active_cards_count,
      insights,
      revenue_by_month,
    });
  }
}

export const getOrderStatsService = new GetOrderStatsService();
