import { ApiError } from '../../../common/errors/api-error';
import { prisma } from '../../../infra/database/prisma';
import {
  DeleteCardPrintModelResponse,
  type TDeleteCardPrintModelResponse,
} from '../schemas/delete-card-print-model.schema';

export class DeleteCardPrintModelService {
  async execute(id: number): Promise<TDeleteCardPrintModelResponse> {
    const existing = await prisma.cardPrintModel.findFirst({
      where: { id, is_deleted: false },
    });

    if (!existing) {
      throw ApiError('not-found', 'Modelo não encontrado.', undefined, 404);
    }

    await prisma.cardPrintModel.update({
      where: { id },
      data: { is_deleted: true },
    });

    return DeleteCardPrintModelResponse.parse({ id });
  }
}

export const deleteCardPrintModelService = new DeleteCardPrintModelService();
