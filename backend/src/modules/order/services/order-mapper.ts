import type { Prisma } from '../../../../prisma/generated/prisma/client.js';
import { ApiError } from '../../../common/errors/api-error';
import { PrismaTransactionalClient } from '../../../infra/database/prisma';
import { prisma } from '../../../infra/database/prisma';
import { OrderEntity, TOrderEntity } from '../entities/order.entity';
import { computeLineTotal, computeOrderTotal, toUnitPrice } from './order-helpers';

const orderInclude = {
  customer: {
    select: {
      id: true,
      name: true,
    },
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
      quantity: item.quantity,
      unit_price,
      line_total: computeLineTotal(item.quantity, unit_price),
      art_status: item.art_status,
      card: item.card,
      card_print_model: item.card_print_model,
    };
  });

  return {
    id: order.id,
    customer_id: order.customer_id,
    customer: order.customer,
    order_status: order.order_status,
    delivery_method: order.delivery_method,
    notes: order.notes,
    order_date: order.order_date,
    total_amount: computeOrderTotal(items),
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
