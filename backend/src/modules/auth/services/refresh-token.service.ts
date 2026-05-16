import { ApiError } from '../../../common/errors/api-error';
import { isValidRefreshToken, signAccessToken, signRefreshToken } from '../../../common/helpers/jwt';
import { prisma } from '../../../infra/database/prisma';

export type TRefreshResult = {
  access_token: string;
  new_refresh_token: string;
};

export class RefreshTokenService {
  async execute(refreshToken?: string): Promise<TRefreshResult> {
    if (refreshToken) {
      const refreshTokenPayload = await isValidRefreshToken(refreshToken);

      if (refreshTokenPayload?.sub) {
        const user = await prisma.user.findFirst({
          where: { id: refreshTokenPayload.sub, is_deleted: false },
        });

        if (user?.refresh_token === refreshToken) {
          const accessToken = signAccessToken(user.id);
          const newRefreshToken = signRefreshToken(user.id);
          await prisma.user.update({
            where: { id: user.id },
            data: { refresh_token: newRefreshToken },
          });

          return { access_token: accessToken, new_refresh_token: newRefreshToken };
        }
      }
    }

    throw ApiError('token-invalid', 'Invalid refresh token', undefined, 401);
  }
}

export const refreshTokenService = new RefreshTokenService();
