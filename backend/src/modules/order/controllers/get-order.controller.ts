import { FastifyReply, FastifyRequest } from 'fastify';
import { TGetOrderParams, TGetOrderResponse } from '../schemas/get-order.schema';
import { getOrderService } from '../services/get-order.service';

export default async function handle(
  request: FastifyRequest<{ Params: TGetOrderParams; Reply: TGetOrderResponse }>,
  reply: FastifyReply
) {
  const result = await getOrderService.execute(request.params.id);
  reply.status(200).send(result);
}
