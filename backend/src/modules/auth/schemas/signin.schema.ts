import { z } from 'zod';
import { ErrorResponse } from '../../../common/schemas/error-response.schema';
import { UserEntity } from '../../user/entities/user.entity';

export const SignInBody = z.object({
  username: z.string(),
  password: z.string(),
});

export type TSignInBody = z.infer<typeof SignInBody>;

/** Corpo JSON: apenas dados do usuário — tokens vêm só em cookies httpOnly. */
export const SignInResponse = UserEntity.pick({
  id: true,
  name: true,
  email: true,
  status: true,
}).partial();

export type TSignInResponse = z.infer<typeof SignInResponse>;

export const SignInSchema = {
  body: SignInBody,
  response: {
    200: SignInResponse,
    401: ErrorResponse,
  },
  description: 'Autentica um usuário',
  tags: ['Auth'],
};
