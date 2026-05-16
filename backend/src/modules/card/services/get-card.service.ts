import { ApiError } from '../../../common/errors/api-error';
import { prisma } from '../../../infra/database/prisma';
import { GetCardResponse, TGetCardResponse } from '../schemas/get-card.schema';

export class GetCardService {
  async execute(id: number): Promise<TGetCardResponse> {
    const card = await prisma.card.findFirst({
      where: { id, is_deleted: false },
    });

    if (!card) {
      throw ApiError('not-found', 'Carta não encontrada', undefined, 404);
    }

    return GetCardResponse.parse(card);
  }
}

export const getCardService = new GetCardService();
