import { ApiError } from '../../../common/errors/api-error';
import { prisma } from '../../../infra/database/prisma';
import {
  UpdateCardPrintModelResponse,
  type TUpdateCardPrintModelBody,
  type TUpdateCardPrintModelResponse,
} from '../schemas/update-card-print-model.schema';

export class UpdateCardPrintModelService {
  async execute(
    id: number,
    data: TUpdateCardPrintModelBody
  ): Promise<TUpdateCardPrintModelResponse> {
    const existing = await prisma.cardPrintModel.findFirst({
      where: { id, is_deleted: false },
    });

    if (!existing) {
      throw ApiError('not-found', 'Modelo não encontrado.', undefined, 404);
    }

    const updated = await prisma.cardPrintModel.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name.trim() } : {}),
        ...(data.file_name !== undefined ? { file_name: data.file_name.trim() } : {}),
      },
    });

    return UpdateCardPrintModelResponse.parse({
      id: updated.id,
      card_id: updated.card_id,
      name: updated.name,
      file_name: updated.file_name,
      created_at: updated.created_at,
      updated_at: updated.updated_at,
    });
  }
}

export const updateCardPrintModelService = new UpdateCardPrintModelService();
