import { FastifyReply, FastifyRequest } from 'fastify';
import { TCreateOrderBody, TCreateOrderResponse } from '../schemas/create-order.schema';
import { createOrderService } from '../services/create-order.service';

export default async function handle(
  request: FastifyRequest<{ Body: TCreateOrderBody; Reply: TCreateOrderResponse }>,
  reply: FastifyReply
) {
  const result = await createOrderService.execute(request.body);
  reply.status(201).send(result);
}
