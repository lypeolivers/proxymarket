import type { Prisma } from '../../../../prisma/generated/prisma/client.js';
import { ApiError } from '../../../common/errors/api-error';
import { PrismaTransactionalClient } from '../../../infra/database/prisma';
import { prisma } from '../../../infra/database/prisma';
import { OrderPaymentEntity } from '../entities/order-payment.entity';
import { OrderEntity, TOrderEntity } from '../entities/order.entity';
import { computeLineTotal, computeOrderTotal, toUnitPrice } from './order-helpers';
import { computePaymentSummary } from './order-payment-helpers';

const orderInclude = {
  customer: {
    select: {
      id: true,
      name: true,
      state: true,
    },
  },
  payments: {
    where: { is_deleted: false },
    orderBy: [{ collected_at: 'desc' as const }, { id: 'desc' as const }],
  },
  items: {
    where: { is_deleted: false },
    include: {
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
    orderBy: { id: 'asc' as const },
  },
} satisfies Prisma.OrderInclude;

type OrderWithRelations = NonNullable<
  Awaited<ReturnType<typeof prisma.order.findFirst<{ include: typeof orderInclude }>>>
>;

export function mapOrderRecord(order: OrderWithRelations): TOrderEntity {
  const items = order.items.map((item) => {
    const unit_price = toUnitPrice(item.unit_price);
    return {
      id: item.id,
      card_id: item.card_id,
      card_print_model_id: item.card_print_model_id,
      customer_gift_id: item.customer_gift_id,
      fulfill_from_stock: item.fulfill_from_stock,
      production_shipment_id: item.production_shipment_id,
      quantity: item.quantity,
      unit_price,
      line_total: computeLineTotal(item.quantity, unit_price),
      art_status: item.art_status,
      card: item.card,
      card_print_model: item.card_print_model,
    };
  });

  const total_amount = computeOrderTotal(items);
  const payments = order.payments.map((row) =>
    OrderPaymentEntity.parse({
      id: row.id,
      amount: toUnitPrice(row.amount),
      collected_at: row.collected_at,
      notes: row.notes,
      created_at: row.created_at,
    })
  );
  const amount_paid = payments.reduce((sum, p) => sum + p.amount, 0);
  const paymentSummary = computePaymentSummary(total_amount, amount_paid);

  return {
    id: order.id,
    customer_id: order.customer_id,
    customer: order.customer,
    order_status: order.order_status,
    delivery_method: order.delivery_method,
    notes: order.notes,
    order_date: order.order_date,
    total_amount,
    ...paymentSummary,
    payments,
    items,
    created_at: order.created_at,
    updated_at: order.updated_at,
  };
}

export async function loadOrderEntity(
  id: number,
  transaction: PrismaTransactionalClient = prisma
): Promise<TOrderEntity | null> {
  const order = await transaction.order.findFirst({
    where: { id, is_deleted: false },
    include: orderInclude,
  });

  if (!order) {
    return null;
  }

  return OrderEntity.parse(mapOrderRecord(order));
}

export async function assertCustomerExists(
  customerId: number,
  transaction: PrismaTransactionalClient
) {
  const customer = await transaction.customer.findFirst({
    where: { id: customerId, is_deleted: false },
  });

  if (!customer) {
    throw ApiError('not-found', 'Cliente não encontrado', undefined, 404);
  }
}

export async function assertCardsExist(
  cardIds: number[],
  transaction: PrismaTransactionalClient
) {
  const uniqueIds = [...new Set(cardIds)];
  const cards = await transaction.card.findMany({
    where: { id: { in: uniqueIds }, is_deleted: false },
    select: { id: true },
  });

  if (cards.length !== uniqueIds.length) {
    throw ApiError('not-found', 'Carta não encontrada', undefined, 404);
  }
}

export { orderInclude };
