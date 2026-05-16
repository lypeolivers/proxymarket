import fastify from 'fastify';
import { register as registerErrorHandler } from '../common/errors/error-handler';
import { registerCookie } from '../common/fastify/cookie';
import { registerCors } from '../common/fastify/cors';
import { registerCsrf } from '../common/fastify/csrf';
import { registerHelmet } from '../common/fastify/helmet';
import { registerRateLimit } from '../common/fastify/rate-limit';
import { registerSwagger } from '../common/fastify/swagger';
import { registerZodTypeProvider } from '../common/fastify/zod';

type BuildOptions = {
  /**
   * Quando true, registra o hook de proteção CSRF (igual à produção).
   * Default `false` para simplificar testes via `app.inject` em rotas mutativas.
   */
  enforceCsrf?: boolean;
};

/**
 * Cria uma instância do Fastify configurada como no `server.ts` para uso em
 * testes. Não registra rotas — cada arquivo de teste pode registrar manualmente
 * apenas as rotas que precisa exercitar.
 */
export async function buildTestApp(options: BuildOptions = {}) {
  const app = fastify({ logger: false });
  await registerCookie(app);
  await registerCors(app);
  await registerHelmet(app);
  await registerRateLimit(app);
  if (options.enforceCsrf) {
    await registerCsrf(app);
  }
  await registerSwagger(app);
  await registerZodTypeProvider(app);
  await registerErrorHandler(app);
  return app;
}
