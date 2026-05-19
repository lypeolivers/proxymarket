import { ApiError } from '../../../common/errors/api-error';
import { runInTransaction } from '../../../infra/database/prisma';
import { TOrderItemInput } from '../../../common/schemas/order.schema';
import { applyStockDecrementForDeliveredOrder } from '../../stock/services/apply-stock-decrement-for-delivered-order';
import { getOrCreateOpenProductionShipment } from '../../production/services/get-or-create-open-production-shipment.service';
import {
  TUpdateOrderBody,
  TUpdateOrderResponse,
  UpdateOrderResponse,
} from '../schemas/update-order.schema';
import { assertCardPrintModelsBelongToCards } from './assert-card-print-models-for-order-items';
import {
  assertCardsExist,
  assertCustomerExists,
  loadOrderEntity,
} from './order-mapper';
import { assertStatusTransition, resolveOrderHeader } from './order-helpers';

async function replaceOrderItems(
  orderId: number,
  items: TOrderItemInput[],
  transaction: Parameters<typeof assertCustomerExists>[1]
) {
  await transaction.orderItem.updateMany({
    where: { order_id: orderId, is_deleted: false },
    data: { is_deleted: true },
  });

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

  const shipmentId = await getOrCreateOpenProductionShipment(transaction);

  for (const item of items) {
    await transaction.orderItem.create({
      data: {
        order_id: orderId,
        card_id: item.card_id,
        card_print_model_id: item.card_print_model_id,
        production_shipment_id: shipmentId,
        quantity: item.quantity,
        unit_price: item.unit_price,
        art_status: 'art_to_do',
      },
    });
  }
}

export class UpdateOrderService {
  async execute(id: number, data: TUpdateOrderBody): Promise<TUpdateOrderResponse> {
    const header = resolveOrderHeader(data);

    const result = await runInTransaction(async (transaction) => {
      const existing = await transaction.order.findFirst({
        where: { id, is_deleted: false },
      });

      if (!existing) {
        throw ApiError('not-found', 'Pedido não encontrado', undefined, 404);
      }

      assertStatusTransition(existing.order_status, header.order_status);

      await assertCustomerExists(data.customer_id, transaction);

      await transaction.order.update({
        where: { id },
        data: {
          customer_id: data.customer_id,
          order_date: data.order_date,
          order_status: header.order_status,
          delivery_method: header.delivery_method,
          notes: data.notes?.trim() || null,
        },
      });

      await replaceOrderItems(id, data.items, transaction);

      if (header.order_status === 'delivered' && existing.order_status !== 'delivered') {
        await applyStockDecrementForDeliveredOrder(transaction, id);
      }

      const loaded = await loadOrderEntity(id, transaction);
      if (!loaded) {
        throw ApiError('not-found', 'Pedido não encontrado', undefined, 404);
      }

      return loaded;
    });

    return UpdateOrderResponse.parse(result);
  }
}

export const updateOrderService = new UpdateOrderService();
