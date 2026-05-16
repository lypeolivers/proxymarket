import { FastifyInstance } from 'fastify';
import { registerAutoLoadRoutes } from './autoload';
import { registerCookie } from './cookie';
import { registerCors } from './cors';
import { registerCsrf } from './csrf';
import { registerHelmet } from './helmet';
import { registerRateLimit } from './rate-limit';
import { registerSwagger } from './swagger';
import { registerZodTypeProvider } from './zod';

export async function registerFastifyPlugins(app: FastifyInstance): Promise<void> {
  await registerCookie(app);
  await registerCors(app);
  await registerHelmet(app);
  await registerRateLimit(app);
  await registerCsrf(app);
  await registerSwagger(app);
  await registerZodTypeProvider(app);
  await registerAutoLoadRoutes(app);
}
