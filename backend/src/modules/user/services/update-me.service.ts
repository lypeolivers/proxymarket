import { hash } from 'bcryptjs';
import { Prisma } from '../../../../prisma/generated/prisma/client.js';
import { ApiError } from '../../../common/errors/api-error';
import { env } from '../../../env';
import { runInTransaction } from '../../../infra/database/prisma';
import { UpdateMeResponse, TUpdateMeBody, TUpdateMeResponse } from '../schemas/update-me.schema';

export class UpdateMeService {
  async execute(id: number, data: TUpdateMeBody): Promise<TUpdateMeResponse> {
    try {
      const result = await runInTransaction(async (transaction) => {
        const existing = await transaction.user.findFirst({
          where: { id, is_deleted: false },
        });
        if (!existing) {
          throw ApiError('not-found', 'Usuário não encontrado', undefined, 404);
        }

        const payload: Prisma.UserUpdateInput = {};

        if (data.name !== undefined) payload.name = data.name;

        if (data.email) {
          const email = data.email.trim().toLowerCase();
          const conflict = await transaction.user.count({
            where: { id: { not: id }, email },
          });
          if (conflict > 0) {
            throw ApiError(
              'email-already-exists',
              'Já existe um usuário cadastrado com este e-mail.',
              undefined,
              400
            );
          }
          payload.email = email;
        }

        if (data.password) {
          payload.password = await hash(data.password, env.PASSWORD_HASH_SALT_ROUNDS);
        }

        const user = await transaction.user.update({
          where: { id },
          data: payload,
        });

        return UpdateMeResponse.parse(user);
      }, id);

      return result;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw ApiError(
          'email-already-exists',
          'Já existe um usuário cadastrado com este e-mail.',
          undefined,
          400
        );
      }
      throw error;
    }
  }
}

export const updateMeService = new UpdateMeService();
