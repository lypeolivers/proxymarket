import fastifyCookie from '@fastify/cookie';
import { FastifyInstance } from 'fastify';

export async function registerCookie(app: FastifyInstance): Promise<void> {
  await app.register(fastifyCookie);
}
