import { FastifyReply, FastifyRequest } from 'fastify';
import { TDeleteOrderParams, TDeleteOrderResponse } from '../schemas/delete-order.schema';
import { deleteOrderService } from '../services/delete-order.service';

export default async function handle(
  request: FastifyRequest<{ Params: TDeleteOrderParams; Reply: TDeleteOrderResponse }>,
  reply: FastifyReply
) {
  const result = await deleteOrderService.execute(request.params.id);
  reply.status(200).send(result);
}
