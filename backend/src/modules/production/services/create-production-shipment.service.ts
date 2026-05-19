import { ApiError } from '../../../common/errors/api-error';
import { runInTransaction } from '../../../infra/database/prisma';
import type { ProductionShipmentStatus } from '../../../../prisma/generated/prisma/enums.js';
import {
  CreateProductionShipmentResponse,
  type TCreateProductionShipmentBody,
  type TCreateProductionShipmentResponse,
} from '../schemas/create-production-shipment.schema';

export class CreateProductionShipmentService {
  async execute(data: TCreateProductionShipmentBody): Promise<TCreateProductionShipmentResponse> {
    const status: ProductionShipmentStatus = data.status ?? 'awaiting_print';

    const result = await runInTransaction(async (transaction) => {
      if (status === 'awaiting_print') {
        const open = await transaction.productionShipment.findMany({
          where: { status: 'awaiting_print', is_deleted: false },
          select: { id: true },
        });

        if (open.length > 0) {
          throw ApiError(
            'production-shipment-conflict',
            'Já existe uma remessa em “Aguardando impressão”. Escolha “Em impressão” ou “Impresso” para criar uma remessa de arquivo, ou avance a remessa aberta primeiro.',
            undefined,
            409
          );
        }
      }

      const maxRow = await transaction.productionShipment.aggregate({
        _max: { display_number: true },
      });
      const nextDisplay = (maxRow._max.display_number ?? 0) + 1;

      const created = await transaction.productionShipment.create({
        data: {
          display_number: nextDisplay,
          status,
        },
        select: {
          id: true,
          display_number: true,
          status: true,
        },
      });

      return CreateProductionShipmentResponse.parse(created);
    });

    return result;
  }
}

export const createProductionShipmentService = new CreateProductionShipmentService();
