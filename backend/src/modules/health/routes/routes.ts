import { FastifyInstance } from 'fastify';
import { env } from '../../../env';
import handleHealth from '../controllers/health.controller';
import { HealthSchema } from '../schemas/health.schema';

export default async function (app: FastifyInstance) {
  const prefix = `${env.BASE_URL}/actuator/health`;

  app.get(`${prefix}`, { schema: HealthSchema, onRequest: [] }, handleHealth);
}
