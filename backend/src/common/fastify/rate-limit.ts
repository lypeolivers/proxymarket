import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance, FastifyRequest } from 'fastify';

/**
 * Registra o plugin de rate limit em modo não-global.
 * Rotas que quiserem ser limitadas devem informar `config.rateLimit`
 * no momento do `app.post/get/...`.
 */
export async function registerRateLimit(app: FastifyInstance): Promise<void> {
  await app.register(rateLimit, {
    global: false,
    keyGenerator: (request: FastifyRequest) => request.ip,
    errorResponseBuilder: (_request, context) => ({
      code: 'too-many-requests',
      error: 'TooManyRequests',
      message: `Muitas tentativas. Tente novamente em ${Math.ceil(context.ttl / 1000)}s.`,
      statusCode: 429,
    }),
  });
}

/**
 * Chave de rate limit para `/auth/signin`: combina IP + username normalizado.
 * Evita brute force em múltiplos usuários a partir do mesmo IP e tentativas
 * vindas de diferentes fontes contra um mesmo username.
 */
export function signinRateLimitKey(request: FastifyRequest): string {
  const body = (request.body ?? {}) as { username?: unknown };
  const rawUsername = typeof body.username === 'string' ? body.username : '';
  const normalized = rawUsername.trim().toLowerCase().slice(0, 254);
  return `signin:${request.ip}:${normalized}`;
}
