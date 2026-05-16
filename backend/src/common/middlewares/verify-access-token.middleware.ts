import { FastifyRequest } from 'fastify';
import { ApiError } from '../errors/api-error';
import { getAccessTokenFromRequest } from '../helpers/auth-cookies';
import { isValidAccessToken } from '../helpers/jwt';

export async function verifyAccessToken<T extends FastifyRequest>(request: T) {
  const token = getAccessTokenFromRequest(request);

  if (token) {
    const accessTokenPayload = await isValidAccessToken(token);

    if (!accessTokenPayload.error) {
      request.userId = Number(accessTokenPayload.sub);
    } else if (accessTokenPayload.error === 'TokenExpiredError') {
      throw ApiError('token-expired', 'Expired token', undefined, 401);
    } else {
      throw ApiError('token-invalid', 'Invalid token', undefined, 401);
    }
  } else {
    throw ApiError('token-invalid', 'Invalid token', undefined, 401);
  }
}
