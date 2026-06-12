import { ApiError } from '../../../common/errors/api-error';
import { runInTransaction } from '../../../infra/database/prisma';
import { TOrderItemInput } from '../../../common/schemas/order.schema';
import {
  CreateOrderResponse,
  TCreateOrderBody,
  TCreateOrderResponse,
} from '../schemas/create-order.schema';
import { assertCardPrintModelsBelongToCards } from './assert-card-print-models-for-order-items';
import {
  assertCardsExist,
  assertCustomerExists,
  loadOrderEntity,
} from './order-mapper';
import { resolveOrderHeader } from './order-helpers';

async function createOrderItems(
  orderId: number,
  items: TOrderItemInput[],
  transaction: Parameters<typeof assertCustomerExists>[1]
) {
  await assertCardsExist(
    items.map((item) => item.card_id),
    transaction
  );

  await assertCardPrintModelsBelongToCards(
    items.map((item) => ({
      card_id: item.card_id,
      card_print_model_id: item.card_print_model_id,
    })),
    transaction
  );

  for (const item of items) {
    await transaction.orderItem.create({
      data: {
        order_id: orderId,
        card_id: item.card_id,
        card_print_model_id: item.card_print_model_id,
        fulfill_from_stock: item.fulfill_from_stock,
        production_shipment_id: null,
        quantity: item.quantity,
        unit_price: item.unit_price,
        art_status: 'art_to_do',
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

      await createOrderItems(order.id, data.items, transaction);

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
