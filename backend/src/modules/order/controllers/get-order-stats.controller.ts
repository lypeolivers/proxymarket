import { FastifyReply, FastifyRequest } from 'fastify';
import {
  GetOrderStatsQuery,
  TGetOrderStatsQuery,
  TOrderStatsResponse,
} from '../schemas/get-order-stats.schema';
import { getOrderStatsService } from '../services/get-order-stats.service';

export default async function handle(
  request: FastifyRequest<{ Querystring: TGetOrderStatsQuery; Reply: TOrderStatsResponse }>,
  reply: FastifyReply
) {
  const query = GetOrderStatsQuery.parse(request.query);
  const result = await getOrderStatsService.execute(query);
  reply.status(200).send(result);
}
