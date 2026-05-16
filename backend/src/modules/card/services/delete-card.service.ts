import { ApiError } from '../../../common/errors/api-error';
import { prisma } from '../../../infra/database/prisma';
import {
  DeleteCardResponse,
  TDeleteCardResponse,
} from '../schemas/delete-card.schema';

export class DeleteCardService {
  async execute(id: number): Promise<TDeleteCardResponse> {
    const existing = await prisma.card.findFirst({
      where: { id, is_deleted: false },
    });

    if (!existing) {
      throw ApiError('not-found', 'Carta não encontrada', undefined, 404);
    }

    await prisma.card.update({
      where: { id },
      data: { is_deleted: true },
    });

    return DeleteCardResponse.parse({ id });
  }
}

export const deleteCardService = new DeleteCardService();
