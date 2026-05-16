import { ApiError } from '../../../common/errors/api-error';
import { prisma } from '../../../infra/database/prisma';
import { GetMeResponse, TGetMeResponse } from '../schemas/get-me.schema';

export class GetMeService {
  async execute(id: number): Promise<TGetMeResponse> {
    const user = await prisma.user.findFirst({
      where: { id, is_deleted: false },
    });

    if (!user) {
      throw ApiError('not-found', 'Usuário não encontrado', undefined, 404);
    }

    return GetMeResponse.parse(user);
  }
}

export const getMeService = new GetMeService();
