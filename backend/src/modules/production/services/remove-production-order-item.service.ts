import { ApiError } from '../../../common/errors/api-error';
import { runInTransaction } from '../../../infra/database/prisma';
import {
  RemoveProductionOrderItemResponse,
  type TRemoveProductionOrderItemResponse,
} from '../schemas/remove-production-order-item.schema';

export class RemoveProductionOrderItemService {
  async execute(
    shipmentId: number,
    itemId: number
  ): Promise<TRemoveProductionOrderItemResponse> {
    const result = await runInTransaction(async (transaction) => {
      const item = await transaction.orderItem.findFirst({
        where: { id: itemId, is_deleted: false },
      });

      if (!item) {
        throw ApiError('not-found', 'Item do pedido não encontrado.', undefined, 404);
      }

      if (item.production_shipment_id !== shipmentId) {
        throw ApiError(
          'not-found',
          'Item não pertence a esta remessa.',
          undefined,
          404
        );
      }

      await transaction.orderItem.update({
        where: { id: itemId },
        data: { production_shipment_id: null },
      });

      return RemoveProductionOrderItemResponse.parse({ ok: true });
    });

    return result;
  }
}

export const removeProductionOrderItemService = new RemoveProductionOrderItemService();
