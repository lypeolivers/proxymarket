import cors from '@fastify/cors';
import { FastifyInstance } from 'fastify';
import { env } from '../../env';

export async function registerCors(app: FastifyInstance): Promise<void> {
  const allowedOrigins = env.CORS_ALLOWED_ORIGINS
    ? env.CORS_ALLOWED_ORIGINS.split(',')
        .map((o) => o.trim())
        .filter(Boolean)
    : [];

  await app.register(cors, {
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
    methods: 'GET,PUT,POST,PATCH,DELETE',
    credentials: true,
  });
}
