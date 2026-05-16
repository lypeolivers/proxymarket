import { ApiError } from '../../../common/errors/api-error';
import { signAccessToken, signRefreshToken } from '../../../common/helpers/jwt';
import { prisma } from '../../../infra/database/prisma';
import { UserEntity } from '../../user/entities/user.entity';
import { TSignInBody, TSignInResponse } from '../schemas/signin.schema';
import { SignInLocalService } from './signin-local.service';

export type TSignInServiceResult = {
  response: TSignInResponse;
  accessToken: string;
  refreshToken: string;
};

export class SignInService {
  async execute(data: TSignInBody): Promise<TSignInServiceResult> {
    const user = await SignInLocalService.execute(data.username, data.password);

    if (!user) {
      throw ApiError(
        'unauthorized',
        'Credenciais inválidas. Verifique e-mail e senha e tente novamente.',
        undefined,
        401
      );
    }

    const accessToken = signAccessToken(user.id!);
    const refreshToken = signRefreshToken(user.id!);
    await prisma.user.update({ where: { id: user.id! }, data: { refresh_token: refreshToken } });

    const userData = UserEntity.parse(user);

    const response: TSignInResponse = {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      status: userData.status,
    };

    return { response, accessToken, refreshToken };
  }
}

export const signInService = new SignInService();
