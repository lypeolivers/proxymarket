import { ApiError } from '../../../common/errors/api-error';
import { runInTransaction } from '../../../infra/database/prisma';
import {
  PatchProductionOrderItemArtResponse,
  type TPatchProductionOrderItemArtBody,
  type TPatchProductionOrderItemArtResponse,
} from '../schemas/patch-production-order-item-art.schema';

export class PatchProductionOrderItemArtService {
  async execute(
    shipmentId: number,
    itemId: number,
    data: TPatchProductionOrderItemArtBody
  ): Promise<TPatchProductionOrderItemArtResponse> {
    const result = await runInTransaction(async (transaction) => {
      const shipment = await transaction.productionShipment.findFirst({
        where: { id: shipmentId, is_deleted: false },
      });

      if (!shipment) {
        throw ApiError('not-found', 'Remessa não encontrada.', undefined, 404);
      }

      const item = await transaction.orderItem.findFirst({
        where: {
          id: itemId,
          production_shipment_id: shipmentId,
          is_deleted: false,
        },
      });

      if (!item) {
        throw ApiError('not-found', 'Item não encontrado nesta remessa.', undefined, 404);
      }

      if (item.art_status !== 'art_to_do' && item.art_status !== 'art_ready') {
        throw ApiError(
          'invalid-art-status',
          'Este status de arte só pode ser alterado quando a linha está em “Arte a fazer” ou “Arte pronta”.',
          undefined,
          400
        );
      }

      await transaction.orderItem.update({
        where: { id: itemId },
        data: { art_status: data.art_status },
      });

      return PatchProductionOrderItemArtResponse.parse({
        ok: true,
        art_status: data.art_status,
      });
    });

    return result;
  }
}

export const patchProductionOrderItemArtService = new PatchProductionOrderItemArtService();
