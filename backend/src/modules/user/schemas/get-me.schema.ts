import { ErrorResponse } from '../../../common/schemas/error-response.schema';
import { UserEntity } from '../entities/user.entity';
import { z } from 'zod';

export const GetMeResponse = UserEntity.omit({
  password: true,
  refresh_token: true,
}).partial();

export type TGetMeResponse = z.infer<typeof GetMeResponse>;

export const GetMeSchema = {
  response: {
    200: GetMeResponse,
    401: ErrorResponse,
    404: ErrorResponse,
  },
  description: 'Retorna os dados do usuário autenticado',
  tags: ['User'],
};
