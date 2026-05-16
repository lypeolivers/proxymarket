import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { csrfTokensMatch, readCsrfCookie, readCsrfHeader } from '../helpers/csrf';

const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

declare module 'fastify' {
  interface FastifyContextConfig {
    /**
     * Quando true, a rota é dispensada da verificação de CSRF.
     * Usar apenas em endpoints onde o cliente ainda não pode ter o cookie
     * (ex.: /auth/signin no primeiro login).
     */
    csrfExempt?: boolean;
  }
}

/**
 * Defesa em profundidade contra CSRF (double-submit cookie pattern).
 * Aplica-se apenas a métodos mutativos (POST/PUT/PATCH/DELETE) e pode ser
 * desabilitada por rota via `config.csrfExempt = true`.
 */
export async function registerCsrf(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    if (!UNSAFE_METHODS.has(request.method)) return;
    if (request.is404) return;
    if (request.routeOptions?.config?.csrfExempt === true) return;

    const cookieToken = readCsrfCookie(request);
    const headerToken = readCsrfHeader(request);

    if (!csrfTokensMatch(cookieToken, headerToken)) {
      return reply
        .status(403)
        .send({ message: 'CSRF token inválido ou ausente', code: 'csrf-invalid' });
    }
  });
}
