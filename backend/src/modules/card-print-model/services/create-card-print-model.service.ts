import { ApiError } from '../../../common/errors/api-error';
import { prisma } from '../../../infra/database/prisma';
import {
  CreateCardPrintModelResponse,
  type TCreateCardPrintModelBody,
  type TCreateCardPrintModelResponse,
} from '../schemas/create-card-print-model.schema';

export class CreateCardPrintModelService {
  async execute(data: TCreateCardPrintModelBody): Promise<TCreateCardPrintModelResponse> {
    const card = await prisma.card.findFirst({
      where: { id: data.card_id, is_deleted: false },
    });

    if (!card) {
      throw ApiError('not-found', 'Carta não encontrada.', undefined, 404);
    }

    const created = await prisma.cardPrintModel.create({
      data: {
        card_id: data.card_id,
        name: data.name.trim(),
        file_name: data.file_name.trim(),
      },
    });

    return CreateCardPrintModelResponse.parse({
      id: created.id,
      card_id: created.card_id,
      name: created.name,
      file_name: created.file_name,
      created_at: created.created_at,
      updated_at: created.updated_at,
    });
  }
}

export const createCardPrintModelService = new CreateCardPrintModelService();
