import { ApiError } from '../../../common/errors/api-error';
import { prisma } from '../../../infra/database/prisma';
import {
  GetCardPrintModelResponse,
  type TGetCardPrintModelResponse,
} from '../schemas/get-card-print-model.schema';

export class GetCardPrintModelService {
  async execute(id: number): Promise<TGetCardPrintModelResponse> {
    const row = await prisma.cardPrintModel.findFirst({
      where: { id, is_deleted: false },
    });

    if (!row) {
      throw ApiError('not-found', 'Modelo não encontrado.', undefined, 404);
    }

    return GetCardPrintModelResponse.parse({
      id: row.id,
      card_id: row.card_id,
      name: row.name,
      file_name: row.file_name,
      created_at: row.created_at,
      updated_at: row.updated_at,
    });
  }
}

export const getCardPrintModelService = new GetCardPrintModelService();
