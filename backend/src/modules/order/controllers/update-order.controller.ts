import { FastifyReply, FastifyRequest } from 'fastify';
import {
  TUpdateOrderBody,
  TUpdateOrderParams,
  TUpdateOrderResponse,
} from '../schemas/update-order.schema';
import { updateOrderService } from '../services/update-order.service';

export default async function handle(
  request: FastifyRequest<{
    Params: TUpdateOrderParams;
    Body: TUpdateOrderBody;
    Reply: TUpdateOrderResponse;
  }>,
  reply: FastifyReply
) {
  const result = await updateOrderService.execute(request.params.id, request.body);
  reply.status(200).send(result);
}
