import { ApiError } from '../../../common/errors/api-error';
import { runInTransaction } from '../../../infra/database/prisma';
import {
  PatchOrderItemResponse,
  TPatchOrderItemBody,
  TPatchOrderItemResponse,
} from '../schemas/patch-order-item.schema';
import { loadOrderEntity } from './order-mapper';

export class PatchOrderItemService {
  async execute(
    orderId: number,
    itemId: number,
    data: TPatchOrderItemBody
  ): Promise<TPatchOrderItemResponse> {
    const result = await runInTransaction(async (transaction) => {
      const order = await transaction.order.findFirst({
        where: { id: orderId, is_deleted: false },
      });

      if (!order) {
        throw ApiError('not-found', 'Pedido não encontrado', undefined, 404);
      }

      const item = await transaction.orderItem.findFirst({
        where: { id: itemId, order_id: orderId, is_deleted: false },
      });

      if (!item) {
        throw ApiError('not-found', 'Item do pedido não encontrado', undefined, 404);
      }

      await transaction.orderItem.update({
        where: { id: itemId },
        data: {
          ...(data.quantity !== undefined ? { quantity: data.quantity } : {}),
          ...(data.unit_price !== undefined ? { unit_price: data.unit_price } : {}),
        },
      });

      const loaded = await loadOrderEntity(orderId, transaction);
      if (!loaded) {
        throw ApiError('not-found', 'Pedido não encontrado', undefined, 404);
      }

      return loaded;
    });

    return PatchOrderItemResponse.parse(result);
  }
}

export const patchOrderItemService = new PatchOrderItemService();
