import { Prisma } from '../../../../prisma/generated/prisma/client.js';
import {
  countMissingPrintModelItems,
  countPendingProductionItems,
  OrderLineArtStatus,
} from '../../../common/schemas/order.schema';
import { prisma } from '../../../infra/database/prisma';
import { getGraphicSummaryService } from '../../stock/services/get-graphic-summary.service';
import {
  OrderStatsResponse,
  TGetOrderStatsQuery,
  TOrderStatsResponse,
} from '../schemas/get-order-stats.schema';
import { computeOrderTotal, toUnitPrice } from './order-helpers';
import { computePaymentSummary, roundMoney } from './order-payment-helpers';
import {
  buildLastNUtcMonthKeys,
  mergeMonthlyRevenueIntoSeries,
  startOfOldestMonthUtc,
} from './stats-month-series';

const ART_STATUS_VALUES = OrderLineArtStatus.options;

const PRODUCTION_ELIGIBLE_STATUSES = ['quote', 'partial_payment', 'paid'] as const;

const ART_EXCLUDED_FROM_GRAPHIC_DEMAND: Array<'printing' | 'printed'> = ['printing', 'printed'];

const backlogItemWhere = {
  is_deleted: false,
  fulfill_from_stock: false,
  art_status: { notIn: ART_EXCLUDED_FROM_GRAPHIC_DEMAND },
} as const;

function utcCurrentMonthRange(): { gte: Date; lt: Date } {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  return {
    gte: new Date(Date.UTC(y, m, 1)),
    lt: new Date(Date.UTC(y, m + 1, 1)),
  };
}

function buildOrderWhere(
  base: Prisma.OrderWhereInput,
  query: TGetOrderStatsQuery
): Prisma.OrderWhereInput {
  const parts: Prisma.OrderWhereInput[] = [{ is_deleted: false }, base];

  if (query.customer_state) {
    parts.push({
      customer: { is_deleted: false, state: query.customer_state },
    });
  }

  if (query.tcg) {
    parts.push({
      items: {
        some: {
          is_deleted: false,
          card: { is_deleted: false, tcg: query.tcg },
        },
      },
    });
  }

  return { AND: parts };
}

function buildOrderItemWhere(query: TGetOrderStatsQuery): Prisma.OrderItemWhereInput {
  const parts: Prisma.OrderItemWhereInput[] = [
    { is_deleted: false, order: { is_deleted: false } },
  ];

  if (query.customer_state) {
    parts.push({
      order: {
        is_deleted: false,
        customer: { is_deleted: false, state: query.customer_state },
      },
    });
  }

  if (query.tcg) {
    parts.push({
      card: { is_deleted: false, tcg: query.tcg },
    });
  }

  return { AND: parts };
}

function buildInsightFilterSql(
  query: TGetOrderStatsQuery
): { orderJoin: Prisma.Sql; paymentJoin: Prisma.Sql; itemJoin: Prisma.Sql } {
  const orderParts: Prisma.Sql[] = [];
  const paymentParts: Prisma.Sql[] = [];
  const itemParts: Prisma.Sql[] = [];

  if (query.customer_state) {
    orderParts.push(Prisma.sql`AND c.state = ${query.customer_state}`);
    paymentParts.push(Prisma.sql`AND c.state = ${query.customer_state}`);
    itemParts.push(Prisma.sql`AND c.state = ${query.customer_state}`);
  }

  if (query.tcg) {
    orderParts.push(
      Prisma.sql`AND EXISTS (
        SELECT 1 FROM order_item oi_f
        INNER JOIN card card_f ON card_f.id = oi_f.card_id
        WHERE oi_f.order_id = o.id
          AND oi_f.is_deleted = false
          AND card_f.is_deleted = false
          AND card_f.tcg = ${query.tcg}::"Tcg"
      )`
    );
    paymentParts.push(
      Prisma.sql`AND EXISTS (
        SELECT 1 FROM order_item oi_f
        INNER JOIN card card_f ON card_f.id = oi_f.card_id
        WHERE oi_f.order_id = o.id
          AND oi_f.is_deleted = false
          AND card_f.is_deleted = false
          AND card_f.tcg = ${query.tcg}::"Tcg"
      )`
    );
    itemParts.push(Prisma.sql`AND card.tcg = ${query.tcg}::"Tcg"`);
  }

  const join = (parts: Prisma.Sql[]) =>
    parts.length === 0 ? Prisma.empty : Prisma.join(parts, ' ');

  return {
    orderJoin: join(orderParts),
    paymentJoin: join(paymentParts),
    itemJoin: join(itemParts),
  };
}

