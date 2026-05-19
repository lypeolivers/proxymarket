import { FastifyReply, FastifyRequest } from 'fastify';
import { TListStockQuery, TListStockResponse } from '../schemas/list-stock.schema';
import { listStockService } from '../services/list-stock.service';

export default async function handle(
  request: FastifyRequest<{ Querystring: TListStockQuery; Reply: TListStockResponse }>,
  reply: FastifyReply
) {
  const result = await listStockService.execute(request.query);
  reply.status(200).send(result);
}
