import type { FastifyReply, FastifyRequest } from 'fastify';
import { env } from '../../env';
import { jwtExpiresInToCookieMaxAgeSeconds } from './jwt-expires-to-cookie-max-age';

const IS_PROD = env.MODE === 'PROD' || env.MODE === 'HMG';

const COOKIE_OPTIONS_BASE = {
  httpOnly: true,
  secure: IS_PROD,
  sameSite: IS_PROD ? ('strict' as const) : ('lax' as const),
  path: '/',
};

const ACCESS_COOKIE_MAX_AGE_SEC = jwtExpiresInToCookieMaxAgeSeconds(env.AUTH_JWT_ACCESS_TOKEN_EXPIRES_IN);
const REFRESH_COOKIE_MAX_AGE_SEC = jwtExpiresInToCookieMaxAgeSeconds(env.AUTH_JWT_REFRESH_TOKEN_EXPIRES_IN);

export function setAccessTokenCookie(reply: FastifyReply, accessToken: string): void {
  reply.setCookie('access_token', accessToken, {
    ...COOKIE_OPTIONS_BASE,
    maxAge: ACCESS_COOKIE_MAX_AGE_SEC,
  });
}

export function setAuthCookies(reply: FastifyReply, accessToken: string, refreshToken: string): void {
  setAccessTokenCookie(reply, accessToken);

  reply.setCookie('refresh_token', refreshToken, {
    ...COOKIE_OPTIONS_BASE,
    maxAge: REFRESH_COOKIE_MAX_AGE_SEC,
  });
}

export function clearAuthCookies(reply: FastifyReply): void {
  reply.clearCookie('access_token', { ...COOKIE_OPTIONS_BASE });
  reply.clearCookie('refresh_token', { ...COOKIE_OPTIONS_BASE });
}

export function getAccessTokenFromRequest(request: FastifyRequest): string | undefined {
  return request.cookies?.access_token || request.headers.authorization?.split(' ')[1];
}

export function getRefreshTokenFromRequest(request: FastifyRequest): string | undefined {
  return request.cookies?.refresh_token;
}
