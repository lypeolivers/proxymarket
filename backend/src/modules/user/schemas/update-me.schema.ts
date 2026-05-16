import { z } from 'zod';
import { ErrorResponse } from '../../../common/schemas/error-response.schema';
import { UserEntity } from '../entities/user.entity';

export const UpdateMeBody = UserEntity.pick({
  name: true,
  email: true,
  password: true,
}).partial();

export type TUpdateMeBody = z.infer<typeof UpdateMeBody>;

export const UpdateMeResponse = UserEntity.omit({
  password: true,
  refresh_token: true,
}).partial();

export type TUpdateMeResponse = z.infer<typeof UpdateMeResponse>;

export const UpdateMeSchema = {
  body: UpdateMeBody,
  response: {
    200: UpdateMeResponse,
    400: ErrorResponse,
    401: ErrorResponse,
    404: ErrorResponse,
  },
  description: 'Atualiza dados do usuário autenticado (nome, e-mail, senha)',
  tags: ['User'],
};
