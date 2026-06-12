import { ApiError } from '../../../common/errors/api-error';
import { runInTransaction } from '../../../infra/database/prisma';
import {
  PatchOrderResponse,
  TPatchOrderBody,
  TPatchOrderResponse,
} from '../schemas/patch-order.schema';
import { loadOrderEntity } from './order-mapper';
import { resolvePatchHeader } from './order-helpers';

export class PatchOrderService {
  async execute(id: number, data: TPatchOrderBody): Promise<TPatchOrderResponse> {
    const result = await runInTransaction(async (transaction) => {
      const existing = await transaction.order.findFirst({
        where: { id, is_deleted: false },
      });

      if (!existing) {
        throw ApiError('not-found', 'Pedido não encontrado', undefined, 404);
      }

      const header = resolvePatchHeader(
        {
          order_status: existing.order_status,
          delivery_method: existing.delivery_method,
        },
        {
          order_status: data.order_status,
          delivery_method: data.delivery_method,
        }
      );

      await transaction.order.update({
        where: { id },
        data: {
          order_status: header.order_status,
          delivery_method: header.delivery_method,
          ...(data.order_date !== undefined ? { order_date: data.order_date } : {}),
          ...(data.notes !== undefined ? { notes: data.notes?.trim() || null } : {}),
        },
      });

      const loaded = await loadOrderEntity(id, transaction);
      if (!loaded) {
        throw ApiError('not-found', 'Pedido não encontrado', undefined, 404);
      }

      return loaded;
    });

    return PatchOrderResponse.parse(result);
  }
}

export const patchOrderService = new PatchOrderService();
