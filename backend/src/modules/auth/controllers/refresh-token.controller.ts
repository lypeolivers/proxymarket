import { FastifyReply, FastifyRequest } from 'fastify';
import { getRefreshTokenFromRequest, setAuthCookies } from '../../../common/helpers/auth-cookies';
import { generateCsrfToken, setCsrfCookie } from '../../../common/helpers/csrf';
import { TRefreshTokenResponse } from '../schemas/refresh-token.schema';
import { refreshTokenService } from '../services/refresh-token.service';

export default async function handle(
  request: FastifyRequest<{ Reply: TRefreshTokenResponse }>,
  reply: FastifyReply
) {
  const refreshToken = getRefreshTokenFromRequest(request);

  const result = await refreshTokenService.execute(refreshToken);

  if (refreshToken) {
    // Rotaciona access + refresh + CSRF a cada uso.
    setAuthCookies(reply, result.access_token, result.new_refresh_token);
    setCsrfCookie(reply, generateCsrfToken());
  }

  reply.status(200).send({ access_token: result.access_token });
}
