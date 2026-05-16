import { FastifyReply, FastifyRequest } from 'fastify';
import { TOrderStatsResponse } from '../schemas/get-order-stats.schema';
import { getOrderStatsService } from '../services/get-order-stats.service';

export default async function handle(
  request: FastifyRequest<{ Reply: TOrderStatsResponse }>,
  reply: FastifyReply
) {
  const result = await getOrderStatsService.execute();
  reply.status(200).send(result);
}
