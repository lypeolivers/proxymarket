import { Prisma } from '../../../../prisma/generated/prisma/client.js';
import { ApiError } from '../../../common/errors/api-error';
import { prisma } from '../../../infra/database/prisma';
import {
  TUpdateCardBody,
  TUpdateCardResponse,
  UpdateCardResponse,
} from '../schemas/update-card.schema';

export class UpdateCardService {
  async execute(id: number, data: TUpdateCardBody): Promise<TUpdateCardResponse> {
    const existing = await prisma.card.findFirst({
      where: { id, is_deleted: false },
    });

    if (!existing) {
      throw ApiError('not-found', 'Carta não encontrada', undefined, 404);
    }

    const payload: Prisma.CardUpdateInput = {
      tcg: data.tcg,
      card_type: data.card_type,
      status: data.status ?? existing.status,
      colors:
        data.card_type === 'leader'
          ? { set: data.colors }
          : { set: [] },
      name: 'name' in data ? data.name : null,
      edition: 'edition' in data ? data.edition : null,
    };

    const card = await prisma.card.update({
      where: { id },
      data: payload,
    });

    return UpdateCardResponse.parse(card);
  }
}

export const updateCardService = new UpdateCardService();
