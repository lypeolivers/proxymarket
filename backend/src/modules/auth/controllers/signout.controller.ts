import { FastifyReply, FastifyRequest } from 'fastify';
import {
  clearAuthCookies,
  getAccessTokenFromRequest,
  getRefreshTokenFromRequest,
} from '../../../common/helpers/auth-cookies';
import { clearCsrfCookie } from '../../../common/helpers/csrf';
import {
  getSubFromAccessTokenAllowExpired,
  getSubFromRefreshTokenAllowExpired,
} from '../../../common/helpers/jwt';
import { prisma } from '../../../infra/database/prisma';

/**
 * Logout resiliente: nunca falha para o cliente.
 *
 * Identifica o dono da sessão pelo access_token (ignorando expiração) ou,
 * em fallback, pelo refresh_token. Limpa o `user.refresh_token` apenas se o
 * valor armazenado bater com o cookie enviado — evita que um logout
 * atrasado derrube uma sessão mais recente em outro dispositivo.
 */
export default async function handle(request: FastifyRequest, reply: FastifyReply) {
  const accessToken = getAccessTokenFromRequest(request);
  const refreshToken = getRefreshTokenFromRequest(request);

  let userId: number | null = null;

  if (accessToken) {
    userId = await getSubFromAccessTokenAllowExpired(accessToken);
  }

  if (userId === null && refreshToken) {
    userId = await getSubFromRefreshTokenAllowExpired(refreshToken);
  }

  if (userId !== null) {
    try {
      if (refreshToken) {
        await prisma.user.updateMany({
          where: { id: userId, refresh_token: refreshToken },
          data: { refresh_token: null },
        });
      } else {
        await prisma.user.update({
          where: { id: userId },
          data: { refresh_token: null },
        });
      }
    } catch {
      // Erros de banco não devem impedir a limpeza dos cookies do cliente.
    }
  }

  clearAuthCookies(reply);
  clearCsrfCookie(reply);
  reply.status(204).send();
}
