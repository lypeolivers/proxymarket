import crypto from 'node:crypto';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { env } from '../../env';
import { jwtExpiresInToCookieMaxAgeSeconds } from './jwt-expires-to-cookie-max-age';

const IS_PROD = env.MODE === 'PROD' || env.MODE === 'HMG';

export const CSRF_COOKIE_NAME = 'csrf_token';
export const CSRF_HEADER_NAME = 'x-csrf-token';

/**
 * O cookie CSRF dura tanto quanto a sessão (alinhado ao refresh_token) para
 * que ambos expirem juntos.
 */
const CSRF_COOKIE_MAX_AGE_SEC = jwtExpiresInToCookieMaxAgeSeconds(env.AUTH_JWT_REFRESH_TOKEN_EXPIRES_IN);

/**
 * Double-submit cookie pattern: o cookie precisa ser legível pelo JS do
 * próprio domínio (httpOnly: false) para o frontend reenviar como header.
 */
const CSRF_COOKIE_OPTIONS = {
  httpOnly: false,
  secure: IS_PROD,
  sameSite: IS_PROD ? ('strict' as const) : ('lax' as const),
  path: '/',
};

export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function setCsrfCookie(reply: FastifyReply, token: string): void {
  reply.setCookie(CSRF_COOKIE_NAME, token, {
    ...CSRF_COOKIE_OPTIONS,
    maxAge: CSRF_COOKIE_MAX_AGE_SEC,
  });
}

export function clearCsrfCookie(reply: FastifyReply): void {
  reply.clearCookie(CSRF_COOKIE_NAME, CSRF_COOKIE_OPTIONS);
}

export function readCsrfCookie(request: FastifyRequest): string | undefined {
  return request.cookies?.[CSRF_COOKIE_NAME];
}

export function readCsrfHeader(request: FastifyRequest): string | undefined {
  const raw = request.headers[CSRF_HEADER_NAME];
  if (typeof raw === 'string') return raw;
  if (Array.isArray(raw)) return raw[0];
  return undefined;
}

export function csrfTokensMatch(a: string | undefined, b: string | undefined): boolean {
  if (!a || !b) return false;
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}