function buildPaymentFilterSql(query: TGetOrderStatsQuery): Prisma.Sql {
  const parts: Prisma.Sql[] = [];

  if (query.customer_state) {
    parts.push(Prisma.sql`AND c.state = ${query.customer_state}`);
  }

  if (query.tcg) {
    parts.push(Prisma.sql`AND EXISTS (
      SELECT 1 FROM order_item oi_f
      INNER JOIN card card_f ON card_f.id = oi_f.card_id
      WHERE oi_f.order_id = o.id
        AND oi_f.is_deleted = false
        AND card_f.is_deleted = false
        AND card_f.tcg = ${query.tcg}::"Tcg"
    )`);
  }

  return parts.length === 0 ? Prisma.empty : Prisma.join(parts, ' ');
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

async function sumPaymentsCollectedBetween(
  gte: Date,
  lt: Date,
  query: TGetOrderStatsQuery
): Promise<number> {
  const filterSql = buildPaymentFilterSql(query);

  if (query.customer_state || query.tcg) {
    const rows = await prisma.$queryRaw<Array<{ total: unknown }>>(Prisma.sql`
      SELECT COALESCE(SUM(op.amount::numeric), 0) AS total
      FROM order_payment op
      INNER JOIN "order" o ON o.id = op.order_id
      INNER JOIN customer c ON c.id = o.customer_id
      WHERE op.is_deleted = false
        AND o.is_deleted = false
        AND c.is_deleted = false
        AND op.collected_at >= ${gte}
        AND op.collected_at < ${lt}
        ${filterSql}
    `);
    return toUnitPrice(rows[0]?.total ?? 0);
  }

  const aggregate = await prisma.orderPayment.aggregate({
    where: {
      is_deleted: false,
      collected_at: { gte, lt },
      order: { is_deleted: false },
    },
    _sum: { amount: true },
  });
  return toUnitPrice(aggregate._sum.amount ?? 0);
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

async function computeAmountDueStats(
  query: TGetOrderStatsQuery
): Promise<{ amount_due_total: number; orders_with_balance_count: number }> {
  const orders = await prisma.order.findMany({
    where: buildOrderWhere(
      { order_status: { notIn: ['quote', 'delivered'] } },
      query
    ),
    select: {
      items: {
        where: { is_deleted: false },
        select: { quantity: true, unit_price: true },
      },
      payments: {
        where: { is_deleted: false },
        select: { amount: true },
      },
    },
  });

  let amount_due_total = 0;
  let orders_with_balance_count = 0;

  for (const order of orders) {
    const total = computeOrderTotal(
      order.items.map((item) => ({
        quantity: item.quantity,
        unit_price: toUnitPrice(item.unit_price),
      }))
    );
    const paid = roundMoney(
      order.payments.reduce((sum, payment) => sum + toUnitPrice(payment.amount), 0)
    );
    const { amount_due } = computePaymentSummary(total, paid);
    if (amount_due > 0) {
      amount_due_total += amount_due;
      orders_with_balance_count += 1;
    }
  }

  return {
    amount_due_total: roundMoney(amount_due_total),
    orders_with_balance_count,
  };
}

async function computeProductionLineStats(query: TGetOrderStatsQuery): Promise<{
  pending_production_lines: number;
  missing_print_model_lines: number;
}> {
  const orders = await prisma.order.findMany({
    where: buildOrderWhere(
      { order_status: { in: [...PRODUCTION_ELIGIBLE_STATUSES] } },
      query
    ),
    select: {
      order_status: true,
      items: {
        where: { is_deleted: false },
        select: {
          production_shipment_id: true,
          fulfill_from_stock: true,
          card_print_model_id: true,
        },
      },
    },
  });

  let pending_production_lines = 0;
  let missing_print_model_lines = 0;

  for (const order of orders) {
    pending_production_lines += countPendingProductionItems(order.order_status, order.items);
    missing_print_model_lines += countMissingPrintModelItems(order.order_status, order.items);
  }

  return { pending_production_lines, missing_print_model_lines };
}

async function computeOpenShipmentSummary(): Promise<TOrderStatsResponse['operations']['open_shipment']> {
  const shipment = await prisma.productionShipment.findFirst({
    where: { is_deleted: false, status: 'awaiting_print' },
    include: {
      order_items: {
        where: { is_deleted: false },
        select: { quantity: true },
      },
    },
    orderBy: { display_number: 'desc' },
  });

  if (!shipment) return null;

  return {
    id: shipment.id,
    display_number: shipment.display_number,
    line_count: shipment.order_items.length,
    total_units: shipment.order_items.reduce(
      (sum: number, item: { quantity: number }) => sum + item.quantity,
      0
    ),
  };
}

export class GetOrderStatsService {
  async execute(query: TGetOrderStatsQuery = { period_months: 12 }): Promise<TOrderStatsResponse> {
    const periodMonths = query.period_months ?? 12;
    const currentMonth = utcCurrentMonthRange();
    const monthKeys = buildLastNUtcMonthKeys(periodMonths);
    const revenueSince = startOfOldestMonthUtc(periodMonths);
    const filterSql = buildInsightFilterSql(query);
    const paymentChartFilter = buildPaymentFilterSql(query);

    const itemWhere = buildOrderItemWhere(query);

    const [
      quotes_count,
      partial_payment_count,
      paid_count,
      awaiting_payment_count,
      ready_for_delivery_count,
      delivered_count,
      active_cards_count,
      revenue_month,
      pipeline_value,
      groupedItems,
      topCustomerRevenue,
      topCard,
      topCustomerUnits,
      monthlyPaymentRows,
      monthlyConfirmedRows,
      amountDueStats,
      productionLineStats,
      print_backlog_order_count,
      graphicSummary,
      open_shipment,
    ] = await Promise.all([
      prisma.order.count({
        where: buildOrderWhere({ order_status: 'quote' }, query),
      }),
      prisma.order.count({
        where: buildOrderWhere({ order_status: 'partial_payment' }, query),
      }),
      prisma.order.count({
        where: buildOrderWhere({ order_status: 'paid' }, query),
      }),
      prisma.order.count({
        where: buildOrderWhere({ order_status: 'awaiting_payment' }, query),
      }),
      prisma.order.count({
        where: buildOrderWhere({ order_status: 'ready_for_delivery' }, query),
      }),
      prisma.order.count({
        where: buildOrderWhere({ order_status: 'delivered' }, query),
      }),
      prisma.card.count({
        where: {
          is_deleted: false,
          status: 'active',
          ...(query.tcg ? { tcg: query.tcg } : {}),
        },
      }),
      sumPaymentsCollectedBetween(currentMonth.gte, currentMonth.lt, query),
      sumOrderTotals(buildOrderWhere({ order_status: 'quote' }, query)),
      prisma.orderItem.groupBy({
        by: ['art_status'],
        where: itemWhere,
        _count: { _all: true },
      }),
      prisma.$queryRaw<TopCustomerRevenueRow[]>(Prisma.sql`
        SELECT o.customer_id AS customer_id, c.name AS name,
          SUM(op.amount)::float AS total_revenue
        FROM order_payment op
        INNER JOIN "order" o ON o.id = op.order_id
        INNER JOIN customer c ON c.id = o.customer_id
        WHERE op.is_deleted = false
          AND o.is_deleted = false
          AND c.is_deleted = false
          ${filterSql.paymentJoin}
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
        INNER JOIN customer c ON c.id = o.customer_id
        WHERE oi.is_deleted = false
          AND o.is_deleted = false
          AND card.is_deleted = false
          AND c.is_deleted = false
          AND o.order_status::text <> 'quote'
          ${filterSql.itemJoin}
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
          ${filterSql.itemJoin}
        GROUP BY o.customer_id, c.name
        ORDER BY total_units DESC NULLS LAST, o.customer_id ASC
        LIMIT 1
      `),
      prisma.$queryRaw<MonthlyRow[]>(Prisma.sql`
        SELECT
          to_char(op.collected_at, 'YYYY-MM') AS month_key,
          SUM(op.amount::numeric) AS revenue
        FROM order_payment op
        INNER JOIN "order" o ON o.id = op.order_id
        INNER JOIN customer c ON c.id = o.customer_id
        WHERE op.is_deleted = false
          AND o.is_deleted = false
          AND c.is_deleted = false
          AND op.collected_at >= ${revenueSince}
          ${paymentChartFilter}
        GROUP BY to_char(op.collected_at, 'YYYY-MM')
        ORDER BY month_key ASC
      `),
      prisma.$queryRaw<MonthlyRow[]>(Prisma.sql`
        SELECT
          to_char(o.order_date, 'YYYY-MM') AS month_key,
          SUM((oi.quantity * oi.unit_price)::numeric) AS revenue
        FROM order_item oi
        INNER JOIN "order" o ON o.id = oi.order_id
        INNER JOIN customer c ON c.id = o.customer_id
        WHERE oi.is_deleted = false
          AND o.is_deleted = false
          AND c.is_deleted = false
          AND o.order_status::text <> 'quote'
          AND o.order_date >= ${revenueSince}
          ${filterSql.itemJoin}
        GROUP BY to_char(o.order_date, 'YYYY-MM')
        ORDER BY month_key ASC
      `),
      computeAmountDueStats(query),
      computeProductionLineStats(query),
      prisma.order.count({
        where: buildOrderWhere(
          {
            order_status: { notIn: ['quote', 'delivered'] },
            items: { some: backlogItemWhere },
          },
          query
        ),
      }),
      getGraphicSummaryService.execute(),
      computeOpenShipmentSummary(),
    ]);

    const in_progress_by_status = {
      partial_payment: partial_payment_count,
      paid: paid_count,
      awaiting_payment: awaiting_payment_count,
    };

    const in_progress_count =
      partial_payment_count + paid_count + awaiting_payment_count;

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

    const revenue_by_month = mergeMonthlyRevenueIntoSeries(monthKeys, monthlyPaymentRows);
    const confirmed_revenue_by_month = mergeMonthlyRevenueIntoSeries(
      monthKeys,
      monthlyConfirmedRows
    );

    return OrderStatsResponse.parse({
      quotes_count,
      in_progress_count,
      in_progress_by_status,
      ready_for_delivery_count,
      delivered_count,
      revenue_month: Math.round(revenue_month * 100) / 100,
      pipeline_value: Math.round(pipeline_value * 100) / 100,
      amount_due_total: amountDueStats.amount_due_total,
      orders_with_balance_count: amountDueStats.orders_with_balance_count,
      items_by_art_status,
      active_cards_count,
      insights,
      revenue_by_month,
      confirmed_revenue_by_month,
      operations: {
        graphic_total_units: graphicSummary.total_units,
        print_backlog_order_count,
        pending_production_lines: productionLineStats.pending_production_lines,
        missing_print_model_lines: productionLineStats.missing_print_model_lines,
        open_shipment,
      },
    });
  }
}

export const getOrderStatsService = new GetOrderStatsService();
