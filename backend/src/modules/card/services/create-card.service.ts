import { Prisma } from '../../../../prisma/generated/prisma/client.js';
import { prisma } from '../../../infra/database/prisma';
import {
  CreateCardResponse,
  TCreateCardBody,
  TCreateCardResponse,
} from '../schemas/create-card.schema';

export class CreateCardService {
  async execute(data: TCreateCardBody): Promise<TCreateCardResponse> {
    const payload: Prisma.CardCreateInput = {
      tcg: data.tcg,
      card_type: data.card_type,
      status: data.status ?? 'active',
      colors:
        data.card_type === 'leader'
          ? { set: data.colors }
          : { set: [] },
      name: 'name' in data ? data.name : null,
      edition: 'edition' in data ? data.edition : null,
    };

    const card = await prisma.card.create({ data: payload });

    return CreateCardResponse.parse(card);
  }
}

export const createCardService = new CreateCardService();
