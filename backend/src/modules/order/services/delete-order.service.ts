import { ApiError } from '../../../common/errors/api-error';
import { runInTransaction } from '../../../infra/database/prisma';
import {
  DeleteOrderResponse,
  TDeleteOrderResponse,
} from '../schemas/delete-order.schema';

export class DeleteOrderService {
  async execute(id: number): Promise<TDeleteOrderResponse> {
    await runInTransaction(async (transaction) => {
      const existing = await transaction.order.findFirst({
        where: { id, is_deleted: false },
      });

      if (!existing) {
        throw ApiError('not-found', 'Pedido não encontrado', undefined, 404);
      }

      await transaction.orderItem.updateMany({
        where: { order_id: id, is_deleted: false },
        data: { is_deleted: true },
      });

      await transaction.order.update({
        where: { id },
        data: { is_deleted: true },
      });
    });

    return DeleteOrderResponse.parse({ id });
  }
}

export const deleteOrderService = new DeleteOrderService();
