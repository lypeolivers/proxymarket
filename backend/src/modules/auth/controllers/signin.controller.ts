import { FastifyReply, FastifyRequest } from 'fastify';
import { setAuthCookies } from '../../../common/helpers/auth-cookies';
import { generateCsrfToken, setCsrfCookie } from '../../../common/helpers/csrf';
import { TSignInBody, TSignInResponse } from '../schemas/signin.schema';
import { signInService } from '../services/signin.service';

export default async function handle(
  request: FastifyRequest<{ Body: TSignInBody; Reply: TSignInResponse }>,
  reply: FastifyReply
) {
  const result = await signInService.execute(request.body);
  setAuthCookies(reply, result.accessToken, result.refreshToken);
  // Emite um novo token CSRF a cada login para o frontend reenviar via
  // header X-CSRF-Token nas requisições mutativas.
  setCsrfCookie(reply, generateCsrfToken());
  reply.status(200).send(result.response);
}
