import { ApiError } from '../../../common/errors/api-error';
import { runInTransaction } from '../../../infra/database/prisma';
import { TOrderItemInput } from '../../../common/schemas/order.schema';
import {
  CreateOrderResponse,
  TCreateOrderBody,
  TCreateOrderResponse,
} from '../schemas/create-order.schema';
import {
  assertCardsExist,
  assertCustomerExists,
  loadOrderEntity,
} from './order-mapper';
import { resolveItemArtStatus, resolveOrderHeader } from './order-helpers';

async function createOrderItems(
  orderId: number,
  orderStatus: ReturnType<typeof resolveOrderHeader>['order_status'],
  items: TOrderItemInput[],
  transaction: Parameters<typeof assertCustomerExists>[1]
) {
  await assertCardsExist(
    items.map((item) => item.card_id),
    transaction
  );

  for (const item of items) {
    await transaction.orderItem.create({
      data: {
        order_id: orderId,
        card_id: item.card_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        art_status: resolveItemArtStatus(orderStatus, item.art_status),
      },
    });
  }
}

export class CreateOrderService {
  async execute(data: TCreateOrderBody): Promise<TCreateOrderResponse> {
    const header = resolveOrderHeader(data);

    const result = await runInTransaction(async (transaction) => {
      await assertCustomerExists(data.customer_id, transaction);

      const order = await transaction.order.create({
        data: {
          customer_id: data.customer_id,
          order_date: data.order_date,
          order_status: header.order_status,
          delivery_method: header.delivery_method,
          notes: data.notes?.trim() || null,
        },
      });

      await createOrderItems(order.id, header.order_status, data.items, transaction);

      const loaded = await loadOrderEntity(order.id, transaction);
      if (!loaded) {
        throw ApiError('not-found', 'Pedido não encontrado', undefined, 404);
      }

      return loaded;
    });

    return CreateOrderResponse.parse(result);
  }
}

export const createOrderService = new CreateOrderService();
