import { ApiError } from '../../../common/errors/api-error';
import { runInTransaction } from '../../../infra/database/prisma';
import {
  MoveProductionOrderItemResponse,
  type TMoveProductionOrderItemResponse,
} from '../schemas/move-production-order-item.schema';

export class MoveProductionOrderItemService {
  async execute(
    targetShipmentId: number,
    itemId: number
  ): Promise<TMoveProductionOrderItemResponse> {
    const result = await runInTransaction(async (transaction) => {
      const target = await transaction.productionShipment.findFirst({
        where: { id: targetShipmentId, is_deleted: false },
      });

      if (!target) {
        throw ApiError('not-found', 'Remessa de destino não encontrada.', undefined, 404);
      }

      const item = await transaction.orderItem.findFirst({
        where: { id: itemId, is_deleted: false },
      });

      if (!item) {
        throw ApiError('not-found', 'Item do pedido não encontrado.', undefined, 404);
      }

      if (item.production_shipment_id === targetShipmentId) {
        return MoveProductionOrderItemResponse.parse({ ok: true });
      }

      await transaction.orderItem.update({
        where: { id: itemId },
        data: { production_shipment_id: targetShipmentId },
      });

      return MoveProductionOrderItemResponse.parse({ ok: true });
    });

    return result;
  }
}

export const moveProductionOrderItemService = new MoveProductionOrderItemService();
