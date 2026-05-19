import { ApiError } from '../../../common/errors/api-error';
import { runInTransaction } from '../../../infra/database/prisma';
import {
  PatchProductionShipmentResponse,
  type TPatchProductionShipmentBody,
  type TPatchProductionShipmentResponse,
} from '../schemas/patch-production-shipment.schema';
import { assertProductionShipmentStatusTransition } from './assert-production-shipment-transition';

export class PatchProductionShipmentService {
  async execute(
    id: number,
    data: TPatchProductionShipmentBody
  ): Promise<TPatchProductionShipmentResponse> {
    const result = await runInTransaction(async (transaction) => {
      const shipment = await transaction.productionShipment.findFirst({
        where: { id, is_deleted: false },
      });

      if (!shipment) {
        throw ApiError('not-found', 'Remessa não encontrada.', undefined, 404);
      }

      assertProductionShipmentStatusTransition(shipment.status, data.status);

      if (data.status === shipment.status) {
        return {
          id: shipment.id,
          display_number: shipment.display_number,
          status: shipment.status,
        };
      }

      await transaction.productionShipment.update({
        where: { id },
        data: { status: data.status },
      });

      if (data.status === 'printing') {
        await transaction.orderItem.updateMany({
          where: { production_shipment_id: id, is_deleted: false },
          data: { art_status: 'printing' },
        });
      }

      if (data.status === 'printed') {
        await transaction.orderItem.updateMany({
          where: { production_shipment_id: id, is_deleted: false },
          data: { art_status: 'printed' },
        });
      }

      return PatchProductionShipmentResponse.parse({
        id: shipment.id,
        display_number: shipment.display_number,
        status: data.status,
      });
    });

    return result;
  }
}

export const patchProductionShipmentService = new PatchProductionShipmentService();
