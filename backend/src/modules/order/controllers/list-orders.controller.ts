import { FastifyReply, FastifyRequest } from 'fastify';
import { TListOrdersQuery, TListOrdersResponse } from '../schemas/list-orders.schema';
import { listOrdersService } from '../services/list-orders.service';

export default async function handle(
  request: FastifyRequest<{ Querystring: TListOrdersQuery; Reply: TListOrdersResponse }>,
  reply: FastifyReply
) {
  const result = await listOrdersService.execute(request.query);
  reply.status(200).send(result);
}
