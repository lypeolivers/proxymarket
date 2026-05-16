import { FastifyReply, FastifyRequest } from 'fastify';
import { THealthResponse } from '../schemas/health.schema';
import { healthService } from '../services/health.service';

export default async function handle(
  _request: FastifyRequest<{ Reply: THealthResponse }>,
  reply: FastifyReply
) {
  const result = await healthService.execute();
  reply.status(200).send(result);
}
